import axios from 'axios';

const api = axios.create({
  baseURL:        '/api',
  withCredentials: true, // send httpOnly cookies on every request
  headers: { 'Content-Type': 'application/json' },
});

// Global response interceptor — handle 401 gracefully
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Token expired or missing — clear local state (AuthContext handles redirect)
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(err);
  }
);

export default api;
