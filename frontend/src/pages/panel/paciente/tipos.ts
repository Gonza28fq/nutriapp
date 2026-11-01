export interface PacienteFicha {
  paciente: {
    id: number; nombre: string; apellido: string; dni?: string;
    fecha_nacimiento?: string; edad?: number; sexo?: string; email?: string;
    celular?: string; domicilio?: string; localidad?: string; derivado_por?: string;
    observaciones_generales?: string; activo: boolean; creado_en: string;
    prioridad?: "normal" | "alta" | "urgente"; motivo_prioridad?: string;
  };
  historiaClinica: Record<string, unknown> | null;
  anamnesis: Record<string, unknown> | null;
}
