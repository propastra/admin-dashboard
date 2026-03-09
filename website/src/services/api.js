import axios from 'axios';

const envUrl = import.meta.env.VITE_API_URL || '';
// Use the env URL if set; otherwise auto-detect (useful when running on a server)
const API_BASE = envUrl || `http://${window.location.hostname}:5001`;

console.log('[API] Using backend:', API_BASE);


const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('website_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ======= AUTH =======
export const registerUser = (data) => api.post('/api/website/auth/register', data);
export const loginUser = (data) => api.post('/api/website/auth/login', data);
export const getMe = () => api.get('/api/website/auth/me');
export const updateProfile = (data) => api.put('/api/website/auth/profile', data);
export const sendOtp = (data) => api.post('/api/website/auth/send-otp', data);
export const verifyOtp = (data) => api.post('/api/website/auth/verify-otp', data);

// ======= PROPERTIES =======
export const getProperties = (params) => api.get('/api/website/properties', { params });
export const getFeaturedProperties = (city, category, excludeCity) => api.get('/api/website/properties/featured', { params: { city, category, excludeCity } });
export const getCities = () => api.get('/api/website/properties/cities');
export const getPropertyById = (id) => api.get(`/api/website/properties/${id}`);

// ======= FAVORITES =======
export const getFavorites = () => api.get('/api/website/favorites');
export const addFavorite = (propertyId) => api.post('/api/website/favorites', { propertyId });
export const removeFavorite = (propertyId) => api.delete(`/api/website/favorites/${propertyId}`);

// ======= ANALYTICS =======
export const trackInteraction = (data) => api.post('/api/analytics/track', data);
export const sendHeartbeat = (data) => api.post('/api/analytics/heartbeat', data);

// ======= INQUIRIES =======
export const submitInquiry = (data) => api.post('/api/inquiries', data);
export const getInquiries = () => api.get('/api/inquiries');
export const updateInquiryStatus = (id, data) => api.put(`/api/inquiries/${id}`, data);
export const getDashboardStats = () => api.get('/api/inquiries/dashboard/stats');

export { API_BASE };
export default api;
