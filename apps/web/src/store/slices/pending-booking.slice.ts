import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { PendingBookingIntent } from '@/lib/pending-booking';
import {
  clearPendingIntentStorage,
  readPendingIntentFromStorage,
  writePendingIntentToStorage,
} from '@/lib/pending-booking';

export type PendingBookingState = {
  /** Mirrors localStorage after hydrate / save / clear. */
  intent: PendingBookingIntent | null;
};

const initialState: PendingBookingState = {
  intent: null,
};

const pendingBookingSlice = createSlice({
  name: 'pendingBooking',
  initialState,
  reducers: {
    hydrate(state) {
      state.intent = readPendingIntentFromStorage();
    },
    saveIntent(state, action: PayloadAction<Omit<PendingBookingIntent, 'savedAt'>>) {
      const intent: PendingBookingIntent = { ...action.payload, savedAt: Date.now() };
      state.intent = intent;
      writePendingIntentToStorage(intent);
    },
    clearIntent(state) {
      state.intent = null;
      clearPendingIntentStorage();
    },
  },
});

export const pendingBookingActions = pendingBookingSlice.actions;
export default pendingBookingSlice.reducer;
