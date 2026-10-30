import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Home,
  Plus,
  Filter,
  Search,
  Users,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  Building2,
  DollarSign,
  FileText,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  X,
  UserPlus,
  Sparkles,
  Camera,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Modal from '../../components/common/Modal';
import MoveOutSettlementModal from '../../components/settlement/MoveOutSettlementModal';
import TrialExpiryBanner from '../../components/common/TrialExpiryBanner';
import {
  getRoomImage,
  healBoardingHousesList,
  isDuplicateRoom,
  parseFloorNum,
  ROOM_IMAGE_PRESETS
} from '../../data/roomsData';

const isZeroSandbox = typeof window !== 'undefined' && localStorage.getItem('rental_is_zero_sandbox') === 'true';

const AMENITY_OPTIONS = [
  'WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Máy giặt',
  'Giường nệm', 'Tủ quần áo', 'Ban công', 'Bếp riêng', 'Gác lửng', 'Khóa FaceID', 'Thang máy'
];

export default function StaffRoomsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawParam = searchParams.get('house') || 'ALL';

  const {
    rooms = [],
    addRoom,
    updateRoom,
    deleteRoom,
    updateRoomStatus,
    updateRoomPrice,
    roomRequests = [],
    approveRoomRequest,
    rejectRoomRequest,
    roomMembers = [],
    addRoomMember,
    removeRoomMember,
    updateTemporaryResidence,
    contracts = [],
    landlords = []
  } = useData();

  const [storedBoardingHouses, setStoredBoardingHouses] = useState(() => {
    try {
      const saved = localStorage.getItem('rental_boarding_houses');
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

  useEffect(() => {
    const handleSyncHouses = () => {
      try {
        const saved = localStorage.getItem('rental_boarding_houses');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setStoredBoardingHouses(healBoardingHousesList(parsed));
        }
      } catch {}
    };
    window.addEventListener('storage', handleSyncHouses);
    return () => window.removeEventListener('storage', handleSyncHouses);
  }, []);

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
    if (user?.role === 'ADMIN') return storedBoardingHouses;
    const u = (user?.username || '').toLowerCase();
    return storedBoardingHouses.filter((h) => {
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
  const [showPriceEditModal, setShowPriceEditModal] = useState(false);
  const [showRequestsManager, setShowRequestsManager] = useState(false);
  const [selectedRoomForMembers, setSelectedRoomForMembers] = useState(null);
  const [activeSettlementModal, setActiveSettlementModal] = useState(null);
  const [quotaExceededModal, setQuotaExceededModal] = useState(false);
  const [actionToast, setActionToast] = useState(null);

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

  const [newRoomPriceInput, setNewRoomPriceInput] = useState('');
  const [roomToEditPrice, setRoomToEditPrice] = useState(null);

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

  const handleSaveRoom = (e) => {
    e.preventDefault();
    if (!roomFormData.number) return;

    if (editingRoom) {
      if (updateRoom) {
        updateRoom(editingRoom.id, roomFormData);
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
      if (addRoom) addRoom(newRoomObj);
      setShowAddModal(false);
      setActionToast(`Đã thêm mới phòng ${roomFormData.number} vào hệ thống!`);
    }
    setTimeout(() => setActionToast(null), 3500);
  };

  const handleDeleteRoom = (roomId, roomNumber) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa phòng ${roomNumber} không?`)) {
      if (deleteRoom) deleteRoom(roomId);
      setActionToast(`Đã xóa phòng ${roomNumber} thành công!`);
      setTimeout(() => setActionToast(null), 3000);
    }
  };

  const handleToggleRoomLock = (room) => {
    const nextStatus = room.status === 'LOCKED' ? 'AVAILABLE' : 'LOCKED';
    if (updateRoomStatus) updateRoomStatus(room.id, nextStatus);
    setActionToast(`Đã ${nextStatus === 'LOCKED' ? 'tạm khóa' : 'mở khóa'} phòng ${room.number}!`);
    setTimeout(() => setActionToast(null), 3000);
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
                  const occupantsCount = roomMembers.filter(
                    (m) => m.roomNumber === room.number && m.status !== 'MOVED_OUT'
                  ).length;

                  return (
                    <div
                      key={room.id}
                      className="bento-card p-5 bg-white border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all"
                    >
                      <div>
                        {/* Ảnh phòng & badge */}
                        <div className="relative h-36 -mx-5 -mt-5 mb-3 overflow-hidden rounded-t-2xl bg-slate-100">
                          <img
                            src={room.image || getRoomImage(room)}
                            alt={`Phòng ${room.number}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2.5 right-2.5">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white backdrop-blur-md shadow-xs ${
                              room.status === 'AVAILABLE'
                                ? 'bg-emerald-600/90'
                                : room.status === 'OCCUPIED'
                                ? 'bg-purple-600/90'
                                : room.status === 'HOLDING'
                                ? 'bg-amber-600/90'
                                : 'bg-slate-700/90'
                            }`}>
                              {room.status === 'AVAILABLE'
                                ? '🟢 Còn trống'
                                : room.status === 'OCCUPIED'
                                ? '🟣 Đang thuê'
                                : room.status === 'HOLDING'
                                ? '🔒 Giữ chỗ'
                                : 'Bảo trì / Khóa'}
                            </span>
                          </div>

                          <div className="absolute bottom-2 left-3 text-white text-[10px] font-bold bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                            {room.houseCode} • {room.area} m²
                          </div>
                        </div>

                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-black text-slate-900">{room.number}</h3>
                            <p className="text-xs text-slate-500 font-medium">{room.house || room.houseCode}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-purple-700">
                              {(room.price || 0).toLocaleString('vi-VN')} đ
                            </div>
                            <div className="text-[10px] text-slate-400">/ tháng</div>
                          </div>
                        </div>

                        {/* Người ở trong phòng */}
                        <div className="mt-3 p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>Người ở:</span>
                          </span>
                          <span className="font-bold text-slate-800">
                            {occupantsCount} / {room.maxOccupants || 2} người
                          </span>
                        </div>
                      </div>

                      {/* Thao tác */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedRoomForMembers(room)}
                          className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                          title="Hồ sơ người ở"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Hồ sơ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingRoom(room);
                            setRoomFormData({ ...room });
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                          title="Sửa phòng"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleRoomLock(room)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                          title={room.status === 'LOCKED' ? 'Mở khóa phòng' : 'Tạm khóa phòng'}
                        >
                          {room.status === 'LOCKED' ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-amber-600" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(room.id, room.number)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                          title="Xóa phòng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Thêm / Sửa Phòng */}
      {(showAddModal || editingRoom) && (
        <Modal
          isOpen={showAddModal || !!editingRoom}
          onClose={() => {
            setShowAddModal(false);
            setEditingRoom(null);
          }}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingRoom ? `Chỉnh Sửa Phòng ${editingRoom.number}` : 'Thêm Phòng Mới Vào Cơ Sở'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRoom(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số phòng *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: P.101"
                    value={roomFormData.number}
                    onChange={(e) => setRoomFormData({ ...roomFormData, number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cơ sở *</label>
                  <select
                    value={roomFormData.houseCode}
                    onChange={(e) => setRoomFormData({ ...roomFormData, houseCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    {staffManageableHouses.map((h) => (
                      <option key={h.code} value={h.code}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tầng</label>
                  <input
                    type="text"
                    value={roomFormData.floor}
                    onChange={(e) => setRoomFormData({ ...roomFormData, floor: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diện tích (m²)</label>
                  <input
                    type="number"
                    value={roomFormData.area}
                    onChange={(e) => setRoomFormData({ ...roomFormData, area: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sức chứa</label>
                  <input
                    type="number"
                    value={roomFormData.maxOccupants}
                    onChange={(e) => setRoomFormData({ ...roomFormData, maxOccupants: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Giá thuê (VNĐ/tháng) *</label>
                <input
                  type="number"
                  required
                  value={roomFormData.price}
                  onChange={(e) => setRoomFormData({ ...roomFormData, price: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-purple-700 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ảnh đại diện phòng</label>
                <select
                  value={roomFormData.image}
                  onChange={(e) => setRoomFormData({ ...roomFormData, image: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                >
                  {ROOM_IMAGE_PRESETS.map((preset) => (
                    <option key={preset.url} value={preset.url}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiện ích trong phòng</label>
                <div className="grid grid-cols-3 gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  {AMENITY_OPTIONS.map((amenity) => {
                    const isChecked = (roomFormData.amenities || []).includes(amenity);
                    return (
                      <label key={amenity} className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const cur = roomFormData.amenities || [];
                            const updated = e.target.checked
                              ? [...cur, amenity]
                              : cur.filter((a) => a !== amenity);
                            setRoomFormData({ ...roomFormData, amenities: updated });
                          }}
                          className="rounded text-purple-600"
                        />
                        <span>{amenity}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRoom(null);
                  }}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md cursor-pointer"
                >
                  Lưu Thông Tin Phòng
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Modal Duyệt Đơn Yêu Cầu Cư Dân */}
      {showRequestsManager && (
        <Modal isOpen={showRequestsManager} onClose={() => setShowRequestsManager(false)} maxWidth="max-w-lg">
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Xét Duyệt Đơn Từ Cư Dân ({pendingRequestsCount} Đơn Chờ)</h3>
              <button onClick={() => setShowRequestsManager(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {roomRequests.length === 0 ? (
                <p className="text-center py-6 text-slate-400">Không có đơn nào cần xử lý</p>
              ) : (
                roomRequests.map((req) => (
                  <div key={req.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {req.type === 'RENTAL' ? 'Đơn Thuê / Đặt Cọc' : req.type === 'ROOMMATE' ? 'Tìm Ở Ghép' : 'Báo Trả Phòng'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt'}
                      </span>
                    </div>

                    <div className="text-slate-600 space-y-0.5">
                      <div>Khách: <strong>{req.tenantName || req.sender}</strong> ({req.phone || 'Chưa có SĐT'})</div>
                      <div>Phòng: <strong>{req.roomNumber || req.targetRoom}</strong> • Cơ sở: {req.houseCode}</div>
                      {req.note && <div className="text-slate-500 italic">"{req.note}"</div>}
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            if (rejectRoomRequest) rejectRoomRequest(req.id);
                            setActionToast('Đã từ chối đơn!');
                            setTimeout(() => setActionToast(null), 3000);
                          }}
                          className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer"
                        >
                          Từ chối
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (approveRoomRequest) approveRoomRequest(req.id);
                            setActionToast('Đã phê duyệt đơn thành công!');
                            setTimeout(() => setActionToast(null), 3000);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                        >
                          Phê duyệt
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Hồ Sơ Khách & CCCD / Tạm Trú */}
      {selectedRoomForMembers && (
        <Modal isOpen={!!selectedRoomForMembers} onClose={() => setSelectedRoomForMembers(null)} maxWidth="max-w-md">
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Hồ Sơ Cư Dân Phòng {selectedRoomForMembers.number}</h3>
              <button onClick={() => setSelectedRoomForMembers(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {roomMembers.filter((m) => m.roomNumber === selectedRoomForMembers.number && m.status !== 'MOVED_OUT').length === 0 ? (
                <p className="text-center py-6 text-slate-400">Phòng hiện chưa có thông tin thành viên nào</p>
              ) : (
                roomMembers
                  .filter((m) => m.roomNumber === selectedRoomForMembers.number && m.status !== 'MOVED_OUT')
                  .map((mem) => (
                    <div key={mem.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{mem.fullName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                          {mem.role === 'HOST' ? 'Chủ hợp đồng' : 'Ở ghép'}
                        </span>
                      </div>
                      <div className="text-slate-500">SĐT: {mem.phone} • CCCD: {mem.cccd || 'Chưa cung cấp'}</div>
                      <div className="text-[11px] text-slate-600">
                        Tạm trú: {mem.temporaryResidenceStatus === 'REGISTERED' ? '🟢 Đã ĐK tạm trú' : '🟡 Chưa đăng ký'}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Quota Exceeded */}
      {quotaExceededModal && (
        <Modal isOpen={quotaExceededModal} onClose={() => setQuotaExceededModal(false)} maxWidth="max-w-md">
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
        </Modal>
      )}
    </div>
  );
}
