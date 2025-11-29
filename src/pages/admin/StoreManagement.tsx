import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Loader2, ShoppingCart } from 'lucide-react';
import { AtipayCoin } from '@/components/ui/AtipayCoin';
import { ProductForm } from '@/components/admin/ProductForm';
import { useToast } from '@/components/ui/use-toast';
import { ProductService } from '@/services/product.service';
import { Badge } from '@/components/ui/badge';
import { ProductDetailsModal } from '@/components/admin/ProductDetailsModal';
import { PurchaseRequestsTable } from '@/components/admin/PurchaseRequestsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface Product {
  id?: string | number;
  name: string;
  description: string;
  price: number;
  type: string;
  image?: string | File | null;
  imageUrl?: string;
  isActive?: boolean;
  stock: number;
  unit_type: string;
  points_earned: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  duration?: string;
  tutor?: string;
  image_url?: string;
}

export function StoreManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'purchases') {
      setActiveTab('purchases');
    } else {
      setActiveTab('products');
    }
  }, [searchParams]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay una sesión activa. Por favor inicia sesión.');
      }

      const data = await ProductService.getAllProducts();

      if (!Array.isArray(data)) {
        throw new Error('Formato de datos de productos inválido');
      }

      const formattedProducts = data.map((product: Product) => ({
        ...product,
        isActive: product.status === 'active',
        imageUrl: product.image_url,
        image: product.image_url
      }));

      setProducts(formattedProducts);

    } catch (error) {
      console.error('Error in fetchProducts:', error);

      let errorMessage = 'No se pudieron cargar los productos';

      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;

        if (error.message.includes('No hay una sesión activa')) {
          window.location.href = '/login';
          return;
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });

      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleProductCreated = useCallback(() => {
    fetchProducts();
    setIsFormOpen(false);
    setEditingProduct(null);
  }, [fetchProducts]);

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
  };

  const handleCancelDelete = () => {
    setProductToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete?.id) return;

    try {
      setIsDeleting(true);
      await ProductService.deleteProduct(productToDelete.id);

      setProducts(products.filter(p => p.id?.toString() !== productToDelete.id?.toString()));
      setProductToDelete(null);

      toast({
        title: '¡Eliminado!',
        description: 'El producto ha sido eliminado correctamente',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el producto. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div>Cargando productos...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tienda</h1>
        {activeTab === 'products' && (
          <Button onClick={() => {
            setEditingProduct(null);
            setIsFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Producto
          </Button>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          const newSearchParams = new URLSearchParams(searchParams);
          if (value === 'purchases') {
            newSearchParams.set('tab', 'purchases');
          } else {
            newSearchParams.delete('tab');
          }
          setSearchParams(newSearchParams);
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="purchases">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Solicitudes de Compra
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <div key={`product-${product.id}`} className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
                  <div className="relative flex-1 flex flex-col">
                    <button
                      className="w-full text-left focus:outline-none flex-1 flex flex-col"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {/* Badges */}
                      <div className="absolute top-2 left-2 right-2 z-10 flex flex-wrap gap-1">
                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="text-xs px-2 py-0.5 backdrop-blur-sm bg-white/80">
                          {product.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <Badge variant="outline" className="text-xs px-2 py-0.5 backdrop-blur-sm bg-white/80">
                          {product.type === 'course' ? '🎓 Curso' : '🛍️ Producto'}
                        </Badge>
                      </div>

                      {/* Product Image */}
                      <div className="relative w-full pt-[75%] bg-gradient-to-br from-gray-50 to-gray-100">
                        <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                              style={{ aspectRatio: '1/1' }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
                                      <span class="text-xs sm:text-sm">Imagen no disponible</span>
                                      <span class="text-[10px] sm:text-xs opacity-75 mt-1">ID: ${product.id}</span>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center mb-1 sm:mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <span className="text-xs sm:text-sm">Sin imagen</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-3 sm:p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                          {product.name}
                        </h3>
                        <p className="text-gray-500 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 min-h-[2.5rem]">
                          {product.description}
                        </p>
                        <div className="mt-auto pt-2 sm:pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <AtipayCoin size="xs" className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span className="text-sm sm:text-base font-bold text-primary">
                                {product.price.toFixed(2)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {product.points_earned} pts
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Stock and Actions */}
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="text-xs text-gray-500">
                            {product.stock > 0 ? `Disponible (${product.stock})` : 'Agotado'}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-gray-100 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProduct(product);
                            }}
                          >
                            <Edit className="h-4 w-4 text-gray-600" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 bg-red-50 hover:bg-red-300 text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(product);
                            }}
                            title="Eliminar producto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full h-40 flex items-center justify-center text-muted-foreground">
                No hay productos registrados
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="purchases" className="mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-6">Solicitudes de Compra con Atipay</h2>
            <PurchaseRequestsTable />
          </div>
        </TabsContent>
      </Tabs>

      <ProductForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onProductCreated={handleProductCreated}
        initialData={editingProduct ? {
          ...editingProduct,
          name: editingProduct.name || '',
          description: editingProduct.description || '',
          price: editingProduct.price || 0,
          type: editingProduct.type || 'product',
          status: editingProduct.status || 'active',
          stock: editingProduct.stock || 0,
          unit_type: editingProduct.unit_type || 'unit',
          points_earned: editingProduct.points_earned || 0,
          duration: editingProduct.duration || '',
          tutor: editingProduct.tutor || '',
          image: editingProduct.image || null,
          image_url: editingProduct.imageUrl || editingProduct.image_url || ''
        } : undefined}
      />

      <ProductDetailsModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && handleCancelDelete()}>
        <AlertDialogContent className="sm:max-w-[425px] bg-white">
          <AlertDialogHeader className="space-y-4">
            <AlertDialogTitle className="text-lg font-semibold text-gray-900">
              ¿Estás seguro de eliminar este producto?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Esta acción no se puede deshacer. El producto "{productToDelete?.name}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              className="mt-0 w-full sm:w-auto"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus-visible:ring-red-600 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar producto'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
