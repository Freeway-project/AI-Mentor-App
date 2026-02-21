import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  modalStack: string[];
  notifications: { id: string; type: 'success' | 'error' | 'info'; message: string }[];
}

const initialState: UiState = {
  sidebarOpen: true,
  modalStack: [],
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    pushModal(state, action: PayloadAction<string>) {
      state.modalStack.push(action.payload);
    },
    popModal(state) {
      state.modalStack.pop();
    },
    addNotification(state, action: PayloadAction<{ type: 'success' | 'error' | 'info'; message: string }>) {
      state.notifications.push({ ...action.payload, id: Date.now().toString() });
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
  },
});

export const { toggleSidebar, setSidebarOpen, pushModal, popModal, addNotification, removeNotification } = uiSlice.actions;
export default uiSlice.reducer;
