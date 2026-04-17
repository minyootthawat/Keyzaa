"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function SellerRouteGuard({ children }: { children: React.ReactNode }) {
  const { isRegisteredSeller } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isRegisteredSeller) {
      router.push("/seller/register");
    }
  }, [isRegisteredSeller, router]);

  if (!isRegisteredSeller) return null;

  return <>{children}</>;
}
