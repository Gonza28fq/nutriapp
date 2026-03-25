import api from "./api";
import { MomentoComida } from "@/types";

export interface PlanComidaDetalle {
  id: number;
  plan_id: number;
  dia: number;
  momento: MomentoComida;
  descripcion: string;
  receta_id?: number;
  receta_nombre?: string;
  calorias_kcal?: number;
  proteinas_g?: number;
  carbohidratos_g?: number;
  grasas_g?: number;
  fibra_g?: number;
  notas?: string;
}

export interface PlanDetalle {
  id: number;
  paciente_id: number;
  paciente_nombre?: string;
  paciente_apellido?: string;
  nombre?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado: "borrador" | "activo" | "vencido" | "archivado";
  calorias_objetivo_kcal?: number;
  proteinas_objetivo_g?: number;
  carbohidratos_objetivo_g?: number;
  grasas_objetivo_g?: number;
  observaciones?: string;
  comidas: PlanComidaDetalle[];
  creado_en?: string;
}

export interface PlanForm {
  paciente_id: number;
  nombre?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: string;
  calorias_objetivo_kcal?: number | string;
  proteinas_objetivo_g?: number | string;
  carbohidratos_objetivo_g?: number | string;
  grasas_objetivo_g?: number | string;
  observaciones?: string;
}

export interface ComidaForm {
  dia: number;
  momento: MomentoComida;
  descripcion: string;
  receta_id?: number;
  calorias_kcal?: number | string;
  proteinas_g?: number | string;
  carbohidratos_g?: number | string;
  grasas_g?: number | string;
  fibra_g?: number | string;
  notas?: string;
}

export const planService = {
  listar: async (paciente_id?: number): Promise<PlanDetalle[]> => {
    const query = paciente_id ? `?paciente_id=${paciente_id}` : "";
    const res = await api.get(`/planes${query}`);
    return res.data.data;
  },

  obtener: async (id: number): Promise<PlanDetalle> => {
    const res = await api.get(`/planes/${id}`);
    return res.data.data;
  },

  crear: async (data: PlanForm): Promise<PlanDetalle> => {
    const res = await api.post("/planes", data);
    return res.data.data;
  },

  actualizar: async (id: number, data: Partial<PlanForm>): Promise<PlanDetalle> => {
    const res = await api.put(`/planes/${id}`, data);
    return res.data.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/planes/${id}`);
  },

  agregarComida: async (planId: number, data: ComidaForm): Promise<PlanComidaDetalle> => {
    const res = await api.post(`/planes/${planId}/comidas`, data);
    return res.data.data;
  },

  actualizarComida: async (planId: number, comidaId: number, data: ComidaForm): Promise<PlanComidaDetalle> => {
    const res = await api.put(`/planes/${planId}/comidas/${comidaId}`, data);
    return res.data.data;
  },

  eliminarComida: async (planId: number, comidaId: number): Promise<void> => {
    await api.delete(`/planes/${planId}/comidas/${comidaId}`);
  },
};