"use client";

import AdminRouteGuard from "@/app/components/AdminRouteGuard";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import OrderDetailModal from "@/app/components/backoffice/order-detail-modal";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grossAmount: number;
  createdAt: string;
  user: { id: string; email: string; name: string };
  seller: { id: string; storeName: string };
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

const ITEMS_PER_PAGE = 20;

const STATUS_LABELS: Record<string, { th: string; en: string }> = {
  pending: { th: "รอดำเนินการ", en: "Pending" },
  paid: { th: "ชำระเงินแล้ว", en: "Paid" },
  processing: { th: "กำลังดำเนินการ", en: "Processing" },
  completed: { th: "เสร็จสิ้น", en: "Completed" },
  cancelled: { th: "ยกเลิก", en: "Cancelled" },
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  paid: "bg-brand-primary/15 text-brand-primary",
  processing: "bg-blue-500/15 text-blue-400",
  completed: "bg-success/15 text-success",
  cancelled: "bg-error/15 text-error",
};

const PAYMENT_BADGE: Record<string, string> = {
  paid: "bg-success/15 text-success",
  refunded: "bg-orange-500/15 text-orange-400",
  pending: "bg-warning/15 text-warning",
};

export default function AdminOrdersPage() {
  const { lang } = useLanguage();
  const { adminPermissions } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const canWrite = adminPermissions.includes("admin:orders:write");

  const fetchOrders = (pageNum: number, status: string) => {
    setLoading(true);
    let url = `/api/backoffice/orders?page=${pageNum}&limit=${ITEMS_PER_PAGE}`;
    if (status !== "all") url += `&status=${status}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || `HTTP ${res.status}`); }
        return res.json();
      })
      .then((data: OrdersResponse) => { setOrders(data.orders); setTotal(data.total); setError(null); })
      .catch((err) => { setError(err.message || (lang === "th" ? "โหลดข้อมูลไม่สำเร็จ" : "Failed to load orders.")); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders(page, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleAction = async (orderId: string, action: string) => {
    setActionLoading(orderId);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/backoffice/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || `HTTP ${res.status}`); }
      const updated = (await res.json()).order as Order;
      setOrders((prev) => prev.map((o) => o.id === updated.id ? { ...o, status: updated.status, paymentStatus: updated.paymentStatus } : o));
      const labels: Record<string, string> = {
        processing: lang === "th" ? "ดำเนินการแล้ว" : "Marked processing",
        completed: lang === "th" ? "เสร็จสิ้นแล้ว" : "Marked completed",
        refund: lang === "th" ? "คืนเงินแล้ว" : "Refunded",
      };
      setActionSuccess(labels[action] || action);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : (lang === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
    } finally { setActionLoading(null); }
  };

  const filterTabs = [
    { key: "all", label: lang === "th" ? "ทั้งหมด" : "All", count: total },
    { key: "pending", label: lang === "th" ? "รอดำเนินการ" : "Pending", count: null },
    { key: "paid", label: lang === "th" ? "ชำระเงินแล้ว" : "Paid", count: null },
    { key: "processing", label: lang === "th" ? "กำลังดำเนินการ" : "Processing", count: null },
    { key: "completed", label: lang === "th" ? "เสร็จสิ้น" : "Completed", count: null },
    { key: "cancelled", label: lang === "th" ? "ยกเลิก" : "Cancelled", count: null },
  ];

  return (
    <AdminRouteGuard requiredPermission="admin:orders:read">
      <div className="space-y-6 md:space-y-7">
        <div className="space-y-2">
          <h1 className="type-h1">{lang === "th" ? "คำสั่งซื้อ" : "Orders"}</h1>
          <p className="type-body max-w-[66ch] text-text-subtle">
            {lang === "th" ? "ดูและจัดการคำสั่งซื้อทั้งหมดในระบบ" : "View and manage all orders across the platform."}
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

        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {filterTabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); setPage(1); }}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${statusFilter === key ? "bg-brand-primary/20 text-brand-primary" : "bg-bg-surface text-text-subtle hover:bg-bg-surface/80"}`}
            >
              {label} {count !== null && count > 0 && <span className="ml-1 text-xs opacity-70">({count})</span>}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 w-full rounded-xl bg-bg-surface/60 animate-pulse" />)}</div>
        ) : error ? (
          <div className="surface-card flex min-h-[200px] items-center justify-center p-6 text-center">
            <p className="text-error type-body">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="surface-card flex min-h-[200px] items-center justify-center p-6 text-center">
            <p className="text-text-muted type-body">{lang === "th" ? "ไม่พบคำสั่งซื้อ" : "No orders found"}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-border-subtle">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-surface/70">
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">{lang === "th" ? "คำสั่งซื้อ" : "Order"}</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">{lang === "th" ? "ผู้ซื้อ" : "Buyer"}</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">{lang === "th" ? "ร้านค้า" : "Seller"}</th>
                    <th className="px-4 py-3 text-right font-semibold text-text-muted">{lang === "th" ? "ยอดรวม" : "Total"}</th>
                    <th className="px-4 py-3 text-center font-semibold text-text-muted">{lang === "th" ? "สถานะ" : "Status"}</th>
                    <th className="px-4 py-3 text-center font-semibold text-text-muted">{lang === "th" ? "ชำระเงิน" : "Payment"}</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">{lang === "th" ? "วันที่" : "Date"}</th>
                    {canWrite && <th className="px-4 py-3 text-right font-semibold text-text-muted">{lang === "th" ? "การกระทำ" : "Actions"}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {orders.map((order) => {
                    const sl = STATUS_LABELS[order.status] || { th: order.status, en: order.status };
                    return (
                      <tr key={order.id} className="bg-bg-base hover:bg-bg-surface/50 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="font-mono text-xs font-semibold text-brand-primary hover:text-brand-secondary transition-colors cursor-pointer"
                          >
                            {order.orderNumber || order.id.slice(0, 8)}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-text-main">{order.user?.name || "—"}</p>
                            <p className="text-xs text-text-muted">{order.user?.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-subtle">
                          {order.seller?.storeName || "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-text-main">
                          ฿{order.grossAmount?.toLocaleString() ?? 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[order.status] || "bg-gray-500/15 text-gray-400"}`}>
                            {sl[lang === "th" ? "th" : "en"]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${PAYMENT_BADGE[order.paymentStatus] || "bg-gray-500/15 text-gray-400"}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                        </td>
                        {canWrite && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2 flex-wrap">
                              {(order.status === "pending" || order.status === "paid") && (
                                <button
                                  onClick={() => handleAction(order.id, "processing")}
                                  disabled={actionLoading === order.id}
                                  className="shrink-0 rounded-xl bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                                >
                                  {lang === "th" ? "ดำเนินการ" : "Process"}
                                </button>
                              )}
                              {order.status === "processing" && (
                                <button
                                  onClick={() => handleAction(order.id, "completed")}
                                  disabled={actionLoading === order.id}
                                  className="shrink-0 rounded-xl bg-success px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                                >
                                  {lang === "th" ? "เสร็จสิ้น" : "Complete"}
                                </button>
                              )}
                              {order.paymentStatus === "paid" && order.status !== "cancelled" && (
                                <button
                                  onClick={() => handleAction(order.id, "refund")}
                                  disabled={actionLoading === order.id}
                                  className="shrink-0 rounded-xl border border-error/40 bg-error/10 px-3 py-1.5 text-xs font-semibold text-error transition-opacity hover:bg-error/20 disabled:opacity-50"
                                >
                                  {lang === "th" ? "คืนเงิน" : "Refund"}
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-muted">
                  {lang === "th"
                    ? `แสดง ${(page-1)*ITEMS_PER_PAGE+1}–${Math.min(page*ITEMS_PER_PAGE,total)} จาก ${total} รายการ`
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
      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </AdminRouteGuard>
  );
}
