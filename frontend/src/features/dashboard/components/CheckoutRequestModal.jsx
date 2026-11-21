import Modal from '../../../shared/ui/Modal.jsx';
import { CheckCircle2 } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { X } from 'lucide-react';

export default function CheckoutRequestModal({ agreedForfeitDeposit, checkoutError, checkoutModal, checkoutReason, checkoutSubmitting, checkoutSuccess, currentTenant, handleSendCheckout, isCheckoutRoomMulti, isContractExpired, refundAccountName, refundAccountNumber, refundBank, selectedCheckoutRoomObj, setAgreedForfeitDeposit, setCheckoutModal, setCheckoutReason, setCheckoutSuccess, setRefundAccountName, setRefundAccountNumber, setRefundBank }) {
  return (<Modal
        isOpen={!!checkoutModal}
        onClose={() => {
          setCheckoutModal(null);
          setCheckoutSuccess(false);
          setAgreedForfeitDeposit(false);
          setCheckoutReason('');
        }}
        maxWidth="max-w-md"
      >
        {checkoutModal && (
          <div>
            {checkoutSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 success-pop-icon">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {isCheckoutRoomMulti ? 'Đã Gửi Yêu Cầu Biểu Quyết Trả Phòng!' : 'Đã Gửi Yêu Cầu Trả Phòng!'}
                </h3>
                <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                  {isCheckoutRoomMulti ? (
                    <>
                      Do phòng <strong className="text-rose-600">Phòng {typeof checkoutModal === 'string' ? checkoutModal : checkoutModal?.number}</strong> hiện có {selectedCheckoutRoomObj?.occupants || 2} người ở, yêu cầu trả phòng đã được gửi tới tất cả bạn cùng phòng để biểu quyết. Khi tất cả cùng đồng ý, đơn sẽ tự động chuyển tới Ban Quản Lý phê duyệt.
                    </>
                  ) : (
                    <>
                      Phòng chỉ có 1 mình bạn nên yêu cầu đã được chuyển thẳng tới Ban Quản Lý để xếp lịch kiểm kê và hoàn tất thủ tục thanh lý.
                    </>
                  )}
                </p>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 mb-5 text-left">
                  📞 Nhân viên quản lý cơ sở sẽ liên hệ trực tiếp sau khi hoàn tất các thủ tục theo quy định.
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCheckoutModal(null);
                    setCheckoutSuccess(false);
                    setAgreedForfeitDeposit(false);
                    setCheckoutReason('');
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md btn-press cursor-pointer"
                >
                  Đóng Thông Báo
                </button>
              </div>
            ) : (
              <div>
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">
                        {isCheckoutRoomMulti ? 'Yêu Cầu Biểu Quyết Trả Toàn Bộ Phòng' : 'Yêu Cầu Trả Toàn Bộ Phòng'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Phòng {typeof checkoutModal === 'string' ? checkoutModal : checkoutModal?.number} (Hiện có {selectedCheckoutRoomObj?.occupants || 1} người đang ở)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutModal(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 btn-press-ghost cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {isCheckoutRoomMulti && (
                  <div className="my-3 p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs space-y-1.5 text-indigo-900">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>👥</span>
                      <span>Quy Định Phòng Có Người Khác: Phải Hỏi Tất Cả Mọi Người</span>
                    </div>
                    <p className="text-[11px] text-indigo-800 leading-relaxed font-medium">
                      Phòng này hiện có <strong>{selectedCheckoutRoomObj?.occupants} người</strong>. Vì việc trả phòng ảnh hưởng đến toàn bộ cư dân trong phòng, hệ thống sẽ gửi thông báo biểu quyết tới <strong>tất cả các bạn cùng phòng</strong>. Đơn chỉ được chuyển tới Ban Quản Lý khi <strong>tất cả mọi người đều đồng ý</strong>.
                    </p>
                    <p className="text-[11px] text-amber-900 font-semibold pt-1 border-t border-indigo-200/60">
                      💡 Mẹo: Nếu bạn chỉ muốn dọn ra ngoài một mình và để các bạn khác tiếp tục ở, vui lòng chọn <strong>[Rời phòng]</strong> (không cần biểu quyết).
                    </p>
                  </div>
                )}

                {isContractExpired ? (
                  <div className="my-3.5 p-3.5 bg-emerald-50 rounded-2xl border-2 border-emerald-300 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-950">
                      <span>🟢</span>
                      <span>Hợp đồng đã hết hạn: Đủ điều kiện hoàn cọc</span>
                    </div>
                    <p className="text-[11px] text-emerald-900 leading-relaxed">
                      Hợp đồng thuê phòng của bạn đã kết thúc đúng hạn. Ban Quản Lý sẽ nghiệm thu phòng và hoàn lại tiền cọc (ước tính: <strong>3.500.000 đ</strong> sau khi trừ chi phí hư hỏng nếu có).
                    </p>
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2">
                      <div className="font-bold text-slate-800 text-xs">Thông tin nhận hoàn cọc của bạn:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Ngân hàng:</label>
                          <input
                            type="text"
                            value={refundBank}
                            onChange={(e) => setRefundBank(e.target.value)}
                            placeholder="VD: Vietcombank, MB..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Số tài khoản:</label>
                          <input
                            type="text"
                            value={refundAccountNumber}
                            onChange={(e) => setRefundAccountNumber(e.target.value)}
                            placeholder="Số tài khoản..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold focus:bg-white"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Tên chủ tài khoản:</label>
                          <input
                            type="text"
                            value={refundAccountName}
                            onChange={(e) => setRefundAccountName(e.target.value)}
                            placeholder="Họ và tên chủ tài khoản..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold uppercase focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="my-3.5 p-3.5 bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl border-2 border-rose-300 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <h4 className="font-black text-rose-900 uppercase tracking-wide text-[11px] mb-1">
                          Cảnh báo: Trả phòng chưa hết hạn hợp đồng!
                        </h4>
                        <p className="text-rose-800 leading-relaxed font-medium">
                          Hợp đồng thuê phòng vẫn còn hiệu lực. Theo quy định tại Hợp đồng thuê phòng, việc đơn phương trả phòng trước thời hạn sẽ{' '}
                          <strong className="text-rose-950 font-black underline">
                            KHÔNG ĐƯỢC HOÀN LẠI TIỀN CỌC
                          </strong>{' '}
                          (ước tính:{' '}
                          <span className="font-bold text-rose-950">
                            {(currentTenant?.deposit || 3500000).toLocaleString('vi-VN')} đ
                          </span>
                          ).
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendCheckout} className="space-y-4 text-xs">
                  {checkoutError && <p role="alert" className="text-rose-700">{checkoutError}</p>}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Lý do bạn muốn trả phòng:
                    </label>
                    <textarea
                      rows={3}
                      value={checkoutReason}
                      onChange={(e) => setCheckoutReason(e.target.value)}
                      placeholder="Ví dụ: Em đổi chỗ làm/về quê gấp nên không thể tiếp tục thuê..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-rose-500"
                    />
                  </div>

                  {!isContractExpired && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedForfeitDeposit}
                        onChange={(e) => setAgreedForfeitDeposit(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                      />
                      <span className="text-xs text-amber-950 font-semibold leading-snug">
                        Tôi xác nhận đã đọc, hiểu rõ và chấp nhận điều khoản{' '}
                        <span className="text-rose-700 font-extrabold underline">
                          MẤT TOÀN BỘ TIỀN CỌC
                        </span>{' '}
                        khi gửi yêu cầu trả phòng trước hạn.
                      </span>
                    </label>
                  </div>

                  )}

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCheckoutModal(null)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-colors btn-press-ghost"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={checkoutSubmitting || (!isContractExpired && !agreedForfeitDeposit)}
                      className={`px-5 py-2.5 font-bold rounded-xl shadow-md transition-all btn-press flex items-center gap-1.5 cursor-pointer ${
                        (isContractExpired || agreedForfeitDeposit) && !checkoutSubmitting
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <span>
                        {checkoutSubmitting ? 'Đang gửi yêu cầu...' : isContractExpired ? 'Xác Nhận Trả Phòng' : isCheckoutRoomMulti
                          ? 'Gửi Lấy Ý Kiến Bạn Cùng Phòng'
                          : 'Xác Nhận Trả Phòng (Mất Cọc)'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </Modal>);
}
