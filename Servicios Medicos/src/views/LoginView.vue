<template>
  <div class="login-view">
    <LoginForm />
  </div>
</template>

<script>
import LoginForm from '@/components/LoginForm.vue';

export default {
  name: 'LoginView',
  components: {
    LoginForm
  },
  mounted() {
    if (this.$store.getters.isLoggedIn) {
      this.$router.push('/');
    }
  }
};
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>