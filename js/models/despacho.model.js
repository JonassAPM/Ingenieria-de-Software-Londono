/* =====================================================================
   MODELO: DESPACHO Y CONTROL DE FLOTA · GRÚAS LONDOÑO
   Máquina de estados finitos, catálogo de flota, validación
   física de tonelaje y bitácora operativa.
   ===================================================================== */
const DespachoModel = {
  estados: ['PENDIENTE', 'ASIGNADA', 'EN_CAMINO', 'EN_SITIO', 'FINALIZADA', 'CANCELADA'],

  // Transiciones válidas estipuladas en PROMPT_MAESTRO §5.7
  transiciones: {
    PENDIENTE: ['ASIGNADA', 'CANCELADA'],
    ASIGNADA: ['EN_CAMINO', 'CANCELADA'],
    EN_CAMINO: ['EN_SITIO', 'CANCELADA'], // Si se cancela en camino, aplica cobro de enganche
    EN_SITIO: ['FINALIZADA'],
    FINALIZADA: [],
    CANCELADA: []
  },

  catalogoGruasFallback: [
    {
      id: "GRUA-01",
      placa: "ABC-123",
      modelo: "Chevrolet NPR 2021",
      tipo: "Plataforma Hidráulica",
      capacidadToneladas: 4.5,
      conductorAsignado: "Mario Restrepo",
      telefonoConductor: "3104567890",
      disponible: true
    },
    {
      id: "GRUA-02",
      placa: "DEF-456",
      modelo: "International 4300 2023",
      tipo: "Pluma/Gancho",
      capacidadToneladas: 12.0,
      conductorAsignado: "Héctor Fabio",
      telefonoConductor: "3158889900",
      disponible: true
    },
    {
      id: "GRUA-03",
      placa: "WXY-123",
      modelo: "Chevrolet FTR 2022",
      tipo: "Plataforma con Winche",
      capacidadToneladas: 5.0,
      conductorAsignado: "Jorge Gómez",
      telefonoConductor: "3115556677",
      disponible: false
    },
    {
      id: "GRUA-04",
      placa: "GHI-789",
      modelo: "Kenworth T800 2024",
      tipo: "Cama Baja Extensible",
      capacidadToneladas: 35.0,
      conductorAsignado: "Carlos Montoya",
      telefonoConductor: "3182223344",
      disponible: true
    }
  ],

  /**
   * Obtiene la lista de grúas desde Firestore (o el catálogo semilla)
   * @returns {Promise<Array>}
   */
  async obtenerGruas() {
    try {
      const snap = await db.collection('gruas').get();
      if (snap.empty) return this.catalogoGruasFallback;
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch {
      return this.catalogoGruasFallback;
    }
  },

  /**
   * Valida si la transición de estados es legal
   * @param {string} estadoActual
   * @param {string} nuevoEstado
   * @returns {boolean}
   */
  esTransicionValida(estadoActual, nuevoEstado) {
    if (!estadoActual || !nuevoEstado) return false;
    const permitidos = this.transiciones[estadoActual] || [];
    return permitidos.includes(nuevoEstado);
  },

  /**
   * Valida la regla física RN-04: Capacidad de grúa >= peso del vehículo
   * @param {object} solicitud
   * @param {object} grua
   * @returns {boolean}
   */
  validarTonelaje(solicitud, grua) {
    const peso = Number(solicitud?.vehiculo?.pesoToneladas || 0);
    const capacidad = Number(grua?.capacidadToneladas || 0);
    if (peso <= 0 || capacidad <= 0) return true;
    return capacidad >= peso;
  },

  /**
   * Información visual y cromática del estado
   * @param {string} estado
   * @returns {object}
   */
  obtenerInfoEstado(estado) {
    const map = {
      PENDIENTE: {
        etiqueta: 'Pendiente',
        clase: 'estado-pendiente',
        color: 'var(--estado-pendiente-text)',
        bg: 'var(--estado-pendiente-bg)',
        border: 'var(--estado-pendiente-border)'
      },
      ASIGNADA: {
        etiqueta: 'Asignada',
        clase: 'estado-asignada',
        color: 'var(--estado-ruta-text)',
        bg: 'var(--estado-ruta-bg)',
        border: 'var(--estado-ruta-border)'
      },
      EN_CAMINO: {
        etiqueta: 'En Camino',
        clase: 'estado-en-camino',
        color: 'var(--gl-info-strong)',
        bg: 'var(--gl-info-soft)',
        border: 'var(--gl-info)'
      },
      EN_SITIO: {
        etiqueta: 'En Sitio',
        clase: 'estado-en-sitio',
        color: 'var(--estado-sitio-text)',
        bg: 'var(--estado-sitio-bg)',
        border: 'var(--estado-sitio-border)'
      },
      FINALIZADA: {
        etiqueta: 'Finalizada',
        clase: 'estado-finalizada',
        color: 'var(--estado-finalizada-text)',
        bg: 'var(--estado-finalizada-bg)',
        border: 'var(--estado-finalizada-border)'
      },
      CANCELADA: {
        etiqueta: 'Cancelada',
        clase: 'estado-cancelada',
        color: 'var(--estado-cancelada-text)',
        bg: 'var(--estado-cancelada-bg)',
        border: 'var(--estado-cancelada-border)'
      }
    };
    return map[estado] || map.PENDIENTE;
  },

  /**
   * Crea una entrada para la bitácora
   * @param {string} autor
   * @param {string} notaTexto
   * @returns {object}
   */
  crearNotaBitacora(autor, notaTexto) {
    return {
      fecha: new Date().toISOString(),
      autor: autor || 'Operador',
      nota: notaTexto.trim()
    };
  }
};

window.DespachoModel = DespachoModel;
