import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Create a bill payment
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
    const { billId, amount, date } = body;

    if (!billId || !amount || !date) {
      return NextResponse.json(
        { message: 'billId, amount, and date are required' },
        { status: 400 }
      );
    }

    // Verify bill belongs to user
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
    });

    if (!bill || bill.userId !== userId) {
      return NextResponse.json(
        { message: 'Bill not found' },
        { status: 404 }
      );
    }

    const parsedAmount = parseFloat(amount);
    const paymentDate = new Date(date);

    const billPayment = await prisma.billPayment.create({
      data: {
        user: { connect: { id: userId } },
        bill: { connect: { id: billId } },
        amount: parsedAmount,
        date: paymentDate,
      },
      include: { bill: true },
    });

    // Create corresponding expense transaction
    try {
      await prisma.transaction.create({
        data: {
          user: { connect: { id: userId } },
          amount: parsedAmount,
          type: 'expense',
          description: `Bill payment: ${bill.name}`,
          date: paymentDate,
        },
      });
    } catch (transactionError) {
      console.error('Failed to create transaction for bill payment:', transactionError);
      // Don't fail the bill payment if transaction creation fails
    }

    return NextResponse.json(billPayment, { status: 201 });
  } catch (error: any) {
    console.error('Create bill payment error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Payment for this bill already exists for this date' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
