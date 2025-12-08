'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/Button';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { Plus, Trash2 } from 'lucide-react';

interface Loan {
  id: string;
  name: string;
  principal: number;
  currency: string;
  totalMonths: number;
  interestRateYears: string;
  startDate: string;
  payments: Array<{
    id: string;
    amount: number;
    date: string;
    principalPortion: number;
    interestPortion: number;
  }>;
}

export default function LoansPage() {
  const { data: session, status } = useSession();
  const { currency } = useCurrency();
  const router = useRouter();
  const { request } = useApi();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    fetchLoans();
  }, [status, router]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const data = await request('/api/loans');
      // Parse amounts to numbers since Prisma Decimal comes as string in JSON
      const parsedLoans = data.map((loan: any) => ({
        ...loan,
        principal: parseFloat(loan.principal),
        payments: loan.payments.map((p: any) => ({
          ...p,
          amount: parseFloat(p.amount),
          principalPortion: parseFloat(p.principalPortion),
          interestPortion: parseFloat(p.interestPortion),
        })),
      }));
      setLoans(parsedLoans);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLoan = async () => {
    if (!deleteConfirmId) return;

    try {
      setDeleting(true);
      await request(`/api/loans/${deleteConfirmId}`, { method: 'DELETE' });
      setLoans(loans.filter((l) => l.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete loan');
    } finally {
      setDeleting(false);
    }
  };

  const calculateRemainingBalance = (loan: Loan): number => {
    const totalPrincipalPaid = loan.payments.reduce((sum, p) => sum + p.principalPortion, 0);
    return loan.principal - totalPrincipalPaid;
  };

  if (!session?.user) return null;
  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-6 pb-32">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Add Loan Button */}
        <Button
          onClick={() => router.push('/loans/new')}
          className="w-full mb-6"
        >
          <Plus size={16} />
          Add Loan
        </Button>

        {/* Loans List */}
        {loans.length === 0 ? (
          <p className="text-text-secondary text-center py-8">No loans yet</p>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => {
              const remaining = calculateRemainingBalance(loan);
              const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);

              return (
                <button
                  key={loan.id}
                  onClick={() => router.push(`/loans/${loan.id}`)}
                  className="w-full text-left bg-card border border-card-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  {/* Loan Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-foreground">{loan.name}</h3>
                      <p className="text-xs text-text-secondary">
                        {loan.totalMonths} months • {loan.currency}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(loan.id);
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                      title="Delete loan"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Loan Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-secondary rounded">
                      <p className="text-text-secondary mb-1">Principal</p>
                      <p className="font-semibold text-foreground">
                        {loan.currency === currency ? (
                          <CurrencyDisplay amount={loan.principal} currency={loan.currency as any} />
                        ) : (
                          `${loan.currency} ${loan.principal.toFixed(2)}`
                        )}
                      </p>
                    </div>
                    <div className="p-2 bg-secondary rounded">
                      <p className="text-text-secondary mb-1">Remaining</p>
                      <p className="font-semibold text-foreground">
                        {loan.currency === currency ? (
                          <CurrencyDisplay amount={remaining} currency={loan.currency as any} />
                        ) : (
                          `${loan.currency} ${remaining.toFixed(2)}`
                        )}
                      </p>
                    </div>
                    <div className="p-2 bg-secondary rounded">
                      <p className="text-text-secondary mb-1">Paid</p>
                      <p className="font-semibold text-foreground">
                        {loan.currency === currency ? (
                          <CurrencyDisplay amount={totalPaid} currency={loan.currency as any} />
                        ) : (
                          `${loan.currency} ${totalPaid.toFixed(2)}`
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="rounded-lg p-6 max-w-sm w-full" style={{ backgroundColor: 'var(--card)' }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Delete Loan?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              This will delete the loan and all its payment history.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                style={{
                  borderWidth: '1px',
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLoan}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg text-white transition-colors font-medium text-sm disabled:opacity-50"
                style={{
                  backgroundColor: '#dc2626',
                }}
                onMouseEnter={(e) => !deleting && (e.currentTarget.style.backgroundColor = '#b91c1c')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
