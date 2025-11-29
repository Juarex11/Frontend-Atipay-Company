import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Check, X, Clock, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { getPendingInvestments, approveInvestment, rejectInvestment } from "@/services/investmentService"
import { AtipayCoin } from "@/components/ui/AtipayCoin"

interface Investment {
  id: number
  user_id: number
  promotion_id: number
  status: string
  admin_message: string | null
  daily_earning: number
  total_earning: number
  already_earned: number
  last_earned_at: string | null
  approved_at: string | null
  rejected_at: string | null
  start_date: string | null
  end_date: string | null
  user: {
    id: number
    username: string
    email: string
    role_id: number
    status: string
    atipay_money: number
    accumulated_points: number
    reference_code: string
    referred_by: number | null
    registration_date: string
    registration_time: string
    referral_url: string
  }
  promotion: {
    id: number
    name: string
    percentaje: number
    atipay_price_promotion: number
    duration_months: number
    status: string
  }
}

interface ApprovalModalState {
  isOpen: boolean;
  investmentId: number | null;
  message: string;
  isProcessing: boolean;
}

export function PendingInvestments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<{[key: number]: 'approving' | 'rejecting' | null}>({});
  const [approvalModal, setApprovalModal] = useState<ApprovalModalState>({
    isOpen: false,
    investmentId: null,
    message: '',
    isProcessing: false
  });

  const loadInvestments = async () => {
    try {
      setLoading(true);
      const data = await getPendingInvestments();
      setInvestments(data);
    } catch (error) {
      console.error('Error loading pending investments:', error);
      toast.error('Error al cargar las inversiones pendientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvestments();
  }, []);

  const handleApproveWithMessage = async (id: number) => {
    try {
      setProcessing(prev => ({ ...prev, [id]: 'approving' }));
      await approveInvestment(id);
      toast.success('Inversión aprobada correctamente');
      loadInvestments();
    } catch (error) {
      console.error('Error approving investment:', error);
      toast.error('Error al aprobar la inversión');
    } finally {
      setProcessing(prev => ({...prev, [id]: null}));
    }
  };

  const handleReject = async (id: number, reason: string = 'Rechazado por el administrador') => {
    try {
      setProcessing(prev => ({...prev, [id]: 'rejecting'}));
      await rejectInvestment(id, reason);
      toast.success('Inversión rechazada correctamente');
      setInvestments(prev => prev.filter(inv => inv.id !== id));
    } catch (error) {
      console.error('Error rejecting investment:', error);
      toast.error('Error al rechazar la inversión');
    } finally {
      setProcessing(prev => ({...prev, [id]: null}));
    }
  };

  const openApprovalModal = (id: number) => {
    setApprovalModal({
      isOpen: true,
      investmentId: id,
      message: 'Su inversión ha sido aprobada exitosamente.',
      isProcessing: false
    });
  };

  const closeApprovalModal = () => {
    setApprovalModal(prev => ({
      ...prev,
      isOpen: false,
      isProcessing: false
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <Clock className="w-6 h-6 mr-2" />
        <p>No hay inversiones pendientes por revisar</p>
      </div>
    );
  }

  if (investments.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No hay inversiones pendientes</h3>
        <p className="text-muted-foreground mt-2">
          No hay solicitudes de inversión pendientes de revisión en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {investments.map((investment) => (
          <Card key={investment.id} className="overflow-hidden">
            <CardContent className="p-4 bg-white border border-green-100 rounded-lg shadow-sm">
              {/* Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-green-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-green-700">#{investment.id}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{investment.user.username}</p>
                    <p className="text-xs text-gray-500">{investment.user.email}</p>
                  </div>
                </div>
                {(() => {
                  const statusConfig = {
                    pending: { variant: 'secondary', label: 'Pendiente' },
                    approved: { variant: 'default', label: 'Aprobado' },
                    rejected: { variant: 'destructive', label: 'Rechazado' }
                  };
                  const config = statusConfig[investment.status as keyof typeof statusConfig] || { variant: 'default', label: investment.status };
                  
                  return (
                    <Badge 
                      variant={config.variant as 'secondary' | 'default' | 'destructive'}
                      className="h-6 text-xs px-2 font-medium"
                    >
                      {config.label}
                    </Badge>
                  );
                })()}
              </div>

              {/* Detalles de la Inversión */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs font-medium text-green-700 mb-1">Inversión</p>
                    <div className="flex items-center gap-1">
                      <AtipayCoin size="sm" className="w-4 h-4 text-green-700" />
                      <span className="text-lg font-bold text-green-700">
                        {Number(investment.promotion.atipay_price_promotion).toLocaleString('es-ES', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                          useGrouping: true
                        }).replace(/\./g, '|')
                          .replace(/,/g, '.')
                          .replace(/\|/g, ',')}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs font-medium text-green-700 mb-1">Ganancia Diaria</p>
                    <div className="flex items-center gap-1">
                      <AtipayCoin size="sm" className="w-4 h-4 text-green-700" />
                      <span className="text-lg font-bold text-green-700">
                        +{Number(investment.daily_earning).toLocaleString('es-ES', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                          useGrouping: true
                        }).replace(/\./g, '|')
                          .replace(/,/g, '.')
                          .replace(/\|/g, ',')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs font-medium text-green-700 mb-2">Detalles de la Promoción</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-600">Promoción</p>
                      <p className="text-sm font-medium">{investment.promotion.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Duración</p>
                      <p className="text-sm font-medium">{investment.promotion.duration_months} meses</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Retorno</p>
                      <p className="text-sm font-medium">{investment.promotion.percentaje}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Estado</p>
                      <p className="text-sm font-medium">{investment.promotion.status}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs font-medium text-green-700 mb-1">Ganancia Total</p>
                      <div className="flex items-center gap-1">
                        <AtipayCoin size="xs" className="w-3.5 h-3.5 text-gray-900" />
                        <span className="text-sm text-gray-900">
                          {Number(investment.total_earning).toLocaleString('es-ES', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                            useGrouping: true
                          }).replace(/\./g, '|')
                            .replace(/,/g, '.')
                            .replace(/\|/g, ',')}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs font-medium text-green-700 mb-1">Ganado</p>
                      <div className="flex items-center gap-1">
                        <AtipayCoin size="xs" className="w-3.5 h-3.5 text-gray-900" />
                        <span className="text-sm text-gray-900">
                          {Number(investment.already_earned).toLocaleString('es-ES', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                            useGrouping: true
                          }).replace(/\./g, '|')
                            .replace(/,/g, '.')
                            .replace(/\|/g, ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-green-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-600" 
                      style={{ 
                        width: `${Math.min(100, (investment.already_earned / (investment.total_earning || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{Math.round((investment.already_earned / (investment.total_earning || 1)) * 100)}% completado</span>
                    <span className="flex items-center gap-1">
                      <AtipayCoin size="xs" className="w-3 h-3" />
                      {Number(investment.already_earned).toLocaleString('es-ES', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                        useGrouping: true
                      }).replace(/\./g, '|')
                        .replace(/,/g, '.')
                        .replace(/\|/g, ',')}
                      {' de '}
                      <AtipayCoin size="xs" className="w-3 h-3" />
                      {Number(investment.total_earning).toLocaleString('es-ES', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                        useGrouping: true
                      }).replace(/\./g, '|')
                        .replace(/,/g, '.')
                        .replace(/\|/g, ',')}
                    </span>
                  </div>
                </div>
                
                {/* Fechas */}
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs font-medium text-green-700 mb-2">Fechas Importantes</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-600">Registro</p>
                      <p className="text-xs font-medium">
                        {new Date(investment.user.registration_date).toLocaleDateString('es-ES')} {investment.user.registration_time}
                      </p>
                    </div>
                    {investment.start_date && (
                      <div>
                        <p className="text-xs text-gray-600">Inicio</p>
                        <p className="text-xs font-medium">
                          {new Date(investment.start_date).toLocaleString('es-ES')}
                        </p>
                      </div>
                    )}
                    {investment.end_date && (
                      <div>
                        <p className="text-xs text-gray-600">Fin</p>
                        <p className="text-xs font-medium">
                          {new Date(investment.end_date).toLocaleString('es-ES')}
                        </p>
                      </div>
                    )}
                    {investment.last_earned_at && (
                      <div>
                        <p className="text-xs text-gray-600">Última Ganancia</p>
                        <p className="text-xs font-medium">
                          {new Date(investment.last_earned_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                    )}
                    {investment.approved_at && (
                      <div>
                        <p className="text-xs text-gray-600">Aprobado</p>
                        <p className="text-xs font-medium">
                          {new Date(investment.approved_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                    )}
                    {investment.rejected_at && (
                      <div>
                        <p className="text-xs text-gray-600">Rechazado</p>
                        <p className="text-xs font-medium">
                          {new Date(investment.rejected_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Información de Referido */}
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs font-medium text-green-700 mb-2">Información de Referido</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-600">Código de Referencia</p>
                      <p className="text-xs font-medium">{investment.user.reference_code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Referido por</p>
                      <p className="text-xs font-medium">{investment.user.referred_by ? 'Sí' : 'No aplica'}</p>
                    </div>
                  </div>
                </div>

                {investment.admin_message && (
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs font-medium text-amber-700 mb-1">Mensaje del Administrador</p>
                    <p className="text-sm text-amber-800">{investment.admin_message}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 mt-3 border-t border-green-100">
                <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 sm:flex-none items-center gap-1 sm:gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 text-xs sm:text-sm h-8"
                    onClick={() => openApprovalModal(investment.id)}
                    disabled={!!processing[investment.id]}
                  >
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">Aprobar con Mensaje</span>
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 sm:flex-none h-8 text-xs sm:text-sm px-2 sm:px-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-sm transition-all"
                    onClick={() => handleApproveWithMessage(investment.id)}
                    disabled={!!processing[investment.id]}
                  >
                    {processing[investment.id] === 'approving' ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-0 sm:mr-1" />
                    ) : (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1 flex-shrink-0" />
                    )}
                    <span className="truncate">Aprobar</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 sm:flex-none h-8 text-xs sm:text-sm px-2 sm:px-3 col-span-2 sm:col-span-1"
                    onClick={() => handleReject(investment.id, 'Inversión rechazada por el administrador')}
                    disabled={!!processing[investment.id]}
                  >
                    {processing[investment.id] === 'rejecting' ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-0 sm:mr-1" />
                    ) : (
                      <X className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1 flex-shrink-0" />
                    )}
                    <span className="truncate">Rechazar</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

// ...
      {/* Approval Modal */}
      {approvalModal.isOpen && approvalModal.investmentId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Aprobar Inversión</h3>
            </div>
            <div className="space-y-2">
              <label htmlFor="approval-message" className="block text-sm font-medium text-gray-700">
                Mensaje de aprobación
              </label>
              <textarea
                id="approval-message"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={4}
                value={approvalModal.message}
                onChange={(e) => setApprovalModal(prev => ({...prev, message: e.target.value}))}
                placeholder="Escribe un mensaje para el usuario..."
              />
              <p className="text-xs text-gray-500">
                Este mensaje se enviará al usuario junto con la notificación de aprobación.
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={closeApprovalModal}
                disabled={approvalModal.isProcessing}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  await handleApproveWithMessage(approvalModal.investmentId!);
                  closeApprovalModal();
                }}
                disabled={approvalModal.isProcessing || !approvalModal.message.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {approvalModal.isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Confirmar Aprobación
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
