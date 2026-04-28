"use client";

import AdminRouteGuard from "@/app/components/AdminRouteGuard";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

const ITEMS_PER_PAGE = 20;

export default function AdminUsersPage() {
  const { lang } = useLanguage();
  const { adminPermissions } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<"all" | "active" | "banned">("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const canWrite = adminPermissions.includes("admin:users:write");

  const fetchUsers = (pageNum: number, filterVal: typeof filter, searchVal: string) => {
    setLoading(true);
    let url = `/api/backoffice/users?page=${pageNum}&limit=${ITEMS_PER_PAGE}`;
    if (filterVal === "active") url += "&status=active";
    else if (filterVal === "banned") url += "&status=banned";
    if (searchVal) url += `&search=${encodeURIComponent(searchVal)}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || `HTTP ${res.status}`); }
        return res.json();
      })
      .then((data: UsersResponse) => { setUsers(data.users); setTotal(data.total); setError(null); })
      .catch((err) => { setError(err.message || (lang === "th" ? "โหลดข้อมูลไม่สำเร็จ" : "Failed to load users.")); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(page, filter, search), search ? 400 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter, search]);

  const handleAction = async (userId: string, action: "ban" | "unban") => {
    setActionLoading(userId);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/backoffice/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || `HTTP ${res.status}`); }
      const updated = (await res.json()).user as User;
      setUsers((prev) => prev.map((u) => u.id === updated.id ? { ...u, status: updated.status } : u));
      setActionSuccess(action === "ban"
        ? (lang === "th" ? `แบนผู้ใช้ "${updated.email}" แล้ว` : `Banned "${updated.email}"`)
        : (lang === "th" ? `ปลดแบนผู้ใช้ "${updated.email}" แล้ว` : `Unbanned "${updated.email}"`));
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : (lang === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
    } finally { setActionLoading(null); }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAllSelection = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  const handleBulkBan = async () => {
    if (selectedUsers.size === 0) return;
    setBulkLoading(true);
    setActionSuccess(null);
    try {
      await Promise.all(
        [...selectedUsers].map((id) =>
          fetch(`/api/backoffice/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "ban" }),
          })
        )
      );
      setUsers((prev) =>
        prev.map((u) => (selectedUsers.has(u.id) ? { ...u, status: "banned" } : u))
      );
      setActionSuccess(
        lang === "th"
          ? `แบนผู้ใช้ ${selectedUsers.size} รายแล้ว`
          : `Banned ${selectedUsers.size} user(s)`
      );
      setSelectedUsers(new Set());
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : (lang === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkUnban = async () => {
    if (selectedUsers.size === 0) return;
    setBulkLoading(true);
    setActionSuccess(null);
    try {
      await Promise.all(
        [...selectedUsers].map((id) =>
          fetch(`/api/backoffice/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "unban" }),
          })
        )
      );
      setUsers((prev) =>
        prev.map((u) => (selectedUsers.has(u.id) ? { ...u, status: "active" } : u))
      );
      setActionSuccess(
        lang === "th"
          ? `ปลดแบนผู้ใช้ ${selectedUsers.size} รายแล้ว`
          : `Unbanned ${selectedUsers.size} user(s)`
      );
      setSelectedUsers(new Set());
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : (lang === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
    } finally {
      setBulkLoading(false);
    }
  };

  const activeCount = users.filter((u) => u.status === "active").length;
  const bannedCount = users.filter((u) => u.status === "banned").length;

  return (
    <AdminRouteGuard requiredPermission="admin:users:read">
      <div className="space-y-6 md:space-y-7">
        <div className="space-y-2">
          <h1 className="type-h1">{lang === "th" ? "จัดการผู้ใช้" : "Manage users"}</h1>
          <p className="type-body max-w-[66ch] text-text-subtle">
            {lang === "th" ? "ดูและจัดการบัญชีผู้ใช้ในระบบ" : "View and manage user accounts in the platform."}
          </p>
        </div>

        {actionSuccess && (
          <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success font-medium">✓ {actionSuccess}</div>
        )}

        {actionError && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger font-medium">
            {actionError}
          </div>
        )}

        {/* Bulk action toolbar */}
        {canWrite && selectedUsers.size > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-4 py-3">
            <span className="text-sm font-medium text-brand-primary">
              {selectedUsers.size} {lang === "th" ? "รายการเลือกแล้ว" : "selected"}
            </span>
            <button
              onClick={handleBulkBan}
              disabled={bulkLoading}
              className="rounded-lg bg-error px-3 py-1.5 text-xs font-semibold text-white hover:opacity-85 disabled:opacity-50"
            >
              {bulkLoading ? "..." : (lang === "th" ? "แบนที่เลือก" : "Ban selected")}
            </button>
            <button
              onClick={handleBulkUnban}
              disabled={bulkLoading}
              className="rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white hover:opacity-85 disabled:opacity-50"
            >
              {bulkLoading ? "..." : (lang === "th" ? "ปลดแบนที่เลือก" : "Unban selected")}
            </button>
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="ml-auto text-xs text-text-muted hover:text-text-main"
            >
              {lang === "th" ? "ยกเลิก" : "Clear"}
            </button>
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder={lang === "th" ? "ค้นหาอีเมลหรือชื่อ..." : "Search email or name..."}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-11 w-full max-w-sm rounded-xl border border-border-subtle bg-bg-surface px-4 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
          <div className="flex gap-2">
            {([
              { key: "all", label: lang === "th" ? "ทั้งหมด" : "All", count: total },
              { key: "active", label: lang === "th" ? "ใช้งาน" : "Active", count: activeCount },
              { key: "banned", label: lang === "th" ? "ถูกแบน" : "Banned", count: bannedCount },
            ] as const).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => { setFilter(key); setPage(1); }}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${filter === key ? "bg-brand-primary/20 text-brand-primary" : "bg-bg-surface text-text-subtle hover:bg-bg-surface/80"}`}
              >
                {label} {typeof count === "number" && count > 0 && <span className="ml-1 text-xs opacity-70">({count})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 w-full rounded-xl bg-bg-surface/60 animate-pulse" />)}</div>
        ) : error ? (
          <div className="surface-card flex min-h-[200px] items-center justify-center p-6 text-center">
            <p className="text-error type-body">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="surface-card flex min-h-[200px] items-center justify-center p-6 text-center">
            <p className="text-text-muted type-body">{lang === "th" ? "ไม่พบผู้ใช้" : "No users found"}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-border-subtle">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-surface/70">
                    {canWrite && (
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={users.length > 0 && selectedUsers.size === users.length}
                          onChange={toggleAllSelection}
                          className="h-4 w-4 rounded border-border-subtle bg-bg-base accent-brand-primary"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">{lang === "th" ? "ผู้ใช้" : "User"}</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">{lang === "th" ? "บทบาท" : "Role"}</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">{lang === "th" ? "โทรศัพท์" : "Phone"}</th>
                    <th className="px-4 py-3 text-center font-semibold text-text-muted">{lang === "th" ? "สถานะ" : "Status"}</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">{lang === "th" ? "เข้าร่วม" : "Joined"}</th>
                    {canWrite && <th className="px-4 py-3 text-right font-semibold text-text-muted">{lang === "th" ? "การกระทำ" : "Actions"}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {users.map((user) => (
                    <tr key={user.id} className="bg-bg-base hover:bg-bg-surface/50 transition-colors">
                      {canWrite && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="h-4 w-4 rounded border-border-subtle bg-bg-base accent-brand-primary"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-text-main">{user.name || "—"}</p>
                          <p className="text-xs text-text-muted">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === "seller" ? "bg-blue-500/15 text-blue-400" : "bg-gray-500/15 text-gray-400"}`}>
                          {user.role === "seller" ? (lang === "th" ? "ผู้ขาย" : "Seller") : (lang === "th" ? "ผู้ซื้อ" : "Buyer")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-subtle">{user.phone || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {user.status === "active" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                            {lang === "th" ? "✓ ใช้งาน" : "✓ Active"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-error/15 px-2.5 py-1 text-xs font-semibold text-error">
                            {lang === "th" ? "✕ แบน" : "✕ Banned"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                      </td>
                      {canWrite && (
                        <td className="px-4 py-3 text-right">
                          {user.status === "banned" ? (
                            <button
                              onClick={() => handleAction(user.id, "unban")}
                              disabled={actionLoading === user.id}
                              className="shrink-0 rounded-xl bg-success px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                            >
                              {actionLoading === user.id ? "..." : (lang === "th" ? "ปลดแบน" : "Unban")}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction(user.id, "ban")}
                              disabled={actionLoading === user.id}
                              className="shrink-0 rounded-xl bg-error/80 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                            >
                              {actionLoading === user.id ? "..." : (lang === "th" ? "แบน" : "Ban")}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-muted">
                  {lang === "th"
                    ? `แสดง ${(page-1)*ITEMS_PER_PAGE+1}–${Math.min(page*ITEMS_PER_PAGE,total)} จาก ${total} ราย`
                    : `Showing ${(page-1)*ITEMS_PER_PAGE+1}–${Math.min(page*ITEMS_PER_PAGE,total)} of ${total}`}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1,p-1))} disabled={page===1}
                    className="rounded-xl border border-border-subtle bg-bg-surface px-3 py-1.5 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main disabled:opacity-40">←</button>
                  <span className="flex items-center rounded-xl border border-border-subtle bg-bg-surface px-3 py-1.5 text-sm font-semibold text-text-main">{page} / {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages,p+1))} disabled={page===totalPages}
                    className="rounded-xl border border-border-subtle bg-bg-surface px-3 py-1.5 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main disabled:opacity-40">→</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminRouteGuard>
  );
}
