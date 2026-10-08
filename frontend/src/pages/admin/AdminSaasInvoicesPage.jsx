import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Check,
  FileText,
  Building2,
  Phone,
  Mail,
  X,
  Award,
  Crown,
  Download
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import Modal from '../../components/common/Modal';

export default function AdminSaasInvoicesPage() {
  const {
    landlords = [],
    saasInvoices = [],
    paySaasInvoice,
    createSaasInvoice,
    sendSaasReminder
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PAID' | 'UNPAID'
  const [selectedSaasVat, setSelectedSaasVat] = useState(null);
  const [showAddSaasModal, setShowAddSaasModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [newSaasInvoice, setNewSaasInvoice] = useState({
    landlordId: 1,
    packageName: 'Gói Chuyên Nghiệp (PRO - Không Giới Hạn Cơ Sở)',
    packageCode: 'PRO',
    billingCycle: '12 Tháng (Năm 2026)',
    period: '01/01/2026 - 31/12/2026',
    amount: 4990000,
    dueDate: '15/10/2026'
  });

  const showToast = (msg, type = 'SUCCESS') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredInvoices = (saasInvoices || []).filter((inv) => {
    const matchSearch =
      (inv.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.landlordName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.landlordPhone || '').includes(searchTerm);
    const matchStatus =
      filterStatus === 'ALL' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalCollected = saasInvoices
    .filter((s) => s.status === 'PAID')
    .reduce((sum, s) => sum + s.amount, 0);

  const totalPending = saasInvoices
    .filter((s) => s.status === 'UNPAID')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-700 text-white p-6 rounded-2xl shadow-xl shadow-purple-700/15">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-2">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>Phân Hệ Quản Trị Nền Tảng • Doanh Thu Gói Cước SaaS B2B</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Quản Lý Hóa Đơn Thu Phí Gói SaaS Của Chủ Trọ
          </h1>
          <p className="text-purple-100 text-sm mt-1 max-w-2xl">
            Theo dõi toàn bộ các kỳ thu phí bản quyền phần mềm do các Chủ trọ thanh toán cho Website Admin, gạch nợ tự động và xuất hóa đơn điện tử VAT.
          </p>
        </div>

        <button
          onClick={() => setShowAddSaasModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 btn-press flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-indigo-600/20 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Xuất Hóa Đơn Cước Mới</span>
        </button>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bento-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng Cước Đã Thu
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-2xl font-black text-emerald-600">
              {totalCollected.toLocaleString('vi-VN')} đ
            </div>
            <span className="text-xs font-bold text-emerald-600">
              {saasInvoices.filter((s) => s.status === 'PAID').length} kỳ đã thu
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Doanh thu phần mềm SaaS toàn sàn
          </div>
        </div>

        <div className="bento-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cước Đang Chờ Thu
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-2xl font-black text-amber-600">
              {totalPending.toLocaleString('vi-VN')} đ
            </div>
            <span className="text-xs font-bold text-amber-600">
              {saasInvoices.filter((s) => s.status === 'UNPAID').length} hóa đơn
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Chủ trọ chưa nộp phí duy trì gói
          </div>
        </div>

        <div className="bento-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Hóa Đơn Bản Quyền
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900">{saasInvoices.length}</div>
            <span className="text-xs font-bold text-purple-600">Đã kích hoạt VAT</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Có mã tra cứu và chữ ký số điện tử
          </div>
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="bento-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã hóa đơn, tên chủ trọ, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {['ALL', 'UNPAID', 'PAID'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  filterStatus === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {st === 'ALL'
                  ? 'Tất Cả'
                  : st === 'UNPAID'
                  ? 'Chờ Nộp Cước'
                  : 'Đã Thu Tiền'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-500 uppercase font-black tracking-wider text-[11px] border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Mã Hóa Đơn</th>
                <th className="py-3.5 px-4">Chủ Trọ Nộp Tiền</th>
                <th className="py-3.5 px-4">Gói Cước & Khoản Mục</th>
                <th className="py-3.5 px-4">Số Tiền (VNĐ)</th>
                <th className="py-3.5 px-4">Ngày Xuất / Hạn Đóng</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-5 text-right">Thao Tác Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5">
                    <div className="font-mono font-bold text-purple-700 text-sm">{inv.code}</div>
                    <div className="text-[11px] text-slate-400">ID: #{inv.id}</div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-900">{inv.landlordName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{inv.landlordPhone}</div>
                  </td>

                  <td className="py-4 px-4 max-w-xs">
                    <div className="font-semibold text-slate-900">{inv.packageName}</div>
                    <div className="text-[11px] text-slate-500">Chu kỳ: {inv.billingCycle}</div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-black text-slate-900 text-sm">
                      {inv.amount.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[10px] text-slate-400">Đã gồm VAT 10%</div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="text-slate-800">Xuất: {inv.issuedDate}</div>
                    <div className="text-slate-500 text-[11px]">Hạn: {inv.dueDate}</div>
                  </td>

                  <td className="py-4 px-4">
                    {inv.status === 'PAID' ? (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã Thu Tiền</span>
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">{inv.paidAt}</div>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Chờ Nộp Cước</span>
                        </span>
                        <div className="text-[10px] text-rose-500 font-semibold">Hạn: {inv.dueDate}</div>
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-5 text-right space-x-1.5">
                    {inv.status === 'UNPAID' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            paySaasInvoice(inv.id, 'Admin xác nhận chuyển khoản ngân hàng');
                            showToast(`Đã xác nhận thu tiền cước cho chủ trọ ${inv.landlordName} thành công!`);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs inline-flex items-center gap-1 cursor-pointer"
                          title="Xác nhận tiền đã vào tài khoản Admin và gạch nợ"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Xác Nhận Đã Thu</span>
                        </button>

                        <button
                          onClick={() => {
                            if (sendSaasReminder) sendSaasReminder(inv);
                            showToast(`🔔 Đã gửi thông báo nhắc nợ cước SaaS đến tài khoản Staff/Chủ trọ và SMS Brandname đến SĐT ${inv.landlordPhone}!`);
                          }}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                          title="Gửi thông báo và tin nhắn nhắc nợ cước SaaS"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Nhắc Nợ</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedSaasVat(inv)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition inline-flex items-center gap-1 border border-slate-200 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        <span>Xuất Hóa Đơn VAT</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Xuất Hóa Đơn Điện Tử VAT cho Chủ trọ */}
      <Modal isOpen={!!selectedSaasVat} onClose={() => setSelectedSaasVat(null)} maxWidth="max-w-lg">
        {selectedSaasVat && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  VAT
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Hóa Đơn Điện Tử Gói Cước SaaS B2B</h3>
                  <div className="text-[11px] text-slate-500 font-mono">Số hóa đơn: {selectedSaasVat.code}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSaasVat(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-2">
              <div className="font-bold text-indigo-950 uppercase tracking-wider text-[11px]">
                Đơn vị phát hành (Nền tảng Admin):
              </div>
              <div className="font-bold text-slate-900">{selectedSaasVat.providerName}</div>
              <div className="text-slate-600 font-mono">Mã số thuế: {selectedSaasVat.providerTaxCode}</div>
              <div className="text-slate-600">Tài khoản nhận tiền: <span className="font-bold text-indigo-700">{selectedSaasVat.providerBank}</span></div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs space-y-2">
              <div className="font-bold text-indigo-950 uppercase tracking-wider text-[11px]">
                Chủ trọ thanh toán (Người mua):
              </div>
              <div className="font-bold text-slate-900">{selectedSaasVat.landlordName} (SĐT: {selectedSaasVat.landlordPhone})</div>
              <div className="text-slate-600 font-mono">Mã số thuế: {selectedSaasVat.landlordTaxCode}</div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Nội dung thu phí</th>
                    <th className="p-2.5 text-right">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-medium">{selectedSaasVat.packageName}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{selectedSaasVat.amount.toLocaleString('vi-VN')} đ</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center justify-between text-xs font-bold">
              <span>Đã xác nhận thu tiền: {selectedSaasVat.paymentMethod}</span>
              <span>{selectedSaasVat.paidAt}</span>
            </div>

            <button
              onClick={() => {
                showToast('Đã gửi bản Hóa Đơn Điện Tử VAT có chữ ký số điện tử của Nền Tảng qua Email và SMS cho Chủ Trọ!');
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Gửi Hóa Đơn Điện Tử (Kèm Chữ Ký Số) Cho Chủ Trọ</span>
            </button>
          </div>
        )}
      </Modal>

      {/* Modal Tạo Hóa Đơn Thu Phí Cước Mới Cho Chủ Trọ */}
      <Modal isOpen={showAddSaasModal} onClose={() => setShowAddSaasModal(false)} maxWidth="max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const targetLandlord = landlords.find(l => l.id === Number(newSaasInvoice.landlordId)) || landlords[0];
            createSaasInvoice({
              landlordId: targetLandlord.id,
              landlordName: targetLandlord.fullName,
              landlordPhone: targetLandlord.phone,
              packageName: newSaasInvoice.packageName,
              packageCode: newSaasInvoice.packageCode,
              billingCycle: newSaasInvoice.billingCycle,
              amount: newSaasInvoice.amount,
              dueDate: newSaasInvoice.dueDate
            });
            setShowAddSaasModal(false);
            showToast(`Đã phát hành hóa đơn thu phí SaaS cho Chủ trọ ${targetLandlord.fullName} thành công!`);
          }}
          className="p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Xuất Hóa Đơn Thu Phí Gói SaaS Mới</h3>
            <button
              type="button"
              onClick={() => setShowAddSaasModal(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Chọn Chủ Trọ Thụ Hưởng</label>
              <select
                value={newSaasInvoice.landlordId}
                onChange={(e) => setNewSaasInvoice({ ...newSaasInvoice, landlordId: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-purple-500"
              >
                {landlords.map(l => (
                  <option key={l.id} value={l.id}>{l.fullName} ({l.phone}) - {l.subscriptionPackage}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên Khoản Mục / Gói Dịch Vụ</label>
              <input
                type="text"
                value={newSaasInvoice.packageName}
                onChange={(e) => setNewSaasInvoice({ ...newSaasInvoice, packageName: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Số Tiền Cước (VNĐ)</label>
                <input
                  type="number"
                  value={newSaasInvoice.amount}
                  onChange={(e) => setNewSaasInvoice({ ...newSaasInvoice, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hạn Nộp Tiền</label>
                <input
                  type="text"
                  value={newSaasInvoice.dueDate}
                  onChange={(e) => setNewSaasInvoice({ ...newSaasInvoice, dueDate: e.target.value })}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddSaasModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md"
            >
              Phát Hành Hóa Đơn
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
