"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import CTAButton from "@/app/components/CTAButton";
import { getStoredToken } from "@/app/lib/auth-client";
import { useLanguage } from "@/app/context/LanguageContext";
import { getMockPaymentMethodLabel, getMockPaymentNotice } from "@/app/lib/payment-mock";
import type { Order } from "@/app/types";

interface OrderSellerSummary {
  id: string;
  shopName: string;
  verificationStatus: string;
  rating: number;
  salesCount: number;
}

export default function OrderDeliveryPage() {
  const params = useParams<{ id: string }>();
  const { lang, t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [seller, setSeller] = useState<OrderSellerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      const timeout = window.setTimeout(() => {
        setLoading(false);
      }, 0);

      return () => window.clearTimeout(timeout);
    }

    const controller = new AbortController();

    fetch(`/api/orders/${params.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Order not found");
        }

        const data = (await response.json()) as { order: Order; seller?: OrderSellerSummary };
        setOrder(data.order);
        setSeller(data.seller || null);
      })
      .catch(() => {
        setOrder(null);
        setSeller(null);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [params.id]);

  const activationGuide = useMemo(() => {
    if (!order?.items[0]) return [];

    const firstItem = order.items[0];
    const firstStep = lang === "th" ? firstItem.activationMethodTh : firstItem.activationMethodEn;

    return [
      firstStep || t("order_reviewActivation"),
      `${t("order_useDeliveredDetails")} ${firstItem.platform}`,
      t("order_activationFails")
    ];
  }, [lang, order, t]);

  const paymentStatusLabel =
    order?.paymentStatus === "paid"
      ? t("order_paid")
      : order?.paymentStatus === "refunded"
        ? t("order_refunded")
        : t("order_pendingPayment");

  const fulfillmentStatusLabel =
    order?.fulfillmentStatus === "delivered"
      ? t("order_delivered")
      : order?.fulfillmentStatus === "processing"
        ? t("order_processing")
        : order?.fulfillmentStatus === "failed"
          ? t("order_deliveryIssue")
          : t("order_pending");

  const toggleReveal = (keyId: string) => {
    setRevealedKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(t("delivery_serialCopied"));
    } catch {
      setCopyFeedback(t("delivery_copyFailed"));
    } finally {
      window.setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="section-container py-16">
        <div className="surface-card mx-auto max-w-xl space-y-5 p-8 text-center">
          <h1 className="type-h2 text-text-main">{t("order_notFoundTitle")}</h1>
          <p className="text-text-subtle">{t("order_notFoundDesc")}</p>
          <Link href="/products">
            <CTAButton>{t("checkout_browseProducts")}</CTAButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-12">
      <div className="section-container max-w-5xl py-10 md:py-14">
        <div className="mb-8 space-y-4 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-success-bg text-3xl text-accent">✓</div>
          <h1 className="type-h1 text-text-main">{t("order_completeTitle")}</h1>
          <p className="text-text-subtle">{t("order_completeDesc")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {order.items?.map((item) => (
              <div key={item.id} className="surface-card p-6">
                <div className="flex flex-col gap-5 md:flex-row">
                  <div className="relative h-28 w-full overflow-hidden rounded-2xl md:w-40">
                    <Image src={item.image} alt={(lang === "th" ? item.titleTh : item.titleEn) || item.title} fill className="object-cover" sizes="160px" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-sm text-text-muted">{item.platform}</p>
                      <h2 className="mt-1 text-xl font-semibold text-text-main">{(lang === "th" ? item.titleTh : item.titleEn) || item.title}</h2>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{t("order_activationTitle")}</p>
                        <p className="mt-2 text-sm text-text-main">{lang === "th" ? item.activationMethodTh : item.activationMethodEn}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{t("order_statusTitle")}</p>
                        <p className="mt-2 text-sm font-semibold text-accent">{t("order_statusReady")}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {item.keys.map((key, index) => {
                        const keyId = `${item.id}-${index}`;
                        const isRevealed = revealedKeys[keyId];

                        return (
                          <div key={keyId} className="rounded-2xl border border-white/8 bg-bg-surface/70 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-xs uppercase tracking-[0.14em] text-text-muted">{t("order_codeLabel")}</p>
                                <div className="mt-2 rounded-xl bg-bg-base px-4 py-3 font-mono text-sm text-text-main">
                                  {isRevealed ? key : "•••••-•••••-•••••"}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => toggleReveal(keyId)}
                                  className={`rounded-xl px-4 py-3 text-sm font-semibold ${isRevealed ? "bg-bg-elevated text-text-main" : "btn-primary text-white"}`}
                                >
                                  {isRevealed ? t("delivery_hideKey") : t("delivery_revealKey")}
                                </button>
                                {isRevealed ? (
                                  <button onClick={() => copyToClipboard(key)} className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg-base">
                                    {t("delivery_copyKey")}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="surface-card space-y-4 p-6">
              <h2 className="text-lg font-semibold text-text-main">{t("order_postPurchaseGuide")}</h2>
              <ol className="list-inside list-decimal space-y-2 text-sm leading-7 text-text-subtle">
                {activationGuide.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="surface-card space-y-4 p-6">
              <h2 className="text-lg font-semibold text-text-main">{t("checkout_orderSummaryTitle")}</h2>
              <div className="space-y-2 text-sm text-text-subtle">
                <div className="flex items-center justify-between">
                  <span>{t("buyerOrders_orderId")}</span>
                  <span className="font-medium text-text-main">{order.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("order_paymentStatus")}</span>
                  <span className="font-medium text-accent">{paymentStatusLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("order_fulfillmentStatus")}</span>
                  <span className="font-medium text-text-main">{fulfillmentStatusLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("order_paymentMethod")}</span>
                  <span className="font-medium text-text-main">{getMockPaymentMethodLabel(order.paymentMethod, lang)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("checkout_totalLabel")}</span>
                  <span className="font-medium text-text-main">฿{order.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="surface-card space-y-4 p-6">
              <h2 className="text-lg font-semibold text-text-main">{t("common_seller")}</h2>
              <div className="space-y-2 text-sm text-text-subtle">
                <div className="flex items-center justify-between gap-4">
                  <span>{t("order_store")}</span>
                  <span className="font-medium text-text-main">{seller?.shopName || order.sellerId}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>{t("order_verification")}</span>
                  <span className="font-medium text-accent">
                    {seller?.verificationStatus === "top_rated"
                      ? t("order_topSeller")
                      : t("order_verifiedSeller")}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>{t("order_sales")}</span>
                  <span className="font-medium text-text-main">{seller?.salesCount?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            <div className="surface-card space-y-4 p-6">
              <h2 className="text-lg font-semibold text-text-main">{t("order_platformProtection")}</h2>
              <p className="text-sm leading-7 text-text-subtle">
                {getMockPaymentNotice(lang)}
              </p>
            </div>

            <div className="surface-card space-y-4 p-6">
              <h2 className="text-lg font-semibold text-text-main">{t("order_issueTitle")}</h2>
              <p className="text-sm leading-7 text-text-subtle">{t("order_issueDesc")}</p>
              <CTAButton variant="secondary" fullWidth>
                {t("order_openDispute")}
              </CTAButton>
              <CTAButton variant="secondary" fullWidth>
                {t("order_contactSupport")}
              </CTAButton>
              <Link href="/" className="block">
                <CTAButton fullWidth>{t("common_backHome")}</CTAButton>
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {copyFeedback ? (
        <div className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2">
          <div aria-live="polite" className="rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-bg-base shadow-2xl">
            {copyFeedback}
          </div>
        </div>
      ) : null}
    </div>
  );
}
