import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 15000, // 15 seconds timeout
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pius_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pius_admin_token');
      localStorage.removeItem('pius_admin_session');
      window.location.href = '/?admin=true';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const logout = () => api.post('/auth/logout');

export const getMe = () => api.get('/auth/me');

// Students
export const getStudents = (params?: Record<string, string>) =>
  api.get('/students', { params });

export const createStudent = (data: any) => api.post('/students', data);

export const getStudent = (id: string) => api.get(`/students/${id}`);

export const updateStudent = (id: string, data: any) =>
  api.put(`/students/${id}`, data);

export const deleteStudent = (id: string) => api.delete(`/students/${id}`);

export const getStudentStats = () => api.get('/students/stats');

// Contracts
export const getContracts = () => api.get('/contracts');

export const createContract = (data: any) => api.post('/contracts', data);

export const getContract = (id: string) => api.get(`/contracts/${id}`);

export const previewContract = (studentId: string) =>
  api.post('/contracts/preview', { student_id: studentId });

export const downloadContractPdf = (id: string) =>
  api.get(`/contracts/${id}/pdf`, { responseType: 'blob' });

// Contract Templates
export const getContractTemplates = () => api.get('/contract-templates');

export const updateContractTemplate = (id: string, content: string) =>
  api.put(`/contract-templates/${id}`, { content });

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');

// Packages
export const getPackages = (includeInactive = false) => 
  api.get(`/packages${includeInactive ? '?include_inactive=1' : ''}`);

export const getPackage = (id: string) => api.get(`/packages/${id}`);

export const createPackage = (data: any) => api.post('/packages', data);

export const updatePackage = (id: string, data: any) =>
  api.put(`/packages/${id}`, data);

export const deletePackage = (id: string, force = false) => 
  api.delete(`/packages/${id}${force ? '?force=true' : ''}`);

// Invoices
export const getInvoices = () => api.get('/invoices');

export const getInvoice = (id: string) => api.get(`/invoices/${id}`);

export const createInvoice = (data: any) => api.post('/invoices', data);

export const updateInvoice = (id: string, data: any) =>
  api.put(`/invoices/${id}`, data);

export const deleteInvoice = (id: string) => api.delete(`/invoices/${id}`);

export const downloadInvoicePdf = (id: string) =>
  api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });

export const getStudentPaymentStatus = () => api.get('/invoices/payment-status');

export const getStudentsWithUnpaidInstallments = () => api.get('/invoices/students-unpaid');

export const sendPaymentReminder = (invoiceId: string) => api.post(`/invoices/${invoiceId}/send-reminder`);

// Settings
export const getSettings = () => api.get('/settings');

export const updateSettings = (data: any) => api.put('/settings', data);

// Landing Pages
export const getLandingPages = () => api.get('/landing-pages');

export const getLandingPage = (id: string) => api.get(`/landing-pages/${id}`);

export const getLandingPageBySlug = (slug: string) => api.get(`/landing-pages/slug/${slug}`);

export const createLandingPage = (data: any) => api.post('/landing-pages', data);

export const updateLandingPage = (id: string, data: any) => api.put(`/landing-pages/${id}`, data);

export const deleteLandingPage = (id: string) => api.delete(`/landing-pages/${id}`);
