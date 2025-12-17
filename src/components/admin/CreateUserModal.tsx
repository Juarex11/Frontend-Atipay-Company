import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface CreateUserModalProps {
  readonly onUserCreated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function CreateUserModal({ onUserCreated, open: propOpen, onOpenChange, children }: Readonly<CreateUserModalProps>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Nuevo estado para manejar errores visuales en los inputs
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const isOpen = propOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirmation: "", // CAMBIO 1: Agregado el campo requerido [cite: 5]
    phone_number: "",
    reference_code: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo cuando el usuario escribe
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({}); // Limpiar errores previos

    try {
      const requestBody = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation, // CAMBIO 2: Enviamos confirmación [cite: 16]
        phone_number: formData.phone_number,
        reference_code: formData.reference_code || undefined
      };

      console.log('Enviando solicitud a la API con:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('http://127.0.0.1:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json().catch(e => ({
        error: 'Error al analizar la respuesta JSON',
        details: e.message
      }));

      if (!response.ok) {
        // CAMBIO 3: Manejo especial de errores 422 para la contraseña [cite: 17]
        if (response.status === 422 && data.errors) {
          const newErrors: Record<string, string> = {};
          
          Object.entries(data.errors).forEach(([key, msgs]) => {
             // @ts-ignore
             newErrors[key] = Array.isArray(msgs) ? msgs[0] : msgs;
          });

          // TRUCO: Si el error viene en 'password' y dice que no coinciden,
          // lo movemos visualmente a 'password_confirmation' 
          if (newErrors.password && newErrors.password.toLowerCase().includes("coinciden")) {
            newErrors.password_confirmation = newErrors.password;
            // Opcional: Borrar el error del campo password original si no quieres que se ponga rojo también
            // delete newErrors.password; 
          }

          setErrors(newErrors);
          throw new Error("Por favor revisa los campos marcados en rojo.");
        }

        throw new Error(data?.message || `Error ${response.status}: ${response.statusText}`);
      }

      toast({
        title: "¡Usuario creado exitosamente!",
        description: `El usuario ${data.user?.email || ''} ha sido creado correctamente.`,
      });

      setIsOpen(false);
      setFormData({
        username: "",
        email: "",
        password: "",
        password_confirmation: "",
        phone_number: "",
        reference_code: ""
      });
      if (onUserCreated) {
        onUserCreated();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Ocurrió un error al crear el usuario',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="w-[95vw] max-w-md p-0 overflow-hidden rounded-xl shadow-2xl border-0">
        <form onSubmit={handleSubmit} className="bg-white">
          <div className="px-6 pt-6 pb-2 border-b border-gray-100">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Crear nuevo usuario
            </DialogTitle>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Usuario</Label>
              <Input
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-base border rounded-lg transition-colors ${errors.username ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'}`}
                required
              />
              {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Correo electrónico</Label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-base border rounded-lg transition-colors ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'}`}
                required
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Número de teléfono</Label>
              <Input
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-base border rounded-lg transition-colors ${errors.phone_number ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'}`}
                required
                placeholder="+1234567890"
              />
              {errors.phone_number && <p className="text-xs text-red-500">{errors.phone_number}</p>}
            </div>

            {/* Campo Contraseña Original */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Contraseña</Label>
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-base border rounded-lg transition-colors ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'}`}
                required
              />
               {/* A veces el backend manda errores de longitud aqui, asi que lo dejamos */}
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* CAMBIO 4: Campo Confirmar Contraseña Nuevo [cite: 3, 5] */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Confirmar Contraseña</Label>
              <Input
                name="password_confirmation"
                type="password"
                value={formData.password_confirmation}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-base border rounded-lg transition-colors ${errors.password_confirmation ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'}`}
                required
              />
              {/* Aquí se mostrará el error si no coinciden  */}
              {errors.password_confirmation && <p className="text-xs text-red-500">{errors.password_confirmation}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-500">Código de referencia</Label>
              <Input
                name="reference_code"
                value={formData.reference_code}
                onChange={handleChange}
                className="w-full px-3 py-2 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row-reverse gap-3">
            <Button 
              type="submit" 
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 rounded-lg transition-colors duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : 'Crear usuario'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 rounded-lg transition-colors duration-200"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}