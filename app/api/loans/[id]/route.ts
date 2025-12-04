import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    return NextResponse.json(loan);
  } catch (error) {
    console.error('Error fetching loan:', error);
    return NextResponse.json({ error: 'Failed to fetch loan' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const loan = await prisma.loan.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    // Delete loan (payments will cascade delete)
    await prisma.loan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting loan:', error);
    return NextResponse.json({ error: 'Failed to delete loan' }, { status: 500 });
  }
}
