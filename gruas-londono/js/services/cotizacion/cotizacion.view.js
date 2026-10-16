// Vista del módulo de cotización SICETAC.
// Actualiza el desglose visual y los avisos de revisión manual.
const CotizacionView = {
  elementosDesglose: [
    { id: 'cot-base', valor: 'tarifaBase' },
    { id: 'cot-distancia', valor: 'costoDistancia' },
    { id: 'cot-topografia', valor: 'recargoTopografia' },
    { id: 'cot-carga', valor: 'recargoCarga' },
    { id: 'cot-seguro', valor: 'recargoSeguroMercancia' },
    { id: 'cot-total', valor: 'valorTotal' }
  ],

  /**
   * Inicializa la vista y oculta el aviso de revisión manual.
   */
  init() {
    this.ocultarAvisoRevision();
  },

  /**
   * Actualiza los valores del desglose en el DOM.
   * @param {object} desglose - Resultado de CotizacionModel.calcularCotizacion()
   */
  mostrarDesglose(desglose) {
    this.elementosDesglose.forEach(({ id, valor }) => {
      const elemento = document.getElementById(id);
      if (elemento) {
        elemento.textContent = Formatters.formatCOP(desglose[valor]);
      }
    });
  },

  /**
   * Muestra el aviso de revisión manual con enlace a WhatsApp.
   * @param {string} enlaceWhatsApp - URL generada por el modelo.
   */
  mostrarAvisoRevision(enlaceWhatsApp) {
    const contenedor = document.getElementById('cotizacion-aviso-revision');
    if (!contenedor) return;

    const enlace = document.getElementById('cotizacion-enlace-whatsapp');
    if (enlace) enlace.href = enlaceWhatsApp;

    contenedor.classList.remove('hidden');
  },

  /**
   * Oculta el aviso de revisión manual.
   */
  ocultarAvisoRevision() {
    const contenedor = document.getElementById('cotizacion-aviso-revision');
    if (contenedor) contenedor.classList.add('hidden');
  },

  /**
   * Limpia todos los valores del desglose a cero.
   */
  limpiarDesglose() {
    this.elementosDesglose.forEach(({ id }) => {
      const elemento = document.getElementById(id);
      if (elemento) elemento.textContent = Formatters.formatCOP(0);
    });
    this.ocultarAvisoRevision();
  }
};
