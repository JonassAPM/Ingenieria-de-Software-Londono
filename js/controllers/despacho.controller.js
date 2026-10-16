/* =====================================================================
   CONTROLADOR: DESPACHO Y CONTROL DE FLOTA · GRÚAS LONDOÑO
   Listener en tiempo real (onSnapshot), validación de máquina de estados,
   verificación de tonelaje, asignación de unidades y bitácora.
   ===================================================================== */
const DespachoController = {
  solicitudes: [],
  gruas: [],
  unsubscribe: null,
  filtroTexto: '',
  filtroEstado: '',
  gruaConductorSeleccionada: '',

  async init() {
    DespachoView.init();
    await this._cargarGruas();
    this._iniciarListenerEnTiempoReal();
    this._bindEvents();
  },

  async _cargarGruas() {
    this.gruas = await DespachoModel.obtenerGruas();
    // Poblar selectores de grúas en la vista si existen
    if (DespachoView.actualizarSelectGruas) {
      DespachoView.actualizarSelectGruas(this.gruas);
    }
    const selectFiltroConductor = document.getElementById('conductor-filtro-grua');
    if (selectFiltroConductor) {
      selectFiltroConductor.innerHTML = '<option value="">-- Ver todas las órdenes activas --</option>';
      this.gruas.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = `${g.id} · ${g.placa} (${g.conductorAsignado || 'Sin conductor'})`;
        selectFiltroConductor.appendChild(opt);
      });
    }
  },

  _iniciarListenerEnTiempoReal() {
    if (!db || !db.collection) return;

    // Escuchar colección de solicitudes ordenada por fecha descendente
    this.unsubscribe = db.collection('solicitudes')
      .orderBy('fecha', 'desc')
      .onSnapshot((snapshot) => {
        this.solicitudes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        this.renderizar();
      }, (error) => {
        console.error('Error en listener de despacho:', error);
        Notifications.showToast('Error al sincronizar solicitudes en tiempo real', 'error');
      });
  },

  _bindEvents() {
    // 1. Filtros del Dashboard
    const inpTexto = document.getElementById('despacho-filtro-texto');
    const selEstado = document.getElementById('despacho-filtro-estado');

    if (inpTexto) {
      inpTexto.addEventListener('input', (e) => {
        this.filtroTexto = e.target.value.toLowerCase().trim();
        this.renderizar();
      });
    }

    if (selEstado) {
      selEstado.addEventListener('change', (e) => {
        this.filtroEstado = e.target.value;
        this.renderizar();
      });
    }

    // Pills de estado
    document.querySelectorAll('[data-filter-estado]').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-estado]').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.filtroEstado = pill.dataset.filterEstado || '';
        if (selEstado) selEstado.value = this.filtroEstado;
        this.renderizar();
      });
    });

    // 2. Filtro selector en vista Conductor
    const selFiltroCond = document.getElementById('conductor-filtro-grua');
    if (selFiltroCond) {
      selFiltroCond.addEventListener('change', (e) => {
        this.gruaConductorSeleccionada = e.target.value;
        this.renderizar();
      });
    }

    // 3. Delegación de clics de acciones en tarjetas (Dashboard & Conductor)
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const accion = btn.dataset.action;
      const id = btn.dataset.id;
      if (!id || !accion) return;

      e.preventDefault();
      await this.ejecutarAccion(id, accion);
    });

    // 4. Modal de Asignación de Grúa
    const formAsignar = document.getElementById('form-asignar-grua');
    if (formAsignar) {
      formAsignar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const solId = formAsignar.dataset.solicitudId;
        const gruaId = document.getElementById('asignar-grua-select')?.value;
        if (!gruaId) {
          Notifications.showToast('Por favor selecciona una grúa disponible', 'warning');
          return;
        }
        await this.asignarGrua(solId, gruaId);
      });
    }

    // 5. Modal de Bitácora - Agregar Nota
    const formNota = document.getElementById('form-agregar-nota');
    if (formNota) {
      formNota.addEventListener('submit', async (e) => {
        e.preventDefault();
        const solId = formNota.dataset.solicitudId;
        const inputNota = document.getElementById('input-nueva-nota');
        const texto = inputNota?.value.trim();
        if (!texto) return;
        await this.agregarNotaBitacora(solId, texto);
        if (inputNota) inputNota.value = '';
      });
    }
  },

  renderizar() {
    // Filtrar solicitudes para el tablero
    let filtradas = [...this.solicitudes];

    if (this.filtroTexto) {
      filtradas = filtradas.filter(s => {
        const rad = (s.radicado || '').toLowerCase();
        const cli = (s.cliente?.nombre || '').toLowerCase();
        const pla = (s.vehiculo?.placa || '').toLowerCase();
        return rad.includes(this.filtroTexto) || cli.includes(this.filtroTexto) || pla.includes(this.filtroTexto);
      });
    }

    if (this.filtroEstado) {
      filtradas = filtradas.filter(s => s.estado === this.filtroEstado);
    }

    // Renderizar mesa de control
    if (DespachoView.renderDashboard) {
      DespachoView.renderDashboard(filtradas, this.gruas);
    }

    // Renderizar vista conductor
    if (DespachoView.renderConductor) {
      DespachoView.renderConductor(this.solicitudes, this.gruaConductorSeleccionada);
    }
  },

  async ejecutarAccion(solicitudId, accion) {
    const solicitud = this.solicitudes.find(s => s.id === solicitudId);
    if (!solicitud) return;

    switch (accion) {
      case 'asignar':
        DespachoView.mostrarModalAsignar(solicitud, this.gruas);
        break;
      case 'en-camino':
        await this.cambiarEstado(solicitudId, 'EN_CAMINO');
        break;
      case 'en-sitio':
        await this.cambiarEstado(solicitudId, 'EN_SITIO');
        break;
      case 'finalizar':
        await this.cambiarEstado(solicitudId, 'FINALIZADA');
        break;
      case 'cancelar':
        if (confirm(`¿Confirmas la cancelación del servicio ${solicitud.radicado}?`)) {
          await this.cambiarEstado(solicitudId, 'CANCELADA');
        }
        break;
      case 'bitacora':
        DespachoView.mostrarModalBitacora(solicitud);
        break;
    }
  },

  async asignarGrua(solicitudId, gruaId) {
    const solicitud = this.solicitudes.find(s => s.id === solicitudId);
    const grua = this.gruas.find(g => g.id === gruaId);
    if (!solicitud || !grua) return;

    // Validación física de tonelaje RN-04
    if (!DespachoModel.validarTonelaje(solicitud, grua)) {
      Notifications.showToast(
        `Capacidad insuficiente: La grúa soporta ${grua.capacidadToneladas}t y el vehículo pesa ${solicitud.vehiculo?.pesoToneladas}t`,
        'error'
      );
      return;
    }

    try {
      const nota = DespachoModel.crearNotaBitacora(
        'Coord_Despacho',
        `Unidad asignada: ${grua.id} (${grua.placa}). Conductor asignado: ${grua.conductorAsignado || 'Por asignar'}.`
      );

      const ref = db.collection('solicitudes').doc(solicitudId);
      await ref.update({
        estado: 'ASIGNADA',
        despacho: {
          idGrua: grua.id,
          placaGrua: grua.placa,
          nombreConductor: grua.conductorAsignado || 'Jorge Gómez',
          telefonoConductor: grua.telefonoConductor || '3115556677',
          fechaAsignacion: new Date().toISOString()
        },
        bitacora: (window.firebase?.firestore?.FieldValue?.arrayUnion)
          ? firebase.firestore.FieldValue.arrayUnion(nota)
          : [...(solicitud.bitacora || []), nota]
      });

      DespachoView.cerrarModalAsignar();
      Notifications.showToast(`Grúa ${grua.id} asignada con éxito a ${solicitud.radicado}`, 'success');
    } catch (err) {
      console.error('Error al asignar grúa:', err);
      Notifications.showToast('No se pudo asignar la grúa', 'error');
    }
  },

  async cambiarEstado(solicitudId, nuevoEstado) {
    const solicitud = this.solicitudes.find(s => s.id === solicitudId);
    if (!solicitud) return;

    if (!DespachoModel.esTransicionValida(solicitud.estado, nuevoEstado)) {
      Notifications.showToast(`Transición no permitida de ${solicitud.estado} a ${nuevoEstado}`, 'error');
      return;
    }

    try {
      let notaTexto = `Cambio de estado: ${solicitud.estado} → ${nuevoEstado}.`;
      if (nuevoEstado === 'CANCELADA' && solicitud.estado === 'EN_CAMINO') {
        notaTexto += ' Aplica cobro oficial por enganche según regla RN-04.';
      }

      const nota = DespachoModel.crearNotaBitacora('Operador', notaTexto);
      const ref = db.collection('solicitudes').doc(solicitudId);

      await ref.update({
        estado: nuevoEstado,
        bitacora: (window.firebase?.firestore?.FieldValue?.arrayUnion)
          ? firebase.firestore.FieldValue.arrayUnion(nota)
          : [...(solicitud.bitacora || []), nota]
      });

      Notifications.showToast(`Servicio ${solicitud.radicado} actualizado a: ${nuevoEstado}`, 'success');
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      Notifications.showToast('No se pudo actualizar el estado', 'error');
    }
  },

  async agregarNotaBitacora(solicitudId, texto) {
    const solicitud = this.solicitudes.find(s => s.id === solicitudId);
    if (!solicitud) return;

    try {
      const autor = AuthController?.usuarioActual?.displayName || 'Operador';
      const nota = DespachoModel.crearNotaBitacora(autor, texto);
      const ref = db.collection('solicitudes').doc(solicitudId);

      await ref.update({
        bitacora: (window.firebase?.firestore?.FieldValue?.arrayUnion)
          ? firebase.firestore.FieldValue.arrayUnion(nota)
          : [...(solicitud.bitacora || []), nota]
      });

      Notifications.showToast('Nota registrada en bitácora', 'info');
      // Refrescar modal si está abierto
      const actualizada = {
        ...solicitud,
        bitacora: [...(solicitud.bitacora || []), nota]
      };
      DespachoView.mostrarModalBitacora(actualizada);
    } catch (err) {
      console.error('Error al agregar nota:', err);
      Notifications.showToast('No se pudo registrar la nota', 'error');
    }
  }
};

window.DespachoController = DespachoController;
