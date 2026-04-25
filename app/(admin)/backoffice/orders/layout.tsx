import AdminWorkspaceLayout from "@/app/components/backoffice/admin-workspace-layout";

export default function AdminOrdersLayout({ children }: { children: React.ReactNode }) {
  return <AdminWorkspaceLayout requiredPermission="admin:orders:read">{children}</AdminWorkspaceLayout>;
}
