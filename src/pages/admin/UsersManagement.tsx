import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router';
import type { UserListItem } from '@/services/userManagement.service';
import { userManagementService } from '@/services/userManagement.service';
import type { PaginatedResponse } from '@/shared/types';
import { UserPlus, Loader2, Share2, Settings } from 'lucide-react';
import { AtipayCoin } from '@/components/ui/AtipayCoin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateUserModal } from '@/components/admin/CreateUserModal';
import { UserConfigurationModal } from '@/components/admin/UserConfigurationModal';
import { InviteFriendsModal } from '@/components/affiliates/InviteFriendsModal';
import { UserDetailsModal } from '@/components/admin/UserDetailsModal';

const UsersManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);

  // Check for highlight parameter in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const highlightId = searchParams.get('highlight');

    if (highlightId) {
      setHighlightedUserId(highlightId);

      // Remove highlight after 5 seconds
      const timer = setTimeout(() => {
        setHighlightedUserId(null);
        // Remove the highlight parameter from URL without refreshing the page
        searchParams.delete('highlight');
        navigate(
          {
            search: searchParams.toString()
          },
          { replace: true }
        );
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [location.search, navigate]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });


  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleUserCreated = () => {
    refetch();
  };

  const handleConfigureUser = (e: React.MouseEvent, user: UserListItem) => {
    e.stopPropagation();
    setSelectedUser(user);
    setIsConfigModalOpen(true);
  };

  const handleViewUserDetails = (user: UserListItem) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const handleUserUpdated = () => {
    refetch();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const filteredUsers = (users: UserListItem[]) => {
    let filtered = users;

    // Apply search filter if search term exists
    if (searchTerm) {
      filtered = filtered.filter(user =>
      (user.username?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm))
      );
    }

    // Sort users by registration date (newest first)
    return [...filtered].sort((a, b) => {
      const dateA = a.registration_date && a.registration_time
        ? new Date(`${a.registration_date} ${a.registration_time}`).getTime()
        : new Date(a.createdAt || 0).getTime();

      const dateB = b.registration_date && b.registration_time
        ? new Date(`${b.registration_date} ${b.registration_time}`).getTime()
        : new Date(b.createdAt || 0).getTime();

      return dateB - dateA; // Descending order (newest first)
    });
  };

  interface UsersResponse {
    items: UserListItem[];
    total: number;
    totalPages: number;
  }

  const {
    data: usersResponse = { items: [], total: 0, totalPages: 0 },
    isLoading,
    error,
    refetch
  } = useQuery<UsersResponse>({
    queryKey: ['users', pagination.page, pagination.limit],
    queryFn: async (): Promise<UsersResponse> => {
      try {
        const apiFilters: {
          search?: string;
          status?: 'active' | 'suspended' | 'pending' | 'inactive';
          role?: 'admin' | 'partner' | 'user';
        } = {};

        // Filtrado ahora se hace en el cliente

        const response = await userManagementService.getUsers(
          pagination.page,
          pagination.limit,
          apiFilters,
          { limit: pagination.limit }
        ) as PaginatedResponse<UserListItem>;

        const result: UsersResponse = {
          items: response.items || [],
          total: response.total || 0,
          totalPages: response.totalPages || 1
        };

        setPagination((prev) => ({
          ...prev,
          total: result.total,
          totalPages: result.totalPages,
        }));

        return result;
      } catch (err) {
        console.error('Error in queryFn:', err);
        throw err;
      }
    },
    retry: (failureCount: number, error: Error) => {
      if (error?.message?.includes('401')) {
        if (!window.location.pathname.includes('/login')) {
          navigate('/login', {
            state: {
              from: window.location.pathname,
              message: 'Your session has expired. Please log in again.'
            }
          });
        }
        return false;
      }
      return failureCount < 2;
    },
    placeholderData: { items: [], total: 0, totalPages: 0 }
  });

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getRoleBadge = (role: string | { id?: number | string; name?: string } | null) => {
    if (!role) return <Badge variant="outline">Desconocido</Badge>;

    let roleName = '';
    if (typeof role === 'string') {
      roleName = role;
    } else if (role.name) {
      roleName = role.name;
    } else if (role.id) {
      roleName = role.id.toString();
    }

    const roleMap: Record<string, { variant: 'default' | 'secondary' | 'outline', label: string, className?: string }> = {
      admin: {
        variant: 'default',
        label: 'Admin',
        className: 'bg-[#0a7e3e] hover:bg-[#0c4a2a] text-white border-[#0a7e3e]'
      },
      user: {
        variant: 'secondary',
        label: 'Socio',
        className: 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200'
      },
      partner: {
        variant: 'secondary',
        label: 'Socio',
        className: 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200'
      }
    };

    const roleKey = roleName.toLowerCase();
    const roleInfo = roleMap[roleKey] || {
      variant: 'outline' as const,
      label: roleName,
      className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
    };

    return (
      <Badge
        variant={roleInfo.variant}
        className={roleInfo.className}
      >
        {roleInfo.label || 'Desconocido'}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    if (!status) return <Badge variant="outline">Desconocido</Badge>;

    const statusMap: Record<string, {
      variant: 'default' | 'destructive' | 'secondary' | 'outline',
      label: string,
      className?: string
    }> = {
      active: {
        variant: 'default',
        label: 'Activo',
        className: 'bg-green-100 hover:bg-green-200 text-green-800 border-green-200'
      },
      suspended: {
        variant: 'destructive',
        label: 'Suspendido',
        className: 'bg-red-100 hover:bg-red-200 text-red-800 border-red-200'
      },
      pending: {
        variant: 'secondary',
        label: 'Pendiente',
        className: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-200'
      },
      inactive: {
        variant: 'outline',
        label: 'Inactivo',
        className: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200'
      }
    };

    const statusInfo = statusMap[status] || {
      variant: 'outline' as const,
      label: status,
      className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
    };

    return (
      <Badge
        variant={statusInfo.variant}
        className={statusInfo.className}
      >
        {statusInfo.label || 'Desconocido'}
      </Badge>
    );
  };

  const renderLoading = () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a7e3e]"></div>
      <span className="ml-3 text-gray-700">Cargando usuarios...</span>
    </div>
  );

  const renderError = () => (
    <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
      <div className="flex items-center">
        <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <h3 className="text-sm font-medium text-red-800">Error</h3>
      </div>
      <p className="mt-1 text-sm text-red-700">Error al cargar los usuarios: {error?.message}</p>
      <button
        onClick={() => refetch()}
        className="mt-2 px-3 py-1.5 bg-red-50 text-red-700 text-sm font-medium rounded-md border border-red-200 hover:bg-red-100 transition-colors"
      >
        Reintentar
      </button>
    </div>
  );

  const renderUsersTable = () => {
    const users = filteredUsers(usersResponse?.items || []);

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Buscar por usuario o email..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px] md:min-w-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr className="bg-gradient-to-r from-[#0c4a2a] to-[#0a7e3e]">
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Usuario</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Email</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Rol</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Estado</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Saldo</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Saldo Retirable</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Puntos</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Código Ref.</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Referido por</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap hidden xl:table-cell">Fecha Reg.</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap hidden xl:table-cell">Hora Reg.</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users.map((user: UserListItem) => (
                    <tr
                      key={user.id}
                      ref={highlightedUserId === user.id.toString() ? highlightedRowRef : null}
                      className={`relative transition-all duration-300 cursor-pointer group
                        ${highlightedUserId === user.id.toString() 
                          ? 'bg-green-100 border-l-4 border-green-600 shadow-md' 
                          : 'hover:bg-gray-50'}`}
                      onClick={() => handleViewUserDetails(user)}
                    >
                      <td className="relative px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {highlightedUserId === user.id.toString() && (
                          <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-green-50 -z-10" />
                        )}
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[120px] sm:max-w-none">{user.username || 'N/A'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfigureUser(e, user);
                            }}
                            title="Configurar usuario"
                          >
                            <Settings className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div className="truncate max-w-[150px]">
                          {user.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {user.role ? getRoleBadge(user.role) : 'N/A'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {user.status ? getStatusBadge(user.status) : 'N/A'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <AtipayCoin size="xs" className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-sm text-gray-900 whitespace-nowrap">
                            {user.atipay_money || '0.00'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <AtipayCoin size="xs" className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-sm text-gray-900 whitespace-nowrap">
                            {user.withdrawable_balance || '0.00'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {user.accumulated_points || '0'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        <div className="truncate max-w-[100px]">
                          {user.reference_code || 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                        <div className="truncate max-w-[120px]">
                          {user.referrer?.username || 'Ninguno'}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 hidden xl:table-cell">
                        {user.registration_date || 'N/A'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 hidden xl:table-cell">
                        {user.registration_time || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main content renderer
  const renderContent = () => {
    if (isLoading) return renderLoading();
    if (error) return renderError();
    return renderUsersTable();
  };

  // Scroll to highlighted row when it's available
  useEffect(() => {
    if (highlightedUserId && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedUserId, usersResponse?.items]);

  // REFRESH: escuchar eventos para actualizar la lista de usuarios (ej. al registrar compra manual)
  useEffect(() => {
    const handleRefresh = (ev?: Event) => {
      // Refetch users
      refetch();

      // Si viene detalle del evento, intentamos actualizar el modal si corresponde
      try {
        const custom = ev as CustomEvent | undefined;
        const userId = custom?.detail?.userId;
        if (userId && selectedUser?.id === Number(userId)) {
          refetch().then(() => {
            const updated = (usersResponse?.items || []).find(u => u.id === Number(userId));
            if (updated) setSelectedUser(updated);
          }).catch(() => {});
        }
      } catch (e) {
        // noop
      }
    };

    window.addEventListener('refresh:users', handleRefresh);
    window.addEventListener('admin:purchase:registered', handleRefresh as EventListener);
    return () => {
      window.removeEventListener('refresh:users', handleRefresh);
      window.removeEventListener('admin:purchase:registered', handleRefresh as EventListener);
    };
  }, [refetch, selectedUser, usersResponse?.items]);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <InviteFriendsModal>
            <Button variant="outline" className="bg-white hover:bg-gray-50 border-gray-300">
              <Share2 className="h-4 w-4 mr-2" />
              Invitar Amigos
            </Button>
          </InviteFriendsModal>
          <CreateUserModal onUserCreated={handleUserCreated}>
            <Button className="bg-[#0a7e3e] hover:bg-[#0c4a2a] text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </CreateUserModal>
        </div>
      </div>
      <Card className="mt-6 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                Mostrando {usersResponse?.items?.length || 0} de {usersResponse?.total || 0} usuarios
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    handlePageChange(pagination.page - 1);
                  }}
                  disabled={pagination.page <= 1 || isLoading}
                  className="min-w-[100px]"
                >
                  {isLoading && pagination.page > 1 ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Anterior
                </Button>
                <div className="text-sm px-4 py-2 bg-gray-50 rounded-md">
                  Página {pagination.page} de {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    handlePageChange(pagination.page + 1);
                  }}
                  disabled={pagination.page >= pagination.totalPages || isLoading}
                  className="min-w-[100px]"
                >
                  {isLoading && pagination.page < pagination.totalPages ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {selectedUser && (
        <UserConfigurationModal
          isOpen={isConfigModalOpen}
          onClose={() => {
            setIsConfigModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {selectedUser && (
        <UserDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
        />
      )}
    </div>
  );
};

export default UsersManagement;
