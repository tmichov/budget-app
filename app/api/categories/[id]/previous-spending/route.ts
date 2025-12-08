import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: categoryId } = await params;
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // Calculate previous month
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }

    // Get all transactions for this category in previous month
    const startDate = new Date(prevYear, prevMonth - 1, 1);
    const endDate = new Date(prevYear, prevMonth, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        categoryId,
        type: 'expense',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalSpent = transactions.reduce(
      (sum, t) => sum + parseFloat(t.amount.toString()),
      0
    );

    return NextResponse.json({
      previousMonth: prevMonth,
      previousYear: prevYear,
      totalSpent: Math.round(totalSpent * 100) / 100,
    });
  } catch (error) {
    console.error('Get previous spending error:', error);
    return NextResponse.json({ error: 'Failed to fetch previous spending' }, { status: 500 });
  }
}
