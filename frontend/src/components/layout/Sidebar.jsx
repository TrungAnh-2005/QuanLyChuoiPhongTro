import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  FileText,
  Zap,
  Receipt,
  Wrench,
  BarChart3,
  Layers,
  Cpu,
  ShieldCheck,
  CreditCard,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const adminNavItems = [
  { name: 'Tổng Quan Nền Tảng', path: '/', icon: LayoutDashboard },
  { name: 'Quản Trị Chủ Trọ & Gói', path: '/admin/landlords', icon: Users },
  { name: 'Quản Trị & Duyệt Cơ Sở', path: '/admin/houses', icon: Building2 },
  { name: 'Hóa Đơn Cước Gói SaaS', path: '/admin/saas-invoices', icon: Receipt },
  { name: 'Cấu Hình Tích Hợp', path: '/admin/integrations', icon: Layers },
  { name: 'Giám Sát Hệ Thống & Logs', path: '/admin/system', icon: Cpu },
  { name: 'Báo Cáo Toàn Sàn', path: '/reports', icon: BarChart3 },
];

const staffNavItems = [
  { name: 'Tổng Quan Vận Hành', path: '/', icon: LayoutDashboard },
  { name: 'Cơ Sở Nhà Trọ', path: '/houses', icon: Building2 },
  { name: 'Sơ Đồ Phòng Trọ', path: '/rooms', icon: Home },
  { name: 'Hồ Sơ Khách & Hợp Đồng', path: '/tenants', icon: Users },
  { name: 'Chỉ Số Điện & Nước (AI)', path: '/meters', icon: Zap },
  { name: 'Hóa Đơn Thu Tiền (Khách)', path: '/invoices/tenant', icon: Receipt },
  { name: 'Hóa Đơn Nộp Tiền (Admin)', path: '/invoices/saas', icon: ShieldCheck },
  { name: 'Bảo Trì & Sự Cố', path: '/maintenance', icon: Wrench },
  { name: 'Báo Cáo Doanh Thu Cơ Sở', path: '/reports', icon: BarChart3 },
];

const getTenantNavItems = (isAssociatedWithLandlord = false) => [
  { name: 'Cổng Khách Thuê & Hợp Đồng', path: '/', icon: LayoutDashboard },
  {
    name: isAssociatedWithLandlord ? 'Phòng Thuộc Chuỗi Chủ Trọ' : 'Khám Phá Phòng Trọ',
    path: '/rooms',
    icon: Building2
  },
  { name: 'Chỉ Số Điện Nước (Đối Soát)', path: '/meters', icon: Zap },
  { name: 'Hóa Đơn & Tiền Phòng', path: '/invoices', icon: Receipt },
  { name: 'Báo Hỏng & Sửa Chữa', path: '/maintenance', icon: Wrench },
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  // Kiểm tra khách đã thuê phòng hoặc đang ở chế độ cọc với chủ trọ chưa
  const isAssociatedWithLandlord = React.useMemo(() => {
    if (role !== 'TENANT' || !user) return false;
    if (user.status === 'WAITING_ROOM') return false;

    // 1. Kiểm tra phòng đang thuê trực tiếp từ user
    if (user.room || (user.rooms && user.rooms.length > 0)) return true;

    // 2. Kiểm tra tenantRooms từ localStorage
    try {
      const s = localStorage.getItem('rental_tenant_rooms');
      if (s) {
        const parsed = JSON.parse(s);
        const myRooms = parsed[user.username] || (user.fullName ? parsed[user.fullName] : null);
        if (Array.isArray(myRooms) && myRooms.length > 0) return true;
        if (typeof myRooms === 'string' && myRooms.trim()) return true;
      }
    } catch {}

    // 3. Kiểm tra đơn cọc / holding hoặc hợp đồng pending deposit
    try {
      const sReq = localStorage.getItem('rental_room_requests');
      if (sReq) {
        const reqs = JSON.parse(sReq);
        const uName = (user.fullName || '').toLowerCase().trim();
        const uPhone = (user.phone || '').trim();
        const hasDeposit = reqs.some((r) => {
          const isDep = r.status === 'APPROVED' || r.status === 'HOLDING';
          const rTenant = (r.tenant || '').toLowerCase().trim();
          const rPhone = (r.phone || '').trim();
          return isDep && ((uName && rTenant.includes(uName)) || (uPhone && rPhone === uPhone));
        });
        if (hasDeposit) return true;
      }
    } catch {}

    return false;
  }, [role, user]);

  const navItems =
    role === 'TENANT'
      ? getTenantNavItems(isAssociatedWithLandlord)
      : role === 'STAFF'
      ? staffNavItems
      : adminNavItems;

  const pendingHousesCount = React.useMemo(() => {
    if (role !== 'ADMIN') return 0;
    try {
      const s = localStorage.getItem('rental_boarding_houses');
      if (s) {
        const arr = JSON.parse(s);
        return Array.isArray(arr) ? arr.filter((h) => h.status === 'PENDING_APPROVAL').length : 0;
      }
    } catch {}
    return 0;
  }, [role]);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-md text-slate-700">
      {/* Brand Logo & Close Button */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100/90 bg-white/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/25 font-black text-lg shrink-0 transition-transform duration-200 hover:scale-105">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight leading-none text-sm">
                TRỌ VIỆT SAAS
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1 tracking-normal">
              Quản lý vận hành tập trung
            </div>
          </div>
        </div>

        {/* Close button for mobile drawer */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition-colors cursor-pointer"
          title="Đóng menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3.5 py-2 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>
            {role === 'ADMIN'
              ? 'HẠ TẦNG QUẢN TRỊ SAAS'
              : role === 'STAFF'
              ? 'VẬN HÀNH CƠ SỞ CHUỖI'
              : 'CỔNG CƯ DÂN TRỰC TUYẾN'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 btn-press-ghost ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50/90 to-purple-50/60 text-indigo-700 border border-indigo-200/70 shadow-xs font-extrabold translate-x-0.5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-lg transition-colors ${
                    isActive ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 group-hover:text-indigo-600'
                  }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <span className="truncate flex-1">{item.name}</span>
                  {item.path === '/admin/houses' && role === 'ADMIN' && pendingHousesCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse shadow-xs">
                      {pendingHousesCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-100/90 bg-white/60">
        <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border border-emerald-200/70 rounded-2xl p-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Hệ thống trực tuyến</span>
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-1 pl-4 font-medium flex items-center justify-between">
            <span>10 Microservices</span>
            <span className="font-bold text-emerald-800">99.9% Uptime</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: Permanent fixed-width on large screens */}
      <aside className="hidden lg:flex w-64 flex-col h-full border-r border-slate-200/80 shrink-0 bg-white">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer with Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={onClose}
          />
          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10 transition-transform duration-300 ease-out transform translate-x-0 bg-white">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
