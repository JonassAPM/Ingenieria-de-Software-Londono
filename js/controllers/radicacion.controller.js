/* =====================================================================
   CONTROLADOR: RADICACIÓN DE SOLICITUDES · GRÚAS LONDOÑO
   Orquestación del formulario paso a paso, validación estricta RN-02,
   liquidación SICETAC, inserción en Firestore y emisión de comprobante PDF.
   ===================================================================== */
const RadicacionController = {
  form: null,

  init() {
    RadicacionView.init();
    this.form = document.getElementById('radicacion-form');
    if (!this.form) return;

    this._bindFormEvents();
    this._actualizarResumen();
  },

  _bindFormEvents() {
    // Escuchar cambios para mantener vivo el resumen lateral
    this.form.addEventListener('input', () => this._actualizarResumen());
    this.form.addEventListener('change', () => this._actualizarResumen());

    // Envío final del formulario
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.procesarRadicacion();
    });
  },

  _leerDatosFormulario() {
    const val = (id) => (document.getElementById(id)?.value || '').trim();
    const num = (id) => Number(document.getElementById(id)?.value || 0);

    return {
      cliente: {
        nombre: val('cliente-nombre'),
        documento: val('cliente-documento'),
        telefono: val('cliente-telefono'),
        correo: val('cliente-correo')
      },
      servicio: {
        tipoServicio: val('servicio-tipo') || 'GRUA_PLATAFORMA',
        origen: val('servicio-origen'),
        destino: val('servicio-destino'),
        puntoReferencia: val('servicio-referencia'),
        distanciaKm: num('servicio-distancia'),
        topografia: val('servicio-topografia') || 'plano',
        tipoEnganche: val('servicio-enganche') || 'urbano'
      },
      vehiculo: {
        placa: val('vehiculo-placa').toUpperCase(),
        tipo: val('vehiculo-tipo'),
        traccion: val('vehiculo-traccion') || '4x2',
        transmision: val('vehiculo-transmision') || 'manual',
        pesoToneladas: num('vehiculo-peso'),
        valorComercialDeclarado: num('vehiculo-valor'),
        fallaMecanica: val('vehiculo-falla')
      }
    };
  },

  _actualizarResumen() {
    const datos = this._leerDatosFormulario();
    // Calcular cotización con los datos vigentes del formulario de radicación
    const cotizacion = CotizacionModel.calcularCotizacion({
      tipoEnganche: datos.servicio.tipoEnganche,
      distanciaKm: datos.servicio.distanciaKm,
      topografia: datos.servicio.topografia,
      pesoToneladas: datos.vehiculo.pesoToneladas,
      valorComercialDeclarado: datos.vehiculo.valorComercialDeclarado,
      fallaMecanica: datos.vehiculo.fallaMecanica
    });

    RadicacionView.actualizarResumen(datos, cotizacion);
    return { datos, cotizacion };
  },

  async procesarRadicacion() {
    const { datos, cotizacion } = this._actualizarResumen();

    // 1. Validar integridad según regla RN-02
    const errores = RadicacionModel.validarSolicitud(datos);
    if (Object.keys(errores).length > 0) {
      RadicacionView.mostrarErrores(errores);
      Notifications.showToast('Revisa los campos obligatorios marcados en rojo', 'error');
      // Redirigir al paso correspondiente con error
      if (errores['cliente-nombre'] || errores['cliente-documento'] || errores['cliente-telefono'] || errores['cliente-correo']) {
        RadicacionView.mostrarPaso(1);
      } else if (errores['servicio-origen'] || errores['servicio-destino'] || errores['servicio-distancia']) {
        RadicacionView.mostrarPaso(2);
      } else {
        RadicacionView.mostrarPaso(3);
      }
      return;
    }

    try {
      RadicacionView.toggleLoading(true);

      // 2. Generar radicado oficial y construir documento
      const radicado = RadicacionModel.generarRadicado();
      const nuevaSolicitud = RadicacionModel.construirSolicitud(datos, cotizacion, radicado);

      // 3. Persistir en Firestore / Mock reactivo
      const guardada = await RadicacionModel.guardarSolicitud(nuevaSolicitud);

      // 4. Descargar comprobante oficial en PDF automáticamente
      setTimeout(() => {
        PdfGenerator.generarComprobante(guardada);
      }, 350);

      // 5. Notificar y mostrar modal de éxito
      Notifications.showToast(`¡Solicitud radicada con éxito! Radicado: ${radicado}`, 'success');
      RadicacionView.mostrarModalExito(guardada);

      // Limpiar formulario y resetear asistente
      this.form.reset();
      RadicacionView.mostrarPaso(1);
      this._actualizarResumen();
    } catch (err) {
      console.error('Error al procesar radicación:', err);
      Notifications.showToast('No se pudo radicar la solicitud. Intenta nuevamente', 'error');
    } finally {
      RadicacionView.toggleLoading(false);
    }
  }
};

window.RadicacionController = RadicacionController;
