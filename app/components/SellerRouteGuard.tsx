"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function SellerRouteGuard({ children }: { children: React.ReactNode }) {
  const { isRegisteredSeller, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isRegisteredSeller) {
      router.push("/seller/register");
    }
  }, [loading, isRegisteredSeller, router]);

  if (loading || !isRegisteredSeller) return null;

  return <>{children}</>;
}