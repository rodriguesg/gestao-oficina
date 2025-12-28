import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor para logs ou tratamento de erro global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`Erro na requisição ${error.config?.url}:`, error);
    return Promise.reject(error);
  }
);

export default api;