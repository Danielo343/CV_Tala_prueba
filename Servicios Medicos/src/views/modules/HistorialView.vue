<template>
  <div class="historial-container">
    
    <!-- Header Mejorado -->
    <div class="page-header-compact">
      <div class="header-content-compact">
        <div class="title-section-compact">
          <i class="fas fa-history header-icon"></i>
          <div>
            <h1 class="page-title">Historial de Actividad</h1>
            <p class="page-subtitle">Auditoría visual de movimientos del sistema</p>
          </div>
        </div>
        <div class="header-stats-compact">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">{{ stats.creaciones }}</span>
              <span class="stat-label">Creaciones</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.ediciones }}</span>
              <span class="stat-label">Ediciones</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.eliminaciones }}</span>
              <span class="stat-label">Eliminaciones</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ totalRegistros }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel de Filtros Mejorado -->
    <div class="filters-panel-compact mb-4">
      <div class="panel-body-compact">
        <div class="filters-grid">
          <div class="filter-group date-group">
            <label>Rango de Fechas</label>
            <div class="d-flex gap-2">
              <div class="input-group input-group-sm">
                <span class="input-group-text"><i class="fas fa-calendar"></i></span>
                <input type="date" class="form-control" v-model="filtros.fecha_inicio">
              </div>
              <div class="input-group input-group-sm">
                <span class="input-group-text"><i class="fas fa-calendar"></i></span>
                <input type="date" class="form-control" v-model="filtros.fecha_fin">
              </div>
            </div>
          </div>
          <div class="filter-group">
            <label>Usuario</label>
            <div class="input-group input-group-sm">
              <span class="input-group-text"><i class="fas fa-user"></i></span>
              <select class="form-select" v-model="filtros.id_usuario">
                <option :value="null">Todos</option>
                <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nombre_completo }}</option>
              </select>
            </div>
          </div>
          <div class="filter-group">
            <label>Acción</label>
            <div class="input-group input-group-sm">
              <span class="input-group-text"><i class="fas fa-play-circle"></i></span>
              <select class="form-select" v-model="filtros.accion">
                <option value="">Todas</option>
                <option value="CREAR">Crear</option>
                <option value="EDITAR">Editar</option>
                <option value="ELIMINAR">Eliminar</option>
              </select>
            </div>
          </div>
          <div class="filter-group">
            <label>Entidad</label>
            <div class="input-group input-group-sm">
              <span class="input-group-text"><i class="fas fa-database"></i></span>
              <select class="form-select" v-model="filtros.tipo_entidad">
                <option value="">Todas</option>
                <option value="PACIENTE">Pacientes</option>
                <option value="USUARIO">Usuarios</option>
                <option value="REGISTRO">Registros</option>
              </select>
            </div>
          </div>
          <div class="filter-actions d-flex align-items-end gap-2">
            <button class="btn btn-primary btn-sm w-100" @click="aplicarFiltros">
              <i class="fas fa-search me-1"></i> Buscar
            </button>
            <button class="btn btn-outline-secondary btn-sm" @click="limpiarFiltros" title="Limpiar">
              <i class="fas fa-undo"></i>
            </button>
            <div class="btn-group">
              <button class="btn btn-outline-danger btn-sm" @click="exportarHistorialPDF" 
                      :disabled="cargando" title="Exportar a PDF">
                <i class="fas fa-file-pdf"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenido Principal -->
    <div class="main-content card border-0 shadow-sm">
      <div class="card-body p-0">
        <div v-if="cargando" class="text-center py-5">
          <div class="spinner-border text-primary mb-2"></div>
          <p class="text-muted">Cargando historial...</p>
        </div>

        <div v-else-if="historial.length === 0" class="text-center py-5">
          <div class="text-muted mb-2"><i class="fas fa-search fa-2x opacity-50"></i></div>
          <p class="text-muted">No se encontraron registros.</p>
          <button class="btn btn-outline-primary btn-sm" @click="limpiarFiltros">
            <i class="fas fa-undo me-1"></i>Limpiar filtros
          </button>
        </div>

        <div v-else>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 custom-table">
              <thead>
                <tr>
                  <th class="ps-4">FECHA</th>
                  <th>USUARIO</th>
                  <th>ACCIÓN</th>
                  <th>ENTIDAD</th>
                  <th>DETALLES</th>
                  <th class="text-end pe-4">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in historial" :key="item.id" class="hover-row" @click="verDetalle(item)">
                  <td class="ps-4">
                    <div class="d-flex flex-column">
                      <span class="fw-bold text-dark">{{ formatDate(item.timestamp) }}</span>
                      <span class="text-muted small">{{ formatTime(item.timestamp) }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="avatar-circle me-2" :class="getUserAvatarClass(item.nombre_usuario)">
                        {{ getInitials(item.nombre_usuario) }}
                      </div>
                      <span class="fw-500 text-dark">{{ item.nombre_usuario || 'Sistema' }}</span>
                    </div>
                  </td>
                  <td>
                    <span :class="['badge-action', getAccionClass(item.accion)]">
                      <i :class="['fas me-1', getAccionIcon(item.accion)]"></i>
                      {{ item.accion }}
                    </span>
                  </td>
                  <td>
                    <span class="badge bg-light text-dark border">
                      <i class="fas fa-database me-1 text-muted"></i>
                      {{ item.tipo_entidad }} #{{ item.id_entidad }}
                    </span>
                  </td>
                  <td>
                    <span class="text-muted small text-truncate d-inline-block" style="max-width: 200px;">
                      {{ getPreviewDetalles(item.detalles) }}
                    </span>
                  </td>
                  <td class="text-end pe-4">
                    <button class="btn btn-sm btn-light text-primary rounded-circle" @click.stop="verDetalle(item)">
                      <i class="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Paginación Mejorada -->
          <div class="d-flex justify-content-between align-items-center p-3 border-top bg-light-subtle">
            <small class="text-muted">
              Mostrando {{ historial.length }} de {{ totalRegistros }} registros
              <span v-if="filtrosAplicados" class="badge bg-warning text-dark ms-2">Filtros activos</span>
            </small>
            <div class="btn-group">
              <button class="btn btn-sm btn-outline-secondary" :disabled="page <= 1" @click="cambiarPagina(page - 1)">
                <i class="fas fa-chevron-left"></i>
              </button>
              <button class="btn btn-sm btn-outline-secondary" disabled>
                Página {{ page }} de {{ totalPages }}
              </button>
              <button class="btn btn-sm btn-outline-secondary" :disabled="page >= totalPages" @click="cambiarPagina(page + 1)">
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Detalle Mejorado -->
    <div class="modal fade" id="modalDetalleHistorial" tabindex="-1" ref="modalRef">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          
          <!-- Header del Modal -->
          <div class="modal-header border-bottom-0 text-white" :class="getHeaderClass(itemSeleccionado?.accion)">
            <div class="d-flex align-items-center gap-3 w-100">
              <div class="icon-circle bg-white bg-opacity-25">
                <i :class="['fas', getAccionIcon(itemSeleccionado?.accion)]"></i>
              </div>
              <div class="flex-grow-1">
                <h5 class="modal-title fw-bold mb-1">{{ getAccionText(itemSeleccionado?.accion) }} - {{ itemSeleccionado?.tipo_entidad }}</h5>
                <div class="d-flex flex-wrap gap-3">
                  <small class="opacity-75">
                    <i class="fas fa-calendar me-1"></i>
                    {{ formatDateTime(itemSeleccionado?.timestamp) }}
                  </small>
                  <small class="opacity-75">
                    <i class="fas fa-user me-1"></i>
                    {{ itemSeleccionado?.nombre_usuario || 'Sistema' }}
                  </small>
                  <small class="opacity-75">
                    <i class="fas fa-tag me-1"></i>
                    ID: {{ itemSeleccionado?.id_entidad }}
                  </small>
                  <small v-if="itemSeleccionado?.ip_address" class="opacity-75">
                    <i class="fas fa-network-wired me-1"></i>
                    IP: {{ itemSeleccionado.ip_address }}
                  </small>
                </div>
              </div>
            </div>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>

          <!-- Body del Modal -->
          <div class="modal-body p-0" v-if="itemSeleccionado">
            
            <!-- Información del Usuario -->
            <div class="p-4 border-bottom bg-light-subtle">
              <div class="row align-items-center">
                <div class="col-md-6">
                  <div class="d-flex align-items-center">
                    <div class="avatar-lg me-3 bg-white border shadow-sm" :class="getUserAvatarClass(itemSeleccionado.nombre_usuario)">
                      {{ getInitials(itemSeleccionado.nombre_usuario) }}
                    </div>
                    <div>
                      <h6 class="mb-1 fw-bold text-dark">{{ itemSeleccionado.nombre_usuario || 'Sistema' }}</h6>
                      <small class="text-muted">Usuario responsable</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 text-md-end">
                  <div class="d-flex flex-column gap-2 align-items-end">
                    <span class="badge bg-white text-dark border px-3 py-2 fs-6 shadow-sm">
                      <i class="fas fa-hashtag me-1 text-muted"></i>
                      {{ itemSeleccionado.tipo_entidad }} #{{ itemSeleccionado.id_entidad }}
                    </span>
                    <small class="text-muted">{{ calcularDuracion(itemSeleccionado.timestamp) }}</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contenido Dinámico -->
            <div class="p-4">
              
              <!-- Para CREAR -->
              <div v-if="itemSeleccionado.accion === 'CREAR'" class="text-center py-4">
                <div class="create-icon mb-3">
                  <i class="fas fa-plus-circle text-success" style="font-size: 3rem;"></i>
                </div>
                <h5 class="text-success mb-2">Registro Creado Exitosamente</h5>
                <p class="text-muted mb-3">Se creó un nuevo registro de {{ itemSeleccionado.tipo_entidad }} en el sistema</p>
                <div class="alert alert-success d-inline-block">
                  <i class="fas fa-check-circle me-2"></i>
                  Operación completada correctamente
                </div>
              </div>

              <!-- Para ELIMINAR -->
              <div v-else-if="itemSeleccionado.accion === 'ELIMINAR'" class="text-center py-4">
                <div class="delete-icon mb-3">
                  <i class="fas fa-trash-alt text-danger" style="font-size: 3rem;"></i>
                </div>
                <h5 class="text-danger mb-2">Registro Eliminado</h5>
                <p class="text-muted mb-3">Se eliminó permanentemente el registro de {{ itemSeleccionado.tipo_entidad }} #{{ itemSeleccionado.id_entidad }}</p>
                <div class="alert alert-danger d-inline-block">
                  <i class="fas fa-exclamation-triangle me-2"></i>
                  Esta acción no se puede deshacer
                </div>
              </div>

              <!-- Para EDITAR - Vista Mejorada -->
              <div v-else-if="itemSeleccionado.accion === 'EDITAR'" class="changes-section">
                <div class="d-flex justify-content-between align-items-center mb-4">
                  <h6 class="fw-bold mb-0 text-dark">
                    <i class="fas fa-sync-alt me-2 text-warning"></i>
                    Cambios Realizados
                  </h6>
                  <div class="d-flex gap-2 align-items-center">
                    <span class="badge bg-warning text-dark">
                      {{ cambiosParseados.length }} campo(s) modificado(s)
                    </span>
                    <button v-if="cambiosParseados.length > 0" class="btn btn-sm btn-outline-primary" @click="toggleExpandedView">
                      <i class="fas" :class="expandedView ? 'fa-compress' : 'fa-expand'"></i>
                      {{ expandedView ? 'Compacto' : 'Expandir' }}
                    </button>
                  </div>
                </div>

                <div v-if="cambiosParseados.length > 0" class="changes-container">
                  <div v-for="(cambio, index) in cambiosParseados" :key="index" 
                       class="change-item card border-0 mb-3 shadow-sm">
                    <div class="card-body p-3">
                      <div class="row align-items-center">
                        <div class="col-md-3">
                          <span class="fw-bold text-dark field-name">
                            <i class="fas fa-pencil-alt me-2 text-primary"></i>
                            {{ formatFieldName(cambio.campo) }}
                          </span>
                        </div>
                        <div class="col-md-4" :class="{'col-md-12': expandedView}">
                          <div :class="['old-value', expandedView ? 'p-3' : '']" :title="cambio.anterior">
                            <small class="text-muted d-block mb-1">
                              <i class="fas fa-arrow-left me-1"></i>Valor anterior:
                            </small>
                            <span class="text-danger" :class="{'text-break': expandedView}">
                              {{ cambio.anterior || '(Vacío)' }}
                            </span>
                          </div>
                        </div>
                        <div class="col-md-1 text-center" v-if="!expandedView">
                          <i class="fas fa-arrow-right text-muted"></i>
                        </div>
                        <div class="col-md-4" :class="{'col-md-12 mt-2': expandedView}" v-if="!expandedView">
                          <div :class="['new-value', expandedView ? 'p-3' : '']" :title="cambio.nuevo">
                            <small class="text-muted d-block mb-1">
                              <i class="fas fa-arrow-right me-1"></i>Valor nuevo:
                            </small>
                            <span class="text-success fw-bold" :class="{'text-break': expandedView}">
                              {{ cambio.nuevo || '(Vacío)' }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-4">
                  <i class="fas fa-info-circle text-muted mb-3" style="font-size: 2rem;"></i>
                  <p class="text-muted mb-0">No se detectaron cambios específicos en los campos</p>
                  <small class="text-muted">Detalles: {{ itemSeleccionado.detalles }}</small>
                </div>
              </div>

              <!-- Para Otras Acciones -->
              <div v-else class="text-center py-4">
                <div class="alert alert-info">
                  <i class="fas fa-info-circle me-2"></i>
                  {{ itemSeleccionado.detalles }}
                </div>
              </div>

            </div>

          </div>
          
          <!-- Footer del Modal -->
          <div class="modal-footer border-top-0 bg-light">
            <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">
              <i class="fas fa-times me-2"></i>Cerrar
            </button>
            <button v-if="itemSeleccionado?.accion === 'EDITAR' && cambiosParseados.length > 0" 
                    class="btn btn-outline-primary px-4" @click="toggleExpandedView">
              <i class="fas" :class="expandedView ? 'fa-compress' : 'fa-expand'"></i>
              {{ expandedView ? 'Vista compacta' : 'Vista completa' }}
            </button>
            <div class="btn-group">
              <button class="btn btn-outline-success px-4" @click="exportarDetalleExcel">
                <i class="fas fa-file-excel me-2"></i>Excel
              </button>
              <button class="btn btn-outline-danger px-4" @click="exportarDetallePDF">
                <i class="fas fa-file-pdf me-2"></i>PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '@/services/api';
import { Modal } from 'bootstrap';

// Variables reactivas
const historial = ref([]);
const usuarios = ref([]);
const cargando = ref(true);
const totalRegistros = ref(0);
const page = ref(1);
const limit = 20;
const expandedView = ref(false);

const filtros = ref({ 
  fecha_inicio: '', 
  fecha_fin: '', 
  id_usuario: null, 
  accion: '',
  tipo_entidad: ''
});

const stats = ref({
  creaciones: 0,
  ediciones: 0,
  eliminaciones: 0
});

const modalRef = ref(null);
let modalInstance = null;
const itemSeleccionado = ref(null);

// Computed
const totalPages = computed(() => Math.ceil(totalRegistros.value / limit) || 1);
const filtrosAplicados = computed(() => {
  return Object.values(filtros.value).some(val => 
    val !== '' && val !== null && val !== undefined
  );
});

const cambiosParseados = computed(() => {
  if (!itemSeleccionado.value || !itemSeleccionado.value.detalles) return [];
  
  const texto = itemSeleccionado.value.detalles;
  
  if (!texto.includes('->')) return [];

  let limpio = texto;
  if (texto.includes('Cambios: [')) {
    const partes = texto.split('Cambios: [');
    limpio = partes[1].replace(']', '');
  }

  const items = limpio.split(', ');
  
  return items.map(item => {
    if (item.includes('->')) {
      const [campo, resto] = item.split(': ');
      if (!resto) return null;
      
      const [anterior, nuevo] = resto.split(' -> ');
      return { 
        campo: campo.trim(), 
        anterior: anterior ? anterior.replace(/'/g, '').trim() : '',
        nuevo: nuevo ? nuevo.replace(/'/g, '').trim() : ''
      };
    }
    return null;
  }).filter(i => i !== null);
});

// Métodos principales
const cargarUsuarios = async () => {
  try { 
    const res = await api.get('/usuarios'); 
    usuarios.value = res.data; 
  } catch (err) { 
    console.error('Error cargando usuarios:', err); 
  }
};

const cargarHistorial = async () => {
  cargando.value = true;
  try {
    const params = { 
      page: page.value, 
      limit: limit, 
      ...filtros.value 
    };
    
    Object.keys(params).forEach(key => { 
      if (params[key] === '' || params[key] === null || params[key] === undefined) 
        delete params[key]; 
    });

    const res = await api.get('/historial', { params });
    historial.value = res.data.data;
    totalRegistros.value = res.data.total;
    
    // Calcular estadísticas
    calcularEstadisticas(res.data.data);
  } catch (err) { 
    console.error("Error cargando historial", err); 
  } finally { 
    cargando.value = false; 
  }
};

const calcularEstadisticas = (data) => {
  stats.value = {
    creaciones: data.filter(item => item.accion === 'CREAR').length,
    ediciones: data.filter(item => item.accion === 'EDITAR').length,
    eliminaciones: data.filter(item => item.accion === 'ELIMINAR').length
  };
};

const aplicarFiltros = () => { 
  page.value = 1; 
  cargarHistorial(); 
};

const limpiarFiltros = () => { 
  filtros.value = { 
    fecha_inicio: '', 
    fecha_fin: '', 
    id_usuario: null, 
    accion: '',
    tipo_entidad: ''
  }; 
  aplicarFiltros(); 
};

const cambiarPagina = (newPage) => { 
  if (newPage > 0 && newPage <= totalPages.value) { 
    page.value = newPage; 
    cargarHistorial(); 
  } 
};

const verDetalle = (item) => {
  itemSeleccionado.value = item;
  expandedView.value = false;
  modalInstance.show();
};

const toggleExpandedView = () => {
  expandedView.value = !expandedView.value;
};

// ==================== FUNCIONES DE EXPORTACIÓN ====================

// Exportar historial completo a Excel
const exportarHistorialExcel = async () => {
  try {
    cargando.value = true;
    
    // Obtener todos los datos sin paginación
    const params = { 
      ...filtros.value,
      page: 1, 
      limit: 10000 
    };
    
    Object.keys(params).forEach(key => { 
      if (params[key] === '' || params[key] === null || params[key] === undefined) 
        delete params[key]; 
    });

    const res = await api.get('/historial', { params });
    const datos = res.data.data;

    // Preparar datos para Excel
    const datosExcel = datos.map(item => ({
      'Fecha': formatDateTime(item.timestamp),
      'Hora': formatTime(item.timestamp),
      'Usuario': item.nombre_usuario || 'Sistema',
      'Acción': item.accion,
      'Entidad': item.tipo_entidad,
      'ID Entidad': item.id_entidad,
      'Detalles': item.detalles || 'Sin detalles',
      'Dirección IP': item.ip_address || 'N/A'
    }));

    // Crear workbook y worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExcel);

    // Ajustar anchos de columnas
    const colWidths = [
      { wch: 20 }, // Fecha
      { wch: 10 }, // Hora
      { wch: 25 }, // Usuario
      { wch: 10 }, // Acción
      { wch: 15 }, // Entidad
      { wch: 12 }, // ID Entidad
      { wch: 50 }, // Detalles
      { wch: 15 }  // IP
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Historial');

    // Generar y descargar
    XLSX.writeFile(wb, `historial_actividad_${new Date().toISOString().split('T')[0]}.xlsx`);
    
  } catch (error) {
    console.error('Error exportando a Excel:', error);
    alert('Error al exportar el historial a Excel');
  } finally {
    cargando.value = false;
  }
};

// Exportar historial completo a PDF
const exportarHistorialPDF = async () => {
  try {
    cargando.value = true;
    
    // Obtener datos
    const params = { 
      ...filtros.value,
      page: 1, 
      limit: 1000 // PDFs funcionan mejor con menos datos
    };
    
    Object.keys(params).forEach(key => { 
      if (params[key] === '' || params[key] === null || params[key] === undefined) 
        delete params[key]; 
    });

    const res = await api.get('/historial', { params });
    const datos = res.data.data;

    // Crear PDF
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('HISTORIAL DE ACTIVIDAD', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Registro Prehospitalario', 105, 22, { align: 'center' });
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-MX')}`, 105, 28, { align: 'center' });

    // Preparar datos para la tabla
    const tableData = datos.map(item => [
      formatDate(item.timestamp),
      formatTime(item.timestamp),
      item.nombre_usuario || 'Sistema',
      item.accion,
      `${item.tipo_entidad} #${item.id_entidad}`,
      item.detalles ? (item.detalles.length > 50 ? item.detalles.substring(0, 50) + '...' : item.detalles) : 'Sin detalles'
    ]);

    // Crear tabla
    autoTable(doc, {
      head: [['Fecha', 'Hora', 'Usuario', 'Acción', 'Entidad', 'Detalles']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { 
        fillColor: [66, 114, 196],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 15 },
        2: { cellWidth: 25 },
        3: { cellWidth: 15 },
        4: { cellWidth: 20 },
        5: { cellWidth: 'auto' }
      },
      margin: { top: 35 }
    });

    // Estadísticas en pie de página
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Total de registros: ${datos.length} | Creaciones: ${datos.filter(d => d.accion === 'CREAR').length} | ` +
             `Ediciones: ${datos.filter(d => d.accion === 'EDITAR').length} | ` +
             `Eliminaciones: ${datos.filter(d => d.accion === 'ELIMINAR').length}`, 
             14, finalY);

    // Guardar PDF
    doc.save(`historial_actividad_${new Date().toISOString().split('T')[0]}.pdf`);
    
  } catch (error) {
    console.error('Error exportando a PDF:', error);
    alert('Error al exportar el historial a PDF');
  } finally {
    cargando.value = false;
  }
};

// Exportar detalle a PDF
const exportarDetallePDF = () => {
  if (!itemSeleccionado.value) return;

  const doc = new jsPDF();
  const item = itemSeleccionado.value;

  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE ACTIVIDAD', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Registro Prehospitalario', 105, 27, { align: 'center' });

  // Información general
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN GENERAL', 20, 40);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let yPosition = 50;
  const addLine = (label, value, x = 20) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, x, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, x + 25, yPosition);
    yPosition += 7;
  };

  addLine('Acción', getAccionText(item.accion));
  addLine('Entidad', `${item.tipo_entidad} #${item.id_entidad}`);
  addLine('Usuario', item.nombre_usuario || 'Sistema');
  addLine('Fecha', formatDateTime(item.timestamp));
  if (item.ip_address) {
    addLine('Dirección IP', item.ip_address);
  }

  yPosition += 10;

  // Detalles de cambios
  if (item.accion === 'EDITAR' && cambiosParseados.value.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CAMBIOS REALIZADOS', 20, yPosition);
    yPosition += 10;

    // Preparar datos para tabla de cambios
    const tableData = cambiosParseados.value.map(cambio => [
      formatFieldName(cambio.campo),
      cambio.anterior || '(Vacío)',
      cambio.nuevo || '(Vacío)'
    ]);

    autoTable(doc, {
      head: [['Campo', 'Valor Anterior', 'Valor Nuevo']],
      body: tableData,
      startY: yPosition,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { 
        fillColor: [66, 114, 196],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 65, textColor: [220, 53, 69] },
        2: { cellWidth: 65, textColor: [25, 135, 84], fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPCIÓN', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const descripcion = item.detalles || 'Sin detalles adicionales';
    const splitText = doc.splitTextToSize(descripcion, 170);
    doc.text(splitText, 20, yPosition);
    yPosition += (splitText.length * 5) + 10;
  }

  // Pie de página
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Generado el: ${new Date().toLocaleString('es-MX')}`, 20, yPosition + 10);
  doc.text('Sistema de Registro Prehospitalario - Módulo de Auditoría', 105, yPosition + 10, { align: 'center' });

  doc.save(`detalle_${item.tipo_entidad}_${item.id_entidad}.pdf`);
};

// Helpers de Formato
const formatDate = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('es-MX', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};

const formatTime = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('es-MX', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatDateTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getInitials = (name) => {
  if (!name) return 'S';
  return name.substring(0, 2).toUpperCase();
};

const getUserAvatarClass = (name) => {
  if (!name) return 'bg-secondary';
  const colors = ['bg-primary', 'bg-success', 'bg-warning', 'bg-info', 'bg-danger'];
  const index = name.length % colors.length;
  return colors[index];
};

const getPreviewDetalles = (detalles) => {
  if (!detalles) return 'Sin detalles';
  if (detalles.length > 50) {
    return detalles.substring(0, 50) + '...';
  }
  return detalles;
};

const getAccionClass = (accion) => {
  switch(accion) {
    case 'CREAR': return 'badge-success';
    case 'EDITAR': return 'badge-warning';
    case 'ELIMINAR': return 'badge-danger';
    default: return 'badge-secondary';
  }
};

const getHeaderClass = (accion) => {
  switch(accion) {
    case 'CREAR': return 'bg-success';
    case 'EDITAR': return 'bg-warning text-dark-forced';
    case 'ELIMINAR': return 'bg-danger';
    default: return 'bg-secondary';
  }
};

const getAccionIcon = (accion) => {
  switch(accion) {
    case 'CREAR': return 'fa-plus-circle';
    case 'EDITAR': return 'fa-edit';
    case 'ELIMINAR': return 'fa-trash-alt';
    default: return 'fa-info-circle';
  }
};

const getAccionText = (accion) => {
  const texts = {
    'CREAR': 'Creación',
    'EDITAR': 'Edición', 
    'ELIMINAR': 'Eliminación'
  };
  return texts[accion] || accion;
};

const formatFieldName = (fieldName) => {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const calcularDuracion = (timestamp) => {
  if (!timestamp) return '';
  const ahora = new Date();
  const fecha = new Date(timestamp);
  const diffMs = ahora - fecha;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays > 0) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  if (diffHours > 0) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffMins > 0) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  return 'Hace unos momentos';
};

// Watchers
watch(() => page.value, () => {
  cargarHistorial();
});

// Lifecycle
onMounted(() => {
  if (modalRef.value) {
    modalInstance = new Modal(modalRef.value);
  }
  cargarUsuarios();
  cargarHistorial();
});
</script>

<style scoped>
/* Tus estilos CSS existentes se mantienen igual */
.historial-container { 
  max-width: 1400px; 
  margin: 0 auto; 
  padding: 1rem; 
}

.page-header-compact { 
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
  color: white; 
  border-radius: 12px; 
  margin-bottom: 1.5rem; 
  overflow: hidden; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.header-content-compact { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 1.5rem 2rem; 
}

.title-section-compact { 
  display: flex; 
  align-items: center; 
  gap: 1rem; 
}

.header-icon { 
  font-size: 2rem; 
  opacity: 0.9; 
}

.page-title { 
  font-size: 1.75rem; 
  font-weight: 700; 
  margin: 0; 
  letter-spacing: -0.5px;
}

.page-subtitle { 
  opacity: 0.9; 
  margin: 0.25rem 0 0 0; 
  font-size: 0.95rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-item {
  background: rgba(255, 255, 255, 0.15);
  padding: 0.75rem 1rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  min-width: 90px;
}

.stat-value { 
  font-size: 1.25rem; 
  font-weight: 800; 
  display: block;
  line-height: 1.2;
}

.stat-label { 
  font-size: 0.75rem; 
  opacity: 0.9; 
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
}

.filters-panel-compact { 
  background: white; 
  border-radius: 12px; 
  box-shadow: 0 2px 12px rgba(0,0,0,0.08); 
  padding: 1.5rem; 
  border: 1px solid #f0f0f0;
}

.filters-grid { 
  display: grid; 
  grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr 1fr; 
  gap: 1rem; 
  align-items: end; 
}

.filter-group label { 
  font-size: 0.75rem; 
  font-weight: 700; 
  color: #6c757d; 
  text-transform: uppercase; 
  margin-bottom: 0.5rem;
  letter-spacing: 0.5px;
}

.input-group-text {
  background-color: #f8f9fa;
  border-color: #e9ecef;
}

.custom-table thead th { 
  background-color: #f8f9fa; 
  color: #6c757d; 
  font-size: 0.75rem; 
  font-weight: 700; 
  border-bottom: 2px solid #e9ecef; 
  padding: 1rem 1.25rem; 
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.custom-table tbody td { 
  padding: 1.25rem; 
  font-size: 0.9rem; 
  border-bottom: 1px solid #f8f9fa; 
  vertical-align: middle;
}

.hover-row:hover { 
  background-color: #fcfaff; 
  cursor: pointer; 
  transform: translateY(-1px);
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.badge-action { 
  padding: 0.5em 0.75em; 
  font-size: 0.7em; 
  font-weight: 700; 
  border-radius: 6px; 
  text-transform: uppercase; 
  letter-spacing: 0.5px; 
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.badge-success { 
  background-color: #d1e7dd; 
  color: #0f5132; 
  border: 1px solid #badbcc;
}

.badge-warning { 
  background-color: #fff3cd; 
  color: #664d03; 
  border: 1px solid #ffeaa7;
}

.badge-danger { 
  background-color: #f8d7da; 
  color: #842029; 
  border: 1px solid #f1aeb5;
}

.badge-secondary { 
  background-color: #e2e3e5; 
  color: #41464b; 
  border: 1px solid #d3d6d8;
}

.avatar-circle { 
  width: 36px; 
  height: 36px; 
  background-color: #e9ecef; 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-weight: 700; 
  color: white; 
  font-size: 0.8rem; 
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.avatar-lg { 
  width: 60px; 
  height: 60px; 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-weight: 700; 
  color: white; 
  font-size: 1.4rem; 
  border: 3px solid white;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.modal-xl {
  max-width: 950px;
}

.icon-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.text-dark-forced { 
  color: #343a40 !important; 
}

.changes-section {
  max-height: 500px;
  overflow-y: auto;
}

.changes-container {
  padding-right: 0.5rem;
}

.change-item {
  background: #f8f9fa;
  border-left: 4px solid #6c757d !important;
  transition: all 0.3s ease;
}

.change-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.field-name {
  font-size: 0.85rem;
}

.old-value, .new-value {
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.old-value {
  background: rgba(220, 53, 69, 0.05);
  border-color: rgba(220, 53, 69, 0.2);
}

.new-value {
  background: rgba(25, 135, 84, 0.05);
  border-color: rgba(25, 135, 84, 0.2);
}

.changes-container::-webkit-scrollbar {
  width: 8px;
}

.changes-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.changes-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.changes-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

@media (max-width: 1200px) {
  .filters-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .header-content-compact {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }
  
  .title-section-compact {
    flex-direction: column;
    text-align: center;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .modal-xl {
    margin: 1rem;
  }
}

@media (max-width: 576px) {
  .historial-container {
    padding: 0.5rem;
  }
  
  .header-content-compact {
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* Estilos para botones de exportación */
.btn-group .btn {
  border-radius: 0;
}

.btn-group .btn:first-child {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

.btn-group .btn:last-child {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}

.btn-outline-success:hover {
  background-color: #198754;
  border-color: #198754;
  transform: translateY(-1px);
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  border-color: #dc3545;
  transform: translateY(-1px);
}
</style>