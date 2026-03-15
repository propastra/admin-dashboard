import axios from 'axios';

const envUrl = import.meta.env.VITE_API_URL || '';
const fallbackUrl = `http://${window.location.hostname}:5001/api`;
export const API_BASE_URL = (envUrl && !envUrl.includes('localhost')) ? envUrl.replace(/\/api$/, '') : `http://${window.location.hostname}:5001`;

const api = axios.create({
    baseURL: (envUrl && !envUrl.includes('localhost')) ? envUrl : fallbackUrl,
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Let the browser set the Content-Type with boundary for form data
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid, log out the user
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const getDevelopers = () => api.get('/developers');
export default api;
