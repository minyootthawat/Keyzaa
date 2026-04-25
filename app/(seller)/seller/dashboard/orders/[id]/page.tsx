"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import CTAButton from "@/app/components/CTAButton";
import Badge from "@/app/components/Badge";
import { getStoredToken } from "@/app/lib/auth-client";
import { useLanguage } from "@/app/context/LanguageContext";

type OrderStatus = "pending_payment" | "paid" | "fulfilling" | "delivered" | "disputed" | "refunded" | "cancelled";

interface OrderDetailResponse {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  date: string;
  status: OrderStatus;
  paymentStatus: string;
  fulfillmentStatus: string;
  totalPrice: number;
  grossAmount: number;
  commissionAmount: number;
  sellerNetAmount: number;
  platformFeeRate: number;
  currency: string;
  paymentMethod: string;
  items: Array<{
    id: string;
    orderId: string;
    productId: string;
    title: string;
    titleTh?: string;
    titleEn?: string;
    image: string;
    price: number;
    quantity: number;
    sellerId: string;
    keys: string[];
    platform: string;
    regionCode?: string;
    activationMethodTh?: string;
    activationMethodEn?: string;
  }>;
}

const STATUS_CONFIG: Record<string, { label: string; tone: "success" | "promo" | "default" }> = {
  pending_payment: { label: "รอดำเนินการ", tone: "default" },
  paid: { label: "ชำระแล้ว", tone: "promo" },
  fulfilling: { label: "กำลังดำเนินการ", tone: "promo" },
  delivered: { label: "เสร็จสิ้น", tone: "success" },
  disputed: { label: "มีข้อพิพาท", tone: "default" },
  refunded: { label: "คืนเงิน", tone: "default" },
  cancelled: { label: "ยกเลิก", tone: "default" },
};

export default function SellerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { lang } = useLanguage();
  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState("");

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetch("/api/seller/orders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load orders");
        const data = (await response.json()) as { orders: OrderDetailResponse[] };
        const found = data.orders.find((o) => o.id === params.id || o.orderId === params.id);
        setOrder(found || null);
      })
      .catch(() => {
        setOrder(null);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [params.id]);

  const handleMarkDelivered = async () => {
    if (!order) return;
    setSubmitting(true);

    try {
      const token = getStoredToken();
      const response = await fetch(`/api/seller/orders/${order.id}/deliver`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deliveryNote }),
      });

      if (response.ok) {
        setOrder((prev) => (prev ? { ...prev, status: "delivered" } : null));
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="section-container py-16">
        <div className="surface-card mx-auto max-w-xl space-y-5 p-8 text-center">
          <h1 className="type-h2 text-text-main">ไม่พบคำสั่งซื้อ</h1>
          <p className="text-text-subtle">คำสั่งซื้อที่คุณกำลังค้นหาไม่มีอยู่ในระบบ</p>
          <Link href="/dashboard/orders">
            <CTAButton>กลับไปรายการคำสั่งซื้อ</CTAButton>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] ?? { label: order.status, tone: "default" as const };
  const statusLabel = statusConfig.label;
  const isDelivered = order.status === "delivered";

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString(lang === "th" ? "th-TH" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="section-container max-w-4xl py-10 space-y-6">
      {/* Back link */}
      <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-main transition-colors">
        ← กลับไปคำสั่งซื้อ
      </Link>

      {/* Order Header */}
      <div className="surface-card glass-panel p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="type-h1 text-text-main">รายละเอียดคำสั่งซื้อ</h1>
              <Badge label={statusLabel} tone={statusConfig.tone} />
            </div>
            <p className="font-mono text-sm text-text-muted">{order.id}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-text-muted">วันที่</p>
            <p className="text-sm font-medium text-text-main">{formatDate(order.date)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider">ผู้ซื้อ</p>
            <p className="text-sm font-semibold text-text-main">{order.buyerName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider">ช่องทางชำระ</p>
            <p className="text-sm font-medium text-text-main">{order.paymentMethod || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider">สถานะชำระเงิน</p>
            <p className="text-sm font-medium text-text-main capitalize">{order.paymentStatus}</p>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="surface-card glass-panel p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-main">รายการสินค้า</h2>
        <div className="space-y-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 rounded-2xl border border-white/8 bg-bg-surface/60">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <Image src={item.image} alt={item.title} fill className="object-cover" sizes="80px" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-text-muted">{item.platform}</p>
                    <p className="text-sm font-semibold text-text-main">{(lang === "th" ? item.titleTh : item.titleEn) || item.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-text-main">฿{item.price.toLocaleString()}</p>
                    <p className="text-xs text-text-muted">× {item.quantity}</p>
                  </div>
                </div>
                {item.keys.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.keys.map((key, ki) => (
                      <span key={ki} className="font-mono text-xs bg-bg-base px-2 py-1 rounded-lg text-text-subtle">
                        {key}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="surface-card glass-panel p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-main">สรุปยอดทางการเงิน</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">ยอดรวม</span>
            <span className="text-text-main font-medium">฿{order.grossAmount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">
              ค่าคอมมิชชัน ({(order.platformFeeRate * 100).toFixed(0)}%)
            </span>
            <span className="text-danger">−฿{order.commissionAmount.toLocaleString()}</span>
          </div>
          <div className="border-t border-white/8 pt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-text-main">รายได้สุทธิ</span>
            <span className="text-lg font-bold text-accent">฿{order.sellerNetAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Delivery Form */}
      {!isDelivered && (
        <div className="surface-card glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-main">จัดส่งสินค้า</h2>
            <Badge label="รอจัดส่ง" tone="default" />
          </div>
          <p className="text-sm text-text-subtle">กรุณากดปุ่มด้านล่างเพื่อยืนยันการจัดส่งสินค้าให้ผู้ซื้อ</p>
          <textarea
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            placeholder="หมายเหตุการจัดส่ง (ไม่บังคับ)"
            rows={3}
            className="w-full rounded-2xl border border-white/8 bg-bg-surface/60 p-4 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/45 resize-none"
          />
          <CTAButton onClick={handleMarkDelivered} disabled={submitting} fullWidth>
            {submitting ? "กำลังส่ง..." : "ยืนยันจัดส่งสินค้า"}
          </CTAButton>
        </div>
      )}

      {isDelivered && (
        <div className="surface-card glass-panel p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-success-bg text-accent">✓</div>
            <div>
              <p className="text-sm font-semibold text-text-main">จัดส่งแล้ว</p>
              <p className="text-xs text-text-muted">{formatDate(order.date)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
