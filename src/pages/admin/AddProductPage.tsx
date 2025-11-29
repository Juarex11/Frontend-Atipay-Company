import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { ProductForm } from '@/components/admin/ProductForm';
import { Loader2 } from 'lucide-react';

export default function AddProductPage() {
  const [isFormOpen] = useState(true);
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', {
        state: { from: '/admin/products/new' },
        replace: true
      });
    } else if (!isLoading && isAuthenticated && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  if (isLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleClose = () => {
    navigate('/admin/products');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Agregar Nuevo Producto</h1>
        <p className="text-muted-foreground">
          Completa el formulario para agregar un nuevo producto al catálogo.
        </p>
      </div>

      <ProductForm
        isOpen={isFormOpen}
        onClose={handleClose}
        onProductCreated={handleClose}
      />
    </div>
  );
}
