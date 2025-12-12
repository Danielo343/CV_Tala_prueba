<template>
  <div class="editar-registro-container">
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <i class="fas fa-edit header-icon"></i>
          <div>
            <h1 class="page-title">Editar Registro Prehospitalario</h1>
            <p class="page-subtitle">Editando registro completo</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline-secondary" @click="regresarAConsultas">
            <i class="fas fa-arrow-left me-2"></i>Volver a Consultas
          </button>
        </div>
      </div>
    </div>

    <div class="main-content">
      <FormActivacion
        :catalogs="catalogos"
        :initialData="registroData"
        :loading="cargando"
        :saving="guardando"
        :titulo="''"
        :subtitulo="registroData ? `Editando folio: ${registroData.num_reporte_local}` : ''"
        :mensaje="mensaje"
        :tipoMensaje="tipoMensaje"
        @save="guardarRegistro"
        @cancel="regresarAConsultas"
        @save-error="mostrarError"
        @delete="eliminarRegistro"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import api from '@/services/api'
import FormActivacion from '@/components/FormActivacion.vue'

export default {
  name: 'EditarRegistroView',
  components: {
    FormActivacion
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    
    const registroData = ref(null)
    const cargando = ref(true)
    const guardando = ref(false)
    const catalogos = ref({})
    const mensaje = ref('')
    const tipoMensaje = ref('')

    const cargarRegistro = async () => {
      cargando.value = true
      try {
        const response = await api.get(`/activaciones/${route.params.id}`)
        registroData.value = response.data
      } catch (error) {
        console.error('Error al cargar registro:', error)
        mensaje.value = 'Error al cargar el registro'
        tipoMensaje.value = 'alert-danger'
      } finally {
        cargando.value = false
      }
    }

    const cargarCatalogos = async () => {
      try {
        const res = await api.get('/catalogos')
        catalogos.value = res.data
      } catch (err) {
        console.error("Error al cargar catálogos:", err)
        mensaje.value = 'Error al cargar las opciones del formulario'
        tipoMensaje.value = 'alert-danger'
      }
    }
    const eliminarRegistro = async (id) => {
  if (!confirm('¿Está seguro de eliminar permanentemente este registro? Esta acción no se puede deshacer.')) {
    return;
  }

  try {
    await api.delete(`/activaciones/${id}`);
    mensaje.value = 'Registro eliminado correctamente';
    tipoMensaje.value = 'alert-success';
    
    setTimeout(() => {
      regresarAConsultas();
    }, 1500);
  } catch (error) {
    console.error('Error al eliminar:', error);
    mensaje.value = 'Error al eliminar el registro';
    tipoMensaje.value = 'alert-danger';
  }
};

    const guardarRegistro = async (payload) => {
      guardando.value = true
      mensaje.value = ''
      
  try {
    console.log("Enviando actualización desde edición completa:", payload);
    
    // CORRECCIÓN: Eliminar el /api duplicado
    const resp = await api.put(`/activaciones/${payload.id}`, payload);
    
    mensaje.value = `¡Éxito! Registro ${resp.data.data.num_reporte_local} actualizado.`;
    tipoMensaje.value = 'alert-success';
    
    setTimeout(() => {
      regresarAConsultas();
    }, 1500);
  } catch (error) {
    console.error('Error completo al guardar:', error);
    console.error("Respuesta del servidor:", error.response?.data);
    mensaje.value = `Error al guardar: ${error.response?.data?.error || error.response?.data?.message || 'Verifique los datos.'}`;
    tipoMensaje.value = 'alert-danger';
  } finally {
    guardando.value = false;
  }
}

    const mostrarError = (msg) => {
      mensaje.value = msg
      tipoMensaje.value = 'alert-danger'
    }

    const regresarAConsultas = () => {
      if (route.query.returnTo === 'consultas') {
        router.push('/consultas')
      } else {
        router.push('/registros')
      }
    }

    onMounted(() => {
      cargarCatalogos()
      cargarRegistro()
    })

    return {
      registroData,
      cargando,
      guardando,
      catalogos,
      mensaje,
      tipoMensaje,
      guardarRegistro,
      mostrarError,
      regresarAConsultas,
      eliminarRegistro
    }
  }
}
</script>

<style scoped>
.editar-registro-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.page-header {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  border-radius: 12px;
  margin-bottom: 2rem;
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

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.page-subtitle {
  opacity: 0.9;
  margin: 0.25rem 0 0 0;
  font-size: 1rem;
}

.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .main-content {
    padding: 1rem;
  }
}
</style>