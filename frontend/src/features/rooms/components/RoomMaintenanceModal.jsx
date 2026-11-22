import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import Modal from '../../../shared/ui/Modal.jsx';
import { useData } from '../../../shared/data/RentalDataContext';

export default function RoomMaintenanceModal({ room, onClose, onSuccess }) {
  const { createTicket, updateTicketStatus } = useData();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const completing = room.status === 'MAINTENANCE';
  const submit = async (event, status = 'RESOLVED') => {
    event.preventDefault();
    if (inFlight.current) return;
    if (completing && !room.maintenanceRequestId) { setError('Phòng chưa có mã phiếu bảo trì. Vui lòng tải lại dữ liệu hoặc kiểm tra phiếu bảo trì.'); return; }
    if (!completing && (!title.trim() || !description.trim())) { setError('Nhập tiêu đề và mô tả bảo trì.'); return; }
    inFlight.current = true; setBusy(true); setError('');
    try {
      if (completing) await updateTicketStatus(room.maintenanceRequestId, status);
      else await createTicket({ roomId: room.id, title: title.trim(), description: description.trim(), blocksRental: true });
      onSuccess(completing ? (status === 'CANCELLED' ? 'Đã hủy phiếu bảo trì và mở lại phòng.' : 'Đã hoàn tất bảo trì và mở lại phòng.') : 'Đã tạo phiếu và chuyển phòng sang bảo trì.');
      onClose();
    } catch (failure) { setError(failure.message || 'Không thể cập nhật bảo trì. Vui lòng thử lại.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <Modal isOpen={true} onClose={() => { if (!busy) onClose(); }} maxWidth="max-w-md">
    <form onSubmit={submit} className="space-y-4 text-xs">
      <div className="flex justify-between items-center gap-3"><h3 className="font-bold text-slate-900 text-sm">{completing ? 'Hoàn tất bảo trì' : 'Bảo trì phòng'} {room.number}</h3><button type="button" aria-label="Đóng" disabled={busy} onClick={onClose}><X className="w-4 h-4" /></button></div>
      {error && <p role="alert" className="p-3 rounded-xl bg-rose-50 text-rose-700">{error}</p>}
      {completing ? <p className="text-slate-600">Xử lý phiếu bảo trì #{room.maintenanceRequestId || 'chưa xác định'}. Phòng chỉ mở lại khi máy chủ xác nhận phiếu đã hoàn tất hoặc hủy.</p> : <>
        <div><label htmlFor="maintenance-title" className="block font-bold mb-1">Tiêu đề <span className="text-rose-700">*</span></label><input id="maintenance-title" required value={title} onChange={event => setTitle(event.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
        <div><label htmlFor="maintenance-description" className="block font-bold mb-1">Mô tả <span className="text-rose-700">*</span></label><textarea id="maintenance-description" required rows={4} value={description} onChange={event => setDescription(event.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl" /></div>
        <p className="text-slate-500">Phòng trống sẽ ngừng nhận đặt cọc đến khi phiếu bảo trì hoàn tất hoặc hủy.</p>
      </>}
      <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-100">
        {completing && <button type="button" disabled={busy || !room.maintenanceRequestId} onClick={event => submit(event, 'CANCELLED')} className="px-3 py-2 bg-rose-500/10 text-rose-700 font-bold rounded-xl disabled:opacity-50">Hủy phiếu bảo trì</button>}
        <button type="submit" disabled={busy || (completing && !room.maintenanceRequestId)} className="px-3 py-2 bg-purple-600 text-white font-bold rounded-xl disabled:opacity-50">{busy ? 'Đang xử lý…' : completing ? 'Hoàn tất bảo trì' : 'Tạo phiếu bảo trì'}</button>
      </div>
    </form>
  </Modal>;
}
