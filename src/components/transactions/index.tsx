import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getWalletBalance } from "@/services/walletService";


import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";


import { TransactionsTable } from "./TransactionsTable";
import { SummaryCards } from "./SummaryCards";
import { TransactionFilters } from "./TransactionFilters";
import { DepositStepper } from "./DepositStepper";

import { getMyRecharges } from "@/services/atipayRechargeService";
import {
  getCurrentUserProfile,
  type UserProfileNormalized,
} from "@/services/user.service";
import { getUserPaymentMethods, type UserPaymentMethod } from "@/services/userPaymentMethodService";

import type {
  Transaction,
  PaymentMethod,
} from "@/types/transactions";
import type { Recharge } from "@/services/atipayRechargeService";

// Tipo extendido para incluir información del método de pago
interface TransactionWithPaymentMethod extends Omit<Transaction, 'reference'> {
  reference?: string; // Hacer reference opcional ya que la API no lo envía
  user_payment_method_id?: number;
  payment_method_name?: string;
}

const getPaymentMethodName = (userPaymentMethodId: number, userPaymentMethods: UserPaymentMethod[]): string => {
  const userPaymentMethod = userPaymentMethods.find(pm => pm.id === userPaymentMethodId);
  return userPaymentMethod?.method.name || 'Método desconocido';
};

const mapRechargeToTransaction = (recharge: Recharge, userPaymentMethods: UserPaymentMethod[]): TransactionWithPaymentMethod => {
  const date = new Date(recharge.request_at || recharge.created_at || new Date());

  return {
    id: recharge.id.toString(),
    date: date.toISOString(),
    description: `Recarga de saldo`,
    amount: recharge.amount,
    fee: 0,
    category: "recharge",
    type: "deposit",
    status: recharge.status as Transaction["status"],
    method: 'other' as PaymentMethod, // Tipo genérico, el nombre real se obtiene por ID
    proof_image: recharge.proof_image_url,
    created_at: recharge.request_at || recharge.created_at || new Date().toISOString(),
    updated_at: recharge.processed_at || recharge.updated_at || undefined,
    admin_message: recharge.admin_message || undefined,
    user_payment_method_id: Number(recharge.user_payment_method_id),
    payment_method_name: getPaymentMethodName(Number(recharge.user_payment_method_id), userPaymentMethods)
  };
};

const Transactions = () => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithPaymentMethod[]>([]);
  const [depositDialog, setDepositDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfileNormalized | null>(null);
  const [userPaymentMethods, setUserPaymentMethods] = useState<UserPaymentMethod[]>([]);
  const [filterType, setFilterType] = useState<Transaction["type"] | "all">("all");
  const [filterStatus, setFilterStatus] = useState<Transaction["status"] | "all">("all");

  const fetchBalance = useCallback(async () => {
    try {
      const balance = await getWalletBalance();
      setAvailableBalance(balance.balance);
      return balance.balance;
    } catch (error) {
      console.error("Error al cargar el saldo:", error);
      toast.error("Error al cargar el saldo", {
        description: "No se pudo actualizar el saldo. Por favor, intenta recargar la página.",
      });
      throw error;
    }
  }, []);

  const handleAuthError = useCallback((error: { response?: { status: number } }) => {
    if (error.response?.status === 401) {
      logout();
      throw new Error("Sesión expirada");
    }
    console.error("Error en la solicitud:", error);
    return [];
  }, [logout]);

  const loadData = useCallback(async () => {
    if (!user) {
      setError("Usuario no autenticado");
      toast.error("Debes iniciar sesión para ver las transacciones");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const loadRecharges = async () => {
        try {
          return await getMyRecharges();
        } catch (error) {
          return handleAuthError(error as { response?: { status: number } });
        }
      };

      const [recharges, profile, , paymentMethods] = await Promise.all([
        loadRecharges(),
        getCurrentUserProfile().catch((e) => {
          console.error("Error cargando perfil:", e);
          return null;
        }),
        fetchBalance(),
        getUserPaymentMethods().catch((e) => {
          console.error("Error cargando métodos de pago:", e);
          return [];
        })
      ]);

      setUserPaymentMethods(paymentMethods);
      const rechargeTransactions = recharges.map(recharge => mapRechargeToTransaction(recharge, paymentMethods));


      const sortedTransactions = [...rechargeTransactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactions(sortedTransactions);
      if (profile) setUserProfile(profile);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setError("Error al cargar los datos");
      toast.error("No se pudieron cargar los datos");
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchBalance, handleAuthError]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesStatus =
      filterStatus === "all" || transaction.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalEarnings = transactions
    .filter((t) => t.type === "return" || t.type === "commission")
    .reduce((sum, t) => sum + t.amount, 0);
  const handleDepositSuccess = useCallback((recharge?: unknown) => {
    if (recharge && typeof recharge === 'object' && 'id' in recharge) {
      const rechargeTyped = recharge as Recharge;
      const tx = mapRechargeToTransaction(rechargeTyped, userPaymentMethods);
      setTransactions((prev) => [tx, ...prev]);
      toast.info("Recarga registrada", {
        description:
          "Pendiente de aprobación. El saldo se acreditará al aprobarse.",
      });
    } else {
      setRefreshKey((p) => p + 1);
    }
  }, [userPaymentMethods]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <SummaryCards
        availableBalance={availableBalance}
        totalEarnings={totalEarnings}
        totalWithdrawalsCount={transactions
          .filter(t => t.type === 'withdrawal' && t.status === 'completed')
          .length}
        accumulatedPoints={userProfile?.accumulatedPoints}
        atipayMoney={userProfile?.atipayMoney}
      />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Historial de transacciones</h2>
          <Button
            onClick={() => setDepositDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Recargar saldo
          </Button>
        </div>

        <TransactionFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterType={filterType}
          onTypeChange={setFilterType}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
        />

        {filteredTransactions.length > 0 ? (
          <TransactionsTable transactions={filteredTransactions} />
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">
              {searchTerm || filterType !== "all" || filterStatus !== "all"
                ? "No se encontraron transacciones que coincidan con los filtros."
                : "No hay transacciones para mostrar."}
            </p>
          </div>
        )}
      </div>

      <DepositStepper
        open={depositDialog}
        onOpenChange={setDepositDialog}
        availableBalance={availableBalance}
        onDepositSuccess={handleDepositSuccess}
      />
    </div>
  );
};

// Asegúrate de que el componente se exporte como default
export default Transactions;
