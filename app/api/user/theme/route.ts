import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { theme } = await request.json();

    if (!theme || (theme !== 'dark' && theme !== 'light')) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { theme },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating theme:', error);
    return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
  }
}
