"use client";

import AdminRouteGuard from "@/app/components/AdminRouteGuard";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { formatThaiBaht } from "@/app/lib/marketplace";

interface Product {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  stockQuantity: number;
  createdAt: string;
  seller: {
    id: string;
    storeName: string;
  };
}

interface ProductsResponse {
  products: Array<{
    id: string;
    name: string;
    price: number;
    stock?: number;
    stockQuantity?: number;
    status?: string;
    isActive?: boolean;
    createdAt: string;
    seller?: {
      id: string;
      storeName: string;
    };
  }>;
  total: number;
  page: number;
  limit: number;
}

const ITEMS_PER_PAGE = 20;

type FilterTab = "all" | "active" | "inactive";

function normalizeProduct(row: ProductsResponse["products"][number], current?: Product): Product {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    isActive: row.isActive ?? row.status === "active",
    stockQuantity: row.stockQuantity ?? row.stock ?? current?.stockQuantity ?? 0,
    createdAt: row.createdAt,
    seller: row.seller ?? current?.seller ?? { id: "", storeName: "" },
  };
}

export default function AdminProductsPage() {
  const { lang } = useLanguage();
  const { adminPermissions, adminRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Edit modal state
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirmation state
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [orderCountWarning, setOrderCountWarning] = useState<number | null>(null);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const canWrite = adminPermissions.includes("admin:products:write");
  const isSuperAdmin = adminRole === "super_admin";

  const fetchProducts = useCallback(
    (pageNum: number, filterVal: FilterTab, searchVal: string) => {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(ITEMS_PER_PAGE),
      });
      if (filterVal !== "all") {
        params.set("status", filterVal);
      }
      if (searchVal.trim()) {
        params.set("search", searchVal.trim());
      }

      fetch(`/api/backoffice/products?${params}`)
        .then(async (res) => {
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data: ProductsResponse) => {
          setProducts(data.products.map((product) => normalizeProduct(product)));
          setTotal(data.total);
          setError(null);
        })
        .catch((err) => {
          setError(err.message || (lang === "th" ? "โหลดข้อมูลไม่สำเร็จ" : "Failed to load products."));
        })
        .finally(() => setLoading(false));
    },
    [lang]
  );

  useEffect(() => {
    fetchProducts(page, filter, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  // Search on Enter or after 400ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
        setPage(1);
        fetchProducts(1, filter, searchInput);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search, filter, fetchProducts]);

  const handleToggleActive = async (product: Product) => {
    setActionLoading(product.id);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/backoffice/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !product.isActive }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const { product: updated } = await res.json();
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? normalizeProduct(updated, p) : p))
      );
      setActionSuccess(
        updated.isActive
          ? lang === "th"
            ? `เปิดใช้งานสินค้า "${updated.name}" แล้ว`
            : `Activated "${updated.name}"`
          : lang === "th"
          ? `ปิดใช้งานสินค้า "${updated.name}" แล้ว`
          : `Deactivated "${updated.name}"`
      );
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : (lang === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
    } finally {
      setActionLoading(null);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const toggleAllProductSelection = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    }
  };

  const handleBulkActivate = async () => {
    if (selectedProducts.size === 0) return;
    setBulkLoading(true);
    setActionSuccess(null);
    try {
      await Promise.all(
        [...selectedProducts].map((id) =>
          fetch(`/api/backoffice/products/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: true }),
          })
        )
      );
      setProducts((prev) =>
        prev.map((p) => (selectedProducts.has(p.id) ? { ...p, isActive: true } : p))
      );
      setActionSuccess(
        lang === "th"
          ? `เปิดใช้งานสินค้า ${selectedProducts.size} รายการแล้ว`
          : `Activated ${selectedProducts.size} product(s)`
      );
      setSelectedProducts(new Set());
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : (lang === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedProducts.size === 0) return;
    setBulkLoading(true);
    setActionSuccess(null);
    try {
      await Promise.all(
        [...selectedProducts].map((id) =>
          fetch(`/api/backoffice/products/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: false }),
          })
        )
      );
      setProducts((prev) =>
        prev.map((p) => (selectedProducts.has(p.id) ? { ...p, isActive: false } : p))
      );
      setActionSuccess(
        lang === "th"
          ? `ปิดใช้งานสินค้า ${selectedProducts.size} รายการแล้ว`
          : `Deactivated ${selectedProducts.size} product(s)`
      );
      setSelectedProducts(new Set());
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : (lang === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
    } finally {
      setBulkLoading(false);
    }
  };

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setEditPrice(String(product.price));
    setEditStock(String(product.stockQuantity));
  };

  const closeEditModal = () => {
    setEditProduct(null);
    setEditPrice("");
    setEditStock("");
    setSavingEdit(false);
  };

  const handleSaveEdit = async () => {
    if (!editProduct) return;

    const price = parseFloat(editPrice);
    const stockQuantity = parseInt(editStock, 10);

    if (isNaN(price) || price < 0) {
      setActionError(lang === "th" ? "ราคาไม่ถูกต้อง" : "Invalid price");
      return;
    }
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      setActionError(lang === "th" ? "จำนวนสต็อกไม่ถูกต้อง" : "Invalid stock quantity");
      return;
    }

    setSavingEdit(true);

    try {
      const res = await fetch(`/api/backoffice/products/${editProduct.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ price, stockQuantity }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const { product: updated } = await res.json();
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? normalizeProduct(updated, p) : p))
      );
      setActionSuccess(
        lang === "th"
          ? `อัปเดตสินค้า "${updated.name}" แล้ว`
          : `Updated "${updated.name}"`
      );
      setTimeout(() => setActionSuccess(null), 5000);
      closeEditModal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : (lang === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
    } finally {
      setSavingEdit(false);
    }
  };

  const openDeleteConfirm = async (product: Product) => {
    setDeleteProduct(product);
    setOrderCountWarning(null);
    setDeleteLoading(false);
  };

  const closeDeleteConfirm = () => {
    setDeleteProduct(null);
    setOrderCountWarning(null);
    setDeleteLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;

    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/backoffice/products/${deleteProduct.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setOrderCountWarning(body.orderCount ?? null);
          setDeleteLoading(false);
          return;
        }
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
      setActionSuccess(
        lang === "th"
          ? `ลบสินค้า "${deleteProduct.name}" แล้ว`
          : `Deleted "${deleteProduct.name}"`
      );
      setTimeout(() => setActionSuccess(null), 5000);
      closeDeleteConfirm();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : (lang === "th" ? "เกิดข้อผิดพลาด" : "An error occurred"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const activeCount = products.filter((p) => p.isActive).length;
  const inactiveCount = products.filter((p) => !p.isActive).length;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AdminRouteGuard requiredPermission="admin:products:read">
      <div className="space-y-6 md:space-y-7">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="type-h1">
            {lang === "th" ? "จัดการสินค้า" : "Manage products"}
          </h1>
          <p className="type-body max-w-[66ch] text-text-subtle">
            {lang === "th"
              ? "ดูและจัดการสินค้าทั้งหมดในระบบ รวมถึงเปิด/ปิดใช้งาน แก้ไขราคาและสต็อก"
              : "View and manage all products in the system, including toggle active/inactive, edit price and stock."}
          </p>
        </div>

        {/* Success toast */}
        {actionSuccess && (
          <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success font-medium">
            ✓ {actionSuccess}
          </div>
        )}

        {/* Error toast */}
        {actionError && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger font-medium">
            {actionError}
          </div>
        )}

        {/* Bulk action toolbar */}
        {canWrite && selectedProducts.size > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-4 py-3">
            <span className="text-sm font-medium text-brand-primary">
              {selectedProducts.size} {lang === "th" ? "รายการเลือกแล้ว" : "selected"}
            </span>
            <button
              onClick={handleBulkActivate}
              disabled={bulkLoading}
              className="rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white hover:opacity-85 disabled:opacity-50"
            >
              {bulkLoading ? "..." : (lang === "th" ? "เปิดใช้งานที่เลือก" : "Activate selected")}
            </button>
            <button
              onClick={handleBulkDeactivate}
              disabled={bulkLoading}
              className="rounded-lg bg-error px-3 py-1.5 text-xs font-semibold text-white hover:opacity-85 disabled:opacity-50"
            >
              {bulkLoading ? "..." : (lang === "th" ? "ปิดใช้งานที่เลือก" : "Deactivate selected")}
            </button>
            <button
              onClick={() => setSelectedProducts(new Set())}
              className="ml-auto text-xs text-text-muted hover:text-text-main"
            >
              {lang === "th" ? "ยกเลิก" : "Clear"}
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex flex-wrap items-center gap-3">
          {(
            [
              { key: "all" as FilterTab, label: lang === "th" ? "ทั้งหมด" : "All", count: total },
              { key: "active" as FilterTab, label: lang === "th" ? "เปิดใช้งาน" : "Active", count: activeCount },
              { key: "inactive" as FilterTab, label: lang === "th" ? "ปิดใช้งาน" : "Inactive", count: inactiveCount },
            ]
          ).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => {
                setFilter(key);
                setPage(1);
                fetchProducts(1, key, search);
              }}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                filter === key
                  ? "bg-brand-primary/20 text-brand-primary"
                  : "bg-bg-surface text-text-subtle hover:bg-bg-surface/80"
              }`}
            >
              {label}
              {count > 0 && (
                <span className="ml-1.5 text-xs opacity-70">({count})</span>
              )}
            </button>
          ))}

          {/* Search */}
          <div className="ml-auto">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(searchInput);
                  setPage(1);
                  fetchProducts(1, filter, searchInput);
                }
              }}
              placeholder={lang === "th" ? "ค้นหาชื่อสินค้า..." : "Search product name..."}
              className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-2 pr-10 text-sm text-text-main placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 w-full rounded-xl bg-bg-surface/60 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="surface-card flex min-h-[200px] items-center justify-center p-6 text-center">
            <p className="text-error type-body">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="surface-card flex min-h-[200px] flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-3xl">📦</p>
            <p className="text-text-muted type-body">
              {search
                ? lang === "th"
                  ? `ไม่พบสินค้าที่ค้นหา "${search}"`
                  : `No products found for "${search}"`
                : filter === "active"
                ? lang === "th"
                  ? "ไม่มีสินค้าที่เปิดใช้งาน"
                  : "No active products"
                : filter === "inactive"
                ? lang === "th"
                  ? "ไม่มีสินค้าที่ปิดใช้งาน"
                  : "No inactive products"
                : lang === "th"
                ? "ยังไม่มีสินค้า"
                : "No products found"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-border-subtle">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-surface/70">
                    {canWrite && (
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={products.length > 0 && selectedProducts.size === products.length}
                          onChange={toggleAllProductSelection}
                          className="h-4 w-4 rounded border-border-subtle bg-bg-base accent-brand-primary"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">
                      {lang === "th" ? "ชื่อสินค้า" : "Product Name"}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">
                      {lang === "th" ? "ร้านค้า" : "Seller"}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-text-muted">
                      {lang === "th" ? "ราคา" : "Price"}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-text-muted">
                      {lang === "th" ? "สต็อก" : "Stock"}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-text-muted">
                      {lang === "th" ? "สถานะ" : "Status"}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-text-muted">
                      {lang === "th" ? "สร้างเมื่อ" : "Created"}
                    </th>
                    {canWrite && (
                      <th className="px-4 py-3 text-right font-semibold text-text-muted">
                        {lang === "th" ? "การกระทำ" : "Actions"}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="bg-bg-base hover:bg-bg-surface/50 transition-colors"
                    >
                      {canWrite && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="h-4 w-4 rounded border-border-subtle bg-bg-base accent-brand-primary"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 text-text-muted font-mono text-xs">
                        {product.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 font-semibold text-text-main">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-text-subtle">
                        {product.seller.storeName || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-text-main">
                        ฿{formatThaiBaht(product.price)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-medium ${
                            product.stockQuantity === 0
                              ? "text-error"
                              : product.stockQuantity < 5
                              ? "text-warning"
                              : "text-text-main"
                          }`}
                        >
                          {product.stockQuantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {product.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                            {lang === "th" ? "✓ เปิด" : "✓ Active"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-error/15 px-2.5 py-1 text-xs font-semibold text-error">
                            {lang === "th" ? "✕ ปิด" : "✕ Inactive"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {formatDate(product.createdAt)}
                      </td>
                      {canWrite && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {/* Toggle active/inactive */}
                            <button
                              onClick={() => handleToggleActive(product)}
                              disabled={actionLoading === product.id}
                              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 ${
                                product.isActive
                                  ? "border border-error/40 bg-error/10 text-error"
                                  : "border border-success/40 bg-success/10 text-success"
                              }`}
                            >
                              {actionLoading === product.id
                                ? "..."
                                : product.isActive
                                ? lang === "th"
                                  ? "ปิด"
                                  : "Deactivate"
                                : lang === "th"
                                ? "เปิด"
                                : "Activate"}
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => openEditModal(product)}
                              className="shrink-0 rounded-xl border border-brand-primary/40 bg-brand-primary/10 px-3 py-1.5 text-xs font-semibold text-brand-primary transition-opacity hover:opacity-80"
                            >
                              {lang === "th" ? "แก้ไข" : "Edit"}
                            </button>

                            {/* Delete — super_admin only */}
                            {isSuperAdmin && (
                              <button
                                onClick={() => openDeleteConfirm(product)}
                                className="shrink-0 rounded-xl border border-error/40 bg-error/10 px-3 py-1.5 text-xs font-semibold text-error transition-opacity hover:opacity-80"
                              >
                                {lang === "th" ? "ลบ" : "Delete"}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-muted">
                  {lang === "th"
                    ? `แสดง ${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, total)} จาก ${total} รายการ`
                    : `Showing ${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, total)} of ${total}`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-xl border border-border-subtle bg-bg-surface px-3 py-1.5 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main disabled:opacity-40"
                  >
                    ←
                  </button>
                  <span className="flex items-center rounded-xl border border-border-subtle bg-bg-surface px-3 py-1.5 text-sm font-semibold text-text-main">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-xl border border-border-subtle bg-bg-surface px-3 py-1.5 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-bg-surface p-6 shadow-2xl">
            <h2 className="type-h3 mb-4">
              {lang === "th" ? "แก้ไขสินค้า" : "Edit product"}
            </h2>
            <p className="mb-4 font-semibold text-text-main">{editProduct.name}</p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-text-subtle">
                  {lang === "th" ? "ราคา (฿)" : "Price (฿)"}
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full rounded-xl border border-border-subtle bg-bg-base px-4 py-2.5 text-text-main focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-text-subtle">
                  {lang === "th" ? "สต็อก" : "Stock"}
                </label>
                <input
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  min="0"
                  className="w-full rounded-xl border border-border-subtle bg-bg-base px-4 py-2.5 text-text-main focus:border-brand-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="rounded-xl border border-border-subtle bg-bg-base px-4 py-2 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main"
              >
                {lang === "th" ? "ยกเลิก" : "Cancel"}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {savingEdit ? "..." : lang === "th" ? "บันทึก" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-error/30 bg-bg-surface p-6 shadow-2xl">
            <h2 className="type-h3 mb-2 text-error">
              {lang === "th" ? "ยืนยันการลบสินค้า" : "Confirm delete product"}
            </h2>
            <p className="mb-1 text-text-subtle">
              {lang === "th" ? "คุณแน่ใจหรือไม่ว่าต้องการลบ" : "Are you sure you want to delete"}
            </p>
            <p className="mb-4 font-semibold text-text-main">&quot;{deleteProduct.name}&quot;?</p>

            {orderCountWarning !== null && (
              <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                ⚠️ {lang === "th"
                  ? `สินค้านี้มี ${orderCountWarning} ออเดอร์ที่เกี่ยวข้อง การลบอาจส่งผลกระทบ`
                  : `This product has ${orderCountWarning} related orders. Deleting it may have consequences.`}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteConfirm}
                className="rounded-xl border border-border-subtle bg-bg-base px-4 py-2 text-sm font-semibold text-text-subtle transition-colors hover:border-border-main hover:text-text-main"
              >
                {lang === "th" ? "ยกเลิก" : "Cancel"}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-xl bg-error px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {deleteLoading ? "..." : lang === "th" ? "ลบ" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminRouteGuard>
  );
}
