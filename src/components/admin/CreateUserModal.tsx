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
  const { toast } = useToast();

  const isOpen = propOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone_number: "",
    reference_code: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const requestBody = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number,
        reference_code: formData.reference_code || undefined
      };

      console.log('Enviando solicitud a la API con:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://api.atipaycompany.com/api/register', {
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

      console.log('Respuesta de la API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        data
      });

      if (!response.ok) {
        if (data?.errors) {
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => {
              const msgArray = Array.isArray(messages) ? messages : [messages];
              return `${field}: ${msgArray.join(', ')}`;
            })
            .join('\n');
          throw new Error(errorMessages || 'Error de validación');
        }
        throw new Error(data?.message || `Error ${response.status}: ${response.statusText}`);
      }

      toast({
        title: "¡Usuario creado exitosamente!",
        description: `El usuario ${data.user?.email || ''} ha sido creado correctamente.`,
      });

      setIsOpen(false);
      onUserCreated?.();
      setFormData({
        username: "",
        email: "",
        password: "",
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
                className="w-full px-3 py-2 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Correo electrónico</Label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Número de teléfono</Label>
              <Input
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-3 py-2 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                required
                placeholder="+1234567890"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Contraseña</Label>
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                required
              />
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
