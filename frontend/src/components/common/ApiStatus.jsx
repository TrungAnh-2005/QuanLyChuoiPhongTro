import React, { useEffect, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown, ChevronUp, AlertCircle, RefreshCw, X } from 'lucide-react';

export default function ApiStatus() {
  const { error, loading, refreshData, tenants = [] } = useData();
  const { testMode, user, switchRole } = useAuth();
  const [message, setMessage] = useState('');
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
    const listener = (e) => setMessage(e.detail);
    window.addEventListener('rental:api-error', listener);
    return () => window.removeEventListener('rental:api-error', listener);
  }, []);

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
                  onChange={(e) =>
                    switchRole(
                      e.target.value,
                      e.target.value === 'TENANT' && tenants[0]
                        ? {
                            id: tenants[0].id,
                            fullName: tenants[0].fullName,
                            email: tenants[0].email,
                            room: tenants[0].room,
                            rooms: tenants[0].rooms
                          }
                        : {}
                    )
                  }
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

      {/* Loading state indicator for non-testMode */}
      {!testMode && loading && (
        <div
          role="status"
          className="fixed bottom-20 lg:bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-white/95 border border-slate-200 px-3.5 py-2 shadow-lg text-xs font-medium text-slate-700 backdrop-blur-md"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
          <span>Đang tải dữ liệu…</span>
        </div>
      )}

      {/* Error alert toast */}
      {(message || error) && (
        <div
          role="alert"
          className="fixed bottom-24 lg:bottom-6 right-4 sm:right-6 z-40 max-w-md rounded-2xl bg-rose-50/95 border border-rose-300 p-4 shadow-2xl text-xs backdrop-blur-md animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-900 leading-relaxed">{message || error}</p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={() => {
                    setMessage('');
                    refreshData();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer"
                >
                  Thử lại
                </button>
                <button
                  onClick={() => setMessage('')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 font-semibold hover:bg-rose-100/50 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
            <button
              onClick={() => setMessage('')}
              className="text-rose-400 hover:text-rose-700 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
