// fault-report.js - VERSIÓN COMPLETA Y CORREGIDA (SIN ESPACIO BLANCO)

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
    const formData = new FormData();
    formData.append('UPLOADCARE_PUB_KEY', 'dd2580a9c669d60b5d49');
    formData.append('UPLOADCARE_STORE', '1');
    formData.append('file', pdfBlob, `Informe_Falla_${reportNumber}.pdf`);
    
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

// ========== FUNCIÓN PARA SUBIR PDF (método alternativo con proxy) ==========
async function uploadPdfSimple(pdfBlob, reportNumber) {
  console.log("🔄 Usando método alternativo con proxy...");
  
  try {
    const formData = new FormData();
    formData.append('UPLOADCARE_PUB_KEY', 'dd2580a9c669d60b5d49');
    formData.append('UPLOADCARE_STORE', '1');
    formData.append('file', pdfBlob, `Informe_${reportNumber}.pdf`);
    
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

// ========== FUNCIÓN: SUBIR PDF USANDO BACKEND CON BASE64 ==========
async function uploadPdfUsingBackend(pdfBlob, reportNumber) {
  console.log("🚀 Enviando PDF a backend como base64...");
  
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

// ========== INICIALIZACIÓN DEL FORMULARIO ==========
document.addEventListener("DOMContentLoaded", function () {
  console.log("📄 Cargando formulario de informe de falla...");
  
  const today = new Date().toISOString().split("T")[0];
  const dateFields = ["failureDate", "visitDate", "repairDate", "deliveryDate"];
  dateFields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });

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

  initializePartsTable();
  calculateTotals();
  initializePhotoUpload();

  const form = document.getElementById("faultReportForm");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      await submitFaultReportForm();
    });
  }

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
    <td><input type="text" name="partNumber" style="width: 100%; border: none; padding: 4px;"></td>
    <td><input type="text" name="description" style="width: 100%; border: none; padding: 4px;"></td>
    <td><input type="text" name="numberChange" style="width: 100%; border: none; padding: 4px;"></td>
    <td><input type="number" name="cantidad" value="0" min="0" step="1" style="width: 100%; border: none; padding: 4px; text-align: center;"></td>
    <td><input type="text" name="disponibilidad" style="width: 100%; border: none; padding: 4px;"></td>
    <td><input type="text" name="lista" style="width: 100%; border: none; padding: 4px;"></td>
    <td><input type="number" name="precioUn" value="0" min="0" step="0.01" style="width: 100%; border: none; padding: 4px; text-align: right;"></td>
    <td><span name="total" style="display:block;text-align:right;padding:4px;">$ 0</span></td>
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

// ========== FUNCIÓN PRINCIPAL CORREGIDA (SIN ESPACIO BLANCO) ==========
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

    // 🔧 CONFIGURACIÓN MEJORADA PARA PDF - ELIMINA ESPACIO BLANCO
    const elemento = document.querySelector(".form-container");
    
    // Clonar el elemento para no afectar la vista
    const clone = elemento.cloneNode(true);
    
    // 🔥 ELIMINAR FÍSICAMENTE EL HEADER Y EL TÍTULO DEL FORMULARIO
    const header = clone.querySelector('header');
    if (header) {
      header.remove(); // Eliminar completamente, no solo ocultar
    }
    
    const formHeader = clone.querySelector('.form-header');
    if (formHeader) {
      formHeader.remove(); // Eliminar completamente
    }
    
    // También eliminar cualquier otro elemento que pueda causar espacios
    // Buscar elementos con solo texto o espacios
    const childrenToRemove = [];
    for (let i = 0; i < clone.children.length; i++) {
      const child = clone.children[i];
      // Si es un div vacío o con solo espacios
      if (child.tagName === 'DIV' && child.children.length === 0 && !child.textContent.trim()) {
        childrenToRemove.push(child);
      }
    }
    childrenToRemove.forEach(child => child.remove());
    
    // Configurar estilos del clon
    clone.style.width = "100%";
    clone.style.maxWidth = "1200px";
    clone.style.margin = "0 auto";
    clone.style.padding = "10px 20px 20px 20px";
    clone.style.backgroundColor = "white";
    clone.style.boxSizing = "border-box";
    
    // Aplicar estilos en línea a todos los elementos
    const allElements = clone.querySelectorAll('*');
    allElements.forEach(el => {
      // Inputs, textareas y selects
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        el.style.border = '1px solid #ddd';
        el.style.padding = '6px 8px';
        el.style.borderRadius = '4px';
        el.style.backgroundColor = '#f9f9f9';
        el.style.width = '100%';
        el.style.boxSizing = 'border-box';
        el.style.fontSize = '11px';
        el.style.minHeight = '30px';
      }
      
      // Textareas específicamente
      if (el.tagName === 'TEXTAREA') {
        el.style.minHeight = '60px';
        el.style.resize = 'vertical';
      }
      
      // Tablas
      if (el.tagName === 'TABLE') {
        el.style.width = '100%';
        el.style.borderCollapse = 'collapse';
        el.style.fontSize = '11px';
        el.style.marginTop = '5px';
      }
      
      // Celdas de tabla
      if (el.tagName === 'TD' || el.tagName === 'TH') {
        el.style.border = '1px solid #ddd';
        el.style.padding = '4px 6px';
        el.style.textAlign = 'left';
        el.style.fontSize = '11px';
        el.style.verticalAlign = 'middle';
      }
      
      // Secciones del formulario
      if (el.classList && el.classList.contains('form-section')) {
        el.style.marginBottom = '10px';
        el.style.padding = '8px 12px';
        el.style.border = '1px solid #ddd';
        el.style.pageBreakInside = 'avoid';
      }
      
      // Títulos
      if (el.tagName === 'H3') {
        el.style.fontSize = '13px';
        el.style.marginTop = '0';
        el.style.marginBottom = '6px';
        el.style.borderBottom = '1px solid #ddd';
        el.style.paddingBottom = '4px';
      }
      
      // Filas del formulario
      if (el.classList && el.classList.contains('form-row')) {
        el.style.display = 'flex';
        el.style.flexWrap = 'wrap';
        el.style.marginBottom = '6px';
        el.style.gap = '0';
      }
      
      // Grupos del formulario
      if (el.classList && el.classList.contains('form-group')) {
        el.style.flex = '1';
        el.style.minWidth = '180px';
        el.style.marginRight = '10px';
        el.style.marginBottom = '4px';
      }
      
      // Labels
      if (el.tagName === 'LABEL') {
        el.style.display = 'block';
        el.style.fontSize = '10px';
        el.style.fontWeight = 'bold';
        el.style.marginBottom = '2px';
        el.style.color = '#333';
      }
      
      // Campo de equipo + serie (select)
      if (el.id === 'equipmentCombined') {
        el.style.backgroundColor = '#f0f7ff';
        el.style.borderColor = '#0033A0';
      }
    });
    
    // Crear un contenedor temporal para el PDF
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '1200px';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '5px 20px 20px 20px';
    tempContainer.style.margin = '0';
    tempContainer.appendChild(clone);
    document.body.appendChild(tempContainer);

    // 🔧 OPCIONES DEL PDF OPTIMIZADAS
    const opt = {
      margin: [0.2, 0.4, 0.4, 0.4], // Margen superior mínimo
      filename: `Informe_Falla_${document.getElementById("reportNumber").value}_${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1200,
        windowWidth: 1200,
        height: tempContainer.scrollHeight || 2000,
        windowHeight: tempContainer.scrollHeight || 2000,
        y: 0,
        scrollY: 0,
        x: 0,
        scrollX: 0,
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
        compress: true,
        putOnlyUsedFonts: true,
        floatPrecision: 16,
      },
      pagebreak: {
        mode: ['avoid-all', 'css']
      },
    };

    // Generar PDF desde el clon
    showMessage("message", "Generando PDF...");
    console.log("📄 Generando PDF con html2pdf...");
    
    const pdfBlob = await html2pdf()
      .from(tempContainer)
      .set(opt)
      .outputPdf("blob");
    
    // Limpiar el contenedor temporal
    document.body.removeChild(tempContainer);
    
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

    // ========== SUBIR PDF ==========
    showMessage("message", "Subiendo PDF...");
    
    let pdfUrl;
    
    try {
      console.log("🔄 Intentando subir usando backend (base64)...");
      pdfUrl = await uploadPdfUsingBackend(pdfBlob, formData.reportNumber);
      console.log("✅ PDF subido usando backend:", pdfUrl);
      
    } catch (backendError) {
      console.warn("Backend falló, intentando método directo...", backendError);
      showMessage("message", "Intentando método alternativo...");
      
      try {
        console.log("🔄 Intentando subida directa...");
        pdfUrl = await uploadPdfDirect(pdfBlob, formData.reportNumber);
        console.log("✅ PDF subido directamente:", pdfUrl);
        
      } catch (directError) {
        console.warn("Método directo falló, intentando con proxy...", directError);
        showMessage("message", "Último intento con proxy...");
        
        try {
          console.log("🔄 Intentando con proxy CORS...");
          pdfUrl = await uploadPdfSimple(pdfBlob, formData.reportNumber);
          console.log("✅ PDF subido con proxy:", pdfUrl);
          
        } catch (proxyError) {
          console.error("💥 TODOS los métodos fallaron:", proxyError);
          throw new Error("No se pudo subir el PDF. Verifique que tu backend esté funcionando.");
        }
      }
    }

    console.log("📄 PDF disponible en:", pdfUrl);

    // ========== PREPARAR Y ENVIAR EMAIL (MEJORADO) ==========
    const today = new Date();
    const fechaFormateada = today.toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .email-container { max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 3px solid #0033A0; padding-bottom: 15px; margin-bottom: 25px; }
          .header h1 { color: #0033A0; margin: 0; font-size: 28px; }
          .header p { color: #666; margin: 5px 0 0; }
          .details-box { background-color: #f8f9fa; border-left: 4px solid #0033A0; padding: 15px 20px; margin: 20px 0; border-radius: 4px; }
          .details-box h3 { color: #0033A0; margin-top: 0; }
          .details-grid { display: table; width: 100%; }
          .details-row { display: table-row; }
          .details-label { display: table-cell; padding: 6px 10px 6px 0; font-weight: bold; width: 35%; }
          .details-value { display: table-cell; padding: 6px 0; }
          .btn { display: inline-block; background-color: #0033A0; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0; }
          .btn:hover { background-color: #00257a; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777; text-align: center; }
          @media only screen and (max-width: 600px) {
            body { padding: 10px; }
            .email-container { padding: 15px; }
            .details-label { width: 40%; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🏗️ KOMATSU</h1>
            <p><strong>Informe de Falla</strong> - Generado automáticamente</p>
          </div>

          <p style="font-size: 16px;">Hola equipo,</p>
          <p>Se ha generado un nuevo <strong>Informe de Falla</strong> para revisión. Los detalles principales se resumen a continuación:</p>

          <div class="details-box">
            <h3>📋 Detalles del Informe</h3>
            <div class="details-grid">
              <div class="details-row">
                <span class="details-label">Título del Informe:</span>
                <span class="details-value"><strong>${formData.reportTitle || 'Sin título'}</strong></span>
              </div>
              <div class="details-row">
                <span class="details-label">N° Informe:</span>
                <span class="details-value">${formData.reportNumber}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Cliente / Faena:</span>
                <span class="details-value">${formData.client}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Equipo + Serie:</span>
                <span class="details-value">${formData.equipmentCombined}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Técnico Komatsu:</span>
                <span class="details-value">${formData.technician}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Fecha de generación:</span>
                <span class="details-value">${fechaFormateada}</span>
              </div>
              <div class="details-row">
                <span class="details-label">Valor Total:</span>
                <span class="details-value"><strong style="color:#0033A0;">${formData.totalAmount}</strong></span>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin: 25px 0;">
            <a href="${pdfUrl}" class="btn" target="_blank">📄 Ver Informe de Falla Completo</a>
            <p style="font-size: 13px; color: #888; margin-top: 8px;">Haz clic en el botón para ver o descargar el PDF</p>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 12px 18px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>ℹ️ Nota:</strong> Este es un mensaje automático. Por favor, no responder a este correo.</p>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} Komatsu - Sistema de Reportes de Falla</p>
            <p style="margin-top: 5px;">Este correo fue enviado automáticamente por el sistema de reportes.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    showMessage("message", "Enviando email...");

    const res = await fetch("https://komatsu-api.vercel.app/api/sendEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: `Informe de Falla | ${formData.equipmentCombined} | ${fechaFormateada}`,
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

// ========== AUTO-RESIZE PARA TEXTAREA ==========
const subjectTextarea = document.getElementById("subject");

if (subjectTextarea) {
  subjectTextarea.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });
}

// ========== FUNCIÓN DE DEPURACIÓN ==========
window.debugForm = function() {
  console.log("=== DEBUG FORMULARIO ===");
  console.log("Backend URL:", 'https://komatsu-api.vercel.app/api/uploadPdf');
  console.log("SendEmail URL:", 'https://komatsu-api.vercel.app/api/sendEmail');
  console.log("Report Number:", document.getElementById("reportNumber")?.value);
  console.log("Form ready:", document.getElementById("faultReportForm") ? "✅" : "❌");
  console.log("html2pdf disponible:", typeof html2pdf === 'function' ? "✅" : "❌");
  console.log("Uploadcare disponible:", window.uploadcare ? "✅" : "❌");
};