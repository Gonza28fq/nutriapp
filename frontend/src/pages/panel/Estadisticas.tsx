import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Table2, ArrowDown, ArrowUp, Minus } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/services/api";
import { Cargando } from "@/components/ui";
import { fechaISO, aFecha } from "@/utils/fecha";

// ── Paleta (validada con validate_palette.js: CVD y visión normal OK; los
//    tonos de bajo contraste siempre van con etiqueta visible) ──
const CAT = ["#ff2484", "#3b8fe0", "#e0a113", "#8b6cf0", "#1fa67f"];
// Secuencial (un solo tono rosa, claro → oscuro) para las tiras de calor
const SEQ = ["#fff0f7", "#ffd1e6", "#ff93c5", "#ff5aa3", "#e8137a", "#9c1559"];
// Estados (significado fijo, siempre con texto)
const ESTADO_TURNO: Record<string, { color: string; etiqueta: string }> = {
  presente:  { color: "#1fa67f", etiqueta: "Vino" },
  ausente:   { color: "#ef6a3c", etiqueta: "Faltó" },
  cancelado: { color: "#b8aab2", etiqueta: "Canceló" },
  pendiente: { color: "#3b8fe0", etiqueta: "Pendiente" },
};
// Zonas clínicas del IMC
const ZONAS_IMC = [
  { desde: 10, hasta: 18.5, etiqueta: "Bajo peso", color: "#3b8fe0" },
  { desde: 18.5, hasta: 25, etiqueta: "Normal", color: "#1fa67f" },
  { desde: 25, hasta: 30, etiqueta: "Sobrepeso", color: "#e0a113" },
  { desde: 30, hasta: 35, etiqueta: "Obesidad I", color: "#ef6a3c" },
  { desde: 35, hasta: 40, etiqueta: "Obesidad II", color: "#e8137a" },
  { desde: 40, hasta: 60, etiqueta: "Obesidad III", color: "#9c1559" },
];

interface Stats {
  pacientesPorMes: { mes: string; total: number }[];
  consultasPorMes: { mes: string; total: number }[];
  consultasPorTipo: { tipo_consulta: string; total: number }[];
  turnosPorEstado: { estado: string; total: number }[];
  pacientesPorSexo: { sexo: string; total: number }[];
  pacientesPorEdad: { rango: string; total: number }[];
  planesPorEstado: { estado: string; total: number }[];
  imcActual: number[];
  cambiosPeso: { cambio: number; dias: number }[];
  totales: { pacientes: number; consultas: number; turnos: number; asistencia: number };
}

const hace = (meses: number) => { const d = new Date(); d.setMonth(d.getMonth() - meses); return fechaISO(d); };
const PRESETS = [
  { label: "Último mes", desde: () => hace(1) },
  { label: "3 meses", desde: () => hace(3) },
  { label: "6 meses", desde: () => hace(6) },
  { label: "Este año", desde: () => `${new Date().getFullYear()}-01-01` },
  { label: "12 meses", desde: () => hace(12) },
];
const TIPO_CONSULTA: Record<string, string> = { primera_vez: "Primera vez", control: "Control", seguimiento: "Seguimiento" };
const ESTADO_PLAN: Record<string, string> = { borrador: "Borrador", activo: "Activo", vencido: "Vencido", archivado: "Archivado" };
const SEXO: Record<string, string> = { femenino: "Mujeres", masculino: "Varones", otro: "Otro", no_especificado: "Sin dato" };
const mesCorto = (m: string) => aFecha(`${m}-01`).toLocaleDateString("es-AR", { month: "short", year: "2-digit" });

// ── Tooltip que sigue al mouse ───────────────────────────────────────────
function useTip() {
  const [tip, setTip] = useState<{ x: number; y: number; texto: ReactNode } | null>(null);
  const props = (texto: ReactNode) => ({
    onMouseMove: (e: React.MouseEvent) => setTip({ x: e.clientX, y: e.clientY, texto }),
    onMouseLeave: () => setTip(null),
  });
  const nodo = tip && createPortal(
    <div className="fixed z-[70] pointer-events-none px-3 py-2 rounded-xl text-xs font-bold bg-white border"
      style={{ left: tip.x + 14, top: tip.y + 14, borderColor: "var(--color-card-border)", boxShadow: "var(--shadow-float)", color: "var(--color-text)" }}>
      {tip.texto}
    </div>, document.body);
  return { props, nodo };
}

// ── Tarjeta con título, bajada y "Ver datos" (tabla) ─────────────────────
function Tarjeta({ titulo, bajada, tabla, children, className = "" }: {
  titulo: string; bajada?: string; tabla: [string, string | number][]; children: ReactNode; className?: string;
}) {
  const [verTabla, setVerTabla] = useState(false);
  return (
    <section className={`panel-card ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1">
          <h2 className="font-display font-bold text-lg leading-tight" style={{ color: "var(--color-text)" }}>{titulo}</h2>
          {bajada && <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{bajada}</p>}
        </div>
        <button onClick={() => setVerTabla((v) => !v)} className="text-xs font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-[var(--color-primary-bg)]"
          style={{ color: "var(--color-text-muted)" }} aria-pressed={verTabla}>
          <Table2 className="w-3.5 h-3.5" /> {verTabla ? "Ver gráfico" : "Ver datos"}
        </button>
      </div>
      {verTabla ? (
        <table className="w-full text-sm">
          <tbody>
            {tabla.map(([k, v]) => (
              <tr key={k} className="border-t" style={{ borderColor: "var(--color-card-border)" }}>
                <td className="py-1.5" style={{ color: "var(--color-text-muted)" }}>{k}</td>
                <td className="py-1.5 text-right font-bold tabular-nums" style={{ color: "var(--color-text)" }}>{v}</td>
              </tr>
            ))}
            {tabla.length === 0 && <tr><td className="py-2" style={{ color: "var(--color-text-muted)" }}>Sin datos en el período.</td></tr>}
          </tbody>
        </table>
      ) : children}
    </section>
  );
}

const SinDatos = ({ texto = "Sin datos en el período elegido." }) => (
  <p className="text-sm py-6 text-center" style={{ color: "var(--color-text-muted)" }}>{texto}</p>
);

// ── Asistencia: 100 puntitos ─────────────────────────────────────────────
function PuntosAsistencia({ porcentaje }: { porcentaje: number }) {
  return (
    <div className="grid grid-cols-10 gap-[3px] w-[5.5rem]" role="img" aria-label={`${porcentaje} de cada 100 turnos asistidos`}>
      {Array.from({ length: 100 }, (_, i) => (
        <span key={i} className="aspect-square rounded-full" style={{ background: i < porcentaje ? "#1fa67f" : "var(--color-cream-200)" }} />
      ))}
    </div>
  );
}

// ── Tira de calor por mes ────────────────────────────────────────────────
function TiraCalor({ etiqueta, datos, meses, tip }: { etiqueta: string; datos: Map<string, number>; meses: string[]; tip: ReturnType<typeof useTip>["props"] }) {
  const max = Math.max(1, ...meses.map((m) => datos.get(m) ?? 0));
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>{etiqueta}</p>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${meses.length}, minmax(0, 1fr))` }}>
        {meses.map((m) => {
          const v = datos.get(m) ?? 0;
          const paso = v === 0 ? 0 : Math.min(SEQ.length - 1, 1 + Math.floor((v / max) * (SEQ.length - 2)));
          return (
            <div key={m} {...tip(<>{mesCorto(m)} · {v} {etiqueta.toLowerCase()}</>)}
              className="h-12 rounded-xl flex items-center justify-center text-sm font-bold tabular-nums transition-transform hover:scale-105 cursor-default"
              style={{ background: SEQ[paso], color: paso >= 3 ? "white" : "var(--color-text-muted)" }}>
              {v || ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Personita (isotipo) ──────────────────────────────────────────────────
const Personita = ({ color }: { color: string }) => (
  <svg viewBox="0 0 16 24" className="w-4 h-6"><circle cx="8" cy="4.5" r="3.5" fill={color} /><path d="M2 22v-8a6 6 0 0 1 12 0v8z" fill={color} /></svg>
);

export default function Estadisticas() {
  const [preset, setPreset] = useState(1);
  const [desde, setDesde] = useState(hace(3));
  const [hasta, setHasta] = useState(fechaISO());
  const [stats, setStats] = useState<Stats | null>(null);
  const { props: tip, nodo: tipNodo } = useTip();

  const cargar = useCallback(() => {
    setStats(null);
    api.get(`/dashboard/estadisticas?desde=${desde}&hasta=${hasta}`)
      .then((r) => setStats(r.data.data))
      .catch(() => toast.error("No se pudieron cargar las estadísticas"));
  }, [desde, hasta]);
  useEffect(() => { cargar(); }, [cargar]);

  // Meses del período (para que las tiras muestren también los meses en 0)
  const meses = useMemo(() => {
    const lista: string[] = [];
    const d = aFecha(desde.slice(0, 7) + "-01");
    const fin = aFecha(hasta);
    while (d <= fin && lista.length < 24) { lista.push(fechaISO(d).slice(0, 7)); d.setMonth(d.getMonth() + 1); }
    return lista;
  }, [desde, hasta]);

  if (!stats) return <Cargando />;

  const totalTurnos = stats.turnosPorEstado.reduce((s, t) => s + t.total, 0);
  const escalaWaffle = totalTurnos > 200 ? Math.ceil(totalTurnos / 200) : 1;
  const cambios = stats.cambiosPeso;
  const bajaron = cambios.filter((c) => c.cambio <= -0.5).length;
  const subieron = cambios.filter((c) => c.cambio >= 0.5).length;
  const mantuvieron = cambios.length - bajaron - subieron;
  const maxCambio = Math.max(5, ...cambios.map((c) => Math.abs(c.cambio)));
  const totalSexo = stats.pacientesPorSexo.reduce((s, x) => s + x.total, 0);
  const maxEdad = Math.max(1, ...stats.pacientesPorEdad.map((e) => e.total));

  // posiciones de los puntos de IMC (apilados cuando caen en el mismo lugar)
  const imcMin = 15, imcMax = 45;
  const pos = (v: number) => ((Math.min(imcMax, Math.max(imcMin, v)) - imcMin) / (imcMax - imcMin)) * 100;
  const pilas = new Map<number, number>();
  const puntosImc = stats.imcActual.map((v) => {
    const casillero = Math.round(pos(v) / 2.2);
    const nivel = pilas.get(casillero) ?? 0;
    pilas.set(casillero, nivel + 1);
    return { v, x: pos(v), nivel };
  });

  const segmentada = (filas: { etiqueta: string; total: number }[]) => {
    const total = filas.reduce((s, f) => s + f.total, 0);
    if (!total) return <SinDatos />;
    return (
      <div>
        <div className="flex h-10 gap-[2px] rounded-2xl overflow-hidden">
          {filas.map((f, i) => (
            <div key={f.etiqueta} {...tip(<>{f.etiqueta}: {f.total} ({Math.round((f.total / total) * 100)}%)</>)}
              style={{ width: `${(f.total / total) * 100}%`, background: CAT[i % CAT.length] }} />
          ))}
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {filas.map((f, i) => (
            <li key={f.etiqueta} className="flex items-center gap-1.5 text-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CAT[i % CAT.length] }} />
              <span style={{ color: "var(--color-text)" }}>{f.etiqueta}</span>
              <span className="font-bold tabular-nums" style={{ color: "var(--color-text)" }}>{f.total}</span>
              <span style={{ color: "var(--color-text-muted)" }}>· {Math.round((f.total / total) * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Estadísticas</h1>
        <p className="page-sub">Cómo viene el consultorio y la evolución de tus pacientes.</p>
      </div>

      {/* Filtros en una fila */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p, i) => (
          <button key={p.label} className="chip" data-activo={preset === i}
            onClick={() => { setPreset(i); setDesde(p.desde()); setHasta(fechaISO()); }}>{p.label}</button>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <input type="date" className="input-base py-1.5 w-auto" value={desde} onChange={(e) => { setPreset(-1); setDesde(e.target.value); }} aria-label="Desde" />
          <span style={{ color: "var(--color-text-muted)" }}>→</span>
          <input type="date" className="input-base py-1.5 w-auto" value={hasta} onChange={(e) => { setPreset(-1); setHasta(e.target.value); }} aria-label="Hasta" />
        </div>
      </div>

      {/* Números principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Pacientes activos", stats.totales.pacientes, "en total"],
          ["Consultas", stats.totales.consultas, "en el período"],
          ["Turnos", stats.totales.turnos, "en el período"],
        ].map(([et, v, sub]) => (
          <div key={et as string} className="panel-card">
            <p className="text-sm font-bold" style={{ color: "var(--color-text-muted)" }}>{et}</p>
            <p className="font-display font-bold text-4xl mt-1" style={{ color: "var(--color-text)" }}>{v}</p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{sub}</p>
          </div>
        ))}
        <div className="panel-card flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: "var(--color-text-muted)" }}>Asistencia</p>
            <p className="font-display font-bold text-4xl mt-1" style={{ color: "var(--color-text)" }}>{stats.totales.asistencia}<span className="text-xl">%</span></p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>de los turnos</p>
          </div>
          <PuntosAsistencia porcentaje={stats.totales.asistencia} />
        </div>
      </div>

      {/* Ritmo mensual */}
      <Tarjeta titulo="El ritmo del consultorio" bajada="Cada casillero es un mes: cuanto más intenso, más movimiento. Cada fila tiene su propia escala."
        tabla={meses.map((m) => [mesCorto(m), `${stats.consultasPorMes.find((x) => x.mes === m)?.total ?? 0} consultas · ${stats.pacientesPorMes.find((x) => x.mes === m)?.total ?? 0} pacientes nuevos`])}>
        <div className="space-y-4 overflow-x-auto no-scrollbar">
          <div className="min-w-[28rem] space-y-4">
            <TiraCalor etiqueta="Consultas" datos={new Map(stats.consultasPorMes.map((x) => [x.mes, x.total]))} meses={meses} tip={tip} />
            <TiraCalor etiqueta="Pacientes nuevos" datos={new Map(stats.pacientesPorMes.map((x) => [x.mes, x.total]))} meses={meses} tip={tip} />
            <div className="grid gap-1 text-[0.7rem] font-bold text-center capitalize" style={{ gridTemplateColumns: `repeat(${meses.length}, minmax(0, 1fr))`, color: "var(--color-text-muted)" }}>
              {meses.map((m) => <span key={m}>{mesCorto(m)}</span>)}
            </div>
          </div>
        </div>
      </Tarjeta>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Regla de IMC */}
        <Tarjeta titulo="Mapa de IMC" bajada="Cada punto es un paciente activo, ubicado según su último IMC."
          tabla={ZONAS_IMC.map((z) => [z.etiqueta, stats.imcActual.filter((v) => v >= z.desde && v < z.hasta).length])}>
          {stats.imcActual.length === 0 ? <SinDatos texto="Todavía no hay mediciones con IMC." /> : (
            <div>
              <div className="relative" style={{ height: 20 + Math.max(...puntosImc.map((p) => p.nivel)) * 13 }}>
                {puntosImc.map((p, i) => (
                  <span key={i} {...tip(<>IMC {p.v.toLocaleString("es-AR")}</>)}
                    className="absolute w-3 h-3 rounded-full ring-2 ring-white -translate-x-1/2 cursor-default transition-transform hover:scale-150"
                    style={{ left: `${p.x}%`, bottom: 4 + p.nivel * 13, background: "var(--color-text)" }} />
                ))}
              </div>
              <div className="flex h-3 rounded-full overflow-hidden gap-[2px]">
                {ZONAS_IMC.map((z) => {
                  const a = Math.max(z.desde, imcMin), b = Math.min(z.hasta, imcMax);
                  return <div key={z.etiqueta} style={{ width: `${((b - a) / (imcMax - imcMin)) * 100}%`, background: z.color }} />;
                })}
              </div>
              <div className="relative h-5 text-[0.7rem] font-bold tabular-nums" style={{ color: "var(--color-text-muted)" }}>
                {[18.5, 25, 30, 35, 40].map((v) => <span key={v} className="absolute -translate-x-1/2 top-1" style={{ left: `${pos(v)}%` }}>{v.toLocaleString("es-AR")}</span>)}
              </div>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 mt-2">
                {ZONAS_IMC.map((z) => (
                  <li key={z.etiqueta} className="flex items-center gap-1.5 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: z.color }} />
                    <span style={{ color: "var(--color-text)" }}>{z.etiqueta}</span>
                    <span className="font-bold ml-auto tabular-nums" style={{ color: "var(--color-text)" }}>{stats.imcActual.filter((v) => v >= z.desde && v < z.hasta).length}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Tarjeta>

        {/* Evolución de peso */}
        <Tarjeta titulo="Evolución de peso" bajada="Diferencia entre la primera y la última medición de cada paciente (con 2 o más pesos)."
          tabla={[["Bajaron (≥ 0,5 kg)", bajaron], ["Se mantuvieron", mantuvieron], ["Subieron (≥ 0,5 kg)", subieron]]}>
          {cambios.length === 0 ? <SinDatos texto="Hace falta al menos dos mediciones de peso por paciente." /> : (
            <div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[["Bajaron", bajaron, ArrowDown, "#1fa67f"], ["Se mantuvieron", mantuvieron, Minus, "#8a7a83"], ["Subieron", subieron, ArrowUp, "#ef6a3c"]].map(([et, v, Icono, c]) => {
                  const I = Icono as typeof ArrowDown;
                  return (
                    <div key={et as string} className="p-3 rounded-2xl text-center" style={{ background: "var(--color-cream-50)", border: "1px solid var(--color-card-border)" }}>
                      <I className="w-4 h-4 mx-auto" style={{ color: c as string }} />
                      <p className="font-display font-bold text-2xl" style={{ color: "var(--color-text)" }}>{v as number}</p>
                      <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>{et as string}</p>
                    </div>
                  );
                })}
              </div>
              <div className="relative h-14 mx-3">
                <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: "var(--color-card-border)" }} />
                <div className="absolute left-1/2 top-1 bottom-1 w-px" style={{ background: "#c9bcc3" }} />
                {cambios.map((c, i) => (
                  <span key={i} {...tip(<>{c.cambio > 0 ? "+" : ""}{c.cambio.toLocaleString("es-AR")} kg en {c.dias} días</>)}
                    className="absolute w-3.5 h-3.5 rounded-full ring-2 ring-white -translate-x-1/2 -translate-y-1/2 cursor-default transition-transform hover:scale-150"
                    style={{
                      left: `${50 + (c.cambio / maxCambio) * 50}%`, top: `${50 + ((i % 3) - 1) * 22}%`,
                      background: c.cambio <= -0.5 ? "#1fa67f" : c.cambio >= 0.5 ? "#ef6a3c" : "#b8aab2",
                    }} />
                ))}
              </div>
              <div className="flex justify-between text-[0.7rem] font-bold tabular-nums mx-1" style={{ color: "var(--color-text-muted)" }}>
                <span>−{Math.round(maxCambio)} kg</span><span>0</span><span>+{Math.round(maxCambio)} kg</span>
              </div>
            </div>
          )}
        </Tarjeta>

        {/* Turnos: waffle */}
        <Tarjeta titulo="Turnos" bajada={escalaWaffle > 1 ? `Cada cuadradito son ${escalaWaffle} turnos.` : "Cada cuadradito es un turno."}
          tabla={stats.turnosPorEstado.map((t) => [ESTADO_TURNO[t.estado]?.etiqueta ?? t.estado, t.total])}>
          {totalTurnos === 0 ? <SinDatos /> : (
            <div>
              <div className="flex flex-wrap gap-[3px]">
                {["presente", "ausente", "pendiente", "cancelado"].flatMap((estado) => {
                  const n = Math.round((stats.turnosPorEstado.find((t) => t.estado === estado)?.total ?? 0) / escalaWaffle);
                  return Array.from({ length: n }, (_, i) => (
                    <span key={`${estado}-${i}`} {...tip(<>{ESTADO_TURNO[estado].etiqueta}</>)}
                      className="w-4 h-4 rounded-[5px] cursor-default" style={{ background: ESTADO_TURNO[estado].color }} />
                  ));
                })}
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                {["presente", "ausente", "pendiente", "cancelado"].map((estado) => {
                  const n = stats.turnosPorEstado.find((t) => t.estado === estado)?.total ?? 0;
                  return (
                    <li key={estado} className="flex items-center gap-1.5 text-sm">
                      <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: ESTADO_TURNO[estado].color }} />
                      <span style={{ color: "var(--color-text)" }}>{ESTADO_TURNO[estado].etiqueta}</span>
                      <span className="font-bold tabular-nums" style={{ color: "var(--color-text)" }}>{n}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Tarjeta>

        {/* Quiénes vienen */}
        <Tarjeta titulo="Quiénes vienen" bajada="Pacientes activos por sexo y rango de edad."
          tabla={[...stats.pacientesPorSexo.map((s) => [SEXO[s.sexo] ?? s.sexo, s.total] as [string, number]), ...stats.pacientesPorEdad.map((e) => [`Edad ${e.rango}`, e.total] as [string, number])]}>
          {totalSexo === 0 ? <SinDatos /> : (
            <div className="space-y-5">
              <div className="space-y-2">
                {stats.pacientesPorSexo.map((s, i) => {
                  const escala = totalSexo > 60 ? Math.ceil(totalSexo / 60) : 1;
                  return (
                    <div key={s.sexo} className="flex items-center gap-3" {...tip(<>{SEXO[s.sexo] ?? s.sexo}: {s.total}</>)}>
                      <span className="w-20 text-sm" style={{ color: "var(--color-text)" }}>{SEXO[s.sexo] ?? s.sexo}</span>
                      <div className="flex flex-wrap gap-0.5 flex-1">
                        {Array.from({ length: Math.max(1, Math.round(s.total / escala)) }, (_, k) => <Personita key={k} color={CAT[i % CAT.length]} />)}
                      </div>
                      <span className="font-bold tabular-nums" style={{ color: "var(--color-text)" }}>{s.total}</span>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                {stats.pacientesPorEdad.map((e) => (
                  <div key={e.rango} className="flex items-center gap-3" {...tip(<>{e.rango}: {e.total}</>)}>
                    <span className="w-20 text-sm" style={{ color: "var(--color-text)" }}>{e.rango}</span>
                    <div className="flex-1 relative h-3">
                      <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: "var(--color-card-border)" }} />
                      <div className="absolute top-1/2 h-[2px] -translate-y-1/2" style={{ left: 0, width: `${(e.total / maxEdad) * 100}%`, background: CAT[0] }} />
                      <span className="absolute top-1/2 w-3 h-3 rounded-full -translate-y-1/2 -translate-x-1/2 ring-2 ring-white" style={{ left: `${(e.total / maxEdad) * 100}%`, background: CAT[0] }} />
                    </div>
                    <span className="font-bold tabular-nums w-6 text-right" style={{ color: "var(--color-text)" }}>{e.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Tarjeta>

        <Tarjeta titulo="Tipos de consulta" bajada="En el período elegido."
          tabla={stats.consultasPorTipo.map((c) => [TIPO_CONSULTA[c.tipo_consulta] ?? c.tipo_consulta, c.total])}>
          {segmentada(["primera_vez", "control", "seguimiento"].map((t) => ({ etiqueta: TIPO_CONSULTA[t], total: stats.consultasPorTipo.find((c) => c.tipo_consulta === t)?.total ?? 0 })).filter((f) => f.total > 0))}
        </Tarjeta>

        <Tarjeta titulo="Planes alimentarios" bajada="Estado actual de todos los planes."
          tabla={stats.planesPorEstado.map((p) => [ESTADO_PLAN[p.estado] ?? p.estado, p.total])}>
          {segmentada(["activo", "borrador", "vencido", "archivado"].map((e) => ({ etiqueta: ESTADO_PLAN[e], total: stats.planesPorEstado.find((p) => p.estado === e)?.total ?? 0 })).filter((f) => f.total > 0))}
        </Tarjeta>
      </div>
      {tipNodo}
    </div>
  );
}
