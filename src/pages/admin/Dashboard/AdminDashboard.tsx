import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";
import { getPendingInvestments } from "@/services/investmentService";
import { getRecharges, type Recharge } from "@/services/atipayRechargeService";
import { RechargeList } from "@/pages/admin/Dashboard/components/recharges/RechargeList";
import { PendingInvestments } from "@/pages/admin/Dashboard/components/investments/PendingInvestments";



export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("investments");

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [isLoadingRecharges, setIsLoadingRecharges] = useState(false);
  const [rechargeFilter, setRechargeFilter] = useState("all");
  const [pendingInvestmentsCount, setPendingInvestmentsCount] = useState(0);
  const [pendingRechargesCount, setPendingRechargesCount] = useState(0);

  const loadRecharges = useCallback(async () => {
    setIsLoadingRecharges(true);
    try {
      const data = await getRecharges();
      setRecharges(data);

      const pendingCount = data.filter(r => r.status === 'pending').length;
      setPendingRechargesCount(pendingCount);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
      toast.error("Error al cargar recargas", { description: errorMessage });
    } finally {
      setIsLoadingRecharges(false);
    }
  }, []);

  const loadPendingInvestmentsCount = useCallback(async () => {
    try {
      const pendingInvestments = await getPendingInvestments();
      setPendingInvestmentsCount(pendingInvestments.length);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error loading pending investments count:', errorMessage);
      setPendingInvestmentsCount(0);
    }
  }, []);

  useEffect(() => {
    loadRecharges();
    loadPendingInvestmentsCount();
  }, [loadRecharges, loadPendingInvestmentsCount]);

  useEffect(() => {
    loadPendingInvestmentsCount();
    const interval = setInterval(loadPendingInvestmentsCount, 30000);
    return () => clearInterval(interval);
  }, [loadPendingInvestmentsCount]);

  useEffect(() => {
    if (activeTab === "recharges") {
      loadRecharges();
    }
  }, [activeTab, loadRecharges]);
  
  return (
    <div className="p-3 sm:p-4 md:p-6 w-full overflow-x-hidden">
      <div className="flex flex-col space-y-4 sm:space-y-6">
        
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-4 sm:space-y-6"
        >
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <TabsList className="grid grid-cols-2 w-full md:w-auto md:inline-flex">
              <TabsTrigger value="investments" className="text-xs sm:text-sm px-2 sm:px-4">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span>Inversiones</span>
                  {pendingInvestmentsCount > 0 && (
                    <span className="inline-flex items-center justify-center h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-red-500 text-white text-[10px] sm:text-xs">
                      {pendingInvestmentsCount}
                    </span>
                  )}
                </div>
              </TabsTrigger>
              <TabsTrigger value="recharges" className="text-xs sm:text-sm px-2 sm:px-4">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span>Recargas</span>
                  {pendingRechargesCount > 0 && (
                    <span className="inline-flex items-center justify-center h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-red-500 text-white text-[10px] sm:text-xs">
                      {pendingRechargesCount}
                    </span>
                  )}
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="investments" className="pt-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <h2 className="text-base sm:text-lg font-semibold">Inversiones Pendientes</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="flex items-center gap-1 text-xs sm:text-sm w-full sm:w-auto justify-center"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                Actualizar
              </Button>
            </div>
            <div className="overflow-x-auto">
              <PendingInvestments />
            </div>
          </TabsContent>

          <TabsContent
            value="recharges"
            className="pt-2 space-y-4 min-h-[320px]"
          >
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Select
                value={rechargeFilter}
                onValueChange={(v: 'all' | 'pending' | 'approved' | 'rejected') => setRechargeFilter(v)}
              >
                <SelectTrigger className="w-full sm:w-[180px] text-sm">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="approved">Aprobadas</SelectItem>
                  <SelectItem value="rejected">Rechazadas</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={loadRecharges}
                disabled={isLoadingRecharges}
                className="text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
              >
                {isLoadingRecharges ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-[#3EB363]" />
                ) : (
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
                {isLoadingRecharges ? "Cargando" : "Actualizar"}
              </Button>
            </div>
            <div className="overflow-x-auto">
              {isLoadingRecharges ? (
                <div className="flex items-center justify-center h-48 w-full">
                  <div className="flex flex-col items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-[#3EB363]" />
                    Cargando recargas...
                  </div>
                </div>
              ) : (
                <RechargeList
                  recharges={recharges.filter(recharge => {
                    if (rechargeFilter === 'all') return true;
                    return recharge.status === rechargeFilter;
                  })}
                  onReload={loadRecharges}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
