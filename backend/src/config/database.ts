import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// Railway genera variables con prefijo MYSQL o DATABASE_URL
// Soportamos ambos formatos
const pool = mysql.createPool({
  host:     process.env.MYSQLHOST     || process.env.DB_HOST     || "localhost",
  port:     Number(process.env.MYSQLPORT    || process.env.DB_PORT    || 3306),
  user:     process.env.MYSQLUSER     || process.env.DB_USER     || "root",
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",
  database: process.env.MYSQLDATABASE || process.env.DB_NAME     || "nutri_app",
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           "Z",
  charset:            "utf8mb4",
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : undefined,
});

export async function testConnection(): Promise<void> {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL conectado correctamente");
    conn.release();
  } catch (error) {
    console.error("❌ Error conectando a MySQL:", error);
    process.exit(1);
  }
}

export default pool;