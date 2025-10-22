document.addEventListener("DOMContentLoaded", function () {
  const fecha = document.querySelector('input[type="date"]');
  if (fecha) fecha.value = new Date().toISOString().split("T")[0];
});

// Mostrar mensajes al usuario
function showMessage(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? "#c00" : "#007b00";
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 7000);
}

// Generar PDF y enviar por correo
async function submitPMClinicForm() {
  showMessage("message", "📄 Generando PDF y enviando formulario...");

  try {
    const elemento = document.querySelector(".container");

    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `PM_Clinic_HD785-7_${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    // Compatibilidad: crea alias si la versión no tiene outputPdf
    if (typeof html2pdf === "function" && !html2pdf().outputPdf) {
      html2pdf.prototype.outputPdf = html2pdf.prototype.output;
    }

    // Generar PDF como blob (mismo método que get-inspection.js)
    const pdfBlob = await html2pdf().from(elemento).set(opt).outputPdf("blob");

    // Subir PDF a Uploadcare
    const formData = new FormData();
    formData.append("UPLOADCARE_PUB_KEY", "dd2580a9c669d60b5d49");
    formData.append("file", pdfBlob, "PM_Clinic_HD785-7.pdf");

    const uploadRes = await fetch("https://upload.uploadcare.com/base/", {
      method: "POST",
      body: formData,
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.file) throw new Error("Error al subir el PDF a Uploadcare.");

    const pdfUrl = `https://ucarecdn.com/${uploadData.file}/`;
    console.log("📎 PDF subido:", pdfUrl);

    // Fecha formateada para el email
    const today = new Date();
    const fechaFormateada = today.toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Cuerpo del mensaje de correo (tu versión)
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

    // Enviar correo usando tu API
    const res = await fetch("https://komatsu-api.vercel.app/api/sendEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: `Reporte PM Clinic HD785-7 – ${fechaFormateada}`,
        html: htmlContent,
      }),
    });

    const data = await res.json();
    if (data.success) {
      showMessage("message", "✅ Reporte enviado correctamente.");
      console.log("✅ Email enviado:", data);
    } else {
      showMessage("message", "❌ Error al enviar el correo.", true);
      console.error("❌ Error al enviar email:", data);
    }
  } catch (err) {
    console.error("❌ Error general:", err);
    showMessage("message", "❌ Error al generar o enviar el reporte.", true);
  }
}
