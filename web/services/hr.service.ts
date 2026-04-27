import api from './api.core';

export const getEmployees = async () => (await api.get('/hr/employees')).data;
export const getMyEmployeeProfile = async () => (await api.get('/hr/employees/me')).data;
export const getEmployee = async (id: number) => (await api.get(`/hr/employees/${id}`)).data;
export const createEmployee = async (data: any) => (await api.post('/hr/employees', data)).data;
export const updateEmployee = async (id: number, data: any) => (await api.patch(`/hr/employees/${id}`, data)).data;
export const updateEmployeeHR = async (id: number, data: any) => (await api.patch(`/hr/employees/${id}`, data)).data;
export const updateEmployeeStatus = async (id: number, status: string) => (await api.post(`/hr/employees/${id}/status`, { status })).data;
export const uploadEmployeePhoto = async (id: number, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return (await api.post(`/hr/employees/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
};
export const createSystemEmployee = async (data: any) => (await api.post('/hr/employees', data, { headers: { 'Content-Type': 'multipart/form-data' } })).data;

export const getPayrolls = async () => (await api.get('/hr/payrolls')).data;
export const getPayroll = async (id: number) => (await api.get(`/hr/payrolls/${id}`)).data;
export const createPayroll = async (data: any) => (await api.post('/hr/payrolls', data)).data;
export const approvePayroll = async (id: number) => (await api.post(`/hr/payrolls/${id}/approve`)).data;
export const submitPayrollApproval = async (id: number) => (await api.post(`/hr/payrolls/${id}/submit-approval`)).data;
export const payPayroll = async (id: number, paymentAccountId: number) =>
    (await api.post(`/hr/payrolls/${id}/pay`, null, { params: { payment_account_id: paymentAccountId } })).data;

export const getAttendance = async () => (await api.get('/hr/attendance')).data;

export const getAdvances = async () => (await api.get('/hr/advances')).data;
export const requestAdvance = async (data: any) => (await api.post('/hr/advances', data)).data;
export const approveAdvance = async (id: number) => (await api.patch(`/hr/advances/${id}/approve`)).data;
export const rejectAdvance = async (id: number) => (await api.patch(`/hr/advances/${id}/reject`)).data;

export const getWorkSites = async () => (await api.get('/hr/work-sites')).data;
export const createWorkSite = async (data: any) => (await api.post('/hr/work-sites', data)).data;
export const updateWorkSite = async (id: number, data: any) => (await api.patch(`/hr/work-sites/${id}`, data)).data;
export const deleteWorkSite = async (id: number) => (await api.delete(`/hr/work-sites/${id}`)).data;

export const getInformations = async () => (await api.get('/hr/informations')).data;
export const createInformation = async (data: { title: string; content: string; color: string }) =>
    (await api.post('/hr/informations', data)).data;
export const deleteInformation = async (id: number) => (await api.delete(`/hr/informations/${id}`)).data;
