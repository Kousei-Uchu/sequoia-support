import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { Octokit } from "@octokit/rest";  // Import Octokit to interact with GitHub (assuming it's where the username is stored)

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub, // Google uses 'sub' as the unique user ID
          name: profile.name,
          username: "", // Will be populated from API after login
          email: profile.email,
          image: profile.picture, // Google profile picture URL
        };
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
        domain: process.env.NODE_ENV === 'production' ? '.sequoiasupport.vercel.app' : undefined,
      },
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token;
        
        // Fetch username from your API or GitHub repo here
        const octokit = new Octokit({
          auth: process.env.GITHUB_ACCESS_TOKEN, // Use your GitHub access token here
        });

        // Example: Fetch username from a GitHub repo (or your database)
        try {
          const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
            owner: 'Kousei-Uchu',  // Replace with your GitHub username
            repo: 'sequoia-support', // Replace with your repo name
            path: `users/${user.email}.json`,  // Path to user data in GitHub (or wherever you store it)
          });

          const userData = Buffer.from(data.content, 'base64').toString('utf-8');
          const parsedData = JSON.parse(userData);

          // Set the fetched username
          token.username = parsedData.username || user.email.split('@')[0]; // Default to email prefix if no username found
        } catch (error) {
          console.error("Error fetching username from GitHub:", error);
          token.username = user.email.split('@')[0]; // Default to email prefix if error occurs
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.username = token.username; // Set username in session
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    signOut: "/auth/signout",
  },
  debug: process.env.NODE_ENV === 'development',
  useSecureCookies: process.env.NODE_ENV === 'production',
});
