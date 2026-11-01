import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Pencil, FlaskConical, MapPin, Stethoscope } from "lucide-react";
import { clinicaService, mensajeError, num, type Estudio, type Laboratorio, type TipoEstudio } from "@/services/clinica.service";
import { Cargando, Vacio, Modal, Campo } from "@/components/ui";
import { fechaCorta, fechaISO } from "@/utils/fecha";
import { FormLaboratorio } from "./formularios";

const TIPOS: Record<TipoEstudio, { etiqueta: string; emoji: string }> = {
  laboratorio: { etiqueta: "Laboratorio", emoji: "🧪" },
  imagen: { etiqueta: "Imagen", emoji: "🩻" },
  cardiologico: { etiqueta: "Cardiológico", emoji: "💓" },
  bioimpedancia: { etiqueta: "Bioimpedancia", emoji: "⚖️" },
  densitometria: { etiqueta: "Densitometría", emoji: "🦴" },
  otro: { etiqueta: "Otro", emoji: "📋" },
};

function FormEstudio({ pacienteId, estudio, onCerrar, onGuardado }: { pacienteId: number; estudio?: Estudio | null; onCerrar: () => void; onGuardado: () => void }) {
  const [v, setV] = useState({
    fecha: estudio?.fecha ?? fechaISO(), tipo: estudio?.tipo ?? "laboratorio" as TipoEstudio, nombre: estudio?.nombre ?? "",
    lugar: estudio?.lugar ?? "", solicitado_por: estudio?.solicitado_por ?? "", resultado_resumen: estudio?.resultado_resumen ?? "",
  });
  const [guardando, setGuardando] = useState(false);
  const set = (k: keyof typeof v, x: string) => setV((s) => ({ ...s, [k]: x }));

  const guardar = async () => {
    setGuardando(true);
    try {
      if (estudio) await clinicaService.actualizarEstudio(estudio.id, v);
      else await clinicaService.crearEstudio(pacienteId, v);
      toast.success(estudio ? "Estudio actualizado" : "Estudio registrado 💗");
      onGuardado();
    } catch (e) { toast.error(mensajeError(e)); } finally { setGuardando(false); }
  };

  return (
    <Modal titulo={estudio ? `Editar estudio #${estudio.id}` : "Registrar estudio"} onCerrar={onCerrar}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TIPOS) as TipoEstudio[]).map((t) => (
            <button key={t} type="button" className="chip" data-activo={v.tipo === t} onClick={() => set("tipo", t)}>
              {TIPOS[t].emoji} {TIPOS[t].etiqueta}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Campo label="Nombre del estudio" className="sm:col-span-2">
            <input className="input-base" value={v.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Ej: Ecografía abdominal" maxLength={150} />
          </Campo>
          <Campo label="Fecha"><input type="date" className="input-base" value={v.fecha} onChange={(e) => set("fecha", e.target.value)} /></Campo>
          <Campo label="Lugar"><input className="input-base" value={v.lugar} onChange={(e) => set("lugar", e.target.value)} /></Campo>
          <Campo label="Solicitado por" className="sm:col-span-2"><input className="input-base" value={v.solicitado_por} onChange={(e) => set("solicitado_por", e.target.value)} /></Campo>
        </div>
        <Campo label="Resultado / resumen">
          <textarea rows={3} className="input-base" value={v.resultado_resumen} onChange={(e) => set("resultado_resumen", e.target.value)} />
        </Campo>
        <div className="flex gap-2 justify-end">
          <button onClick={onCerrar} className="btn-soft">Cancelar</button>
          <button onClick={guardar} disabled={guardando || !v.nombre.trim() || !v.fecha} className="btn-primary">{guardando ? "Guardando…" : "Guardar"}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function TabEstudios({ pacienteId, laboratorios, recargarProgreso }: { pacienteId: number; laboratorios: Laboratorio[]; recargarProgreso: () => void }) {
  const [estudios, setEstudios] = useState<Estudio[] | null>(null);
  const [form, setForm] = useState<Estudio | null | undefined>(undefined);
  const [formLab, setFormLab] = useState(false);

  const cargar = () => clinicaService.estudios(pacienteId).then(setEstudios).catch(() => toast.error("No se pudieron cargar los estudios"));
  useEffect(() => { cargar(); }, [pacienteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const borrar = async (e: Estudio) => {
    if (!confirm(`¿Borrar "${e.nombre}"?`)) return;
    try { await clinicaService.borrarEstudio(e.id); toast.success("Estudio borrado"); cargar(); }
    catch (err) { toast.error(mensajeError(err, "No se pudo borrar")); }
  };
  const borrarLab = async (l: Laboratorio) => {
    if (!confirm(`¿Borrar el laboratorio del ${fechaCorta(l.fecha)}?`)) return;
    try { await clinicaService.borrarLaboratorio(l.id); toast.success("Laboratorio borrado"); recargarProgreso(); }
    catch (err) { toast.error(mensajeError(err, "No se pudo borrar")); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <section className="panel-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-lg" style={{ color: "var(--color-text)" }}>Estudios</h3>
          <button onClick={() => setForm(null)} className="btn-primary text-sm py-1.5"><Plus className="w-4 h-4" /> Registrar</button>
        </div>
        {!estudios ? <Cargando alto="h-32" /> : estudios.length === 0 ? (
          <Vacio emoji="🩻" titulo="Sin estudios registrados" texto="Ecografías, laboratorios, bioimpedancias… todo lo que se hizo el paciente." />
        ) : (
          <ul className="space-y-2.5">
            {estudios.map((e) => (
              <li key={e.id} className="p-3.5 rounded-2xl" style={{ background: "var(--color-cream-50)", border: "1px solid var(--color-card-border)" }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none mt-0.5">{TIPOS[e.tipo].emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold" style={{ color: "var(--color-text)" }}>{e.nombre} <span className="id-tag">#{e.id}</span></p>
                    <p className="text-xs font-semibold flex flex-wrap gap-x-3 mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      <span>{fechaCorta(e.fecha)} · {TIPOS[e.tipo].etiqueta}</span>
                      {e.lugar && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{e.lugar}</span>}
                      {e.solicitado_por && <span className="inline-flex items-center gap-1"><Stethoscope className="w-3 h-3" />{e.solicitado_por}</span>}
                    </p>
                    {e.resultado_resumen && <p className="text-sm mt-1.5" style={{ color: "var(--color-text)" }}>{e.resultado_resumen}</p>}
                  </div>
                  <div className="flex">
                    <button onClick={() => setForm(e)} className="p-1.5 rounded-lg hover:bg-white" aria-label="Editar"><Pencil className="w-4 h-4" style={{ color: "var(--color-primary)" }} /></button>
                    <button onClick={() => borrar(e)} className="p-1.5 rounded-lg hover:bg-white" aria-label="Borrar"><Trash2 className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-lg" style={{ color: "var(--color-text)" }}>Laboratorios</h3>
          <button onClick={() => setFormLab(true)} className="btn-soft text-sm py-1.5"><FlaskConical className="w-4 h-4" /> Cargar valores</button>
        </div>
        {laboratorios.length === 0 ? (
          <Vacio emoji="🧪" titulo="Sin laboratorios cargados" texto="Glucemia, HbA1c y lípidos se grafican en Progreso." />
        ) : (
          <ul className="space-y-2.5">
            {[...laboratorios].reverse().map((l) => {
              const valores = ([["Glucemia", l.glucemia, "mg/dl"], ["HbA1c", l.hemoglobina_glicosilada, "%"], ["Colesterol", l.colesterol_total, "mg/dl"],
                ["HDL", l.hdl, ""], ["LDL", l.ldl, ""], ["TG", l.trigliceridos, ""]] as [string, string | null, string][]).filter(([, v]) => num(v) !== null);
              return (
                <li key={l.id} className="p-3.5 rounded-2xl" style={{ background: "var(--c-cielo-bg)", border: "1px solid #d6ecff" }}>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm" style={{ color: "var(--color-text)" }}>{fechaCorta(l.fecha)} <span className="id-tag">#{l.id}</span></p>
                    <button onClick={() => borrarLab(l)} className="p-1.5 rounded-lg hover:bg-white" aria-label="Borrar"><Trash2 className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} /></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {valores.map(([et, v, u]) => (
                      <span key={et} className="px-2.5 py-1 rounded-full bg-white text-xs font-bold" style={{ color: "var(--color-text)" }}>
                        {et} <span style={{ color: "#2b7fc4" }}>{Number(v).toLocaleString("es-AR")}</span>{u && ` ${u}`}
                      </span>
                    ))}
                    {valores.length === 0 && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Sin valores principales</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {form !== undefined && <FormEstudio pacienteId={pacienteId} estudio={form} onCerrar={() => setForm(undefined)} onGuardado={() => { setForm(undefined); cargar(); }} />}
      {formLab && <FormLaboratorio pacienteId={pacienteId} onCerrar={() => setFormLab(false)} onGuardado={() => { setFormLab(false); recargarProgreso(); }} />}
    </div>
  );
}
