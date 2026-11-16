import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';

export default function WorkflowReviewPanel({ type }) {
  const { roommateRequestsV2 = [], meterDisputes = [], rooms = [], reviewRoommateRequest, resolveMeterDispute } = useData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState({});
  const roommates = type === 'roommates';
  const rows = (roommates ? roommateRequestsV2 : meterDisputes).filter(row => row.status === 'PENDING');
  const review = async (row, approved) => {
    setBusy(true); setError('');
    try {
      if (roommates) await reviewRoommateRequest(row.id, approved, notes[row.id] || '');
      else await resolveMeterDispute(row.id, approved ? 'RESOLVED' : 'REJECTED', notes[row.id] || '');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <section className="p-4 border rounded-xl bg-white space-y-3">
    <h2 className="font-bold">{roommates ? 'Duyệt yêu cầu ở ghép' : 'Xử lý khiếu nại chỉ số'}</h2>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {!rows.length && <p className="text-sm text-slate-500">Không có yêu cầu chờ xử lý.</p>}
    {rows.map(row => <div key={row.id} className="border-t pt-3 space-y-2">
      <p>Phòng {rooms.find(room => room.id === row.roomId)?.number || row.roomId} · {row.fullName || row.tenantName}</p>
      {!roommates && <p>{row.recordedPeriod} · {row.meterType} · Chỉ số hệ thống: {row.systemReading} · Khách báo: {row.reportedReading}</p>}
      <p className="text-sm">{row.note}</p>
      <input aria-label="Ghi chú xử lý" className="border rounded px-3 py-2" value={notes[row.id] || ''} onChange={event => setNotes(current => ({ ...current, [row.id]: event.target.value }))} placeholder="Ghi chú xử lý" />
      <div className="flex gap-2">
        <button type="button" disabled={busy} className="border rounded px-3 py-1" onClick={() => review(row, true)}>{roommates ? 'Duyệt ở ghép' : 'Đã xử lý'}</button>
        <button type="button" disabled={busy} className="border rounded px-3 py-1" onClick={() => review(row, false)}>Từ chối</button>
      </div>
    </div>)}
  </section>;
}
