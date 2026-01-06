import React, { useState, useEffect } from 'react';
import { getMyAffiliates } from '../services/rankingService';
import type { RankingUser, CurrentUserRanking, RankingTableProps } from '../types/ranking';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, BarChart3 } from 'lucide-react';
import { AffiliateStatsModal } from '@/components/affiliates/AffiliateStatsModal';

const SalesRanking: React.FC = () => {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [currentUserRanking, setCurrentUserRanking] = useState<CurrentUserRanking | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const [affiliatesRanking, setAffiliatesRanking] = useState<RankingUser[]>([]);
  const [affiliatesLoading, setAffiliatesLoading] = useState(false);
  const [affiliatesError, setAffiliatesError] = useState('');

  const [statsUser, setStatsUser] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    fetchRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'affiliates') {
      fetchAffiliates();
    }
  }, [activeTab]);

  const fetchRanking = async () => {
    try {
      setLoading(true);
      setError('');

      const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      const endpoint =
        activeTab === 'general'
          ? `${baseUrl}/affiliate/ranking`
          : `${baseUrl}/ranking/my-affiliates`;

      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');

      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const data = await response.json();

      if (Array.isArray(data)) {
        setRanking(data);
        setCurrentUserRanking(null);
      } else {
        setRanking(data.ranking || data);
        setCurrentUserRanking(data.current_user_ranking || null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar el ranking';
      setError(message);
      toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
      setLoading(false);
    }
  };

  const fetchAffiliates = async () => {
    try {
      setAffiliatesLoading(true);
      setAffiliatesError('');
      const data = await getMyAffiliates();
      setAffiliatesRanking(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message = err?.errorData?.message || 'Error al cargar afiliados';
      setAffiliatesError(message);
      toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
      setAffiliatesLoading(false);
    }
  };

  const handleShowStats = (id: number, name: string) => {
    setStatsUser({ id, name });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Panel de Vendedores</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">Ranking General</TabsTrigger>
          <TabsTrigger value="affiliates">Mis Afiliados</TabsTrigger>
        </TabsList>

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
            allowHistory="only-me"
            onShowStats={handleShowStats}
          />
        </TabsContent>

        <TabsContent value="affiliates">
          <RankingTable
            ranking={affiliatesRanking}
            currentUserRanking={null}
            loading={affiliatesLoading}
            error={affiliatesError}
            title="Ranking de Mis Afiliados"
            description="Tus afiliados directos"
            limit={null}
            showLevel={true}
            allowHistory="all"
            onShowStats={handleShowStats}
          />
        </TabsContent>
      </Tabs>

      <AffiliateStatsModal
        isOpen={!!statsUser}
        onClose={() => setStatsUser(null)}
        userId={statsUser?.id || null}
        userName={statsUser?.name || ''}
      />
    </div>
  );
};

// --------------------------------------------------

interface ExtendedRankingTableProps extends RankingTableProps {
  onShowStats: (id: number, name: string) => void;
  allowHistory: 'all' | 'only-me';
}

const RankingTable: React.FC<ExtendedRankingTableProps> = ({
  ranking,
  currentUserRanking,
  title,
  description,
  limit,
  showLevel,
  allowHistory,
  onShowStats,
}) => {
  const displayedRanking = limit ? ranking.slice(0, limit) : ranking;

  return (
    <div className="bg-white rounded-xl shadow border">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <Table>
        <TableHeader className="bg-green-600">
          <TableRow>
            <TableHead className="text-white text-center">PUESTO</TableHead>
            <TableHead className="text-white">USUARIO</TableHead>
            {showLevel && <TableHead className="text-white text-center">NIVEL</TableHead>}
            <TableHead className="text-white">PUNTOS</TableHead>
            <TableHead className="text-white text-center">HISTORIAL</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {displayedRanking.map((user, index) => {
            const isCurrentUser = currentUserRanking?.id === user.id;
            const canSeeHistory =
              allowHistory === 'all' || (allowHistory === 'only-me' && isCurrentUser);

            return (
              <TableRow key={user.id} className={isCurrentUser ? 'bg-green-50' : ''}>
                <TableCell className="text-center">#{index + 1}</TableCell>

                <TableCell>
                  {user.username}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs bg-green-100 px-2 rounded">Tú</span>
                  )}
                </TableCell>

                {showLevel && (
                  <TableCell className="text-center">Nivel {user.level}</TableCell>
                )}

                <TableCell>
                  <Star className="inline w-4 h-4 text-yellow-500 fill-yellow-500" />{' '}
                  {user.accumulated_points.toLocaleString('es-ES')}
                </TableCell>

                <TableCell className="text-center">
                  {canSeeHistory ? (
                    <button
                      onClick={() => onShowStats(user.id, user.username)}
                      className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-green-600"
                      title="Ver historial"
                    >
                      <BarChart3 className="w-5 h-5" />
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Privado</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default SalesRanking;
