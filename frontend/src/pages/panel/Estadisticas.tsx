import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Users, ClipboardList, Calendar, TrendingUp,} from "lucide-react";
import api from "@/services/api";
import toast from "react-hot-toast";

// ── Helpers de fecha ──────────────────────────────────────────────
function hoy() {
  return new Date().toISOString().slice(0, 10);
}
function hace(meses: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - meses);
  return d.toISOString().slice(0, 10);
}
function labelMes(mes: string) {
  const [y, m] = mes.split("-");
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${meses[parseInt(m) - 1]} ${y.slice(2)}`;
}

const COLORES_PIE = [
  "var(--color-primary)", "#5c8a3c", "#c8622a", "#8a5a2a",
  "#2563eb", "#9333ea", "#16a34a", "#6b7280"
];

interface Stats {
  pacientesPorMes:   { mes: string; total: number }[];
  consultasPorMes:   { mes: string; total: number }[];
  consultasPorTipo:  { tipo_consulta: string; total: number }[];
  turnosPorEstado:   { estado: string; total: number }[];
  pacientesPorSexo:  { sexo: string; total: number }[];
  pacientesPorEdad:  { rango: string; total: number }[];
  planesPorEstado:   { estado: string; total: number }[];
  totales: { pacientes: number; consultas: number; turnos: number; asistencia: number };
}

const PRESETS = [
  { label: "Último mes",      desde: () => hace(1),   hasta: () => hoy() },
  { label: "Últimos 3 meses", desde: () => hace(3),   hasta: () => hoy() },
  { label: "Últimos 6 meses", desde: () => hace(6),   hasta: () => hoy() },
  { label: "Este año",        desde: () => new Date().getFullYear() + "-01-01", hasta: () => hoy() },
  { label: "Personalizado",   desde: () => hace(3),   hasta: () => hoy() },
];

// ── Tooltip personalizado ────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-sm shadow-lg"
      style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
      <p className="font-semibold mb-1" style={{ color: "var(--color-text)" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function Estadisticas() {
  const [presetIdx, setPresetIdx] = useState(1); // Últimos 3 meses por defecto
  const [desde, setDesde]   = useState(hace(3));
  const [hasta, setHasta]   = useState(hoy());
  const [stats, setStats]   = useState<Stats | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const { data } = await api.get(`/dashboard/estadisticas?desde=${desde}&hasta=${hasta}`);
      setStats(data.data);
    } catch {
      toast.error("Error al cargar estadísticas");
    } finally {
      setCargando(false);
    }
  }, [desde, hasta]);

  useEffect(() => { cargar(); }, [cargar]);

  const aplicarPreset = (idx: number) => {
    setPresetIdx(idx);
    if (idx < 4) {
      setDesde(PRESETS[idx].desde());
      setHasta(PRESETS[idx].hasta());
    }
  };

  // Formatear datos para gráficos
  const dataPacientesMes = (stats?.pacientesPorMes ?? []).map(d => ({
    mes: labelMes(d.mes), total: d.total
  }));
  const dataConsultasMes = (stats?.consultasPorMes ?? []).map(d => ({
    mes: labelMes(d.mes), total: d.total
  }));
  const dataConsultasTipo = (stats?.consultasPorTipo ?? []).map(d => ({
    name: d.tipo_consulta === "primera_vez" ? "Primera vez"
        : d.tipo_consulta === "control"     ? "Control"
        : "Seguimiento",
    value: d.total
  }));
  const dataTurnosEstado = (stats?.turnosPorEstado ?? []).map(d => ({
    name: d.estado.charAt(0).toUpperCase() + d.estado.slice(1),
    value: d.total
  }));
  const dataSexo = (stats?.pacientesPorSexo ?? []).map(d => ({
    name: d.sexo === "masculino" ? "Masculino"
        : d.sexo === "femenino"  ? "Femenino"
        : "Sin especificar",
    value: d.total
  }));
  const dataEdad   = stats?.pacientesPorEdad ?? [];
  const dataPlanes = (stats?.planesPorEstado ?? []).map(d => ({
    name: d.estado.charAt(0).toUpperCase() + d.estado.slice(1),
    value: d.total
  }));

  const tarjetas = stats ? [
    { label: "Pacientes activos", valor: stats.totales.pacientes,  icon: Users,         color: "var(--color-primary)" },
    { label: "Consultas período", valor: stats.totales.consultas,  icon: ClipboardList, color: "#5c8a3c" },
    { label: "Turnos período",    valor: stats.totales.turnos,     icon: Calendar,      color: "#c8622a" },
    { label: "Tasa asistencia",   valor: `${stats.totales.asistencia}%`, icon: TrendingUp, color: "#2563eb" },
  ] : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: "var(--color-text)" }}>Estadísticas</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Análisis del consultorio por período</p>
        </div>
        <button onClick={cargar} disabled={cargando}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)", border: "1px solid var(--color-primary-border)" }}>
          {cargando
            ? <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
            : <TrendingUp className="w-4 h-4" />}
          Actualizar
        </button>
      </div>

      {/* Selector de período */}
      <div className="panel-card space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Período</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, i) => (
            <button key={i} onClick={() => aplicarPreset(i)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={presetIdx === i
                ? { background: "var(--color-primary)", color: "white" }
                : { background: "var(--color-primary-bg)", color: "var(--color-text-muted)", border: "1px solid var(--color-card-border)" }}>
              {p.label}
            </button>
          ))}
        </div>
        {presetIdx === 4 && (
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Desde</label>
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="input-base w-auto" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Hasta</label>
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="input-base w-auto" />
            </div>
          </div>
        )}
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {new Date(desde + "T12:00:00").toLocaleDateString("es-AR", { day:"numeric", month:"long", year:"numeric" })}
          {" — "}
          {new Date(hasta + "T12:00:00").toLocaleDateString("es-AR", { day:"numeric", month:"long", year:"numeric" })}
        </p>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
        </div>
      ) : stats && (
        <>
          {/* Tarjetas resumen */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {tarjetas.map(({ label, valor, icon: Icon, color }) => (
              <div key={label} className="panel-card flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: color + "18" }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{valor}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Gráfico: Pacientes por mes + Consultas por mes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="panel-card space-y-4">
              <h3 className="font-display text-base font-semibold" style={{ color: "var(--color-text)" }}>
                Nuevos pacientes por mes
              </h3>
              {dataPacientesMes.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>Sin datos en el período</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dataPacientesMes} margin={{ top:5, right:5, bottom:5, left:-20 }}>
                    <defs>
                      <linearGradient id="gradPac" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--color-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-card-border)" />
                    <XAxis dataKey="mes" tick={{ fontSize:11, fill:"var(--color-text-muted)" }} />
                    <YAxis tick={{ fontSize:11, fill:"var(--color-text-muted)" }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="total" name="Pacientes"
                      stroke="var(--color-primary)" strokeWidth={2}
                      fill="url(#gradPac)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="panel-card space-y-4">
              <h3 className="font-display text-base font-semibold" style={{ color: "var(--color-text)" }}>
                Consultas por mes
              </h3>
              {dataConsultasMes.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>Sin datos en el período</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dataConsultasMes} margin={{ top:5, right:5, bottom:5, left:-20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-card-border)" />
                    <XAxis dataKey="mes" tick={{ fontSize:11, fill:"var(--color-text-muted)" }} />
                    <YAxis tick={{ fontSize:11, fill:"var(--color-text-muted)" }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Consultas" fill="var(--color-primary)" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gráficos de torta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Tipo de consulta */}
            <div className="panel-card space-y-4">
              <h3 className="font-display text-base font-semibold" style={{ color: "var(--color-text)" }}>Tipo de consulta</h3>
              {dataConsultasTipo.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>Sin datos</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={dataConsultasTipo} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                        dataKey="value" paddingAngle={3}>
                        {dataConsultasTipo.map((_, i) => (
                          <Cell key={i} fill={COLORES_PIE[i % COLORES_PIE.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {dataConsultasTipo.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORES_PIE[i % COLORES_PIE.length] }} />
                          <span style={{ color: "var(--color-text)" }}>{d.name}</span>
                        </div>
                        <span className="font-semibold" style={{ color: "var(--color-text-muted)" }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Turnos por estado */}
            <div className="panel-card space-y-4">
              <h3 className="font-display text-base font-semibold" style={{ color: "var(--color-text)" }}>Turnos por estado</h3>
              {dataTurnosEstado.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>Sin datos</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={dataTurnosEstado} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                        dataKey="value" paddingAngle={3}>
                        {dataTurnosEstado.map((d, i) => {
                          const c = d.name === "Presente"  ? "#16a34a"
                                  : d.name === "Ausente"   ? "#dc2626"
                                  : d.name === "Cancelado" ? "#9ca3af"
                                  : "var(--color-primary)";
                          return <Cell key={i} fill={c} />;
                        })}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {dataTurnosEstado.map((d) => {
                      const c = d.name === "Presente"  ? "#16a34a"
                              : d.name === "Ausente"   ? "#dc2626"
                              : d.name === "Cancelado" ? "#9ca3af"
                              : "var(--color-primary)";
                      return (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                            <span style={{ color: "var(--color-text)" }}>{d.name}</span>
                          </div>
                          <span className="font-semibold" style={{ color: "var(--color-text-muted)" }}>{d.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Planes por estado */}
            <div className="panel-card space-y-4">
              <h3 className="font-display text-base font-semibold" style={{ color: "var(--color-text)" }}>Planes alimenticios</h3>
              {dataPlanes.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>Sin datos</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={dataPlanes} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                        dataKey="value" paddingAngle={3}>
                        {dataPlanes.map((_, i) => (
                          <Cell key={i} fill={COLORES_PIE[i % COLORES_PIE.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {dataPlanes.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORES_PIE[i % COLORES_PIE.length] }} />
                          <span style={{ color: "var(--color-text)" }}>{d.name}</span>
                        </div>
                        <span className="font-semibold" style={{ color: "var(--color-text-muted)" }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Pacientes por sexo y edad */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="panel-card space-y-4">
              <h3 className="font-display text-base font-semibold" style={{ color: "var(--color-text)" }}>Pacientes por sexo</h3>
              {dataSexo.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>Sin datos</p>
              ) : (
                <div className="space-y-3 pt-2">
                  {dataSexo.map((d, i) => {
                    const total = dataSexo.reduce((s, x) => s + x.value, 0);
                    const pct   = total > 0 ? Math.round((d.value / total) * 100) : 0;
                    return (
                      <div key={d.name}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span style={{ color: "var(--color-text)" }}>{d.name}</span>
                          <span className="font-semibold" style={{ color: "var(--color-text-muted)" }}>{d.value} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full" style={{ background: "var(--color-cream-200)" }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: COLORES_PIE[i % COLORES_PIE.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="panel-card space-y-4">
              <h3 className="font-display text-base font-semibold" style={{ color: "var(--color-text)" }}>
                Pacientes por rango de edad
              </h3>
              {dataEdad.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dataEdad} layout="vertical" margin={{ top:0, right:20, bottom:0, left:10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-card-border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize:11, fill:"var(--color-text-muted)" }} allowDecimals={false} />
                    <YAxis type="category" dataKey="rango" tick={{ fontSize:11, fill:"var(--color-text-muted)" }} width={70} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Pacientes" fill="var(--color-primary)" radius={[0,6,6,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}