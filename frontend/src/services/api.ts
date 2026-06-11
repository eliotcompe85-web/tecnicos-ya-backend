import axios from 'axios';
import * as storage from '@/src/utils/storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Services
export const authService = {
  register: async (data: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    role: 'client' | 'technician';
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Categories
export const categoryService = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
};

// Technicians
export const technicianService = {
  search: async (params: {
    category_id?: string;
    latitude?: number;
    longitude?: number;
    max_distance_km?: number;
    availability?: string;
  }) => {
    const response = await api.get('/technicians/search', { params });
    return response.data;
  },

  getProfile: async (userId: string) => {
    const response = await api.get(`/technicians/profile/${userId}`);
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/technicians/profile', data);
    return response.data;
  },
};

// Service Requests
export const serviceRequestService = {
  create: async (data: any) => {
    const response = await api.post('/service-requests', data);
    return response.data;
  },

  getAll: async (params?: any) => {
    const response = await api.get('/service-requests', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/service-requests/${id}`);
    return response.data;
  },
};

// Applications
export const applicationService = {
  create: async (data: any) => {
    const response = await api.post('/applications', data);
    return response.data;
  },

  getMyApplications: async () => {
    const response = await api.get('/applications/my-applications');
    return response.data;
  },

  accept: async (appId: string) => {
    const response = await api.put(`/applications/${appId}/accept`);
    return response.data;
  },
};

// Reviews
export const reviewService = {
  create: async (data: any) => {
    const response = await api.post('/reviews', data);
    return response.data;
  },
};

// Visits
export const visitService = {
  create: async (data: any) => {
    const response = await api.post('/visits', data);
    return response.data;
  },

  confirm: async (visitId: string) => {
    const response = await api.put(`/visits/${visitId}/confirm`);
    return response.data;
  },

  getMyVisits: async () => {
    const response = await api.get('/visits/my-visits');
    return response.data;
  },
};

export default api;