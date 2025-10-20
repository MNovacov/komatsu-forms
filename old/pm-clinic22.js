// pm-clinic2.js VERSIÓN COMPRIMIDA

document.addEventListener('DOMContentLoaded', function() {
    emailjs.init("vMo5DF4w_J8kx2s0i");
    document.getElementById('fechaInspeccion').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('valoresEstandarForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitValoresEstandarForm();
    });
});

function showMessage(message, isError = false) {
    let messageElement = document.getElementById('message');
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'message';
        messageElement.style.cssText = 'padding:12px 15px;margin:15px 0;border-radius:5px;text-align:center;font-weight:bold;';
        document.querySelector('.form-actions').insertBefore(messageElement, document.querySelector('.form-actions').firstChild);
    }
    
    messageElement.textContent = message;
    messageElement.style.backgroundColor = isError ? '#f8d7da' : '#d4edda';
    messageElement.style.color = isError ? '#721c24' : '#155724';
    messageElement.style.border = isError ? '1px solid #f5c6cb' : '1px solid #c3e6cb';
    messageElement.style.display = 'block';
    
    setTimeout(() => { messageElement.style.display = 'none'; }, 5000);
}

function collectBasicFormData() {
    return {
        m: document.getElementById('modeloMaquina').value,
        s: document.getElementById('numeroSerie').value,
        f: document.getElementById('fechaInspeccion').value,
        i: document.getElementById('inspector').value
    };
}

// FUNCIÓN ULTRA COMPRIMIDA
function getAllFormData() {
    const basic = collectBasicFormData();
    const data = { ...basic, t: new Date().toISOString() };
    
    // Solo secciones con datos ingresados
    const sections = ['tabla-motor', 'presion-aceite', 'velocidad-traslado', 'cambio-automatico-vacio',
                     'cambio-automatico-cargado', 'modo-economia-vacio', 'modo-economia-cargado',
                     'control-cambio', 'fuerza-operacion', 'presion-convertidor', 'frenos-suspension',
                     'frenos-controles', 'distancias-parada', 'descarga-levante'];
    
    sections.forEach(sec => {
        const secData = collectSectionDataCompressed(sec);
        if (secData.length > 0) {
            data[sec] = secData;
        }
    });
    
    return data;
}

function collectSectionDataCompressed(sectionClass) {
    const section = document.querySelector(`.${sectionClass}`);
    if (!section) return [];
    
    const rows = section.querySelectorAll('tbody tr');
    const data = [];
    
    rows.forEach(row => {
        const input = row.querySelector('input[type="text"]');
        if (input && input.value.trim()) {
            const cells = Array.from(row.querySelectorAll('td'));
            data.push({
                i: cells[0]?.textContent?.trim().substring(0, 30) || '', // Item acortado
                c: cells[1]?.textContent?.trim().substring(0, 40) || '', // Condiciones acortado
                u: cells[2]?.textContent?.trim() || '',
                e: cells[3]?.textContent?.trim() || '',
                p: cells[4]?.textContent?.trim() || '',
                r: input.value
            });
        }
    });
    
    return data;
}

// FUNCIÓN PARA GENERAR EMAIL COMPRIMIDO
function generateCompactEmail(formData) {
    let html = `<div style="font-family:Arial;max-width:700px;margin:0 auto;">
<div style="text-align:center;border-bottom:2px solid #0033A0;padding-bottom:10px;margin-bottom:15px;">
<h1 style="color:#0033A0;margin:0;font-size:20px;">HD785-7 - INSPECCIÓN</h1>
</div>
<div style="background:#f8f9fa;padding:10px;margin-bottom:15px;border-left:4px solid #0033A0;">
<h3 style="color:#0033A0;margin:0 0 8px 0;font-size:16px;">INFORMACIÓN</h3>
<table style="width:100%;font-size:13px;">
<tr><td style="padding:4px;font-weight:bold;width:100px;">Modelo:</td><td style="padding:4px;">${formData.m}</td></tr>
<tr><td style="padding:4px;font-weight:bold;">Serie:</td><td style="padding:4px;">${formData.s}</td></tr>
<tr><td style="padding:4px;font-weight:bold;">Fecha:</td><td style="padding:4px;">${formData.f}</td></tr>
<tr><td style="padding:4px;font-weight:bold;">Inspector:</td><td style="padding:4px;">${formData.i}</td></tr>
</table>
</div>`;

    let totalItems = 0;
    const sectionNames = {
        'tabla-motor': 'MOTOR - VALORES ESTÁNDAR',
        'presion-aceite': 'PRESIÓN DE ACEITE',
        'velocidad-traslado': 'VELOCIDAD TRASLADO',
        'cambio-automatico-vacio': 'CAMBIO VACÍO',
        'cambio-automatico-cargado': 'CAMBIO CARGADO',
        'modo-economia-vacio': 'MODO ECO VACÍO',
        'modo-economia-cargado': 'MODO ECO CARGADO',
        'control-cambio': 'CONTROL CAMBIO',
        'fuerza-operacion': 'FUERZA OPERACIÓN',
        'presion-convertidor': 'PRESIÓN CONVERTIDOR',
        'frenos-suspension': 'FRENOS SUSPENSIÓN',
        'frenos-controles': 'FRENOS CONTROLES',
        'distancias-parada': 'DISTANCIAS PARADA',
        'descarga-levante': 'DESCARGA LEVANTE'
    };

    // Solo agregar secciones con datos
    Object.keys(sectionNames).forEach(sectionKey => {
        if (formData[sectionKey] && formData[sectionKey].length > 0) {
            html += `<div style="margin:12px 0;">
<h4 style="color:#0033A0;margin:0 0 6px 0;font-size:14px;border-bottom:1px solid #ddd;padding-bottom:3px;">${sectionNames[sectionKey]}</h4>
<table style="width:100%;border-collapse:collapse;font-size:10px;">
<thead><tr style="background:#f0f0f0;">
<th style="border:1px solid #ccc;padding:2px;text-align:left;width:25%;">Item</th>
<th style="border:1px solid #ccc;padding:2px;text-align:center;width:10%;">Unidad</th>
<th style="border:1px solid #ccc;padding:2px;text-align:center;width:15%;">Estándar</th>
<th style="border:1px solid #ccc;padding:2px;text-align:center;width:15%;">Permisible</th>
<th style="border:1px solid #ccc;padding:2px;text-align:center;width:15%;">Resultado</th>
</tr></thead><tbody>`;

            formData[sectionKey].forEach(row => {
                html += `<tr>
<td style="border:1px solid #ccc;padding:2px;">${row.i}</td>
<td style="border:1px solid #ccc;padding:2px;text-align:center;">${row.u}</td>
<td style="border:1px solid #ccc;padding:2px;text-align:center;">${row.e}</td>
<td style="border:1px solid #ccc;padding:2px;text-align:center;">${row.p}</td>
<td style="border:1px solid #ccc;padding:2px;text-align:center;font-weight:bold;background:#e8f4ff;">${row.r}</td>
</tr>`;
                totalItems++;
            });

            html += `</tbody></table></div>`;
        }
    });

    html += `<div style="margin-top:15px;padding-top:10px;border-top:1px solid #ccc;text-align:center;color:#666;font-size:11px;">
<p><strong>RESUMEN</strong></p>
<p>Máquina: ${formData.m} | Serie: ${formData.s}</p>
<p>Fecha: ${formData.f} | Inspector: ${formData.i}</p>
<p>Total ítems: ${totalItems}</p>
<p><em>Generado: ${new Date().toLocaleDateString()}</em></p>
</div></div>`;

    return html;
}

// FUNCIÓN PRINCIPAL CON CONTROL DE TAMAÑO
function submitValoresEstandarForm() {
    // Lista de emails para prueba
    const emailsPrueba = [
        'pedro.escobar@global.komatsu',
        'gary.reygada.f@global.komatsu', 
        'claudio.miranda.g@global.komatsu',
        'maite.hidalgo@global.komatsu',
        'matias.flores.b@global.komatsu',
        'cesar.romero.n@global.komatsu',
        'alex.munoz.o@global.komatsu',
        'andres.gutierrez.v@global.komatsu',
        'brian.reygada.f@global.komatsu',
        'andres.ocayo@global.komatsu',
        'ezequiel.gonzalez@global.komatsu',
        'benito.castillo@global.komatsu',
        'vladimir.tapia.e@global.komatsu',
        'renato.espinoza.s@global.komatsu',
        'bielka.chicago@global.komatsu'
    ];
    
    try {
        const formData = getAllFormData();
        
        if (!formData.m || !formData.s || !formData.i) {
            showMessage('Complete todos los campos requeridos', true);
            return;
        }

        showMessage(`Enviando a ${emailsPrueba.length} destinatarios...`);

        let emailContent = generateCompactEmail(formData);
        let emailSize = new Blob([emailContent]).size;
        
        console.log(`Tamaño inicial: ${emailSize} bytes`);
        
        // Si sigue siendo muy grande, crear versión ultra compacta
        if (emailSize > 45000) {
            showMessage('Creando versión ultra compacta...');
            emailContent = generateUltraCompactEmail(formData);
            emailSize = new Blob([emailContent]).size;
            console.log(`Tamaño final: ${emailSize} bytes`);
        }

        if (emailSize > 50000) {
            showMessage('❌ Demasiados datos. Reduzca la cantidad de valores ingresados.', true);
            return;
        }

        let emailsEnviados = 0;
        let emailsFallidos = 0;
        
        // Enviar un email individual a cada destinatario
        emailsPrueba.forEach((email, index) => {
            const templateParams = {
                to_email: email,  // Enviar a cada email individualmente
                subject: `Inspección HD785-7 - ${formData.s} - ${formData.f}`,
                message: emailContent,
                modelo_maquina: formData.m,
                numero_serie: formData.s,
                fecha_inspeccion: formData.f,
                inspector: formData.i
            };
            
            emailjs.send('service_6ymc9d7', 'template_tsly61m', templateParams)
                .then(function(response) {
                    emailsEnviados++;
                    console.log(`✅ Email enviado a: ${email}`, response.status);
                    
                    // Cuando todos los emails se han procesado
                    if (emailsEnviados + emailsFallidos === emailsPrueba.length) {
                        if (emailsFallidos === 0) {
                            showMessage(`✅ HD785-7 enviado correctamente a ${emailsEnviados} destinatarios`);
                        } else {
                            showMessage(`✅ HD785-7 enviado a ${emailsEnviados} destinatarios, ${emailsFallidos} fallidos`, true);
                        }
                    }
                }, function(error) {
                    emailsFallidos++;
                    console.log(`❌ Error enviando a: ${email}`, error);
                    
                    // Cuando todos los emails se han procesado
                    if (emailsEnviados + emailsFallidos === emailsPrueba.length) {
                        if (emailsFallidos === 0) {
                            showMessage(`✅ HD785-7 enviado correctamente a ${emailsEnviados} destinatarios`);
                        } else {
                            showMessage(`✅ HD785-7 enviado a ${emailsEnviados} destinatarios, ${emailsFallidos} fallidos`, true);
                        }
                    }
                });
        });
            
    } catch (error) {
        console.error('Error:', error);
        showMessage('❌ Error: ' + error.message, true);
    }
}

// VERSIÓN ULTRA COMPACTA PARA CASOS EXTREMOS
function generateUltraCompactEmail(formData) {
    let html = `<div style="font-family:Arial;">
<div style="text-align:center;border-bottom:2px solid #0033A0;padding-bottom:8px;">
<h2 style="color:#0033A0;margin:0;font-size:18px;">INSPECCIÓN HD785-7</h2>
</div>
<div style="background:#f0f0f0;padding:8px;margin:8px 0;">
<p><strong>Máquina:</strong> ${formData.m} | <strong>Serie:</strong> ${formData.s}</p>
<p><strong>Fecha:</strong> ${formData.f} | <strong>Inspector:</strong> ${formData.i}</p>
</div>`;

    let totalItems = 0;

    // Solo mostrar resultados sin tablas complejas
    Object.keys(formData).forEach(key => {
        if (Array.isArray(formData[key]) && formData[key].length > 0) {
            const sectionName = key.replace(/-/g, ' ').toUpperCase();
            html += `<div style="margin:8px 0;">
<div style="background:#0033A0;color:white;padding:4px 8px;font-size:12px;font-weight:bold;">${sectionName}</div>`;
            
            formData[key].forEach(row => {
                html += `<div style="padding:2px 8px;border-bottom:1px dotted #ddd;font-size:11px;">
<span style="font-weight:bold;">${row.i}:</span> ${row.r} (Est: ${row.e}, Perm: ${row.p})
</div>`;
                totalItems++;
            });
            
            html += `</div>`;
        }
    });

    html += `<div style="margin-top:12px;padding-top:8px;border-top:1px solid #0033A0;text-align:center;font-size:10px;color:#666;">
<p>Total registros: ${totalItems} | Generado: ${new Date().toLocaleDateString()}</p>
</div></div>`;

    return html;
}

// Función para solo PDF (si aún la necesitas)
function generateAndUploadPDFOnly() {
    showMessage('⚠️ Función PDF deshabilitada - Use "Enviar Email"');
}