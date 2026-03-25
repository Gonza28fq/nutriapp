import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, ClipboardList, Activity, Scale } from "lucide-react";
import { consultaService } from "@/services/consulta.service";
import toast from "react-hot-toast";

function Seccion({ icon: Icon, titulo, children }: {
  icon: React.ComponentType<any>; titulo: string; children: React.ReactNode;
}) {
  return (
    <div className="panel-card space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "var(--color-primary)" }}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h2 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>{titulo}</h2>
      </div>
      {children}
    </div>
  );
}

function CampoMedicion({ label, unidad, value, onChange, placeholder }: {
  label: string; unidad: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
        style={{ color: "var(--color-text-muted)" }}>
        {label}
      </label>
      <div className="relative">
        <input type="number" step="0.01" min="0" className="input-base pr-12"
          placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none"
          style={{ color: "var(--color-text-muted)" }}>
          {unidad}
        </span>
      </div>
    </div>
  );
}

// ── Clasificación IMC ────────────────────────────────────────────
function clasificarIMC(imc: number) {
  if (imc < 18.5) return { label: "Bajo peso",    color: "#2563eb", bg: "#eff6ff" };
  if (imc < 25)   return { label: "Normal",        color: "#16a34a", bg: "#f0fdf4" };
  if (imc < 30)   return { label: "Sobrepeso",     color: "#d97706", bg: "#fffbeb" };
  if (imc < 35)   return { label: "Obesidad I",    color: "#ea580c", bg: "#fff7ed" };
  if (imc < 40)   return { label: "Obesidad II",   color: "#dc2626", bg: "#fef2f2" };
  return               { label: "Obesidad III",   color: "#7f1d1d", bg: "#fef2f2" };
}

export default function NuevaConsulta() {
  const { pacienteId } = useParams();
  const navigate       = useNavigate();
  const [guardando, setGuardando] = useState(false);

  const [consulta, setConsulta] = useState({
    fecha:           new Date().toISOString().split("T")[0],
    sede_id:         "1",
    tipo_consulta:   "control",
    motivo_consulta: "",
    problemas:       "",
    objetivos:       "",
    observaciones:   "",
    indicaciones:    "",
    proximo_control: "",
  });

  const [medicion, setMedicion] = useState({
    peso_kg:                   "",
    talla_cm:                  "",
    circunferencia_cintura_cm: "",
    circunferencia_cadera_cm:  "",
    porcentaje_masa_grasa:     "",
    porcentaje_masa_magra:     "",
    presion_sistolica:         "",
    presion_diastolica:        "",
    frecuencia_cardiaca:       "",
    peso_habitual_kg:          "",
    peso_posible_kg:           "",
  });

  const setC = (key: string, val: string) => setConsulta(p => ({ ...p, [key]: val }));
  const setM = (key: string, val: string) => setMedicion(p => ({ ...p, [key]: val }));

  // ── Cálculos automáticos ──────────────────────────────────────
  const imc = useMemo(() => {
    const peso  = parseFloat(medicion.peso_kg);
    const talla = parseFloat(medicion.talla_cm);
    if (!peso || !talla || talla <= 0) return null;
    return peso / Math.pow(talla / 100, 2);
  }, [medicion.peso_kg, medicion.talla_cm]);

  const relacionCintCad = useMemo(() => {
    const cin = parseFloat(medicion.circunferencia_cintura_cm);
    const cad = parseFloat(medicion.circunferencia_cadera_cm);
    if (!cin || !cad || cad <= 0) return null;
    return cin / cad;
  }, [medicion.circunferencia_cintura_cm, medicion.circunferencia_cadera_cm]);

  const imcClasif = imc ? clasificarIMC(imc) : null;

  const guardar = async () => {
    if (!consulta.fecha) { toast.error("La fecha es requerida"); return; }
    if (!consulta.tipo_consulta) { toast.error("El tipo de consulta es requerido"); return; }
    if (!consulta.motivo_consulta.trim()) { toast.error("El motivo de consulta es requerido"); return; }

    try {
      setGuardando(true);
      const medicionLimpia = Object.fromEntries(
        Object.entries(medicion).filter(([_, v]) => v !== "").map(([k, v]) => [k, Number(v)])
      );
      // Agregar IMC calculado si corresponde
      if (imc) medicionLimpia["imc"] = Math.round(imc * 100) / 100;

      const consultaLimpia = Object.fromEntries(
        Object.entries(consulta).filter(([_, v]) => v !== "")
      );

      await consultaService.crear({
        ...consultaLimpia,
        paciente_id: Number(pacienteId),
        sede_id:     Number(consulta.sede_id),
        medicion:    Object.keys(medicionLimpia).length > 0 ? medicionLimpia : undefined,
      });

      toast.success("Consulta registrada correctamente");
      navigate(`/panel/pacientes/${pacienteId}`);
    } catch {
      toast.error("Error al guardar la consulta");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/panel/pacientes/${pacienteId}`)}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: "var(--color-text)" }}>
            Nueva consulta
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Registrá los datos de la consulta de hoy
          </p>
        </div>
      </div>

      {/* ── Datos generales ── */}
      <Seccion icon={ClipboardList} titulo="Datos de la consulta">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--color-text-muted)" }}>Fecha *</label>
            <input type="date" className="input-base" value={consulta.fecha}
              onChange={e => setC("fecha", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--color-text-muted)" }}>Sede</label>
            <select className="input-base" value={consulta.sede_id}
              onChange={e => setC("sede_id", e.target.value)}>
              <option value="1">Amaicha</option>
              <option value="2">Colalao</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--color-text-muted)" }}>Tipo de consulta *</label>
            <select className="input-base" value={consulta.tipo_consulta}
              onChange={e => setC("tipo_consulta", e.target.value)}>
              <option value="primera_vez">Primera vez</option>
              <option value="control">Control</option>
              <option value="seguimiento">Seguimiento</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--color-text-muted)" }}>Próximo control</label>
            <input type="date" className="input-base" value={consulta.proximo_control}
              onChange={e => setC("proximo_control", e.target.value)} />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--color-text-muted)" }}>Motivo de consulta *</label>
            <textarea rows={2} className="input-base resize-none"
              placeholder="¿Por qué consulta hoy?"
              value={consulta.motivo_consulta}
              onChange={e => setC("motivo_consulta", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--color-text-muted)" }}>Problemas identificados</label>
            <textarea rows={2} className="input-base resize-none"
              placeholder="Problemas detectados en esta consulta..."
              value={consulta.problemas}
              onChange={e => setC("problemas", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--color-text-muted)" }}>Objetivos</label>
            <textarea rows={2} className="input-base resize-none"
              placeholder="Objetivos planteados para el paciente..."
              value={consulta.objetivos}
              onChange={e => setC("objetivos", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--color-text-muted)" }}>Observaciones</label>
            <textarea rows={2} className="input-base resize-none"
              placeholder="Observaciones generales..."
              value={consulta.observaciones}
              onChange={e => setC("observaciones", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--color-text-muted)" }}>Indicaciones</label>
            <textarea rows={2} className="input-base resize-none"
              placeholder="Indicaciones para el paciente..."
              value={consulta.indicaciones}
              onChange={e => setC("indicaciones", e.target.value)} />
          </div>
        </div>
      </Seccion>

      {/* ── Mediciones ── */}
      <Seccion icon={Activity} titulo="Mediciones antropométricas">

        {/* Indicadores calculados */}
        {(imc || relacionCintCad) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl"
            style={{ background: "var(--color-cream-100)", border: "1px solid var(--color-card-border)" }}>
            {imc && imcClasif && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: imcClasif.bg }}>
                  <Scale className="w-5 h-5" style={{ color: imcClasif.color }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>IMC calculado</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold text-lg" style={{ color: "var(--color-text)" }}>
                      {imc.toFixed(1)}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                      style={{ background: imcClasif.bg, color: imcClasif.color }}>
                      {imcClasif.label}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {relacionCintCad && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--color-primary-bg)" }}>
                  <Activity className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Relación cintura/cadera</p>
                  <span className="font-bold text-lg" style={{ color: "var(--color-text)" }}>
                    {relacionCintCad.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <CampoMedicion label="Peso"            unidad="kg"  value={medicion.peso_kg}                   onChange={v => setM("peso_kg", v)}                   placeholder="72.5" />
          <CampoMedicion label="Talla"           unidad="cm"  value={medicion.talla_cm}                  onChange={v => setM("talla_cm", v)}                  placeholder="165" />
          <CampoMedicion label="Cintura"         unidad="cm"  value={medicion.circunferencia_cintura_cm} onChange={v => setM("circunferencia_cintura_cm", v)} placeholder="85" />
          <CampoMedicion label="Cadera"          unidad="cm"  value={medicion.circunferencia_cadera_cm}  onChange={v => setM("circunferencia_cadera_cm", v)}  placeholder="95" />
          <CampoMedicion label="Masa grasa"      unidad="%"   value={medicion.porcentaje_masa_grasa}     onChange={v => setM("porcentaje_masa_grasa", v)}     placeholder="28" />
          <CampoMedicion label="Masa magra"      unidad="%"   value={medicion.porcentaje_masa_magra}     onChange={v => setM("porcentaje_masa_magra", v)}     placeholder="72" />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--color-text-muted)" }}>Signos vitales</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <CampoMedicion label="Presión sistólica"  unidad="mmHg" value={medicion.presion_sistolica}   onChange={v => setM("presion_sistolica", v)}   placeholder="120" />
            <CampoMedicion label="Presión diastólica" unidad="mmHg" value={medicion.presion_diastolica}  onChange={v => setM("presion_diastolica", v)}  placeholder="80" />
            <CampoMedicion label="Frec. cardíaca"     unidad="lpm"  value={medicion.frecuencia_cardiaca} onChange={v => setM("frecuencia_cardiaca", v)} placeholder="75" />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--color-text-muted)" }}>Pesos de referencia</p>
          <div className="grid grid-cols-2 gap-4">
            <CampoMedicion label="Peso habitual" unidad="kg" value={medicion.peso_habitual_kg} onChange={v => setM("peso_habitual_kg", v)} placeholder="75" />
            <CampoMedicion label="Peso posible"  unidad="kg" value={medicion.peso_posible_kg}  onChange={v => setM("peso_posible_kg", v)}  placeholder="65" />
          </div>
        </div>

        {imc && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            ✓ El IMC ({imc.toFixed(1)}) se guardará automáticamente con la consulta.
          </p>
        )}
      </Seccion>

      {/* Botones */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <button onClick={() => navigate(`/panel/pacientes/${pacienteId}`)}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
          Cancelar
        </button>
        <button onClick={guardar} disabled={guardando}
          className="btn-primary flex items-center gap-2 disabled:opacity-60">
          {guardando
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Save className="w-4 h-4" />}
          Guardar consulta
        </button>
      </div>
    </div>
  );
}