import axios from 'axios';

const api = axios.create({
  baseURL:         '/api',
  withCredentials: true,
  timeout:         30000, // 30s — prevents infinite hangs on Render cold start
  headers: { 'Content-Type': 'application/json' },
});

// Global response interceptor — handle 401 gracefully
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(err);
  }
);

export default api;
