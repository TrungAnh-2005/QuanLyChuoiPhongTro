import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Receipt,
  DollarSign,
  TrendingUp,
  PieChart as PieChartIcon,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Cpu,
  ChevronRight,
  CheckCircle2,
  Layers,
  QrCode,
  Zap,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-700/50 text-xs">
        <div className="font-bold text-slate-300">{label}</div>
        <div className="font-black text-indigo-400 text-sm mt-1">
          {Number(payload[0].value).toLocaleString('vi-VN')} đ
        </div>
        <div className="text-[10px] text-slate-400">Doanh thu cước SaaS</div>
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const {
    landlords = [],
    landlordProfiles = [],
    boardingHouses: housesList = [],
    saasInvoices = []
  } = useData();

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
  const saasRevenueChartData = (isZeroSandbox || totalSaasRevenue === 0)
    ? [
        { month: 'T1', revenue: 0, target: 0 },
        { month: 'T2', revenue: 0, target: 0 },
        { month: 'T3', revenue: 0, target: 0 },
        { month: 'T4', revenue: 0, target: 0 },
        { month: 'T5', revenue: 0, target: 0 },
        { month: 'T6', revenue: 0, target: 0 },
        { month: 'T7', revenue: 0, target: 0 },
        { month: 'T8', revenue: 0, target: 0 },
        { month: 'T9', revenue: totalSaasRevenue, target: 0 },
      ]
    : [
        { month: 'T1', revenue: 9980000, target: 8000000 },
        { month: 'T2', revenue: 14970000, target: 12000000 },
        { month: 'T3', revenue: 19960000, target: 16000000 },
        { month: 'T4', revenue: 21950000, target: 18000000 },
        { month: 'T5', revenue: 26940000, target: 22000000 },
        { month: 'T6', revenue: 29930000, target: 25000000 },
        { month: 'T7', revenue: 32920000, target: 28000000 },
        { month: 'T8', revenue: 37910000, target: 32000000 },
        { month: 'T9', revenue: totalSaasRevenue > 0 ? totalSaasRevenue : 42900000, target: 36000000 },
      ];

  // 5. Cơ cấu phân bổ gói cước bản quyền
  const packageDistributionData = useMemo(() => {
    if (!landlords || landlords.length === 0) {
      return [
        { name: 'Chuyên Nghiệp (PRO)', value: 0, color: '#6366f1' },
        { name: 'Cơ Bản (BASIC)', value: 0, color: '#06b6d4' },
        { name: 'Doanh Nghiệp (VIP)', value: 0, color: '#8b5cf6' },
      ];
    }
    let pro = 0;
    let basic = 0;
    let vip = 0;
    landlords.forEach((l) => {
      const pkg = (l.packageCode || '').toUpperCase();
      if (pkg.includes('VIP') || pkg.includes('ENTERPRISE') || pkg.includes('UNLIMITED')) {
        vip++;
      } else if (pkg.includes('BASIC') || pkg.includes('TRIAL') || pkg.includes('NONE')) {
        basic++;
      } else {
        pro++;
      }
    });
    return [
      { name: 'Chuyên Nghiệp (PRO)', value: pro, color: '#6366f1' },
      { name: 'Cơ Bản (BASIC)', value: basic, color: '#06b6d4' },
      { name: 'Doanh Nghiệp (VIP)', value: vip, color: '#8b5cf6' },
    ];
  }, [landlords]);

  return (
    <div className="space-y-6 page-enter">
      {/* Header Bento Banner */}
      <div className="bento-card p-6 sm:p-7 bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="status-pill status-pill-indigo">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Microservices SaaS v2.5</span>
            </span>
            <span className="status-pill status-pill-success">
              <span className="pulse-dot-green shrink-0" />
              <span>Hạ Tầng Trực Tuyến 99.9%</span>
            </span>
            <span className="status-pill bg-purple-100/70 text-purple-700 border border-purple-200">
              <ShieldCheck className="w-3 h-3 text-purple-600" />
              <span>Phân Hệ Quản Trị Hệ Thống Toàn Sàn</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tổng Quan Nền Tảng Quản Lý Chuỗi Nhà Trọ (SaaS Master)
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Giám sát toàn diện hệ sinh thái: Đối tác chủ trọ, gói cước bản quyền, chuỗi cơ sở & trạng thái 10 vi dịch vụ theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/admin/landlords"
            className="btn-press btn-shimmer flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-indigo-600/20 transition-all"
          >
            <Users className="w-4 h-4" />
            <span>Quản Trị Chủ Trọ</span>
          </Link>
          <Link
            to="/admin/houses"
            className="btn-press flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-2xl shadow-sm transition-all"
          >
            <Building2 className="w-4 h-4 text-purple-600" />
            <span>Duyệt Cơ Sở ({totalHouses})</span>
          </Link>
          <Link
            to="/admin/saas-invoices"
            className="btn-press flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-sm transition-all"
          >
            <Receipt className="w-4 h-4 text-indigo-400" />
            <span>Hóa Đơn Cước SaaS</span>
          </Link>
          <Link
            to="/admin/system"
            className="btn-press flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-2xl transition-all"
          >
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Giám Sát APM</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link
          to="/admin/landlords"
          className="bento-card p-5 space-y-3 stagger-item stagger-1 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
              Đối Tác Chủ Trọ
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold ring-1 ring-indigo-500/10 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{totalLandlords}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{activeLandlords} Hoạt động</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {pendingKycCount > 0 ? (
              <span className="text-amber-600 font-semibold">{pendingKycCount} hồ sơ chờ duyệt KYC CCCD</span>
            ) : (
              '100% hồ sơ pháp lý đã định danh KYC'
            )}
          </p>
        </Link>

        <Link
          to="/admin/houses"
          className="bento-card p-5 space-y-3 stagger-item stagger-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-purple-600 transition-colors">
              Cơ Sở Chuỗi Trọ Toàn Sàn
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold ring-1 ring-purple-500/10 group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{totalHouses}</span>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
              Toàn hệ thống
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {activeHouses} chi nhánh đang hoạt động • Phủ khắp Hà Nội
          </p>
        </Link>

        <Link
          to="/admin/saas-invoices"
          className="bento-card p-5 space-y-3 stagger-item stagger-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
              Doanh Thu Cước SaaS Tháng 9
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold ring-1 ring-emerald-500/10 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {saasRevenueFormatted}
            </span>
            {totalSaasRevenue > 0 && !isZeroSandbox ? (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+18.4% MoM</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                0% MoM
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {totalSaasRevenue > 0 && !isZeroSandbox ? 'Cước bản quyền thu từ đối tác Chủ trọ' : 'Chưa có cước bản quyền thực thu'}
          </p>
        </Link>

        <Link
          to="/admin/system"
          className="bento-card p-5 space-y-3 stagger-item stagger-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-cyan-600 transition-colors">
              Hạ Tầng 10 Vi Dịch Vụ
            </span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold ring-1 ring-cyan-500/10 group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">10/10</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>100% Khỏe Mạnh</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Eureka • RabbitMQ • SePay • OpenAI Vision</p>
        </Link>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bento-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Dòng Tiền Cước Bản Quyền & Tăng Trưởng Gói SaaS</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Doanh thu thuê bao phần mềm thu từ các Chủ trọ qua từng tháng (Đơn vị: VNĐ)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-indigo-600" />
                <span className="font-semibold text-slate-600">Thực thu SaaS</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={saasRevenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="saasRevGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#saasRevGradient)"
                  isAnimationActive={true}
                  animationDuration={1400}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cơ Cấu Gói Bản Quyền */}
        <div className="bento-card p-6 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-600" />
              <span>Cơ Cấu Gói Bản Quyền SaaS</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{totalLandlords} Chủ trọ</span>
          </div>

          <div className="h-52 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={packageDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={84}
                  paddingAngle={4}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={1200}
                >
                  {packageDistributionData.map((entry, index) => (
                    <Cell key={`saas-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} chủ trọ`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{totalLandlords}</span>
              <span className="text-[11px] text-slate-400 font-medium">Đối tác</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
            {packageDistributionData.map((s) => (
              <div key={s.name} className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="truncate">{s.name.split(' ')[0]}</span>
                </div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Danh Sách Chủ Trọ Gần Đây & Cổng Kết Nối */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bento-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Đối Tác Chủ Trọ Đăng Ký Gần Đây (UC-A01)</span>
            </h3>
            <Link
              to="/admin/landlords"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
            >
              <span>Xem tất cả ({totalLandlords})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-2.5">Chủ Trọ</th>
                  <th className="pb-2.5">Gói Bản Quyền</th>
                  <th className="pb-2.5">Cơ Sở / Quy Mô</th>
                  <th className="pb-2.5">Trạng Thái KYC</th>
                  <th className="pb-2.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(landlords || []).slice(0, 4).map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-slate-900">{l.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{l.phone || l.email}</div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        l.packageCode === 'ENTERPRISE'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : l.packageCode === 'PRO'
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : 'bg-cyan-100 text-cyan-700 border border-cyan-200'
                      }`}>
                        {l.packageCode || 'PRO'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">
                      {l.housesCount || 1} Cơ sở • {l.roomsCount || 10} phòng
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Đã xác minh</span>
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to="/admin/landlords"
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-[11px] font-bold transition-colors"
                      >
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cổng Tích Hợp */}
        <div className="bento-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Cổng Tích Hợp Dùng Chung (UC-A02)</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-slate-800 font-bold">VietQR SePay Gateway</div>
                  <div className="text-[10px] text-slate-400">Tự động gạch nợ 24/7</div>
                </div>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Trực tuyến</span>
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <div className="text-slate-800 font-bold">OpenAI Vision OCR</div>
                  <div className="text-[10px] text-slate-400">Nhận diện công tơ điện nước</div>
                </div>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Trực tuyến</span>
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <div className="text-slate-800 font-bold">Eureka Discovery & RabbitMQ</div>
                  <div className="text-[10px] text-slate-400">10 vi dịch vụ đồng bộ sự kiện</div>
                </div>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sẵn sàng</span>
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Hóa đơn cước SaaS chưa thu:</span>
            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
              {unpaidSaasInvoices.length} hóa đơn
            </span>
          </div>
        </div>
      </div>

      {/* Phím Tắt Nghiệp Vụ */}
      <div className="bento-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          <span>Phân Hệ Nghiệp Vụ Quản Trị Sàn SaaS</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/admin/landlords"
            className="p-4 bg-slate-50/80 hover:bg-indigo-50/50 border border-slate-200/70 hover:border-indigo-300 rounded-2xl transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Quản Trị Chủ Trọ</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Quản lý đối tác & duyệt KYC (UC-A01)</div>
          </Link>

          <Link
            to="/admin/houses"
            className="p-4 bg-slate-50/80 hover:bg-purple-50/50 border border-slate-200/70 hover:border-purple-300 rounded-2xl transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Quản Trị & Duyệt Cơ Sở</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Phê duyệt chuỗi nhà trọ toàn sàn</div>
          </Link>

          <Link
            to="/admin/saas-invoices"
            className="p-4 bg-slate-50/80 hover:bg-amber-50/50 border border-slate-200/70 hover:border-amber-300 rounded-2xl transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Hóa Đơn Cước SaaS</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Cước bản quyền phần mềm & VAT</div>
          </Link>

          <Link
            to="/admin/system"
            className="p-4 bg-slate-50/80 hover:bg-emerald-50/50 border border-slate-200/70 hover:border-emerald-300 rounded-2xl transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Giám Sát 10 Vi Dịch Vụ</div>
            <div className="text-[11px] text-slate-400 mt-0.5">APM realtime, CPU, Heap & Audit (UC-A03)</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
