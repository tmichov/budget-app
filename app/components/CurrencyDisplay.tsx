'use client';

import type { Currency } from '@/lib/currency';
import { CURRENCIES } from '@/lib/currency';

interface CurrencyDisplayProps {
  amount: number;
  currency: Currency;
  className?: string;
}

export function CurrencyDisplay({
  amount,
  currency,
  className = '',
}: CurrencyDisplayProps) {
  const config = CURRENCIES[currency];
  const formatted =
    config.decimals === 0
      ? Math.round(amount).toString()
      : amount.toFixed(config.decimals);

  return (
    <span className={className}>
      {currency === 'MKD' ? (
        <>
          <span className="text-sm">МКД</span>
          {formatted}
        </>
      ) : (
        <>
          {config.symbol}
          {formatted}
        </>
      )}
    </span>
  );
}
