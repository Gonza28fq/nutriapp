import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Tag, ArrowRight, Search } from "lucide-react";
import { BlogPost, BlogCategoria } from "@/services/blog.service";

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

export default function BlogPublico() {
  const navigate = useNavigate();
  const [posts, setPosts]           = useState<BlogPost[]>([]);
  const [categorias, setCategorias] = useState<BlogCategoria[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [busqueda, setBusqueda]     = useState("");
  const [catFiltro, setCatFiltro]   = useState("");

 useEffect(() => {
    fetch("/api/blog/publico")
      .then(r => r.json())
      .then(res => {
        if (res.ok) {
          setPosts(res.data);
          // Extraer categorías únicas de los posts
          const cats = res.data
            .filter((p: BlogPost) => p.categoria_nombre)
            .map((p: BlogPost) => ({ id: p.categoria_id ?? 0, nombre: p.categoria_nombre! }))
            .filter((c: any, i: number, arr: any[]) => arr.findIndex(x => x.nombre === c.nombre) === i);
          setCategorias(cats);
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);
  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  const postsFiltrados = posts.filter(p => {
    const coincideBusq = !busqueda || p.titulo.toLowerCase().includes(busqueda.toLowerCase()) || (p.resumen ?? "").toLowerCase().includes(busqueda.toLowerCase());
    const coincideCat  = !catFiltro || p.categoria_nombre === catFiltro;
    return coincideBusq && coincideCat;
  });

  const postDestacado = postsFiltrados[0];
  const postsSiguientes = postsFiltrados.slice(1);

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#faf8f4" }}>

      {/* ── Header del blog ── */}
      <div className="pt-28 pb-16" style={{ background: "linear-gradient(160deg, #1c2e0f 0%, #2d4a18 100%)" }}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#8fc564" }}>Artículos</span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, color: "#f5ede0", marginTop: "0.5rem", marginBottom: "1rem" }}>
            Blog de nutrición
          </h1>
          <p className="text-base mb-10" style={{ color: "#b8c9a0", maxWidth: "480px", margin: "0 auto 2.5rem" }}>
            Consejos prácticos, recetas saludables y todo lo que necesitás saber para comer mejor.
          </p>

          {/* Buscador */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6a8a54" }} />
            <input type="text" placeholder="Buscar artículos..." value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-full text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#f5ede0", caretColor: "#8fc564" }} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">

        {/* Filtros de categoría */}
        {categorias.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCatFiltro("")}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={!catFiltro
                ? { background: "#5c8a3c", color: "white" }
                : { background: "white", color: "#7a6a50", border: "1px solid rgba(139,109,56,0.15)" }}>
              Todos
            </button>
            {categorias.map(c => (
              <button key={c.id} onClick={() => setCatFiltro(c.nombre === catFiltro ? "" : c.nombre)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={catFiltro === c.nombre
                  ? { background: "#5c8a3c", color: "white" }
                  : { background: "white", color: "#7a6a50", border: "1px solid rgba(139,109,56,0.15)" }}>
                {c.nombre}
              </button>
            ))}
          </div>
        )}

        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: "#d4e8c0", borderTopColor: "#5c8a3c" }} />
          </div>
        ) : postsFiltrados.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "#f0f7ea" }}>
              <BookOpen className="w-8 h-8" style={{ color: "#5c8a3c" }} />
            </div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", color: "#1c1208" }}>
              No hay artículos {busqueda ? "para tu búsqueda" : "publicados todavía"}
            </p>
            <p className="text-sm" style={{ color: "#8a7a5a" }}>Volvé pronto para ver novedades</p>
          </div>
        ) : (
          <>
            {/* Post destacado */}
            {postDestacado && (
              <FadeIn>
                <div onClick={() => navigate(`/blog/${postDestacado.slug}`)}
                  className="rounded-3xl overflow-hidden cursor-pointer group transition-all hover:shadow-xl"
                  style={{ background: "white", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(139,109,56,0.08)" }}>
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="overflow-hidden h-72 lg:h-auto">
                      {postDestacado.imagen_portada ? (
                        <img src={postDestacado.imagen_portada} alt={postDestacado.titulo}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={e => (e.currentTarget.style.display = "none")} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center min-h-64"
                          style={{ background: "linear-gradient(135deg, #d4e8c0, #8fc564)" }}>
                          <BookOpen className="w-16 h-16" style={{ color: "rgba(255,255,255,0.6)" }} />
                        </div>
                      )}
                    </div>
                    <div className="p-10 flex flex-col justify-center space-y-5">
                      <div className="flex items-center gap-3">
                        {postDestacado.categoria_nombre && (
                          <span className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full"
                            style={{ background: "#f0f7ea", color: "#5c8a3c" }}>
                            <Tag className="w-3 h-3" />
                            {postDestacado.categoria_nombre}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: "#a09070" }}>
                          {postDestacado.publicado_en ? formatFecha(postDestacado.publicado_en) : formatFecha(postDestacado.creado_en)}
                        </span>
                      </div>
                      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", fontWeight: 700, color: "#1c1208", lineHeight: 1.3 }}>
                        {postDestacado.titulo}
                      </h2>
                      {postDestacado.resumen && (
                        <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "#7a6a50" }}>
                          {postDestacado.resumen}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm font-medium pt-2"
                        style={{ color: "#5c8a3c" }}>
                        Leer artículo completo <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Grid de posts */}
            {postsSiguientes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {postsSiguientes.map((post, i) => (
                  <FadeIn key={post.id} delay={i * 70}>
                    <div onClick={() => navigate(`/blog/${post.slug}`)}
                      className="rounded-3xl overflow-hidden cursor-pointer group transition-all hover:-translate-y-1 hover:shadow-lg h-full flex flex-col"
                      style={{ background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid rgba(139,109,56,0.08)" }}>
                      <div className="overflow-hidden h-48">
                        {post.imagen_portada ? (
                          <img src={post.imagen_portada} alt={post.titulo}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={e => (e.currentTarget.style.display = "none")} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #d4e8c0, #8fc564)" }}>
                            <BookOpen className="w-10 h-10" style={{ color: "rgba(255,255,255,0.6)" }} />
                          </div>
                        )}
                      </div>
                      <div className="p-6 space-y-3 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          {post.categoria_nombre && (
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                              style={{ background: "#f0f7ea", color: "#5c8a3c" }}>
                              {post.categoria_nombre}
                            </span>
                          )}
                          <span className="text-xs" style={{ color: "#a09070" }}>
                            {post.publicado_en ? formatFecha(post.publicado_en) : formatFecha(post.creado_en)}
                          </span>
                        </div>
                        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: "1rem", color: "#1c1208", lineHeight: 1.4 }}
                          className="line-clamp-2 flex-1">
                          {post.titulo}
                        </p>
                        {post.resumen && (
                          <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: "#8a7a5a" }}>{post.resumen}</p>
                        )}
                        <div className="flex items-center gap-1 text-sm font-medium pt-2"
                          style={{ color: "#5c8a3c" }}>
                          Leer más <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}