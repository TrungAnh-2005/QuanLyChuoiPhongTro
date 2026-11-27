import Modal from '../shared/Modal.jsx';
import { CheckCircle2 } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { X } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { Zap } from 'lucide-react';

export default function LeaveRoomModal({ agreedForfeitLeave, handleSendLeave, hasUnpaidBillsForLeave, isRepresentative, leaveModal, leaveReason, leaveSuccess, myRoomNumber, otherRoommates, payInvoice, selectedSuccessor, setAgreedForfeitLeave, setLeaveModal, setLeaveReason, setLeaveSuccess, setPaySuccessToast, setSelectedSuccessor, totalUnpaidForLeave, unpaidInvoicesForLeave }) {
  return (<Modal
        isOpen={!!leaveModal}
        onClose={() => {
          setLeaveModal(null);
          setLeaveSuccess(false);
          setAgreedForfeitLeave(false);
          setLeaveReason('');
        }}
        maxWidth="max-w-md"
      >
        {leaveModal && (
          <div>
            {leaveSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 success-pop-icon">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Đã Rời Phòng Thành Công!
                </h3>
                <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                  Bạn đã rút tên khỏi <strong className="text-emerald-700">Phòng {typeof leaveModal === 'string' ? leaveModal : leaveModal?.number}</strong>. Cổng khách thuê đã được cập nhật về trạng thái chưa thuê phòng.
                </p>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Phòng đã rời:</span>
                    <span className="font-bold text-slate-900">
                      {typeof leaveModal === 'string' ? leaveModal : leaveModal?.number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tình trạng:</span>
                    <span className="font-bold text-emerald-700">Đã cập nhật cổng khách thuê</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bạn cùng phòng:</span>
                    <span className="font-semibold text-slate-800">Không bị ảnh hưởng</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLeaveModal(null);
                    setLeaveSuccess(false);
                    setAgreedForfeitLeave(false);
                    setLeaveReason('');
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md btn-press cursor-pointer"
                >
                  Đóng Thông Báo
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <LogOut className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">
                        Rời Khỏi Phòng Thuê (Cá Nhân)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Phòng {typeof leaveModal === 'string' ? leaveModal : leaveModal?.number}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLeaveModal(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 btn-press-ghost cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="my-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <span>🚪</span>
                    <span>Quyền lợi Rời phòng cá nhân</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Bạn đang thực hiện rời khỏi phòng <strong>{typeof leaveModal === 'string' ? leaveModal : leaveModal?.number}</strong>. Thao tác này chỉ rút tên riêng của bạn khỏi phòng này, <strong>không yêu cầu bạn cùng phòng biểu quyết</strong> và <strong>không làm gián đoạn hợp đồng của các bạn cùng phòng khác</strong>.
                  </p>
                  <p className="text-[11px] text-rose-700 font-semibold pt-1 border-t border-amber-200/60">
                    ⚠️ Lưu ý: Tự nguyện rời phòng trước hạn sẽ không được hoàn lại tiền cọc cá nhân.
                  </p>
                </div>

                {hasUnpaidBillsForLeave ? (
                  <div className="my-3 p-3.5 bg-rose-50 rounded-2xl border-2 border-rose-200 text-xs text-rose-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-rose-900">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Chưa đủ điều kiện rời phòng ({unpaidInvoicesForLeave.length} hóa đơn chưa nộp)</span>
                      </div>
                      <span className="font-extrabold font-mono text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg">
                        {totalUnpaidForLeave.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-800 leading-relaxed">
                      Theo quy định, bạn phải hoàn tất thanh toán toàn bộ hóa đơn tiền phòng & sinh hoạt trước khi rời phòng:
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {unpaidInvoicesForLeave.map((inv) => (
                        <div key={inv.id} className="p-2.5 bg-white/90 rounded-xl border border-rose-200 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-800">{inv.code} - {inv.title || 'Hóa đơn tiền phòng'}</div>
                            <div className="text-[11px] text-slate-500 font-mono font-bold text-rose-600">
                              {(Number(inv.totalAmount ?? inv.total) || 0).toLocaleString('vi-VN')} đ
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
try {

                              await payInvoice(inv.id, 'SePay VietQR');
                              setPaySuccessToast(`Đã thanh toán nhanh thành công hóa đơn ${inv.code}!`);
                              setTimeout(() => setPaySuccessToast(null), 5000);

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
}}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 shadow-xs cursor-pointer btn-press"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Thanh Toán Nhanh</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="my-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">
                      Bạn đã hoàn tất toàn bộ hóa đơn tiền phòng & sinh hoạt. Đủ điều kiện rời phòng.
                    </span>
                  </div>
                )}

                <form onSubmit={handleSendLeave} className="space-y-4 text-xs">
                  {isRepresentative && otherRoommates.length > 0 ? (
                    <div className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 font-bold text-purple-950">
                        <span>👑</span>
                        <span>Bắt buộc bàn giao Hợp đồng đại diện</span>
                      </div>
                      <p className="text-[11px] text-purple-900 leading-relaxed">
                        Bạn hiện là <strong>Người đại diện đứng tên Hợp đồng</strong> của phòng {myRoomNumber}. Vì phòng vẫn còn {otherRoommates.length} bạn cùng phòng tiếp tục ở, bạn bắt buộc phải chọn 1 người để chuyển giao quyền đại diện Hợp đồng trước khi rời phòng.
                      </p>
                      <div>
                        <label className="block font-bold text-purple-950 mb-1">
                          Chọn bạn cùng phòng nhận lại Hợp đồng:
                        </label>
                        <select
                          value={selectedSuccessor}
                          onChange={(e) => setSelectedSuccessor(e.target.value)}
                          className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        >
                          <option value="">-- Chọn thành viên tiếp quản hợp đồng --</option>
                          {otherRoommates.map((m) => (
                            <option key={m.id || m.fullName} value={m.tenantId}>
                              {m.fullName} ({m.phone || 'Thành viên phòng'})
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-[10px] text-purple-700 italic pt-1 border-t border-purple-200/60">
                        💡 Khi bàn giao, Hợp đồng sẽ tự động cập nhật tên người ký mới. Ngày hết hạn, tiền cọc và điều khoản hợp đồng được giữ nguyên vẹn.
                      </p>
                    </div>
                  ) : null}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Lý do bạn rời phòng:
                    </label>
                    <textarea
                      rows={3}
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="Ví dụ: Em chuyển chỗ làm/dọn ra ở riêng..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                    />
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedForfeitLeave}
                        onChange={(e) => setAgreedForfeitLeave(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                      />
                      <span className="text-xs text-amber-950 font-semibold leading-snug">
                        Tôi xác nhận tự nguyện dọn ra ngoài, hoàn tất bàn giao và chấp nhận các điều khoản rời phòng cá nhân.
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setLeaveModal(null)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-colors btn-press-ghost"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={!agreedForfeitLeave || hasUnpaidBillsForLeave || (isRepresentative && otherRoommates.length > 0 && !selectedSuccessor)}
                      className={`px-5 py-2.5 font-bold rounded-xl shadow-md transition-all btn-press flex items-center gap-1.5 cursor-pointer ${
                        agreedForfeitLeave && !hasUnpaidBillsForLeave && (!isRepresentative || otherRoommates.length === 0 || selectedSuccessor)
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <span>{isRepresentative && otherRoommates.length > 0 ? 'Bàn Giao HĐ & Rời Phòng' : 'Xác Nhận Rời Phòng'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </Modal>);
}
