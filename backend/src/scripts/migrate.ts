/**
 * Runner de migraciones versionadas (PostgreSQL).
 *
 *   npm run migrate                          aplica las pendientes (solo en localhost)
 *   npm run migrate -- --dry-run             muestra qué se aplicaría, sin tocar nada
 *   npm run migrate -- --confirmar-remoto    permite correr contra una base que NO es localhost
 *
 * Cada archivo de db/migrations (NNNN_nombre.sql) se aplica una sola vez, dentro de
 * una transacción, y queda registrado en schema_migrations con su checksum. Si falla,
 * se revierte entero. Si un archivo ya aplicado cambia, el runner se detiene: las
 * migraciones aplicadas no se editan, se agrega una nueva.
 */
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Client } from "pg";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../db/migrations");
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const REMOTO_OK = args.has("--confirmar-remoto");

const url = process.env.DATABASE_URL;
const host = url ? new URL(url).hostname : process.env.PGHOST || process.env.DB_HOST || "localhost";
const esLocal = ["localhost", "127.0.0.1", "::1"].includes(host);
const sha = (s: string) => crypto.createHash("sha256").update(s.replace(/\r\n/g, "\n")).digest("hex");

async function main() {
  const client = new Client(
    url
      ? { connectionString: url, ssl: esLocal ? undefined : { rejectUnauthorized: false } }
      : {
          host,
          port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
          user: process.env.PGUSER || process.env.DB_USER,
          password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
          database: process.env.PGDATABASE || process.env.DB_NAME || "nutri_app",
        }
  );

  if (!esLocal && !REMOTO_OK && !DRY_RUN) {
    console.error("✋ La base no es localhost. Para migrarla hay que pasar --confirmar-remoto (y tener un backup).");
    process.exit(1);
  }

  await client.connect();
  const { rows: [{ db }] } = await client.query("SELECT current_database() AS db");
  console.log(`Base: ${db} @ ${esLocal ? host : "(remota)"}${DRY_RUN ? "  [dry-run]" : ""}`);

  try {
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version     varchar(10)  PRIMARY KEY,
      nombre      varchar(200) NOT NULL,
      checksum    char(64)     NOT NULL,
      aplicada_en timestamptz  NOT NULL DEFAULT now()
    )`);

    const archivos = fs.readdirSync(MIGRATIONS_DIR).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
    const { rows } = await client.query<{ version: string; checksum: string }>("SELECT version, checksum FROM schema_migrations");
    const aplicadas = new Map(rows.map((r) => [r.version, r.checksum]));

    for (const f of archivos) {
      const previo = aplicadas.get(f.slice(0, 4));
      if (previo && previo !== sha(fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8"))) {
        throw new Error(`La migración ${f} ya fue aplicada y su contenido cambió. Creá una migración nueva en lugar de editarla.`);
      }
    }

    const pendientes = archivos.filter((f) => !aplicadas.has(f.slice(0, 4)));
    if (!pendientes.length) {
      console.log("✅ No hay migraciones pendientes.");
      return;
    }
    console.log(`Pendientes (${pendientes.length}):`);
    pendientes.forEach((f) => console.log(`  · ${f}`));
    if (DRY_RUN) return;

    for (const f of pendientes) {
      const contenido = fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8");
      process.stdout.write(`→ ${f} ... `);
      try {
        await client.query("BEGIN");
        await client.query(contenido);
        await client.query("INSERT INTO schema_migrations (version, nombre, checksum) VALUES ($1, $2, $3)", [f.slice(0, 4), f, sha(contenido)]);
        await client.query("COMMIT");
        console.log("ok");
      } catch (e) {
        await client.query("ROLLBACK");
        console.log("revertida");
        throw e;
      }
    }
    console.log("✅ Migraciones aplicadas.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
