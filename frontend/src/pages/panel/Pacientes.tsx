import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Search, ChevronRight, Phone, MapPin, UserCheck, Download } from "lucide-react";
import { pacienteService } from "@/services/paciente.service";
import { Paciente } from "@/types";
import { exportarPacientesExcel } from "@/services/export.service";
import toast from "react-hot-toast";

type FiltroActivo = "activos" | "bajas";

export default function Pacientes() {
  const navigate = useNavigate();
  const [pacientes, setPacientes]       = useState<Paciente[]>([]);
  const [busqueda, setBusqueda]         = useState("");
  const [cargando, setCargando]         = useState(true);
  const [total, setTotal]               = useState(0);
  const [pagina, setPagina]             = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtro, setFiltro]             = useState<FiltroActivo>("activos");
  const [exportando, setExportando]     = useState(false);

  const cargarPacientes = useCallback(async (busq: string, pag: number, f: FiltroActivo) => {
    try {
      setCargando(true);
      const res = await pacienteService.listar(busq || undefined, pag, 20, f === "activos");
      setPacientes(res.items);
      setTotal(res.total);
      setTotalPaginas(res.totalPaginas);
    } catch {
      toast.error("Error al cargar pacientes");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { setPagina(1); cargarPacientes(busqueda, 1, filtro); }, 350);
    return () => clearTimeout(timer);
  }, [busqueda, filtro, cargarPacientes]);

  useEffect(() => { cargarPacientes(busqueda, pagina, filtro); }, [pagina]);

  const reactivar = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await pacienteService.reactivar(id);
      toast.success("Paciente reactivado");
      cargarPacientes(busqueda, pagina, filtro);
    } catch { toast.error("Error al reactivar paciente"); }
  };

  const handleExportarExcel = async () => {
    try {
      setExportando(true);
      // Traer TODOS los pacientes sin paginación para exportar
      const res = await pacienteService.listar(busqueda || undefined, 1, 9999, filtro === "activos");
      exportarPacientesExcel(res.items);
      toast.success(`${res.items.length} pacientes exportados`);
    } catch {
      toast.error("Error al exportar");
    } finally {
      setExportando(false);
    }
  };

  const iniciales = (nombre: string, apellido: string) =>
    `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: "var(--color-text)" }}>Pacientes</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            {total} {total === 1 ? "paciente" : "pacientes"} {filtro === "activos" ? "activos" : "dados de baja"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportarExcel} disabled={exportando || cargando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)", border: "1px solid var(--color-primary-border)" }}>
            {exportando
              ? <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
              : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">Excel</span>
          </button>
          {filtro === "activos" && (
            <button onClick={() => navigate("/panel/pacientes/nuevo")} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo paciente</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "var(--color-cream-200)" }}>
        <button onClick={() => { setFiltro("activos"); setPagina(1); }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${filtro === "activos" ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
          style={{ color: filtro === "activos" ? "var(--color-text)" : "var(--color-text-muted)" }}>
          Activos
        </button>
        <button onClick={() => { setFiltro("bajas"); setPagina(1); }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${filtro === "bajas" ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
          style={{ color: filtro === "bajas" ? "var(--color-text)" : "var(--color-text-muted)" }}>
          Dados de baja
        </button>
      </div>

      {/* Buscador */}
      <div className="panel-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-primary)" }} />
          <input type="text" placeholder="Buscar por nombre, apellido o DNI..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="input-base pl-10" />
        </div>
      </div>

      {/* Lista */}
      <div className="panel-card p-0 overflow-hidden">
        {cargando ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
          </div>
        ) : pacientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--color-primary-bg)" }}>
              <Users className="w-7 h-7" style={{ color: "var(--color-primary)" }} />
            </div>
            <p className="font-medium" style={{ color: "var(--color-text)" }}>
              {busqueda ? "No se encontraron pacientes" : filtro === "activos" ? "Todavia no hay pacientes" : "No hay pacientes dados de baja"}
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {busqueda ? "Probá con otro nombre o DNI" : filtro === "activos" ? "Creá el primer paciente con el botón de arriba" : "Los pacientes dados de baja aparecen aquí"}
            </p>
          </div>
        ) : (
          <div>
            {pacientes.map((p, i) => (
              <div key={p.id}
                onClick={() => navigate(`/panel/pacientes/${p.id}`)}
                className="flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors hover:bg-cream-100"
                style={{ borderBottom: i < pacientes.length - 1 ? "1px solid var(--color-card-border)" : "none" }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                  style={{ background: filtro === "bajas" ? "#9ca3af" : "var(--color-primary)" }}>
                  {iniciales(p.nombre, p.apellido)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: filtro === "bajas" ? "#6b7280" : "var(--color-text)" }}>
                    {p.apellido}, {p.nombre}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {p.dni && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>DNI {p.dni}</span>}
                    {p.celular && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        <Phone className="w-3 h-3" />{p.celular}
                      </span>
                    )}
                    {p.localidad && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        <MapPin className="w-3 h-3" />{p.localidad}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {p.edad && <span className="badge-fucsia">{p.edad} años</span>}
                  {p.sexo && <span className="badge-rose capitalize">{p.sexo}</span>}
                  {(p as any).prioridad && (p as any).prioridad !== "normal" && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                      style={{
                        background: (p as any).prioridad === "urgente" ? "#fef2f2" : "#fffbeb",
                        color:      (p as any).prioridad === "urgente" ? "#dc2626" : "#d97706",
                      }}>
                      ⚠ {(p as any).prioridad === "urgente" ? "Urgente" : "Alta"}
                    </span>
                  )}
                  {filtro === "bajas" ? (
                    <button onClick={e => reactivar(e, p.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors hover:bg-green-50"
                      style={{ color: "#16a34a", border: "1px solid #bbf7d0" }}>
                      <UserCheck className="w-3.5 h-3.5" /> Reactivar
                    </button>
                  ) : (
                    <ChevronRight className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginacion */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
            Anterior
          </button>
          <span className="text-sm px-3" style={{ color: "var(--color-text-muted)" }}>{pagina} / {totalPaginas}</span>
          <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}