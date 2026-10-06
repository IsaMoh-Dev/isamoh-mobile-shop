import axios from 'axios';

const api = axios.create({
  baseURL:         '/api',
  withCredentials: true,
  timeout:         30000,
  // Do NOT set Content-Type here globally — axios sets it automatically:
  // - 'application/json' for plain objects
  // - 'multipart/form-data; boundary=...' for FormData (with correct boundary)
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
