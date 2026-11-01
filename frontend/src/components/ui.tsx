import type { ReactNode } from "react";
import { X } from "lucide-react";
import type { PatologiaPaciente } from "@/services/clinica.service";

export function Cargando({ alto = "h-48" }: { alto?: string }) {
  return (
    <div className={`flex items-center justify-center ${alto}`}>
      <div className="w-9 h-9 border-[3px] rounded-full animate-spin"
        style={{ borderColor: "var(--color-primary-border)", borderTopColor: "var(--color-primary)" }} />
    </div>
  );
}

export function Vacio({ emoji = "🌷", titulo, texto, accion }: { emoji?: string; titulo: string; texto?: string; accion?: ReactNode }) {
  return (
    <div className="text-center py-10 px-4">
      <div className="text-4xl mb-3" style={{ animation: "flotar 5s ease-in-out infinite" }}>{emoji}</div>
      <p className="font-display font-bold text-lg" style={{ color: "var(--color-text)" }}>{titulo}</p>
      {texto && <p className="text-sm mt-1 max-w-sm mx-auto" style={{ color: "var(--color-text-muted)" }}>{texto}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}

const TONOS = ["var(--color-primary)", "var(--c-lila)", "var(--c-durazno)", "var(--c-menta)", "var(--c-cielo)", "var(--c-manteca)"];
export function Iniciales({ nombre, apellido, tam = "w-11 h-11 text-sm", id = 0 }: { nombre: string; apellido: string; tam?: string; id?: number }) {
  const color = TONOS[id % TONOS.length];
  return (
    <div className={`${tam} rounded-2xl flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${color} 65%, white), ${color})` }}>
      {`${nombre?.charAt(0) ?? ""}${apellido?.charAt(0) ?? ""}`.toUpperCase()}
    </div>
  );
}

const ORIGEN: Record<PatologiaPaciente["origen"], { texto: string; titulo: string }> = {
  manual:           { texto: "Cargada",   titulo: "Cargada a mano por la nutricionista" },
  historia_clinica: { texto: "Historia",  titulo: "Declarada en la historia clínica" },
  imc:              { texto: "Por IMC",   titulo: "Calculada automáticamente con el último IMC" },
};
export function OrigenBadge({ origen }: { origen: PatologiaPaciente["origen"] }) {
  const o = ORIGEN[origen];
  return <span className="badge-rose" title={o.titulo}>{o.texto}</span>;
}

/** Chip de patología con su color. */
export function PatologiaChip({ nombre, sigla, color, grado, onClick }: { nombre: string; sigla?: string | null; color?: string | null; grado?: string | null; onClick?: () => void }) {
  const c = color || "var(--color-primary)";
  return (
    <span onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${onClick ? "cursor-pointer" : ""}`}
      style={{ background: `color-mix(in srgb, ${c} 14%, white)`, color: `color-mix(in srgb, ${c} 70%, #3b1530)`, border: `1px solid color-mix(in srgb, ${c} 35%, white)` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
      {sigla || nombre}{grado ? ` · ${grado}` : ""}
    </span>
  );
}

export function Modal({ titulo, onCerrar, children, ancho = "max-w-lg" }: { titulo: string; onCerrar: () => void; children: ReactNode; ancho?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onCerrar}
      style={{ background: "rgba(59, 21, 48, 0.35)", backdropFilter: "blur(4px)" }}>
      <div className={`w-full ${ancho} bg-white rounded-t-[2rem] sm:rounded-[2rem] max-h-[92vh] overflow-y-auto animate-pop safe-bottom`}
        onClick={(e) => e.stopPropagation()} style={{ boxShadow: "var(--shadow-float)" }}>
        <div className="sticky top-0 bg-white/95 backdrop-blur px-5 sm:px-6 pt-5 pb-3 flex items-center justify-between z-10">
          <h3 className="font-display font-bold text-xl" style={{ color: "var(--color-text)" }}>{titulo}</h3>
          <button onClick={onCerrar} aria-label="Cerrar" className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "var(--color-primary-bg)", color: "var(--color-primary-dark)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 sm:px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}

/** Tarjeta de indicador (número grande + etiqueta) con un tono pastel. */
export function Kpi({ icono, valor, etiqueta, tono = "primary", onClick }: {
  icono: ReactNode; valor: ReactNode; etiqueta: string;
  tono?: "primary" | "lila" | "durazno" | "menta" | "cielo" | "manteca"; onClick?: () => void;
}) {
  const fg = tono === "primary" ? "var(--color-primary)" : `var(--c-${tono})`;
  const bg = tono === "primary" ? "var(--color-primary-bg)" : `var(--c-${tono}-bg)`;
  return (
    <button onClick={onClick} disabled={!onClick}
      className="panel-card text-left w-full transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-default">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style={{ background: bg, color: fg }}>{icono}</div>
      <p className="font-display font-bold text-3xl leading-none" style={{ color: "var(--color-text)" }}>{valor}</p>
      <p className="text-sm font-semibold mt-1.5" style={{ color: "var(--color-text-muted)" }}>{etiqueta}</p>
    </button>
  );
}

export function Campo({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label-base">{label}</span>
      {children}
    </label>
  );
}
