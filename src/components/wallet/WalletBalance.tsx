import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, RefreshCw } from "lucide-react";
import { RechargeDialog } from "./RechargeDialog";
import { getMyRecharges, type Recharge } from "@/services/atipayRechargeService";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

interface WalletBalanceData {
  balance: number;
  pendingRecharges: number;
  lastUpdated: string;
}

export function WalletBalance() {
  // Inicializamos el estado con valores por defecto para evitar null
  const [balance, setBalance] = useState<WalletBalanceData>({
    balance: 0,
    pendingRecharges: 0,
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRechargeDialogOpen, setIsRechargeDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const lastCheckedRef = useRef<Date>(new Date());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para cargar el saldo aprobado
  const fetchBalance = async (): Promise<WalletBalanceData> => {
    try {
      setIsLoading(true);
      // Obtener todas las recargas
      const recharges = await getMyRecharges();
      
      // Calcular saldo aprobado y recargas pendientes
      let approvedBalance = 0;
      let pendingRecharges = 0;
      
      recharges.forEach((recharge: Recharge) => {
        if (recharge.status === 'approved') {
          approvedBalance += Number(recharge.amount) || 0;
        } else if (recharge.status === 'pending') {
          pendingRecharges += 1;
        }
      });
      
      const walletData: WalletBalanceData = {
        balance: approvedBalance,
        pendingRecharges,
        lastUpdated: new Date().toISOString()
      };
      
      setBalance(walletData);
      return walletData;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar si hay recargas recientemente aprobadas
  const checkForApprovedRecharges = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await getMyRecharges();
      const recharges = Array.isArray(response) ? response : [];
      
      // Encontrar recargas aprobadas recientemente
      const recentApproved = recharges.find((r: Recharge) => {
        if (!r.processed_at) return false;
        
        const processedDate = new Date(r.processed_at);
        return r.status === 'approved' && processedDate > lastCheckedRef.current;
      });
      
      if (recentApproved) {
        console.log('Recarga aprobada encontrada:', recentApproved);
        lastCheckedRef.current = new Date();
        const newBalance = await fetchBalance();
        
        // Mostrar notificación con el monto aprobado
        toast({
          title: '¡Recarga aprobada!',
          description: `Se ha aprobado tu recarga de S/ ${recentApproved.amount}`,
          variant: 'default'
        });
        return newBalance;
      }
    } catch (error) {
      console.error('Error verificando recargas aprobadas:', error);
      toast({
        title: 'Error',
        description: 'Error al verificar recargas',
        variant: 'destructive'
      });
    }
  }, [toast, user]);

  // Efecto para cargar el saldo inicial y configurar la verificación periódica
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchBalance();
        // Configurar intervalo para verificar recargas aprobadas cada 10 segundos
        checkIntervalRef.current = setInterval(checkForApprovedRecharges, 10000);
      } catch (error) {
        console.error('Error al cargar el saldo:', error);
        toast({
          title: 'Error',
          description: 'Error al cargar el saldo',
          variant: 'destructive'
        });
      }
    };
    
    loadData();
    
    // Limpiar el intervalo al desmontar el componente
    return () => {
      if (checkIntervalRef.current !== null) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [checkForApprovedRecharges, toast]);

  if (!user) {
    return null; // No mostrar si el usuario no está autenticado
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">Mi Saldo</CardTitle>
            <CardDescription>Gestiona tus fondos disponibles</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={fetchBalance}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Wallet className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  S/. {(balance?.balance || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm text-muted-foreground">
                  Saldo disponible
                </span>
              </div>
              
              {(balance?.pendingRecharges || 0) > 0 && (
                <div className="text-sm text-yellow-600 flex items-center gap-1">
                  <span className="animate-pulse">•</span>
                  {balance.pendingRecharges} recarga{balance.pendingRecharges !== 1 ? 's' : ''} pendiente{balance.pendingRecharges !== 1 ? 's' : ''} de aprobación
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Actualizado: {balance.lastUpdated ? new Date(balance.lastUpdated).toLocaleTimeString('es-PE', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) : '--:--:--'}
              </div>
            </div>
          )}
          
          <Button 
            size="sm" 
            onClick={() => setIsRechargeDialogOpen(true)}
            className="ml-4"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            Recargar
          </Button>
        </div>
      </CardContent>
      
      <RechargeDialog 
        open={isRechargeDialogOpen} 
        onOpenChange={setIsRechargeDialogOpen}
        onRechargeSuccess={() => {
          fetchBalance().then(() => {
            toast({
              title: 'Éxito',
              description: 'Recarga solicitada correctamente. Está pendiente de aprobación.',
              variant: 'default'
            });
          });
        }}
      />
    </Card>
  );
}
