import { useState } from "react";
import { UtensilsCrossed, BookOpen } from "lucide-react";
import RecetasTab from "./planes/RecetasTab";
import PlanesTab from "./planes/PlanesTab";

type Tab = "planes" | "recetas";

export default function Planes() {
  const [tab, setTab] = useState<Tab>("planes");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: "var(--color-text)" }}>
            Planes alimenticios
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Gestioná recetas y arma planes semanales personalizados
          </p>
        </div>
      </div>

      <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "var(--color-cream-200)" }}>
        <button onClick={() => setTab("planes")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${tab === "planes" ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
          style={{ color: tab === "planes" ? "var(--color-text)" : "var(--color-text-muted)" }}>
          <UtensilsCrossed className="w-4 h-4" />
          Planes semanales
        </button>
        <button onClick={() => setTab("recetas")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${tab === "recetas" ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
          style={{ color: tab === "recetas" ? "var(--color-text)" : "var(--color-text-muted)" }}>
          <BookOpen className="w-4 h-4" />
          Banco de recetas
        </button>
      </div>

      {tab === "planes" ? <PlanesTab /> : <RecetasTab />}
    </div>
  );
}