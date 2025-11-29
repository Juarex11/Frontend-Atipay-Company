import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserStatusBadge } from './UserStatusBadge';
import { User, Mail, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { UserListItem, UpdateUserRequest } from '@/services/userManagement.service';

interface UserDetailsModalProps {
  readonly user: UserListItem | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (userId: string, data: UpdateUserRequest) => Promise<void>;
  readonly mode: 'view' | 'edit';
}

export function UserDetailsModal({
  user,
  isOpen,
  onClose,
  onSave,
  mode: initialMode,
}: UserDetailsModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateUserRequest>({
    defaultValues: {
      id: user?.id || '',
      fullName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
      email: user?.email || '',
      status: user?.status as 'active' | 'suspended' | 'inactive' | undefined,
      role: user?.role,
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        id: user.id,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        status: user.status as 'active' | 'suspended' | 'inactive',
        role: user.role,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UpdateUserRequest) => {
    if (!user) return;

    setIsLoading(true);
    try {
      await onSave(user.id, data);
      setMode('view');
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <User className="h-5 w-5" />
            {user.firstName} {user.lastName}
            <UserStatusBadge status={user.status} />
          </DialogTitle>
          <DialogDescription>
            {mode === 'view' ? 'Información detallada del usuario' : 'Editar información del usuario'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full flex flex-wrap gap-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="financial">Financiero</TabsTrigger>
            <TabsTrigger value="activity">Actividad</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  {mode === 'edit' ? (
                    <div>
                      <Input
                        id="fullName"
                        {...register('fullName', { required: 'El nombre completo es requerido' })}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
                      )}
                    </div>
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{user.firstName} {user.lastName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  {mode === 'edit' ? (
                    <div>
                      <Input
                        id="email"
                        type="email"
                        {...register('email', { 
                          required: 'El email es requerido',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email inválido'
                          }
                        })}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                      )}
                    </div>
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{user.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {mode === 'edit' ? (
                    <div>
                      <Select 
                        value={watch('role')} 
                        onValueChange={(value) => setValue('role', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="partner">Socio</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <p className="p-2 bg-gray-50 rounded flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  {mode === 'edit' ? (
                    <Select value={watch('status')} onValueChange={(value) => setValue('status', value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                        <SelectItem value="suspended">Suspendido</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2">
                      <UserStatusBadge status={user.status} />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  {mode === 'edit' ? (
                    <Select value={watch('role')} onValueChange={(value) => setValue('role', value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="partner">Socio</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                        {user.role === 'admin' ? 'Administrador' : 'Socio'}
                      </Badge>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fecha de registro</Label>
                  <p className="p-2 bg-gray-50 rounded flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Saldo Actual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(user.balance || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Total Invertido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(user.profile?.totalInvested || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Ganancias Totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(user.profile?.totalEarnings || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {mode === 'edit' && (
              <Card>
                <CardHeader>
                  <CardTitle>Ajustar Saldo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="balance">Nuevo Saldo</Label>
                    <div>
                      <Input
                        id="balance"
                        type="number"
                        step="0.01"
                        value={user.balance}
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Para modificar el saldo, utilice la sección de transacciones.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Referidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.totalReferrals || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Inversiones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.totalInvestments || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Información de Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label>Código de Referencia</Label>
                  <p className="p-2 bg-gray-50 rounded font-mono">
                    {user.profile?.referralCode || 'N/A'}
                  </p>
                </div>
                {user.profile?.phone && (
                  <div>
                    <Label>Teléfono</Label>
                    <p className="p-2 bg-gray-50 rounded">{user.profile.phone}</p>
                  </div>
                )}
                {user.profile?.country && (
                  <div>
                    <Label>País</Label>
                    <p className="p-2 bg-gray-50 rounded">{user.profile.country}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {mode === 'view' ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button onClick={() => setMode('edit')}>
                Editar Usuario
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setMode('view')}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit(onSubmit)}
                disabled={!isDirty || isLoading}
              >
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
