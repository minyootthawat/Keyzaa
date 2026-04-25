import AdminWorkspaceLayout from "@/app/components/backoffice/admin-workspace-layout";

export default function AdminSellersLayout({ children }: { children: React.ReactNode }) {
  return <AdminWorkspaceLayout requiredPermission="admin:sellers:read">{children}</AdminWorkspaceLayout>;
}
