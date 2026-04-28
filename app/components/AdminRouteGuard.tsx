"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminPermission } from "@/lib/auth/admin";

interface AdminUser {
  email: string;
  name: string;
  adminRole: string | null;
  adminPermissions: string[];
  isAdmin: boolean;
}

interface AdminRouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: AdminPermission;
}

export default function AdminRouteGuard({ children, requiredPermission = "admin:access" }: AdminRouteGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    // Call /api/admin/me which reads the HttpOnly admin_token cookie directly.
    // No Authorization header needed — the browser sends the cookie automatically.
    fetch("/api/admin/me")
      .then(async (res) => {
        if (!res.ok) throw new Error("not authenticated");
        const data = await res.json();
        if (!data.user?.isAdmin) throw new Error("not admin");
        setAdminUser(data.user);
      })
      .catch(() => {
        setAdminUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Redirect in useEffect to avoid setState during render
  useEffect(() => {
    if (!loading && !adminUser) {
      router.push("/backoffice/login");
    }
  }, [loading, adminUser, router]);

  // Permission check runs in useEffect to avoid setState during render
  useEffect(() => {
    if (!adminUser) return;
    const canAccess = adminUser.isAdmin && adminUser.adminPermissions.includes(requiredPermission);
    if (!canAccess) {
      router.push("/backoffice/login");
    }
  }, [adminUser, requiredPermission, router]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-warning border-t-transparent" />
      </div>
    );
  }

  if (!adminUser) return null;

  return <>{children}</>;
}
