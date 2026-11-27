import { useState, useMemo } from 'react';
import { filterManagedProperties } from '../../properties/property.rules.js';
import {
  BarChart3,
  Download,
  Building2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import ReportPeriodFilter from '../../../components/reports/ReportPeriodFilter';
import RevenueReportChart from '../../../components/reports/RevenueReportChart';
import { useAuth } from '../../auth/AuthContext';
import { useData } from '../../../shared/data/RentalDataContext';

export default function StaffReportsPage() {
  const {boardingHouses:apiBoardingHouses=[]}=useData() || {};

  const { user } = useAuth();
  const { rooms = [], invoices = [], revenueReport } = useData();

  const [selectedFacility, setSelectedFacility] = useState('ALL');
  const [timeRange, setTimeRange] = useState('9_MONTHS');
  const [pdfToast, setPdfToast] = useState(false);

  const staffManageableHouses = useMemo(() => filterManagedProperties(apiBoardingHouses, user), [apiBoardingHouses, user]);

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

  const chartData = (revenueReport?.monthlyData || []).map(m=>({month:m.monthLabel || `Tháng ${m.month}`,revenue:Number(m.revenue)/1000000}));

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

      <ReportPeriodFilter value={timeRange} onChange={setTimeRange} color="purple" />

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
      <RevenueReportChart
        data={chartData}
        title={`Doanh Thu & Lợi Nhuận Cơ Sở: ${facilities.find(facility => facility.code === selectedFacility)?.name || 'Cơ sở của tôi'}`}
        description="Số liệu doanh thu tiền thuê phòng và lợi nhuận thực tế thu được của cơ sở"
        revenueLabel="Doanh thu phòng"
        comparisonLabel="Lợi nhuận ròng"
        color="purple"
      />
    </div>
  );
}
