import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import * as bcrypt from 'bcrypt';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('User not found');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          currency: user.currency,
          theme: user.theme,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.currency = user.currency;
        token.theme = user.theme;
        token.emailVerified = user.emailVerified;
      } else if (token.id) {
        // Refresh currency, theme, and emailVerified from database on each token use
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { currency: true, theme: true, emailVerified: true },
        });
        if (dbUser) {
          token.currency = dbUser.currency;
          token.theme = dbUser.theme;
          token.emailVerified = dbUser.emailVerified;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.currency = token.currency as string;
        session.user.theme = token.theme as string;
        session.user.emailVerified = token.emailVerified as Date | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
