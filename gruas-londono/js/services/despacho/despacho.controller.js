// Controlador del microservicio de despacho.
// Escucha en tiempo real, gestiona asignación, cambios de estado y bitácora.

const DespachoController = {
  solicitudes: [],
  gruas: [],
  unsubscribe: null,

  /**
   * Inicializa el módulo y sus listeners.
   */
  init() {
    DespachoView.init();
    this._cargarGruas();
    this._iniciarListener();
    this._asociarEventos();
  },

  /**
   * Carga las grúas desde Firestore o usa el catálogo local.
   */
  async _cargarGruas() {
    try {
      const snapshot = await db.collection('gruas').get();
      this.gruas = snapshot.empty
        ? DespachoModel.catalogoGruas
        : snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      DespachoView.actualizarSelectGruas(this.gruas);
    } catch (error) {
      console.error('Error cargando grúas:', error);
      this.gruas = DespachoModel.catalogoGruas;
      DespachoView.actualizarSelectGruas(this.gruas);
    }
  },

  /**
   * Inicia el listener en tiempo real de solicitudes.
   */
  _iniciarListener() {
    this.unsubscribe = db.collection('solicitudes')
      .orderBy('fecha', 'desc')
      .onSnapshot(snapshot => {
        this.solicitudes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        DespachoView.renderDashboard(this.solicitudes, this.gruas);
        DespachoView.renderConductor(this.solicitudes);
      }, error => {
        console.error('Error en listener de despacho:', error);
        Notifications.showToast('Error al escuchar solicitudes', 'error');
      });
  },

  /**
   * Asocia eventos de filtros, modal y acciones de la bandeja.
   */
  _asociarEventos() {
    // Filtros
    this.elements.filtroTexto?.addEventListener('input', () => this._aplicarFiltros());
    this.elements.filtroEstado?.addEventListener('change', () => this._aplicarFiltros());

    // Delegación en bandeja
    this.elements.bandeja?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      this._handleAction(id, action);
    });

    // Modal asignación
    this.elements.formAsignar?.addEventListener('submit', (e) => {
      e.preventDefault();
      const solicitudId = e.target.dataset.solicitudId;
      const gruaId = this.elements.selectGrua.value;
      if (!gruaId) {
        Notifications.showToast('Selecciona una grúa', 'error');
        return;
      }
      this._asignarGrua(solicitudId, gruaId);
    });

    // Cerrar modales
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        DespachoView.cerrarModalAsignar();
        DespachoView.cerrarModalBitacora();
      });
    });
  },

  get elements() {
    return DespachoView.elements;
  },

  /**
   * Aplica filtros actuales a la lista de solicitudes.
   */
  _aplicarFiltros() {
    const texto = this.elements.filtroTexto?.value.trim().toLowerCase() || '';
    const estado = this.elements.filtroEstado?.value || '';

    const filtradas = this.solicitudes.filter(solicitud => {
      const coincideTexto = !texto ||
        solicitud.radicado.toLowerCase().includes(texto) ||
        (solicitud.cliente?.nombre || '').toLowerCase().includes(texto) ||
        (solicitud.vehiculo?.placa || '').toLowerCase().includes(texto);
      const coincideEstado = !estado || solicitud.estado === estado;
      return coincideTexto && coincideEstado;
    });

    DespachoView._renderBandeja(filtradas, this.gruas);
  },

  /**
   * Maneja las acciones de tarjetas.
   * @param {string} id - ID de la solicitud.
   * @param {string} action - Acción solicitada.
   */
  _handleAction(id, action) {
    const solicitud = this.solicitudes.find(s => s.id === id);
    if (!solicitud) return;

    switch (action) {
      case 'asignar':
        DespachoView.mostrarModalAsignar(solicitud);
        break;
      case 'cancelar':
        this._cambiarEstado(id, 'CANCELADA');
        break;
      case 'en-camino':
        this._cambiarEstado(id, 'EN_CAMINO');
        break;
      case 'en-sitio':
        this._cambiarEstado(id, 'EN_SITIO');
        break;
      case 'finalizar':
        this._cambiarEstado(id, 'FINALIZADA');
        break;
      case 'bitacora':
        DespachoView.mostrarModalBitacora(solicitud);
        break;
      default:
        console.warn('Acción no reconocida:', action);
    }
  },

  /**
   * Asigna una grúa a una solicitud y actualiza estado.
   * @param {string} solicitudId
   * @param {string} gruaId
   */
  async _asignarGrua(solicitudId, gruaId) {
    const solicitud = this.solicitudes.find(s => s.id === solicitudId);
    const grua = this.gruas.find(g => g.id === gruaId);
    if (!solicitud || !grua) return;

    if (!DespachoModel.validarTonelaje(solicitud, grua)) {
      Notifications.showToast('La grúa no soporta el peso del vehículo', 'error');
      return;
    }

    try {
      const ref = db.collection('solicitudes').doc(solicitudId);
      const nuevoEstado = 'ASIGNADA';
      const nota = DespachoModel.crearNota(
        'Coord_Despacho',
        solicitud.estado,
        nuevoEstado,
        `Asignada grúa ${grua.id} - ${grua.placa}`
      );

      await ref.update({
        estado: nuevoEstado,
        despacho: {
          idGrua: grua.id,
          placaGrua: grua.placa,
          nombreConductor: grua.conductorAsignado || 'Por asignar',
          telefonoConductor: grua.telefonoConductor || '',
          fechaAsignacion: new Date().toISOString()
        },
        bitacora: firebase.firestore.FieldValue.arrayUnion(nota)
      });

      DespachoView.cerrarModalAsignar();
      Notifications.showToast('Grúa asignada correctamente', 'success');
    } catch (error) {
      console.error('Error asignando grúa:', error);
      Notifications.showToast('No se pudo asignar la grúa', 'error');
    }
  },

  /**
   * Cambia el estado de una solicitud validando transición.
   * @param {string} solicitudId
   * @param {string} nuevoEstado
   */
  async _cambiarEstado(solicitudId, nuevoEstado) {
    const solicitud = this.solicitudes.find(s => s.id === solicitudId);
    if (!solicitud) return;

    if (!DespachoModel.esTransicionValida(solicitud.estado, nuevoEstado)) {
      Notifications.showToast('Transición de estado no permitida', 'error');
      return;
    }

    try {
      const ref = db.collection('solicitudes').doc(solicitudId);
      const nota = DespachoModel.crearNota(
        'Operador',
        solicitud.estado,
        nuevoEstado
      );

      await ref.update({
        estado: nuevoEstado,
        bitacora: firebase.firestore.FieldValue.arrayUnion(nota)
      });

      Notifications.showToast(`Estado actualizado a ${nuevoEstado}`, 'success');
    } catch (error) {
      console.error('Error cambiando estado:', error);
      Notifications.showToast('No se pudo actualizar el estado', 'error');
    }
  },

  /**
   * Agrega una nota a la bitácora de forma manual.
   * @param {string} solicitudId
   * @param {string} texto
   */
  async _agregarNota(solicitudId, texto) {
    if (!texto.trim()) return;

    try {
      const ref = db.collection('solicitudes').doc(solicitudId);
      const nota = DespachoModel.crearNota('Operador', '', '', texto.trim());
      await ref.update({
        bitacora: firebase.firestore.FieldValue.arrayUnion(nota)
      });
      // Actualizar modal si está abierto
      const solicitud = this.solicitudes.find(s => s.id === solicitudId);
      if (solicitud) {
        DespachoView.mostrarModalBitacora(solicitud);
      }
    } catch (error) {
      console.error('Error agregando nota:', error);
      Notifications.showToast('No se pudo agregar la nota', 'error');
    }
  }
};
