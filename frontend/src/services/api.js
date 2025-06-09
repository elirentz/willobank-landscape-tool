import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Response Error:', error);
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || 'Server error occurred';
      throw new Error(message);
    } else if (error.request) {
      // Network error
      throw new Error('Network error - please check your connection');
    } else {
      // Other error
      throw new Error('An unexpected error occurred');
    }
  }
);

// Requirements API
export const requirementsApi = {
  // Get all requirements (grouped by category)
  getAll: () => api.get('/requirements'),
  
  // Get specific requirement
  getById: (id) => api.get(`/requirements/${id}`),
  
  // Create new requirement
  create: (data) => api.post('/requirements', data),
  
  // Update requirement
  update: (id, data) => api.put(`/requirements/${id}`, data),
  
  // Delete requirement
  delete: (id) => api.delete(`/requirements/${id}`),
  
  // Reorder requirements within category
  reorder: (category, orderedIds) => api.post('/requirements/reorder', { category, orderedIds })
};

// Phases API (placeholder for future implementation)
export const phasesApi = {
  getAll: () => api.get('/phases'),
  getById: (id) => api.get(`/phases/${id}`),
  create: (data) => api.post('/phases', data),
  update: (id, data) => api.put(`/phases/${id}`, data),
  delete: (id) => api.delete(`/phases/${id}`)
};

// Plants API (placeholder for future implementation)
export const plantsApi = {
  getAll: () => api.get('/plants'),
  getByCategory: (category) => api.get(`/plants?category=${category}`),
  create: (data) => api.post('/plants', data),
  update: (id, data) => api.put(`/plants/${id}`, data),
  delete: (id) => api.delete(`/plants/${id}`)
};

// Compliance API (placeholder for future implementation)
export const complianceApi = {
  getAll: () => api.get('/compliance'),
  getByType: (type) => api.get(`/compliance?type=${type}`),
  create: (data) => api.post('/compliance', data),
  update: (id, data) => api.put(`/compliance/${id}`, data),
  delete: (id) => api.delete(`/compliance/${id}`)
};

// Health check
export const healthCheck = () => axios.get(`${API_BASE_URL}/health`);

export default api;

