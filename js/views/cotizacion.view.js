/* =====================================================================
   VISTA: COTIZACIÓN NORMADA SICETAC · GRÚAS LONDOÑO
   Desglose interactivo en tiempo real, factura lateral dinámica y
   banner de Extensión 3b (revisión manual vía WhatsApp).
   ===================================================================== */
const CotizacionView = {
  elementos: {
    base: null,
    distancia: null,
    topografia: null,
    carga: null,
    seguro: null,
    total: null,
    avisoRevision: null,
    enlaceWhatsApp: null
  },

  init() {
    this.elementos.base = document.getElementById('cot-base');
    this.elementos.distancia = document.getElementById('cot-distancia');
    this.elementos.topografia = document.getElementById('cot-topografia');
    this.elementos.carga = document.getElementById('cot-carga');
    this.elementos.seguro = document.getElementById('cot-seguro');
    this.elementos.total = document.getElementById('cot-total');
    this.elementos.avisoRevision = document.getElementById('cotizacion-aviso-revision');
    this.elementos.enlaceWhatsApp = document.getElementById('cotizacion-enlace-whatsapp');

    this.ocultarAvisoRevision();
  },

  /**
   * Actualiza los valores del desglose en el DOM con animación sutil
   * @param {object} desglose
   */
  mostrarDesglose(desglose) {
    if (this.elementos.base) this.elementos.base.textContent = Formatters.formatCOP(desglose.tarifaBase);
    if (this.elementos.distancia) this.elementos.distancia.textContent = Formatters.formatCOP(desglose.costoDistancia);
    if (this.elementos.topografia) this.elementos.topografia.textContent = Formatters.formatCOP(desglose.recargoTopografia);
    if (this.elementos.carga) this.elementos.carga.textContent = Formatters.formatCOP(desglose.recargoCarga);
    if (this.elementos.seguro) this.elementos.seguro.textContent = Formatters.formatCOP(desglose.recargoSeguroMercancia);

    if (this.elementos.total) {
      this.elementos.total.textContent = Formatters.formatCOP(desglose.valorTotal);
      this.elementos.total.classList.remove('actualizado');
      void this.elementos.total.offsetWidth; // Forzar reflow para reiniciar animación
      this.elementos.total.classList.add('actualizado');
    }
  },

  /**
   * Muestra el banner de Extensión 3b cuando se supera el límite
   * @param {string} urlWhatsApp
   */
  mostrarAvisoRevision(urlWhatsApp) {
    if (this.elementos.avisoRevision) {
      this.elementos.avisoRevision.classList.remove('hidden');
    }
    if (this.elementos.enlaceWhatsApp) {
      this.elementos.enlaceWhatsApp.href = urlWhatsApp;
    }
  },

  /**
   * Oculta el banner de revisión manual
   */
  ocultarAvisoRevision() {
    if (this.elementos.avisoRevision) {
      this.elementos.avisoRevision.classList.add('hidden');
    }
  }
};

window.CotizacionView = CotizacionView;
