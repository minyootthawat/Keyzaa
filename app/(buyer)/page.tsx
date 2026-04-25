import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  metadataBase: new URL("https://keyzaa.com"),
  title: "เติมเกมออนไลน์ ราคาถูก | KeyZaa",
  description:
    "บริการเติมเกม ของขวัญดิจิทัล ส่งเร็ว ปลอดภัย ราคาคุ้มค่า รองรับ 24 ชม. เติมเกมมือถือ เติมเครดิตเกม ซื้อ Gift Card ถูกที่สุด",
  keywords: [
    "เติมเกม",
    "เติมเกมออนไลน์",
    "เติมเกมราคาถูก",
    "Gift Card",
    "Subscription",
    "AI Tools",
    "ซื้อขายสินค้าดิจิทัล",
    "Roblox",
    "Garena",
    "Steam Wallet",
  ],
  authors: [{ name: "KeyZaa" }],
  openGraph: {
    title: "เติมเกมออนไลน์ ราคาถูก | KeyZaa",
    description: "บริการเติมเกม ของขวัญดิจิทัล ส่งเร็ว ปลอดภัย ราคาคุ้มค่า",
    url: "https://keyzaa.com",
    siteName: "KeyZaa",
    locale: "th_TH",
    type: "website",
    images: [{ url: "/og-home.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "เติมเกมออนไลน์ ราคาถูก | KeyZaa",
    description: "บริการเติมเกม ของขวัญดิจิทัล ส่งเร็ว ปลอดภัย",
    images: ["/og-home.jpg"],
  },
  alternates: { canonical: "https://keyzaa.com" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "KeyZaa",
  url: "https://keyzaa.com",
  description: "บริการเติมเกม ของขวัญดิจิทัล ส่งเร็ว ปลอดภัย ราคาคุ้มค่า",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://keyzaa.com/products?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
