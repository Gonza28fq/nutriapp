import { Request } from "express";

export interface AuthRequest extends Request {
  usuario?: {
    id: number;
    email: string;
    nombre: string;
    rol: "admin" | "nutricionista";
  };
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  mensaje?: string;
  errores?: string[];
}

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
  creado_en: string;
}
