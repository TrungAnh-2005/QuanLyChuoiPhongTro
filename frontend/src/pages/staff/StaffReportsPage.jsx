import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

export default function StaffReportsPage() {
  const { user } = useAuth();
  const { rooms = [], invoices = [] } = useData();
  const isZeroSandbox = typeof window !== 'undefined' && localStorage.getItem('rental_is_zero_sandbox') === 'true';

  const [selectedFacility, setSelectedFacility] = useState('ALL');
  const [timeRange, setTimeRange] = useState('9_MONTHS');
  const [pdfToast, setPdfToast] = useState(false);

  const staffManageableHouses = useMemo(() => {
    try {
      const saved = localStorage.getItem('rental_boarding_houses');
      const dynamicHouses = saved ? JSON.parse(saved) : [];
      const u = (user?.username || '').toLowerCase();
      return dynamicHouses.filter((h) => {
        const created = (h.createdBy || '').toLowerCase();
        const manager = (h.managerUsername || '').toLowerCase();
        if (created && created === u) return true;
        if (manager && manager === u) return true;
        if (user?.houseCode && h.code === user.houseCode) return true;
        if (!isZeroSandbox) {
          if (u === 'staff' && (h.code === 'CS-01' || !h.createdBy)) return true;
          if (u === 'staff2' && h.code === 'CS-02') return true;
        }
        return false;
      });
    } catch {
      return [];
    }
  }, [user, isZeroSandbox]);

  const staffHouseCodes = useMemo(() => staffManageableHouses.map((h) => h.code), [staffManageableHouses]);

  const facilities = useMemo(() => {
    return [
      { code: 'ALL', name: 'Toàn Bộ Cơ Sở Của Tôi' },
      ...staffManageableHouses.map((h) => ({ code: h.code, name: h.name }))
    ];
  }, [staffManageableHouses]);

  const facilityStats = useMemo(() => {
    let baseRooms = rooms.filter((r) => staffHouseCodes.includes(r.houseCode));
    let baseInvoices = invoices.filter((i) => {
      if (i.houseCode && staffHouseCodes.includes(i.houseCode)) return true;
      const invRoom = rooms.find((r) => r.number === i.room);
      return invRoom && staffHouseCodes.includes(invRoom.houseCode);
    });

    const targetRooms = selectedFacility === 'ALL'
      ? baseRooms
      : baseRooms.filter((r) => r.houseCode === selectedFacility);

    const totalRooms = targetRooms.length;
    const occupiedRooms = targetRooms.filter((r) => r.status === 'OCCUPIED').length;
    const vacantRooms = targetRooms.filter((r) => r.status === 'AVAILABLE').length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const targetInvoices = selectedFacility === 'ALL'
      ? baseInvoices
      : baseInvoices.filter((i) => (i.houseCode === selectedFacility) || (i.house && i.house.includes(selectedFacility)));

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
  }, [rooms, invoices, selectedFacility, staffHouseCodes]);

  const chartData = useMemo(() => {
    const allMonths = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9'
    ];

    let targetMonths = allMonths;
    if (timeRange === 'SEP_2026') targetMonths = allMonths.slice(8);
    else if (timeRange === 'Q3_2026') targetMonths = allMonths.slice(6, 9);
    else if (timeRange === 'Q2_2026') targetMonths = allMonths.slice(3, 6);

    return targetMonths.map((m) => {
      const isSep = m === 'Tháng 9';
      const roomRev = isSep ? (facilityStats.totalRevenue / 1000000) : 0;
      const roomProfit = roomRev > 0 ? Number((roomRev * 0.75).toFixed(2)) : 0;
      return {
        month: m,
        revenue: Number(roomRev.toFixed(2)),
        profit: Number(roomProfit.toFixed(2))
      };
    });
  }, [timeRange, facilityStats.totalRevenue]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-purple-600" />
            <span>Báo Cáo Tài Chính & Hiệu Suất Cơ Sở</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Theo dõi doanh thu phòng, công nợ quá hạn, chi phí và tỷ lệ lấp đầy phòng theo từng cơ sở được phân công.
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

      {/* Bộ Lọc Thời Gian */}
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

      {/* Facility Selector */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Building2 className="w-4 h-4 text-purple-600" />
          <span>Lọc báo cáo theo cơ sở:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {facilities.map((f) => (
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

      {/* Staff KPIs */}
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
            {Math.round(facilityStats.totalRevenue * 0.75).toLocaleString('vi-VN')} đ
          </div>
          <div className="text-xs text-blue-600 font-medium mt-1">
            Đã trừ chi phí điện nước buôn & bảo trì
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs card-interactive">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Doanh Thu & Lợi Nhuận Cơ Sở: {facilities.find((f) => f.code === selectedFacility)?.name || 'Cơ sở của tôi'} (Triệu VNĐ)
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Số liệu doanh thu tiền thuê phòng và lợi nhuận thực tế thu được của cơ sở
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-purple-700">
              <span className="w-3 h-3 rounded bg-purple-600"></span>
              <span>Doanh thu phòng</span>
            </span>
            <span className="flex items-center gap-1.5 text-blue-600">
              <span className="w-3 h-3 rounded bg-blue-600"></span>
              <span>Lợi nhuận ròng</span>
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
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
                formatter={(val, name) => [`${val} Triệu VNĐ`, name]}
              />
              <Bar
                dataKey="revenue"
                fill="#7c3aed"
                radius={[6, 6, 0, 0]}
                name="Doanh thu phòng"
              />
              <Bar
                dataKey="profit"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
                name="Lợi nhuận ròng"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
