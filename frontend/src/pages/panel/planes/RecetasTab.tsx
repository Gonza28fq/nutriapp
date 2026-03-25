import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, BookOpen, Edit2, Trash2, X, ChevronDown, ChevronUp,
  Flame, Beef, Wheat, Droplets
} from "lucide-react";
import { recetaService, Receta, RecetaForm } from "@/services/receta.services";
import toast from "react-hot-toast";

const CATEGORIAS = ["desayuno", "almuerzo", "merienda", "cena", "colacion", "postre", "otro"];
const DIFICULTADES = ["facil", "media", "dificil"];

const categoriaLabel: Record<string, string> = {
  desayuno: "Desayuno", almuerzo: "Almuerzo", merienda: "Merienda",
  cena: "Cena", colacion: "Colación", postre: "Postre", otro: "Otro"
};

const EMPTY_FORM: RecetaForm = {
  nombre: "", ingredientes: "", descripcion: "", preparacion: "",
  calorias_kcal: "", proteinas_g: "", carbohidratos_g: "", grasas_g: "",
  fibra_g: "", porciones: 1, categoria: "", dificultad: "facil",
  tiempo_preparacion_min: "", notas: "",
  apta_celiacos: false, apta_diabeticos: false,
  apta_hipertensos: false, apta_vegetarianos: false,
};

export default function RecetasTab() {
  const [recetas, setRecetas]           = useState<Receta[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [busqueda, setBusqueda]         = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [modalOpen, setModalOpen]       = useState(false);
  const [editando, setEditando]         = useState<Receta | null>(null);
  const [form, setForm]                 = useState<RecetaForm>(EMPTY_FORM);
  const [guardando, setGuardando]       = useState(false);
  const [expandida, setExpandida]       = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await recetaService.listar({
        busqueda: busqueda || undefined,
        categoria: categoriaFiltro || undefined,
      });
      setRecetas(data);
    } catch {
      toast.error("Error al cargar recetas");
    } finally {
      setCargando(false);
    }
  }, [busqueda, categoriaFiltro]);

  useEffect(() => {
    const t = setTimeout(cargar, 350);
    return () => clearTimeout(t);
  }, [cargar]);

  const abrirNueva = () => { setEditando(null); setForm(EMPTY_FORM); setModalOpen(true); };

  const abrirEditar = (r: Receta) => {
    setEditando(r);
    setForm({
      nombre: r.nombre, descripcion: r.descripcion || "", ingredientes: r.ingredientes,
      preparacion: r.preparacion || "",
      calorias_kcal: r.calorias_kcal ?? "", proteinas_g: r.proteinas_g ?? "",
      carbohidratos_g: r.carbohidratos_g ?? "", grasas_g: r.grasas_g ?? "",
      fibra_g: r.fibra_g ?? "", porciones: r.porciones ?? 1,
      categoria: r.categoria || "", dificultad: r.dificultad || "facil",
      tiempo_preparacion_min: r.tiempo_preparacion_min ?? "", notas: r.notas || "",
      apta_celiacos: r.apta_celiacos ?? false, apta_diabeticos: r.apta_diabeticos ?? false,
      apta_hipertensos: r.apta_hipertensos ?? false, apta_vegetarianos: r.apta_vegetarianos ?? false,
    });
    setModalOpen(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.ingredientes.trim()) {
      toast.error("Nombre e ingredientes son obligatorios"); return;
    }
    try {
      setGuardando(true);
      if (editando) {
        await recetaService.actualizar(editando.id, form);
        toast.success("Receta actualizada");
      } else {
        await recetaService.crear(form);
        toast.success("Receta creada");
      }
      setModalOpen(false);
      cargar();
    } catch {
      toast.error("Error al guardar receta");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (r: Receta) => {
    if (!confirm(`¿Eliminar "${r.nombre}"?`)) return;
    try {
      await recetaService.eliminar(r.id);
      toast.success("Receta eliminada");
      cargar();
    } catch { toast.error("Error al eliminar"); }
  };

  const campo = (key: keyof RecetaForm, value: any) =>
    setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4">

      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-primary)" }} />
          <input type="text" placeholder="Buscar receta..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="input-base pl-10" />
        </div>
        <select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}
          className="input-base w-auto min-w-[160px]">
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{categoriaLabel[c]}</option>)}
        </select>
        <button onClick={abrirNueva} className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus className="w-4 h-4" /> Nueva receta
        </button>
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
        </div>
      ) : recetas.length === 0 ? (
        <div className="panel-card flex flex-col items-center py-16 gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--color-primary-bg)" }}>
            <BookOpen className="w-7 h-7" style={{ color: "var(--color-primary)" }} />
          </div>
          <p className="font-medium" style={{ color: "var(--color-text)" }}>No hay recetas todavía</p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Creá la primera receta con el botón de arriba</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recetas.map(r => (
            <div key={r.id} className="panel-card p-0 overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
                onClick={() => setExpandida(expandida === r.id ? null : r.id)}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--color-primary-bg)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold" style={{ color: "var(--color-text)" }}>{r.nombre}</p>
                    {r.categoria && <span className="badge-rose text-xs">{categoriaLabel[r.categoria]}</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    {r.calorias_kcal != null && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        <Flame className="w-3 h-3" />{r.calorias_kcal} kcal
                      </span>
                    )}
                    {r.proteinas_g != null && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        <Beef className="w-3 h-3" />{r.proteinas_g}g prot
                      </span>
                    )}
                    {r.carbohidratos_g != null && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        <Wheat className="w-3 h-3" />{r.carbohidratos_g}g HC
                      </span>
                    )}
                    {r.grasas_g != null && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        <Droplets className="w-3 h-3" />{r.grasas_g}g grasas
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); abrirEditar(r); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-primary-50"
                    style={{ color: "var(--color-primary)" }}>
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); eliminar(r); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
                    style={{ color: "#cc0059" }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandida === r.id
                    ? <ChevronUp className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                    : <ChevronDown className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />}
                </div>
              </div>

              {/* Detalle expandido */}
              {expandida === r.id && (
                <div className="px-5 pb-5 space-y-3 border-t" style={{ borderColor: "var(--color-card-border)" }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-muted)" }}>Ingredientes</p>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>{r.ingredientes}</p>
                    </div>
                    {r.preparacion && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--color-text-muted)" }}>Preparación</p>
                        <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text)" }}>{r.preparacion}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.apta_celiacos    && <span className="badge-dark text-xs">Sin TACC</span>}
                    {r.apta_diabeticos  && <span className="badge-dark text-xs">Apta diabéticos</span>}
                    {r.apta_hipertensos && <span className="badge-dark text-xs">Apta hipertensos</span>}
                    {r.apta_vegetarianos && <span className="badge-dark text-xs">Vegetariana</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar receta */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            style={{ background: "var(--color-card-bg)" }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--color-card-border)" }}>
              <h2 className="font-display text-xl font-bold" style={{ color: "var(--color-text)" }}>
                {editando ? "Editar receta" : "Nueva receta"}
              </h2>
              <button onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ color: "var(--color-text-muted)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Nombre *</label>
                <input type="text" value={form.nombre} onChange={e => campo("nombre", e.target.value)}
                  className="input-base" placeholder="Ej: Avena con frutas" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Descripción</label>
                <input type="text" value={form.descripcion} onChange={e => campo("descripcion", e.target.value)}
                  className="input-base" placeholder="Breve descripción del plato" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Ingredientes y cantidades *</label>
                <textarea value={form.ingredientes} onChange={e => campo("ingredientes", e.target.value)}
                  className="input-base resize-none" rows={5}
                  placeholder={"- 80g avena\n- 200ml leche descremada\n- 1 banana"} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Preparación</label>
                <textarea value={form.preparacion} onChange={e => campo("preparacion", e.target.value)}
                  className="input-base resize-none" rows={3} placeholder="Pasos de preparación..." />
              </div>

              {/* Macros */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Información nutricional (por porción)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: "calorias_kcal",    label: "Calorías (kcal)" },
                    { key: "proteinas_g",       label: "Proteínas (g)" },
                    { key: "carbohidratos_g",   label: "Carbohidratos (g)" },
                    { key: "grasas_g",          label: "Grasas (g)" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</label>
                      <input type="number" step="0.1" min="0"
                        value={form[key as keyof RecetaForm] as string}
                        onChange={e => campo(key as keyof RecetaForm, e.target.value)}
                        className="input-base" placeholder="0" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Fibra (g)</label>
                    <input type="number" step="0.1" min="0" value={form.fibra_g as string}
                      onChange={e => campo("fibra_g", e.target.value)} className="input-base" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Porciones</label>
                    <input type="number" min="1" value={form.porciones as number}
                      onChange={e => campo("porciones", e.target.value)} className="input-base" placeholder="1" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Tiempo (min)</label>
                    <input type="number" min="0" value={form.tiempo_preparacion_min as string}
                      onChange={e => campo("tiempo_preparacion_min", e.target.value)} className="input-base" placeholder="0" />
                  </div>
                </div>
              </div>

              {/* Categoría + Dificultad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Categoría</label>
                  <select value={form.categoria} onChange={e => campo("categoria", e.target.value)} className="input-base">
                    <option value="">Sin categoría</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{categoriaLabel[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Dificultad</label>
                  <select value={form.dificultad} onChange={e => campo("dificultad", e.target.value)} className="input-base">
                    {DIFICULTADES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              {/* Aptitudes */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-muted)" }}>Apta para</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "apta_celiacos",     label: "Sin TACC (celíacos)" },
                    { key: "apta_diabeticos",   label: "Diabéticos" },
                    { key: "apta_hipertensos",  label: "Hipertensos" },
                    { key: "apta_vegetarianos", label: "Vegetarianos" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox"
                        checked={form[key as keyof RecetaForm] as boolean}
                        onChange={e => campo(key as keyof RecetaForm, e.target.checked)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: "var(--color-primary)" }} />
                      <span className="text-sm" style={{ color: "var(--color-text)" }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Notas adicionales</label>
                <textarea value={form.notas} onChange={e => campo("notas", e.target.value)}
                  className="input-base resize-none" rows={2} placeholder="Observaciones, variantes, tips..." />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t" style={{ borderColor: "var(--color-card-border)" }}>
              <button onClick={() => setModalOpen(false)} className="flex-1 btn-dark">Cancelar</button>
              <button onClick={guardar} disabled={guardando} className="flex-1 btn-primary">
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear receta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}