/* =====================================================================
   VISTA: DESPACHO Y CONTROL DE FLOTA · GRÚAS LONDOÑO
   Tablero operativo cromático en tiempo real, KPIs dinámicos,
   modales de asignación y bitácora, y vista táctil para conductores.
   ===================================================================== */
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
    infoVehiculoAsignar: null,
    modalBitacora: null,
    bitacoraContenido: null,
    conductorLista: null,
    conductorSelectGrua: null
  },

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
    this.elements.infoVehiculoAsignar = document.getElementById('asignar-vehiculo-info');
    this.elements.modalBitacora = document.getElementById('modal-bitacora');
    this.elements.bitacoraContenido = document.getElementById('bitacora-contenido');
    this.elements.conductorLista = document.getElementById('conductor-lista');
    this.elements.conductorSelectGrua = document.getElementById('conductor-filtro-grua');

    this._bindModalEvents();
  },

  _bindModalEvents() {
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.cerrarModalAsignar();
        this.cerrarModalBitacora();
      });
    });

    [this.elements.modalAsignar, this.elements.modalBitacora].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.cerrarModalAsignar();
            this.cerrarModalBitacora();
          }
        });
      }
    });
  },

  renderDashboard(solicitudes, gruas) {
    this._actualizarKpis(solicitudes);
    this._renderBandeja(solicitudes, gruas);
  },

  _actualizarKpis(solicitudes) {
    const counts = { PENDIENTE: 0, ASIGNADA: 0, EN_CAMINO: 0, FINALIZADA: 0 };
    solicitudes.forEach(s => {
      if (counts[s.estado] !== undefined) counts[s.estado]++;
    });

    if (this.elements.kpiPendientes) this.elements.kpiPendientes.textContent = counts.PENDIENTE;
    if (this.elements.kpiAsignadas) this.elements.kpiAsignadas.textContent = counts.ASIGNADA;
    if (this.elements.kpiEnCamino) this.elements.kpiEnCamino.textContent = counts.EN_CAMINO;
    if (this.elements.kpiFinalizadas) this.elements.kpiFinalizadas.textContent = counts.FINALIZADA;
  },

  _renderBandeja(solicitudes, gruas) {
    const contenedor = this.elements.bandeja;
    if (!contenedor) return;

    if (!solicitudes || solicitudes.length === 0) {
      contenedor.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg class="icon icon-lg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <h3>No hay órdenes activas</h3>
          <p>Las solicitudes radicadas por los clientes aparecerán automáticamente aquí en tiempo real.</p>
        </div>
      `;
      return;
    }

    contenedor.innerHTML = '';
    solicitudes.forEach(sol => {
      contenedor.appendChild(this._crearCardSolicitud(sol, gruas));
    });
  },

  _crearCardSolicitud(sol, gruas) {
    const card = document.createElement('article');
    const info = DespachoModel.obtenerInfoEstado(sol.estado);
    card.className = `solicitud-card card-${sol.estado.toLowerCase().replace('_', '-')}`;
    card.dataset.id = sol.id;

    const botones = this._generarBotonesAccion(sol);
    const detalleGrua = sol.despacho
      ? `<div class="solicitud-grua-box">
           <span><strong>Grúa:</strong> ${Formatters.escapeHTML(sol.despacho.idGrua)} (${Formatters.escapeHTML(sol.despacho.placaGrua || '')})</span>
           <span><strong>Cond:</strong> ${Formatters.escapeHTML(sol.despacho.nombreConductor || 'Asignado')}</span>
         </div>`
      : '';

    card.innerHTML = `
      <div class="solicitud-header">
        <span class="solicitud-radicado">${Formatters.escapeHTML(sol.radicado)}</span>
        <span class="badge ${info.clase}">${info.etiqueta}</span>
      </div>
      <div class="solicitud-body">
        <div class="solicitud-cliente-row">
          <span class="solicitud-cliente">${Formatters.escapeHTML(sol.cliente?.nombre || 'Cliente')}</span>
          <span class="solicitud-telefono">${Formatters.escapeHTML(sol.cliente?.telefono || '')}</span>
        </div>
        <div class="solicitud-ruta">
          <div class="ruta-item">
            <svg class="icon icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            <span><strong>Origen:</strong> ${Formatters.escapeHTML(sol.servicio?.origen || '—')}</span>
          </div>
          <div class="ruta-item">
            <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
            <span><strong>Destino:</strong> ${Formatters.escapeHTML(sol.servicio?.destino || '—')}</span>
          </div>
        </div>
        <div class="solicitud-vehiculo">
          <span class="vehiculo-placa">${Formatters.escapeHTML(sol.vehiculo?.placa || 'N/A')}</span>
          <span>${Formatters.escapeHTML(sol.vehiculo?.tipo || '')} (${Formatters.formatToneladas(sol.vehiculo?.pesoToneladas)})</span>
          <span class="solicitud-precio">${Formatters.formatCOP(sol.cotizacion?.valorTotal)}</span>
        </div>
        ${detalleGrua}
      </div>
      <div class="solicitud-actions">
        ${botones}
      </div>
    `;

    return card;
  },

  _generarBotonesAccion(sol, esConductor = false) {
    const estado = sol.estado;
    const btnClase = esConductor ? 'btn btn-block conductor-touch-btn' : 'btn btn-sm';
    const acciones = [];

    if (estado === 'PENDIENTE') {
      acciones.push(`<button class="${btnClase} btn-primary" data-action="asignar" data-id="${sol.id}">Asignar Grúa</button>`);
      acciones.push(`<button class="${btnClase} btn-danger" data-action="cancelar" data-id="${sol.id}">Cancelar</button>`);
    } else if (estado === 'ASIGNADA') {
      acciones.push(`<button class="${btnClase} btn-primary" data-action="en-camino" data-id="${sol.id}">Despachar (En Camino)</button>`);
      acciones.push(`<button class="${btnClase} btn-danger" data-action="cancelar" data-id="${sol.id}">Cancelar</button>`);
    } else if (estado === 'EN_CAMINO') {
      acciones.push(`<button class="${btnClase} btn-primary" data-action="en-sitio" data-id="${sol.id}">Reportar En Sitio</button>`);
      acciones.push(`<button class="${btnClase} btn-danger" data-action="cancelar" data-id="${sol.id}">Cancelar (Enganche)</button>`);
    } else if (estado === 'EN_SITIO') {
      acciones.push(`<button class="${btnClase} btn-success" data-action="finalizar" data-id="${sol.id}">Finalizar Servicio</button>`);
    }

    if (!esConductor) {
      acciones.push(`<button class="${btnClase} btn-ghost" data-action="bitacora" data-id="${sol.id}">Bitácora</button>`);
    }

    return acciones.join('');
  },

  // Vista especializada Conductor (Modo Carretera de Alto Contraste)
  renderConductor(solicitudes, gruaSeleccionada = '') {
    const contenedor = this.elements.conductorLista;
    if (!contenedor) return;

    // Filtrar solicitudes asignadas a esta grúa si hay selección
    const filtradas = gruaSeleccionada
      ? solicitudes.filter(s => s.despacho?.idGrua === gruaSeleccionada && s.estado !== 'FINALIZADA' && s.estado !== 'CANCELADA')
      : solicitudes.filter(s => s.estado !== 'FINALIZADA' && s.estado !== 'CANCELADA');

    if (filtradas.length === 0) {
      contenedor.innerHTML = `
        <div class="empty-state" style="background: #FFFFFF; border: 1.5px solid var(--gl-border); border-radius: 20px; box-shadow: var(--gl-shadow-sm); padding: 48px 24px;">
          <div class="empty-state-icon" style="background: rgba(220,38,38,0.08); color: var(--gl-primary); width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
            <svg class="icon icon-lg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
          </div>
          <h3 style="color: var(--gl-text-1); font-size:1.3rem; margin-bottom:8px;">Sin órdenes en ruta</h3>
          <p style="color: var(--gl-text-3); font-size:0.95rem;">Actualmente no hay servicios asignados pendientes por ejecutar para esta grúa.</p>
        </div>
      `;
      return;
    }

    contenedor.innerHTML = '';
    filtradas.forEach(sol => {
      const card = document.createElement('article');
      card.className = `conductor-card ${sol.estado === 'EN_CAMINO' || sol.estado === 'EN_SITIO' ? 'activa' : ''}`;
      card.dataset.id = sol.id;

      const info = DespachoModel.obtenerInfoEstado(sol.estado);
      const botones = this._generarBotonesAccion(sol, true);

      card.innerHTML = `
        <div class="conductor-card-header">
          <span class="conductor-radicado">${Formatters.escapeHTML(sol.radicado)}</span>
          <span class="badge ${info.clase}">${info.etiqueta}</span>
        </div>
        <div class="conductor-card-body">
          <div class="conductor-spec-item">
            <small>Ruta de Asistencia</small>
            <strong>${Formatters.escapeHTML(sol.servicio?.origen || '')} → ${Formatters.escapeHTML(sol.servicio?.destino || '')}</strong>
          </div>
          <div class="conductor-spec-grid">
            <div class="conductor-spec-item">
              <small>Vehículo</small>
              <strong>${Formatters.escapeHTML(sol.vehiculo?.placa || '')} (${Formatters.escapeHTML(sol.vehiculo?.tipo || '')})</strong>
            </div>
            <div class="conductor-spec-item">
              <small>Tracción / Peso</small>
              <strong>${Formatters.escapeHTML(sol.vehiculo?.traccion || '4x2')} · ${Formatters.formatToneladas(sol.vehiculo?.pesoToneladas)}</strong>
            </div>
          </div>
          ${sol.vehiculo?.fallaMecanica ? `
            <div class="conductor-falla-alert">
              <strong>Atención Mecánica:</strong> ${Formatters.escapeHTML(sol.vehiculo.fallaMecanica)}
            </div>
          ` : ''}
          <div class="conductor-spec-item">
            <small>Contacto Cliente</small>
            <strong>${Formatters.escapeHTML(sol.cliente?.nombre || '')} - Tel: <a href="tel:${sol.cliente?.telefono}" style="color:var(--gl-primary); font-weight:700; text-decoration:underline;">${Formatters.escapeHTML(sol.cliente?.telefono || '')}</a></strong>
          </div>
        </div>
        <div class="conductor-actions-grid">
          ${botones}
        </div>
      `;

      contenedor.appendChild(card);
    });
  },

  actualizarSelectGruas(gruas, pesoVehiculoRequerido = 0) {
    const select = this.elements.selectGrua;
    if (!select) return;

    select.innerHTML = '<option value="">-- Selecciona una grúa disponible --</option>';
    gruas.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.id;
      const capacidadOk = !pesoVehiculoRequerido || g.capacidadToneladas >= pesoVehiculoRequerido;
      const estadoDisp = g.disponible ? 'Disponible' : 'En Servicio';
      opt.textContent = `${g.id} · ${g.placa} (${g.tipo}) - Cap: ${g.capacidadToneladas}t [${estadoDisp}]`;
      if (!g.disponible || !capacidadOk) {
        opt.disabled = true;
        if (!capacidadOk) opt.textContent += ' [Capacidad Insuficiente]';
      }
      select.appendChild(opt);
    });
  },

  mostrarModalAsignar(solicitud, gruas) {
    if (!this.elements.modalAsignar) return;
    this.elements.radicadoAsignar.textContent = solicitud.radicado;
    if (this.elements.infoVehiculoAsignar) {
      this.elements.infoVehiculoAsignar.textContent = `${solicitud.vehiculo?.tipo || 'Vehículo'} (${solicitud.vehiculo?.placa || ''}) - Peso: ${Formatters.formatToneladas(solicitud.vehiculo?.pesoToneladas)}`;
    }
    this.actualizarSelectGruas(gruas, solicitud.vehiculo?.pesoToneladas || 0);
    this.elements.formAsignar.dataset.solicitudId = solicitud.id;
    this.elements.modalAsignar.classList.remove('hidden');
    document.body.classList.add('modal-abierto');
  },

  cerrarModalAsignar() {
    if (this.elements.modalAsignar) {
      this.elements.modalAsignar.classList.add('hidden');
    }
    document.body.classList.remove('modal-abierto');
  },

  mostrarModalBitacora(solicitud) {
    if (!this.elements.modalBitacora) return;
    const cont = this.elements.bitacoraContenido;
    cont.innerHTML = '';

    const tituloRadicado = document.getElementById('bitacora-radicado');
    if (tituloRadicado) tituloRadicado.textContent = solicitud.radicado;

    const bitacora = solicitud.bitacora || [];
    if (bitacora.length === 0) {
      cont.innerHTML = '<p class="text-muted" style="padding:16px; text-align:center;">Sin notas registradas en esta orden.</p>';
    } else {
      const timeline = document.createElement('div');
      timeline.className = 'bitacora-timeline';
      bitacora.forEach(item => {
        const div = document.createElement('div');
        div.className = 'bitacora-entry';
        div.innerHTML = `
          <div class="bitacora-entry-header">
            <strong>${Formatters.escapeHTML(item.autor || 'Sistema')}</strong>
            <time>${Formatters.formatDateTime(item.fecha)}</time>
          </div>
          <div class="bitacora-entry-text">${Formatters.escapeHTML(item.nota || '')}</div>
        `;
        timeline.appendChild(div);
      });
      cont.appendChild(timeline);
    }

    const formNota = document.getElementById('form-agregar-nota');
    if (formNota) formNota.dataset.solicitudId = solicitud.id;

    this.elements.modalBitacora.classList.remove('hidden');
    document.body.classList.add('modal-abierto');
  },

  cerrarModalBitacora() {
    if (this.elements.modalBitacora) {
      this.elements.modalBitacora.classList.add('hidden');
    }
    document.body.classList.remove('modal-abierto');
  }
};

window.DespachoView = DespachoView;
