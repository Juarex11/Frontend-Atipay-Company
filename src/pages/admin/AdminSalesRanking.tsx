import React, { useState, useEffect } from 'react';
import { getSalesRanking } from '../../services/rankingService';
import type { RankingUser } from '../../types/ranking';
import { toast } from '@/components/ui/use-toast';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '@/components/ui/table';
import { AtipayCoin } from '@/components/ui/AtipayCoin';

const AdminSalesRanking: React.FC = () => {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await getSalesRanking();
      setRanking(data.ranking);
    } catch (err: unknown) {
      const error = err as { errorData?: { message?: string } };
      const message = error.errorData?.message || 'Error al cargar el ranking';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Ranking de Vendedores</h1>
          <p className="text-gray-600 text-sm md:text-base">Ranking de ventas y comisiones generadas</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Ranking de Vendedores
          </h2>
          <p className="text-sm text-gray-500 mt-1"> Ranking de los vendedores del sistema</p>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="text-red-500 bg-red-50 p-4 rounded-lg inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          </div>
        ) : ranking.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex flex-col items-center justify-center p-6 rounded-xl bg-gray-50 max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 mb-1">No hay vendedores</h3>
              <p className="text-gray-500 text-sm">Aún no se han generado ventas</p>
            </div>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-[#3EB363] text-white">
                <TableRow>
                  <TableHead className="text-white text-center w-32">Puesto</TableHead>
                  <TableHead className="text-white">Usuario</TableHead>
                  <TableHead className="text-white w-40">Puntos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((user, index) => {
                  const position = index + 1;
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="text-center w-32">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${
                          position === 1 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : position === 2
                            ? 'bg-slate-50 text-slate-700 border border-slate-200'
                            : position === 3
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : 'bg-gray-50 text-gray-600 border border-gray-200'
                        }`}>
                          #{position}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-gray-900">{user.username}</span>
                      </TableCell>
                      <TableCell className="w-40">
                        <div className="flex items-center gap-1.5">
                          <AtipayCoin size="xs" className="text-yellow-500" />
                          <span className="text-sm font-semibold text-gray-900">
                            {user.accumulated_points.toLocaleString('es-ES')}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSalesRanking;
