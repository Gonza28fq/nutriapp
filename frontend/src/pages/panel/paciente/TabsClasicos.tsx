// Pestañas que ya existían en la ficha (historia clínica, anamnesis, consultas).
// Se mantienen igual en contenido; solo cambia el estilo.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Plus, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { consultaService } from "@/services/consulta.service";
import { Cargando, Vacio } from "@/components/ui";
import { fechaLarga, fechaCorta } from "@/utils/fecha";

type Registro = Record<string, boolean | string | number | null>;

function Encabezado({ titulo, accion }: { titulo: string; accion?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4 gap-3">
      <h3 className="font-display font-bold text-lg" style={{ color: "var(--color-text)" }}>{titulo}</h3>
      {accion}
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-primary)" }}>{titulo}</p>
      {children}
    </div>
  );
}

function Texto({ label, valor }: { label: string; valor: unknown }) {
  return (
    <div className="p-3 rounded-2xl" style={{ background: "var(--color-cream-100)" }}>
      <p className="text-xs font-bold mb-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="text-sm" style={{ color: "var(--color-text)" }}>{(valor as string) || "Sin datos"}</p>
    </div>
  );
}

export function TabHistoria({ pacienteId, historia }: { pacienteId: number; historia: Registro | null }) {
  const navigate = useNavigate();
  const ir = () => navigate(`/panel/pacientes/${pacienteId}/historia-clinica`);
  if (!historia) return (
    <section className="panel-card">
      <Vacio emoji="🩺" titulo="Todavía no hay historia clínica" texto="Antecedentes, patologías, medicación y hábitos."
        accion={<button onClick={ir} className="btn-primary">Cargar historia clínica</button>} />
    </section>
  );
  const grupos = [
    { titulo: "Antecedentes familiares", items: [["antec_familiar_diabetes", "Diabetes"], ["antec_familiar_hipertension", "Hipertensión"], ["antec_familiar_dislipemia", "Dislipemia"], ["antec_familiar_obesidad", "Obesidad"]] },
    { titulo: "Patologías declaradas", items: [["tiene_diabetes_1", "Diabetes tipo 1"], ["tiene_diabetes_2", "Diabetes tipo 2"], ["tiene_hipertension", "Hipertensión"], ["tiene_dislipemia", "Dislipemia"], ["tiene_celiaquia", "Celiaquía"], ["tiene_hipotiroidismo", "Hipotiroidismo"], ["tiene_hipertiroidismo", "Hipertiroidismo"], ["tiene_anemia", "Anemia"], ["tiene_osteoporosis", "Osteoporosis"], ["tiene_enfermedad_renal", "Enfermedad renal"]] },
    { titulo: "Hábitos", items: [["fuma", "Fuma"], ["duerme_bien", "Duerme bien"], ["presenta_ronquidos", "Ronquidos"], ["inflamacion_abdominal", "Inflamación abdominal"], ["realiza_ejercicio", "Hace actividad física"]] },
  ];
  return (
    <section className="panel-card">
      <Encabezado titulo="Historia clínica" accion={<button onClick={ir} className="btn-soft text-sm py-1.5"><Edit className="w-4 h-4" /> Editar</button>} />
      <div className="space-y-5">
        {grupos.map(({ titulo, items }) => (
          <Seccion key={titulo} titulo={titulo}>
            <div className="flex flex-wrap gap-2">
              {items.filter(([k]) => historia[k]).map(([, label]) => <span key={label} className="badge-fucsia">{label}</span>)}
              {!items.some(([k]) => historia[k]) && <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>Ninguno</span>}
            </div>
          </Seccion>
        ))}
        {(historia.medicacion_detalle || historia.alergias_alimentarias || historia.intolerancias) && (
          <Seccion titulo="Medicación, alergias e intolerancias">
            <div className="grid sm:grid-cols-3 gap-2">
              <Texto label="Medicación" valor={historia.medicacion_detalle} />
              <Texto label="Alergias" valor={historia.alergias_alimentarias} />
              <Texto label="Intolerancias" valor={historia.intolerancias} />
            </div>
          </Seccion>
        )}
        <Seccion titulo="Diagnóstico y objetivos">
          <div className="grid sm:grid-cols-2 gap-2">
            <Texto label="Diagnóstico inicial" valor={historia.diagnostico_inicial} />
            <Texto label="Objetivos iniciales" valor={historia.objetivos_iniciales} />
          </div>
        </Seccion>
      </div>
    </section>
  );
}

export function TabAnamnesis({ pacienteId, anamnesis }: { pacienteId: number; anamnesis: Registro | null }) {
  const navigate = useNavigate();
  const ir = () => navigate(`/panel/pacientes/${pacienteId}/anamnesis`);
  if (!anamnesis) return (
    <section className="panel-card">
      <Vacio emoji="🍎" titulo="Todavía no hay anamnesis" texto="Comidas del día, hábitos, líquidos y recordatorio."
        accion={<button onClick={ir} className="btn-primary">Cargar anamnesis</button>} />
    </section>
  );
  const comidas = [["Desayuno", "realiza_desayuno", "horario_desayuno"], ["Almuerzo", "realiza_almuerzo", "horario_almuerzo"],
    ["Merienda", "realiza_merienda", "horario_merienda"], ["Cena", "realiza_cena", "horario_cena"]];
  return (
    <section className="panel-card">
      <Encabezado titulo="Anamnesis alimentaria" accion={<button onClick={ir} className="btn-soft text-sm py-1.5"><Edit className="w-4 h-4" /> Editar</button>} />
      <div className="space-y-5">
        <Seccion titulo="Comidas del día">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {comidas.map(([label, realiza, horario]) => (
              <div key={label} className="p-3 rounded-2xl text-center"
                style={{ background: anamnesis[realiza] ? "var(--color-primary-bg)" : "#f6f3f5", border: `1px solid ${anamnesis[realiza] ? "var(--color-primary-border)" : "#ece6ea"}` }}>
                <p className="text-xs font-bold" style={{ color: anamnesis[realiza] ? "var(--color-primary-dark)" : "#a79aa3" }}>{label}</p>
                <p className="font-display font-bold mt-0.5" style={{ color: anamnesis[realiza] ? "var(--color-text)" : "#bdb2b9" }}>
                  {anamnesis[realiza] ? ((anamnesis[horario] as string) || "Sí") : "No"}
                </p>
              </div>
            ))}
          </div>
        </Seccion>
        <div className="grid sm:grid-cols-2 gap-2">
          {anamnesis.liquidos_consumo_diario && <Texto label="Líquidos por día" valor={anamnesis.liquidos_consumo_diario} />}
          {anamnesis.alimentos_no_le_gustan && <Texto label="No le gustan" valor={anamnesis.alimentos_no_le_gustan} />}
          {anamnesis.quien_cocina && <Texto label="Quién cocina" valor={anamnesis.quien_cocina} />}
          {anamnesis.notas && <Texto label="Notas" valor={anamnesis.notas} />}
        </div>
      </div>
    </section>
  );
}

interface ConsultaItem {
  id: number; fecha: string; tipo_consulta: string; sede_nombre?: string;
  proximo_control?: string; motivo_consulta?: string; observaciones?: string; indicaciones?: string;
}
const TIPO: Record<string, string> = { primera_vez: "Primera vez", control: "Control", seguimiento: "Seguimiento" };

export function TabConsultas({ pacienteId }: { pacienteId: number }) {
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState<ConsultaItem[] | null>(null);
  useEffect(() => {
    consultaService.porPaciente(pacienteId)
      .then((r) => setConsultas(r.consultas as ConsultaItem[]))
      .catch(() => toast.error("Error al cargar consultas"));
  }, [pacienteId]);
  const nueva = () => navigate(`/panel/pacientes/${pacienteId}/consulta/nueva`);

  return (
    <section className="panel-card">
      <Encabezado titulo="Consultas" accion={<button onClick={nueva} className="btn-primary text-sm py-1.5"><Plus className="w-4 h-4" /> Nueva consulta</button>} />
      {!consultas ? <Cargando alto="h-32" /> : consultas.length === 0 ? (
        <Vacio emoji="📋" titulo="Todavía no hay consultas" accion={<button onClick={nueva} className="btn-primary">Registrar la primera</button>} />
      ) : (
        <ul className="space-y-2.5">
          {consultas.map((c) => (
            <li key={c.id}>
              <button onClick={() => navigate(`/panel/consultas/${c.id}`)} className="w-full text-left p-4 rounded-2xl transition-colors hover:bg-[var(--color-cream-100)]"
                style={{ background: "var(--color-cream-50)", border: "1px solid var(--color-card-border)" }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold" style={{ color: "var(--color-text)" }}>{fechaLarga(c.fecha)}</span>
                  <span className="badge-fucsia">{TIPO[c.tipo_consulta] ?? c.tipo_consulta}</span>
                  <span className="id-tag">#{c.id}</span>
                  {c.sede_nombre && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>· {c.sede_nombre}</span>}
                  <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "var(--color-primary-light)" }} />
                </div>
                {c.motivo_consulta && <p className="text-sm mt-1.5" style={{ color: "var(--color-text)" }}><b>Motivo:</b> {c.motivo_consulta}</p>}
                {c.indicaciones && <p className="text-sm mt-0.5" style={{ color: "var(--color-text)" }}><b>Indicaciones:</b> {c.indicaciones}</p>}
                {c.proximo_control && <p className="text-xs mt-1 font-semibold" style={{ color: "var(--color-primary-dark)" }}>Próximo control: {fechaCorta(c.proximo_control)}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
