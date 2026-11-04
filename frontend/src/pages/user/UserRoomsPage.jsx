import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  MapPin,
  ArrowRight,
  ArrowLeft,
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
export function getRoomImage(room) {
  if (room?.image) return room.image;
  const floor = parseInt(room?.floor?.replace(/\D/g, '') || '1', 10);
  const amenities = Array.isArray(room?.amenities) ? room.amenities : [];
  if (floor >= 5 || amenities.some(a => typeof a === 'string' && (a.toLowerCase().includes('ban công') || a.toLowerCase().includes('penthouse') || a.toLowerCase().includes('sân phơi')))) {
    return '/assets/images/room_suite_3.jpg';
  }
  if (floor >= 3 || amenities.some(a => typeof a === 'string' && (a.toLowerCase().includes('máy giặt') || a.toLowerCase().includes('tủ lạnh')))) {
    return '/assets/images/room_duplex_2.jpg';
  }
  return '/assets/images/room_studio_1.jpg';
}

export function getHouseFullAddress(h) {
  if (h?.address && h.address.trim()) return h.address;
  const name = h?.name || '';
  const code = h?.code || '';
  if (code.includes('CS-01') || name.includes('Cầu Giấy')) {
    return 'Số 45, Ngõ 165 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội';
  }
  if (code.includes('CS-02') || name.includes('Bách Khoa')) {
    return 'Số 18, Ngõ Tự Do, Phường Đồng Tâm, Quận Hai Bà Trưng, Hà Nội';
  }
  if (code.includes('CS-03') || name.includes('Đống Đa')) {
    return 'Số 92, Phố Chùa Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội';
  }
  return h?.location || 'Thành phố Hà Nội';
}

export function getHouseDistrict(h) {
  const addr = getHouseFullAddress(h);
  const name = h?.name || '';
  const districts = [
    'Cầu Giấy', 'Đống Đa', 'Hai Bà Trưng', 'Thanh Xuân', 'Ba Đình', 
    'Hoàn Kiếm', 'Hoàng Mai', 'Nam Từ Liêm', 'Bắc Từ Liêm', 'Hà Đông', 'Tây Hồ', 'Long Biên'
  ];
  for (const d of districts) {
    if (addr.includes(d) || name.includes(d)) return `Quận ${d}`;
  }
  const parts = addr.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    const candidate = parts[parts.length - 2];
    if (candidate && candidate.length < 25) return candidate;
  }
  return 'Khu Vực Trung Tâm';
}

export function healBoardingHousesList(list) {
  if (!Array.isArray(list) || list.length === 0) return list;

  let changed = false;
  const usedCodes = new Set();
  const codeRenames = {};

  const healed = list.map((h) => {
    if ((h.code === 'CS-01' || (h.name && h.name.includes('Cầu Giấy'))) && h.floors === 5) {
      h = { ...h, floors: 4, totalFloors: 4 };
      changed = true;
    }
    const isCustom = (typeof h.id === 'number' && h.id > 1000) || h.createdAtMs || (h.createdAt && !h.features);
    let code = (h.code || '').trim().toUpperCase();
    const u = (h.createdBy || h.managerUsername || '').toLowerCase();

    let prefix = 'CS';
    if (u === 'staff' || u === 'staff1') prefix = 'S1-CS';
    else if (u === 'staff2') prefix = 'S2-CS';
    else if (u && u !== 'admin') prefix = `${u.toUpperCase()}-CS`;

    if (isCustom && (code === 'CS-02' || code === 'CS-03')) {
      code = '';
    }

    if (!code || usedCodes.has(code)) {
      let preferredNum = null;
      const numMatch = (h.name || '').match(/(\d+)/);
      if (numMatch) {
        const candidateNum = parseInt(numMatch[1], 10);
        const candidateCode = `${prefix}-${String(candidateNum).padStart(2, '0')}`;
        if (!usedCodes.has(candidateCode)) {
          preferredNum = candidateNum;
        }
      }

      let seq = preferredNum || 1;
      let newCode = `${prefix}-${String(seq).padStart(2, '0')}`;
      while (usedCodes.has(newCode)) {
        seq++;
        newCode = `${prefix}-${String(seq).padStart(2, '0')}`;
      }

      if (h.code && h.code !== newCode) {
        codeRenames[h.code] = newCode;
      }
      code = newCode;
      changed = true;
    }

    usedCodes.add(code);
    return code !== h.code ? { ...h, code } : h;
  });

  if (changed) {
    try {
      localStorage.setItem('rental_boarding_houses', JSON.stringify(healed));
    } catch {}

    try {
      const savedRooms = localStorage.getItem('rental_rooms');
      if (savedRooms) {
        const parsedRooms = JSON.parse(savedRooms);
        if (Array.isArray(parsedRooms)) {
          let roomsChanged = false;
          const updatedRooms = parsedRooms.map((r) => {
            const matchedHouse = healed.find((h) =>
              (h.name && r.house && (h.name === r.house || String(r.house).trim() === String(h.name).trim())) ||
              (codeRenames[r.houseCode] && h.code === codeRenames[r.houseCode])
            );
            if (matchedHouse && matchedHouse.code !== r.houseCode) {
              roomsChanged = true;
              return { ...r, houseCode: matchedHouse.code, house: matchedHouse.name };
            }
            return r;
          });
          if (roomsChanged) {
            localStorage.setItem('rental_rooms', JSON.stringify(updatedRooms));
          }
        }
      }
    } catch {}
  }

  return healed;
}

const isZeroSandbox = typeof window !== 'undefined' && localStorage.getItem('rental_is_zero_sandbox') === 'true';

export default function UserRoomsPage() {
  const { user, tenantRooms } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    rooms = [],
    contracts = [],
    roomRequests = [],
    tenants = [],
    roomMembers = [],
    landlords = [],
    submitRoomRequest,
    cancelRoomHold,
    signContractElectronically,
    voteRoommateRequest
  } = useData();

  // State cho Modal Đăng ký Giữ trọ đặt cọc chờ Staff duyệt
  const [rentModalRoom, setRentModalRoom] = useState(null);

  // Tự động mở Modal Lịch Sử Đơn khi tenant click từ Thông Báo Navbar
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'history' || action === 'review-requests') {
      setShowRequestsHistory(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleOpenHistory = () => setShowRequestsHistory(true);
    window.addEventListener('rental:open-requests-manager', handleOpenHistory);
    return () => window.removeEventListener('rental:open-requests-manager', handleOpenHistory);
  }, []);
  const [rentNote, setRentNote] = useState('');
  const [isSubmittingRent, setIsSubmittingRent] = useState(false);

  const uName = (user?.fullName || '').toLowerCase().trim();
  const uPhone = (user?.phone || '').trim();

  // Đơn đăng ký giữ trọ của khách đã được Quản lý phê duyệt (chờ nộp cọc & ký HĐ)
  const myApprovedRequest = useMemo(() => {
    return (roomRequests || []).find((r) => {
      const isRent = (r.type === 'RENT' || r.type === 'NEW_RENT' || r.type === 'RENTAL');
      if (!isRent || r.status !== 'APPROVED') return false;
      const matchUser = ((uName && (r.tenant?.toLowerCase().includes(uName) || r.tenantName?.toLowerCase().includes(uName))) ||
                         (uPhone && r.phone === uPhone) ||
                         (user?.username === 'tenant_new'));
      if (!matchUser) return false;

      const targetRoom = r.targetRoom || r.roomNumber;

      // 1. Nếu phòng này khách đã trả phòng (có đơn CHECKOUT/RETURN/LEAVE_ROOM đã duyệt) -> Bỏ qua
      const hasCheckedOutThisRoom = (roomRequests || []).some(
        req => (req.type === 'CHECKOUT' || req.type === 'RETURN' || req.type === 'LEAVE_ROOM') &&
               (req.targetRoom === targetRoom || req.currentRoom === targetRoom) &&
               req.status === 'APPROVED'
      );
      if (hasCheckedOutThisRoom) return false;

      // 2. Nếu khách đã có hợp đồng ACTIVE tại phòng này (đang là cư dân chính thức) -> Đơn giữ trọ đã hoàn thành
      const activeContract = (contracts || []).find(c => c.roomNumber === targetRoom && c.status === 'ACTIVE');
      if (activeContract) return false;

      // 3. Nếu hợp đồng đã kết thúc (COMPLETED / TERMINATED) mà không có hợp đồng mới PENDING_DEPOSIT -> Bỏ qua
      const finishedContract = (contracts || []).find(c => c.roomNumber === targetRoom && (c.status === 'COMPLETED' || c.status === 'TERMINATED'));
      const hasNewHoldingContract = (contracts || []).some(c => c.roomNumber === targetRoom && (c.status === 'PENDING_DEPOSIT' || c.status === 'PENDING_SIGN'));
      if (finishedContract && !hasNewHoldingContract) return false;

      // 4. Kiểm tra hợp đồng PENDING_DEPOSIT / PENDING_SIGN tương ứng (nếu có hạn holdingUntil thì phải còn hạn)
      const pendingContract = (contracts || []).find(c => c.roomNumber === targetRoom && (c.status === 'PENDING_DEPOSIT' || c.status === 'PENDING_SIGN'));
      if (pendingContract && pendingContract.holdingUntil && Date.now() > pendingContract.holdingUntil) {
        return false;
      }

      return true;
    });
  }, [user, roomRequests, contracts, uName, uPhone]);

  // Đơn đăng ký giữ trọ của khách đang chờ Quản lý duyệt
  // Kiểm tra xem phòng có đơn PENDING từ bất kỳ ai đang chờ Quản lý duyệt hay không
  const isRoomPendingApproval = (roomNumber, houseCode) => {
    return (roomRequests || []).some((r) => {
      const matchRoom = (r.targetRoom === roomNumber || r.roomNumber === roomNumber);
      const matchHouse = !houseCode || !r.houseCode || r.houseCode === houseCode;
      const isRentType = r.type === 'RENT' || r.type === 'NEW_RENT' || r.type === 'RENTAL';
      return matchRoom && matchHouse && isRentType && r.status === 'PENDING';
    });
  };

  const myPendingRequest = useMemo(() => {
    return (roomRequests || []).find((r) =>
      (r.type === 'RENT' || r.type === 'NEW_RENT' || r.type === 'RENTAL') &&
      r.status === 'PENDING' &&
      ((uName && (r.tenant?.toLowerCase().includes(uName) || r.tenantName?.toLowerCase().includes(uName))) ||
       (uPhone && r.phone === uPhone) ||
       (user?.username === 'tenant_new'))
    );
  }, [user, roomRequests, uName, uPhone]);

  

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


  const getLandlordDisplayName = useCallback((house) => {
    if (!house) return 'Chủ trọ';
    if (house.landlordName) return house.landlordName;
    if (house.manager && !['staff', 'staff1', 'staff2', 'admin'].includes(house.manager.toLowerCase())) return house.manager;
    const uname = (house.managerUsername || house.createdBy || house.manager || '').toLowerCase();
    const l = (landlords || []).find((ld) => (ld.username || '').toLowerCase() === uname || ld.id === house.landlordId);
    if (l?.fullName) return l.fullName;
    if (uname === 'staff' || uname === 'staff1') return 'Lê Thị Thu Ngân';
    if (uname === 'staff2') return 'Đàm Văn Táo';
    if (uname === 'admin') return 'Ban Quản Lý Chuỗi';
    return 'Chủ trọ';
  }, [landlords]);

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

    // 1. TRƯỜNG HỢP GIỮ CHỖ: Khách có đơn giữ trọ / đặt cọc đã được duyệt hợp lệ (myApprovedRequest)
    if (myApprovedRequest) {
      const targetHouseCode = myApprovedRequest.houseCode ||
        (rooms || []).find((r) => r.number === (myApprovedRequest.targetRoom || myApprovedRequest.roomNumber))?.houseCode;
      if (targetHouseCode) {
        const h = storedBoardingHouses.find((house) => house.code === targetHouseCode);
        if (h) return getLandlordKeyFromHouse(h);
      }
      if (myApprovedRequest.house) {
        const h = storedBoardingHouses.find((house) =>
          house.name.toLowerCase().includes(myApprovedRequest.house.toLowerCase()) ||
          myApprovedRequest.house.toLowerCase().includes(house.name.toLowerCase())
        );
        if (h) return getLandlordKeyFromHouse(h);
      }
      if (myApprovedRequest.house && myApprovedRequest.house.includes('Cầu Giấy')) return 'staff';
      if (myApprovedRequest.house && myApprovedRequest.house.includes('Bách Khoa')) return 'staff2';
    }

    // 2. TRƯỜNG HỢP GIỮ CHỖ: Khách có hợp đồng PENDING_DEPOSIT hoặc PENDING_SIGN còn hiệu lực giữ chỗ
    const validPendingContract = (contracts || []).find((c) => {
      if (c.status !== 'PENDING_DEPOSIT' && c.status !== 'PENDING_SIGN') return false;
      const cName = (c.tenantName || '').toLowerCase().trim();
      const cPhone = (c.tenantPhone || '').trim();
      const isMine = (uName && (cName.includes(uName) || uName.includes(cName))) ||
                     (uPhone && cPhone === uPhone) ||
                     (user?.username === 'tenant_new');
      if (!isMine) return false;
      if (c.holdingUntil && Date.now() > c.holdingUntil) return false;
      return true;
    });
    if (validPendingContract?.houseCode) {
      const h = storedBoardingHouses.find((house) => house.code === validPendingContract.houseCode);
      if (h) return getLandlordKeyFromHouse(h);
    }

    // 3. TRƯỜNG HỢP THUÊ TRỌ: Khách thực sự đang có phòng thuê ACTIVE và chưa trả phòng
    const myRooms = (user?.rooms && user.rooms.length > 0)
      ? user.rooms
      : (user?.room ? [user.room] : ((user?.username && tenantRooms?.[user.username]) || []));

    if (myRooms.length > 0) {
      const activeContract = (contracts || []).find((c) => {
        if (c.status !== 'ACTIVE') return false;
        if (!myRooms.includes(c.roomNumber)) return false;
        const cName = (c.tenantName || '').toLowerCase().trim();
        const cPhone = (c.tenantPhone || '').trim();
        const isMine = (uName && (cName.includes(uName) || uName.includes(cName))) ||
                       (uPhone && cPhone === uPhone);
        if (!isMine) return false;

        // Đảm bảo phòng này chưa có đơn CHECKOUT/RETURN/LEAVE_ROOM đã duyệt
        const hasCheckedOut = (roomRequests || []).some(
          req => (req.type === 'CHECKOUT' || req.type === 'RETURN' || req.type === 'LEAVE_ROOM') &&
                 (req.targetRoom === c.roomNumber || req.currentRoom === c.roomNumber) &&
                 req.status === 'APPROVED'
        );
        return !hasCheckedOut;
      });

      if (activeContract?.houseCode) {
        const h = storedBoardingHouses.find((house) => house.code === activeContract.houseCode);
        if (h) return getLandlordKeyFromHouse(h);
      }

      const matchR = (rooms || []).find((r) => myRooms.includes(r.number));
      if (matchR?.houseCode) {
        const h = storedBoardingHouses.find((house) => house.code === matchR.houseCode);
        if (h) return getLandlordKeyFromHouse(h);
      }
    }

    // NẾU ĐÃ TRẢ PHÒNG HOẶC CHƯA GIỮ CHỖ / CHƯA THUÊ -> TRẢ VỀ NULL!
    // KHÁCH ĐƯỢC XEM TOÀN BỘ CƠ SỞ VÀ PHÒNG CỦA TẤT CẢ CHỦ TRỌ
    return null;
  }, [user, tenantRooms, rooms, storedBoardingHouses, contracts, roomRequests, myApprovedRequest, getLandlordKeyFromHouse]);

  // CHỈ HIỂN THỊ CƠ SỞ CỦA CHỦ TRỌ MÀ KHÁCH ĐANG ĐẶT CỌC / THUÊ (LỌC BỎ HOÀN TOÀN CƠ SỞ CỦA CHỦ TRỌ KHÁC)
  const visibleHousesForUser = useMemo(() => {
    const active = storedBoardingHouses.filter((h) => h.status === 'ACTIVE');
    if (tenantAssociatedLandlordKey) {
      const landlordHouses = active.filter((h) => getLandlordKeyFromHouse(h) === tenantAssociatedLandlordKey);
      if (landlordHouses.length > 0) return landlordHouses;
    }
    return active;
  }, [storedBoardingHouses, tenantAssociatedLandlordKey, getLandlordKeyFromHouse]);

  // Nhóm cơ sở theo khu vực
  const locationGroups = useMemo(() => {
    const validHouses = visibleHousesForUser.filter((h) => h.status !== 'PENDING_APPROVAL');
    const map = new Map();

    validHouses.forEach((house) => {
      const district = getHouseDistrict(house);
      const houseRooms = (rooms || []).filter((r) => r.houseCode === house.code);
      const availableRooms = houseRooms.filter((r) => r.status === 'AVAILABLE');
      const prices = houseRooms.map((r) => Number(r.price) || 0).filter((p) => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      if (!map.has(district)) {
        map.set(district, {
          district,
          houses: [],
          totalRooms: 0,
          availableRoomsCount: 0,
          minPrice: minPrice || 0,
          maxPrice: maxPrice || 0,
          landlords: new Set()
        });
      }

      const group = map.get(district);
      const owner = getLandlordDisplayName(house);
      group.houses.push({
        ...house,
        address: getHouseFullAddress(house),
        landlordDisplay: owner,
        roomsCount: houseRooms.length,
        availableCount: availableRooms.length,
        minPrice,
        maxPrice
      });
      group.totalRooms += houseRooms.length;
      group.availableRoomsCount += availableRooms.length;
      if (minPrice > 0 && (group.minPrice === 0 || minPrice < group.minPrice)) group.minPrice = minPrice;
      if (maxPrice > group.maxPrice) group.maxPrice = maxPrice;
      group.landlords.add(owner);
    });

    return Array.from(map.values()).map((g) => ({
      ...g,
      landlordsList: Array.from(g.landlords)
    }));
  }, [visibleHousesForUser, rooms, getLandlordDisplayName]);

  // Tự động điều chỉnh khi bị giới hạn theo cơ sở của chủ trọ đang đặt cọc
  useEffect(() => {
    if (tenantAssociatedLandlordKey) {
      if (selectedHouse !== 'ALL' && !visibleHousesForUser.some((h) => h.code === selectedHouse)) {
        setSelectedHouse('ALL');
      }
      if (tenantLocation && !locationGroups.some((g) => g.district === tenantLocation)) {
        setTenantLocation(null);
      }
    }
  }, [tenantAssociatedLandlordKey, visibleHousesForUser, locationGroups, selectedHouse, tenantLocation]);

  const myRequests = useMemo(() => {
    const uName = (user?.fullName || '').toLowerCase().trim();
    const uPhone = (user?.phone || '').trim();
    return (roomRequests || []).filter((r) => {
      const rName = (r.tenant || r.tenantName || '').toLowerCase().trim();
      const rPhone = (r.phone || r.tenantPhone || '').trim();
      return (uName && (rName.includes(uName) || uName.includes(rName))) || (uPhone && rPhone === uPhone);
    });
  }, [roomRequests, user]);

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
      // BẮT BUỘC: Phòng phải thuộc một trong các cơ sở trong visibleHousesForUser (không xem phòng chủ trọ khác)
      if (!visibleHousesForUser.some((h) => h.code === room.houseCode)) return false;

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
    if (myApprovedRequest && (myApprovedRequest.targetRoom === room.number || myApprovedRequest.roomNumber === room.number)) {
      navigate('/');
      return;
    }
    if (isRoomPendingApproval(room.number, room.houseCode)) {
      const isMine = myPendingRequest && (myPendingRequest.targetRoom === room.number || myPendingRequest.roomNumber === room.number);
      if (isMine) {
        setActionToast('ℹ️ Đơn giữ trọ phòng ' + room.number + ' của bạn đang chờ Quản lý cơ sở phê duyệt hồ sơ!');
      } else {
        setActionToast('⚠️ Phòng ' + room.number + ' đang có khách đăng ký giữ chỗ và chờ Quản lý duyệt. Vui lòng chọn phòng khác!');
      }
      setTimeout(() => setActionToast(null), 4000);
      return;
    }
    if (myPendingRequest && (myPendingRequest.targetRoom === room.number || myPendingRequest.roomNumber === room.number)) {
      setActionToast('ℹ️ Đơn giữ trọ phòng ' + room.number + ' đang chờ Quản lý phê duyệt hồ sơ!');
      setTimeout(() => setActionToast(null), 4000);
      return;
    }
    setRentModalRoom(room);
    setRentNote('');
  };

  const handleConfirmRentRequest = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!rentModalRoom) return;
    setIsSubmittingRent(true);

    const targetHouseName = rentModalRoom.house ||
      visibleHousesForUser.find(h => h.code === rentModalRoom.houseCode)?.name ||
      'Nhà Trọ Cầu Giấy - Cơ Sở 1';

    const result = submitRoomRequest({
      type: 'RENT',
      targetRoom: rentModalRoom.number,
      roomNumber: rentModalRoom.number,
      houseCode: rentModalRoom.houseCode || 'CS-01',
      house: targetHouseName,
      tenant: user?.fullName || 'Khách thuê',
      tenantName: user?.fullName || 'Khách thuê',
      phone: user?.phone || '0987.654.321',
      note: rentNote.trim() || `Đăng ký giữ trọ đặt cọc phòng ${rentModalRoom.number}`,
      price: rentModalRoom.price
    });

    setIsSubmittingRent(false);
    setRentModalRoom(null);

    if (result && result.error) {
      setActionToast(`⚠️ ${result.message}`);
    } else {
      setActionToast(`🎉 Đã gửi đơn đăng ký giữ trọ phòng ${rentModalRoom.number} thành công! Đang chờ Quản lý cơ sở phê duyệt.`);
    }
    setTimeout(() => setActionToast(null), 5000);
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
            {selectedHouse !== 'ALL'
              ? `Danh Sách Phòng: ${visibleHousesForUser.find((h) => h.code === selectedHouse)?.name || selectedHouse}`
              : tenantLocation && !tenantViewAllFlat
              ? `Các Cơ Sở Nhà Trọ Tại ${tenantLocation}`
              : tenantViewAllFlat
              ? 'Toàn Bộ Phòng Đang Mở Cho Thuê'
              : 'Tìm Trọ Theo Địa Chỉ & Cơ Sở'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">
            {selectedHouse !== 'ALL'
              ? `Địa chỉ: ${getHouseFullAddress(visibleHousesForUser.find((h) => h.code === selectedHouse))} • Quản lý: ${visibleHousesForUser.find((h) => h.code === selectedHouse)?.manager || 'Chủ trọ'}`
              : tenantLocation && !tenantViewAllFlat
              ? 'Chọn cơ sở bạn muốn xem để khám phá các phòng trống, tiện ích và giá niêm yết.'
              : tenantViewAllFlat
              ? (tenantAssociatedLandlordKey ? `Đang hiển thị toàn bộ phòng thuộc chuỗi nhà trọ của ${getLandlordDisplayName(visibleHousesForUser[0])}.` : 'Đang hiển thị toàn bộ phòng của tất cả các cơ sở trên toàn sàn.')
              : (tenantAssociatedLandlordKey ? `Hiển thị các cơ sở & phòng thuộc chuỗi nhà trọ của ${getLandlordDisplayName(visibleHousesForUser[0])} mà bạn đang đặt cọc / thuê.` : 'Chọn địa chỉ hoặc khu vực bạn muốn tìm phòng để xem các cơ sở của từng chủ trọ uy tín.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          

          <button
            type="button"
            onClick={() => setShowRequestsHistory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold rounded-xl shadow-xs transition-all btn-press cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Lịch Sử Đơn Của Bạn ({myRequests.length})</span>
          </button>
        </div>
      </div>

      {actionToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between">
          <span>{actionToast}</span>
          <button onClick={() => setActionToast(null)}>✕</button>
        </div>
      )}

      {/* Banner Đơn Đã Được Duyệt / Chờ Duyệt */}
      {myApprovedRequest && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/50 shadow-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl shrink-0 border border-emerald-500/30">
              🎉
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black border border-emerald-500/30 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ĐƠN GIỮ TRỌ ĐÃ ĐƯỢC DUYỆT!</span>
              </div>
              <div className="text-xs sm:text-sm text-slate-200">
                Đơn giữ phòng <strong className="text-amber-300 font-mono text-sm">{myApprovedRequest.targetRoom || myApprovedRequest.roomNumber}</strong> ({myApprovedRequest.house || 'Cơ sở đã chọn'}) đã được Quản lý phê duyệt. Vui lòng nộp cọc (1 tháng tiền trọ) và ký HĐ điện tử để hoàn tất nhận phòng!
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2.5 text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer btn-press"
          >
            <span>Chuyển Đến Màn Hình Nộp Cọc & Ký HĐ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {myPendingRequest && !myApprovedRequest && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
          <div className="text-xs">
            Đơn đăng ký giữ phòng <strong className="font-mono font-bold text-amber-700 dark:text-amber-300">{myPendingRequest.targetRoom || myPendingRequest.roomNumber}</strong> của bạn đang chờ Quản lý / Staff phê duyệt. Khi Quản lý duyệt, hệ thống sẽ mở cổng nộp cọc và ký hợp đồng điện tử online!
          </div>
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
              className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
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
              title="Xem toàn bộ phòng của tất cả cơ sở dạng lưới phẳng"
            >
              <span>🏢 Xem nhanh tất cả phòng ({rooms.filter(r => visibleHousesForUser.some(h => h.code === r.houseCode)).length})</span>
            </button>
          )}
        </div>
      </div>

      {/* BƯỚC 1: Chọn Khu Vực */}
      {selectedHouse === 'ALL' && !tenantLocation && !tenantViewAllFlat ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-purple-700">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span>BƯỚC 1: CHỌN ĐỊA CHỈ / KHU VỰC BẠN MUỐN TÌM TRỌ</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {locationGroups.length} khu vực ({visibleHousesForUser.length} cơ sở chuỗi)
            </span>
          </div>

          {locationGroups.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
              Hiện chưa có cơ sở nhà trọ nào đang mở cho thuê trên hệ thống.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locationGroups.map((group) => (
                <div
                  key={group.district}
                  onClick={() => {
                    setTenantLocation(group.district);
                    setTenantViewAllFlat(false);
                  }}
                  className="bento-card p-5 cursor-pointer hover:shadow-xl hover:border-purple-300 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group border-slate-200/90 bg-white"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-700 flex items-center justify-center font-bold text-xl group-hover:from-purple-600 group-hover:to-indigo-600 group-hover:text-white transition-all shadow-inner">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                        🟢 Còn {group.availableRoomsCount} phòng trống
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 mt-4 group-hover:text-purple-700 transition-colors">
                      {group.district}
                    </h3>

                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Gồm {group.houses.length} cơ sở nhà trọ trực thuộc
                    </p>

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Mức giá phổ biến:</span>
                        <span className="font-extrabold text-purple-700">
                          {group.minPrice > 0 ? `${(group.minPrice / 1000000).toFixed(1)} Tr` : '3.0 Tr'} – {group.maxPrice > 0 ? `${(group.maxPrice / 1000000).toFixed(1)} Tr` : '5.0 Tr'}/tháng
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>Chủ trọ / Ban QL:</span>
                        <span className="font-semibold truncate max-w-[150px] text-slate-800" title={(group.landlordsList || []).join(', ')}>
                          {(group.landlordsList || []).join(', ') || 'Chủ trọ'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600 group-hover:text-purple-700">
                    <span>Khám phá các cơ sở tại đây</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : selectedHouse === 'ALL' && tenantLocation && !tenantViewAllFlat ? (
        /* BƯỚC 2: Chọn Cơ Sở trong Khu Vực */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-purple-700">
                <Building2 className="w-4 h-4" />
                <span>Bước 2: Chọn Cơ Sở Nhà Trọ Tại {tenantLocation}</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Có {(locationGroups.find((g) => g.district === tenantLocation)?.houses || []).length} cơ sở của các chủ trọ đang mở cho thuê. Chọn một cơ sở để xem danh sách phòng:
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTenantLocation(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-purple-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Đổi Địa Chỉ Khác</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(locationGroups.find((g) => g.district === tenantLocation)?.houses || []).map((house) => {
              return (
                <div
                  key={house.code}
                  className="bento-card p-5 border-slate-200/90 bg-white flex flex-col justify-between hover:shadow-xl hover:border-purple-300 transition-all duration-300 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-base shadow-2xs">
                          🏢
                        </span>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm group-hover:text-purple-700 transition-colors">
                            {house.name}
                          </h4>
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                            {house.code}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        🟢 Còn {house.availableCount} phòng trống
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-slate-600 flex items-start gap-1.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="font-medium leading-relaxed">{house.address}</span>
                    </div>

                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Chủ trọ / Quản lý:</span>
                        <span className="font-bold text-slate-800">{house.landlordDisplay}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Quy mô cơ sở:</span>
                        <span className="font-semibold text-slate-700">{house.roomsCount} phòng</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Khoảng giá thuê:</span>
                        <span className="font-extrabold text-purple-700">
                          {house.minPrice > 0 ? `${house.minPrice.toLocaleString('vi-VN')} đ` : 'Liên hệ'} {house.maxPrice > house.minPrice ? `- ${house.maxPrice.toLocaleString('vi-VN')} đ` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-100">Khóa vân tay</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-100">Camera 24/7</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-100">Giờ giấc tự do</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-100">Không chung chủ</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedHouse(house.code)}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 transition-all btn-press flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Xem Các Phòng Thuộc Cơ Sở Này</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>      ) : (
        /* BƯỚC 3: Danh Sách Phòng Trọ */
        <div className="space-y-4">
          {/* Banner giới thiệu cơ sở hiện tại dành cho khách thuê ở Bước 3 */}
          {selectedHouse !== 'ALL' && (
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 p-4 rounded-2xl border border-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  🏢
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900">
                      {visibleHousesForUser.find((h) => h.code === selectedHouse)?.name || selectedHouse}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 text-[10px] font-black">
                      {selectedHouse}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{getHouseFullAddress(visibleHousesForUser.find((h) => h.code === selectedHouse))}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Chủ trọ / Quản lý: <strong>{visibleHousesForUser.find((h) => h.code === selectedHouse)?.manager || 'Chủ trọ'}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedHouse('ALL');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Đổi Cơ Sở Khác</span>
              </button>
            </div>
          )}

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
                          {(() => {
                            const isPendingOther = isRoomPendingApproval(room.number, room.houseCode);
                            if (room.status === 'AVAILABLE') {
                              if (isPendingOther) {
                                return (
                                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-500/95 text-white backdrop-blur-md shadow-md flex items-center gap-1 animate-pulse">
                                    <span>⏳</span>
                                    <span>Chờ duyệt</span>
                                  </span>
                                );
                              }
                              return (
                                <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-500/90 text-white backdrop-blur-md shadow-md">
                                  🟢 Còn trống
                                </span>
                              );
                            }
                            if (room.status === 'HOLDING') {
                              return (
                                <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-500/95 text-white backdrop-blur-md shadow-md animate-pulse">
                                  🔒 Đang giữ chỗ
                                </span>
                              );
                            }
                            return (
                              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-900/80 text-white backdrop-blur-md shadow-md">
                                Đang thuê
                              </span>
                            );
                          })()}
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
                        (() => {
                          const isThisApproved = myApprovedRequest && (myApprovedRequest.targetRoom === room.number || myApprovedRequest.roomNumber === room.number);
                          const isThisPending = myPendingRequest && (myPendingRequest.targetRoom === room.number || myPendingRequest.roomNumber === room.number);
                          const isPendingOther = isRoomPendingApproval(room.number, room.houseCode);

                          if (isThisApproved) {
                            return (
                              <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="text-xs text-white font-bold px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-xs transition-all flex-1 text-center btn-press cursor-pointer flex items-center justify-center gap-1 animate-pulse"
                              >
                                <span>Nộp Cọc & Ký HĐ</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            );
                          }

                          if (isThisPending) {
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  setActionToast('ℹ️ Đơn giữ trọ đang chờ Quản lý phê duyệt. Hệ thống sẽ mở cổng nộp cọc ngay khi được duyệt!');
                                  setTimeout(() => setActionToast(null), 4000);
                                }}
                                className="text-[11px] text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 font-bold px-2.5 py-2 rounded-xl shadow-xs transition-all flex-1 text-center cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Chờ Quản Lý Duyệt</span>
                              </button>
                            );
                          }

                          // Nếu có khách khác đang gửi đơn PENDING chờ duyệt -> Khóa nút với Khách khác
                          if (isPendingOther) {
                            return (
                              <button
                                type="button"
                                disabled
                                className="text-[11px] text-amber-900 bg-amber-100/90 border border-amber-300/80 font-bold px-2 py-2 rounded-xl shadow-2xs opacity-85 flex-1 text-center cursor-not-allowed flex items-center justify-center gap-1"
                                title="Phòng này đang có khách gửi đơn đăng ký giữ chỗ và đang chờ Quản lý duyệt hồ sơ"
                              >
                                <Clock className="w-3.5 h-3.5 text-amber-700" />
                                <span>Đang Có Người Chờ Duyệt</span>
                              </button>
                            );
                          }

                          return (
                            <button
                              type="button"
                              onClick={() => handleDepositClick(room)}
                              className="text-xs text-white font-bold px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all flex-1 text-center btn-press cursor-pointer"
                            >
                              Giữ Trọ Đặt Cọc
                            </button>
                          );
                        })()
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
                  Giữ Trọ Đặt Cọc (1 Tháng Tiền Trọ)
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Đăng Ký Giữ Trọ & Đặt Cọc */}
      {rentModalRoom && (
        <Modal
          isOpen={!!rentModalRoom}
          onClose={() => !isSubmittingRent && setRentModalRoom(null)}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Đăng Ký Giữ Trọ Phòng {rentModalRoom.number}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {rentModalRoom.house || visibleHousesForUser.find(h => h.code === rentModalRoom.houseCode)?.name || 'Cơ sở đã chọn'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRentModalRoom(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price & Deposit Summary */}
            <div className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200/80 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Giá thuê niêm yết:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {rentModalRoom.price.toLocaleString('vi-VN')} đ/tháng
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-purple-100">
                <span className="text-purple-900 font-semibold flex items-center gap-1">
                  <span>Tiền cọc giữ trọ</span>
                  <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-bold">1 tháng</span>:
                </span>
                <span className="font-black text-purple-700 text-base">
                  {rentModalRoom.price.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Thông tin người đăng ký */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Khách đăng ký:</span>
                <span className="font-bold text-slate-900">{user?.fullName || 'Khách thuê'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-bold text-slate-900">{user?.phone || '0987.654.321'}</span>
              </div>
            </div>

            {/* Note Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 text-xs">
                Ghi chú gửi Quản lý / Staff (Tùy chọn):
              </label>
              <textarea
                value={rentNote}
                onChange={(e) => setRentNote(e.target.value)}
                placeholder="Ví dụ: Em muốn giữ phòng và sẽ dọn vào từ ngày 15 tới..."
                rows={2}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none resize-none"
              />
            </div>

            {/* Quy trình giải thích */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1 leading-relaxed">
              <div className="font-bold flex items-center gap-1 text-amber-800">
                <span>📌 Quy trình xét duyệt & nộp cọc:</span>
              </div>
              <p>
                Sau khi bấm gửi đơn, <strong>Quản lý / Staff</strong> cơ sở sẽ xem xét duyệt hồ sơ của bạn.
              </p>
              <p>
                Ngay khi được duyệt, hệ thống sẽ mở cổng <strong>Giữ chỗ 15 phút</strong> trên Cổng Khách Thuê để bạn nộp cọc <strong>1 tháng tiền thuê ({rentModalRoom.price.toLocaleString('vi-VN')} đ)</strong> và ký hợp đồng điện tử online.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRentModalRoom(null)}
                disabled={isSubmittingRent}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmRentRequest}
                disabled={isSubmittingRent}
                className="px-5 py-2 font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {isSubmittingRent ? (
                  <span>Đang gửi...</span>
                ) : (
                  <>
                    <span>Gửi Đơn Đăng Ký Đến Quản Lý</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
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
