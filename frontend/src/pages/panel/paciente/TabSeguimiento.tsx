import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Ruler, FlaskConical, FileHeart, UtensilsCrossed, CalendarDays, History } from "lucide-react";
import toast from "react-hot-toast";
import { clinicaService, type EventoSeguimiento, type Traza } from "@/services/clinica.service";
import { Cargando, Vacio } from "@/components/ui";
import { aFecha } from "@/utils/fecha";

const TIPOS: Record<EventoSeguimiento["tipo"], { etiqueta: string; icono: typeof Ruler; tono: string; bg: string }> = {
  consulta:    { etiqueta: "Consulta",    icono: ClipboardList,   tono: "var(--color-primary)", bg: "var(--color-primary-bg)" },
  medicion:    { etiqueta: "Medición",    icono: Ruler,           tono: "var(--c-lila)",        bg: "var(--c-lila-bg)" },
  laboratorio: { etiqueta: "Laboratorio", icono: FlaskConical,    tono: "var(--c-cielo)",       bg: "var(--c-cielo-bg)" },
  estudio:     { etiqueta: "Estudio",     icono: FileHeart,       tono: "var(--c-durazno)",     bg: "var(--c-durazno-bg)" },
  plan:        { etiqueta: "Plan",        icono: UtensilsCrossed, tono: "var(--c-menta)",       bg: "var(--c-menta-bg)" },
  turno:       { etiqueta: "Turno",       icono: CalendarDays,    tono: "var(--c-manteca)",     bg: "var(--c-manteca-bg)" },
};

const ACCION: Record<Traza["accion"], string> = { crear: "creó", editar: "editó", borrar: "borró", baja: "dio de baja", reactivar: "reactivó" };
const ENTIDAD: Record<string, string> = {
  paciente: "paciente", consulta: "consulta", medicion: "medición", laboratorio: "laboratorio", estudio: "estudio",
  patologia: "patología", historia_clinica: "historia clínica", anamnesis: "anamnesis", plan: "plan",
};

export default function TabSeguimiento({ pacienteId }: { pacienteId: number }) {
  const navigate = useNavigate();
  const [datos, setDatos] = useState<{ eventos: EventoSeguimiento[]; traza: Traza[] } | null>(null);
  const [filtro, setFiltro] = useState<EventoSeguimiento["tipo"] | "todos">("todos");
  const [verTraza, setVerTraza] = useState(false);

  useEffect(() => {
    clinicaService.seguimiento(pacienteId).then(setDatos).catch(() => toast.error("No se pudo cargar el seguimiento"));
  }, [pacienteId]);

  const porMes = useMemo(() => {
    const lista = (datos?.eventos ?? []).filter((e) => filtro === "todos" || e.tipo === filtro);
    const grupos = new Map<string, EventoSeguimiento[]>();
    for (const e of lista) {
      const clave = aFecha(e.fecha).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
      grupos.set(clave, [...(grupos.get(clave) ?? []), e]);
    }
    return [...grupos.entries()];
  }, [datos, filtro]);

  if (!datos) return <Cargando />;
  const presentes = new Set(datos.eventos.map((e) => e.tipo));

  const abrir = (e: EventoSeguimiento) => {
    if (e.tipo === "consulta") navigate(`/panel/consultas/${e.id}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button className="chip" data-activo={filtro === "todos"} onClick={() => setFiltro("todos")}>Todo · {datos.eventos.length}</button>
        {(Object.keys(TIPOS) as EventoSeguimiento["tipo"][]).filter((t) => presentes.has(t)).map((t) => (
          <button key={t} className="chip" data-activo={filtro === t} onClick={() => setFiltro(t)}>
            {TIPOS[t].etiqueta} · {datos.eventos.filter((e) => e.tipo === t).length}
          </button>
        ))}
      </div>

      <section className="panel-card">
        {porMes.length === 0 ? (
          <Vacio emoji="🗓️" titulo="Todavía no hay registros" texto="Las consultas, mediciones, estudios y planes van apareciendo acá en orden." />
        ) : porMes.map(([mes, eventos]) => (
          <div key={mes} className="mb-5 last:mb-0">
            <p className="text-xs font-bold uppercase tracking-wider mb-2 capitalize" style={{ color: "var(--color-primary)" }}>{mes}</p>
            <ol className="relative ml-4 border-l-2 border-dashed" style={{ borderColor: "var(--color-primary-border)" }}>
              {eventos.map((e) => {
                const t = TIPOS[e.tipo];
                const Icono = t.icono;
                return (
                  <li key={`${e.tipo}-${e.id}`} className="relative pl-7 pb-3 last:pb-0">
                    <span className="absolute -left-[1.05rem] top-0.5 w-8 h-8 rounded-xl flex items-center justify-center ring-4 ring-white"
                      style={{ background: t.bg, color: t.tono }}>
                      <Icono className="w-4 h-4" />
                    </span>
                    <button onClick={() => abrir(e)} disabled={e.tipo !== "consulta"}
                      className="w-full text-left p-3 rounded-2xl transition-colors enabled:hover:bg-[var(--color-cream-100)]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold" style={{ color: "var(--color-text)" }}>{e.titulo}</span>
                        <span className="id-tag">{e.tipo}#{e.id}</span>
                        <span className="text-xs font-semibold ml-auto" style={{ color: "var(--color-text-muted)" }}>
                          {aFecha(e.fecha).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
                        </span>
                      </div>
                      {e.detalle && <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{e.detalle}</p>}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </section>

      <section className="panel-card">
        <button onClick={() => setVerTraza((v) => !v)} className="w-full flex items-center gap-2 text-left">
          <History className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
          <span className="font-display font-bold text-lg flex-1" style={{ color: "var(--color-text)" }}>Traza de cambios</span>
          <span className="badge-rose">{datos.traza.length}</span>
          <span className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>{verTraza ? "Ocultar" : "Ver"}</span>
        </button>
        {verTraza && (
          datos.traza.length === 0 ? (
            <p className="text-sm mt-3" style={{ color: "var(--color-text-muted)" }}>Sin cambios registrados todavía.</p>
          ) : (
            <ul className="mt-3 divide-y" style={{ borderColor: "var(--color-card-border)" }}>
              {datos.traza.map((t) => (
                <li key={t.id} className="py-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
                  <span className="font-bold" style={{ color: "var(--color-text)" }}>{t.usuario ?? "Sistema"}</span>
                  <span style={{ color: "var(--color-text-muted)" }}>{ACCION[t.accion]} {ENTIDAD[t.entidad] ?? t.entidad}</span>
                  {t.entidad_id && <span className="id-tag">{t.entidad}#{t.entidad_id}</span>}
                  <span className="text-xs ml-auto tabular-nums" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(t.creado_en).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {t.resumen && <p className="w-full text-xs" style={{ color: "var(--color-text-muted)" }}>{t.resumen}</p>}
                </li>
              ))}
            </ul>
          )
        )}
      </section>
    </div>
  );
}
