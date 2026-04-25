import StickyHeader from "@/app/components/StickyHeader";
import BottomNav from "@/app/components/BottomNav";
import FloatingChat from "@/app/components/FloatingChat";
import BuyerRouteGuard from "@/app/components/BuyerRouteGuard";

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <BuyerRouteGuard>
      <StickyHeader />
      <main className="flex-1 flex flex-col pb-20 pt-[116px] sm:pb-0 sm:pt-[76px]">{children}</main>
      <FloatingChat />
      <BottomNav />
    </BuyerRouteGuard>
  );
}
