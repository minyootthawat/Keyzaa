"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import CTAButton from "@/app/components/CTAButton";
import { useLanguage } from "@/app/context/LanguageContext";

interface OrderItem {
  id: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  keys: string[];
  platform: string;
}

interface OrderDetail {
  id: string;
  date: string;
  status: string;
  totalPrice: number;
  paymentMethod: string;
  items: OrderItem[];
}

export default function OrderDeliveryPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      const mockOrder: OrderDetail = {
        id: (id as string) || "KZ-582910",
        date: "8 เม.ย. 2026, 19:02",
        status: "สำเร็จ",
        totalPrice: 65,
        paymentMethod: "PromptPay",
        items: [
          {
            id: "1",
            title: "ROV Diamond 100",
            image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop",
            price: 65,
            quantity: 1,
            keys: ["ROV-D100-XYZ-9988-7766"],
            platform: "Mobile / Garena",
          },
        ],
      };
      setOrder(mockOrder);
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [id]);

  const toggleReveal = (keyId: string) => {
    setRevealedKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(text);
      setCopyFeedback(label);
    } catch {
      setCopyFeedback(t("delivery_copyFailed"));
    } finally {
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen pb-24 md:pb-12">
      <div className="section-container max-w-4xl py-10 md:py-16">
        <div className="mb-12 space-y-4 text-center motion-fade-up">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-success-bg text-3xl text-accent shadow-[0_18px_32px_rgba(16,185,129,0.22)]">✓</div>
          <h1 className="type-h1">{t("delivery_title")}</h1>
          <p className="type-body text-text-subtle">
            {t("delivery_reference")} <span className="font-bold text-text-main">{order.id}</span> • {order.date} • {order.paymentMethod}
          </p>
        </div>

        <div className="space-y-6 motion-fade-up">
          <h2 className="type-h2">{t("delivery_yourItems")}</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="surface-card overflow-hidden rounded-[28px]">
                <div className="flex flex-col gap-5 p-6 md:flex-row md:p-8">
                  <div className="flex gap-4 md:w-1/3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-bg-surface md:h-24 md:w-24 shadow-[0_10px_18px_rgba(5,10,24,0.2)]">
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="type-meta text-accent">{item.platform}</span>
                      <h3 className="line-clamp-2 text-lg font-extrabold leading-tight text-text-main">{item.title}</h3>
                      <p className="type-num mt-1 text-sm text-text-subtle">{t("common_quantity")}: {item.quantity}</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    {item.keys.map((key, idx) => {
                      const keyId = `${item.id}-${idx}`;
                      const isRevealed = revealedKeys[keyId];
                      return (
                        <div key={keyId} className="space-y-2">
                          <label className="type-meta ml-1 text-text-muted">
                            {t("delivery_serial")} {item.keys.length > 1 ? idx + 1 : ""}
                          </label>
                          <div className={`rounded-2xl p-1 transition-all ${isRevealed ? "accent-ring bg-bg-elevated" : "bg-bg-surface/90 shadow-[0_10px_18px_rgba(5,10,24,0.15)]"}`}>
                            <div className="flex items-center justify-between gap-4 p-3 md:p-4">
                              <div className="flex flex-1 items-center gap-3 overflow-hidden">
                                <div className="rounded-lg bg-bg-subtle p-2 text-text-subtle">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                                </div>
                                <div className="truncate font-mono text-base font-black tracking-widest md:text-xl">
                                  {isRevealed ? key : "•••••-•••••-•••••-•••••"}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleReveal(keyId)}
                                  aria-label={isRevealed ? t("delivery_hideKey") : t("delivery_revealKey")}
                                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all md:h-11 md:w-11 ${isRevealed ? "bg-bg-surface text-text-main" : "btn-primary text-white"}`}
                                >
                                  {isRevealed ? "🙈" : "👁️"}
                                </button>
                                {isRevealed ? (
                                  <button
                                    onClick={() => copyToClipboard(key, t("delivery_serialCopied"))}
                                    aria-label={t("delivery_copyKey")}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-bg-base transition-all active:scale-90 md:h-11 md:w-11"
                                  >
                                    ⧉
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="surface-card glass-panel mt-8 space-y-4 p-7">
            <h2 className="type-h2">{t("delivery_howToUse")}</h2>
            <ol className="list-inside list-decimal space-y-2 text-base text-text-subtle">
              <li>{t("delivery_step1")}</li>
              <li>{t("delivery_step2")} {order.items[0].platform}</li>
              <li>{t("delivery_step3")}</li>
            </ol>
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <CTAButton variant="secondary">{t("delivery_downloadReceipt")}</CTAButton>
            <CTAButton variant="secondary">{t("delivery_contactSupport")}</CTAButton>
            <Link href="/">
              <CTAButton>{t("common_backHome")}</CTAButton>
            </Link>
          </div>
        </div>
      </div>

      {copyFeedback ? (
        <div className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2">
          <div aria-live="polite" className="flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-black text-bg-base shadow-2xl">
            {copyFeedback}
          </div>
        </div>
      ) : null}
    </div>
  );
}
