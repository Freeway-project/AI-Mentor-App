'use client';

import { Suspense, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useSearchParams } from 'next/navigation';

function RouteTransitionInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function RouteTransition({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen">{children}</div>}>
      <RouteTransitionInner>{children}</RouteTransitionInner>
    </Suspense>
  );
}
