import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  PieChart as PieIcon,
  ArrowUpRight,
  DollarSign,
  Calendar,
  Building2,
  AlertTriangle,
  Users,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const yearlyData = [
  { month: 'Tháng 1', revenue: 42.0, cost: 8.5, profit: 33.5 },
  { month: 'Tháng 2', revenue: 45.5, cost: 9.0, profit: 36.5 },
  { month: 'Tháng 3', revenue: 48.0, cost: 9.2, profit: 38.8 },
  { month: 'Tháng 4', revenue: 47.2, cost: 8.8, profit: 38.4 },
  { month: 'Tháng 5', revenue: 51.8, cost: 10.1, profit: 41.7 },
  { month: 'Tháng 6', revenue: 54.0, cost: 10.5, profit: 43.5 },
  { month: 'Tháng 7', revenue: 53.2, cost: 10.0, profit: 43.2 },
  { month: 'Tháng 8', revenue: 58.6, cost: 11.2, profit: 47.4 },
  { month: 'Tháng 9', revenue: 62.4, cost: 11.8, profit: 50.6 },
];

const saasPlatformData = [
  { month: 'Tháng 1', saasFee: 24.5, activeLandlords: 18, gmv: 320 },
  { month: 'Tháng 2', saasFee: 28.0, activeLandlords: 21, gmv: 360 },
  { month: 'Tháng 3', saasFee: 32.5, activeLandlords: 24, gmv: 410 },
  { month: 'Tháng 4', saasFee: 36.0, activeLandlords: 27, gmv: 450 },
  { month: 'Tháng 5', saasFee: 41.0, activeLandlords: 31, gmv: 520 },
  { month: 'Tháng 6', saasFee: 44.5, activeLandlords: 33, gmv: 580 },
  { month: 'Tháng 7', saasFee: 47.0, activeLandlords: 36, gmv: 620 },
  { month: 'Tháng 8', saasFee: 50.5, activeLandlords: 38, gmv: 690 },
  { month: 'Tháng 9', saasFee: 54.2, activeLandlords: 42, gmv: 750 },
];

const FACILITIES = [
  { code: 'ALL', name: 'Toàn Bộ Các Cơ Sở' },
  { code: 'CS-01', name: 'Nhà Trọ Cầu Giấy - Cơ Sở 1' },
  { code: 'CS-02', name: 'Nhà Trọ Bách Khoa - Cơ Sở 2' },
  { code: 'CS-03', name: 'Nhà Trọ Đống Đa - Cơ Sở 3' }
];

export default function ReportsPage() {
  const { user } = useAuth();
  const { rooms = [], invoices = [], landlords = [] } = useData();
  const role = user?.role || 'ADMIN';
  const isStaff = role === 'STAFF';
  const isAdmin = role === 'ADMIN';

  const [selectedFacility, setSelectedFacility] = useState('ALL');
  const [timeRange, setTimeRange] = useState('9_MONTHS');
  const [pdfToast, setPdfToast] = useState(false);

  // Thống kê cơ sở cho Staff (UC-S06)
  const facilityStats = useMemo(() => {
    const targetRooms = selectedFacility === 'ALL'
      ? rooms
      : rooms.filter((r) => r.houseCode === selectedFacility);

    const totalRooms = targetRooms.length;
    const occupiedRooms = targetRooms.filter((r) => r.status === 'OCCUPIED').length;
    const vacantRooms = targetRooms.filter((r) => r.status === 'AVAILABLE').length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const targetInvoices = selectedFacility === 'ALL'
      ? invoices
      : invoices.filter((i) => i.house && i.house.includes(selectedFacility));

    const totalRevenue = targetInvoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + (i.total || 0), 0);

    const overdueArrears = targetInvoices
      .filter((i) => i.status === 'OVERDUE' || i.status === 'UNPAID')
      .reduce((sum, i) => sum + (i.total || 0), 0);

    return {
      totalRooms,
      occupiedRooms,
      vacantRooms,
      occupancyRate,
      totalRevenue,
      overdueArrears
    };
  }, [rooms, invoices, selectedFacility]);

    const filteredChartData = useMemo(() => {
    if (timeRange === 'SEP_2026') return yearlyData.slice(8);
    if (timeRange === 'Q3_2026') return yearlyData.slice(6, 9);
    if (timeRange === 'Q2_2026') return yearlyData.slice(3, 6);
    return yearlyData;
  }, [timeRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-purple-600" />
            <span>{isAdmin ? 'Báo Cáo Toàn Nền Tảng SaaS' : 'Báo Cáo Tài Chính & Hiệu Suất Cơ Sở'}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {isAdmin
              ? 'Tổng hợp doanh thu gói cước SaaS, số lượng chủ trọ và dòng tiền GMV toàn nền tảng.'
              : 'Theo dõi doanh thu phòng, công nợ quá hạn, chi phí và tỷ lệ lấp đầy phòng theo từng cơ sở (UC-S06).'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPdfToast(true); setTimeout(() => setPdfToast(false), 4000); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/25 transition-all btn-press cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo Cáo PDF</span>
          </button>
        </div>
      </div>

      {pdfToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs">
          <span>✓ Xuất báo cáo tài chính và hiệu suất định dạng PDF thành công!</span>
          <button onClick={() => setPdfToast(false)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">✕</button>
        </div>
      )}

      {/* Bộ Lọc Thời Gian (Task 8) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Calendar className="w-4 h-4 text-purple-600" />
          <span>Khoảng thời gian báo cáo:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: '9_MONTHS', label: '9 Tháng Gần Nhất' },
            { id: 'Q3_2026', label: 'Quý 3/2026' },
            { id: 'Q2_2026', label: 'Quý 2/2026' },
            { id: 'SEP_2026', label: 'Tháng 09/2026' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeRange === t.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                  : 'text-slate-600 hover:text-purple-700 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Facility Selector (UC-S06) */}
      {isStaff && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Building2 className="w-4 h-4 text-purple-600" />
            <span>Lọc báo cáo theo cơ sở:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {FACILITIES.map((f) => (
              <button
                key={f.code}
                onClick={() => setSelectedFacility(f.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFacility === f.code
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Staff KPIs (UC-S06) */}
      {isStaff && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ Lệ Lấp Đầy Phòng</div>
            <div className="text-2xl font-black text-purple-700 mt-2">
              {facilityStats.occupancyRate}%
            </div>
            <div className="text-xs text-slate-600 font-medium mt-1">
              Đang ở: <strong>{facilityStats.occupiedRooms}</strong> / {facilityStats.totalRooms} phòng ({facilityStats.vacantRooms} trống)
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh Thu Đã Thu Tháng Này</div>
            <div className="text-2xl font-black text-emerald-700 mt-2">
              {facilityStats.totalRevenue.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã thanh toán thực tế</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Công Nợ Đang Treo (Quá Hạn)</div>
            <div className="text-2xl font-black text-rose-700 mt-2">
              {facilityStats.overdueArrears.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-xs text-rose-600 font-bold mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cần nhắc nhở thanh toán</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lợi Nhuận Ròng Ước Tính</div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {Math.max(0, facilityStats.totalRevenue - 11800000).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-xs text-blue-600 font-medium mt-1">
              Đã trừ chi phí điện nước buôn & bảo trì
            </div>
          </div>
        </div>
      )}

      {/* Admin SaaS KPIs (UC-A01, UC-A03) */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh Thu Thuê Phần Mềm (MRR)</div>
            <div className="text-2xl font-black text-purple-700 mt-2">54.200.000 đ</div>
            <div className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+18.5% so với tháng trước</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chủ Trọ Đang Hoạt Động</div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {landlords.length || 42} Chủ Trọ
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Quản lý tổng cộng 380 phòng trọ
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Giao Dịch GMV Toàn Sàn</div>
            <div className="text-2xl font-black text-blue-700 mt-2">750.000.000 đ</div>
            <div className="text-xs text-blue-600 font-medium mt-1">
              Qua VietQR, VNPay, MoMo
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Độ Tin Cậy Hệ Thống (SLA)</div>
            <div className="text-2xl font-black text-emerald-700 mt-2">99.98%</div>
            <div className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>12 Microservices Healthy</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Chart */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs card-interactive">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isAdmin
                ? 'Xu Hướng Doanh Thu SaaS & Dòng Tiền GMV Toàn Sàn (Triệu VNĐ)'
                : 'So Sánh Doanh Thu vs Lợi Nhuận Chuỗi Nhà Trọ (Triệu VNĐ)'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Số liệu thực tế 9 tháng đầu năm 2026</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-purple-700 font-bold">
              <span className="w-3 h-3 rounded bg-purple-600"></span> Doanh thu
            </span>
            <span className="flex items-center gap-1.5 text-blue-600 font-bold">
              <span className="w-3 h-3 rounded bg-blue-600"></span> Lợi nhuận
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={isAdmin ? saasPlatformData.map((d) => ({ month: d.month, revenue: d.saasFee, profit: d.saasFee * 0.82 })) : yearlyData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}Tr`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '0.75rem',
                  color: '#0f172a',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(val) => [`${val} Triệu VNĐ`]}
              />
              <Bar dataKey="revenue" fill="#7c3aed" radius={[6, 6, 0, 0]} name="Doanh thu" />
              <Bar dataKey="profit" fill="#2563eb" radius={[6, 6, 0, 0]} name="Lợi nhuận" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
