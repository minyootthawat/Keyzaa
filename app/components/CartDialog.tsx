"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import CTAButton from "@/app/components/CTAButton";
import PriceTag from "@/app/components/PriceTag";
import Badge from "@/app/components/Badge";
import { useLanguage } from "@/app/context/LanguageContext";
import type { Order, OrderItem } from "@/app/types";

type CheckoutStep = "cart" | "payment" | "success";
type PaymentMethod = "promptpay" | "truemoney" | "card";
type PaymentState = "pending" | "verifying" | "success";

interface CartDialogProps {
  onClose: () => void;
}

export default function CartDialog({ onClose }: CartDialogProps) {
  const router = useRouter();
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("promptpay");
  const [paymentState, setPaymentState] = useState<PaymentState>("pending");
  const [orderId, setOrderId] = useState<string>("");
  const { t } = useLanguage();

  const itemsRef = useRef(items);
  const totalPriceRef = useRef(totalPrice);
  const paymentMethodRef = useRef(paymentMethod);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { totalPriceRef.current = totalPrice; }, [totalPrice]);
  useEffect(() => { paymentMethodRef.current = paymentMethod; }, [paymentMethod]);

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
          buyerId: "user", // TODO: wire to auth user
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative surface-card glass-panel w-full max-w-sm p-6 m-4">
          <button onClick={onClose} className="absolute right-4 top-4 text-text-muted hover:text-text-main">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="text-center py-6">
            <h2 className="text-xl font-black text-text-main">{t("checkout_emptyTitle")}</h2>
            <p className="mt-2 text-sm text-text-muted">{t("checkout_emptyDesc")}</p>
            <CTAButton onClick={onClose} className="mt-6">{t("checkout_startShopping")}</CTAButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative surface-card glass-panel w-full max-w-md max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 z-10 bg-bg-surface border-b border-border-subtle px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => step === "cart" ? onClose() : setStep("cart")}
            className="text-sm text-text-subtle hover:text-text-main"
          >
            {step === "cart" ? "✕" : "←"}
          </button>
          <h2 className="type-h2 text-base">
            {step === "cart" ? t("checkout_titleCart") : step === "payment" ? t("checkout_titlePayment") : t("checkout_titleSuccess")}
          </h2>
          <Badge label={t("checkout_secure")} tone="success" />
        </div>

        <div className="p-4 space-y-4">
          {step === "cart" ? (
            <>
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 bg-bg-elevated rounded-xl">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-bg-subtle">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-text-main">{item.title}</h3>
                    <div className="flex items-end justify-between">
                      <span className="type-num text-sm font-extrabold">฿{(item.price * item.quantity).toLocaleString()}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-7 w-7 rounded-md bg-bg-surface text-text-subtle hover:text-text-main text-sm"
                        >
                          -
                        </button>
                        <span className="type-num min-w-4 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-7 w-7 rounded-md bg-bg-surface text-text-subtle hover:text-text-main text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-text-muted hover:text-danger text-xs">✕</button>
                </div>
              ))}

              <div className="sticky bottom-0 bg-bg-surface pt-3 flex items-center justify-between">
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
            </>
          ) : null}

          {step === "payment" ? (
            <>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full rounded-xl p-4 text-left transition-all ${paymentMethod === method.id ? "accent-ring bg-bg-elevated" : "bg-bg-elevated/80"}`}
                  >
                    <p className="text-sm font-semibold text-text-main">{method.label}</p>
                    <p className="text-xs text-text-muted">{method.hint}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-xl bg-bg-elevated p-4 text-center">
                <p className="text-sm text-text-subtle">{t("checkout_totalAmount")}</p>
                <p className="type-num text-3xl font-extrabold text-gradient-brand">฿{totalPrice.toLocaleString()}</p>
                <div className="elevation-2 mx-auto my-4 grid h-40 w-40 place-items-center rounded-2xl bg-bg-surface text-text-main">
                  QR
                </div>
                <p className="text-sm font-semibold text-accent">{paymentStatusLabel}</p>
              </div>
            </>
          ) : null}

          {step === "success" ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success-bg text-accent text-xl">✓</div>
              <h2 className="text-xl font-black text-text-main">{t("checkout_paid")}</h2>
              <p className="text-sm text-text-subtle">{t("checkout_autoVerified")}</p>
              <div className="rounded-xl bg-bg-elevated p-3 text-left space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-text-subtle">{item.title}</span>
                    <span className="type-num font-semibold text-text-main">×{item.quantity}</span>
                  </div>
                ))}
              </div>
              <CTAButton
                fullWidth
                onClick={() => {
                  clearCart();
                  onClose();
                  router.push(`/orders/${orderId}`);
                }}
              >
                {t("checkout_getKeys")}
              </CTAButton>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}