import RoomCard from '../../../components/rooms/RoomCard.jsx';
import { roomBelongsToProperty } from '../../properties/property.catalog.js';
import { filterManagedProperties } from '../../properties/property.rules.js';
import RoomFormModal from '../../../components/rooms/RoomFormModal.jsx';
import ResidentRequestsModal from '../../../components/rooms/ResidentRequestsModal.jsx';
import RoomMembersModal from '../../../components/rooms/RoomMembersModal.jsx';
import RoomQuotaModal from '../../../components/rooms/RoomQuotaModal.jsx';
import RoomMaintenanceModal from '../../../components/rooms/RoomMaintenanceModal.jsx';
import { useReservationRefresh } from '../useReservationRefresh.js';
import { groupRoomsByProperty } from '../room.presentation.js';

import { healBoardingHousesList } from '../../properties/property.repair.js';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Building2, FileText, CheckCircle2 } from "lucide-react";
import { useAuth } from '../../auth/AuthContext';
import { useData } from '../../../shared/data/RentalDataContext';

import MoveOutSettlementModal from '../../../components/contracts/MoveOutSettlementModal';
import TrialExpiryBanner from '../../../components/subscriptions/TrialExpiryBanner';

import { isRoomLocked, hasRoomOccupants } from '../room.rules.js';

const isZeroSandbox = true;

export default function StaffRoomsPage() {
  const {boardingHouses:apiBoardingHouses=[]}=useData() || {};

  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawParam = searchParams.get('house') || 'ALL';

  const {
    rooms = [],
    addRoom,
    updateRoom,
    deleteRoom,
    updateRoomStatus,
    roomRequests = [],
    approveRoomRequest,
    rejectRoomRequest,
    confirmRoomRequestDeposit,
    cancelRentalRequest,
    roomMembers = [],
    contracts = [],
    moveOutSettlements = [],
    roommateRequestsV2 = [],
    landlords = []
  } = useData();

  const [storedBoardingHouses, setStoredBoardingHouses] = useState(() => {
    try {
      const saved = JSON.stringify(apiBoardingHouses);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return healBoardingHousesList(parsed);
      }
    } catch {}
    return isZeroSandbox ? [] : [
      { id: 1, code: 'CS-01', name: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', managerUsername: 'staff', createdBy: 'staff', status: 'ACTIVE', floors: 4 },
      { id: 2, code: 'CS-02', name: 'Nhà Trọ Bách Khoa - Cơ Sở 2', managerUsername: 'staff2', createdBy: 'staff2', status: 'ACTIVE', floors: 4 },
      { id: 3, code: 'CS-03', name: 'Nhà Trọ Đống Đa - Cơ Sở 3', managerUsername: 'admin', createdBy: 'admin', status: 'ACTIVE', floors: 6 }
    ];
  });
  useEffect(()=>{setStoredBoardingHouses(apiBoardingHouses);},[apiBoardingHouses]);


  useEffect(() => {
    const handleSyncHouses = () => {
      try {
        const saved = JSON.stringify(apiBoardingHouses);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setStoredBoardingHouses(healBoardingHousesList(parsed));
        }
      } catch {}
    };
    window.addEventListener('rental:data-loaded', handleSyncHouses);
    return () => window.removeEventListener('rental:data-loaded', handleSyncHouses);
  }, [apiBoardingHouses]);

  const currentLandlord = useMemo(() => {
    if (!user) return null;
    return (landlords || []).find(
      (l) => l.username === user.username || l.fullName === user.fullName
    ) || (landlords && landlords.length > 0 ? landlords[0] : null);
  }, [user, landlords]);

  const landlordPackage = currentLandlord?.packageCode || 'BASIC';
  const maxRoomsAllowed = landlordPackage === 'ENTERPRISE' ? 9999 : landlordPackage === 'PRO' ? 100 : 30;

  // Lọc cơ sở mà Staff có thẩm quyền
  const staffManageableHouses = useMemo(() => {
    const approvedHouses = storedBoardingHouses.filter(house => house.status !== 'PENDING_APPROVAL');
    return user?.role === 'ADMIN' ? approvedHouses : filterManagedProperties(approvedHouses, user);
  }, [storedBoardingHouses, user]);

  const staffHouseCodes = useMemo(() => staffManageableHouses.map((h) => h.code), [staffManageableHouses]);

  const selectedProperty = staffManageableHouses.find(house => house.code === rawParam);
  const selectedHouse = selectedProperty?.code || 'ALL';

  const setSelectedHouse = (code) => {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      if (code === 'ALL') next.delete('house');
      else next.set('house', code);
      return next;
    });
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals state
  const [roomEditor, setRoomEditor] = useState(null);
  const editingRoom = roomEditor?.room;
  const [showRequestsManager, setShowRequestsManager] = useState(false);
  const [requestRoomFilter, setRequestRoomFilter] = useState(null);
  const [maintenanceRoom, setMaintenanceRoom] = useState(null);
  const [selectedRoomForMembers, setSelectedRoomForMembers] = useState(null);
  const [activeSettlementModal, setActiveSettlementModal] = useState(null);
  const [quotaExceededModal, setQuotaExceededModal] = useState(false);
  const [actionToast, setActionToast] = useState(null);
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const reviewInFlight = useRef(false);
  const reviewResidentRequest = async (req, approved) => {
    if (reviewInFlight.current) return;
    reviewInFlight.current = true;
    setReviewingRequest(req.id);
    try {
      if (approved) await approveRoomRequest(req.id);
      else await rejectRoomRequest(req.id);
    } catch { /* ApiStatus shows the failed mutation and its server message. */ }
    finally { reviewInFlight.current = false; setReviewingRequest(null); }
  };

  // Lọc phòng thuộc quyền quản lý
  const staffRooms = useMemo(() => {
    if (user?.role === 'ADMIN') return rooms;
    return rooms.filter(room => staffManageableHouses.some(house => roomBelongsToProperty(room, house)));
  }, [rooms, staffManageableHouses, user?.role]);
  useReservationRefresh(staffRooms.some(room => room.status === 'HOLDING'));
  const manageableRequests = useMemo(() => roomRequests.filter(req => user?.role === 'ADMIN' || staffHouseCodes.includes(req.houseCode)), [roomRequests, staffHouseCodes, user?.role]);
  const managerRequests = requestRoomFilter ? manageableRequests.filter(req => String(req.targetRoomId) === String(requestRoomFilter.id)) : manageableRequests;

  const filteredRooms = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return staffRooms.filter(room => {
      if (selectedProperty && !roomBelongsToProperty(room, selectedProperty)) return false;
      if (filterStatus !== 'ALL' && room.status !== filterStatus) return false;
      return !query || [room.number, room.house, room.houseCode]
        .some(value => String(value ?? '').toLowerCase().includes(query));
    });
  }, [staffRooms, selectedProperty, filterStatus, searchTerm]);

  const propertyGroups = useMemo(
    () => groupRoomsByProperty(filteredRooms, staffManageableHouses),
    [filteredRooms, staffManageableHouses],
  );

  const pendingRequestsCount = useMemo(() => {
    const reqCount = (roomRequests || []).filter((req) => {
      if (!['PENDING', 'HOLDING'].includes(req.status)) return false;
      if (user?.role === 'ADMIN') return true;
      return staffHouseCodes.includes(req.houseCode);
    }).length;
    const settlementCount = (moveOutSettlements || []).filter((item) => item.refundStatus !== 'COMPLETED').length;
    const roommateCount = (roommateRequestsV2 || []).filter((row) => row.status === 'PENDING').length;
    return reqCount + settlementCount + roommateCount;
  }, [roomRequests, moveOutSettlements, roommateRequestsV2, staffHouseCodes, user?.role]);

  const handleOpenAddModal = () => {
    if (staffRooms.length >= maxRoomsAllowed) {
      setQuotaExceededModal(true);
      return;
    }
    setRoomEditor({ room: null, houseCode: selectedHouse });
  };

  const handleDeleteRoom = async (roomId, roomNumber) => {
try {

    if (window.confirm(`Bạn có chắc chắn muốn xóa phòng ${roomNumber} không?`)) {
      if (deleteRoom) await deleteRoom(roomId);
      setActionToast(`Đã xóa phòng ${roomNumber} thành công!`);
      setTimeout(() => setActionToast(null), 3000);
    }

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
};

  const handleToggleRoomLock = async (room) => {
try {

    const nextStatus = isRoomLocked(room) ? 'AVAILABLE' : 'LOCKED';
    if (updateRoomStatus) await updateRoomStatus(room.id, nextStatus);
    setActionToast(`Đã ${nextStatus === 'LOCKED' ? 'tạm khóa' : 'mở khóa'} phòng ${room.number}!`);
    setTimeout(() => setActionToast(null), 3000);

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
};

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      <TrialExpiryBanner
        currentLandlord={currentLandlord}
        onUpgradeClick={() => {
          window.location.href = '/invoices/saas';
        }}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Sơ Đồ Phòng Cơ Sở Nhà Trọ</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản Lý Phòng & Sơ Đồ Tầng ({staffRooms.length} Phòng)
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">
            Thiết lập giá thuê, tiện ích, trạng thái phòng và duyệt các đơn yêu cầu cọc/ghép/trả phòng từ cư dân.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => { setRequestRoomFilter(null); setShowRequestsManager(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-purple-300 hover:text-purple-700 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all btn-press cursor-pointer relative"
          >
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Đơn cư dân & đặt cọc</span>
            {pendingRequestsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                {pendingRequestsCount} mới
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/25 transition-all btn-press cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Phòng Mới</span>
          </button>
        </div>
      </div>

      {actionToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionToast}</span>
          </div>
          <button onClick={() => setActionToast(null)}>✕</button>
        </div>
      )}

      {/* House selector tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 text-xs font-bold">
        {[
          { code: 'ALL', label: `🏢 Toàn Bộ Cơ Sở (${staffRooms.length})` },
          ...staffManageableHouses.map((h) => ({
            code: h.code,
            label: `🏠 ${h.name} (${staffRooms.filter(room => roomBelongsToProperty(room, h)).length})`
          }))
        ].map((house) => (
          <button
            key={house.code}
            type="button"
            aria-pressed={selectedHouse === house.code}
            onClick={() => setSelectedHouse(house.code)}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              selectedHouse === house.code
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-600 hover:text-purple-700 hover:bg-white/60'
            }`}
          >
            <span>{house.label}</span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {[
            { id: 'ALL', label: 'Tất Cả' },
            { id: 'AVAILABLE', label: '🟢 Trống' },
            { id: 'OCCUPIED', label: '🟣 Đang Thuê' },
            { id: 'HOLDING', label: 'Đặt cọc' },
            { id: 'MAINTENANCE', label: '🟡 Bảo Trì' },
            { id: 'LOCKED', label: '🔴 Tạm Khóa' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                filterStatus === st.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Tìm theo số phòng hoặc cơ sở"
            placeholder="Tìm phòng hoặc cơ sở..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-purple-500 font-medium"
          />
        </div>
      </div>

      {/* Rooms grouped by property and floor */}
      <div className="space-y-6">
        {propertyGroups.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-600 text-sm">
            {searchTerm.trim() || filterStatus !== 'ALL'
              ? 'Không có phòng phù hợp với bộ lọc.'
              : selectedProperty ? `${selectedProperty.name} chưa có phòng.` : 'Chưa có phòng để hiển thị.'}
          </div>
        ) : (
          propertyGroups.map(({ key, code, name, roomCount, floors }) => (
            <section key={key} className="rounded-2xl border border-slate-200 bg-slate-50/70">
              <header className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-t-2xl border-b border-slate-200 bg-white px-4 py-3.5 sm:px-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-purple-50 text-purple-700">
                  <Building2 className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="wrap-break-word text-base font-bold text-slate-900">{name}</h2>
                  {code && code !== name && <p className="text-xs text-slate-600">{code}</p>}
                </div>
                <span className="shrink-0 text-sm font-medium text-slate-600">{roomCount} phòng</span>
              </header>

              <div className="space-y-5 p-3 sm:p-5">
                {floors.map(([floorName, floorRooms]) => (
                  <div key={floorName} className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      {floorName}
                      <span className="text-xs font-medium text-slate-600">· {floorRooms.length} phòng</span>
                    </h3>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {floorRooms.map((room) => {
                        const occupantIds = new Set([
                          ...roomMembers.filter(m => m.roomId === room.id && m.status !== 'MOVED_OUT').map(m => m.tenantId),
                          ...contracts.filter(c => c.roomId === room.id && c.status === 'ACTIVE').map(c => c.tenantId),
                        ]);
                        const occupied = hasRoomOccupants(room, contracts, roomMembers);

                        return (
                          <RoomCard
                            key={room.id}
                            handleDeleteRoom={handleDeleteRoom}
                            handleToggleRoomLock={handleToggleRoomLock}
                            occupantsCount={occupantIds.size}
                            occupied={occupied}
                            room={room}
                            onEdit={room => setRoomEditor({ room })}
                            setSelectedRoomForMembers={setSelectedRoomForMembers}
                            onMaintenance={setMaintenanceRoom}
                            onManageHold={target => { setRequestRoomFilter(target); setShowRequestsManager(true); }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Modal Thêm / Sửa Phòng */}
      {roomEditor && (
        <RoomFormModal
          editingRoom={editingRoom}
          editingRoomOccupied={editingRoom ? hasRoomOccupants(editingRoom, contracts, roomMembers) : false}
          initialHouseCode={roomEditor.houseCode}
          onSave={editingRoom ? input => updateRoom(editingRoom.id, input) : addRoom}
          onClose={() => setRoomEditor(null)}
          onStartMaintenance={setMaintenanceRoom}
          staffManageableHouses={staffManageableHouses}
        />
      )}

      {/* Modal Duyệt Đơn Yêu Cầu Cư Dân */}
      {showRequestsManager && (
        <ResidentRequestsModal
          pendingRequestsCount={pendingRequestsCount}
          reviewResidentRequest={reviewResidentRequest}
          reviewingRequest={reviewingRequest}
          roomRequests={managerRequests}
          confirmRoomRequestDeposit={confirmRoomRequestDeposit}
          cancelRentalRequest={cancelRentalRequest}
          approveRoomRequest={approveRoomRequest}
          moveOutSettlements={moveOutSettlements}
          onOpenSettlement={(item) => {
            setShowRequestsManager(false);
            setActiveSettlementModal(item);
          }}
          onSuccessToast={setActionToast}
          roomFilter={requestRoomFilter}
          onClearRoomFilter={() => setRequestRoomFilter(null)}
          setShowRequestsManager={setShowRequestsManager}
          showRequestsManager={showRequestsManager}
        />
      )}

      {maintenanceRoom && <RoomMaintenanceModal key={maintenanceRoom.id} room={rooms.find(room => room.id === maintenanceRoom.id) || maintenanceRoom} onClose={() => setMaintenanceRoom(null)} onSuccess={setActionToast} />}

      {/* Modal Hồ Sơ Khách & CCCD / Tạm Trú */}
      {selectedRoomForMembers && (
        <RoomMembersModal
          selectedRoomForMembers={selectedRoomForMembers}
          setSelectedRoomForMembers={setSelectedRoomForMembers}
        />
      )}

      {/* Modal Quota Exceeded */}
      {quotaExceededModal && (
        <RoomQuotaModal
          landlordPackage={landlordPackage}
          maxRoomsAllowed={maxRoomsAllowed}
          quotaExceededModal={quotaExceededModal}
          setQuotaExceededModal={setQuotaExceededModal}
          staffRooms={staffRooms}
        />
      )}

      <MoveOutSettlementModal isOpen={!!activeSettlementModal} onClose={()=>setActiveSettlementModal(null)} settlement={activeSettlementModal} room={rooms.find(item=>item.id===activeSettlementModal?.roomId)} contract={contracts.find(item=>item.id===activeSettlementModal?.contractId)} />
    </div>
  );
}
