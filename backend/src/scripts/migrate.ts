/**
 * Runner de migraciones versionadas.
 *
 *   npm run migrate              aplica las migraciones pendientes (solo en localhost)
 *   npm run migrate -- --dry-run muestra qué se aplicaría, sin tocar nada
 *   npm run migrate -- --confirmar-remoto   permite correr contra una base que NO es localhost
 *
 * Cada archivo de db/migrations (NNNN_nombre.sql) se aplica una sola vez y queda
 * registrado en schema_migrations con su checksum. Si un archivo ya aplicado se
 * modifica, el runner se detiene: las migraciones aplicadas no se editan, se agrega
 * una nueva.
 *
 * MySQL 8 no tiene "ADD COLUMN IF NOT EXISTS", así que antes de migrar se crean
 * procedimientos auxiliares para que las migraciones sean idempotentes:
 *   CALL nm_add_column('tabla', 'columna', 'DECIMAL(5,1) NULL');
 *   CALL nm_add_index('tabla', 'idx_nombre', '(col1, col2)');
 */
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import crypto from "crypto";
import mysql from "mysql2/promise";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../db/migrations");
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const REMOTO_OK = args.has("--confirmar-remoto");

const config = {
  host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
  port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
  user: process.env.MYSQLUSER || process.env.DB_USER || "root",
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || "nutri_app",
};

const HELPERS = [
  "DROP PROCEDURE IF EXISTS nm_add_column",
  `CREATE PROCEDURE nm_add_column(IN p_tabla VARCHAR(64), IN p_columna VARCHAR(64), IN p_definicion TEXT)
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema = DATABASE() AND table_name = p_tabla AND column_name = p_columna) THEN
       SET @nm_sql = CONCAT('ALTER TABLE \`', p_tabla, '\` ADD COLUMN \`', p_columna, '\` ', p_definicion);
       PREPARE nm_stmt FROM @nm_sql; EXECUTE nm_stmt; DEALLOCATE PREPARE nm_stmt;
     END IF;
   END`,
  "DROP PROCEDURE IF EXISTS nm_add_index",
  `CREATE PROCEDURE nm_add_index(IN p_tabla VARCHAR(64), IN p_indice VARCHAR(64), IN p_columnas TEXT)
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM information_schema.statistics
                    WHERE table_schema = DATABASE() AND table_name = p_tabla AND index_name = p_indice) THEN
       SET @nm_sql = CONCAT('CREATE INDEX \`', p_indice, '\` ON \`', p_tabla, '\` ', p_columnas);
       PREPARE nm_stmt FROM @nm_sql; EXECUTE nm_stmt; DEALLOCATE PREPARE nm_stmt;
     END IF;
   END`,
];

const esLocal = (host: string) => ["localhost", "127.0.0.1", "::1"].includes(host);
const sha = (s: string) => crypto.createHash("sha256").update(s.replace(/\r\n/g, "\n")).digest("hex");

async function main() {
  console.log(`Base: ${config.database} @ ${esLocal(config.host) ? config.host : "(remota)"}${DRY_RUN ? "  [dry-run]" : ""}`);

  if (!esLocal(config.host) && !REMOTO_OK && !DRY_RUN) {
    console.error("✋ La base no es localhost. Para migrarla hay que pasar --confirmar-remoto (y tener un backup).");
    process.exit(1);
  }

  const archivos = fs.readdirSync(MIGRATIONS_DIR).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
  const conn = await mysql.createConnection({ ...config, multipleStatements: true, charset: "utf8mb4" });

  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version    VARCHAR(10)  NOT NULL PRIMARY KEY,
      nombre     VARCHAR(200) NOT NULL,
      checksum   CHAR(64)     NOT NULL,
      aplicada_en DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    const [filas] = await conn.query("SELECT version, checksum FROM schema_migrations");
    const aplicadas = new Map((filas as { version: string; checksum: string }[]).map((r) => [r.version, r.checksum]));

    // Un archivo ya aplicado no puede cambiar
    for (const f of archivos) {
      const version = f.slice(0, 4);
      const previo = aplicadas.get(version);
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

    for (const sql of HELPERS) await conn.query(sql);

    for (const f of pendientes) {
      const contenido = fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8");
      process.stdout.write(`→ ${f} ... `);
      // Ojo: en MySQL los DDL hacen commit implícito; por eso cada migración debe ser idempotente.
      await conn.query(contenido);
      await conn.query("INSERT INTO schema_migrations (version, nombre, checksum) VALUES (?, ?, ?)", [f.slice(0, 4), f, sha(contenido)]);
      console.log("ok");
    }
    console.log("✅ Migraciones aplicadas.");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
