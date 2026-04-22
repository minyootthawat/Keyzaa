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
  description: "ดิจิทัลมาร์เก็ตเพลสชั้นนำของไทย พร้อมโปรโมชั่นดีลเด็ดและบริการตลอด 24 ชั่วโมง",
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
      <body className="min-h-full flex flex-col font-sans bg-bg-subtle">
        <LanguageProvider>
          <Providers>
            {children}
          </Providers>
        </LanguageProvider>
      </body>
    </html>
  );
}
