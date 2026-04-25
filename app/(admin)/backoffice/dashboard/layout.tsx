import AdminWorkspaceLayout from "@/app/components/backoffice/admin-workspace-layout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminWorkspaceLayout requiredPermission="admin:overview:read">{children}</AdminWorkspaceLayout>;
}
