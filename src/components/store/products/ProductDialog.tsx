import { useState, useEffect } from "react";
import { Heart, ShoppingCart, Clock, User, Info, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "../types/store.types";
import { productService } from "@/services/productService";

interface ProductDialogProps {
  readonly product: Product | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductDialog({
  product: initialProduct,
  open,
  onOpenChange,
  onAddToCart,
}: ProductDialogProps) {
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Load product details when dialog opens
  useEffect(() => {
    const loadProductDetails = async () => {
      if (open && initialProduct) {
        setIsLoading(true);
        try {
          const apiProduct = await productService.getProductById(initialProduct.id);

          // Mapear el producto de la API al tipo de producto del frontend
          const mappedProduct: Product = {
            ...initialProduct, // Mantener los datos iniciales
            // Actualizar con los datos detallados de la API
            name: apiProduct.name,
            description: apiProduct.description,
            price: apiProduct.price,
            pointsEarned: apiProduct.points_earned,
            category: apiProduct.type,
            stock: apiProduct.stock,
            unitType: apiProduct.unit_type,
            // Mantener los valores del producto inicial o usar valores por defecto
            inStock: initialProduct.inStock || apiProduct.stock > 0,
            isDigital: apiProduct.type === 'digital',
            imageUrl: initialProduct.imageUrl || apiProduct.image_url || '/placeholder-product.jpg',
            // Campos con valores por defecto si no están en la API
            rating: 0,
            reviews: 0,
            discount: 0,
            featured: false,
            // Tipo para el frontend (mapeamos 'service' a 'course')
            type: apiProduct.type === 'service' ? 'course' : 'product',
            // Campos específicos de cursos
            duration: initialProduct.duration || '',
            tutor: initialProduct.tutor || '',
            details: initialProduct.details || ''
          };

          setProduct(mappedProduct);
        } catch (error) {
          console.error('Error loading product details:', error);
          // Fallback to initial product data if there's an error
          setProduct(initialProduct);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (open) {
      loadProductDetails();
    } else {
      // Reset product when dialog closes
      setProduct(initialProduct);
    }
  }, [open, initialProduct]);

  if (!product) return null;

  // Price to display
  const price = product.price;
  // Verificar si es un servicio (que manejamos como curso en el frontend)
  const isCourse = (product as Product).type === 'course' || product.category === 'service';

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Cargando detalles del producto...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleAddToCart = () => {
    onAddToCart(product, 1); // Always add 1 item to cart
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] p-0 flex">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-0 w-full">
          {/* Image Section */}
          <div className="bg-gray-50 p-6 flex items-center justify-center overflow-y-auto">
            <div className="relative w-full max-h-[calc(90vh-3rem)] flex items-center justify-center">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'w-full h-full flex flex-col items-center justify-center p-6 text-center';
                    fallback.innerHTML = `
                      <div class="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                          <circle cx="9" cy="9" r="2"></circle>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                        </svg>
                      </div>
                      <h3 class="text-lg font-medium text-gray-900">Imagen no disponible</h3>
                      <p class="text-sm text-gray-500 mt-1">No se pudo cargar la imagen del producto</p>
                    `;
                    parent.appendChild(fallback);
                  }
                }}
              />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFavorite(!isFavorite);
                }}
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isFavorite
                  ? 'text-red-500 bg-white/90 hover:bg-white shadow-md'
                  : 'text-gray-500 bg-white/80 hover:bg-white hover:text-red-500'
                  }`}
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              >
                <Heart
                  className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`}
                  strokeWidth={isFavorite ? 0 : 1.5}
                />
              </button>

              {!product.inStock && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-1.5 rounded-full shadow-md">
                  <span className="text-sm font-medium text-red-600">Agotado</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Details Section */}
          <div className="p-8 overflow-y-auto">
            <DialogHeader className="text-left">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {isCourse && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Curso
                      </span>
                    )}
                    {product.discount > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {product.discount}% OFF
                      </span>
                    )}
                  </div>
                  <DialogTitle className="text-3xl font-bold text-gray-900">{product.name}</DialogTitle>
                </div>
              </div>
            </DialogHeader>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Price and Points */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-3xl font-bold text-gray-900">
                      <span className="flex items-center">
                        <span className="text-xl mr-1">S/</span>
                        {formatCurrency(price)}
                      </span>
                    </span>
                    {product.pointsEarned && product.pointsEarned > 0 && (
                      <div className="mt-2 flex items-center text-sm text-green-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-50 border border-green-100">
                          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Por esta compra ganas {product.pointsEarned} puntos.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  {product.inStock ? (
                    <span className="text-green-600 font-medium flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      En stock ({product.stock} disponibles)
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">Agotado</span>
                  )}
                </div>

                {/* Product Meta */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Tipo de producto</p>
                    <p className="font-medium capitalize">
                      {product.category === 'service' ? 'servicio' : product.category || 'producto'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Unidad de medida</p>
                    <p className="font-medium capitalize">{product.unitType || 'unidad'}</p>
                  </div>
                  {!isCourse && (
                    <div>
                      <p className="text-sm text-gray-500">Stock disponible</p>
                      <p className="font-medium">{product.stock || 0} unidades</p>
                    </div>
                  )}
                </div>

                {/* Course-specific fields */}
                {isCourse && (
                  <div className="space-y-3 pt-2 border-t">
                    <h4 className="font-medium flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Información del curso
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-4 h-4" /> Duración
                        </p>
                        <p className="font-medium">{product.duration || 'No especificada'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <User className="w-4 h-4" /> Instructor
                        </p>
                        <p className="font-medium">{product.tutor || 'No especificado'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-4 border-t">
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    size="lg"
                    className="flex-1 h-14 text-base font-medium bg-green-600 hover:bg-green-700"
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {isCourse ? 'Inscribirse ahora' : 'Agregar al carrito'}
                  </Button>

                  {!product.inStock && (
                    <div className="text-center py-2">
                      <p className="text-sm text-red-600">
                        Este producto no está disponible actualmente
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Déjanos tu correo para notificarte cuando esté disponible
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Description */}
              <div className="pt-6 border-t mt-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Descripción del producto</h3>
                <div className="prose max-w-none text-gray-700">
                  {product.description ? (
                    <div className="space-y-4">
                      {product.description.split('\n\n').map((paragraph, idx, arr) => {
                        const isLast = idx === arr.length - 1;
                        const key = `desc-${paragraph.substring(0, 20).replace(/\s+/g, '-')}-${isLast ? 'last' : idx}`;
                        return (
                          <p key={key} className="leading-relaxed">
                            {paragraph}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No hay descripción disponible para este producto.</p>
                  )}
                </div>

                {/* Additional Course Information */}
                {isCourse && product.details && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-3 text-gray-900">Lo que aprenderás</h4>
                    <ul className="space-y-3">
                      {product.details.split('\n').filter(Boolean).map((item, index, arr) => {
                        const key = `detail-${item.substring(0, 15).replace(/\s+/g, '-')}-${index}-of-${arr.length}`;
                        return (
                          <li key={key} className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Course-specific information */}
                {isCourse && (
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-gray-900">Detalles del curso</h4>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <Clock className="w-5 h-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">Duración</p>
                            <p className="text-gray-600">{product.duration || 'No especificada'}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <User className="w-5 h-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">Instructor</p>
                            <p className="text-gray-600">{product.tutor || 'No especificado'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">Beneficios</h5>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">Acceso de por vida</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">Certificado al finalizar</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">Soporte del instructor</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
