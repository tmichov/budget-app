import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { calculateInterestBetweenDates, getInterestRateForPeriod } from '@/lib/loans';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { loanId, amount, date: paymentDate } = await req.json();

    if (!loanId || !amount || !paymentDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the loan
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        userId: session.user.id,
      },
      include: {
        payments: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    // Calculate balance before this payment
    const interestRateYears = JSON.parse(loan.interestRateYears);
    const paymentDateObj = new Date(paymentDate);
    const lastPaymentDate = loan.payments.length > 0 ? loan.payments[loan.payments.length - 1].date : loan.startDate;
    const principal = parseFloat(loan.principal.toString());

    // Calculate interest accrued since last payment
    const balanceBeforePayment = loan.payments.length > 0
      ? loan.payments.reduce((balance, p) => balance - parseFloat(p.principalPortion.toString()), principal)
      : principal;

    const yearsElapsed = (paymentDateObj.getTime() - loan.startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const interestRate = getInterestRateForPeriod(interestRateYears, yearsElapsed);

    // Calculate interest from last payment to this payment
    const interestAccrued = calculateInterestBetweenDates(
      balanceBeforePayment,
      new Date(lastPaymentDate),
      paymentDateObj,
      interestRateYears,
      loan.startDate
    );

    const paymentAmount = parseFloat(amount);
    const interestPortion = Math.min(interestAccrued, paymentAmount);
    const principalPortion = paymentAmount - interestPortion;

    // Create loan payment
    const loanPayment = await prisma.loanPayment.create({
      data: {
        userId: session.user.id,
        loanId,
        amount: paymentAmount,
        interestPortion,
        principalPortion,
        date: paymentDateObj,
      },
    });

    // Create a transaction for the payment
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount: paymentAmount,
        type: 'expense',
        description: `Loan payment: ${loan.name}`,
        date: paymentDateObj,
      },
    });

    // Link transaction to loan payment
    await prisma.loanPayment.update({
      where: { id: loanPayment.id },
      data: { transactionId: transaction.id },
    });

    return NextResponse.json({ loanPayment, transaction }, { status: 201 });
  } catch (error) {
    console.error('Error creating loan payment:', error);
    return NextResponse.json({ error: 'Failed to create loan payment' }, { status: 500 });
  }
}
