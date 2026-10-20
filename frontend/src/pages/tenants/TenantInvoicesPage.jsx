import React, { useState, useMemo } from 'react';
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Download,
  Printer,
  ChevronRight,
  Zap,
  Droplets,
  Home,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import PaymentModal from '@/components/payment/PaymentModal';

export default function TenantInvoicesPage() {
  const { user, tenantRooms } = useAuth();
  const { invoices = [], tenants = [], contracts = [] } = useData();

  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'UNPAID' | 'PAID'
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);

  // Tìm khách thuê & hợp đồng
  const currentTenant = useMemo(() => {
    return (tenants || []).find(
      (t) => t.username === user?.username || t.phone === user?.phone || (user?.fullName && t.fullName?.toLowerCase().includes(user.fullName.toLowerCase()))
    );
  }, [tenants, user]);

  const activeContract = useMemo(() => {
    return (contracts || []).find((c) => {
      const matchPhone = c.tenantPhone && user?.phone && c.tenantPhone === user.phone;
      const matchName = c.tenantName && user?.fullName && c.tenantName.toLowerCase().includes(user.fullName.toLowerCase());
      return (matchPhone || matchName) && (c.status === 'ACTIVE' || c.status === 'EXPIRED' || c.status === 'PENDING_TERMINATION');
    });
  }, [contracts, user]);

  const myRentedRooms = useMemo(() => {
    const list = [];
    if (activeContract?.roomNumber && !list.includes(activeContract.roomNumber)) list.push(activeContract.roomNumber);
    if (currentTenant?.room && !list.includes(currentTenant.room)) list.push(currentTenant.room);
    if (user?.room && !list.includes(user.room)) list.push(user.room);
    if (Array.isArray(tenantRooms)) {
      tenantRooms.forEach((r) => { if (r && !list.includes(r)) list.push(r); });
    }
    return list;
  }, [currentTenant, user, tenantRooms, activeContract]);

  // Lọc danh sách hóa đơn của khách thuê
  const myInvoices = useMemo(() => {
    return (invoices || []).filter((inv) => {
      const isMyRoom =
        myRentedRooms.includes(inv.room) ||
        (user?.room && inv.room === user.room) ||
        (user?.rooms && user.rooms.includes(inv.room)) ||
        (inv.room && myRentedRooms.some(r => inv.room.includes(r)));
      const isMyName =
        inv.tenant &&
        user?.fullName &&
        (inv.tenant.toLowerCase().includes(user.fullName.toLowerCase()) ||
          user.fullName.toLowerCase().includes(inv.tenant.toLowerCase()));
      if (!isMyRoom && !isMyName) return false;
      if (inv.status === 'PENDING_METER') return false;
      return inv.sentToTenant !== false;
    });
  }, [invoices, myRentedRooms, user]);

  const displayedInvoices = useMemo(() => {
    if (filterStatus === 'ALL') return myInvoices;
    return myInvoices.filter((inv) => inv.status === filterStatus);
  }, [myInvoices, filterStatus]);

  // Thống kê nhanh
  const unpaidInvoices = myInvoices.filter((inv) => inv.status === 'UNPAID');
  const totalUnpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + (Number(inv.total) || Number(inv.amount) || 0), 0);
  const paidCount = myInvoices.filter((inv) => inv.status === 'PAID').length;

  return (
    <div className="space-y-6 page-enter pb-10">
      {/* Header Banner */}
      <div className="hero-gradient-shine bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white p-6 rounded-2xl shadow-xl shadow-indigo-600/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-2">
            <Receipt className="w-3.5 h-3.5" />
            <span>Hóa Đơn & Tiền Phòng • Cổng Cư Dân</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Hóa Đơn Tiền Nhà & Dịch Vụ {myRentedRooms.length > 0 && `(Phòng ${myRentedRooms.join(', ')})`}
          </h1>
          <p className="text-purple-100 text-sm mt-1 max-w-2xl">
            Theo dõi chi tiết các khoản tiền phòng, tiền điện nước đối soát và đóng tiền trực tuyến bằng mã VietQR / VNPay tự động gạch nợ.
          </p>
        </div>

        {totalUnpaidAmount > 0 && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-right shrink-0">
            <span className="text-purple-200 block text-xs font-semibold">Cần thanh toán:</span>
            <div className="text-2xl font-black font-mono text-amber-300 mt-0.5">
              {totalUnpaidAmount.toLocaleString('vi-VN')} ₫
            </div>
          </div>
        )}
      </div>

      {/* 3 Thẻ Thống Kê Nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Tổng Tiền Chưa Đóng</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {totalUnpaidAmount.toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-xs text-slate-400 font-medium">
            {unpaidInvoices.length} kỳ cước đang chờ thanh toán
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Hóa Đơn Đã Thanh Toán</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {paidCount} kỳ cước
          </div>
          <div className="text-xs text-slate-400 font-medium">Đã được chủ trọ duyệt và gạch nợ</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Phòng Thuê Hiện Tại</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">
            {myRentedRooms[0] || 'P.101'}
          </div>
          <div className="text-xs text-slate-400 font-medium">Hợp đồng điện tử hiệu lực</div>
        </div>
      </div>

      {/* Bộ Lọc Trạng Thái */}
      <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất Cả ({myInvoices.length})
          </button>
          <button
            onClick={() => setFilterStatus('UNPAID')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'UNPAID'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Chưa Thanh Toán ({unpaidInvoices.length})
          </button>
          <button
            onClick={() => setFilterStatus('PAID')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'PAID'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Đã Thanh Toán ({paidCount})
          </button>
        </div>
      </div>

      {/* Danh Sách Hóa Đơn */}
      {displayedInvoices.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm space-y-2">
          <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">Bạn chưa có hóa đơn nào phù hợp với bộ lọc.</p>
          <p className="text-xs text-slate-400">Các hóa đơn mới được BQL phát hành sẽ hiển thị tự động tại đây.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedInvoices.map((inv) => {
            const isPaid = inv.status === 'PAID';
            const total = Number(inv.total) || Number(inv.amount) || 0;
            const roomFee = Number(inv.roomPrice) || Number(inv.roomFee) || 3500000;
            const elecCost = Number(inv.elecCost) || 0;
            const waterCost = Number(inv.waterCost) || 0;
            const serviceCost = Number(inv.serviceFee) || 0;

            return (
              <div
                key={inv.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-purple-300 transition-all space-y-4"
              >
                {/* Header card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base text-slate-900">{inv.code || `HĐ-${inv.id}`}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {isPaid ? '✓ Đã Thanh Toán' : 'Chờ Thanh Toán'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Phòng: <strong className="text-purple-700 font-mono">{inv.room}</strong> • Kỳ cước:{' '}
                        <strong className="text-slate-700">{inv.month || 'Tháng 09/2026'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isPaid && (
                      <button
                        onClick={() => setPayingInvoice(inv)}
                        className="btn-press px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Thanh Toán Ngay</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Chi tiết chi phí */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tiền phòng:</span>
                    <strong className="text-slate-800 font-mono">{roomFee.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tiền điện:</span>
                    <strong className="text-amber-700 font-mono">{elecCost.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tiền nước:</span>
                    <strong className="text-blue-700 font-mono">{waterCost.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Dịch vụ khác:</span>
                    <strong className="text-slate-800 font-mono">{serviceCost.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                </div>

                {/* Footer tổng tiền */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">
                    Hạn nộp tiền: <strong className="text-slate-800">{inv.dueDate || '10/10/2026'}</strong>
                  </span>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px] block">Tổng số tiền:</span>
                    <span className="text-lg font-black text-purple-700 font-mono">
                      {total.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thanh Toán */}
      {payingInvoice && (
        <PaymentModal
          isOpen={Boolean(payingInvoice)}
          onClose={() => setPayingInvoice(null)}
          invoice={payingInvoice}
        />
      )}
    </div>
  );
}
