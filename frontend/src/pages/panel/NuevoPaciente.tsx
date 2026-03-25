import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, User, Phone, MapPin, AlertTriangle } from "lucide-react";
import { pacienteService } from "@/services/paciente.service";
import toast from "react-hot-toast";

const schema = z.object({
  nombre:                  z.string().min(1, "El nombre es requerido"),
  apellido:                z.string().min(1, "El apellido es requerido"),
  dni:                     z.string().optional(),
  fecha_nacimiento:        z.string().optional(),
  edad:                    z.coerce.number().optional(),
  sexo:                    z.enum(["masculino", "femenino", "otro"]).optional(),
  email:                   z.string().email("Email inválido").optional().or(z.literal("")),
  celular:                 z.string().optional(),
  domicilio:               z.string().optional(),
  localidad:               z.string().optional(),
  derivado_por:            z.string().optional(),
  observaciones_generales: z.string().optional(),
  prioridad:               z.enum(["normal", "alta", "urgente"]).default("normal"),
  motivo_prioridad:        z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PRIORIDADES = [
  { value: "normal",   label: "Normal",   color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0",
    desc: "Paciente sin condiciones de riesgo" },
  { value: "alta",     label: "Alta",     color: "#d97706", bg: "#fffbeb", border: "#fde68a",
    desc: "Requiere seguimiento frecuente" },
  { value: "urgente",  label: "Urgente",  color: "#dc2626", bg: "#fef2f2", border: "#fecaca",
    desc: "Caso grave, atención prioritaria" },
];

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
        <h2 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>
          {titulo}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Campo({ label, error, requerido, children }: {
  label: string; error?: string; requerido?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
        {label} {requerido && <span style={{ color: "var(--color-primary)" }}>*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function NuevoPaciente() {
  const navigate = useNavigate();
  const [guardando, setGuardando]   = useState(false);
  const [prioridad, setPrioridad]   = useState<"normal"|"alta"|"urgente">("normal");

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { prioridad: "normal" },
  });

  const motivoPrioridad = watch("motivo_prioridad");

  const onSubmit = async (data: FormData) => {
    try {
      setGuardando(true);
      const payload = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== "" && v !== undefined)
      );
      const paciente = await pacienteService.crear(payload);
      toast.success("Paciente creado correctamente");
      navigate(`/panel/pacientes/${paciente.id}`);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { mensaje?: string } } })
        ?.response?.data?.mensaje ?? "Error al crear el paciente";
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  const prioridadActual = PRIORIDADES.find(p => p.value === prioridad)!;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/panel/pacientes")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: "var(--color-text)" }}>
            Nuevo paciente
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Completá los datos para crear la ficha
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5">

        {/* ── Datos personales ── */}
        <Seccion icon={User} titulo="Datos personales">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Nombre" error={errors.nombre?.message} requerido>
              <input type="text" placeholder="Ej: Juan"
                className={`input-base ${errors.nombre ? "border-red-400" : ""}`}
                {...register("nombre")} />
            </Campo>
            <Campo label="Apellido" error={errors.apellido?.message} requerido>
              <input type="text" placeholder="Ej: Pérez"
                className={`input-base ${errors.apellido ? "border-red-400" : ""}`}
                {...register("apellido")} />
            </Campo>
            <Campo label="DNI">
              <input type="text" placeholder="Ej: 12345678" className="input-base" {...register("dni")} />
            </Campo>
            <Campo label="Fecha de nacimiento">
              <input type="date" className="input-base" {...register("fecha_nacimiento")} />
            </Campo>
            <Campo label="Edad">
              <input type="number" placeholder="Ej: 35" className="input-base" {...register("edad")} />
            </Campo>
            <Campo label="Sexo">
              <select className="input-base" {...register("sexo")}>
                <option value="">Seleccionar...</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </Campo>
            <Campo label="Derivado por">
              <input type="text" placeholder="Ej: Dr. García" className="input-base" {...register("derivado_por")} />
            </Campo>
          </div>
        </Seccion>

        {/* ── Contacto ── */}
        <Seccion icon={Phone} titulo="Contacto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Celular">
              <input type="text" placeholder="Ej: 3814123456" className="input-base" {...register("celular")} />
            </Campo>
            <Campo label="Email" error={errors.email?.message}>
              <input type="email" placeholder="Ej: juan@email.com"
                className={`input-base ${errors.email ? "border-red-400" : ""}`}
                {...register("email")} />
            </Campo>
            <Campo label="Domicilio">
              <input type="text" placeholder="Ej: San Martín 123" className="input-base" {...register("domicilio")} />
            </Campo>
            <Campo label="Localidad">
              <input type="text" placeholder="Ej: Amaicha del Valle" className="input-base" {...register("localidad")} />
            </Campo>
          </div>
        </Seccion>

        {/* ── Prioridad / gravedad ── */}
        <Seccion icon={AlertTriangle} titulo="Prioridad clínica">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Indicá el nivel de atención que requiere este paciente.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRIORIDADES.map(p => (
              <button key={p.value} type="button"
                onClick={() => { setPrioridad(p.value as any); setValue("prioridad", p.value as any); }}
                className="p-4 rounded-2xl text-left transition-all border-2"
                style={{
                  borderColor: prioridad === p.value ? p.color : "var(--color-card-border)",
                  background:  prioridad === p.value ? p.bg : "var(--color-card-bg)",
                }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                  <span className="font-semibold text-sm" style={{ color: p.color }}>{p.label}</span>
                </div>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{p.desc}</p>
              </button>
            ))}
          </div>

          {prioridad !== "normal" && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
                Motivo de prioridad {prioridad === "urgente" && <span style={{ color: "#dc2626" }}>*</span>}
              </label>
              <textarea rows={2} className="input-base resize-none"
                placeholder={prioridad === "urgente"
                  ? "Describí el motivo de urgencia..."
                  : "Describí por qué requiere atención prioritaria..."}
                {...register("motivo_prioridad")} />
            </div>
          )}

          {/* Badge preview */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl w-fit"
            style={{ background: prioridadActual.bg, border: `1px solid ${prioridadActual.border}` }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: prioridadActual.color }} />
            <span className="text-xs font-semibold" style={{ color: prioridadActual.color }}>
              Prioridad {prioridadActual.label}
            </span>
            {motivoPrioridad && (
              <span className="text-xs" style={{ color: prioridadActual.color }}>— {motivoPrioridad}</span>
            )}
          </div>
        </Seccion>

        {/* ── Notas clínicas ── */}
        <Seccion icon={MapPin} titulo="Notas clínicas">
          <Campo label="Observaciones generales">
            <textarea rows={4} className="input-base resize-none"
              placeholder="Notas adicionales, condiciones previas, alergias conocidas..."
              {...register("observaciones_generales")} />
          </Campo>
        </Seccion>

        {/* Botones */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate("/panel/pacientes")}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
            Cancelar
          </button>
          <button type="submit" disabled={guardando}
            className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {guardando
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Save className="w-4 h-4" />}
            Guardar paciente
          </button>
        </div>
      </form>
    </div>
  );
}