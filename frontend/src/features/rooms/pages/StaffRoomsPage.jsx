import RoomCard from '../components/RoomCard.jsx';
import RoomFormModal from '../components/RoomFormModal.jsx';
import ResidentRequestsModal from '../components/ResidentRequestsModal.jsx';
import RoomMembersModal from '../components/RoomMembersModal.jsx';
import RoomQuotaModal from '../components/RoomQuotaModal.jsx';
import { parseFloorNum } from '../room.presentation.js';
import { isDuplicateRoom } from '../room.rules.js';

import { healBoardingHousesList } from '../../properties/property.repair.js';

import WorkflowReviewPanel from '../../contracts/components/WorkflowReviewPanel';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Building2, FileText, CheckCircle2 } from "lucide-react";
import { useAuth } from '../../auth/AuthContext';
import { useData } from '../../../shared/data/RentalDataContext';

import MoveOutSettlementModal from '../../contracts/components/MoveOutSettlementModal';
import TrialExpiryBanner from '../../subscriptions/components/TrialExpiryBanner';

import { isRoomLocked, hasRoomOccupants } from '../room.rules.js';

const isZeroSandbox = true;

export default function StaffRoomsPage() {
  const {boardingHouses:apiBoardingHouses=[]}=useData() || {};

  const { user } = useAuth();
  const [searchParams] = useSearchParams();
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
    roomMembers = [],
    contracts = [],
    moveOutSettlements = [],
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
    if (user?.isTestMode || user?.role === 'ADMIN') return storedBoardingHouses;
    const u = (user?.username || '').toLowerCase();
    return storedBoardingHouses.filter((h) => { if(user?.isTestMode) return true;
      const created = (h.createdBy || '').toLowerCase();
      const manager = (h.managerUsername || '').toLowerCase();
      if (created && created === u) return true;
      if (manager && manager === u) return true;
      if (user?.houseCode && h.code === user.houseCode) return true;
      if (!isZeroSandbox) {
        if (u === 'staff' && (h.code === 'CS-01' || !h.createdBy)) return true;
        if (u === 'staff2' && h.code === 'CS-02') return true;
      }
      return false;
    });
  }, [storedBoardingHouses, user]);

  const staffHouseCodes = useMemo(() => staffManageableHouses.map((h) => h.code), [staffManageableHouses]);

  const [selectedHouse, setSelectedHouse] = useState(() => {
    if (rawParam !== 'ALL' && staffHouseCodes.includes(rawParam)) return rawParam;
    return 'ALL';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showRequestsManager, setShowRequestsManager] = useState(false);
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

  // Form thêm / sửa phòng
  const [roomFormData, setRoomFormData] = useState({
    number: '',
    houseCode: staffHouseCodes[0] || 'CS-01',
    floor: 'Tầng 1',
    price: 3500000,
    area: 25,
    maxOccupants: 2,
    status: 'AVAILABLE',
    amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'],
    image: '/assets/images/room_studio_1.jpg'
  });

  useEffect(()=>{ if(staffHouseCodes.length && !staffHouseCodes.includes(roomFormData.houseCode)) setRoomFormData(previous=>({...previous,houseCode:staffHouseCodes[0]})); },[staffHouseCodes,roomFormData.houseCode]);

  // Lọc phòng thuộc quyền quản lý
  const staffRooms = useMemo(() => {
    if (user?.role === 'ADMIN') return rooms;
    return rooms.filter((r) => staffHouseCodes.includes(r.houseCode));
  }, [rooms, staffHouseCodes, user?.role]);

  const filteredRooms = useMemo(() => {
    return staffRooms.filter((r) => {
      if (selectedHouse !== 'ALL' && r.houseCode !== selectedHouse) return false;
      if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchNum = r.number && r.number.toLowerCase().includes(q);
        const matchHouse = r.house && r.house.toLowerCase().includes(q);
        if (!matchNum && !matchHouse) return false;
      }
      return true;
    });
  }, [staffRooms, selectedHouse, filterStatus, searchTerm]);

  // Nhóm theo tầng
  const groupedByFloor = useMemo(() => {
    const map = new Map();
    filteredRooms.forEach((r) => {
      const fl = r.floor || 'Tầng 1';
      if (!map.has(fl)) map.set(fl, []);
      map.get(fl).push(r);
    });
    return Array.from(map.entries()).sort((a, b) => parseFloorNum(a[0]) - parseFloorNum(b[0]));
  }, [filteredRooms]);

  const pendingRequestsCount = useMemo(() => {
    return (roomRequests || []).filter((req) => {
      if (req.status !== 'PENDING') return false;
      if (user?.role === 'ADMIN') return true;
      return staffHouseCodes.includes(req.houseCode);
    }).length;
  }, [roomRequests, staffHouseCodes, user?.role]);

  const handleOpenAddModal = () => {
    if (staffRooms.length >= maxRoomsAllowed) {
      setQuotaExceededModal(true);
      return;
    }
    setRoomFormData({
      number: '',
      houseCode: selectedHouse !== 'ALL' ? selectedHouse : staffHouseCodes[0] || 'CS-01',
      floor: 'Tầng 1',
      price: 3500000,
      area: 25,
      maxOccupants: 2,
      status: 'AVAILABLE',
      amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'],
      image: '/assets/images/room_studio_1.jpg'
    });
    setShowAddModal(true);
  };

  const handleSaveRoom = async (e) => {
try {

    e.preventDefault();
    if (!roomFormData.number) return;

    if (editingRoom) {
      if (updateRoom) {
        await updateRoom(editingRoom.id, roomFormData);
      }
      setEditingRoom(null);
      setActionToast(`Đã cập nhật thông tin phòng ${roomFormData.number} thành công!`);
    } else {
      if (isDuplicateRoom(rooms, roomFormData.number, roomFormData.houseCode)) {
        alert(`Số phòng ${roomFormData.number} đã tồn tại trong cơ sở này!`);
        return;
      }
      const newRoomObj = {
        ...roomFormData,
        id: `room-${Date.now()}`,
        occupants: 0
      };
      if (addRoom) await addRoom(newRoomObj);
      setShowAddModal(false);
      setActionToast(`Đã thêm mới phòng ${roomFormData.number} vào hệ thống!`);
    }
    setTimeout(() => setActionToast(null), 3500);

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
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
            onClick={() => setShowRequestsManager(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-purple-300 hover:text-purple-700 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all btn-press cursor-pointer relative"
          >
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Duyệt Đơn Cư Dân</span>
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
            label: `🏠 ${h.name} (${rooms.filter((r) => r.houseCode === h.code).length})`
          }))
        ].map((house) => (
          <button
            key={house.code}
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
            { id: 'HOLDING', label: '🔒 Giữ Chỗ' },
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
            placeholder="Tìm theo số phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-purple-500 font-medium"
          />
        </div>
      </div>

      {/* Floor by Floor Grid */}
      <div className="space-y-6">
        {groupedByFloor.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-400 text-sm">
            Chưa có phòng nào phù hợp với bộ lọc trong cơ sở này.
          </div>
        ) : (
          groupedByFloor.map(([floorName, floorRooms]) => (
            <div key={floorName} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                <span>{floorName} ({floorRooms.length} Phòng)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {floorRooms.map((room) => {
                  const occupantIds = new Set([
                    ...roomMembers.filter(m => m.roomId === room.id && m.status !== 'MOVED_OUT').map(m => m.tenantId),
                    ...contracts.filter(c => c.roomId === room.id && c.status === 'ACTIVE').map(c => c.tenantId),
                  ]);
                  const occupantsCount = occupantIds.size;
                  const occupied = hasRoomOccupants(room, contracts, roomMembers);

                  return (
                    <RoomCard key={room.id}
          handleDeleteRoom={handleDeleteRoom}
          handleToggleRoomLock={handleToggleRoomLock}
          occupantsCount={occupantsCount}
          occupied={occupied}
          room={room}
          setEditingRoom={setEditingRoom}
          setRoomFormData={setRoomFormData}
          setSelectedRoomForMembers={setSelectedRoomForMembers}
        />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Thêm / Sửa Phòng */}
      {(showAddModal || editingRoom) && (
        <RoomFormModal
          editingRoom={editingRoom}
          handleSaveRoom={handleSaveRoom}
          roomFormData={roomFormData}
          setEditingRoom={setEditingRoom}
          setRoomFormData={setRoomFormData}
          setShowAddModal={setShowAddModal}
          showAddModal={showAddModal}
          staffManageableHouses={staffManageableHouses}
        />
      )}

      {/* Modal Duyệt Đơn Yêu Cầu Cư Dân */}
      {showRequestsManager && (
        <ResidentRequestsModal
          pendingRequestsCount={pendingRequestsCount}
          reviewResidentRequest={reviewResidentRequest}
          reviewingRequest={reviewingRequest}
          roomRequests={roomRequests}
          setShowRequestsManager={setShowRequestsManager}
          showRequestsManager={showRequestsManager}
        />
      )}

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
      <section className="p-4 border rounded-xl bg-white space-y-3">
        <h2 className="font-bold">Yêu cầu trả phòng và quyết toán</h2>
        {roomRequests.filter(req => req.type === 'CHECKOUT' && req.status === 'APPROVED'
          && !moveOutSettlements.some(item => item.contractId === req.contractId)).map(req => (
          <div key={`checkout-${req.id}`} className="flex justify-between gap-4 border-t pt-3">
            <span>Phòng {req.targetRoom} · Đã duyệt trả phòng, chưa có hồ sơ quyết toán</span>
            <button className="px-3 py-1 border rounded" onClick={async () => {
              try { await approveRoomRequest(req.id); setActionToast('Đã tạo hồ sơ quyết toán.'); }
              catch (error) { window.dispatchEvent(new CustomEvent('rental:api-error', { detail: error.message })); }
            }}>Tạo hồ sơ quyết toán</button>
          </div>
        ))}
        {moveOutSettlements.filter(item=>item.refundStatus!=='COMPLETED').map(item=><div key={item.id} className="flex justify-between gap-4 border-t pt-3"><span>{item.roomNumber} · {item.tenantName} · {item.moveOutDate}</span><button className="px-3 py-1 border rounded" onClick={()=>setActiveSettlementModal(item)}>Quyết toán</button></div>)}
        {!moveOutSettlements.some(item=>item.refundStatus!=='COMPLETED') && <p className="text-sm text-slate-500">Chưa có yêu cầu chờ quyết toán.</p>}
      </section>
      <MoveOutSettlementModal isOpen={!!activeSettlementModal} onClose={()=>setActiveSettlementModal(null)} settlement={activeSettlementModal} room={rooms.find(item=>item.id===activeSettlementModal?.roomId)} contract={contracts.find(item=>item.id===activeSettlementModal?.contractId)} />
      <WorkflowReviewPanel type="roommates" onOpenRentalRequests={() => setShowRequestsManager(true)} />
    </div>
  );
}
