import { useEffect, useRef } from 'react';
import { useData } from '../../shared/data/RentalDataContext';

export function useReservationRefresh(hasHolds) {
  const { refreshData } = useData();
  const refresh = useRef(refreshData);
  useEffect(() => { refresh.current = refreshData; }, [refreshData]);
  useEffect(() => {
    if (!hasHolds) return;
    let pending = false;
    const update = async () => {
      if (pending || document.visibilityState === 'hidden') return;
      pending = true;
      try { await refresh.current(); } catch { /* Existing API status reports refresh errors. */ }
      finally { pending = false; }
    };
    const timer = setInterval(update, 30000);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, [hasHolds]);
}
