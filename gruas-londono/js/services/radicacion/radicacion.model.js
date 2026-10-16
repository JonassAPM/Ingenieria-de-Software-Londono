// Modelo del microservicio de radicación.
// Contiene generación de radicado, validación y persistencia en Firestore.
const RadicacionModel = {
  /**
   * Genera un radicado único con estructura GL-AAAA-NNNNN.
   * @returns {string} Radicado generado.
   */
  generarRadicado() {
    const anio = new Date().getFullYear();
    const secuencia = String(Date.now()).slice(-5);
    return `GL-${anio}-${secuencia}`;
  },

  /**
   * Valida los datos mínimos de una solicitud.
   * @param {object} datos - Datos del formulario de radicación.
   * @returns {object} Objeto con los campos con error y su mensaje.
   */
  validarSolicitud(datos) {
    const errores = {};

    if (!datos.cliente.nombre.trim()) errores['cliente-nombre'] = 'Campo requerido';
    if (!datos.cliente.documento.trim()) errores['cliente-documento'] = 'Campo requerido';
    if (!datos.cliente.telefono.trim()) errores['cliente-telefono'] = 'Campo requerido';
    if (!datos.cliente.correo.trim()) errores['cliente-correo'] = 'Campo requerido';

    if (!datos.servicio.origen.trim()) errores['servicio-origen'] = 'Campo requerido';
    if (!datos.servicio.destino.trim()) errores['servicio-destino'] = 'Campo requerido';

    if (!datos.vehiculo.placa.trim()) errores['vehiculo-placa'] = 'Campo requerido';
    if (!datos.vehiculo.tipo.trim()) errores['vehiculo-tipo'] = 'Campo requerido';

    return errores;
  },

  /**
   * Construye el objeto completo de solicitud listo para guardar en Firestore.
   * @param {object} datos - Datos del formulario.
   * @param {object} cotizacion - Resultado de CotizacionModel.calcularCotizacion().
   * @param {string} radicado - Código generado.
   * @returns {object} Solicitud en estructura plana.
   */
  construirSolicitud(datos, cotizacion, radicado) {
    const fecha = new Date().toISOString();

    return {
      radicado,
      fecha,
      cliente: {
        nombre: datos.cliente.nombre.trim(),
        documento: datos.cliente.documento.trim(),
        telefono: datos.cliente.telefono.trim(),
        correo: datos.cliente.correo.trim()
      },
      servicio: {
        tipoServicio: datos.servicio.tipoServicio,
        origen: datos.servicio.origen.trim(),
        destino: datos.servicio.destino.trim(),
        puntoReferencia: datos.servicio.puntoReferencia.trim(),
        distanciaKm: Number(datos.servicio.distanciaKm)
      },
      vehiculo: {
        placa: datos.vehiculo.placa.trim(),
        tipo: datos.vehiculo.tipo.trim(),
        traccion: datos.vehiculo.traccion,
        transmision: datos.vehiculo.transmision,
        pesoToneladas: Number(datos.vehiculo.pesoToneladas),
        valorComercialDeclarado: Number(datos.vehiculo.valorComercialDeclarado),
        fallaMecanica: datos.vehiculo.fallaMecanica.trim()
      },
      cotizacion: {
        tarifaBase: cotizacion.tarifaBase,
        costoDistancia: cotizacion.costoDistancia,
        recargoTopografia: cotizacion.recargoTopografia,
        recargoCarga: cotizacion.recargoCarga,
        recargoSeguroMercancia: cotizacion.recargoSeguroMercancia,
        valorTotal: cotizacion.valorTotal,
        requiereRevisionManual: cotizacion.requiereRevisionManual
      },
      estado: 'PENDIENTE',
      bitacora: [
        {
          fecha,
          autor: 'Sistema',
          nota: 'Solicitud radicada automáticamente con cotización normada.'
        }
      ]
    };
  },

  /**
   * Guarda una solicitud en la colección 'solicitudes' de Firestore.
   * @param {object} solicitud - Objeto construido.
   * @returns {Promise<object>} Documento creado.
   */
  async guardarSolicitud(solicitud) {
    try {
      const docRef = await db.collection('solicitudes').add(solicitud);
      return { id: docRef.id, ...solicitud };
    } catch (error) {
      console.error('Error guardando solicitud:', error);
      throw error;
    }
  }
};
