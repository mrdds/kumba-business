/**
 * api.core.ts — Axios instance only.
 * Import this in all service files. Never import the full api.ts.
 */
import axios from 'axios';

export const API_URL = '/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        const lang = localStorage.getItem('app_language');
        if (lang) config.headers['Accept-Language'] = lang;
    }
    return config;
});

api.interceptors.response.use(
    (r) => r,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            if (!window.location.pathname.startsWith('/auth')) {
                const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001/dashboard';
                const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3002';
                window.location.href = `${authUrl}/login?redirect_url=${encodeURIComponent(redirectUrl)}`;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
