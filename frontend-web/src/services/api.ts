import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (phone: string, password: string) =>
    api.post('/auth/login', { phone, password }),
  
  register: (data: {
    firstName: string;
    lastName: string;
    phone: string;
    password: string;
    role: string;
    location: { lat: number; lng: number };
    address?: string;
  }) => api.post('/auth/register', data),
  
  verifyPhone: (phone: string, code: string) =>
    api.post('/auth/verify-phone', { phone, code }),
  
  forgotPassword: (phone: string) =>
    api.post('/auth/forgot-password', { phone }),
  
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

// Products API
export const productsAPI = {
  getAll: () => api.get('/products'),
  
  getById: (id: string) => api.get(`/products/${id}`),
  
  getByFarmer: (farmerId: string) => api.get(`/products/farmer/${farmerId}`),
  
  create: (data: {
    name: string;
    description: string;
    category: string;
    price: number;
    unit: string;
    quantity: number;
    images?: string[];
  }) => api.post('/products', data),
  
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  
  delete: (id: string) => api.delete(`/products/${id}`),
  
  search: (query: string) => api.get(`/products/search?q=${query}`),
};

// Orders API
export const ordersAPI = {
  getAll: () => api.get('/orders'),
  
  getById: (id: string) => api.get(`/orders/${id}`),
  
  create: (data: {
    productId: string;
    quantity: number;
    buyerId: string;
    deliveryAddress: string;
    paymentMethod: string;
  }) => api.post('/orders', data),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  
  getByBuyer: (buyerId: string) => api.get(`/orders/buyer/${buyerId}`),
  
  getByFarmer: (farmerId: string) => api.get(`/orders/farmer/${farmerId}`),
};

export default api;

