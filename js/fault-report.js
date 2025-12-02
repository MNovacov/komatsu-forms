document.addEventListener("DOMContentLoaded", function () {
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
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    reportNumber.value = `INF-${year}${month}${day}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
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

function initializePartsTable() {
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
  row.querySelector('[name="total"]').textContent = `$ ${new Intl.NumberFormat("es-CL").format(total)}`;
}

function calculateTotals() {
  const rows = document.querySelectorAll("#partsTable tbody tr");
  let totalAmount = 0;

  rows.forEach((row) => {
    let totalText = row.querySelector('[name="total"]').textContent.replace(/\$|\./g, "").trim();
    let totalValue = parseFloat(totalText) || 0;
    totalAmount += totalValue;
  });

  document.getElementById("totalAmount").textContent = `$ ${new Intl.NumberFormat("es-CL").format(totalAmount)}`;
}

let currentPlaceholder = null;

function addPhoto(placeholderElement) {
  currentPlaceholder = placeholderElement;
  document.getElementById('photoUpload').click();
}

function initializePhotoUpload() {
  const input = document.getElementById("photoUpload");
  
  input.addEventListener("change", function () {
    if (!currentPlaceholder || !this.files[0]) return;
    
    const file = this.files[0];
    
    if (!file.type.startsWith('image/')) {
      alert('Por favor, seleccione solo archivos de imagen.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 5MB.');
      return;
    }
    
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '×';
    removeBtn.style.position = 'absolute';
    removeBtn.style.top = '5px';
    removeBtn.style.right = '5px';
    removeBtn.style.background = 'rgba(0,0,0,0.7)';
    removeBtn.style.color = 'white';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '50%';
    removeBtn.style.width = '20px';
    removeBtn.style.height = '20px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.fontSize = '14px';
    removeBtn.style.lineHeight = '18px';
    
    removeBtn.onclick = function(e) {
      e.stopPropagation();
      wrapper.remove();
      URL.revokeObjectURL(img.src);
      
      const newPlaceholder = document.createElement('div');
      newPlaceholder.className = 'photo-placeholder';
      newPlaceholder.innerHTML = `<span>+ Agregar Foto</span>`;
      newPlaceholder.onclick = function() {
        addPhoto(newPlaceholder);
      };
      
      container.insertBefore(newPlaceholder, container.children[placeholderIndex]);
    };
    
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.width = '150px';
    wrapper.style.height = '150px';
    wrapper.style.border = '1px solid #ddd';
    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);
    
    const container = currentPlaceholder.parentNode;
    const placeholderIndex = Array.from(container.children).indexOf(currentPlaceholder);
    container.replaceChild(wrapper, currentPlaceholder);
    
    currentPlaceholder = null;
    input.value = '';
  });
}

function showMessage(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.className = isError ? "error" : "success";
  el.classList.remove("hidden");
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => el.classList.add("hidden"), 7000);
}

async function submitFaultReportForm() {
  showMessage("message", "Generando PDF y enviando informe...");

  try {
    const requiredFields = ["reportNumber", "client", "equipmentNumber", 
                           "serialNumber", "technician", "reportTitle",
                           "failureDescription", "technicalAnalysis", "conclusion"];
    
    for (const fieldId of requiredFields) {
      const field = document.getElementById(fieldId);
      if (field && !field.value.trim()) {
        showMessage("message", `Por favor complete el campo: ${field.previousElementSibling?.textContent || fieldId}`, true);
        field.focus();
        return;
      }
    }

    const elemento = document.querySelector(".form-container");
    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `Informe_Falla_${document.getElementById("reportNumber").value}_${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { 
        scale: 3, 
        useCORS: true,
        logging: false,
        allowTaint: true
      },
      jsPDF: { 
        unit: "in", 
        format: "a4", 
        orientation: "portrait",
        compress: true
      },
      pagebreak: { 
        mode: ["avoid-all", "css", "legacy"]
      }
    };

    const pdfBlob = await html2pdf().from(elemento).set(opt).outputPdf("blob");
    
    const formData = {
      reportNumber: document.getElementById("reportNumber").value,
      client: document.getElementById("client").value,
      equipmentModel: document.getElementById("equipmentNumber").value,
      equipmentSerial: document.getElementById("serialNumber").value,
      reportTitle: document.getElementById("reportTitle").value,
      technician: document.getElementById("technician").value,
      failureDescription: document.getElementById("failureDescription").value.substring(0, 100) + "...",
      totalAmount: document.getElementById("totalAmount").textContent
    };

    const uploadFormData = new FormData();
    uploadFormData.append("UPLOADCARE_PUB_KEY", "dd2580a9c669d60b5d49");
    uploadFormData.append("file", pdfBlob, `Informe_Falla_${formData.reportNumber}.pdf`);
    uploadFormData.append("store", "auto");

    const uploadRes = await fetch("https://upload.uploadcare.com/base/", {
      method: "POST",
      body: uploadFormData,
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.file) {
      throw new Error("Error al subir el PDF a Uploadcare.");
    }

    const pdfUrl = `https://ucarecdn.com/${uploadData.file}/`;
    console.log("📎 PDF subido:", pdfUrl);


    const today = new Date();
    const fechaFormateada = today.toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: '2-digit',
      minute: '2-digit'
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
          <p><strong>Equipo:</strong> ${formData.equipmentModel} - ${formData.equipmentSerial}</p>
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

    const res = await fetch("https://komatsu-api.vercel.app/api/sendEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: `Informe de Falla – ${fechaFormateada}`,
        html: htmlContent,
      }),
    });

    const data = await res.json();
    if (data.success) {
      showMessage("message", "Informe de Falla enviado correctamente.");
      console.log("Email enviado:", data);
    } else {
      showMessage("message", "Error al enviar el correo.", true);
      console.error("Error al enviar email:", data);
    }
    
  } catch (err) {
    console.error("Error general:", err);
    showMessage("message", "Error al generar o enviar el informe.", true);
  }
}
