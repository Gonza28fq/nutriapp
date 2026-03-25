import { useState, useEffect, useCallback } from "react";
import {
  Plus, BookOpen, Edit2, Trash2, Eye, EyeOff, Archive, X, Tag, Search,
  Globe, Star, Layers, BarChart2, AlignLeft, Save, Check
} from "lucide-react";
import { blogService, BlogPost, BlogPostForm, BlogCategoria } from "@/services/blog.service";
import { recetaService, Receta } from "@/services/receta.services";
import api from "@/services/api";
import toast from "react-hot-toast";

const ESTADO_CONFIG = {
  borrador:  { label: "Borrador",  color: "#6b7280", bg: "#f3f4f6" },
  publicado: { label: "Publicado", color: "#16a34a", bg: "#f0fdf4" },
  archivado: { label: "Archivado", color: "#9ca3af", bg: "#f9fafb" },
};

const EMPTY_FORM: BlogPostForm = {
  titulo: "", resumen: "", contenido: "",
  imagen_portada: "", categoria_id: "",
  estado: "borrador", receta_ids: [],
};

const ICONOS_DISPONIBLES = ["Apple", "Heart", "BookOpen", "Star", "Leaf", "Sun", "Zap", "Shield", "Award", "Clock", "Users", "Target"];

type TabPrincipal = "posts" | "sitio";
type Vista = "lista" | "editor";

interface Testimonio  { id: number; nombre: string; texto: string; estrellas: number; activo: boolean; orden: number; }
interface Servicio    { id: number; icono: string; titulo: string; descripcion: string; color: string; activo: boolean; orden: number; }
interface Stat        { id: number; numero: string; etiqueta: string; orden: number; }
interface Secciones   { hero_titulo?: string; hero_subtitulo?: string; enfoque_titulo?: string; enfoque_texto?: string; enfoque_imagen?: string; enfoque_items?: string; }

export default function Blog() {
  const [tabPrincipal, setTabPrincipal] = useState<TabPrincipal>("posts");
  const [vista, setVista]               = useState<Vista>("lista");
  const [posts, setPosts]               = useState<BlogPost[]>([]);
  const [postEditando, setPostEditando] = useState<BlogPost | null>(null);
  const [cargando, setCargando]         = useState(true);
  const [guardando, setGuardando]       = useState(false);
  const [categorias, setCategorias]     = useState<BlogCategoria[]>([]);
  const [recetas, setRecetas]           = useState<Receta[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [form, setForm]                 = useState<BlogPostForm>(EMPTY_FORM);
  const [nuevaCategoria, setNuevaCategoria]           = useState("");
  const [mostrarNuevaCategoria, setMostrarNuevaCategoria] = useState(false);
  const [busqReceta, setBusqReceta]     = useState("");

  // ── Estado sitio público ──
  const [testimonios, setTestimonios]   = useState<Testimonio[]>([]);
  const [servicios, setServicios]       = useState<Servicio[]>([]);
  const [stats, setStats]               = useState<Stat[]>([]);
  const [secciones, setSecciones]       = useState<Secciones>({});
  const [cargandoSitio, setCargandoSitio] = useState(false);
  const [guardandoSitio, setGuardandoSitio] = useState(false);
  const [tabSitio, setTabSitio]         = useState<"hero" | "servicios" | "testimonios" | "enfoque">("hero");

  // Modales
  const [modalTestimonio, setModalTestimonio] = useState<Partial<Testimonio> | null>(null);
  const [modalServicio,   setModalServicio]   = useState<Partial<Servicio>   | null>(null);
  const [modalStat,       setModalStat]       = useState<Partial<Stat>       | null>(null);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await blogService.listar(filtroEstado || undefined);
      setPosts(data);
    } catch { toast.error("Error al cargar posts"); }
    finally { setCargando(false); }
  }, [filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    blogService.listarCategorias().then(setCategorias).catch(() => {});
    recetaService.listar().then(setRecetas).catch(() => {});
  }, []);

  const cargarSitio = useCallback(async () => {
    try {
      setCargandoSitio(true);
      const { data } = await api.get("/sitio");
      setTestimonios(data.data.testimonios);
      setServicios(data.data.servicios);
      setStats(data.data.stats);
      setSecciones(data.data.secciones);
    } catch { toast.error("Error al cargar datos del sitio"); }
    finally { setCargandoSitio(false); }
  }, []);

  useEffect(() => {
    if (tabPrincipal === "sitio") cargarSitio();
  }, [tabPrincipal, cargarSitio]);

  // ── Blog posts ───────────────────────────────────────────────────
  const abrirNuevo = () => { setPostEditando(null); setForm(EMPTY_FORM); setVista("editor"); };

  const abrirEditar = async (post: BlogPost) => {
    try {
      const detalle = await blogService.obtener(post.id);
      setPostEditando(detalle);
      setForm({
        titulo: detalle.titulo, resumen: detalle.resumen ?? "",
        contenido: detalle.contenido, imagen_portada: detalle.imagen_portada ?? "",
        categoria_id: detalle.categoria_id ?? "", estado: detalle.estado,
        receta_ids: detalle.recetas?.map(r => r.id) ?? [],
      });
      setVista("editor");
    } catch { toast.error("Error al cargar el post"); }
  };

  const guardar = async () => {
    if (!form.titulo.trim() || !form.contenido.trim()) { toast.error("Título y contenido son obligatorios"); return; }
    try {
      setGuardando(true);
      const payload = { ...form, categoria_id: form.categoria_id ? Number(form.categoria_id) : undefined };
      if (postEditando) { await blogService.actualizar(postEditando.id, payload); toast.success("Post actualizado"); }
      else { await blogService.crear(payload); toast.success("Post creado"); }
      setVista("lista"); cargar();
    } catch { toast.error("Error al guardar el post"); }
    finally { setGuardando(false); }
  };

  const eliminar = async (post: BlogPost) => {
    if (!confirm(`¿Eliminar "${post.titulo}"?`)) return;
    try { await blogService.eliminar(post.id); toast.success("Post eliminado"); cargar(); }
    catch { toast.error("Error al eliminar"); }
  };

  const cambiarEstado = async (post: BlogPost, estado: BlogPost["estado"]) => {
    try {
      const detalle = await blogService.obtener(post.id);
      await blogService.actualizar(post.id, {
        titulo: detalle.titulo, contenido: detalle.contenido, resumen: detalle.resumen,
        imagen_portada: detalle.imagen_portada, categoria_id: detalle.categoria_id,
        estado, receta_ids: detalle.recetas?.map(r => r.id) ?? [],
      });
      toast.success(`Post ${estado}`); cargar();
    } catch { toast.error("Error al cambiar estado"); }
  };

  const agregarCategoria = async () => {
    if (!nuevaCategoria.trim()) return;
    try {
      const nueva = await blogService.crearCategoria(nuevaCategoria.trim());
      setCategorias(prev => [...prev, nueva]);
      setForm(f => ({ ...f, categoria_id: nueva.id }));
      setNuevaCategoria(""); setMostrarNuevaCategoria(false);
      toast.success("Categoría creada");
    } catch { toast.error("Error al crear categoría"); }
  };

  const toggleReceta = (id: number) => {
    setForm(f => ({
      ...f,
      receta_ids: f.receta_ids?.includes(id) ? f.receta_ids.filter(r => r !== id) : [...(f.receta_ids ?? []), id],
    }));
  };

  const campo = (key: keyof BlogPostForm, val: any) => setForm(f => ({ ...f, [key]: val }));
  const recetasFiltradas = recetas.filter(r => r.nombre.toLowerCase().includes(busqReceta.toLowerCase()));

  // ── Sitio público ────────────────────────────────────────────────
  const guardarSecciones = async () => {
    try {
      setGuardandoSitio(true);
      await api.put("/sitio/secciones", secciones);
      toast.success("Secciones guardadas");
    } catch { toast.error("Error al guardar"); }
    finally { setGuardandoSitio(false); }
  };

  const guardarTestimonio = async () => {
    if (!modalTestimonio) return;
    try {
      setGuardandoSitio(true);
      if (modalTestimonio.id) {
        await api.put(`/sitio/testimonios/${modalTestimonio.id}`, modalTestimonio);
        toast.success("Testimonio actualizado");
      } else {
        await api.post("/sitio/testimonios", modalTestimonio);
        toast.success("Testimonio creado");
      }
      setModalTestimonio(null); cargarSitio();
    } catch { toast.error("Error al guardar testimonio"); }
    finally { setGuardandoSitio(false); }
  };

  const eliminarTestimonio = async (id: number) => {
    if (!confirm("¿Eliminar este testimonio?")) return;
    try { await api.delete(`/sitio/testimonios/${id}`); toast.success("Eliminado"); cargarSitio(); }
    catch { toast.error("Error"); }
  };

  const guardarServicio = async () => {
    if (!modalServicio) return;
    try {
      setGuardandoSitio(true);
      if (modalServicio.id) {
        await api.put(`/sitio/servicios/${modalServicio.id}`, modalServicio);
        toast.success("Servicio actualizado");
      } else {
        await api.post("/sitio/servicios", modalServicio);
        toast.success("Servicio creado");
      }
      setModalServicio(null); cargarSitio();
    } catch { toast.error("Error al guardar servicio"); }
    finally { setGuardandoSitio(false); }
  };

  const eliminarServicio = async (id: number) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    try { await api.delete(`/sitio/servicios/${id}`); toast.success("Eliminado"); cargarSitio(); }
    catch { toast.error("Error"); }
  };

  const guardarStat = async () => {
    if (!modalStat) return;
    try {
      setGuardandoSitio(true);
      if (modalStat.id) {
        await api.put(`/sitio/stats/${modalStat.id}`, modalStat);
        toast.success("Estadística actualizada");
      } else {
        await api.post("/sitio/stats", modalStat);
        toast.success("Estadística creada");
      }
      setModalStat(null); cargarSitio();
    } catch { toast.error("Error al guardar estadística"); }
    finally { setGuardandoSitio(false); }
  };

  const eliminarStat = async (id: number) => {
    if (!confirm("¿Eliminar esta estadística?")) return;
    try { await api.delete(`/sitio/stats/${id}`); toast.success("Eliminado"); cargarSitio(); }
    catch { toast.error("Error"); }
  };

  // ── EDITOR DE POST ───────────────────────────────────────────────
  if (vista === "editor") return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setVista("lista")}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
            <X className="w-4 h-4" />
          </button>
          <h1 className="font-display text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            {postEditando ? "Editar post" : "Nuevo post"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={form.estado} onChange={e => campo("estado", e.target.value)} className="input-base w-auto text-sm">
            <option value="borrador">Borrador</option>
            <option value="publicado">Publicado</option>
            <option value="archivado">Archivado</option>
          </select>
          <button onClick={guardar} disabled={guardando} className="btn-primary flex items-center gap-2">
            {guardando ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : postEditando ? "Guardar cambios" : "Publicar"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="panel-card space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Título *</label>
              <input type="text" value={form.titulo} onChange={e => campo("titulo", e.target.value)}
                className="input-base text-lg font-semibold" placeholder="Título del post..." />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Resumen</label>
              <textarea value={form.resumen} onChange={e => campo("resumen", e.target.value)}
                className="input-base resize-none" rows={2} placeholder="Breve descripción..." />
            </div>
          </div>
          <div className="panel-card">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Contenido *</label>
            <textarea value={form.contenido} onChange={e => campo("contenido", e.target.value)}
              className="input-base resize-none w-full" rows={16} placeholder="Escribí el contenido..." />
          </div>
        </div>
        <div className="space-y-5">
          <div className="panel-card">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Imagen de portada (URL)</label>
            <input type="text" value={form.imagen_portada} onChange={e => campo("imagen_portada", e.target.value)}
              className="input-base" placeholder="https://..." />
            {form.imagen_portada && (
              <img src={form.imagen_portada} alt="portada" className="mt-3 w-full h-32 object-cover rounded-xl"
                onError={e => (e.currentTarget.style.display = "none")} />
            )}
          </div>
          <div className="panel-card space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Categoría</label>
            <select value={form.categoria_id} onChange={e => campo("categoria_id", e.target.value)} className="input-base">
              <option value="">Sin categoría</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            {!mostrarNuevaCategoria ? (
              <button onClick={() => setMostrarNuevaCategoria(true)} className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--color-primary)" }}>
                <Plus className="w-3 h-3" /> Nueva categoría
              </button>
            ) : (
              <div className="flex gap-2">
                <input type="text" value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && agregarCategoria()}
                  className="input-base flex-1 text-sm" placeholder="Nombre..." />
                <button onClick={agregarCategoria} className="btn-primary px-3 py-1.5 text-xs">Agregar</button>
              </div>
            )}
          </div>
          <div className="panel-card space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Recetas vinculadas</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} />
              <input type="text" value={busqReceta} onChange={e => setBusqReceta(e.target.value)}
                className="input-base pl-9 text-sm" placeholder="Buscar receta..." />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {recetasFiltradas.slice(0, 15).map(r => {
                const sel = form.receta_ids?.includes(r.id);
                return (
                  <button key={r.id} onClick={() => toggleReceta(r.id)}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
                    style={{ background: sel ? "var(--color-primary-bg)" : "transparent", border: `1px solid ${sel ? "var(--color-primary-border)" : "transparent"}`, color: "var(--color-text)" }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={sel ? { background: "var(--color-primary)" } : { border: "1px solid var(--color-card-border)" }}>
                      {sel && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="truncate">{r.nombre}</span>
                  </button>
                );
              })}
            </div>
            {(form.receta_ids?.length ?? 0) > 0 && (
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {form.receta_ids?.length} receta{(form.receta_ids?.length ?? 0) !== 1 ? "s" : ""} vinculada{(form.receta_ids?.length ?? 0) !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ── VISTA PRINCIPAL ──────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header + tabs principales */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: "var(--color-text)" }}>Blog</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Gestioná posts y el contenido del sitio público</p>
        </div>
        {tabPrincipal === "posts" && (
          <button onClick={abrirNuevo} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo post</span>
          </button>
        )}
      </div>

      {/* Tabs principales */}
      <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "var(--color-cream-200)" }}>
        <button onClick={() => setTabPrincipal("posts")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${tabPrincipal === "posts" ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
          style={{ color: tabPrincipal === "posts" ? "var(--color-text)" : "var(--color-text-muted)" }}>
          <BookOpen className="w-4 h-4" /> Posts del blog
        </button>
        <button onClick={() => setTabPrincipal("sitio")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${tabPrincipal === "sitio" ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
          style={{ color: tabPrincipal === "sitio" ? "var(--color-text)" : "var(--color-text-muted)" }}>
          <Globe className="w-4 h-4" /> Sitio público
        </button>
      </div>

      {/* ── TAB POSTS ── */}
      {tabPrincipal === "posts" && (
        <>
          <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "var(--color-primary-bg)" }}>
            {[{ val: "", label: "Todos" }, { val: "borrador", label: "Borradores" },
              { val: "publicado", label: "Publicados" }, { val: "archivado", label: "Archivados" }
            ].map(({ val, label }) => (
              <button key={val} onClick={() => setFiltroEstado(val)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${filtroEstado === val ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
                style={{ color: filtroEstado === val ? "var(--color-text)" : "var(--color-text-muted)" }}>
                {label}
              </button>
            ))}
          </div>

          {cargando ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
            </div>
          ) : posts.length === 0 ? (
            <div className="panel-card flex flex-col items-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--color-primary-bg)" }}>
                <BookOpen className="w-7 h-7" style={{ color: "var(--color-primary)" }} />
              </div>
              <p className="font-medium" style={{ color: "var(--color-text)" }}>No hay posts todavía</p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Creá el primer post con el botón de arriba</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => {
                const estadoCfg = ESTADO_CONFIG[post.estado];
                return (
                  <div key={post.id} className="panel-card flex gap-4">
                    {post.imagen_portada ? (
                      <img src={post.imagen_portada} alt={post.titulo}
                        className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                        onError={e => (e.currentTarget.style.display = "none")} />
                    ) : (
                      <div className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--color-primary-bg)" }}>
                        <BookOpen className="w-8 h-8" style={{ color: "var(--color-primary-border)" }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate" style={{ color: "var(--color-text)" }}>{post.titulo}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                              style={{ background: estadoCfg.bg, color: estadoCfg.color }}>{estadoCfg.label}</span>
                            {post.categoria_nombre && (
                              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                                <Tag className="w-3 h-3" />{post.categoria_nombre}
                              </span>
                            )}
                            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                              {new Date(post.creado_en).toLocaleDateString("es-AR")}
                            </span>
                          </div>
                          {post.resumen && <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--color-text-muted)" }}>{post.resumen}</p>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {post.estado === "borrador" && (
                            <button onClick={() => cambiarEstado(post, "publicado")}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-green-50" style={{ color: "#16a34a" }}>
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {post.estado === "publicado" && (
                            <button onClick={() => cambiarEstado(post, "archivado")}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-amber-50" style={{ color: "#d97706" }}>
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                          {post.estado === "archivado" && (
                            <button onClick={() => cambiarEstado(post, "borrador")}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-50" style={{ color: "#6b7280" }}>
                              <EyeOff className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => abrirEditar(post)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                            style={{ color: "var(--color-primary)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--color-primary-bg)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => eliminar(post)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50" style={{ color: "#cc0059" }}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── TAB SITIO PÚBLICO ── */}
      {tabPrincipal === "sitio" && (
        <div className="space-y-5">
          {cargandoSitio ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
            </div>
          ) : (
            <>
              {/* Sub-tabs del sitio */}
              <div className="flex gap-1 overflow-x-auto p-1 rounded-2xl" style={{ background: "var(--color-primary-bg)" }}>
                {[
                  { id: "hero",        label: "Hero",        icon: AlignLeft },
                  { id: "servicios",   label: "Servicios",   icon: Layers },
                  { id: "testimonios", label: "Testimonios", icon: Star },
                  { id: "enfoque",     label: "Mi enfoque",  icon: BarChart2 },
                ].map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setTabSitio(id as any)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
                    style={tabSitio === id
                      ? { background: "white", color: "var(--color-text)", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                      : { color: "var(--color-text-muted)" }}>
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Hero ── */}
              {tabSitio === "hero" && (
                <div className="panel-card space-y-5">
                  <h3 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>Sección Hero</h3>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Texto principal de la página de inicio.</p>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Título principal</label>
                    <input type="text" value={secciones.hero_titulo ?? ""}
                      onChange={e => setSecciones(s => ({ ...s, hero_titulo: e.target.value }))}
                      className="input-base" placeholder="Comé mejor, vivé con más energía" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Subtítulo / descripción</label>
                    <textarea value={secciones.hero_subtitulo ?? ""}
                      onChange={e => setSecciones(s => ({ ...s, hero_subtitulo: e.target.value }))}
                      className="input-base resize-none" rows={3} />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Estadísticas del hero</label>
                    <div className="space-y-2">
                      {stats.map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl"
                          style={{ background: "var(--color-cream-100)", border: "1px solid var(--color-card-border)" }}>
                          <span className="font-bold text-sm w-16" style={{ color: "var(--color-text)" }}>{s.numero}</span>
                          <span className="text-sm flex-1" style={{ color: "var(--color-text-muted)" }}>{s.etiqueta}</span>
                          <button onClick={() => setModalStat(s)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: "var(--color-primary)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--color-primary-bg)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => eliminarStat(s.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50" style={{ color: "#cc0059" }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setModalStat({ numero: "", etiqueta: "", orden: stats.length })}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition-colors"
                      style={{ color: "var(--color-primary)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--color-primary-bg)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <Plus className="w-3.5 h-3.5" /> Agregar estadística
                    </button>
                  </div>
                  <button onClick={guardarSecciones} disabled={guardandoSitio} className="btn-primary flex items-center gap-2">
                    {guardandoSitio ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar hero
                  </button>
                </div>
              )}

              {/* ── Servicios ── */}
              {tabSitio === "servicios" && (
                <div className="panel-card space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>Servicios</h3>
                    <button onClick={() => setModalServicio({ icono: "Star", titulo: "", descripcion: "", color: "#5c8a3c", activo: true, orden: servicios.length })}
                      className="btn-primary flex items-center gap-2 text-sm">
                      <Plus className="w-4 h-4" /> Agregar
                    </button>
                  </div>
                  <div className="space-y-3">
                    {servicios.map(s => (
                      <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl"
                        style={{ background: "var(--color-cream-100)", border: "1px solid var(--color-card-border)" }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: s.color + "20" }}>
                          <span className="text-xs font-bold" style={{ color: s.color }}>{s.icono.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate" style={{ color: "var(--color-text)" }}>{s.titulo}</p>
                          <p className="text-xs line-clamp-1 mt-0.5" style={{ color: "var(--color-text-muted)" }}>{s.descripcion}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => setModalServicio(s)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: "var(--color-primary)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--color-primary-bg)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => eliminarServicio(s.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50" style={{ color: "#cc0059" }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Testimonios ── */}
              {tabSitio === "testimonios" && (
                <div className="panel-card space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>Testimonios</h3>
                    <button onClick={() => setModalTestimonio({ nombre: "", texto: "", estrellas: 5, activo: true, orden: testimonios.length })}
                      className="btn-primary flex items-center gap-2 text-sm">
                      <Plus className="w-4 h-4" /> Agregar
                    </button>
                  </div>
                  <div className="space-y-3">
                    {testimonios.map(t => (
                      <div key={t.id} className="p-4 rounded-xl"
                        style={{ background: "var(--color-cream-100)", border: "1px solid var(--color-card-border)" }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm" style={{ color: "var(--color-text)" }}>{t.nombre}</span>
                              <div className="flex gap-0.5">
                                {Array.from({ length: t.estrellas }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-current" style={{ color: "#c8a94a" }} />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm line-clamp-2" style={{ color: "var(--color-text-muted)" }}>"{t.texto}"</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => setModalTestimonio(t)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: "var(--color-primary)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-primary-bg)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => eliminarTestimonio(t.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50" style={{ color: "#cc0059" }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Mi enfoque ── */}
              {tabSitio === "enfoque" && (
                <div className="panel-card space-y-5">
                  <h3 className="font-display text-lg font-semibold" style={{ color: "var(--color-text)" }}>Sección "Mi enfoque"</h3>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Título</label>
                    <input type="text" value={secciones.enfoque_titulo ?? ""}
                      onChange={e => setSecciones(s => ({ ...s, enfoque_titulo: e.target.value }))}
                      className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Texto descriptivo</label>
                    <textarea value={secciones.enfoque_texto ?? ""}
                      onChange={e => setSecciones(s => ({ ...s, enfoque_texto: e.target.value }))}
                      className="input-base resize-none" rows={4} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Imagen (URL)</label>
                    <input type="text" value={secciones.enfoque_imagen ?? ""}
                      onChange={e => setSecciones(s => ({ ...s, enfoque_imagen: e.target.value }))}
                      className="input-base" placeholder="https://..." />
                    {secciones.enfoque_imagen && (
                      <img src={secciones.enfoque_imagen} alt="enfoque" className="mt-2 h-32 w-full object-cover rounded-xl"
                        onError={e => (e.currentTarget.style.display = "none")} />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                      Ítems de la lista <span className="font-normal normal-case">(uno por línea)</span>
                    </label>
                    <textarea
                      value={(() => {
                        try { return JSON.parse(secciones.enfoque_items ?? "[]").join("\n"); } catch { return ""; }
                      })()}
                      onChange={e => {
                        const items = e.target.value.split("\n").filter(Boolean);
                        setSecciones(s => ({ ...s, enfoque_items: JSON.stringify(items) }));
                      }}
                      className="input-base resize-none" rows={4}
                      placeholder={"Evaluación nutricional completa\nPlan semanal adaptado\nSeguimiento mensual"} />
                  </div>
                  <button onClick={guardarSecciones} disabled={guardandoSitio} className="btn-primary flex items-center gap-2">
                    {guardandoSitio ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar enfoque
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Modal testimonio ── */}
      {modalTestimonio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-3xl w-full max-w-md shadow-2xl" style={{ background: "var(--color-card-bg)" }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--color-card-border)" }}>
              <h3 className="font-display text-lg font-bold" style={{ color: "var(--color-text)" }}>
                {modalTestimonio.id ? "Editar testimonio" : "Nuevo testimonio"}
              </h3>
              <button onClick={() => setModalTestimonio(null)} style={{ color: "var(--color-text-muted)" }}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Nombre</label>
                <input type="text" value={modalTestimonio.nombre ?? ""}
                  onChange={e => setModalTestimonio(t => ({ ...t!, nombre: e.target.value }))}
                  className="input-base" placeholder="Ej: Lucía M." />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Texto</label>
                <textarea value={modalTestimonio.texto ?? ""}
                  onChange={e => setModalTestimonio(t => ({ ...t!, texto: e.target.value }))}
                  className="input-base resize-none" rows={3} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Estrellas</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setModalTestimonio(t => ({ ...t!, estrellas: n }))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: (modalTestimonio.estrellas ?? 5) >= n ? "#c8a94a20" : "var(--color-cream-100)" }}>
                      <Star className="w-4 h-4" style={{ color: (modalTestimonio.estrellas ?? 5) >= n ? "#c8a94a" : "var(--color-card-border)" }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t" style={{ borderColor: "var(--color-card-border)" }}>
              <button onClick={() => setModalTestimonio(null)} className="flex-1 btn-dark">Cancelar</button>
              <button onClick={guardarTestimonio} disabled={guardandoSitio} className="flex-1 btn-primary">
                {guardandoSitio ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal servicio ── */}
      {modalServicio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-3xl w-full max-w-md shadow-2xl" style={{ background: "var(--color-card-bg)" }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--color-card-border)" }}>
              <h3 className="font-display text-lg font-bold" style={{ color: "var(--color-text)" }}>
                {modalServicio.id ? "Editar servicio" : "Nuevo servicio"}
              </h3>
              <button onClick={() => setModalServicio(null)} style={{ color: "var(--color-text-muted)" }}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Ícono</label>
                <div className="flex flex-wrap gap-2">
                  {ICONOS_DISPONIBLES.map(ic => (
                    <button key={ic} onClick={() => setModalServicio(s => ({ ...s!, icono: ic }))}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                      style={modalServicio.icono === ic
                        ? { background: "var(--color-primary)", color: "white" }
                        : { background: "var(--color-cream-100)", color: "var(--color-text-muted)" }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Título</label>
                <input type="text" value={modalServicio.titulo ?? ""}
                  onChange={e => setModalServicio(s => ({ ...s!, titulo: e.target.value }))}
                  className="input-base" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Descripción</label>
                <textarea value={modalServicio.descripcion ?? ""}
                  onChange={e => setModalServicio(s => ({ ...s!, descripcion: e.target.value }))}
                  className="input-base resize-none" rows={3} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Color del ícono</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={modalServicio.color ?? "#5c8a3c"}
                    onChange={e => setModalServicio(s => ({ ...s!, color: e.target.value }))}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0" />
                  <input type="text" value={modalServicio.color ?? "#5c8a3c"}
                    onChange={e => setModalServicio(s => ({ ...s!, color: e.target.value }))}
                    className="input-base w-32" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t" style={{ borderColor: "var(--color-card-border)" }}>
              <button onClick={() => setModalServicio(null)} className="flex-1 btn-dark">Cancelar</button>
              <button onClick={guardarServicio} disabled={guardandoSitio} className="flex-1 btn-primary">
                {guardandoSitio ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal stat ── */}
      {modalStat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-3xl w-full max-w-sm shadow-2xl" style={{ background: "var(--color-card-bg)" }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--color-card-border)" }}>
              <h3 className="font-display text-lg font-bold" style={{ color: "var(--color-text)" }}>
                {modalStat.id ? "Editar estadística" : "Nueva estadística"}
              </h3>
              <button onClick={() => setModalStat(null)} style={{ color: "var(--color-text-muted)" }}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Número / valor</label>
                <input type="text" value={modalStat.numero ?? ""}
                  onChange={e => setModalStat(s => ({ ...s!, numero: e.target.value }))}
                  className="input-base" placeholder="Ej: 200+, 5★, 3+" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-text-muted)" }}>Etiqueta</label>
                <input type="text" value={modalStat.etiqueta ?? ""}
                  onChange={e => setModalStat(s => ({ ...s!, etiqueta: e.target.value }))}
                  className="input-base" placeholder="Ej: Pacientes, Años de experiencia" />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t" style={{ borderColor: "var(--color-card-border)" }}>
              <button onClick={() => setModalStat(null)} className="flex-1 btn-dark">Cancelar</button>
              <button onClick={guardarStat} disabled={guardandoSitio} className="flex-1 btn-primary">
                {guardandoSitio ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}