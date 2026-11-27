import { Wrench } from 'lucide-react';
import Modal from '../shared/Modal';

export default function MaintenanceRequestModal({ isOpen, onClose, onSubmit, newTicket, setNewTicket, categories, rentedRooms }) {
  const isTenant = rentedRooms !== undefined;
  const updateField = (field, value) => setNewTicket(ticket => ({ ...ticket, [field]: value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
        <Wrench className="w-5 h-5 text-purple-600" />
        <span>{isTenant ? 'Gửi Báo Hỏng Thiết Bị (Kèm Ảnh)' : 'Tạo Phiếu Sửa Chữa Mới'}</span>
      </h2>
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            {isTenant ? 'Vị trí / Phòng gặp sự cố *' : 'Số phòng hoặc khu vực sự cố *'}
          </label>
          {isTenant ? (
            <select
              value={newTicket.room}
              onChange={(e) => updateField('room', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 cursor-pointer"
            >
              {rentedRooms.map((rm) => (
                <option key={rm} value={rm}>
                  Phòng {rm} (Phòng bạn đang thuê)
                </option>
              ))}
              <option value="Khu vực chung">
                Khu vực sinh hoạt chung (Nhà xe, Sân phơi, Cổng chính)
              </option>
            </select>
          ) : (
            <input
              type="text"
              required
              placeholder="Ví dụ: P.101 hoặc Khu vực chung"
              value={newTicket.room}
              onChange={(e) => updateField('room', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
            />
          )}
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Danh mục thiết bị gặp sự cố *</label>
          <select
            value={newTicket.category}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Mô tả chi tiết hỏng hóc *</label>
          <textarea
            rows={3}
            required
            placeholder="Ví dụ: Vòi xịt bồn cầu bị rỉ nước liên tục, chảy tràn ra sàn..."
            value={newTicket.issue}
            onChange={(e) => updateField('issue', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Mức độ ưu tiên</label>
          <select
            value={newTicket.priority}
            onChange={(e) => updateField('priority', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
          >
            <option value="LOW">Thấp (Đèn mờ, rèm lỏng...)</option>
            <option value="MEDIUM">Bình thường (Cửa kẹt, quạt kêu...)</option>
            <option value="HIGH">Khẩn cấp (Chập điện, vỡ ống nước, hỏng khóa chính...)</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Hình ảnh bằng chứng hiện trường</label>
          <input
            type="text"
            value={newTicket.imageUrl}
            onChange={(e) => updateField('imageUrl', e.target.value)}
            placeholder="Dán link ảnh hoặc chọn ảnh mẫu..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px]"
          />
          {isTenant && (
            <div className="flex gap-2 mt-2">
              {[
                { label: 'Ảnh vòi nước', url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop' },
                { label: 'Ảnh điều hòa', url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600&auto=format&fit=crop' },
                { label: 'Ảnh chập điện', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop' }
              ].map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => updateField('imageUrl', sample.url)}
                  className="px-2 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-[10px] font-bold rounded-lg border border-slate-200 cursor-pointer"
                >
                  + {sample.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-md btn-press cursor-pointer"
          >
            {isTenant ? 'Gửi Yêu Cầu Sửa Chữa' : 'Tạo Phiếu Sửa Chữa'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
