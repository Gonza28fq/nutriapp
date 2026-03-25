import api from "./api";

export interface LoginResponse {
  token: string;
  usuario: {
    id: number;
    nombre: string;
    email: string;
    rol: "admin" | "nutricionista";
  };
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<{ ok: boolean; data: LoginResponse }>("/auth/login", {
      email,
      password,
    });
    return data.data;
  },

  async me() {
    const { data } = await api.get("/auth/me");
    return data.data;
  },

  async cambiarPassword(passwordActual: string, passwordNueva: string): Promise<void> {
    await api.put("/auth/cambiar-password", { passwordActual, passwordNueva });
  },
};