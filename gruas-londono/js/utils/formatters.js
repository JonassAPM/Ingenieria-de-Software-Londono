// Utilidades de formato para la interfaz.
const Formatters = {
  cop: new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }),

  formatCOP(valor) {
    return this.cop.format(valor || 0);
  },

  formatKm(km) {
    return `${Number(km || 0).toFixed(1)} km`;
  },

  formatDateTime(isoString) {
    if (!isoString) return '—';
    const fecha = new Date(isoString);
    return fecha.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};
