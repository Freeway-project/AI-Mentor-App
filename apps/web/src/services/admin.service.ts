import { apiFetch } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export interface CreateCoachInput {
  email: string;
  password?: string;
  name: string;
  headline?: string;
  bio?: string;
  specialties?: string[];
  expertise?: string[];
  languages?: string[];
  hourlyRate?: number;
}

export interface CreateCoachResult {
  mentor: AdminCoach & { id: string };
  user: { id: string; email: string; name: string };
  isExistingUser: boolean;
  generatedPassword?: string;
}

export interface MentorExtractedFields {
  name: string;
  email: string;
  headline: string;
  bio: string;
  specialties: string[];
  expertise: string[];
  languages: string[];
  certificationNames: string[];
}

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

export interface AdminServiceUsageOverview {
  totalCalls: number;
  totalUsage: number;
  successCount: number;
  failureCount: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  averageDurationMs: number;
  totalEstimatedCostUsd: number;
  uniqueServices: number;
}

export interface AdminServiceUsageGroup {
  service: string;
  provider: string;
  totalCalls: number;
  totalUsage: number;
  successCount: number;
  failureCount: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  averageDurationMs: number;
  totalEstimatedCostUsd: number;
  lastUsedAt?: string;
  operations: string[];
}

export interface AdminServiceUsageRecord {
  id: string;
  service: string;
  provider: string;
  operation: string;
  model?: string;
  status: 'success' | 'failed';
  usageCount: number;
  durationMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminServiceUsageFilters {
  days: number;
  since: string;
  limit: number;
  offset: number;
  service?: string;
  provider?: string;
  status?: 'success' | 'failed';
}

export interface AdminServiceUsageResponse {
  overview: AdminServiceUsageOverview;
  services: AdminServiceUsageGroup[];
  records: AdminServiceUsageRecord[];
  total: number;
  filters: AdminServiceUsageFilters;
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

  getServiceUsage: (params?: {
    days?: number;
    service?: string;
    provider?: string;
    status?: 'success' | 'failed';
    limit?: number;
    offset?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.days) q.set('days', String(params.days));
    if (params?.service) q.set('service', params.service);
    if (params?.provider) q.set('provider', params.provider);
    if (params?.status) q.set('status', params.status);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset !== undefined) q.set('offset', String(params.offset));
    return apiFetch<AdminServiceUsageResponse>(`/admin/service-usage?${q}`);
  },

  getCoachById: (id: string) => apiFetch<any>(`/admin/coaches/${id}`),

  // ─── Marketing ────────────────────────────────────────────────────────────
  getMarketingTemplates: () => apiFetch<any[]>('/admin/marketing/templates'),

  createMarketingTemplate: (data: { name: string; subject: string; bodyHtml: string }) =>
    apiFetch<any>('/admin/marketing/templates', { method: 'POST', body: JSON.stringify(data) }),

  updateMarketingTemplate: (id: string, data: { name?: string; subject?: string; bodyHtml?: string }) =>
    apiFetch<any>(`/admin/marketing/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteMarketingTemplate: (id: string) =>
    apiFetch(`/admin/marketing/templates/${id}`, { method: 'DELETE' }),

  sendCampaign: (templateId: string, recipients: { name: string; email: string }[]) =>
    apiFetch<{ campaignRunId: string; total: number }>('/admin/marketing/send', {
      method: 'POST',
      body: JSON.stringify({ templateId, recipients }),
    }),

  getCampaignRun: (runId: string) => apiFetch<any>(`/admin/marketing/campaigns/${runId}`),

  listCampaignRuns: () => apiFetch<any[]>('/admin/marketing/campaigns'),

  createCoach: (data: CreateCoachInput) =>
    apiFetch<CreateCoachResult>('/admin/coaches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  parseResumeForMentor: async (file: File): Promise<{ mentorFields: MentorExtractedFields }> => {
    const formData = new FormData();
    formData.append('resume', file);
    const token = getToken();
    const res = await fetch(`${API_URL}/api/admin/coaches/parse-resume`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const json = await res.json();
    if (!json.success) {
      const err = new Error(json.error?.message || 'Resume parse failed') as any;
      err.code = json.error?.code;
      throw err;
    }
    return json.data;
  },
};
