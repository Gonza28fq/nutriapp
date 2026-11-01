import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Edit, UserX, UserCheck, Phone, MessageCircle, Calendar, Hash, AlertTriangle,
  LayoutGrid, History, TrendingUp, PersonStanding, FileHeart, HeartPulse, Apple, ClipboardList,
} from "lucide-react";
import toast from "react-hot-toast";
import { pacienteService } from "@/services/paciente.service";
import { clinicaService, type Medicion, type Laboratorio, type PatologiaPaciente } from "@/services/clinica.service";
import { Cargando, Iniciales, PatologiaChip, Modal } from "@/components/ui";
import type { PacienteFicha } from "./paciente/tipos";
import TabResumen from "./paciente/TabResumen";
import TabSeguimiento from "./paciente/TabSeguimiento";
import TabProgreso from "./paciente/TabProgreso";
import TabCuerpo from "./paciente/TabCuerpo";
import TabEstudios from "./paciente/TabEstudios";
import { TabHistoria, TabAnamnesis, TabConsultas } from "./paciente/TabsClasicos";

const TABS = [
  { id: "resumen", label: "Resumen", icon: LayoutGrid },
  { id: "seguimiento", label: "Seguimiento", icon: History },
  { id: "progreso", label: "Progreso", icon: TrendingUp },
  { id: "cuerpo", label: "Cuerpo", icon: PersonStanding },
  { id: "estudios", label: "Estudios", icon: FileHeart },
  { id: "historia", label: "Historia clínica", icon: HeartPulse },
  { id: "anamnesis", label: "Anamnesis", icon: Apple },
  { id: "consultas", label: "Consultas", icon: ClipboardList },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function DetallePaciente() {
  const { id } = useParams();
  const pid = Number(id);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "resumen") as TabId;

  const [ficha, setFicha] = useState<PacienteFicha | null>(null);
  const [patologias, setPatologias] = useState<PatologiaPaciente[]>([]);
  const [progreso, setProgreso] = useState<{ mediciones: Medicion[]; laboratorios: Laboratorio[] }>({ mediciones: [], laboratorios: [] });
  const [confirmar, setConfirmar] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const cargarProgreso = useCallback(() => {
    clinicaService.progreso(pid).then(setProgreso).catch(() => {});
    clinicaService.patologiasDePaciente(pid).then(setPatologias).catch(() => {}); // el IMC puede cambiar las patologías
  }, [pid]);

  useEffect(() => {
    pacienteService.obtener(pid)
      .then(setFicha)
      .catch(() => { toast.error("No se pudo cargar el paciente"); navigate("/panel/pacientes"); });
    cargarProgreso();
  }, [pid, navigate, cargarProgreso]);

  if (!ficha) return <Cargando />;
  const p = ficha.paciente;
  const telefono = p.celular?.replace(/\D/g, "");

  const cambiarEstado = async () => {
    setProcesando(true);
    try {
      if (p.activo) {
        await pacienteService.desactivar(pid);
        toast.success("Paciente dado de baja");
        navigate("/panel/pacientes");
      } else {
        await pacienteService.reactivar(pid);
        toast.success("Paciente reactivado 💗");
        setFicha({ ...ficha, paciente: { ...p, activo: true } });
        setConfirmar(false);
      }
    } catch { toast.error("No se pudo actualizar el estado"); } finally { setProcesando(false); }
  };

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/panel/pacientes")} className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: "var(--color-primary)" }}>
        <ArrowLeft className="w-4 h-4" /> Pacientes
      </button>

      {/* ── Encabezado ── */}
      <section className="relative overflow-hidden rounded-[2rem] p-5 sm:p-6 bg-white border" style={{ borderColor: "var(--color-card-border)", boxShadow: "var(--shadow-soft)" }}>
        <div aria-hidden className="absolute -right-16 -top-16 w-56 h-56 rounded-full" style={{ background: "radial-gradient(circle, var(--color-primary-bg), transparent 70%)" }} />
        <div className="relative flex flex-col sm:flex-row gap-4 sm:items-center">
          <Iniciales nombre={p.nombre} apellido={p.apellido} id={p.id} tam="w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display font-bold text-2xl sm:text-3xl leading-tight" style={{ color: "var(--color-text)" }}>{p.nombre} {p.apellido}</h1>
              <span className="id-tag">paciente#{p.id}</span>
              {!p.activo && <span className="badge-dark">De baja</span>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
              {p.edad && <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{p.edad} años</span>}
              {p.dni && <span className="inline-flex items-center gap-1"><Hash className="w-3.5 h-3.5" />{p.dni}</span>}
              {p.celular && <a href={`tel:${p.celular}`} className="inline-flex items-center gap-1 hover:underline"><Phone className="w-3.5 h-3.5" />{p.celular}</a>}
            </div>
            {(patologias.length > 0 || (p.prioridad && p.prioridad !== "normal")) && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {p.prioridad && p.prioridad !== "normal" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={p.prioridad === "urgente" ? { background: "#fee2e2", color: "#b91c1c" } : { background: "var(--c-manteca-bg)", color: "#a16207" }}
                    title={p.motivo_prioridad}>
                    <AlertTriangle className="w-3 h-3" /> Prioridad {p.prioridad}
                  </span>
                )}
                {patologias.map((x) => (
                  <PatologiaChip key={x.patologia_id} nombre={x.nombre} sigla={x.sigla} color={x.color} grado={x.grado}
                    onClick={() => navigate(`/panel/patologias/${x.codigo}`)} />
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {telefono && (
              <a href={`https://wa.me/${telefono.startsWith("54") ? telefono : `549${telefono}`}`} target="_blank" rel="noreferrer"
                className="btn-soft text-sm py-2" title="Escribir por WhatsApp">
                <MessageCircle className="w-4 h-4" /> <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
            <button onClick={() => navigate(`/panel/pacientes/${pid}/editar`)} className="btn-soft text-sm py-2"><Edit className="w-4 h-4" /> <span className="hidden sm:inline">Editar</span></button>
            <button onClick={() => setConfirmar(true)} className="btn-soft text-sm py-2" title={p.activo ? "Dar de baja" : "Reactivar"}>
              {p.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </section>

      {/* ── Pestañas ── */}
      <nav className="tabs-pill sticky top-[4.5rem] sm:top-[4.75rem] z-10">
        {TABS.map(({ id: t, label, icon: Icon }) => (
          <button key={t} className="tab-pill" data-activo={tab === t} onClick={() => setParams({ tab: t }, { replace: true })}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </nav>

      <div key={tab} className="animate-entrada">
        {tab === "resumen" && <TabResumen ficha={ficha} patologias={patologias} setPatologias={setPatologias} {...progreso} />}
        {tab === "seguimiento" && <TabSeguimiento pacienteId={pid} />}
        {tab === "progreso" && <TabProgreso pacienteId={pid} {...progreso} recargar={cargarProgreso} />}
        {tab === "cuerpo" && <TabCuerpo pacienteId={pid} sexo={p.sexo} mediciones={progreso.mediciones} recargar={cargarProgreso} />}
        {tab === "estudios" && <TabEstudios pacienteId={pid} laboratorios={progreso.laboratorios} recargarProgreso={cargarProgreso} />}
        {tab === "historia" && <TabHistoria pacienteId={pid} historia={ficha.historiaClinica as Record<string, boolean | string | number | null> | null} />}
        {tab === "anamnesis" && <TabAnamnesis pacienteId={pid} anamnesis={ficha.anamnesis as Record<string, boolean | string | number | null> | null} />}
        {tab === "consultas" && <TabConsultas pacienteId={pid} />}
      </div>

      {confirmar && (
        <Modal titulo={p.activo ? "Dar de baja al paciente" : "Reactivar paciente"} onCerrar={() => setConfirmar(false)} ancho="max-w-md">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {p.activo
              ? `${p.nombre} ${p.apellido} va a quedar inactivo. Sus datos y su historial se conservan y se puede reactivar cuando quieras.`
              : `${p.nombre} ${p.apellido} vuelve a la lista de pacientes activos.`}
          </p>
          <div className="flex gap-2 justify-end mt-5">
            <button onClick={() => setConfirmar(false)} className="btn-soft">Cancelar</button>
            <button onClick={cambiarEstado} disabled={procesando} className="btn-primary">{procesando ? "…" : p.activo ? "Dar de baja" : "Reactivar"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
