import Badge from "./Badge";

type Seller = {
  id: string;
  name: string;
  price: number;
  rating: number;
  salesCount: number;
  deliverySpeed: string;
  isOfficial?: boolean;
};

type SellerCardProps = {
  seller: Seller;
  isSelected: boolean;
  isBest?: boolean;
  onSelect: (seller: Seller) => void;
};

export default function SellerCard({ seller, isSelected, isBest, onSelect }: SellerCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(seller)}
      className={`w-full rounded-2xl p-4 text-left transition-all ${
        isSelected
          ? "accent-ring bg-bg-surface"
          : "bg-bg-surface shadow-[0_10px_22px_rgba(5,10,24,0.1)] hover:bg-bg-surface-hover"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-text-main">{seller.name}</p>
            {seller.isOfficial ? <Badge label="Official" tone="success" /> : null}
            {isBest ? <Badge label="ดีที่สุด" tone="promo" /> : null}
          </div>
          <p className="text-xs text-text-muted">
            ⭐ {seller.rating} • ขายแล้ว {seller.salesCount.toLocaleString()} • {seller.deliverySpeed}
          </p>
        </div>
        <p className="text-lg font-black text-text-main">฿{seller.price.toLocaleString()}</p>
      </div>
    </button>
  );
}
