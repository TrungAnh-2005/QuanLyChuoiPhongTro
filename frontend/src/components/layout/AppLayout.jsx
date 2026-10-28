import React, { useState } from 'react';
import { Outlet, Navigate, useLocation, Link, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  ShieldAlert,
  ArrowLeft,
  Home,
  LayoutDashboard,
  Receipt,
  Zap,
  Users,
  Layers,
  Menu,
  AlertTriangle,
  FileCheck2
} from 'lucide-react';

export default function AppLayout() {
  const { user } = useAuth();
  const { landlordProfiles = [], landlords = [] } = useData() || {};
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role || 'ADMIN';
  const path = location.pathname;

  // Kiểm tra hồ sơ KYC nếu user là ROLE_STAFF (Chủ trọ)
  const currentStaffProfile = role === 'STAFF'
    ? landlordProfiles.find(
        (p) =>
          p.username === user.username ||
          (user.username === 'staff' && p.id === 1) ||
          (user.username === 'staff2' && p.id === 2)
      )
    : null;

  const currentLandlordAccount = role === 'STAFF'
    ? landlords.find(
        (l) =>
          l.username === user.username ||
          (user.username === 'staff' && l.id === 1) ||
          (user.username === 'staff2' && l.id === 2)
      )
    : null;

  const isKycRejected = currentStaffProfile?.kycStatus === 'REJECTED' || currentLandlordAccount?.status === 'LOCKED';
  const rejectionReason = currentStaffProfile?.rejectionReason || currentLandlordAccount?.kycRejectionReason || 'Thông tin cần đối soát lại với căn cước công dân gốc';

  // Check RBAC permissions theo chuẩn SRS-RENTAL-2026-V1.0
  const isTenantRestricted =
    role === 'TENANT' &&
    (path.startsWith('/houses') ||
      path.startsWith('/tenants') ||
      path.startsWith('/reports') ||
      path.startsWith('/admin'));

  const isStaffRestricted =
    role === 'STAFF' && path.startsWith('/admin');

  // Quy định RBAC chuẩn Multi-tenant SaaS: Admin quản lý nền tảng đối tác và toàn bộ cơ sở toàn sàn,
  // không trực tiếp vận hành vi mô (sơ đồ phòng trọ cá nhân, khách thuê và ghi chỉ số điện nước)
  const isAdminRestricted =
    role === 'ADMIN' &&
    (path.startsWith('/meters') ||
      path.startsWith('/rooms') ||
      path.startsWith('/tenants'));

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
            <div key={path} className="page-enter space-y-4">
              {/* BANNER CẢNH BÁO KYC BỊ THU HỒI / TỪ CHỐI */}
              {role === 'STAFF' && isKycRejected && (
                <div className="bg-gradient-to-r from-rose-500/10 via-rose-50 to-amber-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 shadow-sm text-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/30">
                      <AlertTriangle className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider">
                          Đình Chỉ Tạm Thời
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                          Hồ Sơ Định Danh KYC (CCCD) Bị Thu Hồi / Từ Chối
                        </h4>
                      </div>
                      <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                        Lý do từ Quản trị viên: <strong className="text-rose-950 font-bold underline">{rejectionReason}</strong>.
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tài khoản của bạn tạm thời bị khóa tính năng mở rộng cơ sở mới và xuất hợp đồng phòng mới theo quy chuẩn an toàn pháp lý.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <button
                      onClick={() => alert(`📌 Vui lòng liên hệ Admin qua hotline 0912.888.666 hoặc gửi lại ảnh chụp 2 mặt CCCD rõ nét để được phê duyệt lại.`)}
                      className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-rose-600/20 flex items-center justify-center gap-1.5 cursor-pointer btn-press"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>Gửi Khiếu Nại / Bổ Sung CCCD</span>
                    </button>
                  </div>
                </div>
              )}

              <Outlet />
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (Chỉ hiển thị trên di động) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-lg safe-area-bottom">
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
                      ? 'text-indigo-600 font-extrabold scale-105'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-xl transition-colors ${
                      isActive ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/10' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px] font-semibold">
                    {item.name}
                  </span>
                </Link>
              );
            })}

            {/* Nút Mở Menu Toàn Diện */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
            >
              <div className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100">
                <Menu className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Thêm</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
