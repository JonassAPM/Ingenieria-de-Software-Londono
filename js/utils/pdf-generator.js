/* =====================================================================
   GENERADOR DE COMPROBANTE OFICIAL PDF · GRÚAS LONDOÑO
   Construye en cliente el comprobante de radicación y liquidación
   normada SICETAC con jsPDF en alta fidelidad tipográfica y gráfica.
   ===================================================================== */
const PdfGenerator = {
  /**
   * Genera y descarga el comprobante oficial en formato PDF
   * @param {object} solicitud - Objeto íntegro de la solicitud
   */
  generarComprobante(solicitud) {
    if (!solicitud) return;

    const jspdfModule = window.jspdf || (typeof jsPDF !== 'undefined' ? { jsPDF } : null);
    if (!jspdfModule || !jspdfModule.jsPDF) {
      console.warn('Librería jsPDF no disponible en esta vista.');
      if (window.Notifications) {
        Notifications.showToast('jsPDF no disponible temporalmente', 'warning');
      }
      return;
    }

    const { jsPDF } = jspdfModule;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const anchoPagina = 210;
    const margen = 16;
    const anchoUtil = anchoPagina - margen * 2;
    let y = 18;

    // Colores de paleta institucional
    const navyPrimary = [0, 51, 102];
    const blueAccent = [37, 99, 235];
    const slateDark = [15, 23, 42];
    const grayBorder = [226, 232, 240];
    const grayBg = [248, 250, 252];

    // 1. Barra superior institucional
    doc.setFillColor(...navyPrimary);
    doc.rect(0, 0, anchoPagina, 6, 'F');

    // 2. Encabezado principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...navyPrimary);
    doc.text('GRÚAS LONDOÑO · AUXILIO VIAL Y CARGA PESADA', margen, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('NIT: 900.584.231-8 · Regulación Oficial SICETAC (MinTransporte Colombia)', margen, y);
    doc.text('PBX / Línea Emergencias: 310 123 4567 · Aguachica - Bucaramanga - Cobertura Nacional', margen, y + 4);
    y += 12;

    // 3. Caja destacada del Radicado y Fecha
    doc.setFillColor(...grayBg);
    doc.setDrawColor(...navyPrimary);
    doc.setLineWidth(0.6);
    doc.roundedRect(margen, y, anchoUtil, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...navyPrimary);
    doc.text('COMPROBANTE OFICIAL DE RADICACIÓN:', margen + 4, y + 6);

    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...blueAccent);
    doc.text(String(solicitud.radicado || 'GL-2026-PENDIENTE'), margen + 4, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...slateDark);
    const fechaTexto = Formatters.formatDateTime(solicitud.fecha);
    doc.text(`Fecha de Emisión: ${fechaTexto}`, anchoPagina - margen - 4, y + 7, { align: 'right' });
    doc.text(`Estado Inicial: ${solicitud.estado || 'PENDIENTE'}`, anchoPagina - margen - 4, y + 12, { align: 'right' });
    y += 22;

    // Helper para dibujar tablas de dos columnas
    const dibujarSeccion = (titulo, filas) => {
      doc.setFillColor(...navyPrimary);
      doc.rect(margen, y, anchoUtil, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(titulo.toUpperCase(), margen + 3, y + 4.2);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setDrawColor(...grayBorder);
      doc.setLineWidth(0.2);

      filas.forEach((f, idx) => {
        const filaBg = idx % 2 === 0 ? [255, 255, 255] : grayBg;
        doc.setFillColor(...filaBg);
        doc.rect(margen, y, anchoUtil, 5.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...slateDark);
        doc.text(f[0], margen + 3, y + 3.8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(String(f[1] || '—'), margen + 48, y + 3.8);

        if (f[2]) {
          doc.setFont('helvetica', 'bold');
          doc.text(f[2], margen + 105, y + 3.8);
          doc.setFont('helvetica', 'normal');
          doc.text(String(f[3] || '—'), margen + 140, y + 3.8);
        }

        y += 5.5;
      });
      y += 4;
    };

    // 4. Datos del Cliente
    dibujarSeccion('1. Información del Cliente Solicitante', [
      ['Razón Social / Nombre:', solicitud.cliente?.nombre || '—', 'Cédula / NIT:', solicitud.cliente?.documento || '—'],
      ['Teléfono Contacto:', solicitud.cliente?.telefono || '—', 'Correo Electrónico:', solicitud.cliente?.correo || '—']
    ]);

    // 5. Datos del Servicio y Ruta
    dibujarSeccion('2. Detalle de Ruta y Condiciones de Traslado', [
      ['Tipo de Grúa:', solicitud.servicio?.tipoServicio || 'GRUA_PLATAFORMA', 'Tipo de Enganche:', solicitud.servicio?.tipoEnganche || 'Urbano'],
      ['Dirección Origen:', solicitud.servicio?.origen || '—', 'Distancia Calculada:', Formatters.formatKm(solicitud.servicio?.distanciaKm)],
      ['Dirección Destino:', solicitud.servicio?.destino || '—', 'Topografía de Vía:', String(solicitud.servicio?.topografia || 'Plano').toUpperCase()],
      ['Punto Referencia:', solicitud.servicio?.puntoReferencia || 'Sin observaciones']
    ]);

    // 6. Datos del Vehículo
    dibujarSeccion('3. Especificaciones Técnicas del Vehículo Remolcado', [
      ['Placa del Vehículo:', solicitud.vehiculo?.placa || '—', 'Tipo / Clase:', solicitud.vehiculo?.tipo || 'Automóvil'],
      ['Tracción Motriz:', solicitud.vehiculo?.traccion || '4x2', 'Tipo Transmisión:', solicitud.vehiculo?.transmision || 'Manual'],
      ['Peso Estimado:', Formatters.formatToneladas(solicitud.vehiculo?.pesoToneladas), 'Valor Declarado:', Formatters.formatCOP(solicitud.vehiculo?.valorComercialDeclarado)],
      ['Condición Mecánica:', solicitud.vehiculo?.fallaMecanica || 'Vehículo estándar']
    ]);

    // 7. Liquidación Normada SICETAC
    const cot = solicitud.cotizacion || {};
    doc.setFillColor(...navyPrimary);
    doc.rect(margen, y, anchoUtil, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('4. LIQUIDACIÓN TARIFARIA OFICIAL (SICETAC MINISTERIO DE TRANSPORTE)', margen + 3, y + 4.2);
    y += 6;

    const itemsCot = [
      ['Tarifa Base de Arranque y Enganche', Formatters.formatCOP(cot.tarifaBase)],
      [`Costo por Recorrido Distancia (${Formatters.formatKm(solicitud.servicio?.distanciaKm)})`, Formatters.formatCOP(cot.costoDistancia)],
      [`Recargo por Topografía (${solicitud.servicio?.topografia || 'Plano'})`, Formatters.formatCOP(cot.recargoTopografia)],
      [`Recargo por Tonelaje (${Formatters.formatToneladas(solicitud.vehiculo?.pesoToneladas)})`, Formatters.formatCOP(cot.recargoCarga)],
      ['Póliza / Seguro de Transporte sobre Valor Comercial', Formatters.formatCOP(cot.recargoSeguroMercancia)]
    ];

    itemsCot.forEach((item, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(margen, y, anchoUtil, 5, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...slateDark);
      doc.text(item[0], margen + 3, y + 3.5);
      doc.setFont('helvetica', 'bold');
      doc.text(item[1], anchoPagina - margen - 4, y + 3.5, { align: 'right' });
      y += 5;
    });

    // Fila Total
    doc.setFillColor(237, 242, 254);
    doc.setDrawColor(...blueAccent);
    doc.setLineWidth(0.4);
    doc.rect(margen, y, anchoUtil, 8, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...navyPrimary);
    doc.text('TOTAL LIQUIDADO A PAGAR (COP):', margen + 4, y + 5.5);
    doc.setFontSize(12);
    doc.setTextColor(...blueAccent);
    doc.text(Formatters.formatCOP(cot.valorTotal), anchoPagina - margen - 4, y + 5.5, { align: 'right' });
    y += 13;

    // 8. Cláusulas legales obligatorias
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...navyPrimary);
    doc.text('CLÁUSULA DE CONDICIONES Y POLÍTICAS OPERATIVAS:', margen, y);
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    const parrafos = [
      '1. Validez de la liquidación: Esta cotización se emite bajo los parámetros matemáticos oficiales de la resolución SICETAC. Cualquier modificación de ruta en sitio ajustará el kilometraje.',
      '2. Cancelación con grúa en camino: Conforme a la regla RN-04, cancelaciones una vez despachada la unidad causarán el cobro íntegro del enganche base.',
      '3. Consulta en línea: Puede consultar el estado satelital del auxilio con su número de radicado y documento en nuestro portal oficial.'
    ];

    parrafos.forEach(p => {
      doc.text(p, margen, y);
      y += 3.2;
    });

    // 9. Pie de página
    doc.setDrawColor(...grayBorder);
    doc.line(margen, 282, anchoPagina - margen, 282);
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Grúas Londoño S.A.S. · Documento Digital Seguro · Consulta pública: tracking.html', margen, 286);
    doc.text('Página 1 de 1', anchoPagina - margen, 286, { align: 'right' });

    // Descarga automática
    const nombreArchivo = `Comprobante_${solicitud.radicado || 'GruasLondono'}.pdf`;
    doc.save(nombreArchivo);

    if (window.Notifications) {
      Notifications.showToast(`Descargando comprobante: ${nombreArchivo}`, 'success');
    }
  }
};

window.PdfGenerator = PdfGenerator;
