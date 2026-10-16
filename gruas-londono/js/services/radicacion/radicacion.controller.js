// Controlador del microservicio de radicación.
// Orquesta validación, cotización, guardado en Firestore, PDF y consulta pública.
const RadicacionController = {
  form: null,
  trackingForm: null,
  trackingUnsubscribe: null,

  /**
   * Inicializa el módulo: formulario de radicación y consulta de seguimiento.
   */
  init() {
    RadicacionView.init();
    this.form = document.getElementById('radicacion-form');
    if (this.form) {
      this.form.addEventListener('submit', (e) => this._onSubmit(e));
    }

    this.trackingForm = document.getElementById('tracking-form');
    if (this.trackingForm) {
      this.trackingForm.addEventListener('submit', (e) => this._onTrackingSubmit(e));
      RadicacionView.limpiarResultadoSeguimiento();
    }

    // Limpiar listener de seguimiento al salir de la página
    window.addEventListener('beforeunload', () => this._detenerSeguimiento());
  },

  /**
   * Procesa el envío del formulario de radicación.
   * @param {Event} e - Evento submit.
   */
  async _onSubmit(e) {
    e.preventDefault();
    RadicacionView.limpiarErrores();

    const datos = this._leerFormulario();
    const errores = RadicacionModel.validarSolicitud(datos);

    if (Object.keys(errores).length > 0) {
      RadicacionView.mostrarErrores(errores);
      RadicacionView.mostrarError('Revisa los campos marcados');
      return;
    }

    try {
      RadicacionView.toggleLoading(true);

      // Calcular cotización usando los datos del servicio
      const cotizacion = CotizacionModel.calcularCotizacion({
        tipoEnganche: datos.servicio.tipoEnganche,
        distanciaKm: datos.servicio.distanciaKm,
        topografia: datos.servicio.topografia,
        pesoToneladas: datos.vehiculo.pesoToneladas,
        valorComercialDeclarado: datos.vehiculo.valorComercialDeclarado,
        fallaMecanica: datos.vehiculo.fallaMecanica
      });

      // Generar radicado y construir solicitud
      const radicado = RadicacionModel.generarRadicado();
      const solicitud = RadicacionModel.construirSolicitud(datos, cotizacion, radicado);

      // Guardar en Firestore
      await RadicacionModel.guardarSolicitud(solicitud);

      // Generar y descargar PDF
      PdfGenerator.generarComprobante(solicitud);

      RadicacionView.mostrarExito(radicado);
      this.form.reset();
    } catch (error) {
      console.error('Error en radicación:', error);
      RadicacionView.mostrarError('No se pudo radicar la solicitud. Intenta de nuevo.');
    } finally {
      RadicacionView.toggleLoading(false);
    }
  },

  /**
   * Procesa el envío del formulario de seguimiento público.
   * @param {Event} e - Evento submit.
   */
  async _onTrackingSubmit(e) {
    e.preventDefault();
    RadicacionView.limpiarResultadoSeguimiento();
    this._detenerSeguimiento();

    const radicado = document.getElementById('tracking-radicado').value.trim();
    const documento = document.getElementById('tracking-documento').value.trim();

    if (!radicado || !documento) {
      RadicacionView.mostrarErrorSeguimiento('Ingresa radicado y documento.');
      return;
    }

    try {
      RadicacionView.toggleLoadingSeguimiento(true);

      const docRef = await this._buscarDocSeguimiento(radicado, documento);
      if (docRef) {
        this._iniciarSeguimiento(docRef);
      } else {
        RadicacionView.mostrarErrorSeguimiento('No se encontró la solicitud con esos datos.');
      }
    } catch (error) {
      console.error('Error en consulta de seguimiento:', error);
      RadicacionView.mostrarErrorSeguimiento('No se pudo consultar la solicitud.');
    } finally {
      RadicacionView.toggleLoadingSeguimiento(false);
    }
  },

  /**
   * Busca el documento de la solicitud en Firestore por radicado y documento.
   * @param {string} radicado - Código oficial.
   * @param {string} documento - Cédula o NIT del cliente.
   * @returns {Promise<firebase.firestore.DocumentReference|null>} Referencia al documento o null.
   */
  async _buscarDocSeguimiento(radicado, documento) {
    const snapshot = await db.collection('solicitudes')
      .where('radicado', '==', radicado)
      .where('cliente.documento', '==', documento)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].ref;
  },

  /**
   * Inicia un listener en tiempo real sobre una solicitud específica.
   * @param {firebase.firestore.DocumentReference} docRef - Referencia al documento.
   */
  _iniciarSeguimiento(docRef) {
    this.trackingUnsubscribe = docRef.onSnapshot(snapshot => {
      if (snapshot.exists) {
        const solicitud = { id: snapshot.id, ...snapshot.data() };
        RadicacionView.mostrarResultadoSeguimiento(solicitud);
      } else {
        RadicacionView.mostrarErrorSeguimiento('La solicitud ya no existe.');
      }
    });
  },

  /**
   * Detiene el listener activo de seguimiento si existe.
   */
  _detenerSeguimiento() {
    if (this.trackingUnsubscribe) {
      this.trackingUnsubscribe();
      this.trackingUnsubscribe = null;
    }
  },

  /**
   * Lee y normaliza todos los campos del formulario de radicación.
   * @returns {object} Datos organizados por sección.
   */
  _leerFormulario() {
    return {
      cliente: {
        nombre: document.getElementById('cliente-nombre').value,
        documento: document.getElementById('cliente-documento').value,
        telefono: document.getElementById('cliente-telefono').value,
        correo: document.getElementById('cliente-correo').value
      },
      servicio: {
        tipoServicio: document.getElementById('servicio-tipo').value,
        origen: document.getElementById('servicio-origen').value,
        destino: document.getElementById('servicio-destino').value,
        puntoReferencia: document.getElementById('servicio-referencia').value,
        distanciaKm: document.getElementById('servicio-distancia').value,
        topografia: document.getElementById('servicio-topografia').value,
        tipoEnganche: document.getElementById('servicio-enganche').value
      },
      vehiculo: {
        placa: document.getElementById('vehiculo-placa').value,
        tipo: document.getElementById('vehiculo-tipo').value,
        traccion: document.getElementById('vehiculo-traccion').value,
        transmision: document.getElementById('vehiculo-transmision').value,
        pesoToneladas: document.getElementById('vehiculo-peso').value,
        valorComercialDeclarado: document.getElementById('vehiculo-valor').value,
        fallaMecanica: document.getElementById('vehiculo-falla').value
      }
    };
  }
};
