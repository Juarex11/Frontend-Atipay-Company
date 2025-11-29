import { useEffect } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook para sincronizar sesión entre múltiples ventanas/tabs del navegador
 * Detecta cambios en localStorage y recarga el token si es necesario
 */
export function useMultiTabSync() {
  const { refreshToken } = useAuth();

  useEffect(() => {
    // Escucha cambios en localStorage desde otras ventanas
    const handleStorageChange = (event: StorageEvent) => {
      // Si el token cambió en otra ventana, recarga la sesión actual
      if (event.key === 'token' || event.key === 'auth_user') {
        console.log('📡 Sincronizando sesión desde otra ventana...');
        
        // Si el token se limpió (logout en otra ventana), hacer logout aquí también
        if (!event.newValue) {
          window.location.reload();
        } else {
          // Refrescar el token para mantener sincronización
          setTimeout(() => {
            refreshToken?.();
          }, 500);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshToken]);
}
