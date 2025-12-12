import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'

// Importamos nuestros módulos principales
import RegistroPrehospitalario from '@/views/modules/RegistroPrehospitalario.vue'
import ConsultasView from '@/views/modules/ConsultasView.vue'
import EventosView from '@/views/modules/EventosView.vue'
import GestionUsuarios from '@/views/modules/GestionUsuarios.vue'
import ReportesView from '@/views/modules/ReportesView.vue'
import HistorialView from '@/views/modules/HistorialView.vue'
import ConfiguracionView from '@/views/modules/ConfiguracionView.vue'
import InicioView from '@/views/modules/InicioView.vue'


const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  
  {
    path: '/',
    component: DashboardView,
    meta: { requiresAuth: true }, // Todas las rutas hijas requieren estar logueado
    children: [
{
        path: '', 
        name: 'Inicio',
        component: InicioView
      },
      // 2. Ruta movida -> Captura
      {
        path: 'registros', 
        name: 'Prehospitalario',
        component: RegistroPrehospitalario
      },
      {
        path: 'consultas', // La ruta "/consultas"
        name: 'Consultas',
        component: ConsultasView
      },
      {
        path: 'eventos', // La ruta "/eventos"
        name: 'Eventos',
        component: EventosView
      },
      {
        path: 'gestion-usuarios',
        name: 'GestionUsuarios',
        component: GestionUsuarios,
        meta: { 
          requiresAuth: true,
          adminOnly: true // Esta ruta específica requiere ser admin
        }
      },
      // --- ¡NUEVA RUTA DE HISTORIAL! ---
      {
        path: 'historial-actividad',
        name: 'HistorialActividad',
        component: HistorialView,
        meta: { 
          requiresAuth: true,
          adminOnly: true // Esta ruta también requiere ser admin
        }
      },
      // --- ¡NUEVA RUTA DE REPORTES! ---
      {
        path: 'reportes', // La ruta será "/reportes"
        name: 'Reportes',
        component: ReportesView,
        meta: { 
          requiresAuth: true
        }
      },

      {
        path: 'configuracion',
        name: 'Configuracion',
        component: ConfiguracionView,
        meta: { requiresAuth: true, adminOnly: true }
      },
      
      // --- FIN DE RUTA NUEVA ---
    ]
  },
  // Ruta separada para edición completa (fuera del Dashboard)
  {
    path: '/editar-registro/:id',
    name: 'EditarRegistro',
    component: () => import('@/views/modules/EditarRegistroView.vue'),
    props: true,
    meta: { 
      requiresAuth: true,
      adminOnly: true // Solo admins pueden entrar a la página de editar
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// --- ¡GUARDIA DE NAVEGACIÓN MEJORADO! ---
router.beforeEach((to, from, next) => {
  // Usamos el getter de Vuex para saber si está logueado
  const isAuthenticated = store.getters.isLoggedIn;
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.adminOnly);

  if (requiresAuth && !isAuthenticated) {
    // 1. Si requiere login y no está logueado -> A /login
    next('/login');
  } else if (requiresAdmin && !store.getters.isAdmin) {
    // 2. Si requiere ser admin y no lo es -> A la raíz
    // (Ya está logueado, pero no tiene permisos)
    console.warn('Acceso denegado: Se requiere rol de Administrador para', to.path);
    next('/'); // Lo mandamos al inicio (Prehospitalario)
  } else if (to.path === '/login' && isAuthenticated) {
    // 3. Si va a /login pero ya está logueado -> A la raíz
    next('/');
  } else {
    // 4. En cualquier otro caso, déjalo pasar
    next();
  }
});



export default router