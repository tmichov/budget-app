'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { DatePicker } from '@/components/DatePicker';
import { ArrowLeft } from 'lucide-react';
import { calculateInterestBetweenDates, getInterestRateForPeriod } from '@/lib/loans';

interface LoanPayment {
  id: string;
  amount: number;
  date: string;
  principalPortion: number;
  interestPortion: number;
}

interface Loan {
  id: string;
  name: string;
  principal: number;
  currency: string;
  totalMonths: number;
  interestRateYears: string;
  startDate: string;
  payments: LoanPayment[];
}

export default function AddPaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { request } = useApi();

  const loanId = params.id as string;
  const [loan, setLoan] = useState<Loan | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [estimatedInterest, setEstimatedInterest] = useState(0);
  const [paymentType, setPaymentType] = useState<'scheduled' | 'custom'>('scheduled');
  const [nextPayment, setNextPayment] = useState<any>(null);

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

        // Fetch the amortization schedule to find next payment
        try {
          const schedule = await request(`/api/loans/${loanId}/schedule`);
          const nextUnpaidPayment = schedule.find((item: any) => !item.isPaid);
          if (nextUnpaidPayment) {
            setNextPayment(nextUnpaidPayment);
            setAmount(nextUnpaidPayment.payment.toFixed(2));
            setDate(new Date(nextUnpaidPayment.date).toISOString().split('T')[0]);
          }
        } catch (err) {
          console.error('Error fetching schedule:', err);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loan');
    } finally {
      setLoading(false);
    }
  };

  // Calculate estimated interest when amount or date changes
  useEffect(() => {
    if (!loan || !amount) {
      setEstimatedInterest(0);
      return;
    }

    try {
      const interestRateYears = JSON.parse(loan.interestRateYears);
      const paymentDate = new Date(date);
      const lastPaymentDate = loan.payments.length > 0
        ? new Date(loan.payments[loan.payments.length - 1].date)
        : new Date(loan.startDate);

      const balanceBeforePayment = loan.payments.length > 0
        ? loan.principal -
          loan.payments.reduce((sum, p) => sum + p.principalPortion, 0)
        : loan.principal;

      const yearsElapsed =
        (paymentDate.getTime() - new Date(loan.startDate).getTime()) /
        (365.25 * 24 * 60 * 60 * 1000);
      const interestRate = getInterestRateForPeriod(interestRateYears, yearsElapsed);

      const interestAccrued = calculateInterestBetweenDates(
        balanceBeforePayment,
        lastPaymentDate,
        paymentDate,
        interestRateYears,
        new Date(loan.startDate)
      );

      setEstimatedInterest(Math.min(interestAccrued, parseFloat(amount)));
    } catch (err) {
      console.error('Error calculating interest:', err);
    }
  }, [loan, amount, date]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount) {
      setError('Amount is required');
      return;
    }

    try {
      setSubmitting(true);
      await request('/api/loan-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId,
          amount: parseFloat(amount),
          date,
        }),
      });
      router.push(`/loans/${loanId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!session?.user) return null;
  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!loan) return null;

  const paymentAmount = parseFloat(amount) || 0;
  const principalPayment = paymentAmount - estimatedInterest;

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-6 pb-32">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Make Payment</h1>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Loan Info Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 mb-6">
          <div>
            <p className="text-xs text-text-secondary">Loan</p>
            <p className="font-bold text-foreground mb-2">{loan.name}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
              <p className="text-text-secondary mb-1">Currency</p>
              <p className="font-semibold text-foreground">{loan.currency}</p>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
              <p className="text-text-secondary mb-1">Principal</p>
              <p className="font-semibold text-foreground">
                {loan.principal.toFixed(2)}
              </p>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
              <p className="text-text-secondary mb-1">Remaining</p>
              <p className="font-semibold text-foreground">
                {(
                  loan.principal -
                  loan.payments.reduce((sum, p) => sum + p.principalPortion, 0)
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddPayment} className="space-y-6">
          {/* Payment Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-3 text-foreground">
              Payment Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentType('scheduled');
                  if (nextPayment) {
                    setAmount(nextPayment.payment.toFixed(2));
                    setDate(new Date(nextPayment.date).toISOString().split('T')[0]);
                  }
                }}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  paymentType === 'scheduled'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-foreground hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Pay Scheduled
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentType('custom');
                  setAmount('');
                  setDate(new Date().toISOString().split('T')[0]);
                }}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  paymentType === 'custom'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-foreground hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Custom Amount
              </button>
            </div>
          </div>

          {/* Scheduled Payment Info */}
          {paymentType === 'scheduled' && nextPayment && (
            <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">
                Next Scheduled Payment
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-400">Month:</span>
                  <span className="font-semibold text-green-900 dark:text-green-200">
                    {nextPayment.month} of {loan?.totalMonths}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-400">Amount:</span>
                  <span className="font-semibold text-green-900 dark:text-green-200">
                    {loan?.currency} {nextPayment.payment.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-400">Date:</span>
                  <span className="font-semibold text-green-900 dark:text-green-200">
                    {new Date(nextPayment.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Amount - Only for custom */}
          {paymentType === 'custom' && (
            <Input
              type="number"
              label="Payment Amount"
              placeholder="0.00"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          )}

          {/* Amount Display - For scheduled */}
          {paymentType === 'scheduled' && (
            <Input
              type="number"
              label="Payment Amount"
              placeholder="0.00"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled
            />
          )}

          {/* Date */}
          <DatePicker
            label="Payment Date"
            value={date}
            onChange={(newDate) => setDate(newDate)}
          />

          {/* Interest Breakdown */}
          {amount && (
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3">
                Payment Breakdown
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-400">Total Payment:</span>
                  <span className="font-semibold text-blue-900 dark:text-blue-200">
                    {loan.currency} {paymentAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-400">Interest:</span>
                  <span className="font-semibold text-blue-900 dark:text-blue-200">
                    {loan.currency} {estimatedInterest.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-blue-200 dark:border-blue-500/30 pt-2 flex justify-between">
                  <span className="text-blue-700 dark:text-blue-400">Principal:</span>
                  <span className="font-semibold text-blue-900 dark:text-blue-200">
                    {loan.currency} {principalPayment.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? 'Adding...' : 'Make Payment'}
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
