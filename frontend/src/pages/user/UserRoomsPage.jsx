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
  UserPlus,
  CheckCircle2,
  CheckCircle,
  Clock,
  Sparkles,
  FileText,
  X,
  Phone,
  DollarSign,
  CheckSquare,
  Inbox,
  Lock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Modal from '../../components/common/Modal';
import ResidentContractModal from '../../components/tenant/ResidentContractModal';
import RoommateRequestModal from '../../components/tenant/RoommateRequestModal';
import TenantMoveOutNoticeModal from '../../components/settlement/TenantMoveOutNoticeModal';

export function normalizeHouseCode(code) {
  if (!code) return '';
  const c = String(code).trim().toUpperCase();
  if (c === 'CS-01' || c === 'CS1') return 'CS-01';
  if (c === 'CS-02' || c === 'CS2') return 'CS-02';
  if (c === 'CS-03' || c === 'CS3') return 'CS-03';
  return c;
}

export function isSameRoom(a, b) {
  const normA = String(a || '').replace(/^phòng\s*/i, '').replace(/^p[\.\s_-]*/i, '').trim().toLowerCase();
  const normB = String(b || '').replace(/^phòng\s*/i, '').replace(/^p[\.\s_-]*/i, '').trim().toLowerCase();
  return Boolean(normA && normB && normA === normB);
}

export function isSameHouse(codeA, codeB) {
  if (!codeA || !codeB) return false;
  return normalizeHouseCode(codeA) === normalizeHouseCode(codeB);
}

export function normalizeRoomNumber(number) {
  if (!number) return '';
  return String(number)
    .trim()
    .toLowerCase()
    .replace(/^phòng\s*/i, '')
    .replace(/^p[\.\s_-]*/i, '')
    .trim();
}
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

  // Nếu staff2 đã có cơ sở thực tế (S2-CS-* hoặc id > 1000), loại bỏ triệt để cơ sở mẫu cũ CS-02 (Hai Bà Trưng)
  const hasStaff2Custom = list.some((h) => 
    (h.createdBy === 'staff2' || h.managerUsername === 'staff2' || (h.manager && h.manager.toLowerCase().includes('táo'))) &&
    ((h.code || '').toUpperCase().startsWith('S2-') || (typeof h.id === 'number' && h.id > 1000) || (h.name && (h.name.includes('Hoàng Mai') || (h.name.includes('Đống Đa') && (h.manager || '').includes('Táo')))))
  );

  let cleanList = list;
  if (hasStaff2Custom) {
    cleanList = list.filter((h) => {
      const isLegacyCs02 = h.code === 'CS-02' || (h.id === 2 && (h.name || '').includes('Bách Khoa')) || ((h.name || '').includes('Bách Khoa') && (h.manager || '').toLowerCase().includes('táo'));
      if (isLegacyCs02) {
        changed = true;
        return false;
      }
      return true;
    });
  }

  const healed = cleanList.map((h) => {
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
    voteRoommateRequest,
    respondContractTransfer,
    cancelRoomRequest
  } = useData();

  // Hàm tính toán số cư dân thực tế trong phòng chuẩn xác theo roomMembers & hợp đồng ACTIVE
  const getActualOccupants = (room) => {
    if (!room || room.status === 'LOCKED' || room.status === 'MAINTENANCE') return 0;
    const cleanNum = String(room.number || '').replace(/^phòng\s*/i, '').replace(/^p[\.\s_-]*/i, '').trim().toLowerCase();
    const roomHouse = String(room.houseCode || 'CS-01').trim().toUpperCase();

    // 1. Đếm số thành viên còn đang cư trú thực tế trong phòng
    const activeMems = (roomMembers || []).filter((m) => {
      const mClean = String(m.roomNumber || '').replace(/^phòng\s*/i, '').replace(/^p[\.\s_-]*/i, '').trim().toLowerCase();
      const matchRoom = mClean === cleanNum;
      const mHouse = String(m.houseCode || 'CS-01').trim().toUpperCase();
      const matchHouse = mHouse === roomHouse;
      return matchRoom && matchHouse && m.status !== 'MOVED_OUT';
    });
    if (activeMems.length > 0) return activeMems.length;

    // 2. Nếu có hợp đồng ACTIVE tại phòng này
    const hasActiveContract = (contracts || []).some((c) => {
      const cClean = String(c.roomNumber || '').replace(/^phòng\s*/i, '').replace(/^p[\.\s_-]*/i, '').trim().toLowerCase();
      const matchRoom = cClean === cleanNum;
      const cHouse = String(c.houseCode || 'CS-01').trim().toUpperCase();
      const matchHouse = cHouse === roomHouse;
      return matchRoom && matchHouse && c.status === 'ACTIVE';
    });
    if (hasActiveContract) return 1;

    // 3. Kiểm tra tenants (phải khớp đúng cơ sở!)
    const hasActiveTenant = (tenants || []).some((t) => {
      if (t.status === 'INACTIVE' || t.status === 'WAITING_ROOM') return false;
      const matchHouse = isSameHouse(t.houseCode, roomHouse) || (!t.houseCode && isSameHouse('CS-01', roomHouse));
      if (!matchHouse) return false;
      const tRooms = t.rooms || (t.room ? [t.room] : []);
      return tRooms.some(rn => String(rn || '').replace(/^phòng\s*/i, '').replace(/^p[\.\s_-]*/i, '').trim().toLowerCase() === cleanNum);
    });
    if (hasActiveTenant) return 1;

    // 4. Fallback theo room.occupants nếu phòng OCCUPIED
    if (room.status === 'OCCUPIED' && typeof room.occupants === 'number' && room.occupants > 0) {
      return room.occupants;
    }
    return 0;
  };

  // Kiểm tra xem phòng có khách đang nộp cọc / giữ chỗ mà CHƯA KÝ HỢP ĐỒNG điện tử hay không
  // (Nếu khách 1 đã nộp cọc mà chưa ký HĐ, hoặc phòng chưa có HĐ active chính thức -> khóa nút ở ghép của khách khác)
  const isRoomAwaitingContractSignature = useCallback((room) => {
    if (!room) return false;
    const cleanRoomNum = normalizeRoomNumber(room.number);
    const rHouseCode = room.houseCode || 'CS-01';

    // Nếu phòng đã có bất kỳ hợp đồng ACTIVE nào ĐÃ KÝ ĐIỆN TỬ chính thức -> Đã có cư dân sống hợp lệ
    const hasSignedActiveContract = (contracts || []).some((c) => {
      const cRoomClean = normalizeRoomNumber(c.roomNumber);
      if (cRoomClean !== cleanRoomNum) return false;
      if (c.houseCode && !isSameHouse(c.houseCode, rHouseCode)) return false;
      return c.status === 'ACTIVE' && c.signedElectronically;
    });
    if (hasSignedActiveContract) return false;

    // 1. Kiểm tra contracts xem có hợp đồng PENDING_SIGN (đã cọc chờ ký) hoặc PENDING_DEPOSIT
    const hasPendingSignContract = (contracts || []).some((c) => {
      const cRoomClean = normalizeRoomNumber(c.roomNumber);
      if (cRoomClean !== cleanRoomNum) return false;
      if (c.houseCode && !isSameHouse(c.houseCode, rHouseCode)) return false;

      const isDepositPaid = Boolean(
        c.depositPaid ||
        (typeof localStorage !== 'undefined' && (
          localStorage.getItem(`rental_deposit_paid_${c.id}`) === 'true' ||
          localStorage.getItem(`rental_deposit_paid_${c.roomNumber}`) === 'true' ||
          localStorage.getItem(`rental_deposit_paid_${cleanRoomNum}`) === 'true'
        ))
      );
      const isSigned = Boolean(c.signedElectronically && c.status === 'ACTIVE');

      return c.status === 'PENDING_SIGN' || (isDepositPaid && !isSigned) || (c.status === 'PENDING_DEPOSIT');
    });
    if (hasPendingSignContract) return true;

    // 2. Kiểm tra cờ localStorage nộp cọc theo phòng
    if (typeof localStorage !== 'undefined') {
      const isPaidInStorage =
        localStorage.getItem(`rental_deposit_paid_${room.number}`) === 'true' ||
        localStorage.getItem(`rental_deposit_paid_${cleanRoomNum}`) === 'true';
      if (isPaidInStorage) return true;
    }

    // 3. Kiểm tra đơn giữ chỗ đã duyệt
    const hasApprovedRentReq = (roomRequests || []).some((req) => {
      const isRent = req.type === 'RENT' || req.type === 'NEW_RENT' || req.type === 'RENTAL';
      if (!isRent || req.status !== 'APPROVED') return false;
      const reqRoom = normalizeRoomNumber(req.targetRoom || req.roomNumber);
      if (reqRoom !== cleanRoomNum) return false;
      if (req.houseCode && !isSameHouse(req.houseCode, rHouseCode)) return false;
      return true;
    });
    if (hasApprovedRentReq) return true;

    // 4. Nếu phòng đang ở trạng thái HOLDING
    if (room.status === 'HOLDING') return true;

    return false;
  }, [contracts, roomRequests]);

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
    if (!user) return null;

    // 1. BẮT BUỘC: Phải tồn tại một hợp đồng đang chờ nộp cọc / ký HĐ còn hiệu lực giữ chỗ
    const validPendingContract = (contracts || []).find((c) => {
      if (c.status !== 'PENDING_DEPOSIT' && c.status !== 'PENDING_SIGN') return false;
      const cName = (c.tenantName || '').toLowerCase().trim();
      const cPhone = (c.tenantPhone || '').trim();
      const matchUser = ((uName && (cName.includes(uName) || uName.includes(cName))) ||
                         (uPhone && cPhone === uPhone) ||
                         (user?.username === 'tenant_new'));
      if (!matchUser) return false;
      if (c.holdingUntil && Date.now() > c.holdingUntil) return false;
      return true;
    });

    // 2. Hoặc phòng trong danh mục rooms đang được giữ chỗ bởi chính khách này còn hạn
    const holdingRoom = (rooms || []).find((r) => {
      if (r.status !== 'HOLDING') return false;
      const matchUser = ((uName && (r.holdingBy?.toLowerCase().includes(uName) || uName.includes(r.holdingBy?.toLowerCase()))) ||
                         (uPhone && r.holdingPhone === uPhone));
      if (!matchUser) return false;
      if (r.holdingUntil && Date.now() > r.holdingUntil) return false;
      return true;
    });

    // NẾU KHÔNG CÓ HỢP ĐỒNG GIỮ CHỖ CÒN HẠN VÀ KHÔNG CÓ PHÒNG ĐANG GIỮ CHỖ -> TUYỆT ĐỐI KHÔNG CÓ ĐƠN GIỮ TRỌ NÀO!
    if (!validPendingContract && !holdingRoom) {
      return null;
    }

    const targetRoomClean = String(validPendingContract?.roomNumber || holdingRoom?.number || '').replace(/^P\.?/i, '').trim();

    // 3. Nếu khách đã trả phòng / rời phòng này rồi -> Không hiển thị
    const hasCheckedOut = (roomRequests || []).some((req) => {
      const isOut = (req.type === 'CHECKOUT' || req.type === 'RETURN' || req.type === 'LEAVE_ROOM');
      if (!isOut || (req.status !== 'APPROVED' && req.status !== 'CHECKOUT_SETTLED' && !req.settledAt)) return false;
      const rRoomClean = String(req.targetRoom || req.currentRoom || '').replace(/^P\.?/i, '').trim();
      return rRoomClean && targetRoomClean && rRoomClean === targetRoomClean;
    });
    if (hasCheckedOut) return null;

    // 4. Tìm đơn RENT/NEW_RENT tương ứng đang APPROVED
    return (roomRequests || []).find((r) => {
      const isRent = (r.type === 'RENT' || r.type === 'NEW_RENT' || r.type === 'RENTAL');
      if (!isRent || r.status !== 'APPROVED') return false;
      const matchUser = ((uName && (r.tenant?.toLowerCase().includes(uName) || r.tenantName?.toLowerCase().includes(uName))) ||
                         (uPhone && r.phone === uPhone) ||
                         (user?.username === 'tenant_new'));
      if (!matchUser) return false;
      const rClean = String(r.targetRoom || r.roomNumber || '').replace(/^P\.?/i, '').trim();
      return !targetRoomClean || rClean === targetRoomClean;
    }) || (validPendingContract ? {
      targetRoom: validPendingContract.roomNumber,
      roomNumber: validPendingContract.roomNumber,
      house: validPendingContract.houseName,
      houseCode: validPendingContract.houseCode,
      tenant: validPendingContract.tenantName,
      status: 'APPROVED'
    } : null);
  }, [user, roomRequests, contracts, rooms, uName, uPhone]);

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
        if (Array.isArray(parsed) && parsed.length > 0) {
          return healBoardingHousesList(parsed);
        }
      }
    } catch {}
    return isZeroSandbox ? [] : [
      { id: 1, code: 'CS-01', name: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', address: 'Số 45, Ngõ 165 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội', manager: 'Lê Thị Thu Ngân (Staff CS1)', managerUsername: 'staff', createdBy: 'staff', status: 'ACTIVE', floors: 4 },
      { id: 2, code: 'CS-02', name: 'Nhà Trọ Bách Khoa - Cơ Sở 2', address: 'Số 18, Ngõ Tự Do, Phường Đồng Tâm, Quận Hai Bà Trưng, Hà Nội', manager: 'Đàm Văn Táo (Staff CS2)', managerUsername: 'staff2', createdBy: 'staff2', status: 'ACTIVE', floors: 4 },
      { id: 3, code: 'CS-03', name: 'Nhà Trọ Đống Đa - Cơ Sở 3', address: 'Số 92, Phố Chùa Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội', manager: 'Phạm Quốc Hùng', managerUsername: 'admin', createdBy: 'admin', status: 'ACTIVE', floors: 6 }
    ];
  });

  useEffect(() => {
    const handleSyncHouses = () => {
      try {
        const saved = localStorage.getItem('rental_boarding_houses');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setStoredBoardingHouses(healBoardingHousesList(parsed));
          }
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
  const [showPendingReviewModal, setShowPendingReviewModal] = useState(false);
  const [actionToast, setActionToast] = useState(null);

  // State cho Modal Xin Vào Ở Ghép (Phòng có người nhưng chưa đầy)
  const [joinRoomModalData, setJoinRoomModalData] = useState(null);
  const [joinNote, setJoinNote] = useState('');
  const [joinPhone, setJoinPhone] = useState('');
  const [joinCccd, setJoinCccd] = useState('');
  const [joinHometown, setJoinHometown] = useState('');

  const handleConfirmJoinRoom = (e) => {
    e.preventDefault();
    if (!joinRoomModalData) return;

    // Kiểm tra phòng có khách nộp cọc mà chưa ký hợp đồng không
    if (isRoomAwaitingContractSignature(joinRoomModalData)) {
      alert(`Phòng ${joinRoomModalData.number} đang có khách nộp cọc chờ hoàn tất ký hợp đồng điện tử. Vui lòng đợi khách chính ký xong hợp đồng mới có thể xin vào ở ghép!`);
      return;
    }

    // Kiểm tra xem khách có đang đứng tên Hợp đồng phòng khác chưa thanh lý không
    const userNameNorm = (user?.fullName || '').toLowerCase().trim();
    const repContract = (contracts || []).find(
      (c) =>
        c.status === 'ACTIVE' &&
        (c.tenantName || '').toLowerCase().trim().includes(userNameNorm) &&
        c.roomNumber !== joinRoomModalData.number
    );
    if (repContract) {
      alert(`Bạn đang là Người đại diện đứng tên Hợp đồng của phòng ${repContract.roomNumber}. Bạn bắt buộc phải thanh lý / trả phòng này trước khi xin sang ở ghép phòng khác!`);
      return;
    }

    const res = submitRoomRequest({
      type: 'ROOMMATE',
      targetRoom: joinRoomModalData.number,
      houseCode: joinRoomModalData.houseCode || 'CS-01',
      house: joinRoomModalData.house || (joinRoomModalData.houseCode === 'CS-02' ? 'Nhà Trọ Bách Khoa - Cơ Sở 2' : 'Nhà Trọ Cầu Giấy - Cơ Sở 1'),
      tenant: user?.fullName || 'Khách tìm ở ghép',
      phone: joinPhone || user?.phone || '0987.654.321',
      cccd: joinCccd || user?.cccd || '001201012345',
      hometown: joinHometown || 'Hà Nội',
      note: joinNote,
      status: 'WAITING_ROOMMATES'
    });

    if (res?.error) {
      alert(res.message);
      return;
    }

    setJoinRoomModalData(null);
    setActionToast(`🎉 Đã gửi đơn xin vào ở ghép phòng ${joinRoomModalData.number}! Đang chờ các bạn cùng phòng biểu quyết đồng ý.`);
    setTimeout(() => setActionToast(null), 5000);
  };


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

  const resolveLandlordKey = useCallback((houseCode, houseName) => {
    const code = (houseCode || '').toUpperCase().trim();
    const name = (houseName || '').toLowerCase().trim();
    if (code === 'CS-01' || code.startsWith('S1-') || name.includes('cầu giấy') || name.includes('ngân')) return 'staff';
    if (code === 'CS-02' || code.startsWith('S2-') || name.includes('bách khoa') || name.includes('táo')) return 'staff2';
    if (code === 'CS-03' || code.startsWith('S3-') || name.includes('hùng') || (code === 'CS-03' && name.includes('đống đa'))) return 'admin';
    return null;
  }, []);

  const getLandlordKeyFromHouse = useCallback((h) => {
    if (!h) return null;
    const direct = resolveLandlordKey(h.code, h.name);
    if (direct) return direct;
    const code = (h.code || '').toUpperCase();
    const c = (h.createdBy || '').toLowerCase();
    const mU = (h.managerUsername || '').toLowerCase();
    const m = (h.manager || '').toLowerCase();
    if (c === 'staff' || c === 'staff1' || mU === 'staff' || m.includes('ngân') || code === 'CS-01' || code.startsWith('S1-')) return 'staff';
    if (c === 'staff2' || mU === 'staff2' || m.includes('táo') || code === 'CS-02' || code.startsWith('S2-')) return 'staff2';
    if (c === 'admin' || mU === 'admin' || m.includes('hùng') || code === 'CS-03' || code.startsWith('S3-')) return 'admin';
    return c || mU || 'other';
  }, [resolveLandlordKey]);

  const isRoomCheckedOut = useCallback((rNum) => {
    if (!rNum) return false;
    const clean = normalizeRoomNumber(rNum);

    // 1. Kiểm tra đơn CHECKOUT / RETURN đã được duyệt
    const reqOut = (roomRequests || []).some(
      (r) =>
        (r.type === 'CHECKOUT' || r.type === 'RETURN') &&
        normalizeRoomNumber(r.targetRoom || r.currentRoom || r.roomNumber) === clean &&
        (r.status === 'APPROVED' || r.status === 'CHECKOUT_SETTLED' || r.status === 'SETTLED' || r.settledAt)
    );
    if (reqOut) return true;

    // 2. Kiểm tra biên bản quyết toán
    try {
      const sSt = localStorage.getItem('rental_move_out_settlements');
      if (sSt) {
        const sts = JSON.parse(sSt);
        if (Array.isArray(sts) && sts.some(s => normalizeRoomNumber(s.roomNumber) === clean && (s.settledAt || s.refundStatus === 'COMPLETED' || s.status === 'SETTLED'))) {
          return true;
        }
      }
    } catch {}

    // 3. Kiểm tra danh mục phòng: nếu phòng mang trạng thái AVAILABLE hoặc occupants === 0
    const matchedRoom = (rooms || []).find(r => normalizeRoomNumber(r.number) === clean);
    if (matchedRoom && (matchedRoom.status === 'AVAILABLE' || matchedRoom.occupants === 0)) {
      return true;
    }

    // 4. Kiểm tra hợp đồng: nếu phòng có hợp đồng nhưng không còn hợp đồng ACTIVE
    const roomContracts = (contracts || []).filter(c => normalizeRoomNumber(c.roomNumber) === clean);
    const hasActive = roomContracts.some(c => c.status === 'ACTIVE');
    if (!hasActive && roomContracts.length > 0) {
      return true;
    }

    return false;
  }, [roomRequests, rooms, contracts]);

  const myCurrentRoom = useMemo(() => {
    if (user?.username === 'tenant_new') return null;

    const uName = (user?.fullName || '').toLowerCase().trim();
    const myUname = (user?.username || '').toLowerCase().trim();

    // 0. Kiểm tra trực tiếp rental_tenant_rooms từ localStorage (nguồn chuẩn sự thật)
    try {
      const sTR = localStorage.getItem('rental_tenant_rooms');
      if (sTR) {
        const parsedTR = JSON.parse(sTR);
        let storedList = parsedTR?.[myUname];
        if (storedList === undefined && user?.fullName) {
          storedList = parsedTR[user.fullName];
        }
        if (storedList === undefined) {
          if (myUname === 'tenant2' || uName.includes('cường')) {
            storedList = parsedTR.tenant2 !== undefined ? parsedTR.tenant2 : parsedTR['Phạm Minh Cường'];
          } else if (myUname === 'tenant1' || uName.includes('an')) {
            storedList = parsedTR.tenant1 !== undefined ? parsedTR.tenant1 : parsedTR['Nguyễn Văn An'];
          } else if (myUname === 'tenant_new' || uName.includes('nam')) {
            storedList = parsedTR.tenant_new !== undefined ? parsedTR.tenant_new : parsedTR['Hoàng Văn Nam'];
          }
        }
        if (Array.isArray(storedList)) {
          if (storedList.length === 0) return null;
          const valid = storedList.find((rn) => !isRoomCheckedOut(rn));
          if (!valid) return null;
          return valid;
        }
      }
    } catch {}

    // 1. Kiểm tra trong tenantRooms (AuthContext)
    let stored = myUname && tenantRooms?.[myUname] !== undefined
      ? tenantRooms[myUname]
      : (user?.fullName && tenantRooms?.[user.fullName] !== undefined ? tenantRooms[user.fullName] : undefined);

    if (stored === undefined || stored === null) {
      if (myUname === 'tenant2' || uName.includes('cường')) {
        stored = tenantRooms?.tenant2 !== undefined ? tenantRooms.tenant2 : tenantRooms?.['Phạm Minh Cường'];
      } else if (myUname === 'tenant1' || uName.includes('an')) {
        stored = tenantRooms?.tenant1 !== undefined ? tenantRooms.tenant1 : tenantRooms?.['Nguyễn Văn An'];
      } else if (myUname === 'tenant_new' || uName.includes('nam')) {
        stored = tenantRooms?.tenant_new !== undefined ? tenantRooms.tenant_new : tenantRooms?.['Hoàng Văn Nam'];
      }
    }

    if (Array.isArray(stored)) {
      if (stored.length === 0) return null;
      const validRoom = stored.find((rn) => !isRoomCheckedOut(rn));
      if (!validRoom) return null;
      return validRoom;
    }
    if (typeof stored === 'string') {
      if (!stored || isRoomCheckedOut(stored)) return null;
      return stored;
    }

    // 2. Nếu user object có rooms rỗng
    if (user?.rooms && Array.isArray(user.rooms) && user.rooms.length === 0) return null;
    if (user?.room === null || user?.room === '') return null;

    // 3. Kiểm tra xem có Hợp đồng ACTIVE nào chưa trả phòng không
    const activeContract = (contracts || []).find((c) => {
      if (c.status !== 'ACTIVE') return false;
      const cName = (c.tenantName || '').toLowerCase().trim();
      const cPhone = (c.tenantPhone || '').trim();
      const match = (uName && (cName.includes(uName) || uName.includes(cName))) || (user?.phone && cPhone === user.phone);
      if (!match) return false;
      if (isRoomCheckedOut(c.roomNumber)) return false;
      return true;
    });
    if (activeContract) return activeContract.roomNumber;

    // 4. Kiểm tra trong roomMembers
    const activeMember = (roomMembers || []).find((m) => {
      if (m.status === 'MOVED_OUT' || m.status === 'INACTIVE') return false;
      const mName = (m.fullName || '').toLowerCase().trim();
      const match = (uName && (mName.includes(uName) || uName.includes(mName))) || (user?.phone && m.phone === user.phone);
      if (!match) return false;
      if (isRoomCheckedOut(m.roomNumber || m.room)) return false;
      return true;
    });
    if (activeMember) return activeMember.roomNumber || activeMember.room;

    // 5. Nếu user object có room
    const fallbackRooms = Array.isArray(user?.rooms) ? user.rooms : (user?.room ? [user.room] : []);
    const validFallback = fallbackRooms.find((rn) => !isRoomCheckedOut(rn));
    return validFallback || null;
  }, [user, tenantRooms, contracts, roomMembers, isRoomCheckedOut]);

  const tenantAssociatedLandlordKey = useMemo(() => {
    // NẾU KHÁCH KHÔNG CÓ PHÒNG ĐANG THUÊ THỰC SỰ HOẶC ĐÃ THOÁT PHÒNG / TRẢ PHÒNG:
    // TUYỆT ĐỐI TRẢ VỀ NULL ĐỂ KHÁCH ĐƯỢC XEM TOÀN BỘ PHÒNG & CƠ SỞ CỦA TẤT CẢ CHỦ TRỌ!
    const uName = (user?.fullName || '').toLowerCase().trim();
    const uPhone = (user?.phone || '').trim();

    // 1. Chỉ khóa chủ trọ khi khách đang có đơn cọc giữ chỗ pending
    const validPendingContract = (contracts || []).find((c) => {
      if (c.status !== 'PENDING_DEPOSIT' && c.status !== 'PENDING_SIGN') return false;
      const cName = (c.tenantName || '').toLowerCase().trim();
      const cPhone = (c.tenantPhone || '').trim();
      const isMine =
        (uName && (cName.includes(uName) || uName.includes(cName))) ||
        (uPhone && cPhone === uPhone) ||
        (user?.username === 'tenant_new' && (c.tenantName?.toLowerCase().includes('nam') || c.contractCode === 'HD-2026-007'));
      if (!isMine) return false;
      if (c.holdingUntil && Date.now() > c.holdingUntil) return false;
      return true;
    });

    if (!myCurrentRoom) {
      if (validPendingContract) {
        const directKey = resolveLandlordKey(validPendingContract.houseCode, validPendingContract.houseName);
        if (directKey) return directKey;
        if (validPendingContract.houseCode) {
          const h = storedBoardingHouses.find((house) => isSameHouse(house.code, validPendingContract.houseCode));
          if (h) return getLandlordKeyFromHouse(h);
        }
      }
      return null;
    }

    // 2. KHÁCH ĐANG THỰC SỰ CƯ TRÚ TRONG PHÒNG (ACTIVE RENTAL)
    const matchRoom = (rooms || []).find((r) => normalizeRoomNumber(r.number) === normalizeRoomNumber(myCurrentRoom));
    const targetHouseCode = matchRoom?.houseCode || user?.houseCode;
    const targetHouseName = matchRoom?.house || user?.houseName;
    if (targetHouseCode) {
      const directKey = resolveLandlordKey(targetHouseCode, targetHouseName);
      if (directKey) return directKey;
      const h = storedBoardingHouses.find((house) => isSameHouse(house.code, targetHouseCode));
      if (h) return getLandlordKeyFromHouse(h);
    }

    return null;
  }, [user, contracts, storedBoardingHouses, myCurrentRoom, rooms, resolveLandlordKey, getLandlordKeyFromHouse]);

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
    const uUsername = (user?.username || '').toLowerCase().trim();
    return (roomRequests || []).filter((r) => {
      const rName = (r.tenant || r.tenantName || '').toLowerCase().trim();
      const rPhone = (r.phone || r.tenantPhone || '').trim();
      const rUsername = (r.username || '').toLowerCase().trim();

      const matchUsername = uUsername && rUsername === uUsername;
      const matchPhone = uPhone && rPhone === uPhone;
      const matchName = Boolean(
        uName && rName && (
          rName === uName ||
          (uName.includes('an') && rName.includes('an')) ||
          (uName.includes('cường') && rName.includes('cường')) ||
          (uName.includes('nam') && rName.includes('nam'))
        )
      );

      return matchUsername || matchPhone || matchName;
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
    if (currentTenant?.status === 'INACTIVE' || currentTenant?.status === 'WAITING_ROOM') return [];
    const checkedOutRooms = (roomRequests || [])
      .filter(r => (r.type === 'CHECKOUT' || r.type === 'LEAVE_ROOM' || r.type === 'RETURN') &&
                   (r.status === 'APPROVED' || r.status === 'CHECKOUT_SETTLED' || r.status === 'SETTLED' || r.settledAt) &&
                   ((uName && (r.tenant?.toLowerCase().includes(uName) || r.tenantName?.toLowerCase().includes(uName))) || (uPhone && r.phone === uPhone)))
      .map(r => r.targetRoom || r.currentRoom || r.roomNumber);

    let list = [];
    if (currentTenant?.rooms && currentTenant.rooms.length > 0) list = [...currentTenant.rooms];
    else if (currentTenant?.room) list = [currentTenant.room];
    else if (userRoom) list = Array.isArray(userRoom) ? [...userRoom] : [userRoom];

    // Bổ sung phòng từ hợp đồng ACTIVE của user (giống hệt UserDashboard)
    (contracts || []).forEach((c) => {
      if (c.status === 'ACTIVE' && c.roomNumber) {
        const cName = (c.tenantName || '').toLowerCase().trim();
        const cPhone = (c.tenantPhone || '').trim();
        const isMyContract = (uName && (cName.includes(uName) || uName.includes(cName))) ||
          (uPhone && cPhone === uPhone) ||
          (user?.username === 'tenant1' && cName.includes('an')) ||
          (user?.username === 'tenant2' && cName.includes('cường'));
        if (isMyContract && !list.includes(c.roomNumber)) {
          list.push(c.roomNumber);
        }
      }
    });

    // Bổ sung phòng từ roomMembers mà user đang cư trú (status !== 'MOVED_OUT')
    (roomMembers || []).forEach((m) => {
      if (m.roomNumber && m.status !== 'MOVED_OUT') {
        const mName = (m.fullName || '').toLowerCase().trim();
        const mPhone = (m.phone || '').trim();
        const isMyMember = (uName && (mName.includes(uName) || uName.includes(mName))) ||
          (uPhone && mPhone === uPhone) ||
          (user?.username === 'tenant1' && mName.includes('an')) ||
          (user?.username === 'tenant2' && mName.includes('cường'));
        if (isMyMember && !list.includes(m.roomNumber)) {
          list.push(m.roomNumber);
        }
      }
    });

    return list.filter(r => !checkedOutRooms.includes(r));
  }, [isTenantNew, currentTenant, userRoom, roomRequests, uName, uPhone, contracts, roomMembers, user]);

  const myRentedRoom = myRentedRooms[0] || null;

  // Các yêu cầu gửi tới người này cần duyệt (Ở ghép vào phòng mình & Nhận bàn giao hợp đồng)
  const pendingReviewRequests = useMemo(() => {
    const uName = (user?.fullName || '').toLowerCase().trim();
    const uPhone = (user?.phone || '').trim();
    const myRooms = Array.isArray(myRentedRooms) && myRentedRooms.length > 0
      ? myRentedRooms
      : (myRentedRoom ? [myRentedRoom] : (userRoom ? (Array.isArray(userRoom) ? userRoom : [userRoom]) : []));

    return (roomRequests || []).filter((req) => {
      // 1. Đơn xin ở ghép gửi vào phòng của user
      const isRoommateReq = (req.type === 'ROOMMATE' || req.type === 'JOIN_ROOM') &&
        (req.status === 'WAITING_ROOMMATES' || req.status === 'PENDING') &&
        myRooms.some(r => isSameRoom(r, req.targetRoom || req.roomNumber)) &&
        // Không phải đơn do chính user này gửi
        !((uName && (req.tenant?.toLowerCase().includes(uName) || uName.includes(req.tenant?.toLowerCase()))) || (uPhone && req.phone === uPhone)) &&
        // Chưa biểu quyết
        !(req.roommateVotes || []).some(v => (v.voter || '').toLowerCase().trim().includes(uName));

      // 2. Đề xuất bàn giao quyền đại diện HĐ gửi đích danh tới user
      const isTransferToMe = req.type === 'TRANSFER_CONTRACT' &&
        req.status === 'PENDING_ACCEPTANCE' &&
        ((req.toTenant || '').toLowerCase().trim().includes(uName) || uName.includes((req.toTenant || '').toLowerCase().trim()));

      // 3. Đơn đại diện xin trả phòng (CHECKOUT) hoặc chuyển phòng (TRANSFER) đang chờ bạn cùng phòng biểu quyết
      const isCheckoutOrTransferVoting = (req.type === 'CHECKOUT' || req.type === 'TRANSFER') &&
        req.status === 'WAITING_ROOMMATES' &&
        myRooms.some(r => isSameRoom(r, req.targetRoom || req.currentRoom || req.roomNumber)) &&
        !((uName && (req.tenant?.toLowerCase().includes(uName) || uName.includes(req.tenant?.toLowerCase()))) || (uPhone && req.phone === uPhone)) &&
        !(req.roommateVotes || []).some(v => (v.voter || '').toLowerCase().trim().includes(uName));

      return isRoommateReq || isTransferToMe || isCheckoutOrTransferVoting;
    });
  }, [roomRequests, myRentedRooms, myRentedRoom, userRoom, user]);

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
      const actualOcc = getActualOccupants(room);
      if (filterStatus === 'AVAILABLE' && (room.status !== 'AVAILABLE' || actualOcc > 0)) return false;
      if (filterStatus === 'HOLDING' && room.status !== 'HOLDING') return false;
      if (filterStatus === 'OCCUPIED' && room.status !== 'OCCUPIED' && actualOcc === 0) return false;

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
          {/* Nút Xét Duyệt Yêu Cầu Chờ Bạn Duyệt (Ở ghép & Bàn giao HĐ) */}
          <button
            type="button"
            onClick={() => setShowPendingReviewModal(true)}
            className={`flex items-center gap-2 px-4 py-2 border text-xs font-bold rounded-xl shadow-xs transition-all btn-press cursor-pointer ${
              pendingReviewRequests.length > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-amber-500/20'
                : 'bg-white border-purple-200 text-purple-700 hover:bg-purple-50'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Yêu Cầu Chờ Bạn Duyệt</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                pendingReviewRequests.length > 0
                  ? 'bg-white text-amber-800 shadow-2xs'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {pendingReviewRequests.length}
            </span>
          </button>

          {/* Nút Lịch Sử Đơn Của Bạn */}
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
                const isMyRented = myRentedRooms.includes(room.number);

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
                            const curOccupants = getActualOccupants(room);
                            const maxOcc = room.maxOccupants || 2;
                            const freeSlots = maxOcc - curOccupants;

                            // NẾU PHÒNG THỰC TẾ ĐANG CÓ NGƯỜI Ở
                            if (curOccupants > 0 || room.status === 'OCCUPIED') {
                              if (freeSlots > 0) {
                                return (
                                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white backdrop-blur-md shadow-md flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>Ở ghép (Còn {freeSlots} chỗ)</span>
                                  </span>
                                );
                              }
                              return (
                                <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-900/80 text-white backdrop-blur-md shadow-md">
                                  Đã đủ người ({curOccupants}/{maxOcc})
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
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                              <Users className="w-3 h-3 text-indigo-600" />
                              <span>{getActualOccupants(room)}/{room.maxOccupants || 2} người</span>
                            </span>
                            {getActualOccupants(room) > 0 && getActualOccupants(room) < (room.maxOccupants || 2) && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Còn trống {(room.maxOccupants || 2) - getActualOccupants(room)} chỗ
                              </span>
                            )}
                          </div>
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

                      {/* 1. Nếu phòng thực sự còn trống (không có ai ở và status là AVAILABLE) */}
                      {room.status === 'AVAILABLE' && getActualOccupants(room) === 0 && !isMyRented && (
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

                          // Nếu phòng đang chờ ký HĐ điện tử (khách nộp cọc chưa ký) -> Khóa nút đối với khách khác
                          if (isRoomAwaitingContractSignature(room)) {
                            return (
                              <button
                                type="button"
                                disabled
                                onClick={(e) => {
                                  e.preventDefault();
                                  setActionToast('⚠️ Phòng ' + room.number + ' đang có khách nộp cọc chờ hoàn tất ký hợp đồng điện tử. Sau khi ký xong HĐ mới mở đăng ký ở ghép!');
                                  setTimeout(() => setActionToast(null), 4000);
                                }}
                                title="Phòng đang có khách nộp cọc chờ hoàn tất ký hợp đồng điện tử. Sau khi ký HĐ xong mới mở nhận ở ghép."
                                className="text-[11px] text-slate-400 bg-slate-100 border border-slate-200 font-bold px-2 py-2 rounded-xl opacity-60 flex-1 text-center cursor-not-allowed flex items-center justify-center gap-1 select-none"
                              >
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Chờ Ký HĐ Mới Mở Ở Ghép</span>
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

                      {/* 2. Nếu phòng ĐANG CÓ NGƯỜI Ở HOẶC LÀ PHÒNG CỦA BẠN (OCCUPIED hoặc getActualOccupants > 0) */}
                      {(room.status !== 'AVAILABLE' || getActualOccupants(room) > 0 || isMyRented) && (
                        (() => {
                          const curOcc = getActualOccupants(room);
                          const maxOcc = room.maxOccupants || 2;
                          const isFull = curOcc >= maxOcc;

                          if (isMyRented) {
                            return (
                              <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold px-3 py-2 rounded-xl transition-all flex-1 text-center btn-press cursor-pointer flex items-center justify-center gap-1"
                              >
                                <span>Phòng Của Bạn</span>
                              </button>
                            );
                          }

                          if (isFull) {
                            return (
                              <button
                                type="button"
                                disabled
                                className="text-[11px] text-slate-400 bg-slate-100 border border-slate-200 font-bold px-2 py-2 rounded-xl opacity-75 flex-1 text-center cursor-not-allowed flex items-center justify-center gap-1"
                              >
                                <span>Đã Kín Chỗ ({curOcc}/{maxOcc})</span>
                              </button>
                            );
                          }

                          // Phòng chưa đầy (ví dụ 1/2 người): Có thể xin vào ở ghép
                          const uName = (user?.fullName || '').toLowerCase().trim();
                          const uPhone = (user?.phone || '').trim();
                          const myRoommateReq = (roomRequests || []).find((req) => {
                            if (req.type !== 'ROOMMATE') return false;
                            const reqRoom = String(req.targetRoom || req.roomNumber || '').replace(/^P\.?/i, '').trim();
                            const currRoom = String(room.number || '').replace(/^P\.?/i, '').trim();
                            if (reqRoom !== currRoom) return false;
                            if (req.houseCode && room.houseCode && !isSameHouse(req.houseCode, room.houseCode)) return false;
                            const rTenant = (req.tenant || req.tenantName || '').toLowerCase().trim();
                            const rPhone = (req.phone || '').trim();
                            return (uName && (rTenant.includes(uName) || uName.includes(rTenant))) || (uPhone && rPhone === uPhone);
                          });

                          if (myRoommateReq) {
                            if (myRoommateReq.status === 'WAITING_ROOMMATES') {
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionToast('⏳ Đơn xin ở ghép phòng ' + room.number + ' đang chờ các bạn cùng phòng biểu quyết.');
                                    setTimeout(() => setActionToast(null), 4000);
                                  }}
                                  className="text-[11px] text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 font-bold px-2 py-2 rounded-xl shadow-xs transition-all flex-1 text-center cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Chờ Phòng Duyệt</span>
                                </button>
                              );
                            }

                            if (myRoommateReq.status === 'ROOMMATES_APPROVED') {
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionToast('🎉 100% cư dân phòng đã đồng ý! Đang chờ Quản lý duyệt hồ sơ pháp lý CCCD.');
                                    setTimeout(() => setActionToast(null), 4000);
                                  }}
                                  className="text-[11px] text-purple-800 bg-purple-100 hover:bg-purple-200 border border-purple-300 font-bold px-2 py-2 rounded-xl shadow-xs transition-all flex-1 text-center cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <Clock className="w-3.5 h-3.5 text-purple-700" />
                                  <span>Chờ Quản Lý Duyệt</span>
                                </button>
                              );
                            }

                            if (myRoommateReq.status === 'APPROVED') {
                              return (
                                <button
                                  type="button"
                                  onClick={() => navigate('/')}
                                  className="text-xs text-white font-bold px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-xs transition-all flex-1 text-center btn-press cursor-pointer flex items-center justify-center gap-1 animate-pulse"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Đã Duyệt - Vào Phòng</span>
                                </button>
                              );
                            }

                            if (myRoommateReq.status === 'REJECTED_BY_ROOMMATES') {
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionToast('❌ Thành viên trong phòng đã từ chối đơn xin ở ghép này.');
                                    setTimeout(() => setActionToast(null), 4000);
                                  }}
                                  className="text-[11px] text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold px-2 py-2 rounded-xl transition-all flex-1 text-center cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <span>Phòng Từ Chối</span>
                                </button>
                              );
                            }
                          }

                          // Nếu phòng đang chờ ký HĐ điện tử (khách nộp cọc chưa ký) -> Khóa nút xin ở ghép đối với khách khác
                          if (isRoomAwaitingContractSignature(room)) {
                            return (
                              <button
                                type="button"
                                disabled
                                onClick={(e) => {
                                  e.preventDefault();
                                  setActionToast('⚠️ Phòng ' + room.number + ' đang có khách nộp cọc chờ hoàn tất ký hợp đồng điện tử. Sau khi ký xong HĐ mới mở đăng ký ở ghép!');
                                  setTimeout(() => setActionToast(null), 4000);
                                }}
                                title="Phòng đang có khách nộp cọc chờ hoàn tất ký hợp đồng điện tử. Sau khi ký HĐ xong mới mở nhận ở ghép."
                                className="text-[11px] text-slate-400 bg-slate-100 border border-slate-200 font-bold px-2 py-2 rounded-xl opacity-60 flex-1 text-center cursor-not-allowed flex items-center justify-center gap-1 select-none"
                              >
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Chờ Ký HĐ Mới Mở Ở Ghép</span>
                              </button>
                            );
                          }

                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setJoinRoomModalData(room);
                                setJoinPhone(user?.phone || '0987.654.321');
                                setJoinCccd(user?.cccd || '001201012345');
                                setJoinHometown(user?.hometown || 'Hà Nội');
                                setJoinNote('Em muốn xin vào ở ghép cùng các bạn trong phòng, tính tình gọn gàng sạch sẽ, chia đều chi phí phòng.');
                              }}
                              className="text-xs text-white font-bold px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-xs transition-all flex-1 text-center btn-press cursor-pointer flex items-center justify-center gap-1"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Xin Vào Ở Ghép</span>
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
                  {getActualOccupants(selectedRoomDetails) > 0 || selectedRoomDetails.status === 'OCCUPIED'
                    ? `Đang ở (${getActualOccupants(selectedRoomDetails)}/${selectedRoomDetails.maxOccupants || 2} người)`
                    : 'Còn trống'}
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

              {/* Nếu phòng đang chờ ký HĐ (khách nộp cọc chưa ký) -> Khóa nút với khách khác */}
              {isRoomAwaitingContractSignature(selectedRoomDetails) && !myRentedRooms.includes(selectedRoomDetails.number) ? (
                <button
                  type="button"
                  disabled
                  className="px-5 py-2 font-bold bg-slate-100 text-slate-400 border border-slate-200 rounded-xl cursor-not-allowed flex items-center gap-1.5 opacity-60 select-none"
                  title="Phòng đang có khách nộp cọc chờ hoàn tất ký hợp đồng điện tử. Sau khi ký HĐ xong mới mở nhận ở ghép."
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Chờ Ký HĐ Mới Mở Ở Ghép</span>
                </button>
              ) : (
                <>
                  {selectedRoomDetails.status === 'AVAILABLE' && getActualOccupants(selectedRoomDetails) === 0 && !myRentedRooms.includes(selectedRoomDetails.number) && (
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
                  {(selectedRoomDetails.status !== 'AVAILABLE' || getActualOccupants(selectedRoomDetails) > 0) && getActualOccupants(selectedRoomDetails) < (selectedRoomDetails.maxOccupants || 2) && !myRentedRooms.includes(selectedRoomDetails.number) && (
                    <button
                      type="button"
                      onClick={() => {
                        const r = selectedRoomDetails;
                        setSelectedRoomDetails(null);
                        setJoinRoomModalData(r);
                        setJoinPhone(user?.phone || '0987.654.321');
                        setJoinCccd(user?.cccd || '001201012345');
                        setJoinHometown(user?.hometown || 'Hà Nội');
                        setJoinNote('Em muốn xin vào ở ghép cùng các bạn trong phòng, tính tình gọn gàng sạch sẽ, chia đều chi phí phòng.');
                      }}
                      className="px-5 py-2 font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Xin Vào Ở Ghép</span>
                    </button>
                  )}
                </>
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

      {/* Modal 1: Lịch Sử Đơn Của Bạn (Đã tách riêng từng khách) */}
      {showRequestsHistory && (
        <Modal isOpen={showRequestsHistory} onClose={() => setShowRequestsHistory(false)} maxWidth="max-w-md">
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Lịch Sử Đơn Của Bạn</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Các đơn do bạn ({user?.fullName}) gửi lên hệ thống</p>
                </div>
              </div>
              <button onClick={() => setShowRequestsHistory(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {myRequests.length === 0 ? (
                <div className="py-8 text-center space-y-1.5">
                  <div className="text-3xl">📄</div>
                  <p className="font-bold text-slate-700">Bạn chưa gửi đơn nào</p>
                  <p className="text-slate-400 text-[11px]">Khi bạn gửi đơn giữ chỗ, ở ghép hoặc trả phòng, lịch sử sẽ lưu tại đây.</p>
                </div>
              ) : (
                myRequests.map((req) => {
                  let typeLabel = 'Đơn Khác';
                  let typeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (req.type === 'RENT' || req.type === 'NEW_RENT' || req.type === 'HOLD') {
                    typeLabel = 'Đăng Ký Thuê / Giữ Chỗ';
                    typeColor = 'bg-purple-50 text-purple-700 border-purple-200';
                  } else if (req.type === 'ROOMMATE' || req.type === 'JOIN_ROOM') {
                    typeLabel = 'Xin Vào Ở Ghép';
                    typeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                  } else if (req.type === 'TRANSFER') {
                    typeLabel = 'Xin Đổi Phòng';
                    typeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                  } else if (req.type === 'CHECKOUT' || req.type === 'LEAVE_ROOM') {
                    typeLabel = 'Trả Phòng / Rời Phòng';
                    typeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                  } else if (req.type === 'TRANSFER_CONTRACT') {
                    typeLabel = 'Bàn Giao Hợp Đồng';
                    typeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  }

                  const isApproved = req.status === 'APPROVED' || req.status === 'CHECKOUT_SETTLED';
                  const isRejected = req.status === 'REJECTED' || req.status === 'REJECTED_BY_ROOMMATES' || req.status === 'REJECTED_BY_TRANSFEREE';
                  const isCancelled = req.status === 'CANCELLED' || req.status === 'CANCELLED_BY_TENANT' || req.status === 'CANCELLED_BY_CANDIDATE';
                  const canCancel = req.status === 'PENDING' || req.status === 'WAITING_ROOMMATES' || req.status === 'ROOMMATES_APPROVED' || req.status === 'HOLDING' || req.status === 'PENDING_ACCEPTANCE';

                  let statusText = 'Chờ duyệt';
                  let statusCls = 'bg-amber-100 text-amber-800 border-amber-200';
                  if (isApproved) {
                    statusText = 'Đã duyệt';
                    statusCls = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  } else if (isCancelled) {
                    statusText = req.status === 'CANCELLED_BY_CANDIDATE' ? 'Đã rút đơn' : 'Đã hủy đơn';
                    statusCls = 'bg-slate-100 text-slate-600 border-slate-200';
                  } else if (isRejected) {
                    statusText = 'Bị từ chối';
                    statusCls = 'bg-rose-100 text-rose-800 border-rose-200';
                  } else if (req.status === 'ROOMMATES_APPROVED') {
                    statusText = 'Phòng đã duyệt (Chờ BQL)';
                    statusCls = 'bg-blue-100 text-blue-800 border-blue-200';
                  } else if (req.status === 'WAITING_ROOMMATES') {
                    statusText = 'Chờ bạn cùng phòng duyệt';
                    statusCls = 'bg-amber-100 text-amber-800 border-amber-200';
                  }

                  return (
                    <div key={req.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${typeColor}`}>
                          {typeLabel}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusCls}`}>
                          {statusText}
                        </span>
                      </div>
                      <div className="text-slate-700 font-semibold text-xs flex justify-between items-center pt-1">
                        <span>Phòng: <strong className="text-purple-700">{req.roomNumber || req.targetRoom || req.currentRoom || 'N/A'}</strong></span>
                        <span className="text-[10px] text-slate-400 font-normal">{req.date || req.createdAt || ''}</span>
                      </div>
                      {req.note && (
                        <p className="text-[11px] text-slate-500 italic bg-white p-1.5 rounded border border-slate-100">
                          "{req.note}"
                        </p>
                      )}
                      {isCancelled && req.cancelReason && (
                        <p className="text-[10.5px] text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          Lý do rút: {req.cancelReason}
                        </p>
                      )}
                      {canCancel && (
                        <div className="pt-1.5 flex justify-end border-t border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => {
                              const confirmMsg = (req.type === 'CHECKOUT' || req.type === 'LEAVE_ROOM')
                                ? 'Bạn có chắc chắn muốn rút lại đơn trả phòng để tiếp tục ở không?'
                                : (req.type === 'ROOMMATE' || req.type === 'JOIN_ROOM')
                                ? 'Bạn có chắc chắn muốn rút lại đơn xin vào ở ghép không?'
                                : 'Bạn có chắc chắn muốn rút lại đơn này không?';
                              if (window.confirm(confirmMsg)) {
                                const res = cancelRoomRequest(req.id);
                                if (res?.message) {
                                  setActionToast(res.message);
                                  setTimeout(() => setActionToast(null), 3500);
                                }
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-lg border border-rose-200 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <span>↩️</span>
                            <span>Rút lại đơn</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 2: Yêu Cầu Chờ Bạn Duyệt (Đồng ý người vào phòng & Chuyển đại diện HĐ) */}
      {showPendingReviewModal && (
        <Modal isOpen={showPendingReviewModal} onClose={() => setShowPendingReviewModal(false)} maxWidth="max-w-lg">
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Yêu Cầu Chờ Bạn Duyệt</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Xét duyệt người vào ở ghép, nhận đại diện HĐ và biểu quyết trả phòng</p>
                </div>
              </div>
              <button onClick={() => setShowPendingReviewModal(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {pendingReviewRequests.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="text-3xl">🎉</div>
                  <p className="font-bold text-slate-700">Không có yêu cầu nào cần bạn duyệt</p>
                  <p className="text-slate-400 text-[11px]">Khi có bạn mới xin vào ở ghép, đề xuất chuyển đại diện HĐ hoặc yêu cầu biểu quyết trả phòng, thông tin sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                pendingReviewRequests.map((req) => {
                  const isRoommate = req.type === 'ROOMMATE' || req.type === 'JOIN_ROOM';
                  const isTransfer = req.type === 'TRANSFER_CONTRACT';
                  const isCheckout = req.type === 'CHECKOUT' || req.type === 'TRANSFER';

                  return (
                    <div key={req.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                      {/* Tiêu đề loại yêu cầu */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isCheckout ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          isRoommate ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                          'bg-purple-100 text-purple-700 border border-purple-200'
                        }`}>
                          {isCheckout ? '🚪 Biểu Quyết Trả Phòng' : isRoommate ? '👤 Xin Vào Ở Ghép' : '👑 Chuyển Quyền Đại Diện HĐ'}
                        </span>
                        <span className="font-semibold text-slate-400 text-[10px]">{req.date || new Date().toLocaleDateString('vi-VN')}</span>
                      </div>

                      {/* Chi tiết nội dung */}
                      {isCheckout && (
                        <div className="space-y-1.5">
                          <p className="text-slate-800 font-bold text-sm">
                            Người đại diện: {req.tenant} <span className="text-xs font-normal text-slate-500">({req.phone})</span>
                          </p>
                          <p className="text-slate-600 text-xs">
                            Đã gửi yêu cầu <strong>trả toàn bộ phòng {req.targetRoom || req.currentRoom}</strong> để cả phòng cùng thanh lý hợp đồng dọn đi.
                          </p>
                          <p className="text-amber-800 text-[11px] bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                            ⚠️ Nếu bạn đồng ý, toàn bộ cư dân trong phòng sẽ cùng bàn giao phòng cho Ban Quản Lý. Nếu bạn muốn tiếp tục thuê phòng này, vui lòng chọn <strong>"Tôi Muốn Ở Tiếp"</strong>.
                          </p>
                          {req.note && (
                            <p className="text-slate-500 italic text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                              "{req.note}"
                            </p>
                          )}
                        </div>
                      )}

                      {isRoommate && (
                        <div className="space-y-1.5">
                          <p className="text-slate-800 font-bold text-sm">
                            {req.tenant} <span className="text-xs font-normal text-slate-500">({req.phone})</span>
                          </p>
                          <p className="text-slate-600 text-xs">
                            Muốn xin vào ở ghép tại phòng <strong>{req.targetRoom || req.roomNumber}</strong>.
                          </p>
                          {req.note && (
                            <p className="text-slate-500 italic text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                              "{req.note}"
                            </p>
                          )}
                        </div>
                      )}

                      {isTransfer && (
                        <div className="space-y-1.5">
                          <p className="text-slate-800 font-bold text-sm">
                            Từ: {req.fromTenant} ➔ {req.toTenant} (Bạn)
                          </p>
                          <p className="text-slate-600 text-xs">
                            Đề xuất bàn giao toàn bộ quyền và nghĩa vụ hợp đồng phòng <strong>{req.targetRoom}</strong> cho bạn.
                          </p>
                          {req.note && (
                            <p className="text-slate-500 italic text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                              "{req.note}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Nút hành động Đồng ý / Từ chối */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => {
                            if (isCheckout && voteRoommateRequest) {
                              voteRoommateRequest(req.id, user?.fullName, false);
                              setActionToast('Bạn đã từ chối yêu cầu trả phòng (bạn muốn tiếp tục ở lại).');
                            } else if (isRoommate && voteRoommateRequest) {
                              voteRoommateRequest(req.id, user?.fullName, false);
                              setActionToast(`Bạn đã từ chối yêu cầu ở ghép của ${req.tenant}.`);
                            } else if (isTransfer && respondContractTransfer) {
                              respondContractTransfer(req.id, false);
                              setActionToast('Bạn đã từ chối nhận chuyển giao hợp đồng.');
                            }
                          }}
                          className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          {isCheckout ? '❌ Tôi Muốn Ở Tiếp' : '❌ Từ Chối'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isCheckout && voteRoommateRequest) {
                              voteRoommateRequest(req.id, user?.fullName, true);
                              setActionToast('Bạn đã ĐỒNG Ý trả phòng cùng người đại diện!');
                            } else if (isRoommate && voteRoommateRequest) {
                              voteRoommateRequest(req.id, user?.fullName, true);
                              setActionToast(`Bạn đã ĐỒNG Ý cho ${req.tenant} vào ở ghép phòng ${req.targetRoom || req.currentRoom}!`);
                            } else if (isTransfer && respondContractTransfer) {
                              respondContractTransfer(req.id, true);
                              setActionToast('Bạn đã ĐỒNG Ý tiếp quản Hợp đồng thành công!');
                            }
                          }}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>{isCheckout ? '✅ Đồng Ý Trả Phòng' : '✅ Đồng Ý'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Modal>
      )}


      {/* Modal Xin Vào Ở Ghép (Phòng có người nhưng chưa đầy) */}
      {joinRoomModalData && (
        <Modal isOpen={!!joinRoomModalData} onClose={() => setJoinRoomModalData(null)} maxWidth="max-w-lg">
          <div className="space-y-4 text-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Xin Vào Ở Ghép - Phòng {joinRoomModalData.number}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {joinRoomModalData.house || joinRoomModalData.houseCode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setJoinRoomModalData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thông tin phòng & Cư dân hiện tại */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Giá phòng gốc:</span>
                <span className="font-bold text-purple-700">
                  {(joinRoomModalData.price || 0).toLocaleString('vi-VN')} đ/tháng
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sức chứa & Hiện tại:</span>
                <span className="font-bold text-slate-800">
                  {getActualOccupants(joinRoomModalData)}/{joinRoomModalData.maxOccupants || 2} người (Còn trống {(joinRoomModalData.maxOccupants || 2) - getActualOccupants(joinRoomModalData)} chỗ)
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <div className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cư dân đang cư trú trong phòng:</span>
                </div>
                <div className="space-y-1 pl-1">
                  {(roomMembers || [])
                    .filter((m) => m.roomNumber === joinRoomModalData.number && m.status !== 'MOVED_OUT' && (!joinRoomModalData.houseCode || m.houseCode === joinRoomModalData.houseCode))
                    .map((m) => (
                      <div key={m.id || m.fullName} className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-800">• {m.fullName}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                          {m.roleInRoom === 'REPRESENTATIVE' ? 'Đại diện HĐ' : 'Thành viên'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Hộp quy trình 2 vòng kiểm soát chuẩn BA */}
            <div className="p-3 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-2xl border border-indigo-200/80 text-[11px] text-indigo-950 space-y-1.5">
              <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Quy Trình 2 Vòng Kiểm Soát Xin Vào Ở Ghép:</span>
              </div>
              <p className="leading-relaxed">
                <strong>Vòng 1 (Dân chủ nội bộ):</strong> Sau khi bạn gửi đơn, <strong>toàn bộ thành viên đang ở trong phòng</strong> sẽ nhận được thông báo để biểu quyết. Yêu cầu <strong>100% thành viên đồng thuận</strong> thì đơn mới được thông qua.
              </p>
              <p className="leading-relaxed">
                <strong>Vòng 2 (Pháp lý Quản lý):</strong> Khi phòng đã đồng ý, <strong>Ban Quản Lý / Chủ trọ</strong> sẽ thẩm định hồ sơ CCCD, duyệt tiếp nhận và cấp quyền cư dân chính thức cho bạn.
              </p>
            </div>

            {/* Form thông tin người xin */}
            <form onSubmit={handleConfirmJoinRoom} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Họ và tên của bạn:</label>
                  <input
                    type="text"
                    disabled
                    value={user?.fullName || 'Khách tìm ở ghép'}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-600 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Số điện thoại liên hệ:</label>
                  <input
                    type="text"
                    required
                    value={joinPhone}
                    onChange={(e) => setJoinPhone(e.target.value)}
                    placeholder="0987.xxx.xxx"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Số CCCD (12 số):</label>
                  <input
                    type="text"
                    required
                    value={joinCccd}
                    onChange={(e) => setJoinCccd(e.target.value)}
                    placeholder="001201012345"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Quê quán / Tỉnh thành:</label>
                  <input
                    type="text"
                    value={joinHometown}
                    onChange={(e) => setJoinHometown(e.target.value)}
                    placeholder="Hà Nội, Nam Định, ..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Lời nhắn gửi các bạn cùng phòng (Giới thiệu bản thân):
                </label>
                <textarea
                  rows={3}
                  required
                  value={joinNote}
                  onChange={(e) => setJoinNote(e.target.value)}
                  placeholder="Ví dụ: Mình là sinh viên Bách Khoa năm 3, ngoan ngoãn sạch sẽ, muốn xin vào ở ghép chia đều tiền phòng..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setJoinRoomModalData(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-md transition-all btn-press cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Gửi Đơn Xin Vào Ở Ghép</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
