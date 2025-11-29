import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SendTransferForm } from '@/components/transactions/SendTransferForm';
import { SentTransfersList } from '@/components/transactions/SentTransfersList';
import { ReceivedTransfersList } from '@/components/transactions/ReceivedTransfersList';
import { getUserProfile } from '@/services/userService';
import { AtipayCoin } from '@/components/ui/AtipayCoin';

export function Transfers() {
  const { user, updateUserBalance } = useAuth();
  const [activeTab, setActiveTab] = useState('send');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const getAvailableBalance = (): number => {
    if (user?.profile?.availableBalance && !isNaN(user.profile.availableBalance)) {
      return user.profile.availableBalance;
    } else if (user?.balance && !isNaN(user.balance)) {
      return user.balance;
    }
    return 0;
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  const refreshUserBalance = useCallback(async () => {
    try {
      setIsLoadingBalance(true);
      const userProfile = await getUserProfile();
      const balance = typeof userProfile.atipay_money === 'number' ? userProfile.atipay_money : 0;
      let availableBalance = 0;
      if (userProfile.withdrawable_balance) {
        const parsedValue = parseFloat(userProfile.withdrawable_balance);
        availableBalance = !isNaN(parsedValue) ? parsedValue : 0;
      }

      // Only update if the values have actually changed
      if (user?.balance !== balance || user?.profile?.availableBalance !== availableBalance) {
        updateUserBalance(balance, availableBalance);
      }
    } catch (error) {
      console.error('Error al actualizar el saldo del usuario:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [updateUserBalance, user?.balance, user?.profile?.availableBalance]);

  const handleTransferComplete = () => {
    handleRefresh();
    setActiveTab('sent');
    setTimeout(() => {
      refreshUserBalance();
    }, 1500);
  };

  // Only refresh when refreshTrigger changes
  useEffect(() => {
    const refresh = async () => {
      await refreshUserBalance();
    };
    refresh();
  }, [refreshTrigger, refreshUserBalance]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Transferencias</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Saldo disponible</CardTitle>
              <CardDescription>Tu saldo actual en Atipay</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBalance ? (
                <div className="flex flex-col gap-2">
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mt-2"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1 text-3xl font-bold text-green-600">
                    <AtipayCoin size="sm" className="w-5 h-5" />
                    {getAvailableBalance().toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Puedes transferir fondos a otros usuarios o recibir fondos de ellos.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <div className="mt-6">
            <SendTransferForm
              availableBalance={getAvailableBalance()}
              onTransferComplete={handleTransferComplete}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-2 text-sm text-gray-600 text-center">
            Haz clic en los botones para ver tus transferencias enviadas o recibidas
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 gap-2 p-1 bg-gray-200 rounded-lg">
              <TabsTrigger
                value="sent"
                className="border border-blue-500 data-[state=active]:border-blue-700 data-[state=active]:bg-blue-700 data-[state=active]:text-white hover:bg-blue-200 hover:text-blue-700 hover:border-blue-400 rounded-md transition-colors duration-200"
              >
                Enviadas
              </TabsTrigger>
              <TabsTrigger
                value="received"
                className="border border-green-500 data-[state=active]:border-green-700 data-[state=active]:bg-green-700 data-[state=active]:text-white hover:bg-green-200 hover:text-green-700 hover:border-green-400 rounded-md transition-colors duration-200"
              >
                Recibidas
              </TabsTrigger>
            </TabsList>
            <TabsContent value="sent" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Transferencias enviadas</CardTitle>
                  <CardDescription>
                    Listado de todas las transferencias que has enviado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SentTransfersList refreshTrigger={refreshTrigger} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="received" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Transferencias recibidas</CardTitle>
                  <CardDescription>
                    Listado de todas las transferencias que has recibido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReceivedTransfersList
                    refreshTrigger={refreshTrigger}
                    onTransferAction={handleRefresh}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
