import jsPDF from "jspdf";
import { PlanDetalle, PlanComidaDetalle } from "@/services/plan.service";

const DIAS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

const MOMENTOS: { key: string; label: string }[] = [
  { key: "desayuno",    label: "Desayuno" },
  { key: "almuerzo",    label: "Almuerzo" },
  { key: "merienda",   label: "Merienda" },
  { key: "cena",       label: "Cena" },
  { key: "colacion_am", label: "Colacion AM" },
  { key: "colacion_pm", label: "Colacion PM" },
];

// Colores del sistema
const COLOR_PRIMARY   = [255, 36, 132]  as [number, number, number];
const COLOR_DARK      = [45, 19, 32]    as [number, number, number];
const COLOR_TEXT      = [26, 10, 16]    as [number, number, number];
const COLOR_MUTED     = [148, 28, 76]   as [number, number, number];
const COLOR_BG_LIGHT  = [253, 242, 246] as [number, number, number];
const COLOR_BORDER    = [245, 220, 231] as [number, number, number];
const COLOR_WHITE     = [255, 255, 255] as [number, number, number];

function getComidasDiaMomento(comidas: PlanComidaDetalle[], dia: number, momento: string) {
  return comidas.filter(c => c.dia === dia && c.momento === momento);
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

export function generarPDFPlan(plan: PlanDetalle): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const contentW = pageW - margin * 2;

  // ── HEADER ──────────────────────────────────────────────────────
  // Fondo oscuro header
  doc.setFillColor(...COLOR_DARK);
  doc.rect(0, 0, pageW, 38, "F");

  // Círculo logo
  doc.setFillColor(...COLOR_PRIMARY);
  doc.circle(margin + 8, 19, 7, "F");

  // "N" en el círculo
  doc.setTextColor(...COLOR_WHITE);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("N", margin + 8, 21, { align: "center" });

  // Título app
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_WHITE);
  doc.text("NutriApp", margin + 18, 17);

  // Subtítulo
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 147, 197);
  doc.text("Plan alimenticio personalizado", margin + 18, 23);

  // Nombre paciente (derecha)
  const nombrePaciente = `${plan.paciente_apellido ?? ""}, ${plan.paciente_nombre ?? ""}`.trim();
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_WHITE);
  doc.text(nombrePaciente, pageW - margin, 15, { align: "right" });

  // Fechas
  const fechaTexto = plan.fecha_inicio && plan.fecha_fin
    ? `${formatFecha(plan.fecha_inicio)} al ${formatFecha(plan.fecha_fin)}`
    : plan.fecha_inicio
        ? `Desde ${formatFecha(plan.fecha_inicio)}`
        : "";


  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 147, 197);
  if (fechaTexto) doc.text(fechaTexto, pageW - margin, 21, { align: "right" });

  // Nombre del plan
  if (plan.nombre) {
    doc.setFontSize(8);
    doc.setTextColor(255, 200, 220);
    doc.text(plan.nombre, pageW - margin, 27, { align: "right" });
  }

  // Estado badge
  const estadoColor = plan.estado === "activo" ? [22, 163, 74] : [156, 163, 175];
  doc.setFillColor(...estadoColor as [number, number, number]);
  doc.roundedRect(pageW - margin - 22, 29, 22, 6, 2, 2, "F");
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_WHITE);
  doc.text(plan.estado.toUpperCase(), pageW - margin - 11, 33, { align: "center" });

  let y = 44;

  // ── OBJETIVOS NUTRICIONALES ──────────────────────────────────────
  if (plan.calorias_objetivo_kcal || plan.proteinas_objetivo_g ||
      plan.carbohidratos_objetivo_g || plan.grasas_objetivo_g) {

    doc.setFillColor(...COLOR_BG_LIGHT);
    doc.roundedRect(margin, y, contentW, 18, 3, 3, "F");
    doc.setDrawColor(...COLOR_BORDER);
    doc.roundedRect(margin, y, contentW, 18, 3, 3, "S");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR_MUTED);
    doc.text("OBJETIVOS NUTRICIONALES DIARIOS", margin + 4, y + 5);

    const macros = [
      { label: "Calorias",      val: plan.calorias_objetivo_kcal,      unit: "kcal" },
      { label: "Proteinas",     val: plan.proteinas_objetivo_g,         unit: "g" },
      { label: "Carbohidratos", val: plan.carbohidratos_objetivo_g,     unit: "g" },
      { label: "Grasas",        val: plan.grasas_objetivo_g,            unit: "g" },
    ].filter(m => m.val);

    const colW = contentW / Math.max(macros.length, 1);
    macros.forEach((m, i) => {
      const cx = margin + i * colW + colW / 2;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLOR_PRIMARY);
      doc.text(`${m.val}${m.unit}`, cx, y + 12, { align: "center" });
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLOR_MUTED);
      doc.text(m.label, cx, y + 16, { align: "center" });
    });

    y += 23;
  }

  // ── GRILLA SEMANAL ───────────────────────────────────────────────
  DIAS.forEach((dia, diaIdx) => {
    const numDia = diaIdx + 1;

    // Verificar si hay comidas este día
    const comidasDelDia = plan.comidas.filter(c => c.dia === numDia);
    if (comidasDelDia.length === 0) return;

    // Calcular altura necesaria para este día
    let alturaEstimada = 10; // cabecera día
    MOMENTOS.forEach(({ key }) => {
      const comidas = getComidasDiaMomento(plan.comidas, numDia, key);
      if (comidas.length > 0) {
        comidas.forEach(c => {
          const lines = wrapText(doc, c.descripcion, contentW - 50);
          alturaEstimada += Math.max(lines.length * 4, 6) + 3;
        });
        alturaEstimada += 2;
      }
    });
    alturaEstimada += 4;

    // Nueva página si no entra
    if (y + alturaEstimada > pageH - 20) {
      doc.addPage();
      y = 14;
    }

    // Cabecera del día
    doc.setFillColor(...COLOR_DARK);
    doc.roundedRect(margin, y, contentW, 8, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR_WHITE);
    doc.text(dia.toUpperCase(), margin + 4, y + 5.5);

    // Totales del día
    const totDia = comidasDelDia.reduce(
      (acc, c) => ({
        kcal: acc.kcal + (Number(c.calorias_kcal) || 0),
        prot: acc.prot + (Number(c.proteinas_g) || 0),
        hc:   acc.hc   + (Number(c.carbohidratos_g) || 0),
        gr:   acc.gr   + (Number(c.grasas_g) || 0),
      }),
      { kcal: 0, prot: 0, hc: 0, gr: 0 }
    );

    if (totDia.kcal > 0) {
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(255, 147, 197);
      const totText = `${Math.round(totDia.kcal)} kcal  |  P: ${Math.round(totDia.prot)}g  |  HC: ${Math.round(totDia.hc)}g  |  G: ${Math.round(totDia.gr)}g`;
      doc.text(totText, pageW - margin - 2, y + 5.5, { align: "right" });
    }

    y += 9;

    // Fondo del día
    const startYDia = y;

    // Momentos
    MOMENTOS.forEach(({ key, label }) => {
      const comidas = getComidasDiaMomento(plan.comidas, numDia, key);
      if (comidas.length === 0) return;

      comidas.forEach((c, ci) => {
        const lines = wrapText(doc, c.descripcion, contentW - 52);
        const rowH  = Math.max(lines.length * 4 + 2, 8);

        // Fondo alternado
        if (ci === 0) {
          doc.setFillColor(...COLOR_BG_LIGHT);
          doc.rect(margin, y, contentW, rowH + 2, "F");
        }

        // Label momento (solo en primera comida)
        if (ci === 0) {
          doc.setFontSize(6.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...COLOR_MUTED);
          doc.text(label.toUpperCase(), margin + 3, y + 5);
        }

        // Descripción comida
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLOR_TEXT);
        doc.text(lines, margin + 32, y + 5);

        // Macros de la comida (derecha)
        if (c.calorias_kcal != null) {
          doc.setFontSize(6);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...COLOR_MUTED);
          const macroText = [
            c.calorias_kcal != null ? `${c.calorias_kcal} kcal` : "",
            c.proteinas_g != null   ? `P ${c.proteinas_g}g`     : "",
            c.carbohidratos_g != null ? `HC ${c.carbohidratos_g}g` : "",
            c.grasas_g != null      ? `G ${c.grasas_g}g`        : "",
          ].filter(Boolean).join("  ");
          doc.text(macroText, pageW - margin - 2, y + 5, { align: "right" });
        }

        // Notas
        if (c.notas) {
          doc.setFontSize(6);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(200, 100, 150);
          doc.text(`* ${c.notas}`, margin + 32, y + rowH + 1);
        }

        y += rowH + (c.notas ? 4 : 2);
      });

      // Separador entre momentos
      doc.setDrawColor(...COLOR_BORDER);
      doc.line(margin + 30, y, pageW - margin, y);
      y += 1;
    });

    // Borde del día completo
    doc.setDrawColor(...COLOR_BORDER);
    doc.rect(margin, startYDia, contentW, y - startYDia, "S");

    y += 4;
  });

  // ── OBSERVACIONES ────────────────────────────────────────────────
  if (plan.observaciones) {
    if (y + 20 > pageH - 14) { doc.addPage(); y = 14; }

    doc.setFillColor(...COLOR_BG_LIGHT);
    doc.roundedRect(margin, y, contentW, 16, 2, 2, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR_MUTED);
    doc.text("OBSERVACIONES", margin + 4, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR_TEXT);
    const obsLines = wrapText(doc, plan.observaciones, contentW - 8);
    doc.text(obsLines, margin + 4, y + 10);
    y += 20;
  }

  // ── FOOTER ───────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...COLOR_BORDER);
    doc.rect(0, pageH - 10, pageW, 10, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR_MUTED);
    doc.text("NutriApp — Plan alimenticio", margin, pageH - 4);
    doc.text(`Pagina ${i} de ${totalPages}`, pageW - margin, pageH - 4, { align: "right" });
  }

  // ── DESCARGAR ────────────────────────────────────────────────────
  const nombreArchivo = `Plan_${plan.paciente_apellido ?? "paciente"}_${plan.paciente_nombre ?? ""}.pdf`
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_.-]/g, "");

  doc.save(nombreArchivo);
}

function formatFecha(fecha: string): string {
  if (!fecha) return "";
  const d = new Date(fecha.includes("T") ? fecha : fecha + "T12:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR", {
    day: "numeric", month: "long", year: "numeric"
  });
}