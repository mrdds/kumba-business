import api from './api.core';

export const getDashboardSummary = async () => (await api.get('/accounting/dashboard')).data;
export const getTransactions = async () => (await api.get('/accounting/transactions')).data;
export const getJournalEntry = async (id: number) => (await api.get(`/accounting/journal-entries/${id}`)).data;
export const getAccounts = async (type?: string) => (await api.get('/accounting/accounts', { params: { type } })).data;
export const getPnLReport = async (year?: number) => (await api.get('/reports/pnl', { params: { year } })).data;
export const getExportUrl = (type: string, year?: number) =>
    `/api/reports/export?type=${type}&year=${year || new Date().getFullYear()}`;
