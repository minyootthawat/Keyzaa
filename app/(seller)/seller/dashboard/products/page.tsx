"use client";

import { FormEvent, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import { getStoredToken } from "@/app/lib/auth-client";
import { formatThaiBaht } from "@/app/lib/marketplace";
import CTAButton from "@/app/components/CTAButton";
import Badge from "@/app/components/Badge";
import StatCard from "@/app/components/StatCard";
import SectionHeader from "@/app/components/SectionHeader";
import type { Product } from "@/app/types";

type SellerProduct = Product;

interface SellerProductsResponse {
  products: SellerProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AddProductModalProps {
  sellerId: string;
  onClose: () => void;
  onAdd: (product: SellerProduct) => Promise<void>;
}

const CATEGORIES = ["เติมเกม", "Gift Card", "Subscription", "ทั้งหมด"] as const;
type Category = (typeof CATEGORIES)[number];

// Sparkline data for KPI cards
const SPARKLINE_TOTAL = [55, 70, 60, 85, 75, 90, 95];
const SPARKLINE_LOW = [30, 45, 60, 40, 55, 35, 50];
const SPARKLINE_REVENUE = [80, 65, 90, 70, 85, 95, 100];
const SPARKLINE_STOCK = [90, 75, 85, 60, 70, 80, 65];

export default function SellerProductsPage() {
  const { seller } = useAuth();
  const { t, lang } = useLanguage();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("ทั้งหมด");
  const [editingCell, setEditingCell] = useState<{ id: string; field: "price" | "stock" } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const PAGE_SIZE = 20;

  const fetchProducts = useCallback(async (page: number, category: Category) => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const categoryParam = category === "ทั้งหมด" ? "" : category;
    const url = `/api/seller/products?page=${page}&limit=${PAGE_SIZE}${categoryParam ? `&category=${encodeURIComponent(categoryParam)}` : ""}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error("Failed to load products");
      }
      const data = (await response.json()) as SellerProductsResponse;
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setTotalProducts(data.total);
      setCurrentPage(data.page);
    } catch {
      // API failed, leave products as empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const categoryParam = activeCategory === "ทั้งหมด" ? "" : activeCategory;
    const url = `/api/seller/products?page=1&limit=${PAGE_SIZE}${categoryParam ? `&category=${encodeURIComponent(categoryParam)}` : ""}`;

    const doFetch = async () => {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to load products");
        }
        const data = (await response.json()) as SellerProductsResponse;
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setTotalProducts(data.total);
        setCurrentPage(data.page);
      } catch {
        // API failed, leave products as empty
      } finally {
        setLoading(false);
      }
    };
    doFetch();

    return () => controller.abort();
  }, [activeCategory]);

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

  const handleEditStart = (productId: string, field: "price" | "stock", currentValue: number) => {
    setEditingCell({ id: productId, field });
    setEditValue(String(currentValue));
  };

  const handleEditSave = useCallback(async () => {
    if (!editingCell) return;

    const token = getStoredToken();
    if (!token) return;

    const newValue = Number(editValue);
    if (isNaN(newValue) || newValue < 0) {
      setEditingCell(null);
      return;
    }

    const product = products.find((p) => p.id === editingCell.id);
    if (!product) return;

    const updatedProduct = {
      ...product,
      [editingCell.field]: newValue,
    };

    try {
      const response = await fetch(`/api/seller/products/${editingCell.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProduct),
      });

      if (response.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingCell.id ? { ...p, [editingCell.field]: newValue } : p))
        );
      }
    } catch {
      // silently fail
    }

    setEditingCell(null);
  }, [editingCell, editValue, products]);

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEditSave();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const handleBulkActivate = async () => {
    const token = getStoredToken();
    if (!token || selectedIds.size === 0) return;
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/seller/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ listingStatus: "active" }),
        })
      )
    );
    setProducts((prev) =>
      prev.map((p) => (selectedIds.has(p.id) ? { ...p, listingStatus: "active" } as Product : p))
    );
    setSelectedIds(new Set());
  };

  const handleBulkDeactivate = async () => {
    const token = getStoredToken();
    if (!token || selectedIds.size === 0) return;
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/seller/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ listingStatus: "paused" }),
        })
      )
    );
    setProducts((prev) =>
      prev.map((p) => (selectedIds.has(p.id) ? { ...p, listingStatus: "paused" } as Product : p))
    );
    setSelectedIds(new Set());
  };

  const handleCategoryChange = (cat: Category) => {
    setActiveCategory(cat);
    setCurrentPage(1);
    setLoading(true);
    fetchProducts(1, cat);
  };

  const getCategoryCount = (_category: Category) => {
    return products.filter((p) => p.category === _category).length;
  };

  const filteredProducts = products;

  // KPI cards
  const totalListings = totalProducts;
  const lowStockCount = filteredProducts.filter((p) => p.stock > 0 && p.stock < 20).length;
  const outOfStockCount = filteredProducts.filter((p) => p.stock === 0).length;
  const totalRevenue = filteredProducts.reduce((sum, p) => sum + p.price * p.soldCount, 0);

  const statCards = [
    {
      label: lang === "th" ? "สินค้าทั้งหมด" : "Total Listings",
      value: String(totalListings),
      delta: totalListings > 0 ? "↑ 5%" : "—",
      deltaColor: "text-accent" as const,
      sparklineData: SPARKLINE_TOTAL,
    },
    {
      label: lang === "th" ? "ใกล้หมดสต็อก" : "Low Stock",
      value: String(lowStockCount),
      delta: lowStockCount > 0 ? "⚠️" : "—",
      deltaColor: lowStockCount > 0 ? "text-warning" as const : "text-text-muted" as const,
      sparklineData: SPARKLINE_LOW,
    },
    {
      label: lang === "th" ? "มูลค่ารวม" : "Total Revenue",
      value: `฿${formatThaiBaht(totalRevenue)}`,
      delta: "↑ 12%",
      deltaColor: "text-accent" as const,
      sparklineData: SPARKLINE_REVENUE,
    },
    {
      label: lang === "th" ? "สินค้าหมด" : "Out of Stock",
      value: String(outOfStockCount),
      delta: outOfStockCount > 0 ? "⚠️" : "—",
      deltaColor: outOfStockCount > 0 ? "text-danger" as const : "text-text-muted" as const,
      sparklineData: SPARKLINE_STOCK,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 md:space-y-7">
        <div className="h-28 w-full rounded-2xl bg-bg-surface/60 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="surface-card p-5">
              <div className="h-3 w-20 rounded bg-bg-surface/80 animate-pulse" />
              <div className="mt-3 h-8 w-28 rounded bg-bg-surface/80 animate-pulse" />
              <div className="mt-3 h-10 w-full rounded bg-bg-surface/60 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-48 w-full rounded-2xl bg-bg-surface/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-7">
      {/* Page header */}
      <SectionHeader
        title={t("sellerProducts_title")}
        subtitle={
          lang === "th"
            ? `ร้าน ${seller?.shopName ?? ""} · ${totalProducts} รายการ`
            : `${seller?.shopName ?? ""} · ${totalProducts} listings`
        }
        cta={{
          label: t("sellerProducts_add"),
          onClick: () => setShowAddModal(true),
          disabled: seller?.verificationStatus !== "verified",
        }}
      />

      {/* Verification pending banner */}
      {seller?.verificationStatus === "new" && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 px-5 py-4">
          <svg className="mt-0.5 shrink-0" width="20" height="20" fill="none" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="9" stroke="#F59E0B" strokeWidth="1.5" />
            <path d="M10 6v5M10 13.5h.01" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div>
            <p className="font-semibold text-warning">
              {lang === "th"
                ? "ร้านค้าของคุณกำลังรอการตรวจสอบ"
                : "Your store is pending review"}
            </p>
            <p className="mt-1 text-sm text-text-subtle">
              {lang === "th"
                ? "ทีมงานกำลังตรวจสอบร้านค้าของคุณ คุณจะสามารถเพิ่มสินค้าได้หลังผ่านการอนุมัติ"
                : "Our team is reviewing your store. You'll be able to list products once approved."}
            </p>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-2 border-b border-border-subtle pb-3">
        {CATEGORIES.map((cat) => {
          const count = getCategoryCount(cat);
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-brand-primary text-white"
                  : "bg-bg-surface text-text-subtle hover:bg-bg-surface/80"
              }`}
            >
              {cat}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-white/20" : "bg-border-subtle"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-5 py-3">
          <span className="text-sm font-semibold text-brand-primary">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkActivate}
              className="rounded-lg bg-brand-primary px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Activate
            </button>
            <button
              onClick={handleBulkDeactivate}
              className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-1.5 text-xs font-semibold text-text-main hover:bg-bg-surface/80"
            >
              Deactivate
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-text-muted hover:text-text-main"
          >
            Clear
          </button>
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="surface-card glass-panel space-y-3 p-12 text-center">
          <svg width="48" height="48" fill="none" viewBox="0 0 48 48" className="text-text-muted mx-auto">
            <rect x="8" y="14" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
            <path d="M16 22h16M16 28h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h2 className="type-h2 text-text-main">{t("sellerProducts_empty")}</h2>
          <p className="type-body text-text-subtle">{t("sellerProducts_emptyDesc")}</p>
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted">
                  <th className="px-5 py-3 font-semibold">
                    <input
                      type="checkbox"
                      checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-border-subtle bg-bg-surface text-brand-primary focus:ring-brand-primary"
                    />
                  </th>
                  <th className="px-5 py-3 font-semibold">{t("common_products")}</th>
                  <th className="px-5 py-3 font-semibold">{t("common_category")}</th>
                  <th className="px-5 py-3 font-semibold">Listing</th>
                  <th className="px-5 py-3 font-semibold">{lang === "th" ? "สต็อก" : "Stock"}</th>
                  <th className="px-5 py-3 font-semibold">{t("seller_sold")}</th>
                  <th className="px-5 py-3 font-semibold">{lang === "th" ? "ยอดขาย" : "Gross Sales"}</th>
                  <th className="px-5 py-3 font-semibold">{lang === "th" ? "จัดการ" : "Manage"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  const canDelete = product.id.startsWith("prd_");
                  const isEditingPrice = editingCell?.id === product.id && editingCell.field === "price";
                  const isEditingStock = editingCell?.id === product.id && editingCell.field === "stock";

                  return (
                    <tr key={product.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-surface/40 transition-colors">
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="h-4 w-4 rounded border-border-subtle bg-bg-surface text-brand-primary focus:ring-brand-primary"
                        />
                      </td>
                      <td className="max-w-[300px] truncate px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-bg-surface">
                            <Image src={product.image} alt={product.title} fill className="object-cover" sizes="40px" />
                          </div>
                          <div>
                            <p className="truncate font-semibold text-text-main">{product.title}</p>
                            {isEditingPrice ? (
                              <input
                                autoFocus
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleEditSave}
                                onKeyDown={handleEditKeyDown}
                                className="w-24 rounded border border-brand-primary bg-bg-surface px-2 py-1 text-xs text-text-main focus:outline-none"
                                min="1"
                              />
                            ) : (
                              <button
                                onClick={() => handleEditStart(product.id, "price", product.price)}
                                className="text-xs text-text-muted hover:text-brand-primary"
                              >
                                ฿{formatThaiBaht(product.price)}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-text-subtle">{product.category}</td>
                      <td className="px-5 py-4 text-text-subtle">{product.listingStatus || "active"}</td>
                      <td className="px-5 py-4">
                        {isEditingStock ? (
                          <input
                            autoFocus
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleEditSave}
                            onKeyDown={handleEditKeyDown}
                            className="w-20 rounded border border-brand-primary bg-bg-surface px-2 py-1 text-sm text-text-main focus:outline-none"
                            min="0"
                          />
                        ) : (
                          <button
                            onClick={() => handleEditStart(product.id, "stock", product.stock)}
                            className="hover:opacity-80"
                          >
                            <Badge label={stockStatus.label} tone={stockStatus.tone} />
                          </button>
                        )}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => {
              const prevPage = Math.max(1, currentPage - 1);
              setLoading(true);
              fetchProducts(prevPage, activeCategory);
            }}
            disabled={currentPage <= 1}
            className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-2 text-sm font-semibold text-text-main hover:bg-bg-surface/80 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
          >
            {lang === "th" ? "ก่อนหน้า" : "Previous"}
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => {
                setLoading(true);
                fetchProducts(page, activeCategory);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                page === currentPage
                  ? "bg-brand-primary text-white"
                  : "border border-border-subtle bg-bg-surface text-text-subtle hover:bg-bg-surface/80"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => {
              const nextPage = Math.min(totalPages, currentPage + 1);
              setLoading(true);
              fetchProducts(nextPage, activeCategory);
            }}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-2 text-sm font-semibold text-text-main hover:bg-bg-surface/80 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
          >
            {lang === "th" ? "ถัดไป" : "Next"}
          </button>
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
  const { t, lang } = useLanguage();
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
            <label className="text-sm font-semibold text-text-subtle">{lang === "th" ? "ชื่อสินค้า" : "Product Title"}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">{lang === "th" ? "ราคา (฿)" : "Price (฿)"}</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="1"
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">{lang === "th" ? "ราคาเดิม (฿)" : "Original Price (฿)"}</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                required
                min="1"
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-subtle">{t("common_category")}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
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
                className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
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
              className="w-full rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex gap-3 pt-2">
            <CTAButton type="button" variant="secondary" onClick={onClose} fullWidth>
              {t("common_back")}
            </CTAButton>
            <CTAButton type="submit" fullWidth disabled={submitting}>
              {submitting ? (lang === "th" ? "กำลังบันทึก..." : "Saving...") : t("sellerProducts_add")}
            </CTAButton>
          </div>
        </form>
      </div>
    </div>
  );
}
