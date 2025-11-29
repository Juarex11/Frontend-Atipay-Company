import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { API_ROUTES } from '../../config/api.routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

type ProfileFormValues = {
  username: string;
  email: string;
  phone_number?: string;
  password?: string;
  password_confirmation?: string;
  status: string;
};

export default function AdminProfileSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setError,
    clearErrors,
    getValues
  } = useForm<ProfileFormValues>({
    defaultValues: {
      username: '',
      email: '',
      phone_number: '',
      status: 'active',
      password: '',
      password_confirmation: ''
    },
  });

  const password = watch('password');
  const passwordConfirmation = watch('password_confirmation');

  // Validate passwords match
  useEffect(() => {
    if (password || passwordConfirmation) {
      if (password !== passwordConfirmation) {
        setError('password_confirmation', {
          type: 'manual',
          message: "Passwords don't match",
        });
      } else {
        clearErrors('password_confirmation');
      }
    }
  }, [password, passwordConfirmation, setError, clearErrors]);

  // Load profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(API_ROUTES.AUTH.USER, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          await response.text(); // Read the response to avoid memory leaks
          throw new Error(`Expected JSON, got ${contentType || 'no content-type'}`);
        }

        const responseData = await response.json();
        const profileData = responseData.data || responseData;
        
        // Reset form with fetched data
        reset({
          username: profileData.username || '',
          email: profileData.email || '',
          phone_number: profileData.phone_number || '',
          status: profileData.status || 'active',
          password: '',
          password_confirmation: ''
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Error loading profile. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [reset]);

  const onSubmit = async (formData: ProfileFormValues) => {
    console.log('Form submitted with data:', formData);
    setIsSubmitting(true);
    try {
      // Prepare request data with only changed fields
      const currentValues = getValues();
      const requestData: Partial<ProfileFormValues> = {};
      
      console.log('Current form values:', currentValues);
      
      // Check each field for changes
      const checkField = <K extends keyof ProfileFormValues>(field: K) => {
        if (formData[field] !== currentValues[field]) {
          requestData[field] = formData[field];
          console.log(`Field changed - ${field}:`, {
            old: currentValues[field],
            new: formData[field]
          });
        }
      };
      
      // Check all relevant fields
      checkField('username');
      checkField('email');
      checkField('phone_number');
      checkField('status');
      
      // Special handling for phone number to ensure it's always sent if it exists
      if (formData.phone_number !== undefined) {
        requestData.phone_number = formData.phone_number;
      }

      // Only include password if it's being changed
      if (formData.password) {
        requestData.password = formData.password;
        requestData.password_confirmation = formData.password_confirmation;
      }

      console.log('Prepared request data:', requestData);
      
      // Use PUT to the admin profile endpoint
      const endpoint = `${import.meta.env.VITE_API_URL}/admin/profile`;
      console.log('Sending request to:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData),
      });

      // Log the raw response text for debugging
      const responseText = await response.text();
      console.log('Raw API Response:', responseText);
      
      // Try to parse the response as JSON
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        responseData = {};
      }
      console.log('API Response:', responseData);

      if (!response.ok) {
        console.error('Update failed with status:', response.status);
        throw new Error(responseData.message || 'No se pudo actualizar el perfil');
      }
      
      // Check if we have the expected response structure
      if (!responseData.data && !responseData.user) {
        console.warn('Unexpected API response structure:', responseData);
        // If we don't have the expected structure, try to use the response as is
        if (responseData.username || responseData.email) {
          responseData.data = { ...responseData };
        } else {
          // If we still don't have the data, use the form data
          responseData.data = {
            username: formData.username,
            email: formData.email,
            phone_number: formData.phone_number,
            status: formData.status
          };
        }
      }

      // Handle successful response
      toast.success(responseData.message || 'Perfil actualizado exitosamente');
      
      console.log('Update successful, response data:', responseData);
      
      // Get the updated data from the response or use the data we sent
      const updatedData = responseData.data || responseData.user || {
        username: formData.username,
        email: formData.email,
        phone_number: formData.phone_number,
        status: formData.status
      };
      
      console.log('Updating form with data:', updatedData);
      
      // First reset the form to clear any internal state
      reset();
      
      // Then update with new values after a small delay to ensure the reset is complete
      setTimeout(() => {
        reset({
          ...currentValues, // Keep any existing values
          ...updatedData,  // Apply updated values
          password: '',    // Clear password fields
          password_confirmation: ''
        }, {
          keepDirty: false,  // Mark all fields as pristine
          keepErrors: false  // Clear any errors
        });
      }, 0);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred while updating the profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#0a7e3e]" />
        <span className="ml-3 text-gray-700">Cargando perfil...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="bg-gradient-to-r from-[#0a7e3e] to-[#0c4a2a] text-white p-6 rounded-lg shadow-md">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Configuración de Perfil</h1>
          <p className="text-[#e2f3e8] mt-1">
            Actualiza tu información personal y contraseña
          </p>
        </div>
      </div>

      <div className="grid gap-6 max-w-7xl mx-auto p-6">
        <Card className="border border-gray-100 shadow-sm rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Información del Perfil</CardTitle>
            <CardDescription>
              Actualiza tu información personal y detalles de contacto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Nombre de Usuario</Label>
                  <Input
                    id="username"
                    type="text"
                    {...register('username', { 
                      required: 'El nombre de usuario es requerido', 
                      minLength: { value: 3, message: 'Mínimo 3 caracteres' } 
                    })}
                    disabled={isSubmitting}
                    className="bg-white border-gray-200 hover:border-[#0a7e3e] focus:border-[#0a7e3e] focus:ring-1 focus:ring-[#0a7e3e] transition-colors duration-200"
                  />
                  {errors.username && (
                    <p className="text-sm text-red-600">{errors.username.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Teléfono</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    {...register('phone_number', {
                      pattern: {
                        value: /^[0-9+\- ]+$/,
                        message: 'Número de teléfono no válido'
                      }
                    })}
                    disabled={isSubmitting}
                    className="bg-white border-gray-200 hover:border-[#0a7e3e] focus:border-[#0a7e3e] focus:ring-1 focus:ring-[#0a7e3e] transition-colors duration-200"
                    placeholder="Ej: +51 987 654 321"
                  />
                  {errors.phone_number && (
                    <p className="text-sm text-red-600">{errors.phone_number.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email', { 
                      required: 'El correo electrónico es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Correo electrónico inválido'
                      }
                    })}
                    disabled={isSubmitting}
                    className="bg-white border-gray-200 hover:border-[#0a7e3e] focus:border-[#0a7e3e] focus:ring-1 focus:ring-[#0a7e3e] transition-colors duration-200"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Cambiar Contraseña</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="password">Nueva Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register('password', {
                        minLength: { value: 8, message: 'Mínimo 8 caracteres' }
                      })}
                      disabled={isSubmitting}
                      placeholder="Dejar en blanco para mantener la actual"
                      className="bg-white border-gray-200 hover:border-[#0a7e3e] focus:border-[#0a7e3e] focus:ring-1 focus:ring-[#0a7e3e] transition-colors duration-200"
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirmar Contraseña</Label>
                    <Input
                      id="password_confirmation"
                      type="password"
                      {...register('password_confirmation', {
                        validate: (value) => value === watch('password') || "Las contraseñas no coinciden"
                      })}
                      disabled={isSubmitting}
                      placeholder="Confirmar nueva contraseña"
                      className="bg-white border-gray-200 hover:border-[#0a7e3e] focus:border-[#0a7e3e] focus:ring-1 focus:ring-[#0a7e3e] transition-colors duration-200"
                    />
                    {errors.password_confirmation && (
                      <p className="text-sm text-red-600">{errors.password_confirmation.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0a7e3e] hover:bg-[#0c4a2a] text-white transition-colors duration-200 font-medium px-6 py-2.5 rounded-lg shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
