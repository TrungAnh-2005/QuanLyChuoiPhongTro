import React, { useState } from 'react';
import { Outlet, Navigate, useLocation, Link, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShieldAlert,
  ArrowLeft,
  Home,
  LayoutDashboard,
  Receipt,
  Zap,
  Users,
  Layers,
  Menu
} from 'lucide-react';

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role || 'ADMIN';
  const path = location.pathname;

  // Check RBAC permissions theo chuẩn SRS-RENTAL-2026-V1.0
  const isTenantRestricted =
    role === 'TENANT' &&
    (path.startsWith('/houses') ||
      path.startsWith('/tenants') ||
      path.startsWith('/reports') ||
      path.startsWith('/admin'));

  const isStaffRestricted =
    role === 'STAFF' && path.startsWith('/admin');

  // Quy định RBAC chuẩn Multi-tenant SaaS: Admin quản lý nền tảng đối tác,
  // không trực tiếp vận hành cơ sở, phòng trọ, khách thuê và chỉ số điện nước
  const isAdminRestricted =
    role === 'ADMIN' &&
    (path.startsWith('/meters') ||
      path.startsWith('/rooms') ||
      path.startsWith('/tenants') ||
      path.startsWith('/houses'));

  // Bottom navigation items cho di động (Mobile Bottom Nav)
  const bottomNavItems =
    role === 'TENANT'
      ? [
          { name: 'Cổng Khách', path: '/', icon: LayoutDashboard },
          { name: 'Phòng Trọ', path: '/rooms', icon: Home },
          { name: 'Hóa Đơn', path: '/invoices', icon: Receipt },
          { name: 'Điện Nước', path: '/meters', icon: Zap },
        ]
      : role === 'STAFF'
      ? [
          { name: 'Tổng Quan', path: '/', icon: LayoutDashboard },
          { name: 'Phòng Trọ', path: '/rooms', icon: Home },
          { name: 'Khách Thuê', path: '/tenants', icon: Users },
          { name: 'Hóa Đơn', path: '/invoices/tenant', icon: Receipt },
        ]
      : [
          { name: 'Tổng Quan', path: '/', icon: LayoutDashboard },
          { name: 'Chủ Trọ', path: '/admin/landlords', icon: Users },
          { name: 'Gói SaaS', path: '/admin/saas-invoices', icon: Receipt },
          { name: 'Tích Hợp', path: '/admin/integrations', icon: Layers },
        ];

  return (
    <div className="flex h-screen bg-slate-50/80 text-slate-800 overflow-hidden font-sans">
      {/* Sidebar (Permanent on Desktop, Drawer on Mobile) */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 bg-mesh-linear">
          {isAdminRestricted ? (
            <div className="max-w-md mx-auto my-12 sm:my-16 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 text-center shadow-xl card-interactive page-enter">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-200">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Trang Nghiệp Vụ Dành Cho Chủ Trọ (STAFF)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                Nghiệp vụ quản lý cơ sở tòa nhà, sơ đồ phòng trọ, danh sách khách thuê và ghi chỉ số điện nước thuộc quyền kinh doanh của <strong>Chủ trọ / Ban quản lý (ROLE_STAFF)</strong>. Quản trị viên nền tảng SaaS (ADMIN) chỉ quản trị đối tác Chủ trọ, hợp đồng dịch vụ phần mềm và cấu hình tích hợp chung.
              </p>
              <div className="flex flex-col gap-2.5">
                <Link
                  to="/admin/landlords"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all btn-press"
                >
                  <Users className="w-4 h-4" />
                  <span>Quay Về Quản Trị Chủ Trọ</span>
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  <Home className="w-4 h-4" />
                  <span>Về Tổng Quan Nền Tảng</span>
                </Link>
              </div>
            </div>
          ) : isTenantRestricted ? (
            <div className="max-w-md mx-auto my-12 sm:my-16 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 text-center shadow-xl card-interactive page-enter">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Trang Dành Cho Ban Quản Lý</h2>
              <p className="text-xs text-slate-500 font-medium mb-6">
                Tài khoản của bạn thuộc quyền <strong>Khách Thuê (TENANT)</strong>, không có quyền truy cập vào mục cấu hình quản trị này.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 btn-press"
              >
                <Home className="w-4 h-4" />
                <span>Quay Lại Cổng Khách Thuê</span>
              </Link>
            </div>
          ) : isStaffRestricted ? (
            <div className="max-w-md mx-auto my-12 sm:my-16 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 text-center shadow-xl card-interactive page-enter">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4 border border-purple-200">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Trang Quản Trị Nền Tảng SaaS</h2>
              <p className="text-xs text-slate-500 font-medium mb-6">
                Mục cấu hình máy chủ, cổng thanh toán tổng và quản lý tài khoản Chủ trọ chỉ dành riêng cho quyền <strong>Quản Trị Hệ Thống (ADMIN)</strong>.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 btn-press"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay Về Tổng Quan Vận Hành</span>
              </Link>
            </div>
          ) : (
            <div key={path} className="page-enter">
              <Outlet />
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (Chỉ hiển thị trên di động) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-2xl safe-area-bottom">
          <div className="grid grid-cols-5 h-16 items-center px-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center py-1 transition-all ${
                    isActive
                      ? 'text-purple-600 font-bold scale-105'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <div
                    className={`p-1 rounded-xl transition-colors ${
                      isActive ? 'bg-purple-100 text-purple-700' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                    {item.name}
                  </span>
                </Link>
              );
            })}

            {/* Nút Mở Menu Toàn Diện */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-purple-600 transition-all"
            >
              <div className="p-1 rounded-xl text-slate-600 hover:bg-slate-100">
                <Menu className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">Thêm</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
