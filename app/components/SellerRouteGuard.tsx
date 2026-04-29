"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function SellerRouteGuard({ children }: { children: React.ReactNode }) {
  const { isRegisteredSeller, loading, user: authUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isRegisterPage = pathname === "/seller/register";

  // Derive hasSellerId from JWT to avoid waiting for fetchSeller()
  // (sellerId is embedded in JWT at login time)
  const hasSellerIdInToken = !!authUser?.sellerId;

  useEffect(() => {
    // Wait for auth to finish loading before making any redirect decisions
    if (loading) return;

    if (isRegisterPage) {
      // Already a seller → go to dashboard
      if (isRegisteredSeller) {
        router.push("/seller/dashboard");
        return;
      }
      // Not a seller → stay on register page (authenticated buyer can register)
      return;
    }

    // Non-register seller routes: require registered seller
    if (!isRegisteredSeller && !hasSellerIdInToken) {
      router.push("/seller/register");
    }
  }, [isRegisteredSeller, loading, isRegisterPage, router, hasSellerIdInToken]);

  // Show nothing while auth is still loading (prevents premature redirect)
  if (loading) return null;

  if (isRegisterPage) {
    return <>{children}</>;
  }

  // Non-register page: redirect if not a registered seller
  if (!isRegisteredSeller && !hasSellerIdInToken) return null;

  return <>{children}</>;
}
