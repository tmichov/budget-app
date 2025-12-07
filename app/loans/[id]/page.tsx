'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/Button';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface InterestRateSchedule {
  years: number;
  rate: number;
}

interface LoanPayment {
  id: string;
  amount: number;
  date: string;
  principalPortion: number;
  interestPortion: number;
}

interface ScheduleItem {
  month: number;
  date: string;
  beginningBalance: number;
  payment: number;
  principal: number;
  interest: number;
  fee: number;
  endingBalance: number;
  isPaid: boolean;
}

interface Loan {
  id: string;
  name: string;
  principal: number;
  currency: string;
  totalMonths: number;
  interestRateYears: string;
  startDate: string;
  monthlyFee: number;
  payments: LoanPayment[];
}

export default function LoanDetailsPage() {
  const { data: session, status } = useSession();
  const { currency } = useCurrency();
  const router = useRouter();
  const params = useParams();
  const { request } = useApi();

  const loanId = params.id as string;
  const [loan, setLoan] = useState<Loan | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [deleteLoanConfirm, setDeleteLoanConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    fetchLoan();
  }, [status, router]);

  const fetchLoan = async () => {
    try {
      setLoading(true);
      const loans = await request('/api/loans');
      const foundLoan = loans.find((l: any) => l.id === loanId);
      if (!foundLoan) {
        setError('Loan not found');
      } else {
        const parsedLoan = {
          ...foundLoan,
          principal: parseFloat(foundLoan.principal),
          payments: foundLoan.payments.map((p: any) => ({
            ...p,
            amount: parseFloat(p.amount),
            principalPortion: parseFloat(p.principalPortion),
            interestPortion: parseFloat(p.interestPortion),
          })),
        };
        setLoan(parsedLoan);

        // Fetch amortization schedule
        const scheduleData = await request(`/api/loans/${loanId}/schedule`);
        setSchedule(scheduleData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deletePaymentId || !loan) return;

    try {
      setDeleting(true);
      await request(`/api/loan-payments/${deletePaymentId}`, {
        method: 'DELETE',
      });
      setLoan({
        ...loan,
        payments: loan.payments.filter((p) => p.id !== deletePaymentId),
      });
      setDeletePaymentId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteLoan = async () => {
    try {
      setDeleting(true);
      await request(`/api/loans/${loanId}`, {
        method: 'DELETE',
      });
      router.push('/loans');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete loan');
      setDeleting(false);
    }
  };

  if (!session?.user) return null;
  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!loan) return null;

  const interestRateSchedule: InterestRateSchedule[] = JSON.parse(loan.interestRateYears);
  const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPrincipal = loan.payments.reduce((sum, p) => sum + p.principalPortion, 0);
  const totalInterest = loan.payments.reduce((sum, p) => sum + p.interestPortion, 0);
  const remaining = loan.principal - totalPrincipal;
  const progressPercent = (totalPrincipal / loan.principal) * 100;

  // Prepare chart data
  const chartData = [...loan.payments]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((payment) => {
      const remainingAtPayment = loan.principal -
        loan.payments
          .filter((p) => new Date(p.date).getTime() <= new Date(payment.date).getTime())
          .reduce((sum, p) => sum + p.principalPortion, 0);

      return {
        date: new Date(payment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
        remaining: remainingAtPayment,
        principal: payment.principalPortion,
        interest: payment.interestPortion,
      };
    });

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-6 pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-foreground">{loan.name}</h1>
          </div>
          <button
            onClick={() => setDeleteLoanConfirm(true)}
            className="p-2 text-red-600 rounded-lg transition-colors"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-light)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Delete loan"
          >
            <Trash2 size={24} />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Progress Bar */}
        <div className="bg-card rounded-lg p-4 border border-card-border mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">Progress</p>
            <p className="text-sm font-medium text-foreground">{progressPercent.toFixed(1)}%</p>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-card rounded-lg p-3 border border-card-border">
            <p className="text-xs text-text-secondary mb-1">Principal</p>
            <p className="font-bold text-foreground text-sm">
              {loan.currency === currency ? (
                <CurrencyDisplay amount={loan.principal} currency={loan.currency as any} />
              ) : (
                `${loan.currency} ${loan.principal.toFixed(2)}`
              )}
            </p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-card-border">
            <p className="text-xs text-text-secondary mb-1">Paid</p>
            <p className="font-bold text-foreground text-sm">
              {loan.currency === currency ? (
                <CurrencyDisplay amount={totalPrincipal} currency={loan.currency as any} />
              ) : (
                `${loan.currency} ${totalPrincipal.toFixed(2)}`
              )}
            </p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-card-border">
            <p className="text-xs text-text-secondary mb-1">Remaining</p>
            <p className="font-bold text-foreground text-sm">
              {loan.currency === currency ? (
                <CurrencyDisplay amount={remaining} currency={loan.currency as any} />
              ) : (
                `${loan.currency} ${remaining.toFixed(2)}`
              )}
            </p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-card-border">
            <p className="text-xs text-text-secondary mb-1">Total Interest</p>
            <p className="font-bold text-foreground text-sm">
              {loan.currency === currency ? (
                <CurrencyDisplay amount={totalInterest} currency={loan.currency as any} />
              ) : (
                `${loan.currency} ${totalInterest.toFixed(2)}`
              )}
            </p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="bg-card rounded-lg p-4 border border-card-border mb-6">
            <p className="text-sm font-medium text-foreground mb-4">
              Balance Over Time
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--text-secondary)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="var(--text-secondary)" style={{ fontSize: '12px' }} />
                <Tooltip
                  formatter={(value: number) => [
                    loan.currency === currency
                      ? value.toFixed(2)
                      : `${loan.currency} ${value.toFixed(2)}`,
                    'Balance',
                  ]}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: `1px solid var(--card-border)`,
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="remaining"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--primary)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        {/* Add Payment Button */}
        <Button
          onClick={() => router.push(`/loans/${loan.id}/add-payment`)}
          className="w-full mb-6"
        >
          <Plus size={16} />
          Make Payment
        </Button>

        {/* Payment Schedule Section */}
        <div className="mb-6">
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="w-full text-left p-4 bg-card border border-card-border rounded-lg transition-colors mb-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">
                {showSchedule ? '▼' : '▶'} Payment Schedule ({schedule.length} months)
              </p>
              <p className="text-xs text-text-secondary">
                {schedule.filter((s) => !s.isPaid).length} payments remaining
              </p>
            </div>
          </button>

          {showSchedule && schedule.length > 0 && (
            <div className="bg-card border border-card-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-card-border" style={{ backgroundColor: 'var(--secondary)' }}>
                      <th className="px-3 py-2 text-left font-semibold text-foreground">Month</th>
                      <th className="px-3 py-2 text-right font-semibold text-foreground">Payment</th>
                      <th className="px-3 py-2 text-right font-semibold text-foreground">Principal</th>
                      <th className="px-3 py-2 text-right font-semibold text-foreground">Interest</th>
                      <th className="px-3 py-2 text-right font-semibold text-foreground">Fee</th>
                      <th className="px-3 py-2 text-right font-semibold text-foreground">Balance</th>
                      <th className="px-3 py-2 text-center font-semibold text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((item, index) => {
                      let rowStyle: React.CSSProperties = { borderColor: 'var(--card-border)' };
                      if (item.isPaid) {
                        rowStyle.backgroundColor = 'var(--success-light)';
                      } else if (index === 0 || (index > 0 && schedule[index - 1].isPaid)) {
                        rowStyle.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                      }
                      return (
                      <tr
                        key={index}
                        className="border-b"
                        style={rowStyle}
                      >
                        <td className="px-3 py-2 font-medium text-foreground">
                          {item.month}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground">
                          {loan.currency === currency ? (
                            <CurrencyDisplay amount={item.payment} currency={loan.currency as any} />
                          ) : (
                            `${loan.currency} ${item.payment.toFixed(2)}`
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground">
                          {loan.currency === currency ? (
                            <CurrencyDisplay amount={item.principal} currency={loan.currency as any} />
                          ) : (
                            `${loan.currency} ${item.principal.toFixed(2)}`
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground">
                          {loan.currency === currency ? (
                            <CurrencyDisplay amount={item.interest} currency={loan.currency as any} />
                          ) : (
                            `${loan.currency} ${item.interest.toFixed(2)}`
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground">
                          {loan.currency === currency ? (
                            <CurrencyDisplay amount={item.fee} currency={loan.currency as any} />
                          ) : (
                            `${loan.currency} ${item.fee.toFixed(2)}`
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground font-medium">
                          {loan.currency === currency ? (
                            <CurrencyDisplay amount={item.endingBalance} currency={loan.currency as any} />
                          ) : (
                            `${loan.currency} ${item.endingBalance.toFixed(2)}`
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {item.isPaid ? (
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                              Paid
                            </span>
                          ) : index === 0 || (index > 0 && schedule[index - 1].isPaid) ? (
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'rgb(59, 130, 246)' }}>
                              Next
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'var(--secondary)', color: 'var(--text-secondary)' }}>
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Payment History */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            Payment History
          </p>
          {loan.payments.length === 0 ? (
            <p className="text-text-secondary text-center py-8">
              No payments yet
            </p>
          ) : (
            <div className="space-y-2">
              {[...loan.payments]
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-card border border-card-border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {loan.currency === currency ? (
                          <CurrencyDisplay amount={payment.amount} currency={loan.currency as any} />
                        ) : (
                          `${loan.currency} ${payment.amount.toFixed(2)}`
                        )}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {new Date(payment.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <div className="flex gap-4 text-xs text-text-secondary mt-1">
                        <span>
                          Principal:{' '}
                          {loan.currency === currency ? (
                            <CurrencyDisplay amount={payment.principalPortion} currency={loan.currency as any} />
                          ) : (
                            `${loan.currency} ${payment.principalPortion.toFixed(2)}`
                          )}
                        </span>
                        <span>
                          Interest:{' '}
                          {loan.currency === currency ? (
                            <CurrencyDisplay amount={payment.interestPortion} currency={loan.currency as any} />
                          ) : (
                            `${loan.currency} ${payment.interestPortion.toFixed(2)}`
                          )}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeletePaymentId(payment.id)}
                      className="p-1 text-red-600 rounded transition-colors"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-light)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Delete payment"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Payment Modal */}
      {deletePaymentId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-foreground mb-2">
              Delete Payment?
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletePaymentId(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-secondary transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePayment}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors font-medium text-sm"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Loan Modal */}
      {deleteLoanConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-foreground mb-2">
              Delete Loan?
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              This will delete the loan and all its payment history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteLoanConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-secondary transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLoan}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors font-medium text-sm"
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
