import pool from "../config/database";
import { RowDataPacket } from "mysql2";

export interface ConfiguracionRow extends RowDataPacket {
  id: number;
  usuario_id: number;
  foto_perfil?: string;
  logo_url?: string;
  nombre_app: string;
  color_primario: string;
  tema?: string;
  consultorio_nombre?: string;
  consultorio_direccion?: string;
  consultorio_telefono?: string;
  consultorio_email?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  creado_en: string;
  actualizado_en: string;
}

export const ConfiguracionModel = {

  async findByUsuario(usuarioId: number): Promise<ConfiguracionRow | null> {
    const [rows] = await pool.query<ConfiguracionRow[]>(
      "SELECT * FROM configuracion WHERE usuario_id = ? LIMIT 1",
      [usuarioId]
    );
    return rows[0] ?? null;
  },

  async upsert(usuarioId: number, data: Partial<ConfiguracionRow>): Promise<void> {
    const existing = await this.findByUsuario(usuarioId);
    if (existing) {
      await pool.query(
        `UPDATE configuracion SET
          foto_perfil=?, logo_url=?, nombre_app=?, color_primario=?, tema=?,
          consultorio_nombre=?, consultorio_direccion=?, consultorio_telefono=?,
          consultorio_email=?, instagram=?, facebook=?, whatsapp=?
         WHERE usuario_id=?`,
        [
          data.foto_perfil ?? null,
          data.logo_url ?? null,
          data.nombre_app ?? "NutriApp",
          data.color_primario ?? "#ff2484",
          data.tema ?? "rosa",
          data.consultorio_nombre ?? null,
          data.consultorio_direccion ?? null,
          data.consultorio_telefono ?? null,
          data.consultorio_email ?? null,
          data.instagram ?? null,
          data.facebook ?? null,
          data.whatsapp ?? null,
          usuarioId,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO configuracion (
          usuario_id, foto_perfil, logo_url, nombre_app, color_primario, tema,
          consultorio_nombre, consultorio_direccion, consultorio_telefono,
          consultorio_email, instagram, facebook, whatsapp
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          usuarioId,
          data.foto_perfil ?? null,
          data.logo_url ?? null,
          data.nombre_app ?? "NutriApp",
          data.color_primario ?? "#ff2484",
          data.tema ?? "rosa",
          data.consultorio_nombre ?? null,
          data.consultorio_direccion ?? null,
          data.consultorio_telefono ?? null,
          data.consultorio_email ?? null,
          data.instagram ?? null,
          data.facebook ?? null,
          data.whatsapp ?? null,
        ]
      );
    }
  },
};