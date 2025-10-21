document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("fechaInspeccion").value = new Date().toISOString().split("T")[0];
  const tbody = document.querySelector("#tablaMediciones tbody");
  for (let i = 0; i < 6; i++) addFilaMedicion();
  document.getElementById("addFilaMedicion").addEventListener("click", addFilaMedicion);
  document.getElementById("pmClinic22Form").addEventListener("submit", async (e) => {
    e.preventDefault();
    await submitPMClinic22Form();
  });
  document.getElementById("addPhotoBtn").addEventListener("click", () => document.getElementById("photoUpload").click());
  document.getElementById("photoUpload").addEventListener("change", renderPhotos);
  document.getElementById("limpiarBtn").addEventListener("click", clearForm);
});

function addFilaMedicion() {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input/></td>
    <td><input/></td>
    <td><input/></td>
    <td><input/></td>
    <td><input/></td>
    <td><input/></td>
    <td><input/></td>
    <td><input type="checkbox"/></td>
    <td><input type="checkbox"/></td>
  `;
  document.querySelector("#tablaMediciones tbody").appendChild(tr);
}

function renderPhotos(e) {
  const files = Array.from(e.target.files || []);
  const container = document.querySelector(".photo-container");
  const anchor = document.getElementById("addPhotoBtn");
  files.forEach((file) => {
    const wrap = document.createElement("div");
    wrap.style.position = "relative";
    wrap.style.width = "140px";
    wrap.style.height = "140px";
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
    del.style.right = "6px";
    del.style.color = "#fff";
    del.style.background = "rgba(0,0,0,.6)";
    del.style.borderRadius = "50%";
    del.style.width = "20px";
    del.style.height = "20px";
    del.style.display = "flex";
    del.style.alignItems = "center";
    del.style.justifyContent = "center";
    del.style.cursor = "pointer";
    del.style.fontWeight = "bold";
    del.addEventListener("click", () => wrap.remove());
    wrap.appendChild(img);
    wrap.appendChild(del);
    container.insertBefore(wrap, anchor);
  });
  e.target.value = "";
}

function showMessage(msg, isError = false) {
  const el = document.getElementById("message");
  el.textContent = msg;
  el.className = isError ? "error" : "success";
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 7000);
}

function clearForm() {
  document.getElementById("pmClinic22Form").reset();
  const tbody = document.querySelector("#tablaMediciones tbody");
  tbody.innerHTML = "";
  for (let i = 0; i < 6; i++) addFilaMedicion();
  document.querySelectorAll(".photo-container img").forEach((n) => n.parentElement.remove());
}

async function submitPMClinic22Form() {
  const cliente = document.getElementById("cliente").value.trim();
  const ubicacion = document.getElementById("ubicacion").value.trim();
  const fecha = document.getElementById("fechaInspeccion").value;
  const modelo = document.getElementById("equipoModelo").value.trim();
  const serie = document.getElementById("equipoSerie").value.trim();
  const tecnico = document.getElementById("tecnico").value.trim();

  if (!cliente || !ubicacion || !fecha || !modelo || !serie || !tecnico) {
    showMessage("Completa los campos requeridos (⭐).", true);
    return;
  }

  showMessage("Generando PDF y enviando reporte...");

  try {
    const elemento = document.querySelector(".form-container");
    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `PM_CLINIC22_${modelo}_${serie}_${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] }
    };

    const pdfBlob = await html2pdf().from(elemento).set(opt).outputPdf("blob");

    const formUpload = new FormData();
    formUpload.append("UPLOADCARE_PUB_KEY", "dd2580a9c669d60b5d49");
    formUpload.append("file", pdfBlob, `PM_CLINIC22_${modelo}_${serie}.pdf`);

    const uploadRes = await fetch("https://upload.uploadcare.com/base/", { method: "POST", body: formUpload });
    const uploadData = await uploadRes.json();
    const pdfUrl = `https://ucarecdn.com/${uploadData.file}/`;
    console.log("📎 PDF subido:", pdfUrl);

    const asunto = `PM Clinic 22 — ${modelo} ${serie} — ${ubicacion} — ${fecha}`;
    const htmlEmail = `
      <p>Hola equipo,</p>
      <p>Se ha generado automáticamente un informe PM Clinic 22.</p>
      <p><a href="${pdfUrl}" target="_blank">📄 Descargar reporte aquí</a></p>
      <p style="font-size:12px;color:#555;margin-top:10px">Modelo: <strong>${modelo}</strong> — Serie: <strong>${serie}</strong> — Fecha: <strong>${fecha}</strong></p>
      <hr>
      <p style="font-size:12px;color:#777;">Enviado automáticamente por el sistema Komatsu.</p>
    `;

    const res = await fetch("https://komatsu-api.vercel.app/api/sendEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: asunto, html: htmlEmail })
    });

    const data = await res.json();
    if (data.success) showMessage("✅ Reporte enviado correctamente.");
    else {
      console.error(data);
      showMessage("❌ Error al enviar el correo.", true);
    }
  } catch (err) {
    console.error(err);
    showMessage("❌ Error al generar o enviar el reporte.", true);
  }
}
