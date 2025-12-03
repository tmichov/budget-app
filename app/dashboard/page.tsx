'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TrendingUp, BarChart3, Target, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-text-secondary">
            Here's an overview of your finances
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
            <TrendingUp className="text-primary mb-3" size={28} />
            <h3 className="font-semibold text-foreground mb-1">Total Balance</h3>
            <p className="text-text-secondary text-sm">Coming soon</p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
            <BarChart3 className="text-primary mb-3" size={28} />
            <h3 className="font-semibold text-foreground mb-1">Monthly Spending</h3>
            <p className="text-text-secondary text-sm">Coming soon</p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
            <Target className="text-primary mb-3" size={28} />
            <h3 className="font-semibold text-foreground mb-1">Budget Status</h3>
            <p className="text-text-secondary text-sm">Coming soon</p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
            <AlertCircle className="text-primary mb-3" size={28} />
            <h3 className="font-semibold text-foreground mb-1">Upcoming Bills</h3>
            <p className="text-text-secondary text-sm">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
