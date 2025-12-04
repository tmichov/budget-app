import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateAmortizationSchedule } from '@/lib/loans';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loan = await prisma.loan.findFirst({
      where: {
        id: params.id,
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

    const interestRateSchedule = JSON.parse(loan.interestRateYears);
    const existingPayments = loan.payments.map((p) => ({
      date: new Date(p.date),
      amount: parseFloat(p.amount.toString()),
    }));

    const schedule = calculateAmortizationSchedule(
      parseFloat(loan.principal.toString()),
      loan.totalMonths,
      interestRateSchedule,
      new Date(loan.startDate),
      existingPayments
    );

    // Convert dates to ISO strings for JSON serialization
    const scheduleForClient = schedule.map((item) => ({
      ...item,
      date: item.date.toISOString(),
      beginningBalance: parseFloat(item.beginningBalance.toFixed(2)),
      payment: parseFloat(item.payment.toFixed(2)),
      principal: parseFloat(item.principal.toFixed(2)),
      interest: parseFloat(item.interest.toFixed(2)),
      endingBalance: parseFloat(item.endingBalance.toFixed(2)),
    }));

    return NextResponse.json(scheduleForClient);
  } catch (error) {
    console.error('Error fetching loan schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch loan schedule' }, { status: 500 });
  }
}
