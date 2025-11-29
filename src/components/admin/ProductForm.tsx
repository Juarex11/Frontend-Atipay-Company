import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ProductService } from "@/services/product.service";

export interface ProductFormData {
  id?: string | number;
  name: string;
  description: string;
  price: number;
  type: string;
  image?: File | string | null;
  image_url?: string; // For displaying existing images
  status: string;
  stock: number;
  unit_type: string;
  points_earned: number;
  duration?: string;
  tutor?: string;
}

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => void;
  initialData?: ProductFormData | null;
}

interface FormValues {
  name: string;
  description: string;
  price: number;
  type: string;
  image: File | null;
  status: string;
  stock: number;
  unit_type: string;
  points_to_redeem: number;
  points_earned: number;
  duration?: string;
  tutor?: string;
}

export function ProductForm({ isOpen, onClose, onProductCreated, initialData }: Readonly<ProductFormProps>) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(
    initialData?.image_url || (initialData?.image && typeof initialData.image === 'string' ? initialData.image : null)
  );

  // Update preview image when initialData changes
  useEffect(() => {
    if (initialData?.image_url) {
      setPreviewImage(initialData.image_url);
    } else if (initialData?.image && typeof initialData.image === 'string') {
      setPreviewImage(initialData.image);
    } else {
      setPreviewImage(null);
    }
  }, [initialData]);

  const form = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      type: initialData?.type || "product",
      image: null, // This is for file uploads
      status: initialData?.status || "active",
      stock: initialData?.stock || 0,
      unit_type: initialData?.unit_type || 'unit',
      points_earned: initialData?.points_earned || 0,
      duration: initialData?.duration || '',
      tutor: initialData?.tutor || '',
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        description: initialData.description || "",
        price: initialData.price || 0,
        type: initialData.type || "product",
        image: null,
        status: initialData.status || "active",
        stock: initialData.stock || 0,
        unit_type: initialData.unit_type || 'unit',
        points_earned: initialData.points_earned || 0,
        duration: initialData.duration || '',
        tutor: initialData.tutor || '',
      });
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        type: "product",
        image: null,
        status: "active",
        stock: 0,
        unit_type: 'unit',
        points_earned: 0,
        duration: '',
        tutor: '',
      });
      setPreviewImage(null);
    }
  }, [initialData, form]);

  const { register, handleSubmit, formState: { errors }, watch, reset } = form;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('image', file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (formValues: FormValues) => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();

      Object.entries(formValues).forEach(([key, value]) => {
        if (value === null || value === undefined) return;

        if (key === 'image' && value instanceof File) {
          formData.append('image', value);
          return;
        }

        if (value === null || value === undefined || value instanceof File) return;

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        }
      });

      if (initialData?.id) {
        // Add _method=PUT for Laravel to handle as PUT request
        formData.append('_method', 'PUT');
        
        // Call update with the formData that includes _method=PUT
        await ProductService.updateProduct(initialData.id, formData);

        toast({
          title: '¡Éxito!',
          description: 'Producto actualizado correctamente',
          className: 'bg-green-100 border-green-500 text-green-900',
        });
      } else {
        await ProductService.createProduct(formData);
        toast({
          title: '¡Éxito!',
          description: 'Producto creado correctamente',
          className: 'bg-green-100 border-green-500 text-green-900',
        });
      }

      reset();
      onClose();
      onProductCreated();
    } catch (error: unknown) {
      console.error('Error saving product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el producto';
      toast({
        title: 'Error',
        description: errorMessage,
        className: 'bg-red-100 border-red-500 text-red-900',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const productType = watch('type');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {initialData?.id ? 'Editar Producto' : 'Registrar Nuevo Producto'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Producto *</Label>
              <Input
                id="name"
                {...register('name', { required: 'El nombre es requerido' })}
                placeholder="Ej: Camiseta de algodón"
                className="w-full"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Tipo de Producto */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Producto *</Label>
              <select
                id="type"
                {...register('type', { required: 'El tipo de producto es requerido' })}
                className="w-full p-2 border rounded-md"
              >
                <option value="product">Producto</option>
                <option value="course">Curso</option>
              </select>
              {errors.type && (
                <p className="text-sm text-red-500">
                  {errors.type.message}
                </p>
              )}
            </div>

            {/* Tipo de Unidad */}
            <div className="space-y-2">
              <Label htmlFor="unit_type">Tipo de Unidad *</Label>
              <select
                id="unit_type"
                {...register('unit_type', { required: 'El tipo de unidad es requerido' })}
                className="w-full p-2 border rounded-md"
              >
                <option value="unit">Unidad</option>
                <option value="package">Paquete</option>
                <option value="kilo">Kilo</option>
                <option value="talla">Talla</option>
                <option value="education">Educación</option>
              </select>
              {errors.unit_type && (
                <p className="text-sm text-red-500">
                  {errors.unit_type.message}
                </p>
              )}
            </div>

            {/* Precio */}
            <div className="space-y-2">
              <Label htmlFor="price">Precio *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price', {
                  valueAsNumber: true,
                  required: 'El precio es requerido',
                  min: { value: 0, message: 'El precio debe ser mayor o igual a 0' }
                })}
                className="w-full"
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price.message}</p>
              )}
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                type="number"
                {...register('stock', {
                  valueAsNumber: true,
                  required: 'El stock es requerido',
                  min: { value: 0, message: 'El stock no puede ser negativo' }
                })}
                className="w-full"
              />
              {errors.stock && (
                <p className="text-sm text-red-500">{errors.stock.message}</p>
              )}
            </div>

            {/* Imagen */}
            <div className="space-y-2">
              <Label htmlFor="image">Imagen del Producto</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full"
              />
              {previewImage && (
                <div className="mt-2">
                  <img
                    src={previewImage}
                    alt="Vista previa"
                    className="h-32 w-32 object-cover rounded-md"
                  />
                </div>
              )}
              {errors.image && (
                <p className="text-sm text-red-500">
                  {String(errors.image.message)}
                </p>
              )}
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                {...register('status')}
                className="w-full p-2 border rounded-md"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>

            {/* Descripción */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descripción *</Label>
              <textarea
                id="description"
                {...register('description', { required: 'La descripción es requerida' })}
                rows={3}
                className="w-full p-2 border rounded-md"
                placeholder="Descripción detallada del producto"
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Puntos ganados */}
            <div className="space-y-2">
              <Label htmlFor="points_earned">Puntos ganados *</Label>
              <Input
                id="points_earned"
                type="number"
                {...register('points_earned', {
                  valueAsNumber: true,
                  required: 'Este campo es requerido',
                  min: { value: 0, message: 'No puede ser negativo' }
                })}
                className="w-full"
              />
              {errors.points_earned && (
                <p className="text-sm text-red-500">
                  {errors.points_earned.message}
                </p>
              )}
            </div>

            {/* Mostrar campos adicionales para cursos */}
            {productType === 'course' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (horas)</Label>
                  <Input
                    id="duration"
                    {...register('duration')}
                    placeholder="Ej: 8 horas"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tutor">Instructor/Tutor</Label>
                  <Input
                    id="tutor"
                    {...register('tutor')}
                    placeholder="Nombre del instructor"
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 focus-visible:ring-green-500"
              disabled={isSubmitting}
            >
              {(() => {
                if (isSubmitting) return 'Guardando...';
                return initialData?.id ? 'Actualizar Producto' : 'Guardar Producto';
              })()}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
