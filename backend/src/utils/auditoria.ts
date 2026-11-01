import pool from "../config/database";
import { AuthRequest } from "../types";

export type Accion = "crear" | "editar" | "borrar" | "baja" | "reactivar";

interface Evento {
  entidad: string;
  entidadId?: number | null;
  pacienteId?: number | null;
  accion: Accion;
  resumen?: string;
  cambios?: Record<string, unknown>;
}

const PROHIBIDOS = /pass|token|secret|hash/i;

/**
 * Registra un evento en la traza. Nunca hace fallar la operación principal:
 * si no se puede auditar, se deja constancia en el log y se sigue.
 */
export async function auditar(req: AuthRequest, ev: Evento): Promise<void> {
  try {
    const cambios = ev.cambios
      ? Object.fromEntries(Object.entries(ev.cambios).filter(([k, v]) => v !== undefined && !PROHIBIDOS.test(k)))
      : null;
    await pool.query(
      `INSERT INTO auditoria (usuario_id, usuario, paciente_id, entidad, entidad_id, accion, resumen, cambios)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.usuario?.id ?? null, req.usuario?.nombre ?? null, ev.pacienteId ?? null,
        ev.entidad, ev.entidadId ?? null, ev.accion, ev.resumen?.slice(0, 300) ?? null,
        cambios ? JSON.stringify(cambios) : null,
      ]
    );
  } catch (e) {
    console.error("⚠ No se pudo registrar la auditoría:", e instanceof Error ? e.message : e);
  }
}
