import api from "./api";
import { Paciente } from "@/types";

export interface PacientesResponse {
  items: Paciente[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export const pacienteService = {

  async listar(busqueda?: string, pagina = 1, limite = 20, soloActivos = true): Promise<PacientesResponse> {
    const params = new URLSearchParams();
    if (busqueda) params.append("busqueda", busqueda);
    params.append("pagina", String(pagina));
    params.append("limite", String(limite));
    if (!soloActivos) params.append("activo", "false");

    const { data } = await api.get(`/pacientes?${params.toString()}`);
    return data.data;
  },

  async obtener(id: number) {
    const { data } = await api.get(`/pacientes/${id}`);
    return data.data;
  },

  async crear(paciente: Partial<Paciente>) {
    const { data } = await api.post("/pacientes", paciente);
    return data.data;
  },

  async actualizar(id: number, paciente: Partial<Paciente>) {
    const { data } = await api.put(`/pacientes/${id}`, paciente);
    return data.data;
  },

  async desactivar(id: number) {
    const { data } = await api.delete(`/pacientes/${id}`);
    return data;
  },

  async reactivar(id: number) {
    const { data } = await api.patch(`/pacientes/${id}/reactivar`);
    return data;
  },

  async actualizarHistoriaClinica(id: number, historia: Record<string, unknown>) {
    const { data } = await api.put(`/pacientes/${id}/historia-clinica`, historia);
    return data.data;
  },

  async actualizarAnamnesis(id: number, anamnesis: Record<string, unknown>) {
    const { data } = await api.put(`/pacientes/${id}/anamnesis`, anamnesis);
    return data.data;
  },
};