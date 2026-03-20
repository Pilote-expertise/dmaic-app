import axios from 'axios';
import type {
  User,
  Project,
  ToolDefinition,
  ToolInstance,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  Notification,
  ProjectDashboard,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dmaic_token');
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
      localStorage.removeItem('dmaic_token');
      localStorage.removeItem('dmaic_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ============
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },

  register: async (userData: RegisterData): Promise<{ message: string; requestId: string }> => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/reset-password', { token, password });
    return data;
  },
};

// ============ USERS ============
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const { data } = await api.get('/users');
    return data;
  },

  search: async (query: string): Promise<User[]> => {
    const { data } = await api.get('/users/search', { params: { q: query } });
    return data;
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  update: async (id: string, userData: Partial<User>): Promise<User> => {
    const { data } = await api.put(`/users/${id}`, userData);
    return data;
  },
};

// ============ PROJECTS ============
export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const { data } = await api.get('/projects');
    return data;
  },

  getById: async (id: string): Promise<Project & { phaseProgress: Array<{ phase: string; total: number; completed: number; progress: number }> }> => {
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },

  create: async (projectData: {
    name: string;
    code: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Project> => {
    const { data } = await api.post('/projects', projectData);
    return data;
  },

  update: async (id: string, projectData: Partial<Project>): Promise<Project> => {
    const { data } = await api.put(`/projects/${id}`, projectData);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  addMember: async (projectId: string, userId: string, role: 'EDITOR' | 'VIEWER'): Promise<void> => {
    await api.post(`/projects/${projectId}/members`, { userId, role });
  },

  removeMember: async (projectId: string, userId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/members/${userId}`);
  },
};

// ============ TOOLS ============
export const toolsApi = {
  getDefinitions: async (): Promise<ToolDefinition[]> => {
    const { data } = await api.get('/tools/definitions');
    return data.definitions;
  },

  getDefinitionsWithPhases: async (): Promise<{
    definitions: ToolDefinition[];
    byPhase: Record<string, ToolDefinition[]>;
  }> => {
    const { data } = await api.get('/tools/definitions');
    return data;
  },

  getDefinition: async (code: string): Promise<ToolDefinition> => {
    const { data } = await api.get(`/tools/definitions/${code}`);
    return data;
  },

  getProjectTools: async (projectId: string): Promise<ToolInstance[]> => {
    const { data } = await api.get(`/tools/project/${projectId}`);
    return data.tools;
  },

  getProjectToolsWithPhases: async (projectId: string): Promise<{
    tools: ToolInstance[];
    byPhase: Record<string, ToolInstance[]>;
  }> => {
    const { data } = await api.get(`/tools/project/${projectId}`);
    return data;
  },

  getTool: async (projectId: string, toolId: string): Promise<ToolInstance & { inheritedData?: Record<string, unknown> }> => {
    const { data } = await api.get(`/tools/project/${projectId}/tool/${toolId}`);
    return data;
  },

  updateTool: async (
    projectId: string,
    toolId: string,
    updates: { data?: Record<string, unknown>; status?: string }
  ): Promise<ToolInstance> => {
    const { data } = await api.put(`/tools/project/${projectId}/tool/${toolId}`, updates);
    return data;
  },

  updateToolInstance: async (
    toolId: string,
    updates: { data?: Record<string, unknown>; status?: string }
  ): Promise<ToolInstance> => {
    const { data } = await api.put(`/tools/instance/${toolId}`, updates);
    return data;
  },

  createToolInstance: async (instanceData: {
    projectId: string;
    toolDefinitionId: string;
    data: Record<string, unknown>;
  }): Promise<ToolInstance> => {
    const { data } = await api.post('/tools/instance', instanceData);
    return data;
  },

  addComment: async (projectId: string, toolId: string, content: string): Promise<void> => {
    await api.post(`/tools/project/${projectId}/tool/${toolId}/comment`, { content });
  },

  getVersions: async (projectId: string, toolId: string): Promise<Array<{
    id: string;
    version: number;
    data: Record<string, unknown>;
    createdAt: string;
    createdBy: { firstName: string; lastName: string };
  }>> => {
    const { data } = await api.get(`/tools/project/${projectId}/tool/${toolId}/versions`);
    return data;
  },

  addOptionalTool: async (projectId: string, toolDefinitionCode: string, phase?: string): Promise<ToolInstance> => {
    const { data } = await api.post(`/tools/project/${projectId}/add`, {
      toolDefinitionCode,
      phase,
    });
    return data;
  },
};

// ============ DASHBOARD ============
export const dashboardApi = {
  getOverview: async (): Promise<{
    projects: { byStatus: Array<{ status: string; _count: number }>; byPhase: Array<{ currentPhase: string; _count: number }>; total: number };
    users: { total: number };
    tools: { byStatus: Array<{ status: string; _count: number }> };
    recentActivity: Array<{ action: string; entityType: string; createdAt: string; user: { firstName: string; lastName: string }; project?: { name: string } }>;
  }> => {
    const { data } = await api.get('/dashboard/overview');
    return data;
  },

  getProjectDashboard: async (projectId: string): Promise<ProjectDashboard> => {
    const { data } = await api.get(`/dashboard/project/${projectId}`);
    return data;
  },

  getMyStats: async (): Promise<{
    projects: { owned: number; contributing: number; total: number };
    activity: { toolsCompletedThisMonth: number; recentContributions: Array<{ action: string; createdAt: string; project?: { name: string } }> };
  }> => {
    const { data } = await api.get('/dashboard/my-stats');
    return data;
  },
};

// ============ NOTIFICATIONS ============
export const notificationsApi = {
  getAll: async (unreadOnly = false): Promise<{
    notifications: Notification[];
    unreadCount: number;
  }> => {
    const { data } = await api.get('/notifications', {
      params: { unreadOnly },
    });
    return data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};

// ============ ADMIN ============
export const adminApi = {
  // Access Requests
  getAccessRequests: async (status?: string): Promise<any[]> => {
    const { data } = await api.get('/admin/access-requests', {
      params: status ? { status } : undefined,
    });
    return data;
  },

  approveRequest: async (id: string): Promise<{ message: string; user: any }> => {
    const { data } = await api.post(`/admin/access-requests/${id}/approve`);
    return data;
  },

  rejectRequest: async (id: string, reason?: string): Promise<{ message: string }> => {
    const { data } = await api.post(`/admin/access-requests/${id}/reject`, { reason });
    return data;
  },

  // Users
  getUsers: async (search?: string, role?: string): Promise<any[]> => {
    const { data } = await api.get('/admin/users', {
      params: { search, role },
    });
    return data;
  },

  updateUser: async (id: string, userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  }): Promise<any> => {
    const { data } = await api.put(`/admin/users/${id}`, userData);
    return data;
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/admin/users/${id}`);
    return data;
  },

  forcePasswordReset: async (userId: string): Promise<{ message: string }> => {
    const { data } = await api.post(`/admin/users/${userId}/reset-password`);
    return data;
  },

  // Stats
  getStats: async (): Promise<{
    users: { total: number; byRole: Record<string, number> };
    projects: { total: number; byStatus: Record<string, number> };
    tools: { total: number; byStatus: Record<string, number> };
    accessRequests: { pending: number };
    activity: { last7Days: number; byDay: Record<string, number> };
  }> => {
    const { data } = await api.get('/admin/stats');
    return data;
  },

  // Audit Logs
  getAuditLogs: async (params: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    logs: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const { data } = await api.get('/admin/audit-logs', { params });
    return data;
  },
};
