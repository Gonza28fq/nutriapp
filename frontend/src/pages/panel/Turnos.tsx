import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Download,
  MapPin, Clock, User, Check, X, Calendar,
  Trash2, Ban, ChevronDown
} from "lucide-react";
import { turnoService } from "@/services/turno.service";
import { Turno } from "@/types";
import { exportarTurnosExcel } from "@/services/export.service";
import api from "@/services/api";
import toast from "react-hot-toast";

const SEDES = [
  { id: 0, nombre: "Todas" },
  { id: 1, nombre: "Amaicha" },
  { id: 2, nombre: "Colalao" },
];

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const estadoConfigFixed = {
  pendiente: { label: "Pendiente", color: "#f475a8", bg: "#fff0f6" },
  presente:  { label: "Presente",  color: "#16a34a", bg: "#f0fdf4" },
  ausente:   { label: "Ausente",   color: "#dc2626", bg: "#fef2f2" },
  cancelado: { label: "Cancelado", color: "#9ca3af", bg: "#f9fafb" },
};

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function MenuEstado({ turno, onCambiar, onCancelar, onEliminar }: {
  turno: Turno;
  onCambiar: (id: number, estado: string) => void;
  onCancelar: (turno: Turno) => void;
  onEliminar: (turno: Turno) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const estado = estadoConfigFixed[turno.estado];

  return (
    <div className="relative">
      <button onClick={() => setAbierto(a => !a)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ background: estado.bg, color: estado.color }}>
        {estado.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-2xl shadow-lg overflow-hidden w-44"
            style={{ border: "1px solid var(--color-card-border)" }}>
            {Object.entries(estadoConfigFixed)
              .filter(([key]) => key !== turno.estado)
              .map(([key, cfg]) => (
                <button key={key}
                  onClick={() => { onCambiar(turno.id, key); setAbierto(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors flex items-center gap-2"
                  style={{ color: cfg.color, borderBottom: "1px solid var(--color-card-border)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-primary-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                  {cfg.label}
                </button>
              ))}
            {turno.estado !== "cancelado" && (
              <button onClick={() => { onCancelar(turno); setAbierto(false); }}
                className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-amber-50 transition-colors flex items-center gap-2"
                style={{ color: "#d97706", borderBottom: "1px solid var(--color-card-border)" }}>
                <Ban className="w-3 h-3" /> Cancelar turno
              </button>
            )}
            <button onClick={() => { onEliminar(turno); setAbierto(false); }}
              className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
              style={{ color: "#dc2626" }}>
              <Trash2 className="w-3 h-3" /> Eliminar turno
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ModalConfirmacion({ titulo, descripcion, labelConfirmar, variante, onConfirmar, onCancelar, cargando }: {
  titulo: string; descripcion: string; labelConfirmar: string;
  variante: "danger" | "warning"; onConfirmar: () => void; onCancelar: () => void; cargando: boolean;
}) {
  const color = variante === "danger" ? "#dc2626" : "#d97706";
  const bg    = variante === "danger" ? "#fef2f2" : "#fffbeb";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden" style={{ background: "var(--color-card-bg)" }}>
        <div className="p-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: bg }}>
            {variante === "danger" ? <Trash2 className="w-6 h-6" style={{ color }} /> : <Ban className="w-6 h-6" style={{ color }} />}
          </div>
          <h3 className="font-display text-lg font-bold mb-1" style={{ color: "var(--color-text)" }}>{titulo}</h3>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{descripcion}</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onCancelar} disabled={cargando}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
            Cancelar
          </button>
          <button onClick={onConfirmar} disabled={cargando}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center"
            style={{ background: color }}>
            {cargando ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Turnos() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(toLocalDateString(new Date()));
  const [sedeSeleccionada, setSedeSeleccionada]   = useState(0);
  const [turnos, setTurnos]       = useState<Turno[]>([]);
  const [cargando, setCargando]   = useState(true);
  const [modalNuevo, setModalNuevo]           = useState(false);
  const [turnoACancelar, setTurnoACancelar]   = useState<Turno | null>(null);
  const [turnoAEliminar, setTurnoAEliminar]   = useState<Turno | null>(null);
  const [procesando, setProcesando]           = useState(false);

  const cargarTurnos = useCallback(async () => {
    try {
      setCargando(true);
      const res = await turnoService.porFecha(fechaSeleccionada, sedeSeleccionada || undefined);
      setTurnos(res);
    } catch {
      toast.error("Error al cargar turnos");
    } finally {
      setCargando(false);
    }
  }, [fechaSeleccionada, sedeSeleccionada]);

  useEffect(() => { cargarTurnos(); }, [cargarTurnos]);

  const cambiarDia = (dias: number) => {
    const fecha = new Date(fechaSeleccionada + "T12:00:00");
    fecha.setDate(fecha.getDate() + dias);
    setFechaSeleccionada(toLocalDateString(fecha));
  };

  const cambiarEstado = async (id: number, estado: string) => {
    try {
      await turnoService.actualizarEstado(id, estado);
      toast.success("Estado actualizado");
      cargarTurnos();
    } catch { toast.error("Error al actualizar estado"); }
  };

  const confirmarCancelar = async () => {
    if (!turnoACancelar) return;
    try {
      setProcesando(true);
      await turnoService.actualizarEstado(turnoACancelar.id, "cancelado");
      toast.success("Turno cancelado");
      cargarTurnos();
    } catch { toast.error("Error al cancelar turno"); }
    finally { setProcesando(false); setTurnoACancelar(null); }
  };

  const confirmarEliminar = async () => {
    if (!turnoAEliminar) return;
    try {
      setProcesando(true);
      await turnoService.eliminar(turnoAEliminar.id);
      toast.success("Turno eliminado");
      cargarTurnos();
    } catch { toast.error("Error al eliminar turno"); }
    finally { setProcesando(false); setTurnoAEliminar(null); }
  };

  const fechaObj         = new Date(fechaSeleccionada + "T12:00:00");
  const esHoy            = fechaSeleccionada === toLocalDateString(new Date());
  const diaSemana        = DIAS_SEMANA[fechaObj.getDay()];
  const turnosPendientes = turnos.filter(t => t.estado === "pendiente").length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: "var(--color-text)" }}>Turnos</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            {turnos.length} turno{turnos.length !== 1 ? "s" : ""} — {turnosPendientes} pendiente{turnosPendientes !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!turnos.length) { toast.error("No hay turnos para exportar"); return; }
              exportarTurnosExcel(turnos, fechaSeleccionada);
              toast.success(`${turnos.length} turnos exportados`);
            }}
            disabled={cargando || !turnos.length}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
            style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)", border: "1px solid var(--color-primary-border)" }}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button onClick={() => setModalNuevo(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo turno</span>
          </button>
        </div>
      </div>

      {/* Navegador fecha + sedes */}
      <div className="panel-card p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-3 flex-1">
          <button onClick={() => cambiarDia(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
              <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                {diaSemana} {fechaObj.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
              </span>
              {esHoy && <span className="badge-fucsia text-xs">Hoy</span>}
            </div>
            <input type="date" value={fechaSeleccionada}
              onChange={e => setFechaSeleccionada(e.target.value)}
              className="text-xs mt-1 border-0 bg-transparent text-center cursor-pointer"
              style={{ color: "var(--color-text-muted)" }} />
          </div>
          <button onClick={() => cambiarDia(1)} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2">
          {SEDES.map(sede => (
            <button key={sede.id} onClick={() => setSedeSeleccionada(sede.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={sedeSeleccionada === sede.id
                ? { background: "var(--color-primary)", color: "white" }
                : { background: "var(--color-primary-bg)", color: "var(--color-text-muted)" }}>
              {sede.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(estadoConfigFixed).map(([key, { label, color, bg }]) => {
          const count = turnos.filter(t => t.estado === key).length;
          return (
            <div key={key} className="rounded-xl p-3 text-center"
              style={{ background: bg, border: `1px solid ${color}33` }}>
              <p className="text-2xl font-bold" style={{ color }}>{count}</p>
              <p className="text-xs mt-0.5" style={{ color }}>{label}</p>
            </div>
          );
        })}
      </div>

      {/* Lista */}
      <div className="panel-card p-0 overflow-hidden">
        {cargando ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
          </div>
        ) : turnos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--color-primary-bg)" }}>
              <Calendar className="w-7 h-7" style={{ color: "var(--color-primary)" }} />
            </div>
            <p className="font-medium" style={{ color: "var(--color-text)" }}>No hay turnos para este día</p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Agregá un turno con el botón de arriba</p>
          </div>
        ) : (
          turnos.map((turno, i) => {
            const tipo = {
              primera_vez: { label: "Primera vez", bg: "var(--color-primary-bg)", color: "var(--color-primary)" },
              control:     { label: "Control",     bg: "var(--color-cream-100)",  color: "var(--color-text-muted)" },
              seguimiento: { label: "Seguimiento", bg: "var(--color-cream-100)",  color: "var(--color-text-muted)" },
            }[turno.tipo_consulta] ?? { label: turno.tipo_consulta, bg: "var(--color-primary-bg)", color: "var(--color-primary)" };
            return (
              <div key={turno.id} className="flex items-center gap-4 px-5 py-4"
                style={{ borderBottom: i < turnos.length - 1 ? "1px solid var(--color-card-border)" : "none" }}>
                <div className="w-14 text-center flex-shrink-0">
                  {turno.hora ? (
                    <div className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                      <Clock className="w-3 h-3" />
                      <span className="text-sm font-medium">{turno.hora.slice(0, 5)}</span>
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--color-primary)" }}>Espontáneo</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <User className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-primary)" }} />
                    <span className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
                      {turno.paciente_apellido && turno.paciente_nombre
                        ? `${turno.paciente_apellido}, ${turno.paciente_nombre}`
                        : "Paciente espontáneo"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: tipo.bg, color: tipo.color }}>
                      {tipo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" style={{ color: "var(--color-primary)" }} />
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{turno.sede_nombre}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {turno.estado === "pendiente" && (
                    <div className="flex gap-1">
                      <button onClick={() => cambiarEstado(turno.id, "presente")}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "#f0fdf4", color: "#16a34a" }}>
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => cambiarEstado(turno.id, "ausente")}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "#fef2f2", color: "#dc2626" }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <MenuEstado turno={turno} onCambiar={cambiarEstado}
                    onCancelar={setTurnoACancelar} onEliminar={setTurnoAEliminar} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {modalNuevo && (
        <ModalNuevoTurno fecha={fechaSeleccionada}
          onClose={() => setModalNuevo(false)}
          onCreado={() => { setModalNuevo(false); cargarTurnos(); }} />
      )}
      {turnoACancelar && (
        <ModalConfirmacion titulo="Cancelar turno"
          descripcion={`¿Cancelar el turno de ${turnoACancelar.paciente_nombre || "paciente espontáneo"}?`}
          labelConfirmar="Cancelar turno" variante="warning"
          onConfirmar={confirmarCancelar} onCancelar={() => setTurnoACancelar(null)} cargando={procesando} />
      )}
      {turnoAEliminar && (
        <ModalConfirmacion titulo="Eliminar turno"
          descripcion={`¿Eliminar definitivamente el turno de ${turnoAEliminar.paciente_nombre || "paciente espontáneo"}?`}
          labelConfirmar="Eliminar" variante="danger"
          onConfirmar={confirmarEliminar} onCancelar={() => setTurnoAEliminar(null)} cargando={procesando} />
      )}
    </div>
  );
}

interface PacienteSugerido { id: number; nombre: string; apellido: string; }

function ModalNuevoTurno({ fecha, onClose, onCreado }: { fecha: string; onClose: () => void; onCreado: () => void; }) {
  const [form, setForm] = useState({
    sede_id: "1", fecha, hora: "", tipo: "agendado",
    tipo_consulta: "primera_vez", notas_turno: ""
  });
  const [guardando, setGuardando]             = useState(false);
  const [busquedaPaciente, setBusquedaPaciente] = useState("");
  const [pacientes, setPacientes]             = useState<PacienteSugerido[]>([]);
  const [pacienteId, setPacienteId]           = useState<number | undefined>();

  useEffect(() => {
    if (busquedaPaciente.length < 2) { setPacientes([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/pacientes?busqueda=${busquedaPaciente}&limite=5`);
        setPacientes(data.data.items);
      } catch { /* ignore */ }
    }, 350);
    return () => clearTimeout(timer);
  }, [busquedaPaciente]);

  const guardar = async () => {
    try {
      setGuardando(true);
      await turnoService.crear({
        paciente_id: pacienteId,
        sede_id: Number(form.sede_id),
        fecha: form.fecha,
        hora: form.hora || undefined,
        tipo: form.tipo as Turno["tipo"],
        tipo_consulta: form.tipo_consulta as Turno["tipo_consulta"],
        estado: "pendiente",
        notas_turno: form.notas_turno || undefined,
      });
      toast.success("Turno creado correctamente");
      onCreado();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje ?? "Error al crear el turno";
      toast.error(msg);
    } finally { setGuardando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 overflow-y-auto"
        style={{ background: "var(--color-card-bg)", maxHeight: "90vh" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl font-bold" style={{ color: "var(--color-text)" }}>Nuevo turno</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
              Paciente <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>(opcional)</span>
            </label>
            <input type="text" className="input-base" placeholder="Buscar por nombre o DNI..."
              value={busquedaPaciente}
              onChange={e => { setBusquedaPaciente(e.target.value); setPacienteId(undefined); }} />
            {pacientes.length > 0 && !pacienteId && (
              <div className="mt-1 rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-card-border)" }}>
                {pacientes.map((p, i) => (
                  <button key={p.id} type="button"
                    onClick={() => { setPacienteId(p.id); setBusquedaPaciente(`${p.apellido}, ${p.nombre}`); setPacientes([]); }}
                    className="w-full text-left px-3 py-2 text-sm transition-colors"
                    style={{ color: "var(--color-text)", borderBottom: i < pacientes.length - 1 ? "1px solid var(--color-card-border)" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--color-primary-bg)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    {p.apellido}, {p.nombre}
                  </button>
                ))}
              </div>
            )}
            {pacienteId && (
              <div className="mt-1 flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: "var(--color-primary-bg)" }}>
                <span className="text-sm" style={{ color: "var(--color-primary)" }}>✓ Paciente seleccionado</span>
                <button type="button" onClick={() => { setPacienteId(undefined); setBusquedaPaciente(""); }}
                  className="text-xs" style={{ color: "var(--color-text-muted)" }}>Cambiar</button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Sede</label>
            <select className="input-base" value={form.sede_id} onChange={e => setForm({ ...form, sede_id: e.target.value })}>
              <option value="1">Amaicha</option>
              <option value="2">Colalao</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Fecha</label>
            <input type="date" className="input-base" value={form.fecha}
              onChange={e => setForm({ ...form, fecha: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
              Hora <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>(opcional)</span>
            </label>
            <input type="time" className="input-base" value={form.hora}
              onChange={e => setForm({ ...form, hora: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Tipo</label>
            <select className="input-base" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
              <option value="agendado">Agendado</option>
              <option value="espontaneo">Espontáneo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Tipo de consulta</label>
            <select className="input-base" value={form.tipo_consulta}
              onChange={e => setForm({ ...form, tipo_consulta: e.target.value })}>
              <option value="primera_vez">Primera vez</option>
              <option value="control">Control</option>
              <option value="seguimiento">Seguimiento</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Notas</label>
            <textarea rows={2} className="input-base resize-none" value={form.notas_turno}
              onChange={e => setForm({ ...form, notas_turno: e.target.value })}
              placeholder="Notas opcionales..." />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando}
            className="flex-1 btn-primary py-2.5 disabled:opacity-60 flex items-center justify-center gap-2">
            {guardando
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : "Guardar turno"}
          </button>
        </div>
      </div>
    </div>
  );
}