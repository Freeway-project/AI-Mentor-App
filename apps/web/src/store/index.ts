import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth.slice';
import uiReducer from './slices/ui.slice';
import pendingBookingReducer from './slices/pending-booking.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    pendingBooking: pendingBookingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
