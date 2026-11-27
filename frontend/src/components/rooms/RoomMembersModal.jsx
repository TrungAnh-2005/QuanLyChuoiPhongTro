import Modal from '../shared/Modal.jsx';
import { X } from 'lucide-react';
import RoomMemberActions from '../tenants/RoomMemberActions.jsx';

export default function RoomMembersModal({ selectedRoomForMembers, setSelectedRoomForMembers }) {
  return (<Modal isOpen={!!selectedRoomForMembers} onClose={() => setSelectedRoomForMembers(null)} maxWidth="max-w-md">
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Hồ Sơ Cư Dân Phòng {selectedRoomForMembers.number}</h3>
              <button onClick={() => setSelectedRoomForMembers(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <RoomMemberActions key={selectedRoomForMembers.id} room={selectedRoomForMembers} />
          </div>
        </Modal>);
}
