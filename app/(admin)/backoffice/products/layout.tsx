import AdminWorkspaceLayout from "@/app/components/backoffice/admin-workspace-layout";

export default function AdminProductsLayout({ children }: { children: React.ReactNode }) {
  return <AdminWorkspaceLayout requiredPermission="admin:listings:read">{children}</AdminWorkspaceLayout>;
}
