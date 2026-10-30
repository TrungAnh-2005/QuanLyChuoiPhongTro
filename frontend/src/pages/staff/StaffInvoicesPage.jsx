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
  ShieldCheck,
  QrCode,
  Send,
  Sparkles,
  Crown,
  FileText,
  Check
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Modal from '../../components/common/Modal';
import BuySaasPackageModal from '../../components/staff/BuySaasPackageModal';
import TrialExpiryBanner from '../../components/common/TrialExpiryBanner';

const isZeroSandbox = typeof window !== 'undefined' && localStorage.getItem('rental_is_zero_sandbox') === 'true';

export default function StaffInvoicesPage({ forcedTab }) {
  const { user } = useAuth();
  const {
    invoices = [],
    payInvoice,
    saasInvoices = [],
    paySaasInvoice,
    resetSaasInvoiceStatus,
    updateLandlordPackage,
    landlords = []
  } = useData();

  const [invoiceTab, setInvoiceTab] = useState(forcedTab || 'TENANT_INVOICES');

  useEffect(() => {
    if (forcedTab) setInvoiceTab(forcedTab);
  }, [forcedTab]);

  const [selectedSaasInvoice, setSelectedSaasInvoice] = useState(null);
  const [payingSaasInvoice, setPayingSaasInvoice] = useState(null);
  const [saasPaySimulated, setSaasPaySimulated] = useState(false);
  const [showBuyPackageModal, setShowBuyPackageModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('ALL');
  const [batchSending, setBatchSending] = useState(false);
  const [batchSentToast, setBatchSentToast] = useState(null);

  const currentLandlord = useMemo(() => {
    if (!user) return null;
    return (
      (landlords || []).find(
        (l) =>
          l.username === user.username ||
          (l.phone && user.phone && l.phone.replace(/\D/g, '') === user.phone.replace(/\D/g, '')) ||
          (l.email && user.email && l.email.toLowerCase() === user.email.toLowerCase())
      ) ||
      (user?.username === 'staff2'
        ? (landlords || []).find((l) => l.id === 2 || l.username === 'staff2')
        : landlords && landlords.length > 0
        ? landlords[0]
        : null)
    );
  }, [user, landlords]);

  const landlordPackageCode = currentLandlord?.packageCode || (isZeroSandbox ? 'NONE' : user?.username === 'staff2' ? 'BASIC' : 'PRO');
  const isTrialOrNone = landlordPackageCode === 'NONE' || currentLandlord?.status === 'TRIAL';

  // Lọc cơ sở mà Staff quản lý
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
  }, [user]);

  const staffHouseCodes = useMemo(() => staffManageableHouses.map((h) => h.code), [staffManageableHouses]);

  const displayedSaasInvoices = useMemo(() => {
    if (!user) return [];
    return (saasInvoices || []).filter((inv) => {
      if (inv.landlordUsername && user?.username) return inv.landlordUsername === user.username;
      if (inv.landlordId && currentLandlord?.id) return inv.landlordId === currentLandlord.id;
      if (inv.landlordPhone && user?.phone) return inv.landlordPhone.replace(/\D/g, '') === user.phone.replace(/\D/g, '');
      if (user?.username === 'staff' && (inv.code === 'HD-SAAS-2026-01' || inv.landlordId === 1)) return true;
      if (user?.username === 'staff2' && (inv.code === 'HD-SAAS-2026-02' || inv.landlordId === 2)) return true;
      return false;
    });
  }, [saasInvoices, currentLandlord, user]);

  const handleConfirmPurchase = (planData) => {
    setShowBuyPackageModal(false);
    const targetLandlordId = currentLandlord?.id || (user?.username === 'staff2' ? 2 : 1);
    if (updateLandlordPackage) {
      updateLandlordPackage(targetLandlordId, planData.packageCode);
    }
    setBatchSentToast({
      success: true,
      message: `Đã cập nhật yêu cầu mua gói ${planData.packageName}. Hóa đơn mới đã được phát hành!`
    });
    setTimeout(() => setBatchSentToast(null), 4000);
  };

  const handlePaySaasConfirm = (saasInv) => {
    setSaasPaySimulated(true);
    setTimeout(() => {
      paySaasInvoice(saasInv.id, 'Chuyển khoản VietQR', saasInv.packageCode || 'ENTERPRISE', saasInv.landlordId || 1);
      if (updateLandlordPackage) {
        updateLandlordPackage(saasInv.landlordId || (user?.username === 'staff2' ? 2 : 1), saasInv.packageCode || 'ENTERPRISE');
      }
      setSaasPaySimulated(false);
      setPayingSaasInvoice(null);
      setBatchSentToast({
        success: true,
        message: `Thanh toán hóa đơn gói SaaS ${saasInv.code} thành công! Bản quyền đã được gia hạn tự động.`
      });
      setTimeout(() => setBatchSentToast(null), 5000);
    }, 1200);
  };

  const handleBatchPublish = () => {
    setBatchSending(true);
    setTimeout(() => {
      setBatchSending(false);
      setBatchSentToast({
        success: true,
        message: 'Đã gửi thông báo hóa đơn qua SMS & Zalo thành công đến tất cả khách thuê!'
      });
      setTimeout(() => setBatchSentToast(null), 4000);
    }, 1200);
  };

  const handleManualConfirmPay = (invoiceId) => {
    payInvoice(invoiceId, 'CASH');
    setBatchSentToast({
      success: true,
      message: 'Đã xác nhận thu tiền mặt và gạch nợ hóa đơn thành công!'
    });
    setTimeout(() => setBatchSentToast(null), 3000);
  };

  // Lọc hóa đơn phòng của khách
  const displayedTenantInvoices = useMemo(() => {
    return (invoices || []).filter((inv) => {
      if (staffHouseCodes.length > 0) {
        const matchesHouse =
          (inv.houseCode && staffHouseCodes.includes(inv.houseCode)) ||
          (inv.house && staffHouseCodes.some((code) => inv.house.includes(code))) ||
          staffHouseCodes.includes('CS-01');
        if (!matchesHouse) return false;
      }
      if (selectedFacility !== 'ALL') {
        const matchesSelected =
          inv.houseCode === selectedFacility ||
          (inv.house && inv.house.includes(selectedFacility));
        if (!matchesSelected) return false;
      }
      return true;
    });
  }, [invoices, staffHouseCodes, selectedFacility]);

  const filteredTenantInvoices = useMemo(() => {
    return displayedTenantInvoices.filter((inv) => {
      if (filter === 'UNPAID' && inv.status !== 'UNPAID' && inv.status !== 'OVERDUE') return false;
      if (filter === 'PAID' && inv.status !== 'PAID') return false;
      if (filter === 'UNSENT' && inv.status !== 'PENDING_METER') return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          (inv.room && inv.room.toLowerCase().includes(q)) ||
          (inv.tenant && inv.tenant.toLowerCase().includes(q)) ||
          (inv.id && inv.id.toLowerCase().includes(q)) ||
          (inv.code && inv.code.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [displayedTenantInvoices, filter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Banner Hạn Dùng Thử */}
      <TrialExpiryBanner
        currentLandlord={currentLandlord}
        onUpgradeClick={() => setShowBuyPackageModal(true)}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-purple-600" />
            {invoiceTab === 'SAAS_INVOICES'
              ? 'Hóa Đơn Cước Gói SaaS Nộp Cho Admin'
              : 'Hóa Đơn Thu Tiền Từ Khách Thuê'}
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {invoiceTab === 'SAAS_INVOICES'
              ? 'Danh sách phí bản quyền phần mềm SaaS chuỗi trọ nộp cho Quản Trị Viên nền tảng qua VietQR / VNPay.'
              : 'Quản lý thu tiền phòng, điện nước khách thuê, gạch nợ tự động và phát hành hóa đơn hàng loạt.'}
          </p>
        </div>

        {/* Action Button */}
        {invoiceTab === 'TENANT_INVOICES' && (
          <button
            onClick={handleBatchPublish}
            disabled={batchSending}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-600/20 transition-all btn-press shrink-0 cursor-pointer disabled:opacity-50"
          >
            {batchSending ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{batchSending ? 'Đang gửi SMS & Zalo...' : 'Phát Hành & Gửi Tất Cả Hóa Đơn'}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setInvoiceTab('TENANT_INVOICES')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            invoiceTab === 'TENANT_INVOICES'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Thu Tiền Phòng Khách Thuê
        </button>
        <button
          onClick={() => setInvoiceTab('SAAS_INVOICES')}
          className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            invoiceTab === 'SAAS_INVOICES'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          <span>Cước Bản Quyền SaaS (Đóng Cho Admin)</span>
        </button>
      </div>

      {/* Batch Sent Toast */}
      {batchSentToast && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{batchSentToast.message}</span>
          </div>
          <button onClick={() => setBatchSentToast(null)} className="text-emerald-500 hover:text-emerald-700 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 2: SAAS INVOICES */}
      {invoiceTab === 'SAAS_INVOICES' ? (
        <div className="space-y-6">
          {/* Card Thông tin gói dịch vụ */}
          <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-700/30">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold border border-white/10">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bản Quyền Nền Tảng Quản Lý Chuỗi Trọ • B2B SaaS Subscription</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-3">
                  <span>
                    {landlordPackageCode === 'ENTERPRISE'
                      ? 'Gói Doanh Nghiệp (ENTERPRISE)'
                      : landlordPackageCode === 'PRO'
                      ? 'Gói Chuyên Nghiệp (PRO)'
                      : landlordPackageCode === 'BASIC'
                      ? 'Gói Cơ Bản (BASIC)'
                      : 'Gói Dùng Thử 0đ (TRIAL)'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    currentLandlord?.status === 'ACTIVE' && landlordPackageCode !== 'NONE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {currentLandlord?.status === 'ACTIVE' && landlordPackageCode !== 'NONE'
                      ? 'Đang hoạt động (ACTIVE)'
                      : 'Dùng Thử / Chưa Kích Hoạt (TRIAL)'}
                  </span>
                </h2>
                <p className="text-purple-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  {landlordPackageCode === 'ENTERPRISE'
                    ? 'Quyền lợi tài khoản: Quản lý không giới hạn cơ sở, Quota Không giới hạn phòng, AI Vision OCR nhận diện đồng hồ điện nước, Quét KYC CCCD, Cổng VietQR tự động gạch nợ 24/7 và ký Hợp đồng điện tử.'
                    : landlordPackageCode === 'PRO'
                    ? 'Quyền lợi tài khoản: Quản lý không giới hạn cơ sở, Quota 100 phòng trọ, Cổng VietQR tự động gạch nợ 24/7, Xuất hóa đơn VAT và ký E-Sign.'
                    : landlordPackageCode === 'BASIC'
                    ? 'Quyền lợi tài khoản: Quản lý tối đa 2 cơ sở, Quota 30 phòng trọ, tính tiền phòng & chốt điện nước tự động, tạo mã QR VietQR.'
                    : 'Tài khoản đang ở chế độ dùng thử 0đ (Tối đa 1 cơ sở, 10 phòng). Hãy mua gói bản quyền để mở khóa các tính năng cao cấp.'}
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-purple-200/90 pt-1 font-mono">
                  <div>Hạn bản quyền: <strong className="text-white">31/12/2026</strong></div>
                  <div>Đơn vị cung cấp: <strong className="text-white">CTCP SaaS Trọ Việt (Website Admin)</strong></div>
                  <div>Tài khoản nhận cước: <strong className="text-amber-300">9999888899 - MBBank</strong></div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowBuyPackageModal(true)}
                  className="btn-press btn-shimmer px-4 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>{isTrialOrNone ? '⚡ Mua Gói Bản Quyền SaaS' : '✨ Nâng Cấp / Đổi Gói'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bảng danh sách hóa đơn SaaS đóng cho Web */}
          <div className="bento-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">Lịch Sử Hóa Đơn Phí Nền Tảng (B2B SaaS)</h3>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full font-bold text-xs border border-purple-200">
                {displayedSaasInvoices.length} kỳ hóa đơn
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-500 uppercase font-black tracking-wider text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5">Mã Hóa Đơn SaaS</th>
                    <th className="py-3.5 px-4">Gói Bản Quyền</th>
                    <th className="py-3.5 px-4">Kỳ Áp Dụng</th>
                    <th className="py-3.5 px-4">Số Tiền (VNĐ)</th>
                    <th className="py-3.5 px-4">Trạng Thái</th>
                    <th className="py-3.5 px-5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {displayedSaasInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        Chưa có hóa đơn cước SaaS nào
                      </td>
                    </tr>
                  ) : (
                    displayedSaasInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-mono font-bold text-purple-700 text-sm">{inv.code}</div>
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-900">{inv.packageName}</td>
                        <td className="py-4 px-4">{inv.period}</td>
                        <td className="py-4 px-4 font-black text-slate-900">
                          {inv.amount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-4 px-4">
                          {inv.status === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Đã Thanh Toán</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Chờ Thanh Toán</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right space-x-1.5">
                          {inv.status !== 'PAID' ? (
                            <button
                              onClick={() => setPayingSaasInvoice(inv)}
                              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                            >
                              Nộp Cước VietQR
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedSaasInvoice(inv)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                            >
                              Xem Hóa Đơn VAT
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 1: TENANT INVOICES */
        <div className="space-y-6">
          {/* Facility Switcher */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 text-xs font-bold">
            {[
              { code: 'ALL', label: '🏢 Toàn Chuỗi (Tất Cả)' },
              ...staffManageableHouses.map((h) => ({ code: h.code, label: `🏠 ${h.name}` }))
            ].map((fac) => (
              <button
                key={fac.code}
                onClick={() => setSelectedFacility(fac.code)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedFacility === fac.code
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-white/60'
                }`}
              >
                <span>{fac.label}</span>
              </button>
            ))}
          </div>

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
                  {displayedTenantInvoices
                    .reduce((sum, inv) => sum + (inv.total || 0), 0)
                    .toLocaleString('vi-VN')} đ
                </div>
                <span className="text-xs font-bold text-purple-600">
                  {displayedTenantInvoices.length} phòng
                </span>
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
                  {displayedTenantInvoices
                    .filter((inv) => inv.status === 'PAID')
                    .reduce((sum, inv) => sum + (inv.total || 0), 0)
                    .toLocaleString('vi-VN')} đ
                </div>
                <span className="text-xs font-bold text-emerald-600">
                  {displayedTenantInvoices.filter((inv) => inv.status === 'PAID').length} đã nộp
                </span>
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
                  {displayedTenantInvoices
                    .filter((inv) => inv.status !== 'PAID')
                    .reduce((sum, inv) => sum + (inv.total || 0), 0)
                    .toLocaleString('vi-VN')} đ
                </div>
                <span className="text-xs font-bold text-amber-600">
                  {displayedTenantInvoices.filter((inv) => inv.status !== 'PAID').length} chưa nộp
                </span>
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
                  {filteredTenantInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Chưa có hóa đơn phù hợp với bộ lọc
                      </td>
                    </tr>
                  ) : (
                    filteredTenantInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900 text-sm">{inv.room}</div>
                          <div className="text-slate-500 text-[11px]">{inv.tenant}</div>
                          <div className="text-slate-400 font-mono text-[10px]">{inv.code || inv.id}</div>
                        </td>

                        <td className="py-4 px-4 font-semibold text-slate-800">
                          {(inv.roomFee || inv.rent || 0).toLocaleString('vi-VN')} đ
                        </td>

                        <td className="py-4 px-4 font-semibold text-slate-800">
                          {inv.status === 'PENDING_METER' ? (
                            <span className="text-amber-600 font-bold">Chờ chốt số</span>
                          ) : (
                            `${((inv.electricFee || inv.elec || 0) + (inv.waterFee || inv.water || 0)).toLocaleString('vi-VN')} đ`
                          )}
                        </td>

                        <td className="py-4 px-4 text-slate-600">
                          {(inv.serviceFee || inv.service || 0).toLocaleString('vi-VN')} đ
                        </td>

                        <td className="py-4 px-4 font-black text-slate-900 text-sm">
                          {(inv.total || 0).toLocaleString('vi-VN')} đ
                        </td>

                        <td className="py-4 px-4">
                          {inv.status === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Đã Thu Tiền</span>
                            </span>
                          ) : inv.status === 'PENDING_METER' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Chờ Chốt Điện Nước</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Chưa Đóng</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-right space-x-1.5">
                          {inv.status !== 'PAID' && inv.status !== 'PENDING_METER' && (
                            <button
                              type="button"
                              onClick={() => handleManualConfirmPay(inv.id)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
                              title="Thu tiền mặt trực tiếp từ khách thuê"
                            >
                              Thu tiền mặt
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition inline-flex items-center gap-1 border border-slate-200 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-purple-600" />
                            <span>In Phiếu Thu</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedInvoice && (
        <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} maxWidth="max-w-md">
          <div className="p-4 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">Phiếu Thu Tiền Phòng Trọ</h3>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã hóa đơn:</span>
                <span className="font-mono font-bold text-purple-700">{selectedInvoice.code || selectedInvoice.id}</span>
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
                  <span>{(selectedInvoice.roomFee || selectedInvoice.rent || 0).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Điện & Nước:</span>
                  <span>{((selectedInvoice.electricFee || selectedInvoice.elec || 0) + (selectedInvoice.waterFee || selectedInvoice.water || 0)).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí dịch vụ:</span>
                  <span>{(selectedInvoice.serviceFee || selectedInvoice.service || 0).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
              <div className="flex justify-between py-2 border-t border-b border-slate-200 font-bold text-sm text-slate-900">
                <span>TỔNG TIỀN:</span>
                <span className="text-purple-700">{(selectedInvoice.total || 0).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              In Phiếu Thu Nhanh
            </button>
          </div>
        </Modal>
      )}

      {/* Buy SaaS Package Modal */}
      <BuySaasPackageModal
        isOpen={showBuyPackageModal}
        onClose={() => setShowBuyPackageModal(false)}
        currentLandlord={currentLandlord}
        onConfirmPurchase={handleConfirmPurchase}
      />

      {/* Pay SaaS Invoice Modal */}
      {payingSaasInvoice && (
        <Modal isOpen={!!payingSaasInvoice} onClose={() => setPayingSaasInvoice(null)} maxWidth="max-w-md">
          <div className="p-4 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Thanh Toán Phí Gói SaaS</h3>
              </div>
              <button onClick={() => setPayingSaasInvoice(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
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
            </div>

            <button
              onClick={() => handlePaySaasConfirm(payingSaasInvoice)}
              disabled={saasPaySimulated}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saasPaySimulated ? <Clock className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
              <span>{saasPaySimulated ? 'Đang xác thực giao dịch...' : 'Giả Lập Chuyển Khoản Thành Công'}</span>
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Xem Hóa Đơn VAT SaaS */}
      {selectedSaasInvoice && (
        <Modal isOpen={!!selectedSaasInvoice} onClose={() => setSelectedSaasInvoice(null)} maxWidth="max-w-md">
          <div className="p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Hóa Đơn Điện Tử VAT ({selectedSaasInvoice.code})</h3>
              <button onClick={() => setSelectedSaasInvoice(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div>Đơn vị cung cấp: <strong>CTCP SaaS Trọ Việt</strong></div>
              <div>Bên mua: <strong>{selectedSaasInvoice.landlordName}</strong></div>
              <div>Gói: <strong>{selectedSaasInvoice.packageName}</strong></div>
              <div>Số tiền: <strong className="text-indigo-700">{selectedSaasInvoice.amount.toLocaleString('vi-VN')} đ</strong></div>
              <div>Ngày thanh toán: <strong>{selectedSaasInvoice.paidAt}</strong></div>
            </div>
            <button
              onClick={() => {
                setBatchSentToast({ success: true, message: 'Đã tải xuống file PDF Hóa Đơn Điện Tử VAT!' });
                setTimeout(() => setBatchSentToast(null), 3000);
              }}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition"
            >
              Tải Hóa Đơn PDF
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
