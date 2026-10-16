/* =====================================================================
   CONTROLADOR: SEGUIMIENTO PÚBLICO (TRACKING) · GRÚAS LONDOÑO
   Búsqueda por radicado y documento, y escucha reactiva en tiempo real.
   ===================================================================== */
const TrackingController = {
  form: null,
  activeUnsubscribe: null,

  init() {
    TrackingView.init();
    this.form = document.getElementById('tracking-form');
    if (!this.form) return;

    this._bindEvents();
    this._verificarParametrosURL();
  },

  _bindEvents() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const radicado = document.getElementById('tracking-radicado')?.value.trim();
      const doc = document.getElementById('tracking-documento')?.value.trim();
      await this.consultar(radicado, doc);
    });

    // Soporte para chips de prueba rápida demo
    document.querySelectorAll('.tracking-chip[data-rad]').forEach(chip => {
      chip.addEventListener('click', () => {
        const rad = chip.dataset.rad;
        const doc = chip.dataset.doc;
        const inpRad = document.getElementById('tracking-radicado');
        const inpDoc = document.getElementById('tracking-documento');
        if (inpRad && inpDoc) {
          inpRad.value = rad;
          inpDoc.value = doc;
          this.consultar(rad, doc);
        }
      });
    });

    window.addEventListener('beforeunload', () => {
      this._detenerEscucha();
    });
  },

  _verificarParametrosURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      const rad = params.get('radicado');
      const doc = params.get('doc');
      if (rad && doc) {
        const inpRad = document.getElementById('tracking-radicado');
        const inpDoc = document.getElementById('tracking-documento');
        if (inpRad) inpRad.value = rad;
        if (inpDoc) inpDoc.value = doc;
        this.consultar(rad, doc);
      }
    } catch (e) {
      console.warn('Error leyendo params de URL:', e);
    }
  },

  async consultar(radicado, documento) {
    if (!radicado || !documento) {
      Notifications.showToast('Ingresa número de radicado y documento', 'warning');
      return;
    }

    this._detenerEscucha();
    TrackingView.toggleLoading(true);
    TrackingView.limpiarResultado();

    try {
      const resultado = await RadicacionModel.consultarPorRadicadoYDocumento(radicado, documento);

      if (!resultado) {
        TrackingView.mostrarError(
          `No encontramos ninguna solicitud con el radicado ${radicado} y documento ${documento}. Verifica que los datos coincidan exactamente.`
        );
        return;
      }

      // Mostrar inicialmente
      TrackingView.mostrarSolicitud(resultado);

      // Iniciar escucha en tiempo real del documento
      if (resultado.ref && resultado.ref.onSnapshot) {
        this.activeUnsubscribe = resultado.ref.onSnapshot((docSnap) => {
          if (docSnap.exists) {
            const data = { id: docSnap.id, ...docSnap.data() };
            TrackingView.mostrarSolicitud(data);
          }
        }, (err) => {
          console.warn('Error en tracking realtime listener:', err);
        });
      }
    } catch (err) {
      console.error('Error al consultar radicado:', err);
      TrackingView.mostrarError('Ocurrió un error al consultar el sistema. Intenta nuevamente.');
    } finally {
      TrackingView.toggleLoading(false);
    }
  },

  _detenerEscucha() {
    if (this.activeUnsubscribe) {
      this.activeUnsubscribe();
      this.activeUnsubscribe = null;
    }
  }
};

window.TrackingController = TrackingController;
