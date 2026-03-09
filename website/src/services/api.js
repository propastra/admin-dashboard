import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5001/api`;


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
export const registerUser = (data) => api.post('/website/auth/register', data);
export const loginUser = (data) => api.post('/website/auth/login', data);
export const getMe = () => api.get('/website/auth/me');
export const updateProfile = (data) => api.put('/website/auth/profile', data);
export const sendOtp = (data) => api.post('/website/auth/send-otp', data);
export const verifyOtp = (data) => api.post('/website/auth/verify-otp', data);

// ======= PROPERTIES =======
export const getProperties = (params) => api.get('/website/properties', { params });
export const getFeaturedProperties = (city, category, excludeCity) => api.get('/website/properties/featured', { params: { city, category, excludeCity } });
export const getCities = () => api.get('/website/properties/cities');
export const getPropertyById = (id) => api.get(`/website/properties/${id}`);

// ======= FAVORITES =======
export const getFavorites = () => api.get('/website/favorites');
export const addFavorite = (propertyId) => api.post('/website/favorites', { propertyId });
export const removeFavorite = (propertyId) => api.delete(`/website/favorites/${propertyId}`);

// ======= ANALYTICS =======
export const trackInteraction = (data) => api.post('/analytics/track', data);
export const sendHeartbeat = (data) => api.post('/analytics/heartbeat', data);

// ======= INQUIRIES =======
export const submitInquiry = (data) => api.post('/inquiries', data);
export const getInquiries = () => api.get('/inquiries');
export const updateInquiryStatus = (id, data) => api.put(`/inquiries/${id}`, data);
export const getDashboardStats = () => api.get('/inquiries/dashboard/stats');

export { API_BASE };
export default api;
