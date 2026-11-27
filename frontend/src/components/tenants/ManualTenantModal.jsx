import Modal from '../shared/Modal.jsx';
import { UserCheck } from 'lucide-react';
import { Building2 } from 'lucide-react';
import { Home } from 'lucide-react';

export default function ManualTenantModal({ calculateContractEnd, facilities, handleCreateTenant, handleManualRoomChange, manualHouseCode, manualVacantRooms, newTenant, rooms, setManualHouseCode, setNewTenant, setShowModal, showModal, staffManageableHouses, user }) {
  return (<Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-xl">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-purple-600" />
          <span>Tiếp Nhận Khách Thuê Mới (Thủ Công)</span>
        </h2>
        <form onSubmit={handleCreateTenant} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên khách</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Hoàng Văn Bảo"
              value={newTenant.fullName}
              onChange={(e) => setNewTenant({ ...newTenant, fullName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số CCCD / Định danh</label>
              <input
                type="text"
                required
                placeholder="12 chữ số"
                value={newTenant.cccd}
                onChange={(e) => setNewTenant({ ...newTenant, cccd: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                required
                placeholder="09..."
                value={newTenant.phone}
                onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Quê quán</label>
            <input
              type="text"
              placeholder="Tỉnh/Thành phố (Ví dụ: Nam Định, Hà Tĩnh, Hà Nội...)"
              value={newTenant.hometown}
              onChange={(e) => setNewTenant({ ...newTenant, hometown: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
            />
          </div>

          {/* Phân bổ Cơ sở & Phòng thuê còn trống */}
          <div className="p-4 bg-gradient-to-br from-purple-50/80 via-indigo-50/40 to-slate-50 border border-purple-200 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span>Phân Bổ Phòng Cho Thuê</span>
              </span>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-100/70 px-2.5 py-0.5 rounded-full">
                Chỉ hiện phòng còn trống
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Cơ sở thuê *</span>
                </label>
                <select
                  value={manualHouseCode}
                  onChange={(e) => setManualHouseCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 shadow-2xs cursor-pointer"
                >
                  {(user?.role === 'STAFF' ? staffManageableHouses : facilities).map((f) => {
                    const countVacant = (rooms || []).filter(
                      (r) => (r.houseCode || facilities[0]?.code) === f.code && r.status === 'AVAILABLE' && (!r.occupants || r.occupants === 0)
                    ).length;
                    return (
                      <option key={f.code} value={f.code}>
                        {f.name} ({countVacant} phòng trống)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>Phòng thuê còn trống *</span>
                  </span>
                  {manualVacantRooms.length > 0 && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                      {manualVacantRooms.length} phòng sẵn sàng
                    </span>
                  )}
                </label>
                {manualVacantRooms.length > 0 ? (
                  <select
                    value={newTenant.room}
                    onChange={(e) => handleManualRoomChange(e.target.value)}
                    className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2.5 text-xs font-bold text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-400/20 shadow-2xs cursor-pointer"
                  >
                    {manualVacantRooms.map((r) => (
                      <option key={r.number} value={r.number}>
                        Phòng {r.number} - {r.floor} ({r.area}m² - {(r.price || 3500000).toLocaleString('vi-VN')} đ/tháng)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-1.5">
                    <span>⚠️ Cơ sở này hiện đã kín phòng!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thời hạn hợp đồng</label>
              <select
                value={newTenant.contractDuration}
                onChange={(e) => {
                  const duration = Number(e.target.value);
                  const end = calculateContractEnd(newTenant.contractStart, duration);
                  setNewTenant({ ...newTenant, contractDuration: duration, contractEnd: end });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-purple-700 focus:outline-none focus:bg-white focus:border-purple-500 cursor-pointer"
              >
                <option value={3}>3 Tháng (Ngắn hạn)</option>
                <option value={6}>6 Tháng (Trung hạn)</option>
                <option value={12}>12 Tháng (1 năm - Tiêu chuẩn)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngày bắt đầu hợp đồng</label>
              <input
                type="text"
                value={newTenant.contractStart}
                onChange={(e) => {
                  const start = e.target.value;
                  const end = calculateContractEnd(start, newTenant.contractDuration);
                  setNewTenant({ ...newTenant, contractStart: start, contractEnd: end });
                }}
                placeholder="25/09/2026"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tiền cọc giữ chân (VNĐ)</label>
              <input
                type="number"
                value={newTenant.deposit}
                onChange={(e) => setNewTenant({ ...newTenant, deposit: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hạn hợp đồng đến ngày (Tự động)</label>
              <div className="w-full bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 text-xs text-purple-900 font-bold font-mono">
                {newTenant.contractEnd}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors btn-press-ghost"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-purple-600/25 transition-all btn-press cursor-pointer"
            >
              Lưu Khách Thuê Mới
            </button>
          </div>
        </form>
      </Modal>);
}
