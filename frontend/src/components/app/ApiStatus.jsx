import { useEffect, useState } from 'react';
import { useData } from '../../shared/data/RentalDataContext';
import { useAuth } from '../../features/auth/AuthContext';
import { ChevronDown, ChevronUp } from 'lucide-react';
import MutationToasts from '../shared/MutationToasts';

export default function ApiStatus() {
  const { error, loading, tenants = [], mutationNotifications = [], dismissMutationNotification } = useData();
  const { testMode, user, switchRole } = useAuth();
  const [message, setMessage] = useState('');
  const [dismissedError, setDismissedError] = useState('');
  const switchTestRole = role => {
    const tenant = role === 'TENANT' && tenants.reduce((selected, row) => (
      !selected || Number(row.id) < Number(selected.id) ? row : selected
    ), null);
    switchRole(role, tenant ? {
      id: tenant.id,
      tenantId: tenant.id,
      fullName: tenant.fullName,
      email: tenant.email,
      room: tenant.room,
      rooms: tenant.rooms,
    } : {});
  };
  const notifications = [...mutationNotifications];
  const externalError = message || (error !== dismissedError ? error : '');
  if (externalError && !notifications.some(row => row.state === 'error' && row.message === externalError)) {
    notifications.unshift({ id: 'api-error', state: 'error', message: externalError });
  }
  const dismissNotification = id => {
    if (id === 'api-error') { setMessage(''); setDismissedError(error); }
    else {
      const mutation = mutationNotifications.find(row => row.id === id);
      if (mutation?.state === 'error') {
        if (message === mutation.message) setMessage('');
        if (error === mutation.message) setDismissedError(error);
      }
      dismissMutationNotification(id);
    }
  };
  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      return localStorage.getItem('rental_test_banner_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const toggleMinimized = () => {
    setIsMinimized(prev => {
      const next = !prev;
      try {
        localStorage.setItem('rental_test_banner_minimized', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const listener = (e) => { if (!mutationNotifications.some(row => row.state === 'pending')) setMessage(e.detail); };
    window.addEventListener('rental:api-error', listener);
    return () => window.removeEventListener('rental:api-error', listener);
  }, [mutationNotifications]);

  const roleLabel =
    user?.role === 'ADMIN'
      ? 'Quản trị'
      : user?.role === 'TENANT'
      ? 'Khách thuê'
      : 'Quản lý phòng trọ';

  return (
    <>
      {/* Test mode banner */}
      {testMode && (
        <div className="fixed bottom-20 lg:bottom-4 right-4 sm:right-6 z-30 max-w-sm transition-all duration-200">
          {isMinimized ? (
            <button
              onClick={toggleMinimized}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/95 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg border border-amber-300 backdrop-blur-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
              title="Mở rộng bảng chọn màn hình kiểm thử"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Test: {roleLabel}</span>
              <ChevronUp className="w-3.5 h-3.5 text-slate-900" />
            </button>
          ) : (
            <div className="rounded-2xl bg-amber-50/95 backdrop-blur-md border border-amber-300/90 p-3 shadow-xl text-xs text-slate-800">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Test nghiệp vụ • {loading ? 'Đang tải…' : 'Gateway API'}</span>
                </div>
                <button
                  type="button"
                  onClick={toggleMinimized}
                  className="p-1 rounded-lg text-amber-800 hover:bg-amber-200/70 transition-colors cursor-pointer"
                  title="Thu gọn bảng chọn"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  aria-label="Chọn màn hình kiểm thử"
                  value={user?.role || 'STAFF'}
                  onChange={event => switchTestRole(event.target.value)}
                  className="w-full bg-white border border-amber-300 text-slate-800 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
                >
                  <option value="STAFF">Quản lý phòng trọ (STAFF)</option>
                  <option value="TENANT">Khách thuê (TENANT)</option>
                  <option value="ADMIN">Quản trị (ADMIN)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      <MutationToasts notifications={notifications} onDismiss={dismissNotification} />
    </>
  );
}
