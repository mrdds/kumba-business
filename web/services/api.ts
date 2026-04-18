import axios from 'axios';

// Use relative path to leverage Next.js Rewrites (Avoids CORS and IPv6 issues)
export const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        // No global Content-Type so Axios can auto-detect FormData
    },
});

api.interceptors.request.use(async (config) => {
    // Check if running in client side
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                // Only redirect if not already on auth pages
                if (!window.location.pathname.startsWith('/auth')) {
                    // [SSO] Redirect to Core Platform
                    const currentUrl = window.location.href;
                    window.location.href = `https://kumba-auth.trocplus.ci/login?redirect_url=${encodeURIComponent(currentUrl)}`;
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;

export const login = async (data: Record<string, string>) => {
    const response = await api.post('/auth/pair', data);
    return response.data;
};

export const register = async (data: Record<string, string>) => {
    const response = await api.post('/id/register', data);
    return response.data;
};

export const getDashboardSummary = async () => {
    const response = await api.get('/accounting/dashboard');
    return response.data;
};

export const getTransactions = async () => {
    const response = await api.get('/accounting/transactions');
    return response.data;
};

export const getJournalEntry = async (id: number) => {
    const response = await api.get(`/accounting/journal-entries/${id}`);
    return response.data;
};

export const getUserProfile = async () => {
    const response = await api.get('/id/me');
    return response.data;
};

export const updateProfile = async (data: FormData | Record<string, any>) => {
    const response = await api.post('/id/me', data);
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

export const sendInvoiceEmail = async (id: number) => {
    const response = await api.post(`/invoices/${id}/send-email`);
    return response.data;
};

export const submitInvoiceApproval = async (id: number) => {
    const response = await api.post(`/invoices/${id}/submit-approval`);
    return response.data;
};


export const getCustomers = async () => {
    const response = await api.get('/crm/customers');
    return response.data;
};

export const createCustomer = async (data: any) => {
    const response = await api.post('/crm/customers', data);
    return response.data;
};

export const getSupplier = async (id: number) => {
    const response = await api.get(`/crm/suppliers/${id}`);
    return response.data;
};

export const getSupplierFinancials = async (id: number) => {
    const response = await api.get(`/crm/suppliers/${id}/financials`);
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

// --- HR ---
export const getEmployees = async () => {
    const response = await api.get('/hr/employees');
    return response.data;
};

export const getMyEmployeeProfile = async () => {
    const response = await api.get('/hr/employees/me');
    return response.data;
};

export const getEmployee = async (id: number) => {
    const response = await api.get(`/hr/employees/${id}`);
    return response.data;
};

export const createEmployee = async (data: any) => {
    const response = await api.post('/hr/employees', data);
    return response.data;
};

export const updateEmployee = async (id: number, data: any) => {
    const response = await api.patch(`/hr/employees/${id}`, data);
    return response.data;
};

// --- WorkSites ---
export const getWorkSites = async () => {
    const response = await api.get('/hr/work-sites');
    return response.data;
};

export const createWorkSite = async (data: any) => {
    const response = await api.post('/hr/work-sites', data);
    return response.data;
};

export const updateWorkSite = async (id: number, data: any) => {
    const response = await api.patch(`/hr/work-sites/${id}`, data);
    return response.data;
};

export const deleteWorkSite = async (id: number) => {
    const response = await api.delete(`/hr/work-sites/${id}`);
    return response.data;
};

// --- Info Center ---
export const getInformations = async () => {
    const response = await api.get('/hr/informations');
    return response.data;
};

export const createInformation = async (data: { title: string; content: string; color: string }) => {
    const response = await api.post('/hr/informations', data);
    return response.data;
};

export const deleteInformation = async (id: number) => {
    const response = await api.delete(`/hr/informations/${id}`);
    return response.data;
};


export const changePassword = async (data: any) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
};

export const updateEmployeeHR = async (id: number, data: any) => {
    const response = await api.patch(`/hr/employees/${id}`, data);
    return response.data;
};

export const uploadEmployeePhoto = async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/hr/employees/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const updateEmployeeStatus = async (id: number, status: string) => {
    const response = await api.post(`/hr/employees/${id}/status`, { status });
    return response.data;
};

export const createSystemEmployee = async (data: any) => {
    const response = await api.post('/auth/employees', data);
    return response.data;
};

export const getPayrolls = async () => {
    const response = await api.get('/hr/payrolls');
    return response.data;
};

export const createPayroll = async (data: any) => {
    const response = await api.post('/hr/payrolls', data);
    return response.data;
};

export const getPayroll = async (id: number) => {
    const response = await api.get(`/hr/payrolls/${id}`);
    return response.data;
};

export const approvePayroll = async (id: number) => {
    const response = await api.post(`/hr/payrolls/${id}/approve`);
    return response.data;
};

export const submitPayrollApproval = async (id: number) => {
    const response = await api.post(`/hr/payrolls/${id}/submit-approval`);
    return response.data;
};


export const payPayroll = async (id: number, paymentAccountId: number) => {
    const response = await api.post(`/hr/payrolls/${id}/pay`, null, {
        params: { payment_account_id: paymentAccountId }
    });
    return response.data;
};

// --- Accounting ---
export const getAccounts = async (type?: string) => {
    const response = await api.get('/accounting/accounts', { params: { type } });
    return response.data;
};

// --- Budgets ---
export const getBudgets = async () => {
    const response = await api.get('/budgets');
    return response.data;
};

export const createBudget = async (data: any) => {
    const response = await api.post('/budgets', data);
    return response.data;
};

// --- Settings ---
export const updateCompany = async (data: FormData | any) => {
    const response = await api.post('/companies/me', data);
    return response.data;
};

export const createCompany = async (data: { name: string; sector: string; country: string; currency: string; tax_rate: number }) => {
    const response = await api.post('/companies/', data);
    return response.data;
};

export const updateSubscription = async (plan: string) => {
    const response = await api.post('/companies/subscription', { plan });
    return response.data;
};

// --- Quotes ---
export const getQuotes = async () => {
    const response = await api.get('/quotes');
    return response.data;
};

export const getQuote = async (id: number) => {
    const response = await api.get(`/quotes/${id}`);
    return response.data;
};

export const createQuote = async (data: any) => {
    const response = await api.post('/quotes', data);
    return response.data;
};

export const convertQuote = async (id: number) => {
    const response = await api.post(`/quotes/${id}/convert`);
    return response.data;
};

export const submitQuoteApproval = async (id: number) => {
    const response = await api.post(`/quotes/${id}/submit-approval`);
    return response.data;
};


// --- Reports ---
export const getPnLReport = async (year?: number) => {
    const response = await api.get('/reports/pnl', { params: { year } });
    return response.data;
};

export const getExportUrl = (type: string, year?: number) => {
    const baseUrl = 'http://localhost:8000/api'; // Business API port
    // Assuming we use the same base URL as configured in axios, but for direct link we need absolute or proxied
    // Let's rely on a helper or just return path if used in anchor href
    return `${baseUrl}/reports/export?type=${type}&year=${year || new Date().getFullYear()}`;
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

// --- HR Enhancements ---
export const getAttendance = async () => {
    const response = await api.get('/hr/attendance');
    return response.data;
};

export const getAdvances = async () => {
    const response = await api.get('/hr/advances');
    return response.data;
};

export const requestAdvance = async (data: any) => {
    const response = await api.post('/hr/advances', data);
    return response.data;
};

export const approveAdvance = async (id: number) => {
    const response = await api.patch(`/hr/advances/${id}/approve`);
    return response.data;
};

export const rejectAdvance = async (id: number) => {
    const response = await api.patch(`/hr/advances/${id}/reject`);
    return response.data;
};

// --- Suppliers ---
export const getSuppliers = async () => {
    const response = await api.get('/crm/suppliers');
    return response.data;
};

export const createSupplier = async (data: any) => {
    const response = await api.post('/crm/suppliers', data);
    return response.data;
};

// --- Purchasing ---
export const getPurchases = async () => {
    const response = await api.get('/purchasing/orders');
    return response.data;
};

export const createPurchase = async (data: any) => {
    const response = await api.post('/purchasing/orders', data);
    return response.data;
};

export const getPurchase = async (id: number) => {
    const response = await api.get(`/purchasing/orders/${id}`);
    return response.data;
};

export const deletePurchase = async (id: number) => {
    const response = await api.delete(`/purchasing/orders/${id}`);
    return response.data;
};

export const updatePurchase = async (id: number, data: any) => {
    const response = await api.put(`/purchasing/orders/${id}`, data);
    return response.data;
};


export const cancelPurchase = async (id: number) => {
    const response = await api.post(`/purchasing/orders/${id}/cancel`);
    return response.data;
};

export const submitPurchaseApproval = async (id: number) => {
    const response = await api.post(`/purchasing/orders/${id}/submit-approval`);
    return response.data;
};

export const uploadPurchaseAttachment = async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/purchasing/orders/${id}/attachment`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
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

export const getApprovalTimeline = async (id: number) => {
    const response = await api.get(`/approvals/${id}/timeline`);
    return response.data;
};
// Connect services moved to @/modules/connect/services/api.ts
