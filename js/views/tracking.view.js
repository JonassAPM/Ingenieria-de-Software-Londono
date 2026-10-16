/* =====================================================================
   VISTA: SEGUIMIENTO PÚBLICO (TRACKING) · GRÚAS LONDOÑO
   Barra de progreso de 4 pasos interactiva, detalles no sensibles
   y actualización en tiempo real del despacho.
   ===================================================================== */
const TrackingView = {
  form: null,
  resultContainer: null,
  btnSubmit: null,

  init() {
    this.form = document.getElementById('tracking-form');
    this.resultContainer = document.getElementById('tracking-result');
    this.btnSubmit = this.form?.querySelector('button[type="submit"]');
  },

  toggleLoading(estado) {
    if (this.btnSubmit) {
      this.btnSubmit.classList.toggle('is-loading', estado);
      this.btnSubmit.disabled = estado;
    }
  },

  limpiarResultado() {
    if (this.resultContainer) {
      this.resultContainer.innerHTML = '';
      this.resultContainer.classList.add('hidden');
    }
  },

  mostrarError(mensaje) {
    if (!this.resultContainer) return;
    this.resultContainer.innerHTML = `
      <div class="alert alert-warning" style="margin-top: 24px;">
        <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div class="alert-body">
          <strong>No se encontró la solicitud</strong>
          <p>${Formatters.escapeHTML(mensaje)}</p>
        </div>
      </div>
    `;
    this.resultContainer.classList.remove('hidden');
  },

  mostrarSolicitud(sol) {
    if (!this.resultContainer || !sol) return;

    const info = DespachoModel.obtenerInfoEstado(sol.estado);
    const stepperHTML = this._construirBarraProgreso(sol.estado);
    const despachoHTML = sol.despacho ? `
      <div class="tracking-info-col">
        <small>Unidad Asignada</small>
        <strong>${Formatters.escapeHTML(sol.despacho.idGrua)} (${Formatters.escapeHTML(sol.despacho.placaGrua || '')})</strong>
      </div>
      <div class="tracking-info-col">
        <small>Conductor a Cargo</small>
        <strong>${Formatters.escapeHTML(sol.despacho.nombreConductor || 'Por asignar')}</strong>
      </div>
    ` : `
      <div class="tracking-info-col">
        <small>Unidad Asignada</small>
        <strong>En espera de asignación</strong>
      </div>
      <div class="tracking-info-col">
        <small>Operador en Mesa</small>
        <strong>Despacho Central</strong>
      </div>
    `;

    this.resultContainer.innerHTML = `
      <div class="tracking-result-card">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
          <div>
            <span class="eyebrow" style="margin-bottom:4px;">ORDEN DE ASISTENCIA</span>
            <h2 style="font-family:var(--gl-font-mono); color:var(--gl-primary);">${Formatters.escapeHTML(sol.radicado)}</h2>
          </div>
          <span class="badge ${info.clase}" style="font-size:0.9rem; padding:6px 14px;">${info.etiqueta}</span>
        </div>

        ${stepperHTML}

        <div class="tracking-info-grid">
          <div class="tracking-info-col">
            <small>Titular del Servicio</small>
            <strong>${Formatters.escapeHTML(sol.cliente?.nombre || 'Cliente')}</strong>
          </div>
          <div class="tracking-info-col">
            <small>Vehículo</small>
            <strong>${Formatters.escapeHTML(sol.vehiculo?.placa || '')} (${Formatters.escapeHTML(sol.vehiculo?.tipo || '')})</strong>
          </div>
          <div class="tracking-info-col">
            <small>Ruta de Traslado</small>
            <strong>${Formatters.escapeHTML(sol.servicio?.origen || '')} → ${Formatters.escapeHTML(sol.servicio?.destino || '')}</strong>
          </div>
          <div class="tracking-info-col">
            <small>Distancia Calculada</small>
            <strong>${Formatters.formatKm(sol.servicio?.distanciaKm)} (${Formatters.escapeHTML(sol.servicio?.topografia || 'Plano')})</strong>
          </div>
          ${despachoHTML}
          <div class="tracking-info-col">
            <small>Tarifa Oficial SICETAC</small>
            <strong style="color:var(--gl-accent);">${Formatters.formatCOP(sol.cotizacion?.valorTotal)}</strong>
          </div>
          <div class="tracking-info-col">
            <small>Última Actualización</small>
            <strong>${Formatters.formatDateTime(sol.fecha)}</strong>
          </div>
        </div>

        <div style="margin-top:24px; display:flex; justify-content:flex-end;">
          <button id="btn-descargar-pdf-tracking" class="btn btn-secondary">
            <svg class="icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Descargar Comprobante Oficial (PDF)
          </button>
        </div>
      </div>
    `;

    const btnPdf = document.getElementById('btn-descargar-pdf-tracking');
    if (btnPdf) {
      btnPdf.onclick = () => {
        PdfGenerator.generarComprobante(sol);
      };
    }

    this.resultContainer.classList.remove('hidden');
  },

  _construirBarraProgreso(estado) {
    if (estado === 'CANCELADA') {
      return `
        <div class="alert alert-danger" style="margin-block: 20px;">
          <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <div class="alert-body">
            <strong>Solicitud Cancelada</strong>
            <p>Este servicio fue cancelado en nuestro sistema de despacho.</p>
          </div>
        </div>
      `;
    }

    const pasos = [
      { key: 'PENDIENTE', titulo: '1. Radicada' },
      { key: 'ASIGNADA', titulo: '2. Asignada' },
      { key: 'EN_CAMINO', titulo: '3. En Camino' },
      { key: 'FINALIZADA', titulo: '4. En Sitio / Finalizado' }
    ];

    const indices = {
      'PENDIENTE': 0,
      'ASIGNADA': 1,
      'EN_CAMINO': 2,
      'EN_SITIO': 3,
      'FINALIZADA': 3
    };

    const actualIdx = indices[estado] ?? 0;
    const porcentajeAncho = Math.min(100, Math.max(0, (actualIdx / 3) * 76));

    const pasosHTML = pasos.map((p, idx) => {
      let clase = '';
      if (idx < actualIdx || (actualIdx === 3 && idx === 3)) clase = 'completado';
      else if (idx === actualIdx) clase = 'activo';

      return `
        <div class="tracking-step ${clase}">
          <div class="tracking-step-circle">
            ${idx < actualIdx ? '✓' : idx + 1}
          </div>
          <span class="tracking-step-title">${p.titulo}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="tracking-stepper">
        <div class="tracking-stepper-progress" style="width: ${porcentajeAncho}%;"></div>
        ${pasosHTML}
      </div>
    `;
  }
};

window.TrackingView = TrackingView;
