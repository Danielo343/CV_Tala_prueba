<template>
  <aside class="dashboard-sidebar">
    <div class="sidebar-section">
      <div class="sidebar-title">Módulos Principales</div>
      

      <router-link to="/registros" :class="['sidebar-button', { active: $route.path.startsWith('/registros') }]">
        <i class="fas fa-ambulance"></i>
        <span class="button-text">Reportes</span>
      </router-link>

            <router-link to="/eventos" custom v-slot="{ navigate, isActive }">
        <button :class="['sidebar-button', { active: isActive }]" @click="navigate">
          <i class="fas fa-calendar-alt "></i>
          <span class="button-text">Eventos</span>
        </button>
      </router-link>

            <router-link to="/consultas" custom v-slot="{ navigate, isActive }">
        <button :class="['sidebar-button', { active: isActive }]" @click="navigate">
          <i class="fas fa-magnifying-glass"></i>
          <span class="button-text">Consultas</span>
        </button>
      </router-link>

      <router-link to="/reportes" custom v-slot="{ navigate, isActive }">
        <button :class="['sidebar-button', { active: isActive }]" @click="navigate">
          <i class="fas fa-chart-line"></i>
          <span class="button-text">Estadisticas</span>
        </button>
      </router-link>
      
    </div>
  </aside>
</template>

<script>
// Volvemos al script original
export default {
  name: 'TheSidebar'
};
</script>

<style scoped>
/* Tus estilos originales se quedan igual */
.dashboard-sidebar {
  width: 260px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 2rem 0;
  z-index: 10;
}

.sidebar-section {
  margin-bottom: 2rem;
}

.sidebar-title {
  padding: 0 2rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  color: var(--text-gray);
  margin-bottom: 1.2rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Estilo para router-link que se comporta como botón */
.sidebar-button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 1.2rem 2rem;
  background: transparent;
  border: none;
  text-align: left;
  font-size: 1.05rem;
  color: var(--text-dark);
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  border-left: 5px solid transparent;
  text-decoration: none; /* Quitar subrayado de los links */
}

.sidebar-button i {
  margin-right: 1rem;
  color: var(--primary);
  font-size: 1.3rem;
  width: 28px;
  transition: all 0.3s ease-in-out;
}

.sidebar-button:hover {
  background-color: var(--primary-light);
}

.sidebar-button.active {
  background-color: var(--bg-light);
  color: var(--text-dark);
  font-weight: 600;
  border-left: 5px solid var(--primary);
}

.sidebar-button.active i {
  color: var(--primary);
}
</style>