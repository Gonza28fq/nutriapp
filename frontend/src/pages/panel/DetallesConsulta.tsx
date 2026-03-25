import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Calendar, MapPin, ClipboardList,
  Activity, Scale, Heart, Target, BookOpen,
  ChevronRight, Trash2, AlertTriangle, User
} from "lucide-react";
import { consultaService } from "@/services/consulta.service";
import toast from "react-hot-toast";

interface Medicion {
  peso_kg?: number;
  talla_cm?: number;
  imc?: number;
  clasificacion_imc?: string;
  circunferencia_cintura_cm?: number;
  circunferencia_cadera_cm?: number;
  porcentaje_masa_grasa?: number;
  porcentaje_masa_magra?: number;
  presion_sistolica?: number;
  presion_diastolica?: number;
  frecuencia_cardiaca?: number;
  peso_habitual_kg?: number;
  peso_posible_kg?: number;
}

interface ConsultaDetalle {
  id: number;
  paciente_id: number;
  paciente_nombre?: string;
  paciente_apellido?: string;
  fecha: string;
  tipo_consulta: string;
  sede_nombre?: string;
  motivo_consulta?: string;
  problemas?: string;
  objetivos?: string;
  observaciones?: string;
  indicaciones?: string;
  proximo_control?: string;
  medicion?: Medicion;
}

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  primera_vez: { label: "Primera vez", color: "var(--color-primary)", bg: "var(--color-primary-bg)" },
  control:     { label: "Control",     color: "#16a34a",              bg: "#f0fdf4" },
  seguimiento: { label: "Seguimiento", color: "#d97706",              bg: "#fffbeb" },
};

const IMC_CONFIG: Record<string, { color: string; bg: string }> = {
  "Bajo peso":   { color: "#2563eb", bg: "#eff6ff" },
  "Normal":      { color: "#16a34a", bg: "#f0fdf4" },
  "Sobrepeso":   { color: "#d97706", bg: "#fffbeb" },
  "Obesidad I":  { color: "#ea580c", bg: "#fff7ed" },
  "Obesidad II": { color: "#dc2626", bg: "#fef2f2" },
  "Obesidad III":{ color: "#7f1d1d", bg: "#fef2f2" },
};

function Dato({ label, valor, fullWidth = false }: { label: string; valor?: string | number | null; fullWidth?: boolean }) {
  if (valor === null || valor === undefined || valor === "") return null;
  return (
    <div className={`p-3 rounded-xl ${fullWidth ? "col-span-2" : ""}`}
      style={{ background: "var(--color-cream-100)" }}>
      <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{valor}</p>
    </div>
  );
}

function Seccion({ icon: Icon, titulo, children }: {
  icon: React.ComponentType<any>; titulo: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>{titulo}</p>
      </div>
      {children}
    </div>
  );
}

function ModalConfirm({ titulo, descripcion, onConfirmar, onCancelar, cargando }: {
  titulo: string; descripcion: string; onConfirmar: () => void; onCancelar: () => void; cargando: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="rounded-3xl w-full max-w-sm shadow-2xl" style={{ background: "var(--color-card-bg)" }}>
        <div className="p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#fef2f2" }}>
            <AlertTriangle className="w-6 h-6" style={{ color: "#dc2626" }} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold" style={{ color: "var(--color-text)" }}>{titulo}</h3>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{descripcion}</p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onCancelar} disabled={cargando} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
            Cancelar
          </button>
          <button onClick={onConfirmar} disabled={cargando}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center"
            style={{ background: "#dc2626" }}>
            {cargando
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DetalleConsulta() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [consulta, setConsulta]     = useState<ConsultaDetalle | null>(null);
  const [cargando, setCargando]     = useState(true);
  const [modalElim, setModalElim]   = useState(false);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    consultaService.obtener(Number(id))
      .then(data => setConsulta(data as ConsultaDetalle))
      .catch(() => { toast.error("Error al cargar la consulta"); navigate("/panel/consultas"); })
      .finally(() => setCargando(false));
  }, [id]);

  const handleEliminar = async () => {
    try {
      setEliminando(true);
      await consultaService.eliminar(Number(id));
      toast.success("Consulta eliminada");
      navigate("/panel/consultas");
    } catch {
      toast.error("Error al eliminar la consulta");
    } finally {
      setEliminando(false);
      setModalElim(false);
    }
  };

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
    </div>
  );

  if (!consulta) return null;

  const tipo    = TIPO_CONFIG[consulta.tipo_consulta] ?? TIPO_CONFIG.control;
  const med     = consulta.medicion;
  const imcCfg  = consulta.medicion?.clasificacion_imc
    ? IMC_CONFIG[consulta.medicion.clasificacion_imc] ?? { color: "#6b7280", bg: "#f9fafb" }
    : null;

  const formatFecha = (f: string) =>
    new Date(f.includes("T") ? f : f + "T12:00:00")
      .toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/panel/consultas")}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: "var(--color-text)" }}>
              Detalle de consulta
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {formatFecha(consulta.fecha)}
            </p>
          </div>
        </div>
        <button onClick={() => setModalElim(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
          style={{ color: "#dc2626", border: "1px solid #fecaca" }}>
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Eliminar</span>
        </button>
      </div>

      {/* Card paciente + info general */}
      <div className="panel-card space-y-4">
        {/* Paciente */}
        <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid var(--color-card-border)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ background: "var(--color-primary)" }}>
            {consulta.paciente_apellido && consulta.paciente_nombre
              ? `${consulta.paciente_apellido.charAt(0)}${consulta.paciente_nombre.charAt(0)}`.toUpperCase()
              : <User className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: "var(--color-text)" }}>
              {consulta.paciente_apellido && consulta.paciente_nombre
                ? `${consulta.paciente_apellido}, ${consulta.paciente_nombre}`
                : `Paciente #${consulta.paciente_id}`}
            </p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                style={{ background: tipo.bg, color: tipo.color }}>
                {tipo.label}
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                <Calendar className="w-3 h-3" />{formatFecha(consulta.fecha)}
              </span>
              {consulta.sede_nombre && (
                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <MapPin className="w-3 h-3" />{consulta.sede_nombre}
                </span>
              )}
            </div>
          </div>
          {/* Ir a ficha del paciente */}
          <button onClick={() => navigate(`/panel/pacientes/${consulta.paciente_id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--color-primary-border)")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--color-primary-bg)")}>
            Ver ficha <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Datos clínicos */}
        <div className="space-y-5">
          {consulta.motivo_consulta && (
            <Seccion icon={ClipboardList} titulo="Motivo de consulta">
              <p className="text-sm p-3 rounded-xl" style={{ background: "var(--color-cream-100)", color: "var(--color-text)" }}>
                {consulta.motivo_consulta}
              </p>
            </Seccion>
          )}

          {consulta.problemas && (
            <Seccion icon={AlertTriangle} titulo="Problemas identificados">
              <p className="text-sm p-3 rounded-xl" style={{ background: "var(--color-cream-100)", color: "var(--color-text)" }}>
                {consulta.problemas}
              </p>
            </Seccion>
          )}

          {consulta.objetivos && (
            <Seccion icon={Target} titulo="Objetivos">
              <p className="text-sm p-3 rounded-xl" style={{ background: "var(--color-cream-100)", color: "var(--color-text)" }}>
                {consulta.objetivos}
              </p>
            </Seccion>
          )}

          {consulta.observaciones && (
            <Seccion icon={BookOpen} titulo="Observaciones">
              <p className="text-sm p-3 rounded-xl" style={{ background: "var(--color-cream-100)", color: "var(--color-text)" }}>
                {consulta.observaciones}
              </p>
            </Seccion>
          )}

          {consulta.indicaciones && (
            <Seccion icon={ClipboardList} titulo="Indicaciones">
              <p className="text-sm p-3 rounded-xl" style={{ background: "var(--color-cream-100)", color: "var(--color-text)" }}>
                {consulta.indicaciones}
              </p>
            </Seccion>
          )}

          {consulta.proximo_control && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "var(--color-primary-bg)", border: "1px solid var(--color-primary-border)" }}>
              <Calendar className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
                Próximo control: {formatFecha(consulta.proximo_control)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mediciones */}
      {med && Object.keys(med).length > 0 && (
        <div className="panel-card space-y-5">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
            <h3 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Mediciones
            </h3>
          </div>

          {/* IMC destacado */}
          {med.imc && imcCfg && (
            <div className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: imcCfg.bg, border: `1px solid ${imcCfg.color}33` }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "white" }}>
                <Scale className="w-6 h-6" style={{ color: imcCfg.color }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: imcCfg.color }}>IMC</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-bold text-2xl" style={{ color: imcCfg.color }}>{med.imc}</span>
                  <span className="text-sm font-medium px-2 py-0.5 rounded-lg"
                    style={{ background: "white", color: imcCfg.color }}>
                    {med.clasificacion_imc}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Antropometría */}
          <Seccion icon={Activity} titulo="Antropometría">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Dato label="Peso"    valor={med.peso_kg    ? `${med.peso_kg} kg`   : null} />
              <Dato label="Talla"   valor={med.talla_cm   ? `${med.talla_cm} cm`  : null} />
              <Dato label="Cintura" valor={med.circunferencia_cintura_cm ? `${med.circunferencia_cintura_cm} cm` : null} />
              <Dato label="Cadera"  valor={med.circunferencia_cadera_cm  ? `${med.circunferencia_cadera_cm} cm`  : null} />
              <Dato label="Masa grasa" valor={med.porcentaje_masa_grasa ? `${med.porcentaje_masa_grasa}%` : null} />
              <Dato label="Masa magra" valor={med.porcentaje_masa_magra ? `${med.porcentaje_masa_magra}%` : null} />
              {med.circunferencia_cintura_cm && med.circunferencia_cadera_cm && (
                <Dato label="Relación cin/cad"
                  valor={(med.circunferencia_cintura_cm / med.circunferencia_cadera_cm).toFixed(2)} />
              )}
            </div>
          </Seccion>

          {/* Signos vitales */}
          {(med.presion_sistolica || med.presion_diastolica || med.frecuencia_cardiaca) && (
            <Seccion icon={Heart} titulo="Signos vitales">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Dato label="Presión sistólica"  valor={med.presion_sistolica  ? `${med.presion_sistolica} mmHg`  : null} />
                <Dato label="Presión diastólica" valor={med.presion_diastolica ? `${med.presion_diastolica} mmHg` : null} />
                <Dato label="Frec. cardíaca"     valor={med.frecuencia_cardiaca ? `${med.frecuencia_cardiaca} lpm` : null} />
                {med.presion_sistolica && med.presion_diastolica && (
                  <Dato label="Presión arterial"
                    valor={`${med.presion_sistolica}/${med.presion_diastolica} mmHg`} />
                )}
              </div>
            </Seccion>
          )}

          {/* Pesos de referencia */}
          {(med.peso_habitual_kg || med.peso_posible_kg) && (
            <Seccion icon={Scale} titulo="Pesos de referencia">
              <div className="grid grid-cols-2 gap-3">
                <Dato label="Peso habitual" valor={med.peso_habitual_kg ? `${med.peso_habitual_kg} kg` : null} />
                <Dato label="Peso posible"  valor={med.peso_posible_kg  ? `${med.peso_posible_kg} kg`  : null} />
                {med.peso_kg && med.peso_posible_kg && (
                  <Dato label="Diferencia al objetivo"
                    valor={`${(med.peso_kg - med.peso_posible_kg).toFixed(1)} kg`} />
                )}
              </div>
            </Seccion>
          )}
        </div>
      )}

      {modalElim && (
        <ModalConfirm
          titulo="Eliminar consulta"
          descripcion="¿Eliminar esta consulta? Esta acción no se puede deshacer."
          onConfirmar={handleEliminar}
          onCancelar={() => setModalElim(false)}
          cargando={eliminando} />
      )}
    </div>
  );
}