import Modal from '../shared/Modal.jsx';

export default function ResidenceStatusModal({ addRoomMember, contracts, residenceError, savingResidence, setResidenceError, setSavingResidence, setStatusChangeModal, setStatusChangeSelected, statusChangeModal, statusChangeSelected, updateTemporaryResidence }) {
  return (<Modal isOpen={!!statusChangeModal} onClose={() => { if (!savingResidence) setStatusChangeModal(null); }} maxWidth="max-w-md">
        <h2 className="font-bold mb-3">Cập nhật tạm trú · {statusChangeModal?.fullName}</h2>
        {residenceError && <p role="alert" className="text-red-600">{residenceError}</p>}
        <form className="space-y-3" onSubmit={async event => {
          event.preventDefault();
          setSavingResidence(true); setResidenceError('');
          try {
            if (String(statusChangeModal.id).startsWith('T-')) {
              const tenantId = Number(String(statusChangeModal.id).slice(2));
              const contract = contracts.find(item => item.tenantId === tenantId && item.status === 'ACTIVE');
              if (!contract) throw new Error('Không tìm thấy hợp đồng đang hoạt động.');
              await addRoomMember({ tenantId, roomId: contract.roomId, contractId: contract.id, roleInRoom: 'REPRESENTATIVE', temporaryResidenceStatus: statusChangeSelected });
            } else await updateTemporaryResidence(statusChangeModal.id, statusChangeSelected);
            setStatusChangeModal(null);
          } catch (error) { setResidenceError(error.message); }
          finally { setSavingResidence(false); }
        }}>
          <select aria-label="Trạng thái tạm trú" className="border rounded p-2 w-full" disabled={savingResidence} value={statusChangeSelected} onChange={event => setStatusChangeSelected(event.target.value)}>
            <option value="NOT_REGISTERED">Chưa đăng ký</option>
            <option value="PENDING_REGISTRATION">Chờ đăng ký</option>
            <option value="SUBMITTED">Đã nộp hồ sơ</option>
            <option value="REGISTERED">Đã đăng ký</option>
            <option value="APPROVED">Đã được cấp</option>
          </select>
          <button disabled={savingResidence} type="submit" className="border rounded px-3 py-2">{savingResidence ? 'Đang lưu…' : 'Lưu trạng thái'}</button>
        </form>
      </Modal>);
}
