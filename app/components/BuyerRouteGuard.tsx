"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function BuyerRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Homepage, products, and checkout are public — skip guard
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/products" ||
    pathname.startsWith("/products/") ||
    pathname === "/checkout";

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.push("/");
    }
  }, [loading, user, router, isPublicRoute]);

  // Show loading skeleton or nothing only on protected routes
  if (loading) return null;
  if (!user && !isPublicRoute) return null;

  return <>{children}</>;
}