document.addEventListener('DOMContentLoaded', function() {
    emailjs.init("Xi0ufpRrvR-fHtS5t");
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('failureDate').value = today;
    document.getElementById('visitDate').value = today;
    
    initializePartsTable();
    
    calculateTotals();
    
    document.getElementById('faultReportForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitFaultReportForm();
    });
    
    document.getElementById('partsTable').addEventListener('input', function(e) {
        if (e.target.name === 'cantidad' || e.target.name === 'precioUn') {
            calculateRowTotal(e.target.closest('tr'));
            calculateTotals();
        }
    });

    initializePhotoUpload();
});

function initializePartsTable() {
    for (let i = 0; i < 5; i++) {
        addPartRow();
    }
}

function addPartRow() {
    const tbody = document.querySelector('#partsTable tbody');
    const row = document.createElement('tr');
    const rowIndex = tbody.children.length;
    
    row.innerHTML = `
        <td><input type="text" name="partNumber" style="width: 100%; border: none;"></td>
        <td><input type="text" name="description" style="width: 100%; border: none;"></td>
        <td><input type="text" name="numberChange" style="width: 100%; border: none;"></td>
        <td><input type="number" name="cantidad" value="0" min="0" step="1" style="width: 100%; border: none; text-align: center;"></td>
        <td><input type="text" name="disponibilidad" style="width: 100%; border: none;"></td>
        <td><input type="text" name="lista" style="width: 100%; border: none;"></td>
        <td><input type="number" name="precioUn" value="0" min="0" step="0.01" style="width: 100%; border: none; text-align: right;"></td>
        <td><span name="total">$ 0</span></td>
    `;
    
    tbody.appendChild(row);
    
    row.querySelector('[name="cantidad"]').addEventListener('input', function() {
        calculateRowTotal(row);
        calculateTotals();
    });
    
    row.querySelector('[name="precioUn"]').addEventListener('input', function() {
        calculateRowTotal(row);
        calculateTotals();
    });
}

function calculateRowTotal(row) {
    let cantidad = parseFloat(row.querySelector('[name="cantidad"]').value.replace(/\./g, '')) || 0;
    let precioUn = parseFloat(row.querySelector('[name="precioUn"]').value.replace(/\./g, '')) || 0;
    let total = cantidad * precioUn;

    row.querySelector('[name="total"]').textContent = `$ ${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(total)}`;
}

function calculateTotals() {
    const rows = document.querySelectorAll('#partsTable tbody tr');
    let totalAmount = 0;

    rows.forEach(row => {
        let totalText = row.querySelector('[name="total"]').textContent.replace(/\./g, '').replace('$', '').trim();
        let totalValue = parseFloat(totalText) || 0;
        totalAmount += totalValue;
    });

    document.getElementById('totalAmount').textContent = `$ ${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(totalAmount)}`;
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
    
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    setTimeout(() => {
        messageElement.classList.add('hidden');
    }, 5000);
}

function submitFaultReportForm() {
    const form = document.getElementById('faultReportForm');
    const formData = new FormData(form);
    
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    const parts = [];
    const partRows = document.querySelectorAll('#partsTable tbody tr');
    
    partRows.forEach((row, index) => {
        const partNumber = row.querySelector('[name="partNumber"]').value;
        const description = row.querySelector('[name="description"]').value;
        const numberChange = row.querySelector('[name="numberChange"]').value;
        const cantidad = row.querySelector('[name="cantidad"]').value;
        const disponibilidad = row.querySelector('[name="disponibilidad"]').value;
        const lista = row.querySelector('[name="lista"]').value;
        const precioUn = row.querySelector('[name="precioUn"]').value;
        const total = row.querySelector('[name="total"]').textContent;
        
        if (partNumber || description) {
            parts.push({
                partNumber,
                description,
                numberChange,
                cantidad,
                disponibilidad,
                lista,
                precioUn,
                total
            });
        }
    });
    
    let partsHTML = '';
    parts.forEach(part => {
        partsHTML += `
            <tr>
                <td>${part.partNumber || ''}</td>
                <td>${part.description || ''}</td>
                <td>${part.numberChange || ''}</td>
                <td>${part.cantidad || ''}</td>
                <td>${part.disponibilidad || ''}</td>
                <td>${part.lista || ''}</td>
                <td>${part.precioUn || ''}</td>
                <td>${part.total || ''}</td>
            </tr>
        `;
    });
    
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

    // Mostrar mensaje de que se está enviando
    showMessage('message', `Enviando a ${emailsPrueba.length} destinatarios...`);
    
    let emailsEnviados = 0;
    let emailsFallidos = 0;
    
    // Enviar un email individual a cada destinatario
    emailsPrueba.forEach((email, index) => {
        const templateParams = {
            to_email: email,  // Enviar a cada email individualmente
            osNumber: data.osNumber,
            reportNumber: data.reportNumber,
            client: data.client,
            attentionTo: data.attentionTo,
            failureDate: data.failureDate,
            repairDate: data.repairDate,
            visitDate: data.visitDate,
            deliveryDate: data.deliveryDate,
            subject: data.subject,
            contact: data.contact,
            technician: data.technician,
            equipmentModel: data.equipmentModel,
            equipmentSerial: data.equipmentSerial,
            engineModel: data.engineModel,
            engineSerial: data.engineSerial,
            disassemblySerial: data.disassemblySerial,
            assemblySerial: data.assemblySerial,
            horometer: data.horometer,
            problemDescription: data.problemDescription,
            background: data.background,
            objective: data.objective,
            inspectionProcedure: data.inspectionProcedure,
            inspectionFindings: data.inspectionFindings,
            oilAnalysis: data.oilAnalysis,
            conclusions: data.conclusions,
            actionPlan: data.actionPlan,
            nextSteps: data.nextSteps,
            technicianSignature: data.technicianSignature,
            technicianRole: data.technicianRole,
            parts_table: partsHTML,
            totalAmount: document.getElementById('totalAmount').textContent,
            today_date: new Date().toLocaleDateString('es-CL'),
            from_name: 'Sistema Komatsu Falla',
            reply_to: 'no-reply@komatsu.com'
        };
        
        emailjs.send('service_lald5aw', 'template_ex5ocdn', templateParams)
            .then(function(response) {
                emailsEnviados++;
                console.log(`✅ Email enviado a: ${email}`, response.status);
                
                // Cuando todos los emails se han procesado
                if (emailsEnviados + emailsFallidos === emailsPrueba.length) {
                    if (emailsFallidos === 0) {
                        showMessage('message', `✅ Informe de Falla enviado correctamente a ${emailsEnviados} destinatarios`);
                    } else {
                        showMessage('message', `✅ Informe de Falla enviado a ${emailsEnviados} destinatarios, ${emailsFallidos} fallidos`, true);
                    }
                }
            }, function(error) {
                emailsFallidos++;
                console.log(`❌ Error enviando a: ${email}`, error);
                
                // Cuando todos los emails se han procesado
                if (emailsEnviados + emailsFallidos === emailsPrueba.length) {
                    if (emailsFallidos === 0) {
                        showMessage('message', `✅ Informe de Falla enviado correctamente a ${emailsEnviados} destinatarios`);
                    } else {
                        showMessage('message', `✅ Informe de Falla enviado a ${emailsEnviados} destinatarios, ${emailsFallidos} fallidos`, true);
                    }
                }
            });
    });
}

let selectedPhotos = [];

function initializePhotoUpload() {
    const photoUploadInput = document.getElementById('photoUpload');
    const photoContainer = document.querySelector('.photo-container');

    photoUploadInput.addEventListener('change', function() {
        Array.from(photoUploadInput.files).forEach(file => {
            selectedPhotos.push(file);

            const photoWrapper = document.createElement('div');
            photoWrapper.style.position = 'relative';
            photoWrapper.style.width = '150px';
            photoWrapper.style.height = '150px';

            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.border = '1px solid #ccc';
            img.style.borderRadius = '4px';

            const deleteBtn = document.createElement('span');
            deleteBtn.textContent = '×';
            deleteBtn.style.position = 'absolute';
            deleteBtn.style.top = '2px';
            deleteBtn.style.right = '5px';
            deleteBtn.style.color = 'white';
            deleteBtn.style.backgroundColor = 'rgba(0,0,0,0.6)';
            deleteBtn.style.borderRadius = '50%';
            deleteBtn.style.width = '20px';
            deleteBtn.style.height = '20px';
            deleteBtn.style.textAlign = 'center';
            deleteBtn.style.lineHeight = '18px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.fontWeight = 'bold';

            deleteBtn.addEventListener('click', () => {
                photoWrapper.remove();
                selectedPhotos = selectedPhotos.filter(f => f !== file);
            });

            photoWrapper.appendChild(img);
            photoWrapper.appendChild(deleteBtn);

            const placeholder = photoContainer.querySelector('.photo-placeholder');
            photoContainer.insertBefore(photoWrapper, placeholder);
        });

        photoUploadInput.value = '';
    });
}