// fault-report.js - VERSIÓN COMPLETA Y CORREGIDA

// ========== FUNCIÓN PARA CARGAR UPLOADCARE ==========
function loadUploadcareWidget() {
  return new Promise((resolve, reject) => {
    if (window.uploadcare) {
      console.log("✅ Uploadcare ya está cargado");
      return resolve();
    }
    
    console.log("📦 Cargando Uploadcare Widget...");
    const script = document.createElement('script');
    script.src = 'https://ucarecdn.com/libs/widget/3.x/uploadcare.full.min.js';
    script.async = true;
    
    script.onload = () => {
      console.log("✅ Uploadcare Widget cargado");
      setTimeout(resolve, 100);
    };
    
    script.onerror = () => {
      console.error("❌ Error cargando Uploadcare Widget");
      reject(new Error("No se pudo cargar Uploadcare Widget"));
    };
    
    document.head.appendChild(script);
  });
}

// ========== FUNCIÓN PARA SUBIR PDF DIRECTAMENTE ==========
async function uploadPdfDirect(pdfBlob, reportNumber) {
  console.log("⬆️ Subiendo PDF directamente a Uploadcare...");
  
  try {
    // Crear FormData
    const formData = new FormData();
    formData.append('UPLOADCARE_PUB_KEY', 'dd2580a9c669d60b5d49');
    formData.append('UPLOADCARE_STORE', '1');
    formData.append('file', pdfBlob, `Informe_Falla_${reportNumber}.pdf`);
    
    // IMPORTANTE: Subir directamente sin widget
    const response = await fetch('https://upload.uploadcare.com/base/', {
      method: 'POST',
      body: formData,
      // Dejar que el navegador maneje CORS
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

// ========== FUNCIÓN PARA SUBIR PDF (método alternativo con proxy) ==========
async function uploadPdfSimple(pdfBlob, reportNumber) {
  console.log("🔄 Usando método alternativo con proxy...");
  
  try {
    const formData = new FormData();
    formData.append('UPLOADCARE_PUB_KEY', 'dd2580a9c669d60b5d49');
    formData.append('UPLOADCARE_STORE', '1');
    formData.append('file', pdfBlob, `Informe_${reportNumber}.pdf`);
    
    // Usar proxy CORS
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

// ========== NUEVA FUNCIÓN: SUBIR PDF USANDO TU BACKEND CON BASE64 ==========
async function uploadPdfUsingBackend(pdfBlob, reportNumber) {
  console.log("🚀 Enviando PDF a TU backend (komatsu-api) como base64...");
  
  try {
    // Convertir Blob a base64
    const reader = new FileReader();
    
    const base64Promise = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
    
    reader.readAsDataURL(pdfBlob);
    const pdfBase64 = await base64Promise;
    
    console.log("📊 Base64 generado, tamaño:", pdfBase64.length, "caracteres");
    
    // Enviar a TU endpoint de backend como JSON con base64
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

// ========== INICIALIZACIÓN DEL FORMULARIO ==========
document.addEventListener("DOMContentLoaded", function () {
  console.log("📄 Cargando formulario de informe de falla...");
  
  // Establecer fechas por defecto
  const today = new Date().toISOString().split("T")[0];
  const dateFields = ["failureDate", "visitDate", "repairDate", "deliveryDate"];
  dateFields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });

  // Generar número de reporte automático
  const reportNumber = document.getElementById("reportNumber");
  if (reportNumber && !reportNumber.value) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    reportNumber.value = `INF-${year}${month}${day}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;
  }

  // Inicializar componentes
  initializePartsTable();
  calculateTotals();
  initializePhotoUpload();
  initializeGanttSection();

  // Configurar evento de envío del formulario
  const form = document.getElementById("faultReportForm");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      await submitFaultReportForm();
    });
  }

  // Configurar eventos para cálculo de totales
  document.getElementById("partsTable")?.addEventListener("input", function (e) {
    if (e.target.name === "cantidad" || e.target.name === "precioUn") {
      calculateRowTotal(e.target.closest("tr"));
      calculateTotals();
    }
  });
});

// ========== FUNCIONES DE LA TABLA DE PARTES ==========
function initializePartsTable() {
  console.log("📊 Inicializando tabla de partes...");
  for (let i = 0; i < 5; i++) addPartRow();
}

function addPartRow() {
  const tbody = document.querySelector("#partsTable tbody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="text" name="partNumber" style="width: 100%; border: none;"></td>
    <td><input type="text" name="description" style="width: 100%; border: none;"></td>
    <td><input type="text" name="numberChange" style="width: 100%; border: none;"></td>
    <td><input type="number" name="cantidad" value="0" min="0" step="1" style="width: 100%; border: none; text-align: center;"></td>
    <td><input type="text" name="disponibilidad" style="width: 100%; border: none;"></td>
    <td><input type="text" name="lista" style="width: 100%; border: none;"></td>
    <td><input type="number" name="precioUn" value="0" min="0" step="0.01" style="width: 100%; border: none; text-align: right;"></td>
    <td><span name="total">$ 0</span></td>
  `;
  tbody.appendChild(row);

  row.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      calculateRowTotal(row);
      calculateTotals();
    });
  });
}

function calculateRowTotal(row) {
  let cantidad = parseFloat(row.querySelector('[name="cantidad"]').value) || 0;
  let precioUn = parseFloat(row.querySelector('[name="precioUn"]').value) || 0;
  let total = cantidad * precioUn;
  row.querySelector('[name="total"]').textContent = `$ ${new Intl.NumberFormat(
    "es-CL"
  ).format(total)}`;
}

function calculateTotals() {
  const rows = document.querySelectorAll("#partsTable tbody tr");
  let totalAmount = 0;

  rows.forEach((row) => {
    let totalText = row
      .querySelector('[name="total"]')
      .textContent.replace(/\$|\./g, "")
      .trim();
    let totalValue = parseFloat(totalText) || 0;
    totalAmount += totalValue;
  });

  document.getElementById("totalAmount").textContent = `$ ${new Intl.NumberFormat(
    "es-CL"
  ).format(totalAmount)}`;
}

// ========== AVANCE / CARTA GANTT (CURVA S) ==========

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
}

// ========== FUNCIONES PARA FOTOS ==========
let currentPlaceholder = null;

function addPhoto(placeholderElement) {
  currentPlaceholder = placeholderElement;
  document.getElementById("photoUpload").click();
}

function initializePhotoUpload() {
  const input = document.getElementById("photoUpload");

  input.addEventListener("change", function () {
    if (!currentPlaceholder || !this.files[0]) return;

    const file = this.files[0];

    if (!file.type.startsWith("image/")) {
      alert("Por favor, seleccione solo archivos de imagen.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es demasiado grande. Máximo 5MB.");
      return;
    }

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";

    const removeBtn = document.createElement("button");
    removeBtn.innerHTML = "×";
    removeBtn.style.position = "absolute";
    removeBtn.style.top = "5px";
    removeBtn.style.right = "5px";
    removeBtn.style.background = "rgba(0,0,0,0.7)";
    removeBtn.style.color = "white";
    removeBtn.style.border = "none";
    removeBtn.style.borderRadius = "50%";
    removeBtn.style.width = "20px";
    removeBtn.style.height = "20px";
    removeBtn.style.cursor = "pointer";
    removeBtn.style.fontSize = "14px";
    removeBtn.style.lineHeight = "18px";

    removeBtn.onclick = function (e) {
      e.stopPropagation();
      wrapper.remove();
      URL.revokeObjectURL(img.src);

      const newPlaceholder = document.createElement("div");
      newPlaceholder.className = "photo-placeholder";
      newPlaceholder.innerHTML = `<span>+ Agregar Foto</span>`;
      newPlaceholder.onclick = function () {
        addPhoto(newPlaceholder);
      };

      container.insertBefore(newPlaceholder, container.children[placeholderIndex]);
    };

    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.width = "150px";
    wrapper.style.height = "150px";
    wrapper.style.border = "1px solid #ddd";
    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);

    const container = currentPlaceholder.parentNode;
    const placeholderIndex = Array.from(container.children).indexOf(currentPlaceholder);
    container.replaceChild(wrapper, currentPlaceholder);

    currentPlaceholder = null;
    input.value = "";
  });
}

// ========== FUNCIÓN PARA MOSTRAR MENSAJES ==========
function showMessage(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.className = isError ? "error" : "success";
  el.classList.remove("hidden");
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => el.classList.add("hidden"), 7000);
}

// ========== FUNCIÓN PRINCIPAL MODIFICADA (VERSIÓN CORREGIDA) ==========
async function submitFaultReportForm() {
  console.log("=== INICIANDO ENVÍO DE INFORME ===");
  showMessage("message", "Generando PDF...");

  try {
    // Validar campos requeridos
    const requiredFields = [
      "reportNumber",
      "client",
      "equipmentCombined",
      "technician",
      "reportTitle",
      "failureDescription",
      "technicalAnalysis",
      "conclusion",
    ];

    for (const fieldId of requiredFields) {
      const field = document.getElementById(fieldId);
      if (field && !field.value.trim()) {
        showMessage(
          "message",
          `Por favor complete el campo: ${
            field.previousElementSibling?.textContent || fieldId
          }`,
          true
        );
        field.focus();
        return;
      }
    }

    // Configuración para generar PDF
    const elemento = document.querySelector(".form-container");

    // 🔧 EVITAR PÁGINA EN BLANCO: el CSS del sitio tiene
    // ".form-section { page-break-inside: avoid; break-inside: avoid; }"
    // permanentemente activo (no solo en @media print). Esto le indica al
    // motor de PDF que jamás corte una .form-section a la mitad; si la
    // primera sección no cabe completa en lo que queda de la página 1, la
    // empuja ENTERA a la página 2, dejando casi toda la página 1 en blanco.
    // Neutralizamos esa propiedad directamente en los elementos justo antes
    // de capturar (y la restauramos después) para que el contenido pueda
    // fluir con normalidad entre páginas.
    const seccionesForm = elemento.querySelectorAll('.form-section');
    seccionesForm.forEach((sec) => {
      sec.style.pageBreakInside = 'auto';
      sec.style.breakInside = 'auto';
    });

    // 🔧 EVITAR ESPACIO BLANCO: html2canvas captura relativo al scroll actual
    // de la página. Si el usuario tiene la página scrolleada al enviar el
    // formulario, ese desplazamiento se traduce en un espacio en blanco al
    // inicio del PDF. Llevamos la ventana al tope antes de capturar y
    // restauramos el scroll después.
    const scrollXAntes = window.scrollX;
    const scrollYAntes = window.scrollY;
    window.scrollTo(0, 0);

    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `Informe_Falla_${document.getElementById("reportNumber").value}_${Date.now()}.pdf`,
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
        mode: ["avoid-all"]
       },
    };

    // Generar PDF
    showMessage("message", "Generando PDF...");
    console.log("📄 Generando PDF con html2pdf...");
    let pdfBlob;
    try {
      pdfBlob = await html2pdf().from(elemento).set(opt).outputPdf("blob");
    } finally {
      // Restaurar la posición de scroll original del usuario
      window.scrollTo(scrollXAntes, scrollYAntes);

      // Restaurar el page-break-inside original de las secciones
      seccionesForm.forEach((sec) => {
        sec.style.pageBreakInside = '';
        sec.style.breakInside = '';
      });
    }
    console.log("✅ PDF generado, tamaño:", pdfBlob.size, "bytes");

    // Datos para el email
    const formData = {
      reportNumber: document.getElementById("reportNumber").value,
      client: document.getElementById("client").value,
      equipmentCombined: document.getElementById("equipmentCombined").value,
      reportTitle: document.getElementById("reportTitle").value,
      technician: document.getElementById("technician").value,
      failureDescription:
        document.getElementById("failureDescription").value.substring(0, 100) +
        "...",
      totalAmount: document.getElementById("totalAmount").textContent,
    };

    console.log("📋 Datos del informe:", formData);

    // ========== SUBIR PDF (MÉTODO MEJORADO) ==========
    showMessage("message", "Subiendo PDF...");
    
    let pdfUrl;
    
    // INTENTAR PRIMERO CON TU BACKEND (el método que SÍ funciona)
    try {
      console.log("🔄 Intentando subir usando TU backend (base64)...");
      pdfUrl = await uploadPdfUsingBackend(pdfBlob, formData.reportNumber);
      console.log("✅ PDF subido usando backend:", pdfUrl);
      
    } catch (backendError) {
      console.warn("Backend falló, intentando método directo...", backendError);
      showMessage("message", "Intentando método alternativo...");
      
      try {
        // INTENTAR MÉTODO DIRECTO (por si acaso)
        console.log("🔄 Intentando subida directa...");
        pdfUrl = await uploadPdfDirect(pdfBlob, formData.reportNumber);
        console.log("✅ PDF subido directamente:", pdfUrl);
        
      } catch (directError) {
        console.warn("Método directo falló, intentando con proxy...", directError);
        showMessage("message", "Último intento con proxy...");
        
        try {
          // ÚLTIMO INTENTO: PROXY
          console.log("🔄 Intentando con proxy CORS...");
          pdfUrl = await uploadPdfSimple(pdfBlob, formData.reportNumber);
          console.log("✅ PDF subido con proxy:", pdfUrl);
          
        } catch (proxyError) {
          console.error("💥 TODOS los métodos fallaron:", proxyError);
          throw new Error("No se pudo subir el PDF. Verifique que tu backend (/api/uploadPdf) esté funcionando y accesible desde https://komatsu-api.vercel.app/api/uploadPdf");
        }
      }
    }

    console.log("📄 PDF disponible en:", pdfUrl);

    // ========== PREPARAR Y ENVIAR EMAIL ==========
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
        <h2 style="color:#0033A0;">Informe de Falla – Komatsu</h2>
        <p>Hola equipo,</p>
        <p>Se ha generado automáticamente un nuevo <b>Informe de Falla</b> para revisión.</p>
        <p><b>Fecha de generación:</b> ${fechaFormateada}</p>

        <div style="background-color:#f8f9fa;border:1px solid #e9ecef;border-radius:5px;padding:15px;margin:15px 0;">
          <h3 style="color:#0033A0;margin-top:0;">Detalles del Informe</h3>
          <p><strong>Título del Informe:</strong> ${formData.reportTitle}</p>
          <p><strong>N° Informe:</strong> ${formData.reportNumber}</p>
          <p><strong>Cliente:</strong> ${formData.client}</p>
          <p><strong>Equipo:</strong> ${formData.equipmentCombined}</p>
          <p><strong>Técnico:</strong> ${formData.technician}</p>
          <p><strong>Descripción:</strong> ${formData.failureDescription}</p>
          <p><strong>Valor Total:</strong> ${formData.totalAmount}</p>
        </div>

        <p>Pueden visualizar o descargar el PDF desde el siguiente enlace:</p>
        <p style="text-align:center;margin:20px 0;">
          <a href="${pdfUrl}"
             style="display:inline-block;background-color:#0033A0;color:white;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;"
             target="_blank">
             Ver Informe de Falla Completo
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
        subject: `Informe de Falla | Equipo ${document.getElementById("equipmentField").value} | ${fechaFormateada}`,
        html: htmlContent,
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
    }
    
    if (data.success) {
      showMessage("message", "✅ Informe de Falla enviado correctamente!");
      console.log("✅ Email enviado exitosamente");
    } else {
      showMessage("message", data.error || "Error al enviar el correo.", true);
    }
  } catch (err) {
    console.error("❌ Error general:", err);
    showMessage("message", `❌ Error: ${err.message}`, true);
  }
}

const subjectTextarea = document.getElementById("subject");

subjectTextarea.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

// ========== FUNCIÓN DE DEPURACIÓN (opcional) ==========
window.debugForm = function() {
  console.log("=== DEBUG FORMULARIO ===");
  console.log("Backend URL:", 'https://komatsu-api.vercel.app/api/uploadPdf');
  console.log("SendEmail URL:", 'https://komatsu-api.vercel.app/api/sendEmail');
  console.log("Report Number:", document.getElementById("reportNumber")?.value);
  console.log("Form ready:", document.getElementById("faultReportForm") ? "✅" : "❌");
  console.log("html2pdf disponible:", typeof html2pdf === 'function' ? "✅" : "❌");
  console.log("Uploadcare disponible:", window.uploadcare ? "✅" : "❌");
};
