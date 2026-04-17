"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import CTAButton from "@/app/components/CTAButton";
import Badge from "@/app/components/Badge";
import type { Product } from "@/app/types";

type SellerProduct = Product;

export default function SellerProductsPage() {
  const { seller } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem("keyzaa_seller_products");
      if (saved) {
        try {
          const allProducts: SellerProduct[] = JSON.parse(saved);
          setProducts(allProducts.filter((p) => p.sellerId === seller?.id));
        } catch {
          setProducts([]);
        }
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [seller]);

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: t("sellerProducts_outOfStock"), tone: "default" as const };
    if (stock < 20) return { label: t("sellerProducts_lowStock"), tone: "promo" as const };
    return { label: t("sellerProducts_inStock"), tone: "success" as const };
  };

  const handleDelete = (productId: string) => {
    const saved = localStorage.getItem("keyzaa_seller_products");
    if (saved) {
      try {
        const allProducts: SellerProduct[] = JSON.parse(saved);
        const updated = allProducts.filter((p) => p.id !== productId);
        localStorage.setItem("keyzaa_seller_products", JSON.stringify(updated));
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } catch {
        // ignore
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
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

      {products.length === 0 ? (
        <div className="surface-card glass-panel p-12 text-center space-y-3">
          <p className="text-4xl">📦</p>
          <h2 className="type-h2 text-text-main">{t("sellerProducts_empty")}</h2>
          <p className="type-body text-text-subtle">{t("sellerProducts_emptyDesc")}</p>
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-text-muted border-b border-border-subtle">
                  <th className="px-5 py-3 font-semibold">{t("common_products")}</th>
                  <th className="px-5 py-3 font-semibold">{t("common_category")}</th>
                  <th className="px-5 py-3 font-semibold">{t("seller_stock")}</th>
                  <th className="px-5 py-3 font-semibold">{t("seller_sold")}</th>
                  <th className="px-5 py-3 font-semibold">{t("seller_revenue")}</th>
                  <th className="px-5 py-3 font-semibold">{t("seller_manage")}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  return (
                    <tr key={product.id} className="border-b border-border-subtle last:border-0">
                      <td className="max-w-[260px] truncate px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-bg-surface overflow-hidden relative shrink-0">
                            <img src={product.image} alt={product.title} className="object-cover w-full h-full" />
                          </div>
                          <div>
                            <p className="font-semibold text-text-main truncate">{product.title}</p>
                            <p className="text-xs text-text-muted">฿{product.price.toLocaleString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-text-subtle">{product.category}</td>
                      <td className="px-5 py-4">
                        <Badge label={stockStatus.label} tone={stockStatus.tone} />
                      </td>
                      <td className="type-num px-5 py-4 text-text-subtle">{product.soldCount.toLocaleString()}</td>
                      <td className="type-num px-5 py-4 font-semibold text-text-main">
                        ฿{(product.price * product.soldCount).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="rounded-lg bg-bg-surface px-3 py-1.5 text-xs font-semibold text-danger shadow-[0_8px_16px_rgba(5,10,24,0.14)]"
                          >
                            {t("sellerProducts_delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddProductModal
          sellerId={seller?.id || ""}
          onClose={() => setShowAddModal(false)}
          onAdd={(product) => {
            setProducts((prev) => [...prev, product]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

interface AddProductModalProps {
  sellerId: string;
  onClose: () => void;
  onAdd: (product: SellerProduct) => void;
}

function AddProductModal({ sellerId, onClose, onAdd }: AddProductModalProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("เติมเกม");
  const [platform, setPlatform] = useState("Mobile");
  const [stock, setStock] = useState("100");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(price);
    const op = parseFloat(originalPrice);
    const discount = op > 0 ? Math.round((1 - p / op) * 100) : 0;
    const newProduct: SellerProduct = {
      id: `sp_${Date.now()}`,
      title,
      image: "/products/rov.png",
      price: p,
      originalPrice: op,
      discount,
      category,
      platform,
      sellerId,
      stock: parseInt(stock) || 0,
      soldCount: 0,
      isActive: true,
    };
    const saved = localStorage.getItem("keyzaa_seller_products");
    const existing: SellerProduct[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem("keyzaa_seller_products", JSON.stringify([...existing, newProduct]));
    onAdd(newProduct);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80 backdrop-blur-sm p-4">
      <div className="surface-card glass-panel w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="type-h2">{t("sellerProducts_add")}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-subtle">Product Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
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
                className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">Original Price (฿)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                required
                className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">{t("common_category")}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
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
                className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
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
              className="w-full rounded-xl bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-main focus:border-brand-primary focus:outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <CTAButton type="button" variant="secondary" onClick={onClose} fullWidth>{t("common_back")}</CTAButton>
            <CTAButton type="submit" fullWidth>{t("sellerProducts_add")}</CTAButton>
          </div>
        </form>
      </div>
    </div>
  );
}
