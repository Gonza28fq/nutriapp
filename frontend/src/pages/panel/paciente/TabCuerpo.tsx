import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Save, X, ArrowDown, ArrowUp } from "lucide-react";
import { clinicaService, mensajeError, num, type Medicion } from "@/services/clinica.service";
import { fechaCorta, fechaISO } from "@/utils/fecha";

// ── Medidas que se dibujan en el cuerpo ──────────────────────────────────
type Clave =
  | "perimetro_cuello_cm" | "perimetro_brazo_cm" | "perimetro_torax_cm" | "circunferencia_cintura_cm"
  | "perimetro_abdomen_cm" | "circunferencia_cadera_cm" | "perimetro_muslo_cm" | "perimetro_pantorrilla_cm";

const MEDIDAS: { clave: Clave; etiqueta: string; y: number }[] = [
  { clave: "perimetro_cuello_cm", etiqueta: "Cuello", y: 84 },
  { clave: "perimetro_torax_cm", etiqueta: "Busto / tórax", y: 140 },
  { clave: "perimetro_brazo_cm", etiqueta: "Brazo", y: 150 },
  { clave: "circunferencia_cintura_cm", etiqueta: "Cintura", y: 188 },
  { clave: "perimetro_abdomen_cm", etiqueta: "Abdomen", y: 210 },
  { clave: "circunferencia_cadera_cm", etiqueta: "Cadera", y: 238 },
  { clave: "perimetro_muslo_cm", etiqueta: "Muslo", y: 288 },
  { clave: "perimetro_pantorrilla_cm", etiqueta: "Pantorrilla", y: 365 },
];

// Valores de referencia para dibujar lo que todavía no se midió
const POR_DEFECTO: Record<"f" | "m", Record<Clave, number>> = {
  f: { perimetro_cuello_cm: 33, perimetro_brazo_cm: 28, perimetro_torax_cm: 92, circunferencia_cintura_cm: 74, perimetro_abdomen_cm: 82, circunferencia_cadera_cm: 100, perimetro_muslo_cm: 56, perimetro_pantorrilla_cm: 36 },
  m: { perimetro_cuello_cm: 38, perimetro_brazo_cm: 31, perimetro_torax_cm: 100, circunferencia_cintura_cm: 88, perimetro_abdomen_cm: 92, circunferencia_cadera_cm: 100, perimetro_muslo_cm: 55, perimetro_pantorrilla_cm: 37 },
};

type Valores = Partial<Record<Clave, number | null>>;
const CX = 120;
const K = 2.6; // px por cm de diámetro (perímetro / π)
const ancho = (perimetro: number) => (perimetro / Math.PI) * K;

/** Curva suave que pasa por todos los puntos (Catmull-Rom → Bézier). */
function curva(pts: [number, number][], cerrada = true): string {
  const n = pts.length;
  const p = (i: number) => pts[(i + n) % n];
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  const tramos = cerrada ? n : n - 1;
  for (let i = 0; i < tramos; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return cerrada ? `${d} Z` : d;
}

/** Arma la silueta a partir de los perímetros: cada medida define el ancho del cuerpo a esa altura. */
function silueta(v: Valores, sexo: "f" | "m") {
  const val = (c: Clave) => v[c] ?? POR_DEFECTO[sexo][c];
  const wCuello = ancho(val("perimetro_cuello_cm"));
  const wTorax = ancho(val("perimetro_torax_cm"));
  const wHombros = wTorax * (sexo === "m" ? 1.32 : 1.18);
  const wCintura = ancho(val("circunferencia_cintura_cm"));
  const wAbdomen = ancho(val("perimetro_abdomen_cm"));
  const wCadera = ancho(val("circunferencia_cadera_cm"));
  const wMuslo = ancho(val("perimetro_muslo_cm"));
  const wPant = ancho(val("perimetro_pantorrilla_cm"));
  const wBrazo = ancho(val("perimetro_brazo_cm"));
  const pierna = Math.max(wMuslo / 2 + 2, wCadera / 2 - wMuslo * 0.42); // centro de cada pierna

  const lado = (s: 1 | -1): [number, number][] => {
    const x = (dx: number) => CX + s * dx;
    const L = pierna;
    return [
      [x(wCuello / 2), 66], [x(wCuello / 2), 86], [x(wHombros / 2), 104], [x(wTorax / 2), 140],
      [x(wCintura / 2), 188], [x(wAbdomen / 2), 210], [x(wCadera / 2), 238],
      [x(L + wMuslo / 2), 288], [x(L + wPant * 0.47), 335], [x(L + wPant / 2), 365], [x(L + 6), 420],
      [x(L - 6), 424], [x(L - wPant * 0.42), 365], [x(L - wPant * 0.45), 335], [x(L - wMuslo / 2), 292], [x(1.5), 268],
    ];
  };
  const der = lado(1);
  const izq = lado(-1).reverse();
  const cuerpo = curva([...der, ...izq]);

  const brazo = (s: 1 | -1) => {
    const hx = CX + s * (wHombros / 2 - 5);
    return curva([[hx, 110], [hx + s * 9, 182], [hx + s * 13, 250]], false);
  };
  return {
    cuerpo, brazoDer: brazo(1), brazoIzq: brazo(-1), anchoBrazo: wBrazo,
    // dónde va el punto de cada medida (borde derecho del cuerpo a esa altura)
    punto: (c: Clave): [number, number] => {
      const m = MEDIDAS.find((x) => x.clave === c)!;
      const w: Record<Clave, number> = {
        perimetro_cuello_cm: wCuello / 2, perimetro_torax_cm: wTorax / 2, perimetro_brazo_cm: wHombros / 2 + 6,
        circunferencia_cintura_cm: wCintura / 2, perimetro_abdomen_cm: wAbdomen / 2, circunferencia_cadera_cm: wCadera / 2,
        perimetro_muslo_cm: pierna + wMuslo / 2, perimetro_pantorrilla_cm: pierna + wPant / 2,
      };
      // el brazo y la pantorrilla se marcan del lado izquierdo para no amontonar
      const izquierda = c === "perimetro_brazo_cm" || c === "perimetro_pantorrilla_cm" || c === "perimetro_abdomen_cm";
      return [CX + (izquierda ? -1 : 1) * w[c], m.y];
    },
  };
}

const deMedicion = (m?: Medicion | null): Valores =>
  Object.fromEntries(MEDIDAS.map(({ clave }) => [clave, num(m?.[clave] as string | null)])) as Valores;
const tienePerimetros = (m: Medicion) => MEDIDAS.some(({ clave }) => num(m[clave] as string | null) !== null);

export default function TabCuerpo({ pacienteId, sexo, mediciones, recargar }: {
  pacienteId: number; sexo?: string; mediciones: Medicion[]; recargar: () => void;
}) {
  const s: "f" | "m" = sexo === "masculino" ? "m" : "f";
  const conMedidas = useMemo(() => mediciones.filter(tienePerimetros), [mediciones]);
  const [idActual, setIdActual] = useState<number | null>(conMedidas[conMedidas.length - 1]?.id ?? null);
  const [idComparar, setIdComparar] = useState<number | null>(conMedidas.length > 1 ? conMedidas[0].id : null);
  const [seleccion, setSeleccion] = useState<Clave | null>(null);
  // Modo carga: "nueva" crea una medición; un número edita esa medición
  const [carga, setCarga] = useState<"nueva" | number | null>(conMedidas.length === 0 ? "nueva" : null);
  const [borrador, setBorrador] = useState<Record<Clave, string>>({} as Record<Clave, string>);
  const [fechaNueva, setFechaNueva] = useState(fechaISO());
  const [guardando, setGuardando] = useState(false);

  const actual = conMedidas.find((m) => m.id === idActual) ?? null;
  const comparar = conMedidas.find((m) => m.id === idComparar) ?? null;

  const valoresBorrador: Valores = Object.fromEntries(
    MEDIDAS.map(({ clave }) => [clave, borrador[clave] ? Number(borrador[clave]) : null])
  ) as Valores;
  const vistos: Valores = carga ? { ...deMedicion(carga === "nueva" ? null : actual), ...Object.fromEntries(Object.entries(valoresBorrador).filter(([, v]) => v)) } : deMedicion(actual);
  const sil = silueta(vistos, s);
  const silComp = !carga && comparar && comparar.id !== actual?.id ? silueta(deMedicion(comparar), s) : null;

  const empezarCarga = (modo: "nueva" | number) => {
    const base = modo === "nueva" ? null : actual;
    setBorrador(Object.fromEntries(MEDIDAS.map(({ clave }) => [clave, base?.[clave] ? String(Number(base[clave])) : ""])) as Record<Clave, string>);
    setFechaNueva(fechaISO());
    setCarga(modo);
    setSeleccion(MEDIDAS[0].clave);
  };

  const guardar = async () => {
    const datos = Object.fromEntries(Object.entries(borrador).filter(([, v]) => v !== ""));
    if (!Object.keys(datos).length) { toast.error("Cargá al menos una medida"); return; }
    setGuardando(true);
    try {
      if (carga === "nueva") {
        const { id } = await clinicaService.crearMedicion(pacienteId, { fecha: fechaNueva, ...datos });
        setIdActual(id);
      } else if (typeof carga === "number") {
        await clinicaService.actualizarMedicion(carga, datos);
      }
      toast.success("Medidas guardadas 💗");
      setCarga(null);
      recargar();
    } catch (e) {
      toast.error(mensajeError(e));
    } finally { setGuardando(false); }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      {/* ── Cuerpo ── */}
      <section className="panel-card lg:col-span-2 relative overflow-hidden">
        <div aria-hidden className="absolute inset-x-0 top-0 h-40" style={{ background: "linear-gradient(180deg, var(--color-primary-bg), transparent)" }} />
        <div className="relative flex items-center justify-between mb-1">
          <p className="font-display font-bold text-lg" style={{ color: "var(--color-text)" }}>{carga ? "Cargando medidas" : "Silueta"}</p>
          {silComp && (
            <div className="flex items-center gap-3 text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: "var(--color-primary)" }} /> {actual && fechaCorta(actual.fecha)}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0 border-t-2 border-dashed" style={{ borderColor: "var(--c-lila)" }} /> {comparar && fechaCorta(comparar.fecha)}</span>
            </div>
          )}
        </div>
        <svg viewBox="0 0 240 440" className="relative w-full max-w-[17rem] mx-auto block" role="img" aria-label="Silueta con las medidas del paciente">
          <defs>
            <linearGradient id="piel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffd1e6" />
              <stop offset="100%" stopColor="#ff93c5" />
            </linearGradient>
          </defs>
          {/* brazos detrás del cuerpo */}
          {[sil.brazoDer, sil.brazoIzq].map((d, i) => (
            <path key={i} d={d} fill="none" stroke="url(#piel)" strokeWidth={sil.anchoBrazo} strokeLinecap="round"
              style={{ transition: "d .45s ease, stroke-width .45s ease" }} />
          ))}
          <path d={sil.cuerpo} fill="url(#piel)" style={{ transition: "d .45s ease" }} />
          {/* cabeza (con rodete si es femenino) */}
          {s === "f" && <circle cx={CX} cy={13} r={11} fill="#ff93c5" />}
          <ellipse cx={CX} cy={40} rx={22} ry={26} fill="url(#piel)" />
          <circle cx={CX - 7} cy={40} r={2} fill="#7a1d52" opacity={0.55} />
          <circle cx={CX + 7} cy={40} r={2} fill="#7a1d52" opacity={0.55} />
          <path d={`M${CX - 5},50 Q${CX},54 ${CX + 5},50`} stroke="#7a1d52" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.55} />
          <circle cx={CX - 13} cy={47} r={3.5} fill="#ff6fa8" opacity={0.35} />
          <circle cx={CX + 13} cy={47} r={3.5} fill="#ff6fa8" opacity={0.35} />

          {/* silueta de comparación */}
          {silComp && <path d={silComp.cuerpo} fill="none" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 5" />}

          {/* puntos de medición */}
          {MEDIDAS.map(({ clave }) => {
            const [x, y] = sil.punto(clave);
            const activo = seleccion === clave;
            const tieneValor = vistos[clave] != null;
            return (
              <g key={clave} onClick={() => setSeleccion(clave)} className="cursor-pointer">
                <line x1={CX} y1={y} x2={x} y2={y} stroke="white" strokeWidth={1.5} strokeDasharray="2 3" opacity={tieneValor ? 0.9 : 0.4} />
                {activo && <circle cx={x} cy={y} r={11} fill="#ff2484" opacity={0.18} style={{ animation: "latido 1.4s ease-in-out infinite", transformOrigin: `${x}px ${y}px` }} />}
                <circle cx={x} cy={y} r={activo ? 6.5 : 5} fill={tieneValor ? "#ff2484" : "white"} stroke="#ff2484" strokeWidth={2} />
              </g>
            );
          })}
        </svg>
        <p className="relative text-center text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
          {carga ? "La silueta se ajusta mientras cargás. Tocá un punto para elegir la medida." : "Tocá un punto del cuerpo para ver esa medida."}
        </p>
      </section>

      {/* ── Panel de medidas ── */}
      <section className="panel-card lg:col-span-3">
        {!carga ? (
          <>
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <label className="block">
                <span className="label-base">Medición</span>
                <select className="input-base" value={idActual ?? ""} onChange={(e) => setIdActual(Number(e.target.value))}>
                  {[...conMedidas].reverse().map((m) => <option key={m.id} value={m.id}>{fechaCorta(m.fecha)} · #{m.id}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label-base">Comparar con</span>
                <select className="input-base" value={idComparar ?? ""} onChange={(e) => setIdComparar(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Sin comparar</option>
                  {conMedidas.filter((m) => m.id !== idActual).map((m) => <option key={m.id} value={m.id}>{fechaCorta(m.fecha)} · #{m.id}</option>)}
                </select>
              </label>
              <div className="flex gap-2 ml-auto">
                {actual && <button onClick={() => empezarCarga(actual.id)} className="btn-soft text-sm"><Pencil className="w-4 h-4" /> Editar</button>}
                <button onClick={() => empezarCarga("nueva")} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Nuevas medidas</button>
              </div>
            </div>

            <ul className="space-y-1.5">
              {MEDIDAS.map(({ clave, etiqueta }) => {
                const a = actual ? num(actual[clave] as string | null) : null;
                const c = comparar && comparar.id !== actual?.id ? num(comparar[clave] as string | null) : null;
                const dif = a !== null && c !== null ? a - c : null;
                const activo = seleccion === clave;
                return (
                  <li key={clave}>
                    <button onClick={() => setSeleccion(clave)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all"
                      style={{ background: activo ? "var(--color-primary-bg)" : "var(--color-cream-50)", border: `1.5px solid ${activo ? "var(--color-primary-light)" : "var(--color-card-border)"}` }}>
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: a !== null ? "var(--color-primary)" : "var(--color-cream-300)" }} />
                      <span className="flex-1 font-bold text-sm" style={{ color: "var(--color-text)" }}>{etiqueta}</span>
                      {c !== null && <span className="text-xs tabular-nums" style={{ color: "var(--c-lila)" }}>{c.toLocaleString("es-AR")}</span>}
                      <span className="font-display font-bold tabular-nums w-16 text-right" style={{ color: a !== null ? "var(--color-text)" : "var(--color-cream-300)" }}>
                        {a !== null ? `${a.toLocaleString("es-AR")}` : "—"} <span className="text-xs font-body">cm</span>
                      </span>
                      <span className="w-16 flex justify-end">
                        {dif !== null && dif !== 0 && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full"
                            style={dif < 0 ? { background: "var(--c-menta-bg)", color: "#1f8a69" } : { background: "var(--c-durazno-bg)", color: "#c4552f" }}>
                            {dif < 0 ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}{Math.abs(dif).toLocaleString("es-AR", { maximumFractionDigits: 1 })}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3 mb-4">
              {carga === "nueva" ? (
                <label className="block">
                  <span className="label-base">Fecha</span>
                  <input type="date" className="input-base" value={fechaNueva} onChange={(e) => setFechaNueva(e.target.value)} />
                </label>
              ) : (
                <p className="font-bold" style={{ color: "var(--color-text)" }}>Editando la medición #{carga}</p>
              )}
              <div className="flex gap-2 ml-auto">
                {conMedidas.length > 0 && <button onClick={() => setCarga(null)} className="btn-soft text-sm"><X className="w-4 h-4" /> Cancelar</button>}
                <button onClick={guardar} disabled={guardando} className="btn-primary text-sm"><Save className="w-4 h-4" /> {guardando ? "Guardando…" : "Guardar"}</button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {MEDIDAS.map(({ clave, etiqueta }) => (
                <label key={clave} className="flex items-center gap-2 px-3 py-2 rounded-2xl transition-all"
                  style={{ background: seleccion === clave ? "var(--color-primary-bg)" : "var(--color-cream-50)", border: `1.5px solid ${seleccion === clave ? "var(--color-primary-light)" : "var(--color-card-border)"}` }}>
                  <span className="flex-1 text-sm font-bold" style={{ color: "var(--color-text)" }}>{etiqueta}</span>
                  <input type="number" inputMode="decimal" step="0.1" min="5" max="250" placeholder="cm"
                    autoFocus={seleccion === clave} onFocus={() => setSeleccion(clave)}
                    className="w-20 text-right rounded-xl px-2 py-1.5 font-bold outline-none bg-white border focus:border-[var(--color-primary-light)]"
                    style={{ borderColor: "var(--color-card-border)", color: "var(--color-text)" }}
                    value={borrador[clave] ?? ""} onChange={(e) => setBorrador((b) => ({ ...b, [clave]: e.target.value }))} />
                </label>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--color-text-muted)" }}>
              Perímetros en centímetros. Los que dejes vacíos no se guardan (en la silueta se dibujan con un valor de referencia).
            </p>
          </>
        )}
      </section>
    </div>
  );
}
