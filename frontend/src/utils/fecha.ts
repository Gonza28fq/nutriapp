/** AAAA-MM-DD de una fecha en hora LOCAL (toISOString usa UTC y de noche da el día siguiente). */
export function fechaISO(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Convierte 'AAAA-MM-DD' (o ISO completo) a Date local al mediodía, sin corrimientos de zona. */
export function aFecha(s: string): Date {
  return new Date(s.length <= 10 ? `${s}T12:00:00` : s);
}

export function fechaLarga(s: string, conAnio = true): string {
  return aFecha(s).toLocaleDateString("es-AR", { day: "numeric", month: "long", ...(conAnio && { year: "numeric" }) });
}

export function fechaCorta(s: string): string {
  return aFecha(s).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
