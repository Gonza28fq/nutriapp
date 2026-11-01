import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, EyeOff, RotateCcw } from "lucide-react";
import {
  clinicaService, mensajeError, num,
  type Patologia, type PatologiaPaciente, type Medicion, type Laboratorio,
} from "@/services/clinica.service";
import { Modal, Campo, PatologiaChip, OrigenBadge, Vacio } from "@/components/ui";
import ModalNuevaPatologia from "@/components/ModalNuevaPatologia";
import { fechaCorta } from "@/utils/fecha";
import type { PacienteFicha } from "./tipos";

function Dato({ label, valor }: { label: string; valor?: string | number | null }) {
  if (valor === null || valor === undefined || valor === "") return null;
  return (
    <div className="p-3 rounded-2xl" style={{ background: "var(--color-cream-100)" }}>
      <p className="text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="text-sm font-semibold mt-0.5 break-words" style={{ color: "var(--color-text)" }}>{valor}</p>
    </div>
  );
}

function ModalPatologia({ pacienteId, catalogo, inicialId, onCrearNueva, onCerrar, onGuardado }: {
  pacienteId: number; catalogo: Patologia[]; inicialId?: number; onCrearNueva: () => void;
  onCerrar: () => void; onGuardado: (l: PatologiaPaciente[]) => void;
}) {
  const [patologiaId, setPatologiaId] = useState<number | "">(inicialId ?? "");
  const [grado, setGrado] = useState("");
  const [fecha, setFecha] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!patologiaId) return;
    setGuardando(true);
    try {
      onGuardado(await clinicaService.guardarPatologia(pacienteId, patologiaId, {
        activa: true, grado: grado || null, fecha_diagnostico: fecha || null, notas: notas || null,
      }));
      toast.success("Patología registrada");
    } catch (e) { toast.error(mensajeError(e)); } finally { setGuardando(false); }
  };

  return (
    <Modal titulo="Registrar patología" onCerrar={onCerrar}>
      <div className="space-y-4">
        <Campo label="Patología">
          <select className="input-base" value={patologiaId} onChange={(e) => setPatologiaId(Number(e.target.value) || "")}>
            <option value="">Elegí una…</option>
            {catalogo.map((p) => <option key={p.id} value={p.id}>{p.nombre}{p.sigla ? ` (${p.sigla})` : ""}</option>)}
          </select>
          <button type="button" onClick={onCrearNueva} className="text-xs font-bold mt-1.5 hover:underline" style={{ color: "var(--color-primary)" }}>
            ¿No está en la lista? Creala
          </button>
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Grado (opcional)"><input className="input-base" value={grado} onChange={(e) => setGrado(e.target.value)} placeholder="Ej: Grado I" maxLength={30} /></Campo>
          <Campo label="Fecha de diagnóstico"><input type="date" className="input-base" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Campo>
        </div>
        <Campo label="Notas"><textarea rows={2} className="input-base" value={notas} onChange={(e) => setNotas(e.target.value)} /></Campo>
        <div className="flex gap-2 justify-end">
          <button onClick={onCerrar} className="btn-soft">Cancelar</button>
          <button onClick={guardar} disabled={!patologiaId || guardando} className="btn-primary">{guardando ? "Guardando…" : "Guardar"}</button>
        </div>
      </div>
    </Modal>
  );
}

export function PatologiasPaciente({ pacienteId, patologias, setPatologias }: {
  pacienteId: number; patologias: PatologiaPaciente[]; setPatologias: (l: PatologiaPaciente[]) => void;
}) {
  const [catalogo, setCatalogo] = useState<Patologia[]>([]);
  const [modal, setModal] = useState(false);
  const [creando, setCreando] = useState(false);
  const [preseleccion, setPreseleccion] = useState<number | undefined>();
  const cargarCatalogo = () => clinicaService.patologias().then(setCatalogo).catch(() => {});
  useEffect(() => { cargarCatalogo(); }, []);

  const descartar = async (p: PatologiaPaciente) => {
    try {
      setPatologias(await clinicaService.guardarPatologia(pacienteId, p.patologia_id, { activa: false, notas: "Descartada en la ficha" }));
      toast.success(`${p.nombre} descartada`);
    } catch (e) { toast.error(mensajeError(e)); }
  };
  const volverAutomatico = async (p: PatologiaPaciente) => {
    try {
      setPatologias(await clinicaService.quitarPatologia(pacienteId, p.patologia_id));
      toast.success("Volvió al cálculo automático");
    } catch (e) { toast.error(mensajeError(e)); }
  };

  return (
    <section className="panel-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-lg" style={{ color: "var(--color-text)" }}>Patologías</h3>
        <button onClick={() => setModal(true)} className="btn-soft text-sm py-1.5"><Plus className="w-4 h-4" /> Registrar</button>
      </div>
      {patologias.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Sin patologías registradas ni detectadas.</p>
      ) : (
        <ul className="space-y-2">
          {patologias.map((p) => (
            <li key={p.patologia_id} className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl" style={{ background: "var(--color-cream-50)", border: "1px solid var(--color-card-border)" }}>
              <PatologiaChip nombre={p.nombre} sigla={p.sigla ? `${p.sigla}` : null} color={p.color} grado={p.grado} />
              {p.sigla && <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{p.nombre}</span>}
              <OrigenBadge origen={p.origen} />
              {p.fecha_diagnostico && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>desde {fechaCorta(p.fecha_diagnostico)}</span>}
              <span className="flex-1" />
              {p.origen === "manual" ? (
                <button onClick={() => volverAutomatico(p)} title="Quitar la carga manual" className="text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-full hover:bg-white" style={{ color: "var(--color-text-muted)" }}>
                  <RotateCcw className="w-3.5 h-3.5" /> Quitar
                </button>
              ) : (
                <button onClick={() => descartar(p)} title="No corresponde para este paciente" className="text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-full hover:bg-white" style={{ color: "var(--color-text-muted)" }}>
                  <EyeOff className="w-3.5 h-3.5" /> Descartar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {modal && !creando && <ModalPatologia pacienteId={pacienteId} catalogo={catalogo} inicialId={preseleccion}
        onCrearNueva={() => setCreando(true)} onCerrar={() => { setModal(false); setPreseleccion(undefined); }}
        onGuardado={(l) => { setPatologias(l); setModal(false); setPreseleccion(undefined); }} />}
      {creando && <ModalNuevaPatologia onCerrar={() => setCreando(false)}
        onCreada={async (p) => { await cargarCatalogo(); setPreseleccion(p.id); setCreando(false); }} />}
    </section>
  );
}

function Ultimos({ mediciones, laboratorios }: { mediciones: Medicion[]; laboratorios: Laboratorio[] }) {
  const m = mediciones[mediciones.length - 1];
  const l = laboratorios[laboratorios.length - 1];
  if (!m && !l) return <Vacio emoji="📏" titulo="Sin mediciones todavía" texto="Cargá una medición desde la pestaña Progreso o Cuerpo." />;
  const items: [string, number | null, string, string?][] = [
    ["Peso", num(m?.peso_kg), "kg", m?.fecha],
    ["IMC", num(m?.imc), "", m?.fecha],
    ["Masa grasa", num(m?.porcentaje_masa_grasa), "%", m?.fecha],
    ["Masa magra", num(m?.porcentaje_masa_magra), "%", m?.fecha],
    ["Cintura", num(m?.circunferencia_cintura_cm), "cm", m?.fecha],
    ["Glucemia", num(l?.glucemia), "mg/dl", l?.fecha],
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {items.filter(([, v]) => v !== null).map(([et, v, u, f]) => (
        <div key={et} className="p-3 rounded-2xl" style={{ background: "linear-gradient(150deg, var(--color-primary-bg), white)", border: "1px solid var(--color-card-border)" }}>
          <p className="text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>{et}</p>
          <p className="font-display font-bold text-2xl leading-tight" style={{ color: "var(--color-text)" }}>
            {Number(v).toLocaleString("es-AR", { maximumFractionDigits: 1 })}<span className="text-sm ml-0.5 font-semibold">{u}</span>
          </p>
          {f && <p className="text-[0.7rem]" style={{ color: "var(--color-text-muted)" }}>{fechaCorta(f)}</p>}
        </div>
      ))}
    </div>
  );
}

export default function TabResumen({ ficha, patologias, setPatologias, mediciones, laboratorios }: {
  ficha: PacienteFicha; patologias: PatologiaPaciente[]; setPatologias: (l: PatologiaPaciente[]) => void;
  mediciones: Medicion[]; laboratorios: Laboratorio[];
}) {
  const p = ficha.paciente;
  return (
    <div className="grid lg:grid-cols-5 gap-5">
      <div className="lg:col-span-3 space-y-5">
        <section className="panel-card">
          <h3 className="font-display font-bold text-lg mb-3" style={{ color: "var(--color-text)" }}>Últimos valores</h3>
          <Ultimos mediciones={mediciones} laboratorios={laboratorios} />
        </section>
        <PatologiasPaciente pacienteId={p.id} patologias={patologias} setPatologias={setPatologias} />
      </div>
      <section className="panel-card lg:col-span-2">
        <h3 className="font-display font-bold text-lg mb-3" style={{ color: "var(--color-text)" }}>Datos personales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2.5">
          <Dato label="DNI" valor={p.dni} />
          <Dato label="Nacimiento" valor={p.fecha_nacimiento ? fechaCorta(p.fecha_nacimiento) : null} />
          <Dato label="Sexo" valor={p.sexo ? p.sexo.charAt(0).toUpperCase() + p.sexo.slice(1) : null} />
          <Dato label="Celular" valor={p.celular} />
          <Dato label="Email" valor={p.email} />
          <Dato label="Domicilio" valor={[p.domicilio, p.localidad].filter(Boolean).join(", ")} />
          <Dato label="Derivado por" valor={p.derivado_por} />
          <Dato label="Paciente desde" valor={p.creado_en ? fechaCorta(p.creado_en) : null} />
        </div>
        {p.observaciones_generales && (
          <div className="mt-3"><Dato label="Observaciones" valor={p.observaciones_generales} /></div>
        )}
      </section>
    </div>
  );
}
