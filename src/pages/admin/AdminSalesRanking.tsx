/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { getSalesRanking } from '../../services/rankingService';
import type { RankingUser } from '../../types/ranking';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AtipayCoin } from '@/components/ui/AtipayCoin';

const AdminSalesRanking: React.FC = () => {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'global' | 'mine'>('global');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRanking();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [page, viewMode, searchTerm]);

  const fetchRanking = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getSalesRanking(page, viewMode, searchTerm);
      if (response && response.data) {
        setRanking(response.data);
      } else {
        setRanking([]); 
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message = err.errorData?.message || 'Error al cargar el ranking';
      setError(message);
      toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (mode: 'global' | 'mine') => {
    setViewMode(mode);
    setPage(1);
    setSearchTerm('');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Ranking de Vendedores</h1>
          <p className="text-gray-600 text-sm md:text-base">
            {viewMode === 'global' ? 'Ranking global de ventas' : 'Mis afiliados directos'}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0 items-center">
          <div className="relative w-full md:w-80" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar usuario o teléfono..."
                value={searchTerm}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchOpen(true);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none shadow-sm transition-all"
              />
              <svg className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {isSearchOpen && searchTerm.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                {ranking.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ranking.map((user: any) => (
                    <div
                      key={user.id}
                      onClick={() => { setSearchTerm(user.username); setIsSearchOpen(false); }}
                      className="flex items-center justify-between p-3 hover:bg-green-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-bold text-gray-800">{user.username}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{user.email}</span>
                        {user.phone_number && (
                          <span className="text-[10px] text-gray-400">{user.phone_number}</span>
                        )}
                      </div>
                      <div className="text-right flex items-center gap-1">
                        <AtipayCoin size="xs" />
                        <span className="text-xs font-bold text-green-600">{user.accumulated_points}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500 font-medium">No encontrado</div>
                )}
              </div>
            )}
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => handleModeChange('global')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'global' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Global</button>
            <button onClick={() => handleModeChange('mine')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'mine' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Mis Afiliados</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {viewMode === 'global' ? 'Todos los Vendedores' : 'Mis Afiliados Directos'}
            </h2>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div></div>
        ) : error ? (
           <div className="p-8 text-center text-red-500 bg-red-50 m-6 rounded-xl border border-red-100 font-medium">{error}</div>
        ) : ranking.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-700">No se encontraron vendedores</h3>
            <p className="text-gray-500 text-sm mt-1">{searchTerm ? `No hay resultados para "${searchTerm}"` : 'No hay datos registrados.'}</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <Table>
              <TableHeader className="bg-[#3EB363] text-white">
                <TableRow>
                  <TableHead className="text-white text-center w-32">Puesto</TableHead>
                  <TableHead className="text-white">Usuario</TableHead>
                  <TableHead className="text-white w-40">Puntos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              
                {ranking.map((user: any, index) => {
                  const realPosition = ((page - 1) * itemsPerPage) + index + 1;
                  return (
                    <TableRow key={user.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="text-center w-32">
                        <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">#{realPosition}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-left">
                            <span className="text-sm font-bold text-gray-900">{user.username}</span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                            {/* TELÉFONO EN TABLA PRINCIPAL */}
                            {user.phone_number && (
                                <span className="text-[11px] text-gray-400 font-medium">{user.phone_number}</span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="w-40 text-left">
                        <div className="flex items-center gap-1.5 justify-start">
                          <AtipayCoin size="xs" className="text-yellow-500" />
                          <span className="text-sm font-bold text-gray-900">{user.accumulated_points.toLocaleString('es-ES')}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
                <span className="text-xs font-bold text-gray-400 ml-2 uppercase">Página {page}</span>
                <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} className="px-4 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg shadow-sm disabled:opacity-50 transition-all hover:bg-gray-50">Anterior</button>
                    <button onClick={() => setPage(p => p + 1)} disabled={ranking.length < itemsPerPage} className="px-4 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg shadow-sm disabled:opacity-50 transition-all hover:bg-gray-50">Siguiente</button>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSalesRanking;