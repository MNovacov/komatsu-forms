document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("fechaInspeccion").value = new Date().toISOString().split("T")[0];

  document.getElementById("pmClinicForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    await submitPMClinicForm();
  });
});

function showMessage(message, isError = false) {
  let el = document.getElementById("message");
  if (!el) {
    el = document.createElement("div");
    el.id = "message";
    el.style.cssText = "padding:12px 15px;margin:15px 0;border-radius:5px;text-align:center;font-weight:bold;";
    document.querySelector(".form-actions").insertBefore(el, document.querySelector(".form-actions").firstChild);
  }
  el.textContent = message;
  el.style.backgroundColor = isError ? "#f8d7da" : "#d4edda";
  el.style.color = isError ? "#721c24" : "#155724";
  el.style.border = isError ? "1px solid #f5c6cb" : "1px solid #c3e6cb";
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), 5000);
}

function collectBasicFormData() {
  return {
    nc: document.getElementById("nombreCliente").value,
    ub: document.getElementById("ubicacion").value,
    ws: document.getElementById("wd900Serie").value,
    ns: document.getElementById("noSerie").value,
    mm: document.getElementById("modeloMotor").value,
    nm: document.getElementById("noMotor").value,
    ot: document.getElementById("noOrdenTrabajo").value,
    ms: document.getElementById("medidorServicio").value,
    te: document.getElementById("tecnico").value,
    oo: document.getElementById("opinionOperador").value,
    na: document.getElementById("notasAjustes").value,
    ce: document.getElementById("comentariosEje").value,
    ht: document.getElementById("horasTurno").value,
    cp: document.getElementById("cuchillaPies").value,
    tam: document.getElementById("tempAmbienteMax").value,
    tami: document.getElementById("tempAmbienteMin").value,
    alt: document.getElementById("altura").value,
  };
}

function getAllFormData() {
  const basic = collectBasicFormData();
  const data = { ...basic, t: new Date().toISOString() };
  const sections = [
    { key: "mo", id: "inspeccionMotor" },
    { key: "ct", id: "inspeccionConvertidor" },
    { key: "tr", id: "inspeccionTransmision" },
    { key: "di", id: "inspeccionDireccion" },
    { key: "fr", id: "inspeccionFrenos" },
    { key: "hi", id: "inspeccionHidraulica" },
    { key: "ej", id: "inspeccionEje" },
  ];
  sections.forEach((section) => {
    const secData = collectSectionDataCompressed(section.id);
    if (secData.length > 0) data[section.key] = secData;
  });
  const problemas = collectProblemasCompressed();
  if (problemas.length > 0) data.prb = problemas;
  const options = collectOptionsCompressed();
  if (Object.keys(options).length > 0) Object.assign(data, options);
  return data;
}

function collectSectionDataCompressed(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return [];
  const rows = table.querySelectorAll("tbody tr");
  const data = [];
  rows.forEach((row) => {
    const input = row.querySelector('input[type="text"]');
    if (input && input.value.trim()) {
      const cells = Array.from(row.querySelectorAll("td"));
      data.push({
        i: cells[0]?.textContent?.trim().substring(0, 30) || "",
        c: cells[1]?.textContent?.trim().substring(0, 40) || "",
        u: cells[2]?.textContent?.trim() || "",
        e: cells[3]?.textContent?.trim() || "",
        p: cells[4]?.textContent?.trim() || "",
        r: input.value,
      });
    }
  });
  return data;
}

function collectProblemasCompressed() {
  const problemas = [];
  for (let i = 1; i <= 5; i++) {
    const problema = document.querySelector(`[name="problema_${i}"]`)?.value.trim();
    const repuesto = document.querySelector(`[name="repuesto_${i}"]`)?.value.trim();
    const numeroParte = document.querySelector(`[name="numero_parte_${i}"]`)?.value.trim();
    const cantidad = document.querySelector(`[name="cantidad_${i}"]`)?.value;
    if (problema || repuesto) {
      problemas.push({ p: problema || "", r: repuesto || "", np: numeroParte || "", c: cantidad || "" });
    }
  }
  return problemas;
}

function collectOptionsCompressed() {
  const options = {};
  const mineriaChecks = document.querySelectorAll('input[name="tipoTrabajoMineria"]:checked');
  if (mineriaChecks.length > 0) options.mn = Array.from(mineriaChecks).map((cb) => cb.value).join(", ");
  const construccionChecks = document.querySelectorAll('input[name="tipoTrabajoConstruccion"]:checked');
  if (construccionChecks.length > 0) options.cn = Array.from(construccionChecks).map((cb) => cb.value).join(", ");
  const sueloChecks = document.querySelectorAll('input[name="tipoSuelo"]:checked');
  if (sueloChecks.length > 0) options.sl = Array.from(sueloChecks).map((cb) => cb.value).join(", ");
  const sueloRocaRadios = document.querySelectorAll('input[name="tipoSueloRoca"]:checked');
  if (sueloRocaRadios.length > 0) options.sr = Array.from(sueloRocaRadios).map((cb) => cb.value).join(", ");
  const turnosRadios = document.querySelectorAll('input[name="turnosDia"]:checked');
  if (turnosRadios.length > 0) options.td = Array.from(turnosRadios).map((cb) => cb.value).join(", ");
  const neumaticosCheck = document.querySelector('input[name="neumaticosOption"]:checked');
  if (neumaticosCheck) options.nt = neumaticosCheck.value;
  return options;
}

async function submitPMClinicForm() {
  try {
    const formData = getAllFormData();
    if (!formData.nc || !formData.ub || !formData.ws) {
      showMessage("Complete todos los campos requeridos: Cliente, Ubicación y Serie WD900", true);
      return;
    }
    showMessage("⏳ Generando PDF y subiendo a la nube...");

    const elemento = document.querySelector(".form-container");
    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `PM_Clinic_${formData.ws || "reporte"}_${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    const pdfBlob = await html2pdf().from(elemento).set(opt).outputPdf("blob");
    const formUpload = new FormData();
    formUpload.append("UPLOADCARE_PUB_KEY", "dd2580a9c669d60b5d49");
    formUpload.append("file", pdfBlob, "PM_Clinic.pdf");

    const uploadRes = await fetch("https://upload.uploadcare.com/base/", {
      method: "POST",
      body: formUpload,
    });

    const uploadData = await uploadRes.json();
    const pdfUrl = `https://ucarecdn.com/${uploadData.file}/`;
    console.log("📎 PDF subido:", pdfUrl);

    const today = new Date();
    const fechaFormateada = today.toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const subject = `Reporte PM Clinic WD900-3 – ${formData.ws || formData.ns} – ${formData.ub}`;

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;color:#333;">
        <h2 style="color:#0033A0;">Reporte PM Clinic – WD900-3</h2>
        <p>Hola equipo,</p>
        <p>Se ha generado automáticamente un nuevo reporte de inspección PM Clinic (WD900-3).</p>
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
      body: JSON.stringify({
        subject,
        html: htmlContent,
      }),
    });

    const data = await res.json();
    if (data.success) showMessage("✅ PM Clinic enviado correctamente.");
    else showMessage("❌ Error al enviar el informe.", true);
  } catch (error) {
    console.error("Error:", error);
    showMessage("❌ Ocurrió un error al generar o enviar el PDF.", true);
  }
}
