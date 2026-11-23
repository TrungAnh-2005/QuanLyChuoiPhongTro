import Modal from '../../../shared/ui/Modal.jsx';

export default function SepayConfigModal({ handleSaveSepayConfig, handleSyncFromSepay, isSyncingSepay, sepayForm, setSepayForm, setShowSepayConfigModal, showSepayConfigModal }) {
  return (<Modal
          isOpen={showSepayConfigModal}
          onClose={() => setShowSepayConfigModal(false)}
          title="⚙️ Cấu Hình Tài Khoản Ngân Hàng SePay"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Nhập thông tin tài khoản ngân hàng của bạn đã đăng ký với dịch vụ SePay để nhận tiền cọc tự động qua VietQR:
            </p>

            <form onSubmit={handleSaveSepayConfig} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mã Ngân Hàng (Bank ShortName):
                </label>
                <input
                  type="text"
                  value={sepayForm.bank}
                  onChange={(e) => setSepayForm({ ...sepayForm, bank: e.target.value })}
                  placeholder="MBBank, VCB, ACB, TPBank, VPBank..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Số Tài Khoản Nhận Cọc:
                </label>
                <input
                  type="text"
                  value={sepayForm.accountNumber}
                  onChange={(e) => setSepayForm({ ...sepayForm, accountNumber: e.target.value })}
                  placeholder="35825112005"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên Chủ Tài Khoản:
                </label>
                <input
                  type="text"
                  value={sepayForm.accountName}
                  onChange={(e) => setSepayForm({ ...sepayForm, accountName: e.target.value.toUpperCase() })}
                  placeholder="DAM TRUNG ANH"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold uppercase text-slate-800 focus:bg-white focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  SePay API Token (Tùy chọn):
                </label>
                <input
                  type="password"
                  value={sepayForm.apiKey}
                  onChange={(e) => setSepayForm({ ...sepayForm, apiKey: e.target.value })}
                  placeholder="Dán SePay API Key..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSyncFromSepay}
                  disabled={isSyncingSepay}
                  className="px-3 py-2 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>🔄 {isSyncingSepay ? 'Đang đồng bộ...' : 'Tự đồng bộ SePay'}</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSepayConfigModal(false)}
                    className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="btn-press px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Lưu SePay Của Tôi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </Modal>);
}
