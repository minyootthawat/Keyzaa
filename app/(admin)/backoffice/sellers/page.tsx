"use client";

import AdminRouteGuard from "@/app/components/AdminRouteGuard";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { getStoredToken } from "@/app/lib/auth-client";
import { formatThaiBaht } from "@/app/lib/marketplace";

interface Seller {
  id: string;
  storeName: string;
  phone: string;
  verified: boolean;
  balance: number;
  pendingBalance: number;
  salesCount: number;
  rating: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface SellersResponse {
  sellers: Seller[];
  total: number;
  page: number;
  limit: number;
}

const ITEMS_PER_PAGE = 20;

export default function AdminSellersPage() {
  const { lang } = useLanguage();
  const { adminPermissions } = useAuth();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<"all" | "verified" | "unverified">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const canWrite = adminPermissions.includes("admin:sellers:write");

  const fetchSellers = (pageNum: number, filterVal: typeof filter) => {
    const token = getStoredToken();
    if (!token) {
      setError(lang === "th" ? "ไม่พบสิทธิ์แอดมิน" : "Admin access not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    let url = `/api/backoffice/sellers?page=${pageNum}&limit=${ITEMS_PER_PAGE}`;
    if (filterVal === "verified") url += "&verified=true";
    else if (filterVal === "unverified") url += "&verified=false";

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: SellersResponse) => {
        setSellers(data.sellers);
        setTotal(data.total);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || (lang === "th" ? "โหลดข้อมูลไม่สำเร็จ" : "Failed to load sellers."));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSellers(page, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  const handleAction = async (sellerId: string, action: "approve" | "reject") => {
    const token = getStoredToken();
    if (!token) return;

    setActionLoading(sellerId);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/backoffice/sellers/${sellerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const updated = (await res.json()).seller as Seller;
      setSellers((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      setActionSuccess(
        action === "approve"
          ? lang === "th"
            ? `อนุมัติร้าน "${updated.storeName}" แล้ว`
            : `Approved "${updated.storeName}"`
          : lang === "th"
          ? `ปฏิเสธร้าน "${updated.storeName}" แล้ว`
          : `Rejected "${updated.storeName}"`
      );
      // Auto-clear success message after 3s
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : (lang === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
    } finally {
      setActionLoading(null);
    }
  };

  const verifiedCount = sellers.filter((s) => s.verified).length;
  const unverifiedCount = sellers.filter((s) => !s.verified).length;

  return (
    <AdminRouteGuard requiredPermission="admin:sellers:read">
      <div className="space-y-6 md:space-y-7">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="type-h1">
            {lang === "th" ? "จัดการร้านค้า" : "Manage sellers"}
          </h1>
          <p className="type-body max-w-[66ch] text-text-subtle">
            {lang === "th"
              ? "ตรวจสอบและอนุมัติร้านค้าใหม่ก่อนเปิดให้ขายสินค้าได้"
              : "Review and approve new sellers before they can list products."}
          </p>
        </div>

        {/* Success toast */}
        {actionSuccess && (
          <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success font-medium">
            ✓ {actionSuccess}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(
            [
              { key: "all", label: lang === "th" ? "ทั้งหมด" : "All", count: total },
              {
                key: "unverified",
                label: lang === "th" ? "รอตรวจสอบ" : "Pending",
                count: unverifiedCount,
              },
              {
                key: "verified",
                label: lang === "th" ? "ผ่านการตรวจสอบแล้ว" : "Verified",
                count: verifiedCount,
              },
            ] as const
          ).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => {
                setFilter(key);
                setPage(1);
              }}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                filter === key
                  ? "bg-brand-primary/20 text-brand-primary"
                  : "bg-bg-surface text-text-subtle hover:bg-bg-surface/80"
              }`}
            >
              {label}
              {typeof count === "number" && count > 0 && (
                <span className="ml-1.5 text-xs opacity-70">({count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-full rounded-xl bg-bg-surface/60 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="surface-card flex min-h-[200px] items-center justify-center p-6 text-center">
            <p className="text-error type-body">{error}</p>
          </div>
        ) : sellers.length === 0 ? (
          <div className="surface-card flex min-h-[200px] items-center justify-center p-6 text-center">
            <p className="text-text-muted type-body">
              {filter === "unverified"
                ? lang === "th"
                  ? "ไม่มีร้านค้ารอตรวจสอบ"
                  : "No pending sellers"
                : lang === "th"
                ? "ไม่พบร้านค้า"
                : "No sellers found"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-border-subtle">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-surface/70">
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">
                      {lang === "th" ? "ร้านค้า" : "Store"}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">
                      {lang === "th" ? "เจ้าของ" : "Owner"}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-text-muted">
                      {lang === "th" ? "ยอดขาย" : "Sales"}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-text-muted">
                      {lang === "th" ? "ยอดคงเหลือ" : "Balance"}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-text-muted">
                      {lang === "th" ? "สถานะ" : "Status"}
                    </th>
                    {canWrite && (
                      <th className="px-4 py-3 text-right font-semibold text-text-muted">
                        {lang === "th" ? "การกระทำ" : "Actions"}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {sellers.map((seller) => (
                    <tr key={seller.id} className="bg-bg-base hover:bg-bg-surface/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-text-main">{seller.storeName}</p>
                          <p className="text-xs text-text-muted">{seller.phone || "—"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-text-main">{seller.user.name || "—"}</p>
                          <p className="text-xs text-text-muted">{seller.user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-text-main">
                        {seller.salesCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-text-main">
                        ฿{formatThaiBaht(seller.balance)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {seller.verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                            {lang === "th" ? "✓ ผ่าน" : "✓ Verified"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning">
                            {lang === "th" ? "◔ รอตรวจ" : "◔ Pending"}
                          </span>
                        )}
                      </td>
                      {canWrite && (
                        <td className="px-4 py-3 text-right">
                          {!seller.verified ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleAction(seller.id, "approve")}
                                disabled={actionLoading === seller.id}
                                className="shrink-0 rounded-xl bg-success px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                              >
                                {actionLoading === seller.id
                                  ? "..."
                                  : lang === "th"
                                  ? "อนุมัติ"
                                  : "Approve"}
                              </button>
                              <button
                                onClick={() => handleAction(seller.id, "reject")}
                                disabled={actionLoading === seller.id}
                                className="shrink-0 rounded-xl bg-error/80 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                              >
                                {actionLoading === seller.id
                                  ? "..."
                                  : lang === "th"
                                  ? "ปฏิเสธ"
                                  : "Reject"}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAction(seller.id, "reject")}
                              disabled={actionLoading === seller.id}
                              className="shrink-0 rounded-xl border border-error/40 bg-error/10 px-3 py-1.5 text-xs font-semibold text-error transition-opacity hover:bg-error/20 disabled:opacity-50"
                            >
                              {actionLoading === seller.id
                                ? "..."
                                : lang === "th"
                                ? "เพิกถอน"
                                : "Revoke"}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-muted">
                  {lang === "th"
                    ? `แสดง ${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, total)} จาก ${total} ราย`
                    : `Showing ${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, total)} of ${total}`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-xl border border-border-subtle bg-bg-surface px-3 py-1.5 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main disabled:opacity-40"
                  >
                    ←
                  </button>
                  <span className="flex items-center rounded-xl border border-border-subtle bg-bg-surface px-3 py-1.5 text-sm font-semibold text-text-main">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-xl border border-border-subtle bg-bg-surface px-3 py-1.5 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminRouteGuard>
  );
}
