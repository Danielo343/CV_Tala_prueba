import axios from 'axios';

const API_URL = 'http://localhost:3001/api/auth';

class AuthService {
  login(user) {
    return axios
      .post(API_URL + '/login', {
        username: user.username,
        password: user.password
      })
      .then(response => {
        if (response.data.accessToken) {
          localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
      });
  }

  logout() {
    localStorage.removeItem('user');
  }

  register(user) {
    return axios.post(API_URL + '/register', {
      username: user.username,
      email: user.email,
      password: user.password
    });
  }

  // AÑADE ESTA NUEVA FUNCIÓN:
  verify() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.accessToken) {
      return Promise.reject('No token found');
    }
    
    return axios.get(API_URL + '/verify', {
      headers: {
        'Authorization': 'Bearer ' + user.accessToken
      }
    });
  }
}

export default new AuthService();