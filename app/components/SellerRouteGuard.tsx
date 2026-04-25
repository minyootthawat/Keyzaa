"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function SellerRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isRegisteredSeller } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isRegisterPage = pathname === "/seller/register";
  const isAuthenticated = !!user;

  useEffect(() => {
    if (isRegisterPage) {
      // Already a seller → go to dashboard
      if (isRegisteredSeller) {
        router.push("/seller/dashboard");
        return;
      }
      // Not a seller → stay on register page (authenticated buyer can register)
      // No action needed, stay here
      return;
    }

    // Non-register seller routes: require registered seller
    if (!isRegisteredSeller) {
      router.push("/seller/register");
    }
  }, [isRegisteredSeller, isRegisterPage, router]);

  if (isRegisterPage) {
    // Non-seller visiting register page → show form (buyer can register as seller)
    // Redirecting to "/" only happens if we add auth requirement at API level
    return <>{children}</>;
  }

  // Non-register page: redirect if not a registered seller
  if (!isRegisteredSeller) return null;

  return <>{children}</>;
}
