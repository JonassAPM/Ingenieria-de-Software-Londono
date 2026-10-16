/* =====================================================================
   VISTA: RADICACIÓN DE SOLICITUDES (WIZARD 4 PASOS) · GRÚAS LONDOÑO
   Gestión del asistente paso a paso, resumen reactivo lateral,
   validación visual de campos y modal de confirmación con descarga PDF.
   ===================================================================== */
const RadicacionView = {
  form: null,
  pasoActual: 1,
  totalPasos: 4,
  modalExito: null,

  init() {
    this.form = document.getElementById('radicacion-form');
    this.modalExito = document.getElementById('modal-radicacion-exitosa');
    if (!this.form) return;

    this._bindStepperEvents();
    this.mostrarPaso(1);
  },

  _bindStepperEvents() {
    // Botones de paso siguiente y anterior
    this.form.querySelectorAll('[data-step-next]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this._validarPasoActual()) {
          this.mostrarPaso(this.pasoActual + 1);
        }
      });
    });

    this.form.querySelectorAll('[data-step-prev]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.mostrarPaso(this.pasoActual - 1);
      });
    });

    // Cerrar modal de éxito
    document.querySelectorAll('[data-close-exito]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.modalExito) this.modalExito.classList.add('hidden');
        document.body.classList.remove('modal-abierto');
      });
    });
  },

  mostrarPaso(paso) {
    if (paso < 1 || paso > this.totalPasos) return;
    this.pasoActual = paso;

    // 1. Mostrar/ocultar paneles
    for (let i = 1; i <= this.totalPasos; i++) {
      const panel = document.getElementById(`wizard-paso-${i}`);
      const stepItem = document.getElementById(`stepper-step-${i}`);
      if (panel) panel.classList.toggle('hidden', i !== paso);
      if (stepItem) {
        stepItem.classList.toggle('is-active', i === paso);
        stepItem.classList.toggle('is-done', i < paso);
      }
    }

    // 2. Scroll suave hacia el asistente si está fuera de pantalla
    const seccion = document.getElementById('radicacion');
    if (seccion && window.scrollY > seccion.offsetTop + 100) {
      seccion.scrollIntoView({ behavior: 'smooth' });
    }
  },

  _validarPasoActual() {
    this.limpiarErrores();
    let esValido = true;
    const panel = document.getElementById(`wizard-paso-${this.pasoActual}`);
    if (!panel) return true;

    const requeridos = panel.querySelectorAll('input[required], select[required]');
    requeridos.forEach(input => {
      if (!input.value || !input.value.trim()) {
        esValido = false;
        this.marcarCampoError(input.id, 'Este campo es obligatorio');
      } else if (input.type === 'email' && !input.value.includes('@')) {
        esValido = false;
        this.marcarCampoError(input.id, 'Ingresa un correo electrónico válido');
      } else if (input.type === 'number' && Number(input.value) <= 0) {
        esValido = false;
        this.marcarCampoError(input.id, 'Ingresa un valor mayor a 0');
      }
    });

    if (!esValido && window.Notifications) {
      Notifications.showToast('Por favor completa los campos requeridos', 'warning');
    }
    return esValido;
  },

  marcarCampoError(fieldId, mensaje) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    const field = input.closest('.field');
    if (field) {
      field.classList.add('has-error');
      const err = field.querySelector('.field-error');
      if (err) err.textContent = mensaje;
    }
  },

  mostrarErrores(errores) {
    this.limpiarErrores();
    Object.entries(errores).forEach(([fieldId, mensaje]) => {
      this.marcarCampoError(fieldId, mensaje);
    });
  },

  limpiarErrores() {
    if (!this.form) return;
    this.form.querySelectorAll('.field.has-error').forEach(f => {
      f.classList.remove('has-error');
      const err = f.querySelector('.field-error');
      if (err) err.textContent = '';
    });
  },

  /**
   * Actualiza el resumen reactivo de la tarjeta derecha
   * @param {object} datos
   * @param {object} cotizacion
   */
  actualizarResumen(datos, cotizacion) {
    const setTexto = (id, val, fallback = '—') => {
      const el = document.getElementById(id);
      if (el) {
        const texto = (val && String(val).trim()) ? String(val).trim() : fallback;
        el.textContent = texto;
        el.classList.toggle('vacio', texto === fallback);
      }
    };

    setTexto('sum-cliente-nombre', datos.cliente?.nombre);
    setTexto('sum-cliente-doc', datos.cliente?.documento);
    setTexto('sum-servicio-ruta', (datos.servicio?.origen && datos.servicio?.destino)
      ? `${datos.servicio.origen} → ${datos.servicio.destino}`
      : '');
    setTexto('sum-servicio-distancia', datos.servicio?.distanciaKm ? Formatters.formatKm(datos.servicio.distanciaKm) : '');
    setTexto('sum-vehiculo-placa', datos.vehiculo?.placa);
    setTexto('sum-vehiculo-datos', (datos.vehiculo?.tipo || datos.vehiculo?.pesoToneladas)
      ? `${datos.vehiculo.tipo || 'Vehículo'} (${datos.vehiculo.pesoToneladas || 0} ton)`
      : '');

    const elTotal = document.getElementById('sum-total');
    if (elTotal && cotizacion) {
      elTotal.textContent = Formatters.formatCOP(cotizacion.valorTotal);
    }
  },

  /**
   * Muestra el modal final de éxito con el radicado y botones de acción
   * @param {object} solicitud
   */
  mostrarModalExito(solicitud) {
    if (!this.modalExito) return;

    const elRadicado = document.getElementById('exito-radicado');
    if (elRadicado) elRadicado.textContent = solicitud.radicado;

    const btnPdf = document.getElementById('btn-descargar-pdf-exito');
    if (btnPdf) {
      btnPdf.onclick = () => {
        PdfGenerator.generarComprobante(solicitud);
      };
    }

    const btnTrack = document.getElementById('btn-ir-seguimiento-exito');
    if (btnTrack) {
      btnTrack.onclick = () => {
        window.location.href = `pages/tracking.html?radicado=${solicitud.radicado}&doc=${solicitud.cliente.documento}`;
      };
    }

    this.modalExito.classList.remove('hidden');
    document.body.classList.add('modal-abierto');
  },

  toggleLoading(estado) {
    const btnSubmit = this.form?.querySelector('button[type="submit"]');
    if (btnSubmit) {
      btnSubmit.classList.toggle('is-loading', estado);
      btnSubmit.disabled = estado;
    }
  }
};

window.RadicacionView = RadicacionView;
