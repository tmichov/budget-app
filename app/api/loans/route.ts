import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loans = await prisma.loan.findMany({
      where: { userId: session.user.id },
      include: {
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    return NextResponse.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, principal, currency, totalMonths, interestRateYears, startDate } = await req.json();

    if (!name || !principal || !currency || !totalMonths || !interestRateYears || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const loan = await prisma.loan.create({
      data: {
        userId: session.user.id,
        name,
        principal: parseFloat(principal),
        currency,
        totalMonths: parseInt(totalMonths),
        interestRateYears: JSON.stringify(interestRateYears),
        startDate: new Date(startDate),
      },
      include: {
        payments: true,
      },
    });

    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    console.error('Error creating loan:', error);
    return NextResponse.json({ error: 'Failed to create loan' }, { status: 500 });
  }
}
