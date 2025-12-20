import { useState, useEffect, lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Search, Loader2, ShoppingCart } from "lucide-react";
import { Cart } from "./cart/Cart";
import { useCart } from "@/hooks/useCart";
import { ProductForm } from "@/components/admin/ProductForm";
import { productService, type Product as ApiProduct } from "@/services/productService";
import type { Product } from "./types/store.types";
import { ProductDialog } from "./products/ProductDialog";
import { ProductList } from "./products/ProductList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Importar el componente de historial de compras con carga perezosa
const PurchaseHistory = lazy(() => import("./purchases/PurchaseHistory"));

// Componente para el estado vacío de la lista de productos
interface EmptyProductsStateProps {
  hasProducts: boolean;
  isAdmin: boolean;
  onAddProduct: () => void;
}

const EmptyProductsState = ({ hasProducts, isAdmin, onAddProduct }: EmptyProductsStateProps) => {
  return (
    <div className="col-span-full text-center py-12">
      <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gray-100 mb-4">
        <Search className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        {!hasProducts ? 'No hay productos disponibles' : 'No se encontraron productos'}
      </h3>
      <p className="text-gray-500 mb-4">
        {!hasProducts
          ? 'Próximamente tendremos más productos disponibles.'
          : 'Intenta con otros términos de búsqueda o categorías.'}
      </p>
      {!hasProducts && isAdmin && (
        <Button onClick={onAddProduct}>
          Agregar primer producto
        </Button>
      )}
    </div>
  );
};

const mapApiProductToStoreProduct = (apiProduct: ApiProduct): Product => {
  const isCourse = apiProduct.type === 'service';
  const baseProduct: Product = {
    id: apiProduct.id,
    name: apiProduct.name,
    description: apiProduct.description || 'Sin descripción disponible',
    price: apiProduct.price,
    pointsEarned: apiProduct.points_earned,
    category: apiProduct.type,
    imageUrl: apiProduct.image_url || '/placeholder-product.jpg',
    rating: 0,
    reviews: 0,
    inStock: apiProduct.stock > 0,
    isDigital: apiProduct.type === 'digital',
    discount: 0,
    featured: false,
    stock: apiProduct.stock,
    unitType: apiProduct.unit_type || 'unidad',
    type: isCourse ? 'course' : 'product'
  };
  if (isCourse) {
    return {
      ...baseProduct,
      duration: '8 semanas',
      tutor: 'Instructor de Atipay',
      details: 'Este es un curso completo que cubre todos los aspectos importantes.'
    };
  }

  return baseProduct;
};

export function Store() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  // CAMBIO 1: El estado inicial ahora es 'product' para que aparezca seleccionado por defecto
  const [selectedCategory, setSelectedCategory] = useState<string | null>("product");
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('products');
  const { addToCart, getCartItemCount } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const apiProducts = await productService.getProducts();
        const mappedProducts = apiProducts.map(mapApiProductToStoreProduct);
        setProducts(mappedProducts);
      } catch (error: unknown) {
        console.error('Error al cargar productos:', error);
        const errorMessage = error instanceof Error
          ? error.message
          : 'No se pudieron cargar los productos. Intenta de nuevo más tarde.';
        setError(errorMessage);

        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [toast]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  // CAMBIO 2: Ordenamos las categorías para que 'product' salga primero si existe
  const categories = Array.from(new Set(products.map(p => p.category)))
    .map(category => ({
      value: category,
      label: category.charAt(0).toUpperCase() + category.slice(1),
    }))
    .sort((a, b) => {
      // Forzamos que 'product' sea el primero en la lista generada
      if (a.value === 'product') return -1;
      if (b.value === 'product') return 1;
      return 0; 
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando productos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Error al cargar los productos</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  const emptyState = (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900">No hay productos disponibles</h3>
      <p className="mt-1 text-sm text-gray-500">
        {user?.role === 'admin'
          ? 'Comienza agregando un nuevo producto'
          : 'Vuelve a intentarlo más tarde.'
        }
      </p>
      {user?.role === 'admin' && (
        <Button
          onClick={() => setIsProductFormOpen(true)}
          className="mt-2"
        >
          Agregar primer producto
        </Button>
      )}
    </div>
  );

  if (products.length === 0 && user?.role !== 'admin') {
    return emptyState;
  }
  const reloadProducts = async () => {
    try {
      const apiProducts = await productService.getProducts();
      const mappedProducts = apiProducts.map(mapApiProductToStoreProduct);
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Tienda</h1>
          {user?.role === 'admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProductFormOpen(true)}
              className="ml-2"
            >
              Agregar producto
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="relative"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Carrito
            {getCartItemCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {getCartItemCount()}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="purchases">Mis Compras</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          {/* Category filters */}
          <div className="mb-6 mt-4">
            <div className="flex flex-wrap gap-2">
              {/* CAMBIO 3: Renderizamos PRIMERO las categorías (Product, Course, etc.) */}
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${selectedCategory === category.value
                    ? 'bg-green-600 text-black'
                    : 'bg-green-600 text-white hover:bg-green-600'
                    }`}
                >
                  {category.label}
                </button>
              ))}

              {/* CAMBIO 4: El botón TODOS se mueve al final */}
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${selectedCategory === null
                  ? 'bg-green-600 text-black'
                  : 'bg-green-600 text-white hover:bg-green-600'
                  }`}
              >
                Todos
              </button>
            </div>
          </div>

          {/* Clear filters button */}
          {(searchTerm || selectedCategory) && (
            <div className="mb-6 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory(null);
                }}
                className="mx-auto"
              >
                Limpiar filtros
              </Button>
            </div>
          )}

          {/* Product list */}
          <ProductList
            products={filteredProducts}
            onViewDetails={handleProductClick}
            onAddToCart={handleAddToCart}
            emptyState={<EmptyProductsState
              hasProducts={products.length > 0}
              isAdmin={user?.role === 'admin'}
              onAddProduct={() => setIsProductFormOpen(true)}
            />}
          />
        </TabsContent>

        <TabsContent value="purchases">
          {/* Purchase History Component */}
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Cargando historial...</span>
            </div>
          }>
            <PurchaseHistory />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Product Dialog */}
      {selectedProduct && (
        <ProductDialog
          product={selectedProduct}
          open={Boolean(selectedProduct)}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Cart */}
      <Cart isOpen={isCartOpen} onOpenChange={setIsCartOpen} />

      {/* Product Form Modal */}
      {user?.role === 'admin' && (
        <ProductForm
          isOpen={isProductFormOpen}
          onClose={() => setIsProductFormOpen(false)}
          onProductCreated={() => {
            // Recargar productos después de crear uno nuevo
            reloadProducts();
            // Cerrar el modal
            setIsProductFormOpen(false);
          }}
        />
      )}
    </div>
  );
}