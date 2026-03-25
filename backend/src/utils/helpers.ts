import pool from "../config/database";

export function calcularIMC(pesoKg: number, tallaCm: number): { imc: number; clasificacion: string } {
  const tallaM = tallaCm / 100;
  const imc = pesoKg / (tallaM * tallaM);
  const imcRedondeado = Math.round(imc * 100) / 100;
  let clasificacion = "";
  if (imc < 18.5)     clasificacion = "Bajo peso";
  else if (imc < 25)  clasificacion = "Normopeso";
  else if (imc < 30)  clasificacion = "Sobrepeso";
  else if (imc < 35)  clasificacion = "Obesidad grado I";
  else if (imc < 40)  clasificacion = "Obesidad grado II";
  else                clasificacion = "Obesidad grado III";
  return { imc: imcRedondeado, clasificacion };
}

export function generarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 200);
}

export function getPaginacion(pagina: number = 1, limite: number = 20) {
  const paginaSegura = Math.max(1, pagina);
  const limiteSeguro = Math.min(Math.max(1, limite), 100);
  const offset = (paginaSegura - 1) * limiteSeguro;
  return { limite: limiteSeguro, offset, pagina: paginaSegura };
}

export function toMySQLDate(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

export function calcularEdad(fechaNacimiento: Date | string): number {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}