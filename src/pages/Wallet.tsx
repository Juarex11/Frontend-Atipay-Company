import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { RechargeDialog } from "@/components/wallet/RechargeDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, History, Plus } from "lucide-react";

export default function Wallet() {
  const { user } = useAuth();
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mi Billetera</h1>
            <p className="text-muted-foreground">
              Administra tus fondos y realiza operaciones
            </p>
          </div>
          <Button onClick={() => setShowRechargeDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Recargar Saldo
          </Button>
        </div>

        <Tabs defaultValue="balance" className="w-full">
          <TabsList>
            <TabsTrigger value="balance">
              <CreditCard className="mr-2 h-4 w-4" />
              Saldo
            </TabsTrigger>
            <TabsTrigger value="history" disabled>
              <History className="mr-2 h-4 w-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="balance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Saldo Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <WalletBalance />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Transacciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Próximamente: Historial detallado de transacciones
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <RechargeDialog 
        open={showRechargeDialog} 
        onOpenChange={setShowRechargeDialog} 
      />
    </div>
  );
}
