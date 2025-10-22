document.addEventListener("DOMContentLoaded", function () {
  const fecha = document.querySelector('input[type="date"]');
  if (fecha) fecha.value = new Date().toISOString().split("T")[0];

  // Fecha automática
  const dateInputs = document.querySelectorAll('input[type="date"]');
  if (dateInputs.length) dateInputs[0].value = new Date().toISOString().split("T")[0];
});

// Mostrar mensajes al usuario
function showMessage(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? "#c00" : "#007b00";
  el.classList.remove("hidden");
}

// Generar PDF y enviar
async function submitPMClinicForm() {
  showMessage("message", "📄 Generando PDF y enviando formulario...");

  try {
    const elemento = document.querySelector('.form-container');

    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `PM_Clinic_HD785-7_${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] }
    };

    // 👇 aquí el error estaba en "elemento"
    const pdfBlob = await html2pdf().from(elemento).set(opt).outputPdf("blob");

    // Subir a Uploadcare
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

    // Enviar email
    await sendReportEmail(pdfUrl);
  } catch (err) {
    console.error("❌ Error general:", err);
    showMessage("message", "❌ Error al generar o subir el PDF.", true);
  }
}

// Enviar correo con el enlace al PDF
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
      showMessage("message", "✅ Reporte enviado correctamente.");
      console.log("✅ Email enviado:", data);
    } else {
      showMessage("message", "❌ Error al enviar el correo.", true);
      console.error("❌ Error al enviar email:", data);
    }
  } catch (error) {
    console.error("❌ Error en envío:", error);
    showMessage("message", "❌ Error inesperado al enviar el reporte.", true);
  }
}
