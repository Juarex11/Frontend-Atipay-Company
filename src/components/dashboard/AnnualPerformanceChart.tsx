import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, YAxis } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface ChartData {
  name: string;
  points: number; 
  qualified?: boolean;
}

interface AnnualPerformanceChartProps {
  data: ChartData[];
  year: number;
  onYearChange: (year: number) => void;
  totalAnual?: number;
}

const AnnualPerformanceChart = ({ 
  data = [], 
  year, 
  onYearChange, 
  totalAnual = 0 
}: AnnualPerformanceChartProps) => {

  // =========================================================================
  // ⚙️ GENERADOR DE AÑOS AUTOMÁTICO (LÓGICA DE PRODUCCIÓN)
  // =========================================================================
  // 1. AÑO BASE: El sistema se lanzó/tiene datos desde 2024 (sacado de tu DB).
  const startYear = 2024;
  
  // 2. AÑO ACTUAL: Detecta automáticamente el año del sistema (Ej: 2025, 2028, etc).
  const currentYear = new Date().getFullYear();
  
  // 3. GENERACIÓN DINÁMICA: Crea la lista desde 2024 hasta el "Año Actual + 1".
  //    Ejemplo en 2025 -> [2024, 2025, 2026]
  //    Ejemplo en 2028 -> [2024, 2025, 2026, 2027, 2028, 2029]
  //    ¡No necesitas tocar código nunca más!
  const years: number[] = [];
  for (let y = startYear; y <= currentYear + 1; y++) {
    years.push(y);
  }
  // Ordenamos de mayor a menor si prefieres ver el actual primero, o al revés.
  // years.sort((a, b) => b - a); 
  // =========================================================================

  const activeColor = '#10B981'; 
  const inactiveColor = '#D1FAE5'; 

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col w-full">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-50 rounded-lg shrink-0">
             <TrendingUp size={20} className="text-green-600"/>
          </div>
          <h3 className="text-lg font-bold text-gray-800">Rendimiento Anual</h3>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
           {totalAnual > 0 && (
             <div className="hidden sm:block bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
               Total: {totalAnual} pts
             </div>
           )}

           {/* Selector Dinámico */}
           <select 
             value={year}
             onChange={(e) => onYearChange(Number(e.target.value))}
             className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer font-medium text-gray-600"
           >
             {years.map((y) => (
               <option key={y} value={y}>{y}</option>
             ))}
           </select>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4 md:mb-6">
        Tus puntos mes a mes durante el <span className="font-bold text-gray-700">{year}</span>
      </p>

      {/* Gráfica */}
      <div className="flex-1 w-full min-h-[250px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 500 }} 
              dy={10}
              interval={0} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#9CA3AF' }} 
            />
            <Tooltip 
              cursor={{ fill: '#F3F4F6' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Bar dataKey="points" radius={[4, 4, 0, 0]} barSize={24} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.points > 0 ? activeColor : inactiveColor} 
                  fillOpacity={entry.points > 0 ? 1 : 0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnnualPerformanceChart;