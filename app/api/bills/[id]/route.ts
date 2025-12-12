import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Update a bill (e.g., rename)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const { id } = await params;

    console.log('PATCH /api/bills/[id] - userId:', userId, 'billId:', id);

    if (!userId) {
      console.log('No userId provided');
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bill = await prisma.bill.findUnique({
      where: { id },
    });

    if (!bill) {
      console.log('Bill not found:', id);
      return NextResponse.json(
        { message: 'Bill not found' },
        { status: 404 }
      );
    }

    if (bill.userId !== userId) {
      console.log('User mismatch - bill.userId:', bill.userId, 'userId:', userId);
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    console.log('Update request - name:', name);

    if (!name || typeof name !== 'string' || !name.trim()) {
      console.log('Invalid name provided');
      return NextResponse.json(
        { message: 'Bill name is required' },
        { status: 400 }
      );
    }

    const updatedBill = await prisma.bill.update({
      where: { id },
      data: { name: name.trim() },
    });

    console.log('Bill updated successfully:', updatedBill);
    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error('Update bill error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
