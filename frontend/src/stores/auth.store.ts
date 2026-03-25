import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/services/api";

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: "admin" | "nutricionista";
}

interface AuthStore {
  usuario: Usuario | null;
  token: string | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  estaAutenticado: () => boolean;
  setUsuario: (usuario: Usuario) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      cargando: false,

      login: async (email, password) => {
        set({ cargando: true });
        try {
          const { data } = await api.post("/auth/login", { email, password });
          localStorage.setItem("token", data.data.token);
          set({
            usuario: data.data.usuario,
            token: data.data.token,
            cargando: false,
          });
        } catch (error) {
          set({ cargando: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem("token");
        set({ usuario: null, token: null });
      },

      estaAutenticado: () => !!get().token && !!get().usuario,

      setUsuario: (usuario: Usuario) => {
        set({ usuario });
      },
    }),
    {
      name: "nutri-auth",
      partialize: (state) => ({
        usuario: state.usuario,
        token: state.token,
      }),
    }
  )
);