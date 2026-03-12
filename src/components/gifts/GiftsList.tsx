import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { giftService } from '../../services/giftService';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { GiftFormModal } from './GiftFormModal';
import { GiftDetailsModal } from './GiftDetailsModal';
import type { GiftFormData } from './GiftFormModal';
import RewardRequestsList from './RewardRequestsList';

interface Gift {
  id: number;
  name: string;
  description: string;
  redeem_points: number;
  stock: number;
  max_redeem: number; // ✅ agregado al tipo
  image_url: string;
  created_at?: string;
  updated_at?: string;
}

const GiftsList: React.FC = () => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftFormData | undefined>(undefined);
  const [giftToDelete, setGiftToDelete] = useState<Gift | null>(null);
  const [viewingGift, setViewingGift] = useState<Gift | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeleteClick = (gift: Gift) => {
    setGiftToDelete(gift);
  };

  const handleDelete = async () => {
    if (!giftToDelete) return;

    setIsDeleting(true);
    try {
      await giftService.deleteGift(giftToDelete.id);
      setGifts(gifts.filter(gift => gift.id !== giftToDelete.id));
      setGiftToDelete(null);
      toast.success('Regalo eliminado correctamente');
    } catch (error: unknown) {
      console.error('Error deleting gift:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el regalo';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchGifts = async () => {
      setIsLoading(true);
      try {
        const data = await giftService.getGifts();
        setGifts(data);
      } catch (error: unknown) {
        console.error('Error fetching gifts:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al cargar los regalos';
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGifts();
  }, []);


  const handleSubmit = async (formData: FormData) => {
    console.log('Iniciando envío del formulario...');
    setIsSubmitting(true);
    
    try {
      if (editingGift?.id) {
        const updatedGift = await giftService.updateGift(editingGift.id, formData);

        // El backend puede devolver { data: gift } o el gift directo
        const giftData = updatedGift?.data ?? updatedGift;

        // Usar los valores del formData como fuente de verdad
        const nameFromForm      = formData.get('name') as string;
        const descFromForm      = formData.get('description') as string;
        const pointsFromForm    = formData.get('redeem_points') as string;
        const stockFromForm     = formData.get('stock') as string;
        const maxRedeemFromForm = formData.get('max_redeem') as string;

        const imageUrl = giftData?.image_url
          ? `${giftData.image_url.split('?')[0]}?t=${new Date().getTime()}`
          : (formData.get('delete_image') === 'true' ? '' : editingGift.image_url ?? '');

        setGifts(prevGifts =>
          prevGifts.map(gift =>
            gift.id === editingGift.id
              ? {
                  ...gift,
                  name:          nameFromForm      || giftData?.name          || gift.name,
                  description:   descFromForm      ?? giftData?.description   ?? gift.description,
                  redeem_points: pointsFromForm    ? Number(pointsFromForm)   : (giftData?.redeem_points ?? gift.redeem_points),
                  stock:         stockFromForm     ? Number(stockFromForm)    : (giftData?.stock         ?? gift.stock),
                  max_redeem:    maxRedeemFromForm ? Number(maxRedeemFromForm): (giftData?.max_redeem    ?? gift.max_redeem),
                  image_url:     imageUrl,
                  updated_at:    giftData?.updated_at || new Date().toISOString(),
                }
              : gift
          )
        );

        toast.success('Regalo actualizado correctamente');
      } else {
        console.log('Creando nuevo regalo...');
        const newGift = await giftService.createGift(formData);
        console.log('Nuevo regalo recibido:', newGift);
        
        setGifts((prevGifts: Gift[]) => {
          const newGiftWithDefaults = {
            ...newGift,
            id: newGift.id || Date.now(),
            name: newGift.name || 'Nuevo Regalo',
            description: newGift.description || '',
            redeem_points: newGift.redeem_points || 0,
            stock: newGift.stock || 0,
            max_redeem: newGift.max_redeem || 1, // ✅ incluir max_redeem
            image_url: newGift.image_url || '',
            created_at: newGift.created_at || new Date().toISOString(),
            updated_at: newGift.updated_at || new Date().toISOString()
          };
          
          return [...prevGifts, newGiftWithDefaults];
        });
        
        toast.success('Regalo creado correctamente');
      }
      setIsFormOpen(false);
      setEditingGift(undefined);
    } catch (error: unknown) {
      console.error('Error saving gift:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el regalo';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="gifts" className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="gifts">
              <Gift className="h-4 w-4 mr-2" />
              Regalos
            </TabsTrigger>
            <TabsTrigger value="requests">
              <Gift className="h-4 w-4 mr-2" />
              Solicitudes
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="gifts">
          <div className="mb-6">
            <button
              onClick={() => {
                setEditingGift(undefined);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Regalo
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imagen</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puntos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Límite canjes</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gifts.map((gift) => (
                    <tr
                      key={gift.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setViewingGift(gift)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {gift.image_url ? (
                          <div className="h-10 w-10 rounded-md overflow-hidden">
                            <img
                              src={gift.image_url}
                              alt={gift.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                            <Gift className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{gift.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 truncate max-w-xs">{gift.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{gift.redeem_points}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${gift.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {gift.stock > 0 ? `Disponible (${gift.stock})` : 'Agotado'}
                        </span>
                      </td>
                      {/* ✅ nueva columna visible */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{gift.max_redeem ?? 1}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGift({
                              id: gift.id,
                              name: gift.name,
                              description: gift.description,
                              redeem_points: gift.redeem_points,
                              stock: gift.stock,
                              max_redeem: gift.max_redeem ?? 1, // ✅ FIX: se pasa max_redeem
                              image_url: gift.image_url
                            });
                            setIsFormOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(gift);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <RewardRequestsList />
        </TabsContent>
      </Tabs>

      <GiftFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingGift(undefined);
        }}
        initialData={editingGift}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {viewingGift && (
        <GiftDetailsModal
          isOpen={!!viewingGift}
          onClose={() => setViewingGift(null)}
          gift={viewingGift}
        />
      )}

      <DeleteConfirmationModal
        isOpen={!!giftToDelete}
        onClose={() => setGiftToDelete(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        itemName={giftToDelete?.name || ''}
      />
    </div>
  );
};

export default GiftsList;