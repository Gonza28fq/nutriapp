/**
 * Copia todos los datos de la base MySQL vieja a la base PostgreSQL nueva.
 *
 *   MYSQL_URL=mysql://usuario:clave@host:3306/base npm run copiar-datos [-- --confirmar-remoto]
 *
 * Requisitos: el destino ya tiene el esquema (`npm run migrate`) y está VACÍO.
 * - Lee el origen en modo solo lectura (nunca escribe en MySQL).
 * - Copia en el orden de las claves foráneas conservando los mismos `id`.
 * - Convierte tinyint(1) → boolean y respeta fechas sin corrimientos de zona horaria.
 * - Todo corre en UNA transacción: si algo falla, el destino queda vacío.
 * - Al final compara la cantidad de filas por tabla y ajusta las secuencias de IDs.
 */
import dotenv from "dotenv";
dotenv.config();

import mysql from "mysql2/promise";
import { Client } from "pg";

// Orden de copia: primero las tablas referenciadas.
const TABLAS = [
  "usuarios", "configuracion", "sedes", "pacientes", "turnos", "consultas",
  "mediciones", "laboratorios", "historia_clinica", "anamnesis_alimentaria",
  "grupos_alimentos", "consumo_alimentos", "alimentos_paciente", "adjuntos",
  "recetas", "plan_plantillas", "planes", "plan_comidas",
  "blog_categorias", "blog_posts", "blog_post_recetas",
  "sitio_secciones", "sitio_servicios", "sitio_stats", "sitio_testimonios",
];

const REMOTO_OK = process.argv.includes("--confirmar-remoto");
const esLocal = (h: string) => ["localhost", "127.0.0.1", "::1"].includes(h);

async function main() {
  if (!process.env.MYSQL_URL) throw new Error("Falta MYSQL_URL (origen MySQL).");
  const origenUrl = new URL(process.env.MYSQL_URL);

  const destinoUrl = process.env.DATABASE_URL;
  const destinoHost = destinoUrl ? new URL(destinoUrl).hostname : process.env.PGHOST || process.env.DB_HOST || "localhost";
  if (!esLocal(destinoHost) && !REMOTO_OK) {
    throw new Error("El destino no es localhost. Para escribir en una base remota pasá --confirmar-remoto (y tené un backup).");
  }

  const origen = await mysql.createConnection({
    host: origenUrl.hostname,
    port: Number(origenUrl.port || 3306),
    user: decodeURIComponent(origenUrl.username),
    password: decodeURIComponent(origenUrl.password),
    database: origenUrl.pathname.slice(1),
    timezone: "Z",                 // DATETIME se guardaba en UTC
    dateStrings: ["DATE"],         // DATE tal cual ('YYYY-MM-DD'), sin zona horaria
    charset: "utf8mb4",
    ssl: esLocal(origenUrl.hostname) ? undefined : { rejectUnauthorized: false },
  });
  await origen.query("SET SESSION TRANSACTION READ ONLY");

  const destino = new Client(
    destinoUrl
      ? { connectionString: destinoUrl, ssl: esLocal(destinoHost) ? undefined : { rejectUnauthorized: false } }
      : {
          host: destinoHost,
          port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
          user: process.env.PGUSER || process.env.DB_USER,
          password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
          database: process.env.PGDATABASE || process.env.DB_NAME || "nutri_app",
        }
  );
  await destino.connect();

  console.log(`Origen : MySQL ${origenUrl.pathname.slice(1)} @ ${esLocal(origenUrl.hostname) ? origenUrl.hostname : "(remoto)"} [solo lectura]`);
  console.log(`Destino: PostgreSQL @ ${esLocal(destinoHost) ? destinoHost : "(remoto)"}\n`);

  const resumen: { tabla: string; origen: number; destino: number }[] = [];

  try {
    // El destino tiene que estar vacío
    for (const t of TABLAS) {
      const { rows } = await destino.query(`SELECT count(*)::int AS n FROM ${t}`);
      if (rows[0].n > 0) throw new Error(`La tabla destino "${t}" ya tiene ${rows[0].n} filas. El destino tiene que estar vacío.`);
    }

    await destino.query("BEGIN");

    for (const t of TABLAS) {
      const [existe] = await origen.query<mysql.RowDataPacket[]>(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?", [t]
      );
      if (!existe.length) {
        console.log(`  ${t.padEnd(24)} (no existe en el origen, se omite)`);
        resumen.push({ tabla: t, origen: 0, destino: 0 });
        continue;
      }

      const { rows: colsDestino } = await destino.query<{ column_name: string; data_type: string }>(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1", [t]
      );
      const tipos = new Map(colsDestino.map((c) => [c.column_name, c.data_type]));

      const [filas] = await origen.query<mysql.RowDataPacket[]>(`SELECT * FROM \`${t}\` ORDER BY id`);
      if (filas.length) {
        const columnas = Object.keys(filas[0]).filter((c) => tipos.has(c));
        const omitidas = Object.keys(filas[0]).filter((c) => !tipos.has(c));
        if (omitidas.length) console.log(`  ⚠ ${t}: columnas del origen sin lugar en el destino: ${omitidas.join(", ")}`);

        const convertir = (col: string, v: unknown) => {
          if (v === null || v === undefined) return null;
          if (tipos.get(col) === "boolean") return Number(v) !== 0;
          return v;
        };

        // Inserción por lotes de 200 filas
        for (let i = 0; i < filas.length; i += 200) {
          const lote = filas.slice(i, i + 200);
          const valores: unknown[] = [];
          const marcas = lote.map((fila) => {
            const ph = columnas.map((c) => { valores.push(convertir(c, fila[c])); return `$${valores.length}`; });
            return `(${ph.join(", ")})`;
          });
          await destino.query(
            `INSERT INTO ${t} (${columnas.map((c) => `"${c}"`).join(", ")}) VALUES ${marcas.join(", ")}`,
            valores
          );
        }
        // Las IDs nuevas tienen que seguir después de las copiadas
        await destino.query(`SELECT setval(pg_get_serial_sequence('${t}', 'id'), (SELECT max(id) FROM ${t}))`);
      }

      const { rows: [{ n }] } = await destino.query(`SELECT count(*)::int AS n FROM ${t}`);
      resumen.push({ tabla: t, origen: filas.length, destino: n });
      console.log(`  ${t.padEnd(24)} ${String(filas.length).padStart(6)} → ${String(n).padStart(6)} ${filas.length === n ? "✓" : "✗"}`);
    }

    const diferencias = resumen.filter((r) => r.origen !== r.destino);
    if (diferencias.length) throw new Error(`No coinciden las filas en: ${diferencias.map((d) => d.tabla).join(", ")}`);

    await destino.query("COMMIT");
    const total = resumen.reduce((s, r) => s + r.destino, 0);
    console.log(`\n✅ Copia completa: ${total} filas en ${resumen.length} tablas, todas coinciden con el origen.`);
  } catch (e) {
    await destino.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await origen.end();
    await destino.end();
  }
}

main().catch((e) => {
  console.error("\n❌", e instanceof Error ? e.message : e);
  console.error("   No se escribió nada en el destino (transacción revertida).");
  process.exit(1);
});
