/* =====================================================================
   MODELO: COTIZACIÓN NORMADA SICETAC · GRÚAS LONDOÑO
   Tablas maestras de tarifas oficiales, factores topográficos y de carga.
   ===================================================================== */
const PARAMETROS_SICETAC = {
  baseEngancheUrbano: 100000,
  baseEngancheCarretera: 150000,
  valorKmPlano: 3500,
  valorKmOndulado: 4200,
  valorKmMontana: 5000,
  factorPesoTonelada: 15000,
  porcentajeSeguroMercancia: 0.002, // 0.2%
  recargoTopografiaOndulado: 15000,
  recargoTopografiaMontana: 30000
};

const CotizacionModel = {
  parametros: { ...PARAMETROS_SICETAC },

  /**
   * Realiza el cálculo matemático estricto según la norma SICETAC
   * Total = Base + (Km × ValorKm) + RecargoTopografía + (Toneladas × FactorPeso) + (ValorDeclarado × 0.2%)
   * @param {object} datos
   * @returns {object} Desglose detallado
   */
  calcularCotizacion(datos = {}) {
    const tipoEnganche = datos.tipoEnganche || 'urbano';
    const distanciaKm = Math.max(0, Number(datos.distanciaKm || 0));
    const topografia = String(datos.topografia || 'plano').toLowerCase();
    const pesoToneladas = Math.max(0, Number(datos.pesoToneladas || 0));
    const valorComercial = Math.max(0, Number(datos.valorComercialDeclarado || 0));
    const fallaMecanica = String(datos.fallaMecanica || '');

    // 1. Tarifa base según tipo de enganche
    const tarifaBase = tipoEnganche === 'carretera'
      ? this.parametros.baseEngancheCarretera
      : this.parametros.baseEngancheUrbano;

    // 2. Costo por distancia y recargo topográfico
    const valorKm = this._obtenerValorKm(topografia);
    const costoDistancia = Math.round(distanciaKm * valorKm);
    const recargoTopografia = this._obtenerRecargoTopografia(topografia);

    // 3. Recargo por tonelaje y seguro
    const recargoCarga = Math.round(pesoToneladas * this.parametros.factorPesoTonelada);
    const recargoSeguroMercancia = Math.round(valorComercial * this.parametros.porcentajeSeguroMercancia);

    // 4. Total liquidado
    const valorTotal = Math.round(
      tarifaBase +
      costoDistancia +
      recargoTopografia +
      recargoCarga +
      recargoSeguroMercancia
    );

    // 5. Validación Extensión 3b (Carga sobredimensionada o rescate crítico)
    const requiereRevisionManual = this.requiereRevisionManual(pesoToneladas, fallaMecanica);

    return {
      tarifaBase,
      costoDistancia,
      recargoTopografia,
      recargoCarga,
      recargoSeguroMercancia,
      valorTotal,
      requiereRevisionManual,
      detalles: {
        distanciaKm,
        valorKm,
        topografia,
        pesoToneladas,
        tipoEnganche
      }
    };
  },

  /**
   * Determina si la solicitud sobrepasa los límites automáticos
   * @param {number} pesoToneladas
   * @param {string} fallaMecanica
   * @returns {boolean}
   */
  requiereRevisionManual(pesoToneladas, fallaMecanica = '') {
    const peso = Number(pesoToneladas) || 0;
    const f = String(fallaMecanica).toUpperCase();
    return peso > 15 || f.includes('VOLCADO') || f.includes('ABISMO') || f.includes('VOLCAMIENTO') || f.includes('SOBREDIMENSIONADO');
  },

  /**
   * Genera enlace de WhatsApp asistido para revisión manual
   * @param {object} datos
   * @returns {string} URL wa.me
   */
  generarEnlaceWhatsApp(datos = {}) {
    const peso = datos.pesoToneladas ? `${datos.pesoToneladas} Ton` : 'No especificado';
    const falla = datos.fallaMecanica || 'Carga sobredimensionada / Asistencia especial';
    const texto = `Hola Grúas Londoño, solicito revisión asistida para servicio especial.\n` +
      `• Peso: ${peso}\n` +
      `• Condición: ${falla}\n` +
      `• Distancia aprox: ${datos.distanciaKm || 0} km\n` +
      `• Origen: ${datos.origen || 'No especificado'}\n` +
      `• Destino: ${datos.destino || 'No especificado'}`;
    return `https://wa.me/573101234567?text=${encodeURIComponent(texto)}`;
  },

  _obtenerValorKm(topografia) {
    if (topografia.includes('ondulado')) return this.parametros.valorKmOndulado;
    if (topografia.includes('monta')) return this.parametros.valorKmMontana;
    return this.parametros.valorKmPlano;
  },

  _obtenerRecargoTopografia(topografia) {
    if (topografia.includes('ondulado')) return this.parametros.recargoTopografiaOndulado;
    if (topografia.includes('monta')) return this.parametros.recargoTopografiaMontana;
    return 0;
  }
};

window.CotizacionModel = CotizacionModel;
