import React, { useState, useEffect } from 'react';
import { 
  getCommissionSummary, 
  withdrawCommissions, 
  getHistory,
  TransactionHistoryItem 
} from '@/services/commissionService';
import { getUserProfile } from '@/services/userService';
import { toast } from '@/components/ui/use-toast';
import { AtipayCoin } from '@/components/ui/AtipayCoin';
import { Loader2, Wallet, ArrowDownLeft, ArrowUpRight, FileText, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '@/lib/utils';

interface CommissionSummaryData {
  summary: {
    total_pendientes: number;
    total_retiradas: number;
  };
}

const Commissions: React.FC = () => {
  const [summary, setSummary] = useState<CommissionSummaryData | null>(null);
  const [history, setHistory] = useState<TransactionHistoryItem[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, historyRes, profileRes] = await Promise.all([
        getCommissionSummary(),
        getHistory(), 
        getUserProfile()
      ]);
      setSummary(summaryRes);
      setHistory(historyRes);
      setUserPoints(Number(profileRes.accumulated_points) || 0);
    } catch (err: any) {
      console.error("Error:", err);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos.' });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!summary?.summary.total_pendientes || summary.summary.total_pendientes <= 0) return;
    try {
      setIsWithdrawing(true);
      const result = await withdrawCommissions();
      if (result.success) {
        toast({ title: '¡Éxito!', description: result.message, className: "bg-green-600 text-white border-none" });
        fetchData(); 
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Filtros para separar las tablas
  const commissionsList = history.filter(item => item.type === 'commission');
  const withdrawalsList = history.filter(item => item.type === 'withdrawal');

  return (
    <div className="p-6 space-y-8 min-h-screen bg-[#F8F9FA]"> {/* Fondo gris muy suave como en la foto */}
      
      {/* 1. ENCABEZADO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mis Comisiones</h1>
          <p className="text-gray-500 mt-1">Administra y retira tus comisiones generadas</p>
        </div>
        
        <div className="flex items-center gap-3">
            <button onClick={fetchData} className="p-2 text-gray-400 hover:text-green-600 transition-colors" title="Actualizar">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !summary?.summary.total_pendientes || userPoints < 100}
                className={`flex items-center px-6 py-2.5 rounded-lg font-medium text-white shadow-sm transition-all ${
                isWithdrawing || !summary?.summary.total_pendientes || userPoints < 100
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#10B981] hover:bg-[#059669]' // Verde exacto de Atipay
                }`}
            >
                {isWithdrawing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</> : 'Retirar Comisiones'}
            </button>
        </div>
      </div>

      {/* 2. TARJETAS (ESTILO IMAGE_D62203) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Mis Puntos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50 text-green-600">
               <Clock className="w-6 h-6" />
            </div>
            <div>
               <p className="text-sm text-gray-500 font-medium">Mis puntos</p>
               <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-gray-800">{loading ? "..." : userPoints.toLocaleString('es-ES')}</span>
                  <AtipayCoin size="sm" />
               </div>
            </div>
        </div>

        {/* Retiradas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-50 text-green-600">
               <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
               <p className="text-sm text-gray-500 font-medium">Retiradas</p>
               <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-gray-800">{loading ? "..." : summary?.summary.total_retiradas.toFixed(2)}</span>
                  <AtipayCoin size="sm" />
               </div>
            </div>
        </div>

        {/* Disponible (Verde sólido) */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
            <p className="text-sm font-medium opacity-90">Disponible para retiro</p>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl font-bold">{(summary?.summary.total_pendientes || 0).toFixed(2)}</span>
                <AtipayCoin size="md" className="text-yellow-300" />
            </div>
            <p className="text-xs mt-2 opacity-80">
               {userPoints >= 100 ? "¡Tienes los puntos necesarios!" : `Te faltan ${100 - userPoints} pts para calificar.`}
            </p>
        </div>
      </div>

      {/* 3. TABLA 1: COMISIONES (ESTILO LIMPIO) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
           <FileText className="w-5 h-5 text-green-600" />
           <h2 className="text-lg font-bold text-gray-800">Historial de Comisiones</h2>
        </div>

        {loading ? (
           <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>
        ) : commissionsList.length === 0 ? (
           <div className="p-12 text-center text-gray-400 text-sm">No hay comisiones registradas.</div>
        ) : (
           <div className="overflow-x-auto">
             <table className="min-w-full">
               <thead>
                 <tr className="border-b border-gray-100 text-xs uppercase text-gray-400 font-semibold tracking-wider text-left">
                   <th className="px-6 py-4">Fecha</th>
                   <th className="px-6 py-4 text-center">Tipo</th>
                   <th className="px-6 py-4">Detalle / Origen</th>
                   <th className="px-6 py-4 text-right">Puntos</th>
                   <th className="px-6 py-4 text-right">Monto</th>
                   <th className="px-6 py-4 text-center">Estado</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {commissionsList.map((item, i) => (
                   <tr key={i} className="hover:bg-gray-50 transition-colors text-sm">
                     <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{new Date(item.date).toLocaleDateString('es-ES')}</div>
                        <div className="text-xs">{new Date(item.date).toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'})}</div>
                     </td>
                     <td className="px-6 py-4 text-center">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-0 font-medium px-3">
                           <ArrowDownLeft className="w-3 h-3 mr-1" /> Ingreso
                        </Badge>
                     </td>
                     <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">Nivel {item.level} - {item.source_type === 'purchase' ? 'Compra' : 'Inversión'}</div>
                        <div className="text-xs text-gray-500">De: {item.from_user || 'Usuario'}</div>
                     </td>
                     <td className="px-6 py-4 text-right text-blue-600 font-medium">+{item.points} pts</td>
                     <td className="px-6 py-4 text-right font-bold text-green-600">+{formatCurrency(Number(item.amount))}</td>
                     <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                           Disponible
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </div>

      {/* 4. TABLA 2: RETIROS REALIZADOS (ESTILO LIMPIO) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
           <Wallet className="w-5 h-5 text-orange-500" />
           <h2 className="text-lg font-bold text-gray-800">Historial de Retiros Realizados</h2>
        </div>

        {loading ? (
           <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
        ) : withdrawalsList.length === 0 ? (
           <div className="p-12 text-center text-gray-400 text-sm">No has realizado retiros aún.</div>
        ) : (
           <div className="overflow-x-auto">
             <table className="min-w-full">
               <thead>
                 <tr className="border-b border-gray-100 text-xs uppercase text-gray-400 font-semibold tracking-wider text-left">
                   <th className="px-6 py-4">Fecha</th>
                   <th className="px-6 py-4 text-center">Tipo</th>
                   <th className="px-6 py-4">Descripción</th>
                   <th className="px-6 py-4 text-right">Monto</th>
                   <th className="px-6 py-4 text-center">Estado</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {withdrawalsList.map((item, i) => (
                   <tr key={i} className="hover:bg-gray-50 transition-colors text-sm">
                     <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{new Date(item.date).toLocaleDateString('es-ES')}</div>
                        <div className="text-xs">{new Date(item.date).toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'})}</div>
                     </td>
                     <td className="px-6 py-4 text-center">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0 font-medium px-3">
                           <ArrowUpRight className="w-3 h-3 mr-1" /> Retiro
                        </Badge>
                     </td>
                     <td className="px-6 py-4 text-gray-600">Transferencia a Billetera Principal</td>
                     <td className="px-6 py-4 text-right font-bold text-red-500">-{formatCurrency(Number(item.amount))}</td>
                     <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                           Completado
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </div>

    </div>
  );
};

export default Commissions;