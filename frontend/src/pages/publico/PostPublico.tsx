import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Tag, Calendar, BookOpen, Utensils } from "lucide-react";
import { BlogPost } from "@/services/blog.service";

export default function PostPublico() {
  const { slug }  = useParams();
  const navigate  = useNavigate();
  const [post, setPost]         = useState<BlogPost | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/blog/publico/${slug}`)
      .then(r => r.json())
      .then(res => { if (res.ok) setPost(res.data); else navigate("/blog"); })
      .catch(() => navigate("/blog"))
      .finally(() => setCargando(false));
  }, [slug]);

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  if (cargando) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: "#d4e8c0", borderTopColor: "#5c8a3c" }} />
    </div>
  );

  if (!post) return null;

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#faf8f4" }}>

      {/* ── Hero del post ── */}
      <div className="relative pt-24 pb-16 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1c2e0f 0%, #2d4a18 100%)" }}>
        {post.imagen_portada && (
          <div className="absolute inset-0" style={{
            backgroundImage: `url('${post.imagen_portada}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.15,
          }} />
        )}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(160deg, rgba(28,46,15,0.95), rgba(45,74,24,0.9))"
        }} />
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <button onClick={() => navigate("/blog")}
            className="flex items-center gap-2 text-sm font-medium mb-8 transition-opacity hover:opacity-70"
            style={{ color: "#8fc564" }}>
            <ArrowLeft className="w-4 h-4" />
            Volver al blog
          </button>

          <div className="flex items-center gap-3 flex-wrap mb-5">
            {post.categoria_nombre && (
              <span className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full"
                style={{ background: "rgba(92,138,60,0.25)", border: "1px solid rgba(92,138,60,0.4)", color: "#a8d880" }}>
                <Tag className="w-3.5 h-3.5" />
                {post.categoria_nombre}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs" style={{ color: "#8a9e78" }}>
              <Calendar className="w-3.5 h-3.5" />
              {post.publicado_en ? formatFecha(post.publicado_en) : formatFecha(post.creado_en)}
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(1.8rem, 4vw, 3rem)",
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#f5ede0",
            marginBottom: "1rem",
          }}>
            {post.titulo}
          </h1>

          {post.resumen && (
            <p className="text-base leading-relaxed" style={{ color: "#b8c9a0", maxWidth: "520px" }}>
              {post.resumen}
            </p>
          )}
        </div>
      </div>

      {/* ── Imagen principal ── */}
      {post.imagen_portada && (
        <div className="max-w-3xl mx-auto px-6 -mt-8 relative z-10">
          <img src={post.imagen_portada} alt={post.titulo}
            className="w-full h-72 object-cover rounded-3xl"
            style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.15)" }}
            onError={e => (e.currentTarget.style.display = "none")} />
        </div>
      )}

      {/* ── Contenido ── */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="rounded-3xl p-10"
          style={{ background: "white", boxShadow: "0 2px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(139,109,56,0.08)" }}>
          <p className="text-base leading-loose whitespace-pre-wrap" style={{ color: "#3a2e1c", lineHeight: 1.9 }}>
            {post.contenido}
          </p>
        </div>

        {/* Recetas vinculadas */}
        {post.recetas && post.recetas.length > 0 && (
          <div className="mt-12 space-y-5">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#1c1208", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Utensils className="w-5 h-5" style={{ color: "#5c8a3c" }} />
              Recetas mencionadas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {post.recetas.map(r => (
                <div key={r.id} className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:-translate-y-0.5"
                  style={{ background: "white", border: "1px solid rgba(139,109,56,0.1)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#f0f7ea" }}>
                    <BookOpen className="w-5 h-5" style={{ color: "#5c8a3c" }} />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: "#1c1208" }}>{r.nombre}</p>
                    {r.calorias_kcal != null && (
                      <p className="text-xs mt-0.5" style={{ color: "#8a9e78" }}>{r.calorias_kcal} kcal por porción</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA volver */}
        <div className="mt-12 text-center">
          <button onClick={() => navigate("/blog")}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium transition-all hover:scale-105"
            style={{ background: "#5c8a3c", color: "white", boxShadow: "0 4px 20px rgba(92,138,60,0.3)" }}>
            <ArrowLeft className="w-4 h-4" />
            Ver más artículos
          </button>
        </div>
      </div>
    </div>
  );
}