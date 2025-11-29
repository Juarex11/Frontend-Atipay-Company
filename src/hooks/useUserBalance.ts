import { useState, useEffect } from 'react';
import { getCurrentUserProfile } from '@/services/user.service';

export const useUserBalance = () => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const userProfile = await getCurrentUserProfile();
      setBalance(userProfile.atipayMoney);
      setError(null);
    } catch (err) {
      console.error('Error al obtener el saldo del usuario:', err);
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const refreshBalance = async () => {
    await fetchBalance();
  };

  return { balance, loading, error, refreshBalance };
};
