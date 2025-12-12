<template>
  <div>
    <!-- Solo mostrar header si no estamos en modal -->
    <div v-if="showHeader" class="form-header">
      <h2>{{ titulo }}</h2>
      <p v-if="subtitulo" class="text-muted">{{ subtitulo }}</p>
    </div>

    <div v-if="mensaje" :class="['alert', tipoMensaje]">
      {{ mensaje }}
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner-container">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-3">Cargando datos del registro...</p>
      </div>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="form-container-stacked" ref="formElement">

      <div class="card shadow-sm mb-4 form-section">
        <div class="card-header section-header">
          <h3 class="mb-0"><i class="fas fa-file-invoice me-2"></i>Datos de Activación</h3>
        </div>
        <div class="card-body">
          <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Fecha de Activación (Hora del evento)</label>
          <input 
            type="date" 
            v-model="formulario.fecha_activacion" 
            class="form-control" 
            :readonly="isEditing"
            :class="{ 'bg-light': isEditing }"
            required
          >
          </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Hora de Activación (Hora del evento)</label>
              <input 
                type="time" 
                v-model="formulario.hora_activacion" 
            class="form-control" 
            :readonly="isEditing"
            :class="{ 'bg-light': isEditing }"
            required
          >
            </div>
          </div>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Tipo de Activación</label>
              <select v-model="formulario.id_tipo_activacion" class="form-select" required>
                <option :value="null" disabled>Seleccione una opción</option>
                <option v-for="tipo in catalogs.tipos_activacion" :key="tipo.id" :value="tipo.id">{{ tipo.nombre }}</option>
              </select>
            </div>
            
            <div v-if="mostrarOtroTipoActivacion" class="col-md-6 mb-3">
              <label class="form-label">Especifique "Otro" Tipo Activación</label>
              <input type="text" v-model="formulario.tipo_activacion_otro" class="form-control" placeholder="Describa el tipo de activación">
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Unidad Asignada</label>
              <select v-model="formulario.id_unidad_asignada" class="form-select">
                <option :value="null">Seleccione una unidad</option>
                <option v-for="unidad in catalogs.unidades" :key="unidad.id" :value="unidad.id">{{ unidad.nombre }}</option>
              </select>
            </div>
          </div>
          <div class="form-check form-switch mb-3">
            <input class="form-check-input" type="checkbox" v-model="tieneReporteExterno" id="checkReporteExternoForm">
            <label class="form-check-label" for="checkReporteExternoForm">¿Tiene reporte externo? (C5, 911, etc.)</label>
          </div>
          <div v-if="tieneReporteExterno" class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Origen Reporte Externo</label>
              <select v-model="formulario.origen_reporte" class="form-select">
                <option value="C5">C5</option>
                <option value="R">9-1-1</option>
              </select>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Número Reporte Externo</label>
              <input type="text" v-model="formulario.num_reporte_externo" class="form-control" placeholder="Folio C5 o 911">
            </div>
          </div>
          <hr v-if="!initialData" class="my-3">
          <div v-if="!initialData" class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label text-muted">Fecha de Captura (Automática)</label>
              <input type="date" :value="currentDate" class="form-control" disabled>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label text-muted">Hora de Captura (Automática)</label>
              <input type="time" :value="currentTime" class="form-control" disabled>
            </div>
          </div>
        </div>
      </div>

      <div class="card shadow-sm mb-4 form-section">
        <div class="card-header section-header">
          <h3 class="mb-0"><i class="fas fa-stethoscope me-2"></i>Causa del Servicio</h3>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Causa Clínica</label>
              <select v-model="formulario.id_causa_clinica" class="form-select">
                <option :value="null">Seleccione (si aplica)</option>
                <option v-for="causa in catalogs.causa_clinica" :key="causa.id" :value="causa.id">{{ causa.nombre }}</option>
              </select>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Agente Causal General</label>
              <select v-model="formulario.id_agente_causante_general" class="form-select">
                <option :value="null">Seleccione (si aplica)</option>
                <option v-for="agente in catalogs.agentes_causantes" :key="agente.id" :value="agente.id">{{ agente.nombre }}</option>
              </select>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Descripción Causa Clínica</label>
            <textarea v-model="formulario.causa_clinica_especifica" class="form-control" rows="2" placeholder="Detalles adicionales de la causa clínica..."></textarea>
          </div>
          <hr class="my-3">
          <div class="mb-3">
            <label class="form-label">Causas Traumáticas</label>
            <div class="checkbox-grid">
              <div v-for="causa in catalogs.causas_traumaticas" :key="causa.id" class="checkbox-item">
                <input class="form-check-input" type="checkbox" :value="causa.id" v-model="formulario.id_causas_traumaticas" :id="'form-causa-' + causa.id">
                <label class="form-check-label" :for="'form-causa-' + causa.id">{{ causa.nombre }}</label>
              </div>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Descripción Causa Traumática</label>
            <textarea v-model="formulario.ct_especifico" class="form-control" rows="2" placeholder="Detalles adicionales de la causa traumática..."></textarea>
          </div>
        </div>
      </div>

      <div class="card shadow-sm mb-4 form-section">
        <div class="card-header section-header">
          <h3 class="mb-0"><i class="fas fa-user-injured me-2"></i>Datos del Paciente</h3>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Nombre completo</label>
              <input type="text" v-model="formulario.paciente_nombre" class="form-control" placeholder="Ej: Juan Pérez" required>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Edad</label>
              <input type="number" v-model="formulario.paciente_edad" class="form-control" placeholder="Ej: 35" min="0" max="120">
            </div>
          </div>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Sexo</label>
              <select v-model="formulario.paciente_sexo" class="form-select">
                <option value="">Seleccione</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">No definido</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="card shadow-sm mb-4 form-section">
        <div class="card-header section-header">
          <h3 class="mb-0"><i class="fas fa-heart-pulse me-2"></i>Evaluación Clínica</h3>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Estado de Pupilas</label>
              <select v-model="formulario.evaluacion.id_estado_pupilas" class="form-select">
                <option :value="null">Seleccione una opción</option>
                <option v-for="e in catalogs.estados_pupilas" :key="e.id" :value="e.id">{{ e.nombre }}</option>
              </select>
            </div>
            <div v-if="isAnisocoria" class="col-md-6 mb-3">
              <label class="form-label">Lado Anisocoria</label>
              <select v-model="formulario.evaluacion.anisocoria_lado" class="form-select">
                <option value="Der">Derecho</option>
                <option value="Izq">Izquierdo</option>
              </select>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Estado de la Piel</label>
              <select v-model="formulario.evaluacion.id_estado_piel" class="form-select">
                <option :value="null">Seleccione una opción</option>
                <option v-for="e in catalogs.estados_piel" :key="e.id" :value="e.id">{{ e.nombre }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="card shadow-sm mb-4 form-section">
        <div class="card-header section-header">
          <h3 class="mb-0"><i class="fas fa-band-aid me-2"></i>Registro de Lesiones</h3>
        </div>
        <div class="card-body">
          <div v-if="!formulario.lesiones || formulario.lesiones.length === 0" class="empty-lesion">
            <i class="fas fa-exclamation-circle"></i>
            <p>No se han registrado lesiones.</p>
          </div>
          
          <div v-for="(lesion, index) in formulario.lesiones" :key="index" class="lesion-item">
            <div class="lesion-header">
              <h4>Lesión #{{ index + 1 }}</h4>
              <button @click.prevent="eliminarLesion(index)" class="btn btn-sm btn-outline-danger">
                <i class="fas fa-trash me-1"></i> Quitar
              </button>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Tipo de Lesión</label>
                <select v-model="lesion.id_tipo_lesion" class="form-select">
                  <option :value="null">Seleccione tipo</option>
                  <option v-for="t in catalogs.tipos_lesion" :key="t.id" :value="t.id">{{ t.nombre }}</option>
                </select>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Ubicación de la Lesión</label>
                <select v-model="lesion.id_ubicacion_lesion" class="form-select">
                  <option :value="null">Seleccione ubicación</option>
                  <option v-for="u in catalogs.ubicaciones_lesion" :key="u.id" :value="u.id">{{ u.nombre }}</option>
                </select>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Descripción de la Lesión</label>
              <textarea v-model="lesion.descripcion_lesion" class="form-control" rows="2" placeholder="Detalles específicos..."></textarea>
            </div>
          </div>
          
          <div class="add-lesion-btn mt-3">
            <button @click.prevent="agregarLesion" class="btn btn-outline-primary">
              <i class="fas fa-plus me-2"></i> Agregar Lesión
            </button>
          </div>
        </div>
      </div>

      <div class="card shadow-sm mb-4 form-section">
        <div class="card-header section-header">
          <h3 class="mb-0"><i class="fas fa-ambulance me-2"></i>Traslado</h3>
        </div>
        <div class="card-body">
          <div class="form-check form-switch mb-3">
            <input class="form-check-input" type="checkbox" v-model="formulario.requirio_traslado" id="checkTrasladoForm">
            <label class="form-check-label" for="checkTrasladoForm">¿Se trasladó?</label>
          </div>
          <div v-if="formulario.requirio_traslado" class="row">
              <div :class="hospitalEsOtro ? 'col-md-6 mb-3' : 'col-md-12 mb-3'">
                  <label class="form-label">Hospital Destino</label>
                  <select v-model="formulario.hospital_destino" class="form-select" required>
                    <option value="" disabled>Seleccione un hospital</option>
                    <option v-for="hosp in catalogs.hospitales" :key="hosp.id" :value="hosp.nombre">
                      {{ hosp.nombre }}
                    </option>
                  </select>
              </div>
              
              <div v-if="hospitalEsOtro" class="col-md-6 mb-3">
                  <label class="form-label">Especifique "Otro" Hospital *</label>
                  <input type="text" v-model="hospitalOtroTexto" class="form-control" placeholder="Nombre del hospital" required>
              </div>
          </div>
          
          <div v-else class="row">
              <div class="col-md-12 mb-3">
                  <label class="form-label">Estado del Servicio</label>
                  <select v-model="formulario.id_estado_traslado" class="form-select" required>
                      <option :value="null" disabled>Seleccione estado del servicio</option>
                      <option v-for="op in catalogs.estados_traslado" :key="op.id" :value="op.id">{{ op.nombre }}</option>
                  </select>
              </div>
          </div>
        </div>
      </div>

      <!-- Solo mostrar acciones si no estamos en modal -->
      <div v-if="showActions" class="form-actions">
        <button type="button" class="btn btn-outline-secondary btn-lg" @click="handleCancel">
          <i class="fas fa-times me-2"></i>
          <b>Cancelar</b>
        </button>
        <button type="submit" class="btn btn-primary btn-lg" :disabled="saving">
          <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="fas fa-save me-2"></i>
          <b>{{ initialData ? 'Guardar Cambios' : 'Guardar Registro' }}</b>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

// --- Helper Functions (para fechar y resetear) ---
const toISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialFormState = () => ({
  fecha_activacion: toISODate(new Date()), 
  hora_activacion: new Date().toTimeString().split(' ')[0].substring(0, 5),
  origen_reporte: 'Local',
  num_reporte_externo: '',
  requirio_traslado: false,
  hospital_destino: '',
  paciente_nombre: '',
  paciente_edad: null,
  paciente_sexo: '',
  causa_clinica_especifica: '',
  ct_especifico: '',
  tipo_activacion_otro: '',
  id_tipo_activacion: null,
  id_unidad_asignada: null,
  id_causa_clinica: null,
  id_causas_traumaticas: [], 
  id_agente_causante_general: null,
  id_estado_traslado: null,
  evaluacion: {
    id_estado_pupilas: null,
    id_estado_piel: null,
    anisocoria_lado: null
  },
  lesiones: []
});
// --- Fin Helpers ---

    
// --- Props: Datos que el componente recibe del "padre" ---
const props = defineProps({
  catalogs: {
    type: Object,
    required: true
  },
  initialData: { // Los datos para "editar". Si es null, es un "nuevo" registro
    type: Object,
    default: null
  },
  loading: { // Para mostrar el spinner
    type: Boolean,
    default: false
  },
  saving: { // Para deshabilitar el botón de guardar
    type: Boolean,
    default: false
  },
  titulo: {
    type: String,
    default: 'Nuevo Registro'
  },
  subtitulo: {
    type: String,
    default: ''
  },
  mensaje: String,
  tipoMensaje: String,
  showHeader: {
    type: Boolean,
    default: true
  },
  showActions: {
    type: Boolean,
    default: true
  }
});

// --- Emits: Eventos que el componente envía al "padre" ---
const emit = defineEmits(['save', 'cancel', 'save-error']);

// --- Estado Interno del Formulario ---
const formulario = ref(initialFormState());
const tieneReporteExterno = ref(false);
const formElement = ref(null);
const hospitalOtroTexto = ref('');
const currentDate = computed(() => new Date().toISOString().split('T')[0]);
const currentTime = computed(() => new Date().toTimeString().split(' ')[0].substring(0, 5));

// --- NUEVO: Computada para saber si estamos editando ---
const isEditing = computed(() => !!props.initialData);

const hospitalEsOtro = computed(() => {
  return formulario.value.hospital_destino === 'Otro';
  });

// --- Lógica de llenado del formulario ---
watch(() => props.initialData, (newData) => {
  console.log("Datos iniciales recibidos por el formulario:", newData);
  if (newData) {
    formulario.value = JSON.parse(JSON.stringify(newData));
    
    // Ajustes existentes
    formulario.value.id_causas_traumaticas = (newData.causas_traumaticas || []).map(c => c.id);
    formulario.value.evaluacion = newData.evaluacion || initialFormState().evaluacion;
    formulario.value.lesiones = newData.lesiones || initialFormState().lesiones;
    tieneReporteExterno.value = formulario.value.origen_reporte !== 'Local';

    // --- NUEVA LÓGICA PARA CARGAR "OTRO" HOSPITAL ---
    if (newData.hospital_destino && props.catalogs.hospitales) {
      // Comprobamos si el hospital guardado está en la lista estándar
      const hospitalEstandar = props.catalogs.hospitales.find(h => h.nombre === newData.hospital_destino);
      
      if (hospitalEstandar) {
        // Está en la lista, lo seleccionamos (v-model lo hace solo)
        hospitalOtroTexto.value = '';
      } else {
        // No está en la lista, es un "Otro"
        hospitalOtroTexto.value = newData.hospital_destino; // Llenamos el campo de texto
        formulario.value.hospital_destino = 'Otro'; // Seleccionamos "Otro" en el dropdown
      }
    }
    // --- FIN LÓGICA ---

  } else {
    // Modo Creación
    formulario.value = initialFormState();
    hospitalOtroTexto.value = ''; // Resetear
    tieneReporteExterno.value = false;
  }
}, { immediate: true });

watch(hospitalEsOtro, (esOtro) => {
  if (!esOtro) {
    hospitalOtroTexto.value = '';
  }
});

const findCatalogId = (catalogName, namePart) => {
  const catalog = props.catalogs[catalogName];
  if (!catalog) {
    console.warn(`Catálogo "${catalogName}" no encontrado.`);
    return null;
  }
  const item = catalog.find(i => i.nombre.toLowerCase().includes(namePart.toLowerCase()));
  return item ? item.id : null;
};

watch(() => formulario.value.id_estado_traslado, (nuevoEstadoId) => {
  if (!nuevoEstadoId || !props.catalogs.estados_traslado) return;

  const estadoSeleccionado = props.catalogs.estados_traslado.find(e => e.id === nuevoEstadoId);
  if (!estadoSeleccionado) return;

  const estadoNombre = estadoSeleccionado.nombre.toLowerCase();
  
  // Limpiar selecciones previas
  formulario.value.id_agente_causante_general = null;
  formulario.value.id_causa_clinica = null;
  formulario.value.id_causas_traumaticas = [];

  // --- Lógica de decisión basada en tus catálogos ---

  // 1. Fallecido por Enfermedad
  if (estadoNombre.includes('enfermedad')) {
    console.log('Detectado: Enfermedad. Limpiando campos de trauma.');
    // No podemos saber la causa específica (Cardio, Renal...),
    // así que dejamos 'id_causa_clinica' en null para que el usuario la elija.
  } 
  
  // 2. Fallecido por Traumatismo (Genérico)
  else if (estadoNombre.includes('traumatismo')) {
    console.log('Detectado: Traumatismo Genérico. Limpiando campos clínicos.');
  }

  // 3. Fallecido por Ac. De moto
  else if (estadoNombre.includes('ac. de moto')) {
    console.log('Detectado: Accidente de Moto');
    // Agente Causal General -> Mecánico
    formulario.value.id_agente_causante_general = findCatalogId('agentes_causantes', 'mecánico');
    // Causa Traumática (checkbox) -> Motocicleta
    const idMoto = findCatalogId('causas_traumaticas', 'motocicleta');
    if (idMoto) formulario.value.id_causas_traumaticas = [idMoto];
  }

  // 4. Fallecido por Agresión
  else if (estadoNombre.includes('agresión')) {
    console.log('Detectado: Agresión');
    // Causa Traumática (checkbox) -> Ser humano
    const idHumano = findCatalogId('causas_traumaticas', 'ser humano');
    if (idHumano) formulario.value.id_causas_traumaticas = [idHumano];
    // El agente (Mecánico, Químico, etc.) lo dejamos para el usuario.
  }

  // 5. Suicidio
  else if (estadoNombre.includes('suicidio')) {
    console.log('Detectado: Suicidio');
    // Causa Traumática (checkbox) -> Ser humano
    const idHumano = findCatalogId('causas_traumaticas', 'ser humano');
    if (idHumano) formulario.value.id_causas_traumaticas = [idHumano];
    // El agente lo dejamos para el usuario (puede ser químico, mecánico, etc.)
  }

  // 6. Ahogamiento
  else if (estadoNombre.includes('ahogamiento')) {
    console.log('Detectado: Ahogamiento');
    // Agente Causal General -> Mecánico (obstrucción)
    formulario.value.id_agente_causante_general = findCatalogId('agentes_causantes', 'mecánico');
  }

  // 7. Intoxicación (Ejemplo si lo añades a futuro)  
  else if (estadoNombre.includes('intoxicación')) {
    console.log('Detectado: Intoxicación');
    // Causa Clínica -> Intoxicación
    formulario.value.id_causa_clinica = findCatalogId('causa_clinica', 'intoxicación');
    // Agente Causal -> Químico
    formulario.value.id_agente_causante_general = findCatalogId('agentes_causantes', 'químico');
  }
});

// --- Computadas (internas del formulario) ---
const isAnisocoria = computed(() => {
    if (!props.catalogs.estados_pupilas) return false;
    const pupilaSeleccionada = props.catalogs.estados_pupilas.find(p => p.id === formulario.value.evaluacion.id_estado_pupilas);
    return pupilaSeleccionada?.nombre.toLowerCase().includes('anisocóricas');
});

const mostrarOtroTipoActivacion = computed(() => {
    if (!props.catalogs.tipos_activacion) return false;
    const tipoSeleccionado = props.catalogs.tipos_activacion.find(
        t => t.id === formulario.value.id_tipo_activacion
    );
    return tipoSeleccionado?.nombre === 'Otro';
});

// --- Watchers (internos del formulario) ---
watch(tieneReporteExterno, (esExterno) => {
  if (!esExterno) {
    formulario.value.origen_reporte = 'Local';
    formulario.value.num_reporte_externo = '';
  } else {
    if (!props.initialData) {
      formulario.value.origen_reporte = 'C5';
    }
  }
});

watch(() => formulario.value.requirio_traslado, (seTraslado) => {
  if (seTraslado) {
    formulario.value.id_estado_traslado = null;
  } else {
    formulario.value.hospital_destino = '';
  }
});

// --- Métodos de Lesiones ---
const agregarLesion = () => {
  if (!formulario.value.lesiones) {
    formulario.value.lesiones = [];
  }
  formulario.value.lesiones.push({
    id_tipo_lesion: null,
    id_ubicacion_lesion: null,
    descripcion_lesion: ''
  });
};

const eliminarLesion = (index) => {
  formulario.value.lesiones.splice(index, 1);
};

// --- Métodos de Submit y Cancel ---
const handleSubmit = () => {
  // --- Validación de campos obligatorios ---
  if (!formulario.value.paciente_nombre || formulario.value.paciente_nombre.trim() === '') {
    emit('save-error', 'Error: El nombre del paciente es obligatorio.');
    return;
  }
  if (!formulario.value.fecha_activacion) {
    emit('save-error', 'Error: La fecha de activación es obligatoria.');
    return;
  }
  if (!formulario.value.hora_activacion) {
    emit('save-error', 'Error: La hora de activación es obligatoria.');
    return;
  }
  if (!formulario.value.id_tipo_activacion) {
    emit('save-error', 'Error: El tipo de activación es obligatorio.');
    return;
  }

  // --- Preparamos los datos para enviar (hacemos una copia) ---
  const datosParaEnviar = JSON.parse(JSON.stringify(formulario.value));
  datosParaEnviar.id = props.initialData?.id || formulario.value.id;

  // --- LÓGICA DE VALIDACIÓN Y REEMPLAZO DE "OTRO" ---
  if (datosParaEnviar.requirio_traslado) {
    if (datosParaEnviar.hospital_destino === 'Otro') {
      if (!hospitalOtroTexto.value || hospitalOtroTexto.value.trim() === '') {
        emit('save-error', 'Error: Si selecciona "Otro" hospital, debe especificar el nombre.');
        return; // Detiene el envío
      }
      // Reemplazamos "Otro" por el texto escrito
      datosParaEnviar.hospital_destino = hospitalOtroTexto.value.trim();
    
    } else if (!datosParaEnviar.hospital_destino) {
      // Si no es "Otro" pero está vacío
      emit('save-error', 'Error: Si se trasladó, debe especificar el Hospital Destino.');
      return; // Detiene el envío
    }
  } else {
    // Si NO requirió traslado
    if (!datosParaEnviar.id_estado_traslado) {
      emit('save-error', 'Error: Si no se trasladó, debe especificar el Estado del Servicio.');
      return;
    }
  }
  // --- FIN LÓGICA "OTRO" ---

  console.log("Enviando datos:", datosParaEnviar);
  emit('save', datosParaEnviar);
};

const handleCancel = () => {
  emit('cancel');
};

// Método para submit externo (desde el botón del modal)
const submitForm = () => {
  handleSubmit();
};

// Exponer métodos al padre
defineExpose({
  submitForm
});

</script>

<style scoped>
/* ESTILOS GENERALES */
.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  font-weight: 700;
  color: #343a40;
}

/* ESTILOS DEL FORMULARIO */
.form-container-stacked {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.form-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.section-header {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.section-header h3 {
  margin: 0;
  font-weight: 600;
  font-size: 1.3rem;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.empty-lesion {
  text-align: center;
  padding: 1.5rem;
  color: #6c757d;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.empty-lesion i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #adb5bd;
}

.lesion-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  background-color: #f8f9fa;
}

.lesion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #dee2e6;
}

.lesion-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #495057;
}

.add-lesion-btn {
  text-align: center;
  margin-top: 1rem;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

/* ESTADOS DE CARGA */
.loading-state {
  padding: 3rem;
  text-align: center;
}
.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* BOTONES */
.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
}
</style>