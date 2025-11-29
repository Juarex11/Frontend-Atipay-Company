import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, Clock, XCircle, Check, X, Loader } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.atipaycompany.com';

// Table components
const Table = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className="w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className}`}>
      {children}
    </table>
  </div>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="[&_tr]:border-b">
    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
      {children}
    </tr>
  </thead>
);

const TableHead = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}>
    {children}
  </th>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
);

const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
    {children}
  </tr>
);

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  className?: string;
}

const TableCell = ({ children, className = '', ...props }: TableCellProps) => (
  <td
    className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}
    {...props}
  >
    {children}
  </td>
);


interface User {
  id: number;
  username: string;
  email: string;
  referral_url: string;
}

interface Reward {
  id: number;
  name: string;
  image_url: string;
}

interface RewardRequest {
  id: number;
  user_id: number;
  reward_id: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_message: string | null;
  user: User;
  reward: Reward;
  created_at: string;
  updated_at: string;
}

interface ActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string; // Cambiado de React.ReactNode a string para evitar anidamiento de elementos
  message: string;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  actionLabel: string;
  variant?: 'default' | 'destructive';
  isLoading: boolean;
}

const ActionDialog: React.FC<ActionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  onMessageChange,
  actionLabel,
  variant = 'default',
  isLoading
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-white border-gray-200">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-700">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-3">
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium text-gray-800">
              Mensaje para el usuario (opcional):
            </label>
            <textarea
              id="message"
              rows={3}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              placeholder={variant === 'default'
                ? 'Ej: ¡Felicidades! Tu recompensa ha sido aprobada.'
                : 'Ej: Lamentamos informarte que tu solicitud no cumple con los requisitos.'}
              value={message}
              onChange={onMessageChange}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isLoading}
            className="bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={variant === 'destructive'
              ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
            }
          >
            {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const RewardRequestsList: React.FC = () => {
  const { data: requests = [], isLoading } = useQuery<RewardRequest[]>({
    queryKey: ['reward-requests'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      const endpoint = `${API_URL}${API_URL.endsWith('/') ? '' : '/'}reward-requests`;
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Error al cargar las solicitudes de recompensas');
      }

      return response.json();
    }
  });

  const [activeTab, setActiveTab] = useState('pending');
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    requestId: number | null;
    action: 'approve' | 'reject' | null;
    message: string;
  }>({
    isOpen: false,
    requestId: null,
    action: null,
    message: ''
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAction = async (requestId: number, action: 'approve' | 'reject') => {
    setDialogState({
      isOpen: true,
      requestId,
      action,
      message: ''
    });
  };

  const handleConfirm = async () => {
    const { requestId, action, message } = dialogState;
    if (!requestId || !action) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      const endpoint = `${API_URL}${API_URL.endsWith('/') ? '' : '/'}reward-requests/${requestId}/${action}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          admin_message: message || (action === 'approve'
            ? 'Su recompensa ya puede ser reclamada'
            : 'Su recompensa ha sido rechazada')
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al procesar la solicitud');
      }

      toast({
        title: action === 'approve' ? '¡Solicitud aprobada!' : 'Solicitud rechazada',
        description: data.message,
        variant: 'default',
      });

      // Refresh the list
      await queryClient.invalidateQueries({ queryKey: ['reward-requests'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setDialogState({
        isOpen: false,
        requestId: null,
        action: null,
        message: ''
      });
    }
  };

  const handleDialogChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDialogState(prev => ({
      ...prev,
      message: e.target.value
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aprobado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rechazado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
    }
  };

  const filteredRequests = requests.filter(request => {
    if (activeTab === 'all') return true;
    return request.status === activeTab;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <ActionDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirm}
        title={dialogState.action === 'approve' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
        description={dialogState.action === 'approve'
          ? '¿Estás seguro de que deseas aprobar esta solicitud?'
          : '¿Estás seguro de que deseas rechazar esta solicitud?'
        }
        message={dialogState.message}
        onMessageChange={handleDialogChange}
        actionLabel={dialogState.action === 'approve' ? 'Aprobar' : 'Rechazar'}
        variant={dialogState.action === 'approve' ? 'default' : 'destructive'}
        isLoading={false}
      />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Solicitudes de Recompensas</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="pending"
            onValueChange={setActiveTab}
            className="w-full space-y-4"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="approved">Aprobadas</TabsTrigger>
              <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Recompensa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Mensaje</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">#{request.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{request.user.username}</span>
                          <span className="text-sm text-muted-foreground">{request.user.email}</span>
                          <span className="text-xs text-muted-foreground">ID: {request.user_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={request.reward.image_url}
                            alt={request.reward.name}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                          <span>{request.reward.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-2">
                          {getStatusBadge(request.status)}
                          {request.status === 'pending' && (
                            <div className="flex space-x-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs bg-green-50 text-green-700 hover:bg-green-100"
                                onClick={() => handleAction(request.id, 'approve')}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Aprobar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs bg-red-50 text-red-700 hover:bg-red-100"
                                onClick={() => handleAction(request.id, 'reject')}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {request.admin_message || '-'}
                      </TableCell>
                      <TableCell>
  {request.created_at ? new Date(request.created_at).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
  }) : 'Fecha no disponible'}
</TableCell>
                    </TableRow>
                  ))}
                  {filteredRequests.length === 0 && (
                    <TableRow key="no-requests">
                      <TableCell colSpan={6} className="h-24 text-center">
                        No hay solicitudes para mostrar
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardRequestsList;
