import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import LineProvider from "next-auth/providers/line";
import Credentials from "next-auth/providers/credentials";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import bcrypt from "bcryptjs";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import {
  findUserByEmail,
  createUser,
  updateUser,
  updateUserLastLogin,
} from "@/lib/db/supabase";
import type { Adapter } from "next-auth/adapters";

type UserRole = "buyer" | "seller" | "both";

// Lazy adapter — only created when env vars are available (not at module load)
function getAdapter(): Adapter | undefined {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return undefined;
  }
  return SupabaseAdapter({
    url: supabaseUrl,
    secret: serviceRoleKey,
  }) as Adapter;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: getAdapter(),
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

        // Check if user has a password set (social users may not)
        const passwordHash = (user as unknown as { passwordHash?: string }).passwordHash;
        if (!passwordHash) return null;

        const validPassword = await bcrypt.compare(
          credentials.password as string,
          passwordHash
        );
        if (!validPassword) return null;

        // Update last login
        await updateUserLastLogin(user.id);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sellerId: user.sellerId || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user: socialUser, account, profile }) {
      if (!socialUser?.email) return false;
      if (
        account?.provider !== "google" &&
        account?.provider !== "facebook" &&
        account?.provider !== "line"
      )
        return true;

      const supabaseAdmin = createServiceRoleClient();
      const email = socialUser.email.toLowerCase();

      // Upsert user into auth.users via Admin API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adminApi = supabaseAdmin.auth.admin as any;
      const { data: authUser, error: authError } = await adminApi.createUser({
        id: socialUser.id || undefined,
        email,
        name: socialUser.name || "User",
        email_confirm: true,
        user_metadata: {
          provider: account.provider,
          provider_id: account.providerAccountId,
        },
      });

      if (authError) {
        console.error("Supabase auth upsert error:", authError);
        return false;
      }

      // Upsert user into public.users table
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        await updateUser(existingUser.id, {
          provider: account.provider,
          providerId: account.providerAccountId,
          lastLoginAt: new Date().toISOString(),
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
