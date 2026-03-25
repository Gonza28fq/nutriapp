import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Calendar, ClipboardList, UtensilsCrossed,
  TrendingUp, Clock, MapPin, User, ChevronRight
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/services/api";
import toast from "react-hot-toast";

interface DashboardStats {
  pacientes_activos: number;
  turnos_hoy: number;
  consultas_mes: number;
  planes_activos: number;
  turnos_proximos: {
    id: number;
    hora?: string;
    tipo: string;
    tipo_consulta: string;
    estado: string;
    paciente_nombre?: string;
    paciente_apellido?: string;
    sede_nombre?: string;
  }[];
}

const tipoConfig: Record<string, { label: string }> = {
  primera_vez: { label: "Primera vez" },
  control:     { label: "Control" },
  seguimiento: { label: "Seguimiento" },
};

const statsCards = (stats: DashboardStats | null) => [
  { label: "Pacientes activos",  valor: stats?.pacientes_activos ?? "—", icon: Users,         ruta: "/panel/pacientes" },
  { label: "Turnos hoy",         valor: stats?.turnos_hoy ?? "—",        icon: Calendar,       ruta: "/panel/turnos" },
  { label: "Consultas este mes", valor: stats?.consultas_mes ?? "—",     icon: ClipboardList,  ruta: "/panel/consultas" },
  { label: "Planes activos",     valor: stats?.planes_activos ?? "—",    icon: UtensilsCrossed,ruta: "/panel/planes" },
];

export default function Dashboard() {
  const navigate   = useNavigate();
  const usuario    = useAuthStore((s) => s.usuario);
  const [stats, setStats]       = useState<DashboardStats | null>(null);
  const [cargando, setCargando] = useState(true);

  const hora   = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  useEffect(() => {
    api.get("/dashboard")
      .then(res => setStats(res.data.data))
      .catch(() => toast.error("Error al cargar el dashboard"))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="panel-card flex items-center justify-between" style={{
        background: "linear-gradient(135deg, var(--color-sidebar-from) 0%, var(--color-sidebar-to) 100%)",
        border: "none"
      }}>
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            {saludo}, {usuario?.nombre} 👋
          </h1>
          <p className="text-white/50 mt-1 text-sm">
            {new Date().toLocaleDateString("es-AR", {
              weekday: "long", day: "numeric", month: "long", year: "numeric"
            })}
          </p>
        </div>
        <div className="hidden md:flex w-14 h-14 rounded-2xl items-center justify-center flex-shrink-0"
          style={{ background: "var(--color-primary-bg)" }}>
          <TrendingUp className="w-7 h-7" style={{ color: "var(--color-primary)" }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards(stats).map(({ label, valor, icon: Icon, ruta }) => (
          <div key={label}
            onClick={() => navigate(ruta)}
            className="rounded-2xl p-5 flex flex-col gap-3 cursor-pointer transition-transform hover:-translate-y-0.5"
            style={{
              background: "var(--color-primary-bg)",
              border: "1px solid var(--color-primary-border)"
            }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-primary)" }}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              {cargando ? (
                <div className="w-10 h-7 rounded-lg animate-pulse"
                  style={{ background: "var(--color-primary-border)" }} />
              ) : (
                <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{valor}</p>
              )}
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Próximos turnos del día */}
      <div className="panel-card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full"
              style={{ background: "var(--color-primary)" }} />
            <h2 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Turnos de hoy
            </h2>
          </div>
          <button onClick={() => navigate("/panel/turnos")}
            className="flex items-center gap-1 text-sm font-medium"
            style={{ color: "var(--color-primary)" }}>
            Ver todos <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {cargando ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-xl animate-pulse"
                style={{ background: "var(--color-primary-bg)" }} />
            ))}
          </div>
        ) : !stats?.turnos_proximos.length ? (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 mx-auto mb-3"
              style={{ color: "var(--color-primary-border)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              No hay turnos pendientes para hoy
            </p>
            <button onClick={() => navigate("/panel/turnos")} className="btn-primary mt-4 text-sm">
              Ver turnos
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.turnos_proximos.map((t, i) => {
              const tipo = tipoConfig[t.tipo_consulta] ?? tipoConfig.control;
              return (
                <div key={t.id}
                  onClick={() => navigate("/panel/turnos")}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors"
                  style={{
                    borderBottom: i < stats.turnos_proximos.length - 1
                      ? "1px solid var(--color-card-border)" : "none"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-primary-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="w-14 flex-shrink-0">
                    {t.hora ? (
                      <div className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                        <Clock className="w-3 h-3" />
                        <span className="text-sm font-semibold">{t.hora.slice(0, 5)}</span>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--color-primary)" }}>Espontáneo</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--color-primary)" }} />
                      <span className="font-medium text-sm truncate" style={{ color: "var(--color-text)" }}>
                        {t.paciente_apellido && t.paciente_nombre
                          ? `${t.paciente_apellido}, ${t.paciente_nombre}`
                          : "Paciente espontáneo"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-lg"
                        style={{
                          background: "var(--color-primary-bg)",
                          color: "var(--color-primary-muted)"
                        }}>
                        {tipo.label}
                      </span>
                    </div>
                    {t.sede_nombre && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" style={{ color: "var(--color-primary)" }} />
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {t.sede_nombre}
                        </span>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-primary)" }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}