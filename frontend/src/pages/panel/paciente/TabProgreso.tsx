import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Plus, FlaskConical, Pencil, Trash2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import toast from "react-hot-toast";
import { clinicaService, mensajeError, num, type Medicion, type Laboratorio } from "@/services/clinica.service";
import { Vacio } from "@/components/ui";
import { fechaCorta, aFecha } from "@/utils/fecha";
import { FormMedicion, FormLaboratorio } from "./formularios";

interface Metrica {
  clave: string; etiqueta: string; unidad: string; fuente: "med" | "lab"; color: string;
  normal?: [number, number]; decimales?: number;
}
const METRICAS: Metrica[] = [
  { clave: "peso_kg", etiqueta: "Peso", unidad: "kg", fuente: "med", color: "#ff2484", decimales: 1 },
  { clave: "imc", etiqueta: "IMC", unidad: "", fuente: "med", color: "#e8577e", normal: [18.5, 24.9], decimales: 1 },
  { clave: "porcentaje_masa_grasa", etiqueta: "% grasa", unidad: "%", fuente: "med", color: "#ff9b7a", decimales: 1 },
  { clave: "porcentaje_masa_magra", etiqueta: "% masa magra", unidad: "%", fuente: "med", color: "#3fbf98", decimales: 1 },
  { clave: "masa_muscular_kg", etiqueta: "Masa muscular", unidad: "kg", fuente: "med", color: "#a78bfa", decimales: 1 },
  { clave: "circunferencia_cintura_cm", etiqueta: "Cintura", unidad: "cm", fuente: "med", color: "#f5b524", decimales: 1 },
  { clave: "glucemia", etiqueta: "Glucemia", unidad: "mg/dl", fuente: "lab", color: "#4ba8f5", normal: [70, 100], decimales: 0 },
  { clave: "hemoglobina_glicosilada", etiqueta: "HbA1c", unidad: "%", fuente: "lab", color: "#8b5cf6", normal: [4, 5.7], decimales: 1 },
  { clave: "colesterol_total", etiqueta: "Colesterol", unidad: "mg/dl", fuente: "lab", color: "#fb7185", normal: [120, 200], decimales: 0 },
];

const fmt = (v: number | null, d = 1) => (v === null ? "—" : v.toLocaleString("es-AR", { maximumFractionDigits: d, minimumFractionDigits: 0 }));

export default function TabProgreso({ pacienteId, mediciones, laboratorios, recargar }: {
  pacienteId: number; mediciones: Medicion[]; laboratorios: Laboratorio[]; recargar: () => void;
}) {
  const disponibles = METRICAS.filter((m) =>
    (m.fuente === "med" ? mediciones : laboratorios).some((r) => num((r as Record<string, unknown>)[m.clave] as string) !== null));
  const [clave, setClave] = useState<string>(disponibles[0]?.clave ?? "peso_kg");
  const [formMed, setFormMed] = useState<Medicion | null | undefined>(undefined); // undefined = cerrado, null = nueva
  const [formLab, setFormLab] = useState(false);
  const metrica = METRICAS.find((m) => m.clave === clave) ?? METRICAS[0];

  const serie = useMemo(() => {
    const filas = (metrica.fuente === "med" ? mediciones : laboratorios) as unknown as Record<string, string | null>[];
    return filas
      .map((r) => ({ fecha: r.fecha as string, valor: num(r[metrica.clave]) }))
      .filter((p): p is { fecha: string; valor: number } => p.valor !== null);
  }, [metrica, mediciones, laboratorios]);

  const inicio = serie[0]?.valor ?? null;
  const actual = serie[serie.length - 1]?.valor ?? null;
  const cambio = inicio !== null && actual !== null ? actual - inicio : null;
  const valores = serie.map((p) => p.valor).concat(metrica.normal ?? []);
  const dominio: [number, number] = valores.length
    ? [Math.floor(Math.min(...valores) * 0.95), Math.ceil(Math.max(...valores) * 1.05)]
    : [0, 1];

  const borrar = async (m: Medicion) => {
    if (!confirm(`¿Borrar la medición del ${fechaCorta(m.fecha)}?`)) return;
    try { await clinicaService.borrarMedicion(m.id); toast.success("Medición borrada"); recargar(); }
    catch (e) { toast.error(mensajeError(e, "No se pudo borrar")); }
  };

  const hayDatos = mediciones.length > 0 || laboratorios.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFormMed(null)} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Nueva medición</button>
        <button onClick={() => setFormLab(true)} className="btn-soft text-sm"><FlaskConical className="w-4 h-4" /> Nuevo laboratorio</button>
      </div>

      {!hayDatos ? (
        <section className="panel-card">
          <Vacio emoji="📈" titulo="Todavía no hay datos para graficar" texto="Cargá la primera medición o un laboratorio y acá vas a ver la evolución." />
        </section>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(disponibles.length ? disponibles : METRICAS.slice(0, 1)).map((m) => (
              <button key={m.clave} className="chip" data-activo={m.clave === clave} onClick={() => setClave(m.clave)}>{m.etiqueta}</button>
            ))}
          </div>

          <section className="panel-card">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[["Inicio", inicio], ["Actual", actual]].map(([et, v]) => (
                <div key={et as string} className="p-3 rounded-2xl" style={{ background: "var(--color-cream-100)" }}>
                  <p className="text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>{et as string}</p>
                  <p className="font-display font-bold text-2xl" style={{ color: "var(--color-text)" }}>
                    {fmt(v as number | null, metrica.decimales)}<span className="text-sm ml-0.5">{metrica.unidad}</span>
                  </p>
                </div>
              ))}
              <div className="p-3 rounded-2xl" style={{ background: "var(--color-primary-bg)" }}>
                <p className="text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>Cambio</p>
                <p className="font-display font-bold text-2xl flex items-center gap-1" style={{ color: "var(--color-primary-dark)" }}>
                  {cambio === null || serie.length < 2 ? "—" : (
                    <>
                      {cambio < 0 ? <TrendingDown className="w-5 h-5" /> : cambio > 0 ? <TrendingUp className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                      {cambio > 0 ? "+" : ""}{fmt(cambio, metrica.decimales)}
                    </>
                  )}
                </p>
              </div>
            </div>

            {serie.length === 0 ? (
              <Vacio emoji="🌱" titulo={`Sin valores de ${metrica.etiqueta.toLowerCase()}`} />
            ) : (
              <div className="h-64 sm:h-72 -ml-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={serie} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`g-${metrica.clave}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={metrica.color} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={metrica.color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#fbdbe9" strokeDasharray="4 6" vertical={false} />
                    {metrica.normal && (
                      <ReferenceArea y1={metrica.normal[0]} y2={metrica.normal[1]} fill="#3fbf98" fillOpacity={0.08}
                        label={{ value: "rango normal", position: "insideTopRight", fill: "#3fbf98", fontSize: 11, fontWeight: 700 }} />
                    )}
                    <XAxis dataKey="fecha" tickFormatter={(f) => aFecha(f).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                      tick={{ fill: "#95587a", fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={20} />
                    <YAxis domain={dominio} tick={{ fill: "#95587a", fontSize: 12 }} axisLine={false} tickLine={false} width={44} />
                    <Tooltip
                      formatter={(v) => [`${fmt(Number(v), metrica.decimales)} ${metrica.unidad}`, metrica.etiqueta]}
                      labelFormatter={(f) => fechaCorta(String(f))}
                      contentStyle={{ borderRadius: 16, border: "1px solid #fbdbe9", boxShadow: "0 10px 30px -12px rgba(176,48,111,.35)", fontFamily: "Nunito" }} />
                    <Area type="monotone" dataKey="valor" stroke={metrica.color} strokeWidth={3} fill={`url(#g-${metrica.clave})`}
                      dot={{ r: 4, fill: "white", stroke: metrica.color, strokeWidth: 2.5 }} activeDot={{ r: 6 }} animationDuration={700} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {mediciones.length > 0 && (
            <section className="panel-card">
              <h3 className="font-display font-bold text-lg mb-3" style={{ color: "var(--color-text)" }}>Historial de mediciones</h3>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm min-w-[34rem]">
                  <thead>
                    <tr className="text-left text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {["Fecha", "Peso", "IMC", "% grasa", "% magra", "Cintura", ""].map((h) => <th key={h} className="px-2 pb-2 font-bold">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[...mediciones].reverse().map((m) => (
                      <tr key={m.id} className="border-t" style={{ borderColor: "var(--color-card-border)", color: "var(--color-text)" }}>
                        <td className="px-2 py-2 font-semibold whitespace-nowrap">{fechaCorta(m.fecha)} <span className="id-tag">#{m.id}</span></td>
                        <td className="px-2">{fmt(num(m.peso_kg))}</td>
                        <td className="px-2">{fmt(num(m.imc))}</td>
                        <td className="px-2">{fmt(num(m.porcentaje_masa_grasa))}</td>
                        <td className="px-2">{fmt(num(m.porcentaje_masa_magra))}</td>
                        <td className="px-2">{fmt(num(m.circunferencia_cintura_cm))}</td>
                        <td className="px-2 text-right whitespace-nowrap">
                          <button onClick={() => setFormMed(m)} className="p-1.5 rounded-lg hover:bg-[var(--color-primary-bg)]" aria-label="Editar"><Pencil className="w-4 h-4" style={{ color: "var(--color-primary)" }} /></button>
                          <button onClick={() => borrar(m)} className="p-1.5 rounded-lg hover:bg-[var(--color-primary-bg)]" aria-label="Borrar"><Trash2 className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {formMed !== undefined && (
        <FormMedicion pacienteId={pacienteId} medicion={formMed} onCerrar={() => setFormMed(undefined)}
          onGuardado={() => { setFormMed(undefined); recargar(); }} />
      )}
      {formLab && <FormLaboratorio pacienteId={pacienteId} onCerrar={() => setFormLab(false)} onGuardado={() => { setFormLab(false); recargar(); }} />}
    </div>
  );
}
