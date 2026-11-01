import { useState } from "react";
import toast from "react-hot-toast";
import { Check } from "lucide-react";
import { Modal, Campo } from "@/components/ui";
import { clinicaService, mensajeError, type Patologia } from "@/services/clinica.service";

const CATEGORIAS: { id: Patologia["categoria"]; etiqueta: string }[] = [
  { id: "peso", etiqueta: "Peso" }, { id: "metabolica", etiqueta: "Metabólica" },
  { id: "cardiovascular", etiqueta: "Cardiovascular" }, { id: "endocrina", etiqueta: "Endocrina" },
  { id: "digestiva", etiqueta: "Digestiva" }, { id: "otra", etiqueta: "Otra" },
];
const COLORES = ["#ff2484", "#fb7185", "#f97316", "#f5b524", "#3fbf98", "#4ba8f5", "#a78bfa", "#c084fc", "#94a3b8"];

/** Alta de una patología nueva en el catálogo. Devuelve su id y código. */
export default function ModalNuevaPatologia({ nombreInicial = "", onCerrar, onCreada }: {
  nombreInicial?: string; onCerrar: () => void; onCreada: (p: { id: number; codigo: string; nombre: string }) => void;
}) {
  const [nombre, setNombre] = useState(nombreInicial);
  const [sigla, setSigla] = useState("");
  const [categoria, setCategoria] = useState<Patologia["categoria"]>("otra");
  const [color, setColor] = useState(COLORES[6]);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      const p = await clinicaService.crearPatologia({ nombre: nombre.trim(), sigla: sigla.trim() || null, categoria, color });
      toast.success(`${nombre.trim()} agregada al catálogo 💗`);
      onCreada({ ...p, nombre: nombre.trim() });
    } catch (e) {
      toast.error(mensajeError(e));
    } finally { setGuardando(false); }
  };

  return (
    <Modal titulo="Nueva patología" onCerrar={onCerrar}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Campo label="Nombre" className="col-span-2">
            <input className="input-base" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} autoFocus
              placeholder="Ej: Síndrome de ovario poliquístico" />
          </Campo>
          <Campo label="Sigla (opcional)">
            <input className="input-base" value={sigla} onChange={(e) => setSigla(e.target.value)} maxLength={12} placeholder="SOP" />
          </Campo>
        </div>
        <div>
          <span className="label-base">Categoría</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((c) => (
              <button key={c.id} type="button" className="chip" data-activo={categoria === c.id} onClick={() => setCategoria(c.id)}>{c.etiqueta}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="label-base">Color</span>
          <div className="flex flex-wrap gap-2">
            {COLORES.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Color ${c}`}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ background: c, boxShadow: color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : "none" }}>
                {color === c && <Check className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onCerrar} className="btn-soft">Cancelar</button>
          <button onClick={guardar} disabled={guardando || !nombre.trim()} className="btn-primary">{guardando ? "Guardando…" : "Agregar"}</button>
        </div>
      </div>
    </Modal>
  );
}
