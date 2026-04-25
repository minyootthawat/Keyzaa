export type PaymentMockLanguage = "th" | "en";

export const PAYMENT_MOCK_MODE = process.env.NEXT_PUBLIC_PAYMENT_MOCK_MODE === "true";

export function getMockPaymentMethodLabel(method: string, lang: PaymentMockLanguage) {
  const normalized = method.toLowerCase();

  if (normalized.includes("card")) {
    return lang === "th" ? "ชำระด้วยบัตร" : "Pay by Card";
  }

  if (normalized.includes("truemoney")) {
    return lang === "th" ? "TrueMoney Wallet" : "TrueMoney Wallet";
  }

  return lang === "th" ? "PromptPay QR" : "PromptPay QR";
}

export function getMockPaymentNotice(lang: PaymentMockLanguage) {
  return lang === "th"
    ? "นี่คือการชำระเงินแบบจำลองสำหรับเดโม ระบบจะสร้างคำสั่งซื้อทดสอบโดยไม่ตัดเงินจริง"
    : "This is a mock payment flow for demo use. It creates test orders without charging real money.";
}

export function getMockPayoutNotice(lang: PaymentMockLanguage) {
  return lang === "th"
    ? "กระเป๋าเงินและการถอนเงินในหน้านี้เป็นข้อมูลจำลองสำหรับทดสอบแดชบอร์ดผู้ขาย"
    : "Wallet balances and payout actions on this page are mock data for seller dashboard testing.";
}
