import Modal from '../../../shared/ui/Modal.jsx';
import { X } from 'lucide-react';
import { ROOM_IMAGE_PRESETS } from '../room.config.js';
import { amenityOptions } from '../room.config.js';

export default function RoomFormModal({ editingRoom, handleSaveRoom, roomFormData, setEditingRoom, setRoomFormData, setShowAddModal, showAddModal, staffManageableHouses }) {
  return (<Modal
          isOpen={showAddModal || !!editingRoom}
          onClose={() => {
            setShowAddModal(false);
            setEditingRoom(null);
          }}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingRoom ? `Chỉnh Sửa Phòng ${editingRoom.number}` : 'Thêm Phòng Mới Vào Cơ Sở'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRoom(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số phòng *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: P.101"
                    value={roomFormData.number}
                    onChange={(e) => setRoomFormData({ ...roomFormData, number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cơ sở *</label>
                  <select
                    value={roomFormData.houseCode}
                    onChange={(e) => setRoomFormData({ ...roomFormData, houseCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    {staffManageableHouses.map((h) => (
                      <option key={h.code} value={h.code}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tầng</label>
                  <input
                    type="text"
                    value={roomFormData.floor}
                    onChange={(e) => setRoomFormData({ ...roomFormData, floor: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diện tích (m²)</label>
                  <input
                    type="number"
                    value={roomFormData.area}
                    onChange={(e) => setRoomFormData({ ...roomFormData, area: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sức chứa</label>
                  <input
                    type="number"
                    value={roomFormData.maxOccupants}
                    onChange={(e) => setRoomFormData({ ...roomFormData, maxOccupants: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Giá thuê (VNĐ/tháng) *</label>
                <input
                  type="number"
                  required
                  value={roomFormData.price}
                  onChange={(e) => setRoomFormData({ ...roomFormData, price: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-purple-700 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ảnh đại diện phòng</label>
                <select
                  value={roomFormData.image}
                  onChange={(e) => setRoomFormData({ ...roomFormData, image: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                >
                  {ROOM_IMAGE_PRESETS.map((preset) => (
                    <option key={preset.url} value={preset.url}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiện ích trong phòng</label>
                <div className="grid grid-cols-3 gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  {amenityOptions([...(editingRoom?.amenities || []), ...(roomFormData.amenities || [])]).map((amenity) => {
                    const isChecked = (roomFormData.amenities || []).includes(amenity);
                    return (
                      <label key={amenity} className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const cur = roomFormData.amenities || [];
                            const updated = e.target.checked
                              ? [...cur, amenity]
                              : cur.filter((a) => a !== amenity);
                            setRoomFormData({ ...roomFormData, amenities: updated });
                          }}
                          className="rounded text-purple-600"
                        />
                        <span>{amenity}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRoom(null);
                  }}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md cursor-pointer"
                >
                  Lưu Thông Tin Phòng
                </button>
              </div>
            </form>
          </div>
        </Modal>);
}
