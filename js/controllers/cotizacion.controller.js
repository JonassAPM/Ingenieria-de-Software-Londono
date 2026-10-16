/* =====================================================================
   CONTROLADOR: COTIZACIÓN NORMADA SICETAC · GRÚAS LONDOÑO
   Lectura de entradas, cálculo algorítmico reactivo y aviso Extensión 3b.
   ===================================================================== */
const CotizacionController = {
  form: null,
  ultimaCotizacion: null,

  init() {
    this.form = document.getElementById('cotizador-form');
    if (!this.form) return;

    CotizacionView.init();
    this._bindEvents();
    this.recalcular();
  },

  _bindEvents() {
    // Cálculo reactivo en cada pulsación o cambio de opción
    this.form.addEventListener('input', () => this.recalcular());
    this.form.addEventListener('change', () => this.recalcular());
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.recalcular();
      // Scroll suave hacia radicación si se solicita cotizar
      const secRadicacion = document.getElementById('radicacion');
      if (secRadicacion) {
        secRadicacion.scrollIntoView({ behavior: 'smooth' });
      }
    });

    // Sincronización con el selector de enganche y topografía
    const selectEnganche = document.getElementById('tipo-enganche');
    const inputDist = document.getElementById('distancia-km');
    const selectTopografia = document.getElementById('topografia');
    const inputPeso = document.getElementById('peso-toneladas');
    const inputValor = document.getElementById('valor-comercial');
    const inputFalla = document.getElementById('falla-mecanica');

    // Transferir al formulario de radicación si se modifican
    [inputDist, inputPeso, inputValor].forEach(inp => {
      if (inp) {
        inp.addEventListener('blur', () => this._sincronizarConRadicacion());
      }
    });
  },

  obtenerValoresFormulario() {
    return {
      tipoEnganche: document.getElementById('tipo-enganche')?.value || 'urbano',
      distanciaKm: Number(document.getElementById('distancia-km')?.value || 0),
      topografia: document.getElementById('topografia')?.value || 'plano',
      pesoToneladas: Number(document.getElementById('peso-toneladas')?.value || 0),
      valorComercialDeclarado: Number(document.getElementById('valor-comercial')?.value || 0),
      fallaMecanica: document.getElementById('falla-mecanica')?.value || ''
    };
  },

  recalcular() {
    const datos = this.obtenerValoresFormulario();
    const desglose = CotizacionModel.calcularCotizacion(datos);
    this.ultimaCotizacion = desglose;

    CotizacionView.mostrarDesglose(desglose);

    if (desglose.requiereRevisionManual) {
      const urlWa = CotizacionModel.generarEnlaceWhatsApp(datos);
      CotizacionView.mostrarAvisoRevision(urlWa);
    } else {
      CotizacionView.ocultarAvisoRevision();
    }

    // Disparar evento para que el asistente de radicación actualice su resumen
    document.dispatchEvent(new CustomEvent('cotizacion:calculada', {
      detail: { datos, desglose }
    }));

    return desglose;
  },

  _sincronizarConRadicacion() {
    const datos = this.obtenerValoresFormulario();
    const map = {
      'distancia-km': 'servicio-distancia',
      'peso-toneladas': 'vehiculo-peso',
      'valor-comercial': 'vehiculo-valor'
    };
    Object.entries(map).forEach(([origen, destino]) => {
      const origEl = document.getElementById(origen);
      const destEl = document.getElementById(destino);
      if (origEl && destEl && (!destEl.value || destEl.value === '0')) {
        destEl.value = origEl.value;
      }
    });
  }
};

window.CotizacionController = CotizacionController;
