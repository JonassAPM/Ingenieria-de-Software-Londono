// Controlador del microservicio de cotización SICETAC.
// Orquesta la lectura de datos, el cálculo y la actualización de la vista.
const CotizacionController = {
  formulario: null,

  /**
   * Inicializa el módulo y asocia los eventos del formulario.
   */
  init() {
    this.formulario = document.getElementById('cotizador-form');
    if (!this.formulario) return;

    CotizacionView.init();
    this._asociarEventos();
  },

  /**
   * Asocia eventos de entrada y envío para actualizar la cotización en tiempo real.
   */
  _asociarEventos() {
    this.formulario.addEventListener('input', () => this._calcularDesdeFormulario());
    this.formulario.addEventListener('submit', (e) => {
      e.preventDefault();
      this._calcularDesdeFormulario();
    });
  },

  /**
   * Lee los valores del formulario, invoca el modelo y actualiza la vista.
   */
  _calcularDesdeFormulario() {
    if (!this.formulario) return;

    const datos = {
      tipoEnganche: document.getElementById('tipo-enganche')?.value || 'urbano',
      distanciaKm: document.getElementById('distancia-km')?.value || 0,
      topografia: document.getElementById('topografia')?.value || 'plano',
      pesoToneladas: document.getElementById('peso-toneladas')?.value || 0,
      valorComercialDeclarado: document.getElementById('valor-comercial')?.value || 0,
      fallaMecanica: document.getElementById('falla-mecanica')?.value || ''
    };

    const desglose = CotizacionModel.calcularCotizacion(datos);
    CotizacionView.mostrarDesglose(desglose);

    if (desglose.requiereRevisionManual) {
      const enlace = CotizacionModel.generarEnlaceWhatsApp(datos);
      CotizacionView.mostrarAvisoRevision(enlace);
    } else {
      CotizacionView.ocultarAvisoRevision();
    }
  }
};
