import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import AuthService from '@/services/auth' // <-- 1. Importar el servicio de autenticación

// Importar Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'

// Importar Font Awesome
import '@fortawesome/fontawesome-free/css/all.css'

// --- 👇 REGISTRO DE CHART.JS Y DATALABELS (NUEVO) 👇 ---
import { Chart, registerables } from 'chart.js'; // Necesario para registrar globalmente
import ChartDataLabels from 'chartjs-plugin-datalabels'; // ¡NUEVO!
Chart.register(...registerables, ChartDataLabels); // ¡MODIFICADO!
// --- 👆 FIN DEL REGISTRO 👆 ---

// --- 👇 LÓGICA DE VERIFICACIÓN AÑADIDA 👇 ---

async function tryVerifyLogin() {
  // 1. Revisamos si el store (localStorage) cree que estamos logueados
  if (store.getters.isLoggedIn) {
    console.log('Verificando token existente...');
    try {
      // 2. Intentamos verificar el token contra el backend
      await AuthService.verify();
      // 3. Si tiene éxito, el token es válido. No hacemos nada.
      console.log('Token verificado, continuando sesión.');
    } catch (error) {
      // 4. Si falla (token expirado o inválido), forzamos el logout
      console.warn('Token inválido o expirado, cerrando sesión.');
      store.dispatch('logout'); 
    }
  }
}

// 5. Ejecutamos la verificación ANTES de montar la aplicación
tryVerifyLogin().then(() => {
  const app = createApp(App)
  app.use(store)
  app.use(router)
  app.mount('#app')
});
// --- 👆 FIN DE LA LÓGICA AÑADIDA 👆 ---