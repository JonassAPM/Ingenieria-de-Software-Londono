// Sistema centralizado de notificaciones toast.
const Notifications = {
  /**
   * Muestra una notificación temporal en pantalla.
   * @param {string} message - Texto a mostrar.
   * @param {'success'|'error'|'info'} type - Tipo de notificación.
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }
};
