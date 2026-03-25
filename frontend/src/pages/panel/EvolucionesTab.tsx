import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Scale, Activity, Heart } from "lucide-react";

interface Medicion {
  id: number;
  fecha: string;
  peso_kg?: number;
  talla_cm?: number;
  imc?: number;
  clasificacion_imc?: string;
  circunferencia_cintura_cm?: number;
  circunferencia_cadera_cm?: number;
  porcentaje_masa_grasa?: number;
  porcentaje_masa_magra?: number;
  presion_sistolica?: number;
  presion_diastolica?: number;
  frecuencia_cardiaca?: number;
  peso_habitual_kg?: number;
  peso_posible_kg?: number;
}

interface Props {
  mediciones: Medicion[];
  pacienteId: number;
}

const METRICAS = [
  { key: "peso_kg",                   label: "Peso",             unidad: "kg",   color: "var(--color-primary)",  icon: Scale },
  { key: "imc",                       label: "IMC",              unidad: "",     color: "#2563eb",               icon: Activity },
  { key: "porcentaje_masa_grasa",     label: "Masa grasa",       unidad: "%",    color: "#dc2626",               icon: Activity },
  { key: "porcentaje_masa_magra",     label: "Masa magra",       unidad: "%",    color: "#16a34a",               icon: Activity },
  { key: "circunferencia_cintura_cm", label: "Cintura",          unidad: "cm",   color: "#d97706",               icon: Activity },
  { key: "presion_sistolica",         label: "Presión sistólica",unidad: "mmHg", color: "#9333ea",               icon: Heart },
];

const IMC_REFS = [
  { valor: 18.5, label: "Bajo peso",  color: "#2563eb" },
  { valor: 25,   label: "Normal",     color: "#16a34a" },
  { valor: 30,   label: "Sobrepeso",  color: "#d97706" },
];

function formatFecha(fecha: string) {
  return new Date(fecha.includes("T") ? fecha : fecha + "T12:00:00")
    .toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "2-digit" });
}

function Tendencia({ valores }: { valores: number[] }) {
  if (valores.length < 2) return null;
  const diff = valores[valores.length - 1] - valores[0];
  const pct  = Math.abs((diff / valores[0]) * 100).toFixed(1);

  if (Math.abs(diff) < 0.1) return (
    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#6b7280" }}>
      <Minus className="w-3 h-3" /> Sin cambio
    </span>
  );

  const sube = diff > 0;
  return (
    <span className="flex items-center gap-1 text-xs font-medium"
      style={{ color: sube ? "#dc2626" : "#16a34a" }}>
      {sube ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {sube ? "+" : "-"}{Math.abs(diff).toFixed(1)} ({pct}%)
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-sm shadow-lg"
      style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)" }}>
      <p className="font-semibold mb-1" style={{ color: "var(--color-text)" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function EvolucionTab({ mediciones }: Props) {
  const [metricaActiva, setMetricaActiva] = useState("peso_kg");

  // Ordenar por fecha ascendente para los gráficos
  const medicionesOrdenadas = useMemo(() =>
    [...mediciones]
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
    [mediciones]
  );

  const metrica = METRICAS.find(m => m.key === metricaActiva)!;

  // Datos para el gráfico activo
  const datosGrafico = useMemo(() =>
    medicionesOrdenadas
      .filter(m => m[metricaActiva as keyof Medicion] != null)
      .map(m => ({
        fecha:  formatFecha(m.fecha),
        valor:  Number(m[metricaActiva as keyof Medicion]),
        nombre: metrica.label,
      })),
    [medicionesOrdenadas, metricaActiva]
  );

  // Valores para tarjetas resumen
  const resumen = useMemo(() => {
    return METRICAS.map(m => {
      const vals = medicionesOrdenadas
        .map(med => med[m.key as keyof Medicion])
        .filter(v => v != null)
        .map(Number);

      if (!vals.length) return { ...m, actual: null, inicial: null, vals: [] };

      return {
        ...m,
        actual:  vals[vals.length - 1],
        inicial: vals[0],
        vals,
      };
    });
  }, [medicionesOrdenadas]);

  if (!mediciones.length) return (
    <div className="text-center py-12">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
        style={{ background: "var(--color-primary-bg)" }}>
        <TrendingUp className="w-7 h-7" style={{ color: "var(--color-primary)" }} />
      </div>
      <p className="font-medium" style={{ color: "var(--color-text)" }}>Sin mediciones todavía</p>
      <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
        Las mediciones se registran al crear una consulta
      </p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {resumen.filter(r => r.actual != null).map(r => {
          const Icon = r.icon;
          const activa = metricaActiva === r.key;
          return (
            <button key={r.key} onClick={() => setMetricaActiva(r.key)}
              className="p-4 rounded-2xl text-left transition-all"
              style={{
                background: activa ? r.color + "15" : "var(--color-cream-100)",
                border: `2px solid ${activa ? r.color : "var(--color-card-border)"}`,
              }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: r.color }} />
                <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{r.label}</p>
              </div>
              <p className="text-xl font-bold" style={{ color: r.color }}>
                {r.actual?.toFixed(1)} <span className="text-sm font-normal">{r.unidad}</span>
              </p>
              <div className="mt-1">
                <Tendencia valores={r.vals} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Gráfico principal */}
      {datosGrafico.length >= 2 ? (
        <div className="panel-card space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-display text-base font-semibold" style={{ color: "var(--color-text)" }}>
                Evolución — {metrica.label}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {datosGrafico.length} mediciones registradas
              </p>
            </div>
            {/* Selector de métrica */}
            <select value={metricaActiva} onChange={e => setMetricaActiva(e.target.value)}
              className="input-base w-auto text-sm">
              {METRICAS.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={datosGrafico} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-card-border)" />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                domain={["auto", "auto"]}
                tickFormatter={v => `${v}${metrica.unidad}`} />
              <Tooltip content={<CustomTooltip />} />

              {/* Líneas de referencia para IMC */}
              {metricaActiva === "imc" && IMC_REFS.map(ref => (
                <ReferenceLine key={ref.valor} y={ref.valor}
                  stroke={ref.color} strokeDasharray="4 2"
                  label={{ value: ref.label, position: "right", fontSize: 10, fill: ref.color }} />
              ))}

              <Line
                type="monotone"
                dataKey="valor"
                name={metrica.label}
                stroke={metrica.color}
                strokeWidth={2.5}
                dot={{ fill: metrica.color, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>

          {/* Primera vs última medición */}
          {datosGrafico.length >= 2 && (() => {
            const primera = datosGrafico[0];
            const ultima  = datosGrafico[datosGrafico.length - 1];
            const diff    = ultima.valor - primera.valor;
            const mejora  = diff < 0; // para peso y grasa, bajar es bueno
            return (
              <div className="flex items-center gap-4 p-3 rounded-xl flex-wrap"
                style={{ background: "var(--color-cream-100)" }}>
                <div className="text-center">
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Inicial ({primera.fecha})</p>
                  <p className="font-bold" style={{ color: "var(--color-text)" }}>
                    {primera.valor.toFixed(1)} {metrica.unidad}
                  </p>
                </div>
                <div className="flex-1 h-px" style={{ background: "var(--color-card-border)" }} />
                <div className="text-center px-3 py-1 rounded-xl"
                  style={{ background: Math.abs(diff) < 0.1 ? "var(--color-cream-200)" : mejora ? "#f0fdf4" : "#fef2f2" }}>
                  <p className="text-xs font-semibold"
                    style={{ color: Math.abs(diff) < 0.1 ? "#6b7280" : mejora ? "#16a34a" : "#dc2626" }}>
                    {diff > 0 ? "+" : ""}{diff.toFixed(1)} {metrica.unidad}
                  </p>
                </div>
                <div className="flex-1 h-px" style={{ background: "var(--color-card-border)" }} />
                <div className="text-center">
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Actual ({ultima.fecha})</p>
                  <p className="font-bold" style={{ color: "var(--color-text)" }}>
                    {ultima.valor.toFixed(1)} {metrica.unidad}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      ) : datosGrafico.length === 1 ? (
        <div className="panel-card text-center py-8">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Solo hay una medición de <strong>{metrica.label}</strong>. Necesitás al menos 2 para ver la evolución.
          </p>
        </div>
      ) : (
        <div className="panel-card text-center py-8">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No hay mediciones de <strong>{metrica.label}</strong> registradas.
          </p>
        </div>
      )}

      {/* Tabla de historial */}
      <div className="panel-card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b" style={{ borderColor: "var(--color-card-border)" }}>
          <h3 className="font-display text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Historial completo de mediciones
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--color-cream-100)" }}>
                {["Fecha", "Peso", "IMC", "Grasa %", "Magra %", "Cintura", "Presión"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--color-text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...medicionesOrdenadas].reverse().map((m, i) => (
                <tr key={m.id}
                  style={{ borderTop: i > 0 ? "1px solid var(--color-card-border)" : "none" }}>
                  <td className="px-4 py-3 font-medium text-xs" style={{ color: "var(--color-text)" }}>
                    {formatFecha(m.fecha)}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text)" }}>
                    {m.peso_kg != null ? `${m.peso_kg} kg` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {m.imc != null ? (
                      <span className="font-medium" style={{ color: "var(--color-primary)" }}>
                        {m.imc} <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>
                          {m.clasificacion_imc}
                        </span>
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text)" }}>
                    {m.porcentaje_masa_grasa != null ? `${m.porcentaje_masa_grasa}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text)" }}>
                    {m.porcentaje_masa_magra != null ? `${m.porcentaje_masa_magra}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text)" }}>
                    {m.circunferencia_cintura_cm != null ? `${m.circunferencia_cintura_cm} cm` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text)" }}>
                    {m.presion_sistolica != null && m.presion_diastolica != null
                      ? `${m.presion_sistolica}/${m.presion_diastolica}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}