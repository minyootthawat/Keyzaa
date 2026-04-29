"use client";

import AdminRouteGuard from "@/app/components/AdminRouteGuard";
import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import type { AdminRole } from "@/lib/auth/admin";
import type { Admin, AdminAuditLog, AdminIpAllowlist } from "@/lib/db/admin-db";

type TabId = "admins" | "roles" | "audit" | "ip";

interface AdminRow extends Admin {}

const ROLE_CONFIG: Record<AdminRole, { labelTh: string; labelEn: string; emoji: string; color: string; bg: string; border: string }> = {
  super_admin: { labelTh: "Super Admin", labelEn: "Super Admin", emoji: "👑", color: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/25" },
  ops_admin: { labelTh: "Ops Admin", labelEn: "Ops Admin", emoji: "📊", color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/25" },
  support_admin: { labelTh: "Support", labelEn: "Support", emoji: "🎧", color: "text-green-400", bg: "bg-green-500/15", border: "border-green-500/25" },
  catalog_admin: { labelTh: "Catalog", labelEn: "Catalog", emoji: "🏷️", color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/25" },
};

export default function AdminAdminsPage() {
  return (
    <AdminRouteGuard requiredPermission="admin:users:read">
      <AdminAdminsContent />
    </AdminRouteGuard>
  );
}

function AdminAdminsContent() {
  const { lang } = useLanguage();
  const { adminPermissions } = useAuth();
  const canWrite = adminPermissions.includes("admin:users:write");

  const [activeTab, setActiveTab] = useState<TabId>("admins");
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [adminsError, setAdminsError] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminRow | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Add form
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState<AdminRole>("support_admin");

  // Edit role
  const [editRole, setEditRole] = useState<AdminRole>("support_admin");

  // Audit log
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState({ adminId: "", action: "", dateFrom: "", dateTo: "" });
  const [auditOffset, setAuditOffset] = useState(0);
  const AUDIT_LIMIT = 30;

  // IP Allowlist
  const [ipEntries, setIpEntries] = useState<AdminIpAllowlist[]>([]);
  const [ipLoading, setIpLoading] = useState(false);
  const [showAddIpModal, setShowAddIpModal] = useState(false);
  const [ipForm, setIpForm] = useState({ ip: "", label: "" });
  const [ipModalLoading, setIpModalLoading] = useState(false);

  const t = (key: string) =>
    ({
      heading: lang === "th" ? "จัดการแอดมิน" : "Admin Management",
      subtitle: lang === "th" ? "จัดการบัญชีแอดมิน สิทธิ์การเข้าถึง และบันทึกตรวจสอบ" : "Manage admin accounts, access permissions, and audit logs",
      tabAdmins: lang === "th" ? "แอดมิน" : "Admins",
      tabRoles: lang === "th" ? "บทบาทและสิทธิ์" : "Roles & Permissions",
      tabAudit: lang === "th" ? "บันทึกตรวจสอบ" : "Audit Log",
      tabIp: lang === "th" ? "ควบคุมการเข้าถึง IP" : "IP Access Control",
      addAdmin: lang === "th" ? "เพิ่มแอดมิน" : "Add Admin",
      editAdmin: lang === "th" ? "แก้ไขแอดมิน" : "Edit Admin",
      deleteAdmin: lang === "th" ? "ลบแอดมิน" : "Delete Admin",
      confirmDelete: lang === "th" ? "ยืนยันลบแอดมินนี้?" : "Are you sure you want to delete this admin?",
      email: lang === "th" ? "อีเมล" : "Email",
      name: lang === "th" ? "ชื่อ" : "Name",
      role: lang === "th" ? "บทบาท" : "Role",
      actions: lang === "th" ? "การกระทำ" : "Actions",
      save: lang === "th" ? "บันทึก" : "Save",
      cancel: lang === "th" ? "ยกเลิก" : "Cancel",
      delete: lang === "th" ? "ลบ" : "Delete",
      searchUser: lang === "th" ? "ค้นหาผู้ใช้ด้วยอีเมล..." : "Search user by email...",
      noAdmins: lang === "th" ? "ยังไม่มีแอดมิน" : "No admins found",
      time: lang === "th" ? "เวลา" : "Time",
      admin: lang === "th" ? "แอดมิน" : "Admin",
      action: lang === "th" ? "การกระทำ" : "Action",
      details: lang === "th" ? "รายละเอียด" : "Details",
      ipAddress: lang === "th" ? "ที่อยู่ IP" : "IP Address",
      label: lang === "th" ? "ป้ายกำกับ" : "Label",
      status: lang === "th" ? "สถานะ" : "Status",
      active: lang === "th" ? "เปิดใช้งาน" : "Active",
      inactive: lang === "th" ? "ปิดใช้งาน" : "Inactive",
      addIp: lang === "th" ? "เพิ่ม IP" : "Add IP",
      noLogs: lang === "th" ? "ไม่พบบันทึก" : "No logs found",
      noIpEntries: lang === "th" ? "ยังไม่มีรายการ IP" : "No IP entries found",
      filterAll: lang === "th" ? "ทั้งหมด" : "All",
      filterAdmin: lang === "th" ? "กรองตามแอดมิน" : "Filter by admin",
      filterAction: lang === "th" ? "กรองตามการกระทำ" : "Filter by action",
      filterDateFrom: lang === "th" ? "จากวันที่" : "From date",
      filterDateTo: lang === "th" ? "ถึงวันที่" : "To date",
      applyFilter: lang === "th" ? "ค้นหา" : "Search",
      clearFilter: lang === "th" ? "ล้าง" : "Clear",
      createdAt: lang === "th" ? "สร้างเมื่อ" : "Created",
      selectExistingUser: lang === "th" ? "เลือกผู้ใช้ที่มีอยู่" : "Select Existing User",
      createNewUser: lang === "th" ? "สร้างผู้ใช้ใหม่" : "Create New User",
      enterEmail: lang === "th" ? "กรอกอีเมล" : "Enter email",
      enterName: lang === "th" ? "กรอกชื่อ" : "Enter name",
      creatingUser: lang === "th" ? "กำลังสร้างผู้ใช้..." : "Creating user...",
    }[key] ?? key);

  const tabs: { id: TabId; label: string }[] = [
    { id: "admins", label: t("tabAdmins") },
    { id: "roles", label: t("tabRoles") },
    { id: "audit", label: t("tabAudit") },
    { id: "ip", label: t("tabIp") },
  ];

  // Fetch admins
  const fetchAdmins = () => {
    setAdminsLoading(true);
    fetch("/api/backoffice/admins")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setAdmins(d.admins ?? []))
      .catch((e) => setAdminsError(e.message))
      .finally(() => setAdminsLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "admins") fetchAdmins();
    }, 150);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Fetch audit logs
  useEffect(() => {
    if (activeTab !== "audit") return;
    setAuditLoading(true);
    let url = `/api/backoffice/admins/audit-log?limit=${AUDIT_LIMIT}&offset=${auditOffset}`;
    if (auditFilter.adminId) url += `&adminId=${auditFilter.adminId}`;
    if (auditFilter.action) url += `&action=${encodeURIComponent(auditFilter.action)}`;
    if (auditFilter.dateFrom) url += `&dateFrom=${auditFilter.dateFrom}`;
    if (auditFilter.dateTo) url += `&dateTo=${auditFilter.dateTo}`;
    fetch(url)
      .then(async (r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => setAuditLogs(d.logs ?? []))
      .catch(() => setAuditLogs([]))
      .finally(() => setAuditLoading(false));
  }, [activeTab, auditOffset, auditFilter.adminId, auditFilter.action, auditFilter.dateFrom, auditFilter.dateTo]);

  // Fetch IP allowlist
  useEffect(() => {
    if (activeTab !== "ip") return;
    setIpLoading(true);
    fetch("/api/backoffice/admins/ip-allowlist")
      .then(async (r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => setIpEntries(d.entries ?? []))
      .catch(() => setIpEntries([]))
      .finally(() => setIpLoading(false));
  }, [activeTab]);

  // Add admin
  const handleAddAdmin = async () => {
    setModalLoading(true);
    setModalError(null);
    try {
      if (!addEmail) {
        throw new Error(lang === "th" ? "กรุณากรอกอีเมล" : "Please enter email");
      }

      const res = await fetch("/api/backoffice/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail, role: addRole }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `HTTP ${res.status}`);
      }
      setShowAddModal(false);
      setAddEmail("");
      setAddRole("support_admin");
      fetchAdmins();
      setActionSuccess(lang === "th" ? "เพิ่มแอดมินแล้ว" : "Admin added");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : (lang === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
    } finally { setModalLoading(false); }
  };

  // Edit admin role
  const handleEditAdmin = async () => {
    if (!selectedAdmin) return;
    setModalLoading(true);
    setModalError(null);
    try {
      const res = await fetch(`/api/backoffice/admins/${selectedAdmin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `HTTP ${res.status}`);
      }
      setShowEditModal(false);
      setSelectedAdmin(null);
      fetchAdmins();
      setActionSuccess(lang === "th" ? "อัปเดตบทบาทแล้ว" : "Role updated");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : (lang === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
    } finally { setModalLoading(false); }
  };

  // Delete admin
  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    setModalLoading(true);
    setModalError(null);
    try {
      const res = await fetch(`/api/backoffice/admins/${selectedAdmin.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `HTTP ${res.status}`);
      }
      setShowDeleteModal(false);
      setSelectedAdmin(null);
      fetchAdmins();
      setActionSuccess(lang === "th" ? "ลบแอดมินแล้ว" : "Admin deleted");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : (lang === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
    } finally { setModalLoading(false); }
  };

  // Toggle IP entry
  const handleToggleIp = async (entry: AdminIpAllowlist) => {
    try {
      const res = await fetch("/api/backoffice/admins/ip-allowlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, isActive: !entry.is_active }),
      });
      if (!res.ok) return;
      setIpEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, is_active: !e.is_active } : e));
    } catch { /* ignore */ }
  };

  // Add IP entry
  const handleAddIp = async () => {
    if (!ipForm.ip || !ipForm.label) return;
    setIpModalLoading(true);
    setModalError(null);
    try {
      const res = await fetch("/api/backoffice/admins/ip-allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: ipForm.ip, label: ipForm.label }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `HTTP ${res.status}`);
      }
      setShowAddIpModal(false);
      setIpForm({ ip: "", label: "" });
      const r = await fetch("/api/backoffice/admins/ip-allowlist");
      const d = await r.json();
      setIpEntries(d.entries ?? []);
      setActionSuccess(lang === "th" ? "เพิ่ม IP แล้ว" : "IP added");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : (lang === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
    } finally { setIpModalLoading(false); }
  };

  // Delete IP entry
  const handleDeleteIp = async (id: string) => {
    try {
      const res = await fetch(`/api/backoffice/admins/ip-allowlist?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      setIpEntries((prev) => prev.filter((e) => e.id !== id));
    } catch { /* ignore */ }
  };

  const openEditModal = (admin: AdminRow) => {
    setSelectedAdmin(admin);
    setEditRole(admin.role);
    setShowEditModal(true);
  };

  const openDeleteModal = (admin: AdminRow) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  const PERMISSIONS_BY_ROLE: Record<AdminRole, { labelTh: string; labelEn: string }[]> = {
    super_admin: [
      { labelTh: "ทุกสิทธิ์การเข้าถึง", labelEn: "Full system access" },
      { labelTh: "จัดการแอดมิน", labelEn: "Manage admins" },
      { labelTh: "ตั้งค่าระบบ", labelEn: "System settings" },
      { labelTh: "ดู Analytics", labelEn: "View analytics" },
    ],
    ops_admin: [
      { labelTh: "ภาพรวมระบบ", labelEn: "Overview" },
      { labelTh: "จัดการคำสั่งซื้อ", labelEn: "Manage orders" },
      { labelTh: "จัดการร้านค้า", labelEn: "Manage sellers" },
      { labelTh: "จัดการสินค้า", labelEn: "Manage products" },
      { labelTh: "จัดการผู้ใช้", labelEn: "Manage users" },
      { labelTh: "ดู Analytics", labelEn: "View analytics" },
    ],
    support_admin: [
      { labelTh: "ดูคำสั่งซื้อ", labelEn: "View orders" },
      { labelTh: "จัดการร้านค้า", labelEn: "Manage sellers" },
      { labelTh: "จัดการผู้ใช้", labelEn: "Manage users" },
    ],
    catalog_admin: [
      { labelTh: "ภาพรวมระบบ", labelEn: "Overview" },
      { labelTh: "จัดการสินค้า", labelEn: "Manage products" },
      { labelTh: "จัดการประกาศ", labelEn: "Manage listings" },
    ],
  };

  const roleOptions: AdminRole[] = ["super_admin", "ops_admin", "support_admin", "catalog_admin"];

  return (
    <div className="space-y-6 md:space-y-7">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="type-h1">{t("heading")}</h1>
        <p className="type-body max-w-[66ch] text-text-subtle">{t("subtitle")}</p>
      </div>

      {actionSuccess && (
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success font-medium">✓ {actionSuccess}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === tab.id ? "text-brand-primary" : "text-text-muted hover:text-text-main"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />}
          </button>
        ))}
      </div>

      {/* ─── Tab 1: Admins ─── */}
      {activeTab === "admins" && (
        <div className="space-y-4">
          {canWrite && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-secondary"
              >
                + {t("addAdmin")}
              </button>
            </div>
          )}

          {adminsLoading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 w-full rounded-xl bg-bg-surface/60 animate-pulse" />)}</div>
          ) : adminsError ? (
            <div className="surface-card flex min-h-[200px] items-center justify-center p-6 text-center">
              <p className="text-error type-body">{adminsError}</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="surface-card flex min-h-[200px] items-center justify-center p-6 text-center">
              <p className="text-text-muted type-body">{t("noAdmins")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border-subtle">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-surface/70">
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">{t("email")}</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">{t("role")}</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">{t("createdAt")}</th>
                    {canWrite && <th className="px-4 py-3 text-right font-semibold text-text-muted">{t("actions")}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {admins.map((admin) => {
                    const cfg = ROLE_CONFIG[admin.role];
                    return (
                      <tr key={admin.id} className="bg-bg-base hover:bg-bg-surface/50 transition-colors">
                        <td className="px-4 py-3 text-text-main">{admin.email ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                            {cfg.emoji} {cfg.labelEn}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-muted">
                          {admin.created_at ? new Date(admin.created_at).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                        </td>
                        {canWrite && (
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => openEditModal(admin)}
                              className="mr-2 rounded-lg border border-border-subtle bg-bg-surface px-3 py-1.5 text-xs font-semibold text-text-subtle transition-colors hover:border-brand-primary hover:text-brand-primary"
                            >
                              {lang === "th" ? "แก้ไข" : "Edit"}
                            </button>
                            <button
                              onClick={() => openDeleteModal(admin)}
                              className="rounded-lg bg-error/80 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-error"
                            >
                              {t("delete")}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab 2: Roles & Permissions ─── */}
      {activeTab === "roles" && (
        <div className="grid gap-6 sm:grid-cols-2">
          {roleOptions.map((role) => {
            const cfg = ROLE_CONFIG[role];
            const perms = PERMISSIONS_BY_ROLE[role];
            return (
              <div key={role} className={`surface-card rounded-2xl border p-6 ${cfg.border}`}>
                <div className="mb-4 flex items-center gap-3">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl ${cfg.bg}`}>{cfg.emoji}</span>
                  <div>
                    <p className={`font-bold ${cfg.color}`}>{cfg.labelEn}</p>
                    <p className="text-xs text-text-muted">{cfg.labelTh}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {perms.map((p) => (
                    <div key={p.labelEn} className="flex items-center gap-2">
                      <span className="text-success text-xs">✓</span>
                      <span className="text-sm text-text-subtle">{lang === "th" ? p.labelTh : p.labelEn}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Tab 3: Audit Log ─── */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4">
            <input
              type="text"
              placeholder={t("filterAdmin")}
              value={auditFilter.adminId}
              onChange={(e) => setAuditFilter((f) => ({ ...f, adminId: e.target.value }))}
              className="h-10 flex-1 min-w-[160px] rounded-lg border border-border-subtle bg-bg-base px-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
            />
            <input
              type="text"
              placeholder={t("filterAction")}
              value={auditFilter.action}
              onChange={(e) => setAuditFilter((f) => ({ ...f, action: e.target.value }))}
              className="h-10 flex-1 min-w-[160px] rounded-lg border border-border-subtle bg-bg-base px-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
            />
            <input
              type="date"
              value={auditFilter.dateFrom}
              onChange={(e) => setAuditFilter((f) => ({ ...f, dateFrom: e.target.value }))}
              className="h-10 rounded-lg border border-border-subtle bg-bg-base px-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
            />
            <input
              type="date"
              value={auditFilter.dateTo}
              onChange={(e) => setAuditFilter((f) => ({ ...f, dateTo: e.target.value }))}
              className="h-10 rounded-lg border border-border-subtle bg-bg-base px-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
            />
            <button
              onClick={() => { setAuditOffset(0); setAuditFilter({ adminId: "", action: "", dateFrom: "", dateTo: "" }); }}
              className="h-10 rounded-lg border border-border-subtle bg-bg-base px-4 text-sm font-semibold text-text-subtle hover:text-text-main transition-colors"
            >
              {t("clearFilter")}
            </button>
          </div>

          {auditLoading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-14 w-full rounded-xl bg-bg-surface/60 animate-pulse" />)}</div>
          ) : auditLogs.length === 0 ? (
            <div className="surface-card flex min-h-[200px] items-center justify-center p-6 text-center">
              <p className="text-text-muted type-body">{t("noLogs")}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-border-subtle">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-surface/70">
                      <th className="px-4 py-3 text-left font-semibold text-text-muted">{t("time")}</th>
                      <th className="px-4 py-3 text-left font-semibold text-text-muted">{t("admin")}</th>
                      <th className="px-4 py-3 text-left font-semibold text-text-muted">{t("action")}</th>
                      <th className="px-4 py-3 text-left font-semibold text-text-muted">{t("details")}</th>
                      <th className="px-4 py-3 text-left font-semibold text-text-muted">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="bg-bg-base hover:bg-bg-surface/50 transition-colors">
                        <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3 text-text-subtle">{log.admin_id}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-brand-primary/15 px-2.5 py-1 text-xs font-semibold text-brand-primary">{log.action}</span>
                        </td>
                        <td className="px-4 py-3 text-text-muted max-w-[200px] truncate">
                          {log.details ? JSON.stringify(log.details) : "—"}
                        </td>
                        <td className="px-4 py-3 text-text-muted font-mono text-xs">{log.ip_address ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-muted">{auditOffset + 1}–{auditOffset + auditLogs.length}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAuditOffset((o) => Math.max(0, o - AUDIT_LIMIT))}
                    disabled={auditOffset === 0}
                    className="rounded-xl border border-border-subtle bg-bg-surface px-3 py-1.5 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main disabled:opacity-40"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setAuditOffset((o) => o + AUDIT_LIMIT)}
                    disabled={auditLogs.length < AUDIT_LIMIT}
                    className="rounded-xl border border-border-subtle bg-bg-surface px-3 py-1.5 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Tab 4: IP Access Control ─── */}
      {activeTab === "ip" && (
        <div className="space-y-4">
          {canWrite && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddIpModal(true)}
                className="rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-secondary"
              >
                + {t("addIp")}
              </button>
            </div>
          )}

          {ipLoading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-14 w-full rounded-xl bg-bg-surface/60 animate-pulse" />)}</div>
          ) : ipEntries.length === 0 ? (
            <div className="surface-card flex min-h-[200px] items-center justify-center p-6 text-center">
              <p className="text-text-muted type-body">{t("noIpEntries")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border-subtle">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-surface/70">
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">{t("ipAddress")}</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">{t("label")}</th>
                    <th className="px-4 py-3 text-center font-semibold text-text-muted">{t("status")}</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">{t("createdAt")}</th>
                    {canWrite && <th className="px-4 py-3 text-right font-semibold text-text-muted">{t("actions")}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {ipEntries.map((entry) => (
                    <tr key={entry.id} className="bg-bg-base hover:bg-bg-surface/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-text-main">{entry.ip_address}</td>
                      <td className="px-4 py-3 text-text-subtle">{entry.label}</td>
                      <td className="px-4 py-3 text-center">
                        {entry.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                            ✓ {t("active")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-error/15 px-2.5 py-1 text-xs font-semibold text-error">
                            ✕ {t("inactive")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {entry.created_at ? new Date(entry.created_at).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                      </td>
                      {canWrite && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleToggleIp(entry)}
                            className={`mr-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              entry.is_active
                                ? "border-error/40 text-error hover:bg-error/10"
                                : "border-success/40 text-success hover:bg-success/10"
                            }`}
                          >
                            {entry.is_active ? (lang === "th" ? "ปิดใช้" : "Disable") : (lang === "th" ? "เปิดใช้" : "Enable")}
                          </button>
                          <button
                            onClick={() => handleDeleteIp(entry.id)}
                            className="rounded-lg bg-error/80 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-error"
                          >
                            {t("delete")}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Add Admin Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="surface-card glass-panel w-full max-w-md rounded-2xl p-6">
            <h2 className="type-h2 mb-4">{t("addAdmin")}</h2>
            {modalError && (
              <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{modalError}</div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main">{t("email")}</label>
                <input
                  type="email"
                  placeholder={t("enterEmail")}
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full rounded-xl border border-border-subtle bg-bg-base px-4 py-2.5 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main">{t("role")}</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as AdminRole)}
                  className="w-full rounded-xl border border-border-subtle bg-bg-base px-4 py-2.5 text-sm text-text-main focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{ROLE_CONFIG[r].emoji} {ROLE_CONFIG[r].labelEn}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setModalError(null);
                  setAddEmail("");
                }}
                className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm font-semibold text-text-subtle transition-colors hover:text-text-main"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleAddAdmin}
                disabled={!addEmail || modalLoading}
                className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-secondary disabled:opacity-50"
              >
                {modalLoading ? "..." : t("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Admin Modal ─── */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="surface-card glass-panel w-full max-w-md rounded-2xl p-6">
            <h2 className="type-h2 mb-2">{t("editAdmin")}</h2>
            <p className="mb-4 text-sm text-text-muted">{selectedAdmin.email}</p>
            {modalError && (
              <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{modalError}</div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main">{t("role")}</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as AdminRole)}
                  className="w-full rounded-xl border border-border-subtle bg-bg-base px-4 py-2.5 text-sm text-text-main focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{ROLE_CONFIG[r].emoji} {ROLE_CONFIG[r].labelEn}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setShowEditModal(false); setModalError(null); }}
                className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm font-semibold text-text-subtle transition-colors hover:text-text-main"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleEditAdmin}
                disabled={modalLoading}
                className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-secondary disabled:opacity-50"
              >
                {modalLoading ? "..." : t("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Admin Modal ─── */}
      {showDeleteModal && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="surface-card glass-panel w-full max-w-sm rounded-2xl p-6">
            <h2 className="type-h2 mb-2">{t("deleteAdmin")}</h2>
            <p className="mb-4 text-sm text-text-muted">{selectedAdmin.email}</p>
            <p className="mb-6 text-sm text-error">{t("confirmDelete")}</p>
            {modalError && (
              <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{modalError}</div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setModalError(null); }}
                className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm font-semibold text-text-subtle transition-colors hover:text-text-main"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDeleteAdmin}
                disabled={modalLoading}
                className="rounded-xl bg-error px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-error/85 disabled:opacity-50"
              >
                {modalLoading ? "..." : t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add IP Modal ─── */}
      {showAddIpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="surface-card glass-panel w-full max-w-md rounded-2xl p-6">
            <h2 className="type-h2 mb-4">{t("addIp")}</h2>
            {modalError && (
              <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{modalError}</div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main">{t("ipAddress")}</label>
                <input
                  type="text"
                  placeholder="192.168.1.1"
                  value={ipForm.ip}
                  onChange={(e) => setIpForm((f) => ({ ...f, ip: e.target.value }))}
                  className="w-full rounded-xl border border-border-subtle bg-bg-base px-4 py-2.5 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main">{t("label")}</label>
                <input
                  type="text"
                  placeholder={lang === "th" ? "เช่น สำนักงานใหญ่" : "e.g. Head Office"}
                  value={ipForm.label}
                  onChange={(e) => setIpForm((f) => ({ ...f, label: e.target.value }))}
                  className="w-full rounded-xl border border-border-subtle bg-bg-base px-4 py-2.5 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setShowAddIpModal(false); setModalError(null); setIpForm({ ip: "", label: "" }); }}
                className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm font-semibold text-text-subtle transition-colors hover:text-text-main"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleAddIp}
                disabled={!ipForm.ip || !ipForm.label || ipModalLoading}
                className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-secondary disabled:opacity-50"
              >
                {ipModalLoading ? "..." : t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
