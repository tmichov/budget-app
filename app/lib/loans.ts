/**
 * Loan calculation utilities for mortgage/loan management
 * Adapted from KadeKolku project with correct amortization formula
 */

export interface InterestRateSchedule {
  startMonth: number; // 0-indexed month when this rate starts
  endMonth?: number; // 0-indexed month when this rate ends (optional)
  rate: number; // Annual interest rate percentage
}

/**
 * Get the applicable interest rate for a specific month
 */
export function getInterestRateForMonth(
  periods: InterestRateSchedule[],
  month: number // 0-indexed month number
): number {
  const period = periods.find(
    (p) =>
      month >= p.startMonth &&
      (p.endMonth === undefined || month <= p.endMonth)
  );
  return period?.rate ?? 0;
}

/**
 * Calculate monthly payment using standard amortization formula
 * Payment = (Principal * MonthlyRate) / (1 - (1 + MonthlyRate)^-RemainingMonths)
 */
export function calculateMonthlyPayment(
  balance: number,
  annualRate: number,
  remainingMonths: number
): number {
  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    return balance / remainingMonths;
  }

  return parseFloat(
    (
      (balance * monthlyRate) /
      (1 - Math.pow(1 + monthlyRate, -remainingMonths))
    ).toFixed(2)
  );
}

/**
 * Calculate amortization schedule for a loan
 * Recalculates payment each month based on remaining balance and months
 * monthlyFee is added to the displayed payment but does NOT reduce principal
 */
export function calculateAmortizationSchedule(
  principal: number,
  totalMonths: number,
  interestRateSchedule: InterestRateSchedule[],
  startDate: Date,
  existingPayments: Array<{ date: Date; amount: number }> = [],
  fixedMonthlyPayment?: number,
  monthlyFee: number = 0
): Array<{
  month: number;
  date: Date;
  beginningBalance: number;
  payment: number;
  principal: number;
  interest: number;
  fee: number;
  endingBalance: number;
  isPaid: boolean;
}> {
  const schedule = [];
  let balance = principal;
  const sortedPayments = [...existingPayments].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Create a map of payments by month for quick lookup
  const paymentsByMonth = new Map<number, number>();
  for (const payment of sortedPayments) {
    const monthDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      1
    );
    let month = 0;
    while (monthDate.toISOString().split("T")[0] < payment.date.toISOString().split("T")[0]) {
      monthDate.setMonth(monthDate.getMonth() + 1);
      month++;
    }
    if (paymentsByMonth.has(month)) {
      paymentsByMonth.set(month, paymentsByMonth.get(month)! + payment.amount);
    } else {
      paymentsByMonth.set(month, payment.amount);
    }
  }

  for (let month = 0; month < totalMonths; month++) {
    const monthDate = new Date(startDate);
    monthDate.setMonth(monthDate.getMonth() + month);

    const rate = getInterestRateForMonth(interestRateSchedule, month);
    const monthlyRate = rate / 100 / 12;

    const beginningBalance = balance;
    const remainingMonths = totalMonths - month;

    // Calculate payment
    let payment: number;
    if (fixedMonthlyPayment) {
      payment = fixedMonthlyPayment;
    } else {
      payment = calculateMonthlyPayment(balance, rate, remainingMonths);
    }

    // Calculate interest and principal
    const interest = parseFloat((balance * monthlyRate).toFixed(2));
    let principalPayment = parseFloat((payment - interest).toFixed(2));

    // Check if a payment was made this month
    const paymentMade = paymentsByMonth.get(month);
    let isPaid = false;

    if (paymentMade) {
      // Actual payment was made
      payment = paymentMade;
      principalPayment = parseFloat((paymentMade - interest).toFixed(2));
      isPaid = true;
    }

    // Update balance
    balance -= principalPayment;
    if (balance < 0) balance = 0;

    const endingBalance = parseFloat(balance.toFixed(2));

    schedule.push({
      month: month + 1,
      date: new Date(monthDate),
      beginningBalance: parseFloat(beginningBalance.toFixed(2)),
      payment: parseFloat((payment + monthlyFee).toFixed(2)), // Includes fee in displayed payment
      principal: parseFloat(principalPayment.toFixed(2)),
      interest,
      fee: parseFloat(monthlyFee.toFixed(2)),
      endingBalance,
      isPaid,
    });

    if (balance <= 0) break;
  }

  return schedule;
}

/**
 * Calculate remaining balance at a specific date
 */
export function calculateRemainingBalance(
  principal: number,
  totalMonths: number,
  interestRateSchedule: InterestRateSchedule[],
  startDate: Date,
  paymentsToDate: Array<{ amount: number; date: Date }>,
  monthlyFee: number = 0
): number {
  const schedule = calculateAmortizationSchedule(
    principal,
    totalMonths,
    interestRateSchedule,
    startDate,
    paymentsToDate,
    undefined,
    monthlyFee
  );

  return schedule.length > 0
    ? schedule[schedule.length - 1].endingBalance
    : principal;
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
  let currentMonth = 0;

  let currentDate = new Date(loanStartDate);

  while (currentDate <= endDate) {
    const monthEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
    const periodEnd =
      monthEnd.getTime() < endDate.getTime() ? monthEnd : endDate;

    const rate = getInterestRateForMonth(interestRateSchedule, currentMonth);
    const monthlyRate = rate / 100 / 12;
    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();
    const dailyRate = monthlyRate / daysInMonth;

    const daysInPeriod = Math.floor(
      (periodEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    totalInterest += balance * dailyRate * daysInPeriod;

    currentDate = new Date(periodEnd);
    currentDate.setDate(currentDate.getDate() + 1);
    currentMonth++;
  }

  return totalInterest;
}
