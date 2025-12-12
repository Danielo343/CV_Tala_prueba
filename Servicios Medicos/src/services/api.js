import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// --- ¡AÑADE ESTO! ---
// Interceptor para añadir el token a CADA petición
api.interceptors.request.use(config => {
  // 1. Busca al usuario en localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  // 2. Si existe el usuario y tiene un token...
  if (user && user.accessToken) {
    // 3. Añade el encabezado de autorización
    // El formato es "Bearer TOKEN_LARGO"
    config.headers['Authorization'] = 'Bearer ' + user.accessToken;
  }
  return config;
}, error => {
  return Promise.reject(error);
});
// --- FIN DE LO AÑADIDO ---

export default api;