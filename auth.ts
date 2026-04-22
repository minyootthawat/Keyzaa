import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import LineProvider from "next-auth/providers/line";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongodb";

type UserRole = "buyer" | "seller" | "both";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { db } = await connectDB();
        const users = db.collection("users");

        const user = await users.findOne({ email: (credentials.email as string).toLowerCase() });
        if (!user || !user.passwordHash) return null;

        const validPassword = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!validPassword) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          sellerId: user.sellerId,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user: socialUser, account }) {
      if (!socialUser?.email) return false;
      if (account?.provider !== "google" && account?.provider !== "facebook" && account?.provider !== "line") return true;

      const { db } = await connectDB();
      const users = db.collection("users");

      const email = socialUser.email.toLowerCase();
      const existingUser = await users.findOne({ email });

      if (existingUser) {
        await users.updateOne(
          { _id: existingUser._id },
          { $set: { provider: account.provider, providerId: account.providerAccountId } }
        );
        socialUser.id = existingUser._id.toString();
        const extUser = socialUser as { role?: UserRole; sellerId?: string; id: string };
        extUser.role = existingUser.role;
        extUser.sellerId = existingUser.sellerId;
      } else {
        const now = new Date().toISOString();
        const newUser = {
          name: socialUser.name || "User",
          email,
          role: "buyer" as UserRole,
          provider: account.provider,
          providerId: account.providerAccountId,
          createdAt: now,
        };
        const result = await users.insertOne(newUser);
        socialUser.id = result.insertedId.toString();
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const extUser = user as { role?: UserRole; sellerId?: string };
        token.role = extUser.role;
        token.sellerId = extUser.sellerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        const extSession = session.user as { role?: UserRole; sellerId?: string };
        extSession.role = token.role as UserRole;
        extSession.sellerId = token.sellerId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
});

declare module "next-auth" {
  interface User {
    role?: UserRole;
    sellerId?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      sellerId?: string;
    };
  }
}