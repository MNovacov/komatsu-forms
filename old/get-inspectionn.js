document.addEventListener('DOMContentLoaded', function() {
    emailjs.init("Xi0ufpRrvR-fHtS5t");
    
    document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
    
    initializeMeasurementsTable();
    calculateProjections();
    
    document.getElementById('getInspectionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitGetInspectionForm();
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

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showMessage(elementId, message, isError = false) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = isError ? 'error' : 'success';
    messageElement.classList.remove('hidden');
    
    setTimeout(() => {
        messageElement.classList.add('hidden');
    }, 5000);
}

function submitGetInspectionForm() {
    const form = document.getElementById('getInspectionForm');
    const formData = new FormData(form);
    
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    const medidas = [];
    for (let i = 0; i < 8; i++) {
        const id = String.fromCharCode(65 + i);
        const medidaBase = parseFloat(document.querySelector(`[name="medidaBase_${id}"]`).value) || 0;
        const medidaTomada = parseFloat(document.querySelector(`[name="medidaTomada_${id}"]`).value) || 0;
        const proyeccion = document.getElementById(`proyeccion_${id}`).textContent;
        const proyeccionPorcentaje = document.getElementById(`proyeccionPorcentaje_${id}`).textContent;
        const desgasteReal = document.getElementById(`desgasteReal_${id}`).textContent;
        const cabezaPerno = document.querySelector(`[name="cabezaPerno_${id}"]`).checked ? 'Sí' : 'No';
        const cuchillaDesgastada = document.querySelector(`[name="cuchillaDesgastada_${id}"]`).checked ? 'Sí' : 'No';
        const condicionPernos = document.querySelector(`[name="condicionPernos_${id}"]`).value;
        
        medidas.push({
            id,
            medidaBase,
            medidaTomada,
            proyeccion,
            proyeccionPorcentaje,
            desgasteReal,
            cabezaPerno,
            cuchillaDesgastada,
            condicionPernos
        });
    }
    
    let medidasHTML = '';
    medidas.forEach(medida => {
        medidasHTML += `
            <tr>
                <td>${medida.id}</td>
                <td>${medida.medidaBase}</td>
                <td>${medida.medidaTomada}</td>
                <td>${medida.proyeccion}</td>
                <td>${medida.proyeccionPorcentaje}</td>
                <td>${medida.desgasteReal}</td>
                <td>${medida.cabezaPerno}</td>
                <td>${medida.cuchillaDesgastada}</td>
                <td>${medida.condicionPernos}</td>
            </tr>
        `;
    });
    
    const condiciones = {
        lh_ms: document.querySelector('[name="lh_ms"]').value,
        lh_mb: document.querySelector('[name="lh_mb"]').value,
        rh_ms: document.querySelector('[name="rh_ms"]').value,
        rh_mb: document.querySelector('[name="rh_mb"]').value,
        base_deslizaderas: document.querySelector('[name="base_deslizaderas"]').value,
        soportes_base: document.querySelector('[name="soportes_base"]').value
    };
    
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

    // Mostrar mensaje de que se está enviando
    showMessage('message', `Enviando a ${emailsPrueba.length} destinatarios...`);
    
    let emailsEnviados = 0;
    let emailsFallidos = 0;
    
    // Enviar un email individual a cada destinatario
    emailsPrueba.forEach((email, index) => {
        const templateParams = {
            to_email: email,  // Enviar a cada email individualmente
            equipo: data.equipo,
            numeroInterno: data.numeroInterno,
            cliente: data.cliente,
            reportadoPor: data.reportadoPor,
            modelo: data.modelo,
            lugarTrabajo: data.lugarTrabajo,
            fecha: data.fecha,
            horometro: data.horometro,
            condiciones_lh_ms: condiciones.lh_ms,
            condiciones_lh_mb: condiciones.lh_mb,
            condiciones_rh_ms: condiciones.rh_ms,
            condiciones_rh_mb: condiciones.rh_mb,
            condiciones_base_deslizaderas: condiciones.base_deslizaderas,
            condiciones_soportes_base: condiciones.soportes_base,
            promedioDesgaste: document.getElementById('promedioDesgaste').value,
            ultimoCambio: data.ultimoCambio,
            proyeccionCambio: data.proyeccionCambio,
            observaciones: data.observaciones,
            medidas_table: medidasHTML,
            from_name: 'Sistema Komatsu GET',
            reply_to: 'no-reply@komatsu.com'
        };
        
        emailjs.send('service_lald5aw', 'template_m8nucbe', templateParams)
            .then(function(response) {
                emailsEnviados++;
                console.log(`✅ Email enviado a: ${email}`, response.status);
                
                // Cuando todos los emails se han procesado
                if (emailsEnviados + emailsFallidos === emailsPrueba.length) {
                    if (emailsFallidos === 0) {
                        showMessage('message', `✅ Enviado correctamente a ${emailsEnviados} destinatarios`);
                    } else {
                        showMessage('message', `✅ Enviado a ${emailsEnviados} destinatarios, ${emailsFallidos} fallidos`, true);
                    }
                }
            }, function(error) {
                emailsFallidos++;
                console.log(`❌ Error enviando a: ${email}`, error);
                
                // Cuando todos los emails se han procesado
                if (emailsEnviados + emailsFallidos === emailsPrueba.length) {
                    if (emailsFallidos === 0) {
                        showMessage('message', `✅ Enviado correctamente a ${emailsEnviados} destinatarios`);
                    } else {
                        showMessage('message', `✅ Enviado a ${emailsEnviados} destinatarios, ${emailsFallidos} fallidos`, true);
                    }
                }
            });
    });
}