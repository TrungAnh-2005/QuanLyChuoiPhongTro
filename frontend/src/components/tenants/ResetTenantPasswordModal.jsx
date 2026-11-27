import Modal from '../shared/Modal.jsx';
import { Key } from 'lucide-react';

export default function ResetTenantPasswordModal({ customPasswordInput, forceChangeOption, resetPwdModal, resetTenantPassword, sendSmsOption, setCustomPasswordInput, setForceChangeOption, setPwdResetToast, setResetPwdModal, setSendSmsOption }) {
  return (<Modal
          isOpen={!!resetPwdModal}
          onClose={() => setResetPwdModal(null)}
          title="🔑 Cấp Lại Mật Khẩu Tạm & Gửi SMS OTP (UC-S02 / UC-A01)"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-900">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Tài khoản khách: {resetPwdModal.fullName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-amber-200/60">
                <div>
                  <span className="text-amber-700 font-medium">Tên đăng nhập (SĐT):</span>
                  <div className="font-mono font-bold text-slate-900">{resetPwdModal.phone}</div>
                </div>
                <div>
                  <span className="text-amber-700 font-medium">CCCD định danh:</span>
                  <div className="font-mono font-bold text-slate-900">{resetPwdModal.cccd}</div>
                </div>
                <div>
                  <span className="text-amber-700 font-medium">Phòng đang thuê:</span>
                  <div className="font-bold text-purple-700">{resetPwdModal.room || resetPwdModal.rooms?.[0] || 'Đã trả phòng'}</div>
                </div>
                <div>
                  <span className="text-amber-700 font-medium">Trạng thái tài khoản:</span>
                  <div className="font-bold text-emerald-700">ACTIVE (Bảo lưu dữ liệu)</div>
                </div>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
try {

                e.preventDefault();
                const res = await resetTenantPassword(resetPwdModal.id, customPasswordInput);
                setResetPwdModal(null);
                setCustomPasswordInput('');
                setPwdResetToast({
                  type: 'SUCCESS',
                  title: '🔑 Đã Cấp Lại Mật Khẩu Thành Công!',
                  message: `Mật khẩu tạm mới: "${res.tempPassword}". Mã xác thực OTP đã được gửi đến số điện thoại ${res.phone} của khách thuê ${res.tenantName}.`
                });
                setTimeout(() => setPwdResetToast(null), 8000);

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
}}
              className="space-y-3.5"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Mật khẩu tạm thời mới *</label>
                  <button
                    type="button"
                    onClick={() => setCustomPasswordInput('TroVN@' + Math.floor(1000 + Math.random() * 9000))}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-800 hover:underline cursor-pointer"
                  >
                    Tạo ngẫu nhiên
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={customPasswordInput}
                  onChange={(e) => setCustomPasswordInput(e.target.value)}
                  placeholder="Ví dụ: TroVN@8392"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendSmsOption}
                    onChange={(e) => setSendSmsOption(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-700">Gửi SMS Brandname chứa mật khẩu tạm và mã OTP về SĐT khách</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceChangeOption}
                    onChange={(e) => setForceChangeOption(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-700">Yêu cầu khách đổi mật khẩu trong lần đăng nhập đầu tiên</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPwdModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Xác Nhận Cấp Mật Khẩu Tạm</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>);
}
