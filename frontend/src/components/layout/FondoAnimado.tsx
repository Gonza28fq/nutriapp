// Fondo del panel: manchas pastel difuminadas + figuritas cute (corazones, frutillas,
// hojitas, manzanas, destellos) que suben muy despacio balanceándose.
// Solo anima transform/opacity (liviano). Con "reducir movimiento" quedan quietas.

type Forma = "corazon" | "frutilla" | "hoja" | "manzana" | "destello";

function Figura({ forma, color }: { forma: Forma; color: string }) {
  switch (forma) {
    case "corazon":
      return <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.6 2.6 4.5 6.4 4.1c2.1-.2 3.9 1 5.6 3 1.7-2 3.5-3.2 5.6-3 3.8.4 5.5 4.5 4 7.7C19.5 16.4 12 21 12 21z" fill={color} />;
    case "frutilla":
      return (
        <>
          <path d="M12 21c-4.6 0-8-4.7-8-9.4 0-3 2-4.6 4.4-4.6 1.4 0 2.6.5 3.6 1.3 1-.8 2.2-1.3 3.6-1.3 2.4 0 4.4 1.6 4.4 4.6 0 4.7-3.4 9.4-8 9.4z" fill={color} />
          <path d="M8 6.5c1.2-.3 2.6.1 4 1 1.4-.9 2.8-1.3 4-1-.6-1.6-2.1-2.5-4-2.5S8.6 4.9 8 6.5z" fill="#7fd4a8" />
          {[[9, 12], [15, 12], [12, 15.5], [9.5, 17.5], [14.5, 17.5]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={0.75} fill="#fff6c9" />)}
        </>
      );
    case "hoja":
      return <path d="M4 20c0-9 6-15 16-16-1 10-7 16-16 16zm0 0c3-4 6-7 10-9" fill={color} stroke="white" strokeWidth={1.2} strokeLinecap="round" />;
    case "manzana":
      return (
        <>
          <path d="M12 7.5c-1.6-1.3-5.8-1.4-7 2.4-1.3 4 1.4 10.1 4.5 10.6 1 .2 1.8-.4 2.5-.4s1.5.6 2.5.4c3.1-.5 5.8-6.6 4.5-10.6-1.2-3.8-5.4-3.7-7-2.4z" fill={color} />
          <path d="M12 7.5c.2-2 1.4-3.6 3.4-4-.2 2-1.4 3.4-3.4 4z" fill="#7fd4a8" />
        </>
      );
    case "destello":
      return <path d="M12 2l1.8 6.7L20 12l-6.2 3.3L12 22l-1.8-6.7L4 12l6.2-3.3z" fill={color} />;
  }
}

// Posiciones, tamaños y tiempos fijos (no aleatorios) para que el fondo sea estable entre recargas.
const FIGURAS: { forma: Forma; color: string; x: number; tam: number; dur: number; delay: number; op: number }[] = [
  { forma: "corazon",  color: "#ff93c5", x: 6,  tam: 22, dur: 30, delay: -4,  op: 0.45 },
  { forma: "frutilla", color: "#ff7aa8", x: 17, tam: 28, dur: 38, delay: -20, op: 0.35 },
  { forma: "destello", color: "#ffcf5c", x: 28, tam: 16, dur: 24, delay: -12, op: 0.5 },
  { forma: "hoja",     color: "#9ee0c2", x: 39, tam: 22, dur: 34, delay: -27, op: 0.4 },
  { forma: "corazon",  color: "#c4b5fd", x: 50, tam: 18, dur: 26, delay: -8,  op: 0.45 },
  { forma: "manzana",  color: "#ffb3c9", x: 61, tam: 26, dur: 40, delay: -32, op: 0.35 },
  { forma: "destello", color: "#ff93c5", x: 70, tam: 14, dur: 22, delay: -3,  op: 0.55 },
  { forma: "frutilla", color: "#ff8fb1", x: 80, tam: 24, dur: 36, delay: -15, op: 0.35 },
  { forma: "corazon",  color: "#ffb199", x: 90, tam: 20, dur: 28, delay: -22, op: 0.45 },
  { forma: "hoja",     color: "#b8e9d3", x: 96, tam: 18, dur: 32, delay: -6,  op: 0.4 },
  { forma: "destello", color: "#c4b5fd", x: 11, tam: 12, dur: 25, delay: -18, op: 0.5 },
  { forma: "corazon",  color: "#ff93c5", x: 44, tam: 14, dur: 29, delay: -25, op: 0.4 },
  { forma: "manzana",  color: "#ffc4a8", x: 74, tam: 20, dur: 37, delay: -9,  op: 0.3 },
  { forma: "destello", color: "#ffcf5c", x: 86, tam: 12, dur: 23, delay: -14, op: 0.5 },
];

export default function FondoAnimado() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" style={{ background: "var(--color-body-bg)" }}>
      {/* manchas de color */}
      <div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(circle, var(--color-primary-border), transparent 70%)", animation: "flotar 18s ease-in-out infinite" }} />
      <div className="absolute top-1/3 -left-32 w-[24rem] h-[24rem] rounded-full blur-3xl opacity-50"
        style={{ background: "radial-gradient(circle, var(--c-lila-bg), transparent 70%)", animation: "flotar 22s ease-in-out infinite reverse" }} />
      <div className="absolute -bottom-40 right-1/4 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(circle, var(--c-durazno-bg), transparent 70%)", animation: "flotar 26s ease-in-out infinite" }} />
      {/* puntitos */}
      <div className="absolute inset-0 opacity-[0.3]"
        style={{ backgroundImage: "radial-gradient(var(--color-primary-border) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />

      {/* figuritas que suben */}
      {FIGURAS.map((f, i) => (
        <div key={i} className="absolute bottom-0 fondo-sube" style={{
          left: `${f.x}%`, width: f.tam, height: f.tam, opacity: f.op,
          animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s`,
          // posición de reposo si no hay animación (reducir movimiento)
          ["--reposo" as string]: `-${(i * 37) % 85 + 8}vh`,
        }}>
          <div className="w-full h-full fondo-vaiven" style={{ animationDuration: `${4 + (i % 4)}s`, animationDelay: `${-i}s` }}>
            <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-sm"><Figura forma={f.forma} color={f.color} /></svg>
          </div>
        </div>
      ))}
    </div>
  );
}
