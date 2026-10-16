/* =====================================================================
   VISTA: ESPACIO DE TRABAJADORES (SUPER USUARIO) · GRÚAS LONDOÑO
   Renderiza el directorio de colaboradores, métricas y modal de registro.
   ===================================================================== */
const TrabajadoresView = {
  elementos: {},

  init() {
    this.elementos = {
      tabBtnDespacho: document.getElementById('tab-btn-despacho'),
      tabBtnTrabajadores: document.getElementById('tab-btn-trabajadores'),
      secDespacho: document.getElementById('modulo-despacho-seccion'),
      secTrabajadores: document.getElementById('modulo-trabajadores-seccion'),
      tablaCuerpo: document.getElementById('tabla-trabajadores-cuerpo'),
      modalCrear: document.getElementById('modal-crear-trabajador'),
      formCrear: document.getElementById('form-crear-trabajador'),
      btnAbrirCrear: document.getElementById('btn-abrir-crear-trabajador'),
      selectRol: document.getElementById('trabajador-rol-select'),
      camposConductor: document.getElementById('campos-rol-conductor'),
      camposOperador: document.getElementById('campos-rol-operador'),
      // Contadores
      kpiTotal: document.getElementById('kpi-trabajadores-total'),
      kpiConductores: document.getElementById('kpi-trabajadores-conductores'),
      kpiOperadores: document.getElementById('kpi-trabajadores-operadores'),
      kpiAdmins: document.getElementById('kpi-trabajadores-admins')
    };

    this._bindEvents();
  },

  _bindEvents() {
    // Cambio dinámico de campos según rol
    if (this.elementos.selectRol) {
      this.elementos.selectRol.addEventListener('change', (e) => {
        this.actualizarCamposPorRol(e.target.value);
      });
    }

    // Botón abrir modal
    if (this.elementos.btnAbrirCrear) {
      this.elementos.btnAbrirCrear.addEventListener('click', () => {
        this.abrirModalCrear();
      });
    }

    // Botones cerrar modal
    document.querySelectorAll('[data-close-modal-trabajador]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.cerrarModalCrear();
      });
    });
  },

  actualizarCamposPorRol(rol) {
    if (!this.elementos.camposConductor || !this.elementos.camposOperador) return;

    if (rol === 'CONDUCTOR') {
      this.elementos.camposConductor.classList.remove('hidden');
      this.elementos.camposOperador.classList.add('hidden');
      const reqInput = this.elementos.camposConductor.querySelector('select');
      if (reqInput) reqInput.required = true;
      const unreqInput = this.elementos.camposOperador.querySelector('select');
      if (unreqInput) unreqInput.required = false;
    } else if (rol === 'OPERADOR') {
      this.elementos.camposConductor.classList.add('hidden');
      this.elementos.camposOperador.classList.remove('hidden');
      const reqInput = this.elementos.camposOperador.querySelector('select');
      if (reqInput) reqInput.required = true;
      const unreqInput = this.elementos.camposConductor.querySelector('select');
      if (unreqInput) unreqInput.required = false;
    } else {
      // ADMINISTRADOR
      this.elementos.camposConductor.classList.add('hidden');
      this.elementos.camposOperador.classList.add('hidden');
      const c1 = this.elementos.camposConductor.querySelector('select');
      if (c1) c1.required = false;
      const c2 = this.elementos.camposOperador.querySelector('select');
      if (c2) c2.required = false;
    }
  },

  abrirModalCrear() {
    if (this.elementos.modalCrear) {
      this.elementos.modalCrear.classList.remove('hidden');
      const innerModal = this.elementos.modalCrear.querySelector('.modal');
      if (innerModal) innerModal.scrollTop = 0;
      if (this.elementos.selectRol) {
        this.actualizarCamposPorRol(this.elementos.selectRol.value);
      }
    }
  },

  cerrarModalCrear() {
    if (this.elementos.modalCrear) {
      this.elementos.modalCrear.classList.add('hidden');
      if (this.elementos.formCrear) {
        this.elementos.formCrear.reset();
      }
    }
  },

  renderMetricas(trabajadores = []) {
    const total = trabajadores.length;
    const conductores = trabajadores.filter(t => t.rol === 'CONDUCTOR').length;
    const operadores = trabajadores.filter(t => t.rol === 'OPERADOR').length;
    const admins = trabajadores.filter(t => t.rol === 'ADMINISTRADOR').length;

    if (this.elementos.kpiTotal) this.elementos.kpiTotal.textContent = total;
    if (this.elementos.kpiConductores) this.elementos.kpiConductores.textContent = conductores;
    if (this.elementos.kpiOperadores) this.elementos.kpiOperadores.textContent = operadores;
    if (this.elementos.kpiAdmins) this.elementos.kpiAdmins.textContent = admins;
  },

  renderDirectorio(trabajadores = []) {
    if (!this.elementos.tablaCuerpo) return;

    if (trabajadores.length === 0) {
      this.elementos.tablaCuerpo.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding: 48px 16px;">
            <div style="max-width: 380px; margin: 0 auto; color: var(--gl-text-2);">
              <svg style="width:48px; height:48px; margin: 0 auto 12px; color: var(--gl-text-3);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <h4 style="color:var(--gl-text); font-size:1.1rem; margin-bottom:6px;">No hay colaboradores registrados</h4>
              <p style="font-size:0.88rem; margin-bottom:16px;">Crea el primer conductor u operador para asignar viajes y despachos.</p>
              <button type="button" class="btn btn-primary btn-sm" onclick="TrabajadoresView.abrirModalCrear()">+ Crear Primer Trabajador</button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const html = trabajadores.map(t => {
      const iniciales = (t.nombreCompleto || 'U')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      let detalleExtra = '—';
      if (t.rol === 'CONDUCTOR') {
        detalleExtra = `
          <div style="font-size:0.82rem;">
            <span style="font-family:var(--gl-font-mono); font-weight:700; color:var(--gl-burgundy);">${t.gruaAsignada || 'Sin Grúa'}</span>
            <span style="color:var(--gl-text-3);"> · Lic. ${t.categoriaLicencia || 'C2'}</span>
          </div>
        `;
      } else if (t.rol === 'OPERADOR') {
        detalleExtra = `
          <div style="font-size:0.82rem;">
            <span style="font-weight:600;">Turno: ${t.turno || 'Diurno'}</span>
            <div style="font-size:0.75rem; color:var(--gl-text-3);">${t.estacionControl || 'Central'}</div>
          </div>
        `;
      } else if (t.rol === 'ADMINISTRADOR') {
        detalleExtra = `<span style="font-size:0.82rem; color:var(--gl-danger); font-weight:700;">Acceso Total</span>`;
      }

      const estadoBadge = t.estado
        ? '<span class="badge badge-plain" style="border-radius:var(--r-pill); padding:4px 12px; background:#F0FDF4; color:#16A34A; border:1px solid #BBF7D0; font-weight:700; font-size:0.75rem; display:inline-flex; align-items:center; gap:5px;"><span class="live-dot" style="background:#16A34A; width:6px; height:6px;"></span> Activo</span>'
        : '<span class="badge badge-plain" style="border-radius:var(--r-pill); padding:4px 12px; background:#FEF2F2; color:#DC2626; border:1px solid #FECACA; font-weight:700; font-size:0.75rem; display:inline-flex; align-items:center; gap:5px;"><span style="width:6px; height:6px; border-radius:50%; background:#DC2626;"></span> Inactivo</span>';

      const btnAccion = t.estado
        ? `<button type="button" class="btn btn-xs btn-toggle-worker-state" data-worker-id="${t.uid}" data-worker-state="${t.estado}" style="border-radius:var(--r-pill); background:#FEF2F2; color:#DC2626; border:1px solid #FECACA; font-weight:700; padding:4px 14px; cursor:pointer;" title="Desactivar acceso">Desactivar</button>`
        : `<button type="button" class="btn btn-xs btn-toggle-worker-state" data-worker-id="${t.uid}" data-worker-state="${t.estado}" style="border-radius:var(--r-pill); background:#F0FDF4; color:#16A34A; border:1px solid #BBF7D0; font-weight:700; padding:4px 14px; cursor:pointer;" title="Activar acceso">Activar</button>`;

      return `
        <tr data-worker-id="${t.uid}">
          <td>
            <div style="display:flex; align-items:center; gap:12px;">
              <div class="worker-avatar-circle" style="background:var(--gl-surface-muted); color:var(--gl-primary); font-weight:800; font-size:0.85rem; width:38px; height:38px; border-radius:50%; display:grid; place-items:center; border:1.5px solid var(--gl-border); flex-shrink:0;">
                ${iniciales}
              </div>
              <div>
                <strong style="color:var(--gl-text); font-size:0.92rem; display:block;">${t.nombreCompleto}</strong>
                <small style="color:var(--gl-text-3); font-size:0.78rem;">Doc: ${t.documento || 'No registrado'}</small>
              </div>
            </div>
          </td>
          <td>
            <a href="mailto:${t.correo}" style="color:var(--gl-primary); font-size:0.88rem; text-decoration:none; font-weight:500;">${t.correo}</a>
            <div style="font-size:0.78rem; color:var(--gl-text-2); margin-top:2px;">Tel: ${t.telefono || '—'}</div>
          </td>
          <td>
            ${t.obtenerBadgeHTML ? t.obtenerBadgeHTML() : `<span class="badge badge-plain" style="border-radius:var(--r-pill); padding:4px 12px;">${t.rol}</span>`}
          </td>
          <td>
            ${detalleExtra}
          </td>
          <td>
            ${estadoBadge}
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:6px;">
              ${btnAccion}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.elementos.tablaCuerpo.innerHTML = html;
  }
};

window.TrabajadoresView = TrabajadoresView;
