import axios from 'axios';

// La dirección del backend se puede cambiar en frontend/.env.local (VITE_API_URL)
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3010/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;