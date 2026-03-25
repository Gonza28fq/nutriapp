import api from "./api";

export interface Receta {
  id: number;
  nombre: string;
  descripcion?: string;
  ingredientes: string;
  preparacion?: string;
  calorias_kcal?: number;
  proteinas_g?: number;
  carbohidratos_g?: number;
  grasas_g?: number;
  fibra_g?: number;
  sodio_mg?: number;
  porciones?: number;
  categoria?: "desayuno" | "almuerzo" | "merienda" | "cena" | "colacion" | "postre" | "otro";
  tiempo_preparacion_min?: number;
  dificultad?: "facil" | "media" | "dificil";
  apta_celiacos?: boolean;
  apta_diabeticos?: boolean;
  apta_hipertensos?: boolean;
  apta_vegetarianos?: boolean;
  imagen_url?: string;
  notas?: string;
  paciente_id?: number;
  tipo?: "global" | "paciente";
  activa?: boolean;
  creado_en?: string;
}

export interface RecetaForm {
  nombre: string;
  descripcion?: string;
  ingredientes: string;
  preparacion?: string;
  calorias_kcal?: number | string;
  proteinas_g?: number | string;
  carbohidratos_g?: number | string;
  grasas_g?: number | string;
  fibra_g?: number | string;
  sodio_mg?: number | string;
  porciones?: number | string;
  categoria?: string;
  tiempo_preparacion_min?: number | string;
  dificultad?: string;
  apta_celiacos?: boolean;
  apta_diabeticos?: boolean;
  apta_hipertensos?: boolean;
  apta_vegetarianos?: boolean;
  notas?: string;
  paciente_id?: number;
}

export const recetaService = {
  listar: async (params?: { paciente_id?: number; busqueda?: string; categoria?: string }): Promise<Receta[]> => {
    const query = new URLSearchParams();
    if (params?.paciente_id) query.append("paciente_id", String(params.paciente_id));
    if (params?.busqueda) query.append("busqueda", params.busqueda);
    if (params?.categoria) query.append("categoria", params.categoria);
    const res = await api.get(`/recetas?${query.toString()}`);
    return res.data.data;
  },

  obtener: async (id: number): Promise<Receta> => {
    const res = await api.get(`/recetas/${id}`);
    return res.data.data;
  },

  crear: async (data: RecetaForm): Promise<Receta> => {
    const res = await api.post("/recetas", data);
    return res.data.data;
  },

  actualizar: async (id: number, data: RecetaForm): Promise<Receta> => {
    const res = await api.put(`/recetas/${id}`, data);
    return res.data.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/recetas/${id}`);
  },
};