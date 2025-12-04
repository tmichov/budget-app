import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership and find the payment
    const payment = await prisma.loanPayment.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Delete the associated transaction if it exists
    if (payment.transactionId) {
      await prisma.transaction.delete({
        where: { id: payment.transactionId },
      });
    }

    // Delete the payment
    await prisma.loanPayment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting loan payment:', error);
    return NextResponse.json({ error: 'Failed to delete loan payment' }, { status: 500 });
  }
}
