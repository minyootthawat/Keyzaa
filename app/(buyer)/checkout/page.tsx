"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";
import { getStoredToken } from "@/app/lib/auth-client";
import { useLanguage } from "@/app/context/LanguageContext";
import { formatThaiBaht } from "@/app/lib/marketplace";
import { getMockPaymentMethodLabel, getMockPaymentNotice } from "@/app/lib/payment-mock";
import type { Order, OrderItem } from "@/app/types";
import CTAButton from "@/app/components/CTAButton";

type CheckoutStep = "cart" | "payment" | "success";
type PaymentMethod = "promptpay" | "card";
type PaymentState = "idle" | "awaiting_scan" | "verifying" | "confirmed" | "expired";

const PROMPTPAY_EXPIRY_SECONDS = 180;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [step, setStep] = useState<CheckoutStep>("cart");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("promptpay");
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [countdown, setCountdown] = useState(PROMPTPAY_EXPIRY_SECONDS);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [qrData, setQrData] = useState<string | null>(null);

  const itemsRef = useRef(items);
  const totalPriceRef = useRef(totalPrice);
  const paymentMethodRef = useRef(paymentMethod);
  const userIdRef = useRef(user?.id);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    totalPriceRef.current = totalPrice;
  }, [totalPrice]);

  useEffect(() => {
    paymentMethodRef.current = paymentMethod;
  }, [paymentMethod]);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  const startPaymentFlow = () => {
    setPaymentMethod("promptpay");
    setPaymentState("awaiting_scan");
    setCountdown(PROMPTPAY_EXPIRY_SECONDS);
    setStep("payment");

    // Fetch real PromptPay QR from the API
    const satangAmount = Math.round(totalPrice * 100);
    fetch(`/api/payments/promptpay-qr?amount=${satangAmount}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.qrData) {
          setQrData(data.qrData);
        }
      })
      .catch(() => {
        // Silently fail — will show placeholder QR
      });
  };

  useEffect(() => {
    if (step !== "payment") return;

    const countdownTimer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(countdownTimer);
          setPaymentState("expired");
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    const verifyTimer = window.setTimeout(() => {
      setPaymentState("verifying");
    }, 5000);

    const successTimer = window.setTimeout(async () => {
      const newOrderId = `ord_${Date.now()}`;
      const orderItems: OrderItem[] = itemsRef.current.map((item, index) => ({
        id: `oi_${Date.now()}_${index}`,
        orderId: newOrderId,
        productId: item.id,
        title: item.title,
        titleTh: item.titleTh,
        titleEn: item.titleEn,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        sellerId: item.sellerId,
        keys: [`KZ-${item.id.toUpperCase()}-${Date.now().toString().slice(-6)}-${index + 1}`],
        platform: item.platform || "",
        regionCode: item.regionCode,
        activationMethodTh: item.activationMethodTh,
        activationMethodEn: item.activationMethodEn
      }));
      const token = getStoredToken();

      if (!token) {
        setPaymentState("expired");
        return;
      }

      // Step 1: Create order with pending_payment status (not delivered!)
      try {
        const createRes = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            totalPrice: totalPriceRef.current,
            paymentMethod: getMockPaymentMethodLabel(paymentMethodRef.current, "en"),
            status: "pending_payment",
            items: orderItems.map((item) => ({
              ...item,
              orderId: newOrderId,
            })),
          }),
        });

        if (!createRes.ok) {
          throw new Error("Order creation failed");
        }

        const data = (await createRes.json()) as { order: Order; orders?: Order[] };
        const createdOrderIds = data.orders?.map((order) => order.id) || (data.order ? [data.order.id] : []);

        // Step 2: After 9s demo delay, call mock-confirm (same logic as Stripe webhook)
        // This simulates what the Stripe webhook would do in production
        setTimeout(async () => {
          for (const orderId of createdOrderIds) {
            await fetch("/api/stripe/mock-confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId }),
            });
          }
          setOrderIds(createdOrderIds);
          setPaymentState("confirmed");
          setStep("success");
        }, 9000);
      } catch {
        setPaymentState("expired");
      }
    }, 9000);

    return () => {
      window.clearInterval(countdownTimer);
      window.clearTimeout(verifyTimer);
      window.clearTimeout(successTimer);
    };
  }, [step]);

  const paymentLabel =
    paymentState === "awaiting_scan"
      ? t("checkout_statusAwaiting")
      : paymentState === "verifying"
        ? t("checkout_statusVerifying")
        : paymentState === "expired"
          ? t("checkout_statusExpired")
          : paymentState === "confirmed"
            ? t("checkout_statusConfirmed")
            : t("checkout_statusReady");

  const paymentMethods: Array<{ id: PaymentMethod; label: string; hint: string }> = [
    {
      id: "promptpay",
      label: t("checkout_mockPromptPayLabel"),
      hint: t("checkout_mockPromptPayHint")
    },
    {
      id: "card",
      label: t("checkout_mockCardLabel"),
      hint: t("checkout_mockCardHint")
    }
  ];

  const minutes = Math.floor(countdown / 60);
  const seconds = String(countdown % 60).padStart(2, "0");

  if (items.length === 0 && step !== "success") {
    return (
      <div className="section-container py-16">
        <div className="surface-card mx-auto max-w-xl space-y-5 p-8 text-center">
          <h1 className="type-h2 text-text-main">{t("checkout_emptyTitle")}</h1>
          <p className="text-text-subtle">{t("checkout_emptyThailand")}</p>
          <CTAButton onClick={() => router.push("/products")}>{t("checkout_browseProducts")}</CTAButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-12">
      <div className="section-container grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-12">
        <div className="space-y-6">
          {step === "cart" ? (
            <div className="surface-card space-y-6 p-6">
              <div>
                <h1 className="type-h2 text-text-main">{t("checkout_reviewTitle")}</h1>
                <p className="mt-2 text-text-subtle">{t("checkout_reviewDescMock")}</p>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 rounded-2xl border border-border-subtle bg-bg-surface p-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl">
                      {item.image ? (
                        <Image src={item.image} alt={(lang === "th" ? item.titleTh : item.titleEn) || item.title} fill className="object-cover" sizes="80px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-bg-elevated text-text-muted">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                            <circle cx="9" cy="9" r="2"/>
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="font-semibold text-text-main">{(lang === "th" ? item.titleTh : item.titleEn) || item.title}</p>
                      <p className="text-sm text-text-muted">{item.platform}</p>
                      <p className="text-sm text-text-muted">
                        {lang === "th" ? item.activationMethodTh : item.activationMethodEn}
                      </p>
                      <p className="text-sm text-accent">
                        {lang === "th" ? item.deliveryLabelTh : item.deliveryLabelEn}
                      </p>
                    </div>
                    <div className="space-y-3 text-right">
                      <p className="text-lg font-semibold text-text-main">฿{formatThaiBaht(item.price)}</p>
                      <div className="flex items-center gap-2">
                        <button className="h-8 w-8 rounded-full bg-bg-elevated text-text-main" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                        <span className="w-8 text-center text-text-main">{item.quantity}</span>
                        <button className="h-8 w-8 rounded-full bg-bg-elevated text-text-main" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                      </div>
                      <button className="text-sm text-danger" onClick={() => removeItem(item.id)}>
                        {t("checkout_removeItem")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <CTAButton fullWidth onClick={startPaymentFlow}>
                {t("checkout_continueMock")}
              </CTAButton>
            </div>
          ) : null}

          {step === "payment" ? (
            <div className="surface-card space-y-6 p-6">
              <div className="space-y-2">
                <h1 className="type-h2 text-text-main">{t("checkout_mockTitle")}</h1>
                <p className="text-text-subtle">{getMockPaymentNotice(lang)}</p>
              </div>

              <div className="grid gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${paymentMethod === method.id ? "border-brand-primary bg-brand-primary/10" : "border-border-subtle bg-bg-surface"}`}
                  >
                    <p className="font-semibold text-text-main">{method.label}</p>
                    <p className="mt-1 text-sm text-text-muted">{method.hint}</p>
                  </button>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
                    <p className="text-sm font-semibold text-text-main">{t("checkout_mockHowToPay")}</p>
                    <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-7 text-text-subtle">
                      <li>{t("checkout_mockStep1")}</li>
                      <li>{t("checkout_mockStep2")}</li>
                      <li>{t("checkout_mockStep3")}</li>
                    </ol>
                  </div>
                  <div className="rounded-2xl border border-accent/15 bg-accent/5 p-4 text-sm leading-7 text-text-subtle">
                    {getMockPaymentNotice(lang)}
                  </div>
                </div>

                <div className="surface-card p-5 text-center">
                  <p className="text-base text-text-subtle">{t("checkout_totalAmount")}</p>
                  <p className="type-num text-5xl font-extrabold text-gradient-brand">฿{formatThaiBaht(totalPrice)}</p>
                  <div className="elevation-2 mx-auto mt-5 grid h-56 w-56 place-items-center rounded-3xl overflow-hidden bg-bg-elevated text-text-main">
                    {qrData ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrData}
                        alt="PromptPay QR"
                        width={224}
                        height={224}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{t("checkout_mockPaymentBadge")}</p>
                        <p className="mt-3 text-5xl">▣</p>
                        <p className="mt-3 text-sm text-text-subtle">{t("checkout_mockQrCaption")}</p>
                      </div>
                    )}
                  </div>
                  <p className="mt-4 text-base font-semibold text-accent">{paymentLabel}</p>
                  <p className="mt-2 text-sm text-text-muted">
                    {lang === "th" ? `หมดอายุใน ${minutes}:${seconds}` : `Expires in ${minutes}:${seconds}`}
                  </p>
                  {paymentState === "expired" ? (
                    <div className="mt-4">
                      <CTAButton fullWidth variant="secondary" onClick={startPaymentFlow}>
                        {t("checkout_mockGenerateQr")}
                      </CTAButton>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {step === "success" ? (
            <div className="surface-card space-y-6 p-7 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-bg text-accent">✓</div>
              <h1 className="type-h2 text-text-main">{t("checkout_mockSuccessTitle")}</h1>
              <p className="text-text-subtle">{t("checkout_mockSuccessDesc")}</p>
              <CTAButton
                fullWidth
                onClick={() => {
                  clearCart();
                  if (orderIds.length > 1) {
                    router.push("/orders");
                    return;
                  }

                  if (orderIds[0]) {
                    router.push(`/orders/${orderIds[0]}`);
                  }
                }}
              >
                {orderIds.length > 1
                  ? t("checkout_viewAllOrders")
                  : t("checkout_goToDelivery")}
              </CTAButton>
            </div>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-[96px] lg:self-start">
          <div className="surface-card space-y-5 p-6">
            <h2 className="text-lg font-semibold text-text-main">{t("checkout_orderSummaryTitle")}</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-text-main">{(lang === "th" ? item.titleTh : item.titleEn) || item.title}</p>
                    <p className="text-text-muted">{item.quantity} x ฿{formatThaiBaht(item.price)}</p>
                  </div>
                  <p className="font-semibold text-text-main">฿{formatThaiBaht(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border-subtle pt-4">
              <div className="flex items-center justify-between text-base">
                <span className="text-text-subtle">{t("checkout_totalLabel")}</span>
                <span className="type-num text-xl font-bold text-text-main">฿{formatThaiBaht(totalPrice)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4 text-sm leading-7 text-text-subtle">
              <p className="font-semibold text-text-main">{t("checkout_trustSignalsTitle")}</p>
              <ul className="mt-2 space-y-1">
                <li>{t("checkout_trustSignalThb")}</li>
                <li>{t("checkout_trustSignalMock")}</li>
                <li>{t("checkout_trustSignalActivation")}</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
