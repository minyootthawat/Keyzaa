import NextAuth, { type User } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import LineProvider from "next-auth/providers/line";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  createUser,
  updateUser,
  updateUserLastLogin,
} from "@/lib/db/collections/users";
import { getSellerByUserId } from "@/lib/db/collections/sellers";
import { getAdminAccessForEmail } from "@/lib/auth/admin";

type UserRole = "buyer" | "seller" | "both";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  // No adapter needed — JWT strategy stores session in token, not a DB
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

        const user = await findUserByEmail(credentials.email as string);
        if (!user) return null;

        if (!user.password_hash) return null;

        const validPassword = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );
        if (!validPassword) return null;

        // Update last login
        const userId = user.id;
        await updateUserLastLogin(userId);

        // Get admin access from Supabase
        const adminAccess = await getAdminAccessForEmail(user.email);

        // Fetch sellerId
        const seller = await getSellerByUserId(userId);
        const sellerId = seller?.id;

        const result: User = {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role,
          sellerId: sellerId || undefined,
          isAdmin: adminAccess.isAdmin,
          adminRole: (adminAccess.adminRole ?? undefined) as string | undefined,
          adminPermissions: adminAccess.permissions,
        };
        return result;
      },
    }),
  ],
  callbacks: {
    async signIn({ user: socialUser, account }) {
      if (!socialUser?.email) return false;
      if (
        account?.provider !== "google" &&
        account?.provider !== "facebook" &&
        account?.provider !== "line"
      )
        return true;

      const email = socialUser.email.toLowerCase();

      // Upsert user in MongoDB
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        await updateUser(existingUser.id, {
          provider: account.provider,
          provider_id: account.providerAccountId,
          last_login_at: new Date().toISOString(),
        });
      } else {
        await createUser({
          email,
          name: socialUser.name || "User",
          provider: account.provider,
          providerId: account.providerAccountId,
          role: "buyer",
        });
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const extUser = user as {
          role?: UserRole;
          sellerId?: string;
          isAdmin?: boolean;
          adminRole?: string;
          adminPermissions?: string[];
        };
        token.role = extUser.role;
        token.sellerId = extUser.sellerId;
        token.isAdmin = extUser.isAdmin;
        token.adminRole = extUser.adminRole;
        token.adminPermissions = extUser.adminPermissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        const extSession = session.user as {
          role?: UserRole;
          sellerId?: string;
          isAdmin?: boolean;
          adminRole?: string;
          adminPermissions?: string[];
        };
        extSession.role = token.role as UserRole;
        extSession.sellerId = token.sellerId as string | undefined;
        extSession.isAdmin = token.isAdmin as boolean | undefined;
        extSession.adminRole = token.adminRole as string | undefined;
        extSession.adminPermissions = token.adminPermissions as string[] | undefined;
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
    isAdmin?: boolean;
    adminRole?: string;
    adminPermissions?: string[];
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      sellerId?: string;
      isAdmin?: boolean;
      adminRole?: string;
      adminPermissions?: string[];
    };
  }
}
