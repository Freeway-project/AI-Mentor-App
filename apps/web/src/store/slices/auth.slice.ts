import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  avatar?: string;
  timezone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api${endpoint}`, { ...options, headers });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Request failed');
  return json.data as T;
}

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async (_, { rejectWithValue }) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return null;
    const user = await apiFetch<AuthUser>('/auth/me', {}, token);
    return { user, token };
  } catch {
    if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
    return null;
  }
});

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const data = await apiFetch<{ user: AuthUser; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (typeof window !== 'undefined') localStorage.setItem('auth_token', data.token);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    { email, password, name, role }: { email: string; password: string; name: string; role: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await apiFetch<{ user: AuthUser; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role }),
      });
      if (typeof window !== 'undefined') localStorage.setItem('auth_token', data.token);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState: AuthState = {
  user: null,
  token: null,
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
    },
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
    },
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      if (typeof window !== 'undefined') localStorage.setItem('auth_token', action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => { state.loading = true; })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
        }
      })
      .addCase(bootstrapAuth.rejected, (state) => { state.loading = false; })
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, setUser, setToken } = authSlice.actions;
export default authSlice.reducer;
