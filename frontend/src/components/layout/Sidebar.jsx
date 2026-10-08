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
    <div className="flex flex-col h-full bg-white text-slate-700">
      {/* Brand Logo & Close Button */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 font-black text-lg shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-slate-800 tracking-tight leading-none text-sm">
              TRỌ VIỆT SAAS
            </div>
            <div className="text-[11px] text-slate-400 font-normal mt-1 tracking-normal">
              Quản lý vận hành tập trung
            </div>
          </div>
        </div>

        {/* Close button for mobile drawer */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition-colors"
          title="Đóng menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {role === 'ADMIN'
            ? 'PHÂN HỆ QUẢN TRỊ HỆ THỐNG'
            : role === 'STAFF'
            ? 'VẬN HÀNH CƠ SỞ CHUỖI'
            : 'CỔNG CƯ DÂN TRỰC TUYẾN'}
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
                `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 border border-purple-100/80 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
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
      <div className="p-3 border-t border-slate-100 bg-white">
        <div className="bg-emerald-50/80 border border-emerald-100/80 rounded-2xl p-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Hệ thống ổn định
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5 pl-4">
            10 Microservices · 99,9% trực tuyến
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
