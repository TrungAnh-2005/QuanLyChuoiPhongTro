import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';

export default function RoomMemberActions({ room }) {
  const { tenants = [], contracts = [], roomMembers = [], addRoomMember, removeRoomMember, updateTemporaryResidence } = useData();
  const [tenantId, setTenantId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const members = roomMembers.filter(member => member.roomId === room.id && member.status !== 'MOVED_OUT');
  const contract = contracts.find(item => item.roomId === room.id && item.status === 'ACTIVE');
  const perform = async action => {
    setBusy(true); setError('');
    try { await action(); setTenantId(''); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <div className="space-y-3">
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {members.map(member => <div key={member.id} className="border rounded p-3 space-y-2">
      <p className="font-bold">{member.fullName} · {member.roleInRoom === 'REPRESENTATIVE' ? 'Đại diện hợp đồng' : 'Ở ghép'}</p>
      <p>SĐT: {tenants.find(tenant => tenant.id === member.tenantId)?.phone || 'Chưa cung cấp'} · CCCD: {member.cccd || 'Chưa cung cấp'}</p>
      <label>Tạm trú
        <select aria-label={`Tạm trú của ${member.fullName}`} disabled={busy} value={member.temporaryResidenceStatus || 'NOT_REGISTERED'} onChange={event => perform(() => updateTemporaryResidence(member.id, event.target.value))} className="border rounded p-1 ml-2">
          <option value="NOT_REGISTERED">Chưa đăng ký</option>
          <option value="PENDING_REGISTRATION">Chờ đăng ký</option>
          <option value="REGISTERED">Đã đăng ký</option>
          <option value="SUBMITTED">Đã nộp hồ sơ</option>
          <option value="APPROVED">Đã được cấp</option>
        </select>
      </label>
      {member.roleInRoom === 'MEMBER' && <button type="button" disabled={busy} className="border rounded px-2 py-1" onClick={() => {
        if (window.confirm(`Xóa thành viên ${member.fullName} khỏi phòng?`)) perform(() => removeRoomMember(member.id));
      }}>Xóa thành viên</button>}
    </div>)}
    {contract && <form className="space-y-2" onSubmit={event => {
      event.preventDefault();
      perform(() => addRoomMember({ roomId: room.id, tenantId: Number(tenantId), contractId: contract.id }));
    }}>
      <select aria-label="Khách thuê cần thêm vào phòng" required disabled={busy} value={tenantId} onChange={event => setTenantId(event.target.value)} className="border rounded p-2 w-full">
        <option value="">Chọn khách thuê đã có hồ sơ</option>
        {tenants.filter(tenant => !roomMembers.some(member => member.tenantId === tenant.id && member.status !== 'MOVED_OUT')).map(tenant => <option key={tenant.id} value={tenant.id}>{tenant.fullName} · {tenant.phone}</option>)}
      </select>
      <button type="submit" disabled={busy || !tenantId} className="border rounded px-3 py-2">Thêm thành viên</button>
    </form>}
    {!contract && <p>Cần hợp đồng đang hoạt động để thêm thành viên.</p>}
  </div>;
}
