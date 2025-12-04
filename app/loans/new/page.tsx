'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { DatePicker } from '@/components/DatePicker';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { CURRENCIES } from '@/lib/currency';

interface InterestRate {
  years: number;
  rate: number;
}

export default function NewLoanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { request } = useApi();

  const [name, setName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [totalMonths, setTotalMonths] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [interestRates, setInterestRates] = useState<InterestRate[]>([
    { years: 10, rate: 3.49 },
    { years: 20, rate: 9.93 },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  const handleAddInterestRate = () => {
    setInterestRates([...interestRates, { years: 0, rate: 0 }]);
  };

  const handleRemoveInterestRate = (index: number) => {
    setInterestRates(interestRates.filter((_, i) => i !== index));
  };

  const handleInterestRateChange = (index: number, field: 'years' | 'rate', value: number) => {
    const updated = [...interestRates];
    updated[index] = { ...updated[index], [field]: value };
    setInterestRates(updated);
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !principal || !totalMonths || interestRates.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    if (interestRates.some((r) => r.years <= 0 || r.rate < 0)) {
      setError('Interest rate periods must have positive years and non-negative rates');
      return;
    }

    try {
      setLoading(true);
      await request('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          principal: parseFloat(principal),
          currency,
          totalMonths: parseInt(totalMonths),
          interestRateYears: interestRates,
          startDate,
        }),
      });
      router.push('/loans');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create loan');
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-6 pb-32">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-foreground">New Loan</h1>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateLoan} className="space-y-6">
          {/* Loan Name */}
          <Input
            type="text"
            label="Loan Name"
            placeholder="e.g., Apartment Loan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Principal Amount */}
          <Input
            type="number"
            label="Principal Amount"
            placeholder="0.00"
            step="0.01"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            required
          />

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            >
              {Object.entries(CURRENCIES).map(([code, info]) => (
                <option key={code} value={code}>
                  {info.name} ({code})
                </option>
              ))}
            </select>
          </div>

          {/* Total Months */}
          <Input
            type="number"
            label="Total Loan Term (months)"
            placeholder="e.g., 200"
            value={totalMonths}
            onChange={(e) => setTotalMonths(e.target.value)}
            required
          />

          {/* Start Date */}
          <DatePicker
            label="Loan Start Date"
            value={startDate}
            onChange={(newDate) => setStartDate(newDate)}
          />

          {/* Interest Rates */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-foreground">
                Interest Rate Schedule
              </label>
              <button
                type="button"
                onClick={handleAddInterestRate}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Plus size={16} />
                Add Period
              </button>
            </div>

            <div className="space-y-3">
              {interestRates.map((rate, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <Input
                    type="number"
                    label={index === 0 ? 'Years' : ''}
                    placeholder="e.g., 10"
                    value={rate.years}
                    onChange={(e) => handleInterestRateChange(index, 'years', parseFloat(e.target.value))}
                    min="1"
                    required
                  />
                  <Input
                    type="number"
                    label={index === 0 ? 'Rate (%)' : ''}
                    placeholder="e.g., 3.49"
                    value={rate.rate}
                    onChange={(e) => handleInterestRateChange(index, 'rate', parseFloat(e.target.value))}
                    step="0.01"
                    min="0"
                    required
                  />
                  {interestRates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveInterestRate(index)}
                      className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors mb-0"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-text-secondary mt-2">
              Define how the interest rate changes over time. For example: 3.49% for the first 10 years, then 9.93% for the remaining 10 years.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Creating...' : 'Create Loan'}
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
