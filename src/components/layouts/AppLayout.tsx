import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { Link, useLocation } from "react-router-dom"; // Asegúrate que sea react-router-dom
import { getUserProfile, type UserProfile } from "@/services/userService";

// Importamos los iconos UNA SOLA VEZ
import {
  TrendingUp,
  BarChart3,
  Users,
  ShoppingCart,
  Gift, // <--- Aquí está Gift, solo una vez
  Settings,
  LogOut,
  Menu,
  X,
  HandCoins,
  Package,
  CreditCard,
  ArrowLeftRight,
  Activity,
  ShoppingBag,
  Trophy,
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: Readonly<AppLayoutProps>) {
  const context = useContext(AuthContext);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!context?.user?.id) return;

    const userId = context.user.id;
    const fetchUserProfile = async () => {
      if (userProfile?.id?.toString() === userId) return;

      try {
        const cachedProfile = localStorage.getItem(`userProfile_${userId}`);
        if (cachedProfile) {
          try {
            const parsed = JSON.parse(cachedProfile);
            setUserProfile(parsed);
            return;
          } catch {
            // Error parsing, continue fetch
          }
        }

        const profile = await getUserProfile();
        setUserProfile(profile);
        localStorage.setItem(`userProfile_${userId}`, JSON.stringify(profile));
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [context?.user?.id, userProfile?.id]);

  if (!context || !context.user) return null;

  const { user, logout } = context;

  const sidebarItems =
    user?.role === "admin"
      ? [
        { icon: BarChart3, label: "Dashboard", href: "/admin" },
        { icon: Activity, label: "Inversiones Activas", href: "/admin/inversiones-activas" },
        { icon: ShoppingBag, label: "Registrar Compra", href: "/admin/manual-purchase" },
        { icon: Users, label: "Usuarios", href: "/admin/users" },
        { icon: HandCoins, label: "Retiros", href: "/withdrawals" },
        { icon: Trophy, label: "Ranking de Ventas", href: "/admin/ranking" },
        { icon: ShoppingCart, label: "Tienda", href: "/store" },
        { icon: Gift, label: "Regalos", href: "/admin/gifts" },
        { icon: Gift, label: "Promociones", href: "/promotions" },
        { icon: CreditCard, label: "Métodos de Pago", href: "/admin/payment-methods" } 
      ]
      : [
        { icon: BarChart3, label: "Mi Dashboard", href: "/dashboard" },
        {
          icon: TrendingUp,
          label: "Mis Inversiones",
          href: "/my-investments",
        },
        { icon: HandCoins, label: "Mis Retiros", href: "/my-withdrawals" },
        { icon: HandCoins, label: "Mis Comisiones", href: "/commissions" },
        { icon: Trophy, label: "Ranking de ventas", href: "/ranking" },
        { icon: Users, label: "Mi Equipo", href: "/my-affiliates" },
        { icon: ShoppingCart, label: "Tienda", href: "/store" },
        { icon: Gift, label: "Catálogo de Regalos", href: "/gifts" },
        { icon: Gift, label: "Calificación de Rango", href: "/user/my-rewards" }, 
        { icon: CreditCard, label: "Mis Transacciones", href: "/transactions" },
        { icon: ArrowLeftRight, label: "Transferencias", href: "/transfers" },
        { icon: Settings, label: "Mi Perfil", href: "/profile" },
      ];

  const adminItems = [
    { icon: Users, label: "Red de Afiliados", href: "/admin/affiliates" },
    { icon: Package, label: "Tienda Admin", href: "/admin/store" },
    { icon: BarChart3, label: "Reporte de Comisiones", href: "/admin/reports/commissions" },
    { icon: TrendingUp, label: "Configurar Comisiones", href: "/admin/commissions" },
    { icon: Trophy, label: "Calificación De Rangos", href: "/admin/rewards-settings" }, 
    { icon: Settings, label: "Perfil de Admin", href: "/admin/profile" }
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-40 bg-gradient-to-r from-black/40 via-black/30 to-transparent backdrop-blur-sm sm:hidden focus:outline-none"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === 'Enter' && setSidebarOpen(false)}
          aria-label="Cerrar menú"
          type="button"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 
          w-64 bg-gradient-to-bl from-green-600 via-green-800 to-gray-900
          backdrop-blur-md
          shadow-2xl shadow-green-900/50
          transform transition-transform duration-300 ease-in-out 
          -translate-x-full
          ${sidebarOpen ? "translate-x-0" : ""}
          sm:translate-x-0
          flex flex-col
          h-screen
        `}
      >
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img
                src="/assets/atipay_logo2.png"
                alt="Atipay Logo"
                className="h-12 sm:h-14 md:h-16 object-contain"
              />
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              onKeyDown={(e) => e.key === 'Enter' && setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white sm:hidden"
              aria-label="Toggle menu"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 sm:px-3 pb-2 scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-green-900/20">
            {/* User Profile Card */}
            <div className="py-2 mb-4">
              <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-white truncate mb-1 sm:mb-2">
                      {userProfile ? userProfile.username : user.username}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[9px] sm:text-[10px] md:text-[11px] px-2 py-1 rounded-full font-medium ${user.role === "admin"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-blue-600/40 text-white border border-blue-800/50"
                        }`}>
                        {user.role === "admin" ? "ADMINISTRADOR" : "USUARIO"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] sm:text-xs text-green-200/60">Correo electrónico:</div>
                    <div className="text-[10px] sm:text-xs font-medium text-green-200/90 truncate">
                      {userProfile ? userProfile.email : (user.email || 'No especificado')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              <ul className="space-y-2 sm:space-y-1">
                {sidebarItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                      flex items-center space-x-3 px-3 py-3 sm:py-3 rounded-lg 
                      text-sm font-medium transition-colors min-h-[44px]
                      ${isActive(item.href)
                          ? "bg-green-500/20 text-green-500 border border-green-500/30"
                          : "text-white hover:bg-green-500/20 hover:text-white"
                        }
                    `}
                    >
                      <item.icon className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Admin Section */}
              {user?.role === "admin" && (
                <div className="pt-4">
                  <div className="px-2 sm:px-3 py-3 sm:py-4">
                    <div className="h-px bg-navy-700/50"></div>
                  </div>
                  <div className="px-2 sm:px-3 mb-3">
                    <span className="text-[10px] sm:text-xs font-semibold text-green-500 uppercase tracking-wider">
                      Administración
                    </span>
                  </div>
                  <ul className="space-y-1.5 sm:space-y-1">
                    {adminItems.map((item) => (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                          flex items-center space-x-3 sm:space-x-3 px-3 sm:px-3 py-3 sm:py-3 rounded-lg 
                          text-sm sm:text-sm font-medium transition-colors min-h-[52px]
                          ${isActive(item.href)
                              ? "bg-green-500/20 text-gold-500 border border-green-500/30"
                              : "text-white hover:bg-green-500/20 hover:text-white"
                            }
                        `}
                        >
                          <item.icon className="w-6 h-6 sm:w-6 sm:h-6 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </nav>
          </div>
        </div>

        {/* Logout */}
        <div className="flex-shrink-0 border-t border-green-800/50 p-2 sm:p-3">
          <Button
            onClick={logout}
            variant="ghost"
            className="w-full justify-start text-green-500 hover:bg-green-500/20 hover:text-white text-sm sm:text-sm h-9 sm:h-9"
          >
            <LogOut className="w-4 h-4 sm:w-4 sm:h-4 mr-2 sm:mr-2 flex-shrink-0" />
            <span className="truncate text-sm sm:text-sm">Cerrar sesión</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="min-h-screen relative z-0 sm:ml-64">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="sm:hidden p-1 sm:p-2"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl font-display font-semibold text-green-500">
                  Sistema Atipay
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center space-x-2">
                  <span>
                    {user.role === "admin"
                      ? "Panel de Administración"
                      : "Panel de Usuario"}
                  </span>
                  {user.role === "admin" && (
                    <span className="px-1 sm:px-2 py-0.5 sm:py-1 bg-red-100 text-red-700 text-[10px] sm:text-xs rounded font-medium">
                      ADMIN
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <NotificationsDropdown />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full"
                  >
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarFallback className="bg-green-500 text-white text-xs sm:text-sm">
                        {userProfile
                          ? userProfile.username.charAt(0).toUpperCase()
                          : user.firstName.charAt(0).toUpperCase()
                        }
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)] p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}