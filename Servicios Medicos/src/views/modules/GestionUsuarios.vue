<template>
  <div class="gestion-usuarios-container">
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <i class="fas fa-users-cog header-icon"></i>
          <div>
            <h1 class="page-title">Gestión de Usuarios</h1>
            <p class="page-subtitle">Crear, editar y administrar usuarios del sistema</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" @click="abrirModalNuevo">
            <i class="fas fa-user-plus me-2"></i>Nuevo Usuario
          </button>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div v-if="cargando" class="loading-state">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3">Cargando usuarios...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-triangle fa-2x mb-3 text-danger"></i>
        <h4>Error al cargar usuarios</h4>
        <p class="text-muted">{{ error }}</p>
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>Nombre Completo</th>
              <th>Nombre de Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="usuario in usuarios" :key="usuario.id">
              <td>
                <div class="fw-bold">{{ usuario.nombre_completo }}</div>
              </td>
              <td>
                <span class="text-muted">{{ usuario.nombre_usuario }}</span>
              </td>
              <td>
                <span class="text-muted">{{ usuario.email || 'N/A' }}</span>
              </td>
              <td>
                <span :class="['badge', usuario.rol === 'admin' ? 'bg-primary' : 'bg-secondary']">
                  {{ usuario.rol }}
                </span>
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary me-2" @click="abrirModalEditar(usuario)">
                  <i class="fas fa-edit me-1"></i>Editar
                </button>
                <button 
                  class="btn btn-sm btn-outline-danger" 
                  @click="borrarUsuario(usuario)"
                   :disabled="usuario.id === currentUser?.id"> <i class="fas fa-trash me-1"></i>Borrar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal fade" id="modalUsuario" ref="modalUsuarioRef" tabindex="-1" aria-labelledby="modalUsuarioLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <form @submit.prevent="guardarUsuario">
            <div class="modal-header">
              <h5 class="modal-title" id="modalUsuarioLabel">{{ isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div v-if="modalError" class="alert alert-danger">
                {{ modalError }}
              </div>

              <div class="mb-3">
                <label for="nombreCompleto" class="form-label">Nombre Completo *</label>
                <input type="text" v-model="formData.nombre_completo" class="form-control" id="nombreCompleto" required>
              </div>
              <div class="mb-3">
                <label for="nombreUsuario" class="form-label">Nombre de Usuario *</label>
                <input type="text" v-model="formData.nombre_usuario" class="form-control" id="nombreUsuario" required>
              </div>
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input type="email" v-model="formData.email" class="form-control" id="email" placeholder="ejemplo@correo.com">
              </div>
              <div class="mb-3">
                <label for="rol" class="form-label">Rol *</label>
                <select v-model="formData.rol" class="form-select" id="rol" required>
                  <option value="usuario">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Contraseña</label>
                <input type="password" v-model="formData.password" class="form-control" id="password" :placeholder="isEditing ? 'Dejar en blanco para no cambiar' : 'Requerida*'" :required="!isEditing">
                <small v-if="isEditing" class="text-muted">Dejar en blanco para no cambiar la contraseña.</small>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="guardando">
                <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
                {{ guardando ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import api from '@/services/api';
import { Modal } from 'bootstrap';

const store = useStore();

const usuarios = ref([]);
const cargando = ref(true);
const guardando = ref(false);
const error = ref(null);
const modalError = ref(null);

const modalUsuarioRef = ref(null);
let modalInstance = null;

const isEditing = ref(false);
const formData = ref({
  id: null,
  nombre_completo: '',
  nombre_usuario: '',
  password: '',
  rol: 'usuario',
  email: ''
});

const currentUser = computed(() => store.getters.currentUser);

// Cargar usuarios al montar el componente
onMounted(() => {
  cargarUsuarios();
  // Inicializamos la instancia del modal de Bootstrap
  if (modalUsuarioRef.value) {
    modalInstance = new Modal(modalUsuarioRef.value);
  }
});

async function cargarUsuarios() {
  cargando.value = true;
  error.value = null;
  try {
    const response = await api.get('/usuarios');
    usuarios.value = response.data;
  } catch (err) {
    console.error(err);
    error.value = 'No se pudieron cargar los usuarios. ' + (err.response?.data?.message || '');
  } finally {
    cargando.value = false;
  }
}

function resetForm() {
  isEditing.value = false;
  modalError.value = null;
  formData.value = {
    id: null,
    nombre_completo: '',
    nombre_usuario: '',
    password: '',
    rol: 'usuario', // Rol por defecto (según tu SQL)
    email: ''
  };
}

function abrirModalNuevo() {
  resetForm();
  modalInstance.show();
}

function abrirModalEditar(usuario) {
  resetForm();
  isEditing.value = true;
  formData.value = { ...usuario, password: '' }; // Copiamos datos y limpiamos password
  modalInstance.show();
}

async function guardarUsuario() {
  guardando.value = true;
  modalError.value = null;

  try {
    if (isEditing.value) {
      // Actualizar (PUT)
      await api.put(`/usuarios/${formData.value.id}`, formData.value);
    } else {
      // Crear (POST)
      await api.post('/usuarios', formData.value);
    }
    
    modalInstance.hide();
    await cargarUsuarios(); // Recargamos la lista

  } catch (err) {
    console.error(err);
    modalError.value = 'Error: ' + (err.response?.data?.error || 'No se pudo guardar el usuario.');
  } finally {
    guardando.value = false;
  }
}

async function borrarUsuario(usuario) {
  if (confirm(`¿Está seguro de que desea eliminar a ${usuario.nombre_completo}? Esta acción es irreversible.`)) {
    try {
      await api.delete(`/usuarios/${usuario.id}`);
      await cargarUsuarios(); // Recargamos la lista
    } catch (err) {
      console.error(err);
      alert('Error: ' + (err.response?.data?.error || 'No se pudo eliminar el usuario.'));
    }
  }
}
</script>

<style scoped>
.gestion-usuarios-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  background: white;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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
  color: #007bff;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #343a40;
}

.page-subtitle {
  opacity: 0.9;
  margin: 0.25rem 0 0 0;
  font-size: 1rem;
  color: #6c757d;
}

.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 2rem;
}

.loading-state, .error-state {
  padding: 3rem;
  text-align: center;
  color: #6c757d;
}

.table-hover tbody tr:hover {
  background-color: #f8f9fa;
}

.badge.bg-primary {
  background-color: #007bff !important;
  text-transform: capitalize;
}
.badge.bg-secondary {
  background-color: #6c757d !important;
  text-transform: capitalize;
}
</style>