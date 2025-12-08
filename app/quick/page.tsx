'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useApi } from '@/hooks/useApi';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { DatePicker } from '@/components/DatePicker';
import { ChevronLeft } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
}

function QuickAddContent() {
  const { data: session, status } = useSession();
  const { currency } = useCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { request } = useApi();

  const isMinimal = searchParams.get('minimal') === 'true';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [type, setType] = useState<'expense' | 'income'>(
    (searchParams.get('type') as 'expense' | 'income') || 'expense'
  );
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    fetchCategories();
  }, [status, router]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await request('/api/categories');
      setCategories(data);
      if (data.length > 0 && type === 'expense') {
        setCategoryId(data[0].id);
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount) {
      setError('Amount is required');
      return;
    }

    if (type === 'expense' && !categoryId) {
      setError('Category is required for expenses');
      return;
    }

    try {
      setSubmitting(true);
      await request('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          description: description || undefined,
          date,
          categoryId: type === 'income' ? null : categoryId,
        }),
      });

      // Close the window or go back
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/transactions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  if (!session?.user) return null;

  // Minimal mode - just the essentials
  if (isMinimal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-xs bg-background rounded-2xl shadow-2xl flex flex-col">
          <div className="px-5 py-4 flex-1 flex flex-col gap-4">
            {error && (
              <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-4 text-sm">Loading...</div>
            ) : (
              <form onSubmit={handleAddTransaction} className="space-y-3 flex flex-col">
                {/* Amount Input */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-text-secondary">
                    {currency === 'MKD' ? 'МКД' : currency === 'USD' ? '$' : '€'}
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                    className="w-full pl-12 pr-3 py-3 text-2xl font-bold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    required
                  />
                </div>

                {/* Category - Only for expenses */}
                {type === 'expense' && categories.length > 0 && (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm mt-2"
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-sm bg-background rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border sticky top-0 bg-background rounded-t-2xl">
          <h1 className="text-xl font-bold text-foreground">
            Add {type === 'expense' ? 'Expense' : 'Income'}
          </h1>
          <button
            onClick={() => router.back()}
            className="p-2 text-foreground hover:bg-secondary rounded-lg transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-4 flex-1 flex flex-col">

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Loading categories...</div>
          ) : (
            <form onSubmit={handleAddTransaction} className="space-y-4 flex flex-col flex-1">
              {/* Amount - Big and prominent */}
              <div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-text-secondary">
                    {currency === 'MKD' ? 'МКД' : currency === 'USD' ? '$' : '€'}
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                    className="w-full pl-16 pr-4 py-4 text-3xl font-bold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Category - Only for expenses */}
              {type === 'expense' && categories.length > 0 && (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  required
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Date */}
              <DatePicker
                label="Date"
                value={date}
                onChange={(newDate) => setDate(newDate)}
              />

              {/* Description */}
              <Input
                label="Description (optional)"
                placeholder="Add a note..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Buttons */}
              <div className="flex gap-2 pt-4 mt-auto">
                <Button
                  type="submit"
                  fullWidth
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Add'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuickAddPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><p className="text-foreground">Loading...</p></div>}>
      <QuickAddContent />
    </Suspense>
  );
}
