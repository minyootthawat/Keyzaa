"use client";

import AdminRouteGuard from "@/app/components/AdminRouteGuard";
import AdminSidebar from "@/app/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRouteGuard requiredPermission="admin:overview:read">
      <div className="section-container py-8 md:py-12">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-7">
          <AdminSidebar />
          <div>{children}</div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
