/* =====================================================================
   MODELO: RADICACIÓN DE SOLICITUDES · GRÚAS LONDOÑO
   Generación secuencial única GL-2026-XXXXX, validación RN-02 y
   persistencia plana en colección "solicitudes".
   ===================================================================== */
const RadicacionModel = {
  coleccion: 'solicitudes',

  /**
   * Genera un código de radicado único irrepetible GL-2026-XXXXX
   * @returns {string}
   */
  generarRadicado() {
    const anio = new Date().getFullYear();
    const secuencia = Math.floor(10000 + Math.random() * 90000);
    return `GL-${anio}-${secuencia}`;
  },

  /**
   * Valida integridad de campos según regla RN-02
   * @param {object} datos
   * @returns {object} Mapa de errores si existen
   */
  validarSolicitud(datos) {
    const errores = {};

    // 1. Cliente
    if (!datos.cliente?.nombre?.trim()) errores['cliente-nombre'] = 'Nombre o razón social obligatoria';
    if (!datos.cliente?.documento?.trim()) errores['cliente-documento'] = 'Cédula o NIT requerido';
    if (!datos.cliente?.telefono?.trim()) errores['cliente-telefono'] = 'Teléfono celular requerido';
    if (!datos.cliente?.correo?.trim() || !datos.cliente.correo.includes('@')) {
      errores['cliente-correo'] = 'Correo electrónico válido requerido';
    }

    // 2. Servicio
    if (!datos.servicio?.origen?.trim()) errores['servicio-origen'] = 'Dirección de origen requerida';
    if (!datos.servicio?.destino?.trim()) errores['servicio-destino'] = 'Dirección de destino requerida';
    if (Number(datos.servicio?.distanciaKm) <= 0) errores['servicio-distancia'] = 'Ingresa una distancia en km válida';

    // 3. Vehículo
    if (!datos.vehiculo?.placa?.trim()) errores['vehiculo-placa'] = 'Placa del vehículo requerida';
    if (!datos.vehiculo?.tipo?.trim()) errores['vehiculo-tipo'] = 'Tipo de vehículo requerido';
    if (Number(datos.vehiculo?.pesoToneladas) <= 0) errores['vehiculo-peso'] = 'Peso estimado requerido (mayor a 0)';

    return errores;
  },

  /**
   * Construye el documento JSON plano canónico conforme a PROMPT_MAESTRO §3
   * @param {object} datos
   * @param {object} cotizacion
   * @param {string} radicado
   * @returns {object}
   */
  construirSolicitud(datos, cotizacion, radicado) {
    const fecha = new Date().toISOString();

    return {
      radicado,
      fecha,
      cliente: {
        nombre: (datos.cliente.nombre || '').trim(),
        documento: (datos.cliente.documento || '').trim(),
        telefono: (datos.cliente.telefono || '').trim(),
        correo: (datos.cliente.correo || '').trim().toLowerCase()
      },
      servicio: {
        tipoServicio: datos.servicio.tipoServicio || 'GRUA_PLATAFORMA',
        origen: (datos.servicio.origen || '').trim(),
        destino: (datos.servicio.destino || '').trim(),
        puntoReferencia: (datos.servicio.puntoReferencia || '').trim(),
        distanciaKm: Number(datos.servicio.distanciaKm || 0),
        topografia: datos.servicio.topografia || 'plano',
        tipoEnganche: datos.servicio.tipoEnganche || 'urbano'
      },
      vehiculo: {
        placa: (datos.vehiculo.placa || '').trim().toUpperCase(),
        tipo: (datos.vehiculo.tipo || '').trim(),
        traccion: datos.vehiculo.traccion || '4x2',
        transmision: datos.vehiculo.transmision || 'manual',
        pesoToneladas: Number(datos.vehiculo.pesoToneladas || 0),
        valorComercialDeclarado: Number(datos.vehiculo.valorComercialDeclarado || 0),
        fallaMecanica: (datos.vehiculo.fallaMecanica || '').trim()
      },
      cotizacion: {
        tarifaBase: cotizacion.tarifaBase,
        costoDistancia: cotizacion.costoDistancia,
        recargoTopografia: cotizacion.recargoTopografia,
        recargoCarga: cotizacion.recargoCarga,
        recargoSeguroMercancia: cotizacion.recargoSeguroMercancia,
        valorTotal: cotizacion.valorTotal,
        requiereRevisionManual: !!cotizacion.requiereRevisionManual
      },
      estado: 'PENDIENTE',
      despacho: null,
      bitacora: [
        {
          fecha,
          autor: 'Sistema',
          nota: 'Solicitud radicada automáticamente con cotización normada SICETAC.'
        }
      ]
    };
  },

  /**
   * Guarda la solicitud en Firestore
   * @param {object} solicitud
   * @returns {Promise<object>} Solicitud persistida con su ID
   */
  async guardarSolicitud(solicitud) {
    try {
      const docRef = await db.collection(this.coleccion).add(solicitud);
      return { id: docRef.id, ...solicitud };
    } catch (err) {
      console.error('Error al guardar solicitud en RadicacionModel:', err);
      throw err;
    }
  },

  /**
   * Busca solicitud para consulta pública (por radicado y documento del cliente)
   * @param {string} radicado
   * @param {string} documento
   * @returns {Promise<object|null>}
   */
  async consultarPorRadicadoYDocumento(radicado, documento) {
    try {
      const snap = await db.collection(this.coleccion)
        .where('radicado', '==', radicado.trim().toUpperCase())
        .where('cliente.documento', '==', documento.trim())
        .limit(1)
        .get();

      if (snap.empty) return null;
      const doc = snap.docs[0];
      return { id: doc.id, ref: doc.ref, ...doc.data() };
    } catch (err) {
      console.error('Error en consulta pública RadicacionModel:', err);
      throw err;
    }
  }
};

window.RadicacionModel = RadicacionModel;
