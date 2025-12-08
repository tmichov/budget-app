import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get budgets for a specific month
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const budgets = await prisma.categoryBudget.findMany({
      where: {
        userId: session.user.id,
        month,
        year,
      },
      include: {
        category: true,
      },
      orderBy: { category: { name: 'asc' } },
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error('Get budgets error:', error);
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

// Set or update a budget for a category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, budgetAmount, month, year } = body;

    if (!categoryId || budgetAmount === undefined || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const budget = await prisma.categoryBudget.upsert({
      where: {
        categoryId_year_month: {
          categoryId,
          year,
          month,
        },
      },
      update: {
        budgetAmount: parseFloat(budgetAmount),
      },
      create: {
        userId: session.user.id,
        categoryId,
        budgetAmount: parseFloat(budgetAmount),
        month,
        year,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('Create/update budget error:', error);
    return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 });
  }
}
