import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Heart } from "lucide-react";
import { pacienteService } from "@/services/paciente.service";
import toast from "react-hot-toast";

interface FormHC {
  antec_familiar_diabetes:      boolean;
  antec_familiar_hipertension:  boolean;
  antec_familiar_dislipemia:    boolean;
  antec_familiar_obesidad:      boolean;
  antec_familiar_otros:         string;
  tiene_diabetes_1:             boolean;
  tiene_diabetes_2:             boolean;
  tiene_hipertension:           boolean;
  tiene_dislipemia:             boolean;
  tiene_constipacion:           boolean;
  tiene_alteraciones_intestinales: boolean;
  tiene_diverticulos:           boolean;
  tiene_celiaquia:              boolean;
  tiene_enfermedad_renal:       boolean;
  tiene_anemia:                 boolean;
  tiene_osteoporosis:           boolean;
  tiene_hipotiroidismo:         boolean;
  tiene_hipertiroidismo:        boolean;
  tiene_artritis_reumatoidea:   boolean;
  otras_patologias:             string;
  intolerancias:                string;
  alergias_alimentarias:        string;
  toma_medicacion:              boolean;
  medicacion_detalle:           string;
  toma_suplementos:             boolean;
  suplementos_detalle:          string;
  fuma:                         boolean;
  cigarrillos_por_dia:          string;
  duerme_bien:                  boolean;
  horas_sueno:                  string;
  presenta_ronquidos:           boolean;
  tiene_constipacion_diarrea:   boolean;
  inflamacion_abdominal:        boolean;
  dolores_cabeza_recurrentes:   boolean;
  realiza_ejercicio:            boolean;
  tipo_actividad:               string;
  dias_actividad:               string;
  duracion_actividad:           string;
  ocupacion:                    string;
  horario_laboral:              string;
  diagnostico_inicial:          string;
  objetivos_iniciales:          string;
}

const defaultForm: FormHC = {
  antec_familiar_diabetes: false, antec_familiar_hipertension: false,
  antec_familiar_dislipemia: false, antec_familiar_obesidad: false,
  antec_familiar_otros: "",
  tiene_diabetes_1: false, tiene_diabetes_2: false, tiene_hipertension: false,
  tiene_dislipemia: false, tiene_constipacion: false,
  tiene_alteraciones_intestinales: false, tiene_diverticulos: false,
  tiene_celiaquia: false, tiene_enfermedad_renal: false, tiene_anemia: false,
  tiene_osteoporosis: false, tiene_hipotiroidismo: false,
  tiene_hipertiroidismo: false, tiene_artritis_reumatoidea: false,
  otras_patologias: "", intolerancias: "", alergias_alimentarias: "",
  toma_medicacion: false, medicacion_detalle: "",
  toma_suplementos: false, suplementos_detalle: "",
  fuma: false, cigarrillos_por_dia: "", duerme_bien: false,
  horas_sueno: "", presenta_ronquidos: false,
  tiene_constipacion_diarrea: false, inflamacion_abdominal: false,
  dolores_cabeza_recurrentes: false,
  realiza_ejercicio: false, tipo_actividad: "", dias_actividad: "",
  duracion_actividad: "", ocupacion: "", horario_laboral: "",
  diagnostico_inicial: "", objetivos_iniciales: "",
};

export default function HistoriaClinica() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [form, setForm]           = useState<FormHC>(defaultForm);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando]   = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await pacienteService.obtener(Number(id));
        if (res.historiaClinica) {
          const hc = res.historiaClinica as Record<string, unknown>;
          setForm(prev => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(hc)
                .filter(([k]) => k in defaultForm)
                // ← Fix: convierte 1/0 de MySQL a true/false
                .map(([k, v]) => [k, v === null ? "" : v === 1 ? true : v === 0 ? false : v])
            ),
          }));
        }
      } catch {
        toast.error("Error al cargar datos");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  const setB = (key: keyof FormHC, val: boolean) => setForm(p => ({ ...p, [key]: val }));

  const guardar = async () => {
    if (!form.diagnostico_inicial?.trim()) { toast.error("El diagnóstico inicial es requerido"); return; }
    if (!form.objetivos_iniciales?.trim()) { toast.error("Los objetivos iniciales son requeridos"); return; }
    try {
      setGuardando(true);
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === "" ? null : v])
      );
      await pacienteService.actualizarHistoriaClinica(Number(id), payload);
      toast.success("Historia clínica guardada");
      navigate(`/panel/pacientes/${id}`);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const Check = ({ campo }: { campo: keyof FormHC }) => (
    <div
      onClick={() => setB(campo, !form[campo])}
      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 cursor-pointer transition-all"
      style={form[campo]
        ? { background: "var(--color-primary)" }
        : { background: "var(--color-primary-bg)", border: "1.5px solid var(--color-primary-border)" }
      }>
      {form[campo] && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );

  const seccion = (titulo: string) => (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <div className="w-1 h-5 rounded-full" style={{ background: "var(--color-primary)" }} />
      <h3 className="font-display text-base font-semibold" style={{ color: "var(--color-text)" }}>{titulo}</h3>
    </div>
  );

  const checkRow = (label: string, campo: keyof FormHC) => (
    <div key={campo}
      className="flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer transition-colors"
      style={{ borderBottom: "1px solid var(--color-card-border)" }}
      onClick={() => setB(campo, !form[campo])}>
      <span className="text-sm" style={{ color: "var(--color-text)" }}>{label}</span>
      <Check campo={campo} />
    </div>
  );

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/panel/pacientes/${id}`)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: "var(--color-text)" }}>
            Historia clínica
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Antecedentes, patologías y hábitos del paciente
          </p>
        </div>
      </div>

      {/* Antecedentes familiares */}
      <div className="panel-card space-y-1">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-primary)" }}>
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Antecedentes familiares
          </h2>
        </div>
        {checkRow("Diabetes",     "antec_familiar_diabetes")}
        {checkRow("Hipertensión", "antec_familiar_hipertension")}
        {checkRow("Dislipemia",   "antec_familiar_dislipemia")}
        {checkRow("Obesidad",     "antec_familiar_obesidad")}
        <div className="pt-3">
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Otros</label>
          <input type="text" className="input-base" placeholder="Otros antecedentes familiares..."
            value={form.antec_familiar_otros}
            onChange={e => setForm(p => ({ ...p, antec_familiar_otros: e.target.value }))} />
        </div>
      </div>

      {/* Patologías */}
      <div className="panel-card space-y-1">
        {seccion("Patologías actuales")}
        {checkRow("Diabetes tipo 1",           "tiene_diabetes_1")}
        {checkRow("Diabetes tipo 2",           "tiene_diabetes_2")}
        {checkRow("Hipertensión",              "tiene_hipertension")}
        {checkRow("Dislipemia",                "tiene_dislipemia")}
        {checkRow("Constipación",              "tiene_constipacion")}
        {checkRow("Alteraciones intestinales", "tiene_alteraciones_intestinales")}
        {checkRow("Divertículos",              "tiene_diverticulos")}
        {checkRow("Celiaquía",                 "tiene_celiaquia")}
        {checkRow("Enfermedad renal",          "tiene_enfermedad_renal")}
        {checkRow("Anemia",                    "tiene_anemia")}
        {checkRow("Osteoporosis",              "tiene_osteoporosis")}
        {checkRow("Hipotiroidismo",            "tiene_hipotiroidismo")}
        {checkRow("Hipertiroidismo",           "tiene_hipertiroidismo")}
        {checkRow("Artritis reumatoidea",      "tiene_artritis_reumatoidea")}
        <div className="pt-3 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Otras patologías</label>
            <input type="text" className="input-base" placeholder="Otras patologías..."
              value={form.otras_patologias}
              onChange={e => setForm(p => ({ ...p, otras_patologias: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Intolerancias</label>
            <input type="text" className="input-base" placeholder="Intolerancias conocidas..."
              value={form.intolerancias}
              onChange={e => setForm(p => ({ ...p, intolerancias: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Alergias alimentarias</label>
            <input type="text" className="input-base" placeholder="Alergias alimentarias..."
              value={form.alergias_alimentarias}
              onChange={e => setForm(p => ({ ...p, alergias_alimentarias: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Medicación */}
      <div className="panel-card space-y-2">
        {seccion("Medicación y suplementos")}
        {checkRow("Toma medicación",  "toma_medicacion")}
        {form.toma_medicacion && (
          <div className="pt-1">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Detalle medicación</label>
            <textarea rows={2} className="input-base resize-none" placeholder="Nombre y dosis..."
              value={form.medicacion_detalle}
              onChange={e => setForm(p => ({ ...p, medicacion_detalle: e.target.value }))} />
          </div>
        )}
        {checkRow("Toma suplementos", "toma_suplementos")}
        {form.toma_suplementos && (
          <div className="pt-1">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Detalle suplementos</label>
            <textarea rows={2} className="input-base resize-none" placeholder="Nombre y dosis..."
              value={form.suplementos_detalle}
              onChange={e => setForm(p => ({ ...p, suplementos_detalle: e.target.value }))} />
          </div>
        )}
      </div>

      {/* Hábitos */}
      <div className="panel-card space-y-2">
        {seccion("Hábitos y estilo de vida")}
        {checkRow("Fuma", "fuma")}
        {form.fuma && (
          <div className="pt-1">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Cigarrillos por día</label>
            <input type="number" className="input-base" placeholder="Ej: 5"
              value={form.cigarrillos_por_dia}
              onChange={e => setForm(p => ({ ...p, cigarrillos_por_dia: e.target.value }))} />
          </div>
        )}
        {checkRow("Duerme bien",                  "duerme_bien")}
        <div className="px-1 pt-1">
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Horas de sueño</label>
          <input type="number" step="0.5" className="input-base" placeholder="Ej: 7.5"
            value={form.horas_sueno}
            onChange={e => setForm(p => ({ ...p, horas_sueno: e.target.value }))} />
        </div>
        {checkRow("Presenta ronquidos",           "presenta_ronquidos")}
        {checkRow("Constipación o diarrea",       "tiene_constipacion_diarrea")}
        {checkRow("Inflamación abdominal",        "inflamacion_abdominal")}
        {checkRow("Dolores de cabeza recurrentes","dolores_cabeza_recurrentes")}
      </div>

      {/* Actividad física */}
      <div className="panel-card space-y-3">
        {seccion("Actividad física")}
        {checkRow("Realiza ejercicio", "realiza_ejercicio")}
        {form.realiza_ejercicio && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Tipo</label>
              <input type="text" className="input-base" placeholder="Ej: Caminata"
                value={form.tipo_actividad}
                onChange={e => setForm(p => ({ ...p, tipo_actividad: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Días</label>
              <input type="text" className="input-base" placeholder="Ej: Lun/Mie/Vie"
                value={form.dias_actividad}
                onChange={e => setForm(p => ({ ...p, dias_actividad: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Duración</label>
              <input type="text" className="input-base" placeholder="Ej: 30 min"
                value={form.duracion_actividad}
                onChange={e => setForm(p => ({ ...p, duracion_actividad: e.target.value }))} />
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Ocupación</label>
            <input type="text" className="input-base" placeholder="Ej: Docente"
              value={form.ocupacion}
              onChange={e => setForm(p => ({ ...p, ocupacion: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Horario laboral</label>
            <input type="text" className="input-base" placeholder="Ej: 8 a 16hs"
              value={form.horario_laboral}
              onChange={e => setForm(p => ({ ...p, horario_laboral: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Diagnóstico */}
      <div className="panel-card space-y-3">
        {seccion("Diagnóstico y objetivos")}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Diagnóstico inicial *</label>
          <textarea rows={3} className="input-base resize-none" placeholder="Diagnóstico nutricional inicial..."
            value={form.diagnostico_inicial}
            onChange={e => setForm(p => ({ ...p, diagnostico_inicial: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Objetivos iniciales *</label>
          <textarea rows={3} className="input-base resize-none" placeholder="Objetivos planteados..."
            value={form.objetivos_iniciales}
            onChange={e => setForm(p => ({ ...p, objetivos_iniciales: e.target.value }))} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pb-6">
        <button onClick={() => navigate(`/panel/pacientes/${id}`)}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
          Cancelar
        </button>
        <button onClick={guardar} disabled={guardando}
          className="btn-primary flex items-center gap-2 disabled:opacity-60">
          {guardando
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Save className="w-4 h-4" />}
          Guardar historia clínica
        </button>
      </div>
    </div>
  );
}