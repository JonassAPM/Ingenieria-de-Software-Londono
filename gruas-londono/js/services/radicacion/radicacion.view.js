// Vista del microservicio de radicación.
// Gestiona errores, notificaciones, y renderizado del seguimiento público.
const RadicacionView = {
  form: null,
  trackingForm: null,

  /**
   * Inicializa referencias del DOM.
   */
  init() {
    this.form = document.getElementById('radicacion-form');
    this.trackingForm = document.getElementById('tracking-form');
  },

  /**
   * Muestra errores de validación en los campos correspondientes.
   * @param {object} errores - Objeto con id de campo y mensaje.
   */
  mostrarErrores(errores) {
    Object.entries(errores).forEach(([campoId, mensaje]) => {
      const input = document.getElementById(campoId);
      if (!input) return;

      const contenedor = input.closest('.form-group');
      if (!contenedor) return;

      let errorSpan = contenedor.querySelector('.error-message');
      if (!errorSpan) {
        errorSpan = document.createElement('span');
        errorSpan.className = 'error-message';
        contenedor.appendChild(errorSpan);
      }
      errorSpan.textContent = mensaje;
      input.classList.add('input-error');
    });
  },

  /**
   * Limpia todos los mensajes de error del formulario.
   */
  limpiarErrores() {
    if (!this.form) return;
    this.form.querySelectorAll('.error-message').forEach(span => span.textContent = '');
    this.form.querySelectorAll('.input-error').forEach(input => input.classList.remove('input-error'));
  },

  /**
   * Muestra una notificación de éxito con el radicado generado.
   * @param {string} radicado - Código asignado.
   */
  mostrarExito(radicado) {
    Notifications.showToast(`Solicitud radicada correctamente: ${radicado}`, 'success');
  },

  /**
   * Muestra una notificación de error.
   * @param {string} mensaje - Descripción del error.
   */
  mostrarError(mensaje) {
    Notifications.showToast(mensaje, 'error');
  },

  /**
   * Alterna el estado de carga del botón de envío.
   * @param {boolean} estado - true para loading, false para normal.
   */
  toggleLoading(estado) {
    const boton = this.form?.querySelector('button[type="submit"]');
    if (boton) {
      boton.disabled = estado;
      boton.textContent = estado ? 'Procesando...' : 'Radicar solicitud';
    }
  },

  /**
   * Limpia el contenedor de resultado de seguimiento.
   */
  limpiarResultadoSeguimiento() {
    const contenedor = document.getElementById('tracking-result');
    if (contenedor) {
      contenedor.innerHTML = '';
      contenedor.classList.add('hidden');
    }
  },

  /**
   * Muestra un error en el resultado de seguimiento.
   * @param {string} mensaje - Mensaje de error.
   */
  mostrarErrorSeguimiento(mensaje) {
    const contenedor = document.getElementById('tracking-result');
    if (!contenedor) return;

    const alerta = document.createElement('div');
    alerta.className = 'alert-box';
    alerta.textContent = mensaje;
    contenedor.appendChild(alerta);
    contenedor.classList.remove('hidden');
  },

  /**
   * Muestra la solicitud completa con barra de progreso y datos no sensibles.
   * @param {object} solicitud - Objeto con datos de la solicitud.
   */
  mostrarResultadoSeguimiento(solicitud) {
    const contenedor = document.getElementById('tracking-result');
    if (!contenedor) return;

    // Limpiar contenido previo para evitar acumulación en tiempo real
    contenedor.innerHTML = '';
    contenedor.appendChild(this._construirTarjetaSeguimiento(solicitud));
    contenedor.classList.remove('hidden');
  },

  /**
   * Alterna el estado de carga del botón de seguimiento.
   * @param {boolean} estado - true para loading, false para normal.
   */
  toggleLoadingSeguimiento(estado) {
    const boton = document.querySelector('#tracking-form button[type="submit"]');
    if (boton) {
      boton.disabled = estado;
      boton.textContent = estado ? 'Consultando...' : 'Consultar';
    }
  },

  /**
   * Construye la tarjeta de seguimiento con barra de progreso y datos.
   * @param {object} solicitud
   * @returns {HTMLElement}
   */
  _construirTarjetaSeguimiento(solicitud) {
    const card = document.createElement('article');
    card.className = 'card tracking-card';

    const infoEstado = DespachoModel?.obtenerInformacionEstado?.(solicitud.estado) || {
      etiqueta: solicitud.estado,
      color: '#94a3b8'
    };

    const progreso = this._construirBarraProgreso(solicitud.estado);

    const detalleGrua = solicitud.despacho
      ? `<p><strong>Grúa asignada:</strong> ${this._escapeHTML(solicitud.despacho.idGrua)} - ${this._escapeHTML(solicitud.despacho.placaGrua || '')}</p>`
      : '';

    card.innerHTML = `
      <div class="tracking-header">
        <h2>${this._escapeHTML(solicitud.radicado)}</h2>
        <span class="badge" style="color:${infoEstado.color}; background:${infoEstado.bg || 'transparent'}; border-color:${infoEstado.color}">
          ${this._escapeHTML(infoEstado.etiqueta)}
        </span>
      </div>
      <div class="tracking-progress">${progreso}</div>
      <div class="tracking-details">
        <p><strong>Cliente:</strong> ${this._escapeHTML(solicitud.cliente?.nombre || 'N/A')}</p>
        <p><strong>Origen:</strong> ${this._escapeHTML(solicitud.servicio?.origen || '')}</p>
        <p><strong>Destino:</strong> ${this._escapeHTML(solicitud.servicio?.destino || '')}</p>
        <p><strong>Vehículo:</strong> ${this._escapeHTML(solicitud.vehiculo?.placa || '')} - ${this._escapeHTML(solicitud.vehiculo?.tipo || '')}</p>
        ${detalleGrua}
      </div>
    `;

    return card;
  },

  /**
   * Genera la barra de progreso visual de 4 pasos según el estado.
   * @param {string} estado - Estado actual de la solicitud.
   * @returns {string} HTML de la barra de progreso.
   */
  _construirBarraProgreso(estado) {
    const pasos = [
      'Solicitud Radicada',
      'Grúa Asignada',
      'En Camino',
      'En Sitio / Finalizado'
    ];

    const indiceActivo = {
      'PENDIENTE': 0,
      'ASIGNADA': 1,
      'EN_CAMINO': 2,
      'EN_SITIO': 3,
      'FINALIZADA': 3,
      'CANCELADA': -1
    }[estado] ?? 0;

    if (indiceActivo === -1) {
      return `<div class="tracking-cancelada">Solicitud cancelada</div>`;
    }

    return `
      <div class="progress-steps">
        ${pasos.map((paso, idx) => `
          <div class="step ${idx <= indiceActivo ? 'active' : ''}">
            <div class="step-circle">${idx + 1}</div>
            <div class="step-label">${paso}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Escapa caracteres HTML para prevenir XSS en el contenido generado.
   * @param {string|number} valor
   * @returns {string}
   */
  _escapeHTML(valor) {
    const div = document.createElement('div');
    div.textContent = valor ?? '';
    return div.innerHTML;
  }
};
