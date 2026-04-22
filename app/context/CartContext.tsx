"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { CartItem } from "@/app/types";

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const demoItems: CartItem[] = [
      {
        id: "p8",
        title: "ROV 500 Diamonds Top Up",
        titleTh: "เติม ROV 500 เพชร",
        titleEn: "ROV 500 Diamonds Top Up",
        price: 65,
        image: "/products/rov.png",
        quantity: 1,
        sellerId: "sel_1",
        sellerName: "Keyzaa Official",
        platform: "Mobile",
        regionCode: "TH",
        deliveryLabelTh: "รับผลลัพธ์ใน 1 นาที",
        deliveryLabelEn: "Delivered in 1 minute",
        activationMethodTh: "เติมผ่าน UID บนระบบอัตโนมัติ",
        activationMethodEn: "Automated top-up via UID"
      }
    ];

    if (typeof window === "undefined") return demoItems;

    const savedCart = localStorage.getItem("keyzaa_cart");
    if (!savedCart) return demoItems;

    try {
      return JSON.parse(savedCart) as CartItem[];
    } catch {
      return demoItems;
    }
  });

  useEffect(() => {
    localStorage.setItem("keyzaa_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === newItem.id);

      if (existing) {
        return prev.map((item) => (item.id === newItem.id ? { ...item, quantity: item.quantity + newItem.quantity } : item));
      }

      return [...prev, newItem];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
