import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Heart, Apple, ClipboardList,
  Edit, Phone, Mail, MapPin, Calendar, Hash, UserX, AlertTriangle
} from "lucide-react";
import { pacienteService } from "@/services/paciente.service";
import { consultaService } from "@/services/consulta.service";
import toast from "react-hot-toast";

interface PacienteDetalle {
  paciente: {
    id: number; nombre: string; apellido: string; dni?: string;
    fecha_nacimiento?: string; edad?: number; sexo?: string; email?: string;
    celular?: string; domicilio?: string; localidad?: string; derivado_por?: string;
    observaciones_generales?: string; activo: boolean; creado_en: string;
  };
  historiaClinica: Record<string, unknown> | null;
  anamnesis: Record<string, unknown> | null;
}

interface ConsultaItem {
  id: number; fecha: string; tipo_consulta: string; sede_nombre?: string;
  proximo_control?: string; motivo_consulta?: string; observaciones?: string; indicaciones?: string;
}

const tabs = [
  { id: "datos",     label: "Datos personales", icon: User },
  { id: "historia",  label: "Historia clinica",  icon: Heart },
  { id: "anamnesis", label: "Anamnesis",          icon: Apple },
  { id: "consultas", label: "Consultas",          icon: ClipboardList },
];

function ModalConfirmacion({ titulo, descripcion, labelConfirmar, variante, onConfirmar, onCancelar, cargando }: {
  titulo: string; descripcion: string; labelConfirmar: string;
  variante: "danger" | "warning"; onConfirmar: () => void; onCancelar: () => void; cargando: boolean;
}) {
  const colores = variante === "danger"
    ? { bg: "#fef2f2", border: "#fecaca", btn: "#dc2626", icon: "#dc2626" }
    : { bg: "#fffbeb", border: "#fde68a", btn: "#d97706", icon: "#d97706" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" style={{ background: "var(--color-card-bg)" }}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: colores.bg, border: `1px solid ${colores.border}` }}>
              <AlertTriangle className="w-6 h-6" style={{ color: colores.icon }} />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold" style={{ color: "var(--color-text)" }}>{titulo}</h3>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{descripcion}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onCancelar} disabled={cargando}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "var(--color-card-border)", color: "var(--color-text)" }}>
            Cancelar
          </button>
          <button onClick={onConfirmar} disabled={cargando}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
            style={{ background: colores.btn }}>
            {cargando ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DetallePaciente() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [data, setData]           = useState<PacienteDetalle | null>(null);
  const [cargando, setCargando]   = useState(true);
  const [tabActiva, setTabActiva] = useState("datos");
  const [consultas, setConsultas] = useState<ConsultaItem[]>([]);
  const [cargandoConsultas, setCargandoConsultas] = useState(false);
  const [modalBaja, setModalBaja]   = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    pacienteService.obtener(Number(id))
      .then(setData)
      .catch(() => { toast.error("Error al cargar el paciente"); navigate("/panel/pacientes"); })
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => {
    if (tabActiva !== "consultas") return;
    setCargandoConsultas(true);
    consultaService.porPaciente(Number(id))
      .then(res => setConsultas(res.consultas as ConsultaItem[]))
      .catch(() => toast.error("Error al cargar consultas"))
      .finally(() => setCargandoConsultas(false));
  }, [tabActiva, id]);

  const handleDarDeBaja = async () => {
    try {
      setProcesando(true);
      await pacienteService.desactivar(Number(id));
      toast.success("Paciente dado de baja correctamente");
      navigate("/panel/pacientes");
    } catch { toast.error("Error al dar de baja el paciente"); }
    finally { setProcesando(false); setModalBaja(false); }
  };

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
    </div>
  );

  if (!data) return null;
  const { paciente } = data;
  const anamnesis = data.anamnesis
    ? Object.fromEntries(Object.entries(data.anamnesis).map(([k, v]) => [k, v === 1 ? true : v === 0 ? false : v])) as Record<string, boolean | string | null>
    : null;
  const historiaClinica = data.historiaClinica
    ? Object.fromEntries(Object.entries(data.historiaClinica).map(([k, v]) => [k, v === 1 ? true : v === 0 ? false : v])) as Record<string, boolean | string | null>
    : null;
  const iniciales = `${paciente.nombre.charAt(0)}${paciente.apellido.charAt(0)}`.toUpperCase();

  const tipoConfig: Record<string, { label: string; color: string; bg: string }> = {
    primera_vez: { label: "Primera vez", color: "var(--color-primary)",       bg: "var(--color-primary-bg)" },
    control:     { label: "Control",     color: "var(--color-text-muted)",    bg: "var(--color-cream-100)" },
    seguimiento: { label: "Seguimiento", color: "var(--color-primary-muted)", bg: "var(--color-cream-100)" },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/panel/pacientes")}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-display text-2xl font-bold" style={{ color: "var(--color-text)" }}>
          Ficha del paciente
        </h1>
      </div>

      {/* Card paciente */}
      <div className="rounded-2xl p-6 flex items-center gap-5"
        style={{ background: `linear-gradient(135deg, var(--color-sidebar-from) 0%, var(--color-sidebar-to) 100%)` }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
          style={{ background: "var(--color-primary)" }}>
          {iniciales}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-2xl font-bold text-white">
            {paciente.apellido}, {paciente.nombre}
          </h2>
          <div className="flex flex-wrap gap-3 mt-2">
            {paciente.edad && <span className="flex items-center gap-1 text-sm text-white/60"><Calendar className="w-3.5 h-3.5" /> {paciente.edad} años</span>}
            {paciente.dni && <span className="flex items-center gap-1 text-sm text-white/60"><Hash className="w-3.5 h-3.5" /> {paciente.dni}</span>}
            {paciente.celular && <span className="flex items-center gap-1 text-sm text-white/60"><Phone className="w-3.5 h-3.5" /> {paciente.celular}</span>}
            {paciente.email && <span className="flex items-center gap-1 text-sm text-white/60"><Mail className="w-3.5 h-3.5" /> {paciente.email}</span>}
            {paciente.localidad && <span className="flex items-center gap-1 text-sm text-white/60"><MapPin className="w-3.5 h-3.5" /> {paciente.localidad}</span>}
            {(paciente as any).prioridad && (paciente as any).prioridad !== "normal" && (
              <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl w-fit"
                style={{
                  background: (paciente as any).prioridad === "urgente" ? "rgba(220,38,38,0.2)" : "rgba(217,119,6,0.2)",
                  border: `1px solid ${(paciente as any).prioridad === "urgente" ? "rgba(220,38,38,0.4)" : "rgba(217,119,6,0.4)"}`,
                }}>
                <span className="text-xs font-semibold"
                  style={{ color: (paciente as any).prioridad === "urgente" ? "#fca5a5" : "#fcd34d" }}>
                  ⚠ Prioridad {(paciente as any).prioridad === "urgente" ? "Urgente" : "Alta"}
                  {(paciente as any).motivo_prioridad && ` — ${(paciente as any).motivo_prioridad}`}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
          <button onClick={() => navigate(`/panel/pacientes/${id}/editar`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Editar</span>
          </button>
          <button onClick={() => setModalBaja(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}>
            <UserX className="w-4 h-4" />
            <span className="hidden sm:inline">Dar de baja</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto" style={{ background: "var(--color-primary-bg)" }}>
        {tabs.map(({ id: tabId, label, icon: Icon }) => (
          <button key={tabId} onClick={() => setTabActiva(tabId)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center"
            style={tabActiva === tabId
              ? { background: "var(--color-primary)", color: "white" }
              : { color: "var(--color-text-muted)" }}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Datos */}
      {tabActiva === "datos" && (
        <div className="panel-card">
          <h3 className="font-display text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>Datos personales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Nombre completo", valor: `${paciente.nombre} ${paciente.apellido}` },
              { label: "DNI",             valor: paciente.dni },
              { label: "Fecha de nacimiento", valor: paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString("es-AR") : undefined },
              { label: "Edad",    valor: paciente.edad ? `${paciente.edad} años` : undefined },
              { label: "Sexo",    valor: paciente.sexo },
              { label: "Celular", valor: paciente.celular },
              { label: "Email",   valor: paciente.email },
              { label: "Domicilio", valor: paciente.domicilio },
              { label: "Localidad", valor: paciente.localidad },
              { label: "Derivado por", valor: paciente.derivado_por },
            ].map(({ label, valor }) => valor ? (
              <div key={label} className="p-3 rounded-xl" style={{ background: "var(--color-cream-100)" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                <p className="text-sm font-medium capitalize" style={{ color: "var(--color-text)" }}>{valor}</p>
              </div>
            ) : null)}
          </div>
          {paciente.observaciones_generales && (
            <div className="mt-4 p-3 rounded-xl" style={{ background: "var(--color-cream-100)" }}>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Observaciones</p>
              <p className="text-sm" style={{ color: "var(--color-text)" }}>{paciente.observaciones_generales}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Historia */}
      {tabActiva === "historia" && (
        <div className="panel-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>Historia clinica</h3>
            {historiaClinica && (
              <button onClick={() => navigate(`/panel/pacientes/${id}/historia-clinica`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
                <Edit className="w-4 h-4" /> Editar
              </button>
            )}
          </div>
          {historiaClinica ? (
            <div className="space-y-4">
              {[
                { titulo: "Antecedentes familiares", items: [
                  { key: "antec_familiar_diabetes", label: "Diabetes" },
                  { key: "antec_familiar_hipertension", label: "Hipertension" },
                  { key: "antec_familiar_dislipemia", label: "Dislipemia" },
                  { key: "antec_familiar_obesidad", label: "Obesidad" },
                ]},
                { titulo: "Patologias", items: [
                  { key: "tiene_diabetes_1", label: "Diabetes tipo 1" }, { key: "tiene_diabetes_2", label: "Diabetes tipo 2" },
                  { key: "tiene_hipertension", label: "Hipertension" }, { key: "tiene_dislipemia", label: "Dislipemia" },
                  { key: "tiene_celiaquia", label: "Celiaquia" }, { key: "tiene_hipotiroidismo", label: "Hipotiroidismo" },
                  { key: "tiene_anemia", label: "Anemia" }, { key: "tiene_osteoporosis", label: "Osteoporosis" },
                ]},
                { titulo: "Habitos", items: [
                  { key: "fuma", label: "Fuma" }, { key: "duerme_bien", label: "Duerme bien" },
                  { key: "presenta_ronquidos", label: "Ronquidos" }, { key: "inflamacion_abdominal", label: "Inflamacion abdominal" },
                ]},
              ].map(({ titulo, items }) => (
                <div key={titulo}>
                  <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-primary)" }}>{titulo}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.filter(({ key }) => historiaClinica[key]).map(({ label }) => (
                      <span key={label} className="badge-rose">{label}</span>
                    ))}
                    {!items.some(({ key }) => historiaClinica[key]) && (
                      <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>Ninguno</span>
                    )}
                  </div>
                </div>
              ))}
              <div>
                <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-primary)" }}>Diagnostico y objetivos</p>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl" style={{ background: "var(--color-cream-100)" }}>
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Diagnostico inicial</p>
                    <p className="text-sm" style={{ color: "var(--color-text)" }}>{(historiaClinica.diagnostico_inicial as string) || "Sin datos"}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: "var(--color-cream-100)" }}>
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Objetivos iniciales</p>
                    <p className="text-sm" style={{ color: "var(--color-text)" }}>{(historiaClinica.objetivos_iniciales as string) || "Sin datos"}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-primary-border)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Todavia no hay historia clinica cargada</p>
              <button onClick={() => navigate(`/panel/pacientes/${id}/historia-clinica`)} className="btn-primary mt-4 text-sm">
                Cargar historia clinica
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Anamnesis */}
      {tabActiva === "anamnesis" && (
        <div className="panel-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>Anamnesis alimentaria</h3>
            {anamnesis && (
              <button onClick={() => navigate(`/panel/pacientes/${id}/anamnesis`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
                <Edit className="w-4 h-4" /> Editar
              </button>
            )}
          </div>
          {anamnesis ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-primary)" }}>Comidas del dia</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Desayuno", realiza: "realiza_desayuno", horario: "horario_desayuno" },
                    { label: "Almuerzo", realiza: "realiza_almuerzo", horario: "horario_almuerzo" },
                    { label: "Merienda", realiza: "realiza_merienda", horario: "horario_merienda" },
                    { label: "Cena",     realiza: "realiza_cena",     horario: "horario_cena" },
                  ].map(({ label, realiza, horario }) => (
                    <div key={label} className="p-3 rounded-xl text-center"
                      style={{
                        background: anamnesis[realiza] ? "var(--color-primary-bg)" : "#f5f5f5",
                        border: `1px solid ${anamnesis[realiza] ? "var(--color-primary-border)" : "#e5e5e5"}`
                      }}>
                      <p className="text-xs font-medium mb-1" style={{ color: anamnesis[realiza] ? "var(--color-primary)" : "#999" }}>{label}</p>
                      <p className="text-sm font-semibold" style={{ color: anamnesis[realiza] ? "var(--color-text)" : "#bbb" }}>
                        {anamnesis[realiza] ? (anamnesis[horario] as string || "Si") : "No"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              {anamnesis.liquidos_consumo_diario && (
                <div>
                  <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-primary)" }}>Liquidos</p>
                  <p className="text-sm p-3 rounded-xl" style={{ background: "var(--color-cream-100)", color: "var(--color-text)" }}>
                    {anamnesis.liquidos_consumo_diario as string}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Apple className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-primary-border)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Todavia no hay anamnesis cargada</p>
              <button onClick={() => navigate(`/panel/pacientes/${id}/anamnesis`)} className="btn-primary mt-4 text-sm">
                Cargar anamnesis
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Consultas */}
      {tabActiva === "consultas" && (
        <div className="panel-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>Historial de consultas</h3>
            <button onClick={() => navigate(`/panel/pacientes/${id}/consulta/nueva`)} className="btn-primary text-sm flex items-center gap-2">
              + Nueva consulta
            </button>
          </div>
          {cargandoConsultas ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
            </div>
          ) : consultas.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-primary-border)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Todavia no hay consultas registradas</p>
              <button onClick={() => navigate(`/panel/pacientes/${id}/consulta/nueva`)} className="btn-primary mt-4 text-sm">
                Registrar consulta
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {consultas.map((c) => {
                const tipo = tipoConfig[c.tipo_consulta] ?? tipoConfig.control;
                return (
                  <div key={c.id} className="p-4 rounded-xl"
                    style={{ background: "var(--color-cream-100)", border: "1px solid var(--color-card-border)" }}>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
                          {new Date(c.fecha.includes("T") ? c.fecha : c.fecha + "T12:00:00").toLocaleDateString("es-AR", {
                            day: "numeric", month: "long", year: "numeric"
                          })}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: tipo.bg, color: tipo.color }}>
                          {tipo.label}
                        </span>
                        {c.sede_nombre && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>· {c.sede_nombre}</span>}
                      </div>
                      {c.proximo_control && (
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          Próximo: {new Date(c.proximo_control.includes("T") ? c.proximo_control : c.proximo_control + "T12:00:00").toLocaleDateString("es-AR")}
                        </span>
                      )}
                    </div>
                    {c.motivo_consulta && <p className="text-sm mt-1" style={{ color: "var(--color-text)" }}><span className="font-medium">Motivo:</span> {c.motivo_consulta}</p>}
                    {c.observaciones && <p className="text-sm mt-1" style={{ color: "var(--color-text)" }}><span className="font-medium">Observaciones:</span> {c.observaciones}</p>}
                    {c.indicaciones && <p className="text-sm mt-1" style={{ color: "var(--color-text)" }}><span className="font-medium">Indicaciones:</span> {c.indicaciones}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {modalBaja && (
        <ModalConfirmacion
          titulo="Dar de baja al paciente"
          descripcion={`¿Dar de baja a ${paciente.nombre} ${paciente.apellido}? El paciente quedará inactivo pero sus datos se conservan.`}
          labelConfirmar="Dar de baja" variante="warning"
          onConfirmar={handleDarDeBaja} onCancelar={() => setModalBaja(false)} cargando={procesando} />
      )}
    </div>
  );
}