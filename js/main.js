(function() {
    emailjs.init("Xi0ufpRrvR-fHtS5t"); 
})();


function sendForm(formId, templateId, formData) {
    return emailjs.send("service_lald5aw", templateId, formData)
        .then(function(response) {
            console.log("SUCCESS!", response.status, response.text);
            return { success: true, message: "Formulario enviado correctamente" };
        }, function(error) {
            console.log("FAILED...", error);
            return { success: false, message: "Error al enviar el formulario: " + error.text };
        });
}


function showMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = isError ? 'error-message' : 'success-message';
        element.classList.remove('hidden');
        
        setTimeout(() => {
            element.classList.add('hidden');
        }, 5000);
    }
}


function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


function formatDate(date) {
    return date.toISOString().split('T')[0];
}