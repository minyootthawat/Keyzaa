"use client";

import AdminRouteGuard from "@/app/components/AdminRouteGuard";
import AdminSidebar from "@/app/components/AdminSidebar";
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
      <div className="section-container py-8 md:py-12">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-7">
          <AdminSidebar />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
