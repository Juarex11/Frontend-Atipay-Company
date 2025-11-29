import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Users, ExternalLink, RefreshCw, Search, ChevronDown } from 'lucide-react';
import { InviteFriendsModal } from '@/components/affiliates/InviteFriendsModal';
import { referralService } from '@/services/referral.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserWithReferral extends User {
  id: string;
  referral_code?: string;
}

export default function UserAffiliates() {
  const { user } = useAuth() as { user: UserWithReferral | null };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  // Fetch referral network data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['userAffiliateNetwork', user?.id],
    queryFn: () => referralService.getReferralNetwork(),
    enabled: !!user?.id,
  });

  // Process referral levels
  const referralLevels = useMemo(() => {
    if (!data?.data) return [];

    return Object.entries(data.data).map(([key, users]) => ({
      level: parseInt(key.split('_')[1]),
      users: users.map(user => ({
        ...user,
      }))
    }));
  }, [data]);

  // Filter users by search term
  const filteredLevels = useMemo(() => {
    if (!searchTerm) return referralLevels;

    const term = searchTerm.toLowerCase();
    return referralLevels
      .map(level => ({
        ...level,
        users: level.users.filter(
          user =>
            user.username?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term)
        )
      }))
      .filter(level => level.users.length > 0);
  }, [referralLevels, searchTerm]);

  const handleViewLevel = (level: number) => {
    setSelectedLevel(selectedLevel === level ? null : level);
  };


  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Cargando red de referidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-destructive">Error al cargar la red de referidos</p>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mi Red de Afiliados</h1>
          <p className="text-sm text-gray-600">
            Gestiona y haz seguimiento a tus referidos
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <InviteFriendsModal />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar referidos..."
                className="pl-9 w-full bg-gray-50 border-gray-200 focus-visible:ring-2 focus-visible:ring-green-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="p-5">
          {filteredLevels.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-3 text-sm font-medium text-gray-700">No hay referidos</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comparte tu enlace de referido para invitar a otros usuarios.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLevels.map((level) => (
                <div key={`level-${level.level}`} className="border border-gray-100 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleViewLevel(level.level)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-800">
                        Nivel {level.level} - {level.users.length} {level.users.length === 1 ? 'usuario' : 'usuarios'}
                      </h3>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 transition-transform ${selectedLevel === level.level ? 'transform rotate-180' : ''
                        }`}
                    />
                  </button>

                  {selectedLevel === level.level && (
                    <div className="border-t border-gray-100">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="text-gray-600 font-medium">Usuario</TableHead>
                              <TableHead className="text-gray-600 font-medium">Email</TableHead>
                              <TableHead className="text-gray-600 font-medium">Fecha y Hora de Registro</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {level.users.map((user) => (
                              <TableRow key={user.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium text-gray-900">
                                  {user.username || 'Usuario sin nombre'}
                                </TableCell>
                                <TableCell>
                                  <a
                                    href={`mailto:${user.email}`}
                                    className="text-[#0a7e3e] hover:text-[#0c4a2a] hover:underline flex items-center font-medium"
                                  >
                                    {user.email}
                                    <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                                  </a>
                                </TableCell>
                                <TableCell className="text-gray-700">
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {user.registration_date ?
                                        format(new Date(user.registration_date), 'PP', { locale: es }) :
                                        'N/A'
                                      }
                                    </div>
                                    <div className="text-muted-foreground font-mono text-xs">
                                      {user.registration_time || 'N/A'}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
