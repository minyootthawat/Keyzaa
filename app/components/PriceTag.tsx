type PriceTagProps = {
  price: number;
  originalPrice?: number;
  large?: boolean;
};

export default function PriceTag({ price, originalPrice, large = false }: PriceTagProps) {
  return (
    <div className="flex flex-col motion-fade-in">
      {originalPrice ? (
        <span className="type-num text-xs text-text-muted line-through">฿{originalPrice.toLocaleString()}</span>
      ) : null}
      <span className={`type-num ${large ? "text-4xl sm:text-5xl" : "text-2xl"} font-extrabold tracking-tight text-text-main`}>
        ฿{price.toLocaleString()}
      </span>
    </div>
  );
}
