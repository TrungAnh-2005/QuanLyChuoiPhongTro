import { useMemo, useRef, useState } from 'react';
import { X, Wrench, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import Modal from '../shared/Modal.jsx';
import { useData } from '../../shared/data/RentalDataContext';

const STATUS_BADGE = {
  PENDING: { label: 'Chờ tiếp nhận', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  IN_PROGRESS: { label: 'Đang xử lý', cls: 'bg-purple-50 text-purple-800 border-purple-200' },
  RESOLVED: { label: 'Đã hoàn tất', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  COMPLETED: { label: 'Đã hoàn tất', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  REJECTED: { label: 'Từ chối', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const PRIORITY_BADGE = {
  URGENT: { label: 'Khẩn cấp', cls: 'bg-rose-50 text-rose-700' },
  HIGH: { label: 'Cao', cls: 'bg-orange-50 text-orange-700' },
  MEDIUM: { label: 'Bình thường', cls: 'bg-amber-50 text-amber-700' },
  LOW: { label: 'Thấp', cls: 'bg-slate-100 text-slate-600' },
};

export default function RoomMaintenanceModal({ room, onClose, onSuccess }) {
  const { createTicket, updateTicketStatus, completeRoomMaintenance, tickets = [] } = useData();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const completing = room.status === 'MAINTENANCE';

  const roomTickets = useMemo(() => {
    const list = (tickets || []).filter((t) => String(t.roomId) === String(room.id));
    return [...list].sort((a, b) => {
      if (room.maintenanceRequestId && String(a.id) === String(room.maintenanceRequestId)) return -1;
      if (room.maintenanceRequestId && String(b.id) === String(room.maintenanceRequestId)) return 1;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [tickets, room.id, room.maintenanceRequestId]);

  const activeTicket = useMemo(() => {
    if (room.maintenanceRequestId) {
      return roomTickets.find((t) => String(t.id) === String(room.maintenanceRequestId)) || null;
    }
    return roomTickets.find((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS') || null;
  }, [roomTickets, room.maintenanceRequestId]);

  const targetTicketId = room.maintenanceRequestId || activeTicket?.id || null;

  const submit = async (event, status = 'RESOLVED') => {
    event.preventDefault();
    if (inFlight.current) return;
    if (!completing && (!title.trim() || !description.trim())) {
      setError('Nhập tiêu đề và mô tả bảo trì.');
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      if (completing) {
        if (targetTicketId) {
          await updateTicketStatus(targetTicketId, status);
          if (!room.maintenanceRequestId && status === 'RESOLVED' && completeRoomMaintenance) {
            await completeRoomMaintenance(room.id);
          }
        } else if (completeRoomMaintenance) {
          await completeRoomMaintenance(room.id);
        } else {
          throw new Error('Không tìm thấy phiếu bảo trì hoặc lệnh mở lại phòng.');
        }
      } else {
        await createTicket({
          roomId: room.id,
          title: title.trim(),
          description: description.trim(),
          blocksRental: true,
        });
      }
      onSuccess(
        completing
          ? status === 'CANCELLED'
            ? `Đã hủy bảo trì và mở lại phòng ${room.number}.`
            : `Đã hoàn tất bảo trì và mở lại phòng ${room.number} (Đang mở / Còn trống).`
          : `Đã tạo phiếu và chuyển phòng ${room.number} sang Đang bảo trì.`
      );
      onClose();
    } catch (failure) {
      setError(failure.message || 'Không thể cập nhật bảo trì. Vui lòng thử lại.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={() => { if (!busy) onClose(); }} maxWidth="max-w-lg">
      <form onSubmit={submit} className="space-y-4 text-xs">
        <div className="flex justify-between items-center gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${completing ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {completing ? <CheckCircle2 className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {completing ? `Hoàn tất bảo trì ${room.number}` : `Đưa phòng ${room.number} vào bảo trì`}
              </h3>
              <p className="text-[11px] text-slate-500">
                {completing
                  ? 'Kiểm tra phiếu yêu cầu sửa chữa & xác nhận mở lại phòng về trạng thái Trống'
                  : 'Tạo phiếu bảo trì và tạm ngừng nhận đặt cọc cho phòng trống này'}
              </p>
            </div>
          </div>
          <button type="button" aria-label="Đóng" disabled={busy} onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {completing ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <span>Phiếu yêu cầu sửa chữa / bảo trì của phòng {room.number} ({roomTickets.length})</span>
              {targetTicketId && <span className="font-mono text-purple-700">Phiếu #{targetTicketId}</span>}
            </div>

            {roomTickets.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
                Phòng đang ở trạng thái <strong>Bảo trì</strong> nhưng chưa có phiếu sửa chữa liên kết. Bạn vẫn có thể bấm <strong>Hoàn tất bảo trì</strong> bên dưới để mở lại phòng về trạng thái Trống.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {roomTickets.map((ticket) => {
                  const st = STATUS_BADGE[ticket.status] || { label: ticket.status, cls: 'bg-slate-100 text-slate-700 border-slate-200' };
                  const pr = PRIORITY_BADGE[ticket.priority] || PRIORITY_BADGE.MEDIUM;
                  const isLinked = String(ticket.id) === String(targetTicketId);
                  return (
                    <div
                      key={ticket.id}
                      className={`p-3 rounded-xl border space-y-1.5 ${
                        isLinked ? 'bg-purple-50/40 border-purple-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800">{ticket.ticketCode || `#${ticket.id}`}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pr.cls}`}>{pr.label}</span>
                          {isLinked && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                              Đang xử lý
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900">{ticket.title || 'Yêu cầu bảo trì'}</div>
                      {ticket.description && <p className="text-slate-600 leading-relaxed">{ticket.description}</p>}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>{ticket.tenant ? `Người báo: ${ticket.tenant}` : 'Phiếu bảo trì phòng trống (Staff)'}</span>
                        {ticket.date && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(ticket.date).toLocaleString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-slate-500 text-[11px]">
              Khi bấm <strong>Hoàn tất bảo trì</strong>, phiếu sửa chữa (nếu còn mở) sẽ chuyển sang <strong>Đã hoàn tất</strong> và phòng sẽ tự động mở lại trạng thái <strong>Còn trống (Đang mở)</strong>.
            </p>
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="maintenance-title" className="block font-bold mb-1">
                Tiêu đề <span className="text-rose-700">*</span>
              </label>
              <input
                id="maintenance-title"
                required
                placeholder="Ví dụ: Sơn lại tường, kiểm tra điều hòa..."
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label htmlFor="maintenance-description" className="block font-bold mb-1">
                Mô tả <span className="text-rose-700">*</span>
              </label>
              <textarea
                id="maintenance-description"
                required
                rows={4}
                placeholder="Mô tả chi tiết hạng mục cần bảo trì..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
            <p className="text-slate-500">Phòng trống sẽ ngừng nhận đặt cọc đến khi phiếu bảo trì hoàn tất hoặc hủy.</p>
          </>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-100">
          {completing && targetTicketId && (
            <button
              type="button"
              disabled={busy}
              onClick={(event) => submit(event, 'CANCELLED')}
              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 font-bold rounded-xl cursor-pointer disabled:opacity-50"
            >
              Hủy phiếu bảo trì
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
          >
            {busy ? 'Đang xử lý…' : completing ? 'Hoàn tất bảo trì & Mở phòng' : 'Tạo phiếu bảo trì'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
