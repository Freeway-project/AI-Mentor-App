import { frontendLogger } from './frontend-logger';

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

export class ApiError extends Error {
  code: string;
  data?: any;
  constructor(message: string, code: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.data = data;
  }
}

export interface MentorSearchQueryAnalysis {
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  focusTerms: string[];
  language?: string;
  maxRate?: number;
  semanticQuery?: string;
  topic?: string;
}

export interface MentorSearchResponse {
  mentors: any[];
  total: number;
  semantic?: boolean;
  hybrid?: boolean;
  llmEnhanced?: boolean;
  queryAnalysis?: MentorSearchQueryAnalysis;
}

export interface CareerTimelineEntry {
  title: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  summary?: string;
  capabilitiesUsed: string[];
}

export interface CareerExtractedProfile {
  summary: string;
  headline?: string;
  coreCapabilities: string[];
  tools: string[];
  domains: string[];
  functionalSkills: string[];
  communicationSkills: string[];
  leadershipSignals: string[];
  careerInterests: string[];
  certifications: string[];
  projects: Array<{ name: string; summary?: string; capabilitiesUsed: string[] }>;
  education: Array<{ institution: string; degree?: string; fieldOfStudy?: string; graduationYear?: string }>;
  experienceTimeline: CareerTimelineEntry[];
  seniorityEstimate: string;
  strengthSignals: string[];
  weakSignals: string[];
  confidence: number;
}

export interface CareerGoalInput {
  targetRole?: string;
  careerStageGoal?: string;
  timelineMonths?: number;
  focusAreas?: string[];
  weeklyHours?: number;
  maxBudget?: number;
  preferredLanguage?: string;
  freeformGoal?: string;
}

export interface CareerGoalProfile {
  targetRole: string;
  goalType: string;
  timelineMonths?: number;
  priorityAreas: string[];
  inferredCurrentLevel?: string;
  constraints: {
    weeklyHours?: number;
    maxBudget?: number;
    preferredLanguage?: string;
  };
  confidence: number;
  goalSummary: string;
}

export interface CareerAnalysis {
  currentLevelSummary: string;
  topStrengths: string[];
  primaryGaps: string[];
  recommendedFocusAreas: string[];
  recommendedLearningOrder: string[];
  explorationSuggestions: string[];
  briefPlan: string;
  mentorSearchQuery: string;
  generatedAt: string;
}

export interface CareerMentorRecommendation {
  mentorId: string;
  name: string;
  headline?: string;
  hourlyRate?: number;
  specialties: string[];
  matchScore?: number;
  matchReason?: string;
}

export interface CareerProfile {
  id: string;
  userId: string;
  status: 'idle' | 'ready' | 'failed';
  resume?: {
    fileName: string;
    mimeType: string;
    uploadedAt: string;
    textExtractedAt?: string;
  };
  rawText?: string;
  extractedProfile?: CareerExtractedProfile;
  goalProfile?: CareerGoalProfile;
  latestAnalysis?: CareerAnalysis;
  mentorRecommendations: CareerMentorRecommendation[];
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private onUnauthorized?: () => void;

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

  setOnUnauthorized(cb: () => void) {
    this.onUnauthorized = cb;
  }

  private isPublicAuthRequest(endpoint: string): boolean {
    return [
      '/auth/login',
      '/auth/register',
      '/auth/google',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/mentor-auth/register',
    ].includes(endpoint);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    const shouldAttachToken = this.token && !this.isPublicAuthRequest(endpoint);

    if (shouldAttachToken) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api${endpoint}`, {
        ...options,
        headers,
      });
    } catch (error) {
      frontendLogger.error('API request network failure', {
        endpoint,
        method: options.method || 'GET',
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError('Network error. Please try again.', 'NETWORK_ERROR');
    }

    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch (error) {
      frontendLogger.error('API response parse failure', {
        endpoint,
        method: options.method || 'GET',
        status: response.status,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError('Invalid server response', 'INVALID_RESPONSE');
    }

    if (response.status === 401) {
      frontendLogger.warn('API unauthorized response', {
        endpoint,
        method: options.method || 'GET',
        status: response.status,
        code: data.error?.code,
        requestId: data.error?.requestId,
      });
      if (shouldAttachToken) {
        this.clearToken();
        this.onUnauthorized?.();
      }

      throw new ApiError(
        data.error?.message || 'Unauthorized',
        data.error?.code || 'UNAUTHORIZED',
        data.data,
      );
    }

    if (!data.success) {
      frontendLogger.warn('API request failed', {
        endpoint,
        method: options.method || 'GET',
        status: response.status,
        code: data.error?.code,
        message: data.error?.message,
        requestId: data.error?.requestId,
      });
      throw new ApiError(
        data.error?.message || 'Request failed',
        data.error?.code || 'UNKNOWN_ERROR',
        data.data,
      );
    }

    return data.data as T;
  }

  /** Multipart/form-data upload — does NOT set Content-Type (browser handles boundary) */
  private async upload<T>(endpoint: string, formData: FormData, method = 'POST'): Promise<T> {
    const headers: Record<string, string> = {};
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api${endpoint}`, {
        method,
        headers,
        body: formData,
      });
    } catch (error) {
      frontendLogger.error('API upload network failure', {
        endpoint,
        method,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError('Network error. Please try again.', 'NETWORK_ERROR');
    }

    if (response.status === 401) {
      frontendLogger.warn('API upload unauthorized response', {
        endpoint,
        method,
        status: response.status,
      });
      this.clearToken();
      this.onUnauthorized?.();
      throw new Error('Unauthorized');
    }

    const data: ApiResponse<T> = await response.json();
    if (!data.success) {
      frontendLogger.warn('API upload failed', {
        endpoint,
        method,
        status: response.status,
        code: data.error?.code,
        message: data.error?.message,
        requestId: data.error?.requestId,
      });
      throw new Error(data.error?.message || 'Upload failed');
    }
    return data.data as T;
  }

  // Auth
  async register(email: string, password: string, name: string, role: string) {
    const endpoint = role === 'mentor' ? '/mentor-auth/register' : '/auth/register';
    return this.request<{ user: any; token: string; nextStep?: string }>(endpoint, {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role, phone: role === 'mentor' ? '0000000000' : undefined }),
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

  async googleAuth(idToken: string, role?: 'mentee' | 'mentor') {
    return this.request<{ user: any; token: string; isNew: boolean }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken, role }),
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

    return this.request<MentorSearchResponse>(`/mentors?${params.toString()}`);
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

  async getMyMentorProfiles() {
    return this.request<any[]>('/mentors/me/profiles');
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

  // Uploads
  async uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append('avatar', file);
    return this.upload<{ avatarUrl: string }>('/upload/avatar', fd);
  }

  async uploadCertification(file: File, name: string) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', name);
    return this.upload<{ certifications: any[] }>('/upload/certification', fd);
  }

  async deleteCertification(fileKey: string) {
    return this.request<any>('/upload/certification', {
      method: 'DELETE',
      body: JSON.stringify({ fileKey }),
    });
  }

  async uploadIntroVideo(file: File) {
    const fd = new FormData();
    fd.append('video', file);
    return this.upload<{ introVideoUrl: string }>('/upload/intro-video', fd);
  }

  async deleteIntroVideo() {
    return this.request<any>('/upload/intro-video', { method: 'DELETE' });
  }

  async uploadCareerResume(file: File) {
    const fd = new FormData();
    fd.append('resume', file);
    return this.upload<CareerProfile>('/career-profile/resume', fd);
  }

  async parseResume(file: File) {
    const fd = new FormData();
    fd.append('resume', file);
    return this.upload<{ extractedProfile: CareerExtractedProfile }>('/career-profile/parse', fd);
  }

  async getCareerProfile() {
    return this.request<CareerProfile | null>('/career-profile/me');
  }

  async analyzeCareerProfile(data: CareerGoalInput) {
    return this.request<CareerProfile>('/career-profile/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Google Calendar Integration
  startGoogleCalendarOAuth(): void {
    if (typeof window !== 'undefined') {
      // Pass token as query param since this is a browser redirect (no Authorization header)
      const token = this.token;
      const url = token
        ? `${this.baseUrl}/api/integrations/google/start?token=${encodeURIComponent(token)}`
        : `${this.baseUrl}/api/integrations/google/start`;
      window.location.href = url;
    }
  }

  async getGoogleCalendarStatus(): Promise<{ connected: boolean }> {
    return this.request<{ connected: boolean }>('/integrations/google/status');
  }

  async getGoogleCalendars(): Promise<{ calendars: { id: string; summary: string }[]; selectedCalendarIds: string[]; writeCalendarId: string }> {
    return this.request<any>('/integrations/google/calendars');
  }

  async saveSelectedCalendars(selectedCalendarIds: string[], writeCalendarId?: string): Promise<any> {
    return this.request<any>('/integrations/google/calendars/selected', {
      method: 'POST',
      body: JSON.stringify({ selectedCalendarIds, writeCalendarId }),
    });
  }

  async disconnectGoogleCalendar(): Promise<any> {
    return this.request<any>('/integrations/google/disconnect', { method: 'POST' });
  }

  // Booking / Slots
  async getAvailableSlots(mentorId: string, from: string, to: string, duration: number): Promise<{ slots: { start: string; end: string }[] }> {
    const params = new URLSearchParams({ from, to, duration: String(duration) });
    return this.request<{ slots: { start: string; end: string }[] }>(`/mentors/${mentorId}/slots?${params.toString()}`);
  }

  async createPaymentIntent(data: { mentorId: string; offerId?: string; scheduledAt: string; duration: number }): Promise<{ clientSecret: string; paymentIntentId: string; amountUsd: number; sessionTitle: string }> {
    return this.request('/payments/create-payment-intent', { method: 'POST', body: JSON.stringify(data) });
  }

  async createBooking(data: { mentorId: string; offerId?: string; scheduledAt: string; duration: number; title?: string; description?: string; paymentIntentId?: string; calBookingUid?: string }): Promise<any> {
    return this.request<any>('/bookings', { method: 'POST', body: JSON.stringify(data) });
  }

  async cancelCalBooking(uid: string): Promise<void> {
    return this.request(`/calcom/booking/${uid}`, { method: 'DELETE' });
  }

  async getMyBookings(params?: { status?: string; startDate?: string; endDate?: string }): Promise<{ meetings: any[] }> {
    const qs = new URLSearchParams(params as any).toString();
    return this.request<{ meetings: any[] }>(`/bookings/me${qs ? '?' + qs : ''}`);
  }

  async getBooking(id: string): Promise<any> {
    return this.request<any>(`/bookings/${id}`);
  }

  async getLivekitToken(meetingId: string): Promise<{ token: string; serverUrl: string; roomName: string }> {
    return this.request<{ token: string; serverUrl: string; roomName: string }>(`/bookings/${meetingId}/token`);
  }

  async cancelBooking(id: string, reason?: string): Promise<any> {
    return this.request<any>(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
  }

  async rescheduleBooking(id: string, scheduledAt: string): Promise<any> {
    return this.request<any>(`/bookings/${id}/reschedule`, { method: 'POST', body: JSON.stringify({ scheduledAt }) });
  }

  async getTranscript(meetingId: string): Promise<any> {
    return this.request<any>(`/bookings/${meetingId}/transcript`);
  }

  async rateBooking(id: string, body: { rating: number; review?: string }): Promise<any> {
    return this.request<any>(`/bookings/${id}/rate`, { method: 'POST', body: JSON.stringify(body) });
  }

  // Notifications
  async getNotifications(): Promise<{ notifications: any[]; unreadCount: number }> {
    return this.request<{ notifications: any[]; unreadCount: number }>('/notifications');
  }

  async markNotificationsRead(ids?: string[]): Promise<void> {
    await this.request<void>('/notifications/read', { method: 'POST', body: JSON.stringify({ ids }) });
  }

  async getMentorOffers(mentorId: string): Promise<any[]> {
    return this.request<any[]>(`/mentors/${mentorId}/offers`);
  }

  // Credits
  async getCreditsBalance(): Promise<{ balance: number; heldBalance: number }> {
    return this.request<{ balance: number; heldBalance: number }>('/credits/balance');
  }

  // Chat
  async getConversations(): Promise<any[]> {
    return this.request<any[]>('/chat/conversations');
  }

  async startConversation(mentorId: string): Promise<any> {
    return this.request<any>('/chat/conversations', { method: 'POST', body: JSON.stringify({ mentorId }) });
  }

  async getMessages(conversationId: string, params?: { before?: string; limit?: number }): Promise<any[]> {
    const qs = new URLSearchParams();
    if (params?.before) qs.set('before', params.before);
    if (params?.limit) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return this.request<any[]>(`/chat/conversations/${conversationId}/messages${q ? '?' + q : ''}`);
  }

  async sendChatMessage(conversationId: string, content: string): Promise<any> {
    return this.request<any>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async markConversationRead(conversationId: string): Promise<void> {
    await this.request<any>(`/chat/conversations/${conversationId}/read`, { method: 'POST' });
  }
}

export const apiClient = new ApiClient(API_URL);
