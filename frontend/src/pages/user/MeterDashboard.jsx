import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Droplets,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Camera,
  Coins,
  ShieldCheck,
  Filter,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import TrialExpiryBanner from '@/components/common/TrialExpiryBanner';

export default function MeterDashboard() {
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';
  const isTenant = role === 'TENANT';

  const {
    billingMonth = '2026-09',
    switchBillingMonth,
    meters: readings = [],
    utilityPrices = { elecPrice: 3500, waterPrice: 25000 },
    invoices = [],
    landlords = []
  } = useData();

  const navigate = useNavigate();
  const [selectedHouse, setSelectedHouse] = useState('ALL');

  // Xác định landlord
  const currentLandlord = useMemo(() => {
    return (landlords || []).find(
      (l) => l.username === user?.username || l.fullName === user?.fullName
    ) || (landlords && landlords.length > 0 ? landlords[0] : null);
  }, [user, landlords]);

  // Danh mục Cơ sở
  const houses = useMemo(() => [
    { code: 'CS-01', name: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', shortName: 'Cơ Sở 1 - Cầu Giấy' },
    { code: 'CS-02', name: 'Nhà Trọ Bách Khoa - Cơ Sở 2', shortName: 'Cơ Sở 2 - Bách Khoa' },
    { code: 'CS-03', name: 'Nhà Trọ Đống Đa - Cơ Sở 3', shortName: 'Cơ Sở 3 - Đống Đa' }
  ], []);

  // Lọc readings theo cơ sở
  const filteredReadings = useMemo(() => {
    if (selectedHouse === 'ALL') return readings;
    return (readings || []).filter((r) => r.houseCode === selectedHouse || (r.house && r.house.includes(selectedHouse)));
  }, [readings, selectedHouse]);

  const totalRooms = filteredReadings.length || 32;
  const recordedRooms = filteredReadings.filter((r) => r.recorded || r.paid).length;
  const unrecordedRooms = totalRooms - recordedRooms;
  const progressPercent = totalRooms > 0 ? Math.round((recordedRooms / totalRooms) * 100) : 0;

  // Tính sản lượng điện & nước
  const totalElecUsed = useMemo(() => {
    return filteredReadings.reduce((sum, r) => sum + (Number(r.elecUsed) || (r.newElec && r.oldElec ? r.newElec - r.oldElec : 0)), 0);
  }, [filteredReadings]);

  const totalWaterUsed = useMemo(() => {
    return filteredReadings.reduce((sum, r) => sum + (Number(r.waterUsed) || (r.newWater && r.oldWater ? r.newWater - r.oldWater : 0)), 0);
  }, [filteredReadings]);

  const totalElecCost = totalElecUsed * (utilityPrices.elecPrice || 3500);
  const totalWaterCost = totalWaterUsed * (utilityPrices.waterPrice || 25000);
  const totalUtilityRevenue = totalElecCost + totalWaterCost;

  // Dữ liệu biểu đồ xu hướng 6 tháng gần nhất
  const trendData = [
    { month: 'T4', elec: 2850, water: 340, totalCost: 18475000 },
    { month: 'T5', elec: 3420, water: 410, totalCost: 22220000 },
    { month: 'T6', elec: 4150, water: 490, totalCost: 26775000 },
    { month: 'T7', elec: 4380, water: 510, totalCost: 28080000 },
    { month: 'T8', elec: 4120, water: 480, totalCost: 26420000 },
    { month: 'T9', elec: totalElecUsed || 3980, water: totalWaterUsed || 460, totalCost: totalUtilityRevenue || 25430000 },
  ];

  // Thống kê theo từng cơ sở
  const houseStats = useMemo(() => {
    return houses.map((h) => {
      const houseReadings = (readings || []).filter(
        (r) => r.houseCode === h.code || (r.house && r.house.includes(h.code))
      );
      const hTotal = houseReadings.length || 10;
      const hRecorded = houseReadings.filter((r) => r.recorded || r.paid).length;
      const hElec = houseReadings.reduce((s, r) => s + (Number(r.elecUsed) || (r.newElec && r.oldElec ? r.newElec - r.oldElec : 0)), 0);
      const hWater = houseReadings.reduce((s, r) => s + (Number(r.waterUsed) || (r.newWater && r.oldWater ? r.newWater - r.oldWater : 0)), 0);
      const hCost = (hElec * (utilityPrices.elecPrice || 3500)) + (hWater * (utilityPrices.waterPrice || 25000));
      return {
        ...h,
        totalRooms: hTotal,
        recordedRooms: hRecorded,
        unrecordedRooms: hTotal - hRecorded,
        percent: Math.round((hRecorded / (hTotal || 1)) * 100),
        elecUsed: hElec,
        waterUsed: hWater,
        totalCost: hCost
      };
    });
  }, [houses, readings, utilityPrices]);

  return (
    <div className="space-y-6 page-enter pb-10">
      {/* Banner Hạn dùng thử */}
      {!isTenant && (
        <TrialExpiryBanner currentLandlord={currentLandlord} />
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Chỉ Số Tiện Ích Điện & Nước
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Đối soát tự động & Quét AI OCR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-3">
            <span>Bảng Điều Khiển Công Tơ Điện Nước</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Theo dõi tiến độ chốt số, sản lượng tiêu thụ kWh/m³ và doanh thu tiền điện nước chuỗi trọ.
          </p>
        </div>

        {/* Bộ chọn tháng & Hành động */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500 ml-2 mr-1" />
            <select
              value={billingMonth}
              onChange={(e) => switchBillingMonth && switchBillingMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 pr-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="2026-09">Kỳ Tháng 09/2026</option>
              <option value="2026-10">Kỳ Tháng 10/2026</option>
              <option value="2026-08">Kỳ Tháng 08/2026</option>
            </select>
          </div>

          <Link
            to="/meters"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Mở Bảng Chốt Số & Quét AI</span>
          </Link>
        </div>
      </div>

      {/* Lọc theo cơ sở */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mr-1">
          <Filter className="w-3.5 h-3.5" /> Cơ sở:
        </span>
        <button
          onClick={() => setSelectedHouse('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            selectedHouse === 'ALL'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Tất cả cơ sở ({readings.length} phòng)
        </button>
        {houses.map((h) => (
          <button
            key={h.code}
            onClick={() => setSelectedHouse(h.code)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedHouse === h.code
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {h.shortName}
          </button>
        ))}
      </div>

      {/* 4 Thẻ KPI Chỉ Số */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tiến độ chốt số */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tiến Độ Chốt Số</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {recordedRooms} <span className="text-sm font-semibold text-slate-400">/ {totalRooms} phòng</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
            <span>Hoàn thành: <strong className="text-purple-600 font-bold">{progressPercent}%</strong></span>
            <span>Chưa chốt: <strong className="text-amber-600 font-bold">{unrecordedRooms} phòng</strong></span>
          </div>
        </div>

        {/* KPI 2: Tổng điện tiêu thụ */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Điện Tiêu Thụ</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 font-mono tracking-tight">
              {totalElecUsed.toLocaleString('vi-VN')} <span className="text-sm font-semibold text-slate-500">kWh</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Đơn giá: {(utilityPrices.elecPrice || 3500).toLocaleString('vi-VN')} đ/kWh
            </div>
          </div>
          <div className="text-[11px] text-amber-800 font-bold bg-amber-50 border border-amber-200/60 rounded-lg px-2.5 py-1 flex items-center justify-between">
            <span>Tiền điện:</span>
            <span className="font-mono">{totalElecCost.toLocaleString('vi-VN')} ₫</span>
          </div>
        </div>

        {/* KPI 3: Tổng nước tiêu thụ */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nước Tiêu Thụ</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-600 font-mono tracking-tight">
              {totalWaterUsed.toLocaleString('vi-VN')} <span className="text-sm font-semibold text-slate-500">m³</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Đơn giá: {(utilityPrices.waterPrice || 25000).toLocaleString('vi-VN')} đ/m³
            </div>
          </div>
          <div className="text-[11px] text-blue-800 font-bold bg-blue-50 border border-blue-200/60 rounded-lg px-2.5 py-1 flex items-center justify-between">
            <span>Tiền nước:</span>
            <span className="font-mono">{totalWaterCost.toLocaleString('vi-VN')} ₫</span>
          </div>
        </div>

        {/* KPI 4: Tổng doanh thu tiện ích */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3 hover:shadow-md transition-all bg-gradient-to-br from-white to-orange-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Doanh Thu Tiện Ích</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
              {totalUtilityRevenue.toLocaleString('vi-VN')} <span className="text-xs font-bold text-slate-400">₫</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Tính trên các phòng đã ghi chỉ số kỳ này
            </div>
          </div>
          <div className="text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200/60 rounded-lg px-2.5 py-1 flex items-center justify-between">
            <span>Đã tính vào hóa đơn</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Hàng 2: Biểu đồ & Tình trạng cơ sở */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ xu hướng tiêu thụ */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Xu Hướng Tiêu Thụ Điện (kWh) & Doanh Thu 6 Tháng Gần Nhất
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi biến động tiêu thụ điện mùa nóng/lạnh để tối ưu hợp đồng phụ tải
              </p>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200/60">
              Điện & Doanh thu
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="elecGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'elec' ? `${value.toLocaleString('vi-VN')} kWh` : `${value.toLocaleString('vi-VN')} ₫`,
                    name === 'elec' ? 'Điện tiêu thụ' : 'Doanh thu tiện ích'
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="elec"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#elecGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tóm tắt chốt số theo Cơ sở */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Tiến Độ Từng Cơ Sở
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Tỷ lệ chốt công tơ chi nhánh</p>
              </div>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {houseStats.map((h) => (
                <div key={h.code} className="py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{h.shortName}</span>
                    <span className="font-mono font-bold text-purple-700">
                      {h.recordedRooms}/{h.totalRooms} ({h.percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        h.percent === 100
                          ? 'bg-emerald-500'
                          : h.percent > 50
                          ? 'bg-purple-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${h.percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Điện: {h.elecUsed} kWh</span>
                    <span>Nước: {h.waterUsed} m³</span>
                    <span className="font-bold text-slate-600">{h.totalCost.toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/meters"
            className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Xem Danh Sách Chi Tiết 32 Phòng</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
