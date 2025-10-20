// localizacion-fallas.js - SISTEMA DE LOCALIZACIÓN DE FALLAS HD785-7

document.addEventListener('DOMContentLoaded', function() {
    emailjs.init("vMo5DF4w_J8kx2s0i");
    document.getElementById('fechaInspeccion').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('localizacionFallasForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitLocalizacionFallasForm();
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
        i: document.getElementById('inspector').value,
        cf: document.getElementById('codigoFalla').value
    };
}

function getAllFormData() {
    const basic = collectBasicFormData();
    const data = { ...basic, t: new Date().toISOString() };
    
    // Recolectar datos de todas las secciones de fallas
    const sections = [
        'falla-15shma', 
        'falla-15sjma', 
        'falla-2f00km'
    ];
    
    sections.forEach(sec => {
        const secData = collectFaultSectionData(sec);
        if (secData.length > 0) {
            data[sec] = secData;
        }
    });
    
    // Recolectar observaciones
    const observaciones = collectObservations();
    if (observaciones.length > 0) {
        data.observaciones = observaciones;
    }
    
    return data;
}

function collectFaultSectionData(sectionClass) {
    const section = document.querySelector(`.${sectionClass}`);
    if (!section) return [];
    
    const rows = section.querySelectorAll('tbody tr');
    const data = [];
    
    rows.forEach((row, index) => {
        const causa = row.querySelector('td:nth-child(2)')?.textContent?.trim() || '';
        const procedimiento = row.querySelector('td:nth-child(3)')?.textContent?.trim() || '';
        const valorEstandar = row.querySelector('td:nth-child(4)')?.textContent?.trim() || '';
        
        const inputs = row.querySelectorAll('input[type="text"]');
        const valoresMedidos = Array.from(inputs).map(input => input.value.trim()).filter(val => val !== '');
        
        const select = row.querySelector('select');
        const okStatus = select?.value || '';
        
        if (causa || procedimiento || valoresMedidos.length > 0) {
            data.push({
                n: index + 1,
                c: causa.substring(0, 100),
                p: procedimiento.substring(0, 200),
                e: valorEstandar.substring(0, 100),
                vm: valoresMedidos,
                ok: okStatus
            });
        }
    });
    
    return data;
}

function collectObservations() {
    const observaciones = [];
    const textareas = document.querySelectorAll('textarea[name^="observaciones"]');
    
    textareas.forEach(textarea => {
        if (textarea.value.trim()) {
            const section = textarea.closest('.form-section');
            const sectionName = section?.querySelector('h3')?.textContent || 'Observaciones';
            observaciones.push({
                s: sectionName.substring(0, 50),
                o: textarea.value.trim().substring(0, 500)
            });
        }
    });
    
    return observaciones;
}

function generateFaultDiagnosisEmail(formData) {
    let html = `<div style="font-family:Arial;max-width:700px;margin:0 auto;">
<div style="text-align:center;border-bottom:2px solid #0033A0;padding-bottom:10px;margin-bottom:15px;">
<h1 style="color:#0033A0;margin:0;font-size:20px;">HD785-7 - DIAGNÓSTICO DE FALLAS</h1>
</div>
<div style="background:#f8f9fa;padding:10px;margin-bottom:15px;border-left:4px solid #0033A0;">
<h3 style="color:#0033A0;margin:0 0 8px 0;font-size:16px;">INFORMACIÓN GENERAL</h3>
<table style="width:100%;font-size:13px;">
<tr><td style="padding:4px;font-weight:bold;width:120px;">Modelo:</td><td style="padding:4px;">${formData.m}</td></tr>
<tr><td style="padding:4px;font-weight:bold;">Serie:</td><td style="padding:4px;">${formData.s}</td></tr>
<tr><td style="padding:4px;font-weight:bold;">Fecha:</td><td style="padding:4px;">${formData.f}</td></tr>
<tr><td style="padding:4px;font-weight:bold;">Inspector:</td><td style="padding:4px;">${formData.i}</td></tr>
<tr><td style="padding:4px;font-weight:bold;">Código Falla:</td><td style="padding:4px;">${formData.cf || 'No especificado'}</td></tr>
</table>
</div>`;

    let totalVerificaciones = 0;
    const sectionNames = {
        'falla-15shma': 'FALLA [15SHMA] - SOLENOIDE EMBRAGUE 4TA',
        'falla-15sjma': 'FALLA [15SJMA] - SOLENOIDE EMBRAGUE TRABA',
        'falla-2f00km': 'FALLA [2F00KM] - FRENO ESTACIONAMIENTO'
    };

    // Mostrar secciones de fallas con datos
    Object.keys(sectionNames).forEach(sectionKey => {
        if (formData[sectionKey] && formData[sectionKey].length > 0) {
            html += `<div style="margin:12px 0;">
<h4 style="color:#0033A0;margin:0 0 6px 0;font-size:14px;border-bottom:1px solid #ddd;padding-bottom:3px;">${sectionNames[sectionKey]}</h4>
<table style="width:100%;border-collapse:collapse;font-size:10px;">
<thead><tr style="background:#f0f0f0;">
<th style="border:1px solid #ccc;padding:2px;text-align:center;width:5%;">#</th>
<th style="border:1px solid #ccc;padding:2px;text-align:left;width:25%;">Causa</th>
<th style="border:1px solid #ccc;padding:2px;text-align:left;width:30%;">Verificación</th>
<th style="border:1px solid #ccc;padding:2px;text-align:center;width:15%;">Estándar</th>
<th style="border:1px solid #ccc;padding:2px;text-align:center;width:15%;">Medido</th>
<th style="border:1px solid #ccc;padding:2px;text-align:center;width:10%;">Estado</th>
</tr></thead><tbody>`;

            formData[sectionKey].forEach(row => {
                const statusColor = row.ok === 'si' ? '#d4edda' : row.ok === 'no' ? '#f8d7da' : '#fff3cd';
                const statusText = row.ok === 'si' ? '✅ OK' : row.ok === 'no' ? '❌ NO' : '⏳ PEND';
                
                html += `<tr>
<td style="border:1px solid #ccc;padding:2px;text-align:center;">${row.n}</td>
<td style="border:1px solid #ccc;padding:2px;">${row.c}</td>
<td style="border:1px solid #ccc;padding:2px;">${row.p}</td>
<td style="border:1px solid #ccc;padding:2px;text-align:center;">${row.e}</td>
<td style="border:1px solid #ccc;padding:2px;text-align:center;">${row.vm.join('<br>')}</td>
<td style="border:1px solid #ccc;padding:2px;text-align:center;background:${statusColor};font-weight:bold;">${statusText}</td>
</tr>`;
                totalVerificaciones++;
            });

            html += `</tbody></table></div>`;
        }
    });

    // Mostrar observaciones
    if (formData.observaciones && formData.observaciones.length > 0) {
        html += `<div style="margin:12px 0;">
<h4 style="color:#0033A0;margin:0 0 6px 0;font-size:14px;border-bottom:1px solid #ddd;padding-bottom:3px;">OBSERVACIONES</h4>`;
        
        formData.observaciones.forEach(obs => {
            html += `<div style="background:#f8f9fa;padding:8px;margin:5px 0;border-left:3px solid #0033A0;">
<strong style="color:#0033A0;">${obs.s}:</strong><br>
${obs.o}
</div>`;
        });
        
        html += `</div>`;
    }

    html += `<div style="margin-top:15px;padding-top:10px;border-top:1px solid #ccc;text-align:center;color:#666;font-size:11px;">
<p><strong>RESUMEN DEL DIAGNÓSTICO</strong></p>
<p>Máquina: ${formData.m} | Serie: ${formData.s}</p>
<p>Fecha: ${formData.f} | Inspector: ${formData.i}</p>
<p>Total verificaciones realizadas: ${totalVerificaciones}</p>
<p><em>Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</em></p>
</div></div>`;

    return html;
}

function submitLocalizacionFallasForm() {
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

        showMessage(`Enviando diagnóstico a ${emailsPrueba.length} destinatarios...`);

        let emailContent = generateFaultDiagnosisEmail(formData);
        let emailSize = new Blob([emailContent]).size;
        
        console.log(`Tamaño del diagnóstico: ${emailSize} bytes`);
        
        // Versión compacta si es necesario
        if (emailSize > 45000) {
            showMessage('Creando versión compacta del diagnóstico...');
            emailContent = generateCompactFaultEmail(formData);
            emailSize = new Blob([emailContent]).size;
            console.log(`Tamaño final: ${emailSize} bytes`);
        }

        if (emailSize > 50000) {
            showMessage('❌ Demasiados datos. Reduzca la cantidad de verificaciones ingresadas.', true);
            return;
        }

        let emailsEnviados = 0;
        let emailsFallidos = 0;
        
        // Enviar email individual a cada destinatario
        emailsPrueba.forEach((email, index) => {
            const templateParams = {
                to_email: email,
                subject: `Diagnóstico HD785-7 - ${formData.s} - ${formData.f}`,
                message: emailContent,
                modelo_maquina: formData.m,
                numero_serie: formData.s,
                fecha_inspeccion: formData.f,
                inspector: formData.i,
                codigo_falla: formData.cf || 'No especificado'
            };
            
            emailjs.send('service_6ymc9d7', 'template_tsly61m', templateParams)
                .then(function(response) {
                    emailsEnviados++;
                    console.log(`✅ Diagnóstico enviado a: ${email}`, response.status);
                    
                    if (emailsEnviados + emailsFallidos === emailsPrueba.length) {
                        if (emailsFallidos === 0) {
                            showMessage(`✅ Diagnóstico enviado correctamente a ${emailsEnviados} destinatarios`);
                        } else {
                            showMessage(`✅ Diagnóstico enviado a ${emailsEnviados} destinatarios, ${emailsFallidos} fallidos`, true);
                        }
                    }
                }, function(error) {
                    emailsFallidos++;
                    console.log(`❌ Error enviando a: ${email}`, error);
                    
                    if (emailsEnviados + emailsFallidos === emailsPrueba.length) {
                        if (emailsFallidos === 0) {
                            showMessage(`✅ Diagnóstico enviado correctamente a ${emailsEnviados} destinatarios`);
                        } else {
                            showMessage(`✅ Diagnóstico enviado a ${emailsEnviados} destinatarios, ${emailsFallidos} fallidos`, true);
                        }
                    }
                });
        });
            
    } catch (error) {
        console.error('Error:', error);
        showMessage('❌ Error: ' + error.message, true);
    }
}

// VERSIÓN COMPACTA PARA EMAILS GRANDES
function generateCompactFaultEmail(formData) {
    let html = `<div style="font-family:Arial;">
<div style="text-align:center;border-bottom:2px solid #0033A0;padding-bottom:8px;">
<h2 style="color:#0033A0;margin:0;font-size:18px;">DIAGNÓSTICO HD785-7</h2>
</div>
<div style="background:#f0f0f0;padding:8px;margin:8px 0;">
<p><strong>Máquina:</strong> ${formData.m} | <strong>Serie:</strong> ${formData.s}</p>
<p><strong>Fecha:</strong> ${formData.f} | <strong>Inspector:</strong> ${formData.i}</p>
<p><strong>Código:</strong> ${formData.cf || 'N/A'}</p>
</div>`;

    let totalVerificaciones = 0;

    // Mostrar resumen compacto de verificaciones
    Object.keys(formData).forEach(key => {
        if (Array.isArray(formData[key]) && formData[key].length > 0 && key.startsWith('falla-')) {
            const sectionName = key.replace('falla-', 'FALLA ').toUpperCase();
            html += `<div style="margin:8px 0;">
<div style="background:#0033A0;color:white;padding:4px 8px;font-size:12px;font-weight:bold;">${sectionName}</div>`;
            
            formData[key].forEach(row => {
                const statusIcon = row.ok === 'si' ? '✅' : row.ok === 'no' ? '❌' : '⏳';
                html += `<div style="padding:2px 8px;border-bottom:1px dotted #ddd;font-size:11px;">
${statusIcon} <strong>${row.c}:</strong> ${row.vm.join(', ')} (Est: ${row.e})
</div>`;
                totalVerificaciones++;
            });
            
            html += `</div>`;
        }
    });

    // Observaciones compactas
    if (formData.observaciones && formData.observaciones.length > 0) {
        html += `<div style="margin:8px 0;">
<div style="background:#28a745;color:white;padding:4px 8px;font-size:12px;font-weight:bold;">OBSERVACIONES</div>`;
        
        formData.observaciones.forEach(obs => {
            html += `<div style="padding:2px 8px;border-bottom:1px dotted #ddd;font-size:11px;">
<strong>${obs.s}:</strong> ${obs.o}
</div>`;
        });
        
        html += `</div>`;
    }

    html += `<div style="margin-top:12px;padding-top:8px;border-top:1px solid #0033A0;text-align:center;font-size:10px;color:#666;">
<p>Total verificaciones: ${totalVerificaciones} | Generado: ${new Date().toLocaleDateString()}</p>
</div></div>`;

    return html;
}