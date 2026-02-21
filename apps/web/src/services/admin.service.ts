import { apiFetch } from './api';

export interface AdminStats {
  totalUsers: number;
  activeCoaches: number;
  pendingApproval: number;
  sessionsByStatus: Record<string, number>;
  credits: { totalBalance: number; totalHeld: number; totalSpent: number };
}

export interface AdminCoach {
  id: string;
  name: string;
  headline?: string;
  bio?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalNote?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export interface AdminSession {
  id: string;
  menteeId: string;
  mentorId: string;
  menteeName?: string;
  mentorName?: string;
  title: string;
  scheduledAt: string;
  duration: number;
  status: string;
  creditCost: number;
}

export interface AdminTransaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  sessionId?: string;
  description: string;
  createdAt: string;
}

export const adminService = {
  getStats: () => apiFetch<AdminStats>('/admin/stats'),

  listCoaches: (params?: { approvalStatus?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.approvalStatus) q.set('approvalStatus', params.approvalStatus);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));
    return apiFetch<{ mentors: AdminCoach[]; total: number }>(`/admin/coaches?${q}`);
  },

  listPendingCoaches: (limit = 20, offset = 0) =>
    apiFetch<{ mentors: AdminCoach[]; total: number }>(`/admin/coaches/pending?limit=${limit}&offset=${offset}`),

  approveCoach: (id: string, note?: string) =>
    apiFetch(`/admin/coaches/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ note }),
    }),

  rejectCoach: (id: string, note: string) =>
    apiFetch(`/admin/coaches/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ note }),
    }),

  listUsers: (params?: { search?: string; role?: string; isActive?: boolean; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.role) q.set('role', params.role);
    if (params?.isActive !== undefined) q.set('isActive', String(params.isActive));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset !== undefined) q.set('offset', String(params.offset));
    return apiFetch<{ users: AdminUser[]; total: number }>(`/admin/users?${q}`);
  },

  suspendUser: (id: string) => apiFetch(`/admin/users/${id}/suspend`, { method: 'PUT' }),
  activateUser: (id: string) => apiFetch(`/admin/users/${id}/activate`, { method: 'PUT' }),

  listSessions: (params?: { status?: string; dateFrom?: string; dateTo?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.dateFrom) q.set('startDate', params.dateFrom);
    if (params?.dateTo) q.set('endDate', params.dateTo);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset !== undefined) q.set('offset', String(params.offset));
    return apiFetch<{ meetings: AdminSession[]; total: number }>(`/admin/sessions?${q}`);
  },

  listCredits: (params?: { type?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.type) q.set('type', params.type);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset !== undefined) q.set('offset', String(params.offset));
    return apiFetch<{ transactions: AdminTransaction[]; total: number; stats: any }>(`/admin/credits?${q}`);
  },
};
