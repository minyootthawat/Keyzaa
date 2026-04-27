"use client";

import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import type { User, Seller } from "@/app/types";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  sellerId?: string;
  isAdmin: boolean;
  adminRole?: string;
  adminPermissions: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  role: User["role"];
  seller: Seller | null;
  isRegisteredSeller: boolean;
  isAdmin: boolean;
  adminRole: User["adminRole"];
  adminPermissions: NonNullable<User["adminPermissions"]>;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registerSeller: (data: { shopName: string; phone: string }) => Promise<void>;
  updateSeller: (data: Partial<Seller>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const sellerIdRef = useRef<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [accountResolved, setAccountResolved] = useState(false);

  // Derive role/admin from authUser (our custom JWT state)
  const role = (authUser?.role as User["role"]) || "buyer";
  const isAdmin = authUser?.isAdmin ?? false;
  const adminRole = (authUser?.adminRole ?? null) as User["adminRole"];
  const adminPermissions = (authUser?.adminPermissions ?? []) as NonNullable<User["adminPermissions"]>;
  const loading = status === "loading" || !accountResolved;

  const fetchAccount = async () => {
    setAccountResolved(false);
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setAuthUser(data.user as AuthUser);
        }
        setAccountResolved(true);
        return;
      }
    } catch {
      // ignore
    }
    setAuthUser(null);
    setAccountResolved(true);
  };

  const fetchSeller = async () => {
    try {
      const res = await fetch("/api/seller/me");
      if (res.ok) {
        const data = await res.json();
        setSeller(data.seller);
      }
    } catch {
      // ignore
    }
  };

  // On mount: try to restore session from JWT cookie
  useEffect(() => {
    queueMicrotask(() => {
      void fetchAccount();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch seller when authUser has sellerId
  useEffect(() => {
    const sellerId = authUser?.sellerId;
    if (!sellerId) {
      setSeller(null);
      sellerIdRef.current = null;
      return;
    }
    if (sellerId !== sellerIdRef.current) {
      sellerIdRef.current = sellerId;
      queueMicrotask(() => {
        void fetchSeller();
      });
    }
  }, [authUser?.sellerId]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || "Login failed");
    }

    // Token is set as HttpOnly cookie by the API
    // Fetch account data to populate context
    const accountRes = await fetch("/api/auth/me");
    if (accountRes.ok) {
      const accountData = await accountRes.json();
      if (accountData.user) {
        setAuthUser(accountData.user as AuthUser);
      }
    }

    // Bootstrap seller state
    const sellerRes = await fetch("/api/seller/me");
    if (sellerRes.ok) {
      const sellerData = await sellerRes.json();
      if (sellerData.seller) {
        setSeller(sellerData.seller);
        sellerIdRef.current = sellerData.seller.id;
      }
    }

    setAccountResolved(true);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Registration failed");
    }

    // Login after registration
    await login(email, password);
  };

  const registerSeller = async (data: { shopName: string; phone: string }) => {
    const res = await fetch("/api/seller/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const resData = await res.json();
      const err = new Error(resData.error || "Seller registration failed") as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    const resData = await res.json();
    setSeller(resData.seller);
    // Refresh auth user to get updated sellerId
    await fetchAccount();
  };

  const updateSeller = (data: Partial<Seller>) => {
    setSeller((prev) => prev ? { ...prev, ...data } : prev);
  };

  const logout = async () => {
    setAuthUser(null);
    setSeller(null);
    sellerIdRef.current = null;
    setAccountResolved(true);
    // Clear the JWT cookie
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user: authUser,
        role,
        seller,
        isRegisteredSeller: !!seller,
        isAdmin,
        adminRole,
        adminPermissions,
        loading,
        login,
        register,
        logout,
        registerSeller,
        updateSeller,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
