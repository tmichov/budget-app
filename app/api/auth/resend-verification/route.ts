import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateVerificationToken, getTokenExpiration } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, don't reveal if email exists or not
      return NextResponse.json({
        message: 'If an account with this email exists, a verification link has been sent.',
      });
    }

    // If already verified, return success
    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Your email is already verified. You can log in now.',
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken(email);
    const tokenExpiration = getTokenExpiration();

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: tokenExpiration,
      },
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify?token=${verificationToken}`;
    await sendVerificationEmail(email, user.name, verificationUrl);

    return NextResponse.json({
      message: 'Verification email has been sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
