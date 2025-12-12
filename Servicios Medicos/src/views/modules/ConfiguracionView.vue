<template>
  <div class="config-container">
    <!-- Header Principal -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <i class="fas fa-cogs header-icon"></i>
          <div>
            <h1 class="page-title">Configuración</h1>
            <p class="page-subtitle">Administración de catálogos del sistema</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tarjetas de Estadísticas -->
    <div class="stats-cards mb-4">
      <div class="row g-3">
        <div class="col-md-3" v-for="stat in stats" :key="stat.label">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="flex-shrink-0">
                  <div class="stat-icon rounded-circle d-flex align-items-center justify-content-center" 
                       :class="stat.bgColor">
                    <i :class="stat.icon" class="text-white"></i>
                  </div>
                </div>
                <div class="flex-grow-1 ms-3">
                  <h4 class="mb-0 fw-bold">{{ stat.value }}</h4>
                  <p class="text-muted mb-0 small">{{ stat.label }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenido Principal -->
    <div class="main-content card border-0 shadow-sm overflow-hidden">
      <!-- Tabs -->
      <div class="card-header bg-white border-bottom pt-4 px-4 pb-0">
        <ul class="nav nav-tabs card-header-tabs border-bottom-0 gap-2">
          <li class="nav-item" v-for="tab in tabs" :key="tab.id">
            <a 
              class="nav-link" 
              :class="{ active: currentTab === tab.id }"
              href="#" 
              @click.prevent="cambiarTab(tab.id)"
            >
              <i :class="tab.icon" class="me-2"></i>{{ tab.label }}
            </a>
          </li>
        </ul>
      </div>

      <div class="card-body p-0">
        <!-- Toolbar con Búsqueda y Filtros -->
        <div class="toolbar p-4 d-flex justify-content-between align-items-center bg-light-subtle">
          <div class="d-flex align-items-center gap-3">
            <div>
              <h5 class="text-dark m-0 fw-bold">{{ currentTabLabel }}</h5>
              <small class="text-muted">{{ filteredItems.length }} de {{ items.length }} registros</small>
            </div>
            
            <!-- Barra de búsqueda -->
            <div class="search-box position-relative">
              <i class="fas fa-search position-absolute top-50 start-3 translate-middle-y text-muted"></i>
              <input 
                type="text" 
                class="form-control form-control-sm ps-5" 
                placeholder="Buscar..." 
                v-model="searchTerm"
                style="width: 250px;"
              >
            </div>
          </div>
          
          <div class="d-flex gap-2">
            <!-- Filtro de estado -->
            <select class="form-select form-select-sm" v-model="statusFilter" style="width: 140px;">
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            
            <button class="btn btn-primary btn-pill shadow-sm" @click="abrirModalCrear">
              <i class="fas fa-plus me-2"></i>Nuevo Registro
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary mb-2"></div>
          <p class="text-muted mb-0">Cargando datos...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredItems.length === 0" class="empty-state p-5 text-center">
          <div class="empty-icon bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center">
            <i class="fas fa-folder-open text-muted fa-2x"></i>
          </div>
          <h6 class="text-dark">No hay registros</h6>
          <p class="text-muted small" v-if="searchTerm || statusFilter !== 'all'">
            No se encontraron resultados para los filtros aplicados.
          </p>
          <p class="text-muted small" v-else>
            Este catálogo está vacío. Añade un nuevo elemento para comenzar.
          </p>
        </div>

        <!-- Vista de Tabla (Desktop) -->
        <div v-else-if="!isMobile" class="table-responsive">
          <table class="table custom-table align-middle mb-0">
            <thead>
              <tr>
                <th class="ps-4">NOMBRE DEL REGISTRO</th>
                <th class="text-end pe-4">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in paginatedItems" :key="item.id" class="hover-row" :class="{ 'bg-light text-muted': !item.activo }">
                <td class="ps-4">
                  <div class="d-flex align-items-center">
                    <div class="me-3" :class="item.activo ? 'text-success' : 'text-secondary'">
                      <i class="fas" :class="item.activo ? 'fa-check-circle' : 'fa-ban'"></i>
                    </div>
                    <div>
                      <span class="fw-500 d-block" :class="{ 'text-decoration-line-through': !item.activo }">
                        {{ item.nombre }}
                      </span>
                      <span v-if="!item.activo" class="badge bg-secondary" style="font-size: 0.6rem;">DESACTIVADO</span>
                    </div>
                  </div>
                </td>
                <td class="text-end pe-4">
                  <div class="btn-group">
                    <button 
                      class="btn btn-icon btn-light text-primary me-2" 
                      @click="abrirModalEditar(item)"
                      title="Editar Nombre"
                    >
                      <i class="fas fa-pen"></i>
                    </button>
                    
                    <button 
                      v-if="!item.activo"
                      class="btn btn-icon btn-light text-success" 
                      @click="reactivarItem(item)"
                      title="Reactivar (Volver a usar)"
                    >
                      <i class="fas fa-undo-alt"></i>
                    </button>

                    <button 
                      v-else
                      class="btn btn-icon btn-light text-danger" 
                      @click="eliminarItemInteligente(item)"
                      title="Eliminar / Desactivar"
                    >
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Vista de Tarjetas (Móvil) -->
        <div v-else class="card-list p-3">
          <div 
            v-for="item in paginatedItems" 
            :key="item.id" 
            class="card mb-3 border-0 shadow-sm"
          >
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div class="d-flex align-items-center">
                  <div class="me-3" :class="item.activo ? 'text-success' : 'text-secondary'">
                    <i class="fas fa-lg" :class="item.activo ? 'fa-check-circle' : 'fa-ban'"></i>
                  </div>
                  <div>
                    <h6 class="mb-1" :class="{ 'text-decoration-line-through text-muted': !item.activo }">
                      {{ item.nombre }}
                    </h6>
                    <span v-if="!item.activo" class="badge bg-secondary">DESACTIVADO</span>
                  </div>
                </div>
                
                <div class="btn-group">
                  <button class="btn btn-sm btn-outline-primary" @click="abrirModalEditar(item)">
                    <i class="fas fa-pen"></i>
                  </button>
                  <button 
                    v-if="!item.activo"
                    class="btn btn-sm btn-outline-success" 
                    @click="reactivarItem(item)"
                  >
                    <i class="fas fa-undo-alt"></i>
                  </button>
                  <button 
                    v-else
                    class="btn btn-sm btn-outline-danger" 
                    @click="eliminarItemInteligente(item)"
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Paginación -->
        <div v-if="filteredItems.length > 0" class="p-4 border-top bg-white">
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">
              Mostrando {{ startItem }}-{{ endItem }} de {{ filteredItems.length }} registros
            </small>
            
            <div class="pagination-container">
              <nav>
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="changePage(currentPage - 1)">
                      <i class="fas fa-chevron-left"></i>
                    </button>
                  </li>
                  
                  <li 
                    v-for="page in totalPages" 
                    :key="page"
                    class="page-item" 
                    :class="{ active: currentPage === page }"
                  >
                    <button class="page-link" @click="changePage(page)">{{ page }}</button>
                  </li>
                  
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="changePage(currentPage + 1)">
                      <i class="fas fa-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
            
            <select class="form-select form-select-sm" v-model="itemsPerPage" style="width: 80px;">
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Crear/Editar -->
    <div class="modal fade" id="configModal" tabindex="-1" ref="modalRef">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-light border-bottom-0">
            <h5 class="modal-title fw-bold">{{ isEditing ? 'Editar Registro' : 'Nuevo Registro' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form @submit.prevent="guardarItem">
            <div class="modal-body p-4">
              <div class="mb-3">
                <label class="form-label fw-bold text-secondary small text-uppercase">Nombre</label>
                <input type="text" class="form-control form-control-lg" v-model="form.nombre" required autofocus placeholder="Escribe el nombre aquí...">
              </div>
              <div v-if="errorMsg" class="alert alert-danger py-2 small rounded-3">
                <i class="fas fa-exclamation-circle me-2"></i>{{ errorMsg }}
              </div>
            </div>
            <div class="modal-footer border-top-0 bg-light px-4 pb-4">
              <button type="button" class="btn btn-light text-muted fw-500" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-primary px-4 fw-500" :disabled="saving">
                {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/services/api';
import { Modal } from 'bootstrap';

// Tabs disponibles
const tabs = [
  { id: 'hospitales', label: 'Hospitales', icon: 'fas fa-hospital' },
  { id: 'unidades', label: 'Unidades', icon: 'fas fa-ambulance' },
  { id: 'tipos-evento', label: 'Tipos de Evento', icon: 'fas fa-calendar-check' },
  { id: 'tipos-activacion', label: 'Tipos de Activación', icon: 'fas fa-bell' },
  { id: 'estados-traslado', label: 'Estados Traslado', icon: 'fas fa-exchange-alt' },
  { id: 'causas-clinicas', label: 'Causas Clínicas', icon: 'fas fa-stethoscope' },
  { id: 'causas-traumaticas', label: 'Causas Traumáticas', icon: 'fas fa-car-crash' },
  { id: 'agentes-causales', label: 'Agentes Causales', icon: 'fas fa-biohazard' },
  { id: 'tipos-lesion', label: 'Tipos de Lesión', icon: 'fas fa-band-aid' },
  { id: 'ubicaciones-lesion', label: 'Ubicaciones Lesión', icon: 'fas fa-map-marker-alt' },
];

// Variables reactivas principales
const currentTab = ref('hospitales');
const items = ref([]);
const loading = ref(false);
const saving = ref(false);
const errorMsg = ref('');

// Nuevas variables para funcionalidades avanzadas
const searchTerm = ref('');
const statusFilter = ref('all');
const currentPage = ref(1);
const itemsPerPage = ref(20);
const isMobile = ref(false);

// Modal State
const modalRef = ref(null);
let modalInstance = null;
const isEditing = ref(false);
const form = ref({ id: null, nombre: '' });

// Computed Properties
const currentTabLabel = computed(() => {
  const t = tabs.find(t => t.id === currentTab.value);
  return t ? t.label : '';
});

const filteredItems = computed(() => {
  let filtered = items.value;
  
  // Filtro por búsqueda
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    filtered = filtered.filter(item => 
      item.nombre.toLowerCase().includes(term)
    );
  }
  
  // Filtro por estado
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(item => 
      statusFilter.value === 'active' ? item.activo : !item.activo
    );
  }
  
  return filtered;
});

const totalPages = computed(() => 
  Math.ceil(filteredItems.value.length / itemsPerPage.value)
);

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredItems.value.slice(start, end);
});

const startItem = computed(() => 
  Math.min((currentPage.value - 1) * itemsPerPage.value + 1, filteredItems.value.length)
);

const endItem = computed(() => 
  Math.min(currentPage.value * itemsPerPage.value, filteredItems.value.length)
);

const stats = computed(() => [
  {
    label: 'Total Registros',
    value: items.value.length,
    icon: 'fas fa-database',
    bgColor: 'bg-primary'
  },
  {
    label: 'Activos',
    value: items.value.filter(item => item.activo).length,
    icon: 'fas fa-check-circle',
    bgColor: 'bg-success'
  },
  {
    label: 'Inactivos',
    value: items.value.filter(item => !item.activo).length,
    icon: 'fas fa-ban',
    bgColor: 'bg-secondary'
  }
]);

// Métodos
const cargarDatos = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/config/${currentTab.value}`);
    items.value = res.data;
    currentPage.value = 1; // Resetear a primera página al cambiar datos
  } catch (err) {
    console.error('Error al cargar datos:', err);
  } finally {
    loading.value = false;
  }
};

const cambiarTab = (tabId) => {
  currentTab.value = tabId;
  searchTerm.value = '';
  statusFilter.value = 'all';
  cargarDatos();
};

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// --- CRUD ---
const abrirModalCrear = () => {
  isEditing.value = false;
  form.value = { id: null, nombre: '' };
  errorMsg.value = '';
  modalInstance.show();
};

const abrirModalEditar = (item) => {
  isEditing.value = true;
  form.value = { ...item };
  errorMsg.value = '';
  modalInstance.show();
};

const guardarItem = async () => {
  saving.value = true;
  errorMsg.value = '';
  try {
    if (isEditing.value) {
      await api.put(`/config/${currentTab.value}/${form.value.id}`, { nombre: form.value.nombre });
    } else {
      await api.post(`/config/${currentTab.value}`, { nombre: form.value.nombre });
    }
    modalInstance.hide();
    cargarDatos();
  } catch (err) {
    errorMsg.value = err.response?.data?.error || 'Error al guardar';
  } finally {
    saving.value = false;
  }
};

const eliminarItemInteligente = async (item) => {
  if (!confirm(`¿Deseas eliminar "${item.nombre}"?\n\nSi está en uso, el sistema lo desactivará automáticamente en lugar de borrarlo.`)) return;
  
  try {
    const res = await api.delete(`/config/${currentTab.value}/${item.id}`);
    
    if (res.data.type === 'soft_deleted') {
      alert(`AVISO: ${res.data.message}`);
    } else {
      console.log(res.data.message);
    }
    
    cargarDatos();
  } catch (err) {
    const msg = err.response?.data?.error || 'Error al procesar la solicitud';
    alert(msg);
  }
};

const reactivarItem = async (item) => {
  try {
    await api.patch(`/config/${currentTab.value}/${item.id}/toggle`, { activo: true });
    cargarDatos();
  } catch (err) {
    alert('Error al reactivar el registro');
  }
};

// Watchers
watch([searchTerm, statusFilter], () => {
  currentPage.value = 1;
});

watch(itemsPerPage, () => {
  currentPage.value = 1;
});

watch(currentTab, () => {
  currentPage.value = 1;
});

// Lifecycle
onMounted(() => {
  if (modalRef.value) modalInstance = new Modal(modalRef.value);
  cargarDatos();
  checkMobile();
  window.addEventListener('resize', checkMobile);
});
</script>

<style scoped>
.config-container { 
  max-width: 1200px; 
  margin: 0 auto; 
  padding: 1rem; 
}

/* Header principal */
.page-header { 
  background: white; 
  border-radius: 12px; 
  margin-bottom: 2rem; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.05); 
}
.header-content { 
  padding: 2rem; 
  display: flex; 
  justify-content: space-between; 
}
.title-section { 
  display: flex; 
  align-items: center; 
  gap: 1rem; 
}
.header-icon { 
  font-size: 2.5rem; 
  color: #6f42c1; 
}
.page-title { 
  font-size: 2rem; 
  font-weight: 700; 
  color: #343a40; 
  margin: 0; 
}
.page-subtitle { 
  opacity: 0.8; 
  margin: 0; 
}

/* Tarjetas de estadísticas */
.stat-icon {
  width: 48px;
  height: 48px;
  font-size: 1.2rem;
}

/* Tabs Modernos */
.nav-tabs .nav-link {
  color: #6c757d;
  font-weight: 500;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 8px 8px 0 0;
  transition: all 0.2s;
}
.nav-tabs .nav-link:hover {
  color: #6f42c1;
  background: rgba(111, 66, 193, 0.05);
}
.nav-tabs .nav-link.active {
  color: #6f42c1;
  background: transparent;
  border-bottom: 3px solid #6f42c1;
  font-weight: 600;
}

/* Toolbar */
.bg-light-subtle { 
  background-color: #f8f9fa !important; 
}

/* Barra de búsqueda */
.search-box input {
  border-radius: 20px;
  border: 1px solid #e9ecef;
  transition: all 0.3s;
}

.search-box input:focus {
  border-color: #6f42c1;
  box-shadow: 0 0 0 0.2rem rgba(111, 66, 193, 0.25);
}

/* Botones */
.btn-pill { 
  border-radius: 50px; 
  padding-left: 1.5rem; 
  padding-right: 1.5rem; 
}
.btn-icon {
  width: 36px;
  height: 36px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
  border: 1px solid #e9ecef;
}
.btn-icon:hover { 
  transform: translateY(-2px); 
  box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
}
.btn-light { 
  background: white; 
}

/* TABLA PERSONALIZADA */
.custom-table { 
  border-collapse: separate; 
  border-spacing: 0; 
}
.custom-table thead th {
  border-top: none;
  border-bottom: 1px solid #edf2f7;
  color: #adb5bd;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 1rem;
  background-color: #ffffff;
}
.custom-table tbody td {
  padding: 1rem;
  border-bottom: 1px solid #f8f9fa;
  font-size: 0.95rem;
  color: #495057;
  vertical-align: middle;
}
.hover-row:hover { 
  background-color: #fcfaff; 
}
.hover-row:last-child td { 
  border-bottom: none; 
}

/* Vista de tarjetas para móvil */
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}

/* Paginación */
.pagination-container .page-link {
  border-radius: 8px;
  margin: 0 2px;
  border: none;
  color: #6c757d;
}

.pagination-container .page-item.active .page-link {
  background-color: #6f42c1;
  border-color: #6f42c1;
}

.pagination-container .page-link:hover {
  background-color: #f8f9fa;
}

.fw-500 { 
  font-weight: 500; 
}

/* Empty State */
.empty-icon { 
  width: 64px; 
  height: 64px; 
}

/* Responsive */
@media (max-width: 768px) {
  .header-content { 
    flex-direction: column; 
    align-items: flex-start; 
    gap: 1rem; 
  }
  
  .toolbar {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start !important;
  }
  
  .search-box input {
    width: 100% !important;
  }
  
  .stats-cards .col-md-3 {
    margin-bottom: 1rem;
  }
}

/* Animaciones suaves */
.hover-row {
  transition: all 0.3s ease;
}
</style>