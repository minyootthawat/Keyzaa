import type { Product, Seller, SellerVerificationStatus } from "@/app/types";

export type AppLanguage = "th" | "en";

export function getProductTitle(product: Product, lang: AppLanguage) {
  return lang === "th" ? product.nameTh : product.nameEn;
}

export function getProductShortDescription(product: Product, lang: AppLanguage) {
  return lang === "th" ? product.shortDescriptionTh || product.descriptionTh || product.title : product.shortDescriptionEn || product.descriptionEn || product.title;
}

export function getProductDescription(product: Product, lang: AppLanguage) {
  return lang === "th" ? product.descriptionTh || product.shortDescriptionTh || product.title : product.descriptionEn || product.shortDescriptionEn || product.title;
}

export function getActivationMethod(product: Product, lang: AppLanguage) {
  return lang === "th" ? product.activationMethodTh || "รับโค้ดแล้วนำไปแลก" : product.activationMethodEn || "Receive the code and redeem it";
}

export function getDeliveryLabel(product: Product, lang: AppLanguage) {
  return lang === "th" ? product.deliveryLabelTh || "ส่งทันที" : product.deliveryLabelEn || "Instant delivery";
}

export function getRegionLabel(product: Product, lang: AppLanguage) {
  if (lang === "th") {
    return product.regionLabelTh || "ใช้งานในประเทศไทย";
  }

  return product.regionLabelEn || "Works in Thailand";
}

export function getTrustLabel(product: Product, lang: AppLanguage) {
  return lang === "th" ? product.trustLabelTh || "ร้านค้ายืนยันตัวตนแล้ว" : product.trustLabelEn || "Verified sellers only";
}

export function getActivationSteps(product: Product, lang: AppLanguage) {
  const steps = lang === "th" ? product.activationStepsTh : product.activationStepsEn;
  return steps && steps.length > 0
    ? steps
    : lang === "th"
      ? ["เริ่มขั้นตอนชำระเงินจำลอง", "รับรหัสทดสอบหลังระบบยืนยันเดโม", "นำรหัสไปเติมหรือแลกในแพลตฟอร์มที่รองรับ"]
      : ["Start the mock payment flow", "Receive your test code after demo confirmation", "Redeem the code on the supported platform"];
}

export function formatThaiBaht(value: number) {
  return new Intl.NumberFormat("th-TH").format(value);
}

export function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function matchesProductQuery(product: Product, query: string) {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return true;
  }

  const searchFields = [
    product.title,
    product.nameTh,
    product.nameEn,
    product.category,
    product.platform,
    ...(product.searchTermsTh || []),
    ...(product.searchTermsEn || []),
  ];

  return searchFields.some((field) => normalizeSearchValue(field).includes(normalizedQuery));
}

export function getSellerTrustLabel(status: SellerVerificationStatus | undefined, lang: AppLanguage) {
  if (status === "top_rated") {
    return lang === "th" ? "Top seller" : "Top seller";
  }

  if (status === "verified") {
    return lang === "th" ? "ร้านยืนยันตัวตน" : "Verified seller";
  }

  return lang === "th" ? "ร้านใหม่" : "New seller";
}

export function getSellerTrustTone(status: SellerVerificationStatus | undefined) {
  if (status === "top_rated") {
    return "promo";
  }

  if (status === "verified") {
    return "success";
  }

  return "default";
}

export function buildSellerSummary(seller: Seller) {
  return {
    fulfillmentRate: seller.fulfillmentRate ?? 99.2,
    responseTimeMinutes: seller.responseTimeMinutes ?? 7,
    disputeRate: seller.disputeRate ?? 0.4,
  };
}
