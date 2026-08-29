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
  initializeAutoExpandTextareas();

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

// ========== AUTO-EXPANSIÓN DE CUADROS DE TEXTO ==========
// Evita que el contenido de los textarea se corte al capturar el PDF:
// el cuadro crece en altura según lo escrito, en vez de quedar con scroll interno.

function autoExpandTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

function initializeAutoExpandTextareas() {
  document.querySelectorAll("textarea").forEach((textarea) => {
    // Ajuste inicial (por si ya trae texto precargado)
    autoExpandTextarea(textarea);
    textarea.addEventListener("input", () => autoExpandTextarea(textarea));
  });
}

// ========== SUSTITUCIÓN TEMPORAL DE TEXTAREAS POR DIV (SOLO PARA CAPTURA) ==========
// html2canvas no captura correctamente el contenido real de un <textarea> ya
// redimensionado: lo dibuja como si tuviera su altura/ancho original, cortando
// el texto que sobresale. Los <div> sí se capturan siempre completos y
// correctamente, así que justo antes de generar el PDF reemplazamos cada
// textarea por un div con el mismo texto y la misma apariencia, y lo
// restauramos apenas termina la captura.
// html2canvas dibuja el texto con su propio motor de renderizado y NO
// ajusta automáticamente el texto al ancho del contenedor (ni siquiera con
// espacios normales) — solo respeta saltos de línea reales ("\n"). Por eso
// calculamos nosotros mismos dónde debe ir cada salto de línea, usando las
// métricas reales de la fuente, para que el texto entre completo dentro del
// cuadro tal como se ve en pantalla.
function wrapTextToWidth(text, maxWidthPx, font) {
  const canvas = wrapTextToWidth._canvas || (wrapTextToWidth._canvas = document.createElement("canvas"));
  const ctx = canvas.getContext("2d");
  ctx.font = font;

  function breakLongToken(token, lines, pushRemainder) {
    // Corta un "token" (palabra) más ancho que el cuadro, caracter a caracter.
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
    // Ancho disponible real para el texto (descontando padding y borde).
    // Se aplica un margen de seguridad adicional (25%) porque html2canvas
    // termina renderizando el contenedor capturado a un ancho algo menor
    // que el medido en la página en vivo; sin este margen, algunas líneas
    // calculadas quedaban más anchas que el cuadro real y se cortaban.
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

    // Asegurar que todos los cuadros de texto estén expandidos a su
    // contenido completo justo antes de capturar el PDF (por si algún
    // campo se llenó por script sin disparar el evento "input").
    document.querySelectorAll("textarea").forEach(autoExpandTextarea);

    // Asegurar que todos los cuadros de texto estén expandidos a su
    // contenido completo justo antes de capturar el PDF (por si algún
    // campo se llenó por script sin disparar el evento "input").
    document.querySelectorAll("textarea").forEach(autoExpandTextarea);

    // Configuración para generar PDF
    const elemento = document.querySelector(".form-container");

    // 🔧 EVITAR TEXTO CORTADO: html2canvas no captura bien un <textarea>
    // ya redimensionado por JS (lo dibuja con su tamaño original y corta
    // el resto). Lo reemplazamos por un <div> visualmente idéntico solo
    // para la captura, y lo restauramos después.
    const textareaReplacements = replaceTextareasWithDivsForCapture(elemento);

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
      // 🔧 EVITAR PÁGINA EN BLANCO: "avoid-all" ignora las reglas de
      // page-break-inside definidas en el CSS del sitio (que ya están
      // pensadas a propósito: la sección "Información General" puede
      // dividirse entre páginas, pero el resto de secciones no). Con
      // "avoid-all", si "Información General" no cabía completa en lo que
      // quedaba de la página 1, se empujaba ENTERA a la página 2, dejando
      // casi toda la página 1 en blanco. Usando "css" se respeta la regla
      // real y el contenido fluye de forma continua.
      pagebreak: {
        mode: ["css"],
        before: ".pdf-page-start"
       },
    };

    // Generar PDF
    showMessage("message", "Generando PDF...");
    console.log("📄 Generando PDF con html2pdf...");
    let pdfBlob;
    try {
      pdfBlob = await html2pdf().from(elemento).set(opt).outputPdf("blob");
    } finally {
      // Restaurar los textarea reemplazados por div durante la captura
      restoreTextareasAfterCapture(textareaReplacements);

      // Restaurar la posición de scroll original del usuario
      window.scrollTo(scrollXAntes, scrollYAntes);
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
