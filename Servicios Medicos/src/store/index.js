import { createStore } from 'vuex'
import AuthService from '@/services/auth'

// Verificar si hay usuario en localStorage
const user = JSON.parse(localStorage.getItem('user'))

export default createStore({
  state: {
    status: { loggedIn: !!user },
    user: user || null
  },
  mutations: {
    loginSuccess(state, user) {
      state.status.loggedIn = true
      state.user = user
    },
    loginFailure(state) {
      state.status.loggedIn = false
      state.user = null
    },
    logout(state) {
      state.status.loggedIn = false
      state.user = null
    }
  },
  actions: {
    login({ commit }, user) {
      return AuthService.login(user).then(
        user => {
          // 'user' ahora contiene el 'rol' gracias a nuestro cambio en el backend
          commit('loginSuccess', user)
          return Promise.resolve(user)
        },
        error => {
          commit('loginFailure')
          return Promise.reject(error)
        }
      )
    },
    logout({ commit }) {
      AuthService.logout()
      commit('logout')
    }
  },
  getters: {
    isLoggedIn: state => state.status.loggedIn,
    currentUser: state => state.user,

    // --- 👇 ¡CAMBIOS AQUÍ! 👇 ---
    // Creamos dos nuevos 'getters' para consultar el rol fácilmente

    // Getter para obtener el string del rol (ej: 'admin', 'usuario')
    userRole: state => {
      return state.user ? state.user.rol : null;
    },

    // Getter de ayuda que nos dice true/false si es admin
    isAdmin: state => {
      return state.user && state.user.rol === 'admin';
    }
    // --- 👆 FIN DE LOS CAMBIOS 👆 ---
  }
})