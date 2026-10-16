/* =====================================================================
   UTILIDADES DE FORMATO · GRÚAS LONDOÑO
   Moneda colombiana (COP), fechas amigables, distancias y tonelajes.
   ===================================================================== */
const Formatters = {
  copFormatter: new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }),

  /**
   * Formatea un número en pesos colombianos ($ 150.000)
   * @param {number|string} valor
   * @returns {string}
   */
  formatCOP(valor) {
    const num = Number(valor) || 0;
    return this.copFormatter.format(num);
  },

  /**
   * Formatea distancia en kilómetros con un decimal
   * @param {number|string} km
   * @returns {string}
   */
  formatKm(km) {
    const num = Number(km) || 0;
    return `${num.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
  },

  /**
   * Formatea peso en toneladas
   * @param {number|string} ton
   * @returns {string}
   */
  formatToneladas(ton) {
    const num = Number(ton) || 0;
    return `${num.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} ton`;
  },

  /**
   * Formatea fecha y hora completa en formato colombiano (DD/MM/AAAA, HH:MM am/pm)
   * @param {string|Date} fechaISO
   * @returns {string}
   */
  formatDateTime(fechaISO) {
    if (!fechaISO) return '—';
    try {
      const d = new Date(fechaISO);
      if (isNaN(d.getTime())) return String(fechaISO);
      return d.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return String(fechaISO);
    }
  },

  /**
   * Formatea fecha relativa (ej: "Hace 5 minutos", "Hace 2 horas")
   * @param {string|Date} fechaISO
   * @returns {string}
   */
  formatTimeAgo(fechaISO) {
    if (!fechaISO) return '';
    try {
      const d = new Date(fechaISO);
      const diffMs = Date.now() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Hace un momento';
      if (diffMin < 60) return `Hace ${diffMin} min`;
      const diffHoras = Math.floor(diffMin / 60);
      if (diffHoras < 24) return `Hace ${diffHoras} h`;
      const diffDias = Math.floor(diffHoras / 24);
      return `Hace ${diffDias} d`;
    } catch {
      return '';
    }
  },

  /**
   * Sanitiza strings para prevención básica de XSS
   * @param {string} str
   * @returns {string}
   */
  escapeHTML(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

window.Formatters = Formatters;
