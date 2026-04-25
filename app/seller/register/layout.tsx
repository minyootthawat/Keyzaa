import BottomNav from "@/app/components/BottomNav";
import FloatingChat from "@/app/components/FloatingChat";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="section-container flex-1 flex flex-col pb-20 sm:pb-0">{children}</main>
      <FloatingChat />
      <BottomNav />
    </>
  );
}
