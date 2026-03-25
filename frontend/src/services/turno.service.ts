import api from "./api";
import { Turno } from "@/types";

export const turnoService = {

  async porFecha(fecha: string, sedeId?: number): Promise<Turno[]> {
    const params = new URLSearchParams();
    params.append("fecha", fecha);
    if (sedeId) params.append("sede_id", String(sedeId));
    const { data } = await api.get(`/turnos?${params.toString()}`);
    return data.data;
  },
  

  async porRango(inicio: string, fin: string, sedeId?: number): Promise<Turno[]> {
    const params = new URLSearchParams();
    params.append("inicio", inicio);
    params.append("fin", fin);
    if (sedeId) params.append("sede_id", String(sedeId));
    const { data } = await api.get(`/turnos/rango?${params.toString()}`);
    return data.data;
  },

  async crear(turno: Partial<Turno>): Promise<Turno> {
    const { data } = await api.post("/turnos", turno);
    return data.data;
  },

  async actualizarEstado(id: number, estado: string): Promise<void> {
    await api.patch(`/turnos/${id}/estado`, { estado });
  },

  async actualizar(id: number, turno: Partial<Turno>): Promise<Turno> {
    const { data } = await api.put(`/turnos/${id}`, turno);
    return data.data;
  },

  async eliminar(id: number): Promise<void> {
    await api.delete(`/turnos/${id}`);
  },
};