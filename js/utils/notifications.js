/* =====================================================================
   SISTEMA DE NOTIFICACIONES TOAST · GRÚAS LONDOÑO
   Notificaciones flotantes accesibles con barra de progreso,
   iconos temáticos y auto-destrucción controlada.
   ===================================================================== */
const Notifications = {
  containerId: 'toast-container',

  getContainer() {
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  },

  _lastToast: { mensaje: '', tipo: '', time: 0 },

  /**
   * Muestra un toast en pantalla
   * @param {string} mensaje
   * @param {'success'|'error'|'warning'|'info'} tipo
   * @param {number} duracionMs
   */
  showToast(mensaje, tipo = 'info', duracionMs = 3800) {
    const now = Date.now();
    if (this._lastToast.mensaje === mensaje && this._lastToast.tipo === tipo && (now - this._lastToast.time < 1200)) {
      return; // Prevenir notificaciones duplicadas en ráfaga
    }
    this._lastToast = { mensaje, tipo, time: now };

    const container = this.getContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.setAttribute('role', 'status');

    const iconoMap = {
      success: `<svg class="icon" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      error: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      warning: `<svg class="icon" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      info: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
    };

    toast.innerHTML = `
      ${iconoMap[tipo] || iconoMap.info}
      <div class="toast-mensaje">${Formatters ? Formatters.escapeHTML(mensaje) : mensaje}</div>
      <button class="toast-cerrar" aria-label="Cerrar notificación">
        <svg class="icon icon-sm" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="toast-progreso" style="animation-duration: ${duracionMs}ms;"></div>
    `;

    const closeBtn = toast.querySelector('.toast-cerrar');
    let timer = null;

    const remover = () => {
      if (timer) clearTimeout(timer);
      toast.classList.add('saliendo');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    closeBtn.addEventListener('click', remover);
    timer = setTimeout(remover, duracionMs);

    container.appendChild(toast);
  }
};

window.Notifications = Notifications;
