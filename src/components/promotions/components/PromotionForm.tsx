import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AtipayCoin } from "@/components/ui/AtipayCoin";

interface PromotionFormData {
  name: string;
  percentaje: string;
  points_earned: string;
  atipay_price_promotion: string;
  duration_months: string;
  status: 'active' | 'inactive';
}

export interface PromotionFormProps {
  initialData?: Partial<PromotionFormData>;
  onSubmit: (data: PromotionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isViewMode?: boolean;
}

const getButtonContent = (isLoading: boolean, isEditing: boolean) => {
  if (isLoading) {
    return (
      <>
        <span className="mr-2">Guardando...</span>
        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </>
    );
  }
  return isEditing ? 'Actualizar promoción' : 'Crear promoción';
};

export const PromotionForm = ({
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
  isViewMode = false,
}: PromotionFormProps) => {
  const [formData, setFormData] = useState<PromotionFormData>({
    name: initialData.name || "",
    percentaje: initialData.percentaje || "",
    points_earned: initialData.points_earned || "0",
    atipay_price_promotion: initialData.atipay_price_promotion || "",
    duration_months: initialData.duration_months || "1",
    status: initialData.status || "active",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value as 'active' | 'inactive'
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (!formData.percentaje) {
      errors.percentaje = 'El porcentaje es requerido';
    } else if (isNaN(Number(formData.percentaje)) || Number(formData.percentaje) <= 0) {
      errors.percentaje = 'Ingrese un porcentaje válido';
    }

    if (!formData.atipay_price_promotion) {
      errors.atipay_price_promotion = 'El precio de promoción es requerido';
    } else if (isNaN(Number(formData.atipay_price_promotion)) || Number(formData.atipay_price_promotion) <= 0) {
      errors.atipay_price_promotion = 'Ingrese un precio de promoción válido';
    }

    if (!formData.points_earned) {
      errors.points_earned = 'Los puntos ganados son requeridos';
    } else if (isNaN(Number(formData.points_earned)) || Number(formData.points_earned) < 0) {
      errors.points_earned = 'Ingrese una cantidad de puntos válida';
    }

    if (!formData.duration_months) {
      errors.duration_months = 'La duración es requerida';
    } else if (isNaN(Number(formData.duration_months)) || Number(formData.duration_months) <= 0) {
      errors.duration_months = 'Ingrese una duración válida';
    }

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      onSubmit({
        ...formData,
        percentaje: formData.percentaje,
        duration_months: formData.duration_months,
      });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la promoción<span className="text-red-500">*</span></Label>
            <div>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Descuento de verano"
                disabled={isLoading}
                className={formErrors.name ? 'border-red-500' : ''}
                required
              />
              {formErrors.name && (
                <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="percentaje">Porcentaje de ganancia<span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                id="percentaje"
                name="percentaje"
                type="number"
                min="1"
                max="100"
                value={formData.percentaje}
                onChange={handleInputChange}
                placeholder="Ej: 10"
                disabled={isLoading}
                className={`pr-12 ${formErrors.percentaje ? 'border-red-500' : ''}`}
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
            {formErrors.percentaje && (
              <p className="text-sm text-red-500 mt-1">{formErrors.percentaje}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_months">Duración (meses)<span className="text-red-500">*</span></Label>
            <div>
              <Input
                id="duration_months"
                name="duration_months"
                type="number"
                min="1"
                value={formData.duration_months}
                onChange={handleInputChange}
                placeholder="Ej: 3"
                disabled={isLoading}
                className={formErrors.duration_months ? 'border-red-500' : ''}
                required
              />
              {formErrors.duration_months && (
                <p className="text-sm text-red-500 mt-1">{formErrors.duration_months}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="points_earned">Puntos ganados<span className="text-red-500">*</span></Label>
            <div>
              <Input
                id="points_earned"
                name="points_earned"
                type="number"
                min="0"
                value={formData.points_earned}
                onChange={handleInputChange}
                placeholder="Ej: 100"
                disabled={isLoading}
                className={formErrors.points_earned ? 'border-red-500' : ''}
                required
              />
              {formErrors.points_earned && (
                <p className="text-sm text-red-500 mt-1">{formErrors.points_earned}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="atipay_price_promotion">Precio de promoción<span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                id="atipay_price_promotion"
                name="atipay_price_promotion"
                type="number"
                min="1"
                step="0.01"
                value={formData.atipay_price_promotion}
                onChange={handleInputChange}
                placeholder="Ej: 50"
                disabled={isLoading}
                className={`pr-12 ${formErrors.atipay_price_promotion ? 'border-red-500' : ''} ${isViewMode ? 'bg-gray-50' : ''}`}
                required
                readOnly={isViewMode}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <AtipayCoin size="xs" className="text-yellow-500" />
              </div>
            </div>
            {formErrors.atipay_price_promotion && (
              <p className="text-sm text-red-500 mt-1">{formErrors.atipay_price_promotion}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Estado<span className="text-red-500">*</span></Label>
            <Select
              value={formData.status}
              onValueChange={handleStatusChange}
              disabled={isLoading || isViewMode}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 px-6"
          >
            {getButtonContent(isLoading, !!initialData?.name)}
          </Button>
        </div>
      </form>
    </div>
  );
};
