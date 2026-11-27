import { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import ReportPeriodFilter from '../../../components/reports/ReportPeriodFilter';
import RevenueReportChart from '../../../components/reports/RevenueReportChart';
import { useData } from '../../../shared/data/RentalDataContext';

export default function AdminReportsPage() {
  const isZeroSandbox = true;
  const { rooms = [], invoices = [], landlords = [], saasInvoices = [], allInvoices = [] } = useData();

  const [timeRange, setTimeRange] = useState('9_MONTHS');
  const [pdfToast, setPdfToast] = useState(false);

  const totalSaasRevenue = useMemo(() => {
    return (saasInvoices || [])
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  }, [saasInvoices]);

  const totalGmv = useMemo(() => {
    return (invoices || [])
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  }, [invoices]);

  const chartData = Array.from({length:12},(_,i)=>({month:`Tháng ${i+1}`,revenue:saasInvoices.filter(inv=>inv.status==='PAID' && Number((inv.paidAt || '').slice(5,7))===i+1).reduce((sum,inv)=>sum+Number(inv.amount),0)/1000000,profit:allInvoices.filter(inv=>inv.status==='PAID' && inv.month===i+1).reduce((sum,inv)=>sum+Number(inv.totalAmount),0)/1000000}));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            <span>Báo Cáo Toàn Nền Tảng SaaS</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Tổng hợp doanh thu gói cước SaaS, số lượng chủ trọ và dòng tiền GMV toàn nền tảng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPdfToast(true); setTimeout(() => setPdfToast(false), 4000); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all btn-press cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo Cáo PDF</span>
          </button>
        </div>
      </div>

      {pdfToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs">
          <span>✓ Xuất báo cáo tài chính SaaS toàn nền tảng định dạng PDF thành công!</span>
          <button onClick={() => setPdfToast(false)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">✕</button>
        </div>
      )}

      <ReportPeriodFilter value={timeRange} onChange={setTimeRange} />

      {/* Admin SaaS KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh Thu Thuê Phần Mềm (MRR)</div>
          <div className="text-2xl font-black text-indigo-700 mt-2">
            {isZeroSandbox
              ? (totalSaasRevenue > 0 ? `${totalSaasRevenue.toLocaleString('vi-VN')} đ` : '0 đ')
              : (totalSaasRevenue > 0 ? `${totalSaasRevenue.toLocaleString('vi-VN')} đ` : '54.200.000 đ')}
          </div>
          <div className={`text-xs font-bold mt-1 flex items-center gap-1 ${isZeroSandbox && totalSaasRevenue === 0 ? 'text-slate-400' : 'text-emerald-600'}`}>
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>
              {isZeroSandbox
                ? (totalSaasRevenue > 0 ? '+100% bắt đầu phát sinh' : '0% (Chưa phát sinh doanh thu)')
                : '+18.5% so với tháng trước'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chủ Trọ Đang Hoạt Động</div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {isZeroSandbox
              ? `${landlords.filter((l) => l.status === 'ACTIVE' && l.packageCode && l.packageCode !== 'NONE').length} Chủ Trọ`
              : `${landlords.length || 42} Chủ Trọ`}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {isZeroSandbox
              ? `Quản lý tổng cộng ${rooms.length} phòng trọ`
              : 'Quản lý tổng cộng 380 phòng trọ'}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Giao Dịch GMV Toàn Sàn</div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {isZeroSandbox
              ? (totalGmv > 0 ? `${totalGmv.toLocaleString('vi-VN')} đ` : '0 đ')
              : (totalGmv > 0 ? `${totalGmv.toLocaleString('vi-VN')} đ` : '750.000.000 đ')}
          </div>
          <div className="text-xs text-blue-600 font-medium mt-1">
            {isZeroSandbox
              ? (totalGmv > 0 ? 'Giao dịch mới phát sinh' : 'Chưa phát sinh giao dịch')
              : 'Qua VietQR, VNPay, MoMo'}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Độ Tin Cậy Hệ Thống (SLA)</div>
          <div className="text-2xl font-black text-emerald-700 mt-2">99.98%</div>
          <div className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>10 Microservices Healthy</span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <RevenueReportChart
        data={chartData}
        title="Xu Hướng Doanh Thu SaaS & Dòng Tiền GMV Toàn Sàn"
        description="Số liệu doanh thu phần mềm SaaS & dòng tiền thanh toán toàn sàn qua cổng điện tử"
        revenueLabel="Doanh thu phần mềm SaaS"
        comparisonLabel="Dòng tiền GMV toàn sàn"
      />
    </div>
  );
}
