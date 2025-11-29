import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { API_BASE_URL } from '@/config';
import { getAuthHeaders } from '@/lib/auth';

type UserFormData = {
  username: string;
  email: string;
  phone_number: string;
  status: string;
  password: string;
  password_confirmation: string;
};

interface UserConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    username?: string;
    name?: string;
    email: string;
    status: string;
    role: string | { id: number; name: string };
    phone_number?: string;
    is_partner?: boolean;
  };
  onUserUpdated: () => void;
}

export const UserConfigurationModal = ({
  isOpen,
  onClose,
  user,
  onUserUpdated
}: UserConfigurationModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<UserFormData>({
    username: user.username || '',
    email: user.email || '',
    phone_number: user.phone_number || '',
    status: user.status || 'active',
    password: '',
    password_confirmation: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Solo validar campos requeridos
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    // Solo validar contraseña si se está intentando cambiar
    if (formData.password || formData.password_confirmation) {
      if (formData.password && formData.password.length < 8) {
        newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      } else if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = 'Las contraseñas no coinciden';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setIsSubmitting(true);

      // Preparar datos a enviar, incluyendo solo los campos modificados
      type UpdateUserData = {
        username?: string;
        email?: string;
        phone_number?: string;
        status?: string;
        password?: string;
        password_confirmation?: string;
      };

      const dataToSend: UpdateUserData = {};

      // Solo incluir campos que han cambiado
      if (formData.username !== user.username) {
        dataToSend.username = formData.username;
      }

      if (formData.email !== user.email) {
        dataToSend.email = formData.email;
      }

      if (formData.phone_number !== user.phone_number) {
        dataToSend.phone_number = formData.phone_number;
      }

      if (formData.status !== user.status) {
        dataToSend.status = formData.status;
      }

      // Solo incluir contraseña si se está cambiando
      if (formData.password && formData.password_confirmation) {
        dataToSend.password = formData.password;
        dataToSend.password_confirmation = formData.password_confirmation;
      }

      // Determine the correct endpoint based on user context
      let endpoint: string;

      // Si tenemos un ID de usuario, verificar si es admin o partner
      if (user.id && user.id !== '') {
        // Detectar si el usuario es admin considerando que role puede ser string u objeto
        let roleValue = '';
        if (typeof user.role === 'string') {
          roleValue = user.role;
        } else if (user.role && typeof user.role === 'object' && user.role.name) {
          roleValue = user.role.name;
        }

        const isAdmin = roleValue && (
          roleValue.toLowerCase() === 'admin' ||
          roleValue.toLowerCase() === 'administrator' ||
          roleValue === '1' || // En caso de que role sea numérico
          roleValue.toLowerCase().includes('admin')
        );

        if (isAdmin) {
          // Para admins, usar el endpoint de admin sin ID
          endpoint = `${API_BASE_URL}/admin/profile`;
        } else {
          // Para cualquier otro rol (partner, user, etc.), usar el endpoint de partners
          endpoint = `${API_BASE_URL}/admin/profile/partners/${user.id}`;
        }
      }
      // Solo usar el endpoint de admin si no hay ID (caso muy específico)
      else {
        endpoint = `${API_BASE_URL}/admin/profile`;
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        let errorMessage = 'Error al actualizar el usuario';
        try {
          const errorData = await response.json();
          console.error('Error response:', errorData);

          // Si hay errores de validación, mostrarlos todos
          if (errorData.errors) {
            const errorMessages = Object.values(errorData.errors).flat();
            errorMessage = errorMessages.join('\n');
          } else {
            errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      toast({
        title: 'Usuario actualizado',
        description: result.message || 'Usuario actualizado exitosamente',
        variant: 'default',
      });

      onUserUpdated();
      onClose();
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al actualizar el usuario',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración de Usuario</DialogTitle>
          <DialogDescription>
            Actualizar configuración del usuario: {user.username || user.name || user.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Usuario
              </Label>
              <div className="col-span-3">
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={errors.username ? 'border-red-500' : ''}
                />
                {errors.username && (
                  <p className="text-xs text-red-500 mt-1">{errors.username}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <div className="col-span-3">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone_number" className="text-right">
                Teléfono
              </Label>
              <div className="col-span-3">
                <Input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>
            </div>            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Estado
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="border-green-300 border-2 focus:border-green-500">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Nueva Contraseña
              </Label>
              <div className="col-span-3">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'border-red-500' : ''}
                  placeholder="Dejar en blanco para no cambiar"
                />
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password_confirmation" className="text-right">
                Confirmar Contraseña
              </Label>
              <div className="col-span-3">
                <Input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  className={errors.password_confirmation ? 'border-red-500' : ''}
                  placeholder="Confirmar nueva contraseña"
                  disabled={!formData.password}
                />
                {errors.password_confirmation && (
                  <p className="text-xs text-red-500 mt-1">{errors.password_confirmation}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
