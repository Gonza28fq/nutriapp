/**
 * Acceso a PostgreSQL.
 *
 * Expone `pool.query(sql, params)` con la misma forma que usaba mysql2, para que
 * los modelos cambien lo mínimo:
 *   - los placeholders `?` se traducen a `$1, $2, …` (respetando literales entre comillas)
 *   - SELECT  → devuelve [filas]
 *   - INSERT  → devuelve [{ insertId, affectedRows }] (agrega `RETURNING id` si falta)
 *   - UPDATE/DELETE → devuelve [{ affectedRows }]
 *
 * Tipos: DATE vuelve como 'YYYY-MM-DD' (string), COUNT/BIGINT como number y
 * NUMERIC como string (igual que mysql2 por defecto).
 */
import { Pool, types, PoolClient, QueryResult } from "pg";
import dotenv from "dotenv";
dotenv.config();

types.setTypeParser(20, (v) => parseInt(v, 10));   // int8 (COUNT, SUM de enteros)
types.setTypeParser(1082, (v) => v);              // date → 'YYYY-MM-DD'

function connectionConfig() {
  const url = process.env.DATABASE_URL;
  const ssl = process.env.PGSSL === "false" || !url || /localhost|127\.0\.0\.1/.test(url)
    ? undefined
    : { rejectUnauthorized: false };
  if (url) return { connectionString: url, ssl };
  return {
    host: process.env.PGHOST || process.env.DB_HOST || "localhost",
    port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
    user: process.env.PGUSER || process.env.DB_USER,
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
    database: process.env.PGDATABASE || process.env.DB_NAME || "nutri_app",
  };
}

const pg = new Pool({ ...connectionConfig(), max: 10, idleTimeoutMillis: 30_000 });
pg.on("error", (err) => console.error("❌ Error inesperado en el pool de Postgres:", err.message));

/** Reemplaza `?` por `$n`, ignorando los que están dentro de '…' o "…". */
export function toPgPlaceholders(sql: string): string {
  let n = 0;
  let out = "";
  let quote: string | null = null;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (quote) {
      out += c;
      if (c === quote) {
        if (sql[i + 1] === quote) out += sql[++i]; // comilla escapada ('' o "")
        else quote = null;
      }
      continue;
    }
    if (c === "'" || c === '"') { quote = c; out += c; continue; }
    out += c === "?" ? `$${++n}` : c;
  }
  return out;
}

export interface ResultHeader { insertId: number; affectedRows: number }

const verbo = (sql: string) => sql.trimStart().slice(0, 6).toUpperCase();

async function ejecutar<T>(cliente: Pool | PoolClient, sql: string, params: unknown[] = []): Promise<[T]> {
  let texto = toPgPlaceholders(sql);
  const v = verbo(texto);
  if (v === "INSERT" && !/\bRETURNING\b/i.test(texto)) texto = `${texto.trimEnd().replace(/;$/, "")} RETURNING id`;
  const res: QueryResult = await cliente.query(texto, params as unknown[]);
  if (v === "INSERT") return [{ insertId: res.rows[0]?.id ?? 0, affectedRows: res.rowCount ?? 0 } as T];
  if (v === "UPDATE" || v === "DELETE") return [{ insertId: 0, affectedRows: res.rowCount ?? 0 } as T];
  return [res.rows as T];
}

const pool = {
  query<T = any>(sql: string, params?: unknown[]): Promise<[T]> {
    return ejecutar<T>(pg, sql, params);
  },
  /** Ejecuta `fn` dentro de una transacción (BEGIN/COMMIT, ROLLBACK si falla). */
  async transaction<R>(fn: (q: <T = any>(sql: string, params?: unknown[]) => Promise<[T]>) => Promise<R>): Promise<R> {
    const cliente = await pg.connect();
    try {
      await cliente.query("BEGIN");
      const r = await fn((sql, params) => ejecutar(cliente, sql, params));
      await cliente.query("COMMIT");
      return r;
    } catch (e) {
      await cliente.query("ROLLBACK");
      throw e;
    } finally {
      cliente.release();
    }
  },
  end: () => pg.end(),
  raw: pg,
};

export async function testConnection(): Promise<void> {
  try {
    const { rows } = await pg.query("SELECT current_database() AS db, version() AS v");
    console.log(`✅ PostgreSQL conectado (${rows[0].db})`);
  } catch (error) {
    console.error("❌ Error conectando a PostgreSQL:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

export default pool;
