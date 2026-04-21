import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Leaf, Apple, Heart, BookOpen, Star, ChevronLeft, ChevronRight, MapPin, Phone, MessageCircle, Mail } from "lucide-react";

interface BlogPost { id: number; titulo: string; resumen?: string; imagen_portada?: string; slug: string; categoria_nombre?: string; }
interface ConfigPublica { consultorio_direccion?: string; consultorio_telefono?: string; consultorio_email?: string; whatsapp?: string; }
interface Testimonio { id: number; nombre: string; texto: string; estrellas: number; }
interface Servicio   { id: number; icono: string; titulo: string; descripcion: string; color: string; }
interface Stat       { id: number; numero: string; etiqueta: string; }
interface Secciones  { hero_titulo?: string; hero_subtitulo?: string; enfoque_titulo?: string; enfoque_texto?: string; enfoque_imagen?: string; enfoque_items?: string; }

const ICON_MAP: Record<string, React.ComponentType<any>> = { Apple, Heart, BookOpen, Star, Leaf };

function useInView(threshold = 0.15) {
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
      transform: inView ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>{children}</div>
  );
}

const DEFAULT_STATS = [{ id:1, numero:"200+", etiqueta:"Pacientes" }, { id:2, numero:"5★", etiqueta:"Calificación" }, { id:3, numero:"3+", etiqueta:"Años de experiencia" }];
const DEFAULT_TESTIMONIOS = [
  { id:1, nombre:"Lucía M.", texto:"En 3 meses bajé 8 kilos sin pasar hambre. Los planes son deliciosos y fáciles de seguir.", estrellas:5 },
  { id:2, nombre:"Rodrigo F.", texto:"Aprendí a comer bien de verdad. Mi energía mejoró muchísimo desde el primer mes.", estrellas:5 },
  { id:3, nombre:"Valeria T.", texto:"Excelente atención, muy personalizada. Siente que te conoce de verdad.", estrellas:5 },
];
const DEFAULT_SERVICIOS = [
  { id:1, icono:"Apple",    titulo:"Planes personalizados",  descripcion:"Alimentación diseñada según tu metabolismo y objetivos.",  color:"#5c8a3c" },
  { id:2, icono:"Heart",    titulo:"Seguimiento continuo",   descripcion:"Consultas periódicas con ajustes precisos.",               color:"#c8622a" },
  { id:3, icono:"BookOpen", titulo:"Educación nutricional",  descripcion:"Aprendé a comer bien sin restricciones extremas.",         color:"#8a5a2a" },
  { id:4, icono:"Star",     titulo:"Resultados duraderos",   descripcion:"Cambios reales que nacen del hábito.",                     color:"#5c8a3c" },
];
const DEFAULT_SECCIONES: Secciones = {
  hero_titulo:    "Comé mejor, vivé con más energía",
  hero_subtitulo: "Planes alimenticios personalizados, seguimiento profesional y el acompañamiento que necesitás.",
  enfoque_titulo: "La nutrición no es una dieta, es un estilo de vida",
  enfoque_texto:  "Creo en un enfoque integral que combina ciencia nutricional con el placer de comer. No hay restricciones extremas, solo elecciones inteligentes que se adaptan a tu vida real.",
  enfoque_imagen: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  enfoque_items:  '["Evaluación nutricional completa","Plan semanal adaptado a tus gustos","Seguimiento y ajustes mensuales"]',
};

export default function Inicio() {
  const navigate    = useNavigate();
  const [scrollY, setScrollY]         = useState(0);
  const [posts, setPosts]             = useState<BlogPost[]>([]);
  const [carruselIdx, setCarruselIdx] = useState(0);
  const [config, setConfig]           = useState<ConfigPublica>({});
  const [testimonios, setTestimonios] = useState<Testimonio[]>([]);
  const [servicios, setServicios]     = useState<Servicio[]>([]);
  const [stats, setStats]             = useState<Stat[]>([]);
  const [secciones, setSecciones]     = useState<Secciones>(DEFAULT_SECCIONES);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  
const API = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

  useEffect(() => {
    fetch(`${API}/api/blog/publico`)
      .then(r=>r.json()).then(res=>{ if(res.ok) setPosts(res.data.slice(0,6)); }).catch(()=>{});
    fetch(`${API}/api/configuracion/publica`)
      .then(r=>r.json()).then(res=>{ if(res.ok&&res.data) setConfig(res.data); }).catch(()=>{});
    fetch(`${API}/api/sitio/publico`)
      .then(r=>r.json()).then(res=>{
        if(!res.ok) return;
        const d = res.data;
        if(d.testimonios?.length) setTestimonios(d.testimonios);
        if(d.servicios?.length)   setServicios(d.servicios);
        if(d.stats?.length)       setStats(d.stats);
        if(d.secciones)           setSecciones(prev=>({...prev,...d.secciones}));
      }).catch(()=>{});
  }, []);

  const slides: BlogPost[][] = [];
  for(let i=0; i<posts.length; i+=3) slides.push(posts.slice(i,i+3));
  const statsActivos        = stats.length        > 0 ? stats        : DEFAULT_STATS;
  const testimoniosActivos  = testimonios.length  > 0 ? testimonios  : DEFAULT_TESTIMONIOS;
  const serviciosActivos    = servicios.length    > 0 ? servicios    : DEFAULT_SERVICIOS;
  const enfoqueItems: string[] = (() => { try { return JSON.parse(secciones.enfoque_items ?? "[]"); } catch { return []; } })();

  return (
    <div style={{ fontFamily:"'DM Sans', system-ui, sans-serif" }}>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background:"linear-gradient(160deg, #1c2e0f 0%, #2d4a18 40%, #1a3a10 100%)" }}>
        <div className="absolute inset-0" style={{ backgroundImage:`url('https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=1600&q=80')`, backgroundSize:"cover", backgroundPosition:"center", transform:`translateY(${scrollY*0.35}px)`, opacity:0.18 }} />
        <div className="absolute inset-0" style={{ background:"linear-gradient(160deg, rgba(28,46,15,0.92) 0%, rgba(45,74,24,0.85) 50%, rgba(26,58,16,0.9) 100%)" }} />
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-20 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
              style={{ background:"rgba(92,138,60,0.25)", border:"1px solid rgba(92,138,60,0.4)", color:"#a8d880", animation:"fadeInDown 0.8s ease both" }}>
              <Leaf className="w-4 h-4" /> Nutrición que transforma
            </div>
            <h1 style={{ fontFamily:"'Playfair Display', Georgia, serif", fontSize:"clamp(2.8rem, 6vw, 4.5rem)", fontWeight:700, lineHeight:1.1, color:"#f5ede0", marginBottom:"1.5rem", animation:"fadeInUp 0.9s ease both", animationDelay:"0.1s" }}>
              {secciones.hero_titulo?.includes(",")
                ? <>{secciones.hero_titulo.split(",")[0]},<br /><span style={{color:"#8fc564"}}>{secciones.hero_titulo.split(",")[1]?.trim()}</span></>
                : secciones.hero_titulo}
            </h1>
            <p style={{ fontSize:"1.15rem", lineHeight:1.7, color:"#b8c9a0", maxWidth:"520px", marginBottom:"2.5rem", animation:"fadeInUp 0.9s ease both", animationDelay:"0.25s" }}>
              {secciones.hero_subtitulo}
            </p>
            <div className="flex items-center gap-4 flex-wrap" style={{ animation:"fadeInUp 0.9s ease both", animationDelay:"0.4s" }}>
              <button onClick={()=>navigate("/blog")} className="flex items-center gap-2 px-7 py-3.5 rounded-full font-medium text-sm transition-all hover:scale-105"
                style={{ background:"#5c8a3c", color:"white", boxShadow:"0 4px 24px rgba(92,138,60,0.5)" }}>
                Leer el blog <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={()=>document.getElementById("contacto")?.scrollIntoView({behavior:"smooth"})}
                className="flex items-center gap-2 px-7 py-3.5 rounded-full font-medium text-sm transition-all hover:scale-105"
                style={{ background:"rgba(255,255,255,0.1)", color:"#f5ede0", border:"1px solid rgba(255,255,255,0.2)" }}>
                Contactarme
              </button>
            </div>
          </div>
          <div className="mt-20 grid gap-4 max-w-lg" style={{ gridTemplateColumns:`repeat(${statsActivos.length},1fr)`, animation:"fadeInUp 1s ease both", animationDelay:"0.6s" }}>
            {statsActivos.map(({id,numero,etiqueta})=>(
              <div key={id} className="text-center px-3 py-4 rounded-2xl" style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }}>
                <p style={{ fontFamily:"'Playfair Display', serif", fontSize:"1.6rem", fontWeight:700, color:"#8fc564" }}>{numero}</p>
                <p className="text-xs mt-0.5" style={{ color:"#8a9e78" }}>{etiqueta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section className="py-24" style={{ background:"#faf8f4" }}>
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color:"#5c8a3c" }}>Servicios</span>
            <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:"clamp(1.8rem, 4vw, 2.8rem)", fontWeight:700, color:"#1c1208", marginTop:"0.5rem" }}>¿Cómo puedo ayudarte?</h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviciosActivos.map((s,i)=>{
              const Icon = ICON_MAP[s.icono] ?? Star;
              return (
                <FadeIn key={s.id} delay={i*100}>
                  <div className="rounded-3xl p-7 h-full transition-all hover:-translate-y-1 hover:shadow-lg"
                    style={{ background:"white", border:"1px solid rgba(139,109,56,0.1)", boxShadow:"0 2px 16px rgba(0,0,0,0.04)" }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background:s.color+"20" }}>
                      <Icon className="w-6 h-6" style={{ color:s.color }} />
                    </div>
                    <p style={{ fontFamily:"'Playfair Display', serif", fontWeight:600, fontSize:"1rem", color:"#1c1208", marginBottom:"0.5rem" }}>{s.titulo}</p>
                    <p className="text-sm leading-relaxed" style={{ color:"#7a6a50" }}>{s.descripcion}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* MI ENFOQUE */}
      <section className="py-24 overflow-hidden" style={{ background:"#f0f5e8" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <div className="relative">
                <div className="rounded-3xl overflow-hidden" style={{ boxShadow:"0 24px 64px rgba(0,0,0,0.12)" }}>
                  <img src={secciones.enfoque_imagen||"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80"}
                    alt="Alimentación saludable" className="w-full h-80 object-cover"
                    onError={e=>(e.currentTarget.style.display="none")} />
                </div>
                <div className="absolute -bottom-6 -right-6 px-5 py-4 rounded-2xl"
                  style={{ background:"#1c2e0f", color:"#8fc564", boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
                  <p style={{ fontFamily:"'Playfair Display', serif", fontSize:"1.4rem", fontWeight:700 }}>100%</p>
                  <p className="text-xs mt-0.5" style={{ color:"#6a8a54" }}>Personalizado</p>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={150}>
              <div className="space-y-6">
                <span className="text-sm font-semibold uppercase tracking-widest" style={{ color:"#5c8a3c" }}>Mi enfoque</span>
                <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:"clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight:700, color:"#1c1208", lineHeight:1.2 }}>
                  {secciones.enfoque_titulo}
                </h2>
                <p className="text-base leading-relaxed" style={{ color:"#7a6a50" }}>{secciones.enfoque_texto}</p>
                {enfoqueItems.length>0&&(
                  <div className="space-y-3">
                    {enfoqueItems.map(item=>(
                      <div key={item} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:"#5c8a3c" }}>
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-sm" style={{ color:"#5a4a32" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={()=>navigate("/blog")} className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{ background:"#5c8a3c", color:"white", boxShadow:"0 4px 20px rgba(92,138,60,0.3)" }}>
                  Ver mis artículos <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CARRUSEL POSTS */}
      {posts.length>0&&(
        <section className="py-24" style={{ background:"#faf8f4" }}>
          <div className="max-w-6xl mx-auto px-6">
            <FadeIn className="flex items-end justify-between mb-12 flex-wrap gap-4">
              <div>
                <span className="text-sm font-semibold uppercase tracking-widest" style={{ color:"#5c8a3c" }}>Blog</span>
                <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:"clamp(1.8rem, 4vw, 2.8rem)", fontWeight:700, color:"#1c1208", marginTop:"0.5rem" }}>Últimas novedades</h2>
              </div>
              {slides.length>1&&(
                <div className="flex items-center gap-2">
                  <button onClick={()=>setCarruselIdx(i=>Math.max(0,i-1))} disabled={carruselIdx===0}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30"
                    style={{ background:"white", border:"1px solid rgba(139,109,56,0.2)", color:"#5c8a3c" }}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={()=>setCarruselIdx(i=>Math.min(slides.length-1,i+1))} disabled={carruselIdx===slides.length-1}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30"
                    style={{ background:"#5c8a3c", color:"white" }}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(slides[carruselIdx]??[]).map((post,i)=>(
                <FadeIn key={post.id} delay={i*80}>
                  <div onClick={()=>navigate(`/blog/${post.slug}`)}
                    className="rounded-3xl overflow-hidden cursor-pointer group transition-all hover:-translate-y-1 hover:shadow-xl"
                    style={{ background:"white", boxShadow:"0 2px 16px rgba(0,0,0,0.05)", border:"1px solid rgba(139,109,56,0.08)" }}>
                    {post.imagen_portada?(
                      <div className="overflow-hidden h-52">
                        <img src={post.imagen_portada} alt={post.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={e=>(e.currentTarget.style.display="none")} />
                      </div>
                    ):(
                      <div className="h-52 flex items-center justify-center" style={{ background:"linear-gradient(135deg, #d4e8c0, #8fc564)" }}>
                        <BookOpen className="w-12 h-12" style={{ color:"rgba(255,255,255,0.7)" }} />
                      </div>
                    )}
                    <div className="p-6 space-y-3">
                      {post.categoria_nombre&&<span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background:"#f0f7ea", color:"#5c8a3c" }}>{post.categoria_nombre}</span>}
                      <p style={{ fontFamily:"'Playfair Display', serif", fontWeight:600, fontSize:"1rem", color:"#1c1208", lineHeight:1.4 }} className="line-clamp-2">{post.titulo}</p>
                      {post.resumen&&<p className="text-sm line-clamp-2 leading-relaxed" style={{ color:"#8a7a5a" }}>{post.resumen}</p>}
                      <div className="flex items-center gap-1 text-sm font-medium pt-1" style={{ color:"#5c8a3c" }}>Leer más <ArrowRight className="w-3.5 h-3.5 ml-1" /></div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
            {slides.length>1&&(
              <div className="flex items-center justify-center gap-2 mt-8">
                {slides.map((_,i)=>(
                  <button key={i} onClick={()=>setCarruselIdx(i)} className="rounded-full transition-all"
                    style={{ width:carruselIdx===i?"24px":"8px", height:"8px", background:carruselIdx===i?"#5c8a3c":"#c8b99a" }} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* TESTIMONIOS */}
      <section className="py-24" style={{ background:"#1c2e0f" }}>
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color:"#8fc564" }}>Testimonios</span>
            <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:"clamp(1.8rem, 4vw, 2.8rem)", fontWeight:700, color:"#f5ede0", marginTop:"0.5rem" }}>Lo que dicen mis pacientes</h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimoniosActivos.map(({id,nombre,texto,estrellas},i)=>(
              <FadeIn key={id} delay={i*120}>
                <div className="rounded-3xl p-8 h-full" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex gap-1 mb-5">
                    {Array.from({length:estrellas}).map((_,j)=>(<Star key={j} className="w-4 h-4 fill-current" style={{ color:"#c8a94a" }} />))}
                  </div>
                  <p className="text-sm leading-relaxed mb-6" style={{ color:"#b8c9a0" }}>"{texto}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background:"rgba(92,138,60,0.3)", color:"#8fc564" }}>
                      {nombre.charAt(0)}
                    </div>
                    <span className="text-sm font-medium" style={{ color:"#d4c9b0" }}>{nombre}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-24" style={{ background:"#faf8f4" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FadeIn>
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color:"#5c8a3c" }}>Contacto</span>
            <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:"clamp(1.8rem, 4vw, 2.8rem)", fontWeight:700, color:"#1c1208", marginTop:"0.5rem", marginBottom:"3rem" }}>¿Listo para empezar?</h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              config.consultorio_telefono&&{icon:Phone,        label:"Teléfono", valor:config.consultorio_telefono, link:`tel:${config.consultorio_telefono}`},
              config.consultorio_email  &&{icon:Mail,          label:"Email",    valor:config.consultorio_email,   link:`mailto:${config.consultorio_email}`},
              config.whatsapp           &&{icon:MessageCircle, label:"WhatsApp", valor:config.whatsapp,            link:`https://wa.me/${config.whatsapp?.replace(/\D/g,"")}`},
            ].filter(Boolean).map((item:any)=>(
              <FadeIn key={item.label}>
                <a href={item.link} target="_blank" rel="noopener noreferrer"
                  className="block rounded-3xl p-7 text-center transition-all hover:-translate-y-1 hover:shadow-md"
                  style={{ background:"white", border:"1px solid rgba(139,109,56,0.1)", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background:"#f0f7ea" }}>
                    <item.icon className="w-6 h-6" style={{ color:"#5c8a3c" }} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color:"#8a9e78" }}>{item.label}</p>
                  <p className="text-sm font-medium" style={{ color:"#1c1208" }}>{item.valor}</p>
                </a>
              </FadeIn>
            ))}
          </div>
          {config.consultorio_direccion&&(
            <FadeIn className="mt-8">
              <div className="inline-flex items-center gap-2 text-sm" style={{ color:"#7a6a50" }}>
                <MapPin className="w-4 h-4" style={{ color:"#5c8a3c" }} />
                {config.consultorio_direccion}
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      <style>{`
        @keyframes fadeInUp   { from{opacity:0;transform:translateY(30px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}