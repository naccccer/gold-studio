import NextAuth from "next-auth";
import { credentialsProvider } from "@/features/auth/auth.config";
import type { UserRole } from "@/lib/auth/roles";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [credentialsProvider],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.role = token.role as UserRole;
      }

      return session;
    },
    async authorized({ auth }) {
      return !!auth;
    },
  },
  trustHost: true,
});
