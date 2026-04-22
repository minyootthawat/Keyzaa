"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import type { AdminPermission } from "@/lib/auth/admin";

interface AdminRouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: AdminPermission;
}

export default function AdminRouteGuard({ children, requiredPermission = "admin:access" }: AdminRouteGuardProps) {
  const { isAdmin, adminPermissions, loading } = useAuth();
  const router = useRouter();
  const canAccess = isAdmin && adminPermissions.includes(requiredPermission);

  useEffect(() => {
    if (!loading && !canAccess) {
      router.push("/admin/login");
    }
  }, [canAccess, loading, router]);

  if (loading || !canAccess) return null;

  return <>{children}</>;
}
