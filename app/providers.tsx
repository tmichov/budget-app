'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { ThemeProvider } from '@/context/ThemeContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CurrencyProvider>{children}</CurrencyProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
