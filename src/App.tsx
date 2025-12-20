import "./index.css";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layouts/AppLayout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import Login from "./pages/Login";
import NewRegister from "./pages/NewRegister";
import Dashboard from "./pages/usuario/Dashboard";
import UserInvestments from "./pages/usuario/UserInvestments";
import Store from "./pages/Store";
import Transactions from "./pages/Transactions";
import { Transfers } from "./pages/Transfers";
import Promotions from "./pages/Promotions";
import AdminDashboard from "./pages/admin/Dashboard/AdminDashboard";
import { StoreManagement } from "@/pages/admin/StoreManagement";
import { GiftsManagement } from "@/pages/admin/GiftsManagement";
import ActiveInvestmentsPage from './pages/admin/ActiveInvestmentsPage';


import UserAffiliates from "@/pages/usuario/UserAffiliates";
import UserProfile from "./pages/usuario/UserProfile";
import GiftCatalog from "./pages/usuario/GiftCatalog";
import CommissionsSettings from "./pages/admin/CommissionsSettings";
import AddProductPage from "./pages/admin/AddProductPage";
import UserWithdrawals from "./pages/usuario/UserWithdrawals";
import WithdrawalsAdmin from "./pages/WithdrawalsAdmin";
import UsersManagement from "./pages/admin/UsersManagement";
import Commissions from "./pages/Commissions";
import CommissionsReportsPage from "./pages/admin/CommissionsReportsPage";
import AffiliateNetwork from "./pages/admin/AffiliateNetwork";
import AdminProfileSettings from "./pages/admin/AdminProfileSettings";
import AdminPaymentMethods from "./pages/admin/AdminPaymentMethods";
import SalesRanking from "./pages/SalesRanking";
import AdminSalesRanking from "./pages/admin/AdminSalesRanking";
import NotFound from "./pages/NotFound";
import { ManualPurchasePage } from "./pages/admin/ManualPurchasePage";

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  readonly children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-navy-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

interface AdminRouteProps {
  readonly children: React.ReactNode;
}

function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-navy-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }


  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}


interface PublicRouteProps {
  readonly children: React.ReactNode;
}

function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-navy-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Iniciando sistema...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <NewRegister />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      {/* Placeholder routes for future pages */}
      <Route
        path="/mis-inversiones"
        element={
          <ProtectedRoute>
            <UserInvestments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/store"
        element={
          <ProtectedRoute>
            <Store />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transfers"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Transfers />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/payment-methods"
        element={
          <AdminRoute>
            <AppLayout>
              <AdminPaymentMethods />
            </AppLayout>
          </AdminRoute>
        }

        //NUEVA RUTA PARA INVERSIONES ACTIVAS ADMIN

      />
        <Route
  // --- AGREGA EL PREFIJO AQUÍ ---
  path="/admin/inversiones-activas"
  element={
    <AdminRoute>
      <AppLayout>
        <ActiveInvestmentsPage />
      </AppLayout>
    </AdminRoute>
  }
        
      />
      <Route
        path="/admin/commissions"
        element={
          <AdminRoute>
            <AppLayout>
              <CommissionsSettings />
            </AppLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/promotions"
        element={
          <ProtectedRoute>
            <Promotions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/store"
        element={
          <AdminRoute>
            <AppLayout>
              <StoreManagement />
            </AppLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/gifts"
        element={
          <AdminRoute>
            <AppLayout>
              <GiftsManagement />
            </AppLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/products/new"
        element={
          <AdminRoute>
            <AppLayout>
              <AddProductPage />
            </AppLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/withdrawals"
        element={
          <AdminRoute>
            <AppLayout>
              <WithdrawalsAdmin />
            </AppLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AppLayout>
              <UsersManagement />
            </AppLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/affiliates"
        element={
          <AdminRoute>
            <AppLayout>
              <AffiliateNetwork />
            </AppLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/payment-methods"
        element={
          <AdminRoute>
            <AppLayout>
              <AdminPaymentMethods />
            </AppLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/ranking"
        element={
          <AdminRoute>
            <AppLayout>
              <AdminSalesRanking />
            </AppLayout>
          </AdminRoute>
        }
      />
      <Route
      path="/admin/reports/commissions"
      element={
        <AdminRoute>
        <AppLayout>
          <CommissionsReportsPage />
          </AppLayout>
        </AdminRoute>
      }
/>
      <Route
        path="/admin/profile"
        element={
          <AdminRoute>
            <AppLayout>
              <AdminProfileSettings />
            </AppLayout>
          </AdminRoute>
        }
      />

      {/* Registro de Compra Manual (admin) */}
      <Route
        path="/admin/manual-purchase"
        element={
          <AdminRoute>
            <AppLayout>
              <ManualPurchasePage />
            </AppLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gifts"
        element={
          <ProtectedRoute>
            <GiftCatalog />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-investments"
        element={
          <ProtectedRoute>
            <UserInvestments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-affiliates"
        element={
          <ProtectedRoute>
            <AppLayout>
              <UserAffiliates />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-withdrawals"
        element={
          <ProtectedRoute>
            <AppLayout>
              <UserWithdrawals />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/commissions"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Commissions />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ranking"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SalesRanking />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Configuración</h1>
                <p className="text-muted-foreground">Próximamente...</p>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Sonner />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
