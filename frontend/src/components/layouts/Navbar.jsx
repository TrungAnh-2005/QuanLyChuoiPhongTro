import { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  LogOut,
  AlertTriangle,
  Receipt,
  Wrench,
  Calendar,
  CheckCheck,
  Building2,
  Zap,
  Menu
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { useData } from '../../shared/data/RentalDataContext';
import { Link } from 'react-router-dom';

export default function Navbar({ onOpenMobileMenu = () => {} }) {
  const { user, logout, switchRole } = useAuth();
  const dataContext = useData() || {};
  const role = user?.role || 'ADMIN';

  const notifications = (dataContext.notifications || []).map(n => ({ ...n, desc: n.content, time: n.createdAt, link: n.type === 'INVOICE' ? '/invoices' : '/' }));

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = dataContext.unreadNotificationCount ?? 0;
  const markAllAsRead = () => dataContext.markAllNotificationsRead();
  const markSingleAsRead = id => dataContext.markNotificationRead(id);

  return (
    <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors">
      {/* Trái: Nút Menu di động + Logo Trọ Việt + Thanh tìm kiếm Desktop */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-md min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-purple-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          title="Mở menu điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo rút gọn trên mobile */}
        <div className="lg:hidden flex items-center gap-1.5 font-black text-slate-900 text-xs sm:text-sm tracking-tight shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-xs shadow-purple-600/30">
            TV
          </div>
          <span className="hidden xs:inline">TRỌ VIỆT</span>
        </div>

        {/* Ô tìm kiếm: Ẩn hoàn toàn khi ở quyền Admin (vì Admin không quản lý phòng lẻ và khách thuê) */}
        {role === 'ADMIN' ? (
          <div className="hidden 2xl:flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/70 whitespace-nowrap shrink-0">
            <span className="pulse-dot-green shrink-0" />
            <span className="text-slate-800 font-extrabold tracking-tight">Cổng Quản Trị Nền Tảng SaaS</span>
            <span className="text-slate-400 text-[11px] font-normal">• Giám Sát Toàn Sàn</span>
          </div>
        ) : (
          <div className="hidden md:flex relative w-full group max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-purple-600" />
            <input
              type="text"
              placeholder={role === 'STAFF' ? "Tìm kiếm phòng, khách thuê chi nhánh..." : "Tìm kiếm phòng trống, hóa đơn..."}
              className="w-full bg-slate-100/70 hover:bg-slate-100 border border-slate-200/80 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-200 ease-out"
            />
          </div>
        )}
      </div>

      {/* Phải: Chuyển đổi vai trò + Thông báo + Thông tin tài khoản */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Quick Role Switcher trực tiếp trên Navbar */}
        <div className="hidden sm:flex items-center gap-1.5 bg-amber-50/90 border border-amber-300/80 px-2.5 py-1 rounded-xl text-xs shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-amber-900 hidden md:inline">Vai trò:</span>
          <select
            value={role}
            onChange={(e) => {
              const r = e.target.value;
              const defaultTenant = (dataContext.tenants || [])[0];
              switchRole(
                r,
                r === 'TENANT' && defaultTenant
                  ? {
                      id: defaultTenant.id,
                      fullName: defaultTenant.fullName,
                      email: defaultTenant.email,
                      room: defaultTenant.room,
                      rooms: defaultTenant.rooms
                    }
                  : {}
              );
            }}
            className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
          >
            <option value="STAFF">Quản lý (Staff)</option>
            <option value="TENANT">Khách thuê (Tenant)</option>
            <option value="ADMIN">Quản trị (Admin)</option>
          </select>
        </div>

        {/* Notification bell & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            title="Xem thông báo hệ thống"
            className="bell-hover relative p-2 sm:p-2.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all duration-150 btn-press"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 bell-icon" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 px-1.5 py-0.2 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[9px] sm:text-[10px] font-black rounded-full shadow-xs live-indicator">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="fixed sm:absolute inset-x-2 sm:inset-x-auto right-auto sm:right-0 top-16 sm:top-auto sm:mt-2.5 w-auto sm:w-96 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl z-50 overflow-hidden dropdown-spring max-h-[80vh] flex flex-col">
              {/* Header Tối Giản */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800">Thông báo</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-800 transition-colors btn-press-ghost cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Đã đọc tất cả</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    Không có thông báo mới nào
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <Link
                      key={notif.id}
                      to={notif.link}
                      onClick={async () => {
try {

                        await markSingleAsRead(notif.id);
                        setShowDropdown(false);
                        const isReqNotif =
                          (notif.link && notif.link.includes('action=review-requests')) ||
                          String(notif.id).includes('-req-') ||
                          (notif.title && (
                            notif.title.includes('thuê') ||
                            notif.title.includes('đăng ký') ||
                            notif.title.includes('gia hạn') ||
                            notif.title.includes('trả phòng') ||
                            notif.title.includes('ở ghép')
                          ));
                        if (isReqNotif) {
                          window.dispatchEvent(new CustomEvent('rental:open-requests-manager', { detail: { notif } }));
                        }

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
}}
                      className={`p-3 sm:p-3.5 flex items-start gap-2.5 sm:gap-3 transition-colors hover:bg-slate-50 block ${
                        !notif.read ? 'bg-purple-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.type === 'URGENT' && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                        {notif.type === 'MAINTENANCE' && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                        {notif.type === 'INVOICE' && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                        {notif.type === 'CONTRACT' && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                        {notif.type === 'PRICE_CHANGE' && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                        {(notif.type === 'SYSTEM' || notif.type === 'NOTICE') && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {notif.title}
                          </h4>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                          {notif.desc}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">
                          {notif.time}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-50 text-center border-t border-slate-100 shrink-0">
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User profile */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-purple-500/20 text-xs sm:text-sm shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-bold text-slate-800 leading-tight flex items-center gap-1.5">
              <span className="truncate max-w-[120px]">{user?.fullName || 'Người dùng'}</span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold bg-purple-100 text-purple-700 border border-purple-200">
                {role}
              </span>
            </div>
            <div className="text-xs text-slate-500 truncate max-w-[140px]">{user?.email || 'user@rental.vn'}</div>
          </div>
          <button
            onClick={logout}
            title="Đăng xuất"
            className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
