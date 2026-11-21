import Modal from '../../../shared/ui/Modal.jsx';
import { Edit3 } from 'lucide-react';
import { X } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { Upload } from 'lucide-react';
import { HOUSE_IMAGE_PRESETS } from '../property.config.js';
import { AlertCircle } from 'lucide-react';

export default function EditPropertyModal({ editHouseForm, editingHouse, handleImageFileUpload, handleSaveEditHouse, isEditNameDuplicate, setEditHouseForm, setEditingHouse }) {
  return (<Modal isOpen={!!editingHouse} onClose={() => setEditingHouse(null)} maxWidth="max-w-xl">
        {editingHouse && (
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Chỉnh Sửa Cơ Sở ({editingHouse.code})
                  </h2>
                  <p className="text-xs text-slate-500">Cập nhật thông tin chi nhánh và ảnh phối cảnh tòa nhà</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingHouse(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditHouse} className="space-y-3.5 pt-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
              {/* Ảnh Thumbnail Cơ Sở */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>Ảnh Phối Cảnh / Thumbnail Cơ Sở</span>
                  </span>
                  <label className="text-[10px] text-purple-600 font-bold hover:underline cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Tải ảnh mới từ máy</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileUpload(e, true)}
                    />
                  </label>
                </label>

                <div className="relative h-36 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mb-2">
                  <img
                    src={editHouseForm.imageUrl || '/assets/images/house_cau_giay.jpg'}
                    alt="Preview cơ sở"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {HOUSE_IMAGE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditHouseForm({ ...editHouseForm, imageUrl: preset.url })}
                      className={`p-1.5 rounded-xl border text-left text-[10px] transition-all flex items-center gap-1.5 cursor-pointer ${
                        editHouseForm.imageUrl === preset.url
                          ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold ring-1 ring-purple-600'
                          : 'border-slate-200 hover:border-purple-300 bg-white text-slate-600'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-5 h-5 rounded-md object-cover" />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Hoặc dán link ảnh (https://...)"
                  value={editHouseForm.imageUrl}
                  onChange={(e) => setEditHouseForm({ ...editHouseForm, imageUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Tên cơ sở nhà trọ *</label>
                  {isEditNameDuplicate && (
                    <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Đã tồn tại tên cơ sở này
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={editHouseForm.name}
                  onChange={(e) => setEditHouseForm({ ...editHouseForm, name: e.target.value })}
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white transition-colors ${
                    isEditNameDuplicate
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/40 text-rose-900'
                      : 'border-slate-200 focus:border-purple-500'
                  }`}
                />
                {isEditNameDuplicate && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    ⚠️ Trùng tên với một cơ sở khác trong hệ thống. Vui lòng chọn tên khác.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa chỉ chi tiết *</label>
                <input
                  type="text"
                  required
                  value={editHouseForm.address}
                  onChange={(e) => setEditHouseForm({ ...editHouseForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Người quản lý cơ sở *</label>
                  <input
                    type="text"
                    required
                    value={editHouseForm.manager}
                    onChange={(e) => setEditHouseForm({ ...editHouseForm, manager: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SĐT liên hệ quản lý *</label>
                  <input
                    type="text"
                    required
                    value={editHouseForm.managerPhone}
                    onChange={(e) => setEditHouseForm({ ...editHouseForm, managerPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số tầng tòa nhà</label>
                  <input
                    type="number"
                    min={1}
                    value={editHouseForm.floors}
                    onChange={(e) => setEditHouseForm({ ...editHouseForm, floors: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quy mô hiện tại</label>
                  <div className="px-3 py-2 bg-slate-100 rounded-xl text-slate-600 font-bold">
                    {editingHouse.totalRooms} Phòng
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiện ích cơ sở (cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={editHouseForm.features.join(', ')}
                  onChange={(e) =>
                    setEditHouseForm({
                      ...editHouseForm,
                      features: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    })
                  }
                  placeholder="Thang máy, Khóa cổng vân tay, Camera 24/7..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingHouse(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isEditNameDuplicate}
                  className={`px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-all ${
                    isEditNameDuplicate
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white cursor-pointer'
                  }`}
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>);
}
