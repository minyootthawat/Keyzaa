"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  sellerId: string;
  sellerName: string;
  platform?: string;
}

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
        id: "p1",
        title: "เติม ROV 1000 เพชร",
        price: 950,
        image: "/products/rov.png",
        quantity: 1,
        sellerId: "sel_1",
        sellerName: "Keyzaa Official",
        platform: "Mobile",
      },
      {
        id: "p3",
        title: "Steam Wallet ฿200",
        price: 180,
        image: "/products/steam.png",
        quantity: 1,
        sellerId: "sel_3",
        sellerName: "BestDeal Digital",
        platform: "PC",
      },
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
      const existing = prev.find((i) => i.id === newItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === newItem.id ? { ...i, quantity: i.quantity + newItem.quantity } : i
        );
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
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
