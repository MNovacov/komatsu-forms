// pm-clinic.js VERSIÓN TRANSFORMADA - Basada en pm-clinic2.js

document.addEventListener('DOMContentLoaded', function() {
    emailjs.init("vMo5DF4w_J8kx2s0i");
    document.getElementById('fechaInspeccion').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('pmClinicForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitPMClinicForm();
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
        nc: document.getElementById('nombreCliente').value,
        ub: document.getElementById('ubicacion').value,
        ws: document.getElementById('wd900Serie').value,
        ns: document.getElementById('noSerie').value,
        mm: document.getElementById('modeloMotor').value,
        nm: document.getElementById('noMotor').value,
        ot: document.getElementById('noOrdenTrabajo').value,
        ms: document.getElementById('medidorServicio').value,
        te: document.getElementById('tecnico').value,
        oo: document.getElementById('opinionOperador').value,
        na: document.getElementById('notasAjustes').value,
        ce: document.getElementById('comentariosEje').value,
        ht: document.getElementById('horasTurno').value,
        cp: document.getElementById('cuchillaPies').value,
        tam: document.getElementById('tempAmbienteMax').value,
        tami: document.getElementById('tempAmbienteMin').value,
        alt: document.getElementById('altura').value
    };
}

// FUNCIÓN ULTRA COMPRIMIDA - Basada en pm-clinic2.js
function getAllFormData() {
    const basic = collectBasicFormData();
    const data = { ...basic, t: new Date().toISOString() };
    
    // Solo secciones con datos ingresados
    const sections = [
        { key: 'mo', id: 'inspeccionMotor' },
        { key: 'ct', id: 'inspeccionConvertidor' },
        { key: 'tr', id: 'inspeccionTransmision' },
        { key: 'di', id: 'inspeccionDireccion' },
        { key: 'fr', id: 'inspeccionFrenos' },
        { key: 'hi', id: 'inspeccionHidraulica' },
        { key: 'ej', id: 'inspeccionEje' }
    ];
    
    sections.forEach(section => {
        const secData = collectSectionDataCompressed(section.id);
        if (secData.length > 0) {
            data[section.key] = secData;
        }
    });
    
    // Recopilar problemas
    const problemas = collectProblemasCompressed();
    if (problemas.length > 0) {
        data.prb = problemas;
    }
    
    // Recopilar opciones
    const options = collectOptionsCompressed();
    if (Object.keys(options).length > 0) {
        Object.assign(data, options);
    }
    
    return data;
}

function collectSectionDataCompressed(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return [];
    
    const rows = table.querySelectorAll('tbody tr');
    const data = [];
    
    rows.forEach(row => {
        const input = row.querySelector('input[type="text"]');
        if (input && input.value.trim()) {
            const cells = Array.from(row.querySelectorAll('td'));
            data.push({
                i: cells[0]?.textContent?.trim().substring(0, 30) || '',
                c: cells[1]?.textContent?.trim().substring(0, 40) || '',
                u: cells[2]?.textContent?.trim() || '',
                e: cells[3]?.textContent?.trim() || '',
                p: cells[4]?.textContent?.trim() || '',
                r: input.value
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
            problemas.push({
                p: problema || '',
                r: repuesto || '',
                np: numeroParte || '',
                c: cantidad || ''
            });
        }
    }
    
    return problemas;
}

function collectOptionsCompressed() {
    const options = {};
    
    // Tipo de trabajo minería
    const mineriaChecks = document.querySelectorAll('input[name="tipoTrabajoMineria"]:checked');
    if (mineriaChecks.length > 0) {
        options.mn = Array.from(mineriaChecks).map(cb => cb.value).join(', ');
    }
    
    // Tipo de trabajo construcción
    const construccionChecks = document.querySelectorAll('input[name="tipoTrabajoConstruccion"]:checked');
    if (construccionChecks.length > 0) {
        options.cn = Array.from(construccionChecks).map(cb => cb.value).join(', ');
    }
    
    // Tipo de suelo
    const sueloChecks = document.querySelectorAll('input[name="tipoSuelo"]:checked');
    if (sueloChecks.length > 0) {
        options.sl = Array.from(sueloChecks).map(cb => cb.value).join(', ');
    }
    
    // Tipo de suelo roca
    const sueloRocaRadios = document.querySelectorAll('input[name="tipoSueloRoca"]:checked');
    if (sueloRocaRadios.length > 0) {
        options.sr = Array.from(sueloRocaRadios).map(cb => cb.value).join(', ');
    }
    
    // Turnos
    const turnosRadios = document.querySelectorAll('input[name="turnosDia"]:checked');
    if (turnosRadios.length > 0) {
        options.td = Array.from(turnosRadios).map(cb => cb.value).join(', ');
    }
    
    // Neumáticos
    const neumaticosCheck = document.querySelector('input[name="neumaticosOption"]:checked');
    if (neumaticosCheck) {
        options.nt = neumaticosCheck.value;
    }
    
    return options;
}

// FUNCIÓN PARA GENERAR EMAIL COMPRIMIDO - Adaptada para PM Clinic
function generateCompactEmail(formData) {
    let html = `<div style="font-family:Arial;max-width:700px;margin:0 auto;">
<div style="text-align:center;border-bottom:2px solid #0033A0;padding-bottom:10px;margin-bottom:15px;">
<h1 style="color:#0033A0;margin:0;font-size:20px;">PM CLINIC WD900-3 - INSPECCIÓN</h1>
</div>
<div style="background:#f8f9fa;padding:10px;margin-bottom:15px;border-left:4px solid #0033A0;">
<h3 style="color:#0033A0;margin:0 0 8px 0;font-size:16px;">INFORMACIÓN GENERAL</h3>
<table style="width:100%;font-size:13px;">
<tr><td style="padding:4px;font-weight:bold;width:120px;">Cliente:</td><td style="padding:4px;">${formData.nc || 'No especificado'}</td></tr>
<tr><td style="padding:4px;font-weight:bold;">Ubicación:</td><td style="padding:4px;">${formData.ub || 'No especificado'}</td></tr>
<tr><td style="padding:4px;font-weight:bold;">Serie WD900:</td><td style="padding:4px;">${formData.ws || formData.ns || 'No especificado'}</td></tr>
<tr><td style="padding:4px;font-weight:bold;">Modelo Motor:</td><td style="padding:4px;">${formData.mm || 'No especificado'}</td></tr>
<tr><td style="padding:4px;font-weight:bold;">No. Motor:</td><td style="padding:4px;">${formData.nm || 'No especificado'}</td></tr>
<tr><td style="padding:4px;font-weight:bold;">Orden Trabajo:</td><td style="padding:4px;">${formData.ot || 'No especificado'}</td></tr>
<tr><td style="padding:4px;font-weight:bold;">Fecha:</td><td style="padding:4px;">${formData.fr || 'No especificado'}</td></tr>
<tr><td style="padding:4px;font-weight:bold;">Medidor Servicio:</td><td style="padding:4px;">${formData.ms || 'No especificado'}</td></tr>
<tr><td style="padding:4px;font-weight:bold;">Técnico:</td><td style="padding:4px;">${formData.te || 'No especificado'}</td></tr>
</table>`;

    // Información adicional
    let infoAdicional = '';
    if (formData.mn || formData.cn) {
        infoAdicional += `<strong>Tipo de Trabajo:</strong> ${formData.mn || ''} ${formData.cn || ''}<br>`;
    }
    if (formData.cp) {
        infoAdicional += `<strong>Cuchilla:</strong> ${formData.cp} pies<br>`;
    }
    if (formData.tam || formData.tami) {
        infoAdicional += `<strong>Temperatura:</strong> ${formData.tami || ''}°C - ${formData.tam || ''}°C<br>`;
    }
    if (formData.alt) {
        infoAdicional += `<strong>Altura:</strong> ${formData.alt} metros<br>`;
    }
    if (formData.ht) {
        infoAdicional += `<strong>Horas/Turno:</strong> ${formData.ht}<br>`;
    }
    if (formData.td) {
        infoAdicional += `<strong>Turnos/Día:</strong> ${formData.td}<br>`;
    }
    
    if (infoAdicional) {
        html += `<div style="margin-top:10px;padding:8px;background:#e8f4ff;border-radius:4px;font-size:12px;">
<h4 style="margin:0 0 5px 0;font-size:13px;color:#0033A0;">Información Adicional</h4>
${infoAdicional}
</div>`;
    }
    
    html += `</div>`;

    // Opinión del operador
    if (formData.oo) {
        html += `<div style="background:#fff8e1;padding:10px;margin:12px 0;border-left:3px solid #ffa000;border-radius:4px;">
<h4 style="color:#0033A0;margin:0 0 5px 0;font-size:14px;">OPINIÓN DEL OPERADOR</h4>
<p style="margin:0;font-size:12px;">${formData.oo}</p>
</div>`;
    }

    let totalItems = 0;
    const sectionNames = {
        'mo': 'INSPECCIÓN DEL MOTOR',
        'ct': 'CONVERTIDOR DE TORQUE',
        'tr': 'TRANSMISIÓN',
        'di': 'DIRECCIÓN',
        'fr': 'FRENOS',
        'hi': 'HIDRÁULICA',
        'ej': 'EJE'
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

    // Problemas detectados
    if (formData.prb && formData.prb.length > 0) {
        html += `<div style="margin:12px 0;">
<h4 style="color:#0033A0;margin:0 0 6px 0;font-size:14px;border-bottom:1px solid #ddd;padding-bottom:3px;">PROBLEMAS DETECTADOS</h4>
<table style="width:100%;border-collapse:collapse;font-size:10px;">
<thead><tr style="background:#f0f0f0;">
<th style="border:1px solid #ccc;padding:2px;text-align:left;">Problema</th>
<th style="border:1px solid #ccc;padding:2px;text-align:left;">Repuesto</th>
<th style="border:1px solid #ccc;padding:2px;text-align:center;">N° Parte</th>
<th style="border:1px solid #ccc;padding:2px;text-align:center;">Cantidad</th>
</tr></thead><tbody>`;

        formData.prb.forEach(prob => {
            html += `<tr>
<td style="border:1px solid #ccc;padding:2px;">${prob.p}</td>
<td style="border:1px solid #ccc;padding:2px;">${prob.r}</td>
<td style="border:1px solid #ccc;padding:2px;text-align:center;">${prob.np}</td>
<td style="border:1px solid #ccc;padding:2px;text-align:center;">${prob.c}</td>
</tr>`;
        });

        html += `</tbody></table></div>`;
    }

    // Notas de ajustes
    if (formData.na) {
        html += `<div style="background:#f9f9f9;padding:10px;margin:12px 0;border-radius:4px;">
<h4 style="color:#0033A0;margin:0 0 5px 0;font-size:14px;">NOTAS DE AJUSTES REALIZADOS</h4>
<p style="margin:0;font-size:12px;">${formData.na}</p>
</div>`;
    }

    // Comentarios del eje
    if (formData.ce) {
        html += `<div style="background:#f9f9f9;padding:10px;margin:12px 0;border-radius:4px;">
<h4 style="color:#0033A0;margin:0 0 5px 0;font-size:14px;">COMENTARIOS DEL EJE</h4>
<p style="margin:0;font-size:12px;">${formData.ce}</p>
</div>`;
    }

    html += `<div style="margin-top:15px;padding-top:10px;border-top:1px solid #ccc;text-align:center;color:#666;font-size:11px;">
<p><strong>RESUMEN</strong></p>
<p>Cliente: ${formData.nc} | Ubicación: ${formData.ub}</p>
<p>Serie: ${formData.ws || formData.ns} | Fecha: ${formData.fr}</p>
<p>Total ítems: ${totalItems} | Problemas: ${formData.prb ? formData.prb.length : 0}</p>
<p><em>Generado: ${new Date().toLocaleDateString()}</em></p>
</div></div>`;

    return html;
}

// FUNCIÓN PRINCIPAL CON CONTROL DE TAMAÑO - Adaptada para PM Clinic
function submitPMClinicForm() {
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
        
        if (!formData.nc || !formData.ub || !formData.ws) {
            showMessage('Complete todos los campos requeridos: Cliente, Ubicación y Serie WD900', true);
            return;
        }

        showMessage(`Enviando a ${emailsPrueba.length} destinatarios...`);

        let emailContent = generateCompactEmail(formData);
        let emailSize = new Blob([emailContent]).size;
        
        console.log(`Tamaño inicial: ${emailSize} bytes`);
        
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
                subject: `PM Clinic WD900-3 - ${formData.ws || formData.ns} - ${formData.fr}`,
                message: emailContent,
                nombre_cliente: formData.nc,
                ubicacion: formData.ub,
                numero_serie: formData.ws || formData.ns,
                orden_trabajo: formData.ot,
                tecnico: formData.te,
                trabajo_info: generateTrabajoInfo(formData),
                opinion_operador: formData.oo,
                notas_ajustes: formData.na,
                comentarios_eje: formData.ce,
            };
            
            emailjs.send('service_6ymc9d7', 'template_cmqgxds', templateParams)
                .then(function(response) {
                    emailsEnviados++;
                    console.log(`✅ Email enviado a: ${email}`, response.status);
                    
                    // Cuando todos los emails se han procesado
                    if (emailsEnviados + emailsFallidos === emailsPrueba.length) {
                        if (emailsFallidos === 0) {
                            showMessage(`✅ PM Clinic enviado correctamente a ${emailsEnviados} destinatarios`);
                        } else {
                            showMessage(`✅ PM Clinic enviado a ${emailsEnviados} destinatarios, ${emailsFallidos} fallidos`, true);
                        }
                    }
                }, function(error) {
                    emailsFallidos++;
                    console.log(`❌ Error enviando a: ${email}`, error);
                    
                    // Cuando todos los emails se han procesado
                    if (emailsEnviados + emailsFallidos === emailsPrueba.length) {
                        if (emailsFallidos === 0) {
                            showMessage(`✅ PM Clinic enviado correctamente a ${emailsEnviados} destinatarios`);
                        } else {
                            showMessage(`✅ PM Clinic enviado a ${emailsEnviados} destinatarios, ${emailsFallidos} fallidos`, true);
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
<h2 style="color:#0033A0;margin:0;font-size:18px;">PM CLINIC WD900-3</h2>
</div>
<div style="background:#f0f0f0;padding:8px;margin:8px 0;">
<p><strong>Cliente:</strong> ${formData.nc} | <strong>Ubicación:</strong> ${formData.ub}</p>
<p><strong>Serie:</strong> ${formData.ws || formData.ns} | <strong>Fecha:</strong> ${formData.fr}</p>
<p><strong>Técnico:</strong> ${formData.te}</p>
</div>`;

    let totalItems = 0;

    // Solo mostrar resultados sin tablas complejas
    Object.keys(formData).forEach(key => {
        if (Array.isArray(formData[key]) && formData[key].length > 0) {
            const sectionName = getSectionName(key);
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

    // Problemas detectados
    if (formData.prb && formData.prb.length > 0) {
        html += `<div style="margin:8px 0;">
<div style="background:#0033A0;color:white;padding:4px 8px;font-size:12px;font-weight:bold;">PROBLEMAS DETECTADOS</div>`;
        
        formData.prb.forEach(prob => {
            html += `<div style="padding:2px 8px;border-bottom:1px dotted #ddd;font-size:11px;">
<span style="font-weight:bold;">${prob.p}:</span> ${prob.r} (Parte: ${prob.np}, Cant: ${prob.c})
</div>`;
        });
        
        html += `</div>`;
    }

    html += `<div style="margin-top:12px;padding-top:8px;border-top:1px solid #0033A0;text-align:center;font-size:10px;color:#666;">
<p>Total registros: ${totalItems} | Generado: ${new Date().toLocaleDateString()}</p>
</div></div>`;

    return html;
}

function getSectionName(key) {
    const sectionNames = {
        'mo': 'MOTOR',
        'ct': 'CONVERTIDOR DE TORQUE',
        'tr': 'TRANSMISIÓN',
        'di': 'DIRECCIÓN',
        'fr': 'FRENOS',
        'hi': 'HIDRÁULICA',
        'ej': 'EJE'
    };
    return sectionNames[key] || key;
}

function generateTrabajoInfo(formData) {
    let info = '';
    
    if (formData.mn || formData.cn) {
        info += `<strong>Tipo de Trabajo:</strong> ${formData.mn || ''} ${formData.cn || ''}<br>`;
    }
    if (formData.cp) {
        info += `<strong>Cuchilla:</strong> ${formData.cp} pies<br>`;
    }
    if (formData.tam || formData.tami) {
        info += `<strong>Temperatura:</strong> ${formData.tami || ''}°C - ${formData.tam || ''}°C<br>`;
    }
    if (formData.alt) {
        info += `<strong>Altura:</strong> ${formData.alt} metros<br>`;
    }
    if (formData.ht) {
        info += `<strong>Horas/Turno:</strong> ${formData.ht}<br>`;
    }
    if (formData.td) {
        info += `<strong>Turnos/Día:</strong> ${formData.td}<br>`;
    }
    
    return info || '';
}

// Función para solo PDF (si aún la necesitas)
function generateAndUploadPDFOnly() {
    showMessage('⚠️ Función PDF deshabilitada - Use "Enviar Email"');
}