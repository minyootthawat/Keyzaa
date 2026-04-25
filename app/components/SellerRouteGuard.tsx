"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function SellerRouteGuard({ children }: { children: React.ReactNode }) {
  const { isRegisteredSeller, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isRegisterPage = pathname === "/seller/register";

  useEffect(() => {
    if (!loading && !isRegisteredSeller && !isRegisterPage) {
      router.push("/seller/register");
    }
  }, [loading, isRegisteredSeller, isRegisterPage, router]);

  if (loading || (!isRegisteredSeller && !isRegisterPage)) return null;

  return <>{children}</>;
}
