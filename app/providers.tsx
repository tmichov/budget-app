'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { CurrencyProvider } from '@/context/CurrencyContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CurrencyProvider>{children}</CurrencyProvider>
    </SessionProvider>
  );
}
