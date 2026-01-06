import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// Quitamos los imports de tipos de recharts que daban problemas o no se usaban
import { Loader2, TrendingUp, Calendar, ChevronDown } from 'lucide-react';
import { API_BASE_URL } from '@/config'; 

// 1. Interfaz para los datos del gráfico
interface ChartData {
  name: string;
  points: number;
}

interface AffiliateStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number | null;
  userName: string;
}

// 2. Interfaz manual simple para el Tooltip (Sin depender de Recharts)
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

// Componente visual del Tooltip
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl">
        <p className="text-gray-500 text-xs mb-1">{label}</p>
        <p className="text-green-600 font-bold text-sm">
          {payload[0].value} pts
        </p>
      </div>
    );
  }
  return null;
};

export const AffiliateStatsModal: React.FC<AffiliateStatsModalProps> = ({ 
  isOpen, 
  onClose, 
  userId, 
  userName 
}) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const availableYears = [currentYear - 1, currentYear, currentYear + 1];

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/affiliate/${userId}/stats?year=${selectedYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          setData(result.history as ChartData[]); 
        }
      } catch (error) {
        console.error("Error cargando estadísticas", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && userId) {
      fetchHistory();
    }
  }, [isOpen, userId, selectedYear]); 

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-white rounded-xl shadow-2xl border-0">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                Rendimiento: {userName}
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1 ml-12">
                Puntos acumulados mes a mes
              </p>
            </div>

            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"/>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="pl-9 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm font-semibold text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>

          </div>
        </DialogHeader>

        <div className="mt-6 min-h-[350px] flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-green-500" />
                <span className="text-sm text-gray-400 font-medium">Cargando datos del {selectedYear}...</span>
            </div>
          ) : (
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#9CA3AF' }} 
                    axisLine={false} 
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#9CA3AF' }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  
                  {/* 3. SOLUCIÓN FINAL: Usamos 'as unknown as CustomTooltipProps'
                      Esto evita el error de tipos de Recharts y cumple con ESLint (sin usar 'any') */}
                  <Tooltip 
                    cursor={{ fill: '#F9FAFB' }}
                    content={(props) => {
                        const customProps = props as unknown as CustomTooltipProps;
                        return <CustomTooltip {...customProps} />;
                    }}
                  />
                  
                  <Bar 
                    dataKey="points" 
                    fill="#10B981" 
                    radius={[6, 6, 0, 0]} 
                    barSize={32}
                    name="Puntos"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};