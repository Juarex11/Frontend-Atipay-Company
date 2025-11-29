import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile } from "@/services/userService";
import { getUserProfile, updateUserProfile } from "@/services/userService";
import { AtipayCoin } from "@/components/ui/AtipayCoin";
import {
  User,
  Save,
  CheckCircle,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface FormData {
  email: string;
  username: string;
}

export default function UserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await getUserProfile();
        setProfile(data);
        setFormData({
          email: (data.email || '').trim(),
          username: (data.username || '').trim()
        });
      } catch (err) {
        setError('Error al cargar el perfil');
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      setError(null);
      setSuccess(null);
      setIsSaving(true);

      if (!profile) return;
      if (!formData.username.trim() || !formData.email.trim()) {
        setError('Por favor completa todos los campos requeridos');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Por favor ingresa un correo electrónico válido');
        return;
      }

      // Crear un objeto completamente limpio
      const fieldsToUpdate: Record<string, string> = {};

      const originalUsername = String(profile.username || '').trim();
      const originalEmail = String(profile.email || '').trim();
      const newUsername = String(formData.username || '').trim();
      const newEmail = String(formData.email || '').trim();

      // Solo incluir los campos que realmente cambiaron
      if (originalUsername !== newUsername) {
        fieldsToUpdate.username = newUsername;
      }

      if (originalEmail !== newEmail) {
        fieldsToUpdate.email = newEmail;
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        setIsEditing(false);
        setSuccess('No hay cambios que guardar');
        return;
      }

      // Llamar al servicio con solo los campos necesarios
      const response = await updateUserProfile(fieldsToUpdate);

      if (response.data) {
        setProfile(prev => ({
          ...prev!,
          username: response.data.username,
          email: response.data.email
        }));

        setFormData({
          username: response.data.username,
          email: response.data.email
        });

        setIsEditing(false);
        setSuccess(response.message || 'Perfil actualizado correctamente');
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      const errorMessage = error.message || 'Error al actualizar el perfil';
      setError(errorMessage);
      console.error('Error updating profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || isLoading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64" />
        </div>
      </AppLayout>
    );
  }

  const renderStatusMessages = () => {
    if (error) {
      return (
        <div className="mb-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      );
    }

    if (success) {
      return (
        <div className="mb-6">
          <Alert className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        </div>
      );
    }

    return null;
  };

  if (error && !profile) {
    return (
      <AppLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }


  if (!profile) {
    return (
      <AppLayout>
        <div className="p-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  const registrationDate = new Date(`${profile.registration_date} ${profile.registration_time}`);

  return (
    <AppLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Mi Perfil
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona tu información personal y preferencias de cuenta
              </p>
            </div>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <User className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      email: profile.email,
                      username: profile.username
                    });
                  }}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  {!isSaving && <Save className="h-4 w-4 ml-2" />}
                </Button>
              </div>
            )}
          </div>
        </div>

        {renderStatusMessages()}
        <Card className="border-0 shadow-sm bg-white rounded-xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col items-center">
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-green-100 to-indigo-200 flex items-center justify-center mb-4">
                  <span className="text-4xl font-bold text-green-600">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900">{profile.username}</h3>
                  <p className="text-gray-500 mt-1">{profile.email}</p>
                  <div className="mt-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      {profile.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    <p className="flex items-center justify-center">
                      <Calendar className="w-4 h-4 mr-1.5" />
                      Miembro desde {registrationDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-[#0c4a2a] to-[#0a7e3e] text-white border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white/90">Saldo</p>
                          <div className="flex items-center gap-2 mt-1">
                            <AtipayCoin size="sm" className="w-5 h-5 text-white" />
                            <p className="text-2xl font-bold text-white">
                              {profile.atipay_money === null || profile.atipay_money === undefined
                                ? '0'
                                : Number(profile.atipay_money).toLocaleString('es-ES', {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                  useGrouping: true
                                }).replace(/\.00$/, '')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white/90">Ganancias</p>
                          <div className="flex items-center gap-2 mt-1">
                            <AtipayCoin size="sm" className="w-5 h-5 text-white" />
                            <p className="text-2xl font-bold text-white">
                              {profile.withdrawable_balance === null || profile.withdrawable_balance === undefined
                                ? '0'
                                : Number(profile.withdrawable_balance).toLocaleString('es-ES', {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                  useGrouping: true
                                }).replace(/\.00$/, '')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-teal-700 to-teal-900 text-white border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white/90">Puntos</p>
                          <div className="flex items-center gap-2 mt-1">
                            <AtipayCoin size="sm" className="w-5 h-5 text-white" />
                            <p className="text-2xl font-bold text-white">
                              {profile.accumulated_points === null || profile.accumulated_points === undefined ? '0' :
                                Number(profile.accumulated_points).toLocaleString('es-ES', {
                                  useGrouping: true
                                })
                                  .replace(/\./g, '|')
                                  .replace(/,/g, '.')
                                  .replace(/\|/g, ',')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                          Nombre de usuario
                        </Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Correo Electrónico
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                      <div className="pt-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Rol
                        </Label>
                        <div className="mt-1 flex items-center">
                          <User className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-gray-700">
                            {profile.role_id === 1 ? 'Administrador' : 'Usuario'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}