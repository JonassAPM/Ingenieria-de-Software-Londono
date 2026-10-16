// Generador de comprobante PDF con jsPDF.
const PdfGenerator = {
  /**
   * Genera y descarga el comprobante oficial de radicación.
   * @param {object} solicitud - Objeto completo de la solicitud.
   */
  generarComprobante(solicitud) {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      Notifications.showToast('Generador de PDF no disponible', 'error');
      return;
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const ancho = 210;
    const margen = 15;
    let y = 20;

    // Encabezado
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('GRÚAS LONDOÑO - AUXILIO VIAL Y CARGA PESADA', ancho / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Radicado: ${solicitud.radicado}`, ancho / 2, y, { align: 'center' });
    y += 6;
    doc.text(`Fecha: ${Formatters.formatDateTime(solicitud.fecha)}`, ancho / 2, y, { align: 'center' });
    y += 10;

    // Línea divisoria
    doc.setDrawColor(0, 51, 102);
    doc.line(margen, y, ancho - margen, y);
    y += 8;

    // Datos del cliente
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos del cliente', margen, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${solicitud.cliente.nombre}`, margen, y);
    y += 5;
    doc.text(`Documento: ${solicitud.cliente.documento}`, margen, y);
    y += 5;
    doc.text(`Teléfono: ${solicitud.cliente.telefono}`, margen, y);
    y += 5;
    doc.text(`Correo: ${solicitud.cliente.correo}`, margen, y);
    y += 8;

    // Datos del servicio
    doc.setFont('helvetica', 'bold');
    doc.text('Servicio', margen, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Tipo: ${solicitud.servicio.tipoServicio}`, margen, y);
    y += 5;
    doc.text(`Origen: ${solicitud.servicio.origen}`, margen, y);
    y += 5;
    doc.text(`Destino: ${solicitud.servicio.destino}`, margen, y);
    y += 5;
    doc.text(`Distancia: ${Formatters.formatKm(solicitud.servicio.distanciaKm)}`, margen, y);
    y += 8;

    // Datos del vehículo
    doc.setFont('helvetica', 'bold');
    doc.text('Vehículo', margen, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Placa: ${solicitud.vehiculo.placa}`, margen, y);
    y += 5;
    doc.text(`Tipo: ${solicitud.vehiculo.tipo}`, margen, y);
    y += 5;
    doc.text(`Peso: ${Formatters.formatKm(solicitud.vehiculo.pesoToneladas)} ton`, margen, y);
    y += 8;

    // Cotización
    doc.setFont('helvetica', 'bold');
    doc.text('Cotización SICETAC', margen, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Base enganche: ${Formatters.formatCOP(solicitud.cotizacion.tarifaBase)}`, margen, y);
    y += 5;
    doc.text(`Costo distancia: ${Formatters.formatCOP(solicitud.cotizacion.costoDistancia)}`, margen, y);
    y += 5;
    doc.text(`Recargo topografía: ${Formatters.formatCOP(solicitud.cotizacion.recargoTopografia)}`, margen, y);
    y += 5;
    doc.text(`Recargo carga: ${Formatters.formatCOP(solicitud.cotizacion.recargoCarga)}`, margen, y);
    y += 5;
    doc.text(`Seguro mercancía: ${Formatters.formatCOP(solicitud.cotizacion.recargoSeguroMercancia)}`, margen, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: ${Formatters.formatCOP(solicitud.cotizacion.valorTotal)}`, margen, y);
    y += 8;

    // Cláusula
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Documento generado automáticamente conforme a la regulación SICETAC.', margen, y);
    y += 4;
    doc.text('Grúas Londoño se reserva el derecho de confirmar la tarifa según condiciones en sitio.', margen, y);

    doc.save(`${solicitud.radicado}.pdf`);
  }
};
