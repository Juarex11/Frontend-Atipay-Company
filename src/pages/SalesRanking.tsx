import React, { useState, useEffect } from 'react';
import type { RankingUser, CurrentUserRanking, RankingTableProps } from '../types/ranking';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AtipayCoin } from '@/components/ui/AtipayCoin';

const SalesRanking: React.FC = () => {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [currentUserRanking, setCurrentUserRanking] = useState<CurrentUserRanking | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchRanking = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Definir la URL según la pestaña
      // Asumo que tu API corre en localhost:8000 o tienes una variable de entorno.
      // Ajusta la base URL si es necesario.
      const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      const endpoint = activeTab === 'general' 
        ? `${baseUrl}/ranking/general`
        : `${baseUrl}/ranking/my-affiliates`;

      // 2. Obtener el token (AJUSTA LA CLAVE SI LA GUARDAS CON OTRO NOMBRE)
      // Normalmente se guarda como 'token', 'auth_token' o 'access_token' en localStorage
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');

      // 3. Petición usando FETCH
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Importante para que Laravel sepa quién eres
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // 4. Manejo de la respuesta (Array directo vs Objeto envuelto)
      if (Array.isArray(data)) {
         setRanking(data);
         setCurrentUserRanking(null); 
      } else {
         // Si el backend antiguo devolvía un objeto con 'ranking' dentro
         setRanking(data.ranking || data);
         setCurrentUserRanking(data.current_user_ranking || null);
      }

    } catch (err: unknown) { // <--- CORRECCIÓN DEL ERROR DE TYPE 'ANY'
      console.error(err);
      
      // Lógica segura para extraer el mensaje de error en TypeScript
      let message = 'Error al cargar el ranking';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
         message = String((err as { message: unknown }).message);
      }

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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Panel de Vendedores</h1>
          <p className="text-gray-600 text-sm md:text-base">Ranking de ventas y comisiones generadas</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-gray-100 p-1 mb-6">
          <TabsTrigger value="general" className="rounded-md px-6 py-2 font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 transition-colors">
            Ranking General
          </TabsTrigger>
          <TabsTrigger value="affiliates" className="rounded-md px-6 py-2 font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 transition-colors">
            Mis Afiliados
          </TabsTrigger>
        </TabsList>

        {/* CONTENIDO DE TABS */}
        <TabsContent value="general">
          <RankingTable
            ranking={ranking}
            currentUserRanking={currentUserRanking}
            loading={loading}
            error={error}
            title="Top 10 Mejores Vendedores"
            description="Ranking global del sistema"
            limit={10}
            showLevel={false}
          />
        </TabsContent>

        <TabsContent value="affiliates">
          <RankingTable
            ranking={ranking}
            currentUserRanking={null}
            loading={loading}
            error={error}
            title="Ranking de Mis Afiliados"
            description="Tus afiliados directos y su rendimiento"
            limit={null}
            showLevel={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ... COMPONENTE RankingTable ...
// (MANTÉN EL COMPONENTE RankingTable QUE YA TIENES ABAJO EN TU ARCHIVO,
// NO HACE FALTA CAMBIARLO, SOLO COPIA LA PARTE SUPERIOR "SalesRanking")

// Para que no te de error al copiar, declaro aquí que RankingTable sigue igual:
const RankingTable: React.FC<RankingTableProps> = ({
  ranking,
  currentUserRanking,
  loading,
  error,
  title,
  description,
  limit,
  showLevel = false
}) => {
    // ... Copia aquí el contenido de tu componente RankingTable original ...
    // ... O simplemente no borres esa parte de tu archivo ...
  const displayedRanking = limit ? ranking.slice(0, limit) : ranking;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {title}
        </h2>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
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
      ) : displayedRanking.length === 0 ? (
        <div className="p-8 text-center">
          <div className="inline-flex flex-col items-center justify-center p-6 rounded-xl bg-gray-50 max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No hay datos disponibles</h3>
            <p className="text-gray-500 text-sm">Aún no hay información para mostrar en este ranking</p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-[#3EB363] text-white">
              <TableRow>
                <TableHead className="text-white text-center w-32">PUESTO</TableHead>
                <TableHead className="text-white">USUARIO</TableHead>
                {showLevel && <TableHead className="text-white text-center w-40">NIVEL</TableHead>}
                <TableHead className="text-white w-40">PUNTOS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRanking.map((user, index) => {
                const position = index + 1;
                const isCurrentUser = currentUserRanking?.id === user.id;
                
                return (
                  <TableRow key={user.id} className={isCurrentUser ? 'bg-green-50' : ''}>
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">
                          {user.username}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                              Tú
                            </span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    {showLevel && (
                        <TableCell className="w-32 text-center">
                        <span className="inline-flex justify-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
                          Nivel {user.level}
                        </span>
                      </TableCell>
                    )}
                    {showLevel && !user.level && <TableCell className="w-24"></TableCell>}
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
  );
};

export default SalesRanking;