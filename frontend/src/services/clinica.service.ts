import api from "./api";

// ── Tipos ────────────────────────────────────────────────────────────────
export interface Patologia {
  id: number;
  codigo: string;
  nombre: string;
  sigla: string | null;
  categoria: "peso" | "metabolica" | "cardiovascular" | "digestiva" | "endocrina" | "otra";
  color: string | null;
  pacientes: number;
}

export interface PatologiaPaciente {
  paciente_id: number;
  patologia_id: number;
  codigo: string;
  nombre: string;
  sigla: string | null;
  categoria: Patologia["categoria"];
  color: string | null;
  grado: string | null;
  fecha_diagnostico: string | null;
  origen: "manual" | "historia_clinica" | "imc";
  registro_id: number | null;
  notas: string | null;
}

export interface PacienteConPatologia {
  id: number; nombre: string; apellido: string; edad: number | null; sexo: string | null;
  celular: string | null; prioridad: string | null;
  grado: string | null; origen: PatologiaPaciente["origen"]; fecha_diagnostico: string | null;
  ultima_medicion: string | null; peso_kg: string | null; imc: string | null;
}

// Los NUMERIC llegan como string (igual que antes con MySQL)
export interface Medicion {
  id: number; fecha: string;
  peso_kg: string | null; talla_cm: string | null; imc: string | null; clasificacion_imc?: string | null;
  porcentaje_masa_grasa: string | null; porcentaje_masa_magra: string | null;
  masa_muscular_kg: string | null; grasa_visceral_nivel: number | null; agua_corporal_pct: string | null;
  circunferencia_cintura_cm: string | null; circunferencia_cadera_cm: string | null; indice_cintura_cadera: string | null;
  perimetro_cuello_cm: string | null; perimetro_brazo_cm: string | null; perimetro_torax_cm: string | null;
  perimetro_abdomen_cm: string | null; perimetro_muslo_cm: string | null; perimetro_pantorrilla_cm: string | null;
  presion_sistolica: number | null; presion_diastolica: number | null;
}

export interface Laboratorio {
  id: number; fecha: string;
  glucemia: string | null; hemoglobina_glicosilada: string | null; insulina: string | null; homa_ir: string | null;
  colesterol_total: string | null; hdl: string | null; ldl: string | null; trigliceridos: string | null;
  [k: string]: unknown;
}

export interface Estudio {
  id: number; paciente_id: number; fecha: string; tipo: TipoEstudio; nombre: string;
  lugar: string | null; solicitado_por: string | null; resultado_resumen: string | null;
  laboratorio_id: number | null; consulta_id: number | null;
}
export type TipoEstudio = "laboratorio" | "imagen" | "cardiologico" | "bioimpedancia" | "densitometria" | "otro";

export interface EventoSeguimiento {
  tipo: "consulta" | "medicion" | "laboratorio" | "estudio" | "plan" | "turno";
  id: number; fecha: string; creado_en: string | null; titulo: string; detalle: string | null;
}
export interface Traza {
  id: number; usuario: string | null; entidad: string; entidad_id: number | null;
  accion: "crear" | "editar" | "borrar" | "baja" | "reactivar"; resumen: string | null; creado_en: string;
}

type Datos = Record<string, unknown>;
const d = <T>(p: Promise<{ data: { data: T } }>) => p.then((r) => r.data.data);

// ── Servicio ─────────────────────────────────────────────────────────────
export const clinicaService = {
  patologias: () => d<Patologia[]>(api.get("/patologias")),
  pacientesConPatologia: (codigo: string) => d<PacienteConPatologia[]>(api.get(`/patologias/${codigo}/pacientes`)),
  patologiasDePaciente: (pid: number) => d<PatologiaPaciente[]>(api.get(`/pacientes/${pid}/patologias`)),
  guardarPatologia: (pid: number, patologiaId: number, datos: Datos) =>
    d<PatologiaPaciente[]>(api.put(`/pacientes/${pid}/patologias/${patologiaId}`, datos)),
  quitarPatologia: (pid: number, patologiaId: number) =>
    d<PatologiaPaciente[]>(api.delete(`/pacientes/${pid}/patologias/${patologiaId}`)),

  progreso: (pid: number) => d<{ mediciones: Medicion[]; laboratorios: Laboratorio[] }>(api.get(`/pacientes/${pid}/progreso`)),
  seguimiento: (pid: number) => d<{ eventos: EventoSeguimiento[]; traza: Traza[] }>(api.get(`/pacientes/${pid}/seguimiento`)),

  crearMedicion: (pid: number, datos: Datos) => d<{ id: number }>(api.post(`/pacientes/${pid}/mediciones`, datos)),
  actualizarMedicion: (id: number, datos: Datos) => api.put(`/mediciones/${id}`, datos),
  borrarMedicion: (id: number) => api.delete(`/mediciones/${id}`),

  laboratorios: (pid: number) => d<Laboratorio[]>(api.get(`/pacientes/${pid}/laboratorios`)),
  crearLaboratorio: (pid: number, datos: Datos) => d<{ id: number }>(api.post(`/pacientes/${pid}/laboratorios`, datos)),
  borrarLaboratorio: (id: number) => api.delete(`/laboratorios/${id}`),

  estudios: (pid: number) => d<Estudio[]>(api.get(`/pacientes/${pid}/estudios`)),
  crearEstudio: (pid: number, datos: Datos) => d<{ id: number }>(api.post(`/pacientes/${pid}/estudios`, datos)),
  actualizarEstudio: (id: number, datos: Datos) => api.put(`/estudios/${id}`, datos),
  borrarEstudio: (id: number) => api.delete(`/estudios/${id}`),
};

/** Mensaje legible de un error de la API (validaciones del backend). */
export function mensajeError(e: unknown, porDefecto = "No se pudo guardar"): string {
  const r = (e as { response?: { data?: { mensaje?: string; errores?: string[] } } })?.response?.data;
  return r?.mensaje || r?.errores?.[0] || porDefecto;
}

export const num = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? null : Number(v);
