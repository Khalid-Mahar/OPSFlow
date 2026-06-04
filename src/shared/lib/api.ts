import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem('refreshToken');
      if (refresh) {
        try {
          const res = await axios.post('/api/auth/refresh', { refreshToken: refresh });
          const newToken = res.data.data.token;
          localStorage.setItem('token', newToken);
          err.config.headers.Authorization = `Bearer ${newToken}`;
          return api(err.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────
export const authAPI = {
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: (token: string) => api.post('/auth/refresh', { refreshToken: token }),
  changePassword: (data: any) => api.post('/auth/change-password', data),
};

// ── Users ─────────────────────────────────
export const userAPI = {
  list: (p?: any) => api.get('/users', { params: p }),
  create: (data: any) => api.post('/users', data),
  updateRole: (id: string, roleId: string) => api.put(`/users/${id}/role`, { roleId }),
  updateStatus: (id: string, status: string) => api.put(`/users/${id}/status`, { status }),
};

// ── Employees ─────────────────────────────
export const employeeAPI = {
  list: (p?: any) => api.get('/employees', { params: p }),
  get: (id: string) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  update: (id: string, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
  uploadDoc: (id: string, fd: FormData) => api.post(`/employees/${id}/documents`, fd),
};

// ── Assets ────────────────────────────────
export const assetAPI = {
  list: (p?: any) => api.get('/assets', { params: p }),
  get: (id: string) => api.get(`/assets/${id}`),
  create: (data: any) => api.post('/assets', data),
  update: (id: string, data: any) => api.put(`/assets/${id}`, data),
  assign: (id: string, employeeId: string) => api.post(`/assets/${id}/assign`, { employeeId }),
  delete: (id: string) => api.delete(`/assets/${id}`),
};

// ── SIMs ──────────────────────────────────
export const simAPI = {
  list: (p?: any) => api.get('/sims', { params: p }),
  create: (data: any) => api.post('/sims', data),
  update: (id: string, data: any) => api.put(`/sims/${id}`, data),
  delete: (id: string) => api.delete(`/sims/${id}`),
  cameras: () => api.get('/sims/cameras'),
  createCamera: (data: any) => api.post('/sims/cameras', data),
};

// ── Credentials ───────────────────────────
export const credentialAPI = {
  list: (p?: any) => api.get('/credentials', { params: p }),
  create: (data: any) => api.post('/credentials', data),
  update: (id: string, data: any) => api.put(`/credentials/${id}`, data),
  reveal: (id: string, reason?: string) => api.get(`/credentials/${id}/reveal`, { data: { reason } }),
};

// ── Projects ──────────────────────────────
export const projectAPI = {
  list: (p?: any) => api.get('/projects', { params: p }),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  addDiscussion: (id: string, data: any) => api.post(`/projects/${id}/discussions`, data),
  addMilestone: (id: string, data: any) => api.post(`/projects/${id}/milestones`, data),
};

// ── Tasks ─────────────────────────────────
export const taskAPI = {
  list: (p?: any) => api.get('/tasks', { params: p }),
  kanban: (p?: any) => api.get('/tasks/kanban', { params: p }),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/tasks/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  addComment: (id: string, content: string) => api.post(`/tasks/${id}/comments`, { content }),
};

// ── Todos ─────────────────────────────────
export const todoAPI = {
  list: (p?: any) => api.get('/todos', { params: p }),
  create: (data: any) => api.post('/todos', data),
  update: (id: string, data: any) => api.put(`/todos/${id}`, data),
  complete: (id: string) => api.patch(`/todos/${id}/complete`),
  delete: (id: string) => api.delete(`/todos/${id}`),
};

// ── Files ─────────────────────────────────
export const fileAPI = {
  list: (p?: any) => api.get('/files', { params: p }),
  upload: (fd: FormData) => api.post('/files/upload', fd),
  delete: (id: string) => api.delete(`/files/${id}`),
};

// ── Notifications ─────────────────────────
export const notificationAPI = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// ── Audit ─────────────────────────────────
export const auditAPI = {
  list: (p?: any) => api.get('/audit', { params: p }),
};

// ── Dashboard ─────────────────────────────
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
  charts: () => api.get('/dashboard/charts'),
};

// ── Tickets ───────────────────────────────
export const ticketAPI = {
  list: (p?: any) => api.get('/tickets', { params: p }),
  create: (data: any) => api.post('/tickets', data),
  update: (id: string, data: any) => api.put(`/tickets/${id}`, data),
  addComment: (id: string, content: string) => api.post(`/tickets/${id}/comments`, { content }),
};
