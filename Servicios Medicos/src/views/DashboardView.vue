<template>
  <div class="dashboard-layout">
    <TheHeader />
    <div class="dashboard-body">
      <TheSidebar />
      <main class="dashboard-main">
        <router-view /> 
      </main>
    </div>
  </div>
</template>

<script>
import TheHeader from '@/components/layout/TheHeader.vue';
import TheSidebar from '@/components/layout/TheSidebar.vue';

export default {
  name: 'DashboardView',
  components: {
    TheHeader,
    TheSidebar
  },
  data() {
    return {
      inactivityTimer: null,
      // 25 minutos * 60 segundos/min * 1000 ms/s
      INACTIVITY_TIMEOUT_MS: 25 * 60 * 1000, 
      // Lista de eventos que cuentan como "actividad"
      activityEvents: ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart']
    };
  },
  methods: {
    /**
     * Esta función se llama cuando el temporizador de inactividad se completa.
     */
    handleInactivityLogout() {
      console.warn(`Inactividad de ${this.INACTIVITY_TIMEOUT_MS / 60000} min detectada. Cerrando sesión.`);
      
      // Despachamos la acción de logout de Vuex
      this.$store.dispatch('logout'); 
      
      // Redirigimos a Login
      this.$router.push('/login');
    },
    
    /**
     * Reinicia el temporizador de inactividad.
     * Se llama cada vez que el usuario realiza una acción.
     */
    resetInactivityTimer() {
      // Limpia el temporizador anterior
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
      }
      // Crea un nuevo temporizador
      this.inactivityTimer = setTimeout(this.handleInactivityLogout, this.INACTIVITY_TIMEOUT_MS);
    },
    
    /**
     * Añade los event listeners a la ventana para detectar actividad.
     */
    addActivityListeners() {
      this.activityEvents.forEach(event => {
        // Usamos { passive: true } para mejor rendimiento
        window.addEventListener(event, this.resetInactivityTimer, { passive: true });
      });
    },
    
    /**
     * Limpia todos los event listeners y el temporizador.
     */
    removeActivityListeners() {
      // Limpia el temporizador
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
      }
      // Limpia los listeners
      this.activityEvents.forEach(event => {
        window.removeEventListener(event, this.resetInactivityTimer);
      });
    }
  },
  /**
   * Cuando el componente Dashboard se monta (es decir, el usuario inicia sesión),
   * iniciamos los listeners y el temporizador.
   */
  mounted() {
    console.log(`Timer de inactividad de ${this.INACTIVITY_TIMEOUT_MS / 60000} min iniciado.`);
    this.addActivityListeners();
    // Iniciar el timer por primera vez
    this.resetInactivityTimer();
  },
  /**
   * Cuando el componente se destruye (es decir, el usuario cierra sesión),
   * limpiamos todo para evitar fugas de memoria.
   */
  unmounted() {
    console.log('Timer de inactividad detenido (Logout o cierre de componente).');
    this.removeActivityListeners();
  }
};
</script>

<style>
/* ... (tus estilos de DashboardView.vue se quedan igual) ... */
:root {
  --primary: #007bff;
  --primary-dark: #0056b3;
  --primary-light: #e6f2ff;
  --secondary: #28a745;
  --accent: #dc3545;
  --text-dark: #343a40;
  --text-gray: #6c757d;
  --bg-light: #f8f9fa;
  --bg-dark: #e9ecef;
  --border-color: #dee2e6;
  --border-radius: 12px;
  --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  --transition: all 0.3s ease-in-out;
}

body {
  font-family: 'Inter', sans-serif;
  color: var(--text-dark);
  margin: 0;
  background-color: var(--bg-light);
}

/* --- CAMBIOS PARA EL SIDEBAR FIJO --- */
.dashboard-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;     /* <-- CAMBIO: de 'min-height' a 'height' */
  overflow: hidden;    /* <-- AÑADIDO: Evita que el layout principal tenga scroll */
}

.dashboard-body {
  display: flex;
  flex: 1;
  overflow: hidden;    /* <-- AÑADIDO: Evita que el body se desborde */
}

.dashboard-main {
  flex: 1;
  padding: 2.5rem;
  overflow-y: auto;  /* <-- CLAVE: Solo esta área tendrá scroll */
}
</style>