import api from './axios';

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  me: () => api.get('/auth/me'),
};

// Users
export const usersApi = {
  list: (params) => api.get('/users', { params }),
  search: (email) => api.get('/users/search', { params: { email } }),
  getById: (id) => api.get(`/users/${id}`),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  deactivate: (id) => api.delete(`/users/${id}`),
};

// Projects
export const projectsApi = {
  list: (params) => api.get('/projects', { params }),
  create: (data) => api.post('/projects', data),
  getById: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  archive: (id) => api.delete(`/projects/${id}`),
  getMembers: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
};

// Tasks
export const tasksApi = {
  list: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  getById: (id) => api.get(`/tasks/${id}`),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  assign: (id, assignee_id) => api.patch(`/tasks/${id}/assign`, { assignee_id }),
  getActivity: (id) => api.get(`/tasks/${id}/activity`),
};

// Comments
export const commentsApi = {
  add: (taskId, content) => api.post(`/tasks/${taskId}/comments`, { content }),
  edit: (id, content) => api.patch(`/comments/${id}`, { content }),
  delete: (id) => api.delete(`/comments/${id}`),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};
