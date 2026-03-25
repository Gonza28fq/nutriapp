export interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  dni?: string;
  fecha_nacimiento?: string;
  edad?: number;
  sexo?: "masculino" | "femenino" | "otro";
  email?: string;
  celular?: string;
  domicilio?: string;
  localidad?: string;
  derivado_por?: string;
  activo: boolean;
  observaciones_generales?: string;
  creado_en: string;
}

export interface Turno {
  id: number;
  paciente_id?: number;
  sede_id: number;
  fecha: string;
  hora?: string;
  tipo: "agendado" | "espontaneo";
  tipo_consulta: "primera_vez" | "control" | "seguimiento";
  estado: "pendiente" | "presente" | "ausente" | "cancelado";
  notas_turno?: string;
  paciente_nombre?: string;
  paciente_apellido?: string;
  sede_nombre?: string;
}

export interface Consulta {
  id: number;
  paciente_id: number;
  turno_id?: number;
  sede_id?: number;
  fecha: string;
  tipo_consulta: "primera_vez" | "control" | "seguimiento";
  motivo_consulta?: string;
  problemas?: string;
  objetivos?: string;
  observaciones?: string;
  indicaciones?: string;
  proximo_control?: string;
  creado_en: string;
}

export interface Medicion {
  id: number;
  paciente_id: number;
  fecha: string;
  peso_kg?: number;
  talla_cm?: number;
  imc?: number;
  clasificacion_imc?: string;
  circunferencia_cintura_cm?: number;
  porcentaje_masa_grasa?: number;
  porcentaje_masa_magra?: number;
  presion_sistolica?: number;
  presion_diastolica?: number;
  frecuencia_cardiaca?: number;
  notas?: string;
}

export interface Plan {
  id: number;
  paciente_id: number;
  nombre?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado: "borrador" | "activo" | "vencido" | "archivado";
  calorias_objetivo_kcal?: number;
  proteinas_objetivo_g?: number;
  carbohidratos_objetivo_g?: number;
  grasas_objetivo_g?: number;
  observaciones?: string;
}

export type MomentoComida = "desayuno" | "almuerzo" | "merienda" | "cena" | "colacion_am" | "colacion_pm";

export interface PlanComida {
  id: number;
  plan_id: number;
  dia: number;
  momento: MomentoComida;
  descripcion: string;
  receta_id?: number;
  calorias_kcal?: number;
  proteinas_g?: number;
  carbohidratos_g?: number;
  grasas_g?: number;
  notas?: string;
}

export interface BlogPost {
  id: number;
  categoria_id?: number;
  titulo: string;
  slug: string;
  resumen?: string;
  contenido: string;
  imagen_portada?: string;
  estado: "borrador" | "publicado" | "archivado";
  publicado_en?: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  mensaje?: string;
}

export interface PaginatedResponse<T> {
  ok: boolean;
  data: {
    items: T[];
    total: number;
    pagina: number;
    totalPaginas: number;
  };
}