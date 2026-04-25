import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./context/LanguageContext";
import { Providers } from "./components/Providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-noto-sans-thai",
});

export const metadata: Metadata = {
  title: "Keyzaa - เติมเกม & ซื้อ Gift Card ราคาถูก จัดส่งทันที",
  description:
    "ดิจิทัลมาร์เก็ตเพลสชั้นนำของไทย พร้อมโปรโมชั่นดีลเด็ดและบริการตลอด 24 ชั่วโมง",
};

const schemaData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://keyzaa.com/#organization",
      name: "KeyZaa",
      url: "https://keyzaa.com",
      description: "Thai digital marketplace for top-up, gift cards, subscriptions, and instant digital delivery.",
      logo: "https://keyzaa.com/icon.png",
    },
    {
      "@type": "WebSite",
      "@id": "https://keyzaa.com/#website",
      url: "https://keyzaa.com",
      name: "KeyZaa - เติมเกม & ซื้อ Gift Card",
      description: "ดิจิทัลมาร์เก็ตเพลสชั้นนำของไทย พร้อมโปรโมชั่นดีลเด็ดและบริการตลอด 24 ชั่วโมง",
      publisher: { "@id": "https://keyzaa.com/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://keyzaa.com/products?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebPage",
      "@id": "https://keyzaa.com/#webpage",
      url: "https://keyzaa.com",
      name: "KeyZaa - เติมเกม & ซื้อ Gift Card ราคาถูก จัดส่งทันที",
      description: "ดิจิทัลมาร์เก็ตเพลสชั้นนำของไทย พร้อมโปรโมชั่นดีลเด็ดและบริการตลอด 24 ชั่วโมง",
      isPartOf: { "@id": "https://keyzaa.com/#website" },
      about: { "@id": "https://keyzaa.com/#organization" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${inter.variable} ${notoSansThai.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-bg-subtle">
        <LanguageProvider>
          <Providers>{children}</Providers>
        </LanguageProvider>
      </body>
    </html>
  );
}
