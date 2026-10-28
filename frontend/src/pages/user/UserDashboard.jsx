import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Layers,
  Home,
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  PlusCircle,
  Receipt,
  Zap,
  CheckCircle2,
  Clock,
  Phone,
  Droplets,
  Calendar,
  CreditCard,
  Wrench,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ChevronRight,
  BarChart3,
  Plus,
  PieChart as PieChartIcon
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

const revenueData = [
  { month: 'T1', revenue: 42000000, target: 40000000 },
  { month: 'T2', revenue: 45500000, target: 42000000 },
  { month: 'T3', revenue: 48000000, target: 45000000 },
  { month: 'T4', revenue: 47200000, target: 46000000 },
  { month: 'T5', revenue: 51800000, target: 48000000 },
  { month: 'T6', revenue: 54000000, target: 50000000 },
  { month: 'T7', revenue: 53200000, target: 52000000 },
  { month: 'T8', revenue: 58600000, target: 54000000 },
  { month: 'T9', revenue: 62400000, target: 56000000 },
];

// Custom Bento Tooltip for AreaChart
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const rev = payload[0]?.value || 0;
    const tgt = payload[1]?.value || 0;
    return (
      <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-xl text-xs space-y-1.5 min-w-[160px]">
        <div className="font-bold text-slate-300 pb-1 border-b border-slate-800 flex items-center justify-between">
          <span>Tháng {label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">Doanh thu</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Thực thu:</span>
          <span className="font-bold text-emerald-400 font-mono">{rev.toLocaleString('vi-VN')} ₫</span>
        </div>
        {tgt > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Chỉ tiêu:</span>
            <span className="font-bold text-slate-300 font-mono">{tgt.toLocaleString('vi-VN')} ₫</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};


export default function UserDashboard() {
  const { user } = useAuth();
  const role = user?.role || 'STAFF';
  const {
    invoices = [],
    tickets = [],
    rooms = [],
    tenants = [],
    contracts = []
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

  const staffManageableHouses = useMemo(() => {
    if (role !== 'STAFF') return housesList;
    const u = (user?.username || '').toLowerCase();
    try {
      return housesList.filter((h) => {
        const created = (h.createdBy || '').toLowerCase();
        const manager = (h.managerUsername || '').toLowerCase();
        if (created && created === u) return true;
        if (manager && manager === u) return true;
        if (user?.houseCode && h.code === user.houseCode) return true;
        if (u === 'staff' && (h.code === 'CS-01' || !h.createdBy)) return true;
        if (u === 'staff2' && h.code === 'CS-02') return true;
        return false;
      });
    } catch {
      return [];
    }
  }, [user, role, housesList]);

  const staffHouseCodes = useMemo(() => staffManageableHouses.map((h) => h.code), [staffManageableHouses]);

  const scopedRooms = useMemo(() => {
    if (role === 'STAFF') {
      if (staffHouseCodes.length === 0) return [];
      return rooms.filter((r) => staffHouseCodes.includes(r.houseCode));
    }
    return rooms;
  }, [rooms, role, staffHouseCodes]);

  const occupiedCount = scopedRooms.filter((r) => r.status === 'OCCUPIED').length;
  const availableCount = scopedRooms.filter((r) => r.status === 'AVAILABLE').length;
  const maintenanceCount = scopedRooms.filter((r) => r.status === 'MAINTENANCE').length;
  const isZeroSandbox = typeof window !== 'undefined' && localStorage.getItem('rental_is_zero_sandbox') === 'true';
  const totalRooms = scopedRooms.length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  const roomStatusData = [
    { name: 'Đang Thuê', value: occupiedCount, color: '#6366f1' },
    { name: 'Còn Trống', value: availableCount, color: '#10b981' },
    { name: 'Bảo Trì', value: maintenanceCount, color: '#f59e0b' },
  ];

  const pendingMeterCount = invoices.filter((i) => {
    if (role === 'STAFF') {
      if (staffHouseCodes.length === 0) return false;
      const matchHouse = i.houseCode && staffHouseCodes.includes(i.houseCode);
      const invRoom = (rooms || []).find((r) => r.number === i.room);
      const matchRoom = invRoom && staffHouseCodes.includes(invRoom.houseCode);
      if (!matchHouse && !matchRoom) return false;
    }
    return i.status === 'PENDING_METER';
  }).length;

  const unpaidCount = invoices.filter((i) => {
    if (role === 'STAFF') {
      if (staffHouseCodes.length === 0) return false;
      const matchHouse = i.houseCode && staffHouseCodes.includes(i.houseCode);
      const invRoom = (rooms || []).find((r) => r.number === i.room);
      const matchRoom = invRoom && staffHouseCodes.includes(invRoom.houseCode);
      if (!matchHouse && !matchRoom) return false;
    }
    return i.status === 'UNPAID';
  }).length;

  const openTicketsCount = tickets.filter((t) => {
    if (role === 'STAFF') {
      if (staffHouseCodes.length === 0) return false;
      const ticketHouse = t.houseCode || (rooms || []).find((r) => r.number === t.room)?.houseCode || (t.room?.startsWith('P.') ? 'CS-01' : null);
      if (!ticketHouse || !staffHouseCodes.includes(ticketHouse)) return false;
    }
    return t.status !== 'RESOLVED' && t.status !== 'CLOSED';
  }).length;

  const staffPaidInvoices = invoices.filter((i) => {
    if (role === 'STAFF') {
      if (staffHouseCodes.length === 0) return false;
      const matchHouse = i.houseCode && staffHouseCodes.includes(i.houseCode);
      const invRoom = (rooms || []).find((r) => r.number === i.room);
      const matchRoom = invRoom && staffHouseCodes.includes(invRoom.houseCode);
      if (!matchHouse && !matchRoom) return false;
    }
    return i.status === 'PAID';
  });
  const monthlyPaidRevenue = staffPaidInvoices.reduce((s, i) => s + (i.total || 0), 0);

  const staffActiveTenants = tenants.filter((t) => {
    if (t.status !== 'ACTIVE') return false;
    const tRoom = t.room || (t.rooms && t.rooms[0]);
    if (!tRoom) return false;
    if (t.houseCode && staffHouseCodes.includes(t.houseCode)) return true;
    const roomObj = (rooms || []).find((r) => r.number === tRoom);
    return roomObj && staffHouseCodes.includes(roomObj.houseCode);
  });
  const activeTenantsCount = isZeroSandbox
    ? staffActiveTenants.length
    : (staffActiveTenants.length || (scopedRooms.some((r) => r.status === 'OCCUPIED') ? occupiedCount : 0));

  const staffChartRevenueData = useMemo(() => {
    if (isZeroSandbox || monthlyPaidRevenue === 0) {
      return [
        { month: 'T1', revenue: 0, target: 0 },
        { month: 'T2', revenue: 0, target: 0 },
        { month: 'T3', revenue: 0, target: 0 },
        { month: 'T4', revenue: 0, target: 0 },
        { month: 'T5', revenue: 0, target: 0 },
        { month: 'T6', revenue: 0, target: 0 },
        { month: 'T7', revenue: 0, target: 0 },
        { month: 'T8', revenue: 0, target: 0 },
        { month: 'T9', revenue: monthlyPaidRevenue, target: totalRooms * 3000000 },
      ];
    }
    return revenueData;
  }, [isZeroSandbox, monthlyPaidRevenue, totalRooms]);

  return (
    <div className="space-y-6 page-enter">
      {/* Header Bento Banner */}
      <div className="bento-card p-6 sm:p-7 bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="status-pill status-pill-indigo">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>{staffManageableHouses.length > 1 ? 'Chuỗi Cơ Sở Vận Hành' : 'Cơ Sở Vận Hành Chi Nhánh'}</span>
            </span>
            <span className="status-pill status-pill-success">
              <span className="pulse-dot-green shrink-0" />
              <span>Hệ Thống Trực Tuyến 99.9%</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {staffManageableHouses.length > 1
              ? `Tổng Quan Chuỗi: ${user?.fullName || 'Lê Thị Thu Ngân'} (${staffManageableHouses.length} Cơ Sở)`
              : `Tổng Quan Vận Hành: ${staffManageableHouses[0]?.name || user?.houseName || 'Cơ Sở 1 - Cầu Giấy'}`}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            {staffManageableHouses.length > 1
              ? `Quản lý vận hành ${staffManageableHouses.map((h) => h.code).join(', ')} • Quy mô: ${totalRooms} phòng • Phụ trách: ${user?.fullName || 'Lê Thị Thu Ngân'}`
              : `Quản lý trực tiếp chi nhánh ${staffManageableHouses[0]?.code || user?.houseCode || 'CS-01'} • Cán bộ phụ trách: ${user?.fullName || 'Lê Thị Thu Ngân'}`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/rooms"
            className="btn-press flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            <span>Sơ Đồ Phòng</span>
          </Link>
          <Link
            to="/meters"
            className="btn-press btn-shimmer flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-purple-600/20 transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>Chốt Điện Nước (AI)</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Tổng số phòng */}
        <div className="bento-card p-5 space-y-3 stagger-item stagger-1 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Số Phòng</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold ring-1 ring-indigo-500/10">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{totalRooms}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{occupancyRate}% Lấp đầy</span>
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${occupancyRate}%` }} />
          </div>
        </div>

        {/* Card 2: Khách đang thuê */}
        <div className="bento-card p-5 space-y-3 stagger-item stagger-2 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Khách Đang Thuê</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold ring-1 ring-purple-500/10">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {activeTenantsCount}
            </span>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
              {activeTenantsCount > 0 ? `${activeTenantsCount} khách – ${occupiedCount} phòng` : 'Chưa có khách'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {activeTenantsCount > 0 ? 'Đã xác thực CCCD & ký hợp đồng số' : 'Chưa có hợp đồng thuê hoạt động'}
          </p>
        </div>

        {/* Card 3: Doanh thu tháng */}
        <div className="bento-card p-5 space-y-3 stagger-item stagger-3 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doanh Thu Tháng 9</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold ring-1 ring-emerald-500/10">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {isZeroSandbox
                ? (monthlyPaidRevenue > 0 ? (monthlyPaidRevenue / 1000000).toFixed(1) + 'M' : '0 ₫')
                : (monthlyPaidRevenue > 0 ? (monthlyPaidRevenue / 1000000).toFixed(1) + 'M' : '62.4M')}
            </span>
            {monthlyPaidRevenue > 0 || !isZeroSandbox ? (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+6.8% MoM</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                0% MoM
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {monthlyPaidRevenue > 0 || !isZeroSandbox ? 'Vượt mục tiêu tháng 6.4M' : 'Chưa có hóa đơn thực thu'}
          </p>
        </div>

        {/* Card 4: Hóa đơn chờ thu */}
        <div className="bento-card p-5 space-y-3 stagger-item stagger-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hóa Đơn Chờ Thu</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold ring-1 ring-amber-500/10">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{unpaidCount}</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
              {pendingMeterCount} chờ chốt Đ/N
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Cập nhật SePay VietQR tức thì</p>
        </div>
      </div>

      {/* Bento Analytics Grid: Dòng Tiền & Tỷ Lệ Lấp Đầy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu Đồ Doanh Thu Chuỗi (Col Span 2) */}
        <div className="lg:col-span-2 bento-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Dòng Tiền & Tăng Trưởng Doanh Thu Chuỗi</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Doanh thu thực tế so với mục tiêu theo từng tháng (Đơn vị: VNĐ)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-indigo-600" />
                <span className="font-semibold text-slate-600">Thực thu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-slate-300" />
                <span className="font-semibold text-slate-400">Chỉ tiêu</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={staffChartRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#revGradient)"
                  isAnimationActive={true}
                  animationDuration={1400}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tỷ Lệ Lấp Đầy & Tình Trạng Phòng (Col Span 1) */}
        <div className="bento-card p-6 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-600" />
              <span>Cơ Cấu Tình Trạng Phòng</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">Tổng: {totalRooms} phòng</span>
          </div>

          <div className="h-52 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roomStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={84}
                  paddingAngle={4}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationEasing="ease-out"
                >
                  {roomStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} phòng`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{occupancyRate}%</span>
              <span className="text-[11px] text-slate-400 font-medium">Lấp đầy</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
            {roomStatusData.map((s) => (
              <div key={s.name} className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span>{s.name}</span>
                </div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Phím Tắt Nghiệp Vụ & Cảnh Báo Vận Hành */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phím Tắt Nghiệp Vụ Nhanh Chi Nhánh */}
        <div className="lg:col-span-2 bento-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Phím Tắt Nghiệp Vụ Vận Hành Cơ Sở</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/meters"
              className="p-4 bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/70 hover:scale-[1.02] hover:shadow-md rounded-2xl transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <div className="font-bold text-slate-900 text-xs">Chốt Điện Nước</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Nhận diện OCR camera</div>
            </Link>

            <Link
              to="/rooms"
              className="p-4 bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/70 hover:scale-[1.02] hover:shadow-md rounded-2xl transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Home className="w-5 h-5" />
              </div>
              <div className="font-bold text-slate-900 text-xs">Sơ Đồ Phòng</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Phân tầng & trạng thái</div>
            </Link>

            <Link
              to="/tenants"
              className="p-4 bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/70 hover:scale-[1.02] hover:shadow-md rounded-2xl transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div className="font-bold text-slate-900 text-xs">Quản Lý Cư Dân</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Định danh & KYC CCCD</div>
            </Link>

            <Link
              to="/invoices"
              className="p-4 bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/70 hover:scale-[1.02] hover:shadow-md rounded-2xl transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="font-bold text-slate-900 text-xs">Hóa Đơn & Thu Phí</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Webhook SePay & VietQR</div>
            </Link>
          </div>
        </div>

        {/* Trạng Thái Vận Hành & Cảnh Báo (Col Span 1) */}
        <div className="bento-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Cảnh Báo Vận Hành</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <Link
              to="/meters"
              className="p-3 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/80 rounded-2xl flex items-center justify-between transition-colors cursor-pointer block"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-amber-900 font-semibold">Hóa đơn chờ chốt Đ/N</span>
              </div>
              <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg font-mono">
                {pendingMeterCount} phòng
              </span>
            </Link>

            <Link
              to="/invoices"
              className="p-3 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/80 rounded-2xl flex items-center justify-between transition-colors cursor-pointer block"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-rose-900 font-semibold">Hóa đơn quá hạn / chưa thu</span>
              </div>
              <span className="font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-lg font-mono">
                {unpaidCount} hóa đơn
              </span>
            </Link>

            <Link
              to="/maintenance"
              className="p-3 bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/80 rounded-2xl flex items-center justify-between transition-colors cursor-pointer block group"
            >
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4 text-indigo-600 shrink-0 group-hover:rotate-12 transition-transform" />
                <span className="text-indigo-900 font-semibold group-hover:underline">Yêu cầu bảo trì đang mở</span>
              </div>
              <span className={`font-bold px-2 py-0.5 rounded-lg font-mono ${
                openTicketsCount > 0 ? 'text-indigo-800 bg-indigo-100' : 'text-slate-600 bg-slate-100'
              }`}>
                {openTicketsCount} sự cố
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
