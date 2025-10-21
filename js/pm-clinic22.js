document.addEventListener("DOMContentLoaded", () => {
  // Establecer fecha actual en el primer input tipo fecha
  const today = new Date().toISOString().split("T")[0];
  const dateInputs = document.querySelectorAll('input[type="date"]');
  if (dateInputs.length) dateInputs[0].value = today;

  const formContainer = document.querySelector(".container");

  // Crear botón principal
  const submitButton = document.createElement("button");
  submitButton.textContent = "Generar y Enviar Reporte";
  submitButton.className = "btn";
  submitButton.style.marginTop = "20px";
  formContainer.appendChild(submitButton);

  // Crear caja de mensajes
  const messageBox = document.createElement("div");
  messageBox.id = "messageBox";
  messageBox.style.cssText =
    "margin-top:12px;font-size:14px;font-weight:bold;text-align:center;";
  formContainer.appendChild(messageBox);

  // Evento para generar y enviar el PDF
  submitButton.addEventListener("click", async () => {
    await generateAndSendPDF();
  });
});

// Mostrar mensajes al usuario
function showMessage(msg, success = true) {
  const box = document.getElementById("messageBox");
  box.textContent = msg;
  box.style.color = success ? "#007b00" : "#c00";
}

// Generar PDF y subirlo
async function generateAndSendPDF() {
  try {
    showMessage("📄 Generando PDF... Por favor espera.");

    const element = document.querySelector(".container > .form-container") || document.querySelector(".container");

    const opt = {
  margin: [0.1, 0.2, 0.2, 0.2],
  filename: `PM_Clinic_HD785-7_${new Date().toISOString().split("T")[0]}.pdf`,
  image: { type: "jpeg", quality: 1 },
  html2canvas: { scale: 3, useCORS: true },
  jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  pagebreak: { mode: ["avoid-all", "css", "legacy"] }
};

    // Convertir el formulario en PDF
    const pdfBlob = await html2pdf().from(element).set(opt).outputPdf("blob");

    // Subir PDF a Uploadcare
    const formData = new FormData();
    formData.append("UPLOADCARE_PUB_KEY", "dd2580a9c669d60b5d49");
    formData.append("file", pdfBlob, "PM_Clinic_HD785-7.pdf");

    const uploadRes = await fetch("https://upload.uploadcare.com/base/", {
      method: "POST",
      body: formData
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.file) throw new Error("Error al subir el PDF.");

    const pdfUrl = `https://ucarecdn.com/${uploadData.file}/`;
    console.log("📎 PDF subido:", pdfUrl);

    showMessage("📨 Enviando correo...");
    await sendReportEmail(pdfUrl);
  } catch (err) {
    console.error("❌ Error general:", err);
    showMessage("❌ Error al generar o subir el PDF.", false);
  }
}

// Enviar correo con enlace al PDF
async function sendReportEmail(pdfUrl) {
  try {
    const today = new Date();
    const fechaFormateada = today.toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const subject = `Reporte PM Clinic HD785-7 – ${fechaFormateada}`;

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;color:#333;">
        <h2 style="color:#0033A0;">Reporte PM Clinic – HD785-7</h2>
        <p>Hola equipo,</p>
        <p>Se ha generado automáticamente un nuevo reporte de inspección PM Clinic (HD785-7).</p>
        <p><b>Fecha de generación:</b> ${fechaFormateada}</p>
        <p>Pueden visualizar o descargar el PDF desde el siguiente enlace:</p>
        <p><a href="${pdfUrl}" style="color:#0033A0;font-weight:bold;" target="_blank">📄 Ver Reporte PM Clinic</a></p>
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
      body: JSON.stringify({ subject, html: htmlContent })
    });

    const data = await res.json();

    if (data.success) {
      console.log("✅ Email enviado correctamente:", data);
      showMessage("✅ Reporte generado y enviado correctamente.");
    } else {
      console.error("❌ Error al enviar email:", data);
      showMessage("❌ Error al enviar el correo.", false);
    }
  } catch (error) {
    console.error("❌ Error en el envío de correo:", error);
    showMessage("❌ Error inesperado al enviar el reporte.", false);
  }
}
function submitPMClinicForm() {
  generateAndSendPDF();
}