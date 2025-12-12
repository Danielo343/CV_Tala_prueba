<template>
  <div class="login-container">
    <div class="login-background">
      <div class="background-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>
    </div>
    
    <div class="login-card">
      <div class="card-header">
        <div class="logo-container">
          <div class="logo-icon">
            <i class="fas fa-ambulance"></i>
          </div>
          <h1>Sistema Prehospitalario</h1>
        </div>
        <p class="welcome-text">Bienvenido de vuelta</p>
      </div>
      
      <div class="card-body">
        <form @submit.prevent="handleLogin" class="login-form">
          <div v-if="message" :class="['alert-message', error ? 'error' : 'success']">
            <i :class="error ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'"></i>
            {{ message }}
          </div>
          
          <div class="form-group">
            <div class="input-container">
              <i class="input-icon fas fa-user"></i>
              <input
                type="text"
                class="form-input"
                v-model="user.username"
                required
                placeholder="Usuario"
              />
            </div>
          </div>

          <div class="form-group">
            <div class="input-container">
              <i class="input-icon fas fa-lock"></i>
              <input
                type="password"
                class="form-input"
                v-model="user.password"
                required
                placeholder="Contraseña"
              />
            </div>
          </div>

          <button class="login-button" :disabled="loading">
            <span v-if="loading" class="button-loading">
              <div class="spinner"></div>
              Iniciando sesión...
            </span>
            <span v-else class="button-content">
              <i class="fas fa-sign-in-alt"></i>
              Iniciar Sesión
            </span>
          </button>

          <div class="demo-credentials">
            <div class="divider">
              <span>-------------</span>
            </div>
            <div class="credentials-list">
              <div class="credential-item">
                <i class="fas fa-user-circle"></i>
                <span>Usuario: <strong>Danielo</strong></span>
              </div>
              <div class="credential-item">
                <i class="fas fa-key"></i>
                <span>Contraseña: <strong>asd123</strong></span>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <div class="card-footer">
        <p class="footer-text">
          <i class="fas fa-shield-alt"></i>
          Sistema seguro de gestión prehospitalaria
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginForm',
  data() {
    return {
      user: {
        username: "",
        password: ""
      },
      loading: false,
      message: "",
      error: false
    };
  },
  created() {
    if (this.$store.getters.isLoggedIn) {
      this.$router.push('/');
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      this.message = "";
      this.error = false;

      try {
        await this.$store.dispatch('login', this.user);
        this.$router.push('/');
      } catch (error) {
        this.loading = false;
        this.message = error.response?.data?.message || 'Error al iniciar sesión';
        this.error = true;
      }
    }
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.background-shapes {
  position: relative;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: -100px;
}

.shape-2 {
  width: 200px;
  height: 200px;
  bottom: -80px;
  left: -80px;
}

.shape-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 10%;
}

.shape-4 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  right: 15%;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 440px;
  overflow: hidden;
  position: relative;
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.card-header {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  padding: 40px 30px 30px;
  text-align: center;
}

.logo-container {
  margin-bottom: 15px;
}

.logo-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.9;
}

.card-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  margin-bottom: 8px;
}

.welcome-text {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 300;
}

.card-body {
  padding: 40px 30px;
}

.login-form {
  width: 100%;
}

.alert-message {
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  font-weight: 500;
}

.alert-message.error {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.2);
}

.alert-message.success {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.2);
}

.form-group {
  margin-bottom: 25px;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 15px;
  color: #6c757d;
  font-size: 1rem;
  z-index: 2;
}

.form-input {
  width: 100%;
  padding: 15px 15px 15px 45px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;
  font-weight: 400;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  transform: translateY(-2px);
}

.form-input::placeholder {
  color: #6c757d;
  font-weight: 300;
}

.login-button {
  width: 100%;
  padding: 15px 20px;
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 123, 255, 0.3);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.button-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.demo-credentials {
  margin-top: 30px;
}

.divider {
  text-align: center;
  position: relative;
  margin-bottom: 20px;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e9ecef;
}

.divider span {
  background: white;
  padding: 0 15px;
  color: #6c757d;
  font-size: 0.85rem;
  position: relative;
}

.credentials-list {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.credential-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 0.9rem;
  color: #495057;
}

.credential-item:last-child {
  margin-bottom: 0;
}

.credential-item i {
  color: #007bff;
  width: 16px;
}

.card-footer {
  background: #f8f9fa;
  padding: 20px 30px;
  text-align: center;
  border-top: 1px solid #e9ecef;
}

.footer-text {
  margin: 0;
  font-size: 0.85rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Responsive */
@media (max-width: 480px) {
  .login-container {
    padding: 15px;
  }
  
  .card-header {
    padding: 30px 20px 25px;
  }
  
  .card-body {
    padding: 30px 20px;
  }
  
  .logo-icon {
    font-size: 2.5rem;
  }
  
  .card-header h1 {
    font-size: 1.3rem;
  }
}

/* Efectos de animación suave */
.login-card {
  animation: cardEntrance 0.6s ease-out;
}

@keyframes cardEntrance {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.form-input:focus + .input-icon {
  color: #007bff;
}
</style>