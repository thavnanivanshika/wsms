import axios from 'axios';

// All requests go through Vite's /api proxy to the Spring Boot backend.
const client = axios.create({ baseURL: '/api' });

// Attach the JWT (if present) to every request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('wsms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear the stale token and bounce to login.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('wsms_token');
      localStorage.removeItem('wsms_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Pull a human-readable message out of an axios error.
export function errorMessage(err, fallback = 'Something went wrong') {
  return err?.response?.data?.message || err?.message || fallback;
}

// Extract structured field-level errors returned by the backend validation handler.
// Returns an object like { username: 'must not be blank', email: '...' } or {}.
export function fieldErrors(err) {
  return err?.response?.data?.errors || {};
}

export default client;
