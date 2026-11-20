import React, { useRef, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { findRoommateSponsor, missingSponsorMessage } from '../../services/roommateWorkflow';

export default function WorkflowReviewPanel({ type, onOpenRentalRequests }) {
  const { roommateRequestsV2 = [], meterDisputes = [], rooms = [], contracts = [], roomMembers = [], loading, reviewRoommateRequest, resolveMeterDispute } = useData();
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState({});
  const roommates = type === 'roommates';
  const rows = (roommates ? roommateRequestsV2 : meterDisputes).filter(row => row.status === 'PENDING');
  const review = async (row, approved) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true); setError('');
    try {
      if (roommates) await reviewRoommateRequest(row.id, approved, notes[row.id] || '');
      else await resolveMeterDispute(row.id, approved ? 'RESOLVED' : 'REJECTED', notes[row.id] || '');
    } catch (failure) { setError(failure.message); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <section className="p-4 border rounded-xl bg-white space-y-3">
    <h2 className="font-bold">{roommates ? 'Duyệt yêu cầu ở ghép' : 'Xử lý khiếu nại chỉ số'}</h2>
    {roommates && onOpenRentalRequests && <p className="text-sm text-slate-600">Ở ghép là thêm người vào phòng đang thuê. Để duyệt đặt cọc, <button type="button" className="font-semibold text-violet-700 underline underline-offset-2" onClick={onOpenRentalRequests}>xem đơn thuê / đặt cọc</button>.</p>}
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {!rows.length && <p className="text-sm text-slate-500">Không có yêu cầu chờ xử lý.</p>}
    {rows.map(row => <div key={row.id} className="border-t pt-3 space-y-2">
      <p>Phòng {rooms.find(room => room.id === row.roomId)?.number || row.roomId} · {row.fullName || row.tenantName}</p>
      {!roommates && <p>{row.recordedPeriod} · {row.meterType} · Chỉ số hệ thống: {row.systemReading} · Khách báo: {row.reportedReading}</p>}
      <p className="text-sm">{row.note}</p>
      {roommates && !loading && !findRoommateSponsor(contracts, roomMembers, row) && <p className="text-sm text-amber-800" role="note">{missingSponsorMessage}</p>}
      <input aria-label="Ghi chú xử lý" className="border rounded px-3 py-2" value={notes[row.id] || ''} onChange={event => setNotes(current => ({ ...current, [row.id]: event.target.value }))} placeholder="Ghi chú xử lý" />
      <div className="flex gap-2">
        <button type="button" disabled={busy || loading || (roommates && !findRoommateSponsor(contracts, roomMembers, row))} className="border rounded-lg px-3 py-2 bg-violet-600 text-white disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => review(row, true)}>{roommates ? 'Duyệt ở ghép' : 'Đã xử lý'}</button>
        <button type="button" disabled={busy || loading} className="border rounded-lg px-3 py-2 disabled:opacity-50" onClick={() => review(row, false)}>Từ chối</button>
      </div>
    </div>)}
  </section>;
}
