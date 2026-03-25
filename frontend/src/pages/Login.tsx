import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Leaf } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/auth.store";
import { aplicarTema, getTemaGuardado } from "@/hooks/useAppConfig";

const schema = z.object({
  email:    z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const login         = useAuthStore((s) => s.login);
  const cargando      = useAuthStore((s) => s.cargando);
  const [verPass, setVerPass]       = useState(false);
  const [nombreApp, setNombreApp]   = useState("NutriApp");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  });

  useEffect(() => {
    aplicarTema(getTemaGuardado());

    // Mostrar mensaje si la sesión expiró
    if (searchParams.get("sesion") === "expirada") {
      toast.error("Tu sesión expiró. Iniciá sesión nuevamente.");
    }

    fetch("/api/configuracion/publica")
      .then(r => r.json())
      .then(res => {
        if (res.ok && res.data) {
          if (res.data.nombre_app) setNombreApp(res.data.nombre_app);
          if (res.data.tema) aplicarTema(res.data.tema);
        }
      })
      .catch(() => {});
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      toast.success(`¡Bienvenida!`);
      // Redirigir a donde estaba antes de que expire la sesión
      const redirect = sessionStorage.getItem("redirect_after_login") || "/panel";
      sessionStorage.removeItem("redirect_after_login");
      navigate(redirect);
    } catch {
      toast.error("Email o contraseña incorrectos");
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 60%, var(--color-sidebar-from) 100%)` }}>

        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20"
          style={{ background: "rgba(255,255,255,0.3)" }} />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-15"
          style={{ background: "rgba(255,255,255,0.3)" }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-display text-xl font-semibold tracking-wide">
            {nombreApp}
          </span>
        </div>

        {/* Texto hero */}
        <div className="relative z-10">
          <h1 className="text-white font-display text-5xl font-bold leading-tight mb-6">
            Tu consultorio,<br />
            <span className="opacity-80">siempre</span><br />
            organizado.
          </h1>
          <p className="text-white/75 text-lg leading-relaxed max-w-sm">
            Gestioná pacientes, turnos y planes alimenticios desde un solo lugar.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { num: "∞", label: "Pacientes" },
            { num: "8",  label: "Turnos/día" },
            { num: "2",  label: "Sedes" },
          ].map(({ num, label }) => (
            <div key={label} className="bg-white/15 rounded-2xl p-4 text-center backdrop-blur-sm">
              <div className="text-white font-display text-3xl font-bold">{num}</div>
              <div className="text-white/70 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8"
        style={{ background: "var(--color-body-bg)" }}>
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "var(--color-primary)" }}>
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              {nombreApp}
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
              Bienvenida 👋
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Ingresá con tu cuenta para acceder al panel
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
                Email
              </label>
              <input type="email" autoComplete="email" placeholder="tu@email.com"
                className={`input-base ${errors.email ? "border-red-400" : ""}`}
                {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
                Contraseña
              </label>
              <div className="relative">
                <input type={verPass ? "text" : "password"} autoComplete="current-password"
                  placeholder="••••••••"
                  className={`input-base pr-10 ${errors.password ? "border-red-400" : ""}`}
                  {...register("password")} />
                <button type="button" onClick={() => setVerPass(!verPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--color-text-muted)" }}>
                  {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={cargando}
              className="w-full btn-primary py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {cargando ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </>
              ) : "Ingresar al panel"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
            Si olvidaste tu contraseña, contactá al administrador.
          </p>
        </div>
      </div>
    </div>
  );
}