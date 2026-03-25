import api from "./api";

export interface ConfiguracionData {
  foto_perfil?: string;
  logo_url?: string;
  nombre_app: string;
  color_primario: string;
  consultorio_nombre?: string;
  consultorio_direccion?: string;
  consultorio_telefono?: string;
  consultorio_email?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
}

export interface PerfilData {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export const configuracionService = {

  async obtener(): Promise<{ usuario: PerfilData; config: ConfiguracionData }> {
    const { data } = await api.get("/configuracion");
    return data.data;
  },

  async actualizarPerfil(nombre: string, email: string): Promise<void> {
    await api.put("/configuracion/perfil", { nombre, email });
  },

  async actualizarConfig(config: ConfiguracionData): Promise<void> {
    await api.put("/configuracion/config", config);
  },
};