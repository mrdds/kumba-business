import api from './api.core';

export const login = async (data: Record<string, string>) => (await api.post('/auth/pair/', data)).data;
export const register = async (data: Record<string, string>) => (await api.post('/id/register', data)).data;
export const changePassword = async (data: any) => (await api.post('/auth/change-password', data)).data;

export const getUserProfile = async () => (await api.get('/id/me')).data;
export const updateProfile = async (data: FormData | Record<string, any>) => (await api.post('/id/me', data)).data;

export const updateCompany = async (data: FormData | any) => (await api.post('/companies/me', data)).data;
export const createCompany = async (data: { name: string; sector: string; country: string; currency: string; tax_rate: number }) =>
    (await api.post('/companies/', data)).data;
export const updateSubscription = async (plan: string) => (await api.post('/companies/subscription', { plan })).data;

export const getPendingApprovals = async () => (await api.get('/approvals/pending')).data;
export const approveRequest = async (id: number, comments = '') => (await api.post(`/approvals/${id}/approve`, { comments })).data;
export const rejectRequest = async (id: number, comments = '') => (await api.post(`/approvals/${id}/reject`, { comments })).data;
export const getApprovalTimeline = async (id: number) => (await api.get(`/approvals/${id}/timeline`)).data;
