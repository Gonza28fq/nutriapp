import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Calendar, MapPin, Download, Search, ChevronRight, Filter } from "lucide-react";
import { consultaService } from "@/services/consulta.service";
import { Consulta } from "@/types";
import { exportarConsultasExcel } from "@/services/export.service";
import toast from "react-hot-toast";

interface ConsultaConPaciente extends Consulta {
  paciente_nombre?: string;
  paciente_apellido?: string;
  sede_nombre?: string;
}

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  primera_vez: { label: "Primera vez", color: "var(--color-primary)", bg: "var(--color-primary-bg)" },
  control:     { label: "Control",     color: "#16a34a",              bg: "#f0fdf4" },
  seguimiento: { label: "Seguimiento", color: "#d97706",              bg: "#fffbeb" },
};

export default function Consultas() {
  const navigate = useNavigate();
  const [consultas, setConsultas]   = useState<ConsultaConPaciente[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [busqueda, setBusqueda]     = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await consultaService.listar(9999);
      setConsultas(data as ConsultaConPaciente[]);
    } catch {
      toast.error("Error al cargar consultas");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const consultasFiltradas = consultas.filter(c => {
    const nombre = `${c.paciente_apellido ?? ""} ${c.paciente_nombre ?? ""}`.toLowerCase();
    const coincideBusq = !busqueda || nombre.includes(busqueda.toLowerCase());
    const coincideTipo = !filtroTipo || c.tipo_consulta === filtroTipo;
    return coincideBusq && coincideTipo;
  });

  const formatFecha = (fecha: string) =>
    new Date(fecha.includes("T") ? fecha : fecha + "T12:00:00")
      .toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: "var(--color-text)" }}>Consultas</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            {consultasFiltradas.length} de {consultas.length} consulta{consultas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            if (!consultasFiltradas.length) { toast.error("No hay consultas para exportar"); return; }
            exportarConsultasExcel(consultasFiltradas);
            toast.success(`${consultasFiltradas.length} consultas exportadas`);
          }}
          disabled={cargando || !consultasFiltradas.length}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)", border: "1px solid var(--color-primary-border)" }}>
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Excel</span>
        </button>
      </div>

      {/* Buscador + filtro */}
      <div className="panel-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-primary)" }} />
          <input type="text" placeholder="Buscar por paciente..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="input-base pl-10" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--color-primary)" }} />
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            className="input-base pl-9 w-full sm:w-auto">
            <option value="">Todos los tipos</option>
            <option value="primera_vez">Primera vez</option>
            <option value="control">Control</option>
            <option value="seguimiento">Seguimiento</option>
          </select>
        </div>
      </div>

      {/* Contadores por tipo — clickeables para filtrar */}
      {!cargando && consultas.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(TIPO_CONFIG).map(([key, { label, color, bg }]) => {
            const count   = consultas.filter(c => c.tipo_consulta === key).length;
            const activo  = filtroTipo === key;
            return (
              <button key={key} onClick={() => setFiltroTipo(activo ? "" : key)}
                className="rounded-2xl p-4 text-center transition-all"
                style={{
                  background: activo ? color : bg,
                  border:     `1px solid ${color}44`,
                }}>
                <p className="text-2xl font-bold" style={{ color: activo ? "white" : color }}>{count}</p>
                <p className="text-xs mt-0.5 font-medium" style={{ color: activo ? "white" : color }}>{label}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Lista */}
      <div className="panel-card p-0 overflow-hidden">
        {cargando ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
          </div>
        ) : consultasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--color-primary-bg)" }}>
              <ClipboardList className="w-7 h-7" style={{ color: "var(--color-primary)" }} />
            </div>
            <p className="font-medium" style={{ color: "var(--color-text)" }}>
              {busqueda || filtroTipo ? "No hay consultas que coincidan" : "No hay consultas registradas"}
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {busqueda || filtroTipo ? "Probá con otros filtros" : "Las consultas se registran desde la ficha de cada paciente"}
            </p>
          </div>
        ) : (
          consultasFiltradas.map((c, i) => {
            const tipo = TIPO_CONFIG[c.tipo_consulta] ?? TIPO_CONFIG.control;
            return (
              <div key={c.id}
                onClick={() => navigate(`/panel/consultas/${c.id}`)}
                className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
                style={{ borderBottom: i < consultasFiltradas.length - 1 ? "1px solid var(--color-card-border)" : "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--color-cream-100)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                  style={{ background: "var(--color-primary)" }}>
                  {c.paciente_apellido && c.paciente_nombre
                    ? `${c.paciente_apellido.charAt(0)}${c.paciente_nombre.charAt(0)}`.toUpperCase()
                    : "?"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                      {c.paciente_apellido && c.paciente_nombre
                        ? `${c.paciente_apellido}, ${c.paciente_nombre}`
                        : `Paciente #${c.paciente_id}`}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                      style={{ background: tipo.bg, color: tipo.color }}>
                      {tipo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      <Calendar className="w-3 h-3" />{formatFecha(c.fecha)}
                    </span>
                    {c.sede_nombre && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        <MapPin className="w-3 h-3" />{c.sede_nombre}
                      </span>
                    )}
                    {c.motivo_consulta && (
                      <span className="text-xs truncate max-w-xs" style={{ color: "var(--color-text-muted)" }}>
                        · {c.motivo_consulta}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-primary)" }} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}