import { useState } from "react";
import toast from "react-hot-toast";
import { Modal, Campo } from "@/components/ui";
import { clinicaService, mensajeError, type Medicion } from "@/services/clinica.service";
import { fechaISO } from "@/utils/fecha";

// ── Definición de campos (se usan en formularios, gráficos y el cuerpo) ──
export interface DefCampo { clave: string; etiqueta: string; unidad: string; paso?: string }

export const CAMPOS_BASICOS: DefCampo[] = [
  { clave: "peso_kg", etiqueta: "Peso", unidad: "kg", paso: "0.1" },
  { clave: "talla_cm", etiqueta: "Talla", unidad: "cm", paso: "0.1" },
  { clave: "porcentaje_masa_grasa", etiqueta: "Masa grasa", unidad: "%", paso: "0.1" },
  { clave: "porcentaje_masa_magra", etiqueta: "Masa magra", unidad: "%", paso: "0.1" },
  { clave: "masa_muscular_kg", etiqueta: "Masa muscular", unidad: "kg", paso: "0.1" },
  { clave: "grasa_visceral_nivel", etiqueta: "Grasa visceral", unidad: "nivel", paso: "1" },
  { clave: "agua_corporal_pct", etiqueta: "Agua corporal", unidad: "%", paso: "0.1" },
];

export const CAMPOS_PERIMETROS: DefCampo[] = [
  { clave: "perimetro_cuello_cm", etiqueta: "Cuello", unidad: "cm", paso: "0.1" },
  { clave: "perimetro_brazo_cm", etiqueta: "Brazo", unidad: "cm", paso: "0.1" },
  { clave: "perimetro_torax_cm", etiqueta: "Busto / tórax", unidad: "cm", paso: "0.1" },
  { clave: "circunferencia_cintura_cm", etiqueta: "Cintura", unidad: "cm", paso: "0.1" },
  { clave: "perimetro_abdomen_cm", etiqueta: "Abdomen", unidad: "cm", paso: "0.1" },
  { clave: "circunferencia_cadera_cm", etiqueta: "Cadera", unidad: "cm", paso: "0.1" },
  { clave: "perimetro_muslo_cm", etiqueta: "Muslo", unidad: "cm", paso: "0.1" },
  { clave: "perimetro_pantorrilla_cm", etiqueta: "Pantorrilla", unidad: "cm", paso: "0.1" },
];

export const CAMPOS_PRESION: DefCampo[] = [
  { clave: "presion_sistolica", etiqueta: "Presión sistólica", unidad: "mmHg", paso: "1" },
  { clave: "presion_diastolica", etiqueta: "Presión diastólica", unidad: "mmHg", paso: "1" },
];

export const CAMPOS_LAB: DefCampo[] = [
  { clave: "glucemia", etiqueta: "Glucemia", unidad: "mg/dl", paso: "1" },
  { clave: "hemoglobina_glicosilada", etiqueta: "HbA1c", unidad: "%", paso: "0.1" },
  { clave: "insulina", etiqueta: "Insulina", unidad: "µUI/ml", paso: "0.1" },
  { clave: "colesterol_total", etiqueta: "Colesterol total", unidad: "mg/dl", paso: "1" },
  { clave: "hdl", etiqueta: "HDL", unidad: "mg/dl", paso: "1" },
  { clave: "ldl", etiqueta: "LDL", unidad: "mg/dl", paso: "1" },
  { clave: "trigliceridos", etiqueta: "Triglicéridos", unidad: "mg/dl", paso: "1" },
];

function GrillaCampos({ campos, valores, onCambio }: { campos: DefCampo[]; valores: Record<string, string>; onCambio: (k: string, v: string) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {campos.map((c) => (
        <Campo key={c.clave} label={`${c.etiqueta} (${c.unidad})`}>
          <input type="number" inputMode="decimal" step={c.paso ?? "0.1"} className="input-base"
            value={valores[c.clave] ?? ""} onChange={(e) => onCambio(c.clave, e.target.value)} />
        </Campo>
      ))}
    </div>
  );
}

const limpiar = (v: Record<string, string>) => Object.fromEntries(Object.entries(v).filter(([, x]) => x !== "" && x !== undefined));

/** Alta o edición de una medición. Si `medicion` viene, edita esa. */
export function FormMedicion({ pacienteId, medicion, inicial, onCerrar, onGuardado }: {
  pacienteId: number; medicion?: Medicion | null; inicial?: Record<string, string>;
  onCerrar: () => void; onGuardado: () => void;
}) {
  const desde = (m?: Medicion | null) => Object.fromEntries(
    Object.entries(m ?? {}).filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => [k, String(v)])
  );
  const [valores, setValores] = useState<Record<string, string>>({ fecha: fechaISO(), ...desde(medicion), ...inicial });
  const [guardando, setGuardando] = useState(false);
  const cambiar = (k: string, v: string) => setValores((s) => ({ ...s, [k]: v }));

  const guardar = async () => {
    setGuardando(true);
    try {
      const todos = [...CAMPOS_BASICOS, ...CAMPOS_PERIMETROS, ...CAMPOS_PRESION].map((c) => c.clave);
      const datos = limpiar(Object.fromEntries(Object.entries(valores).filter(([k]) => k === "fecha" || todos.includes(k))));
      if (medicion) await clinicaService.actualizarMedicion(medicion.id, datos);
      else await clinicaService.crearMedicion(pacienteId, datos);
      toast.success(medicion ? "Medición actualizada" : "Medición guardada 💗");
      onGuardado();
    } catch (e) {
      toast.error(mensajeError(e));
    } finally { setGuardando(false); }
  };

  return (
    <Modal titulo={medicion ? `Editar medición #${medicion.id}` : "Nueva medición"} onCerrar={onCerrar} ancho="max-w-2xl">
      <div className="space-y-5">
        <Campo label="Fecha" className="max-w-[12rem]">
          <input type="date" className="input-base" value={valores.fecha ?? ""} onChange={(e) => cambiar("fecha", e.target.value)} />
        </Campo>
        <section>
          <p className="font-display font-bold mb-2" style={{ color: "var(--color-text)" }}>Peso y composición</p>
          <GrillaCampos campos={CAMPOS_BASICOS} valores={valores} onCambio={cambiar} />
          <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>El IMC y el índice cintura/cadera se calculan solos.</p>
        </section>
        <section>
          <p className="font-display font-bold mb-2" style={{ color: "var(--color-text)" }}>Perímetros</p>
          <GrillaCampos campos={CAMPOS_PERIMETROS} valores={valores} onCambio={cambiar} />
        </section>
        <section>
          <p className="font-display font-bold mb-2" style={{ color: "var(--color-text)" }}>Presión</p>
          <GrillaCampos campos={CAMPOS_PRESION} valores={valores} onCambio={cambiar} />
        </section>
        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onCerrar} className="btn-soft">Cancelar</button>
          <button onClick={guardar} disabled={guardando || !valores.fecha} className="btn-primary">{guardando ? "Guardando…" : "Guardar"}</button>
        </div>
      </div>
    </Modal>
  );
}

export function FormLaboratorio({ pacienteId, onCerrar, onGuardado }: { pacienteId: number; onCerrar: () => void; onGuardado: () => void }) {
  const [valores, setValores] = useState<Record<string, string>>({ fecha: fechaISO() });
  const [guardando, setGuardando] = useState(false);
  const cambiar = (k: string, v: string) => setValores((s) => ({ ...s, [k]: v }));

  const guardar = async () => {
    setGuardando(true);
    try {
      await clinicaService.crearLaboratorio(pacienteId, limpiar(valores));
      toast.success("Laboratorio guardado 💗");
      onGuardado();
    } catch (e) {
      toast.error(mensajeError(e));
    } finally { setGuardando(false); }
  };

  return (
    <Modal titulo="Nuevo laboratorio" onCerrar={onCerrar} ancho="max-w-2xl">
      <div className="space-y-5">
        <Campo label="Fecha del análisis" className="max-w-[12rem]">
          <input type="date" className="input-base" value={valores.fecha} onChange={(e) => cambiar("fecha", e.target.value)} />
        </Campo>
        <GrillaCampos campos={CAMPOS_LAB} valores={valores} onCambio={cambiar} />
        <Campo label="Notas">
          <textarea rows={2} className="input-base" value={valores.notas ?? ""} onChange={(e) => cambiar("notas", e.target.value)} />
        </Campo>
        <div className="flex gap-2 justify-end">
          <button onClick={onCerrar} className="btn-soft">Cancelar</button>
          <button onClick={guardar} disabled={guardando || !valores.fecha} className="btn-primary">{guardando ? "Guardando…" : "Guardar"}</button>
        </div>
      </div>
    </Modal>
  );
}
