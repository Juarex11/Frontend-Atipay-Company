import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShoppingBag, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { productService } from '@/services/productService';
import type { PurchaseRequest } from '@/services/productService';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Aprobado</Badge>
      );
    case 'rejected':
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rechazado</Badge>
      );
    default:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pendiente</Badge>
      );
  }
};

const PurchaseHistory: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('all');

  useEffect(() => {
    const fetchPurchaseHistory = async () => {
      try {
        setIsLoading(true);
        const data = await productService.getMyPurchaseHistory();
        setPurchases(data);
        setError(null);
      } catch (error) {
        console.error('Error al cargar el historial de compras:', error);
        setError('No se pudo cargar tu historial de compras. Por favor, intenta de nuevo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchaseHistory();
  }, []);

  const filteredPurchases = purchases.filter(purchase => {
    if (currentTab === 'all') return true;
    return purchase.status === currentTab;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando historial de compras...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Error</h3>
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

  if (purchases.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gray-100 mb-4">
          <ShoppingBag className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No tienes compras aún
        </h3>
        <p className="text-gray-500 mb-4">
          Explora nuestros productos y realiza tu primera compra.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Historial de Compras</h2>
      </div>

      <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="approved">Aprobadas</TabsTrigger>
          <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
        </TabsList>

        <TabsContent value={currentTab} className="mt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPurchases.map((purchase) => (
              <Card key={purchase.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="flex justify-between items-center">
                    <span className="text-base truncate">{purchase.product.name}</span>
                    {getStatusBadge(purchase.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-start mb-3">
                    {purchase.product.image_url ? (
                      <img
                        src={purchase.product.image_url}
                        alt={purchase.product.name}
                        className="h-16 w-16 object-cover rounded-md mr-3"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-200 rounded-md flex items-center justify-center mr-3">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        Método de pago: <span className="capitalize">{purchase.payment_method}</span>
                      </p>
                      {purchase.points_used > 0 && (
                        <p className="text-sm text-gray-600">
                          Puntos utilizados: {purchase.points_used}
                        </p>
                      )}
                    </div>
                  </div>

                  {purchase.admin_message && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Mensaje del administrador:</span> {purchase.admin_message}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PurchaseHistory;
