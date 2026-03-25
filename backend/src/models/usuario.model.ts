import pool from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface UsuarioRow extends RowDataPacket {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  rol: "admin" | "nutricionista";
  activo: boolean;
  creado_en: string;
}

export const UsuarioModel = {

  async findByEmail(email: string): Promise<UsuarioRow | null> {
    const [rows] = await pool.query<UsuarioRow[]>(
      "SELECT * FROM usuarios WHERE email = ? AND activo = TRUE LIMIT 1",
      [email]
    );
    return rows[0] ?? null;
  },

  async findById(id: number): Promise<UsuarioRow | null> {
  const [rows] = await pool.query<UsuarioRow[]>(
    "SELECT id, nombre, email, password_hash, rol, activo, creado_en FROM usuarios WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ?? null;
  },

  async create(nombre: string, email: string, passwordHash: string, rol: "admin" | "nutricionista" = "nutricionista"): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)",
      [nombre, email, passwordHash, rol]
    );
    return result.insertId;
  },

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await pool.query(
      "UPDATE usuarios SET password_hash = ? WHERE id = ?",
      [passwordHash, id]
    );
  },
};