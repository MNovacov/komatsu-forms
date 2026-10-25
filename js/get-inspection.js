// get-inspection.js — Inspección de GET (formato estandarizado de la planilla 437 / 438)
// El informe se GUARDA como PDF en el dispositivo (ya no se envía por correo).

// ========== PARÁMETROS DE LA PLANILLA ==========
const LARGO_NUEVO_MM = 220;   // largo de cuchilla nueva (la planilla divide por 220)
const LARGO_MINIMO_MM = 110;  // "Medida desde centro de perno a borde de cuchilla mínima"
// Desgaste estimado (mm por día) según lugar de trabajo — mismos valores de la planilla.
const TASA_DESGASTE = { Mina: 14.5, Botadero: 11.5, Ripios: 10 };

const PUNTOS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const GRUPOS = [
  { key: "cabeza", titulo: "Cabeza de Perno con Desgaste (Delante)", opts: ["SI", "NO"], def: "NO" },
  { key: "cuchilla", titulo: "Cuchilla desgastada Soporte de deslizadera", opts: ["SI", "NO"], def: "NO" },
  { key: "pernos", titulo: "Condición de Pernos y Tuercas (Atrás)", opts: ["B", "M"], def: "M" },
];

// Hoja A4 del PDF (96 dpi)
const PAGE_W = 794;
const PAGE_H = 1123;

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

function parseISO(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
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

// ========== INICIALIZACIÓN ==========
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("fecha").value = todayLocalISO();

  buildMedidasRows();
  initCondiciones();
  initAutoGrow();
  initProyecciones();
  initPhotoSlots();
  recalcular();

  document.getElementById("btnGuardar").addEventListener("click", saveReport);
  document.getElementById("getInspectionForm").addEventListener("submit", (e) => {
    e.preventDefault();
    saveReport();
  });
});

// ---------- Condición Lado LH / RH / Base / Soportes (colores B-DL verde, DM amarillo, DA rojo) ----------
function colorClassCondicion(value) {
  if (value === "DM") return "c-y";
  if (value === "DA" || value === "R") return "c-r";
  return "c-g"; // B y DL
}

function initCondiciones() {
  document.querySelectorAll("td[data-cond]").forEach((td) => {
    const sel = td.querySelector("select");
    const paint = () => {
      td.classList.remove("c-g", "c-y", "c-r");
      td.classList.add(colorClassCondicion(sel.value));
    };
    sel.addEventListener("change", paint);
    paint();
  });
}

// ---------- Cuadro de texto que crece según lo escrito ----------
function autoGrow(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

function initAutoGrow() {
  document.querySelectorAll("#sheet textarea").forEach((ta) => {
    autoGrow(ta);
    ta.addEventListener("input", () => autoGrow(ta));
  });
}

// ========== TABLA DE MEDIDAS DE DESGASTE (puntos A–H) ==========
function buildMedidasRows() {
  const tbody = document.querySelector("#tablaMedidas tbody");

  PUNTOS.forEach((p) => {
    const tr = document.createElement("tr");
    tr.dataset.punto = p;

    const celdas = [];
    celdas.push(`<td class="fig" data-label="Identif. Fig N°1">${p}</td>`);
    celdas.push(`<td class="c110" data-label="Medida desde centro de perno a borde de cuchilla mínima">${LARGO_MINIMO_MM} mm</td>`);
    celdas.push(`<td data-label="Medida tomada (mm)"><input type="number" id="medida_${p}" inputmode="decimal" step="any" min="0"></td>`);
    celdas.push(`<td data-label="Proyección de desgaste estimado (mm)"><input type="number" id="proy_${p}" inputmode="decimal" step="any" min="0"></td>`);
    celdas.push(`<td class="pct" id="proyPct_${p}" data-label="Proyección de desgaste estimado %"></td>`);
    celdas.push(`<td class="pct" id="real_${p}" data-label="Promedio de desgaste real %"></td>`);

    GRUPOS.forEach((g) => {
      celdas.push(`<td class="optgrp">${g.titulo}</td>`);
      g.opts.forEach((o) => {
        celdas.push(
          `<td class="opt" data-g="${g.key}" data-v="${o}" data-label="${g.titulo}: ${o}">` +
          `<span class="lab">${o}</span><span class="x"></span></td>`
        );
      });
    });

    tr.innerHTML = celdas.join("");
    tbody.appendChild(tr);

    // valores por defecto de la planilla: NO / NO / M
    GRUPOS.forEach((g) => (tr.dataset[g.key] = g.def));
    renderOpciones(tr);

    tr.querySelectorAll(".opt").forEach((td) => {
      td.addEventListener("click", () => {
        tr.dataset[td.dataset.g] = td.dataset.v;
        renderOpciones(tr);
      });
    });

    tr.querySelector(`#medida_${p}`).addEventListener("input", recalcular);
    const proy = tr.querySelector(`#proy_${p}`);
    proy.addEventListener("input", () => {
      proy.dataset.auto = "0"; // el usuario lo escribió a mano: dejamos de pisarlo
      recalcular();
    });
  });
}

// Marca con "x" la opción elegida de cada grupo (SI/NO, SI/NO, B/M)
function renderOpciones(tr) {
  tr.querySelectorAll(".opt").forEach((td) => {
    const elegido = tr.dataset[td.dataset.g] === td.dataset.v;
    td.classList.toggle("sel", elegido);
    td.querySelector(".x").textContent = elegido ? "x" : "";
  });
}

// ========== CÁLCULOS (mismas fórmulas de la planilla) ==========
function pctClass(v) {
  // verde ≥ 76 %, amarillo 65–75 %, rojo ≤ 64 %
  if (v >= 0.76) return "p-g";
  if (v >= 0.65) return "p-y";
  return "p-r";
}

function setPct(td, value) {
  td.classList.remove("p-g", "p-y", "p-r");
  if (value === null || isNaN(value)) {
    td.textContent = "";
    return;
  }
  td.textContent = `${Math.round(value * 100)}%`;
  td.classList.add(pctClass(value));
}

function initProyecciones() {
  const proyCambio = document.getElementById("proyeccionCambio");
  proyCambio.addEventListener("input", () => (proyCambio.dataset.auto = "0"));

  ["ultimoCambio", "fecha", "lugarTrabajo"].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("input", recalcular);
    el.addEventListener("change", recalcular);
  });
}

// Proyección de desgaste estimado (mm) = 220 − días desde el último cambio × tasa del lugar
function recalcular() {
  const ultimo = parseISO(document.getElementById("ultimoCambio").value);
  const fecha = parseISO(document.getElementById("fecha").value) || new Date();
  const tasa = TASA_DESGASTE[document.getElementById("lugarTrabajo").value] || TASA_DESGASTE.Mina;

  let proyMmAuto = null;
  if (ultimo) {
    const dias = Math.max(0, Math.round((fecha - ultimo) / 86400000));
    proyMmAuto = Math.max(0, Math.round(LARGO_NUEVO_MM - dias * tasa));
  }

  // Proyección próximo cambio = último cambio + días hasta llegar al largo mínimo
  const proyCambio = document.getElementById("proyeccionCambio");
  if (proyCambio.dataset.auto !== "0") {
    if (ultimo) {
      const d = new Date(ultimo);
      d.setDate(d.getDate() + Math.ceil((LARGO_NUEVO_MM - LARGO_MINIMO_MM) / tasa));
      proyCambio.value = toISO(d);
    } else {
      proyCambio.value = "";
    }
  }

  let suma = 0;
  let n = 0;
  PUNTOS.forEach((p) => {
    const inputMedida = document.getElementById(`medida_${p}`);
    const inputProy = document.getElementById(`proy_${p}`);

    if (inputProy.dataset.auto !== "0") {
      inputProy.value = proyMmAuto === null ? "" : String(proyMmAuto);
    }

    const medida = parseFloat(inputMedida.value);
    const proy = parseFloat(inputProy.value);

    setPct(document.getElementById(`proyPct_${p}`), isNaN(proy) ? null : proy / LARGO_NUEVO_MM);

    if (isNaN(medida)) {
      setPct(document.getElementById(`real_${p}`), null);
    } else {
      const real = medida / LARGO_NUEVO_MM;
      setPct(document.getElementById(`real_${p}`), real);
      suma += real;
      n++;
    }
  });

  // Promedio de desgaste: solo de los puntos que tienen medida tomada
  setPct(document.getElementById("promedioDesgaste"), n ? suma / n : null);
}


// ========== FOTOS (Equipo / Condición) ==========
const PHOTO_MAX_SIDE = 1200; // se reducen para que el PDF pese poco
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
      renderPhotoBox(currentPhotoBox, await resizeImageToDataUrl(file, PHOTO_MAX_SIDE));
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

// Hoja extra del PDF con las fotos (solo si se agregó alguna): título + logo y las dos fotos, una bajo la otra.
function addPhotoPage(root, pages, values) {
  if (!document.querySelector("#photoSection .ph-box.has-img")) return;

  const page = document.createElement("div");
  page.className = "pdf-page";
  const wrap = document.createElement("div");
  wrap.appendChild(document.querySelector("#sheetBody .top").cloneNode(true));

  const titulo = document.createElement("div");
  titulo.className = "bar fotos-title";
  titulo.style.margin = "14px 0 6px";
  titulo.textContent = "Set Fotográfico";
  wrap.appendChild(titulo);

  const table = document.createElement("table");
  table.className = "gt fotos";
  [["fotoEquipo", "Equipo"], ["fotoCondicion", "Condición"]].forEach(([slot, label]) => {
    const box = document.querySelector(`#photoSection .ph-box[data-slot="${slot}"]`);
    const cap = table.insertRow().insertCell();
    cap.className = "cap";
    cap.textContent = label;

    const cell = table.insertRow().insertCell();
    cell.className = "ph";
    const clone = box.cloneNode(true);
    clone.querySelectorAll(".no-pdf").forEach((n) => n.remove());
    clone.style.background = "#ffffff";
    clone.style.cursor = "default";
    clone.style.height = "430px";
    cell.appendChild(clone);
  });
  wrap.appendChild(table);

  page.appendChild(wrap);
  root.appendChild(page);
  pages.push(page);

  fieldsToText(wrap, values); // convierte el título (input) a texto
}

// ========== ARMADO DEL PDF (una hoja A4, igual a la planilla) ==========

// Valores actuales de los campos, por id (los clones no conservan lo escrito).
function collectValues() {
  const values = {};
  document.querySelectorAll("#sheet input, #sheet select, #sheet textarea").forEach((el) => {
    if (!el.id) return;
    let value = el.value;
    if (el.tagName === "SELECT" && el.selectedOptions[0]) value = el.selectedOptions[0].text;
    values[el.id] = { value };
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

// Reemplaza cada campo por texto plano con los saltos de línea calculados a mano.
function fieldsToText(body, values) {
  body.querySelectorAll("datalist").forEach((d) => d.remove());

  body.querySelectorAll("input, select, textarea").forEach((ctrl) => {
    const v = values[ctrl.id] || { value: "" };
    let text = v.value || "";
    if (ctrl.type === "date") text = formatDateCL(text);

    // Campo en línea (Horómetro): solo el texto
    if (ctrl.classList.contains("inl")) {
      const span = document.createElement("span");
      span.className = "pdfv-inl";
      span.textContent = text;
      ctrl.replaceWith(span);
      return;
    }

    const host = ctrl.closest("td, .title-bar, .obs-box");
    const hcs = getComputedStyle(host);
    const ccs = getComputedStyle(ctrl);
    const avail = host.clientWidth - parseFloat(hcs.paddingLeft) - parseFloat(hcs.paddingRight);
    const font = `${ccs.fontWeight} ${ccs.fontSize} ${ccs.fontFamily}`;
    const lines = wrapLines(text, Math.max(avail * 0.97 - 1, 20), font);
    const lh = Math.max(15, Math.round(parseFloat(ccs.fontSize) * 1.18));

    const holder = document.createElement("div");
    holder.className = "pdfv";
    holder.style.fontSize = ccs.fontSize;
    holder.style.fontWeight = ccs.fontWeight;
    holder.style.textAlign = ccs.textAlign === "start" ? "left" : ccs.textAlign;
    (lines.length ? lines : [""]).forEach((l) => {
      const ln = document.createElement("div");
      ln.className = "ln";
      ln.style.lineHeight = lh + "px";
      ln.style.minHeight = lh + "px";
      ln.textContent = l === "" ? "\u00a0" : l;
      holder.appendChild(ln);
    });
    ctrl.replaceWith(holder);
  });
}

// Alto (px) hasta donde llega el contenido de una hoja (incluye el margen inferior)
function contentBottom(pageEl) {
  const last = pageEl.firstElementChild.lastElementChild;
  if (!last) return 0;
  return last.getBoundingClientRect().bottom - pageEl.getBoundingClientRect().top + 22;
}

function buildPdfPages() {
  const values = collectValues();

  const root = document.createElement("div");
  root.className = "pdf-root";
  const first = document.createElement("div");
  first.className = "pdf-page";

  const body = document.getElementById("sheetBody").cloneNode(true);
  body.removeAttribute("id");
  body.querySelectorAll(".no-pdf").forEach((n) => n.remove());

  first.appendChild(body);
  root.appendChild(first);
  document.body.appendChild(root); // debe estar en el documento para medir los textos

  fieldsToText(body, values);

  // --- Paginación: si las observaciones no caben en la hoja, siguen en otra (cortando entre líneas) ---
  const pages = [first];
  const horo = body.querySelector(".horo");
  const fits = (pg) => contentBottom(pg) <= PAGE_H;

  if (fits(first)) {
    addPhotoPage(root, pages, values);
    return { root, pages };
  }

  horo.remove(); // el Horómetro va al final de la última hoja
  let cur = first;
  let holder = body.querySelector(".obs-box .pdfv");

  for (let guard = 0; guard < 20; guard++) {
    const moved = [];
    while (!fits(cur) && holder.children.length > 1) moved.unshift(holder.removeChild(holder.lastElementChild));
    // las observaciones ya caben pero el Horómetro no: lo acompaña la última línea
    if (!moved.length && holder.children.length > 1) moved.unshift(holder.removeChild(holder.lastElementChild));

    const next = document.createElement("div");
    next.className = "pdf-page";
    const wrap = document.createElement("div");
    wrap.innerHTML = '<div class="obs-label" style="width:30%">Observaciones (continuación)</div><div class="obs-box"></div>';
    next.appendChild(wrap);
    root.appendChild(next);
    pages.push(next);

    const nextHolder = holder.cloneNode(false);
    moved.forEach((l) => nextHolder.appendChild(l));
    wrap.querySelector(".obs-box").appendChild(nextHolder);

    if (!moved.length) {
      wrap.removeChild(wrap.firstElementChild);
      wrap.removeChild(wrap.firstElementChild);
    }
    wrap.appendChild(horo);
    cur = next;
    holder = nextHolder;
    if (fits(cur)) break;
    horo.remove();
  }
  addPhotoPage(root, pages, values);
  return { root, pages };
}

// jsPDF vacío (A4) obtenido desde la propia API de html2pdf.
async function createBlankPdf() {
  const dummy = document.createElement("div");
  dummy.style.cssText = "width:4px;height:4px;background:#fff;position:absolute;left:-9999px;top:0;";
  document.body.appendChild(dummy);
  try {
    return await html2pdf()
      .set({
        margin: 0,
        html2canvas: { scale: 1, logging: false },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait", compress: true },
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
    ["numeroInterno", "Numero Interno"],
    ["reportadoPor", "Reportado Por"],
    ["horometro", "Horometro"],
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

  // html2canvas captura relativo al scroll de la página: subimos al tope durante la captura.
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
    const pageWIn = pdf.internal.pageSize.getWidth();
    const pageHIn = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < built.pages.length; i++) {
      const pageEl = built.pages[i];
      const canvas = await html2pdf()
        .set({
          margin: 0,
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff",
            // Ventana virtual del tamaño de la hoja, sin importar la pantalla real
            windowWidth: PAGE_W,
            windowHeight: Math.max(PAGE_H, pageEl.offsetHeight),
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,
          },
        })
        .from(pageEl)
        .toCanvas()
        .get("canvas");

      if (i > 0) pdf.addPage();
      const h = Math.min(canvas.height, Math.floor((pageHIn * canvas.width) / pageWIn));
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = h;
      const ctx = pageCanvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(canvas, 0, 0, canvas.width, h, 0, 0, canvas.width, h);
      pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageWIn, (h * pageWIn) / canvas.width);
    }

    const interno = slugify(document.getElementById("numeroInterno").value);
    const fecha = document.getElementById("fecha").value || todayLocalISO();
    const filename = `Inspeccion_GET_${interno}_${fecha}.pdf`;

    pdf.setProperties({ title: `Inspección de GET - Equipo ${document.getElementById("numeroInterno").value}` });
    pdf.save(filename);

    showMessage(`✅ Inspección guardada: ${filename}`, false, true);
  } catch (err) {
    console.error("❌ Error al generar el PDF:", err);
    showMessage(`❌ Error: ${err.message}`, true);
  } finally {
    if (built) built.root.remove();
    window.scrollTo(scrollX0, scrollY0);
    btn.disabled = false;
  }
}
