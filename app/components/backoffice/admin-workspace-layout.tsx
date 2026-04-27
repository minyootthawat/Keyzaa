"use client";

import AdminRouteGuard from "@/app/components/AdminRouteGuard";
import type { AdminPermission } from "@/lib/auth/admin";

interface AdminWorkspaceLayoutProps {
  children: React.ReactNode;
  requiredPermission?: AdminPermission;
}

export default function AdminWorkspaceLayout({
  children,
  requiredPermission = "admin:overview:read",
}: AdminWorkspaceLayoutProps) {
  return (
    <AdminRouteGuard requiredPermission={requiredPermission}>
      <div>{children}</div>
    </AdminRouteGuard>
  );
}
