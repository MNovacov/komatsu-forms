document.addEventListener('DOMContentLoaded', () => {
  const fecha = document.getElementById('fecha');
  if (fecha) {
    fecha.value = new Date().toISOString().split('T')[0];
  }

  console.log("✅ Sistema Komatsu inicializado correctamente");
});


function showMessage(elementId, message, isError = false) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = message;
  element.className = isError ? 'error-message' : 'success-message';
  element.classList.remove('hidden');

  setTimeout(() => {
    element.classList.add('hidden');
  }, 5000);
}


function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}


function formatDate(date) {
  if (!(date instanceof Date)) return '';
  return date.toISOString().split('T')[0];
}
