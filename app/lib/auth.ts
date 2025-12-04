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
      } else if (token.id) {
        // Refresh currency and theme from database on each token use
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { currency: true, theme: true },
        });
        if (dbUser) {
          token.currency = dbUser.currency;
          token.theme = dbUser.theme;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.currency = token.currency as string;
        session.user.theme = token.theme as string;
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
