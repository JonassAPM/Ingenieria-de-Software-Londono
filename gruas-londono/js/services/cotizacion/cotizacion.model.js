// Modelo del microservicio de cotización SICETAC.
// Contiene tablas maestras y lógica de liquidación normada.

const PARAMETROS_SICETAC = {
  baseEngancheUrbano: 100000,
  baseEngancheCarretera: 150000,
  valorKmPlano: 3500,
  valorKmOndulado: 4200,
  valorKmMontana: 5000,
  factorPesoTonelada: 15000,
  porcentajeSeguroMercancia: 0.002,
  recargoTopografiaOndulado: 15000,
  recargoTopografiaMontana: 30000
};

const CotizacionModel = {
  parametros: { ...PARAMETROS_SICETAC },

  /**
   * Calcula el desglose de una cotización según SICETAC.
   * @param {object} datos - Información del servicio y vehículo.
   * @returns {object} Desglose con total y bandera de revisión manual.
   */
  calcularCotizacion(datos = {}) {
    const tipoEnganche = datos.tipoEnganche || 'urbano';
    const distanciaKm = Number(datos.distanciaKm || 0);
    const topografia = datos.topografia || 'plano';
    const pesoToneladas = Number(datos.pesoToneladas || 0);
    const valorComercial = Number(datos.valorComercialDeclarado || 0);

    const baseEnganche = tipoEnganche === 'carretera'
      ? this.parametros.baseEngancheCarretera
      : this.parametros.baseEngancheUrbano;

    const valorKm = this._obtenerValorKm(topografia);
    const costoDistancia = distanciaKm * valorKm;

    const recargoTopografia = this._obtenerRecargoTopografia(topografia);
    const recargoCarga = pesoToneladas * this.parametros.factorPesoTonelada;
    const recargoSeguro = valorComercial * this.parametros.porcentajeSeguroMercancia;

    const valorTotal = baseEnganche +
      costoDistancia +
      recargoTopografia +
      recargoCarga +
      recargoSeguro;

    const requiereRevisionManual = this.requiereRevisionManual(
      datos.pesoToneladas,
      datos.fallaMecanica
    );

    return {
      tarifaBase: baseEnganche,
      costoDistancia,
      recargoTopografia,
      recargoCarga,
      recargoSeguroMercancia: recargoSeguro,
      valorTotal: Math.round(valorTotal),
      requiereRevisionManual
    };
  },

  /**
   * Valida si la carga es sobredimensionada o la falla requiere evaluación manual.
   * @param {number|string} pesoToneladas
   * @param {string} fallaMecanica
   * @returns {boolean}
   */
  requiereRevisionManual(pesoToneladas, fallaMecanica = '') {
    const peso = Number(pesoToneladas || 0);
    const fallaNormalizada = String(fallaMecanica || '').toUpperCase();
    return peso > 15 || fallaNormalizada.includes('VOLCADO_ABISMO');
  },

  /**
   * Genera un enlace de WhatsApp precargado para soporte asistido.
   * @param {object} datos - Datos del servicio y vehículo.
   * @returns {string} Enlace wa.me con texto codificado.
   */
  generarEnlaceWhatsApp(datos = {}) {
    const texto = `Hola Grúas Londoño, necesito soporte para una carga sobredimensionada. Datos: ${JSON.stringify(datos)}`;
    return `https://wa.me/573001234567?text=${encodeURIComponent(texto)}`;
  },

  _obtenerValorKm(topografia) {
    switch (topografia) {
      case 'ondulado':
        return this.parametros.valorKmOndulado;
      case 'montana':
      case 'montañoso':
        return this.parametros.valorKmMontana;
      default:
        return this.parametros.valorKmPlano;
    }
  },

  _obtenerRecargoTopografia(topografia) {
    switch (topografia) {
      case 'ondulado':
        return this.parametros.recargoTopografiaOndulado;
      case 'montana':
      case 'montañoso':
        return this.parametros.recargoTopografiaMontana;
      default:
        return 0;
    }
  }
};
