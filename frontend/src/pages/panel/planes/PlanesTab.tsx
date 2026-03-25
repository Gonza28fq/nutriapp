import { useState, useEffect, useCallback } from "react";
import {
  Plus, ChevronRight, UtensilsCrossed, X, Search,
  Flame, Beef, Wheat, Droplets, Trash2, Edit2, Check, FileDown, Download
} from "lucide-react";
import { planService, PlanDetalle, PlanForm, ComidaForm, PlanComidaDetalle } from "@/services/plan.service";
import { recetaService, Receta } from "@/services/receta.services";
import { pacienteService } from "@/services/paciente.service";
import { MomentoComida } from "@/types";
import { generarPDFPlan } from "@/utils/generarPlanPDF";
import toast from "react-hot-toast";
import { exportarPlanExcel } from "@/services/export.service";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MOMENTOS: { key: MomentoComida; label: string }[] = [
  { key: "desayuno",    label: "Desayuno" },
  { key: "almuerzo",    label: "Almuerzo" },
  { key: "merienda",   label: "Merienda" },
  { key: "cena",       label: "Cena" },
  { key: "colacion_am", label: "Colación AM" },
  { key: "colacion_pm", label: "Colación PM" },
];

const ESTADO_BADGE: Record<string, string> = {
  borrador: "badge-dark",
  activo:   "badge-fucsia",
  vencido:  "badge-rose",
  archivado:"badge-rose",
};

const ESTADOS = ["borrador", "activo", "vencido", "archivado"];

type Vista = "lista" | "detalle";
interface Paciente { id: number; nombre: string; apellido: string; }

export default function PlanesTab() {
  const [vista, setVista]               = useState<Vista>("lista");
  const [planes, setPlanes]             = useState<PlanDetalle[]>([]);
  const [planActual, setPlanActual]     = useState<PlanDetalle | null>(null);
  const [cargando, setCargando]         = useState(true);
  const [modalPlan, setModalPlan]       = useState(false);
  const [modalComida, setModalComida]   = useState(false);
  const [comidaEditando, setComidaEditando] = useState<PlanComidaDetalle | null>(null);
  const [pacientes, setPacientes]       = useState<Paciente[]>([]);
  const [recetas, setRecetas]           = useState<Receta[]>([]);
  const [guardando, setGuardando]       = useState(false);
  const [exportando, setExportando]     = useState(false);
  const [busqReceta, setBusqReceta]     = useState("");
  const [exportandoExcel, setExportandoExcel] = useState(false);

  const [formPlan, setFormPlan] = useState<PlanForm>({
    paciente_id: 0, nombre: "", fecha_inicio: "", fecha_fin: "",
    estado: "borrador", calorias_objetivo_kcal: "", proteinas_objetivo_g: "",
    carbohidratos_objetivo_g: "", grasas_objetivo_g: "", observaciones: ""
  });

  const [formComida, setFormComida] = useState<ComidaForm>({
    dia: 1, momento: "desayuno", descripcion: "",
    receta_id: undefined, calorias_kcal: "", proteinas_g: "",
    carbohidratos_g: "", grasas_g: "", fibra_g: "", notas: ""
  });

  const cargarPlanes = useCallback(async () => {
    try {
      setCargando(true);
      const data = await planService.listar();
      setPlanes(data);
    } catch {
      toast.error("Error al cargar planes");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarPlanes(); }, [cargarPlanes]);

  useEffect(() => {
    pacienteService.listar(undefined, 1).then(r => setPacientes(r.items)).catch(() => {});
    recetaService.listar().then(setRecetas).catch(() => {});
  }, []);

  const verDetalle = async (plan: PlanDetalle) => {
    try {
      const detalle = await planService.obtener(plan.id);
      setPlanActual(detalle);
      setVista("detalle");
    } catch { toast.error("Error al cargar plan"); }
  };

  const abrirModalPlan = () => {
    setFormPlan({ paciente_id: 0, nombre: "", fecha_inicio: "", fecha_fin: "",
      estado: "borrador", calorias_objetivo_kcal: "", proteinas_objetivo_g: "",
      carbohidratos_objetivo_g: "", grasas_objetivo_g: "", observaciones: "" });
    setModalPlan(true);
  };

  const crearPlan = async () => {
    if (!formPlan.paciente_id) { toast.error("Seleccioná un paciente"); return; }
    try {
      setGuardando(true);
      const nuevo = await planService.crear(formPlan);
      toast.success("Plan creado");
      setModalPlan(false);
      const detalle = await planService.obtener(nuevo.id);
      setPlanActual(detalle);
      setVista("detalle");
      cargarPlanes();
    } catch { toast.error("Error al crear plan"); }
    finally { setGuardando(false); }
  };

  const actualizarEstado = async (estado: string) => {
    if (!planActual) return;
    try {
      await planService.actualizar(planActual.id, {
        ...planActual, estado, paciente_id: planActual.paciente_id,
        fecha_inicio: planActual.fecha_inicio || undefined,
        fecha_fin: planActual.fecha_fin || undefined,
      });
      setPlanActual(p => p ? { ...p, estado: estado as any } : p);
      toast.success("Estado actualizado");
    } catch { toast.error("Error"); }
  };

  const handleExportarPDF = async () => {
    if (!planActual) return;
    try {
      setExportando(true);
      generarPDFPlan(planActual);
      toast.success("PDF generado correctamente");
    } catch { toast.error("Error al generar el PDF"); }
    finally { setExportando(false); }
  };

  const abrirAgregarComida = (dia: number, momento: MomentoComida) => {
    setComidaEditando(null);
    setBusqReceta("");
    setFormComida({ dia, momento, descripcion: "", receta_id: undefined,
      calorias_kcal: "", proteinas_g: "", carbohidratos_g: "", grasas_g: "", fibra_g: "", notas: "" });
    setModalComida(true);
  };

  const abrirEditarComida = (comida: PlanComidaDetalle) => {
    setComidaEditando(comida);
    setBusqReceta("");
    setFormComida({
      dia: comida.dia, momento: comida.momento, descripcion: comida.descripcion,
      receta_id: comida.receta_id,
      calorias_kcal: comida.calorias_kcal ?? "", proteinas_g: comida.proteinas_g ?? "",
      carbohidratos_g: comida.carbohidratos_g ?? "", grasas_g: comida.grasas_g ?? "",
      fibra_g: comida.fibra_g ?? "", notas: comida.notas || "",
    });
    setModalComida(true);
  };

  const seleccionarReceta = (r: Receta) => {
    setFormComida(f => ({
      ...f, descripcion: r.nombre, receta_id: r.id,
      calorias_kcal: r.calorias_kcal ?? "", proteinas_g: r.proteinas_g ?? "",
      carbohidratos_g: r.carbohidratos_g ?? "", grasas_g: r.grasas_g ?? "",
      fibra_g: r.fibra_g ?? "",
    }));
    setBusqReceta(r.nombre);
  };

  const guardarComida = async () => {
    if (!planActual) return;
    if (!formComida.descripcion.trim()) { toast.error("La descripción es obligatoria"); return; }
    try {
      setGuardando(true);
      if (comidaEditando) {
        await planService.actualizarComida(planActual.id, comidaEditando.id, formComida);
        toast.success("Comida actualizada");
      } else {
        await planService.agregarComida(planActual.id, formComida);
        toast.success("Comida agregada");
      }
      setModalComida(false);
      const detalle = await planService.obtener(planActual.id);
      setPlanActual(detalle);
    } catch { toast.error("Error al guardar comida"); }
    finally { setGuardando(false); }
  };

  const eliminarComida = async (comida: PlanComidaDetalle) => {
    if (!planActual || !confirm("¿Eliminar esta comida del plan?")) return;
    try {
      await planService.eliminarComida(planActual.id, comida.id);
      toast.success("Comida eliminada");
      const detalle = await planService.obtener(planActual.id);
      setPlanActual(detalle);
    } catch { toast.error("Error al eliminar"); }
  };

  const getComidasDiaMomento = (dia: number, momento: MomentoComida) =>
    planActual?.comidas.filter(c => c.dia === dia && c.momento === momento) ?? [];

  const totalesPlan = planActual?.comidas.reduce(
    (acc, c) => ({
      kcal: acc.kcal + (Number(c.calorias_kcal) || 0),
      prot: acc.prot + (Number(c.proteinas_g) || 0),
      hc:   acc.hc   + (Number(c.carbohidratos_g) || 0),
      grasas: acc.grasas + (Number(c.grasas_g) || 0),
    }),
    { kcal: 0, prot: 0, hc: 0, grasas: 0 }
  );

  const recetasFiltradas = recetas.filter(r =>
    r.nombre.toLowerCase().includes(busqReceta.toLowerCase())
  );

  const campoPlan   = (key: keyof PlanForm, val: any)   => setFormPlan(f  => ({ ...f, [key]: val }));
  const campoComida = (key: keyof ComidaForm, val: any) => setFormComida(f => ({ ...f, [key]: val }));

  // ── VISTA LISTA ──────────────────────────────────────────────────
  if (vista === "lista") return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={abrirModalPlan} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo plan
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
        </div>
      ) : planes.length === 0 ? (
        <div className="panel-card flex flex-col items-center py-16 gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--color-primary-bg)" }}>
            <UtensilsCrossed className="w-7 h-7" style={{ color: "var(--color-primary)" }} />
          </div>
          <p className="font-medium" style={{ color: "var(--color-text)" }}>No hay planes creados</p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Creá el primer plan con el botón de arriba</p>
        </div>
      ) : (
        <div className="space-y-2">
          {planes.map(p => (
            <div key={p.id} onClick={() => verDetalle(p)}
              className="panel-card flex items-center gap-4 cursor-pointer hover:bg-cream-100 transition-colors">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--color-primary)" }}>
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ color: "var(--color-text)" }}>
                  {p.nombre || `Plan de ${p.paciente_nombre} ${p.paciente_apellido}`}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {p.paciente_nombre} {p.paciente_apellido}
                  {p.fecha_inicio && ` · Desde ${new Date(String(p.fecha_inicio).slice(0,10) + "T12:00:00").toLocaleDateString("es-AR")}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`${ESTADO_BADGE[p.estado]} text-xs capitalize`}>{p.estado}</span>
                <ChevronRight className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nuevo plan */}
      {modalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-3xl w-full max-w-lg shadow-2xl" style={{ background: "var(--color-card-bg)" }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--color-card-border)" }}>
              <h2 className="font-display text-xl font-bold" style={{ color: "var(--color-text)" }}>Nuevo plan</h2>
              <button onClick={() => setModalPlan(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ color: "var(--color-text-muted)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Paciente *</label>
                <select value={formPlan.paciente_id} onChange={e => campoPlan("paciente_id", Number(e.target.value))} className="input-base">
                  <option value={0}>Seleccioná un paciente</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Nombre del plan</label>
                <input type="text" value={formPlan.nombre} onChange={e => campoPlan("nombre", e.target.value)}
                  className="input-base" placeholder="Ej: Plan hipocalórico semana 1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Fecha inicio</label>
                  <input type="date" value={formPlan.fecha_inicio} onChange={e => campoPlan("fecha_inicio", e.target.value)} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Fecha fin</label>
                  <input type="date" value={formPlan.fecha_fin} onChange={e => campoPlan("fecha_fin", e.target.value)} className="input-base" />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>Objetivos nutricionales</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "calorias_objetivo_kcal", label: "Calorías (kcal)" },
                    { key: "proteinas_objetivo_g", label: "Proteínas (g)" },
                    { key: "carbohidratos_objetivo_g", label: "Carbohidratos (g)" },
                    { key: "grasas_objetivo_g", label: "Grasas (g)" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</label>
                      <input type="number" min="0"
                        value={formPlan[key as keyof PlanForm] as string}
                        onChange={e => campoPlan(key as keyof PlanForm, e.target.value)}
                        className="input-base" placeholder="0" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Observaciones</label>
                <textarea value={formPlan.observaciones} onChange={e => campoPlan("observaciones", e.target.value)}
                  className="input-base resize-none" rows={2} placeholder="Indicaciones generales del plan..." />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t" style={{ borderColor: "var(--color-card-border)" }}>
              <button onClick={() => setModalPlan(false)} className="flex-1 btn-dark">Cancelar</button>
              <button onClick={crearPlan} disabled={guardando} className="flex-1 btn-primary">
                {guardando ? "Creando..." : "Crear plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── VISTA DETALLE ────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Breadcrumb + acciones */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setVista("lista")}
            className="text-sm font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
            Planes
          </button>
          <ChevronRight className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            {planActual?.nombre || `Plan de ${planActual?.paciente_nombre}`}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botón Excel */}
          <button
            onClick={async () => {
              if (!planActual) return;
              try {
                setExportandoExcel(true);
                exportarPlanExcel(planActual);
                toast.success("Excel generado correctamente");
              } catch {
                toast.error("Error al generar Excel");
              } finally {
                setExportandoExcel(false);
              }
            }}
            disabled={exportandoExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
            style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)", border: "1px solid var(--color-primary-border)" }}>
            {exportandoExcel
              ? <span className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
              : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">Excel</span>
          </button>
        
          {/* Botón PDF — igual que antes */}
          <button
            onClick={handleExportarPDF}
            disabled={exportando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
            style={{ background: "var(--color-primary)", color: "white" }}>
            {exportando
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <FileDown className="w-4 h-4" />}
            <span className="hidden sm:inline">PDF</span>
          </button>
        
          {/* Selector estado — igual que antes */}
          <select value={planActual?.estado} onChange={e => actualizarEstado(e.target.value)} className="input-base w-auto text-sm">
            {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
          </select>
        </div>
      </div>  
        

      {/* Info del plan */}
      <div className="panel-card-rose grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Flame,    label: "Objetivo kcal",     val: planActual?.calorias_objetivo_kcal,   real: totalesPlan?.kcal },
          { icon: Beef,     label: "Proteínas (g)",     val: planActual?.proteinas_objetivo_g,      real: totalesPlan?.prot },
          { icon: Wheat,    label: "Carbohidratos (g)", val: planActual?.carbohidratos_objetivo_g,  real: totalesPlan?.hc },
          { icon: Droplets, label: "Grasas (g)",        val: planActual?.grasas_objetivo_g,         real: totalesPlan?.grasas },
        ].map(({ icon: Icon, label, val, real }) => (
          <div key={label} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Icon className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} />
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</p>
            </div>
            <p className="font-bold text-lg" style={{ color: "var(--color-text)" }}>
              {real != null ? Math.round(real) : "—"}
            </p>
            {val && <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>/ {val} obj.</p>}
          </div>
        ))}
      </div>

      {/* Grilla semanal */}
      <div className="space-y-3">
        {DIAS.map((dia, diaIdx) => {
          const numDia = diaIdx + 1;
          return (
            <div key={dia} className="panel-card p-0 overflow-hidden">
              <div className="px-5 py-3 flex items-center gap-3"
                style={{ background: `linear-gradient(135deg, var(--color-sidebar-from), var(--color-sidebar-to))` }}>
                <p className="font-semibold text-white text-sm">{dia}</p>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--color-card-border)" }}>
                {MOMENTOS.map(({ key: momento, label }) => {
                  const comidas = getComidasDiaMomento(numDia, momento);
                  return (
                    <div key={momento} className="px-5 py-3">
                      <div className="flex items-start gap-3">
                        <p className="text-xs font-semibold w-24 flex-shrink-0 pt-0.5"
                          style={{ color: "var(--color-text-muted)" }}>{label}</p>
                        <div className="flex-1 space-y-2">
                          {comidas.map(c => (
                            <div key={c.id} className="flex items-start justify-between gap-2 rounded-xl px-3 py-2"
                              style={{ background: "var(--color-primary-bg)", border: "1px solid var(--color-primary-border)" }}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{c.descripcion}</p>
                                <div className="flex gap-3 mt-0.5 flex-wrap">
                                  {c.calorias_kcal != null && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{c.calorias_kcal} kcal</span>}
                                  {c.proteinas_g != null && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>P: {c.proteinas_g}g</span>}
                                  {c.carbohidratos_g != null && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>HC: {c.carbohidratos_g}g</span>}
                                  {c.grasas_g != null && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>G: {c.grasas_g}g</span>}
                                </div>
                                {c.notas && <p className="text-xs italic mt-0.5" style={{ color: "var(--color-primary-muted)" }}>{c.notas}</p>}
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button onClick={() => abrirEditarComida(c)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                                  style={{ color: "var(--color-primary)" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-primary-bg)")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => eliminarComida(c)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50"
                                  style={{ color: "#cc0059" }}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => abrirAgregarComida(numDia, momento)}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                            style={{ color: "var(--color-primary)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--color-primary-bg)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <Plus className="w-3.5 h-3.5" /> Agregar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal agregar/editar comida */}
      {modalComida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            style={{ background: "var(--color-card-bg)" }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--color-card-border)" }}>
              <div>
                <h2 className="font-display text-xl font-bold" style={{ color: "var(--color-text)" }}>
                  {comidaEditando ? "Editar comida" : "Agregar comida"}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {DIAS[formComida.dia - 1]} · {MOMENTOS.find(m => m.key === formComida.momento)?.label}
                </p>
              </div>
              <button onClick={() => setModalComida(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ color: "var(--color-text-muted)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                  Buscar en banco de recetas (opcional)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-primary)" }} />
                  <input type="text" value={busqReceta} onChange={e => setBusqReceta(e.target.value)}
                    className="input-base pl-10" placeholder="Escribí para buscar una receta..." />
                </div>
                {busqReceta && (
                  <div className="mt-2 border rounded-xl overflow-hidden max-h-40 overflow-y-auto"
                    style={{ borderColor: "var(--color-card-border)" }}>
                    {recetasFiltradas.length === 0 ? (
                      <p className="text-xs text-center py-3" style={{ color: "var(--color-text-muted)" }}>Sin resultados</p>
                    ) : recetasFiltradas.slice(0, 8).map(r => (
                      <button key={r.id} onClick={() => seleccionarReceta(r)}
                        className="w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between"
                        style={{ borderBottom: "1px solid var(--color-card-border)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--color-primary-bg)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{r.nombre}</p>
                          {r.calorias_kcal != null && <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{r.calorias_kcal} kcal</p>}
                        </div>
                        {formComida.receta_id === r.id && <Check className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-primary)" }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Descripción / nombre *</label>
                <textarea value={formComida.descripcion} onChange={e => campoComida("descripcion", e.target.value)}
                  className="input-base resize-none" rows={3} placeholder="Ej: Avena con leche y banana..." />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>Macronutrientes</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "calorias_kcal", label: "Calorías (kcal)" },
                    { key: "proteinas_g", label: "Proteínas (g)" },
                    { key: "carbohidratos_g", label: "Carbohidratos (g)" },
                    { key: "grasas_g", label: "Grasas (g)" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</label>
                      <input type="number" step="0.1" min="0"
                        value={formComida[key as keyof ComidaForm] as string}
                        onChange={e => campoComida(key as keyof ComidaForm, e.target.value)}
                        className="input-base" placeholder="0" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Notas</label>
                <input type="text" value={formComida.notas} onChange={e => campoComida("notas", e.target.value)}
                  className="input-base" placeholder="Ej: sin azúcar..." />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t" style={{ borderColor: "var(--color-card-border)" }}>
              <button onClick={() => setModalComida(false)} className="flex-1 btn-dark">Cancelar</button>
              <button onClick={guardarComida} disabled={guardando} className="flex-1 btn-primary">
                {guardando ? "Guardando..." : comidaEditando ? "Guardar cambios" : "Agregar comida"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}