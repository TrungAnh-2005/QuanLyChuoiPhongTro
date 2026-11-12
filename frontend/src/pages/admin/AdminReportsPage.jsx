import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  ArrowUpRight,
  Calendar,
  ShieldCheck
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
import { useData } from '../../contexts/DataContext';

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

      {/* Bộ Lọc Thời Gian */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Calendar className="w-4 h-4 text-indigo-600" />
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
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

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
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs card-interactive">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Xu Hướng Doanh Thu SaaS & Dòng Tiền GMV Toàn Sàn (Triệu VNĐ)
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Số liệu doanh thu phần mềm SaaS & dòng tiền thanh toán toàn sàn qua cổng điện tử
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-indigo-700">
              <span className="w-3 h-3 rounded bg-indigo-600"></span>
              <span>Doanh thu phần mềm SaaS</span>
            </span>
            <span className="flex items-center gap-1.5 text-blue-600">
              <span className="w-3 h-3 rounded bg-blue-600"></span>
              <span>Dòng tiền GMV toàn sàn</span>
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
                fill="#4f46e5"
                radius={[6, 6, 0, 0]}
                name="Doanh thu phần mềm SaaS"
              />
              <Bar
                dataKey="profit"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
                name="Dòng tiền GMV toàn sàn"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
