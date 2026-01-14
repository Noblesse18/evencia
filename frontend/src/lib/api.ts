import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Intercepteur pour gérer les erreurs 401 (token expiré)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  verifyToken: () =>
    api.get('/auth/verify'),
  changePassword: (data: { oldPassword: string; newPassword: string; confirmPassword: string }) =>
    api.post('/auth/change-password', data),
};

// Events API
export interface EventFilters {
  category?: string;
  date_from?: string;
  date_to?: string;
  price_min?: number;
  price_max?: number;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const eventsAPI = {
  getAll: (filters?: EventFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    return api.get(`/events?${params.toString()}`);
  },
  getById: (id: string) => api.get(`/events/${id}`),
  getCategories: () => api.get('/events/categories'),
  getOrganizerEvents: () => api.get('/events/organizer/my-events'),
  create: (data: {
    title: string;
    description: string;
    category?: string;
    location: string;
    event_date: string;
    price?: number;
    max_tickets?: number | null;
    image_url?: string;
    photos?: string[];
  }) => api.post('/events', data),
  update: (id: string, data: Partial<{
    title: string;
    description: string;
    category: string;
    location: string;
    event_date: string;
    price: number;
    max_tickets: number | null;
    image_url: string;
    photos: string[];
  }>) => api.put(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
};

// Inscriptions API
export const inscriptionsAPI = {
  getMyInscriptions: () => api.get('/inscriptions/my'),
  create: (eventId: string) => api.post('/inscriptions', { event_id: eventId }),
  cancel: (id: string) => api.delete(`/inscriptions/${id}`),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  getMyProfile: () => api.get('/users/me'),
  updateMyProfile: (data: { name?: string; email?: string }) => api.put('/users/me', data),
};

// Payments API
export const paymentsAPI = {
  createPaymentIntent: (eventId: string) => api.post('/payments', { event_id: eventId }),
};

export default api;
