"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/app/context/AuthContext";
import { CartProvider } from "@/app/context/CartContext";
import { ThemeProvider } from "@/app/context/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <CartProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </CartProvider>
      </AuthProvider>
    </SessionProvider>
  );
}