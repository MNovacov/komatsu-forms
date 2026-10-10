// fault-report.js — Informe de Falla (formato "Informe de Falla 2.0")
// El informe se GUARDA como PDF en el dispositivo (ya no se envía por correo).

// ========== DATOS DE EQUIPOS (autocompleta serie y modelo) ==========
// Modelo editable por el usuario; solo es una sugerencia inicial.
const EQUIPOS = {
  "437": { serie: "50110", modelo: "WD900-3" },
  "438": { serie: "50111", modelo: "WD900-3" },
  "511": { serie: "34208", modelo: "HD785-7" },
  "512": { serie: "34239", modelo: "HD785-7" },
  "513": { serie: "34245", modelo: "HD785-7" },
  "514": { serie: "34254", modelo: "HD785-7" },
  "515": { serie: "34292", modelo: "HD785-7" },
  "516": { serie: "34294", modelo: "HD785-7" },
};

// ========== MEDIDAS DE LA HOJA DEL PDF (Carta, 96 dpi) ==========
const PAGE_W = 816;          // 8.5 in
const PAGE_H = 1056;         // 11 in
const BODY_LIMIT = 975;      // alto máximo (px) hasta donde puede llegar el contenido
const PHOTO_MAX_SIDE = 1200; // las fotos se reducen a este lado máximo para que el PDF pese poco

// ========== UTILIDADES ==========
function todayLocalISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatDateCL(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function showMessage(text, isError = false, autoHide = false) {
  const el = document.getElementById("message");
  el.textContent = text;
  el.className = isError ? "error" : "success";
  if (autoHide) setTimeout(() => el.classList.add("hidden"), 9000);
}

function hideMessage() {
  document.getElementById("message").classList.add("hidden");
}

// ========== INICIALIZACIÓN ==========
document.addEventListener("DOMContentLoaded", () => {
  const hoy = todayLocalISO();
  document.getElementById("fechaInforme").value = hoy;
  document.getElementById("fechaFalla").value = hoy;

  initEquipoAutofill();
  initAutoGrowTextareas();
  initPhotoSlots();

  document.getElementById("btnGuardar").addEventListener("click", saveReport);
  document.getElementById("faultReportForm").addEventListener("submit", (e) => {
    e.preventDefault();
    saveReport();
  });
});

// ---------- N° de equipo -> serie y modelo ----------
function initEquipoAutofill() {
  const equipo = document.getElementById("nEquipo");
  const serie = document.getElementById("serieEquipo");
  const modelo = document.getElementById("modeloEquipo");

  // Si el usuario escribe a mano en estos campos, dejamos de pisarlos.
  [serie, modelo].forEach((el) =>
    el.addEventListener("input", () => (el.dataset.auto = "0"))
  );

  function autoSet(el, value) {
    if (!el.value || el.dataset.auto === "1") {
      el.value = value;
      el.dataset.auto = "1";
    }
  }

  equipo.addEventListener("input", () => {
    const data = EQUIPOS[equipo.value.trim()];
    if (!data) return;
    autoSet(serie, data.serie);
    autoSet(modelo, data.modelo);
  });
}

// ---------- Cuadros de texto que crecen según lo escrito ----------
function autoGrow(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

function initAutoGrowTextareas() {
  document.querySelectorAll("#paper textarea").forEach((ta) => {
    autoGrow(ta);
    ta.addEventListener("input", () => autoGrow(ta));
  });
}

// ========== FOTOS ==========
let currentPhotoBox = null;

function renderPhotoBox(box, dataUrl) {
  box.innerHTML = "";
  if (dataUrl) {
    box.classList.add("has-img");
    const img = document.createElement("img");
    img.src = dataUrl;
    img.alt = "";
    box.appendChild(img);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "ph-del no-pdf";
    del.textContent = "×";
    del.title = "Quitar foto";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      renderPhotoBox(box, null);
    });
    box.appendChild(del);
  } else {
    box.classList.remove("has-img");
    const hint = document.createElement("span");
    hint.className = "ph-hint no-pdf";
    hint.textContent = "+ Agregar foto";
    box.appendChild(hint);
  }
}

function initPhotoSlots() {
  const input = document.getElementById("photoUpload");

  document.querySelectorAll(".ph-box").forEach((box) => {
    renderPhotoBox(box, null);
    box.addEventListener("click", () => {
      currentPhotoBox = box;
      input.click();
    });
  });

  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    input.value = "";
    if (!file || !currentPhotoBox) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor, seleccione solo archivos de imagen.");
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file, PHOTO_MAX_SIDE);
      renderPhotoBox(currentPhotoBox, dataUrl);
    } catch (err) {
      console.error(err);
      alert("No se pudo cargar la imagen. Intente con otra foto.");
    }
  });
}

// Reduce la foto (manteniendo proporción) y la devuelve como JPEG en base64.
function resizeImageToDataUrl(file, maxSide) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, maxSide / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

// ========== ARMADO DEL PDF ==========

// Valores actuales del formulario, por id (los clones no conservan lo escrito).
function collectValues() {
  const values = {};
  document.querySelectorAll("#paper input, #paper textarea, #paper select").forEach((el) => {
    if (!el.id) return;
    values[el.id] = { value: el.value, checked: el.checked };
  });
  return values;
}

// Parte un texto en líneas que caben en maxWidthPx (midiendo con la fuente real).
function wrapLines(text, maxWidthPx, font) {
  const canvas = wrapLines._c || (wrapLines._c = document.createElement("canvas"));
  const ctx = canvas.getContext("2d");
  ctx.font = font;
  const out = [];

  String(text).split(/\r?\n/).forEach((paragraph) => {
    if (paragraph === "") {
      out.push("");
      return;
    }
    let line = "";
    paragraph.split(" ").forEach((word) => {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width <= maxWidthPx) {
        line = test;
        return;
      }
      if (line) out.push(line);
      line = "";
      if (ctx.measureText(word).width <= maxWidthPx) {
        line = word;
      } else {
        // palabra más ancha que el cuadro: se corta caracter a caracter
        let chunk = "";
        for (const ch of word) {
          if (chunk && ctx.measureText(chunk + ch).width > maxWidthPx) {
            out.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        line = chunk;
      }
    });
    out.push(line);
  });
  return out;
}

// Reemplaza cada campo del bloque (ya insertado en la hoja) por texto plano,
// con los saltos de línea calculados a mano para que nada se corte.
function fieldsToText(block, values) {
  block.querySelectorAll("datalist").forEach((d) => d.remove());

  block.querySelectorAll("input, textarea, select").forEach((ctrl) => {
    const v = values[ctrl.id] || { value: "", checked: false };

    if (ctrl.type === "checkbox") {
      const box = document.createElement("span");
      box.className = "cb";
      box.textContent = v.checked ? "X" : "";
      ctrl.replaceWith(box);
      return;
    }

    let text = v.value || "";
    if (ctrl.type === "date") text = formatDateCL(text);

    const td = ctrl.closest("td");
    const cs = getComputedStyle(td);
    const avail =
      td.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const lines = wrapLines(text, Math.max(avail * 0.97 - 1, 20), font);

    const holder = document.createElement("div");
    holder.className = "pdfv";
    (lines.length ? lines : [""]).forEach((l) => {
      const ln = document.createElement("div");
      ln.className = "ln";
      ln.textContent = l === "" ? "\u00a0" : l;
      holder.appendChild(ln);
    });
    ctrl.replaceWith(holder);
  });
}

// Construye las hojas Carta (fuera de pantalla): encabezado repetido, secciones
// en orden, y salto automático a una hoja nueva cuando no caben.
function buildPdfPages() {
  const values = collectValues();
  const root = document.createElement("div");
  root.className = "pdf-root";
  document.body.appendChild(root);

  const pages = [];
  function newPage() {
    const el = document.createElement("div");
    el.className = "pdf-page";

    const hdr = document.getElementById("docHeader").cloneNode(true);
    hdr.removeAttribute("id");
    hdr.querySelector(".h-page").textContent = String(pages.length + 1);
    el.appendChild(hdr);

    const body = document.createElement("div");
    body.className = "pdf-body";
    el.appendChild(body);

    root.appendChild(el);
    const page = { el, body };
    pages.push(page);
    return page;
  }

  let page = newPage();
  const bottomOf = () => {
    const last = page.body.lastElementChild;
    return last
      ? last.getBoundingClientRect().bottom - page.el.getBoundingClientRect().top
      : 0;
  };
  const fits = () => bottomOf() <= BODY_LIMIT;

  function placeBlock(block) {
    page.body.appendChild(block);
    if (fits()) return;

    // Bloque que no es de texto: pasa entero a la hoja siguiente.
    if (!block.classList.contains("sec-text")) {
      if (page.body.children.length > 1) {
        page.body.removeChild(block);
        page = newPage();
        page.body.appendChild(block);
      }
      return;
    }

    // Bloque de texto: se reparte por líneas entre hojas.
    let cur = block;
    for (;;) {
      const box = cur.querySelector(".pdfv");
      const moved = [];
      while (!fits() && box.children.length > 1) {
        moved.unshift(box.lastElementChild);
        box.removeChild(box.lastElementChild);
      }
      if (!moved.length) {
        // Cabe completo, o es una sola línea que no se puede partir
        if (fits() || page.body.children.length <= 1) return;
        page.body.removeChild(cur);
        page = newPage();
        page.body.appendChild(cur);
        if (fits()) return;
        continue;
      }

      if (box.children.length < 2 && page.body.children.length > 1) {
        // quedarían muy pocas líneas: mejor mover todo el bloque a la hoja nueva
        moved.forEach((l) => box.appendChild(l));
        page.body.removeChild(cur);
        page = newPage();
        page.body.appendChild(cur);
        if (fits()) return;
        continue;
      }

      const cont = cur.cloneNode(true);
      cont.querySelector(".pdfv").innerHTML = "";
      const title = cont.querySelector(".sec-title");
      title.appendChild(document.createTextNode(" (continuación)"));
      moved.forEach((l) => cont.querySelector(".pdfv").appendChild(l));
      page = newPage();
      page.body.appendChild(cont);
      cur = cont;
      if (fits()) return;
    }
  }

  document.querySelectorAll("#docSections > .sec").forEach((src) => {
    const block = src.cloneNode(true);
    block.removeAttribute("id");
    block.querySelectorAll(".no-pdf").forEach((n) => n.remove());
    // En el PDF los recuadros de foto vacíos quedan en blanco (sin el fondo celeste del formulario)
    block.querySelectorAll(".ph-box").forEach((b) => {
      b.style.background = "#ffffff";
      b.style.cursor = "default";
    });
    // Igual que en el formato Word, la sección 11 parte en hoja nueva
    if (src.dataset.newpage && page.body.children.length > 0) page = newPage();

    page.body.appendChild(block);
    fieldsToText(block, values);
    page.body.removeChild(block);
    placeBlock(block);
  });

  return { root, pages };
}

// jsPDF vacío (Carta) obtenido desde la propia API de html2pdf.
async function createBlankPdf() {
  const dummy = document.createElement("div");
  dummy.style.cssText =
    "width:4px;height:4px;background:#fff;position:absolute;left:-9999px;top:0;";
  document.body.appendChild(dummy);
  try {
    return await html2pdf()
      .set({
        margin: 0,
        html2canvas: { scale: 1, logging: false },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait", compress: true },
      })
      .from(dummy)
      .toPdf()
      .get("pdf");
  } finally {
    dummy.remove();
  }
}

// ========== GUARDAR INFORME ==========
async function saveReport() {
  const required = [
    ["faena", "Faena"],
    ["nEquipo", "N° Equipo"],
    ["realizadoPor", "Informe Realizado Por"],
  ];
  for (const [id, label] of required) {
    const el = document.getElementById(id);
    if (!el.value.trim()) {
      showMessage(`Por favor complete el campo: ${label}`, true);
      el.focus();
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
  }

  const btn = document.getElementById("btnGuardar");
  btn.disabled = true;
  showMessage("Generando PDF...");

  // html2canvas captura relativo al scroll de la página: si el usuario está
  // más abajo, las hojas salen en blanco. Subimos al tope durante la captura.
  const scrollX0 = window.scrollX;
  const scrollY0 = window.scrollY;
  window.scrollTo(0, 0);

  let built = null;
  try {
    if (typeof html2pdf !== "function") {
      throw new Error("No se cargó la librería de PDF (html2pdf). Revise su conexión y recargue la página.");
    }

    built = buildPdfPages();
    const pdf = await createBlankPdf();

    for (let i = 0; i < built.pages.length; i++) {
      const canvas = await html2pdf()
        .set({
          margin: 0,
          // Mismo formato que el PDF final (Carta) para que la hoja se capture a su ancho real
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff",
            // La hoja se renderiza siempre en una ventana virtual de 816x1056,
            // sin importar el tamaño real de la pantalla (escritorio o celular).
            windowWidth: PAGE_W,
            windowHeight: PAGE_H,
            // Origen de captura fijo: sin esto la hoja salía corrida a la izquierda
            // cuando la ventana real no medía exactamente 816 px.
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,
          },
        })
        .from(built.pages[i].el)
        .toCanvas()
        .get("canvas");

      if (i > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 8.5, 11);
    }

    const faena = slugify(document.getElementById("faena").value);
    const equipo = slugify(document.getElementById("nEquipo").value);
    const fecha = document.getElementById("fechaInforme").value || todayLocalISO();
    const filename = `Informe_de_Falla_${faena}_Equipo_${equipo}_${fecha}.pdf`;

    pdf.setProperties({ title: `Informe de Falla - Equipo ${document.getElementById("nEquipo").value}` });
    pdf.save(filename);

    showMessage(`✅ Informe guardado: ${filename}`, false, true);
  } catch (err) {
    console.error("❌ Error al generar el PDF:", err);
    showMessage(`❌ Error: ${err.message}`, true);
  } finally {
    if (built) built.root.remove();
    window.scrollTo(scrollX0, scrollY0);
    btn.disabled = false;
  }
}
