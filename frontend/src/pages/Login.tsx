import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, HeartPulse, TrendingUp, PersonStanding, History } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/auth.store";
import { aplicarTema, getTemaGuardado } from "@/hooks/useAppConfig";
import FondoAnimado from "@/components/layout/FondoAnimado";

const schema = z.object({
  email:    z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormData = z.infer<typeof schema>;

const FUNCIONES = [
  { icono: HeartPulse, texto: "Pacientes por patología" },
  { icono: TrendingUp, texto: "Progreso y laboratorios" },
  { icono: PersonStanding, texto: "Medidas en el cuerpo" },
  { icono: History, texto: "Seguimiento completo" },
];

export default function Login() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const login          = useAuthStore((s) => s.login);
  const cargando       = useAuthStore((s) => s.cargando);
  const [verPass, setVerPass]     = useState(false);
  const [nombreApp, setNombreApp] = useState("NutriApp");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  });

  const API = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

  useEffect(() => {
    aplicarTema(getTemaGuardado());
    if (searchParams.get("sesion") === "expirada") {
      toast.error("Tu sesión expiró. Iniciá sesión nuevamente.");
    }
    fetch(`${API}/api/configuracion/publica`)
      .then(r => r.json())
      .then(res => {
        if (res.ok && res.data) {
          if (res.data.nombre_app) setNombreApp(res.data.nombre_app);
          if (res.data.tema) aplicarTema(res.data.tema);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      toast.success("¡Bienvenida! 🌸");
      const redirect = sessionStorage.getItem("redirect_after_login") || "/panel";
      sessionStorage.removeItem("redirect_after_login");
      navigate(redirect);
    } catch {
      toast.error("Email o contraseña incorrectos");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <FondoAnimado />

      <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-[2.25rem] overflow-hidden bg-white/80 backdrop-blur-xl border animate-pop"
        style={{ borderColor: "var(--color-card-border)", boxShadow: "var(--shadow-float)" }}>

        {/* ── Panel decorativo (escritorio) ── */}
        <div className="hidden lg:flex flex-col justify-between gap-10 p-10 min-h-[38rem] relative overflow-hidden text-white"
          style={{ background: "linear-gradient(140deg, #ff7ab6 0%, var(--color-primary) 50%, #c2307a 100%)" }}>
          <div aria-hidden className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/15" />
          <div aria-hidden className="absolute -left-16 -bottom-24 w-64 h-64 rounded-full bg-white/10" />
          <span aria-hidden className="absolute right-8 top-8 text-5xl" style={{ animation: "flotar 6s ease-in-out infinite" }}>🍓</span>
          <span aria-hidden className="absolute right-10 bottom-10 text-4xl" style={{ animation: "flotar 7s ease-in-out infinite reverse" }}>🍎</span>
          <span aria-hidden className="absolute right-28 top-20 text-2xl" style={{ animation: "flotar 5s ease-in-out infinite" }}>✨</span>

          <div className="relative flex items-center gap-3">
            <img src="/favicon.svg" alt="" className="w-11 h-11 rounded-2xl ring-2 ring-white/40" />
            <span className="font-display text-xl font-bold">{nombreApp}</span>
          </div>

          <div className="relative">
            <h1 className="font-display text-4xl xl:text-5xl font-bold leading-[1.05]">
              Tu consultorio,<br /><span className="text-white/80 whitespace-nowrap">siempre a mano 💗</span>
            </h1>
            <p className="mt-4 text-white/85 font-semibold max-w-sm">
              Pacientes, turnos, planes y la evolución de cada persona en un solo lugar.
            </p>
            <div className="grid grid-cols-2 gap-2.5 mt-7 max-w-md">
              {FUNCIONES.map(({ icono: Icono, texto }) => (
                <div key={texto} className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white/15 backdrop-blur text-sm font-bold">
                  <Icono className="w-4 h-4 flex-shrink-0" /> {texto}
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-white/70 font-semibold">Hecho con cariño para tu día a día ✿</p>
        </div>

        {/* ── Formulario ── */}
        <div className="p-7 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="lg:hidden flex flex-col items-center text-center mb-6">
            <img src="/favicon.svg" alt="" className="w-16 h-16 mb-3 drop-shadow" style={{ animation: "flotar 6s ease-in-out infinite" }} />
            <span className="font-display text-2xl font-bold" style={{ color: "var(--color-text)" }}>{nombreApp}</span>
          </div>

          <h2 className="font-display text-3xl font-bold" style={{ color: "var(--color-text)" }}>
            Hola de nuevo <span className="inline-block" style={{ animation: "latido 2.4s ease-in-out infinite" }}>🌸</span>
          </h2>
          <p className="mt-1.5 font-semibold" style={{ color: "var(--color-text-muted)" }}>Ingresá con tu cuenta para ver tu panel.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
            <label className="block">
              <span className="label-base">Email</span>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-primary-light)" }} />
                <input {...register("email")} type="email" autoComplete="email" placeholder="tu@email.com" className="input-base pl-10" />
              </div>
              {errors.email && <span className="text-xs font-bold mt-1 block" style={{ color: "var(--color-primary-dark)" }}>{errors.email.message}</span>}
            </label>

            <label className="block">
              <span className="label-base">Contraseña</span>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-primary-light)" }} />
                <input {...register("password")} type={verPass ? "text" : "password"} autoComplete="current-password"
                  placeholder="••••••••" className="input-base pl-10 pr-11" />
                <button type="button" onClick={() => setVerPass((v) => !v)} aria-label={verPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-primary-bg)]"
                  style={{ color: "var(--color-text-muted)" }}>
                  {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <span className="text-xs font-bold mt-1 block" style={{ color: "var(--color-primary-dark)" }}>{errors.password.message}</span>}
            </label>

            <button type="submit" disabled={cargando} className="btn-primary w-full py-3 text-base mt-2">
              {cargando
                ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : "Ingresar"}
            </button>
          </form>

          <p className="text-center text-xs mt-6 font-semibold" style={{ color: "var(--color-text-muted)" }}>
            ¿Olvidaste tu contraseña? Escribile al administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
