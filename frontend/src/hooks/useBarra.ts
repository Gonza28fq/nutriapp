import { useEffect, useState } from "react";

/** Hora actual, se actualiza cada 15 s (alineado al minuto que cambia). */
export function useReloj() {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  return ahora;
}

export interface Clima {
  temperatura: number;
  codigo: number;
  esDeDia: boolean;
  descripcion: string;
  emoji: string;
}

// Códigos WMO de Open-Meteo → texto y emoji
function describir(codigo: number, esDeDia: boolean): Pick<Clima, "descripcion" | "emoji"> {
  if (codigo === 0) return { descripcion: "Despejado", emoji: esDeDia ? "☀️" : "🌙" };
  if (codigo <= 2) return { descripcion: "Algo nublado", emoji: esDeDia ? "🌤️" : "☁️" };
  if (codigo === 3) return { descripcion: "Nublado", emoji: "☁️" };
  if (codigo <= 48) return { descripcion: "Niebla", emoji: "🌫️" };
  if (codigo <= 57) return { descripcion: "Llovizna", emoji: "🌦️" };
  if (codigo <= 67) return { descripcion: "Lluvia", emoji: "🌧️" };
  if (codigo <= 77) return { descripcion: "Nieve", emoji: "❄️" };
  if (codigo <= 82) return { descripcion: "Chaparrones", emoji: "🌦️" };
  return { descripcion: "Tormenta", emoji: "⛈️" };
}

// San Miguel de Tucumán (se puede cambiar por la ubicación del consultorio)
const UBICACION = { lat: -26.8083, lon: -65.2176, nombre: "Tucumán" };
const CLAVE = "nutri-clima-v1";
const VIGENCIA_MS = 30 * 60 * 1000;

/** Clima actual desde Open-Meteo (gratis, sin clave). Si falla, devuelve null y la barra no lo muestra. */
export function useClima() {
  const [clima, setClima] = useState<Clima | null>(() => {
    try {
      const c = JSON.parse(sessionStorage.getItem(CLAVE) || "null");
      return c && Date.now() - c.en < VIGENCIA_MS ? c.clima : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (clima) return;
    const ctrl = new AbortController();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${UBICACION.lat}&longitude=${UBICACION.lon}`
      + "&current=temperature_2m,weather_code,is_day&timezone=America%2FArgentina%2FTucuman";
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => {
        const actual = j.current;
        const c: Clima = {
          temperatura: Math.round(actual.temperature_2m),
          codigo: actual.weather_code,
          esDeDia: actual.is_day === 1,
          ...describir(actual.weather_code, actual.is_day === 1),
        };
        sessionStorage.setItem(CLAVE, JSON.stringify({ en: Date.now(), clima: c }));
        setClima(c);
      })
      .catch(() => { /* sin clima: no se muestra */ });
    return () => ctrl.abort();
  }, [clima]);

  return { clima, ciudad: UBICACION.nombre };
}

export function saludo(hora: number) {
  if (hora < 6) return "Buenas noches";
  if (hora < 13) return "Buen día";
  if (hora < 20) return "Buenas tardes";
  return "Buenas noches";
}
