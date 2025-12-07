import jwt from 'jsonwebtoken';

const SECRET = process.env.NEXTAUTH_SECRET;

if (!SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is not set');
}

export interface VerificationToken {
  email: string;
  type: 'email-verification';
  iat: number;
  exp: number;
}

/**
 * Generate a verification token that expires in 24 hours
 */
export function generateVerificationToken(email: string): string {
  return jwt.sign(
    {
      email,
      type: 'email-verification',
    },
    SECRET as string,
    { expiresIn: '24h' }
  );
}

/**
 * Verify and decode a verification token
 * Returns the token payload if valid, throws error if invalid or expired
 */
export function verifyToken(token: string): VerificationToken {
  try {
    const decoded = jwt.verify(token, SECRET as string);
    return decoded as VerificationToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Verification token has expired. Please request a new one.');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid verification token.');
    }
    throw error;
  }
}

/**
 * Get token expiration time (24 hours from now)
 */
export function getTokenExpiration(): Date {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  return expiresAt;
}
