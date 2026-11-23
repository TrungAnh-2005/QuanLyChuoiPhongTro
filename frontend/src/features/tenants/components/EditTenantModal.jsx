import Modal from '../../../shared/ui/Modal.jsx';
import { Edit3 } from 'lucide-react';
import { X } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';

export default function EditTenantModal({ editingTenant, handleSaveEdit, setEditingTenant }) {
  return (<Modal isOpen={!!editingTenant} onClose={() => setEditingTenant(null)} maxWidth="max-w-lg">
        {editingTenant && (
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <span>Chỉnh Sửa Hồ Sơ: {editingTenant.fullName}</span>
              </h2>
              <button
                onClick={() => setEditingTenant(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              {/* Cảnh báo quy chế: Admin & Staff KHÔNG được sửa trạng thái hợp đồng và các phòng đang thuê */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Quy định bảo vệ dữ liệu hợp đồng:</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Admin và Staff <strong>không được sửa trạng thái hợp đồng và các phòng đang thuê</strong>. Dữ liệu này được tự động cập nhật từ các giao dịch của khách hàng (thuê phòng, chuyển phòng, ở ghép, trả phòng). Thời hạn hợp đồng (3, 6, 12 tháng) do khách hàng chủ động đề xuất và Ban Quản Lý chỉ thực hiện duyệt.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1.5 text-[11px] border-t border-amber-200/60">
                  <div>
                    <span className="text-slate-500">Phòng đang thuê:</span>{' '}
                    <strong className="text-purple-700 font-mono">
                      {(editingTenant.rooms || (editingTenant.room ? [editingTenant.room] : [])).join(', ') || '0 phòng'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Trạng thái hợp đồng:</span>{' '}
                    <strong className={editingTenant.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-700'}>
                      {editingTenant.status === 'ACTIVE' ? 'Đang thuê phòng' : `Đã rời phòng (${editingTenant.daysSinceLeave || 0} ngày)`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Hạn hợp đồng hiện tại:</span>{' '}
                    <strong className="text-indigo-700 font-mono">
                      {editingTenant.contractEnd || '31/12/2026'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Xóa tài khoản:</span>{' '}
                    <strong className={(editingTenant.rooms?.length || 0) === 0 && (editingTenant.daysSinceLeave || 0) >= 30 ? 'text-rose-600' : 'text-slate-600'}>
                      {(editingTenant.rooms?.length || 0) === 0 && (editingTenant.daysSinceLeave || 0) >= 30 ? 'Đủ điều kiện xóa (>= 30 ngày)' : 'Chưa đủ điều kiện'}
                    </strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên khách</label>
                <input
                  type="text"
                  required
                  value={editingTenant.fullName}
                  onChange={(e) => setEditingTenant({ ...editingTenant, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số CCCD / Định danh</label>
                  <input
                    type="text"
                    required
                    value={editingTenant.cccd}
                    onChange={(e) => setEditingTenant({ ...editingTenant, cccd: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    required
                    value={editingTenant.phone}
                    onChange={(e) => setEditingTenant({ ...editingTenant, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ Email</label>
                  <input
                    type="email"
                    value={editingTenant.email || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quê quán</label>
                  <input
                    type="text"
                    value={editingTenant.hometown || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, hometown: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tiền cọc giữ chân (VNĐ)</label>
                <input
                  type="number"
                  value={editingTenant.deposit || 0}
                  onChange={(e) => setEditingTenant({ ...editingTenant, deposit: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors btn-press-ghost cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-md shadow-indigo-600/25 transition-all btn-press cursor-pointer"
                >
                  Lưu Cập Nhật
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>);
}
