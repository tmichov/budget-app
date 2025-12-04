export type Currency = 'MKD' | 'USD' | 'EUR';

export const CURRENCIES = {
  MKD: {
    name: 'Macedonian Denar',
    symbol: 'МКД',
    decimals: 0,
  },
  USD: {
    name: 'US Dollar',
    symbol: '$',
    decimals: 2,
  },
  EUR: {
    name: 'Euro',
    symbol: '€',
    decimals: 2,
  },
};

export function formatCurrency(amount: number, currency: Currency = 'MKD'): string {
  const config = CURRENCIES[currency];
  const formatted = config.decimals === 0
    ? Math.round(amount).toString()
    : amount.toFixed(config.decimals);
  return `${config.symbol}${formatted}`;
}

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCIES[currency].symbol;
}

export function getDecimals(currency: Currency): number {
  return CURRENCIES[currency].decimals;
}
