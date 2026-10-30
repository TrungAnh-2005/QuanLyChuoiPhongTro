import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Home,
  MapPin,
  Building2,
  ChevronRight,
  ShieldCheck,
  Search,
  Filter,
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  FileText,
  X,
  Phone,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Modal from '../../components/common/Modal';
import ResidentContractModal from '../../components/tenant/ResidentContractModal';
import RoommateRequestModal from '../../components/tenant/RoommateRequestModal';
import TenantMoveOutNoticeModal from '../../components/settlement/TenantMoveOutNoticeModal';
import {
  getRoomImage,
  getHouseFullAddress,
  getHouseDistrict,
  healBoardingHousesList
} from '../../data/roomsData';

const isZeroSandbox = typeof window !== 'undefined' && localStorage.getItem('rental_is_zero_sandbox') === 'true';

export default function UserRoomsPage() {
  const { user, tenantRooms } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    rooms = [],
    contracts = [],
    roomRequests = [],
    tenants = [],
    roomMembers = [],
    submitRoomRequest,
    cancelRoomHold,
    signContractElectronically,
    voteRoommateRequest
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

  const [selectedHouse, setSelectedHouse] = useState('ALL');
  const [tenantLocation, setTenantLocation] = useState(null);
  const [tenantViewAllFlat, setTenantViewAllFlat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [priceRange, setPriceRange] = useState('ALL');

  const [selectedRoomDetails, setSelectedRoomDetails] = useState(null);
  const [selectedContractForModal, setSelectedContractForModal] = useState(null);
  const [showRoommateModal, setShowRoommateModal] = useState(false);
  const [showMoveOutModal, setShowMoveOutModal] = useState(false);
  const [showRequestsHistory, setShowRequestsHistory] = useState(false);
  const [actionToast, setActionToast] = useState(null);

  const getLandlordKeyFromHouse = useCallback((h) => {
    if (!h) return null;
    const code = (h.code || '').toUpperCase();
    const c = (h.createdBy || '').toLowerCase();
    const mU = (h.managerUsername || '').toLowerCase();
    const m = (h.manager || '').toLowerCase();
    if (c === 'staff' || c === 'staff1' || mU === 'staff' || m.includes('ngân') || code === 'CS-01' || code.startsWith('S1-')) return 'staff';
    if (c === 'staff2' || mU === 'staff2' || m.includes('táo') || code === 'CS-02' || code.startsWith('S2-')) return 'staff2';
    if (c === 'admin' || mU === 'admin' || m.includes('hùng') || code === 'CS-03' || code.startsWith('S3-')) return 'admin';
    return c || mU || 'other';
  }, []);

  const tenantAssociatedLandlordKey = useMemo(() => {
    const uName = (user?.fullName || '').toLowerCase().trim();
    const uPhone = (user?.phone || '').trim();

    const uRoom = user?.room || (user?.rooms && user.rooms[0]) || (tenantRooms && Object.values(tenantRooms).flat()[0]);
    if (uRoom) {
      const matchR = (rooms || []).find((r) => r.number === uRoom);
      if (matchR?.houseCode) {
        const h = storedBoardingHouses.find((h) => h.code === matchR.houseCode);
        if (h) return getLandlordKeyFromHouse(h);
      }
    }

    const matchContract = (contracts || []).find((c) => {
      const cName = (c.tenantName || '').toLowerCase().trim();
      const cPhone = (c.tenantPhone || '').trim();
      return (
        (uName && (cName.includes(uName) || uName.includes(cName))) ||
        (uPhone && cPhone === uPhone)
      );
    });
    if (matchContract?.houseCode) {
      const h = storedBoardingHouses.find((h) => h.code === matchContract.houseCode);
      if (h) return getLandlordKeyFromHouse(h);
    }

    return null;
  }, [user, tenantRooms, rooms, storedBoardingHouses, contracts, getLandlordKeyFromHouse]);

  const visibleHousesForUser = useMemo(() => {
    return storedBoardingHouses.filter((h) => h.status === 'ACTIVE');
  }, [storedBoardingHouses]);

  // Nhóm cơ sở theo khu vực
  const locationGroups = useMemo(() => {
    const map = new Map();
    visibleHousesForUser.forEach((house) => {
      const district = getHouseDistrict(house);
      if (!map.has(district)) {
        map.set(district, []);
      }
      map.get(district).push(house);
    });

    const groups = [];
    map.forEach((housesInDistrict, district) => {
      const houseCodes = housesInDistrict.map((h) => h.code);
      const roomsInDistrict = rooms.filter((r) => houseCodes.includes(r.houseCode));
      const availableRoomsCount = roomsInDistrict.filter((r) => r.status === 'AVAILABLE').length;

      const prices = roomsInDistrict.map((r) => Number(r.price) || 0).filter((p) => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      groups.push({
        district,
        houses: housesInDistrict,
        totalRoomsCount: roomsInDistrict.length,
        availableRoomsCount,
        minPrice,
        maxPrice
      });
    });

    return groups;
  }, [visibleHousesForUser, rooms]);

  const currentTenant = useMemo(() => {
    if (!user) return null;
    const userName = (user.fullName || '').toLowerCase();
    return (tenants || []).find((t) => {
      const tName = (t?.fullName || '').toLowerCase();
      return userName.includes(tName) || tName.includes(userName.split(' ')[0]);
    });
  }, [user, tenants]);

  const isTenantNew = user?.username === 'tenant_new' || user?.fullName?.includes('Nam');
  const userRoom = !isTenantNew
    ? (user?.room !== undefined && user?.room !== null
        ? user.room
        : (tenantRooms?.[user?.username] || tenantRooms?.[user?.fullName] || null))
    : null;

  const myRentedRooms = useMemo(() => {
    if (isTenantNew) return [];
    if (currentTenant?.rooms && currentTenant.rooms.length > 0) return currentTenant.rooms;
    if (currentTenant?.room) return [currentTenant.room];
    if (userRoom) return [userRoom];
    return [];
  }, [isTenantNew, currentTenant, userRoom]);

  const myRentedRoom = myRentedRooms[0] || null;

  // Lọc phòng hiển thị
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (selectedHouse !== 'ALL' && room.houseCode !== selectedHouse) return false;
      if (tenantLocation && !tenantViewAllFlat && selectedHouse === 'ALL') {
        const h = visibleHousesForUser.find((house) => house.code === room.houseCode);
        if (!h || getHouseDistrict(h) !== tenantLocation) return false;
      }
      if (filterStatus === 'AVAILABLE' && room.status !== 'AVAILABLE') return false;
      if (filterStatus === 'HOLDING' && room.status !== 'HOLDING') return false;
      if (filterStatus === 'OCCUPIED' && room.status !== 'OCCUPIED') return false;

      if (priceRange === 'UNDER_3M' && room.price >= 3000000) return false;
      if (priceRange === '3M_5M' && (room.price < 3000000 || room.price > 5000000)) return false;
      if (priceRange === 'OVER_5M' && room.price <= 5000000) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchNum = room.number && room.number.toLowerCase().includes(q);
        const matchHouse = room.house && room.house.toLowerCase().includes(q);
        const matchAmenities = Array.isArray(room.amenities) && room.amenities.some((a) => a.toLowerCase().includes(q));
        if (!matchNum && !matchHouse && !matchAmenities) return false;
      }

      return true;
    });
  }, [rooms, selectedHouse, tenantLocation, tenantViewAllFlat, visibleHousesForUser, filterStatus, priceRange, searchTerm]);

  const handleDepositClick = (room) => {
    setSelectedContractForModal({
      id: `HD-DEPOSIT-${Date.now()}`,
      roomNumber: room.number,
      houseCode: room.houseCode,
      houseName: room.house || 'Nhà Trọ Cầu Giấy',
      tenantName: user?.fullName || 'Khách thuê',
      tenantPhone: user?.phone || '0900.000.000',
      price: room.price,
      deposit: 1000000,
      status: 'PENDING_SIGN',
      createdDate: new Date().toLocaleDateString('vi-VN')
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 mb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {selectedHouse !== 'ALL'
                ? `Cơ sở: ${visibleHousesForUser.find((h) => h.code === selectedHouse)?.name || selectedHouse}`
                : tenantLocation && !tenantViewAllFlat
                ? `Khu vực: ${tenantLocation}`
                : 'Tra Cứu Phòng Trọ Theo Địa Chỉ & Cơ Sở'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Khám Phá Phòng Trọ & Đặt Cọc Giữ Chỗ
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">
            Xem danh sách phòng trống, tiện ích, vị trí và đặt cọc giữ chỗ trực tuyến có bảo chứng hoàn trả.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {myRentedRoom && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRoommateModal(true)}
                className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Tìm Bạn Ở Ghép</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMoveOutModal(true)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Báo Trả Phòng</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowRequestsHistory(true)}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:border-purple-300 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            <span>Đơn Của Tôi</span>
          </button>
        </div>
      </div>

      {actionToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between">
          <span>{actionToast}</span>
          <button onClick={() => setActionToast(null)}>✕</button>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold flex-wrap">
          <button
            type="button"
            onClick={() => {
              setTenantLocation(null);
              setTenantViewAllFlat(false);
              setSelectedHouse('ALL');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              !tenantLocation && selectedHouse === 'ALL' && !tenantViewAllFlat
                ? 'bg-purple-600 text-white font-extrabold shadow-sm'
                : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
            }`}
          >
            <span>🏠 Tất Cả Địa Chỉ</span>
          </button>

          {tenantLocation && !tenantViewAllFlat && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <button
                type="button"
                onClick={() => setSelectedHouse('ALL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedHouse === 'ALL'
                    ? 'bg-purple-600 text-white font-extrabold shadow-sm'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{tenantLocation}</span>
              </button>
            </>
          )}

          {selectedHouse !== 'ALL' && !tenantViewAllFlat && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 text-purple-900 font-extrabold border border-purple-200">
                <Building2 className="w-3.5 h-3.5 text-purple-700" />
                <span>{visibleHousesForUser.find((h) => h.code === selectedHouse)?.name || selectedHouse}</span>
              </span>
            </>
          )}

          {tenantViewAllFlat && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white font-extrabold shadow-sm">
                <span>🏢 Toàn Bộ Phòng Trên Sàn</span>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {tenantViewAllFlat ? (
            <button
              type="button"
              onClick={() => {
                setTenantViewAllFlat(false);
                setTenantLocation(null);
                setSelectedHouse('ALL');
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-purple-600" />
              <span>Quay lại tìm theo Địa chỉ</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTenantViewAllFlat(true);
                setSelectedHouse('ALL');
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-purple-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <span>🏢 Xem tất cả {rooms.length} phòng</span>
            </button>
          )}
        </div>
      </div>

      {/* BƯỚC 1: Chọn Khu Vực */}
      {selectedHouse === 'ALL' && !tenantLocation && !tenantViewAllFlat ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span>Bước 1: Chọn Khu Vực Bạn Muốn Tìm Trọ</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {locationGroups.length} khu vực ({visibleHousesForUser.length} cơ sở)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locationGroups.map((group) => (
              <div
                key={group.district}
                onClick={() => setTenantLocation(group.district)}
                className="bento-card p-5 cursor-pointer hover:shadow-xl hover:border-purple-300 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group border-slate-200/90 bg-white"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-700 flex items-center justify-center font-bold text-xl group-hover:from-purple-600 group-hover:to-indigo-600 group-hover:text-white transition-all shadow-inner">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Còn {group.availableRoomsCount} phòng trống
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 mt-4 group-hover:text-purple-700 transition-colors">
                    {group.district}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Gồm {group.houses.length} cơ sở nhà trọ trực thuộc
                  </p>

                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Mức giá:</span>
                      <span className="font-extrabold text-purple-700">
                        {group.minPrice > 0 ? `${(group.minPrice / 1000000).toFixed(1)} Tr` : '3.0 Tr'} - {group.maxPrice > 0 ? `${(group.maxPrice / 1000000).toFixed(1)} Tr` : '5.0 Tr'}/tháng
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600 group-hover:text-purple-700">
                  <span>Khám phá các cơ sở</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : selectedHouse === 'ALL' && tenantLocation && !tenantViewAllFlat ? (
        /* BƯỚC 2: Chọn Cơ Sở trong Khu Vực */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Bước 2: Chọn Cơ Sở Nhà Trọ Tại {tenantLocation}</span>
            </h2>
            <button
              type="button"
              onClick={() => setTenantLocation(null)}
              className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
            >
              ← Đổi khu vực khác
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleHousesForUser
              .filter((h) => getHouseDistrict(h) === tenantLocation)
              .map((house) => {
                const houseRooms = rooms.filter((r) => r.houseCode === house.code);
                const vacantCount = houseRooms.filter((r) => r.status === 'AVAILABLE').length;

                return (
                  <div
                    key={house.code}
                    onClick={() => setSelectedHouse(house.code)}
                    className="bento-card p-5 cursor-pointer hover:shadow-xl hover:border-purple-300 hover:-translate-y-0.5 transition-all group bg-white border-slate-200/90"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {vacantCount} phòng trống
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-3 group-hover:text-purple-700 transition-colors">
                      {house.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {getHouseFullAddress(house)}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
                      <span>Xem sơ đồ & bảng giá phòng</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        /* BƯỚC 3: Danh Sách Phòng Trọ */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {['ALL', 'AVAILABLE', 'HOLDING'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterStatus === st
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'Tất Cả' : st === 'AVAILABLE' ? '🟢 Còn Trống' : '🔒 Đang Giữ Chỗ'}
                </button>
              ))}

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="bg-slate-100 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none"
              >
                <option value="ALL">Mọi mức giá</option>
                <option value="UNDER_3M">Dưới 3 triệu</option>
                <option value="3M_5M">3 - 5 triệu</option>
                <option value="OVER_5M">Trên 5 triệu</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo phòng, tiện ích..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-purple-500 font-medium"
              />
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRooms.length === 0 ? (
              <div className="col-span-full bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-400 text-sm">
                Không tìm thấy phòng trọ nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isMyRented = myRentedRoom === room.number;

                return (
                  <div
                    key={room.id}
                    className={`bento-card p-5 flex flex-col justify-between transition-all group bg-white ${
                      isMyRented ? 'border-2 border-emerald-400 bg-emerald-50/20 shadow-md' : 'border-slate-200/80'
                    }`}
                  >
                    <div>
                      {/* Ảnh phòng */}
                      <div className="relative h-44 -mx-5 -mt-5 mb-4 overflow-hidden rounded-t-2xl group/img bg-slate-100">
                        <img
                          src={room.image || getRoomImage(room)}
                          alt={`Ảnh phòng ${room.number}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-black/20 pointer-events-none" />

                        <div className="absolute top-2.5 right-2.5 z-10">
                          {room.status === 'AVAILABLE' ? (
                            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-500/90 text-white backdrop-blur-md shadow-md">
                              🟢 Còn trống
                            </span>
                          ) : room.status === 'HOLDING' ? (
                            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-500/95 text-white backdrop-blur-md shadow-md animate-pulse">
                              🔒 Đang giữ chỗ
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-900/80 text-white backdrop-blur-md shadow-md">
                              Đang thuê
                            </span>
                          )}
                        </div>

                        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs pointer-events-none">
                          <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-bold">
                            {room.houseCode} • {room.floor}
                          </span>
                          <span className="font-mono font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md">
                            {room.area} m²
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black text-slate-900">{room.number}</h3>
                            {isMyRented && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                                PHÒNG BẠN
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            {room.house || room.houseCode}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="font-black text-purple-700 text-base">
                            {(room.price || 0).toLocaleString('vi-VN')} đ
                          </div>
                          <div className="text-[10px] text-slate-400">/ tháng</div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(room.amenities || []).slice(0, 4).map((a, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-purple-50 text-[10px] font-semibold text-purple-700 border border-purple-100"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRoomDetails(room)}
                        className="text-xs text-slate-700 hover:text-purple-700 font-bold px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex-1 text-center cursor-pointer"
                      >
                        Chi Tiết
                      </button>

                      {room.status === 'AVAILABLE' && (
                        <button
                          type="button"
                          onClick={() => handleDepositClick(room)}
                          className="text-xs text-white font-bold px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all flex-1 text-center btn-press cursor-pointer"
                        >
                          Đặt Cọc 1Tr
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Room Detail Modal */}
      {selectedRoomDetails && (
        <Modal isOpen={!!selectedRoomDetails} onClose={() => setSelectedRoomDetails(null)} maxWidth="max-w-lg">
          <div className="space-y-4 text-xs">
            <div className="relative h-56 -mx-6 -mt-6 rounded-t-2xl overflow-hidden bg-slate-900">
              <img
                src={selectedRoomDetails.image || getRoomImage(selectedRoomDetails)}
                alt="Room"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedRoomDetails(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 text-white rounded-full hover:bg-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="text-xl font-black">{selectedRoomDetails.number}</h3>
                  <p className="text-xs opacity-90">{selectedRoomDetails.house || selectedRoomDetails.houseCode}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-amber-300">
                    {(selectedRoomDetails.price || 0).toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-[11px] block">/ tháng</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="text-slate-500">Diện tích:</span>
                <span className="font-bold ml-1">{selectedRoomDetails.area} m²</span>
              </div>
              <div>
                <span className="text-slate-500">Sức chứa:</span>
                <span className="font-bold ml-1">{selectedRoomDetails.maxOccupants || 2} người</span>
              </div>
              <div>
                <span className="text-slate-500">Vị trí:</span>
                <span className="font-bold ml-1">{selectedRoomDetails.floor}</span>
              </div>
              <div>
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-bold ml-1 text-emerald-600">
                  {selectedRoomDetails.status === 'AVAILABLE' ? 'Còn trống' : 'Đang ở'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-2">Tiện ích trong phòng:</h4>
              <div className="flex flex-wrap gap-2">
                {(selectedRoomDetails.amenities || []).map((item, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRoomDetails(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Đóng
              </button>
              {selectedRoomDetails.status === 'AVAILABLE' && (
                <button
                  type="button"
                  onClick={() => {
                    const r = selectedRoomDetails;
                    setSelectedRoomDetails(null);
                    handleDepositClick(r);
                  }}
                  className="px-5 py-2 font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-md cursor-pointer"
                >
                  Đặt Cọc Giữ Chỗ (1 Triệu)
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Contract & Deposit Modal */}
      <ResidentContractModal
        isOpen={!!selectedContractForModal}
        onClose={() => setSelectedContractForModal(null)}
        contract={selectedContractForModal}
        onSignSuccess={(contractId) => {
          if (signContractElectronically) signContractElectronically(contractId);
          setSelectedContractForModal(null);
          setActionToast('🎉 Đặt cọc giữ chỗ và ký hợp đồng điện tử thành công!');
          setTimeout(() => setActionToast(null), 4000);
        }}
      />

      {/* Roommate Modal */}
      <RoommateRequestModal
        isOpen={showRoommateModal}
        onClose={() => setShowRoommateModal(false)}
        userRoom={rooms.find((r) => r.number === myRentedRoom) || { roomNumber: myRentedRoom || 'P.101', id: '101' }}
        activeContract={contracts.find((c) => c.roomNumber === myRentedRoom)}
      />

      {/* Move Out Notice Modal */}
      <TenantMoveOutNoticeModal
        isOpen={showMoveOutModal}
        onClose={() => setShowMoveOutModal(false)}
        activeContract={contracts.find((c) => c.roomNumber === myRentedRoom) || { id: 'HD-2026-001', deposit: 3000000 }}
        userRoom={rooms.find((r) => r.number === myRentedRoom) || { roomNumber: myRentedRoom || 'P.101', id: '101' }}
      />

      {/* Requests History Modal */}
      {showRequestsHistory && (
        <Modal isOpen={showRequestsHistory} onClose={() => setShowRequestsHistory(false)} maxWidth="max-w-md">
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Lịch Sử Đơn Của Bạn</h3>
              <button onClick={() => setShowRequestsHistory(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {roomRequests.length === 0 ? (
                <p className="text-center py-6 text-slate-400">Bạn chưa gửi đơn nào</p>
              ) : (
                roomRequests.map((req) => (
                  <div key={req.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>{req.type === 'RENTAL' ? 'Đơn Thuê Phòng' : req.type === 'TRANSFER' ? 'Đổi Phòng' : 'Ở Ghép'}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt'}
                      </span>
                    </div>
                    <div className="text-slate-500">Phòng: {req.roomNumber || req.targetRoom}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
