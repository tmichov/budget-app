import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Delete a bill payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const payment = await prisma.billPayment.findUnique({
      where: { id },
      include: { bill: true },
    });

    if (!payment) {
      return NextResponse.json(
        { message: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.userId !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the associated transaction
    try {
      const transactionDescription = `Bill payment: ${payment.bill.name}`;
      await prisma.transaction.deleteMany({
        where: {
          userId,
          description: transactionDescription,
          date: new Date(payment.date),
          type: 'expense',
          amount: payment.amount,
        },
      });
    } catch (transactionError) {
      console.error('Failed to delete transaction for bill payment:', transactionError);
      // Don't fail the bill payment deletion if transaction deletion fails
    }

    await prisma.billPayment.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Payment deleted' });
  } catch (error) {
    console.error('Delete bill payment error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
