"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import CTAButton from "@/app/components/CTAButton";
import PriceTag from "@/app/components/PriceTag";
import Badge from "@/app/components/Badge";
import { useLanguage } from "@/app/context/LanguageContext";
import { getMockPaymentNotice } from "@/app/lib/payment-mock";

interface CartDialogProps {
  onClose: () => void;
}

export default function CartDialog({ onClose }: CartDialogProps) {
  const router = useRouter();
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  const { t, lang } = useLanguage();

  const proceedToCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-bg-base/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative m-4 max-h-[90vh] w-full max-w-md overflow-y-auto">
        <div className="surface-card glass-panel overflow-hidden">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-bg-surface px-4 py-3">
            <button onClick={onClose} className="text-sm text-text-subtle hover:text-text-main">
              ✕
            </button>
            <h2 className="type-h2 text-base">{t("checkout_titleCart")}</h2>
            <Badge label={t("checkout_secure")} tone="success" />
          </div>

          <div className="space-y-4 p-4">
            {items.length === 0 ? (
              <div className="py-6 text-center">
                <h2 className="text-xl font-black text-text-main">{t("checkout_emptyTitle")}</h2>
                <p className="mt-2 text-sm text-text-muted">{t("checkout_emptyDesc")}</p>
                <CTAButton onClick={onClose} className="mt-6">
                  {t("checkout_startShopping")}
                </CTAButton>
              </div>
            ) : (
              <>
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-xl bg-bg-elevated p-3">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-bg-subtle">
                      <Image src={item.image} alt={item.title} fill className="object-cover" sizes="64px" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-text-main">{item.title}</h3>
                      <p className="text-xs text-text-muted">{item.sellerName}</p>
                      <div className="flex items-end justify-between">
                        <span className="type-num text-sm font-extrabold">฿{(item.price * item.quantity).toLocaleString()}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-7 w-7 rounded-md bg-bg-surface text-sm text-text-subtle hover:text-text-main"
                          >
                            -
                          </button>
                          <span className="type-num min-w-4 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-7 w-7 rounded-md bg-bg-surface text-sm text-text-subtle hover:text-text-main"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-xs text-text-muted hover:text-danger">
                      ✕
                    </button>
                  </div>
                ))}

                <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4 text-sm leading-7 text-text-subtle">
                  <p className="font-semibold text-text-main">{lang === "th" ? "เดโมการชำระเงิน" : "Mock checkout"}</p>
                  <ul className="mt-2 space-y-1">
                    <li>THB-first pricing</li>
                    <li>{lang === "th" ? "ขั้นตอนการชำระเงินเป็นแบบจำลอง" : "Payment flow runs in mock mode"}</li>
                    <li>{lang === "th" ? "ระบบยังสร้างคำสั่งซื้อทดสอบและหน้ารับสินค้า" : "The app still creates test orders and delivery pages"}</li>
                  </ul>
                  <p className="mt-3 text-xs text-text-muted">{getMockPaymentNotice(lang)}</p>
                </div>

                <div className="sticky bottom-0 flex items-center justify-between bg-bg-surface pt-3">
                  <PriceTag price={totalPrice} />
                  <CTAButton onClick={proceedToCheckout}>{t("checkout_proceed")}</CTAButton>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
