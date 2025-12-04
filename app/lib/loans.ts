/**
 * Loan calculation utilities for mortgage/loan management
 */

export interface InterestRateSchedule {
  years: number;
  rate: number; // Annual interest rate percentage
}

/**
 * Calculate remaining balance on a loan at a specific date
 */
export function calculateRemainingBalance(
  principal: number,
  totalMonths: number,
  interestRateSchedule: InterestRateSchedule[],
  startDate: Date,
  paymentsToDate: Array<{ amount: number; date: Date }>
): number {
  let balance = principal;
  let currentDate = new Date(startDate);

  // Sort payments by date
  const sortedPayments = [...paymentsToDate].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate month by month
  for (let month = 0; month < totalMonths; month++) {
    const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + month, 1);
    const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + month + 1, 1);

    // Get interest rate for this month
    const yearsElapsed = month / 12;
    const rate = getInterestRateForPeriod(interestRateSchedule, yearsElapsed);

    // Calculate daily interest
    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    const dailyRate = (rate / 100) / 365;

    let monthInterest = 0;
    let currentCheckDate = new Date(monthStart);

    while (currentCheckDate < monthEnd) {
      // Find if there's a payment on this day
      const payment = sortedPayments.find(
        p => p.date.toDateString() === currentCheckDate.toDateString()
      );

      if (payment) {
        // Apply payment (assuming it covers interest first, then principal)
        const interestOwed = balance * dailyRate;
        const principalPayment = Math.max(0, payment.amount - interestOwed);
        balance -= principalPayment;
        monthInterest -= interestOwed;
      } else {
        // Add daily interest
        monthInterest += balance * dailyRate;
      }

      currentCheckDate.setDate(currentCheckDate.getDate() + 1);
    }

    balance += monthInterest;
  }

  return Math.max(0, balance);
}

/**
 * Calculate interest accrued between two dates
 */
export function calculateInterestBetweenDates(
  balance: number,
  startDate: Date,
  endDate: Date,
  interestRateSchedule: InterestRateSchedule[],
  loanStartDate: Date
): number {
  let totalInterest = 0;
  let currentDate = new Date(startDate);

  while (currentDate < endDate) {
    const yearsElapsed = (currentDate.getTime() - loanStartDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const rate = getInterestRateForPeriod(interestRateSchedule, yearsElapsed);
    const dailyRate = (rate / 100) / 365;

    totalInterest += balance * dailyRate;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalInterest;
}

/**
 * Get the interest rate for a specific period (in years) from the schedule
 */
export function getInterestRateForPeriod(
  schedule: InterestRateSchedule[],
  yearsElapsed: number
): number {
  // Sort schedule by years
  const sorted = [...schedule].sort((a, b) => a.years - b.years);

  // Find the applicable rate
  for (const period of sorted) {
    if (yearsElapsed < period.years) {
      return period.rate;
    }
  }

  // Return the last rate if we're past all periods
  return sorted[sorted.length - 1]?.rate || 0;
}

/**
 * Calculate amortization schedule for a loan with actual payments accounted for
 */
export function calculateAmortizationSchedule(
  principal: number,
  totalMonths: number,
  interestRateSchedule: InterestRateSchedule[],
  startDate: Date,
  existingPayments: Array<{ date: Date; amount: number }> = []
): Array<{
  month: number;
  date: Date;
  beginningBalance: number;
  payment: number;
  principal: number;
  interest: number;
  endingBalance: number;
  isPaid: boolean;
}> {
  const schedule = [];
  let balance = principal;
  const sortedPayments = [...existingPayments].sort((a, b) => a.date.getTime() - b.date.getTime());

  for (let month = 0; month < totalMonths; month++) {
    const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + month, 1);
    const yearsElapsed = month / 12;
    const rate = getInterestRateForPeriod(interestRateSchedule, yearsElapsed);
    const monthlyRate = rate / 100 / 12;

    const beginningBalance = balance;
    const interestPayment = beginningBalance * monthlyRate;

    // Calculate regular principal payment (assumes equal principal payments)
    const totalInterestOverLife = calculateTotalInterestOverLife(
      principal,
      totalMonths,
      interestRateSchedule
    );
    const regularPayment = (principal + totalInterestOverLife) / totalMonths;
    const principalPayment = Math.max(0, regularPayment - interestPayment);

    // Check if this month has a payment
    const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + month + 1, 0);
    const paymentInMonth = sortedPayments.find(
      (p) => p.date >= monthDate && p.date <= monthEnd
    );

    let actualBalance = balance;
    let isPaid = false;

    if (paymentInMonth) {
      // Payment was made this month
      actualBalance -= Math.max(0, paymentInMonth.amount - interestPayment);
      isPaid = true;
    } else {
      // No payment made, just accrue interest
      actualBalance -= principalPayment;
    }

    schedule.push({
      month: month + 1,
      date: new Date(monthDate),
      beginningBalance,
      payment: regularPayment,
      principal: principalPayment,
      interest: interestPayment,
      endingBalance: Math.max(0, actualBalance),
      isPaid,
    });

    balance = actualBalance;
  }

  return schedule;
}

/**
 * Calculate total interest over the life of the loan (rough estimate)
 */
export function calculateTotalInterestOverLife(
  principal: number,
  totalMonths: number,
  interestRateSchedule: InterestRateSchedule[]
): number {
  let totalInterest = 0;
  let balance = principal;

  for (let month = 0; month < totalMonths; month++) {
    const yearsElapsed = month / 12;
    const rate = getInterestRateForPeriod(interestRateSchedule, yearsElapsed);
    const monthlyRate = rate / 100 / 12;

    totalInterest += balance * monthlyRate;
    // Rough estimate: deduct equal principal each month
    balance -= principal / totalMonths;
  }

  return totalInterest;
}
