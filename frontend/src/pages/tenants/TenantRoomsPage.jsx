import React, { useState, useMemo } from 'react';
import {
  Building2,
  Home,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Plus,
  Sparkles,
  ArrowRight,
  Eye,
  MapPin,
  X,
  CreditCard,
  Phone
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { ALL_ROOMS, getRoomImage } from '@/data/roomsData';
import RoommateRequestModal from '@/components/tenant/RoommateRequestModal';
import Modal from '@/components/common/Modal';

export default function TenantRoomsPage() {
  const { user, tenantRooms } = useAuth();
  const { rooms = ALL_ROOMS, tenants = [], contracts = [] } = useData();

  const [selectedHouse, setSelectedHouse] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'ROOMMATE' | 'MY_ROOM'
  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
  const [showRoommateModal, setShowRoommateModal] = useState(false);
  const [roommateTargetRoom, setRoommateTargetRoom] = useState(null);

  // Danh mục cơ sở
  const houses = useMemo(() => [
    { code: 'CS-01', name: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', shortName: 'Cơ Sở 1 - Cầu Giấy', address: 'Số 12 Ngõ 86 Cầu Giấy, Hà Nội' },
    { code: 'CS-02', name: 'Nhà Trọ Bách Khoa - Cơ Sở 2', shortName: 'Cơ Sở 2 - Bách Khoa', address: 'Tạ Quang Bửu, Hai Bà Trưng, Hà Nội' },
    { code: 'CS-03', name: 'Nhà Trọ Đống Đa - Cơ Sở 3', shortName: 'Cơ Sở 3 - Đống Đa', address: 'Nguyên Hồng, Đống Đa, Hà Nội' }
  ], []);

  // Tìm thông tin phòng của khách đang ở
  const currentTenant = useMemo(() => {
    return (tenants || []).find(
      (t) => t.username === user?.username || t.phone === user?.phone || (user?.fullName && t.fullName?.toLowerCase().includes(user.fullName.toLowerCase()))
    );
  }, [tenants, user]);

  const activeContract = useMemo(() => {
    return (contracts || []).find((c) => {
      const matchPhone = c.tenantPhone && user?.phone && c.tenantPhone === user.phone;
      const matchName = c.tenantName && user?.fullName && c.tenantName.toLowerCase().includes(user.fullName.toLowerCase());
      return (matchPhone || matchName) && (c.status === 'ACTIVE' || c.status === 'EXPIRED' || c.status === 'PENDING_TERMINATION');
    });
  }, [contracts, user]);

  const myRentedRooms = useMemo(() => {
    const list = [];
    if (activeContract?.roomNumber && !list.includes(activeContract.roomNumber)) list.push(activeContract.roomNumber);
    if (currentTenant?.room && !list.includes(currentTenant.room)) list.push(currentTenant.room);
    if (user?.room && !list.includes(user.room)) list.push(user.room);
    if (Array.isArray(tenantRooms)) {
      tenantRooms.forEach((r) => { if (r && !list.includes(r)) list.push(r); });
    }
    return list;
  }, [currentTenant, user, tenantRooms, activeContract]);

  const myRoomNumber = myRentedRooms[0] || 'P.101';

  // Lọc danh sách phòng
  const filteredRooms = useMemo(() => {
    return (rooms || ALL_ROOMS).filter((r) => {
      if (selectedHouse !== 'ALL' && r.houseCode && r.houseCode !== selectedHouse) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchNumber = r.number && r.number.toLowerCase().includes(q);
        const matchHouse = r.house && r.house.toLowerCase().includes(q);
        if (!matchNumber && !matchHouse) return false;
      }
      if (filterType === 'AVAILABLE' && r.status !== 'AVAILABLE') return false;
      if (filterType === 'MY_ROOM' && !myRentedRooms.includes(r.number)) return false;
      return true;
    });
  }, [rooms, selectedHouse, searchTerm, filterType, myRentedRooms]);

  return (
    <div className="space-y-6 page-enter pb-10">
      {/* Header Banner */}
      <div className="hero-gradient-shine bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white p-6 rounded-2xl shadow-xl shadow-indigo-600/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Phòng Thuộc Chuỗi Chủ Trọ • Cổng Cư Dân</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Khám Phá Sơ Đồ Phòng Toàn Hệ Thống
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-2xl">
            Tra cứu thông tin phòng đang thuê của bạn, tìm phòng trống cùng chuỗi hoặc gửi hồ sơ CCCD xin ở ghép.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3.5 text-right shrink-0">
          <span className="text-blue-200 block text-xs font-semibold">Phòng đang thuê:</span>
          <div className="text-xl font-black font-mono text-amber-300 mt-0.5">
            {myRoomNumber}
          </div>
        </div>
      </div>

      {/* Bộ Lọc & Tìm Kiếm */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo số phòng (VD: P.101) hoặc tên cơ sở..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Lọc theo trạng thái */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất Cả ({rooms.length})
            </button>
            <button
              onClick={() => setFilterType('AVAILABLE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterType === 'AVAILABLE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Còn Trống
            </button>
            <button
              onClick={() => setFilterType('MY_ROOM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterType === 'MY_ROOM'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Phòng Của Tôi
            </button>
          </div>
        </div>

        {/* Lọc theo cơ sở */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Cơ sở:
          </span>
          <button
            onClick={() => setSelectedHouse('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedHouse === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả cơ sở
          </button>
          {houses.map((h) => (
            <button
              key={h.code}
              onClick={() => setSelectedHouse(h.code)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedHouse === h.code
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {h.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Danh Sách Phòng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRooms.map((room) => {
          const isMyRoom = myRentedRooms.includes(room.number);
          const isAvailable = room.status === 'AVAILABLE';
          const imgUrl = getRoomImage(room.number) || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop';

          return (
            <div
              key={room.number}
              className={`bg-white border rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                isMyRoom
                  ? 'border-2 border-purple-500 ring-4 ring-purple-500/10'
                  : 'border-slate-200/90 hover:border-indigo-300'
              }`}
            >
              <div>
                {/* Ảnh phòng & Tag trạng thái */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img src={imgUrl} alt={`Phòng ${room.number}`} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900/80 backdrop-blur-md text-white font-mono shadow-sm">
                      {room.number}
                    </span>
                    {isMyRoom && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-600 text-white shadow-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Phòng Đang Thuê</span>
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm ${
                      isAvailable
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800/80 backdrop-blur-md text-slate-200'
                    }`}>
                      {isAvailable ? 'Còn Trống' : 'Đang Thuê'}
                    </span>
                  </div>
                </div>

                {/* Nội dung card */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 font-medium">{room.house || 'Cơ sở trọ'}</div>
                      <div className="text-lg font-black text-slate-900 mt-0.5">
                        {(room.price || 3500000).toLocaleString('vi-VN')} <span className="text-xs font-semibold text-slate-500">₫/tháng</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div>Tầng {room.floor || 1}</div>
                      <div className="font-semibold text-slate-700">{room.area || 25} m²</div>
                    </div>
                  </div>

                  {/* Tiện ích cơ bản */}
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-slate-600">
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md">❄️ Điều hòa</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md">🚿 Nóng lạnh</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md">🛏️ Giường nệm</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md">🛗 Thang máy</span>
                  </div>
                </div>
              </div>

              {/* Footer nút hành động */}
              <div className="p-4 pt-0">
                {isMyRoom ? (
                  <div className="w-full py-2.5 text-center bg-purple-50 text-purple-700 font-bold text-xs rounded-xl border border-purple-200">
                    ✓ Phòng Của Bạn (Hợp Đồng Hiệu Lực)
                  </div>
                ) : isAvailable ? (
                  <button
                    onClick={() => {
                      setRoommateTargetRoom(room);
                      setShowRoommateModal(true);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Gửi Đăng Ký Thuê Phòng Này</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setRoommateTargetRoom(room);
                      setShowRoommateModal(true);
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Gửi CCCD Xin Vào Ở Ghép</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Ở Ghép / Đăng Ký */}
      {showRoommateModal && (
        <RoommateRequestModal
          isOpen={showRoommateModal}
          onClose={() => {
            setShowRoommateModal(false);
            setRoommateTargetRoom(null);
          }}
          targetRoom={roommateTargetRoom?.number || 'P.102'}
        />
      )}
    </div>
  );
}
