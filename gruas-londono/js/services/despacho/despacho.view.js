// Vista del microservicio de despacho.
// Renderiza tablero operativo, filtros, modales y vista móvil.

const DespachoView = {
  elements: {
    kpiPendientes: null,
    kpiAsignadas: null,
    kpiEnCamino: null,
    kpiFinalizadas: null,
    bandeja: null,
    filtroTexto: null,
    filtroEstado: null,
    modalAsignar: null,
    formAsignar: null,
    selectGrua: null,
    radicadoAsignar: null,
    modalBitacora: null,
    bitacoraContenido: null,
    conductorLista: null
  },

  /**
   * Inicializa referencias del DOM.
   */
  init() {
    this.elements.kpiPendientes = document.getElementById('kpi-pendientes');
    this.elements.kpiAsignadas = document.getElementById('kpi-asignadas');
    this.elements.kpiEnCamino = document.getElementById('kpi-en-camino');
    this.elements.kpiFinalizadas = document.getElementById('kpi-finalizadas');
    this.elements.bandeja = document.getElementById('despacho-bandeja');
    this.elements.filtroTexto = document.getElementById('despacho-filtro-texto');
    this.elements.filtroEstado = document.getElementById('despacho-filtro-estado');
    this.elements.modalAsignar = document.getElementById('modal-asignar-grua');
    this.elements.formAsignar = document.getElementById('form-asignar-grua');
    this.elements.selectGrua = document.getElementById('asignar-grua-select');
    this.elements.radicadoAsignar = document.getElementById('asignar-radicado');
    this.elements.modalBitacora = document.getElementById('modal-bitacora');
    this.elements.bitacoraContenido = document.getElementById('bitacora-contenido');
    this.elements.conductorLista = document.getElementById('conductor-lista');
  },

  /**
   * Renderiza el dashboard completo.
   * @param {Array} solicitudes - Lista de solicitudes.
   * @param {Array} gruas - Lista de grúas disponibles.
   */
  renderDashboard(solicitudes, gruas) {
    this._actualizarKpis(solicitudes);
    this._renderBandeja(solicitudes, gruas);
  },

  /**
   * Renderiza la lista de solicitudes para la vista de conductor.
   * @param {Array} solicitudes - Lista de solicitudes.
   */
  renderConductor(solicitudes) {
    const contenedor = this.elements.conductorLista;
    if (!contenedor) return;

    contenedor.innerHTML = '';
    solicitudes.forEach(solicitud => {
      contenedor.appendChild(this._crearCardConductor(solicitud));
    });
  },

  /**
   * Actualiza las métricas de KPI.
   * @param {Array} solicitudes
   */
  _actualizarKpis(solicitudes) {
    const cont = {
      PENDIENTE: 0,
      ASIGNADA: 0,
      EN_CAMINO: 0,
      FINALIZADA: 0
    };

    solicitudes.forEach(s => {
      if (cont[s.estado] !== undefined) cont[s.estado]++;
    });

    this.elements.kpiPendientes.textContent = cont.PENDIENTE;
    this.elements.kpiAsignadas.textContent = cont.ASIGNADA;
    this.elements.kpiEnCamino.textContent = cont.EN_CAMINO;
    this.elements.kpiFinalizadas.textContent = cont.FINALIZADA;
  },

  /**
   * Renderiza las tarjetas de solicitudes en la bandeja.
   * @param {Array} solicitudes
   * @param {Array} gruas
   */
  _renderBandeja(solicitudes, gruas) {
    const contenedor = this.elements.bandeja;
    if (!contenedor) return;

    contenedor.innerHTML = '';
    solicitudes.forEach(solicitud => {
      contenedor.appendChild(this._crearCardSolicitud(solicitud, gruas));
    });
  },

  /**
   * Crea una tarjeta para el dashboard.
   * @param {object} solicitud
   * @param {Array} gruas
   * @returns {HTMLElement}
   */
  _crearCardSolicitud(solicitud, gruas) {
    const infoEstado = DespachoModel.obtenerInformacionEstado(solicitud.estado);
    const card = document.createElement('article');
    card.className = `card solicitud-card estado-${infoEstado.clase}`;
    card.dataset.id = solicitud.id;
    card.dataset.estado = solicitud.estado;

    const botones = this._obtenerBotonesAccion(solicitud);
    const detalleGrua = solicitud.despacho
      ? `<div class="asignacion-detalle">Grúa ${solicitud.despacho.idGrua} · ${solicitud.despacho.placaGrua || ''}</div>`
      : '';

    card.innerHTML = `
      <div class="solicitud-header">
        <span class="radicado">${solicitud.radicado}</span>
        <span class="badge estado-${infoEstado.clase}" style="color:${infoEstado.color}; background:${infoEstado.bg}; border-color:${infoEstado.color}">
          ${infoEstado.etiqueta}
        </span>
      </div>
      <div class="solicitud-body">
        <strong>${solicitud.cliente?.nombre || 'Cliente'}</strong>
        <p>${solicitud.servicio?.origen || ''} → ${solicitud.servicio?.destino || ''}</p>
        <div class="solicitud-meta">
          <span>${solicitud.vehiculo?.placa || 'N/A'}</span>
          <span>${Formatters.formatCOP(solicitud.cotizacion?.valorTotal)}</span>
        </div>
        ${detalleGrua}
      </div>
      <div class="solicitud-actions">
        ${botones}
      </div>
    `;

    // Asignar event listeners a botones internos
    return card;
  },

  /**
   * Crea una tarjeta simplificada para conductor.
   * @param {object} solicitud
   * @returns {HTMLElement}
   */
  _crearCardConductor(solicitud) {
    const card = document.createElement('article');
    card.className = 'card conductor-card';
    card.dataset.id = solicitud.id;
    card.dataset.estado = solicitud.estado;

    const botones = this._obtenerBotonesAccion(solicitud, true);

    card.innerHTML = `
      <div class="conductor-info">
        <strong>${solicitud.radicado}</strong>
        <p>${solicitud.servicio?.origen || ''} → ${solicitud.servicio?.destino || ''}</p>
        <div class="conductor-meta">
          <span>${solicitud.vehiculo?.placa || 'N/A'}</span>
          <span>${Formatters.formatCOP(solicitud.cotizacion?.valorTotal)}</span>
        </div>
      </div>
      <div class="conductor-actions">
        ${botones}
      </div>
    `;

    return card;
  },

  /**
   * Obtiene botones de acción según el estado actual.
   * @param {object} solicitud
   * @param {boolean} esConductor - Si es para vista conductor (botones grandes).
   * @returns {string} HTML con botones.
   */
  _obtenerBotonesAccion(solicitud, esConductor = false) {
    const acciones = [];
    const estado = solicitud.estado;
    const claseBoton = esConductor ? 'btn btn-block conductor-btn' : 'btn btn-small';

    if (estado === 'PENDIENTE') {
      acciones.push(`<button class="${claseBoton} btn-primary" data-action="asignar" data-id="${solicitud.id}">Asignar grúa</button>`);
      acciones.push(`<button class="${claseBoton} btn-danger" data-action="cancelar" data-id="${solicitud.id}">Cancelar</button>`);
    }

    if (estado === 'ASIGNADA') {
      acciones.push(`<button class="${claseBoton} btn-secondary" data-action="en-camino" data-id="${solicitud.id}">En camino</button>`);
      acciones.push(`<button class="${claseBoton} btn-danger" data-action="cancelar" data-id="${solicitud.id}">Cancelar</button>`);
    }

    if (estado === 'EN_CAMINO') {
      acciones.push(`<button class="${claseBoton} btn-secondary" data-action="en-sitio" data-id="${solicitud.id}">En sitio</button>`);
      acciones.push(`<button class="${claseBoton} btn-danger" data-action="cancelar" data-id="${solicitud.id}">Cancelar</button>`);
    }

    if (estado === 'EN_SITIO') {
      acciones.push(`<button class="${claseBoton} btn-success" data-action="finalizar" data-id="${solicitud.id}">Finalizar</button>`);
    }

    // Siempre ofrecer ver bitácora
    acciones.push(`<button class="${claseBoton} btn-ghost" data-action="bitacora" data-id="${solicitud.id}">Bitácora</button>`);

    return acciones.join('');
  },

  /**
   * Actualiza las opciones del select de grúas.
   * @param {Array} gruas
   */
  actualizarSelectGruas(gruas) {
    const select = this.elements.selectGrua;
    if (!select) return;

    select.innerHTML = '<option value="">Selecciona una grúa</option>';
    gruas.forEach(grua => {
      const option = document.createElement('option');
      option.value = grua.id;
      option.textContent = `${grua.id} - ${grua.placa} (${grua.tipo}) Cap. ${grua.capacidadToneladas} ton`;
      if (!grua.disponible) option.disabled = true;
      select.appendChild(option);
    });
  },

  /**
   * Muestra modal de asignación con datos de la solicitud.
   * @param {object} solicitud
   */
  mostrarModalAsignar(solicitud) {
    if (!this.elements.modalAsignar) return;
    this.elements.radicadoAsignar.textContent = solicitud.radicado;
    this.elements.modalAsignar.classList.remove('hidden');
    this.elements.formAsignar.dataset.solicitudId = solicitud.id;
  },

  /**
   * Cierra modal de asignación.
   */
  cerrarModalAsignar() {
    this.elements.modalAsignar?.classList.add('hidden');
  },

  /**
   * Muestra modal de bitácora con notas.
   * @param {object} solicitud
   */
  mostrarModalBitacora(solicitud) {
    if (!this.elements.modalBitacora) return;
    const contenedor = this.elements.bitacoraContenido;
    contenedor.innerHTML = '';

    if (!solicitud.bitacora || solicitud.bitacora.length === 0) {
      contenedor.innerHTML = '<p class="text-muted">Sin notas registradas.</p>';
    } else {
      solicitud.bitacora.forEach(nota => {
        const div = document.createElement('div');
        div.className = 'bitacora-item';
        div.innerHTML = `
          <span>${Formatters.formatDateTime(nota.fecha)}</span>
          <strong>${nota.autor}</strong>
          <p>${nota.nota}</p>
        `;
        contenedor.appendChild(div);
      });
    }

    this.elements.modalBitacora.classList.remove('hidden');
  },

  /**
   * Cierra modal de bitácora.
   */
  cerrarModalBitacora() {
    this.elements.modalBitacora?.classList.add('hidden');
  }
};
