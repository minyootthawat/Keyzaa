"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { formatThaiBaht } from "@/app/lib/marketplace";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grossAmount: number;
  createdAt: string;
  user: { id: string; email: string; name: string };
  seller: { id: string; storeName: string };
  items?: OrderItem[];
}

interface OrderDetailModalProps {
  order: OrderDetail | null;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, { th: string; en: string }> = {
  pending: { th: "รอดำเนินการ", en: "Pending" },
  processing: { th: "กำลังดำเนินการ", en: "Processing" },
  shipped: { th: "จัดส่งแล้ว", en: "Shipped" },
  delivered: { th: "ส่งมอบแล้ว", en: "Delivered" },
  cancelled: { th: "ยกเลิก", en: "Cancelled" },
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  processing: "bg-blue-500/15 text-blue-400",
  shipped: "bg-purple-500/15 text-purple-400",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-error/15 text-error",
};

const PAYMENT_BADGE: Record<string, string> = {
  paid: "bg-success/15 text-success",
  refunded: "bg-orange-500/15 text-orange-400",
  pending: "bg-warning/15 text-warning",
};

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const { lang } = useLanguage();

  if (!order) return null;

  const statusLabel = STATUS_LABELS[order.status] ?? { th: order.status, en: order.status };
  const sl = statusLabel;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="surface-card w-full max-w-2xl rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border-subtle p-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-text-main">
                {lang === "th" ? "รายละเอียดคำสั่งซื้อ" : "Order Details"}
              </h2>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[order.status] || "bg-gray-500/15 text-gray-400"}`}>
                {lang === "th" ? sl.th : sl.en}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-text-muted">{order.orderNumber || order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-text-muted transition-colors hover:bg-bg-surface hover:text-text-main"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
          {/* Order Info Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border-subtle p-3">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                {lang === "th" ? "ผู้ซื้อ" : "Buyer"}
              </p>
              <p className="mt-1 text-sm font-semibold text-text-main">{order.user?.name || "—"}</p>
              <p className="text-xs text-text-muted">{order.user?.email}</p>
            </div>
            <div className="rounded-xl border border-border-subtle p-3">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                {lang === "th" ? "ร้านค้า" : "Seller"}
              </p>
              <p className="mt-1 text-sm font-semibold text-text-main">{order.seller?.storeName || "—"}</p>
              <p className="text-xs text-text-muted">{order.seller?.id?.slice(0, 8)}</p>
            </div>
            <div className="rounded-xl border border-border-subtle p-3">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                {lang === "th" ? "ชำระเงิน" : "Payment"}
              </p>
              <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${PAYMENT_BADGE[order.paymentStatus] || "bg-gray-500/15 text-gray-400"}`}>
                {order.paymentStatus}
              </span>
            </div>
            <div className="rounded-xl border border-border-subtle p-3">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                {lang === "th" ? "วันที่สั่งซื้อ" : "Order Date"}
              </p>
              <p className="mt-1 text-sm font-semibold text-text-main">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
                {lang === "th" ? "รายการสินค้า" : "Items"}
              </p>
              <div className="rounded-xl border border-border-subtle overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-bg-surface/70">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted">
                        {lang === "th" ? "สินค้า" : "Product"}
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-text-muted">
                        {lang === "th" ? "จำนวน" : "Qty"}
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-text-muted">
                        {lang === "th" ? "ราคา/ชิ้น" : "Unit Price"}
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-text-muted">
                        {lang === "th" ? "รวม" : "Total"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2.5 text-text-main">{item.productName}</td>
                        <td className="px-4 py-2.5 text-right text-text-muted">×{item.quantity}</td>
                        <td className="px-4 py-2.5 text-right text-text-muted">{formatThaiBaht(item.unitPrice)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-text-main">
                          {formatThaiBaht(item.quantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-surface/50 p-4">
            <p className="text-sm font-semibold text-text-main">
              {lang === "th" ? "ยอดรวม" : "Grand Total"}
            </p>
            <p className="text-xl font-black text-brand-primary">
              {formatThaiBaht(order.grossAmount)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-border-subtle p-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-border-subtle bg-bg-surface px-5 py-2.5 text-sm font-semibold text-text-main transition-colors hover:border-border-main"
          >
            {lang === "th" ? "ปิด" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
