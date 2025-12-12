<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ pageTitle }}</h1>
      <div class="page-actions">
        <button @click="showForm ? toggleFormVisibility() : abrirModalNuevo()" class="btn btn-primary">
          <i :class="showForm ? 'fas fa-list' : 'fas fa-plus'"></i>
          <b class="ms-2">{{ showForm ? 'Ver Registros del Día' : 'Nuevo Registro' }}</b>
        </button>
      </div>
    </div>

    <div class="main-content">
      
      <div v-if="showForm">
        <FormActivacion
          :catalogs="catalogos"
          :initialData="datosParaEditar"
          :loading="cargandoFormulario"
          :saving="isSaving"
          :titulo="modoEdicion ? 'Editar Registro' : 'Nuevo Registro de Atención Prehospitalaria'"
          :subtitulo="modoEdicion ? `Folio: ${datosParaEditar?.num_reporte_local}` : 'La hora de captura se guarda automáticamente.'"
          :mensaje="mensaje"
          :tipoMensaje="tipoMensaje"
          @save="guardarRegistro"
          @cancel="toggleFormVisibility"
          @save-error="mostrarError"
        />
      </div>
      <div v-else class="registros-container">
        <div class="registros-header">
          <div class="header-content">
            <div class="title-section">
              <i class="fas fa-clipboard-list header-icon"></i>
              <div>
                <h2>Registros del Día</h2>
                <p class="subtitle">{{ currentDateFormatted }}</p>
              </div>
            </div>
            <div class="header-stats">
              <div class="stat-card">
                <div class="stat-value">{{ activaciones.length }}</div>
                <div class="stat-label">Total Registros</div>
              </div>
            </div>
          </div>
        </div>

        <div class="registros-content">
          <div v-if="cargando" class="loading-state">
            <div class="spinner-container">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p class="mt-3">Cargando registros del día...</p>
            </div>
          </div>

          <div v-else-if="error" class="error-state">
            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
            <h4>Error al cargar registros</h4>
            <p class="text-muted">{{ error }}</p>
            <button class="btn btn-primary mt-2" @click="cargarActivaciones">
              <i class="fas fa-redo me-2"></i>Reintentar
            </button>
          </div>

          <div v-else-if="activaciones.length > 0" class="table-section">
            <div class="table-container">
              <div class="table-responsive">
                <table class="registros-table">
                  <thead>
                    <tr>
                      <th class="folio-col">Folio</th>
                      <th class="fecha-col">Fecha y Hora</th>
                      <th class="paciente-col">Paciente</th>
                      <th class="tipo-col">Tipo</th>
                      <th class="causa-col">Causa</th>
                      <th class="acciones-col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="activacion in activaciones" :key="activacion.id" class="registro-row">
                      <td class="folio-cell">
                        <div class="folio-badge">{{ activacion.num_reporte_local }}</div>
                      </td>
                      <td class="fecha-cell">
                        <div class="fecha-text">
                          {{ new Date(activacion.fecha_activacion).toLocaleDateString() }}
                        </div>
                        <div class="hora-text">{{ activacion.hora_activacion }}</div>
                      </td>
                      <td class="paciente-cell">
                        <div class="paciente-nombre">{{ activacion.paciente_nombre }}</div>
                        <div v-if="activacion.paciente_edad" class="paciente-info">
                          {{ activacion.paciente_edad }} años • {{ activacion.paciente_sexo || 'N/D' }}
                        </div>
                      </td>
                      <td class="tipo-cell">
                        <span class="badge tipo-badge">{{ activacion.tipo_activacion || 'N/A' }}</span>
                      </td>
                      <td class="causa-cell">
                        <span class="causa-text">{{ activacion.causa_clinica || 'N/A' }}</span>
                      </td>
                      <td class="acciones-cell">
                        <div class="action-buttons">
                          <button 
                            class="btn btn-sm btn-outline-primary action-btn"
                            @click="verDetalle(activacion)"
                          >
                            <i class="fas fa-eye me-1"></i>Ver
                          </button>
                          
                          <button 
                            v-if="isAdmin" 
                            class="btn btn-sm btn-outline-secondary action-btn"
                            @click="abrirModalEditar(activacion)" 
                          >
                            <i class="fas fa-edit me-1"></i>Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="table-footer">
                <div class="results-count">
                  Mostrando {{ activaciones.length }} registro{{ activaciones.length !== 1 ? 's' : '' }} del día
                </div>
                <div class="table-actions">
                  <button class="btn btn-outline-secondary btn-sm">
                    <i class="fas fa-download me-1"></i>Exportar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-file-medical fa-3x"></i>
            </div>
            <h4>No hay registros para el día de hoy</h4>
            <p class="text-muted">Haz clic en "Nuevo Registro" para crear el primero del día.</p>
            <button class="btn btn-primary mt-3" @click="abrirModalNuevo">
              <i class="fas fa-plus me-2"></i> Nuevo Registro
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="modalDetalleActivacion" ref="modalDetalleRef" tabindex="-1" aria-labelledby="modalDetalleLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalDetalleLabel">
              <i class="fas fa-file-invoice me-2"></i>
              Detalle del Registro
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body modal-body-detallado">
            
            <div v-if="cargandoDetalle" class="loading-state-modal">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p class="mt-3">Cargando detalles del registro...</p>
            </div>

            <div v-else-if="activacionSeleccionada">
              <div class="detalle-header">
                <h3>Folio: <span class="text-primary">{{ activacionSeleccionada.num_reporte_local }}</span></h3>
              <p class="text-muted">
                Capturado el: {{ formatDateForDisplay(activacionSeleccionada.fecha_captura) }} a las {{ activacionSeleccionada.hora_captura ? activacionSeleccionada.hora_captura.substring(0, 5) : 'N/A' }}
              </p>
              </div>

              <div class="detalle-seccion card">
                <div class="card-header">
                  <i class="fas fa-user-injured me-2"></i> Datos del Paciente
                </div>
                <ul class="list-group list-group-flush">
                  <li class="list-group-item"><strong>Nombre:</strong> {{ activacionSeleccionada.paciente_nombre }}</li>
                  <li class="list-group-item"><strong>Edad:</strong> {{ activacionSeleccionada.paciente_edad || 'N/A' }} años</li>
                  <li class="list-group-item"><strong>Sexo:</strong> {{ activacionSeleccionada.paciente_sexo || 'N/A' }}</li>
                </ul>
              </div>

              <div class="detalle-seccion card">
                <div class="card-header">
                  <i class="fas fa-file-invoice me-2"></i> Datos de Activación
                </div>
                <ul class="list-group list-group-flush">
                  <li class="list-group-item"><strong>Fecha/Hora Evento:</strong> {{ formatDateForDisplay(activacionSeleccionada.fecha_activacion) }} a las {{ activacionSeleccionada.hora_activacion }}</li>
                  <li class="list-group-item"><strong>Tipo Activación:</strong> {{ activacionSeleccionada.tipo_activacion_nombre || 'N/A' }}</li>
                  <li v-if="activacionSeleccionada.tipo_activacion_otro" class="list-group-item"><strong>Otro Tipo:</strong> {{ activacionSeleccionada.tipo_activacion_otro }}</li>
                  <li class="list-group-item"><strong>Unidad Asignada:</strong> {{ activacionSeleccionada.unidad_asignada_nombre || 'N/A' }}</li>
                  <li class="list-group-item"><strong>Origen Reporte:</strong> {{ activacionSeleccionada.origen_reporte }}</li>
                  <li v-if="activacionSeleccionada.num_reporte_externo" class="list-group-item"><strong>Folio Externo:</strong> {{ activacionSeleccionada.num_reporte_externo }}</li>
                </ul>
              </div>

              <div class="detalle-seccion card">
                <div class="card-header">
                  <i class="fas fa-stethoscope me-2"></i> Causa del Servicio
                </div>
                <ul class="list-group list-group-flush">
                  <li class="list-group-item"><strong>Causa Clínica:</strong> {{ activacionSeleccionada.causa_clinica_nombre || 'N/A' }}</li>
                  <li class="list-group-item"><strong>Agente Causal:</strong> {{ activacionSeleccionada.agente_causante_general_nombre || 'N/A' }}</li>
                  <li v-if="activacionSeleccionada.causa_clinica_especifica" class="list-group-item"><strong>Desc. Clínica:</strong> {{ activacionSeleccionada.causa_clinica_especifica }}</li>
                  <li v-if="activacionSeleccionada.causas_traumaticas_nombres && activacionSeleccionada.causas_traumaticas_nombres.length > 0" class="list-group-item">
                    <strong>Causas Traumáticas:</strong>
                    <ul class="mt-2">
                      <li v-for="causa in activacionSeleccionada.causas_traumaticas_nombres" :key="causa">{{ causa }}</li>
                    </ul>
                  </li>
                  <li v-if="activacionSeleccionada.ct_especifico" class="list-group-item"><strong>Desc. Traumática:</strong> {{ activacionSeleccionada.ct_especifico }}</li>
                </ul>
              </div>

              <div class="detalle-seccion card">
                <div class="card-header">
                  <i class="fas fa-heart-pulse me-2"></i> Evaluación Clínica
                </div>
                <div v-if="activacionSeleccionada.evaluacion">
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item"><strong>Estado Pupilas:</strong> {{ activacionSeleccionada.evaluacion.estado_pupilas_nombre || 'N/A' }}</li>
                    <li v-if="activacionSeleccionada.evaluacion.anisocoria_lado" class="list-group-item"><strong>Lado Anisocoria:</strong> {{ activacionSeleccionada.evaluacion.anisocoria_lado }}</li>
                    <li class="list-group-item"><strong>Estado Piel:</strong> {{ activacionSeleccionada.evaluacion.estado_piel_nombre || 'N/A' }}</li>
                  </ul>
                </div>
                <div v-else class="list-group-item text-muted">
                  No se registró evaluación clínica.
                </div>
              </div>

              <div class="detalle-seccion card">
                <div class="card-header">
                  <i class="fas fa-band-aid me-2"></i> Lesiones Registradas
                </div>
                <div v-if="activacionSeleccionada.lesiones && activacionSeleccionada.lesiones.length > 0">
                  <ul class="list-group list-group-flush">
                    <li v-for="(lesion, index) in activacionSeleccionada.lesiones" :key="index" class="list-group-item">
                      <strong>{{ lesion.tipo_lesion_nombre || 'Lesión' }}</strong> en <strong>{{ lesion.ubicacion_lesion_nombre || 'N/D' }}</strong>
                      <p v-if="lesion.descripcion_lesion" class="text-muted mb-0">{{ lesion.descripcion_lesion }}</p>
                    </li>
                  </ul>
                </div>
                <div v-else class="list-group-item text-muted">
                  No se registraron lesiones.
                </div>
              </div>

              <div class="detalle-seccion card">
                <div class="card-header">
                  <i class="fas fa-ambulance me-2"></i> Traslado
                </div>
                <ul class="list-group list-group-flush">
                  <li class="list-group-item">
                    <strong>¿Se trasladó?:</strong> 
                    <span :class="activacionSeleccionada.requirio_traslado ? 'text-success' : 'text-danger'">
                      {{ activacionSeleccionada.requirio_traslado ? 'Sí' : 'No' }}
                    </span>
                  </li>
                  <li v-if="activacionSeleccionada.requirio_traslado" class="list-group-item"><strong>Hospital Destino:</strong> {{ activacionSeleccionada.hospital_destino }}</li>
                  <li v-else class="list-group-item"><strong>Estado del Servicio:</strong> {{ activacionSeleccionada.estado_traslado_nombre || 'N/A' }}</li>
                </ul>
              </div>

            </div>
            
            <div v-else-if="errorDetalle" class="error-state-modal">
              <i class="fas fa-exclamation-triangle fa-2x mb-3 text-danger"></i>
              <h4>Error al cargar el detalle</h4>
              <p class="text-muted">{{ errorDetalle }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
              <i class="fas fa-times me-2"></i>Cerrar
            </button>
            <button type="button" class="btn btn-primary" @click="generarFichaPDF(activacionSeleccionada)">
              <i class="fas fa-print me-2"></i>Imprimir Ficha
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
// --- 👇 SCRIPT SETUP COMPLETAMENTE REFACTORIZADO 👇 ---
import { ref, onMounted, computed } from 'vue'; // <--- Eliminamos 'watch'
import { useStore } from 'vuex';
import api from '@/services/api';
import { Modal } from 'bootstrap'; 
import { generarFichaPDF } from '@/utils/pdfGenerator';
// --- CAMBIO ---
// Importamos el nuevo componente que hicimos en el Paso 1
import FormActivacion from '@/components/FormActivacion.vue'; 

// --- Función Helper (solo la de formato, las otras se fueron al form) ---
const formatDateForDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return adjustedDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default {
  name: 'RegistroPrehospitalario',
  // --- CAMBIO ---
  // Añadimos el componente al registro
  components: {
    FormActivacion
  },
  setup() {
    // --- Estado de la Vista ---
    const store = useStore();
    const isAdmin = computed(() => store.getters.isAdmin);
    
    const catalogos = ref({});
    const mensaje = ref('');
    const tipoMensaje = ref('');
    const showForm = ref(false); // true = muestra el formulario, false = muestra la tabla
    const activaciones = ref([]);
    const cargando = ref(true); // Cargando de la tabla
    const error = ref(null);

    // --- Estado para el Modal de "Ver Detalle" ---
    const modalDetalleRef = ref(null); 
    let modalDetalle = null; 
    const activacionSeleccionada = ref(null); 
    const cargandoDetalle = ref(false); 
    const errorDetalle = ref(null); 

    // --- Estado para el Formulario de "Editar/Crear" ---
    const modoEdicion = ref(false); 
    const idRegistroEditando = ref(null); 
    const cargandoFormulario = ref(false); // Spinner para el formulario
    const isSaving = ref(false); // Para deshabilitar el botón "Guardar"
    const datosParaEditar = ref(null); // Aquí guardamos los datos para pasar al form

    // --- Computadas ---
    const pageTitle = computed(() => {
      if (showForm.value) {
        return modoEdicion.value ? 'Editar Registro' : 'Nuevo Registro Prehospitalario';
      }
      return 'Registros del Día';
    });
    
    const currentDateFormatted = computed(() => {
      return new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    });

    // --- Métodos de la Vista ---
    const toggleFormVisibility = () => {
      showForm.value = false;
      mensaje.value = ''; // Limpiamos mensajes al cerrar
      datosParaEditar.value = null; // Limpiamos los datos de edición
    };

    const abrirModalNuevo = () => {
      datosParaEditar.value = null; // Le pasamos 'null' al form para que sepa que es "Nuevo"
      modoEdicion.value = false;
      idRegistroEditando.value = null;
      showForm.value = true;
    };

    const abrirModalEditar = async (activacion) => {
      modoEdicion.value = true;
      idRegistroEditando.value = activacion.id;
      datosParaEditar.value = null; // Resetea por si acaso
      showForm.value = true;
      cargandoFormulario.value = true; // Mostramos spinner
      mensaje.value = '';

      try {
        // Usamos el endpoint GET/:id para traer TODOS los datos
        const response = await api.get(`/activaciones/${activacion.id}`);
        datosParaEditar.value = response.data; // Pasamos los datos al formulario hijo
        
      } catch (err) {
        console.error("Error al cargar datos para editar:", err);
        mensaje.value = 'Error al cargar los datos del registro.';
        tipoMensaje.value = 'alert-danger';
        showForm.value = false; // Cerramos si falla
      } finally {
        cargandoFormulario.value = false; // Ocultamos spinner
      }
    };
    
    const cargarActivaciones = async () => {
      cargando.value = true;
      error.value = null;
      try {
        const response = await api.get('/activaciones', {
          params: { scope: 'today' }
        });
        activaciones.value = response.data;
      } catch (err) {
        console.error("Error al cargar activaciones:", err);
        error.value = 'No se pudieron cargar los registros.';
      } finally {
        cargando.value = false;
      }
    };

    const cargarCatalogos = async () => {
        try {
            const res = await api.get('/catalogos');
            catalogos.value = res.data;
        } catch (err) {
            console.error("Error al cargar catálogos:", err);
            mensaje.value = 'Error fatal: No se pudieron cargar las opciones del formulario.';
            tipoMensaje.value = 'alert-danger';
        }
    };

    // --- Métodos que manejan eventos del FormActivacion ---
    
    // Se dispara con el @save-error del formulario
    const mostrarError = (msg) => {
      mensaje.value = msg;
      tipoMensaje.value = 'alert-danger';
    };

    // Se dispara con el @save del formulario
    const guardarRegistro = async (payload) => {
      isSaving.value = true; // Deshabilitamos el botón de guardar
      mensaje.value = '';
      tipoMensaje.value = '';

      try {
        if (modoEdicion.value) {
          // --- MODO EDICIÓN (PUT) ---
          const resp = await api.put(`/api/activaciones/${idRegistroEditando.value}`, payload);
          mensaje.value = `¡Éxito! Registro ${resp.data.data.num_reporte_local} actualizado.`;
          tipoMensaje.value = 'alert-success';
        } else {
          // --- MODO CREACIÓN (POST) ---
          const resp = await api.post('/activaciones', payload);
          mensaje.value = `¡Éxito! Registro guardado con folio: ${resp.data.data.num_reporte_local}`;
          tipoMensaje.value = 'alert-success';
        }

        // Después de guardar, cerramos el form y recargamos la tabla
        setTimeout(() => {
          toggleFormVisibility(); // Cierra el formulario
          cargarActivaciones(); // Recargamos la tabla de "Registros del Día"
        }, 2500);

      } catch (error) {
         console.error("Error al guardar:", error.response || error);
        mensaje.value = `Error al guardar: ${error.response?.data?.error || 'Verifique los datos e intente de nuevo.'}`;
        tipoMensaje.value = 'alert-danger';
      } finally {
        isSaving.value = false; // Volvemos a habilitar el botón
      }
    };

    // --- Métodos del Modal de Detalle (Sin cambios) ---
    const verDetalle = async (activacion) => {
      if (!modalDetalle) return;
      cargandoDetalle.value = true;
      errorDetalle.value = null;
      activacionSeleccionada.value = null; 
      modalDetalle.show();
      try {
        const response = await api.get(`/activaciones/${activacion.id}`);
        activacionSeleccionada.value = response.data;
      } catch (err) {
        console.error("Error al cargar detalle:", err);
        errorDetalle.value = 'No se pudo cargar la información del registro.';
      } finally {
        cargandoDetalle.value = false;
      }
    };

    // --- Ciclo de vida ---
    onMounted(() => {
      cargarCatalogos();
      cargarActivaciones();
      
      if (modalDetalleRef.value) {
        modalDetalle = new Modal(modalDetalleRef.value);
      }
    });

    // --- Return (Ahora mucho más limpio) ---
    return {
      // Estado de la Vista
      isAdmin,
      showForm,
      catalogoBorrador: catalogos, // Renombrado para evitar conflicto de nombres
      catalogos,
      mensaje,
      tipoMensaje,
      activaciones,
      cargando,
      error,
      currentDateFormatted, 
      
      // Estado del Formulario (manejado por esta vista)
      modoEdicion,
      cargandoFormulario,
      isSaving,
      datosParaEditar,

      // Métodos de la Vista
      abrirModalNuevo,
      abrirModalEditar,
      toggleFormVisibility, 
      guardarRegistro,
      mostrarError,
      
      // Lógica del Modal "Ver Detalle"
      modalDetalleRef,
      cargandoDetalle,
      errorDetalle,
      activacionSeleccionada,
      verDetalle,
      generarFichaPDF,
      formatDateForDisplay,
      
      // Computadas de la Vista
      pageTitle
    };
  }
}
</script>

<style scoped>
/* (Todos los estilos se mantienen exactamente igual) */

/* ESTILOS GENERALES */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  padding: 1.5rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #0056b3;
  margin: 0;
}

.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 2rem;
}

/* --- ESTILOS PARA EL FORMULARIO (AHORA EN EL HIJO) --- */
/* (Estos estilos son aplicados al componente hijo <FormActivacion />) */
.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  font-weight: 700;
  color: #343a40;
}

/* ESTILOS PARA LA VISTA DE REGISTROS */
.registros-container {
  max-width: 1400px;
  margin: 0 auto;
}

.registros-header {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  font-size: 2.5rem;
  opacity: 0.9;
}

.registros-header h2 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
}

.subtitle {
  opacity: 0.9;
  margin: 0.25rem 0 0 0;
  font-size: 1rem;
}

.header-stats {
  display: flex;
  gap: 1rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.2);
  padding: 1rem 1.5rem;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.registros-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.loading-state, .error-state, .empty-state {
  padding: 3rem;
  text-align: center;
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.error-state i {
  color: #dc3545;
}

.empty-icon {
  color: #6c757d;
  margin-bottom: 1rem;
}

.table-section {
  padding: 0;
}

.table-container {
  padding: 0;
}

.table-responsive {
  overflow-x: auto;
}

.registros-table {
  width: 100%;
  border-collapse: collapse;
}

.registros-table thead {
  background: #f8f9fa;
}

.registros-table th {
  padding: 1rem;
  font-weight: 600;
  color: #495057;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.registros-table td {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
}

.registro-row:hover {
  background: #f8f9fa;
  transition: background-color 0.2s ease;
}

.folio-cell {
  width: 120px;
}

.folio-badge {
  background: #28a745;
  color: white;
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.8rem;
  text-align: center;
  display: inline-block;
}

.fecha-cell {
  width: 140px;
}

.fecha-text {
  font-weight: 500;
  font-size: 0.9rem;
}

.hora-text {
  font-size: 0.8rem;
  color: #6c757d;
}

.paciente-cell {
  width: 220px;
}

.paciente-nombre {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.paciente-info {
  font-size: 0.8rem;
  color: #6c757d;
}

.tipo-cell {
  width: 150px;
}

.tipo-badge {
  background: #6c757d;
  color: white;
  padding: 0.35rem 0.65rem;
  border-radius: 20px;
  font-size: 0.75rem;
}

.causa-cell {
  min-width: 200px;
}

.causa-text {
  font-size: 0.9rem;
  line-height: 1.4;
}

.acciones-cell {
  width: 160px;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  white-space: nowrap;
}

.table-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.results-count {
  color: #6c757d;
  font-size: 0.875rem;
  font-weight: 500;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
}

/* --- ESTILOS PARA EL MODAL DE DETALLE (Sin cambios) --- */
.modal-header {
  background: var(--bg-light, #f8f9fa);
  border-bottom: 1px solid var(--border-color, #dee2e6);
}
.modal-title {
  color: var(--primary-dark, #0056b3);
  font-weight: 600;
}
.modal-body-detallado {
  background-color: #f8f9fa;
  padding: 1.5rem;
}
.loading-state-modal, .error-state-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--text-gray, #6c757d);
}
.detalle-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--primary, #007bff);
}
.detalle-header h3 {
  font-weight: 700;
  margin-bottom: 0.25rem;
}
.detalle-seccion {
  margin-bottom: 1.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 8px;
  overflow: hidden;
}
.detalle-seccion .card-header {
  font-weight: 600;
  font-size: 1.1rem;
  background-color: #f0f3f5;
  color: var(--text-dark, #343a40);
  border-bottom: 1px solid var(--border-color, #dee2e6);
  padding: 0.75rem 1.25rem;
}
.detalle-seccion .list-group-item {
  padding: 0.75rem 1.25rem;
  background-color: #ffffff;
}
.detalle-seccion .list-group-item strong {
  color: var(--text-dark, #343a40);
  margin-right: 0.5rem;
}
.detalle-seccion .list-group-item p {
  font-size: 0.9rem;
  margin-top: 0.25rem;
}
.modal-footer {
  background: var(--bg-light, #f8f9fa);
  border-top: 1px solid var(--border-color, #dee2e6);
}


/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: stretch; 
  }
  .action-btn {
    width: 100%; 
  }
  
  .table-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .table-actions {
    justify-content: center;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>