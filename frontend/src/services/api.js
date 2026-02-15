import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Response interceptor to unwrap data structure
// { success: true, data: [...] } -> [...]
api.interceptors.response.use(
    response => {
        if (response.data && response.data.data !== undefined) {
             // Handle the wrapped response format
             return { ...response, data: response.data.data };
        }
        return response;
    },
    error => {
        return Promise.reject(error);
    }
);

export const getUploadUrl = (path) => {
    if (!path) return '';
    const baseUrl = import.meta.env.VITE_API_URL || '';
    // If path is absolute URL, return it
    if (path.startsWith('http')) return path;
    // Clean path relative
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}/uploads/${cleanPath.split(/[\\/]/).pop()}`;
};

export default api;
