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

const tenantNavItems = [
  { name: 'Cổng Khách Thuê & Hợp Đồng', path: '/', icon: LayoutDashboard },
  { name: 'Phòng Thuộc Chuỗi Chủ Trọ', path: '/rooms', icon: Building2 },
  { name: 'Chỉ Số Điện Nước (Đối Soát)', path: '/meters', icon: Zap },
  { name: 'Hóa Đơn & Tiền Phòng', path: '/invoices', icon: Receipt },
  { name: 'Báo Hỏng & Sửa Chữa', path: '/maintenance', icon: Wrench },
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  const navItems =
    role === 'TENANT'
      ? tenantNavItems
      : role === 'STAFF'
      ? staffNavItems
      : adminNavItems;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Logo & Close Button */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 font-black text-lg">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-black text-white tracking-tight leading-none text-base">
              TRỌ VIỆT SAAS
            </div>
            <div className="text-[10px] text-purple-400 font-mono mt-1 tracking-wider uppercase">
              Microservices Platform
            </div>
          </div>
        </div>

        {/* Close button for mobile drawer */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
          title="Đóng menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {role === 'ADMIN'
            ? 'Phân Hệ Quản Trị Hệ Thống'
            : role === 'STAFF'
            ? 'Vận Hành Cơ Sở Chuỗi'
            : 'Cổng Cư Dân Trực Tuyến'}
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
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 text-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Hệ thống:</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            10 Microservices Online
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: Permanent fixed-width on large screens */}
      <aside className="hidden lg:flex w-64 flex-col h-full border-r border-slate-800 shrink-0">
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
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10 transition-transform duration-300 ease-out transform translate-x-0">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
