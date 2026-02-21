const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api${endpoint}`, { ...options, headers });
  const json = await res.json();

  if (!json.success) {
    const err = new Error(json.error?.message || 'Request failed') as any;
    err.code = json.error?.code;
    err.status = res.status;
    throw err;
  }

  return json.data as T;
}
