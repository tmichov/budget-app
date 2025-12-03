'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoansPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-6 pb-32">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Loans
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">🏦</div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Loans Coming Soon
          </h2>
          <p className="text-text-secondary">
            Track and manage all your bank loans and borrowings
          </p>
        </div>
      </div>
    </div>
  );
}
