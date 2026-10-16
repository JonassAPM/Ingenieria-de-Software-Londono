// Modelo del microservicio de despacho.
// Contiene la máquina de estados, validaciones y catálogo de grúas.

const DespachoModel = {
  estados: ['PENDIENTE', 'ASIGNADA', 'EN_CAMINO', 'EN_SITIO', 'FINALIZADA', 'CANCELADA'],

  transiciones: {
    PENDIENTE: ['ASIGNADA', 'CANCELADA'],
    ASIGNADA: ['EN_CAMINO', 'CANCELADA'],
    EN_CAMINO: ['EN_SITIO', 'CANCELADA'],
    EN_SITIO: ['FINALIZADA'],
    FINALIZADA: [],
    CANCELADA: []
  },

  catalogoGruas: [
    {
      id: 'GRUA-01',
      placa: 'ABC-123',
      modelo: 'Chevrolet NPR 2021',
      tipo: 'Plataforma Hidráulica',
      capacidadToneladas: 4.5,
      disponible: true
    },
    {
      id: 'GRUA-02',
      placa: 'DEF-456',
      modelo: 'International 4300 2023',
      tipo: 'Pluma/Gancho',
      capacidadToneladas: 12.0,
      disponible: true
    },
    {
      id: 'GRUA-03',
      placa: 'WXY-123',
      modelo: 'Chevrolet FTR 2022',
      tipo: 'Plataforma con Winche',
      capacidadToneladas: 5.0,
      disponible: false
    },
    {
      id: 'GRUA-04',
      placa: 'GHI-789',
      modelo: 'Kenworth T800 2024',
      tipo: 'Cama Baja',
      capacidadToneladas: 35.0,
      disponible: true
    }
  ],

  /**
   * Verifica si una transición de estado es válida.
   * @param {string} estadoActual - Estado actual de la solicitud.
   * @param {string} nuevoEstado - Estado al que se desea mover.
   * @returns {boolean}
   */
  esTransicionValida(estadoActual, nuevoEstado) {
    if (!estadoActual || !nuevoEstado) return false;
    const permitidos = this.transiciones[estadoActual] || [];
    return permitidos.includes(nuevoEstado);
  },

  /**
   * Valida que la grúa tenga capacidad suficiente para el vehículo.
   * @param {object} solicitud - Solicitud con datos del vehículo.
   * @param {object} grua - Grúa con capacidadToneladas.
   * @returns {boolean}
   */
  validarTonelaje(solicitud, grua) {
    if (!solicitud?.vehiculo?.pesoToneladas || !grua?.capacidadToneladas) return false;
    return grua.capacidadToneladas >= Number(solicitud.vehiculo.pesoToneladas);
  },

  /**
   * Obtiene metadatos visuales de un estado.
   * @param {string} estado - Estado de la solicitud.
   * @returns {object} Objeto con clase, etiqueta, color y fondo.
   */
  obtenerInformacionEstado(estado) {
    const estados = {
      PENDIENTE:  { clase: 'pendiente',  etiqueta: 'Pendiente',  color: '#B91C1C', bg: '#FEE2E2' },
      ASIGNADA:   { clase: 'asignada',   etiqueta: 'Asignada',   color: '#1D4ED8', bg: '#DBEAFE' },
      EN_CAMINO:  { clase: 'en-camino',  etiqueta: 'En camino',  color: '#B45309', bg: '#FEF3C7' },
      EN_SITIO:   { clase: 'en-sitio',   etiqueta: 'En sitio',   color: '#1D4ED8', bg: '#DBEAFE' },
      FINALIZADA: { clase: 'finalizada', etiqueta: 'Finalizada', color: '#15803D', bg: '#DCFCE7' },
      CANCELADA:  { clase: 'cancelada',  etiqueta: 'Cancelada',  color: '#475569', bg: '#F1F5F9' }
    };
    return estados[estado] || estados.PENDIENTE;
  },

  /**
   * Crea una nota de bitácora con los datos del cambio.
   * @param {string} autor - Nombre del autor de la nota.
   * @param {string} estadoAnterior - Estado anterior.
   * @param {string} estadoNuevo - Estado nuevo.
   * @param {string} detalle - Detalle adicional opcional.
   * @returns {object} Nota lista para agregar.
   */
  crearNota(autor, estadoAnterior, estadoNuevo, detalle = '') {
    const fecha = new Date().toISOString();
    let nota = `Cambio de estado de ${estadoAnterior} a ${estadoNuevo}.`;
    if (detalle) nota += ` ${detalle}`;
    return { fecha, autor, nota };
  }
};
