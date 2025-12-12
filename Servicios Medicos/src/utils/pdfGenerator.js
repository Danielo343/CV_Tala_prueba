import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// 1. Función auxiliar para cargar la imagen asíncronamente
const cargarImagen = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`No se pudo cargar la imagen: ${src}`);
      resolve(null); // Si falla, no rompe el PDF, solo no muestra la imagen
    };
  });
};

// 2. La función principal ahora es ASYNC
export const generarFichaPDF = async (data) => {
  if (!data) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // --- COLORES ---
  const colorPrimary = [41, 128, 185]; // Azul Médico
  const colorSecondary = [52, 73, 94]; // Gris Oscuro
  const colorAccent = [222, 45, 4];    // Gris/Rojo (Para Folio)
  const colorLight = [245, 245, 245];  // Fondo Gris Claro

  // --- 1. ENCABEZADO ---
  // Fondo del Header
  doc.setFillColor(...colorPrimary);
  doc.rect(0, 0, pageWidth, 35, 'F');

// --- LOGO DE LA EMPRESA (AJUSTADO) ---
  const logoUrl = '/ServiciosMedicos.png'; // Asegúrate que este es el nombre correcto en /public
  const logoImg = await cargarImagen(logoUrl);

  if (logoImg) {
    // 1. Círculo Blanco (Fondo)
    // Aumentamos el radio de 11 a 13 para dar más espacio
    doc.setFillColor(255, 255, 255);
    doc.circle(20, 17.5, 13, 'F'); 

    // 2. Imagen del Logo
    // Esto crea un borde blanco limpio alrededor del logo.
    const logoSize = 24; 
    const logoX = 20 - (logoSize / 2); 
    const logoY = 17.5 - (logoSize / 2); 
    doc.addImage(logoImg, 'PNG', logoX, logoY, logoSize, logoSize);

  }

  // --- TÍTULOS ---
  // Ajustamos margen izquierdo (50) para dar espacio al nuevo logo
  const titleMaxWidth = 105;

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); 
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICIOS MÉDICOS MUNICIPALES', 40, 15, { maxWidth: titleMaxWidth });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('DIRECCIÓN DE ATENCIÓN PREHOSPITALARIA - TALA, JALISCO', 40, 20, { maxWidth: titleMaxWidth });
  doc.text('Reporte de Servicio de Ambulancia', 40, 30, { maxWidth: titleMaxWidth });

  // --- Cuadro de Folio (Tipo Sello) ---
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - 60, 8, 50, 20, 2, 2, 'F');
  
  doc.setTextColor(...colorSecondary);
  doc.setFontSize(8);
  doc.text('FOLIO INTERNO', pageWidth - 35, 13, { align: 'center' });
  
  doc.setTextColor(...colorAccent);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.num_reporte_local || 'S/N', pageWidth - 35, 23, { align: 'center' });

  // --- 2. INFORMACIÓN DEL SERVICIO (Tabla Compacta) ---
  let fechaTexto = 'N/D';
  if (data.fecha_activacion) {
      const fechaObj = new Date(data.fecha_activacion);
      // Ajuste simple de zona horaria
      const fechaAjustada = new Date(fechaObj.getTime() + fechaObj.getTimezoneOffset() * 60000);
      fechaTexto = fechaAjustada.toLocaleDateString('es-MX');
  }

  let currentY = 42;

  autoTable(doc, {
    startY: currentY,
    head: [['DATOS GENERALES DEL SERVICIO', '', '', '']],
    body: [
      ['FECHA:', fechaTexto, 'HORA:', data.hora_activacion ? data.hora_activacion.substring(0, 5) : 'N/D'],
      ['UNIDAD:', data.unidad_asignada_nombre || 'N/D', 'TIPO:', data.tipo_activacion_nombre || 'N/D'],
      ['FOLIO EXTERNO:', data.num_reporte_externo || '---', 'ORIGEN:', data.origen_reporte || 'N/D'],
    ],
    theme: 'grid',
    headStyles: { fillColor: colorSecondary, textColor: 255, fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', width: 25 },
      2: { fontStyle: 'bold', width: 25 }
    }
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // --- 3. DATOS DEL PACIENTE ---
  autoTable(doc, {
    startY: currentY,
    head: [['DATOS DEL PACIENTE']],
    body: [
      [`NOMBRE: ${data.paciente_nombre}`],
      [`EDAD: ${data.paciente_edad || '--'} años      SEXO: ${data.paciente_sexo || '--'}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: colorPrimary, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3 }
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // --- 4. EVALUACIÓN CLÍNICA ---
  let traumas = 'Negativo';
  if (data.causas_traumaticas_nombres && data.causas_traumaticas_nombres.length > 0) {
    traumas = data.causas_traumaticas_nombres.join(', ');
  }
  const evalData = data.evaluacion || {};

  autoTable(doc, {
    startY: currentY,
    head: [['EVALUACIÓN CLÍNICA Y TRAUMATOLÓGICA']],
    body: [
      [`CAUSA CLÍNICA: ${data.causa_clinica_nombre || 'N/A'}`],
      [`DETALLE: ${data.causa_clinica_especifica || '---'}`],
      [`AGENTE CAUSAL: ${data.agente_causante_general_nombre || 'N/A'}`],
      [`TRAUMATISMO: ${traumas}`],
      [`DETALLE TRAUMA: ${data.ct_especifico || '---'}`],
      [`SIGNOS: Pupilas: ${evalData.estado_pupilas_nombre || '--'} | Piel: ${evalData.estado_piel_nombre || '--'}`]
    ],
    theme: 'striped',
    headStyles: { fillColor: colorSecondary, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2 },
    alternateRowStyles: { fillColor: colorLight }
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // --- 5. LESIONES ---
  const lesionesBody = (data.lesiones || []).map(l => [
    l.tipo_lesion_nombre || 'N/D',
    l.ubicacion_lesion_nombre || 'N/D',
    l.descripcion_lesion || ''
  ]);

  if (lesionesBody.length === 0) {
    lesionesBody.push(['Sin lesiones aparentes', '---', '---']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['TIPO DE LESIÓN', 'UBICACIÓN', 'DESCRIPCIÓN']],
    body: lesionesBody,
    theme: 'grid',
    headStyles: { fillColor: [220, 53, 69], textColor: 255 },
    styles: { fontSize: 9 }
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // --- 6. RESOLUCIÓN / TRASLADO ---
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = 20;
  }

  doc.setDrawColor(0);
  doc.setFillColor(...colorLight);
  doc.roundedRect(margin, currentY, contentWidth, 25, 1, 1, 'FD');
  
  doc.setFontSize(11);
  doc.setTextColor(...colorPrimary);
  doc.setFont('helvetica', 'bold');
  doc.text('RESOLUCIÓN DEL SERVICIO', margin + 5, currentY + 8);

  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const textoResolucion = data.requirio_traslado 
    ? `PACIENTE TRASLADADO A: ${data.hospital_destino}` 
    : `NO HUBO TRASLADO. MOTIVO: ${data.estado_traslado_nombre || 'No especificado'}`;
    
  doc.text(textoResolucion, margin + 5, currentY + 18);

  // --- 7. FIRMAS ---
  const firmaY = pageHeight - 30;
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(100);
  
  doc.line(40, firmaY, 90, firmaY);
  doc.setFontSize(8);
  doc.text('FIRMA DIRECCIÓN', 65, firmaY + 5, { align: 'center' });

  doc.line(120, firmaY, 170, firmaY);
  doc.text('FIRMA RECIBE / TESTIGO', 145, firmaY + 5, { align: 'center' });

  // Pie de página
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(`Generado el: ${new Date().toLocaleString()} | Sistema De Dirección Prehospitalaria Tala.`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  doc.save(`Ficha_${data.num_reporte_local}.pdf`);
};