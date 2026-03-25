import api from "./api";

export interface BlogCategoria {
  id: number;
  nombre: string;
  slug: string;
}

export interface BlogPost {
  id: number;
  categoria_id?: number;
  categoria_nombre?: string;
  titulo: string;
  slug: string;
  resumen?: string;
  contenido: string;
  imagen_portada?: string;
  estado: "borrador" | "publicado" | "archivado";
  publicado_en?: string;
  creado_en: string;
  recetas?: { id: number; nombre: string; calorias_kcal?: number; categoria?: string }[];
}

export interface BlogPostForm {
  titulo: string;
  resumen?: string;
  contenido: string;
  imagen_portada?: string;
  categoria_id?: number | string;
  estado: "borrador" | "publicado" | "archivado";
  receta_ids?: number[];
}

export const blogService = {

  async listarCategorias(): Promise<BlogCategoria[]> {
    const { data } = await api.get("/blog/categorias");
    return data.data;
  },

  async crearCategoria(nombre: string): Promise<BlogCategoria> {
    const { data } = await api.post("/blog/categorias", { nombre });
    return data.data;
  },

  async listar(estado?: string): Promise<BlogPost[]> {
    const query = estado ? `?estado=${estado}` : "";
    const { data } = await api.get(`/blog${query}`);
    return data.data;
  },

  async obtener(id: number): Promise<BlogPost> {
    const { data } = await api.get(`/blog/${id}`);
    return data.data;
  },

  async crear(post: BlogPostForm): Promise<BlogPost> {
    const { data } = await api.post("/blog", post);
    return data.data;
  },

  async actualizar(id: number, post: BlogPostForm): Promise<BlogPost> {
    const { data } = await api.put(`/blog/${id}`, post);
    return data.data;
  },

  async eliminar(id: number): Promise<void> {
    await api.delete(`/blog/${id}`);
  },
};