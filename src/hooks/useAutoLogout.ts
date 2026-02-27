import { useEffect, useCallback } from 'react';
// Ya no necesitamos useNavigate, usamos window.location para forzar limpieza
// import { useNavigate } from 'react-router-dom'; 

// ⏱️ TIEMPO DE INACTIVIDAD (30 minutos)
const INACTIVITY_LIMIT = 30 * 60 * 1000; 

const useAutoLogout = () => {
  let timer: NodeJS.Timeout;

  // Acción de cerrar sesión
  const handleLogout = useCallback(() => {
    // 1. Borramos datos de sesión
    localStorage.removeItem('token'); 
    localStorage.removeItem('user'); 
    
    // 2. ✅ CAMBIO CLAVE: Usamos esto en vez de navigate()
    // Esto fuerza al navegador a recargar desde cero, evitando el bucle de error.
    window.location.href = '/login'; 
  }, []);

  // Reiniciar el contador
  const resetTimer = useCallback(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(handleLogout, INACTIVITY_LIMIT);
  }, [handleLogout]);

  useEffect(() => {
    // Eventos que detectan actividad
    const events = [
      'mousemove', 
      'keydown', 
      'click', 
      'scroll', 
      'touchstart'
    ];

    // Escuchar eventos
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Iniciar timer al cargar
    resetTimer();

    // Limpieza
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer]);
};

export default useAutoLogout;