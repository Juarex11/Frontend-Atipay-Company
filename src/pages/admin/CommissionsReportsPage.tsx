import { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  DollarSign, TrendingUp, Clock, CheckCircle, Users, 
  Filter, ChevronLeft, ChevronRight, FileSpreadsheet, FileType, Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { getDashboardReport } from '../../services/commissionService'; 
import type { CommissionReportResponse } from '../../types/commission';

const MONTHS_LIST = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
];

export default function CommissionsReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CommissionReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados de UI
  const [activeTab, setActiveTab] = useState<'dashboard' | 'details'>('dashboard');
  
  // --- FILTROS TABLA ---
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [filterLevel, setFilterLevel] = useState<number | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');
  
  // --- FILTROS GRÁFICO (INTELIGENTE) ---
  // Inicializamos con el año actual del sistema
  const [chartSelectedYear, setChartSelectedYear] = useState<number>(new Date().getFullYear());

  // --- ORDENAMIENTO ---
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getDashboardReport();
      setData(result);
      
      // LOGICA INTELIGENTE AL CARGAR:
      // Si el año actual no tiene datos, cambiamos al año más reciente disponible
      const currentYear = new Date().getFullYear();
      const yearsWithData = result.por_mes.map(m => m.year);
      const hasCurrentYear = yearsWithData.includes(currentYear);
      
      if (!hasCurrentYear && yearsWithData.length > 0) {
         // Buscamos el año máximo (más reciente) en los datos
         const maxYear = Math.max(...yearsWithData.filter(y => y !== null) as number[]);
         setChartSelectedYear(maxYear);
      }

    } catch (err) {
      console.error(err);
      setError('No se pudo cargar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(amount));
  };

  // --- CALCULADOS DINÁMICOS ---

  // Años disponibles en la BD (para selectores)
  const availableYears = useMemo(() => {
    if (!data) return [];
    // Combinamos años de 'por_mes' y 'detalle' para asegurar que cubrimos todo
    const yearsFromMonthly = data.por_mes.map(m => m.year);
    const yearsFromDetail = data.detalle.map(d => d.year);
    const allYears = new Set([...yearsFromMonthly, ...yearsFromDetail]);
    
    // Filtramos nulos y ordenamos descendente (2025, 2024...)
    return Array.from(allYears).filter(y => y).sort((a, b) => (b as number) - (a as number)) as number[];
  }, [data]);

  // Datos del Gráfico Filtrados por Año Seleccionado
  const chartData = useMemo(() => {
    if (!data) return [];
    
    // Filtramos solo los registros del año seleccionado
    const filteredByYear = data.por_mes.filter(item => item.year === chartSelectedYear);
    
    // Ordenamos por mes (1=Enero, 12=Diciembre) para que el gráfico se dibuje en orden cronológico
    // El backend a veces lo manda ordenado desc, así que nos aseguramos aquí.
    const sorted = filteredByYear.sort((a, b) => (a.month || 0) - (b.month || 0));

    return sorted.map(item => ({
      name: MONTHS_LIST.find(m => m.value === item.month)?.label || 'Desc', // Etiqueta con nombre de mes
      Pagadas: Number(item.pagadas),
      Pendientes: Number(item.pendientes),
    }));
  }, [data, chartSelectedYear]);


  // --- LÓGICA DE FILTRADO TABLA (Igual que antes) ---
  const filteredItems = useMemo(() => {
    if (!data) return [];
    let items = [...data.detalle];

    if (filterStatus === 'paid') items = items.filter(i => i.withdrawn === 1);
    if (filterStatus === 'pending') items = items.filter(i => i.withdrawn === 0);
    if (filterLevel !== 'all') items = items.filter(i => i.level === filterLevel);
    if (filterMonth !== 'all') items = items.filter(i => i.month === filterMonth);
    if (filterYear !== 'all') items = items.filter(i => i.year === filterYear);

    items.sort((a, b) => {
      const amountA = parseFloat(a.commission_amount);
      const amountB = parseFloat(b.commission_amount);
      return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
    });

    return items;
  }, [data, filterStatus, filterLevel, filterMonth, filterYear, sortOrder]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
  };

  // --- EXPORTACIÓN ---
  const exportToExcel = () => {
    if (!filteredItems.length) return;
    const dataToExport = filteredItems.map(item => ({
      ID: item.id,
      Fecha: `${item.month}/${item.year}`,
      Beneficiario: item.user.username,
      Referido: item.referred_user.username,
      Nivel: item.level,
      Monto: parseFloat(item.commission_amount),
      Estado: item.withdrawn ? 'Pagado' : 'Pendiente'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Comisiones");
    XLSX.writeFile(workbook, `Reporte_Comisiones_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    if (!filteredItems.length) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Comisiones - Atipay', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Fecha: ${new Date().toLocaleDateString()} | Registros: ${filteredItems.length}`, 14, 30);

    const tableColumn = ["Fecha", "Beneficiario", "Referido", "Nivel", "Monto (S/)", "Estado"];
    const tableRows = filteredItems.map(item => [
      `${item.month}/${item.year}`,
      item.user.username,
      item.referred_user.username,
      item.level,
      item.commission_amount,
      item.withdrawn ? 'Pagado' : 'Pendiente'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] },
    });
    doc.save(`Reporte_Comisiones_${new Date().getTime()}.pdf`);
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Cargando datos...</div>;
  if (error || !data) return <div className="p-10 text-red-500 bg-red-50 m-4 rounded-lg">{error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-blue-600" /> Reporte de Comisiones
          </h1>
          <p className="text-gray-500 mt-1">Sistema de gestión financiera y referidos.</p>
        </div>

        <div className="bg-white p-1 rounded-lg border border-gray-200 flex shadow-sm">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 Estadísticas
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'details' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Detalle y Filtros
          </button>
        </div>
      </div>

      {/* --- VISTA DASHBOARD --- */}
      {activeTab === 'dashboard' && (
        <div className="animate-in fade-in duration-500 space-y-6">
           {/* KPIs */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Total Generado</h3>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="text-blue-600 w-6 h-6" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.totales_generales.total_general)}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Pagadas</h3>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="text-green-600 w-6 h-6" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.totales_generales.total_pagadas)}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Pendientes</h3>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="text-orange-600 w-6 h-6" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.totales_generales.total_pendientes)}</p>
            </div>
          </div>

          {/* SECCIÓN CENTRAL: GRÁFICO Y TOP USUARIOS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CARD DEL GRÁFICO */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
              
              {/* CABECERA CON SELECTOR INTELIGENTE DE AÑO */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-gray-800">Evolución Mensual</h3>
                  <p className="text-xs text-gray-500">Comparativa de comisiones</p>
                </div>
                
                <div className="flex items-center gap-2">
                   <span className="text-xs text-gray-500 font-medium">Año:</span>
                   <select 
                     value={chartSelectedYear}
                     onChange={(e) => setChartSelectedYear(Number(e.target.value))}
                     className="text-sm border-gray-300 rounded-md py-1 px-2 border focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50"
                   >
                     {availableYears.map(year => (
                       <option key={year} value={year}>{year}</option>
                     ))}
                     {/* Fallback si no hay años */}
                     {availableYears.length === 0 && <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>}
                   </select>
                </div>
              </div>

              {/* GRÁFICO */}
              <div className="h-80 w-full">
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <Tooltip 
                       contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                       formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend />
                    <Bar dataKey="Pagadas" name="Pagadas" fill="#10B981" radius={[4,4,0,0]} barSize={30} />
                    <Bar dataKey="Pendientes" name="Pendientes" fill="#F59E0B" radius={[4,4,0,0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
                {chartData.length === 0 && (
                  <div className="text-center text-gray-400 mt-[-150px]">No hay datos para el año {chartSelectedYear}</div>
                )}
              </div>
            </div>
            
            {/* CARD TOP USUARIOS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Top Afiliados
              </h3>
              <div className="space-y-4 overflow-y-auto max-h-80 pr-2 scrollbar-thin">
                {data.por_usuario.slice(0, 8).map((u) => (
                  <div key={u.user_id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs ring-2 ring-white">
                        {u.user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-medium text-gray-800 truncate w-28" title={u.user.username}>{u.user.username}</p>
                        <p className="text-xs text-gray-400 truncate w-28">{u.user.email}</p>
                      </div>
                    </div>
                    <span className="font-bold text-blue-600">{formatCurrency(u.total)}</span>
                  </div>
                ))}
                {data.por_usuario.length === 0 && <div className="text-center text-gray-400 py-4">Sin datos</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- VISTA DETALLES --- */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col">
          
          {/* FILTROS TABLA */}
          <div className="p-5 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <div className="flex flex-col gap-4">
              
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                  <Filter className="w-5 h-5" /> Filtros Avanzados
                </h3>
                <div className="flex gap-2">
                  <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-sm transition-all"><FileSpreadsheet className="w-4 h-4" /> Excel</button>
                  <button onClick={exportToPDF} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-sm transition-all"><FileType className="w-4 h-4" /> PDF</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <select className="text-sm border-gray-300 rounded-lg px-3 py-2 border focus:ring-2 focus:ring-blue-500 outline-none" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as any); setCurrentPage(1); }}>
                  <option value="all">Estado: Todos</option>
                  <option value="paid">Pagadas</option>
                  <option value="pending">Pendientes</option>
                </select>
                <select className="text-sm border-gray-300 rounded-lg px-3 py-2 border focus:ring-2 focus:ring-blue-500 outline-none" value={filterLevel} onChange={(e) => { setFilterLevel(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPage(1); }}>
                  <option value="all">Nivel: Todos</option>
                  {[1,2,3,4,5].map(lvl => <option key={lvl} value={lvl}>Nivel {lvl}</option>)}
                </select>
                <select className="text-sm border-gray-300 rounded-lg px-3 py-2 border focus:ring-2 focus:ring-blue-500 outline-none" value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPage(1); }}>
                  <option value="all">Mes: Todos</option>
                  {MONTHS_LIST.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select className="text-sm border-gray-300 rounded-lg px-3 py-2 border focus:ring-2 focus:ring-blue-500 outline-none" value={filterYear} onChange={(e) => { setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPage(1); }}>
                  <option value="all">Año: Todos</option>
                  {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
                <select className="text-sm border-gray-300 rounded-lg px-3 py-2 border focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50 text-blue-700 font-medium" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value as any); setCurrentPage(1); }}>
                  <option value="desc">Mayor Monto </option>
                  <option value="asc">Menor Monto </option>
                </select>
              </div>
            </div>
          </div>

          {/* TABLA */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-100 uppercase text-xs font-bold text-gray-700 tracking-wider">
                <tr>
                  <th className="p-4 border-b">Fecha</th>
                  <th className="p-4 border-b">Beneficiario</th>
                  <th className="p-4 border-b">Referido (Origen)</th>
                  <th className="p-4 border-b text-center">Nivel</th>
                  <th className="p-4 border-b text-right">Monto</th>
                  <th className="p-4 border-b text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {MONTHS_LIST.find(m => m.value === item.month)?.label.substring(0,3)}/{item.year}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-gray-800">{item.user.username}</p>
                      <p className="text-xs text-gray-400">{item.user.email}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-gray-700">{item.referred_user.username}</p>
                      <p className="text-xs text-gray-400">{item.referred_user.email}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full text-xs font-bold text-gray-700">{item.level}</span>
                    </td>
                    <td className="p-4 text-right font-bold text-gray-900">{formatCurrency(item.commission_amount)}</td>
                    <td className="p-4 text-center">
                      {item.withdrawn ? 
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Pagado</span> : 
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Pendiente</span>
                      }
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-400 bg-white">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Filter className="w-10 h-10 text-gray-200" />
                        <p>No se encontraron resultados.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

           {/* PAGINACIÓN */}
           <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-xl">
            <span className="text-sm text-gray-500 hidden sm:block">
              Mostrando {filteredItems.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredItems.length)} de {filteredItems.length} registros
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="p-2 border border-gray-300 bg-white rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-medium text-gray-700 px-3">Página {currentPage} de {totalPages || 1}</span>
              <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => handlePageChange(currentPage + 1)} className="p-2 border border-gray-300 bg-white rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}