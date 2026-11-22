import Modal from '../../../shared/ui/Modal.jsx';
import { Building2 } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { Upload } from 'lucide-react';
import { HOUSE_IMAGE_PRESETS } from '../property.config.js';
import { AlertCircle } from 'lucide-react';

export default function CreatePropertyModal({ handleCreate, handleImageFileUpload, isNewNameDuplicate, landlordPackage, maxRoomsAllowed, newHouse, setNewHouse, setShowModal, showModal }) {
  return (<Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-xl">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Thêm Cơ Sở Nhà Trọ Vào Chuỗi</h2>
            <p className="text-xs text-slate-500">Cơ sở mới ở trạng thái Chờ duyệt. Admin phê duyệt trước khi tạo phòng và đón khách.</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Ảnh Thumbnail Cơ Sở */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <span>Ảnh Phối Cảnh / Thumbnail Cơ Sở</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Tùy chọn tải ảnh hoặc chọn mẫu</span>
            </label>

            {/* Preview Box */}
            <div className="relative h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mb-2.5 group">
              <img
                src={newHouse.imageUrl || '/assets/images/house_cau_giay.jpg'}
                alt="Preview cơ sở"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 hover:bg-slate-50">
                  <Upload className="w-3.5 h-3.5 text-purple-600" />
                  <span>Tải ảnh từ máy</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageFileUpload(e, false)}
                  />
                </label>
              </div>
            </div>

            {/* Thư viện chọn nhanh ảnh mẫu */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-600">Hoặc chọn nhanh từ thư viện ảnh mẫu:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {HOUSE_IMAGE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewHouse({ ...newHouse, imageUrl: preset.url })}
                    className={`p-1.5 rounded-xl border text-left text-[10px] transition-all flex items-center gap-1.5 cursor-pointer ${
                      newHouse.imageUrl === preset.url
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold ring-1 ring-purple-600'
                        : 'border-slate-200 hover:border-purple-300 bg-white text-slate-600'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-6 h-6 rounded-md object-cover" />
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* URL nhập trực tiếp */}
            <div className="mt-2">
              <input
                type="text"
                placeholder="Hoặc dán đường dẫn ảnh trực tiếp (https://...)"
                value={newHouse.imageUrl}
                onChange={(e) => setNewHouse({ ...newHouse, imageUrl: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Tên cơ sở nhà trọ *</label>
              {isNewNameDuplicate && (
                <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Đã tồn tại tên cơ sở này
                </span>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="Ví dụ: Nhà Trọ Tây Hồ - Cơ Sở 4"
              value={newHouse.name}
              onChange={(e) => setNewHouse({ ...newHouse, name: e.target.value })}
              className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white font-semibold transition-colors ${
                isNewNameDuplicate
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/40 text-rose-900'
                  : 'border-slate-200 focus:border-purple-500'
              }`}
            />
            {isNewNameDuplicate && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                ⚠️ Mỗi cơ sở trong hệ thống phải có tên riêng biệt để tránh nhầm lẫn trong hợp đồng và hóa đơn.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ chi tiết *</label>
            <input
              type="text"
              required
              placeholder="Số nhà, đường, phường, quận..."
              value={newHouse.address}
              onChange={(e) => setNewHouse({ ...newHouse, address: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số tầng</label>
              <input
                type="number"
                value={newHouse.floors}
                onChange={(e) => setNewHouse({ ...newHouse, floors: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Tổng số phòng dự kiến</label>
                <span className="text-[10px] font-bold text-purple-700">
                  Tối đa {maxRoomsAllowed} phòng ({landlordPackage})
                </span>
              </div>
              <input
                type="number"
                min={1}
                max={maxRoomsAllowed}
                value={newHouse.totalRooms}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setNewHouse({ ...newHouse, totalRooms: val > maxRoomsAllowed ? maxRoomsAllowed : val });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
              />
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
              disabled={isNewNameDuplicate}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all ${
                isNewNameDuplicate
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-600/25 btn-press'
              }`}
            >
              Thêm Cơ Sở
            </button>
          </div>
        </form>
      </Modal>);
}
