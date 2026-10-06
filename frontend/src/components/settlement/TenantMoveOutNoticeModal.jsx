import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

export default function TenantMoveOutNoticeModal({ isOpen, onClose, activeContract, userRoom }) {
  const { submitMoveOutNotice, invoices = [] } = useData();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    moveOutDate: '',
    reason: 'Hết hạn hợp đồng và chuyển công tác',
    bankAccount: '',
    bankName: 'Vietcombank',
    accountHolder: user?.name?.toUpperCase() || 'NGUYEN VAN A',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const currentRoomNum = userRoom?.roomNumber || userRoom?.number || activeContract?.roomNumber || 'P.101';
  const unpaidInvoices = (invoices || []).filter(
    (inv) => inv.room === currentRoomNum && inv.status !== 'PAID'
  );
  const unpaidRentFee = unpaidInvoices.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0);
  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.moveOutDate) {
      setError('Vui lòng chọn ngày dự kiến trả phòng.');
      return;
    }
    if (!formData.bankAccount.trim()) {
      setError('Vui lòng nhập số tài khoản ngân hàng để nhận hoàn tiền cọc.');
      return;
    }
    if (!formData.bankName.trim()) {
      setError('Vui lòng chọn ngân hàng thụ hưởng.');
      return;
    }
    if (!formData.accountHolder.trim()) {
      setError('Vui lòng nhập họ tên chủ tài khoản nhận cọc.');
      return;
    }

    try {
      submitMoveOutNotice({
        contractId: activeContract?.id || 'HD-2026-001',
        roomId: userRoom?.id || 'P101',
        roomNumber: userRoom?.roomNumber || 'P.101',
        tenantId: user?.id || 'KH-001',
        tenantName: user?.name || 'Nguyễn Văn An',
        originalDeposit: activeContract?.deposit || 3000000,
        ...formData,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Không thể gửi thông báo trả phòng.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-4 text-white flex justify-between items-center">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-rose-100 bg-rose-700/50 px-2.5 py-0.5 rounded-full inline-block mb-1">
              UC-T06: Báo trả phòng & Thanh lý
            </span>
            <h3 className="text-lg font-bold">Thông báo trả phòng & Quyết toán cọc</h3>
            <p className="text-xs text-rose-100">
              Phòng: {userRoom?.roomNumber || 'P.101'} | Tiền cọc gốc: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(activeContract?.deposit || 3000000)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2 font-medium">
              <span>✅</span>
              <span>Đã gửi thông báo trả phòng thành công! Quản lý sẽ liên hệ kiểm tra tài sản và lập biên bản quyết toán hoàn cọc.</span>
            </div>
          )}

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 leading-relaxed">
            <span className="font-bold">Quy chế quyết toán cọc & Tiền phòng (UC-S07):</span> 
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li><strong>Hết hạn hợp đồng:</strong> Hoàn cọc = Tiền cọc gốc - Tiền phòng nợ - Tiền điện nước - Đồ đạc hư hỏng.</li>
              <li><strong>Chưa hết hạn hợp đồng:</strong> Tịch thu toàn bộ cọc và không hoàn lại tiền phòng đã đóng tháng này.</li>
            </ul>
          </div>

          {unpaidRentFee > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-700">
                <span>⚠️</span> Cảnh báo nợ tiền phòng:
              </div>
              <p>
                Phòng bạn hiện còn <strong>{formatVND(unpaidRentFee)}</strong> tiền phòng chưa thanh toán. Theo quy định, tiền phòng chưa trả bắt buộc phải thanh toán hoặc sẽ được cấn trừ trực tiếp vào tiền cọc khi nghiệm thu bàn giao phòng.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ngày dự kiến trả phòng <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="moveOutDate"
              value={formData.moveOutDate}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lý do trả phòng
            </label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="VD: Hết hạn hợp đồng, chuyển công tác..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Thông tin nhận hoàn cọc ngân hàng
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngân hàng thụ hưởng <span className="text-rose-500">*</span>
                </label>
                <select
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Vietcombank">Vietcombank</option>
                  <option value="MBBank">MBBank (Quân đội)</option>
                  <option value="Techcombank">Techcombank</option>
                  <option value="VietinBank">VietinBank</option>
                  <option value="BIDV">BIDV</option>
                  <option value="ACB">ACB</option>
                  <option value="TPBank">TPBank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số tài khoản nhận cọc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleChange}
                  placeholder="0123456789"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ tên chủ tài khoản (Viết hoa không dấu) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="accountHolder"
                  value={formData.accountHolder}
                  onChange={handleChange}
                  placeholder="NGUYEN VAN AN"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none uppercase font-semibold"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 rounded-lg shadow-sm shadow-rose-500/30 transition"
            >
              Xác nhận gửi thông báo trả phòng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
