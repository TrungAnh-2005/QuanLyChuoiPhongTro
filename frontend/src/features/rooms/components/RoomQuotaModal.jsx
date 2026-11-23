import Modal from '../../../shared/ui/Modal.jsx';
import { ShieldAlert } from 'lucide-react';

export default function RoomQuotaModal({ landlordPackage, maxRoomsAllowed, quotaExceededModal, setQuotaExceededModal, staffRooms }) {
  return (<Modal isOpen={quotaExceededModal} onClose={() => setQuotaExceededModal(false)} maxWidth="max-w-md">
          <div className="text-center p-2 text-xs space-y-3">
            <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Vượt Quá Giới Hạn Gói Cước ({landlordPackage})</h3>
            <p className="text-slate-500">
              Gói hiện tại chỉ cho phép tối đa <strong>{maxRoomsAllowed} phòng</strong>. Bạn đã đạt <strong>{staffRooms.length} phòng</strong>. Vui lòng nâng cấp gói cước SaaS để thêm phòng.
            </p>
            <button
              onClick={() => {
                setQuotaExceededModal(false);
                window.location.href = '/invoices/saas';
              }}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl"
            >
              Nâng Cấp Gói Bản Quyền SaaS
            </button>
          </div>
        </Modal>);
}
