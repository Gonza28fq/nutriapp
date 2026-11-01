import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, CalendarHeart, ClipboardList, UtensilsCrossed, ChevronRight, UserPlus, CalendarDays, Clock } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/services/api";
import { clinicaService, type Patologia } from "@/services/clinica.service";
import { Cargando, Kpi, Vacio, Iniciales } from "@/components/ui";

interface TurnoHoy {
  id: number; hora: string | null; paciente_id: number | null;
  paciente_nombre: string | null; paciente_apellido: string | null;
  tipo_consulta: string; sede_nombre: string | null; tipo: string;
}
interface Stats {
  pacientes_activos: number; turnos_hoy: number; consultas_mes: number; planes_activos: number;
  turnos_proximos: TurnoHoy[];
}

const TIPO: Record<string, string> = { primera_vez: "Primera vez", control: "Control", seguimiento: "Seguimiento" };
const hora = (h: string | null) => (h ? h.slice(0, 5) : "Sin hora");

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [patologias, setPatologias] = useState<Patologia[]>([]);

  useEffect(() => {
    api.get("/dashboard").then((r) => setStats(r.data.data)).catch(() => toast.error("No se pudo cargar el inicio"));
    clinicaService.patologias().then(setPatologias).catch(() => {});
  }, []);

  if (!stats) return <Cargando />;
  const proximo = stats.turnos_proximos[0];
  const topPatologias = patologias.filter((p) => p.pacientes > 0).sort((a, b) => b.pacientes - a.pacientes).slice(0, 6);
  const maxPat = Math.max(1, ...topPatologias.map((p) => p.pacientes));

  return (
    <div className="space-y-5">
      {/* ── Tarjeta principal: tu día ── */}
      <section className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8 text-white"
        style={{ background: "linear-gradient(130deg, #ff7ab6 0%, var(--color-primary) 45%, #c2307a 100%)", boxShadow: "var(--shadow-float)" }}>
        <div aria-hidden className="absolute -right-10 -top-12 w-56 h-56 rounded-full bg-white/15" />
        <div aria-hidden className="absolute right-24 -bottom-16 w-40 h-40 rounded-full bg-white/10" />
        <div aria-hidden className="absolute right-6 top-6 text-5xl sm:text-6xl" style={{ animation: "flotar 6s ease-in-out infinite" }}>🍓</div>
        <div className="relative max-w-xl">
          <p className="text-sm font-bold uppercase tracking-wider text-white/80">Tu día</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1 leading-tight">
            {stats.turnos_hoy === 0 ? "Hoy no hay turnos" : `${stats.turnos_hoy} ${stats.turnos_hoy === 1 ? "turno" : "turnos"} para hoy`}
          </h1>
          {proximo ? (
            <p className="mt-2 text-white/90 font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" /> Próximo: {hora(proximo.hora)} ·{" "}
              {proximo.paciente_nombre ? `${proximo.paciente_nombre} ${proximo.paciente_apellido}` : "Turno espontáneo"}
            </p>
          ) : (
            <p className="mt-2 text-white/90 font-semibold">Un buen momento para ponerte al día con las fichas ✨</p>
          )}
          <div className="flex flex-wrap gap-2 mt-5">
            <button onClick={() => navigate("/panel/turnos")} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white font-bold text-sm"
              style={{ color: "var(--color-primary-dark)" }}>
              <CalendarDays className="w-4 h-4" /> Ver agenda
            </button>
            <button onClick={() => navigate("/panel/pacientes/nuevo")} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 font-bold text-sm transition-colors">
              <UserPlus className="w-4 h-4" /> Nuevo paciente
            </button>
          </div>
        </div>
      </section>

      {/* ── Indicadores ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icono={<Users className="w-5 h-5" />} valor={stats.pacientes_activos} etiqueta="Pacientes activos" onClick={() => navigate("/panel/pacientes")} />
        <Kpi icono={<CalendarHeart className="w-5 h-5" />} valor={stats.turnos_hoy} etiqueta="Turnos hoy" tono="lila" onClick={() => navigate("/panel/turnos")} />
        <Kpi icono={<ClipboardList className="w-5 h-5" />} valor={stats.consultas_mes} etiqueta="Consultas este mes" tono="durazno" onClick={() => navigate("/panel/consultas")} />
        <Kpi icono={<UtensilsCrossed className="w-5 h-5" />} valor={stats.planes_activos} etiqueta="Planes activos" tono="menta" onClick={() => navigate("/panel/planes")} />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* ── Turnos de hoy ── */}
        <section className="panel-card lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-xl" style={{ color: "var(--color-text)" }}>Turnos de hoy</h2>
            <button onClick={() => navigate("/panel/turnos")} className="text-sm font-bold flex items-center gap-0.5" style={{ color: "var(--color-primary)" }}>
              Agenda <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {stats.turnos_proximos.length === 0 ? (
            <Vacio emoji="☕" titulo="Sin turnos pendientes" texto="Cuando agendes turnos para hoy, aparecen acá." />
          ) : (
            <ul className="space-y-2">
              {stats.turnos_proximos.map((t) => (
                <li key={t.id}>
                  <button disabled={!t.paciente_id} onClick={() => t.paciente_id && navigate(`/panel/pacientes/${t.paciente_id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors enabled:hover:bg-[var(--color-cream-100)]"
                    style={{ border: "1px solid var(--color-card-border)" }}>
                    <div className="w-14 text-center flex-shrink-0">
                      <p className="font-display font-bold text-lg leading-none" style={{ color: "var(--color-primary-dark)" }}>{hora(t.hora)}</p>
                    </div>
                    {t.paciente_nombre
                      ? <Iniciales nombre={t.paciente_nombre} apellido={t.paciente_apellido ?? ""} id={t.paciente_id ?? 0} tam="w-10 h-10 text-xs" />
                      : <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg" style={{ background: "var(--color-primary-bg)" }}>🌼</div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ color: "var(--color-text)" }}>
                        {t.paciente_nombre ? `${t.paciente_apellido}, ${t.paciente_nombre}` : "Turno espontáneo"}
                      </p>
                      <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                        {TIPO[t.tipo_consulta] ?? t.tipo_consulta}{t.sede_nombre ? ` · ${t.sede_nombre}` : ""}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Patologías ── */}
        <section className="panel-card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-xl" style={{ color: "var(--color-text)" }}>Patologías</h2>
            <button onClick={() => navigate("/panel/patologias")} className="text-sm font-bold flex items-center gap-0.5" style={{ color: "var(--color-primary)" }}>
              Ver todas <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {topPatologias.length === 0 ? (
            <Vacio emoji="🩺" titulo="Todavía sin datos" texto="Se completan con la historia clínica y las mediciones." />
          ) : (
            <ul className="space-y-3">
              {topPatologias.map((p) => (
                <li key={p.id}>
                  <button onClick={() => navigate(`/panel/patologias/${p.codigo}`)} className="w-full text-left group">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-bold group-hover:underline" style={{ color: "var(--color-text)" }}>{p.nombre}</span>
                      <span className="font-bold" style={{ color: "var(--color-text-muted)" }}>{p.pacientes}</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--color-cream-100)" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(p.pacientes / maxPat) * 100}%`, background: p.color || "var(--color-primary)" }} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
