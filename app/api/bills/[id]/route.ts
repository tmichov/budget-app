import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Delete a bill
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

    const bill = await prisma.bill.findUnique({
      where: { id },
    });

    if (!bill) {
      return NextResponse.json(
        { message: 'Bill not found' },
        { status: 404 }
      );
    }

    if (bill.userId !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    await prisma.bill.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Bill deleted' });
  } catch (error) {
    console.error('Delete bill error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
