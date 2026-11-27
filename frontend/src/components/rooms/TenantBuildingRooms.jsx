import { useMemo, useState } from 'react';
import { Building2, MapPin, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../../shared/data/RentalDataContext';
import Modal from '../shared/Modal';
import { getHouseFullAddress } from '../../features/properties/property.presentation.js';
import { roomBelongsToProperty } from '../../features/properties/property.catalog.js';
import { getRoomResidents } from '../../features/tenants/tenant-residency.js';
import RoommateRequestModal from '../contracts/RoommateRequestModal';
import { getRoomImage } from '../../features/rooms/room.presentation.js';

const statuses = {
  AVAILABLE: 'Còn trống', OCCUPIED: 'Đang ở', HOLDING: 'Đang giữ chỗ',
  LOCKED: 'Đã khóa', MAINTENANCE: 'Bảo trì',
};
const statusLabel = (room, residents) => residents.length ? statuses.OCCUPIED : statuses[room.status] || 'Chưa cập nhật';

export default function TenantBuildingRooms({ residency }) {
  const { tenants, contracts, roomMembers } = useData();
  const { communityRooms, communityHouses, rentedRooms, activeContracts, currentTenant } = residency;
  const [search, setSearch] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [rentalAction, setRentalAction] = useState(null);
  const [actionRoomId, setActionRoomId] = useState(null);
  const residentsByRoom = useMemo(() => new Map(communityRooms.map(room => [room.id,
    getRoomResidents(room.id, { tenants, contracts, roomMembers }),
  ])), [communityRooms, tenants, contracts, roomMembers]);
  const filteredRooms = communityRooms.filter(room => {
    const query = search.trim().toLowerCase();
    return [room.number, room.buildingName, room.floor, ...(residentsByRoom.get(room.id) || []).map(resident => resident.name)]
      .some(value => String(value || '').toLowerCase().includes(query));
  });
  const selectedRoom = communityRooms.find(room => String(room.id) === String(selectedRoomId)) || null;
  const selectedResidents = selectedRoom ? residentsByRoom.get(selectedRoom.id) || [] : [];
  const actionRoom = rentedRooms.find(room => String(room.id) === String(actionRoomId)) || rentedRooms[0];
  const actionContract = activeContracts.find(contract => String(contract.roomId) === String(actionRoom?.id));

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 mb-1">
            <Building2 className="w-4 h-4" /> Cộng đồng cư dân
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Phòng chung tòa</h1>
          <p className="text-sm text-slate-500 mt-1">Xem các phòng và làm quen với những người hàng xóm trong tòa bạn đang ở.</p>
        </div>
        {actionRoom && actionContract && (
          <div className="flex items-center gap-2 flex-wrap">
            {rentedRooms.length > 1 && (
              <select aria-label="Phòng đang thuê cần thao tác" value={actionRoom.id} onChange={event => setActionRoomId(event.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white">
                {rentedRooms.map(room => <option key={room.id} value={room.id}>{room.house} · {room.number}</option>)}
              </select>
            )}
            <button onClick={() => setRentalAction('ROOMMATE')} className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 cursor-pointer">Tìm bạn ở ghép</button>
            <Link to="/" className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200">Quản lý phòng đang thuê</Link>
          </div>
        )}
      </header>

      <div className="space-y-3">
        {communityHouses.map(house => (
          <div key={house.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900">{house.name}</h2>
              <p className="flex items-start gap-1.5 text-xs text-slate-500 mt-1"><MapPin className="w-3.5 h-3.5 shrink-0" />{getHouseFullAddress(house)}</p>
            </div>
            <span className="text-xs text-purple-700 font-bold shrink-0">{communityRooms.filter(room => roomBelongsToProperty(room, house)).length} phòng chung tòa</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700">{filteredRooms.length} phòng · Phòng của bạn được đánh dấu</p>
        <input aria-label="Tìm phòng hoặc cư dân" placeholder="Tìm phòng, tầng hoặc tên cư dân..." value={search} onChange={event => setSearch(event.target.value)} className="w-full sm:w-80 border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRooms.map(room => {
          const mine = rentedRooms.some(rented => String(rented.id) === String(room.id));
          const residents = residentsByRoom.get(room.id) || [];
          return (
            <article key={room.id} className={`bento-card overflow-hidden flex flex-col bg-white ${mine ? 'border-emerald-300' : 'border-slate-200'}`}>
              <img src={room.image || getRoomImage(room)} alt={`Phòng ${room.number}`} loading="lazy" className="h-40 w-full object-cover" />
              <div className="p-4 flex flex-col flex-1 gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{room.number}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{room.house} · {room.buildingName} · {room.floor}</p>
                  </div>
                  {mine && <span className="text-[11px] px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold shrink-0">Phòng của bạn</span>}
                </div>
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="text-slate-600">{statusLabel(room, residents)} · {room.area} m²</span>
                  <span className="text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" />{residents.length} cư dân</span>
                </div>
                <p className="text-sm text-slate-600 flex-1">{residents.length ? residents.map(resident => resident.name).join(', ') : 'Chưa có cư dân đang ở.'}</p>
                <button onClick={() => setSelectedRoomId(room.id)} className="w-full text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 px-3 py-2 cursor-pointer">Xem cư dân & thông tin phòng</button>
              </div>
            </article>
          );
        })}
        {!filteredRooms.length && (
          <p className="col-span-full bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">
            {communityRooms.length ? 'Không tìm thấy phòng hoặc cư dân phù hợp.' : 'Chưa có thông tin phòng trong tòa đang thuê. Vui lòng tải lại dữ liệu hoặc liên hệ quản lý.'}
          </p>
        )}
      </div>

      {selectedRoom && (
        <Modal isOpen onClose={() => setSelectedRoomId(null)} maxWidth="max-w-lg">
          <section role="dialog" aria-modal="true" aria-labelledby="building-room-title" className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="building-room-title" className="text-lg font-bold text-slate-900">Phòng {selectedRoom.number}</h2>
                <p className="text-xs text-slate-500 mt-1">{selectedRoom.house} · {selectedRoom.buildingName} · {selectedRoom.floor}</p>
              </div>
              <button aria-label="Đóng thông tin phòng" onClick={() => setSelectedRoomId(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <img src={selectedRoom.image || getRoomImage(selectedRoom)} alt={`Phòng ${selectedRoom.number}`} className="h-44 w-full object-cover rounded-xl" />
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 rounded-xl p-3">
              <p>Diện tích: <strong>{selectedRoom.area} m²</strong></p>
              <p>Sức chứa: <strong>{selectedRoom.maxOccupants || 'Chưa cập nhật'} người</strong></p>
              <p className="col-span-2">Trạng thái: <strong>{statusLabel(selectedRoom, selectedResidents)}</strong></p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Cư dân đang ở ({selectedResidents.length})</h3>
              {selectedResidents.length ? (
                <ul className="divide-y divide-slate-100">
                  {selectedResidents.map(resident => (
                    <li key={resident.tenantId} className="py-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-800">{resident.name}{String(resident.tenantId) === String(currentTenant?.id) ? ' (Bạn)' : ''}</span>
                      <span className="text-xs text-slate-500 shrink-0">{resident.role === 'REPRESENTATIVE' ? 'Đại diện phòng' : 'Thành viên'}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-500">Chưa có cư dân đang ở.</p>}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Tiện ích</h3>
              <div className="flex flex-wrap gap-2 text-xs text-purple-700">{(selectedRoom.amenities || []).map(amenity => <span key={amenity} className="bg-purple-50 border border-purple-100 rounded-lg px-2.5 py-1">{amenity}</span>)}</div>
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-3"><button onClick={() => setSelectedRoomId(null)} className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer">Đóng</button></div>
          </section>
        </Modal>
      )}
      {actionRoom && actionContract && <RoommateRequestModal key={`${currentTenant?.id}:${actionRoom.id}`} isOpen={rentalAction === 'ROOMMATE'} onClose={() => setRentalAction(null)} userRoom={actionRoom} requestedByTenantId={currentTenant?.id} />}
    </div>
  );
}
