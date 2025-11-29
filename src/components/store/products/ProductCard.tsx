import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AtipayCoin } from "@/components/ui/AtipayCoin";
import type { Product } from "../types/store.types";
import { cn, formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  readonly product: Product;
  readonly onAddToCart: (product: Product) => void;
  readonly onViewDetails: (product: Product) => void;
}

export function ProductCard({
  product,
  onAddToCart,
  onViewDetails,
}: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      setIsAdding(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      onAddToCart(product);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails(product);
  };

  const formattedPrice = formatCurrency(product.price);
  const originalPrice = product.discount > 0
    ? formatCurrency(product.price / (1 - product.discount / 100))
    : null;

  return (
    <Card
      className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group cursor-pointer border-gray-100"
      onClick={handleViewDetails}
    >
      {/* Product Image with Hover Effect */}
      <div className="relative w-full pt-[100%] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-3 group-hover:p-1.5 transition-all duration-300">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-contain transition-all duration-500 group-hover:scale-110"
              style={{ aspectRatio: '1/1' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'w-full h-full flex items-center justify-center bg-gray-100';
                  fallback.innerHTML = `
                    <div class="text-center p-2 sm:p-3">
                      <div class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 sm:h-6 sm:w-6 text-gray-400">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                          <circle cx="9" cy="9" r="2"></circle>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                        </svg>
                      </div>
                      <p class="text-xs text-gray-500">Sin imagen</p>
                    </div>
                  `;
                  parent.appendChild(fallback);
                }
              }}
            />
            {!product.inStock && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-red-600 text-white text-xs font-medium px-2 py-1 rounded">
                  Agotado
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1.5">
          {product.discount > 0 && (
            <Badge className="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 text-xs font-medium shadow-sm">
              {product.discount}% OFF
            </Badge>
          )}
          {product.featured && (
            <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 shadow-sm">
              Destacado
            </Badge>
          )}
          {product.type === 'course' && (
            <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 shadow-sm">
              Curso
            </Badge>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="px-3 pt-2 pb-1 sm:px-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight min-h-[2.25rem] group-hover:text-green-700 transition-colors">
          {product.name}
        </h3>
        {product.type === 'course' && (
          <div className="flex items-center text-[11px] text-gray-500 mt-0.5">
            <Clock className="h-3 w-3 mr-1 text-gray-400" />
            <span>8 semanas • Incluye certificado</span>
          </div>
        )}
      </div>

      <div className="px-3 pb-2 pt-0">
        {/* Price */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <AtipayCoin size="xs" className="w-3.5 h-3.5 text-green-600" />
            <span className="text-base font-bold text-gray-900">{formattedPrice}</span>
            {originalPrice && (
              <span className="text-[11px] text-gray-500 line-through">{originalPrice}</span>
            )}
          </div>
          
          {product.inStock ? (
            <div className="flex items-center mt-0.5 text-[11px] text-green-600">
              <Check className="h-3 w-3 mr-0.5" />
              <span>En stock</span>
            </div>
          ) : (
            <div className="text-[11px] text-gray-500 mt-0.5">
              Próximamente
            </div>
          )}
        </div>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="mt-1 flex items-center">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'h-3 w-3',
                    star <= Math.round(product.rating) 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-gray-200 fill-gray-200',
                    'transition-colors'
                  )}
                />
              ))}
            </div>
            <span className="text-[11px] text-gray-500 ml-1">
              ({product.reviews} {product.reviews === 1 ? 'reseña' : 'reseñas'})
            </span>
          </div>
        )}

      </div>

      {/* Action Buttons */}
      <div className="px-3 pb-2 pt-0">
        <Button
          size="sm"
          className={cn(
            "w-full h-8 text-xs font-medium transition-all duration-200 relative overflow-hidden group",
            product.inStock
              ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-sm"
              : "bg-gray-100 text-gray-500 cursor-not-allowed"
          )}
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart(e);
          }}
          disabled={!product.inStock || isAdding}
        >
          {isAdding ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Agregando...</span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              <span>{product.inStock ? 'Agregar al carrito' : 'No disponible'}</span>
            </>
          )}
          <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-20 transition-opacity"></span>
        </Button>
      </div>
    </Card>
  );
}
