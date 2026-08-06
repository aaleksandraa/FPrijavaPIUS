import axios from 'axios';
import { safeAPICall } from './runtimeErrorHandling';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.prijava.pius-academy.com/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 15000, // 15 seconds timeout
});

// Log all requests for debugging
api.interceptors.request.use((config) => {
  try {
    console.log('🌐 Axios Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: (config.baseURL || '') + (config.url || ''),
      headers: config.headers,
      timeout: config.timeout,
    });
    
    const token = safeAPICall(
      () => localStorage.getItem('pius_admin_token'),
      null,
      'localStorage.getItem'
    );
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('❌ Error in request interceptor:', error);
  }
  
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => {
    try {
      console.log('✅ Axios Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
        dataType: typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
      });
    } catch (error) {
      console.error('❌ Error logging response:', error);
    }
    return response;
  },
  (error) => {
    try {
      console.error('❌ Axios Error:', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: (error.config?.baseURL || '') + (error.config?.url || ''),
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
      });
      
      if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
        const isAuthPage = /^\/admin\/(login|forgot-password|reset-password)\/?$/.test(
          window.location.pathname
        );

        safeAPICall(
          () => {
            localStorage.removeItem('pius_admin_token');
            localStorage.removeItem('pius_admin_session');
            if (!isAuthPage) {
              sessionStorage.setItem(
                'pius_admin_auth_error',
                'Sesija nije potvrdjena na serveru. Prijavite se ponovo.'
              );
            }
          },
          undefined,
          'localStorage.removeItem'
        );

        if (!isAuthPage) {
          window.location.href = '/admin/login';
        }
      }
    } catch (handlingError) {
      console.error('❌ Error in error handler:', handlingError);
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }, { skipAuthRedirect: true } as any);

export const logout = () => api.post('/auth/logout');

export const getMe = (config?: Record<string, any>) => api.get('/auth/me', config);

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email }, { skipAuthRedirect: true } as any);

export const resetPassword = (
  email: string,
  token: string,
  password: string,
  passwordConfirmation: string
) =>
  api.post(
    '/auth/reset-password',
    {
      email,
      token,
      password,
      password_confirmation: passwordConfirmation,
    },
    { skipAuthRedirect: true } as any
  );

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

export const sendInvoiceEmail = (invoiceId: string) => api.post(`/invoices/${invoiceId}/send`);

export const sendInvoiceTestEmail = (invoiceId: string) => api.post(`/invoices/${invoiceId}/send-test`);

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
