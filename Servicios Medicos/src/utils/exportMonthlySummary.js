// src/utils/exportMonthlySummary.js

import * as XLSX from 'xlsx';
import api from '@/services/api';

/**
 * Mapeo de endpoints de reporte a nombres legibles para el resumen.
 * NOTA: Los paths en el objeto se usan como referencia, pero la llamada usa el path relativo.
 */
const REPORT_ENDPOINTS = [
    // Usamos el path relativo al /api/ base
    { name: 'causas-traumaticas', path: 'reportes/causas-traumaticas', title: 'TRAUMA' },
    { name: 'causas-clinicas', path: 'reportes/causas-clinicas', title: 'URGENCIAS CLÍNICAS' },
    { name: 'destinos', path: 'reportes/destinos', title: 'DESTINO Y ESTADO DE TRASLADO' },
    { name: 'origen', path: 'reportes/origen', title: 'ORIGEN DE ACTIVACIÓN' },
];

/**
 * Función que llama a los endpoints de reporte y consolida los resultados 
 * en una sola hoja de cálculo con encabezados de grupo (similar a la tabla dinámica).
 * @param {object} filtros - Filtros de fecha y texto.
 */
export async function exportMonthlySummary(filtros) {
    let allReports = [];
    let grandTotal = 0;
    
    // 1. Limpieza de filtros
    const params = Object.keys(filtros).reduce((acc, key) => {
        if (filtros[key] !== null && filtros[key] !== '') {
            acc[key] = filtros[key];
        }
        return acc;
    }, {});

    // 2. Ejecutar todas las llamadas de reporte en paralelo
    const promises = REPORT_ENDPOINTS.map(async (reportInfo) => {
        try {
            // 🎯 CORRECCIÓN FINAL: Llamada directa a la API usando el path relativo.
            // Si el path es 'reportes/origen', Axios lo resuelve como {baseURL}/reportes/origen
            const response = await api.get(reportInfo.path, { params });
            
            let sectionTotal = 0;
            const data = (response.data || []).map(item => {
                const totalCount = parseInt(item.total) || 0;
                sectionTotal += totalCount;
                return {
                    MOTIVO: item.nombre,
                    CONTEO: totalCount,
                };
            });
            
            return {
                title: reportInfo.title,
                data: data,
                total: sectionTotal
            };
        } catch (e) {
            console.error(`Error fetching ${reportInfo.path}:`, e);
            // Si una sección falla, la marcamos con error para reportar en Excel
            return { title: reportInfo.title, data: [], total: 0, error: true };
        }
    });
    
    allReports = await Promise.all(promises);

    // 3. Construir la hoja de Excel (Array of Arrays)
    const excelData = [];
    
    // Helper de fecha para metadatos
    const formatDate = (dateString) => {
        if (!dateString || dateString === '') return 'Histórico';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // --- ENCABEZADOS Y METADATOS (Similares a su plantilla manual) ---
    excelData.push(['REPORTE MENSUAL DE SERVICIOS DIRECCION DE ATENCION MEDICA PREHOSPITALARIA']);
    excelData.push([]);
    excelData.push(['Periodo:', formatDate(filtros.fecha_inicio), 'al', formatDate(filtros.fecha_fin)]);
    excelData.push([]); 
    excelData.push(['MOTIVO DE ATENCIÓN', 'TOTAL']); // Encabezados principales del conteo
    
    // 4. Añadir cada sección y calcular el Total General
    allReports.forEach(report => {
        if (report.total > 0 || report.error) {
            excelData.push([]); // Espacio entre secciones
            
            // Título de la sección y Total de la Sección
            excelData.push([report.title.toUpperCase(), report.total]); 
            
            // Añadir los motivos individuales
            if (report.error) {
                excelData.push([`[ERROR AL CARGAR ESTA SECCIÓN]`, 0, '']);
            } else {
                report.data.forEach(row => {
                    if (row.CONTEO > 0) {
                        excelData.push([`  ${row.MOTIVO}`, row.CONTEO]); // Indentación para las subcategorías
                    }
                });
            }
            
            grandTotal += report.total;
        }
    });

    // 5. Añadir Total General
    excelData.push([]);
    excelData.push(['GRAN TOTAL DE SERVICIOS:', grandTotal]);
    
    // 6. Crear y descargar el XLSX
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    
    // Set column widths for readability
    worksheet['!cols'] = [{ wch: 40 }, { wch: 15 }]; 

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Mensual Estructurado");
    
    let nombreArchivo = `Reporte_Mensual_Generado_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
}