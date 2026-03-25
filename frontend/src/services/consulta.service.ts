import api from "./api";
import { Consulta } from "@/types";

export const consultaService = {

  async listar(limite = 50): Promise<Consulta[]> {
    const { data } = await api.get(`/consultas?limite=${limite}`);
    return data.data;
  },

  async porPaciente(pacienteId: number) {
    const { data } = await api.get(`/consultas/paciente/${pacienteId}`);
    return data.data as { consultas: Consulta[]; mediciones: unknown[] };
  },

  async obtener(id: number): Promise<Consulta> {
    const { data } = await api.get(`/consultas/${id}`);
    return data.data;
  },

  async crear(consulta: Partial<Consulta> & { medicion?: Record<string, unknown> }) {
    const { data } = await api.post("/consultas", consulta);
    return data.data;
  },

  async actualizar(id: number, consulta: Partial<Consulta>) {
    const { data } = await api.put(`/consultas/${id}`, consulta);
    return data.data;
  },

  async eliminar(id: number) {
    await api.delete(`/consultas/${id}`);
  },
};