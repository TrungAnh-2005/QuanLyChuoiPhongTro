import React, { useState, useMemo } from 'react';
import {
  Receipt,
  CreditCard,
  Search,
  Printer,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import PaymentModal from '../../components/payment/PaymentModal';
import Modal from '../../components/common/Modal';

export default function UserInvoicesPage() {
  const { user, tenantRooms } = useAuth();
  const { invoices = [], payInvoice, tenants = [] } = useData();

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);

  const currentTenant = useMemo(() => {
    if (!user) return null;
    const userName = (user.fullName || '').toLowerCase();
    return (tenants || []).find((t) => {
      const tName = (t.fullName || '').toLowerCase();
      return userName.includes(tName) || tName.includes(userName.split(' ')[0]);
    });
  }, [user, tenants]);

  const isTenantNew = user?.username === 'tenant_new' || user?.fullName?.includes('Nam');
  const userRoom = !isTenantNew
    ? (user?.room !== undefined && user?.room !== null
        ? user.room
        : (tenantRooms?.[user?.username] || tenantRooms?.[user?.fullName] || null))
    : null;

  const myRentedRooms = useMemo(() => {
    if (isTenantNew) return [];
    if (currentTenant?.rooms && currentTenant.rooms.length > 0) {
      return currentTenant.rooms;
    }
    if (currentTenant?.room) return [currentTenant.room];
    if (userRoom) return [userRoom];
    return [];
  }, [isTenantNew, currentTenant, userRoom]);

  const displayedInvoices = useMemo(() => {
    return (invoices || []).filter((inv) => {
      const matchesRoom =
        myRentedRooms.includes(inv.room) ||
        (user?.fullName && inv.tenant && inv.tenant.toLowerCase().includes(user.fullName.toLowerCase())) ||
        (user?.phone && inv.phone && inv.phone.replace(/\D/g, '') === user.phone.replace(/\D/g, ''));

      if (!matchesRoom) return false;

      if (filterStatus === 'UNPAID') {
        if (inv.status !== 'UNPAID' && inv.status !== 'OVERDUE') return false;
      } else if (filterStatus === 'PAID') {
        if (inv.status !== 'PAID') return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          (inv.id && inv.id.toLowerCase().includes(q)) ||
          (inv.room && inv.room.toLowerCase().includes(q)) ||
          (inv.month && inv.month.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [invoices, myRentedRooms, user, filterStatus, searchTerm]);

  const unpaidTotal = useMemo(() => {
    return (invoices || [])
      .filter((inv) => {
        const matchesRoom =
          myRentedRooms.includes(inv.room) ||
          (user?.fullName && inv.tenant && inv.tenant.toLowerCase().includes(user.fullName.toLowerCase()));
        return matchesRoom && (inv.status === 'UNPAID' || inv.status === 'OVERDUE');
      })
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
  }, [invoices, myRentedRooms, user]);

  const handlePaymentSuccess = (invoiceId) => {
    payInvoice(invoiceId, 'ONLINE_GATEWAY');
    setPaymentModalInvoice(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-indigo-600" />
            <span>Hóa Đơn & Tiền Phòng Cá Nhân</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Tra cứu tiền phòng, chi số điện nước tiêu thụ và thực hiện thanh toán trực tuyến qua MoMo, VNPay hoặc Chuyển khoản QR.
          </p>
        </div>

        {unpaidTotal > 0 && (
          <div className="px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Cần thanh toán</div>
              <div className="text-lg font-black text-rose-700">{unpaidTotal.toLocaleString('vi-VN')} đ</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['ALL', 'UNPAID', 'PAID'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'Tất Cả' : st === 'UNPAID' ? 'Chưa Thanh Toán' : 'Đã Thanh Toán'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo kỳ, mã hóa đơn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {displayedInvoices.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center shadow-xs space-y-2">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Không có hóa đơn nào</h3>
            <p className="text-xs text-slate-500">Bạn chưa có hóa đơn phát hành trong kỳ này hoặc không khớp với bộ lọc.</p>
          </div>
        ) : (
          displayedInvoices.map((inv) => (
            <div
              key={inv.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-interactive"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {inv.id}
                  </span>
                  <span className="font-extrabold text-sm text-indigo-700 px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200">
                    {inv.room}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {inv.month || 'Tháng 09/2026'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    inv.status === 'PAID'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {inv.status === 'PAID' ? '✓ Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 font-medium">
                  <span>Tiền phòng: <strong className="text-slate-800">{(inv.roomFee || inv.rent || 0).toLocaleString('vi-VN')} đ</strong></span>
                  <span>Điện & Nước: <strong className="text-slate-800">{((inv.electricFee || 0) + (inv.waterFee || 0)).toLocaleString('vi-VN')} đ</strong></span>
                  {inv.serviceFee > 0 && <span>Dịch vụ: <strong className="text-slate-800">{inv.serviceFee.toLocaleString('vi-VN')} đ</strong></span>}
                </div>
              </div>

              <div className="flex sm:flex-col items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Tổng thanh toán</div>
                  <div className="text-lg font-black text-slate-900">
                    {(inv.total || 0).toLocaleString('vi-VN')} đ
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Chi tiết
                  </button>

                  {inv.status !== 'PAID' && (
                    <button
                      onClick={() => setPaymentModalInvoice(inv)}
                      className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all btn-press cursor-pointer flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Thanh toán ngay</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} maxWidth="max-w-md">
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Chi Tiết Hóa Đơn {selectedInvoice.id}</h3>
                <p className="text-[11px] text-slate-500 font-medium">Phòng {selectedInvoice.room} • {selectedInvoice.month || 'Tháng 09/2026'}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                selectedInvoice.status === 'PAID'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {selectedInvoice.status === 'PAID' ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}
              </span>
            </div>

            <div className="space-y-2 font-medium">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">Tiền thuê phòng:</span>
                <span className="font-bold text-slate-900">{(selectedInvoice.roomFee || selectedInvoice.rent || 0).toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">Tiền điện ({selectedInvoice.electricUsage || 0} kWh):</span>
                <span className="font-bold text-slate-900">{(selectedInvoice.electricFee || 0).toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">Tiền nước ({selectedInvoice.waterUsage || 0} m³):</span>
                <span className="font-bold text-slate-900">{(selectedInvoice.waterFee || 0).toLocaleString('vi-VN')} đ</span>
              </div>
              {selectedInvoice.serviceFee > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Phí dịch vụ & Vệ sinh:</span>
                  <span className="font-bold text-slate-900">{(selectedInvoice.serviceFee || 0).toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              {selectedInvoice.maintenanceFee > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">Phí sửa chữa hư hỏng:</span>
                  <span className="font-bold text-slate-900">{(selectedInvoice.maintenanceFee || 0).toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-slate-200 text-sm font-black text-slate-900">
                <span>Tổng cộng:</span>
                <span className="text-indigo-600">{(selectedInvoice.total || 0).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Đóng
              </button>
              {selectedInvoice.status !== 'PAID' && (
                <button
                  type="button"
                  onClick={() => {
                    const inv = selectedInvoice;
                    setSelectedInvoice(null);
                    setPaymentModalInvoice(inv);
                  }}
                  className="px-4 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Thanh Toán Ngay</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Gateway Modal (MoMo, VNPay, VietQR) */}
      {paymentModalInvoice && (
        <PaymentModal
          isOpen={!!paymentModalInvoice}
          onClose={() => setPaymentModalInvoice(null)}
          invoice={paymentModalInvoice}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
