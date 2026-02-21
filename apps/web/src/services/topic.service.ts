import { apiFetch } from './api';

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  isActive: boolean;
  mentorCount: number;
  createdAt: string;
  updatedAt: string;
}

export const topicService = {
  listTopics: (params?: { limit?: number; offset?: number; category?: string; includeInactive?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset !== undefined) q.set('offset', String(params.offset));
    if (params?.category) q.set('category', params.category);
    if (params?.includeInactive) q.set('includeInactive', 'true');
    return apiFetch<{ topics: Topic[]; total: number }>(`/topics?${q}`);
  },

  getTopic: (id: string) => apiFetch<Topic>(`/topics/${id}`),

  createTopic: (data: { name: string; category: string; description?: string }) =>
    apiFetch<Topic>('/topics', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTopic: (id: string, data: { name?: string; category?: string; description?: string; isActive?: boolean }) =>
    apiFetch<Topic>(`/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTopic: (id: string) => apiFetch(`/topics/${id}`, { method: 'DELETE' }),
};
