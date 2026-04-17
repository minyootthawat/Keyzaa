"use client";

import React, { createContext, useContext, useState } from "react";
import type { User, Seller } from "@/app/types";

interface AuthContextType {
  user: User | null;
  seller: Seller | null;
  isSellerMode: boolean;
  isRegisteredSeller: boolean;
  login: (name: string) => void;
  logout: () => void;
  registerSeller: (data: { name: string; shopName: string; phone: string }) => void;
  toggleSellerMode: () => void;
  updateSeller: (data: Partial<Seller>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("keyzaa_user");
    if (!saved) return null;
    try { return JSON.parse(saved) as User; } catch { return null; }
  });
  const [seller, setSeller] = useState<Seller | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("keyzaa_seller");
    if (!saved) return null;
    try { return JSON.parse(saved) as Seller; } catch { return null; }
  });
  const [isSellerMode, setIsSellerMode] = useState(false);

  const login = (name: string) => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      role: "buyer",
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    localStorage.setItem("keyzaa_user", JSON.stringify(newUser));
  };

  const registerSeller = (data: { name: string; shopName: string; phone: string }) => {
    if (!user) {
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: data.name,
        role: "seller",
        createdAt: new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem("keyzaa_user", JSON.stringify(newUser));

      const newSeller: Seller = {
        id: `sel_${Date.now()}`,
        userId: newUser.id,
        shopName: data.shopName,
        phone: data.phone,
        rating: 0,
        salesCount: 0,
        balance: 0,
        pendingBalance: 0,
        createdAt: new Date().toISOString(),
      };
      newUser.sellerId = newSeller.id;
      localStorage.setItem("keyzaa_user", JSON.stringify(newUser));
      setSeller(newSeller);
      localStorage.setItem("keyzaa_seller", JSON.stringify(newSeller));
      setIsSellerMode(true);
      return;
    }

    const newSeller: Seller = {
      id: `sel_${Date.now()}`,
      userId: user.id,
      shopName: data.shopName,
      phone: data.phone,
      rating: 0,
      salesCount: 0,
      balance: 0,
      pendingBalance: 0,
      createdAt: new Date().toISOString(),
    };
    const updatedUser: User = { ...user, role: user.role === "buyer" ? "both" : user.role, sellerId: newSeller.id };
    setUser(updatedUser);
    setSeller(newSeller);
    setIsSellerMode(true);
    localStorage.setItem("keyzaa_user", JSON.stringify(updatedUser));
    localStorage.setItem("keyzaa_seller", JSON.stringify(newSeller));
  };

  const updateSeller = (data: Partial<Seller>) => {
    if (!seller) return;
    const updated = { ...seller, ...data };
    setSeller(updated);
    localStorage.setItem("keyzaa_seller", JSON.stringify(updated));
  };

  const toggleSellerMode = () => {
    if (!seller) return;
    setIsSellerMode((prev) => !prev);
  };

  const logout = () => {
    setUser(null);
    setSeller(null);
    setIsSellerMode(false);
    localStorage.removeItem("keyzaa_user");
    localStorage.removeItem("keyzaa_seller");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        seller,
        isSellerMode,
        isRegisteredSeller: !!seller,
        login,
        logout,
        registerSeller,
        toggleSellerMode,
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
