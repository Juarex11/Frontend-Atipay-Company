import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { PromotionsFilter, PromotionFormData } from "./types";
import { PromotionsList } from "./components/PromotionsList";
import { PromotionForm } from "./components/PromotionForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getPromotions as getApiPromotions, createPromotion, updatePromotion, deletePromotion, type Promotion } from "@/services/promotion.service";

const mapApiPromotion = (promo: Promotion): Promotion => {
  return {
    id: promo.id,
    name: promo.name,
    percentaje: promo.percentaje,
    atipay_price_promotion: promo.atipay_price_promotion || 0,
    points_earned: promo.points_earned || 0,
    duration_months: promo.duration_months || 1,
    status: promo.status,
    created_at: promo.created_at,
    updated_at: promo.updated_at
  };
};

const Promotions = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState<Promotion | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // Filters state
  const [filters] = useState<PromotionsFilter>({
    status: "all",
    search: "",
    type: "all",
  });

  useEffect(() => {
    const loadPromotions = async () => {
      try {
        setIsLoading(true);
        const data = await getApiPromotions();
        const mappedPromotions = data.map(mapApiPromotion);
        setPromotions(mappedPromotions);
        setFilteredPromotions(mappedPromotions);
      } catch (error) {
        console.error("Error loading promotions:", error);
        let errorMessage = "No se pudieron cargar las promociones. ";

        if (error instanceof Error) {
          if (error.message.includes('token') || error.message.includes('sesión')) {
            errorMessage += error.message;
          } else if (error.message.includes('conexión')) {
            errorMessage = error.message;
          } else {
            errorMessage += error.message;
          }
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });

        setPromotions([]);
        setFilteredPromotions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPromotions();
  }, [toast]);

  // Handle filter changes
  useEffect(() => {
    let result = [...promotions];

    if (filters.status !== "all") {
      result = result.filter(promo =>
        filters.status === "active" ? promo.status === 'active' : promo.status === 'inactive'
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(promo =>
        promo.name.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPromotions(result);
  }, [filters, promotions]);


  const handleEditPromotion = (promotion: Promotion) => {
    setCurrentPromotion(promotion);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleViewPromotion = (promotion: Promotion) => {
    setCurrentPromotion(promotion);
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleDeletePromotion = async (id: string) => {
    const promotion = promotions.find(p => p.id === id);
    if (!promotion) return;

    if (!window.confirm(`¿Estás seguro de eliminar la promoción "${promotion.name}"?`)) return;

    try {
      await deletePromotion(id);
      setPromotions(promotions.filter(p => p.id !== id));
      toast({
        title: "Promoción eliminada",
        description: `La promoción "${promotion.name}" ha sido eliminada correctamente.`,
      });
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar la promoción. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };


  const handleSubmitPromotion = async (formData: PromotionFormData) => {
    try {
      setIsLoading(true);
      const promotionData = {
        ...formData,
        percentaje: Number(formData.percentaje),
        atipay_price_promotion: Number(formData.atipay_price_promotion),
        points_earned: Number(formData.points_earned) || 0,
        duration_months: Number(formData.duration_months),
      };

      if (currentPromotion?.id) {
        const updatedPromotion = await updatePromotion(currentPromotion.id, promotionData);
        setPromotions(promotions.map(p => p.id === currentPromotion.id ? mapApiPromotion(updatedPromotion) : p));
        toast({
          title: "Promoción actualizada",
          description: `La promoción "${formData.name}" ha sido actualizada correctamente.`,
        });
      } else {
        const newPromotion = await createPromotion(promotionData);
        setPromotions([mapApiPromotion(newPromotion), ...promotions]);
        toast({
          title: "Promoción creada",
          description: `La promoción "${formData.name}" ha sido creada correctamente.`,
        });
      }
      setIsDialogOpen(false);
      setCurrentPromotion(null);
    } catch (error) {
      console.error("Error saving promotion:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la promoción. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Promociones</h1>
          <p className="text-gray-600">Gestiona y crea promociones para los usuarios</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setCurrentPromotion(null);
              setIsViewMode(false);
              setIsDialogOpen(true);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Promoción
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <PromotionsList
            promotions={filteredPromotions}
            isLoading={isLoading}
            onEdit={isAdmin ? handleEditPromotion : undefined}
            onDelete={isAdmin ? handleDeletePromotion : undefined}
            onView={handleViewPromotion}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsViewMode(false);
          setCurrentPromotion(null);
        }
        setIsDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {(() => {
                if (isViewMode) return 'Detalles de la promoción';
                return currentPromotion?.id ? 'Editar promoción' : 'Nueva promoción';
              })()}
              {isViewMode ? 'Información detallada de la promoción' : 'Complete los campos para crear o editar una promoción'}
            </DialogTitle>
            <DialogDescription>
              {isViewMode ? 'Detalles de la promoción seleccionada' : 'Por favor complete todos los campos requeridos'}
            </DialogDescription>
          </DialogHeader>
          <PromotionForm
            initialData={currentPromotion ? {
              name: currentPromotion?.name || '',
              percentaje: currentPromotion?.percentaje?.toString() || '0',
              atipay_price_promotion: currentPromotion?.atipay_price_promotion?.toString() || '0',
              duration_months: currentPromotion?.duration_months?.toString() || '1',
              status: currentPromotion?.status || 'active',
              points_earned: currentPromotion?.points_earned?.toString() || '0'
            } : {}}
            onSubmit={handleSubmitPromotion}
            onCancel={() => {
              setIsDialogOpen(false);
              setIsViewMode(false);
              setCurrentPromotion(null);
            }}
            isLoading={isLoading}
            isViewMode={isViewMode}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Promotions;
