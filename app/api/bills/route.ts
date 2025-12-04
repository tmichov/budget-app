import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get all bills for the user
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bills = await prisma.bill.findMany({
      where: { userId },
      include: {
        payments: {
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bills);
  } catch (error) {
    console.error('Get bills error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new bill
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
    const { name, icon } = body;

    if (!name || !icon) {
      return NextResponse.json(
        { message: 'Name and icon are required' },
        { status: 400 }
      );
    }

    const bill = await prisma.bill.create({
      data: {
        user: { connect: { id: userId } },
        name,
        icon,
      },
      include: {
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error: any) {
    console.error('Create bill error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Bill name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
