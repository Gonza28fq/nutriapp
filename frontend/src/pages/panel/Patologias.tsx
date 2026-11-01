import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Search, Info, Plus } from "lucide-react";
import ModalNuevaPatologia from "@/components/ModalNuevaPatologia";
import toast from "react-hot-toast";
import { clinicaService, type Patologia, type PacienteConPatologia } from "@/services/clinica.service";
import { Cargando, Vacio, Iniciales, OrigenBadge } from "@/components/ui";
import { fechaCorta } from "@/utils/fecha";

const CATEGORIA: Record<Patologia["categoria"], string> = {
  peso: "Peso", metabolica: "Metabólica", cardiovascular: "Cardiovascular",
  digestiva: "Digestiva", endocrina: "Endocrina", otra: "Otra",
};

export default function Patologias() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const [catalogo, setCatalogo] = useState<Patologia[] | null>(null);
  const [pacientes, setPacientes] = useState<PacienteConPatologia[] | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [nueva, setNueva] = useState(false);
  const cargarCatalogo = () => clinicaService.patologias().then(setCatalogo).catch(() => toast.error("No se pudieron cargar las patologías"));

  useEffect(() => { cargarCatalogo(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Si no se eligió ninguna, abrir la primera que tenga pacientes
  const seleccion = codigo ?? catalogo?.find((p) => p.pacientes > 0)?.codigo ?? catalogo?.[0]?.codigo;
  const actual = catalogo?.find((p) => p.codigo === seleccion);

  useEffect(() => {
    if (!seleccion) return;
    setPacientes(null);
    setBusqueda("");
    clinicaService.pacientesConPatologia(seleccion).then(setPacientes).catch(() => toast.error("No se pudo cargar la lista"));
  }, [seleccion]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (!q || !pacientes) return pacientes;
    return pacientes.filter((p) => `${p.nombre} ${p.apellido}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q));
  }, [pacientes, busqueda]);

  if (!catalogo) return <Cargando />;
  const totalConAlguna = catalogo.reduce((s, p) => s + p.pacientes, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <h1 className="page-title">Patologías</h1>
          <p className="page-sub">Pacientes activos agrupados por patología. Sobrepeso y obesidad se calculan solos con el último IMC.</p>
        </div>
        <button onClick={() => setNueva(true)} className="btn-primary self-start sm:self-auto"><Plus className="w-4 h-4" /> Nueva patología</button>
      </div>

      {nueva && <ModalNuevaPatologia onCerrar={() => setNueva(false)}
        onCreada={(p) => { setNueva(false); cargarCatalogo(); navigate(`/panel/patologias/${p.codigo}`); }} />}

      {/* Tarjetas por patología */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {catalogo.map((p, i) => {
          const activa = p.codigo === seleccion;
          const c = p.color || "var(--color-primary)";
          return (
            <button key={p.id} onClick={() => navigate(`/panel/patologias/${p.codigo}`)}
              className="relative text-left p-4 rounded-3xl border transition-all hover:-translate-y-0.5 animate-pop overflow-hidden"
              style={{
                animationDelay: `${i * 30}ms`,
                background: activa ? `linear-gradient(140deg, color-mix(in srgb, ${c} 18%, white), white)` : "white",
                borderColor: activa ? c : "var(--color-card-border)",
                boxShadow: activa ? `0 12px 26px -14px ${c}` : "var(--shadow-soft)",
              }}>
              <span className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-25" style={{ background: c }} />
              <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wide" style={{ color: `color-mix(in srgb, ${c} 75%, #3b1530)` }}>
                <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                {p.sigla || CATEGORIA[p.categoria]}
              </span>
              <p className="font-display font-bold text-[1.05rem] mt-1 leading-tight" style={{ color: "var(--color-text)" }}>{p.nombre}</p>
              <p className="mt-2 text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
                <span className="font-display text-2xl font-bold mr-1" style={{ color: p.pacientes ? "var(--color-text)" : "var(--color-cream-300)" }}>{p.pacientes}</span>
                {p.pacientes === 1 ? "paciente" : "pacientes"}
              </p>
            </button>
          );
        })}
      </div>

      {/* Lista de la patología elegida */}
      {actual && (
        <section className="panel-card">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex-1">
              <h2 className="font-display font-bold text-xl" style={{ color: "var(--color-text)" }}>
                {actual.nombre} <span className="text-base font-semibold" style={{ color: "var(--color-text-muted)" }}>· {actual.pacientes}</span>
              </h2>
              {actual.categoria === "peso" && (
                <p className="text-xs flex items-center gap-1 mt-1" style={{ color: "var(--color-text-muted)" }}>
                  <Info className="w-3.5 h-3.5" /> Sobrepeso: IMC 25–29,9 · Obesidad I: 30–34,9 · II: 35–39,9 · III: 40 o más
                </p>
              )}
            </div>
            <div className="relative sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar en la lista…" className="input-base pl-9" />
            </div>
          </div>

          {!filtrados ? <Cargando alto="h-32" /> : filtrados.length === 0 ? (
            <Vacio emoji={busqueda ? "🔎" : "💗"} titulo={busqueda ? "Sin coincidencias" : "Nadie por acá"}
              texto={busqueda ? "Probá con otro nombre." : `No hay pacientes activos con ${actual.nombre.toLowerCase()}.`} />
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--color-card-border)" }}>
              {filtrados.map((p) => (
                <li key={p.id}>
                  <button onClick={() => navigate(`/panel/pacientes/${p.id}`)}
                    className="w-full flex items-center gap-3 py-3 px-2 -mx-2 rounded-2xl text-left transition-colors hover:bg-[var(--color-cream-100)]">
                    <Iniciales nombre={p.nombre} apellido={p.apellido} id={p.id} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ color: "var(--color-text)" }}>
                        {p.apellido}, {p.nombre} <span className="id-tag ml-1">#{p.id}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {p.grado && <span className="badge-fucsia">{p.grado}</span>}
                        <OrigenBadge origen={p.origen} />
                        {p.edad && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{p.edad} años</span>}
                      </div>
                    </div>
                    {p.imc && (
                      <div className="text-right hidden sm:block">
                        <p className="font-display font-bold text-lg leading-none" style={{ color: "var(--color-text)" }}>{Number(p.imc).toFixed(1)}</p>
                        <p className="text-[0.7rem] font-semibold" style={{ color: "var(--color-text-muted)" }}>
                          IMC{p.ultima_medicion ? ` · ${fechaCorta(p.ultima_medicion)}` : ""}
                        </p>
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-primary-light)" }} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {totalConAlguna === 0 && (
        <p className="text-sm text-center" style={{ color: "var(--color-text-muted)" }}>
          Las patologías aparecen cuando se cargan en la historia clínica, en la ficha del paciente o con una medición de IMC.
        </p>
      )}
    </div>
  );
}
