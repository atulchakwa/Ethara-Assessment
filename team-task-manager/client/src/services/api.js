import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If not a 401 or already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    
    originalRequest._retry = true;
    
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token');
      }
      
      // Create a new axios instance without interceptors to avoid loop
      const response = await axios.post('/api/auth/refresh', {
        refreshToken: refreshToken
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const newToken = response.data.data.accessToken;
        localStorage.setItem('token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } else {
        throw new Error('Refresh failed');
      }
    } catch (refreshError) {
      console.error('Refresh token error:', refreshError);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
);

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  logoutAll: () => api.post('/auth/logout-all'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  setSecurityQuestions: (data) => api.put('/auth/security-questions', data),
  verifySecurityQuestions: (data) => api.post('/auth/verify-security-questions', data)
};

export const projectAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  updateMemberRole: (id, userId, data) => api.put(`/projects/${id}/members/${userId}`, data),
  leave: (id) => api.post(`/projects/${id}/leave`),
  getTasks: (id) => api.get(`/tasks/project/${id}`)
};

export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  getMy: () => api.get('/tasks/my')
};

export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  lock: (id) => api.post(`/users/${id}/lock`),
  unlock: (id) => api.post(`/users/${id}/unlock`),
  getActivity: (id) => api.get(`/users/${id}/activity`)
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
  getMyTasks: () => api.get('/dashboard/my-tasks'),
  getActivity: () => api.get('/dashboard/activity')
};

export default api;