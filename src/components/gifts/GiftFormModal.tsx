import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface GiftFormData {
  id?: number;
  name: string;
  description: string;
  redeem_points: number;
  stock: number;
  reward_image?: File | null;
  image_url?: string;
}

interface GiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  initialData?: GiftFormData;
  isSubmitting: boolean;
}

export const GiftFormModal: React.FC<GiftFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<Omit<GiftFormData, 'reward_points'>>({
    name: '',
    description: '',
    redeem_points: 0,
    stock: 0,
    image_url: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        redeem_points: initialData.redeem_points || 0,
        stock: initialData.stock || 0,
        image_url: initialData.image_url || '',
      });
      setImageRemoved(false); // Reset image removed state
    } else {
      // Reset form when opening for new gift
      setFormData({
        name: '',
        description: '',
        redeem_points: 0,
        stock: 0,
        image_url: '',
      });
      setImageRemoved(false);
    }
  }, [initialData, isOpen]);

  const [pointsValue, setPointsValue] = useState<string>('');
  const [stockValue, setStockValue] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setPointsValue(initialData.redeem_points?.toString() || '');
      setStockValue(initialData.stock?.toString() || '');
    } else {
      setPointsValue('');
      setStockValue('');
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'redeem_points') {
      setPointsValue(value);
      // Actualizar formData con el valor numérico o 0 si está vacío
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value)
      }));
    } else if (name === 'stock') {
      setStockValue(value);
      // Actualizar formData con el valor numérico o 0 si está vacío
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    
    // Asegurarse de que los valores numéricos sean correctos al enviar
    const redeemPointsValue = pointsValue === '' ? 0 : Number(pointsValue);
    const stockValueToSend = stockValue === '' ? 0 : Number(stockValue);

    // Solo incluir los campos que han cambiado
    if (formData.name !== initialData?.name) {
      formDataToSend.append('name', formData.name);
    } else {
      // Si el nombre no ha cambiado, indicar que se debe omitir la validación
      formDataToSend.append('skip_name_validation', 'true');
    }

    formDataToSend.append('description', formData.description);
    formDataToSend.append('redeem_points', redeemPointsValue.toString());
    formDataToSend.append('stock', stockValueToSend.toString());

    // Manejar la imagen
    if (selectedFile) {
      // Si hay un nuevo archivo seleccionado, enviarlo
      formDataToSend.append('reward_image', selectedFile);
    } else if (initialData?.image_url && !imageRemoved) {
      // Si hay una imagen existente y no se ha eliminado, mantenerla
      formDataToSend.append('image_url', initialData.image_url);
    } else if (imageRemoved) {
      // Si se ha eliminado la imagen explícitamente, enviar un valor especial
      // para indicar al servidor que elimine la imagen
      formDataToSend.append('delete_image', 'true');
    }

    // Si es una edición, agregar el método PUT
    if (initialData?.id) {
      formDataToSend.append('_method', 'PUT');
      formDataToSend.append('_id', initialData.id.toString());
    }

    onSubmit(formDataToSend);
  };

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {initialData?.id ? 'Editar Regalo' : 'Nuevo Regalo'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nombre del regalo"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripción del regalo"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Puntos *
              </label>
              <input
                type="number"
                name="redeem_points"
                min="0"
                value={pointsValue}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock *
              </label>
              <input
                type="number"
                name="stock"
                min="0"
                value={stockValue}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {(previewUrl || (initialData?.image_url && !imageRemoved)) ? (
                  <div className="relative">
                    <img
                      src={previewUrl || initialData?.image_url}
                      alt="Vista previa"
                      className="mx-auto h-32 w-32 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setSelectedFile(null);
                        setImageRemoved(true);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                      >
                        <span>Subir archivo</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleImageChange}
                          accept="image/*"
                        />
                      </label>
                      <p className="pl-1">o arrastrar y soltar</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF (Máx. 5MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : (initialData?.id ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
