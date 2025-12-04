'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { User as UserIcon } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import type { Currency } from '@/lib/currency';
import { CURRENCIES } from '@/lib/currency';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { currency, setCurrency } = useCurrency();
  const router = useRouter();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  if (!session?.user) {
    return null;
  }

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const handleCurrencyChange = async (newCurrency: Currency) => {
    setSelectedCurrency(newCurrency);
    await setCurrency(newCurrency);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-6 pb-32">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Profile
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <UserIcon size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {session?.user?.name}
              </h2>
              <p className="text-text-secondary">{session?.user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="py-4 border-t border-border">
              <p className="text-sm text-text-secondary mb-1">Email Address</p>
              <p className="text-foreground font-medium">{session?.user?.email}</p>
            </div>

            <div className="py-4 border-t border-border">
              <p className="text-sm text-text-secondary mb-1">Full Name</p>
              <p className="text-foreground font-medium">{session?.user?.name}</p>
            </div>

            <div className="py-4 border-t border-border">
              <p className="text-sm text-text-secondary mb-1">User ID</p>
              <p className="text-foreground font-medium">{session?.user?.id}</p>
            </div>

            <div className="py-4 border-t border-border">
              <p className="text-sm text-text-secondary mb-3">Currency</p>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(CURRENCIES) as Array<[Currency, any]>).map(
                  ([currencyCode, currencyInfo]) => (
                    <button
                      key={currencyCode}
                      onClick={() => handleCurrencyChange(currencyCode)}
                      className={`p-3 rounded-lg border-2 transition-colors text-center ${
                        selectedCurrency === currencyCode
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-foreground hover:border-primary/50'
                      }`}
                    >
                      <div className="text-lg font-bold mb-1">
                        {currencyInfo.symbol}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {currencyCode}
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          fullWidth
          onClick={handleLogout}
          className="text-red-600 border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
