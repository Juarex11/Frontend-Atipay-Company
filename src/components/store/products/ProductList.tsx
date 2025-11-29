import type { Product } from "../types/store.types";
import { ProductCard } from "./ProductCard";

interface ProductListProps {
  readonly products: ReadonlyArray<Product>;
  readonly onAddToCart: (product: Product) => void;
  readonly onViewDetails: (product: Product) => void;
  readonly emptyState?: React.ReactNode;
}

export function ProductList({
  products,
  onAddToCart,
  onViewDetails,
  emptyState,
}: ProductListProps) {
  if (products.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
      {products.map((product) => (
        <div key={product.id} className="h-full">
          <ProductCard
            product={product}
            onAddToCart={onAddToCart}
            onViewDetails={onViewDetails}
          />
        </div>
      ))}
    </div>
  );
}
