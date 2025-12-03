import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get all transactions for the user
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { categoryId, amount, type, description, date } = body;

    if (!amount || !type) {
      return NextResponse.json(
        { message: 'Amount and type are required' },
        { status: 400 }
      );
    }

    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json(
        { message: 'Type must be either "income" or "expense"' },
        { status: 400 }
      );
    }

    // Category is required for expenses, optional for income
    if (type === 'expense' && !categoryId) {
      return NextResponse.json(
        { message: 'Category is required for expenses' },
        { status: 400 }
      );
    }

    // Verify category belongs to user if provided
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category || category.userId !== userId) {
        return NextResponse.json(
          { message: 'Category not found' },
          { status: 404 }
        );
      }
    }

    const transactionData: any = {
      user: { connect: { id: userId } },
      amount: parseFloat(amount),
      type,
      description: description || null,
      date: date ? new Date(date) : new Date(),
    };

    // Only add category if provided
    if (categoryId) {
      transactionData.category = { connect: { id: categoryId } };
    }

    const transaction = await prisma.transaction.create({
      data: transactionData,
    });

    // Fetch with category if it exists
    const transactionWithCategory = await prisma.transaction.findUnique({
      where: { id: transaction.id },
      include: { category: true },
    });

    return NextResponse.json(transactionWithCategory, { status: 201 });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
