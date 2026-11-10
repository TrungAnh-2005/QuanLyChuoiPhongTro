import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Receipt,
  CreditCard,
  Search,
  Printer,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import PaymentModal from '../../components/payment/PaymentModal';
import Modal from '../../components/common/Modal';

export default function UserInvoicesPage() {
  const { user, tenantRooms } = useAuth();
  const { invoices = [], payInvoice, payDepositInvoice, contracts = [], tenants = [] } = useData();

  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'DEPOSIT' ? 'DEPOSIT' : 'ALL';
  const [invoiceType, setInvoiceType] = useState(initialType); // 'ALL' | 'MONTHLY' | 'DEPOSIT'
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

  // Hợp đồng liên quan để sinh Hóa đơn tiền cọc
  const myContracts = useMemo(() => {
    if (isTenantNew) return [];
    return (contracts || []).filter((c) => {
      const matchRoom = myRentedRooms.some(r => String(r).replace(/^P\.?/i, '') === String(c.roomNumber).replace(/^P\.?/i, ''));
      const matchTenant = (user?.fullName && c.tenantName && c.tenantName.toLowerCase().includes(user.fullName.toLowerCase())) ||
                          (user?.username && c.tenantUsername === user.username) ||
                          (user?.phone && c.tenantPhone && c.tenantPhone.replace(/\D/g, '') === user.phone.replace(/\D/g, ''));
      return matchRoom || matchTenant;
    });
  }, [contracts, myRentedRooms, user, isTenantNew]);

  // Danh sách Hóa đơn tổng hợp (Hàng tháng + Hóa đơn tiền cọc)
  const combinedInvoices = useMemo(() => {
    const list = (invoices || [])
      .filter((inv) => {
        const matchesRoom =
          myRentedRooms.includes(inv.room) ||
          (user?.fullName && inv.tenant && inv.tenant.toLowerCase().includes(user.fullName.toLowerCase())) ||
          (user?.phone && inv.phone && inv.phone.replace(/\D/g, '') === user.phone.replace(/\D/g, ''));
        return matchesRoom;
      })
      .map((inv) => ({
        ...inv,
        invoiceType: 'MONTHLY'
      }));

    // Bổ sung Hóa đơn tiền cọc từ contracts
    myContracts.forEach((c) => {
      const depCode = c.depositInvoiceCode || `HD-COC-${String(c.roomNumber || 'P101').replace(/^P\.?/i, '')}`;
      const isPaid = !!c.depositPaid;
      list.push({
        id: `deposit-${c.id || c.contractCode}`,
        code: depCode,
        room: c.roomNumber || 'P.101',
        house: c.houseName || 'Cơ sở hiện tại',
        tenant: c.tenantName || user?.fullName || 'Khách thuê',
        month: 'Ký quỹ Hợp đồng',
        roomFee: 0,
        electricFee: 0,
        waterFee: 0,
        serviceFee: 0,
        depositAmount: c.depositAmount || c.deposit || 3500000,
        total: c.depositAmount || c.deposit || 3500000,
        status: isPaid ? 'PAID' : 'UNPAID',
        paidAt: c.depositPaidAt || (isPaid ? 'Đã thu khi ký HĐ' : null),
        paidMethod: c.depositPaymentMethod || 'VIETQR',
        invoiceType: 'DEPOSIT',
        contractCode: c.contractCode,
        contractId: c.id
      });
    });

    return list;
  }, [invoices, myRentedRooms, user, myContracts]);

  const displayedInvoices = useMemo(() => {
    return combinedInvoices.filter((inv) => {
      // Lọc theo loại hóa đơn
      if (invoiceType === 'MONTHLY' && inv.invoiceType !== 'MONTHLY') return false;
      if (invoiceType === 'DEPOSIT' && inv.invoiceType !== 'DEPOSIT') return false;

      // Lọc theo trạng thái
      if (filterStatus === 'UNPAID') {
        if (inv.status !== 'UNPAID' && inv.status !== 'OVERDUE') return false;
      } else if (filterStatus === 'PAID') {
        if (inv.status !== 'PAID') return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          (inv.id && String(inv.id).toLowerCase().includes(q)) ||
          (inv.code && String(inv.code).toLowerCase().includes(q)) ||
          (inv.room && inv.room.toLowerCase().includes(q)) ||
          (inv.month && inv.month.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [combinedInvoices, invoiceType, filterStatus, searchTerm]);

  const unpaidTotal = useMemo(() => {
    return combinedInvoices
      .filter((inv) => inv.status === 'UNPAID' || inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
  }, [combinedInvoices]);

  const handlePaymentSuccess = (inv, method) => {
    const invId = inv?.id || inv?.code || inv;
    const methodLabel = method === 'VNPAY' ? 'VNPay Sandbox' : method === 'MOMO' ? 'MoMo Sandbox' : 'SePay VietQR';
    
    if (inv?.invoiceType === 'DEPOSIT') {
      payDepositInvoice(inv.contractId || inv.contractCode || invId, methodLabel);
    } else {
      payInvoice(invId, methodLabel);
    }
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
            Tra cứu tiền phòng, chỉ số điện nước hàng tháng và biên lai nộp cọc giữ chỗ minh bạch.
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

      {/* Tabs Phân Loại Hóa Đơn */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setInvoiceType('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            invoiceType === 'ALL'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Tất Cả Hóa Đơn ({combinedInvoices.length})</span>
        </button>
        <button
          onClick={() => setInvoiceType('MONTHLY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            invoiceType === 'MONTHLY'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Cước Hàng Tháng ({combinedInvoices.filter(i => i.invoiceType === 'MONTHLY').length})</span>
        </button>
        <button
          onClick={() => setInvoiceType('DEPOSIT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            invoiceType === 'DEPOSIT'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Phiếu Thu Cọc Giữ Chỗ ({combinedInvoices.filter(i => i.invoiceType === 'DEPOSIT').length})</span>
        </button>
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
              {st === 'ALL' ? 'Tất Cả Trạng Thái' : st === 'UNPAID' ? 'Chưa Thanh Toán' : 'Đã Thanh Toán'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã, số phòng..."
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
            <h3 className="text-base font-bold text-slate-800">Không có chứng từ nào</h3>
            <p className="text-xs text-slate-500">Bạn chưa có hóa đơn hoặc phiếu thu nào khớp với bộ lọc đã chọn.</p>
          </div>
        ) : (
          displayedInvoices.map((inv) => (
            <div
              key={inv.id}
              className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-interactive ${
                inv.invoiceType === 'DEPOSIT' ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200/80'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                    inv.invoiceType === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {inv.code || inv.id}
                  </span>
                  <span className="font-extrabold text-sm text-indigo-700 px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200">
                    {inv.room}
                  </span>
                  {inv.invoiceType === 'DEPOSIT' ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tiền Cọc Ký Quỹ HĐ</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-600">
                      {inv.month || 'Tháng 09/2026'}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    inv.status === 'PAID'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {inv.status === 'PAID' ? '✓ Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 font-medium">
                  {inv.invoiceType === 'DEPOSIT' ? (
                    <>
                      <span>Mục đích: <strong className="text-slate-800">Bảo lãnh HĐ thuê phòng (Hoàn trả khi thanh lý)</strong></span>
                      {inv.contractCode && <span>Hợp đồng: <strong className="text-slate-800">{inv.contractCode}</strong></span>}
                      {inv.paidAt && <span>Thời điểm nộp: <strong className="text-emerald-700">{inv.paidAt}</strong></span>}
                    </>
                  ) : (
                    <>
                      <span>Tiền phòng: <strong className="text-slate-800">{(inv.roomFee || inv.rent || 0).toLocaleString('vi-VN')} đ</strong></span>
                      <span>Điện & Nước: <strong className="text-slate-800">{((inv.electricFee || 0) + (inv.waterFee || 0)).toLocaleString('vi-VN')} đ</strong></span>
                      {inv.serviceFee > 0 && <span>Dịch vụ: <strong className="text-slate-800">{inv.serviceFee.toLocaleString('vi-VN')} đ</strong></span>}
                    </>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">
                    {inv.invoiceType === 'DEPOSIT' ? 'Số tiền cọc' : 'Tổng thanh toán'}
                  </div>
                  <div className={`text-lg font-black ${inv.invoiceType === 'DEPOSIT' ? 'text-emerald-700' : 'text-slate-900'}`}>
                    {(inv.total || 0).toLocaleString('vi-VN')} đ
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {inv.invoiceType === 'DEPOSIT' ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> : null}
                    <span>{inv.invoiceType === 'DEPOSIT' ? 'Xem Biên Lai Cọc' : 'Chi tiết'}</span>
                  </button>

                  {inv.status !== 'PAID' && (
                    <button
                      onClick={() => setPaymentModalInvoice(inv)}
                      className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all btn-press cursor-pointer flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{inv.invoiceType === 'DEPOSIT' ? 'Nộp Cọc Ngay' : 'Thanh toán ngay'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invoice / Deposit Receipt Detail Modal */}
      {selectedInvoice && (
        <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} maxWidth="max-w-md">
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  {selectedInvoice.invoiceType === 'DEPOSIT' ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Phiếu Xác Nhận Thu Tiền Cọc</span>
                    </>
                  ) : (
                    <span>Chi Tiết Hóa Đơn {selectedInvoice.code || selectedInvoice.id}</span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Phòng {selectedInvoice.room} • {selectedInvoice.month || 'Hợp đồng thuê'}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                selectedInvoice.status === 'PAID'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {selectedInvoice.status === 'PAID' ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}
              </span>
            </div>

            {selectedInvoice.invoiceType === 'DEPOSIT' ? (
              <div className="space-y-2.5 font-medium">
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-slate-700 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã phiếu thu cọc:</span>
                    <strong className="font-mono text-emerald-800">{selectedInvoice.code || selectedInvoice.id}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khách thuê nộp:</span>
                    <strong className="text-slate-900">{selectedInvoice.tenant}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phòng thuê:</span>
                    <strong className="text-slate-900">{selectedInvoice.room} ({selectedInvoice.house})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Loại quỹ:</span>
                    <span className="text-emerald-700 font-bold">Ký quỹ hoàn lại khi trả phòng</span>
                  </div>
                  {selectedInvoice.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Thời điểm thanh toán:</span>
                      <strong className="text-slate-900">{selectedInvoice.paidAt}</strong>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] space-y-1">
                  <div className="font-bold text-slate-800">Quy định hoàn trả tiền cọc:</div>
                  <div>• Hoàn trả 100% khi hết hạn hợp đồng hoặc báo trước đúng hạn theo HĐ.</div>
                  <div>• Được bảo đảm đối soát minh bạch trên Cổng Nghiệm Thu Trả Phòng (UC-T06 & UC-S07).</div>
                </div>

                <div className="flex justify-between py-2 border-t-2 border-slate-200 text-sm font-black text-slate-900">
                  <span>SỐ TIỀN CỌC:</span>
                  <span className="text-emerald-700">{(selectedInvoice.total || 0).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            ) : (
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
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer flex items-center gap-1.5 border border-slate-200"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Phiếu Thu</span>
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
