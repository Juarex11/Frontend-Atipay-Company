import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Loader2, ShoppingCart, Package, GraduationCap } from 'lucide-react';
import { AtipayCoin } from '@/components/ui/AtipayCoin';
import { ProductForm } from '@/components/admin/ProductForm';
import { useToast } from '@/components/ui/use-toast';
import { ProductService, type Product } from '@/services/product.service';
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

      // --- CORRECCIÓN DEL ERROR DE TIPOS ---
      // Mapeamos los datos para asegurar que no haya nulls donde no debe haberlos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedProducts = data.map((product: any) => ({
        ...product,
        isActive: product.status === 'active',
        // Convertimos null a undefined para evitar el error de TypeScript
        imageUrl: product.image_url ?? undefined, 
        image: product.image_url ?? undefined,
        // Aseguramos valores por defecto
        price: Number(product.price) || 0,
        stock: Number(product.stock) || 0,
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
        description: 'No se pudo eliminar el producto.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-500 font-medium">Cargando catálogo...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Tienda</h1>
           <p className="text-gray-500 text-sm mt-1">Administra tus productos, cursos y solicitudes.</p>
        </div>
        
        {activeTab === 'products' && (
          <Button 
            onClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
            className="shadow-md hover:shadow-lg transition-all"
          >
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
        className="space-y-6"
      >
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="products" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Productos</TabsTrigger>
          <TabsTrigger value="purchases" className="px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Solicitudes de Compra
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <div 
                  key={`product-${product.id}`} 
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* --- Imagen del Producto --- */}
                  <div 
                    className="relative w-full pt-[70%] bg-gray-50 overflow-hidden cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {/* Badges Flotantes */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                      <Badge 
                        variant={product.status === 'active' ? 'default' : 'secondary'} 
                        className={`text-xs px-2.5 py-0.5 shadow-sm backdrop-blur-md bg-white/90 ${
                           product.status === 'active' ? 'text-green-700' : 'text-gray-500'
                        }`}
                      >
                        {product.status === 'active' ? '● Activo' : '○ Inactivo'}
                      </Badge>
                    </div>

                    <div className="absolute top-3 right-3 z-10">
                       <Badge 
                          variant="outline" 
                          className={`text-xs px-2.5 py-0.5 shadow-sm backdrop-blur-md bg-white/90 border-0 ${
                            product.type === 'course' ? 'text-violet-600' : 'text-blue-600'
                          }`}
                       >
                        {product.type === 'course' ? (
                          <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3"/> Curso</span>
                        ) : (
                          <span className="flex items-center gap-1"><Package className="w-3 h-3"/> Producto</span>
                        )}
                      </Badge>
                    </div>
                    
                    {/* Imagen */}
                    <div className="absolute inset-0 flex items-center justify-center p-6 transition-transform duration-500 group-hover:scale-105">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-contain drop-shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = `<div class="text-gray-300 flex flex-col items-center"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>`;
                          }}
                        />
                      ) : (
                        <div className="text-gray-300 flex flex-col items-center">
                          <Package className="w-10 h-10 opacity-50" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* --- Información --- */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                       <h3 
                         className="font-bold text-gray-900 text-lg leading-tight line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                         onClick={() => setSelectedProduct(product)}
                       >
                         {product.name}
                       </h3>
                    </div>
                    
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                      {product.description || 'Sin descripción disponible.'}
                    </p>

                    <div className="mt-auto space-y-4">
                      {/* Precio y Puntos */}
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <AtipayCoin className="w-5 h-5" />
                          <span className="text-lg font-bold text-gray-900">
                            {Number(product.price).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                          +{product.points_earned} pts
                        </div>
                      </div>

                      {/* Footer: Stock y Acciones */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs font-medium">
                           <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                           <span className={product.stock > 0 ? 'text-gray-600' : 'text-red-500'}>
                             {product.stock > 0 ? `${product.stock} Unid.` : 'Agotado'}
                           </span>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(product); }}
                            title="Eliminar"
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
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No hay productos aún</h3>
                <p className="text-gray-500 max-w-sm mt-1">Comienza agregando tu primer producto o curso para que aparezca en la tienda.</p>
                <Button 
                  onClick={() => setIsFormOpen(true)}
                  className="mt-4"
                  variant="outline"
                >
                  Crear Producto
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="purchases">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
               <h2 className="text-xl font-bold text-gray-900">Solicitudes de Compra</h2>
               <p className="text-sm text-gray-500">Gestiona las aprobaciones y rechazos de pedidos.</p>
            </div>
            <div className="p-6">
               <PurchaseRequestsTable />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* --- Modales --- */}
      <ProductForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onProductCreated={handleProductCreated}
        initialData={editingProduct ? {
          ...editingProduct,
          // Sanitización de datos para el formulario
          name: editingProduct.name || '',
          description: editingProduct.description || '',
          price: Number(editingProduct.price) || 0,
          type: editingProduct.type || 'product',
          status: editingProduct.status || 'active',
          stock: Number(editingProduct.stock) || 0,
          unit_type: editingProduct.unit_type || 'unit',
          points_earned: Number(editingProduct.points_earned) || 0,
          duration: editingProduct.duration || '',
          tutor: editingProduct.tutor || '',
          image: editingProduct.image || null,
          image_url: editingProduct.image_url || ''
        } : undefined}
      />

      <ProductDetailsModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && handleCancelDelete()}>
        <AlertDialogContent className="bg-white rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-red-600 flex items-center gap-2">
               <Trash2 className="w-5 h-5"/> Eliminar Producto
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-base">
              ¿Estás seguro de que deseas eliminar <b>"{productToDelete?.name}"</b>?
              <br/><br/>
              Esta acción es irreversible y eliminará el producto de la tienda permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isDeleting} className="border-gray-300">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}