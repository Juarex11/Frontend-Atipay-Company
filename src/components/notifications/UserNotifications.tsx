import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Bell, Check, X, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { es } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";

interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

export function UserNotifications() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Simulated fetch - replace with actual API call
  useEffect(() => {
    const fetchUserNotifications = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call to get user-specific notifications
        // const response = await fetch('/api/user/notifications');
        // const data = await response.json();

        // Mock data for now
        const mockData: UserNotification[] = [
          {
            id: '1',
            title: 'Depósito recibido',
            message: 'Tu depósito de S/ 500.00 ha sido acreditado',
            type: 'success',
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
            link: '/transactions'
          },
          {
            id: '2',
            title: 'Retiro pendiente',
            message: 'Tu solicitud de retiro está siendo procesada',
            type: 'info',
            read: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            link: '/my-withdrawals'
          },
        ];

        setNotifications(mockData);
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

    fetchUserNotifications();
    // Set up polling every 5 minutes
    const interval = setInterval(fetchUserNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [toast]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    // TODO: Call API to mark notification as read
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // TODO: Call API to mark all notifications as read
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="end">
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Mis notificaciones</h3>
            {notifications.some(n => !n.read) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Marcar todo como leído
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-6 text-center text-sm text-gray-500">
            Cargando notificaciones...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No tienes notificaciones
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50' : ''
                  }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: es
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t text-center">
            <a
              href="/notifications"
              className="text-sm text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Ver todas las notificaciones
            </a>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
