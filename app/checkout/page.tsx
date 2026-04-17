"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import CTAButton from "@/app/components/CTAButton";
import PriceTag from "@/app/components/PriceTag";
import Badge from "@/app/components/Badge";
import { useLanguage } from "@/app/context/LanguageContext";
import type { Order, OrderItem } from "@/app/types";

type CheckoutStep = "cart" | "payment" | "success";
type PaymentMethod = "promptpay" | "truemoney" | "card";
type PaymentState = "pending" | "verifying" | "success";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("promptpay");
  const [paymentState, setPaymentState] = useState<PaymentState>("pending");
  const [orderId, setOrderId] = useState<string>("");
  const { t } = useLanguage();

  const itemsRef = useRef(items);
  const totalPriceRef = useRef(totalPrice);
  const paymentMethodRef = useRef(paymentMethod);
  const userIdRef = useRef(user?.id);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { totalPriceRef.current = totalPrice; }, [totalPrice]);
  useEffect(() => { paymentMethodRef.current = paymentMethod; }, [paymentMethod]);
  useEffect(() => { userIdRef.current = user?.id; }, [user?.id]);

  // Auto-detect payment simulation
  useEffect(() => {
    if (step === "payment") {
      const verifyTimer = setTimeout(() => setPaymentState("verifying"), 1800);
      const successTimer = setTimeout(() => {
        const newOrderId = `ord_${Date.now()}`;
        const orderItems: OrderItem[] = itemsRef.current.map((item, idx) => ({
          id: `oi_${Date.now()}_${idx}`,
          orderId: newOrderId,
          productId: item.id,
          title: item.title,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          sellerId: item.sellerId,
          keys: [],
          platform: item.platform || "",
        }));
        const newOrder: Order = {
          id: newOrderId,
          buyerId: userIdRef.current || "guest",
          date: new Date().toISOString(),
          status: "paid",
          totalPrice: totalPriceRef.current,
          paymentMethod: paymentMethodRef.current === "promptpay" ? "PromptPay" : paymentMethodRef.current === "truemoney" ? "TrueMoney" : "Card",
          items: orderItems,
        };
        const saved = localStorage.getItem("keyzaa_orders");
        const existing: Order[] = saved ? JSON.parse(saved) : [];
        localStorage.setItem("keyzaa_orders", JSON.stringify([newOrder, ...existing]));
        setOrderId(newOrderId);
        setPaymentState("success");
        setStep("success");
      }, 5000);
      return () => {
        clearTimeout(verifyTimer);
        clearTimeout(successTimer);
      };
    }
  }, [step]);

  const paymentMethods: { id: PaymentMethod; label: string; hint: string }[] = [
    { id: "promptpay", label: "PromptPay QR", hint: t("checkout_hintFastest") },
    { id: "truemoney", label: "TrueMoney Wallet", hint: t("checkout_hintConvenient") },
    { id: "card", label: t("checkout_cardLabel"), hint: "Visa / Mastercard" },
  ];

  const paymentStatusLabel = (() => {
    if (paymentState === "pending") return t("checkout_waiting");
    if (paymentState === "verifying") return t("checkout_verifying");
    return t("checkout_paid");
  })();

  if (items.length === 0 && step !== "success") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-6">
        <div className="surface-card p-10 text-center">
          <h2 className="text-2xl font-black text-text-main">{t("checkout_emptyTitle")}</h2>
          <p className="mt-2 text-sm text-text-muted">{t("checkout_emptyDesc")}</p>
          <Link href="/" className="mt-6 inline-block">
            <CTAButton>{t("checkout_startShopping")}</CTAButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-safe">
      <div className="section-container max-w-3xl py-8">
        <div className="mb-8 flex items-center justify-between motion-fade-up">
          <button
            onClick={() => (step === "cart" ? router.push("/") : setStep("cart"))}
            className="elevation-1 rounded-xl bg-bg-surface/90 px-3 py-2 text-sm text-text-subtle"
          >
            {t("common_back")}
          </button>
          <h1 className="type-h2">
            {step === "cart" ? t("checkout_titleCart") : step === "payment" ? t("checkout_titlePayment") : t("checkout_titleSuccess")}
          </h1>
          <Badge label={t("checkout_secure")} tone="success" />
        </div>

        {step === "cart" ? (
          <div className="space-y-5 motion-fade-up">
            {items.map((item) => (
              <div key={item.id} className="surface-card flex gap-4 p-5">
                <div className="elevation-1 relative h-20 w-20 overflow-hidden rounded-xl bg-bg-subtle">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 min-w-0 text-base font-semibold leading-snug text-text-main">{item.title}</h3>
                    <button onClick={() => removeItem(item.id)} className="text-sm text-text-muted hover:text-danger">{t("common_remove")}</button>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="type-num text-lg font-extrabold">฿{(item.price * item.quantity).toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label={t("checkout_decreaseQty")}
                        className="elevation-1 min-h-11 min-w-11 rounded-md bg-bg-subtle px-2 py-1"
                      >
                        -
                      </button>
                      <span className="type-num min-w-5 text-center text-base font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label={t("checkout_increaseQty")}
                        className="elevation-1 min-h-11 min-w-11 rounded-md bg-bg-subtle px-2 py-1"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="glass-panel fixed bottom-0 left-0 right-0 z-40 p-3">
              <div className="section-container flex items-center justify-between px-0">
                <PriceTag price={totalPrice} />
                <CTAButton
                  onClick={() => {
                    setPaymentState("pending");
                    setStep("payment");
                  }}
                >
                  {t("checkout_proceed")}
                </CTAButton>
              </div>
            </div>
          </div>
        ) : null}

        {step === "payment" ? (
          <div className="space-y-5 motion-fade-up">
            <div className="surface-card glass-panel space-y-4 p-6">
              <p className="text-base font-semibold text-text-main">{t("checkout_paymentMethods")}</p>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full rounded-2xl p-4 text-left transition-all ${paymentMethod === method.id ? "accent-ring bg-linear-to-b from-bg-elevated to-bg-surface" : "elevation-1 bg-bg-surface/90"}`}
                  >
                    <p className="text-base font-semibold text-text-main">{method.label}</p>
                    <p className="text-sm text-text-muted">{method.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="surface-card p-7 text-center">
              <p className="text-base text-text-subtle">{t("checkout_totalAmount")}</p>
              <p className="type-num text-5xl font-extrabold text-gradient-brand">฿{totalPrice.toLocaleString()}</p>
              <div className="elevation-2 mx-auto mt-6 grid h-56 w-56 place-items-center rounded-3xl bg-bg-elevated text-text-main">
                QR
              </div>
              <p className="mt-4 text-base font-semibold text-accent">{paymentStatusLabel}</p>
            </div>
          </div>
        ) : null}

        {step === "success" ? (
          <div className="surface-card motion-fade-up space-y-6 p-7 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-bg text-accent">✓</div>
            <h2 className="type-h2 text-text-main">{t("checkout_paid")}</h2>
            <p className="type-body text-text-subtle">{t("checkout_autoVerified")}</p>
            <div className="elevation-1 space-y-2 rounded-2xl bg-bg-surface/90 p-4 text-left">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-base">
                  <span className="text-text-subtle">{item.title}</span>
                  <span className="type-num font-semibold text-text-main">{item.quantity} {t("common_itemSuffix")}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <CTAButton
                fullWidth
                onClick={() => {
                  clearCart();
                  router.push(`/orders/${orderId}`);
                }}
              >
                {t("checkout_getKeys")}
              </CTAButton>
              <CTAButton fullWidth variant="secondary" onClick={() => router.push("/")}>
                {t("common_backHome")}
              </CTAButton>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
