'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { Currency } from '@/lib/currency';
import { useSession } from 'next-auth/react';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => Promise<void>;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update: updateSession } = useSession();

  // Get currency directly from session, defaulting to MKD
  const currency = useMemo(() => {
    if (!session?.user) return 'MKD' as Currency;
    const userCurrency = (session.user as any).currency as Currency | undefined;
    return userCurrency || ('MKD' as Currency);
  }, [session?.user?.currency]);

  const isLoading = status === 'loading';

  const setCurrency = async (newCurrency: Currency) => {
    try {
      // Save to database first
      const response = await fetch('/api/user/currency', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: newCurrency }),
      });

      if (!response.ok) {
        throw new Error('Failed to update currency');
      }

      // Force a complete session refresh to get the new currency from the JWT
      await updateSession();
    } catch (error) {
      console.error('Failed to save currency preference:', error);
      throw error;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}
