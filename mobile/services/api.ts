import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

export const API_URL = 'http://192.168.1.72:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});



// ... (existing imports)

// ... (existing request interceptor)


let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
    logoutCallback = callback;
};

const handleLogout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    if (logoutCallback) {
        logoutCallback();
    } else {
        router.replace('/auth/sign-in');
    }
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = await SecureStore.getItemAsync('refresh_token');
                if (refreshToken) {
                    const response = await axios.post(`${API_URL}/token/refresh`, {
                        refresh: refreshToken,
                    });

                    const { access } = response.data;
                    await SecureStore.setItemAsync('access_token', access);

                    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
                    originalRequest.headers['Authorization'] = `Bearer ${access}`;

                    return api(originalRequest);
                } else {
                    await handleLogout();
                }
            } catch (refreshError) {
                console.log('Token refresh failed:', refreshError);
                await handleLogout();
            }
        }
        return Promise.reject(error);
    }
);

export default api;

export const getDashboardSummary = async () => {
    const response = await api.get('/accounting/dashboard');
    return response.data;
};

export const createTransaction = async (data: {
    amount: number;
    type: 'IN' | 'OUT';
    category: string;
    description?: string;
    date: string;
}) => {
    const response = await api.post('/accounting/transactions', data);
    return response.data;
};

export const getUserProfile = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export const updateUserProfile = async (data: any) => {
    const response = await api.put('/auth/me', data);
    return response.data;
};

export const changePassword = async (data: any) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
};

export const requestPasswordReset = async (email: string, source: 'web' | 'mobile' = 'web') => {
    let callback_url = undefined;
    if (source === 'mobile') {
        callback_url = Linking.createURL('auth/reset-password');
    }
    const response = await api.post('/auth/password-reset', { email, source, callback_url });
    return response.data;
};

export const confirmPasswordReset = async (data: any) => {
    const response = await api.post('/auth/password-reset/confirm', data);
    return response.data;
};

export const getEmployee = async (id: string | number) => {
    const response = await api.get(`/auth/employees/${id}`);
    return response.data;
};

export const getPermissions = async () => {
    const response = await api.get('/auth/permissions');
    return response.data;
};

export const getInvoices = async () => {
    const response = await api.get('/invoices');
    return response.data;
};

export const getInvoice = async (id: number) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
};

export const createInvoice = async (data: any) => {
    const response = await api.post('/invoices', data);
    return response.data;
};

export const getCustomers = async () => {
    const response = await api.get('/crm/customers');
    return response.data;
};

export const getPurchaseOrders = async () => {
    const response = await api.get('/purchasing/orders');
    return response.data;
};

export const getPurchaseOrder = async (id: number) => {
    const response = await api.get(`/purchasing/orders/${id}`);
    return response.data;
};

export const createCustomer = async (data: any) => {
    const response = await api.post('/crm/customers', data);
    return response.data;
};

export const getCustomer = async (id: number) => {
    const response = await api.get(`/crm/customers/${id}`);
    return response.data;
};

export const updateCustomer = async (id: number, data: any) => {
    const response = await api.put(`/crm/customers/${id}`, data);
    return response.data;
};

export const deleteCustomer = async (id: number) => {
    const response = await api.delete(`/crm/customers/${id}`);
    return response.data;
};




export const getTransactions = async () => {
    const response = await api.get('/accounting/transactions');
    return response.data;
};

// --- Quotes ---
export const getQuotes = async () => {
    const response = await api.get('/quotes');
    return response.data;
};

export const createQuote = async (data: any) => {
    const response = await api.post('/quotes', data);
    return response.data;
};

export const getQuote = async (id: number) => {
    const response = await api.get(`/quotes/${id}`);
    return response.data;
};

// --- Debts ---
export const getDebts = async (type?: string) => {
    const response = await api.get('/debts', { params: { type } });
    return response.data;
};

export const createDebt = async (data: any) => {
    const response = await api.post('/debts', data);
    return response.data;
};

export const payDebt = async (id: number, data: any) => {
    const response = await api.post(`/debts/${id}/pay`, data);
    return response.data;
};

// --- Tontines ---
export const getTontineGroups = async () => {
    const response = await api.get('/tontines');
    return response.data;
};

export const createTontineGroup = async (data: any) => {
    const response = await api.post('/tontines', data);
    return response.data;
};

export const getTontineMembers = async (groupId: number) => {
    const response = await api.get(`/tontines/${groupId}/members`);
    return response.data;
};

export const addTontineMember = async (groupId: number, data: any) => {
    const response = await api.post(`/tontines/${groupId}/members`, data);
    return response.data;
};

export const recordContribution = async (groupId: number, data: any) => {
    const response = await api.post(`/tontines/${groupId}/contribute`, data);
    return response.data;
};

export const getContributions = async (groupId: number) => {
    const response = await api.get(`/tontines/${groupId}/contributions`);
    return response.data;
};

// --- Reports ---
export const getPnLReport = async (year: number) => {
    const response = await api.get('/reports/pnl', { params: { year } });
    return response.data;
};

// --- Notifications ---
export const registerPushToken = async (token: string) => {
    const response = await api.post('/notifications/push-token', { token });
    return response.data;
};

// --- HR ---
export const checkIn = async (latitude?: number, longitude?: number) => {
    const response = await api.post('/hr/attendance/check-in', { latitude, longitude });
    return response.data;
};

export const checkOut = async () => {
    const response = await api.post('/hr/attendance/check-out');
    return response.data;
};

export const requestAdvance = async (amount: number, reason: string) => {
    const response = await api.post('/hr/advances', { amount, reason });
    return response.data;
};

export const getEmployees = async () => {
    const response = await api.get('/hr/employees');
    return response.data;
};

// --- Connect (Chat) ---
export const fetchConversations = async () => {
    const response = await api.get('/connect/conversations');
    return response.data;
};

export const createConversation = async (data: any) => {
    const response = await api.post('/connect/conversations', data);
    return response.data;
};

export const fetchMessages = async (conversationId: number) => {
    const response = await api.get(`/connect/conversations/${conversationId}/messages`);
    return response.data;
};



export const sendMessage = async (conversationId: number, data: any) => {
    const response = await api.post(`/connect/conversations/${conversationId}/messages`, data);
    return response.data;
};

// --- Approvals ---
export const getPendingApprovals = async () => {
    const response = await api.get('/approvals/pending');
    return response.data;
};

export const approveRequest = async (id: number, comments: string = '') => {
    const response = await api.post(`/approvals/${id}/approve`, { comments });
    return response.data;
};

export const rejectRequest = async (id: number, comments: string = '') => {
    const response = await api.post(`/approvals/${id}/reject`, { comments });
    return response.data;
};


