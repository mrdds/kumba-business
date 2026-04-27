import api from './api.core';

export const getCustomers = async () => (await api.get('/crm/customers')).data;
export const getCustomer = async (id: number) => (await api.get(`/crm/customers/${id}`)).data;
export const createCustomer = async (data: any) => (await api.post('/crm/customers', data)).data;
export const updateCustomer = async (id: number, data: any) => (await api.put(`/crm/customers/${id}`, data)).data;
export const deleteCustomer = async (id: number) => (await api.delete(`/crm/customers/${id}`)).data;

export const getSuppliers = async () => (await api.get('/crm/suppliers')).data;
export const getSupplier = async (id: number) => (await api.get(`/crm/suppliers/${id}`)).data;
export const getSupplierFinancials = async (id: number) => (await api.get(`/crm/suppliers/${id}/financials`)).data;
export const createSupplier = async (data: any) => (await api.post('/crm/suppliers', data)).data;

export const getTontineGroups = async () => (await api.get('/tontines')).data;
export const createTontineGroup = async (data: any) => (await api.post('/tontines', data)).data;
export const getTontineMembers = async (groupId: number) => (await api.get(`/tontines/${groupId}/members`)).data;
export const addTontineMember = async (groupId: number, data: any) => (await api.post(`/tontines/${groupId}/members`, data)).data;
export const recordContribution = async (groupId: number, data: any) => (await api.post(`/tontines/${groupId}/contribute`, data)).data;
export const getContributions = async (groupId: number) => (await api.get(`/tontines/${groupId}/contributions`)).data;
