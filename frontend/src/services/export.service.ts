import * as XLSX from "xlsx";

// ── Helpers ──────────────────────────────────────────────────────
function descargar(wb: XLSX.WorkBook, nombre: string) {
  XLSX.writeFile(wb, `${nombre}.xlsx`);
}

function hoja(datos: Record<string, any>[], titulo: string) {
  const ws = XLSX.utils.json_to_sheet(datos);
  // Ancho de columnas automático
  const cols = Object.keys(datos[0] ?? {}).map(k => ({ wch: Math.max(k.length, 14) }));
  ws["!cols"] = cols;
  return { ws, titulo };
}

// ── Exportar pacientes ────────────────────────────────────────────
export function exportarPacientesExcel(pacientes: any[]) {
  if (!pacientes.length) return;
  const wb = XLSX.utils.book_new();
  const datos = pacientes.map(p => ({
    "Apellido":       p.apellido ?? "",
    "Nombre":         p.nombre ?? "",
    "DNI":            p.dni ?? "",
    "Fecha nac.":     p.fecha_nacimiento
      ? new Date(p.fecha_nacimiento.includes("T") ? p.fecha_nacimiento : p.fecha_nacimiento + "T12:00:00").toLocaleDateString("es-AR")
      : "",
    "Edad":           p.edad ?? "",
    "Sexo":           p.sexo ?? "",
    "Celular":        p.celular ?? "",
    "Email":          p.email ?? "",
    "Domicilio":      p.domicilio ?? "",
    "Localidad":      p.localidad ?? "",
    "Derivado por":   p.derivado_por ?? "",
    "Estado":         p.activo ? "Activo" : "Baja",
    "Alta en sistema":p.creado_en
      ? new Date(p.creado_en).toLocaleDateString("es-AR")
      : "",
  }));
  const { ws } = hoja(datos, "Pacientes");
  XLSX.utils.book_append_sheet(wb, ws, "Pacientes");
  descargar(wb, `pacientes_${new Date().toISOString().slice(0,10)}`);
}

// ── Exportar consultas ────────────────────────────────────────────
export function exportarConsultasExcel(consultas: any[]) {
  if (!consultas.length) return;
  const wb = XLSX.utils.book_new();
  const datos = consultas.map(c => ({
    "Fecha": c.fecha
      ? new Date(c.fecha.includes("T") ? c.fecha : c.fecha + "T12:00:00").toLocaleDateString("es-AR")
      : "",
    "Paciente":        c.paciente_apellido && c.paciente_nombre
      ? `${c.paciente_apellido}, ${c.paciente_nombre}`
      : `#${c.paciente_id}`,
    "Tipo":            c.tipo_consulta === "primera_vez" ? "Primera vez"
                      : c.tipo_consulta === "control"    ? "Control"
                      : "Seguimiento",
    "Sede":            c.sede_nombre ?? "",
    "Motivo":          c.motivo_consulta ?? "",
    "Observaciones":   c.observaciones ?? "",
    "Indicaciones":    c.indicaciones ?? "",
    "Próximo control": c.proximo_control
      ? new Date(c.proximo_control.includes("T") ? c.proximo_control : c.proximo_control + "T12:00:00").toLocaleDateString("es-AR")
      : "",
  }));
  const { ws } = hoja(datos, "Consultas");
  XLSX.utils.book_append_sheet(wb, ws, "Consultas");
  descargar(wb, `consultas_${new Date().toISOString().slice(0,10)}`);
}

// ── Exportar turnos ───────────────────────────────────────────────
export function exportarTurnosExcel(turnos: any[], fecha: string) {
  if (!turnos.length) return;
  const wb = XLSX.utils.book_new();
  const datos = turnos.map(t => ({
    "Hora":      t.hora ? t.hora.slice(0,5) : "Espontáneo",
    "Paciente":  t.paciente_apellido && t.paciente_nombre
      ? `${t.paciente_apellido}, ${t.paciente_nombre}`
      : "Paciente espontáneo",
    "Tipo consulta": t.tipo_consulta === "primera_vez" ? "Primera vez"
                    : t.tipo_consulta === "control"    ? "Control"
                    : "Seguimiento",
    "Tipo turno": t.tipo ?? "",
    "Estado":    t.estado ?? "",
    "Sede":      t.sede_nombre ?? "",
    "Notas":     t.notas_turno ?? "",
  }));
  const { ws } = hoja(datos, "Turnos");
  XLSX.utils.book_append_sheet(wb, ws, "Turnos");
  descargar(wb, `turnos_${fecha}`);
}

// ── Exportar plan alimenticio (Excel) ────────────────────────────
export function exportarPlanExcel(plan: any) {
  if (!plan) return;
  const wb = XLSX.utils.book_new();

  // Hoja 1 — Resumen del plan
  const resumen = [{
    "Paciente":        `${plan.paciente_apellido ?? ""}, ${plan.paciente_nombre ?? ""}`.trim(),
    "Nombre del plan": plan.nombre ?? "",
    "Estado":          plan.estado ?? "",
    "Fecha inicio":    plan.fecha_inicio
      ? new Date(String(plan.fecha_inicio).slice(0,10) + "T12:00:00").toLocaleDateString("es-AR")
      : "",
    "Fecha fin":       plan.fecha_fin
      ? new Date(String(plan.fecha_fin).slice(0,10) + "T12:00:00").toLocaleDateString("es-AR")
      : "",
    "Objetivo kcal":   plan.calorias_objetivo_kcal ?? "",
    "Objetivo prot.":  plan.proteinas_objetivo_g ?? "",
    "Objetivo HC":     plan.carbohidratos_objetivo_g ?? "",
    "Objetivo grasas": plan.grasas_objetivo_g ?? "",
    "Observaciones":   plan.observaciones ?? "",
  }];
  const wsResumen = XLSX.utils.json_to_sheet(resumen);
  wsResumen["!cols"] = Object.keys(resumen[0]).map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  // Hoja 2 — Grilla semanal
  const DIAS     = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const MOMENTOS = ["desayuno","almuerzo","merienda","cena","colacion_am","colacion_pm"];
  const LABELS: Record<string, string> = {
    desayuno:"Desayuno", almuerzo:"Almuerzo", merienda:"Merienda",
    cena:"Cena", colacion_am:"Colación AM", colacion_pm:"Colación PM"
  };

  const filasGrilla: Record<string, string>[] = [];
  DIAS.forEach((dia, diaIdx) => {
    MOMENTOS.forEach(momento => {
      const comidas = (plan.comidas ?? []).filter(
        (c: any) => c.dia === diaIdx + 1 && c.momento === momento
      );
      if (!comidas.length) {
        filasGrilla.push({
          "Día": dia, "Momento": LABELS[momento],
          "Descripción": "—", "Kcal": "", "Proteínas (g)": "",
          "Carbohidratos (g)": "", "Grasas (g)": "", "Notas": ""
        });
      } else {
        comidas.forEach((c: any) => {
          filasGrilla.push({
            "Día":               dia,
            "Momento":           LABELS[momento],
            "Descripción":       c.descripcion ?? "",
            "Kcal":              c.calorias_kcal != null ? String(c.calorias_kcal) : "",
            "Proteínas (g)":     c.proteinas_g != null   ? String(c.proteinas_g)   : "",
            "Carbohidratos (g)": c.carbohidratos_g != null ? String(c.carbohidratos_g) : "",
            "Grasas (g)":        c.grasas_g != null      ? String(c.grasas_g)      : "",
            "Notas":             c.notas ?? "",
          });
        });
      }
    });
  });

  const wsGrilla = XLSX.utils.json_to_sheet(filasGrilla);
  wsGrilla["!cols"] = [
    { wch: 12 }, { wch: 14 }, { wch: 40 },
    { wch: 8 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsGrilla, "Plan semanal");

  // Hoja 3 — Totales por día
  const totalesDia: Record<string, any>[] = DIAS.map((dia, diaIdx) => {
    const comidas = (plan.comidas ?? []).filter((c: any) => c.dia === diaIdx + 1);
    return {
      "Día":               dia,
      "Total kcal":        comidas.reduce((s: number, c: any) => s + (Number(c.calorias_kcal) || 0), 0),
      "Total proteínas":   comidas.reduce((s: number, c: any) => s + (Number(c.proteinas_g)    || 0), 0),
      "Total carbohidr.":  comidas.reduce((s: number, c: any) => s + (Number(c.carbohidratos_g)|| 0), 0),
      "Total grasas":      comidas.reduce((s: number, c: any) => s + (Number(c.grasas_g)       || 0), 0),
    };
  });
  const wsTotales = XLSX.utils.json_to_sheet(totalesDia);
  wsTotales["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsTotales, "Totales por día");

  const pacNombre = `${plan.paciente_apellido ?? ""}_${plan.paciente_nombre ?? ""}`.replace(/\s/g,"_");
  descargar(wb, `plan_${pacNombre}_${new Date().toISOString().slice(0,10)}`);
}