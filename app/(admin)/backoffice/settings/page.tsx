"use client";

import AdminRouteGuard from "@/app/components/AdminRouteGuard";
import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";

interface Settings {
  general?: {
    platformFeePercent?: number;
    minPayoutAmount?: number;
    supportEmail?: string;
  };
  features?: {
    maintenanceMode?: boolean;
    allowNewSellers?: boolean;
  };
  categories?: string[];
}

type TabId = "general" | "features" | "categories" | "audit";

export default function AdminSettingsPage() {
  return (
    <AdminRouteGuard requiredPermission="admin:settings:write">
      <SettingsContent />
    </AdminRouteGuard>
  );
}

function SettingsContent() {
  const { lang } = useLanguage();
  const { adminRole } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // General form state
  const [feePercent, setFeePercent] = useState("5");
  const [minPayout, setMinPayout] = useState("300");
  const [supportEmail, setSupportEmail] = useState("");

  // Features form state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowNewSellers, setAllowNewSellers] = useState(true);

  // Categories form state
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    fetch("/api/backoffice/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d as Settings);
        setFeePercent(String(d.general?.platformFeePercent ?? 5));
        setMinPayout(String(d.general?.minPayoutAmount ?? 300));
        setSupportEmail(d.general?.supportEmail ?? "");
        setMaintenanceMode(d.features?.maintenanceMode ?? false);
        setAllowNewSellers(d.features?.allowNewSellers ?? true);
        setCategories(d.categories ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveGeneral() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/backoffice/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "general",
          updates: {
            platformFeePercent: Number(feePercent),
            minPayoutAmount: Number(minPayout),
            supportEmail,
          },
        }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function saveFeatures() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/backoffice/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "features",
          updates: { maintenanceMode, allowNewSellers },
        }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function saveCategories() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/backoffice/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "categories", updates: categories }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function addCategory() {
    const cat = newCategory.trim();
    if (cat && !categories.includes(cat)) {
      setCategories([...categories, cat]);
      setNewCategory("");
    }
  }

  function removeCategory(cat: string) {
    setCategories(categories.filter((c) => c !== cat));
  }

  const t = (key: string) =>
    ({
      heading: lang === "th" ? "ตั้งค่าระบบ" : "System Settings",
      subtitle: lang === "th" ? "จัดการการตั้งค่าแพลตฟอร์ม" : "Manage platform configuration",
      tabGeneral: lang === "th" ? "ทั่วไป" : "General",
      tabFeatures: lang === "th" ? "ฟีเจอร์" : "Features",
      tabCategories: lang === "th" ? "หมวดหมู่" : "Categories",
      tabAudit: lang === "th" ? "ประวัติล็อก" : "Audit Log",
      platformFee: lang === "th" ? "ค่าธรรมเนียมแพลตฟอร์ม (%)" : "Platform Fee (%)",
      minPayout: lang === "th" ? "ยอดถอนขั้นต่ำ (฿)" : "Minimum Payout (฿)",
      supportEmailLabel: lang === "th" ? "อีเมลฝ่ายสนับสนุน" : "Support Email",
      maintenanceModeLabel: lang === "th" ? "โหมดบำรุงรักษา" : "Maintenance Mode",
      maintenanceDesc: lang === "th" ? "ปิดระบบทั้งหมดชั่วคราว" : "Temporarily shut down entire platform",
      allowNewSellersLabel: lang === "th" ? "อนุญาตลงทะเบียนร้านค้าใหม่" : "Allow New Seller Registration",
      allowNewSellersDesc: lang === "th" ? "ให้ผู้ใช้ใหม่สมัครเป็นร้านค้าได้" : "Allow new users to register as sellers",
      categoriesLabel: lang === "th" ? "หมวดหมู่สินค้า" : "Product Categories",
      categoryName: lang === "th" ? "ชื่อหมวดหมู่" : "Category Name",
      addCategory: lang === "th" ? "เพิ่ม" : "Add",
      save: lang === "th" ? "บันทึก" : "Save",
      saving: lang === "th" ? "กำลังบันทึก..." : "Saving...",
      saved: lang === "th" ? "✓ บันทึกแล้ว" : "✓ Saved",
      superAdminOnly: lang === "th" ? "เฉพาะ Super Admin" : "Super Admin only",
      noAudit: lang === "th" ? "ยังไม่มีประวัติ" : "No audit history",
      auditTime: lang === "th" ? "เวลา" : "Time",
      auditAction: lang === "th" ? "การกระทำ" : "Action",
      auditAdmin: lang === "th" ? "แอดมิน" : "Admin",
      // Audit placeholder
      auditDesc: lang === "th" ? "ประวัติการแก้ไขการตั้งค่าระบบ" : "System settings change history",
    }[key]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "general", label: t("tabGeneral") ?? "ทั่วไป" },
    { id: "features", label: t("tabFeatures") ?? "ฟีเจอร์" },
    { id: "categories", label: t("tabCategories") ?? "หมวดหมู่" },
    ...(adminRole === "super_admin"
      ? [{ id: "audit" as TabId, label: t("tabAudit") ?? "ประวัติล็อก" }]
      : []),
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-bg-subtle/40" />
        <div className="h-64 animate-pulse rounded-2xl bg-bg-subtle/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="type-h2 text-text-main">{t("heading")}</h1>
          <p className="mt-1 text-sm text-text-muted">{t("subtitle")}</p>
        </div>
        <span className="rounded-full border border-purple-500/25 bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-400">
          👑 {t("superAdminOnly")}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? "text-brand-primary"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="surface-card rounded-2xl p-6">
        {/* General Tab */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main">{t("platformFee")}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={feePercent}
                    onChange={(e) => setFeePercent(e.target.value)}
                    min="0"
                    max="100"
                    className="surface-card w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm text-text-main placeholder-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/25"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main">{t("minPayout")}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">฿</span>
                  <input
                    type="number"
                    value={minPayout}
                    onChange={(e) => setMinPayout(e.target.value)}
                    min="0"
                    className="surface-card w-full rounded-xl border border-border-subtle bg-bg-surface pl-7 pr-4 py-2.5 text-sm text-text-main placeholder-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/25"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-main">{t("supportEmailLabel")}</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="surface-card w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm text-text-main placeholder-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/25"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveGeneral}
                disabled={saving}
                className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-secondary disabled:opacity-50"
              >
                {saving ? t("saving") : t("save")}
              </button>
              {saved && <span className="text-sm text-green-400">{t("saved")}</span>}
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === "features" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border-subtle p-4">
                <div>
                  <p className="font-semibold text-text-main">{t("maintenanceModeLabel")}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{t("maintenanceDesc")}</p>
                </div>
                <button
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    maintenanceMode ? "bg-red-500" : "bg-bg-subtle"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      maintenanceMode ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border-subtle p-4">
                <div>
                  <p className="font-semibold text-text-main">{t("allowNewSellersLabel")}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{t("allowNewSellersDesc")}</p>
                </div>
                <button
                  onClick={() => setAllowNewSellers(!allowNewSellers)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    allowNewSellers ? "bg-green-500" : "bg-bg-subtle"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      allowNewSellers ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveFeatures}
                disabled={saving}
                className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-secondary disabled:opacity-50"
              >
                {saving ? t("saving") : t("save")}
              </button>
              {saved && <span className="text-sm text-green-400">{t("saved")}</span>}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-semibold text-text-main">{t("categoriesLabel")}</p>
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  placeholder={t("categoryName")}
                  className="surface-card flex-1 rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 text-sm text-text-main placeholder-text-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/25"
                />
                <button
                  onClick={addCategory}
                  className="rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-secondary"
                >
                  {t("addCategory")}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface px-3 py-1 text-sm text-text-main"
                  >
                    {cat}
                    <button
                      onClick={() => removeCategory(cat)}
                      className="ml-0.5 text-text-muted hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveCategories}
                disabled={saving}
                className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-secondary disabled:opacity-50"
              >
                {saving ? t("saving") : t("save")}
              </button>
              {saved && <span className="text-sm text-green-400">{t("saved")}</span>}
            </div>
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">{t("auditDesc")}</p>
            <div className="flex h-40 items-center justify-center text-sm text-text-muted">
              {t("noAudit")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
