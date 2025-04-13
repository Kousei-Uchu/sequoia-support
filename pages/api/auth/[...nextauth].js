import NextAuth from "next-auth";
import Auth0Provider from "next-auth/providers/auth0";
import { v4 as uuidv4 } from 'uuid';

export default NextAuth({
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      issuer: process.env.AUTH0_ISSUER,
      authorization: {
        params: {
          prompt: "login"
        }
      },
      profile(profile) {
        return {
          id: profile.sub || uuidv4(),
          name: profile.name || profile.nickname || profile.email.split('@')[0],
          email: profile.email,
          image: profile.picture,
          // Temporary username until user sets one
          username: profile.nickname || `user_${profile.sub.replace(/^auth0\|/, '').slice(0, 8)}`
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.sequoiasupport.vercel.app' : undefined
      }
    }
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token;
        token.id = user.id;
        token.username = user.username; // Will be updated after user chooses one
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.id = token.id;
      session.user.username = token.username;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to username setup if new user
      if (url === baseUrl && !token?.usernameSet) {
        return `${baseUrl}/setup`;
      }
      return url;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/auth/signout',
    newUser: '/setup' // New page for username setup
  },
  debug: process.env.NODE_ENV === 'development',
  useSecureCookies: process.env.NODE_ENV === 'production'
});
