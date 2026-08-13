document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('fecha').value = new Date().toISOString().split('T')[0];

  initializeMeasurementsTable();
  calculateProjections();
  initializeAutoExpandTextareas();
  initializePhotoUpload();

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

// ========== FUNCIONES PARA FOTOS ==========
let currentPlaceholder = null;

function addPhoto(placeholderElement) {
  currentPlaceholder = placeholderElement;
  document.getElementById('photoUpload').click();
}

function initializePhotoUpload() {
  const input = document.getElementById('photoUpload');

  input.addEventListener('change', function () {
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

    removeBtn.onclick = function (e) {
      e.stopPropagation();
      wrapper.remove();
      URL.revokeObjectURL(img.src);

      const newPlaceholder = document.createElement('div');
      newPlaceholder.className = 'photo-placeholder';
      newPlaceholder.innerHTML = `<span>+ Agregar Foto</span>`;
      newPlaceholder.onclick = function () {
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
  const messageElement = document.getElementById(elementId);
  messageElement.textContent = message;
  messageElement.className = isError ? 'error' : 'success';
  messageElement.classList.remove('hidden');
  setTimeout(() => messageElement.classList.add('hidden'), 7000);
}

// ========== AUTO-EXPANSIÓN DE CUADROS DE TEXTO ==========
function autoExpandTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

function initializeAutoExpandTextareas() {
  document.querySelectorAll('textarea').forEach((textarea) => {
    autoExpandTextarea(textarea);
    textarea.addEventListener('input', () => autoExpandTextarea(textarea));
  });
}

// ========== SUSTITUCIÓN TEMPORAL DE TEXTAREAS POR DIV (SOLO PARA CAPTURA) ==========
// (Ver fault-report.js para la explicación completa: html2canvas no ajusta el
// texto al ancho real ni respeta la altura ya redimensionada de un textarea.)
function wrapTextToWidth(text, maxWidthPx, font) {
  const canvas = wrapTextToWidth._canvas || (wrapTextToWidth._canvas = document.createElement('canvas'));
  const ctx = canvas.getContext('2d');
  ctx.font = font;

  function breakLongToken(token, lines) {
    let chunk = '';
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

  const paragraphs = text.split('\n');
  const wrappedParagraphs = paragraphs.map((paragraph) => {
    if (paragraph === '') return '';
    const words = paragraph.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine ? currentLine + ' ' + word : word;
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
    return lines.join('\n');
  });

  return wrappedParagraphs.join('\n');
}

function replaceTextareasWithDivsForCapture(container) {
  const replacements = [];
  container.querySelectorAll('textarea').forEach((textarea) => {
    const cs = getComputedStyle(textarea);
    const paddingLeft = parseFloat(cs.paddingLeft) || 0;
    const paddingRight = parseFloat(cs.paddingRight) || 0;
    const borderLeft = parseFloat(cs.borderLeftWidth) || 0;
    const borderRight = parseFloat(cs.borderRightWidth) || 0;
    const totalWidth = parseFloat(cs.width) || 0;
    const contentWidthPx = Math.max(
      (totalWidth - paddingLeft - paddingRight - borderLeft - borderRight - 2) * 0.75,
      20
    );
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;

    const div = document.createElement('div');
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
    textarea.insertAdjacentElement('afterend', div);
    textarea.style.display = 'none';
    replacements.push({ textarea, div });
  });
  return replacements;
}

function restoreTextareasAfterCapture(replacements) {
  replacements.forEach(({ textarea, div }) => {
    textarea.style.display = '';
    div.remove();
  });
}

// ========== ACHICAR LA TABLA "MEDIDAS DE DESGASTE" PARA EL PDF ==========
// La tabla tiene 9 columnas (min-width: 1300px en pantalla, con scroll
// horizontal) y no cabe en el ancho de una hoja A4. Un "transform: scale()"
// no sirve aquí: esta versión de html2canvas no lo respeta de forma
// confiable. En su lugar, se reduce el tamaño de fuente real de la tabla y
// se permite que los encabezados se puedan quebrar en varias líneas
// (en vez de una sola línea forzada), probando distintos tamaños hasta que
// el ancho natural de la tabla quepa dentro del espacio disponible. Así no
// se pierde ninguna columna ni dato, aunque el texto quede más chico.
function shrinkWideTableForCapture(wrapper, table, maxWidthPx) {
  const original = {
    wrapperOverflow: wrapper.style.overflow,
    wrapperWidth: wrapper.style.width,
    tableMinWidth: table.style.minWidth,
    tableWidth: table.style.width,
    tableFontSize: table.style.fontSize,
    cellStyles: [],
  };

  const cells = table.querySelectorAll('th, td');
  cells.forEach((cell) => {
    original.cellStyles.push({
      cell,
      whiteSpace: cell.style.whiteSpace,
      padding: cell.style.padding,
    });
    // Permitir que el contenido se quiebre en varias líneas en vez de
    // forzar una sola línea (que es lo que obliga a la tabla a ser tan
    // ancha).
    cell.style.whiteSpace = 'normal';
    cell.style.padding = '4px 3px';
  });

  // Los <input>/<select> dentro de la tabla tienen "min-width: 60px" fijo
  // (definido en el CSS compartido). Eso es lo que realmente le pone un
  // piso al ancho de cada columna, sin importar cuánto se reduzca la
  // fuente. Se reduce también ese mínimo durante la captura.
  const fields = table.querySelectorAll('input, select');
  fields.forEach((field) => {
    original.cellStyles.push({
      cell: field,
      isField: true,
      minWidth: field.style.minWidth,
      padding: field.style.padding,
      fontSize: field.style.fontSize,
    });
    field.style.minWidth = '26px';
    field.style.padding = '2px';
    field.style.fontSize = 'inherit';
  });

  // Ancho objetivo con margen de seguridad del 25%: html2canvas termina
  // renderizando el contenedor capturado más angosto que lo medido en la
  // página en vivo (mismo ajuste que se usa para los textarea).
  const targetWidthPx = maxWidthPx * 0.75;

  wrapper.style.overflow = 'visible';
  wrapper.style.width = targetWidthPx + 'px';
  table.style.minWidth = '0';
  table.style.width = '100%';

  // La tabla ahora ocupa exactamente el ancho del wrapper (targetWidthPx),
  // sin importar la fuente. Se elige una fuente chica acorde al espacio
  // disponible por columna para que, ya angosta, el texto siga siendo
  // legible y quiebre en pocas líneas.
  const widthPerColumn = targetWidthPx / 9;
  const fontSize = widthPerColumn > 90 ? 10 : widthPerColumn > 70 ? 8.5 : 7.5;
  table.style.fontSize = fontSize + 'px';

  return function restoreShrinkWideTable() {
    wrapper.style.overflow = original.wrapperOverflow;
    wrapper.style.width = original.wrapperWidth;
    table.style.minWidth = original.tableMinWidth;
    table.style.width = original.tableWidth;
    table.style.fontSize = original.tableFontSize;
    original.cellStyles.forEach((entry) => {
      if (entry.isField) {
        entry.cell.style.minWidth = entry.minWidth;
        entry.cell.style.padding = entry.padding;
        entry.cell.style.fontSize = entry.fontSize;
      } else {
        entry.cell.style.whiteSpace = entry.whiteSpace;
        entry.cell.style.padding = entry.padding;
      }
    });
  };
}

async function submitGetInspectionForm() {
  showMessage('message', 'Generando PDF y enviando reporte...');

  try {
    const elemento = document.querySelector('.form-container');

    const wrapperMedidas = elemento.querySelector('.table-scroll-wrapper');
    const tablaMedidas = document.getElementById('medidasTable');

    // Ancho de contenido disponible real dentro de .form-container
    // (descontando su padding), que es lo que html2canvas efectivamente
    // captura.
    const csContainer = getComputedStyle(elemento);
    const maxWidthPx =
      elemento.clientWidth -
      (parseFloat(csContainer.paddingLeft) || 0) -
      (parseFloat(csContainer.paddingRight) || 0);

    const restoreTabla = shrinkWideTableForCapture(wrapperMedidas, tablaMedidas, maxWidthPx);

    // Asegurar que los cuadros de texto estén expandidos a su contenido
    // completo, y reemplazarlos por div para que se capturen bien.
    document.querySelectorAll('textarea').forEach(autoExpandTextarea);
    const textareaReplacements = replaceTextareasWithDivsForCapture(elemento);

    const opt = {
      margin: [0.4, 0.3, 0.4, 0.3],
      filename: `Inspeccion_GET_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2.5,
        useCORS: true,
        logging: false,
        allowTaint: true,
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      },
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['.form-section', 'tr', 'img', '.table-scroll-wrapper']
      }
    };

    // CLONAR valores visibles para PDF
    const inputs = elemento.querySelectorAll('input, select');

    inputs.forEach(el => {
      if (el.type === 'checkbox') {
        el.setAttribute('data-html2canvas-ignore', 'true');

        const span = document.createElement('span');
        span.className = 'temp-checkbox';
        span.textContent = el.checked ? '☑' : '☐';

        el.parentNode.appendChild(span);
      } else {
        el.setAttribute('data-original-value', el.value);
        el.setAttribute('value', el.value);
      }
    });

    let pdfBlob;
    try {
      pdfBlob = await html2pdf()
        .from(elemento)
        .set(opt)
        .outputPdf('blob');
    } finally {
      // restaurar la tabla y los textarea
      restoreTabla();
      restoreTextareasAfterCapture(textareaReplacements);
      // limpiar elementos temporales
      document.querySelectorAll('.temp-checkbox').forEach(el => el.remove());
    }
    // Subir y enviar
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

    const res = await fetch("https://komatsu-api.vercel.app/api/sendEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Reporte de Inspección GET - Komatsu",
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