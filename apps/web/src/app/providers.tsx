'use client';

import { Provider, useDispatch } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useLayoutEffect } from 'react';
import { store } from '@/store';
import { AuthProvider } from '@/lib/auth-context';
import { pendingBookingActions } from '@/store/slices/pending-booking.slice';

function PendingBookingHydrate() {
  const dispatch = useDispatch();
  useLayoutEffect(() => {
    dispatch(pendingBookingActions.hydrate());
  }, [dispatch]);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      })
  );

  return (
    <Provider store={store}>
      <PendingBookingHydrate />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </Provider>
  );
}
