document.addEventListener("DOMContentLoaded", function () {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("failureDate").value = today;
  document.getElementById("visitDate").value = today;

  initializePartsTable();
  calculateTotals();
  initializePhotoUpload();

  document
    .getElementById("faultReportForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      await submitFaultReportForm();
    });

  document
    .getElementById("partsTable")
    .addEventListener("input", function (e) {
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

function showMessage(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.className = isError ? "error" : "success";
  el.classList.remove("hidden");
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => el.classList.add("hidden"), 7000);
}

async function submitFaultReportForm() {
  showMessage("message", "⏳ Generando PDF y subiendo a la nube...");

  try {
    const elemento = document.querySelector(".form-container");
    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `Informe_Falla_${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    // 🧾 Generar PDF en blob
    const pdfBlob = await html2pdf().from(elemento).set(opt).outputPdf("blob");

    // ☁️ Subir a Uploadcare
    const formData = new FormData();
    formData.append("UPLOADCARE_PUB_KEY", "dd2580a9c669d60b5d49");
    formData.append("file", pdfBlob, "Informe_Falla.pdf");

    const uploadRes = await fetch("https://upload.uploadcare.com/base/", {
      method: "POST",
      body: formData,
    });

    const uploadData = await uploadRes.json();
    const pdfUrl = `https://ucarecdn.com/${uploadData.file}/`;
    console.log("📎 PDF subido:", pdfUrl);

    // 📬 Enviar email vía backend Resend
    const res = await fetch("https://komatsu-api.vercel.app/api/sendEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Informe de Falla - Komatsu",
        html: `
          <p>Hola equipo,</p>
          <p>Adjunto el informe de falla generado automáticamente.</p>
          <p><a href="${pdfUrl}" target="_blank">📄 Descargar reporte aquí</a></p>
          <hr>
          <p style="font-size:12px;color:#777;">Enviado automáticamente por el sistema Komatsu.</p>
        `,
      }),
    });

    const data = await res.json();

    if (data.success) {
      showMessage("message", "✅ Informe de Falla enviado correctamente.");
    } else {
      showMessage("message", "❌ Error al enviar el informe.", true);
      console.error(data);
    }
  } catch (err) {
    console.error("Error:", err);
    showMessage("message", "❌ Ocurrió un error al generar o enviar el PDF.", true);
  }
}

let selectedPhotos = [];
function initializePhotoUpload() {
  const input = document.getElementById("photoUpload");
  const container = document.querySelector(".photo-container");

  input.addEventListener("change", function () {
    Array.from(input.files).forEach((file) => {
      selectedPhotos.push(file);

      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.style.width = "150px";
      wrapper.style.height = "150px";

      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.border = "1px solid #ccc";
      img.style.borderRadius = "4px";

      const del = document.createElement("span");
      del.textContent = "×";
      del.style.position = "absolute";
      del.style.top = "2px";
      del.style.right = "5px";
      del.style.color = "white";
      del.style.backgroundColor = "rgba(0,0,0,0.6)";
      del.style.borderRadius = "50%";
      del.style.width = "20px";
      del.style.height = "20px";
      del.style.textAlign = "center";
      del.style.lineHeight = "18px";
      del.style.cursor = "pointer";
      del.style.fontWeight = "bold";
      del.addEventListener("click", () => {
        wrapper.remove();
        selectedPhotos = selectedPhotos.filter((f) => f !== file);
      });

      wrapper.appendChild(img);
      wrapper.appendChild(del);

      const placeholder = container.querySelector(".photo-placeholder");
      container.insertBefore(wrapper, placeholder);
    });

    input.value = "";
  });
}
