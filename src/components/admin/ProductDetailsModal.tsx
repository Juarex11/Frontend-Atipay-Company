import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import type { Product } from "@/pages/admin/StoreManagement";
import { AtipayCoin } from "@/components/ui/AtipayCoin";

interface ProductDetailsModalProps {
  readonly product: Product | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onEdit?: (product: Product) => void;
}

export function ProductDetailsModal({
  product,
  isOpen,
  onClose,
  onEdit
}: ProductDetailsModalProps) {
  if (!product) return null;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
    if (onEdit) onEdit(product);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Product Image */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8 flex items-center justify-center max-h-[50vh] md:max-h-none">
            <div className="relative w-full h-full flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-w-full max-h-[40vh] md:max-h-[60vh] w-auto h-auto object-contain"
                  style={{ aspectRatio: '1/1' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                          <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2 sm:mb-3">
                            <svg xmlns="https://www.w3.org/2000/svg" class="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span class="text-sm sm:text-base font-medium">Imagen no disponible</span>
                          <span class="text-xs opacity-75 mt-1">ID: ${product.id}</span>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 sm:p-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center mb-3">
                    <svg xmlns="https://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm sm:text-base font-medium">Sin imagen</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 overflow-y-auto flex-1">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge 
                        variant={product.status === 'active' ? 'default' : 'secondary'} 
                        className={`text-xs ${product.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} transition-colors duration-200`}
                      >
                        {product.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors duration-200"
                      >
                        {product.type === 'course' ? '🎓 Curso' : '🛍️ Producto'}
                      </Badge>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{product.name}</h2>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <div className="flex items-center gap-1 text-lg sm:text-2xl font-bold text-primary">
                      <AtipayCoin size="sm" className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{product.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm sm:text-base text-gray-600">
                  {product.description || 'No hay descripción disponible para este producto.'}
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 group">
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg hover:bg-gray-100 transition-colors duration-200 border border-gray-100 hover:border-gray-200">
                    <div className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Disponibilidad</div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-sm sm:text-base font-medium">
                        {product.stock > 0 ? `En stock (${product.stock} ${product.unit_type || 'unidad(es)'})` : 'Agotado'}
                      </span>
                    </div>
                  </div>
                </div>

                {(product.created_at || product.updated_at) && (
                  <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-100 hover:border-gray-200 transition-colors duration-200">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2 sm:mb-3">Información adicional</h4>
                    <dl className="space-y-2 text-xs sm:text-sm text-gray-600">
                      {product.created_at && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <dt className="font-medium">Creado:</dt>
                          <dd className="text-right">
                            {new Date(product.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </dd>
                        </div>
                      )}
                      {product.updated_at && product.updated_at !== product.created_at && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <dt className="font-medium">Actualizado:</dt>
                          <dd className="text-right">
                            {new Date(product.updated_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto text-green-700 border-green-300 hover:bg-green-50 hover:text-green-800 hover:border-green-400 transition-colors duration-200"
                >
                  Cerrar
                </Button>
                {onEdit && (
                  <Button
  onClick={handleEdit}
  className="w-full sm:w-auto gap-2 bg-blue-500 hover:bg-blue-700 text-white hover:shadow-md transition-all duration-200"
>
  <Edit className="h-4 w-4" />
  Editar producto
</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
