import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fieldops_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fieldops_token');
      localStorage.removeItem('fieldops_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Tasks API
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// Inventory API
export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
};

// Team API
export const teamAPI = {
  getAll: (params) => api.get('/team', { params }),
  update: (id, data) => api.put(`/team/${id}`, data),
  updateLocation: (id, data) => api.put(`/team/${id}/location`, data),
};

// Weather API
export const weatherAPI = {
  get: (lat, lon) => api.get('/weather', { params: { lat, lon } }),
};

// Analytics API
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getPerformance: (days) => api.get('/analytics/performance', { params: { days } }),
};

// Subscription API
export const subscriptionAPI = {
  getPlans: () => api.get('/plans'),
  getSubscription: () => api.get('/subscription'),
  createCheckout: (planId) => api.post('/checkout', { 
    plan_id: planId, 
    origin_url: window.location.origin 
  }),
  getCheckoutStatus: (sessionId) => api.get(`/checkout/status/${sessionId}`),
};

// Customers API
export const customersAPI = {
  getAll: () => api.get('/customers'),
  getOne: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Quotes API
export const quotesAPI = {
  getAll: (params) => api.get('/quotes', { params }),
  create: (data) => api.post('/quotes', data),
  send: (id) => api.post(`/quotes/${id}/send`),
  delete: (id) => api.delete(`/quotes/${id}`),
};

// Invoices API
export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  create: (data) => api.post('/invoices', data),
  send: (id) => api.post(`/invoices/${id}/send`),
  delete: (id) => api.delete(`/invoices/${id}`),
};

// Public Portal API (no auth)
export const portalAPI = {
  getQuote: (id) => api.get(`/portal/quote/${id}`),
  acceptQuote: (id) => api.post(`/portal/quote/${id}/accept`),
  declineQuote: (id) => api.post(`/portal/quote/${id}/decline`),
  getInvoice: (id) => api.get(`/portal/invoice/${id}`),
  getCustomerJobs: (customerId) => api.get(`/portal/customer/${customerId}/jobs`),
};

export default api;
