document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('fecha').value = new Date().toISOString().split('T')[0];

  initializeMeasurementsTable();
  calculateProjections();

  document.getElementById('getInspectionForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    await submitGetInspectionForm();
  });

  document.getElementById('fecha').addEventListener('change', calculateProjections);
  document.getElementById('ultimoCambio').addEventListener('change', calculateProjections);
});


function initializeMeasurementsTable() {
  const medidas = [
    { id: 'A', medidaBase: 110, medidaTomada: 0 },
    { id: 'B', medidaBase: 110, medidaTomada: 0 },
    { id: 'C', medidaBase: 110, medidaTomada: 0 },
    { id: 'D', medidaBase: 110, medidaTomada: 0 },
    { id: 'E', medidaBase: 110, medidaTomada: 0 },
    { id: 'F', medidaBase: 110, medidaTomada: 0 },
    { id: 'G', medidaBase: 110, medidaTomada: 0 },
    { id: 'H', medidaBase: 110, medidaTomada: 0 }
  ];

  const tbody = document.querySelector('#medidasTable tbody');
  tbody.innerHTML = '';

  medidas.forEach((medida) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${medida.id}</td>
      <td><input type="number" name="medidaBase_${medida.id}" value="${medida.medidaBase}" step="0.1" style="width: 100%; border: none; text-align: center;"></td>
      <td><input type="number" name="medidaTomada_${medida.id}" value="${medida.medidaTomada}" step="0.1" style="width: 100%; border: none; text-align: center;"></td>
      <td><span id="proyeccion_${medida.id}">180</span></td>
      <td><span id="proyeccionPorcentaje_${medida.id}">0%</span></td>
      <td><span id="desgasteReal_${medida.id}">0%</span></td>
      <td><input type="checkbox" name="cabezaPerno_${medida.id}"></td>
      <td><input type="checkbox" name="cuchillaDesgastada_${medida.id}"></td>
      <td>
        <select name="condicionPernos_${medida.id}" style="width: 100%; border: none;">
          <option value="B">B</option>
          <option value="M" selected>M</option>
        </select>
      </td>
    `;
    tbody.appendChild(row);
    row.querySelector(`[name="medidaTomada_${medida.id}"]`).addEventListener('input', calculateProjections);
  });
}

function calculateProjections() {
  const proyeccionFija = 180;
  const proyeccionPorcentajeFija = 82;
  const medidaMaxima = 220;

  let sumaDesgasteReal = 0;
  let count = 0;

  for (let i = 0; i < 8; i++) {
    const id = String.fromCharCode(65 + i);
    const medidaTomada = parseFloat(document.querySelector(`[name="medidaTomada_${id}"]`).value) || 0;
    const desgasteRealPorcentaje = Math.round((medidaTomada / medidaMaxima) * 100);

    document.getElementById(`proyeccion_${id}`).textContent = proyeccionFija.toFixed(1);
    document.getElementById(`proyeccionPorcentaje_${id}`).textContent = proyeccionPorcentajeFija.toFixed(1) + '%';
    document.getElementById(`desgasteReal_${id}`).textContent = desgasteRealPorcentaje + '%';

    sumaDesgasteReal += desgasteRealPorcentaje;
    count++;
  }

  const promedioDesgaste = count > 0 ? Math.ceil(sumaDesgasteReal / count) : 0;
  document.getElementById('promedioDesgaste').value = promedioDesgaste + '%';
}

function showMessage(elementId, message, isError = false) {
  const messageElement = document.getElementById(elementId);
  messageElement.textContent = message;
  messageElement.className = isError ? 'error' : 'success';
  messageElement.classList.remove('hidden');
  setTimeout(() => messageElement.classList.add('hidden'), 7000);
}


async function submitGetInspectionForm() {
  showMessage('message', 'Generando PDF y enviando reporte...');

  try {
    const elemento = document.querySelector('.form-container');
    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `Inspeccion_GET_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    const pdfBlob = await html2pdf().from(elemento).set(opt).outputPdf('blob');

    const formData = new FormData();
    formData.append('UPLOADCARE_PUB_KEY', 'dd2580a9c669d60b5d49');
    formData.append('file', pdfBlob, 'Inspeccion_GET.pdf');

    const uploadRes = await fetch('https://upload.uploadcare.com/base/', {
      method: 'POST',
      body: formData
    });

    const uploadData = await uploadRes.json();
    const pdfUrl = `https://ucarecdn.com/${uploadData.file}/`;
    console.log('📎 PDF subido:', pdfUrl);

    const to = ["alaskaheim@gmail.com"]; 
    const cc = [];                      
    const bcc = [
      "mariaignaciar@live.cl",
      "mnovacov@hotmail.com",
      "novakovfilms@gmail.com",
      "blakenovacov@gmail.com",
      "novacriadero@gmail.com "
    ];

    const res = await fetch("https://komatsu-api.vercel.app/api/sendEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        cc,
        bcc,
        subject: 'Reporte de Inspección GET - Komatsu',
        html: `
          <p>Hola equipo,</p>
          <p>Adjunto el reporte de inspección generado automáticamente.</p>
          <p><a href="${pdfUrl}" target="_blank">📄 Descargar reporte aquí</a></p>
          <hr>
          <p style="font-size:12px;color:#777;">Enviado automáticamente por el sistema Komatsu GET.</p>
        `
      })
    });

    const data = await res.json();
    if (data.success) {
      showMessage('message', '✅ Reporte enviado correctamente.');
    } else {
      showMessage('message', '❌ Error al enviar el correo.', true);
      console.error(data);
    }
  } catch (err) {
    console.error(err);
    showMessage('message', '❌ Error al generar o enviar el reporte.', true);
  }
}
