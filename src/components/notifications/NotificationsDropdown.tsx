import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router';
import { AtipayCoin } from '@/components/ui/AtipayCoin';

interface Recharge {
  id: string;
  user_id: string;
  user_name: string;
  user?: {
    id: number;
    name?: string;
    username?: string;
    email: string;
  };
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role_id: number;
  status: string;
  atipay_money: number;
  accumulated_points: number;
  reference_code: string;
  referred_by: number | null;
  registration_date: string;
  registration_time: string;
  referral_url: string;
  created_at: string;
  updated_at: string;
  name?: string; // Optional for backward compatibility
}

interface Investment {
  id: string;
  user_id: string;
  user_name: string;
  user?: {
    id: number;
    name?: string;
    username?: string;
    email: string;
  };
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface Withdrawal {
  id: number;
  user_id: string;
  user_name: string;
  holder?: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  method?: string;
  phone_number?: string | null;
  account_number?: string | null;
  user?: {
    id: number;
    username: string;
    name?: string;
    email: string;
    role_id: number;
    status: string;
    atipay_money: number;
    accumulated_points: number;
    reference_code: string;
    referred_by: number | null;
    registration_date: string;
    registration_time: string;
    referral_url: string;
    created_at: string;
    updated_at: string;
  };
}

interface PurchaseRequest {
  id: string;
  user_id: string;
  user_name: string;
  quantity: number;
  user?: {
    id: number;
    name?: string;
    username?: string;
    email: string;
  };
  product?: {
    id: string;
    name: string;
    price: number;
  };
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface BaseNotification {
  id: string;
  type: 'topup' | 'withdrawal' | 'transfer' | 'new_user' | 'investment' | 'investment_withdrawal' | 'withdrawal_request' | 'purchase_request';
  userId: string;
  userName: string;
  amount?: number;
  status?: string;
  createdAt: Date;
  userData?: Partial<User> & {
    id: number | string;
    name?: string;
    email?: string;
    username?: string;
    [key: string]: unknown;
  } | User;
  message?: string | React.ReactNode;
}

interface PurchaseRequestNotification extends BaseNotification {
  type: 'purchase_request';
  product?: {
    id: string;
    name: string;
  };
}

type Notification = BaseNotification | PurchaseRequestNotification;

const getNotificationLink = (type: string, userId?: string) => {
  const baseUrls: Record<string, string> = {
    'transfer': "/admin/transfers",
    'investment': "/admin/dashboard?tab=investments",
    'investment_withdrawal': "/admin/dashboard?tab=investment-withdrawals",
    'withdrawal_request': "/withdrawals",
    'new_user': "/admin/users",
    'purchase_request': "/admin/store?tab=purchases"
  };
  
  const baseUrl = baseUrls[type] || "/admin/dashboard?tab=recharges";
  
  if (type === 'new_user' && userId) {
    return `${baseUrl}?highlight=${userId}`;
  }
  
  return baseUrl;
};

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Clave para almacenar las notificaciones leídas
  const READ_NOTIFICATIONS_KEY = 'read_notifications';
  
  // Obtener notificaciones leídas del localStorage
  const getReadNotifications = (): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    const read = localStorage.getItem(READ_NOTIFICATIONS_KEY);
    return new Set(read ? JSON.parse(read) : []);
  };
  
  // Marcar notificación como leída
  const markAsRead = (id: string) => {
    const readNotifications = getReadNotifications();
    readNotifications.add(id);
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(readNotifications)));
  };

  const getNotificationTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'withdrawal': 'un retiro',
      'withdrawal_request': 'una solicitud de retiro',
      'transfer': 'una transferencia',
      'new_user': 'se ha registrado',
      'investment': 'una inversión pendiente',
      'investment_withdrawal': 'un retiro de ganancias',
      'purchase_request': 'una solicitud de compra',
      'default': 'una recarga'
    };
    return typeMap[type] || typeMap.default;
  };

  const fetchRecharges = async (headers: HeadersInit): Promise<Recharge[]> => {
    try {
      const rechargesRes = await fetch('https://api.atipaycompany.com/api/atipay-recharges', { headers });
      if (rechargesRes.ok) {
        const rechargesData = await rechargesRes.json();
        return Array.isArray(rechargesData) ? rechargesData : rechargesData?.data || [];
      }
      console.warn('Failed to fetch recharges:', rechargesRes.status);
    } catch (error) {
      console.error('Error fetching recharges:', error);
    }
    return [];
  };

  const fetchUsers = async (headers: HeadersInit): Promise<User[]> => {
    try {
      const usersRes = await fetch('https://api.atipaycompany.com/api/users', { headers });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        return Array.isArray(usersData) ? usersData : usersData?.data || [];
      }
      // Log removed for production
    } catch {
      // Log removed for production
    }
    return [];
  };

  const fetchWithdrawals = async (headers: HeadersInit): Promise<Withdrawal[]> => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      const userData = JSON.parse(userJson);
      if (userData?.role !== "admin") {
        return [];
      }
    } else {
      return [];
    }

    try {
      const response = await fetch('https://api.atipaycompany.com/api/withdrawals', {
        headers,
        method: 'GET'
      });

      if (!response.ok) {
        if (response.status !== 403) {
          const errorText = await response.text();
          console.error('Failed to fetch withdrawals:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
        }
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : data?.data || [];
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
    return [];
  };

  const fetchPurchaseRequests = async (headers: HeadersInit): Promise<PurchaseRequest[]> => {
    try {
      const response = await fetch('https://api.atipaycompany.com/api/products/purchase-requests', {
        headers,
        method: 'GET'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch purchase requests:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : data?.data || [];
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      return [];
    }
  };


  const fetchInvestments = async (headers: HeadersInit): Promise<Investment[]> => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      const userData = JSON.parse(userJson);
      if (userData?.role !== "admin") {
        return [];
      }
    } else {
      return [];
    }

    try {
      const investmentsRes = await fetch('https://api.atipaycompany.com/api/investments/pending', {
        headers,
        method: 'GET'
      });

      if (investmentsRes.ok) {
        const data = await investmentsRes.json();
        return Array.isArray(data) ? data : data?.data || [];
      }

      if (investmentsRes.status !== 403) {
        const errorText = await investmentsRes.text();
        console.error('Failed to fetch investments:', {
          status: investmentsRes.status,
          statusText: investmentsRes.statusText,
          error: errorText
        });
      }
    } catch (error) {
      console.error('Error fetching investments:', error);
    }
    return [];
  };

  const mapInvestmentsToNotifications = (investments: Investment[]): Notification[] => {
    return investments
      .filter(inv => {
        const isPending = inv?.status === 'pending';
        if (!isPending) {
          console.log('Skipping non-pending investment:', inv);
        }
        return isPending;
      })
      .map(inv => {
        console.log('Processing investment notification:', inv);

        const userName = inv.user?.name || inv.user?.username || inv.user_name || 'Usuario';
        const userId = inv.user_id || inv.user?.id?.toString() || 'unknown';
        type InvestmentWithExtraFields = Investment & {
          investment_amount?: number;
          total_amount?: number;
          promotion?: {
            atipay_price_promotion?: number;
            [key: string]: unknown;
          };
        };
        const typedInv = inv as InvestmentWithExtraFields;
        const amount = inv.amount ||
          typedInv.investment_amount ||
          typedInv.total_amount ||
          typedInv.promotion?.atipay_price_promotion ||
          0;

        console.log(`Extracted amount for investment ${inv.id}:`, amount);

        return {
          id: `investment-${inv.id}`,
          type: 'investment' as const,
          userId,
          userName,
          amount: Number(amount) || 0,
          status: inv.status,
          createdAt: new Date(inv.created_at || Date.now()),
          userData: inv.user || undefined
        };
      });
  };

  const mapRechargesToNotifications = (recharges: Recharge[]): Notification[] => {
    return recharges
      .filter(r => r?.status === 'pending')
      .map(r => {
        const userName = r.user?.name || r.user?.username || r.user_name || 'Usuario';
        const userId = r.user_id || r.user?.id?.toString() || 'unknown';

        return {
          id: `recharge-${r.id}`,
          type: 'topup' as const,
          userId,
          userName,
          amount: r.amount || 0,
          status: r.status,
          createdAt: new Date(r.created_at || Date.now()),
          userData: r.user || undefined
        };
      });
  };

  const getNotificationMessage = (notification: Notification): React.ReactNode => {

    if (notification.type === 'new_user') {
      if (notification.id === 'today-users-summary') {
        return notification.message as string;
      }
      return `${notification.userName} ${getNotificationTypeText(notification.type)}`;
    }

    if (notification.type === 'investment') {
      return (
        <span>
          {notification.userName} realizó una nueva inversión de{' '}
          <span className="flex items-center">
            <AtipayCoin size="xs" className="mr-1" />
            {notification.amount?.toFixed(2) || '0.00'}
          </span>
        </span>
      );
    }

    if (notification.type === 'purchase_request') {
      const typedNotification = notification as PurchaseRequestNotification & { product?: { quantity?: number } };
      const productName = typedNotification.product?.name || 'un producto';
      const quantity = typedNotification.product?.quantity || 1;
      const amount = (notification.amount || 0).toFixed(2);
      
      if (quantity > 1) {
        return (
          <span>
            {notification.userName} ha solicitado comprar {quantity} unidades de {productName} por{' '}
            <span className="flex items-center">
              <AtipayCoin size="xs" className="mr-1" />
              {amount}
            </span>
          </span>
        );
      }
      return (
        <span>
          {notification.userName} ha solicitado comprar {productName} por{' '}
          <span className="flex items-center">
            <AtipayCoin size="xs" className="mr-1" />
            {amount}
          </span>
        </span>
      );
    }

    return (
      <span>
        {notification.userName} ha solicitado {getNotificationTypeText(notification.type)} de{' '}
        <span className="flex items-center">
          <AtipayCoin size="xs" className="mr-1" />
          {notification.amount?.toFixed(2) || '0.00'}
        </span>
      </span>
    );
  };

  const mapUsersToNotifications = (users: User[]): Notification[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsers = users.filter((user: User) => {
      const userDate = user.registration_date && user.registration_time
        ? new Date(`${user.registration_date} ${user.registration_time}`)
        : new Date(user.created_at);
      return userDate >= today;
    });

    if (todayUsers.length === 0) {
      return [];
    }

    const importantUsers = todayUsers.filter(user => {
      return user.role_id === 1 ||
        user.atipay_money > 1000 ||
        user.referred_by === 1;
    });

    return todayUsers
      .sort((a: User, b: User) => {
        const dateA = a.registration_date && a.registration_time
          ? new Date(`${a.registration_date} ${a.registration_time}`).getTime()
          : new Date(a.created_at).getTime();
        const dateB = b.registration_date && b.registration_time
          ? new Date(`${b.registration_date} ${b.registration_time}`).getTime()
          : new Date(b.created_at).getTime();
        return dateB - dateA;
      })
      .map((user: User) => ({
        id: `user-${user.id}`,
        type: 'new_user' as const,
        userId: user.id.toString(),
        userName: user.username || user.name || 'Nuevo usuario',
        amount: user.atipay_money,
        status: importantUsers.some(u => u.id === user.id) ? 'important' : user.status,
        createdAt: user.registration_date && user.registration_time
          ? new Date(`${user.registration_date} ${user.registration_time}`)
          : new Date(user.created_at || Date.now()),
        userData: user,
        message: importantUsers.some(u => u.id === user.id)
          ? 'Nuevo usuario importante registrado'
          : undefined
      }));
  };

  useEffect(() => {
    const fetchAllNotifications = async () => {
      try {
        setIsLoading(true);
        const headers = {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        };

        const readNotifications = getReadNotifications();

        const [recharges, users, investments, , withdrawals, purchaseRequests] = await Promise.all([
          fetchRecharges(headers),
          fetchUsers(headers),
          fetchInvestments(headers),
          // Se eliminó fetchInvestmentWithdrawals() ya que no se estaba utilizando
          Promise.resolve([]), // Placeholder para mantener el orden
          fetchWithdrawals(headers),
          fetchPurchaseRequests(headers)
        ]);

        const pendingInvestments = mapInvestmentsToNotifications(investments);
        const pendingRecharges = mapRechargesToNotifications(recharges);
        const newUsers = mapUsersToNotifications(users);

        const pendingPurchaseRequests = purchaseRequests
          .filter((pr: PurchaseRequest) => pr.status === 'pending')
          .map(pr => {
            const price = Number(pr.product?.price) || 0;
            const quantity = pr.quantity || 1;
            const totalPrice = price * quantity;
            const totalText = (
              <span className="flex items-center">
                <AtipayCoin size="xs" className="mr-1" />
                {totalPrice.toFixed(2)}
              </span>
            );
            const userName = pr.user?.name || pr.user?.username || pr.user_name || 'Usuario';
            const productName = pr.product?.name || 'un producto';

            return {
              id: `purchase-request-${pr.id}`,
              type: 'purchase_request' as const,
              userId: pr.user_id,
              userName,
              amount: totalPrice, // Using total price for sorting
              status: pr.status,
              createdAt: new Date(pr.created_at || Date.now()),
              product: pr.product ? {
                id: pr.product.id,
                name: pr.product.name,
                price: price,
                quantity: quantity
              } : undefined,
              userData: pr.user || undefined,
              message: (
              <span>
                {userName} ha solicitado comprar {quantity > 1 ? `${quantity} unidades de ${productName}` : productName} por {totalText}
              </span>
            )
            };
          });

        const pendingWithdrawals = withdrawals
          .filter((w: Withdrawal) => w.status === 'pending')
          .map(w => ({
            id: `withdrawal-${w.id}`,
            type: 'withdrawal_request' as const,
            userId: w.user_id.toString(),
            userName: w.user_name,
            amount: w.amount,
            status: w.status,
            createdAt: new Date(w.created_at),
            message: `Solicitud de retiro por $${w.amount.toFixed(2)}`,
            userData: {
              id: parseInt(w.user_id) || 0,
              username: w.user?.username || w.user_name,
              name: w.user?.name || w.user_name,
              email: w.user?.email || '',
              role_id: w.user?.role_id || 0,
              status: w.user?.status || '',
              atipay_money: w.user?.atipay_money || 0,
              accumulated_points: w.user?.accumulated_points || 0,
              reference_code: w.user?.reference_code || '',
              referred_by: w.user?.referred_by || null,
              registration_date: new Date().toISOString(),
              registration_time: new Date().toISOString(),
              referral_url: '',
              created_at: w.created_at || new Date().toISOString(),
              updated_at: w.updated_at || new Date().toISOString()
            } as User
          }));

        // Show all notifications, not limited to 10
        const allNotifications = [
          ...pendingInvestments,
          ...pendingRecharges,
          ...newUsers,
          ...pendingWithdrawals,
          ...pendingPurchaseRequests
        ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Filtrar notificaciones leídas
        const unreadNotifications = allNotifications.filter(notification => !readNotifications.has(notification.id));
        
        setNotifications(unreadNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar las notificaciones',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllNotifications();
    const interval = setInterval(fetchAllNotifications, 60000);
    return () => clearInterval(interval);
  }, [toast]);

  const renderNotifications = () => {
    if (isLoading) {
      return (
        <div className="py-6 text-center">
          <div className="animate-spin rounded-full h-6 w-6  mx-auto"></div>
          <p className="mt-2 text-sm text-gray-50">Cargando notificaciones...</p>
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="p-6 text-center">
          <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-black">No hay notificaciones</p>
          <p className="text-xs text-gray-400 mt-1">Las nuevas notificaciones aparecerán aquí</p>
        </div>
      );
    }

    return (
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 ">
        {notifications.map((notification) => (
          <Link
            key={notification.id}
            to={getNotificationLink(notification.type, notification.userId)}
            className="block px-4 py-3 hover:bg-green-600/20 transition-colors duration-150"
            onClick={() => {
              // Cerrar el dropdown
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
              // Marcar como leída en localStorage
              markAsRead(notification.id);
              // Eliminar la notificación del estado
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${notification.type === 'investment' ? 'bg-green-100' :
                    notification.type === 'purchase_request' ? 'bg-blue-100' :
                      'bg-green-200'
                  }`}>
                  {notification.type === 'investment' ? (
                    <svg
                      className="h-4 w-4 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  ) : notification.type === 'purchase_request' ? (
                    <svg
                      className="h-4 w-4 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M8 11v6a2 2 0 002 2h4a2 2 0 002-2v-6M8 11h8"
                      />
                    </svg>
                  ) : notification.type === 'withdrawal_request' ? (
                    <svg
                      className="h-4 w-4 text-yellow-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-black">
                  {notification.userName}
                </p>
                <div className="text-sm text-gray-600">
                  {getNotificationMessage(notification)}
                </div>
                <div className="mt-1">
                  <span className="text-xs font-medium text-black">
                    Ver detalles
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-lg border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {notifications.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {notifications.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0 bg-white rounded-md shadow-lg border border-gray-200" align="end" forceMount>
        <div className="px-4 py-3 border-b ">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-black">Notificaciones</h3>
            {notifications.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-200 text-green-900">
                {notifications.length} nuevas
              </span>
            )}
          </div>
        </div>
        {renderNotifications()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
