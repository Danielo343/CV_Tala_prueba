// src/utils/exportActivaciones.js

import * as XLSX from 'xlsx';
import api from '@/services/api'; 

/**
 * Función para exportar la lista completa de activaciones con formato detallado, 
 * estructurado por categorías (A, B, C...) similar al reporte manual.
 * * @param {object} filtros - Objeto con filtros de fecha, texto y avanzados.
 */
export async function exportActivacionesToExcel(filtros) {
    let datosCompletos = [];
    
    const params = {
        ...filtros,
        limit: 99999, // Límite alto para asegurar que se exporte todo.
        page: 1 
    };

    Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === '') {
            delete params[key];
        }
    });

    try {
        const response = await api.get('/activaciones', { params });
        // Asume que la respuesta trae los nombres de los catálogos (agente_causante_general_nombre, etc.)
        datosCompletos = Array.isArray(response.data.data) ? response.data.data : response.data;

        if (datosCompletos.length === 0) {
            alert("No se encontraron registros para exportar.");
            return;
        }

    } catch (error) {
        console.error("Error al obtener datos para exportar:", error);
        alert(`Error al obtener los registros completos: ${error.message}`);
        return;
    }

    // --- Funciones Helper de Formato ---
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
        return adjustedDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // --- Mapeo a la estructura de informe detallado (ORDEN Y COLUMNAS FINAL) ---
    const datosParaExcel = datosCompletos.map(fila => {
        
        const huboTraslado = fila.requirio_traslado;
        let destinoFinal = '';
        if (huboTraslado) {
          destinoFinal = fila.hospital_destino || 'HOSPITAL NO ESPECIFICADO';
        } else {
          // Si no hubo traslado, usamos la razón de NO traslado
          destinoFinal = fila.estado_traslado_nombre || fila.estado_traslado || 'NO TRASLADO';
        }
        
        return {
          // --- A: IDENTIFICACIÓN ---
          'A-FOLIO_LOCAL': fila.num_reporte_local,
          'A-F_EXTERNO': fila.num_reporte_externo || 'N/A',
          
          // --- B: TIEMPO DEL EVENTO ---
          'B-FECHA_EVENTO': formatDate(fila.fecha_activacion),
          'B-HORA_EVENTO': fila.hora_activacion ? fila.hora_activacion.substring(0, 5) : 'N/A',
          
          // --- C: PACIENTE ---
          'C-PACIENTE_NOMBRE': fila.paciente_nombre,
          'C-EDAD': fila.paciente_edad || 'N/D',
          'C-SEXO': fila.paciente_sexo || 'N/D',
          
          // --- D: CAUSA DEL SERVICIO (Agrupación de Tipo/Origen) ---
          'D-TIPO_SERVICIO_GRAL': fila.tipo_activacion || 'N/D', // Ej: Accidente de Tránsito
          'D-ORIGEN_REPORTE': fila.origen_reporte || 'N/D', // Ej: C5, R, Local
          'D-AGENTE_CAUSAL': fila.agente_causante_general_nombre || fila.agente_causante_general || 'N/D', // Ej: Choque, Caída
          
          // --- E: DETALLE ESPECÍFICO ---
          'E-CAUSA_CLINICA': fila.causa_clinica || 'N/D', // Nombre de la causa clínica del catálogo
          'E-DETALLE_ESPECIFICO': fila.causa_clinica_especifica || fila.ct_especifico || 'N/A', // Usamos ambos campos específicos
          'E-OTRO_TIPO_DETALLE': fila.tipo_activacion_otro || 'N/A', // Detalle para 'Otro' en tipo_activacion

          // --- F: TRASLADO Y DESTINO ---
          'F-REQUIERE_TRASLADO': huboTraslado ? 'SÍ' : 'NO',
          'F-DESTINO_FINAL': destinoFinal,
          
          // --- G: UNIDAD Y CAPTURA ---
          'G-UNIDAD_ASIGNADA': fila.unidad_asignada_nombre || 'N/D',
          'G-FECHA_CAPTURA': formatDate(fila.fecha_captura) || 'N/A',

        };
    });

    const worksheet = XLSX.utils.json_to_sheet(datosParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Detallado Transaccional");

    let nombreArchivo = '';
    if (params.fecha_inicio && params.fecha_fin) {
      nombreArchivo = `Reporte_Detallado_${params.fecha_inicio}_AL_${params.fecha_fin}.xlsx`;
    } else {
      const hoy = new Date().toISOString().split('T')[0];
      nombreArchivo = `Reporte_Historico_Generado_${hoy}.xlsx`;
    }

    XLSX.writeFile(workbook, nombreArchivo);
}