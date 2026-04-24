"use client";

import { useSession, signIn, signOut as nextAuthSignOut } from "next-auth/react";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import type { User, Seller } from "@/app/types";

interface AuthContextType {
  user: User | null;
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

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("keyzaa_token");
}

function setToken(token: string) {
  localStorage.setItem("keyzaa_token", token);
}

function clearToken() {
  localStorage.removeItem("keyzaa_token");
}

function userFromSession(session: { user?: { id: string; name?: string | null; email?: string | null; role?: string; sellerId?: string } } | null): User | null {
  if (!session?.user) return null;
  const u = session.user;
  return {
    id: u.id,
    name: u.name || "",
    email: u.email || "",
    role: (u.role || "buyer") as User["role"],
    sellerId: u.sellerId,
    createdAt: "",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update: updateSession } = useSession();
  const sellerIdRef = useRef<string | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<User["adminRole"]>(null);
  const [adminPermissions, setAdminPermissions] = useState<NonNullable<User["adminPermissions"]>>([]);
  const [accountResolved, setAccountResolved] = useState(false);

  const user = userFromSession(session);
  const loading = status === "loading" || !accountResolved;

  const fetchAccount = async () => {
    setAccountResolved(false);

    const token = getToken();
    if (!token) {
      setIsAdmin(false);
      setAdminRole(null);
      setAdminPermissions([]);
      setAccountResolved(true);
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setIsAdmin(Boolean(data.user?.isAdmin));
        setAdminRole(data.user?.adminRole ?? null);
        setAdminPermissions(Array.isArray(data.user?.adminPermissions) ? data.user.adminPermissions : []);
        setAccountResolved(true);
        return;
      }
    } catch {
      // ignore
    }

    setIsAdmin(false);
    setAdminRole(null);
    setAdminPermissions([]);
    setAccountResolved(true);
  };

  const fetchSeller = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch("/api/seller/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSeller(data.seller);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!user) {
      // Clearing account state is required when switching to an anonymous session.
      queueMicrotask(() => {
        setSeller(null);
        setIsAdmin(false);
        setAdminRole(null);
        setAdminPermissions([]);
        setAccountResolved(true);
      });
      sellerIdRef.current = null;
      return;
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    queueMicrotask(() => {
      void fetchAccount();
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.sellerId) {
      // Clearing seller state is required when switching back to a buyer-only session.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSeller(null);
      sellerIdRef.current = null;
      return;
    }
    if (user.sellerId !== sellerIdRef.current) {
      sellerIdRef.current = user.sellerId;
      fetchSeller();
    }
  }, [user?.sellerId]);

  const login = async (email: string, password: string) => {
    const loginResponse = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!loginResponse.ok) {
      const data = await loginResponse.json();
      throw new Error(data.error || "Login failed");
    }

    const loginData = await loginResponse.json();
    setToken(loginData.token);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      throw new Error(res.error);
    }

    await updateSession();
    // Force re-fetch of admin status with the new session
    setAccountResolved(false);
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

    const data = await res.json();
    setToken(data.token);
    await updateSession();
  };

  const registerSeller = async (data: { shopName: string; phone: string }) => {
    const token = getToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch("/api/seller/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const resData = await res.json();
      throw new Error(resData.error || "Seller registration failed");
    }

    const resData = await res.json();
    setSeller(resData.seller);
    await updateSession();
  };

  const updateSeller = (data: Partial<Seller>) => {
    setSeller((prev) => prev ? { ...prev, ...data } : prev);
  };

  const logout = async () => {
    clearToken();
    setSeller(null);
    await nextAuthSignOut({ redirect: false });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
