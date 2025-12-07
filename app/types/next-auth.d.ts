import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: {
      id: string;
      currency?: string;
      theme?: string;
      emailVerified?: Date | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    currency?: string;
    theme?: string;
    emailVerified?: Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    currency?: string;
    theme?: string;
    emailVerified?: Date | null;
  }
}
