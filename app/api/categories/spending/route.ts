import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // Get the first and last day of the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all categories for this user
    const categories = await prisma.category.findMany({
      where: { userId: session.user.id },
    });

    // Get spending for each category
    const spending = await Promise.all(
      categories.map(async (category) => {
        const transactions = await prisma.transaction.findMany({
          where: {
            userId: session.user.id,
            categoryId: category.id,
            type: 'expense',
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        const spent = transactions.reduce(
          (sum, t) => sum + parseFloat(t.amount.toString()),
          0
        );

        return {
          categoryId: category.id,
          spent: Math.round(spent * 100) / 100,
        };
      })
    );

    return NextResponse.json(spending);
  } catch (error) {
    console.error('Get spending error:', error);
    return NextResponse.json({ error: 'Failed to fetch spending' }, { status: 500 });
  }
}
