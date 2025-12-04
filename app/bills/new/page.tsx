'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ArrowLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const ICON_OPTIONS = [
  'Zap',      // Electricity
  'Droplets', // Water
  'Wifi',     // Internet
  'Phone',    // Mobile/Phone
  'Home',     // Rent/Home
  'Gas',      // Gas
  'Shield',   // Insurance
  'Pill',     // Medicine
  'Car',      // Car/Transport
  'DollarSign', // Miscellaneous
  'UtensilsCrossed', // Groceries
  'Tv',       // Streaming/TV
];

export default function NewBillPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { request } = useApi();

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Zap');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Bill name is required');
      return;
    }

    try {
      setLoading(true);
      await request('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          icon: selectedIcon,
        }),
      });
      router.push('/bills');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Wallet;
    return Icon;
  };

  if (!session?.user) return null;

  const SelectedIcon = getIconComponent(selectedIcon);

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
          <h1 className="text-2xl font-bold text-foreground">New Bill</h1>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleAddBill} className="space-y-6">
          {/* Bill Name */}
          <Input
            type="text"
            label="Bill Name"
            placeholder="e.g., Electricity, Water, Internet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium mb-3 text-foreground">Icon</label>

            {/* Preview */}
            <div className="flex items-center justify-center p-4 bg-secondary rounded-lg mb-4">
              <div className="p-4 rounded-lg bg-primary/10">
                <SelectedIcon size={32} className="text-primary" />
              </div>
            </div>

            {/* Icon Grid */}
            <div className="grid grid-cols-4 gap-2">
              {ICON_OPTIONS.map((iconName) => {
                const IconComponent = getIconComponent(iconName);
                const isSelected = selectedIcon === iconName;

                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`p-3 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-primary text-white border-2 border-primary'
                        : 'bg-secondary text-foreground hover:opacity-80 border-2 border-transparent'
                    }`}
                    title={iconName}
                  >
                    <IconComponent size={20} className="mx-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Bill'}
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
