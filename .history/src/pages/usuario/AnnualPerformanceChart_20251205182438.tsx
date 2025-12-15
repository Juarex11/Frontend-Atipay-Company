import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

// Datos de ejemplo (Esto luego vendrá de tu API)
const dataDefault = [
  { name: 'ENE', puntos: 45 }, { name: 'FEB', puntos: 60 },
  { name: 'MAR', puntos: 85 }, { name: 'ABR', puntos: 120 },
  { name: 'MAY', puntos: 76 }, { name: 'JUN', puntos: 30 },
  { name: 'JUL', puntos: 95 }, { name: 'AGO', puntos: 150 },
  { name: 'SEP', puntos: 110 }, { name: 'OCT', puntos: 55 },
  { name: 'NOV', puntos: 100 }, { name: 'DIC', puntos: 0 },
];

const AnnualPerformanceChart = ({ data = dataDefault, totalAnual = 926 }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-50 rounded-lg">
             <TrendingUp size={20} className="text-green-600"/>
          </div>
          <h3 className="text-lg font-bold text-gray-800">Rendimiento Anual</h3>
        </div>
        <div className="bg-green-50 text-green-700 px-4 py-1 rounded-full text-sm font-bold border border-green-100">
          Total Año: {totalAnual} pts
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-6">Tus puntos mes a mes durante el 2025</p>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }} 
              dy={10}
            />
            <Tooltip 
              cursor={{ fill: '#F3F4F6' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Bar dataKey="puntos" radius={[4, 4, 4, 4]} barSize={24}>
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