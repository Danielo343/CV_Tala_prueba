<template>
  <div class="inicio-container">
    
    <div class="welcome-section mb-5">
      <div class="row align-items-center">
        <div class="col-md-8">
          <h1 class="display-5 fw-bold text-dark mb-2">Hola, {{ firstName }} 👋</h1>
          <p class="text-muted fs-5">Bienvenido al Sistema de Creación de FRAP.</p>
          <p class="text-secondary"><small>{{ currentDate }}</small></p>
        </div>
        <div class="col-md-4 text-end d-none d-md-block">
                 <img src="/LogoTala.ico" alt="Servicios Medicos" class="logo-img" />
        </div>
      </div>
    </div>

    <div class="row mb-5">
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="stat-card bg-white shadow-sm border-0 p-4 rounded-4 h-100 position-relative overflow-hidden">
          <div class="d-flex justify-content-between align-items-start position-relative z-1">
            <div>
              <p class="text-muted fw-bold small text-uppercase mb-1">Servicios de Hoy</p>
              <h2 class="display-4 fw-bold text-primary mb-0">{{ stats.serviciosHoy }}</h2>
            </div>
            <div class="icon-box bg-primary-subtle text-primary rounded-circle p-3">
              <i class="fas fa-ambulance fa-2x"></i>
            </div>
          </div>
          <div class="mt-3 z-1 position-relative">
            <button @click="$router.push('/registros')" class="btn btn-sm btn-link text-decoration-none p-0">Ver lista <i class="fas fa-arrow-right ms-1"></i></button>
          </div>
          <i class="fas fa-ambulance position-absolute text-primary opacity-10" style="bottom: -20px; right: -20px; font-size: 10rem;"></i>
        </div>
      </div>

      <div class="col-md-6 col-lg-4 mb-4">
        <div class="stat-card bg-white shadow-sm border-0 p-4 rounded-4 h-100 position-relative overflow-hidden">
          <div class="d-flex justify-content-between align-items-start position-relative z-1">
            <div>
              <p class="text-muted fw-bold small text-uppercase mb-1">Eventos Totales</p>
              <h2 class="display-4 fw-bold text-success mb-0">{{ stats.eventosTotal }}</h2>
            </div>
            <div class="icon-box bg-success-subtle text-success rounded-circle p-3">
              <i class="fas fa-calendar-check fa-2x"></i>
            </div>
          </div>
          <div class="mt-3 z-1 position-relative">
             <button @click="$router.push('/eventos')" class="btn btn-sm btn-link text-success text-decoration-none p-0">Administrar <i class="fas fa-arrow-right ms-1"></i></button>
          </div>
          <i class="fas fa-calendar-alt position-absolute text-success opacity-10" style="bottom: -20px; right: -20px; font-size: 10rem;"></i>
        </div>
      </div>
      
       <div v-if="isAdmin" class="col-md-6 col-lg-4 mb-4">
        <div class="stat-card bg-white shadow-sm border-0 p-4 rounded-4 h-100 position-relative overflow-hidden">
          <div class="d-flex justify-content-between align-items-start position-relative z-1">
            <div>
              <p class="text-muted fw-bold small text-uppercase mb-1">Usuarios Sistema</p>
              <h2 class="display-4 fw-bold text-info mb-0">{{ stats.usuarios }}</h2>
            </div>
            <div class="icon-box bg-info-subtle text-info rounded-circle p-3">
              <i class="fas fa-users fa-2x"></i>
            </div>
          </div>
          <div class="mt-3 z-1 position-relative">
             <button @click="$router.push('/gestion-usuarios')" class="btn btn-sm btn-link text-info text-decoration-none p-0">Gestionar <i class="fas fa-arrow-right ms-1"></i></button>
          </div>
          <i class="fas fa-users-cog position-absolute text-info opacity-10" style="bottom: -20px; right: -20px; font-size: 10rem;"></i>
        </div>
      </div>
    </div>

    <h4 class="fw-bold text-secondary mb-4">Accesos Rápidos</h4>
    <div class="row">
      <div class="col-md-3 mb-3">
        <button @click="$router.push('/registros')" class="btn btn-white shadow-sm w-100 py-4 rounded-3 text-start border-0 hover-lift">
          <div class="d-flex align-items-center">
            <div class="bg-primary text-white rounded-3 p-3 me-3">
              <i class="fas fa-plus fa-lg"></i>
            </div>
            <div>
              <h6 class="fw-bold mb-0 text-dark">Nuevo Registro</h6>
              <small class="text-muted">Capturar servicio</small>
            </div>
          </div>
        </button>
      </div>

      <div class="col-md-3 mb-3">
        <button @click="$router.push('/consultas')" class="btn btn-white shadow-sm w-100 py-4 rounded-3 text-start border-0 hover-lift">
          <div class="d-flex align-items-center">
            <div class="bg-warning text-white rounded-3 p-3 me-3">
              <i class="fas fa-search fa-lg"></i>
            </div>
            <div>
              <h6 class="fw-bold mb-0 text-dark">Consultas</h6>
              <small class="text-muted">Buscar historial</small>
            </div>
          </div>
        </button>
      </div>

      <div class="col-md-3 mb-3">
        <button @click="$router.push('/reportes')" class="btn btn-white shadow-sm w-100 py-4 rounded-3 text-start border-0 hover-lift">
          <div class="d-flex align-items-center">
            <div class="bg-danger text-white rounded-3 p-3 me-3">
              <i class="fas fa-chart-pie fa-lg"></i>
            </div>
            <div>
              <h6 class="fw-bold mb-0 text-dark">Estadisticas</h6>
              <small class="text-muted">Ver estadísticas</small>
            </div>
          </div>
        </button>
      </div>
      
      <div v-if="isAdmin" class="col-md-3 mb-3">
        <button @click="$router.push('/configuracion')" class="btn btn-white shadow-sm w-100 py-4 rounded-3 text-start border-0 hover-lift">
          <div class="d-flex align-items-center">
            <div class="bg-secondary text-white rounded-3 p-3 me-3">
              <i class="fas fa-cogs fa-lg"></i>
            </div>
            <div>
              <h6 class="fw-bold mb-0 text-dark">Configuración</h6>
              <small class="text-muted">Catálogos</small>
            </div>
          </div>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import api from '@/services/api';

const store = useStore();
const stats = ref({
  serviciosHoy: 0,
  eventosTotal: 0,
  usuarios: 0
});

const currentUser = computed(() => store.getters.currentUser);
const isAdmin = computed(() => store.getters.isAdmin);

const firstName = computed(() => {
  if (currentUser.value && currentUser.value.name) {
    return currentUser.value.name.split(' ')[0];
  }
  return 'Usuario';
});

const currentDate = computed(() => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date().toLocaleDateString('es-MX', options);
});

const loadStats = async () => {
  try {
    // 1. Servicios de Hoy (Reusamos el endpoint existente con scope=today)
    const resServicios = await api.get('/activaciones', { params: { scope: 'today' } });
    stats.value.serviciosHoy = resServicios.data.length;

    // 2. Eventos (Reusamos endpoint)
    const resEventos = await api.get('/eventos');
    stats.value.eventosTotal = resEventos.data.length;

    // 3. Usuarios (Solo si es admin)
    if (isAdmin.value) {
      const resUsuarios = await api.get('/usuarios');
      stats.value.usuarios = resUsuarios.data.length;
    }
  } catch (err) {
    console.error("Error cargando estadísticas rápidas", err);
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>

.logo-img {
  max-width: 100%;      /* Que no se salga del ancho de la columna */
  height: auto;         /* Que mantenga su proporción */
  max-height: 180px;    /* Altura máxima para que no se vea gigante */
  object-fit: contain;  /* Asegura que la imagen se vea completa */
  display: block;
  margin-left: auto;    /* La empuja a la derecha */
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); /* Una sombra suave para que resalte */
}

/* Ajuste para móviles: centrar el logo si la pantalla es chica */
@media (max-width: 768px) {
  .logo-img {
    margin: 0 auto 1.5rem auto; /* Centrado y con margen abajo */
    max-height: 120px;
  }
}

.inicio-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.stat-card {
  transition: transform 0.3s ease;
}
.stat-card:hover {
  transform: translateY(-5px);
}

.icon-box {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-primary-subtle { background-color: #cfe2ff; color: #0a58ca; }
.bg-success-subtle { background-color: #d1e7dd; color: #146c43; }
.bg-info-subtle { background-color: #cff4fc; color: #055160; }

.btn-white {
  background-color: white;
  transition: all 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-3px);
  box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
}

.opacity-10 {
  opacity: 0.1;
}
.opacity-25 {
  opacity: 0.25;
}

.z-1 {
  z-index: 1;
}
</style>