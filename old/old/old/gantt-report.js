// gantt-report.js - Avance / Carta Gantt (Curva S)
// Sección trasladada desde fault-report.html/js para que funcione como
// formulario independiente accesible desde la página principal.

// ========== FUNCIONES PARA SUBIR PDF (idénticas a fault-report.js) ==========
async function uploadPdfDirect(pdfBlob, reportNumber) {
  console.log("⬆️ Subiendo PDF directamente a Uploadcare...");

  try {
    const formData = new FormData();
    formData.append('UPLOADCARE_PUB_KEY', 'dd2580a9c669d60b5d49');
    formData.append('UPLOADCARE_STORE', '1');
    formData.append('file', pdfBlob, `Carta_Gantt_${reportNumber}.pdf`);

    const response = await fetch('https://upload.uploadcare.com/base/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error de Uploadcare:", errorText);
      throw new Error(`Error ${response.status} al subir PDF`);
    }

    const data = await response.json();
    console.log("✅ Respuesta de Uploadcare:", data);

    if (!data.file) {
      throw new Error("Uploadcare no devolvió file ID");
    }

    return `https://ucarecdn.com/${data.file}/`;

  } catch (error) {
    console.error("❌ Error en uploadPdfDirect:", error);
    throw error;
  }
}

async function uploadPdfSimple(pdfBlob, reportNumber) {
  console.log("🔄 Usando método alternativo con proxy...");

  try {
    const formData = new FormData();
    formData.append('UPLOADCARE_PUB_KEY', 'dd2580a9c669d60b5d49');
    formData.append('UPLOADCARE_STORE', '1');
    formData.append('file', pdfBlob, `Carta_Gantt_${reportNumber}.pdf`);

    const proxyUrl = 'https://corsproxy.io/?';
    const targetUrl = 'https://upload.uploadcare.com/base/';

    const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ PDF subido (proxy):", data);
    return `https://ucarecdn.com/${data.file}/`;

  } catch (error) {
    console.error("❌ Método alternativo falló:", error);
    throw new Error("No se pudo subir el PDF");
  }
}

async function uploadPdfUsingBackend(pdfBlob, reportNumber) {
  console.log("🚀 Enviando PDF a TU backend (komatsu-api) como base64...");

  try {
    const reader = new FileReader();

    const base64Promise = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

    reader.readAsDataURL(pdfBlob);
    const pdfBase64 = await base64Promise;

    console.log("📊 Base64 generado, tamaño:", pdfBase64.length, "caracteres");

    const response = await fetch('https://komatsu-api.vercel.app/api/uploadPdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        reportNumber: reportNumber
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error del backend:", errorText);
      throw new Error(`Error ${response.status} del servidor`);
    }

    const data = await response.json();
    console.log("✅ Respuesta del backend:", data);

    if (!data.success) {
      throw new Error(data.error || "Error del backend");
    }

    return data.pdfUrl;

  } catch (error) {
    console.error("❌ Error en uploadPdfUsingBackend:", error);
    throw error;
  }
}

// ========== MENSAJES ==========
function showMessage(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.className = isError ? "error" : "success";
  el.classList.remove("hidden");
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => el.classList.add("hidden"), 7000);
}

// ========== AUTO-EXPANSIÓN DE CUADROS DE TEXTO ==========
function autoExpandTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

function initializeAutoExpandTextareas() {
  document.querySelectorAll("textarea").forEach((textarea) => {
    autoExpandTextarea(textarea);
    textarea.addEventListener("input", () => autoExpandTextarea(textarea));
  });
}

// ========== SUSTITUCIÓN TEMPORAL DE TEXTAREAS POR DIV (SOLO PARA CAPTURA) ==========
// (Ver explicación detallada en fault-report.js: html2canvas no ajusta el
// texto al ancho real del cuadro ni respeta la altura ya redimensionada de
// un <textarea>, así que se reemplaza por un <div> con el texto ya cortado
// a mano según el ancho real, y se restaura apenas termina la captura.)
function wrapTextToWidth(text, maxWidthPx, font) {
  const canvas = wrapTextToWidth._canvas || (wrapTextToWidth._canvas = document.createElement("canvas"));
  const ctx = canvas.getContext("2d");
  ctx.font = font;

  function breakLongToken(token, lines) {
    let chunk = "";
    for (const ch of token) {
      const testChunk = chunk + ch;
      if (chunk && ctx.measureText(testChunk).width > maxWidthPx) {
        lines.push(chunk);
        chunk = ch;
      } else {
        chunk = testChunk;
      }
    }
    return chunk;
  }

  const paragraphs = text.split("\n");
  const wrappedParagraphs = paragraphs.map((paragraph) => {
    if (paragraph === "") return "";
    const words = paragraph.split(" ");
    const lines = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine ? currentLine + " " + word : word;
      if (ctx.measureText(testLine).width <= maxWidthPx) {
        currentLine = testLine;
        return;
      }
      if (currentLine) lines.push(currentLine);
      if (ctx.measureText(word).width > maxWidthPx) {
        currentLine = breakLongToken(word, lines);
      } else {
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines.join("\n");
  });

  return wrappedParagraphs.join("\n");
}

function replaceTextareasWithDivsForCapture(container) {
  const replacements = [];
  container.querySelectorAll("textarea").forEach((textarea) => {
    const cs = getComputedStyle(textarea);
    const paddingLeft = parseFloat(cs.paddingLeft) || 0;
    const paddingRight = parseFloat(cs.paddingRight) || 0;
    const borderLeft = parseFloat(cs.borderLeftWidth) || 0;
    const borderRight = parseFloat(cs.borderRightWidth) || 0;
    const totalWidth = parseFloat(cs.width) || 0;
    // Margen de seguridad del 25%: html2canvas termina renderizando el
    // contenedor capturado más angosto que lo medido en la página en vivo.
    const contentWidthPx = Math.max(
      (totalWidth - paddingLeft - paddingRight - borderLeft - borderRight - 2) * 0.75,
      20
    );
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;

    const div = document.createElement("div");
    div.textContent = wrapTextToWidth(textarea.value, contentWidthPx, font);
    div.className = textarea.className;
    div.style.cssText = `
      width: ${cs.width};
      min-height: ${cs.minHeight};
      padding: ${cs.padding};
      border: ${cs.border};
      border-radius: ${cs.borderRadius};
      font-family: ${cs.fontFamily};
      font-size: ${cs.fontSize};
      line-height: ${cs.lineHeight};
      color: ${cs.color};
      background-color: ${cs.backgroundColor};
      box-sizing: ${cs.boxSizing};
      white-space: pre-wrap;
      overflow-wrap: break-word;
      word-break: break-word;
    `;
    textarea.insertAdjacentElement("afterend", div);
    textarea.style.display = "none";
    replacements.push({ textarea, div });
  });
  return replacements;
}

function restoreTextareasAfterCapture(replacements) {
  replacements.forEach(({ textarea, div }) => {
    textarea.style.display = "";
    div.remove();
  });
}

// ========== INICIALIZACIÓN ==========
document.addEventListener("DOMContentLoaded", function () {
  console.log("📄 Cargando formulario de Avance / Carta Gantt (Curva S)...");

  const fechaRef = document.getElementById("ganttFechaRef");
  if (fechaRef) fechaRef.value = new Date().toISOString().split("T")[0];

  initializeGanttSection();
  initializeAutoExpandTextareas();

  const form = document.getElementById("ganttReportForm");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      await submitGanttReportForm();
    });
  }
});

// ========== AVANCE / CARTA GANTT (CURVA S) ==========
// (Lógica idéntica a la que existía en fault-report.js; el contenido y los
// datos de ejemplo técnicos se mantienen sin cambios.)

function initializeGanttSection() {
  const curveData = [
    { fecha: "26-05-26 13:00", plan: 0, real: 0 },
    { fecha: "27-05-26 07:00", plan: 14, real: 14 },
    { fecha: "27-05-26 19:00", plan: 44, real: 44 },
    { fecha: "28-05-26 07:00", plan: 70, real: "" },
    { fecha: "28-05-26 19:00", plan: 91, real: "" },
    { fecha: "29-05-26 07:00", plan: 100, real: "" },
  ];
  curveData.forEach((pt) => addGanttCurvePoint(pt));

  addGanttTaskRow({
    equipo: "PA215",
    unidad: "MP 1500 HRS + BKL",
    diaTurno: "27/05 TURNO DÍA",
    plan: 44,
    real: 44,
    observacion:
      "Equipo ingresa a MP con 39,6 horas de desviación respecto a lo planificado. Esta desviación se debe a que equipo 219 en MP venía desfasado de plan semana 21, por lo que se entregó el 25/05 turno B",
  });

  addGanttExecRow({
    diaTurno: "27/05 TURNO DÍA",
    tareas:
      "Se realiza bkl cambio filtro de retorno y drenaje sistema hidráulico\nCambio aceite motor diesel avance 80% continuar con relleno tk reserva de aceites motores.\nSe rellena con aceite carcasa de bombas principales x08 100%\nSe avanza en puntos de pauta MP",
    observaciones:
      "Desde 12:00 hasta 19:00 se destinan 2 MP para apoyo traslado pala 219 desde fase 35 hacia fase 362\nDesde 13:30 hasta 16:00 se destinan 2 MP para traslado de recursos a patio MP pala 215, grúa horquilla y alza hombre en cama baja",
  });

  const tituloInput = document.getElementById("ganttTituloCurva");
  if (tituloInput) tituloInput.addEventListener("input", drawGanttCurveChart);

  drawGanttCurveChart();
}

// --- Tabla de puntos de la curva S ---
function addGanttCurvePoint(data = {}) {
  const tbody = document.querySelector("#ganttCurveTable tbody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="text" name="ganttFecha" class="table-input" placeholder="dd-mm-aa hh:mm" value="${data.fecha || ""}"></td>
    <td><input type="number" name="ganttPlan" class="table-input" style="text-align:center;" min="0" max="100" value="${data.plan ?? ""}"></td>
    <td><input type="number" name="ganttReal" class="table-input" style="text-align:center;" min="0" max="100" value="${data.real ?? ""}"></td>
    <td><button type="button" class="btn-remove" onclick="removeGanttCurvePoint(this)">×</button></td>
  `;
  tbody.appendChild(row);

  row.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", drawGanttCurveChart);
  });
}

function removeGanttCurvePoint(btn) {
  btn.closest("tr").remove();
  drawGanttCurveChart();
}

function collectGanttCurvePoints() {
  const rows = document.querySelectorAll("#ganttCurveTable tbody tr");
  const points = [];
  rows.forEach((row) => {
    const fecha = row.querySelector('[name="ganttFecha"]').value.trim();
    const planStr = row.querySelector('[name="ganttPlan"]').value.trim();
    const realStr = row.querySelector('[name="ganttReal"]').value.trim();
    points.push({
      fecha,
      plan: planStr === "" ? null : parseFloat(planStr),
      real: realStr === "" ? null : parseFloat(realStr),
    });
  });
  return points;
}

// --- Dibujo del gráfico de curva S (canvas nativo, sin dependencias externas) ---
function drawGanttCurveChart() {
  const canvas = document.getElementById("ganttCurveChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  const points = collectGanttCurvePoints();
  const tituloEl = document.getElementById("ganttTituloCurva");
  const titulo = tituloEl ? tituloEl.value : "";

  ctx.fillStyle = "#333333";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(titulo, w / 2, 22);

  // Leyenda
  ctx.font = "11px Arial";
  ctx.textAlign = "left";
  ctx.fillStyle = "#0033A0";
  ctx.fillRect(w - 160, 32, 12, 3);
  ctx.fillStyle = "#333333";
  ctx.fillText("% Planificado", w - 144, 38);
  ctx.fillStyle = "#c0392b";
  ctx.fillRect(w - 160, 48, 12, 3);
  ctx.fillStyle = "#333333";
  ctx.fillText("% Real", w - 144, 54);

  if (points.length === 0) return;

  const marginLeft = 55;
  const marginRight = 30;
  const marginTop = 65;
  const marginBottom = 55;
  const plotW = w - marginLeft - marginRight;
  const plotH = h - marginTop - marginBottom;

  // Ejes
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(marginLeft, marginTop);
  ctx.lineTo(marginLeft, marginTop + plotH);
  ctx.lineTo(marginLeft + plotW, marginTop + plotH);
  ctx.stroke();

  // Líneas guía y etiquetas del eje Y (0-100%)
  ctx.font = "10px Arial";
  ctx.fillStyle = "#666666";
  ctx.textAlign = "right";
  for (let p = 0; p <= 100; p += 10) {
    const y = marginTop + plotH - (p / 100) * plotH;
    ctx.strokeStyle = "#f0f0f0";
    ctx.beginPath();
    ctx.moveTo(marginLeft, y);
    ctx.lineTo(marginLeft + plotW, y);
    ctx.stroke();
    ctx.fillText(p + "%", marginLeft - 8, y + 3);
  }

  const n = points.length;
  const stepX = n > 1 ? plotW / (n - 1) : 0;
  const xAt = (i) => marginLeft + stepX * i;
  const yAt = (val) => marginTop + plotH - (val / 100) * plotH;

  // Etiquetas del eje X (fechas), rotadas para que no se encimen
  ctx.font = "9px Arial";
  ctx.fillStyle = "#666666";
  points.forEach((pt, i) => {
    const x = xAt(i);
    ctx.save();
    ctx.translate(x, marginTop + plotH + 14);
    ctx.rotate(-Math.PI / 6);
    ctx.textAlign = "right";
    ctx.fillText(pt.fecha, 0, 0);
    ctx.restore();
  });

  function drawSeries(key, color) {
    const seriesPoints = points
      .map((pt, i) => ({ i, val: pt[key] }))
      .filter((p) => p.val !== null && !isNaN(p.val));
    if (seriesPoints.length === 0) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    seriesPoints.forEach((p, idx) => {
      const x = xAt(p.i);
      const y = yAt(p.val);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    seriesPoints.forEach((p) => {
      const x = xAt(p.i);
      const y = yAt(p.val);
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(p.val + "%", x, y - 8);
    });
  }

  drawSeries("plan", "#0033A0");
  drawSeries("real", "#c0392b");
}

// --- Tabla de control de tareas ---
function addGanttTaskRow(data = {}) {
  const tbody = document.querySelector("#ganttTasksTable tbody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="text" name="ganttEquipo" class="table-input" value="${data.equipo || ""}"></td>
    <td><input type="text" name="ganttUnidad" class="table-input" value="${data.unidad || ""}"></td>
    <td><input type="text" name="ganttDiaTurno" class="table-input" value="${data.diaTurno || ""}"></td>
    <td><input type="number" name="ganttPlanTarea" class="table-input" style="text-align:center;" min="0" max="100" value="${data.plan ?? ""}"></td>
    <td><input type="number" name="ganttRealTarea" class="table-input" style="text-align:center;" min="0" max="100" value="${data.real ?? ""}"></td>
    <td style="text-align:center;"><span name="ganttDesviacion">-</span></td>
    <td><textarea name="ganttObservacion" class="table-input" rows="3">${data.observacion || ""}</textarea></td>
    <td><button type="button" class="btn-remove" onclick="removeGanttRow(this)">×</button></td>
  `;
  tbody.appendChild(row);

  const planInput = row.querySelector('[name="ganttPlanTarea"]');
  const realInput = row.querySelector('[name="ganttRealTarea"]');
  const recalc = () => calcGanttDesviacion(row);
  planInput.addEventListener("input", recalc);
  realInput.addEventListener("input", recalc);
  recalc();

  // Auto-expandir el textarea de observación de esta fila
  const obsTextarea = row.querySelector('[name="ganttObservacion"]');
  autoExpandTextarea(obsTextarea);
  obsTextarea.addEventListener("input", () => autoExpandTextarea(obsTextarea));
}

function calcGanttDesviacion(row) {
  const plan = parseFloat(row.querySelector('[name="ganttPlanTarea"]').value);
  const real = parseFloat(row.querySelector('[name="ganttRealTarea"]').value);
  const span = row.querySelector('[name="ganttDesviacion"]');
  if (isNaN(plan) || isNaN(real)) {
    span.textContent = "-";
    return;
  }
  const desv = real - plan;
  const signo = desv > 0 ? "+" : "";
  const color = desv < 0 ? "#dc3545" : "#28a745";
  span.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:4px;"></span>${signo}${desv}%`;
}

function removeGanttRow(btn) {
  btn.closest("tr").remove();
}

// --- Tabla de tareas ejecutadas / observaciones ---
function addGanttExecRow(data = {}) {
  const tbody = document.querySelector("#ganttExecTable tbody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="text" name="ganttExecDiaTurno" class="table-input" value="${data.diaTurno || ""}"></td>
    <td><textarea name="ganttExecTareas" class="table-input" rows="4">${data.tareas || ""}</textarea></td>
    <td><textarea name="ganttExecObs" class="table-input" rows="4">${data.observaciones || ""}</textarea></td>
    <td><button type="button" class="btn-remove" onclick="removeGanttRow(this)">×</button></td>
  `;
  tbody.appendChild(row);

  // Auto-expandir los textarea de esta fila
  row.querySelectorAll("textarea").forEach((textarea) => {
    autoExpandTextarea(textarea);
    textarea.addEventListener("input", () => autoExpandTextarea(textarea));
  });
}

// ========== ENVÍO DEL FORMULARIO (GENERAR PDF + EMAIL) ==========
async function submitGanttReportForm() {
  console.log("=== INICIANDO ENVÍO DE CARTA GANTT ===");
  showMessage("message", "Generando PDF...");

  try {
    const equipoRef = document.getElementById("ganttEquipoRef").value.trim();
    const tituloCurva = document.getElementById("ganttTituloCurva").value.trim();

    if (!equipoRef) {
      showMessage("message", "Por favor complete el campo: Equipo", true);
      document.getElementById("ganttEquipoRef").focus();
      return;
    }

    // Asegurar que todos los cuadros de texto estén expandidos a su
    // contenido completo justo antes de capturar el PDF.
    document.querySelectorAll("textarea").forEach(autoExpandTextarea);

    const elemento = document.querySelector(".form-container");

    // 🔧 EVITAR TEXTO CORTADO: reemplazamos cada textarea por un div con el
    // texto ya cortado a mano según el ancho real (ver fault-report.js).
    const textareaReplacements = replaceTextareasWithDivsForCapture(elemento);

    // 🔧 EVITAR PÁGINA EN BLANCO: esta página comparte "css/style.css", que
    // define ".form-section { page-break-inside: avoid; }" de forma
    // permanente. La sección con las tablas y el gráfico es demasiado larga
    // para cualquier página, así que si se le prohíbe dividirse, se empuja
    // entera a la página siguiente dejando la anterior casi en blanco.
    // Permitimos que esta sección específica sí pueda dividirse.
    const seccionesGrandes = elemento.querySelectorAll('.form-section');
    seccionesGrandes.forEach((sec) => {
      sec.style.pageBreakInside = 'auto';
      sec.style.breakInside = 'auto';
    });

    const scrollXAntes = window.scrollX;
    const scrollYAntes = window.scrollY;
    window.scrollTo(0, 0);

    const referencia = `${equipoRef}_${Date.now()}`;

    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `Carta_Gantt_${referencia}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
        compress: true,
      },
      pagebreak: {
        mode: ["css", "legacy"]
      },
    };

    let pdfBlob;
    try {
      pdfBlob = await html2pdf().from(elemento).set(opt).outputPdf("blob");
    } finally {
      restoreTextareasAfterCapture(textareaReplacements);
      window.scrollTo(scrollXAntes, scrollYAntes);
      seccionesGrandes.forEach((sec) => {
        sec.style.pageBreakInside = '';
        sec.style.breakInside = '';
      });
    }
    console.log("✅ PDF generado, tamaño:", pdfBlob.size, "bytes");

    showMessage("message", "Subiendo PDF...");

    let pdfUrl;
    try {
      pdfUrl = await uploadPdfUsingBackend(pdfBlob, referencia);
    } catch (backendError) {
      console.warn("Backend falló, intentando método directo...", backendError);
      showMessage("message", "Intentando método alternativo...");
      try {
        pdfUrl = await uploadPdfDirect(pdfBlob, referencia);
      } catch (directError) {
        console.warn("Método directo falló, intentando con proxy...", directError);
        showMessage("message", "Último intento con proxy...");
        try {
          pdfUrl = await uploadPdfSimple(pdfBlob, referencia);
        } catch (proxyError) {
          console.error("💥 TODOS los métodos fallaron:", proxyError);
          throw new Error("No se pudo subir el PDF. Verifique que tu backend (/api/uploadPdf) esté funcionando y accesible desde https://komatsu-api.vercel.app/api/uploadPdf");
        }
      }
    }

    console.log("📄 PDF disponible en:", pdfUrl);

    const today = new Date();
    const fechaFormateada = today.toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;color:#333;">
        <h2 style="color:#0033A0;">Avance / Carta Gantt (Curva S) – Komatsu</h2>
        <p>Hola equipo,</p>
        <p>Se ha generado automáticamente un nuevo reporte de <b>Avance / Carta Gantt (Curva S)</b> para revisión.</p>
        <p><b>Fecha de generación:</b> ${fechaFormateada}</p>

        <div style="background-color:#f8f9fa;border:1px solid #e9ecef;border-radius:5px;padding:15px;margin:15px 0;">
          <h3 style="color:#0033A0;margin-top:0;">Detalles del Reporte</h3>
          <p><strong>Título del Gráfico:</strong> ${tituloCurva}</p>
          <p><strong>Equipo:</strong> ${equipoRef}</p>
        </div>

        <p>Pueden visualizar o descargar el PDF desde el siguiente enlace:</p>
        <p style="text-align:center;margin:20px 0;">
          <a href="${pdfUrl}"
             style="display:inline-block;background-color:#0033A0;color:white;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;"
             target="_blank">
             Ver Carta Gantt Completa
          </a>
        </p>

        <hr style="margin:20px 0;border:0;border-top:1px solid #ccc;">
        <p style="font-size:12px;color:#777;">
          Este correo fue enviado automáticamente por el sistema de reportes Komatsu.<br>
          No responda a este mensaje.
        </p>
      </div>
    `;

    showMessage("message", "Enviando email...");

    const res = await fetch("https://komatsu-api.vercel.app/api/sendEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: `Avance / Carta Gantt (Curva S) | Equipo ${equipoRef} | ${fechaFormateada}`,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
    }

    if (data.success) {
      showMessage("message", "✅ Carta Gantt enviada correctamente!");
      console.log("✅ Email enviado exitosamente");
    } else {
      showMessage("message", data.error || "Error al enviar el correo.", true);
    }
  } catch (err) {
    console.error("❌ Error general:", err);
    showMessage("message", `❌ Error: ${err.message}`, true);
  }
}
