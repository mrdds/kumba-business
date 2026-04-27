import api from './api.core';

export const submitToApproval = async (documentType: string, objectId: number) => 
    (await api.post(`/approvals/submit`, { document_type: documentType, object_id: objectId })).data;

export const getInvoices = async () => (await api.get('/invoices')).data;
export const getInvoice = async (id: number) => (await api.get(`/invoices/${id}`)).data;
export const createInvoice = async (data: any) => (await api.post('/invoices', data)).data;
export const updateInvoice = async (id: number, data: any) => (await api.put(`/invoices/${id}`, data)).data;
export const sendInvoiceEmail = async (id: number) => (await api.post(`/invoices/${id}/send-email`)).data;
export const submitInvoiceApproval = async (id: number) => (await api.post(`/invoices/${id}/submit-approval`)).data;

export const getQuotes = async () => (await api.get('/quotes')).data;
export const getQuote = async (id: number) => (await api.get(`/quotes/${id}`)).data;
export const createQuote = async (data: any) => (await api.post('/quotes', data)).data;
export const convertQuote = async (id: number) => (await api.post(`/quotes/${id}/convert`)).data;
export const submitQuoteApproval = async (id: number) => (await api.post(`/quotes/${id}/submit-approval`)).data;

export const getBills = async () => (await api.get('/bills')).data;
export const getBill = async (id: number) => (await api.get(`/bills/${id}`)).data;
export const createBill = async (data: any) => (await api.post('/bills', data)).data;
export const updateBill = async (id: number, data: any) => (await api.put(`/bills/${id}`, data)).data;

export const getPurchases = async () => (await api.get('/purchasing/orders')).data;
export const getPurchase = async (id: number) => (await api.get(`/purchasing/orders/${id}`)).data;
export const createPurchase = async (data: any) => (await api.post('/purchasing/orders', data)).data;
export const updatePurchase = async (id: number, data: any) => (await api.put(`/purchasing/orders/${id}`, data)).data;
export const deletePurchase = async (id: number) => (await api.delete(`/purchasing/orders/${id}`)).data;
export const cancelPurchase = async (id: number) => (await api.post(`/purchasing/orders/${id}/cancel`)).data;
export const submitPurchaseApproval = async (id: number) => (await api.post(`/purchasing/orders/${id}/submit-approval`)).data;

// ── FNE (Facture Normalisée Électronique - Côte d'Ivoire) ──────────────────
export const finalizeFNE = async (invoiceId: number) => 
    (await api.post(`/invoices/${invoiceId}/finalize-fne`)).data;

export const getFNEStatus = async (invoiceId: number) =>
    (await api.get(`/invoices/${invoiceId}/fne-status`)).data;

export const uploadPurchaseAttachment = async (id: number, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return (await api.post(`/purchasing/orders/${id}/attachment`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
};

export const getDebts = async (type?: string) => (await api.get('/debts', { params: { type } })).data;
export const createDebt = async (data: any) => (await api.post('/debts', data)).data;
export const payDebt = async (id: number, data: any) => (await api.post(`/debts/${id}/pay`, data)).data;

export const getBudgets = async () => (await api.get('/budgets')).data;
export const createBudget = async (data: any) => (await api.post('/budgets', data)).data;

// --- HR Requests (Advances, Leaves, etc.) ---
export const getHRRequests = async () => (await api.get('/hr/requests')).data;
export const createHRRequest = async (data: any) => (await api.post('/hr/requests', data)).data;
export const getHRRequest = async (id: number) => (await api.get(`/hr/requests/${id}`)).data;
