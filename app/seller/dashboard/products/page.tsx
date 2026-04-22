"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import { getStoredToken } from "@/app/lib/auth-client";
import { formatThaiBaht } from "@/app/lib/marketplace";
import CTAButton from "@/app/components/CTAButton";
import Badge from "@/app/components/Badge";
import type { Product } from "@/app/types";

type SellerProduct = Product;

interface SellerProductsResponse {
  products: SellerProduct[];
}

interface AddProductModalProps {
  sellerId: string;
  onClose: () => void;
  onAdd: (product: SellerProduct) => Promise<void>;
}

export default function SellerProductsPage() {
  const { seller } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      const timeout = window.setTimeout(() => {
        setLoading(false);
      }, 0);

      return () => window.clearTimeout(timeout);
    }

    const controller = new AbortController();

    fetch("/api/seller/products", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = (await response.json()) as SellerProductsResponse;
        setProducts(data.products);
      })
      .catch(() => {
        setProducts([]);
        setError("Unable to load seller products.");
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: t("sellerProducts_outOfStock"), tone: "default" as const };
    if (stock < 20) return { label: t("sellerProducts_lowStock"), tone: "promo" as const };
    return { label: t("sellerProducts_inStock"), tone: "success" as const };
  };

  const createProduct = async (product: SellerProduct) => {
    const token = getStoredToken();

    if (!token) {
      throw new Error("Missing token");
    }

    const response = await fetch("/api/seller/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      throw new Error("Failed to create product");
    }

    const data = (await response.json()) as { product: SellerProduct };
    setProducts((prev) => [data.product, ...prev]);
  };

  const handleDelete = async (productId: string) => {
    const token = getStoredToken();

    if (!token) {
      return;
    }

    const response = await fetch(`/api/seller/products/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      setError("This listing is managed outside the dashboard and cannot be deleted here.");
      return;
    }

    setProducts((prev) => prev.filter((product) => product.id !== productId));
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-h1">{t("sellerProducts_title")}</h1>
          <p className="type-body mt-1 text-text-subtle">{seller?.shopName}</p>
        </div>
        <CTAButton onClick={() => setShowAddModal(true)}>{t("sellerProducts_add")}</CTAButton>
      </div>

      {error ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {products.length === 0 ? (
        <div className="surface-card glass-panel space-y-3 p-12 text-center">
          <p className="text-4xl">📦</p>
          <h2 className="type-h2 text-text-main">{t("sellerProducts_empty")}</h2>
          <p className="type-body text-text-subtle">{t("sellerProducts_emptyDesc")}</p>
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted">
                  <th className="px-5 py-3 font-semibold">{t("common_products")}</th>
                  <th className="px-5 py-3 font-semibold">{t("common_category")}</th>
                  <th className="px-5 py-3 font-semibold">Listing</th>
                  <th className="px-5 py-3 font-semibold">{t("seller_stock")}</th>
                  <th className="px-5 py-3 font-semibold">{t("seller_sold")}</th>
                  <th className="px-5 py-3 font-semibold">Gross sales</th>
                  <th className="px-5 py-3 font-semibold">{t("seller_manage")}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  const canDelete = product.id.startsWith("prd_");

                  return (
                    <tr key={product.id} className="border-b border-border-subtle last:border-0">
                      <td className="max-w-[300px] truncate px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-bg-surface">
                            <Image src={product.image} alt={product.title} fill className="object-cover" sizes="40px" />
                          </div>
                          <div>
                            <p className="truncate font-semibold text-text-main">{product.title}</p>
                            <p className="text-xs text-text-muted">฿{formatThaiBaht(product.price)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-text-subtle">{product.category}</td>
                      <td className="px-5 py-4 text-text-subtle">{product.listingStatus || "active"}</td>
                      <td className="px-5 py-4">
                        <Badge label={stockStatus.label} tone={stockStatus.tone} />
                      </td>
                      <td className="type-num px-5 py-4 text-text-subtle">{product.soldCount.toLocaleString()}</td>
                      <td className="type-num px-5 py-4 font-semibold text-text-main">
                        ฿{formatThaiBaht(product.price * product.soldCount)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={!canDelete}
                          className="rounded-lg bg-bg-surface px-3 py-1.5 text-xs font-semibold text-danger shadow-[0_8px_16px_rgba(5,10,24,0.14)] disabled:cursor-not-allowed disabled:text-text-muted"
                        >
                          {canDelete ? t("sellerProducts_delete") : "Seed catalog"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal ? (
        <AddProductModal
          sellerId={seller?.id || ""}
          onClose={() => setShowAddModal(false)}
          onAdd={async (product) => {
            await createProduct(product);
            setShowAddModal(false);
          }}
        />
      ) : null}
    </div>
  );
}

function AddProductModal({ sellerId, onClose, onAdd }: AddProductModalProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("เติมเกม");
  const [platform, setPlatform] = useState("Mobile");
  const [stock, setStock] = useState("100");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const p = Number(price);
      const op = Number(originalPrice);
      const discount = op > 0 ? Math.round((1 - p / op) * 100) : 0;

      await onAdd({
        id: "",
        title,
        nameTh: title,
        nameEn: title,
        image: "/products/rov.png",
        price: p,
        originalPrice: op,
        discount,
        category,
        platform,
        sellerId,
        stock: Number(stock) || 0,
        soldCount: 0,
        isActive: true,
        listingStatus: "active",
        currency: "THB",
        marketplaceType: "seller_owned",
        regionCode: "TH",
        regionLabelTh: "ใช้ได้ในประเทศไทย",
        regionLabelEn: "Works in Thailand",
        deliverySlaMinutes: 5,
        deliveryLabelTh: "จัดส่งใน 5 นาที",
        deliveryLabelEn: "Delivered within 5 minutes",
        activationMethodTh: "รับโค้ดและทำตามคำแนะนำหลังซื้อ",
        activationMethodEn: "Receive the code and follow the post-purchase instructions",
      });
    } catch {
      setError("Unable to create product right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80 p-4 backdrop-blur-sm">
      <div className="surface-card glass-panel w-full max-w-lg space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="type-h2">{t("sellerProducts_add")}</h2>
          <button onClick={onClose} className="text-2xl text-text-muted hover:text-text-main">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-subtle">Product Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">Price (฿)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="1"
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">Original Price (฿)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                required
                min="1"
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">{t("common_category")}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
              >
                <option value="เติมเกม">เติมเกม</option>
                <option value="Gift Card">Gift Card</option>
                <option value="Subscription">Subscription</option>
                <option value="AI Tools">AI Tools</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">{t("common_platform")}</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
              >
                <option value="Mobile">Mobile</option>
                <option value="PC">PC</option>
                <option value="Web">Web</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-subtle">{t("seller_stock")}</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              min="0"
              className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex gap-3 pt-2">
            <CTAButton type="button" variant="secondary" onClick={onClose} fullWidth>
              {t("common_back")}
            </CTAButton>
            <CTAButton type="submit" fullWidth disabled={submitting}>
              {submitting ? "Saving..." : t("sellerProducts_add")}
            </CTAButton>
          </div>
        </form>
      </div>
    </div>
  );
}
