<template>
  <header class="dashboard-header">
    <div class="header-content">
      <div class="logo">
        <img src="/ServiciosMedicos.png" alt="Servicios Medicos" class="logo-img" />
        <span>Dirección de Atención Medica Prehospitalaria</span>
      </div>
      <!-- --- MENÚ DE USUARIO ACTUALIZADO --- -->
<div class="user-menu">
        
        <router-link to="/" class="home-button" title="Ir a Inicio">
          <i class="fas fa-home"></i>
        </router-link>

        <div class="user-avatar-container">
          <div class="user-avatar" @click="toggleDropdown" title="Opciones de usuario">
            {{ userInitials }}
          </div>

          <transition name="dropdown-fade">
            <div v-if="isDropdownOpen" class="user-dropdown">
              <div class="dropdown-header">
                <strong>{{ currentUser?.name || 'Usuario' }}</strong>
                <span :class="['badge', isAdmin ? 'bg-primary' : 'bg-secondary']">
                  {{ currentUser?.rol || 'Rol' }}
                </span>
              </div>
              <ul class="dropdown-menu-list">
                <li v-if="isAdmin" @click="goTo('HistorialActividad')">
                  <i class="fas fa-history"></i>
                  <span>Historial de Actividad</span>
                </li>
                <li v-if="isAdmin" @click="goTo('GestionUsuarios')">
                  <i class="fas fa-users-cog"></i>
                  <span>Gestionar Usuarios</span>
                </li>
                <li v-if="isAdmin" @click="goTo('Configuracion')">
                  <i class="fas fa-cogs"></i>
                  <span>Configuración</span>
                </li>
                <li @click="handleLogout">
                  <i class="fas fa-sign-out-alt"></i>
                  <span>Cerrar Sesión</span>
                </li>
              </ul>
            </div>
          </transition>
        </div>
      </div>
      <!-- --- FIN DE CAMBIOS --- -->

    </div>
  </header>
  
  <!-- Overlay para cerrar el menú al hacer clic fuera -->
  <div v-if="isDropdownOpen" @click="isDropdownOpen = false" class="dropdown-overlay"></div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'TheHeader',
  
  data() {
    return {
      isDropdownOpen: false
    };
  },

  computed: {
    ...mapGetters(['currentUser', 'isAdmin']), 

    userInitials() {
      const name = this.currentUser?.name;
      if (!name) return 'US';
      
      const parts = name.split(' ');
      const first = parts[0]?.charAt(0) || '';
      const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) || '') : '';
      return (first + last).toUpperCase();
    }
  },
  
  methods: {
    handleLogout() {
      this.isDropdownOpen = false; 
      this.$store.dispatch('logout');
      this.$router.push('/login');
    },

    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;
    },

    goTo(routeName) {
      this.$router.push({ name: routeName });
      this.isDropdownOpen = false; 
    }
  }
};
</script>

<style scoped>

/* Estilo MEJORADO para el botón de casita */
.home-button {
  color: #007bff;            /* Color azul primario para que destaque */
  background-color: #f0f4ff; /* Fondo azul muy clarito */
  font-size: 1.6rem;         /* Ícono más grande */
  
  /* Hacemos el botón más grande y cuadrado con bordes redondeados */
  width: 48px;
  height: 48px;
  border-radius: 12px;       
  
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;     /* Quitar subrayado */
  transition: all 0.2s ease;
  border: 1px solid transparent; /* Prepara el borde para el hover */
}

.home-button:hover {
  background-color: #007bff; /* Al pasar el mouse se pone azul fuerte */
  color: white;              /* El ícono se vuelve blanco */
  transform: translateY(-3px); /* Se eleva un poco */
  box-shadow: 0 4px 10px rgba(0, 123, 255, 0.3); /* Sombra para dar profundidad */
}

/* Asegura que los elementos del menú estén alineados */
.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem; /* Espacio entre la casita y el avatar */
}

.dashboard-header {
  background: white;
  color: #343a40;
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 1001; /* Lo ponemos por ENCIMA del overlay */
  position: relative; /* Necesario para que z-index funcione correctamente */
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}
.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.6rem;
  font-weight: 700;
}
.logo-img {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 50%;
  background: white;     
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
  border: 1px solid rgba(0,0,0,0.06);
  display: inline-block;
}
.nav-tabs {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0.4rem;
  background: #e9ecef;
  border-radius: 50px;
  gap: 0.5rem;
}
.nav-tabs li {
  padding: 0.8rem 2rem;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  font-size: 0.95rem;
  color: #6c757d;
}
.nav-tabs li:hover {
  background-color: white;
  color: #007bff;
}
.nav-tabs li.active {
  background-color: white;
  color: #343a40;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
.user-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

/* --- ESTILO DE CAMPANA ELIMINADO --- */
/*
.notification-icon {
  ...
}
.notification-badge {
  ...
}
*/

.user-avatar-container {
  position: relative;
}
.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(45deg, #007bff, #28a745);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  cursor: pointer;
  font-size: 1.2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease-in-out;
  user-select: none;
}
.user-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.btn-logout {
  display: none;
}
.user-dropdown {
  position: absolute;
  top: calc(100% + 15px);
  right: 0;
  width: 280px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid #e9ecef;
  overflow: hidden;
}
.dropdown-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}
.rol-badge {
  color: white;
  text-transform: capitalize;
}
.rol-badge.bg-primary {
  background-color: #007bff !important;
}
.rol-badge.bg-secondary {
  background-color: #6c757d !important;
}
.dropdown-menu-list {
  list-style: none;
  padding: 0.5rem 0;
  margin: 0;
}
.dropdown-menu-list li {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-weight: 500;
  color: #343a40;
}
.dropdown-menu-list li:hover {
  background-color: #e6f2ff;
}
.dropdown-menu-list li i {
  width: 20px;
  text-align: center;
  color: #6c757d;
}
.dropdown-menu-list li:last-child {
  color: #dc3545;
}
.dropdown-menu-list li:last-child i {
  color: #dc3545;
}
.dropdown-menu-list li:last-child:hover {
  background-color: #f8d7da;
}
.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000; /* Por debajo del header */
  background: transparent;
}
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>