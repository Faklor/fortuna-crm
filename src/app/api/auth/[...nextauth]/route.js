import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import dbConnect from '@/lib/db';
import Users from '@/models/users';


await dbConnect()
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        login: { label: "Login", type: "text" },
        password: { label: "Password", type: "password" },
        authorize: {
            maxAttempts: 3, // Максимум попыток входа
            window: 15 * 60, // Окно в секундах (15 минут)
        }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.login || !credentials?.password) {
            throw new Error('Missing credentials');
          }
          
          const user = await Users.findOne({ 
            login: credentials.login 
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await compare(credentials.password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            login: user.login,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    }),
    
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.login = user.login;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.login = token.login;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 часов в секундах
    //maxAge: 60,
  },
  // jwt: {
  //   // Усиление безопасности JWT
  //   secret: process.env.JWT_SECRET, // Отдельный секрет для JWT
  //   encryption: true, // Включение шифрования
  // },
  // cookies: {
  //   // Настройка безопасных cookies
  //   sessionToken: {
  //     name: `__Secure-next-auth.session-token`,
  //     options: {
  //       httpOnly: true,
  //       sameSite: 'lax',
  //       path: '/login',
  //       secure: process.env.NODE_ENV === 'production'
  //     }
  //   }
  // },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };