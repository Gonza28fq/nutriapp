import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Apple } from "lucide-react";
import { pacienteService } from "@/services/paciente.service";
import toast from "react-hot-toast";

interface FormAnamnesis {
  realiza_desayuno:          boolean;
  horario_desayuno:          string;
  realiza_almuerzo:          boolean;
  horario_almuerzo:          string;
  realiza_merienda:          boolean;
  horario_merienda:          string;
  realiza_cena:              boolean;
  horario_cena:              string;
  quien_cocina:              string;
  tipo_coccion:              string;
  frecuencia_come_afuera:    string;
  consume_mate_te_cafe:      boolean;
  infusiones_detalle:        string;
  usa_edulcorante:           boolean;
  edulcorante_detalle:       string;
  liquidos_consumo_diario:   string;
  consume_entre_comidas:     boolean;
  que_consume_entre_comidas: string;
  consume_dulce_poscomida:   boolean;
  que_consume_poscomida:     string;
  repite_plato:              boolean;
  recordatorio_desayuno:     string;
  recordatorio_almuerzo:     string;
  recordatorio_merienda:     string;
  recordatorio_cena:         string;
  recordatorio_otros:        string;
  alimentos_no_le_gustan:    string;
  notas:                     string;
}

const defaultForm: FormAnamnesis = {
  realiza_desayuno: false,        horario_desayuno: "",
  realiza_almuerzo: false,        horario_almuerzo: "",
  realiza_merienda: false,        horario_merienda: "",
  realiza_cena: false,            horario_cena: "",
  quien_cocina: "",               tipo_coccion: "",
  frecuencia_come_afuera: "",
  consume_mate_te_cafe: false,    infusiones_detalle: "",
  usa_edulcorante: false,         edulcorante_detalle: "",
  liquidos_consumo_diario: "",
  consume_entre_comidas: false,   que_consume_entre_comidas: "",
  consume_dulce_poscomida: false, que_consume_poscomida: "",
  repite_plato: false,
  recordatorio_desayuno: "",      recordatorio_almuerzo: "",
  recordatorio_merienda: "",      recordatorio_cena: "",
  recordatorio_otros: "",         alimentos_no_le_gustan: "",
  notas: "",
};

export default function Anamnesis() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [form, setForm]           = useState<FormAnamnesis>(defaultForm);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando]   = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await pacienteService.obtener(Number(id));
        if (res.anamnesis) {
          const a = res.anamnesis as Record<string, unknown>;
          setForm(prev => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(a)
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

  const setB = (key: keyof FormAnamnesis, val: boolean) =>
    setForm(p => ({ ...p, [key]: val }));

  const guardar = async () => {
    if (!form.realiza_desayuno && !form.realiza_almuerzo &&
        !form.realiza_merienda && !form.realiza_cena) {
      toast.error("Completá al menos una comida del día");
      return;
    }
    try {
      setGuardando(true);
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === "" ? null : v])
      );
      await pacienteService.actualizarAnamnesis(Number(id), payload);
      toast.success("Anamnesis guardada correctamente");
      navigate(`/panel/pacientes/${id}`);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const Check = ({ campo }: { campo: keyof FormAnamnesis }) => (
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

  const comida = (
    label: string,
    campoRealiza: keyof FormAnamnesis,
    campoHorario: keyof FormAnamnesis
  ) => (
    <div className="p-3 rounded-xl" style={{ background: "var(--color-cream-100)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{label}</span>
        <Check campo={campoRealiza} />
      </div>
      {form[campoRealiza] && (
        <input type="time" className="input-base text-sm"
          value={form[campoHorario] as string}
          onChange={e => setForm(p => ({ ...p, [campoHorario]: e.target.value }))} />
      )}
    </div>
  );

  const checkRow = (label: string, campo: keyof FormAnamnesis) => (
    <div key={campo}
      className="flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer"
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

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/panel/pacientes/${id}`)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: "var(--color-text)" }}>
            Anamnesis alimentaria
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Hábitos y patrón alimentario del paciente
          </p>
        </div>
      </div>

      {/* Comidas del día */}
      <div className="panel-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-primary)" }}>
            <Apple className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Comidas del día
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {comida("Desayuno", "realiza_desayuno", "horario_desayuno")}
          {comida("Almuerzo", "realiza_almuerzo", "horario_almuerzo")}
          {comida("Merienda", "realiza_merienda", "horario_merienda")}
          {comida("Cena",     "realiza_cena",     "horario_cena")}
        </div>
        <div className="mt-3 space-y-2">
          {checkRow("Come entre comidas",    "consume_entre_comidas")}
          {form.consume_entre_comidas && (
            <textarea rows={2} className="input-base resize-none"
              placeholder="Qué consume entre comidas..."
              value={form.que_consume_entre_comidas}
              onChange={e => setForm(p => ({ ...p, que_consume_entre_comidas: e.target.value }))} />
          )}
          {checkRow("Consume dulce de postre", "consume_dulce_poscomida")}
          {form.consume_dulce_poscomida && (
            <textarea rows={2} className="input-base resize-none"
              placeholder="Qué consume de postre..."
              value={form.que_consume_poscomida}
              onChange={e => setForm(p => ({ ...p, que_consume_poscomida: e.target.value }))} />
          )}
          {checkRow("Repite el plato", "repite_plato")}
        </div>
      </div>

      {/* Hábitos */}
      <div className="panel-card space-y-2">
        {seccion("Hábitos alimentarios")}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
              Quién cocina
            </label>
            <input type="text" className="input-base" placeholder="Ej: El paciente, la madre..."
              value={form.quien_cocina}
              onChange={e => setForm(p => ({ ...p, quien_cocina: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
              Tipo de cocción
            </label>
            <input type="text" className="input-base" placeholder="Ej: Hervido, frito, al horno..."
              value={form.tipo_coccion}
              onChange={e => setForm(p => ({ ...p, tipo_coccion: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
            Frecuencia que come afuera
          </label>
          <input type="text" className="input-base" placeholder="Ej: 3 veces por semana"
            value={form.frecuencia_come_afuera}
            onChange={e => setForm(p => ({ ...p, frecuencia_come_afuera: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
            Líquidos consumo diario
          </label>
          <input type="text" className="input-base" placeholder="Ej: 2 litros de agua, jugos..."
            value={form.liquidos_consumo_diario}
            onChange={e => setForm(p => ({ ...p, liquidos_consumo_diario: e.target.value }))} />
        </div>
        {checkRow("Consume mate / té / café", "consume_mate_te_cafe")}
        {form.consume_mate_te_cafe && (
          <input type="text" className="input-base"
            placeholder="Detalle (Ej: 1 litro de mate por día)"
            value={form.infusiones_detalle}
            onChange={e => setForm(p => ({ ...p, infusiones_detalle: e.target.value }))} />
        )}
        {checkRow("Usa edulcorante", "usa_edulcorante")}
        {form.usa_edulcorante && (
          <input type="text" className="input-base" placeholder="Tipo de edulcorante"
            value={form.edulcorante_detalle}
            onChange={e => setForm(p => ({ ...p, edulcorante_detalle: e.target.value }))} />
        )}
      </div>

      {/* Recordatorio 24hs */}
      <div className="panel-card space-y-3">
        {seccion("Recordatorio alimentario 24hs")}
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Qué comió el paciente ayer en cada momento del día
        </p>
        {([
          { label: "Desayuno", campo: "recordatorio_desayuno" },
          { label: "Almuerzo", campo: "recordatorio_almuerzo" },
          { label: "Merienda", campo: "recordatorio_merienda" },
          { label: "Cena",     campo: "recordatorio_cena" },
          { label: "Otros",    campo: "recordatorio_otros" },
        ] as { label: string; campo: keyof FormAnamnesis }[]).map(({ label, campo }) => (
          <div key={campo}>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
              {label}
            </label>
            <textarea rows={2} className="input-base resize-none"
              placeholder={`Qué comió en ${label.toLowerCase()}...`}
              value={form[campo] as string}
              onChange={e => setForm(p => ({ ...p, [campo]: e.target.value }))} />
          </div>
        ))}
      </div>

      {/* Preferencias */}
      <div className="panel-card space-y-3">
        {seccion("Preferencias y observaciones")}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
            Alimentos que no le gustan
          </label>
          <textarea rows={2} className="input-base resize-none"
            placeholder="Alimentos que no le agradan..."
            value={form.alimentos_no_le_gustan}
            onChange={e => setForm(p => ({ ...p, alimentos_no_le_gustan: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
            Notas y observaciones
          </label>
          <textarea rows={3} className="input-base resize-none"
            placeholder="Observaciones adicionales..."
            value={form.notas}
            onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} />
        </div>
      </div>

      {/* Botones */}
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
          Guardar anamnesis
        </button>
      </div>
    </div>
  );
}