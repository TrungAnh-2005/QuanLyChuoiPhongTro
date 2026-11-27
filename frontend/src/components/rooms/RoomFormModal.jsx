import { useRef, useState } from 'react';
import Modal from '../shared/Modal.jsx';
import { X, Wrench, CheckCircle2 } from 'lucide-react';
import { ROOM_IMAGE_PRESETS, amenityOptions } from '../../features/rooms/room.config.js';
import { roomStatusLabel } from '../../features/rooms/room.rules.js';

export default function RoomFormModal({ editingRoom, editingRoomOccupied = false, initialHouseCode, onSave, onClose, onStartMaintenance, staffManageableHouses }) {
  const [roomFormData, setRoomFormData] = useState(() => editingRoom ? {
    number: editingRoom.number,
    houseCode: editingRoom.houseCode,
    floor: editingRoom.floor,
    price: editingRoom.price,
    area: editingRoom.area,
    maxOccupants: editingRoom.maxOccupants,
    amenities: editingRoom.amenities,
    image: editingRoom.image,
  } : {
    number: '',
    houseCode: initialHouseCode,
    floor: 'Tầng 1',
    price: 3500000,
    area: 25,
    maxOccupants: 2,
    status: 'AVAILABLE',
    amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'],
    image: ROOM_IMAGE_PRESETS[0].url,
  });
  const [saving, setSaving] = useState(false);
  const saveInFlight = useRef(false);
  const houseCode = staffManageableHouses.some(house => house.code === roomFormData.houseCode)
    ? roomFormData.houseCode
    : staffManageableHouses[0]?.code || '';

  const updateField = (field, value) => {
    setRoomFormData(current => ({ ...current, [field]: value }));
  };
  const close = () => {
    if (!saveInFlight.current) onClose();
  };
  const startMaintenance = () => {
    if (saveInFlight.current) return;
    onClose();
    onStartMaintenance(editingRoom);
  };
  const handleSaveRoom = async event => {
    event.preventDefault();
    if (saveInFlight.current || !roomFormData.number?.trim() || !houseCode) return;

    saveInFlight.current = true;
    setSaving(true);
    try {
      await onSave({ ...roomFormData, houseCode });
    } catch {
      // The shared mutation toast displays the error. Keep the draft available for retry.
      return;
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
    onClose();
  };

  return (
    <Modal isOpen onClose={close} maxWidth="max-w-md">
      <div className="space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">
            {editingRoom ? `Chỉnh Sửa Phòng ${editingRoom.number}` : 'Thêm Phòng Mới Vào Cơ Sở'}
          </h3>
          <button
            type="button"
            aria-label="Đóng form phòng"
            disabled={saving}
            onClick={close}
            className="p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSaveRoom} aria-busy={saving}>
          <fieldset disabled={saving} className="min-w-0 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Số phòng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: P.101"
                  value={roomFormData.number}
                  onChange={(e) => updateField('number', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cơ sở *</label>
                <select
                  required
                  value={houseCode}
                  onChange={(e) => updateField('houseCode', e.target.value)}
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
                  onChange={(e) => updateField('floor', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Diện tích (m²)</label>
                <input
                  type="number"
                  value={roomFormData.area}
                  onChange={(e) => updateField('area', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sức chứa</label>
                <input
                  type="number"
                  value={roomFormData.maxOccupants}
                  onChange={(e) => updateField('maxOccupants', Number(e.target.value))}
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
                onChange={(e) => updateField('price', Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-purple-700 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ảnh đại diện phòng</label>
              <select
                value={roomFormData.image}
                onChange={(e) => updateField('image', e.target.value)}
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
                          updateField('amenities', updated);
                        }}
                        className="rounded text-purple-600"
                      />
                      <span>{amenity}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {editingRoom && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-700">Trạng thái phòng hiện tại:</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white border border-slate-200 text-slate-800">
                    {roomStatusLabel(editingRoom.status)}
                  </span>
                </div>
                {editingRoom.status === 'AVAILABLE' && !editingRoomOccupied && onStartMaintenance && (
                  <button
                    type="button"
                    onClick={startMaintenance}
                    className="w-full px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Chuyển sang Đang bảo trì</span>
                  </button>
                )}
                {editingRoom.status === 'MAINTENANCE' && onStartMaintenance && (
                  <button
                    type="button"
                    onClick={startMaintenance}
                    className="w-full px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Hoàn tất bảo trì</span>
                  </button>
                )}
                {editingRoom.status === 'LOCKED' && (
                  <p className="text-[11px] text-amber-700">
                    Phòng đang tạm khóa. Hãy mở khóa phòng về trạng thái Trống trước khi chuyển sang bảo trì.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!houseCode}
                className="px-5 py-2 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Đang lưu…' : 'Lưu Thông Tin Phòng'}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </Modal>
  );
}
