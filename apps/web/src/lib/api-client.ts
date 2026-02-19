const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    requestId?: string;
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data.data as T;
  }

  // Auth
  async register(email: string, password: string, name: string, role: string) {
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async verifyEmail(token: string) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async googleAuth(idToken: string) {
    return this.request<{ user: any; token: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Mentors
  async searchMentors(query?: string, filters?: any) {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.request<{ mentors: any[]; total: number }>(`/mentors?${params.toString()}`);
  }

  async getMentor(id: string) {
    return this.request<any>(`/mentors/${id}`);
  }

  async becomeMentor() {
    return this.request<any>('/mentors/become', { method: 'POST' });
  }

  async getMyMentorProfile() {
    return this.request<any>('/mentors/me');
  }

  async updateMyMentorProfile(data: any) {
    return this.request<any>('/mentors/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateMyAvailability(data: any) {
    return this.request<any>('/mentors/me/availability', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async publishProfile() {
    return this.request<any>('/mentors/me/publish', { method: 'POST' });
  }

  // Offers
  async getMyOffers() {
    return this.request<any[]>('/mentors/me/offers');
  }

  async createOffer(data: any) {
    return this.request<any>('/mentors/me/offers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOffer(offerId: string, data: any) {
    return this.request<any>(`/mentors/me/offers/${offerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOffer(offerId: string) {
    return this.request(`/mentors/me/offers/${offerId}`, { method: 'DELETE' });
  }

  // Policies
  async getMyPolicies() {
    return this.request<any>('/mentors/me/policies');
  }

  async upsertPolicies(data: any) {
    return this.request<any>('/mentors/me/policies', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient(API_URL);
