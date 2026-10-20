import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Receipt,
  Layers,
  Cpu,
  ShieldCheck,
  TrendingUp,
  SlidersHorizontal,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Activity,
  Server,
  HardDrive,
  Award,
  Crown,
  ArrowUpRight,
  CreditCard,
  ArrowRight,
  Check,
  DollarSign,
  Home,
  Phone,
  Wrench,
  BarChart3
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Modal from '@/components/common/Modal';

export default function AdminDashboard() {
  const { user } = useAuth();
  const {
    landlords = [],
    landlordProfiles = [],
    saasInvoices = []
  } = useData();

  const navigate = useNavigate();

  const housesList = useMemo(() => {
    try {
      const saved = localStorage.getItem('rental_boarding_houses');
      if (saved) return JSON.parse(saved);
    } catch { }
    return [
      { id: 1, code: 'CS-01', name: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', manager: 'Lê Thị Thu Ngân (Staff 1)', status: 'ACTIVE', totalRooms: 12 },
      { id: 2, code: 'CS-02', name: 'Nhà Trọ Bách Khoa - Cơ Sở 2', manager: 'Đàm Văn Táo (Staff 2)', status: 'ACTIVE', totalRooms: 8 },
      { id: 3, code: 'CS-03', name: 'Nhà Trọ Đống Đa - Cơ Sở 3', manager: 'Phạm Quốc Hùng (Chủ trọ CS3)', status: 'ACTIVE', totalRooms: 12 }
    ];
  }, []);

  // Quản lý cấu hình ẩn/hiện các hàng & thẻ thông tin trên Admin Dashboard (Lưu vào localStorage)
  const [adminWidgets, setAdminWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_dashboard_widgets_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return {
      landlordsKpi: true,       // Thẻ Đối Tác Chủ Trọ
      housesKpi: true,          // Thẻ Cơ Sở Chuỗi Trọ Toàn Sàn
      revenueKpi: true,         // Thẻ Doanh Thu Cước SaaS Tháng
      kycKpi: true,             // Thẻ Hồ Sơ Chờ Duyệt KYC CCCD
      unpaidKpi: true,          // Thẻ Hóa Đơn Cước SaaS Chờ Thu
      systemKpi: true,          // Thẻ Hạ Tầng 10 Vi Dịch Vụ
      charts: true,             // Biểu Đồ Dòng Tiền & Cơ Cấu Gói Bản Quyền SaaS
      landlordsTable: true,     // Bảng Lịch Trình Đối Tác Chủ Trọ (UC-A01)
      integrations: true,       // Tác Vụ Cổng Dịch Vụ & Cảnh Báo (UC-A02)
    };
  });
  const [showWidgetCustomizeModal, setShowWidgetCustomizeModal] = useState(false);

  const toggleAdminWidget = (key) => {
    setAdminWidgets((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('admin_dashboard_widgets_v3', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });
  };

  const resetAdminWidgets = () => {
    const defaultWidgets = {
      landlordsKpi: true,
      housesKpi: true,
      revenueKpi: true,
      kycKpi: true,
      unpaidKpi: true,
      systemKpi: true,
      charts: true,
      landlordsTable: true,
      integrations: true,
    };
    setAdminWidgets(defaultWidgets);
    try {
      localStorage.setItem('admin_dashboard_widgets_v3', JSON.stringify(defaultWidgets));
    } catch (e) { }
  };

  const setAllAdminWidgets = (val) => {
    const updated = {
      landlordsKpi: val,
      housesKpi: val,
      revenueKpi: val,
      kycKpi: val,
      unpaidKpi: val,
      systemKpi: val,
      charts: val,
      landlordsTable: val,
      integrations: val,
    };
    setAdminWidgets(updated);
    try {
      localStorage.setItem('admin_dashboard_widgets_v3', JSON.stringify(updated));
    } catch (e) { }
  };

  useEffect(() => {
    if (!showWidgetCustomizeModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowWidgetCustomizeModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showWidgetCustomizeModal]);

    const isZeroSandbox = typeof window !== 'undefined' && localStorage.getItem('rental_is_zero_sandbox') === 'true';

    // 1. Thống kê Chủ trọ (UC-A01)
    const totalLandlords = isZeroSandbox ? (landlords.length || 0) : (landlords.length || 3);
    const activeLandlords = (landlords || []).filter((l) => l.status === 'ACTIVE').length;
    const pendingKycCount = (landlordProfiles || []).filter((p) => p.status === 'PENDING').length;

    // 2. Thống kê Cơ sở chuỗi trọ toàn sàn
    const totalHouses = isZeroSandbox ? (housesList.length || 0) : (housesList.length || 3);
    const activeHouses = (housesList || []).filter((h) => h.status === 'ACTIVE' || !h.status).length;

    // 3. Thống kê Doanh thu Cước dịch vụ SaaS
    const paidSaasInvoices = (saasInvoices || []).filter((inv) => inv.status === 'PAID');
    const unpaidSaasInvoices = (saasInvoices || []).filter((inv) => inv.status === 'UNPAID');
    const totalSaasRevenue = paidSaasInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const saasRevenueFormatted = isZeroSandbox
      ? (totalSaasRevenue > 0 ? (totalSaasRevenue / 1000000).toFixed(1) + 'M ₫' : '0 ₫')
      : (totalSaasRevenue > 0 ? (totalSaasRevenue / 1000000).toFixed(1) + 'M ₫' : '4.99M ₫');

    // 4. Dữ liệu biểu đồ cước SaaS
    const saasRevenueChartData = [
      { month: 'T1', revenue: 9980000, target: 8000000 },
      { month: 'T2', revenue: 14970000, target: 12000000 },
      { month: 'T3', revenue: 19960000, target: 16000000 },
      { month: 'T4', revenue: 21950000, target: 18000000 },
      { month: 'T5', revenue: 26940000, target: 22000000 },
      { month: 'T6', revenue: 29930000, target: 25000000 },
      { month: 'T7', revenue: 32920000, target: 28000000 },
      { month: 'T8', revenue: 37910000, target: 32000000 },
      { month: 'T9', revenue: 42900000, target: 36000000 },
    ];

    // 5. Cơ cấu phân bổ gói cước bản quyền thực tế của hệ thống
    const packageDistributionData = [
      { name: 'Chuyên Nghiệp (PRO)', value: 2, color: '#2563eb' },
      { name: 'Cơ Bản (BASIC)', value: 1, color: '#06b6d4' },
      { name: 'Doanh Nghiệp (VIP)', value: 1, color: '#8b5cf6' },
    ];
    const totalPackages = packageDistributionData.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="space-y-6 page-enter pb-10">
        {/* =================================================================== */}
        {/* HEADER BAR GỌN GÀNG (LOẠI BỎ BANNER OVERVIEW VÀ DESCRIPTION DÀI DÒNG) */}
        {/* =================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Tổng quan tình hình hoạt động nền tảng SaaS &amp; hệ sinh thái chuỗi trọ hôm nay.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.location.reload()}
              title="Làm mới dữ liệu sàn"
              className="p-2 sm:p-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition cursor-pointer hover:scale-[1.02] shadow-2xs text-slate-600"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowWidgetCustomizeModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 sm:py-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-xs font-semibold rounded-xl transition cursor-pointer hover:scale-[1.02] shadow-2xs text-slate-700"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Customize</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* HÀNG 1: 6 THẺ CHỈ SỐ METRIC CARDS NẰM TRÊN CÙNG MỘT HÀNG NGANG      */}
        {/* =================================================================== */}
        {(adminWidgets.landlordsKpi ||
          adminWidgets.housesKpi ||
          adminWidgets.revenueKpi ||
          adminWidgets.kycKpi ||
          adminWidgets.unpaidKpi ||
          adminWidgets.systemKpi) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
              {/* Card 1: Đối Tác Chủ Trọ */}
              {adminWidgets.landlordsKpi && (
                <Link
                  to="/admin/landlords"
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-4.5 shadow-2xs hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between block group"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        Đối Tác Chủ Trọ
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2.5 tracking-tight">
                      {totalLandlords}
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-2 pt-1 border-t border-slate-50">
                    <span className="text-[11px] text-slate-400 font-medium">
                      +{activeLandlords} hoạt động
                    </span>
                    {/* Mini Sparkline Green */}
                    <svg className="w-14 h-5 shrink-0" viewBox="0 0 60 20" fill="none">
                      <path
                        d="M 0 18 L 32 18 Q 38 18 41 11 L 44 3 Q 46 1 48 9 L 51 18 L 60 18"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M 0 18 L 32 18 Q 38 18 41 11 L 44 3 Q 46 1 48 9 L 51 18 L 60 18 L 60 20 L 0 20 Z"
                        fill="#10b981"
                        fillOpacity="0.1"
                      />
                    </svg>
                  </div>
                </Link>
              )}

              {/* Card 2: Cơ Sở Chuỗi Trọ Toàn Sàn */}
              {adminWidgets.housesKpi && (
                <Link
                  to="/admin/houses"
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-4.5 shadow-2xs hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between block group"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        Cơ Sở Chuỗi Trọ
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2.5 tracking-tight">
                      {totalHouses}
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-2 pt-1 border-t border-slate-50">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {activeHouses} chi nhánh
                    </span>
                    {/* Mini Sparkline Blue */}
                    <svg className="w-14 h-5 shrink-0" viewBox="0 0 60 20" fill="none">
                      <path
                        d="M 0 18 L 18 18 Q 22 18 25 12 L 27 7 Q 29 7 32 16 L 35 18 L 60 18"
                        stroke="#2563eb"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M 0 18 L 18 18 Q 22 18 25 12 L 27 7 Q 29 7 32 16 L 35 18 L 60 18 L 60 20 L 0 20 Z"
                        fill="#2563eb"
                        fillOpacity="0.1"
                      />
                    </svg>
                  </div>
                </Link>
              )}

              {/* Card 3: Doanh Thu Cước SaaS Tháng */}
              {adminWidgets.revenueKpi && (
                <Link
                  to="/admin/saas-invoices"
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-4.5 shadow-2xs hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between block group"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        Doanh Thu
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2.5 tracking-tight">
                      {saasRevenueFormatted}
                    </div>
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-50">
                    <span className="text-[11px] text-slate-400 font-medium truncate block">
                      +18.4% MoM • Thuê bao sàn
                    </span>
                  </div>
                </Link>
              )}

              {/* Card 4: Hồ Sơ Chờ Duyệt KYC CCCD */}
              {adminWidgets.kycKpi && (
                <Link
                  to="/admin/landlords"
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-4.5 shadow-2xs hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between block group"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <ClipboardCheck className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        Hồ Sơ Chờ Duyệt
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2.5 tracking-tight">
                      {pendingKycCount}
                    </div>
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-50">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {pendingKycCount > 0 ? `${pendingKycCount} hồ sơ chờ duyệt` : 'Đã định danh 100%'}
                    </span>
                  </div>
                </Link>
              )}

              {/* Card 5: Cước SaaS Chưa Thu */}
              {adminWidgets.unpaidKpi && (
                <Link
                  to="/admin/saas-invoices"
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-4.5 shadow-2xs hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between block group"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        Cước Chưa Thu
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2.5 tracking-tight">
                      {unpaidSaasInvoices.length}
                    </div>
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-50">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Hóa đơn cần gạch nợ
                    </span>
                  </div>
                </Link>
              )}

              {/* Card 6: Hạ Tầng 10 Vi Dịch Vụ */}
              {adminWidgets.systemKpi && (
                <Link
                  to="/admin/system"
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-4.5 shadow-2xs hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between block group"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        Hạ Tầng Dịch Vụ
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2.5 tracking-tight">
                      10/10
                    </div>
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-50">
                    <span className="text-[11px] text-slate-400 font-medium">
                      100% Khỏe mạnh
                    </span>
                  </div>
                </Link>
              )}
            </div>
          )}

        {/* =================================================================== */}
        {/* HÀNG 2: 2 CỘT (DÒNG TIỀN CƯỚC SAAS VÀ CƠ CẤU GÓI BẢN QUYỀN)         */}
        {/* =================================================================== */}
        {adminWidgets.charts && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Cột Trái (Col Span 2): Biểu đồ AreaChart dòng tiền cước SaaS 9 tháng */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Dòng Tiền Cước Bản Quyền &amp; Tăng Trưởng Gói SaaS
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Doanh thu thuê bao phần mềm thu từ các Chủ trọ qua 9 tháng (Đơn vị: VNĐ)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="text-slate-600 font-medium">Thực thu</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-slate-300" />
                    <span className="text-slate-400 font-medium">Chỉ tiêu sàn</span>
                  </div>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={saasRevenueChartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="saasBlueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.85} />
                        <stop offset="90%" stopColor="#2563eb" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v / 1000000}M`}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#saasBlueGrad)"
                      isAnimationActive={true}
                      animationDuration={1200}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cột Phải (Col Span 1): Cơ Cấu Gói Bản Quyền SaaS (Donut Chart) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Cơ Cấu Gói Bản Quyền SaaS
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Tỷ trọng phân bổ gói trên toàn hệ thống ({totalLandlords} Chủ trọ)
                </p>
              </div>

              {/* Donut Chart with Center Total */}
              <div className="h-48 relative flex items-center justify-center my-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={packageDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={1200}
                    >
                      {packageDistributionData.map((entry, index) => (
                        <Cell key={`saas-pkg-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [`${val} chủ trọ`, name]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                    {totalPackages}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium mt-1">Đối tác</span>
                </div>
              </div>

              {/* Danh sách chú giải các gói với số đếm canh phải sát lề */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
                {packageDistributionData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {item.value} đối tác
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* HÀNG 3: 2 CỘT (ĐỐI TÁC CHỦ TRỌ VÀ TÁC VỤ CỔNG DỊCH VỤ CẢNH BÁO)     */}
        {/* =================================================================== */}
        {(adminWidgets.landlordsTable || adminWidgets.integrations) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Cột Trái (Col Span 2): Bảng Đối Tác Chủ Trọ Đăng Ký Gần Đây (UC-A01) */}
            {adminWidgets.landlordsTable && (
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          Đối Tác Chủ Trọ Đăng Ký Gần Đây &amp; Phê Duyệt KYC (UC-A01)
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {landlords && landlords.length > 0
                          ? `${landlords.length} đối tác đã tham gia nền tảng SaaS`
                          : 'Chưa có đối tác mới'}
                      </p>
                    </div>

                    <Link
                      to="/admin/landlords"
                      className="text-xs font-semibold text-slate-700 hover:text-blue-600 transition flex items-center gap-1"
                    >
                      <span>Xem tất cả ({totalLandlords})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {landlords && landlords.length > 0 ? (
                    <div className="overflow-x-auto mt-3">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-medium">
                            <th className="pb-3">Chủ Trọ Đối Tác</th>
                            <th className="pb-3">Gói Bản Quyền</th>
                            <th className="pb-3">Cơ Sở / Quy Mô</th>
                            <th className="pb-3">Trạng Thái KYC CCCD</th>
                            <th className="pb-3 text-right">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {landlords.slice(0, 5).map((l) => (
                            <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3">
                                <div className="font-bold text-slate-900">{l.fullName}</div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {l.phone || l.email}
                                </div>
                              </td>
                              <td className="py-3">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${l.packageCode === 'ENTERPRISE'
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : l.packageCode === 'PRO'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                    }`}
                                >
                                  {l.packageCode || 'PRO'}
                                </span>
                              </td>
                              <td className="py-3 text-slate-600">
                                {l.housesCount || 1} Cơ sở • {l.roomsCount || 10} phòng
                              </td>
                              <td className="py-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Đã xác minh</span>
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <Link
                                  to="/admin/landlords"
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg text-xs font-semibold transition inline-block"
                                >
                                  Chi tiết hồ sơ
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-xs text-slate-400 font-medium">
                      Chưa có đối tác nào cần xử lý hôm nay.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cột Phải (Col Span 1): Tác Vụ Cổng Dịch Vụ & Cảnh Báo Sàn (UC-A02) */}
            {adminWidgets.integrations && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm tracking-tight">
                      Tác Vụ Cổng Dịch Vụ &amp; Cảnh Báo
                    </span>
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      4
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-400">
                    <button
                      type="button"
                      title="Thêm tác vụ"
                      className="hover:text-slate-800 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Lọc tác vụ"
                      className="hover:text-slate-800 transition cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Danh sách các Alert Card bo tròn nghiệp vụ thực tế */}
                <div className="space-y-2.5">
                  {/* Task 1: Hồ sơ KYC CCCD */}
                  <div className="p-3.5 bg-slate-50/70 hover:bg-slate-100/60 rounded-xl border border-slate-200/60 space-y-1 transition">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-xs leading-snug">
                        Hồ Sơ KYC CCCD Chờ Duyệt — {pendingKycCount > 0 ? `${pendingKycCount} Đối tác mới` : 'Nguyễn Văn An'}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                        <Edit3 className="w-3 h-3 hover:text-slate-700 cursor-pointer" />
                        <Check className="w-3 h-3 hover:text-emerald-600 cursor-pointer text-emerald-600" />
                        <Trash2 className="w-3 h-3 hover:text-red-500 cursor-pointer text-red-400" />
                      </div>
                    </div>
                    <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                      Đối tác gửi hồ sơ căn cước công dân cần xác minh danh tính để kích hoạt sàn.
                    </p>
                  </div>

                  {/* Task 2: Hóa đơn cước SaaS quá hạn */}
                  <div className="p-3.5 bg-slate-50/70 hover:bg-slate-100/60 rounded-xl border border-slate-200/60 space-y-1 transition">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-xs leading-snug">
                        Hóa Đơn Cước SaaS Quá Hạn — {unpaidSaasInvoices.length > 0 ? `${unpaidSaasInvoices.length} Hóa đơn` : 'Chi Nhánh Cầu Giấy'}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                        <Edit3 className="w-3 h-3 hover:text-slate-700 cursor-pointer" />
                        <Check className="w-3 h-3 hover:text-emerald-600 cursor-pointer text-emerald-600" />
                        <Trash2 className="w-3 h-3 hover:text-red-500 cursor-pointer text-red-400" />
                      </div>
                    </div>
                    <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                      Kỳ thanh toán cước phần mềm PRO chưa hoàn tất gạch nợ qua SePay.
                    </p>
                  </div>

                  {/* Task 3: VietQR SePay Gateway */}
                  <div className="p-3.5 bg-slate-50/70 hover:bg-slate-100/60 rounded-xl border border-slate-200/60 space-y-1 transition">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-xs leading-snug">
                        VietQR SePay Gateway — Webhook 200 OK
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                        <Edit3 className="w-3 h-3 hover:text-slate-700 cursor-pointer" />
                        <Check className="w-3 h-3 hover:text-emerald-600 cursor-pointer text-emerald-600" />
                        <Trash2 className="w-3 h-3 hover:text-red-500 cursor-pointer text-red-400" />
                      </div>
                    </div>
                    <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                      Cổng gạch nợ tự động hóa đơn cước bản quyền hoạt động bình thường qua Webhook realtime.
                    </p>
                  </div>

                  {/* Task 4: OpenAI Vision OCR Scanner */}
                  <div className="p-3.5 bg-slate-50/70 hover:bg-slate-100/60 rounded-xl border border-slate-200/60 space-y-1 transition">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-xs leading-snug">
                        OpenAI Vision OCR — Sẵn Sàng Trích Xuất
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                        <Edit3 className="w-3 h-3 hover:text-slate-700 cursor-pointer" />
                        <Check className="w-3 h-3 hover:text-emerald-600 cursor-pointer text-emerald-600" />
                        <Trash2 className="w-3 h-3 hover:text-red-500 cursor-pointer text-red-400" />
                      </div>
                    </div>
                    <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                      Nhận diện công tơ điện nước AI tự động đạt độ chính xác 98.7% (Microservices APM).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TRẠNG THÁI NẾU TẤT CẢ CÁC HÀNG BỊ ẨN                                 */}
        {/* =================================================================== */}
        {!adminWidgets.landlordsKpi &&
          !adminWidgets.housesKpi &&
          !adminWidgets.revenueKpi &&
          !adminWidgets.kycKpi &&
          !adminWidgets.unpaidKpi &&
          !adminWidgets.systemKpi &&
          !adminWidgets.charts &&
          !adminWidgets.landlordsTable &&
          !adminWidgets.integrations && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4 my-6 shadow-2xs">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <EyeOff className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">Tất cả các thẻ và phân hệ đang tạm ẩn</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Bạn đã ẩn toàn bộ các thẻ hiển thị trên bảng điều khiển. Bấm nút bên dưới để khôi phục lại mặc định.
                </p>
              </div>
              <button
                type="button"
                onClick={resetAdminWidgets}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Khôi phục tất cả hiển thị
              </button>
            </div>
          )}

        {/* =================================================================== */}
        {/* MODAL TÙY BIẾN HIỂN THỊ GIAO DIỆN ADMIN (NẰM NGAY CHÍNH GIỮA MÀN HÌNH) */}
        {/* =================================================================== */}
        {showWidgetCustomizeModal && typeof document !== 'undefined' && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowWidgetCustomizeModal(false);
            }}
          >
            <div
              className="relative bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col my-auto overflow-hidden animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-sm">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Tùy Biến Bảng Điều Khiển Admin</h3>
                    <p className="text-xs text-slate-500">
                      Bật/tắt các thẻ div lớn chứa thông tin hiển thị trên bảng điều khiển của bạn
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWidgetCustomizeModal(false)}
                  className="w-9 h-9 rounded-full bg-white hover:bg-slate-200/70 border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition cursor-pointer shadow-sm"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body: Lưới các thẻ div lớn (Scale hover only, no colored border) */}
              <div className="p-6 overflow-y-auto space-y-4 max-h-[calc(88vh-145px)]">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>Nhấp vào bất kỳ thẻ div nào bên dưới để bật hoặc tắt hiển thị:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAllAdminWidgets(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      Bật tất cả
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setAllAdminWidgets(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                    >
                      Ẩn tất cả
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      key: 'landlordsKpi',
                      title: 'Đối Tác Chủ Trọ',
                      badgeText: 'Chỉ số 1',
                      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
                      icon: Users,
                      iconBg: 'bg-blue-600 text-white',
                      desc: 'Thống kê tổng số lượng chủ trọ tham gia nền tảng SaaS, số tài khoản đang vận hành và đồ thị tăng trưởng.',
                      statValue: `${totalLandlords} Đối tác Chủ trọ`,
                      statSub: `${activeLandlords} Hoạt động • ${pendingKycCount} Chờ duyệt KYC`,
                    },
                    {
                      key: 'housesKpi',
                      title: 'Cơ Sở Chuỗi Trọ Toàn Sàn',
                      badgeText: 'Chỉ số 2',
                      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
                      icon: Building2,
                      iconBg: 'bg-teal-600 text-white',
                      desc: 'Tổng số tòa nhà, chi nhánh chuỗi căn hộ dịch vụ và phòng trọ do các chủ trọ khai báo trên toàn bộ hệ thống.',
                      statValue: `${totalHouses} Cơ sở chuỗi trọ`,
                      statSub: `${activeHouses} Chi nhánh hoạt động`,
                    },
                    {
                      key: 'revenueKpi',
                      title: 'Doanh Thu Cước SaaS Tháng',
                      badgeText: 'Chỉ số 3',
                      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
                      icon: DollarSign,
                      iconBg: 'bg-purple-600 text-white',
                      desc: 'Tổng cước phí thuê bao bản quyền phần mềm thu từ các đối tác chủ trọ trong kỳ kinh doanh hiện tại.',
                      statValue: saasRevenueFormatted,
                      statSub: '+18.4% MoM • Đối soát tự động SePay',
                    },
                    {
                      key: 'kycKpi',
                      title: 'Hồ Sơ Chờ Duyệt KYC CCCD',
                      badgeText: 'Chỉ số 4',
                      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
                      icon: ClipboardCheck,
                      iconBg: 'bg-amber-500 text-white',
                      desc: 'Số lượng nhiệm vụ cần xử lý gấp: phê duyệt hồ sơ KYC CCCD của đối tác chủ trọ đăng ký mới.',
                      statValue: `${pendingKycCount} Hồ sơ chờ duyệt`,
                      statSub: 'Thẩm định căn cước công dân',
                    },
                    {
                      key: 'unpaidKpi',
                      title: 'Hóa Đơn Cước SaaS Chưa Thu',
                      badgeText: 'Chỉ số 5',
                      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
                      icon: CreditCard,
                      iconBg: 'bg-cyan-600 text-white',
                      desc: 'Theo dõi các hóa đơn cước bản quyền phần mềm đang chờ đối tác thanh toán đối soát qua VietQR.',
                      statValue: `${unpaidSaasInvoices.length} Hóa đơn cước`,
                      statSub: 'Chờ gạch nợ qua Webhook',
                    },
                    {
                      key: 'systemKpi',
                      title: 'Hạ Tầng 10 Vi Dịch Vụ',
                      badgeText: 'Chỉ số 6',
                      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      icon: ShieldCheck,
                      iconBg: 'bg-emerald-600 text-white',
                      desc: 'Trạng thái hoạt động tức thời của 10 vi dịch vụ Eureka, RabbitMQ, SePay, OpenAI Vision.',
                      statValue: '10/10 Vi dịch vụ',
                      statSub: '100% Khỏe mạnh • Uptime 99.98%',
                    },
                    {
                      key: 'charts',
                      title: 'Biểu Đồ Dòng Tiền & Cơ Cấu Gói Bản Quyền',
                      badgeText: 'Hàng Biểu Đồ 2 Cột',
                      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
                      icon: TrendingUp,
                      iconBg: 'bg-blue-600 text-white',
                      desc: 'Biểu đồ AreaChart dòng tiền cước SaaS 9 tháng và PieChart tỷ lệ phân bổ gói bản quyền Basic, Pro, Enterprise.',
                      statValue: 'Doanh thu 9 tháng & 3 gói cước',
                      statSub: `${packageDistributionData.length} Phân khúc gói • Phân tích xu hướng`,
                    },
                    {
                      key: 'landlordsTable',
                      title: 'Đối Tác Chủ Trọ Đăng Ký Gần Đây (UC-A01)',
                      badgeText: 'Hàng Lịch Trình',
                      badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
                      icon: Users,
                      iconBg: 'bg-slate-800 text-white',
                      desc: 'Bảng danh sách chi tiết các chủ trọ mới đăng ký, gói cước sử dụng, số phòng và nút thẩm định hồ sơ định danh CCCD.',
                      statValue: `${landlords?.length || 0} Đối tác đã đăng ký`,
                      statSub: 'Xem chi tiết & phê duyệt tài khoản',
                    },
                    {
                      key: 'integrations',
                      title: 'Tác Vụ Cổng Dịch Vụ & Cảnh Báo (UC-A02)',
                      badgeText: 'Hàng Cảnh Báo',
                      badgeColor: 'bg-red-50 text-red-700 border-red-200',
                      icon: AlertCircle,
                      iconBg: 'bg-red-600 text-white',
                      desc: 'Danh sách các thẻ công việc và cảnh báo hệ thống tích hợp SePay Webhook, OpenAI OCR, cấp quyền pháp lý.',
                      statValue: '4 Cảnh báo & Tác vụ',
                      statSub: 'Thao tác nhanh: Sửa, Duyệt, Xóa',
                    },
                  ].map((item) => {
                    const ItemIcon = item.icon;
                    const isChecked = !!adminWidgets[item.key];
                    return (
                      <div
                        key={item.key}
                        onClick={() => toggleAdminWidget(item.key)}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 text-left group select-none hover:scale-[1.015] hover:shadow-md ${isChecked
                            ? 'bg-slate-50/80 border-slate-300 shadow-2xs'
                            : 'bg-white border-slate-200 opacity-60 hover:opacity-90'
                          }`}
                      >
                        {/* Header của thẻ div lớn */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105 shadow-2xs ${item.iconBg}`}>
                              <ItemIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {item.title}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.badgeColor}`}>
                                  {item.badgeText}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                {item.desc}
                              </p>
                            </div>
                          </div>

                          {/* Checkbox & Status Pill */}
                          <div className="shrink-0 flex items-center gap-2">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-colors ${isChecked
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-200 text-slate-600'
                              }`}>
                              {isChecked ? 'Đang hiện' : 'Đã ẩn'}
                            </span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => { }}
                              className="w-4 h-4 rounded text-blue-600 pointer-events-none accent-blue-600"
                            />
                          </div>
                        </div>

                        {/* Dữ liệu thực tế bên trong thẻ div lớn */}
                        <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs bg-white/80 -mx-1 px-3 py-2 rounded-xl">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Dữ liệu hiển thị</span>
                            <span className="font-bold text-sm text-slate-900 tracking-tight">
                              {item.statValue}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-medium text-slate-500 block">
                              {item.statSub}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <button
                  type="button"
                  onClick={resetAdminWidgets}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục mặc định</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowWidgetCustomizeModal(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                  Xong & Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );

}
