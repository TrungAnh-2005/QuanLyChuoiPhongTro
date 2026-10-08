import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  CheckCircle,
  Clock,
  AlertTriangle,
  Printer,
  CreditCard,
  Search,
  DollarSign,
  Download,
  X,
  Building2,
  CheckCheck,
  ShieldCheck,
  QrCode,
  Send,
  Sparkles,
  Award,
  Crown,
  FileText,
  ExternalLink,
  Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import PaymentModal from '../components/payment/PaymentModal';
import Modal from '../components/common/Modal';

export default function InvoicesPage({ forcedTab }) {
  const { user, tenantRooms } = useAuth();
  const { invoices, payInvoice, tenants, saasInvoices = [], paySaasInvoice, resetSaasInvoiceStatus } = useData();
  const role = user?.role || 'ADMIN';
  const isTenant = role === 'TENANT';

  // State tách 2 loại hóa đơn cho Chủ trọ
  const [invoiceTab, setInvoiceTab] = useState(forcedTab || 'TENANT_INVOICES');

  React.useEffect(() => {
    if (forcedTab) setInvoiceTab(forcedTab);
  }, [forcedTab]); // 'TENANT_INVOICES' | 'SAAS_INVOICES'
  const [selectedSaasInvoice, setSelectedSaasInvoice] = useState(null);
  const [payingSaasInvoice, setPayingSaasInvoice] = useState(null);
  const [saasPaySimulated, setSaasPaySimulated] = useState(false);

  // Lấy hồ sơ khách thuê hiện tại từ danh bạ tenants
  const currentTenant = (tenants || []).find((t) => {
    if (!user) return false;
    const userName = (user.fullName || '').toLowerCase();
    const tName = (t?.fullName || '').toLowerCase();
    return (
      (userName && tName && (userName.includes(tName) || tName.includes(userName))) ||
      (user?.phone && t?.phone && user.phone.replace(/\D/g, '') === t.phone.replace(/\D/g, ''))
    );
  });

  // Tập hợp TẤT CẢ các phòng khách đang thuê
  const myRentedRooms = React.useMemo(() => {
    if (!isTenant || user?.username === 'tenant_new' || user?.fullName?.includes('Nam')) return [];
    const roomsSet = new Set();
    if (currentTenant?.rooms && Array.isArray(currentTenant.rooms)) {
      currentTenant.rooms.forEach((r) => r && roomsSet.add(r));
    } else if (currentTenant?.room) {
      roomsSet.add(currentTenant.room);
    }
    if (user?.rooms && Array.isArray(user.rooms)) {
      user.rooms.forEach((r) => r && roomsSet.add(r));
    } else if (user?.room) {
      roomsSet.add(user.room);
    }
    const stored = tenantRooms?.[user?.username] || tenantRooms?.[user?.fullName];
    if (Array.isArray(stored)) {
      stored.forEach((r) => r && roomsSet.add(r));
    } else if (typeof stored === 'string' && stored) {
      roomsSet.add(stored);
    }
    return Array.from(roomsSet);
  }, [isTenant, currentTenant, user, tenantRooms]);

  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);

  const [selectedFacility, setSelectedFacility] = useState(() => {
    if (role === 'STAFF') {
      return user?.houseCode || 'CS-01';
    }
    return 'ALL';
  });

  const displayedInvoices = useMemo(() => {
    if (isTenant) {
      return invoices.filter(
        (inv) =>
          inv.sentToTenant &&
          (myRentedRooms.includes(inv.room) ||
            (inv.tenant && inv.tenant.toLowerCase().includes((user?.fullName || '').toLowerCase())))
      );
    }
    if (selectedFacility === 'ALL') {
      return invoices;
    }
    return invoices.filter((inv) => {
      if (inv.houseCode) return inv.houseCode === selectedFacility;
      if (inv.house) {
        if (selectedFacility === 'CS-01') return inv.house.includes('Cơ Sở 1') || inv.house.includes('Cầu Giấy') || inv.house.includes('CS-01');
        if (selectedFacility === 'CS-02') return inv.house.includes('Cơ Sở 2') || inv.house.includes('Bách Khoa') || inv.house.includes('CS-02');
        if (selectedFacility === 'CS-03') return inv.house.includes('Cơ Sở 3') || inv.house.includes('Đống Đa') || inv.house.includes('CS-03');
      }
      return true;
    });
  }, [isTenant, invoices, myRentedRooms, user, selectedFacility, role]);

  const filtered = displayedInvoices.filter((inv) => {
    let matchStatus = true;
    if (filter === 'PAID') matchStatus = inv.status === 'PAID';
    else if (filter === 'UNPAID') matchStatus = inv.status === 'UNPAID';
    else if (filter === 'OVERDUE') matchStatus = inv.status === 'OVERDUE';
    else if (filter === 'SENT') matchStatus = !!inv.sentToTenant;
    else if (filter === 'UNSENT') matchStatus = !inv.sentToTenant || inv.status === 'PENDING_METER';

    const matchSearch =
      inv.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handlePaySuccess = (inv, payMethod) => {
    const methodLabel = payMethod === 'VNPAY' ? 'Cổng VNPay' : (payMethod === 'MOMO' ? 'Ví MoMo' : (payMethod === 'SEPAY' ? 'SePay VietQR' : 'SePay VietQR'));
    if (inv?.isSaas || inv?.packageCode || String(inv?.id).startsWith('SAAS')) {
      paySaasInvoice(inv.id, methodLabel);
      setPayingInvoice(null);
      setBatchSentToast({
        success: true,
        message: `Nộp cước SaaS ${inv.code} (${Number(inv.total || inv.amount).toLocaleString('vi-VN')} đ) cho Admin qua ${methodLabel} thành công!`
      });
      setTimeout(() => setBatchSentToast(null), 5000);
    } else {
      payInvoice(inv.id, methodLabel);
      setPayingInvoice(null);
      setBatchSentToast({
        success: true,
        message: `Đã ghi nhận thanh toán thành công qua ${methodLabel} cho phòng ${inv.room}!`
      });
      setTimeout(() => setBatchSentToast(null), 5000);
    }
  };

  const handleManualConfirmPay = (id) => {
    payInvoice(id, 'Tiền mặt/Trực tiếp bởi Chủ trọ');
  };

  const [batchSending, setBatchSending] = useState(false);
  const [batchSentToast, setBatchSentToast] = useState(null);

  const handleBatchPublish = () => {
    setBatchSending(true);
    setTimeout(() => {
      setBatchSending(false);
      setBatchSentToast({
        success: true,
        message: `Đã phát hành hóa đơn hàng loạt và gửi thông báo cước qua Zalo ZNS / SMS Brandname đến ${displayedInvoices.filter((i) => i.status !== 'PAID').length} khách thuê!`
      });
      setTimeout(() => setBatchSentToast(null), 5000);
    }, 1000);
  };

  const handlePaySaasConfirm = (saasInv) => {
    setSaasPaySimulated(true);
    setTimeout(() => {
      paySaasInvoice(saasInv.id, 'VietQR Cổng Nền Tảng Web (Admin)');
      setSaasPaySimulated(false);
      setPayingSaasInvoice(null);
      setBatchSentToast({
        success: true,
        message: `Thanh toán hóa đơn gói SaaS ${saasInv.code} thành công! Bản quyền đã được gia hạn tự động.`
      });
      setTimeout(() => setBatchSentToast(null), 5000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-purple-600" />
            {isTenant
              ? (myRentedRooms.length > 0 ? `Hóa Đơn Của Tôi (Phòng ${myRentedRooms.join(', ')})` : 'Hóa Đơn Của Tôi')
              : invoiceTab === 'SAAS_INVOICES'
              ? 'Hóa Đơn Nộp Tiền Cho Web Admin (Gói Cước SaaS)'
              : 'Hóa Đơn Thu Tiền (Từ Khách Thuê)'}
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {isTenant
              ? 'Theo dõi hóa đơn tiền nhà, chỉ số dịch vụ và thanh toán trực tuyến qua mã VietQR.'
              : invoiceTab === 'SAAS_INVOICES'
              ? 'Danh sách phí bản quyền phần mềm SaaS chuỗi trọ nộp cho Quản Trị Viên nền tảng qua VietQR / VNPay.'
              : 'Quản lý thu tiền phòng, điện nước khách thuê, gạch nợ tự động và phát hành hóa đơn hàng loạt.'}
          </p>
        </div>

        {/* Action Button: Batch Publish */}
        {!isTenant && invoiceTab === 'TENANT_INVOICES' && (
          <button
            onClick={handleBatchPublish}
            disabled={batchSending}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-600/20 transition-all btn-press shrink-0 cursor-pointer disabled:opacity-50"
          >
            {batchSending ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {batchSending
                ? 'Đang gửi SMS & Zalo...'
                : 'Phát Hành & Gửi Tất Cả Hóa Đơn'}
            </span>
          </button>
        )}
      </div>

      {/* Batch Sent Toast */}
      {batchSentToast && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{batchSentToast.message}</span>
          </div>
          <button
            onClick={() => setBatchSentToast(null)}
            className="text-emerald-500 hover:text-emerald-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HÓA ĐƠN GÓI CƯỚC SAAS (ĐÓNG CHO WEB ADMIN)                         */}
      {/* ========================================================================= */}
      {!isTenant && invoiceTab === 'SAAS_INVOICES' ? (
        <div className="space-y-6">
          {/* Card Thông tin gói dịch vụ hiện tại của Chủ trọ */}
          <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-700/30">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold border border-white/10">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bản Quyền Nền Tảng Quản Lý Chuỗi Trọ • B2B SaaS Subscription</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-3">
                  <span>Gói Chuyên Nghiệp (PRO)</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Đang hoạt động (ACTIVE)
                  </span>
                </h2>
                <p className="text-purple-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  Quyền lợi tài khoản: Quản lý không giới hạn cơ sở, Quota 100 phòng trọ, AI Vision OCR nhận diện đồng hồ điện nước, Cổng VietQR tự động gạch nợ 24/7 và ký Hợp đồng điện tử.
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-purple-200/90 pt-1 font-mono">
                  <div>Hạn bản quyền: <strong className="text-white">31/12/2026</strong></div>
                  <div>Đơn vị cung cấp: <strong className="text-white">CTCP SaaS Trọ Việt (Website Admin)</strong></div>
                  <div>Tài khoản nhận cước: <strong className="text-amber-300">9999888899 - MBBank</strong></div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 text-center">
                  <div className="text-[11px] text-purple-200 uppercase font-bold tracking-wider">Cước Phí Duy Trì</div>
                  <div className="text-2xl font-black text-amber-300 mt-0.5">499.000 đ<span className="text-xs font-normal text-purple-200">/tháng</span></div>
                  <div className="text-[10px] text-purple-300 mt-1">Chu kỳ thanh toán linh hoạt</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bảng danh sách hóa đơn SaaS đóng cho Web */}
          <div className="bento-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Lịch Sử Hóa Đơn & Chứng Từ Thu Phí Nền Tảng (B2B SaaS)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Danh sách các kỳ hóa đơn bản quyền phần mềm quản lý trọ mà Chủ trọ đã thanh toán hoặc cần thanh toán cho Website Admin.
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full font-bold text-xs border border-purple-200">
                Tổng cộng: {saasInvoices.length} kỳ hóa đơn
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-500 uppercase font-black tracking-wider text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5">Mã Hóa Đơn SaaS</th>
                    <th className="py-3.5 px-4">Gói Bản Quyền & Khoản Mục</th>
                    <th className="py-3.5 px-4">Kỳ Áp Dụng</th>
                    <th className="py-3.5 px-4">Số Tiền (VNĐ)</th>
                    <th className="py-3.5 px-4">Ngày Xuất / Hạn Đóng</th>
                    <th className="py-3.5 px-4">Trạng Thái</th>
                    <th className="py-3.5 px-5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {saasInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-mono font-bold text-purple-700 text-sm">{inv.code}</div>
                        <div className="text-[11px] text-slate-400">ID: #{inv.id}</div>
                      </td>

                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-bold text-slate-900">{inv.packageName}</div>
                        <div className="text-[11px] text-slate-500">Chu kỳ: {inv.billingCycle}</div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-medium text-slate-700">{inv.period}</span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-black text-slate-900 text-sm">
                          {inv.amount.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="text-[10px] text-slate-400">Đã bao gồm thuế GTGT (VAT)</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-slate-800">Xuất: {inv.issuedDate}</div>
                        <div className="text-slate-500 text-[11px]">Hạn: {inv.dueDate}</div>
                      </td>

                      <td className="py-4 px-4">
                        {inv.status === 'PAID' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Đã Thanh Toán</span>
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {inv.paidAt}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 animate-pulse">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Chờ Thanh Toán</span>
                            </span>
                            <div className="text-[10px] text-rose-500 font-semibold">
                              Hạn chót: {inv.dueDate}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right space-x-1.5">
                        {inv.status === 'UNPAID' ? (
                          <button
                            onClick={() => {
                              setPayingInvoice({
                                ...inv,
                                id: inv.id,
                                code: inv.code,
                                total: inv.amount,
                                amount: inv.amount,
                                room: inv.packageCode || 'Gói Bản Quyền SaaS',
                                tenant: 'CTCP SaaS Trọ Việt (Web Admin)',
                                isSaas: true
                              });
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition btn-press inline-flex items-center gap-1.5 cursor-pointer"
                            title="Nộp tiền cước cho Admin qua VNPay, MoMo hoặc VietQR"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Nộp Tiền SePay / VNPay / MoMo</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedSaasInvoice(inv)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition inline-flex items-center gap-1 border border-slate-200 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-purple-600" />
                              <span>Xem Hóa Đơn VAT</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                resetSaasInvoiceStatus(inv.id);
                                setBatchSentToast({
                                  success: true,
                                  message: `Đã mở lại trạng thái Chưa Thanh Toán cho kỳ ${inv.code} để bạn test nộp cước!`
                                });
                                setTimeout(() => setBatchSentToast(null), 5000);
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] rounded-lg transition border border-amber-200 cursor-pointer"
                              title="Mở lại Chưa Thanh Toán để test nộp qua VNPay / MoMo"
                            >
                              🔄 Test lại
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* TAB 1: HÓA ĐƠN THU KHÁCH THUÊ (TIỀN PHÒNG & ĐIỆN NƯỚC)                     */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Facility Switcher Tabs for Landlord & Staff (Task 6) */}
          {!isTenant && (
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 text-xs font-bold">
              {[
                { code: 'ALL', label: '🏢 Toàn Chuỗi (Tất Cả)' },
                { code: 'CS-01', label: '🏠 Cơ Sở 1 (Cầu Giấy)' },
                { code: 'CS-02', label: '🏠 Cơ Sở 2 (Bách Khoa)' },
                { code: 'CS-03', label: '🏠 Cơ Sở 3 (Đống Đa)' }
              ].map((fac) => {
                const isSelected = selectedFacility === fac.code;
                return (
                  <button
                    key={fac.code}
                    disabled={role === 'STAFF' && fac.code !== (user?.houseCode || 'CS-01')}
                    onClick={() => setSelectedFacility(fac.code)}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                        : 'text-slate-600 hover:text-purple-700 hover:bg-white/60'
                    } ${role === 'STAFF' && fac.code !== (user?.houseCode || 'CS-01') ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span>{fac.label}</span>
                  </button>
                );
              })}
              {role === 'STAFF' && (
                <span className="text-[11px] text-purple-700 font-semibold ml-auto px-2">
                  🔒 Cố định theo cơ sở trực: {user?.houseName || user?.houseCode || 'CS-01'}
                </span>
              )}
            </div>
          )}

          {/* Top 3 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bento-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tổng Tiền Phòng Cần Thu
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div className="text-2xl font-black text-slate-900">
                  {displayedInvoices
                    .reduce((sum, inv) => sum + (inv.status !== 'PENDING_METER' ? inv.total : inv.roomFee + inv.service), 0)
                    .toLocaleString('vi-VN')}{' '}
                  đ
                </div>
                <span className="text-xs font-bold text-purple-600">
                  {displayedInvoices.length} phòng
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500 font-medium">
                Kỳ tháng 09/2026
              </div>
            </div>

            <div className="bento-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Đã Thu Thành Công
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div className="text-2xl font-black text-emerald-600">
                  {displayedInvoices
                    .filter((inv) => inv.status === 'PAID')
                    .reduce((sum, inv) => sum + inv.total, 0)
                    .toLocaleString('vi-VN')}{' '}
                  đ
                </div>
                <span className="text-xs font-bold text-emerald-600">
                  {displayedInvoices.filter((inv) => inv.status === 'PAID').length} đã nộp
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500 font-medium">
                Gạch nợ tự động VietQR & Tiền mặt
              </div>
            </div>

            <div className="bento-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Còn Nợ Chưa Đóng
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <div className="text-2xl font-black text-amber-600">
                  {displayedInvoices
                    .filter((inv) => inv.status !== 'PAID')
                    .reduce((sum, inv) => sum + (inv.status !== 'PENDING_METER' ? inv.total : inv.roomFee + inv.service), 0)
                    .toLocaleString('vi-VN')}{' '}
                  đ
                </div>
                <span className="text-xs font-bold text-amber-600">
                  {displayedInvoices.filter((inv) => inv.status !== 'PAID').length} chưa nộp
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500 font-medium">
                Hạn đóng: Ngày 05/10/2026
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="bento-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo phòng, tên khách, mã hóa đơn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                {['ALL', 'UNPAID', 'PAID', 'UNSENT'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      filter === st
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'Tất Cả'
                      : st === 'UNPAID'
                      ? 'Chưa Đóng'
                      : st === 'PAID'
                      ? 'Đã Thu'
                      : 'Chờ Chốt Số'}
                  </button>
                ))}
              </div>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-500 uppercase font-black tracking-wider text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5">Phòng & Khách Thuê</th>
                    <th className="py-3.5 px-4">Tiền Phòng</th>
                    <th className="py-3.5 px-4">Điện + Nước</th>
                    <th className="py-3.5 px-4">Phí Dịch Vụ</th>
                    <th className="py-3.5 px-4">Tổng Cộng</th>
                    <th className="py-3.5 px-4">Trạng Thái</th>
                    <th className="py-3.5 px-5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 text-sm">{inv.room}</div>
                        <div className="text-slate-500 text-[11px]">{inv.tenant}</div>
                        <div className="text-slate-400 font-mono text-[10px]">{inv.code}</div>
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-800">
                        {inv.roomFee.toLocaleString('vi-VN')} đ
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-800">
                        {inv.status === 'PENDING_METER' ? (
                          <span className="text-amber-600 font-bold">Chờ chốt số</span>
                        ) : (
                          `${(inv.elec + inv.water).toLocaleString('vi-VN')} đ`
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-600">
                        {inv.service.toLocaleString('vi-VN')} đ
                      </td>

                      <td className="py-4 px-4 font-black text-slate-900 text-sm">
                        {inv.status === 'PENDING_METER'
                          ? `${(inv.roomFee + inv.service).toLocaleString('vi-VN')} đ`
                          : `${inv.total.toLocaleString('vi-VN')} đ`}
                      </td>

                      <td className="py-4 px-4">
                        {inv.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Đã Thanh Toán</span>
                          </span>
                        ) : inv.status === 'PENDING_METER' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Chờ Chốt Điện Nước</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Chưa Thanh Toán</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right space-x-1.5">
                        {inv.status !== 'PAID' && inv.status !== 'PENDING_METER' ? (
                          isTenant ? (
                            <button
                              type="button"
                              onClick={() => setPayingInvoice(inv)}
                              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition btn-press inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Thanh Toán VNPay / MoMo</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleManualConfirmPay(inv.id)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
                              title="Thu tiền mặt trực tiếp từ khách thuê"
                            >
                              Thu tiền mặt
                            </button>
                          )
                        ) : null}

                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition inline-flex items-center gap-1 border border-slate-200"
                        >
                          <Printer className="w-3.5 h-3.5 text-purple-600" />
                          <span>In Phiếu Thu</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Online Payment Modal for Tenants */}
      <PaymentModal
        isOpen={!!payingInvoice}
        onClose={() => setPayingInvoice(null)}
        onSuccess={handlePaySuccess}
        invoice={payingInvoice || undefined}
      />

      {/* Receipt Modal for Room Invoices */}
      <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} maxWidth="max-w-md">
        {selectedInvoice && (
          <div className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900">Phiếu Thu Tiền Phòng Trọ</h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã hóa đơn:</span>
                <span className="font-mono font-bold text-purple-700">{selectedInvoice.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phòng:</span>
                <span className="font-bold text-slate-800">{selectedInvoice.room}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khách thuê:</span>
                <span className="font-bold text-slate-800">{selectedInvoice.tenant}</span>
              </div>

              <div className="border-t border-slate-100 pt-2 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Tiền thuê phòng:</span>
                  <span>{selectedInvoice.roomFee.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiền điện:</span>
                  <span>{selectedInvoice.elec.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiền nước:</span>
                  <span>{selectedInvoice.water.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí dịch vụ:</span>
                  <span>{selectedInvoice.service.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <div className="flex justify-between py-2 border-t border-b border-slate-200 font-bold text-sm text-slate-900">
                <span>TỔNG TIỀN:</span>
                <span className="text-purple-700">{selectedInvoice.total.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <button
              onClick={() => {
                window.print();
              }}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              In Phiếu Thu Nhanh
            </button>
          </div>
        )}
      </Modal>

      {/* Modal Xem Hóa Đơn VAT / Biên Lai SaaS (B2B) */}
      <Modal isOpen={!!selectedSaasInvoice} onClose={() => setSelectedSaasInvoice(null)} maxWidth="max-w-lg">
        {selectedSaasInvoice && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  VAT
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Hóa Đơn Điện Tử Gói Cước SaaS</h3>
                  <div className="text-[11px] text-slate-500 font-mono">Số: {selectedSaasInvoice.code}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSaasInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-2">
              <div className="font-bold text-indigo-950 uppercase tracking-wider text-[11px]">
                Đơn vị cung cấp nền tảng:
              </div>
              <div className="font-bold text-slate-900">{selectedSaasInvoice.providerName}</div>
              <div className="text-slate-600 font-mono">MST: {selectedSaasInvoice.providerTaxCode}</div>
              <div className="text-slate-600">STK Tiếp nhận cước: <span className="font-bold text-indigo-700">{selectedSaasInvoice.providerBank}</span></div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-2">
              <div className="font-bold text-indigo-950 uppercase tracking-wider text-[11px]">
                Đơn vị mua dịch vụ (Chủ trọ):
              </div>
              <div className="font-bold text-slate-900">{selectedSaasInvoice.landlordName} (SĐT: {selectedSaasInvoice.landlordPhone})</div>
              <div className="text-slate-600 font-mono">MST / Mã ĐKKD: {selectedSaasInvoice.landlordTaxCode}</div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Khoản mục cước</th>
                    <th className="p-2.5 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-medium">{selectedSaasInvoice.packageName}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{selectedSaasInvoice.amount.toLocaleString('vi-VN')} đ</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center justify-between text-xs font-bold">
              <span>Trạng thái: ĐÃ THANH TOÁN (GẠCH NỢ)</span>
              <span>{selectedSaasInvoice.paidAt}</span>
            </div>

            <button
              onClick={() => {
                setBatchSentToast({ success: true, message: 'Đã tải xuống file PDF Hóa Đơn Điện Tử VAT có chữ ký số điện tử của CTCP SaaS Trọ Việt!' }); setTimeout(() => setBatchSentToast(null), 4000);
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Tải Hóa Đơn Điện Tử PDF (Có Chữ Ký Số)</span>
            </button>
          </div>
        )}
      </Modal>

      {/* Modal Quét VietQR Thanh Toán Hóa Đơn Gói Cho Web Admin */}
      <Modal isOpen={!!payingSaasInvoice} onClose={() => setPayingSaasInvoice(null)} maxWidth="max-w-md">
        {payingSaasInvoice && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Thanh Toán Phí Gói SaaS Cho Nền Tảng</h3>
              </div>
              <button
                onClick={() => setPayingSaasInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-2 space-y-3">
              <div className="inline-block p-3 bg-white rounded-2xl border-2 border-indigo-600/30 shadow-lg">
                <img
                  src={`https://api.vietqr.io/image/970422-9999888899-compact2.jpg?amount=${payingSaasInvoice.amount}&addInfo=${encodeURIComponent(payingSaasInvoice.code)}&accountName=${encodeURIComponent('CTCP SAAS TRO VIET')}`}
                  alt="VietQR Admin Web"
                  className="w-48 h-48 mx-auto object-contain"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500">Số tiền cần chuyển:</div>
                <div className="text-2xl font-black text-indigo-600">
                  {payingSaasInvoice.amount.toLocaleString('vi-VN')} đ
                </div>
                <div className="text-xs font-mono text-slate-700 font-bold bg-slate-100 py-1 px-2 rounded-lg inline-block">
                  Nội dung CK: {payingSaasInvoice.code}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 text-left bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 space-y-1">
                <div>• Ngân hàng: <strong>MBBank (Ngân Hàng Quân Đội)</strong></div>
                <div>• Số tài khoản Admin: <strong>9999888899</strong></div>
                <div>• Chủ tài khoản: <strong>CTCP SAAS TRỌ VIỆT (NỀN TẢNG ADMIN)</strong></div>
                <div>• Hệ thống tự động gạch nợ sau 5-10 giây sau khi tiền vào tài khoản.</div>
              </div>
            </div>

            <button
              onClick={() => handlePaySaasConfirm(payingSaasInvoice)}
              disabled={saasPaySimulated}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saasPaySimulated ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
              <span>{saasPaySimulated ? 'Đang xác thực giao dịch chuyển khoản...' : 'Giả Lập Chuyển Khoản Thành Công (Gạch Nợ Ngay)'}</span>
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
