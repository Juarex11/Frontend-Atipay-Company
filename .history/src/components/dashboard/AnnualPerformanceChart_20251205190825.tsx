import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

// Interface para los props
interface ChartProps {
  data: Array<{ name: string; puntos: number }>;
  totalAnual: number;
}

const AnnualPerformanceChart = ({ data = [], totalAnual = 0 }: ChartProps) => {
  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col w-full">
      
      {/* Encabezado Responsivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-50 rounded-lg shrink-0">
             <TrendingUp size={20} className="text-green-600"/>
          </div>
          <h3 className="text-lg font-bold text-gray-800">Rendimiento Anual</h3>
        </div>
        <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100 self-start sm:self-auto">
          Total Año: {totalAnual} pts
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4 md:mb-6">Tus puntos mes a mes durante el 2025</p>

      {/* Contenedor Gráfica:
          - flex-1: Ocupa el espacio restante
          - min-h-[250px]: Altura mínima para que se vea bien en celular
          - min-w-0: CLAVE para que no se desborde en flex/grid
      */}
      <div className="flex-1 w-full min-h-[250px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 500 }} 
              dy={10}
              interval={0} // Muestra todos los meses aunque sea apretado
            />
            <Tooltip 
              cursor={{ fill: '#F3F4F6' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Bar dataKey="puntos" radius={[4, 4, 4, 4]} barSize={20} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.puntos > 0 ? '#10B981' : '#E5E7EB'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnnualPerformanceChart;