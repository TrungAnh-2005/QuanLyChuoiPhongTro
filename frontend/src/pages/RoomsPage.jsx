import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Home,
  Edit3,
  PlusCircle,
  RotateCcw,
  Plus,
  Filter,
  Search,
  Users,
  UserPlus,
  Maximize2,
  CheckCircle,
  AlertCircle,
  Wrench,
  Wifi,
  Wind,
  Flame,
  Tv,
  Building2,
  X,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  DollarSign,
  Phone,
  Send,
  CheckCircle2,
  Sparkles,
  FileText,
  LogOut,
  Pencil,
  Lock,
  Unlock,
  Clock,
  AlertTriangle,
  ArrowRight,
  Trash2,
  Image as ImageIcon,
  Upload,
  Camera,
  MapPin
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import Modal from '../components/common/Modal';
import ResidentContractModal from '../components/tenant/ResidentContractModal';
import RoommateRequestModal from '../components/tenant/RoommateRequestModal';
import TenantMoveOutNoticeModal from '../components/settlement/TenantMoveOutNoticeModal';
import MoveOutSettlementModal from '../components/settlement/MoveOutSettlementModal';
import TrialExpiryBanner from '../components/common/TrialExpiryBanner';
import { getTrialStatus } from '../utils/packagePermissions';

import { ALL_ROOMS, HOUSES_LIST, getRoomImage, isDuplicateRoom, isSameHouse, normalizeRoomNumber, normalizeHouseCode, healBoardingHousesList, parseFloorNum } from '../data/roomsData';
export { ALL_ROOMS, HOUSES_LIST };

export const ROOM_IMAGE_PRESETS = [
  { label: 'Phòng Studio Tiêu Chuẩn', url: '/assets/images/room_studio_1.jpg' },
  { label: 'Căn Duplex Gác Lửng', url: '/assets/images/room_duplex_2.jpg' },
  { label: 'Phòng Suite Ban Công Penthouse', url: '/assets/images/room_suite_3.jpg' },
  { label: 'Phòng Ngủ Tối Giản Hiện Đại', url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop' },
  { label: 'Phòng Full Nội Thất Cao Cấp', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop' }
];

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

const isZeroSandbox = typeof window !== 'undefined' && localStorage.getItem('rental_is_zero_sandbox') === 'true';

export default function RoomsPage() {
  const { user, tenantRooms } = useAuth();
  const role = user?.role || 'ADMIN';
  const isTenant = role === 'TENANT';
  const isStaff = role === 'STAFF';

  const [searchParams, setSearchParams] = useSearchParams();
  const rawParam = searchParams.get('house') || 'ALL';

  const {
    rooms,
    updateRoomStatus,
    updateRoomPrice,
    updateRoom,
    addRoom,
    deleteRoom,
    submitRoomRequest,
    cancelRoomHold,
    submitCheckoutRequest,
    leaveRoom,
    submitContractRenewalRequest,
    roomRequests = [],
    voteRoommateRequest,
    approveRoomRequest,
    transferRoom,
    rejectRoomRequest,
    tenants = [],
    roomMembers = [],
    addRoomMember,
    removeRoomMember,
    updateTemporaryResidence,
    contracts = [],
    signContractElectronically,
    roommateRequestsV2 = [],
    submitRoommateRequest,
    reviewRoommateRequest,
    moveOutSettlements = [],
    submitMoveOutNotice,
    settleMoveOut,
    invoices = [],
    payInvoice
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
      {
        id: 1,
        code: 'CS-01',
        name: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
        managerUsername: 'staff',
        createdBy: 'staff',
        status: 'ACTIVE',
        floors: 4
      },
      {
        id: 2,
        code: 'CS-02',
        name: 'Nhà Trọ Bách Khoa - Cơ Sở 2',
        managerUsername: 'staff2',
        createdBy: 'staff2',
        status: 'ACTIVE',
        floors: 4
      },
      {
        id: 3,
        code: 'CS-03',
        name: 'Nhà Trọ Đống Đa - Cơ Sở 3',
        managerUsername: 'admin',
        createdBy: 'admin',
        status: 'ACTIVE',
        floors: 6
      }
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

  const isHouseOfLandlord = useCallback((h, lKey) => {
    if (!lKey) return true;
    const hKey = getLandlordKeyFromHouse(h);
    return hKey === lKey;
  }, [getLandlordKeyFromHouse]);

  // Xác định Chủ trọ mà khách thuê đang liên kết:
  // CHỈ KHI NÀO khách ở 1 trong 2 chế độ:
  //   1. ĐANG THUÊ PHÒNG (Có phòng đang thuê hợp lệ & Hợp đồng thuê ACTIVE)
  //   2. ĐANG Ở CHẾ ĐỘ NỘP TIỀN CỌC (Đơn thuê đã được duyệt APPROVED/HOLDING chờ nộp cọc, hoặc Hợp đồng PENDING_DEPOSIT / PENDING_SIGN)
  // Nếu chưa ở 1 trong 2 chế độ trên -> return null (Hệ thống mở toàn bộ cơ sở của TẤT CẢ các chủ trọ để khách tự do tra cứu & đăng ký)
  const tenantAssociatedLandlordKey = useMemo(() => {
    if (!isTenant || !user) return null;

    const uName = (user?.fullName || '').toLowerCase().trim();
    const uPhone = (user?.phone || '').trim();
    const uUsername = (user?.username || '').trim().toLowerCase();

    // -------------------------------------------------------------
    // CHẾ ĐỘ 1: ĐANG THUÊ PHÒNG (ACTIVE LEASE)
    // -------------------------------------------------------------
    // Lấy danh sách phòng của CHÍNH khách này (không lấy của người khác)
    const myDirectRooms = (user?.rooms && Array.isArray(user.rooms) && user.rooms.length > 0)
      ? user.rooms.filter(Boolean)
      : (user?.room ? [user.room] : []);

    const myStoredRooms = tenantRooms
      ? (tenantRooms[uUsername] ?? (uName ? tenantRooms[uName] : []))
      : [];
    const myNormStoredRooms = Array.isArray(myStoredRooms)
      ? myStoredRooms.filter(Boolean)
      : (myStoredRooms ? [myStoredRooms] : []);

    const myCurrentRooms = myDirectRooms.length > 0 ? myDirectRooms : myNormStoredRooms;

    // Kiểm tra xem khách có thực sự đang thuê phòng không:
    // Phải có phòng, không ở trạng thái WAITING_ROOM (chưa thuê)
    if (myCurrentRooms.length > 0 && user?.status !== 'WAITING_ROOM') {
      const activeRoomNumber = myCurrentRooms[0];
      const matchR = (rooms || []).find((r) => r.number === activeRoomNumber);

      // Kiểm tra hợp đồng ACTIVE của chính khách này
      const hasActiveContract = (contracts || []).some((c) => {
        if (c.status !== 'ACTIVE') return false;
        const matchRoom = c.roomNumber === activeRoomNumber || c.room === activeRoomNumber;
        const cName = (c.tenantName || '').toLowerCase().trim();
        const cPhone = (c.tenantPhone || '').trim();
        const matchTenant = (uName && (cName.includes(uName) || uName.includes(cName))) ||
                            (uPhone && cPhone === uPhone) ||
                            (uUsername === 'tenant1' && cName.includes('an')) ||
                            (uUsername === 'tenant2' && cName.includes('cường'));
        return matchRoom && matchTenant;
      });

      // Nếu có hợp đồng ACTIVE hoặc phòng đó có trạng thái OCCUPIED
      if (hasActiveContract || (matchR && matchR.status === 'OCCUPIED')) {
        const targetHouseCode = matchR?.houseCode || user?.houseCode;
        if (targetHouseCode) {
          const h = storedBoardingHouses.find((h) => h.code === targetHouseCode);
          if (h) return getLandlordKeyFromHouse(h);
        }
      }
    }

    // -------------------------------------------------------------
    // CHẾ ĐỘ 2: ĐANG Ở CHẾ ĐỘ NỘP TIỀN CỌC (PENDING DEPOSIT / HOLDING)
    // -------------------------------------------------------------
    // 2.1. Hợp đồng ở trạng thái PENDING_DEPOSIT hoặc PENDING_SIGN (đang chờ nộp cọc hoặc đã duyệt chờ cọc)
    const matchDepositContract = (contracts || []).find((c) => {
      const isDepositState = (c.status === 'PENDING_DEPOSIT' || c.status === 'PENDING_SIGN') && !c.depositPaid;
      if (!isDepositState) return false;
      const cName = (c.tenantName || '').toLowerCase().trim();
      const cPhone = (c.tenantPhone || '').trim();
      return (
        (uName && (cName.includes(uName) || uName.includes(cName))) ||
        (uPhone && cPhone === uPhone) ||
        (uUsername === 'tenant1' && cName.includes('an')) ||
        (uUsername === 'tenant2' && cName.includes('cường'))
      );
    });
    if (matchDepositContract?.houseCode) {
      const h = storedBoardingHouses.find((h) => h.code === matchDepositContract.houseCode);
      if (h) return getLandlordKeyFromHouse(h);
    }

    // 2.2. Đơn thuê phòng đã được chủ trọ DUYỆT (APPROVED hoặc HOLDING) để chuyển sang nộp cọc
    // (Đơn mới chỉ PENDING hoặc WAITING_ROOMMATES thì CHƯA được nộp cọc nên chưa tính)
    const matchDepositReq = (roomRequests || []).find((req) => {
      const reqStatus = (req.status || '').toUpperCase();
      const isDepositReady = reqStatus === 'APPROVED' || reqStatus === 'HOLDING';
      if (!isDepositReady) return false;

      const reqTenant = (req.tenant || '').toLowerCase().trim();
      const reqPhone = (req.phone || '').trim();
      const matchT = (reqTenant && uName && (reqTenant.includes(uName) || uName.includes(reqTenant))) ||
                     (uPhone && reqPhone === uPhone) ||
                     (uUsername === 'tenant1' && reqTenant.includes('an')) ||
                     (uUsername === 'tenant2' && reqTenant.includes('cường'));
      return matchT;
    });
    if (matchDepositReq) {
      const targetHouseCode = matchDepositReq.houseCode ||
        (rooms || []).find((r) => r.number === (matchDepositReq.targetRoom || matchDepositReq.room))?.houseCode;
      if (targetHouseCode) {
        const h = storedBoardingHouses.find((h) => h.code === targetHouseCode);
        if (h) return getLandlordKeyFromHouse(h);
      }
    }

    // 2.3. Phòng trong danh sách rooms có trạng thái HOLDING khớp với khách này và còn hạn
    const matchHeldRoom = (rooms || []).find((r) => {
      if (r.status !== 'HOLDING') return false;
      const holdingBy = (r.holdingBy || '').toLowerCase().trim();
      const holdingPhone = (r.holdingPhone || '').trim();
      return (uName && holdingBy.includes(uName)) || (uPhone && holdingPhone === uPhone);
    });
    if (matchHeldRoom?.houseCode) {
      const h = storedBoardingHouses.find((h) => h.code === matchHeldRoom.houseCode);
      if (h) return getLandlordKeyFromHouse(h);
    }

    // Chưa ở chế độ nộp tiền cọc và chưa thuê phòng -> Không liên kết riêng với chủ trọ nào
    return null;
  }, [isTenant, user, tenantRooms, rooms, contracts, roomRequests, storedBoardingHouses, getLandlordKeyFromHouse]);

  const tenantAssociatedLandlordName = useMemo(() => {
    if (!tenantAssociatedLandlordKey) return 'Chủ trọ uy tín';
    if (tenantAssociatedLandlordKey === 'staff') return 'Lê Thị Thu Ngân';
    if (tenantAssociatedLandlordKey === 'staff2') return 'Đàm Văn Táo';
    if (tenantAssociatedLandlordKey === 'admin') return 'Phạm Quốc Hùng';
    return 'Chủ trọ của bạn';
  }, [tenantAssociatedLandlordKey]);

  // Lọc cơ sở mà người dùng hiện tại có quyền xem
  const visibleHousesForUser = useMemo(() => {
    if (storedBoardingHouses.length === 0) return [];

    let list = storedBoardingHouses;

    if (user?.role === 'STAFF') {
      const myUsername = (user?.username || '').toLowerCase();
      const myHouseCode = user?.houseCode;
      list = storedBoardingHouses.filter((h) => {
        const created = (h.createdBy || '').toLowerCase();
        const manager = (h.managerUsername || '').toLowerCase();
        if (created && created === myUsername) return true;
        if (manager && manager === myUsername) return true;
        if (myHouseCode && h.code === myHouseCode) return true;
        if (h.manager && user?.fullName && (
          h.manager.toLowerCase().includes(user.fullName.toLowerCase()) ||
          user.fullName.toLowerCase().includes(h.manager.toLowerCase())
        )) return true;
        if (!isZeroSandbox) {
          if (myUsername === 'staff' && (h.code === 'CS-01' || !h.createdBy)) return true;
          if (myUsername === 'staff2' && h.code === 'CS-02') return true;
        }
        return false;
      });
    } else if (isTenant) {
      if (tenantAssociatedLandlordKey) {
        // Cư dân đã liên kết / giữ chỗ / được duyệt tại chuỗi trọ của một chủ:
        // CHỈ XEM CÁC CƠ SỞ THUỘC CHỦ TRỌ NÀY (VD: Lê Thị Thu Ngân), TUYỆT ĐỐI KHÔNG HIỆN CHỦ KHÁC (Đàm Văn Táo)
        list = storedBoardingHouses.filter(
          (h) => h.status !== 'PENDING_APPROVAL' && isHouseOfLandlord(h, tenantAssociatedLandlordKey)
        );
      } else {
        // Khách mới hoặc chưa thuê phòng: Xem tất cả các cơ sở đã được phê duyệt
        list = storedBoardingHouses.filter((h) => h.status !== 'PENDING_APPROVAL');
      }
    }

    // Sắp xếp các cơ sở tăng dần theo số và chữ cái (1 trước 2, A trước Z)
    return [...list].sort((a, b) => {
      const nameA = String(a.name || a.code || '').trim();
      const nameB = String(b.name || b.code || '').trim();
      const cmp = nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      return String(a.code || '').localeCompare(String(b.code || ''), undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [storedBoardingHouses, user, isTenant, tenantRooms, rooms, tenantAssociatedLandlordKey, isHouseOfLandlord]);

  // Tổng số phòng thuộc chuỗi của Chủ trọ mà khách thuê đang liên kết
  const tenantChainRoomsCount = useMemo(() => {
    if (!isTenant || !tenantAssociatedLandlordKey) return rooms.length;
    const myLandlordHouseCodes = visibleHousesForUser.map((h) => h.code);
    return rooms.filter((r) => myLandlordHouseCodes.includes(r.houseCode)).length;
  }, [isTenant, tenantAssociatedLandlordKey, visibleHousesForUser, rooms]);

  // Danh sách cơ sở đã được Quản trị viên phê duyệt (ACTIVE) để cho phép tạo phòng
  const approvedHousesForUser = useMemo(() => {
    return visibleHousesForUser.filter(
      (h) => h.status === 'ACTIVE' || (!h.status && h.status !== 'PENDING_APPROVAL' && h.status !== 'LOCKED')
    );
  }, [visibleHousesForUser]);

  // Trích xuất danh sách Chủ Trọ độc lập từ các cơ sở hiện có
  const uniqueLandlords = useMemo(() => {
    const map = new Map();
    visibleHousesForUser.forEach((h) => {
      const u = (h.createdBy || h.managerUsername || '').toLowerCase();
      let key = u || 'other';
      let label = '';
      if (u === 'staff' || u === 'staff1' || h.code.startsWith('S1-')) {
        key = 'staff';
        label = 'Lê Thị Thu Ngân (Staff 1)';
      } else if (u === 'staff2' || h.code.startsWith('S2-')) {
        key = 'staff2';
        label = 'Đàm Văn Táo (Staff 2)';
      } else if (u === 'admin') {
        key = 'admin';
        label = 'Ban Quản Trị Hệ Thống';
      } else {
        label = h.manager || u || 'Chủ trọ';
      }
      if (!map.has(key)) {
        map.set(key, { key, label, count: 1 });
      } else {
        map.get(key).count += 1;
      }
    });
    return Array.from(map.values());
  }, [visibleHousesForUser]);

  const [selectedLandlord, setSelectedLandlord] = useState('ALL');

  const dynamicHousesList = useMemo(() => {
    if (visibleHousesForUser.length === 0) return [];

    // Nếu người dùng chọn lọc theo một Chủ trọ cụ thể
    const filteredHouses = selectedLandlord === 'ALL'
      ? visibleHousesForUser
      : visibleHousesForUser.filter((p) => {
          const u = (p.createdBy || p.managerUsername || '').toLowerCase();
          if (selectedLandlord === 'staff') return u === 'staff' || u === 'staff1' || p.code.startsWith('S1-');
          if (selectedLandlord === 'staff2') return u === 'staff2' || p.code.startsWith('S2-');
          if (selectedLandlord === 'admin') return u === 'admin' || p.code.startsWith('CS-');
          return u === selectedLandlord;
        });

    const items = filteredHouses.map((p) => {
      const isPending = p.status === 'PENDING_APPROVAL';
      const count = isPending ? 0 : (rooms || []).filter((r) => r.houseCode === p.code || (p.code === 'CS-01' && !r.houseCode)).length;

      // Trích xuất địa chỉ ngắn gọn (Quận / Huyện)
      let location = '';
      if (p.address) {
        const parts = p.address.split(',').map((s) => s.trim());
        if (parts.length >= 2) {
          location = `${parts[parts.length - 2]}, ${parts[parts.length - 1].replace(/Hà Nội/i, 'HN')}`;
        } else {
          location = p.address.length > 22 ? p.address.slice(0, 22) + '...' : p.address;
        }
      }

      // Xác định tên chủ trọ quản lý
      let landlordName = '';
      const u = (p.createdBy || p.managerUsername || '').toLowerCase();
      if (p.manager && !p.manager.toLowerCase().includes('admin')) {
        landlordName = p.manager.replace(/\s*\(Staff.*?\)/i, '').trim();
      } else if (u === 'staff' || u === 'staff1' || p.code.startsWith('S1-')) {
        landlordName = 'Lê Thị Thu Ngân (Staff 1)';
      } else if (u === 'staff2' || p.code.startsWith('S2-')) {
        landlordName = 'Đàm Văn Táo (Staff 2)';
      } else {
        landlordName = p.manager || 'Quản lý cơ sở';
      }

      // Nhãn chuỗi (Tag)
      let ownerTag = '';
      if (u === 'staff' || u === 'staff1' || p.code.startsWith('S1-')) ownerTag = 'Staff 1';
      else if (u === 'staff2' || p.code.startsWith('S2-')) ownerTag = 'Staff 2';
      else if (u === 'admin') ownerTag = 'Admin';

      return {
        id: p.id,
        code: p.code,
        name: p.name + (isPending ? ' (Chờ duyệt)' : ''),
        rawName: p.name,
        location,
        landlordName,
        ownerTag,
        address: p.address,
        isPending,
        totalRooms: count
      };
    });

    // Sắp xếp các cơ sở theo thứ tự số và chữ cái tăng dần: 1 trước 2, A trước Z
    items.sort((a, b) => {
      const nameA = String(a.rawName || a.name || a.code || '').trim();
      const nameB = String(b.rawName || b.name || b.code || '').trim();
      const cmp = nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      return String(a.code || '').localeCompare(String(b.code || ''), undefined, { numeric: true, sensitivity: 'base' });
    });

    // Staff không hiển thị nút "Tất Cả Các Cơ Sở", chỉ Admin hoặc khi cần xem toàn sàn mới có nút này
    if (!isStaff && (items.length > 1 || role === 'ADMIN' || selectedLandlord === 'ALL')) {
      return [
        {
          code: 'ALL',
          name: 'Tất Cả Các Cơ Sở',
          rawName: 'Tất Cả Các Cơ Sở',
          location: 'Toàn bộ chuỗi',
          landlordName: 'Hệ thống Trọ Việt',
          ownerTag: 'Tất Cả',
          totalRooms: (rooms || []).filter((r) => {
            const h = storedBoardingHouses.find((house) => house.code === r.houseCode);
            return !h || h.status !== 'PENDING_APPROVAL';
          }).length
        },
        ...items
      ];
    }
    return items;
  }, [visibleHousesForUser, rooms, role, isStaff, storedBoardingHouses, selectedLandlord]);

  // Lấy chi tiết thông tin cơ sở
  const getHouseDetails = useCallback((houseCode) => {
    if (!houseCode) return null;
    const normCode = normalizeHouseCode(houseCode);
    return storedBoardingHouses.find((h) => h.code === normCode || h.code === houseCode || String(h.id) === String(houseCode)) || null;
  }, [storedBoardingHouses]);

  // Lấy tên cơ sở động từ storedBoardingHouses để luôn hiển thị chính xác tên cơ sở do chủ trọ đặt
  const getHouseName = useCallback((houseCode, fallbackHouse) => {
    if (!houseCode && !fallbackHouse) return '';
    const normCode = normalizeHouseCode(houseCode);
    const found = storedBoardingHouses.find((h) => h.code === normCode || h.code === houseCode || String(h.id) === String(houseCode));
    if (found && found.name) return found.name;
    return fallbackHouse || houseCode;
  }, [storedBoardingHouses]);

  const [selectedHouse, setSelectedHouse] = useState(() => {
    if (isStaff && (!rawParam || rawParam === 'ALL')) {
      return '';
    }
    return rawParam;
  });

  useEffect(() => {
    if (dynamicHousesList.length > 0) {
      // Nếu là Staff đang ở 'ALL' (do URL query param mặc định), tự động chuyển sang cơ sở đầu tiên
      if (isStaff && selectedHouse === 'ALL') {
        setSelectedHouse(dynamicHousesList[0].code);
        return;
      }
      const hasCode = dynamicHousesList.some((h) => h.code === selectedHouse);
      if (!hasCode) {
        setSelectedHouse(dynamicHousesList[0].code);
      }
    } else {
      setSelectedHouse(isStaff ? '' : 'ALL');
    }
  }, [dynamicHousesList, selectedHouse, isStaff]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [tenantLocation, setTenantLocation] = useState(null);
  const [tenantViewAllFlat, setTenantViewAllFlat] = useState(false);

  // Danh sách các địa chỉ / khu vực gom nhóm theo Quận / Khu vực cho khách thuê
  const locationGroups = useMemo(() => {
    const validHouses = visibleHousesForUser.filter(h => h.status !== 'PENDING_APPROVAL');
    const map = new Map();

    validHouses.forEach((house) => {
      const district = getHouseDistrict(house);
      const houseRooms = (rooms || []).filter(r => r.houseCode === house.code);
      const availableRooms = houseRooms.filter(r => r.status === 'AVAILABLE');
      const prices = houseRooms.map(r => r.price || 0).filter(p => p > 0);
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
      const owner = house.manager || house.landlordName || house.managerUsername || 'Chủ trọ';
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

    return Array.from(map.values()).map(g => ({
      ...g,
      landlordsList: Array.from(g.landlords)
    }));
  }, [visibleHousesForUser, rooms]);

  const activeHouseRecord = useMemo(() => {
    return storedBoardingHouses.find(h => h.code === selectedHouse);
  }, [storedBoardingHouses, selectedHouse]);

  const activeDistrict = useMemo(() => {
    if (selectedHouse !== 'ALL' && activeHouseRecord) {
      return getHouseDistrict(activeHouseRecord);
    }
    return tenantLocation;
  }, [selectedHouse, activeHouseRecord, tenantLocation]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRoomDetails, setSelectedRoomDetails] = useState(null);
  const [roomDetailsTab, setRoomDetailsTab] = useState('SPECS'); // 'SPECS' | 'MEMBERS' | 'CONTRACT'
  const [selectedContractForModal, setSelectedContractForModal] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({ fullName: '', phone: '', cccd: '', roleInRoom: 'MEMBER' });

  // Realtime ticker cho đồng hồ đếm ngược giữ chỗ (TTL 15 phút)
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatHoldingTime = (holdingUntil) => {
    if (!holdingUntil) return '00:00';
    const diff = Math.max(0, Math.floor((holdingUntil - currentTime) / 1000));
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };



  // UC-T07 & UC-S02B: Ở ghép CCCD
  const [showRoommateModal, setShowRoommateModal] = useState(false);
  // UC-T06 & UC-S07: Trả phòng, thanh lý, hoàn cọc
  const [showMoveOutModal, setShowMoveOutModal] = useState(false);
  const [activeSettlementModal, setActiveSettlementModal] = useState(null);

  // Requests Manager Modal (Duyệt đơn chuyển phòng / thuê thêm / ở ghép)
  const [showRequestsManager, setShowRequestsManager] = useState(false);
  const [requestFilter, setRequestFilter] = useState('ALL');

  // Tenant room request modal states (Chuyển phòng / Thuê thêm / Ở ghép)
  const [requestModal, setRequestModal] = useState(null);
  // Modal Nghiệm thu tài sản & Quyết toán hoàn cọc khi duyệt trả phòng
  const [inspectionModal, setInspectionModal] = useState(null);
  const [inspectionDamages, setInspectionDamages] = useState([
    { id: 1, name: 'Điều hòa / Máy lạnh Inverter', damaged: false, cost: 1200000 },
    { id: 2, name: 'Bình nước nóng lạnh', damaged: false, cost: 800000 },
    { id: 3, name: 'Giường ngủ & Nệm', damaged: false, cost: 500000 },
    { id: 4, name: 'Tủ quần áo', damaged: false, cost: 400000 },
    { id: 5, name: 'Khóa cửa vân tay / Khóa phòng', damaged: false, cost: 600000 },
    { id: 6, name: 'Thiết bị vệ sinh & Vòi sen', damaged: false, cost: 300000 }
  ]);
  const [customDamageCost, setCustomDamageCost] = useState(0);
  const [inspectionNotes, setInspectionNotes] = useState(''); // { room, type: 'TRANSFER' | 'ADDITIONAL_RENT' | 'ROOMMATE', fromRoom? }
  const [transferFromRoom, setTransferFromRoom] = useState('');
  const [requestPhone, setRequestPhone] = useState(user?.phone || '0987654321');
  const [requestNote, setRequestNote] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Sửa giá phòng (Staff / Admin) - QUY ĐỊNH: Chỉ sửa phòng CÒN TRỐNG
  const [showPriceEditModal, setShowPriceEditModal] = useState(false);
  const [roomToEditPrice, setRoomToEditPrice] = useState(null);
  const [newRoomPriceInput, setNewRoomPriceInput] = useState('');
  const [priceErrorMsg, setPriceErrorMsg] = useState('');
  const [priceToast, setPriceToast] = useState(null);

  const handleSaveRoomPrice = (e) => {
    e.preventDefault();
    if (!roomToEditPrice) {
      setPriceErrorMsg('Vui lòng chọn một phòng còn trống!');
      return;
    }
    const res = updateRoomPrice(roomToEditPrice.id, newRoomPriceInput);
    if (!res.success) {
      setPriceErrorMsg(res.message);
      return;
    }
    setShowPriceEditModal(false);
    setPriceToast({ type: 'SUCCESS', message: res.message });
    setTimeout(() => setPriceToast(null), 4000);
  };

  // Chỉnh sửa & Xóa phòng trọ (Staff / Admin)
  const [editingRoomModal, setEditingRoomModal] = useState(null);
  const [editRoomForm, setEditRoomForm] = useState({
    number: '',
    houseCode: 'CS-01',
    floor: 'Tầng 1',
    price: 3500000,
    deposit: 3500000,
    area: 25,
    maxOccupants: 2,
    status: 'AVAILABLE',
    amenities: [],
    image: ''
  });

  const handleRoomImageUpload = (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh phòng có dung lượng dưới 4MB!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result;
      if (isEdit) {
        setEditRoomForm((prev) => ({ ...prev, image: b64 }));
      } else {
        setNewRoom((prev) => ({ ...prev, image: b64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Kiểm tra quyền quản lý phòng: Admin quản lý tất cả, Staff chỉ quản lý phòng thuộc cơ sở của mình
  const canManageRoom = (room) => {
    if (!room) return false;
    if (role === 'ADMIN') return true;
    if (isTenant) return false;
    const roomHouseCode = room.houseCode || 'CS-01';

    const staffManageableCodes = visibleHousesForUser.map((h) => h.code);
    return staffManageableCodes.includes(roomHouseCode);
  };

  const handleOpenEditRoom = (room) => {
    if (!canManageRoom(room)) {
      alert(`⚠️ Bạn không có quyền chỉnh sửa phòng này!\nPhòng này thuộc cơ sở do Quản lý khác phụ trách.`);
      return;
    }
    setEditingRoomModal(room);
    setEditRoomForm({
      number: room.number,
      houseCode: room.houseCode || visibleHousesForUser[0]?.code || 'CS-01',
      floor: room.floor || 'Tầng 1',
      price: room.price || 3500000,
      deposit: room.deposit || room.price || 3500000,
      area: room.area || 25,
      maxOccupants: room.maxOccupants || 2,
      status: room.status || 'AVAILABLE',
      amenities: Array.isArray(room.amenities) ? [...room.amenities] : ['WiFi', 'Điều hòa', 'Nóng lạnh'],
      image: room.image || ''
    });
  };

  const handleSaveEditRoom = (e) => {
    e.preventDefault();
    if (!editingRoomModal) return;
    if (!canManageRoom(editingRoomModal)) {
      alert(`⚠️ Bạn không có quyền chỉnh sửa phòng này!`);
      return;
    }
    if (!editRoomForm.number) {
      alert('Vui lòng nhập số phòng!');
      return;
    }
    const editTargetHouse = editRoomForm.houseCode || editingRoomModal.houseCode || 'CS-01';
    if (isDuplicateRoom(rooms, editRoomForm.number, editTargetHouse, editingRoomModal.id)) {
      alert(`⚠️ Không thể lưu: Phòng "${editRoomForm.number}" đã tồn tại trong cơ sở này!\n\nTrong cùng một cơ sở nhà trọ, các phòng phải có số / tên khác nhau để tránh nhầm lẫn khi quản lý.`);
      return;
    }

    const maxFloors = parseInt(String(targetHouseForEdit?.floors || targetHouseForEdit?.totalFloors || maxFloorsForEdit || 4).replace(/\D/g, ''), 10) || 4;
    const enteredFloor = parseFloorNum(editRoomForm.floor);
    if (maxFloors > 0 && enteredFloor > maxFloors) {
      alert(`⚠️ Không thể lưu: Cơ sở "${targetHouseForEdit?.name || editTargetHouse}" chỉ có ${maxFloors} tầng!\n\nBạn không thể đặt phòng ở tầng ${enteredFloor}. Vui lòng chọn tầng từ 1 đến ${maxFloors}.`);
      return;
    }
    const resolvedHouseName = getHouseName(editTargetHouse, editRoomForm.house);
    updateRoom(editingRoomModal.id, {
      number: editRoomForm.number,
      houseCode: editRoomForm.houseCode,
      house: resolvedHouseName,
      floor: editRoomForm.floor,
      price: Number(editRoomForm.price) || 3500000,
      deposit: Number(editRoomForm.deposit) || 3500000,
      area: Number(editRoomForm.area) || 25,
      maxOccupants: Number(editRoomForm.maxOccupants) || 2,
      status: editRoomForm.status,
      amenities: editRoomForm.amenities,
      image: editRoomForm.image || editingRoomModal.image || getRoomImage(editRoomForm)
    });

    if (selectedRoomDetails && selectedRoomDetails.id === editingRoomModal.id) {
      setSelectedRoomDetails({
        ...selectedRoomDetails,
        ...editRoomForm,
        house: resolvedHouseName,
        price: Number(editRoomForm.price),
        area: Number(editRoomForm.area),
        maxOccupants: Number(editRoomForm.maxOccupants)
      });
    }

    setEditingRoomModal(null);
    setPriceToast({ type: 'SUCCESS', message: `Đã cập nhật thông tin phòng ${editRoomForm.number} thành công!` });
    setTimeout(() => setPriceToast(null), 3500);
  };

  const handleDeleteRoomSafe = (room) => {
    if (!room) return;
    if (!canManageRoom(room)) {
      alert(`⚠️ Bạn không có quyền xóa phòng này!\nPhòng này thuộc cơ sở do Quản lý khác phụ trách.`);
      return;
    }
    const activeMembers = (roomMembers || []).filter(
      (m) => m.roomNumber === room.number && m.status !== 'MOVED_OUT' && (!room.houseCode || m.houseCode === room.houseCode)
    );
    if (room.status === 'OCCUPIED' || (room.occupants && room.occupants > 0) || activeMembers.length > 0) {
      alert(`⚠️ Không thể xóa phòng ${room.number}!\n\nPhòng này hiện đang có ${room.occupants || activeMembers.length} người đang thuê và có hợp đồng hoạt động. Vui lòng thanh lý hợp đồng và trả phòng trước khi xóa.`);
      return;
    }

    if (window.confirm(`Xác nhận xóa vĩnh viễn phòng ${room.number} khỏi cơ sở ${room.houseCode || 'hiện tại'}?\n\nPhòng sẽ bị xóa khỏi sơ đồ phòng và hệ thống chốt số điện nước.`)) {
      deleteRoom(room.id);
      if (selectedRoomDetails && selectedRoomDetails.id === room.id) {
        setSelectedRoomDetails(null);
      }
      setPriceToast({ type: 'SUCCESS', message: `Đã xóa phòng ${room.number} thành công!` });
      setTimeout(() => setPriceToast(null), 3500);
    }
  };

  // Lấy hồ sơ khách thuê hiện tại từ danh bạ tenants
  const currentTenant = tenants.find((t) => {
    if (!user) return false;
    const userName = (user.fullName || '').toLowerCase();
    const tName = (t.fullName || '').toLowerCase();
    return (
      (userName && tName && (userName.includes(tName) || tName.includes(userName))) ||
      (user.phone && t.phone && user.phone.replace(/\D/g, '') === t.phone.replace(/\D/g, ''))
    );
  });

  // NGHIỆP VỤ 4: Phân biệt Người đại diện ký HĐ (Representative) vs Thành viên ở ghép (Member)
  const myRoleInRoom = useMemo(() => {
    if (!user) return 'REPRESENTATIVE';
    const tName = (user.fullName || '').toLowerCase();
    const mem = (roomMembers || []).find(
      (m) => (m.fullName || '').toLowerCase().includes(tName) && m.status !== 'MOVED_OUT'
    );
    if (mem?.roleInRoom) return mem.roleInRoom;
    const isRepInContract = (contracts || []).some(
      (c) => c.status === 'ACTIVE' && (c.tenantName || '').toLowerCase().includes(tName)
    );
    return isRepInContract ? 'REPRESENTATIVE' : 'MEMBER';
  }, [user, roomMembers, contracts]);

  const isRepresentative = myRoleInRoom === 'REPRESENTATIVE';

  // Quy tắc Single Active Lease: Mỗi khách thuê chỉ thuê DUY NHẤT 1 phòng
  const myRentedRoom = useMemo(() => {
    if (!isTenant) return null;

    // Khách 3 (Hoàng Văn Nam - Khách mới)
    if (user?.username === 'tenant_new' || user?.fullName?.includes('Nam')) {
      const stored = tenantRooms?.tenant_new || tenantRooms?.['Hoàng Văn Nam'];
      if (Array.isArray(stored) && stored.length > 0) return stored[0];
      if (typeof stored === 'string' && stored) return stored;
      if (user?.room) return user.room;
      if (user?.rooms && user.rooms.length > 0) return user.rooms[0];
      const matchContract = contracts.find(c => c.status === 'ACTIVE' && c.tenantName?.includes('Nam'));
      if (matchContract?.roomNumber) return matchContract.roomNumber;
      return null;
    }

    // Khách 2 (Phạm Minh Cường)
    if (user?.username === 'tenant2' || user?.fullName?.includes('Cường')) {
      const stored = tenantRooms?.tenant2 !== undefined ? tenantRooms?.tenant2 : tenantRooms?.['Phạm Minh Cường'];
      if (Array.isArray(stored)) {
        if (stored.length === 0) return null;
        return stored[0];
      }
      if (typeof stored === 'string' && stored) return stored;
      if (user?.rooms && user.rooms.length === 0 && !user?.room) return null;
      return user?.room || null;
    }

    // Khách 1 (Nguyễn Văn An)
    if (user?.username === 'tenant' || user?.username === 'tenant1' || user?.fullName?.includes('An')) {
      const stored = tenantRooms?.tenant1 !== undefined ? tenantRooms?.tenant1 : tenantRooms?.['Nguyễn Văn An'];
      if (Array.isArray(stored)) {
        if (stored.length === 0) return null;
        return stored[0];
      }
      if (typeof stored === 'string' && stored) return stored;
      if (user?.rooms && user.rooms.length === 0 && !user?.room) return null;
      return user?.room || null;
    }

    const stored = tenantRooms?.[user?.username] || tenantRooms?.[user?.fullName];
    const dynamicRoom = (Array.isArray(stored) && stored.length > 0) ? stored[0] : (typeof stored === 'string' && stored ? stored : null);
    if (dynamicRoom) return dynamicRoom;
    if (user?.room) return user.room;
    if (user?.rooms && user.rooms.length > 0) return user.rooms[0];
    if (currentTenant?.room) return currentTenant.room;
    if (currentTenant?.rooms && currentTenant.rooms.length > 0) return currentTenant.rooms[0];
    return null;
  }, [isTenant, user, currentTenant, tenantRooms]);

  const myRentedRooms = useMemo(() => {
    return myRentedRoom ? [myRentedRoom] : [];
  }, [myRentedRoom]);

  // KIỂM TRA TRẠNG THÁI GIỮ CHỖ CHỜ NỘP CỌC CỦA KHÁCH
  // 1. Kiểm tra hợp đồng PENDING_DEPOSIT / PENDING_SIGN (CHỈ KHI ĐÃ ĐƯỢC STAFF DUYỆT)
  const myPendingDepositContract = useMemo(() => {
    if (!isTenant) return null;
    const uName = (user?.fullName || '').toLowerCase().trim();
    const uPhone = (user?.phone || '').trim();
    return (contracts || []).find((c) => {
      // Chỉ khi hợp đồng thật sự là PENDING_DEPOSIT hoặc PENDING_SIGN (đã được Staff duyệt) thì mới coi là đang giữ chỗ nộp cọc!
      const isPending = (c.status === 'PENDING_DEPOSIT' || c.status === 'PENDING_SIGN') && !c.depositPaid;
      if (!isPending) return false;
      const cName = (c.tenantName || '').toLowerCase().trim();
      const cPhone = (c.tenantPhone || '').trim();
      return (
        (uName && (cName.includes(uName) || uName.includes(cName))) ||
        (uPhone && cPhone === uPhone) ||
        (user?.username === 'tenant_new' && cName.includes('nam') && c.status === 'PENDING_DEPOSIT') ||
        (user?.username === 'tenant' && cName.includes('an')) ||
        (user?.username === 'tenant2' && cName.includes('cường'))
      );
    });
  }, [isTenant, user, contracts]);

  // 2. Kiểm tra phòng trong danh sách rooms có status HOLDING khớp với khách này (Và còn thời hạn giữ chỗ)
  const myHeldRoom = useMemo(() => {
    if (!isTenant) return null;
    const uName = (user?.fullName || '').toLowerCase().trim();
    const uPhone = (user?.phone || '').trim();
    const contractRoom = myPendingDepositContract?.roomNumber;
    return (rooms || []).find(
      (r) =>
        r.status === 'HOLDING' &&
        r.holdingUntil &&
        r.holdingUntil > currentTime &&
        (
          (contractRoom && r.number === contractRoom) ||
          (uName && (r.holdingBy || '').toLowerCase().includes(uName)) ||
          (uPhone && r.holdingPhone === uPhone)
        )
    );
  }, [isTenant, user, rooms, currentTime, myPendingDepositContract]);

  // Trạng thái giữ chỗ kích hoạt: MỜ VÀ KHÓA TẤT CẢ NÚT THUÊ PHÒNG & XIN Ở GHÉP PHÒNG KHÁC (TASK 4)
  // Đơn đăng ký thuê phòng đang chờ duyệt của khách
  const myPendingRentalRequest = useMemo(() => {
    if (!isTenant) return null;
    return (roomRequests || []).find((req) => {
      const isPending = req.status === 'PENDING' || req.status === 'WAITING_ROOMMATES' || req.status === 'HOLDING';
      const isRental = req.type === 'RENT' || req.type === 'NEW_RENT' || req.type === 'ROOMMATE';
      const uName = (user?.fullName || '').toLowerCase().trim();
      const reqTenant = (req.tenant || '').toLowerCase().trim();
      const matchUser = (reqTenant && uName && (reqTenant.includes(uName) || uName.includes(reqTenant))) ||
        (user?.phone && req.phone === user.phone);
      return isPending && isRental && matchUser;
    });
  }, [isTenant, roomRequests, user]);

  // Khách đang giữ chỗ hoặc đang có 1 đơn đăng ký chờ duyệt -> Nút đăng ký các phòng khác bị MỜ
  const isCurrentlyHolding = Boolean(isTenant && (myHeldRoom || myPendingDepositContract || myPendingRentalRequest));
  const heldRoomNumber = myHeldRoom?.number || myPendingDepositContract?.roomNumber || myPendingRentalRequest?.targetRoom || 'đang xử lý';
  const heldHouseCode = myHeldRoom?.houseCode || myPendingDepositContract?.houseCode || 'CS-01';

  // Thông tin chi tiết phòng đang thuê của cư dân - Xác định CHÍNH XÁC cơ sở (CS-01 hoặc CS-02)
  const myRentedRoomObj = useMemo(() => {
    if (!myRentedRoom) return null;

    // 1. Khách 1 và Khách 2 cọc/thuê phòng thuộc CS-01 của ông chủ A
    if (user?.username === 'tenant2' || user?.fullName?.includes('Cường') ||
        user?.username === 'tenant1' || user?.fullName?.includes('An')) {
      const match = (rooms || []).find((r) => r.number === myRentedRoom && (r.houseCode === 'CS-01' || !r.houseCode));
      if (match) return match;
    }

    // 2. Kiểm tra houseCode trực tiếp từ currentTenant hoặc user
    const directHouse = currentTenant?.houseCode || user?.houseCode;
    if (directHouse) {
      const match = (rooms || []).find((r) => r.number === myRentedRoom && r.houseCode === directHouse);
      if (match) return match;
    }

    // 3. Kiểm tra hợp đồng điện tử ACTIVE
    const tName = (user?.fullName || '').toLowerCase();
    const activeContract = (contracts || []).find(
      (c) => c.roomNumber === myRentedRoom && c.status === 'ACTIVE' &&
      (!c.tenantName || c.tenantName.toLowerCase().includes(tName) || tName.includes((c.tenantName || '').toLowerCase()))
    );
    if (activeContract?.houseCode) {
      const match = (rooms || []).find((r) => r.number === myRentedRoom && r.houseCode === activeContract.houseCode);
      if (match) return match;
    }

    // 4. Kiểm tra danh sách thành viên phòng (roomMembers)
    const memberEntry = (roomMembers || []).find(
      (m) => m.roomNumber === myRentedRoom && m.status !== 'MOVED_OUT' &&
      (!m.fullName || m.fullName.toLowerCase().includes(tName) || tName.includes((m.fullName || '').toLowerCase()))
    );
    if (memberEntry?.houseCode) {
      const match = (rooms || []).find((r) => r.number === myRentedRoom && r.houseCode === memberEntry.houseCode);
      if (match) return match;
    }

    // 5. Kiểm tra đơn duyệt phòng gần nhất (roomRequests)
    const approvedReq = (roomRequests || []).find(
      (req) => req.status === 'APPROVED' && req.targetRoom === myRentedRoom &&
      (!req.tenant || req.tenant.toLowerCase().includes(tName) || tName.includes((req.tenant || '').toLowerCase()))
    );
    if (approvedReq?.houseCode) {
      const match = (rooms || []).find((r) => r.number === myRentedRoom && r.houseCode === approvedReq.houseCode);
      if (match) return match;
    }

    // 6. Nếu phòng đang OCCUPIED, ưu tiên phòng đang OCCUPIED
    const occupiedRoom = (rooms || []).find((r) => r.number === myRentedRoom && r.status === 'OCCUPIED');
    if (occupiedRoom) return occupiedRoom;

    return (rooms || []).find((r) => r.number === myRentedRoom) || null;
  }, [myRentedRoom, rooms, currentTenant, user, contracts, roomMembers, roomRequests]);

  // Phòng đại diện chính (hoặc phòng đầu tiên)
  const userRoom = myRentedRooms[0] || null;

  // Checkout modal states (Trả phòng trước hạn - Mất cọc)
  const [checkoutModal, setCheckoutModal] = useState(null);

  // Tự động mở modal trả phòng khi có action=checkout từ URL
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'checkout' && myRentedRoom) {
      if (isRepresentative) {
        setCheckoutModal(myRentedRoom);
        setAgreedForfeitDeposit(false);
        setCheckoutReason('');
        setCheckoutSuccess(false);
      } else {
        setLeaveModal(myRentedRoom);
        setAgreedForfeitLeave(false);
        setLeaveReason('');
        setLeaveSuccess(false);
      }
    }
  }, [searchParams, myRentedRoom, isRepresentative]);

  // Tự động mở modal xét duyệt đơn (showRequestsManager) khi click thông báo từ Navbar hoặc có action=review-requests
  useEffect(() => {
    const handleOpenRequests = (e) => {
      setShowRequestsManager(true);
      if (e && e.detail && e.detail.filter) {
        setRequestFilter(e.detail.filter);
      }
    };

    window.addEventListener('rental:open-requests-manager', handleOpenRequests);

    const action = searchParams.get('action');
    if (action === 'review-requests' || action === 'requests') {
      setShowRequestsManager(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      setSearchParams(nextParams, { replace: true });
    }

    return () => {
      window.removeEventListener('rental:open-requests-manager', handleOpenRequests);
    };
  }, [searchParams, setSearchParams]);
  const [checkoutReason, setCheckoutReason] = useState('');
  const [agreedForfeitDeposit, setAgreedForfeitDeposit] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Leave room modal states (Rời phòng cá nhân - dọn ra ngoài, không bắt bạn cùng phòng trả theo)
  const [leaveModal, setLeaveModal] = useState(null);
  const [leaveReason, setLeaveReason] = useState('');
  const [agreedForfeitLeave, setAgreedForfeitLeave] = useState(false);
  const [leaveSuccess, setLeaveSuccess] = useState(false);

  const selectedCheckoutRoomObj = useMemo(() => {
    if (!checkoutModal) return null;
    const num = typeof checkoutModal === 'string' ? checkoutModal : checkoutModal?.number;
    return (rooms || []).find((r) => r.number === num);
  }, [checkoutModal, rooms]);

  const isCheckoutRoomMulti = (selectedCheckoutRoomObj?.occupants || 1) > 1;

  const selectedLeaveRoomObj = useMemo(() => {
    if (!leaveModal) return null;
    const num = typeof leaveModal === 'string' ? leaveModal : leaveModal?.number;
    return (rooms || []).find((r) => r.number === num);
  }, [leaveModal, rooms]);

  const leaveRoomNumber = typeof leaveModal === 'string' ? leaveModal : leaveModal?.number;
  const unpaidInvoicesForLeave = useMemo(() => {
    if (!leaveRoomNumber) return [];
    const uName = (user?.fullName || '').toLowerCase().trim();
    return (invoices || []).filter((inv) => {
      if (inv.room !== leaveRoomNumber || inv.status === 'PAID') return false;
      const invTenant = (inv.tenant || '').toLowerCase().trim();
      return (
        invTenant.includes(uName) ||
        uName.includes(invTenant) ||
        (uName.includes('an') && invTenant.includes('an')) ||
        (uName.includes('cường') && invTenant.includes('cường')) ||
        (uName.includes('nam') && invTenant.includes('nam')) ||
        !invTenant
      );
    });
  }, [leaveRoomNumber, invoices, user]);
  const hasUnpaidBillsForLeave = unpaidInvoicesForLeave.length > 0;
  const totalUnpaidForLeave = unpaidInvoicesForLeave.reduce((sum, inv) => sum + (inv.total || 0), 0);

  const handleSendLeave = (e) => {
    e.preventDefault();
    if (!leaveModal || !agreedForfeitLeave || hasUnpaidBillsForLeave) return;
    const roomNumber = typeof leaveModal === 'string' ? leaveModal : leaveModal.number;
    const res = leaveRoom(roomNumber, user?.fullName);
    if (res?.success) {
      setLeaveSuccess(true);
    } else {
      alert(res?.message || 'Kh?ng th? r?i ph?ng do ch?a ho?n t?t ngh?a v? t?i ch?nh.');
    }
  };

  // Contract Renewal modal states (Gia hạn hợp đồng: 3, 6, 12 tháng do khách chọn)
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalDuration, setRenewalDuration] = useState(6); // 3, 6, 12 tháng
  const [renewalStartDate, setRenewalStartDate] = useState('01/01/2027');
  const [renewalNote, setRenewalNote] = useState('');
  const [renewalSuccess, setRenewalSuccess] = useState(false);

  // ============================================================
  // ============================================================
  // KIỂM TRA ĐIỀU KIỆN GIA HẠN HỢP ĐỒNG:
  // - Nếu đã có đơn gia hạn đang chờ duyệt (PENDING/WAITING) → KHÔNG hiển thị nút gia hạn
  // - Nếu hợp đồng còn hạn (> 30 ngày) → Ẩn hoàn toàn nút gia hạn
  // - Chỉ cho gia hạn khi hợp đồng sắp hết hạn (còn ≤ 30 ngày) hoặc đã hết hạn
  // ============================================================
  const renewalEligibility = useMemo(() => {
    if (!isTenant || myRentedRooms.length === 0) return { canRenew: false, reason: '' };

    // 1. Kiểm tra đã có đơn gia hạn đang chờ duyệt?
    const pendingRenewal = (roomRequests || []).find(
      (req) =>
        req.type === 'RENEW_CONTRACT' &&
        (req.status === 'PENDING' || req.status === 'WAITING_ROOMMATES' || req.status === 'ROOMMATES_APPROVED') &&
        (myRentedRooms.includes(req.targetRoom) || myRentedRooms.includes(req.currentRoom) || (req.tenant && req.tenant === user?.fullName))
    );
    if (pendingRenewal) {
      return {
        canRenew: false,
        pendingRequest: pendingRenewal,
        reason: `Đơn gia hạn phòng ${pendingRenewal.targetRoom || myRentedRooms[0]} đang chờ Ban Quản Lý duyệt. Vui lòng chờ kết quả trước khi gửi đơn mới.`
      };
    }

    // 2. Kiểm tra hợp đồng hiện tại còn hạn hay không
    const contractEndStr = currentTenant?.contractEnd || '31/12/2026';
    if (contractEndStr) {
      try {
        const parts = contractEndStr.split('/');
        const endDate = new Date(
          parseInt(parts[2], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[0], 10),
          23, 59, 59
        );
        const now = new Date();
        const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

        if (daysLeft > 30) {
          return {
            canRenew: false,
            daysLeft,
            contractEnd: contractEndStr,
            reason: `Hợp đồng còn hiệu lực đến ${contractEndStr} (còn ${daysLeft} ngày). Chỉ được gia hạn khi hợp đồng còn ≤ 30 ngày hoặc đã hết hạn.`
          };
        }
      } catch {
        // Nếu parse lỗi thì cho gia hạn
      }
    }

    return { canRenew: true, reason: '' };
  }, [isTenant, myRentedRooms, roomRequests, currentTenant, user]);

  const calculateRenewalEnd = (startStr, months) => {
    try {
      let d = 1, m = 0, y = 2027;
      if (startStr && startStr.includes('/')) {
        const parts = startStr.split('/');
        d = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10) - 1;
        y = parseInt(parts[2], 10);
      }
      const targetDate = new Date(y, m + Number(months), d);
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const yyyy = targetDate.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return '01/07/2027';
    }
  };

  const handleSendRenewal = (e) => {
    e.preventDefault();
    const targetRoomNumber = myRentedRooms.length > 0 ? myRentedRooms[0] : (userRoom || 'P.101');
    const targetRoomObj = (rooms || []).find((r) => r.number === targetRoomNumber);
    const newEnd = calculateRenewalEnd(renewalStartDate, renewalDuration);
    submitContractRenewalRequest({
      room: targetRoomNumber,
      targetRoom: targetRoomNumber,
      house: getHouseName(targetRoomObj?.houseCode || currentTenant?.houseCode, targetRoomObj?.house || currentTenant?.house),
      houseCode: targetRoomObj?.houseCode || currentTenant?.houseCode || 'CS-01',
      tenantName: user?.fullName || currentTenant?.fullName || 'Khách thuê',
      tenant: user?.fullName || currentTenant?.fullName || 'Khách thuê',
      phone: user?.phone || currentTenant?.phone || '0987.654.321',
      email: user?.email || currentTenant?.email,
      durationMonths: renewalDuration,
      startDate: renewalStartDate,
      newContractEnd: newEnd,
      currentContractEnd: currentTenant?.contractEnd || '31/12/2026',
      note: renewalNote || `Khách chọn gia hạn thêm ${renewalDuration} tháng (Hạn mới: ${newEnd})`
    });
    setRenewalSuccess(true);
  };

  const handleSendCheckout = (e) => {
    e.preventDefault();
    if (!checkoutModal || !agreedForfeitDeposit) return;
    const roomNumber = typeof checkoutModal === 'string' ? checkoutModal : checkoutModal.number;
    submitCheckoutRequest({
      room: roomNumber,
      reason: checkoutReason || 'Yêu cầu trả phòng trước thời hạn hợp đồng',
      forfeitDeposit: true,
      tenantName: user?.fullName || 'Khách thuê',
      phone: user?.phone || '0987.654.321'
    });
    setCheckoutSuccess(true);
  };

  // Tìm đơn cần biểu quyết (Xin ở ghép HOẶC Bạn cùng phòng xin trả toàn bộ phòng)
  const pendingVoteForMe = isTenant && myRentedRooms.length > 0
    ? roomRequests.find(
        (r) =>
          (r.type === 'ROOMMATE' || r.type === 'CHECKOUT') &&
          myRentedRooms.includes(r.targetRoom) &&
          r.status === 'WAITING_ROOMMATES' &&
          (r.type === 'CHECKOUT' ? r.tenant !== (user?.fullName || '') : true)
      )
    : null;

  const myRequests = isTenant
    ? roomRequests.filter(
        (r) =>
          myRentedRooms.includes(r.currentRoom) ||
          myRentedRooms.includes(r.targetRoom) ||
          r.tenant.toLowerCase().includes((user?.fullName || '').toLowerCase())
      )
    : [];

  const staffHouseCode = user?.role === 'STAFF' ? user?.houseCode : null;
  const staffAllowedCodes = useMemo(() => visibleHousesForUser.map((h) => h.code), [visibleHousesForUser]);
  const isAllowedReqForStaff = useCallback((r) => {
    if (user?.role !== 'STAFF') return true;
    if (staffAllowedCodes.length === 0) return false;
    const reqHouse = r?.houseCode || (rooms || []).find((rm) => rm.number === (r?.targetRoom || r?.currentRoom))?.houseCode || 'CS-01';
    return staffAllowedCodes.includes(reqHouse);
  }, [user?.role, staffAllowedCodes, rooms]);

  // Ban Quản Lý CHỈ đếm và duyệt những đơn đã ĐỦ ĐIỀU KIỆN (chuyển phòng/thuê thêm/trả phòng PENDING, hoặc ở ghép ĐÃ ĐƯỢC CƯ DÂN ĐỒNG Ý)
  // Nếu là STAFF: CHỈ đếm đơn thuộc đúng các cơ sở mà Staff đó phụ trách (dựa trên visibleHousesForUser)
  const pendingRequestsCount = roomRequests.filter((r) => {
    if (user?.role === 'STAFF') {
      const staffManageableCodes = visibleHousesForUser.map((h) => h.code);
      if (staffManageableCodes.length === 0) return false;
      const reqHouse = r.houseCode || (rooms || []).find((rm) => rm.number === (r.targetRoom || r.currentRoom))?.houseCode;
      if (!staffManageableCodes.includes(reqHouse)) return false;
    }
    return r.status === 'PENDING' || r.status === 'ROOMMATES_APPROVED';
  }).length;

  const [requestErrorMsg, setRequestErrorMsg] = useState('');

  const handleSendRoomRequest = (e) => {
    e.preventDefault();
    if (!requestModal) return;
    setRequestErrorMsg('');

    if (isCurrentlyHolding) {
      setRequestErrorMsg(`Bạn đang có phòng ${heldRoomNumber} đang chờ nộp cọc. Vui lòng hủy giữ chỗ trước khi gửi yêu cầu phòng khác!`);
      return;
    }

    const originRoom = requestModal.type === 'TRANSFER'
      ? (transferFromRoom || requestModal.fromRoom || myRentedRooms[0] || userRoom)
      : null;

    const targetHouseCode = requestModal.room.houseCode || (requestModal.room.house?.includes('Bách Khoa') || requestModal.room.house?.includes('CS-02') ? 'CS-02' : 'CS-01');
    const targetHouse = getHouseName(targetHouseCode, requestModal.room.house);

    const targetHouseObj = storedBoardingHouses.find((h) => h.code === targetHouseCode);
    if (targetHouseObj?.status === 'LOCKED') {
      setRequestErrorMsg(`⚠️ Cơ sở "${targetHouseObj.name || targetHouseCode}" hiện đang tạm khóa hoạt động (bảo trì/sửa chữa). Hệ thống tạm ngừng tiếp nhận đơn cho cơ sở này!`);
      return;
    }

    if (requestModal.type === 'TRANSFER') {
      // 1. Kiểm tra sức chứa
      const currentRoomObj = (rooms || []).find((r) => r.number === originRoom && (!requestModal.room.houseCode || r.houseCode === targetHouseCode));
      const curOcc = currentRoomObj?.occupants || 1;
      if (requestModal.room.maxOccupants && curOcc > requestModal.room.maxOccupants) {
        setRequestErrorMsg(`Số lượng người hiện tại (${curOcc} người) không phù hợp với phòng ${requestModal.room.number} (tối đa ${requestModal.room.maxOccupants} người). Vui lòng chọn phòng lớn hơn hoặc tách nhóm!`);
        return;
      }

      // 2. Gửi đơn chuyển phòng lên BQL ở trạng thái PENDING chờ duyệt (không tự động đổi ngay)
      submitRoomRequest({
        type: 'TRANSFER',
        targetRoom: requestModal.room.number,
        house: targetHouse,
        houseCode: targetHouseCode,
        currentRoom: originRoom,
        tenant: user?.fullName || 'Khách thuê',
        phone: requestPhone || user?.phone || '0987.654.321',
        note: requestNote || `Chuyển phòng từ ${originRoom} sang ${requestModal.room.number} (Đang chờ Ban Quản Lý phê duyệt)`,
        status: 'PENDING'
      });

      setRequestSuccess(true);
      return;
    }

    const res = submitRoomRequest({
      type: requestModal.type,
      targetRoom: requestModal.room.number,
      house: targetHouse,
      houseCode: targetHouseCode,
      currentRoom: originRoom,
      tenant: user?.fullName || 'Khách thuê',
      phone: requestPhone || user?.phone || '0987.654.321',
      note: requestNote || (requestModal.type === 'ROOMMATE' ? 'Nguyện vọng xin vào ở ghép' : requestModal.type === 'RENT' ? `Nguyện vọng đăng ký thuê phòng ${requestModal.room.number} tại ${targetHouse}` : 'Nguyện vọng thuê thêm phòng')
    });

    if (res && res.error) {
      setRequestErrorMsg(res.message);
      return;
    }

    setRequestSuccess(true);
  };

  const [newRoom, setNewRoom] = useState({
    number: '',
    houseCode: (selectedHouse && selectedHouse !== 'ALL' && approvedHousesForUser.some(h => h.code === selectedHouse))
      ? selectedHouse
      : (approvedHousesForUser[0]?.code || ''),
    floor: 'Tầng 1',
    price: 3500000,
    area: 25,
    maxOccupants: 2,
    status: 'AVAILABLE',
    image: '/assets/images/room_studio_1.jpg'
  });

  // Tự động đồng bộ mã cơ sở thực tế cho phòng mới (chỉ đồng bộ vào cơ sở ĐÃ ĐƯỢC DUYỆT)
  useEffect(() => {
    if (approvedHousesForUser.length > 0) {
      const isCurrentValid = Boolean(newRoom.houseCode && approvedHousesForUser.some(h => h.code === newRoom.houseCode));
      if (!isCurrentValid) {
        const preferredHouse = (selectedHouse && selectedHouse !== 'ALL' && approvedHousesForUser.some(h => h.code === selectedHouse))
          ? selectedHouse
          : approvedHousesForUser[0].code;
        setNewRoom((prev) => ({ ...prev, houseCode: preferredHouse }));
      }
    }
  }, [approvedHousesForUser, selectedHouse, newRoom.houseCode]);

  // Kiểm tra trùng lặp số phòng trong cùng 1 cơ sở (bắt buộc phòng trong 1 cơ sở phải khác tên/số)
  const addRoomTargetHouse = (
    (newRoom.houseCode && approvedHousesForUser.some(h => h.code === newRoom.houseCode))
      ? newRoom.houseCode
      : (selectedHouse && selectedHouse !== 'ALL' && approvedHousesForUser.some(h => h.code === selectedHouse))
        ? selectedHouse
        : approvedHousesForUser[0]?.code
  ) || '';
  const isNewRoomDuplicate = Boolean(
    newRoom.number &&
    String(newRoom.number).trim() &&
    addRoomTargetHouse &&
    isDuplicateRoom(rooms, newRoom.number, addRoomTargetHouse)
  );

  const editTargetHouse = (
    (editRoomForm.houseCode && visibleHousesForUser.some(h => h.code === editRoomForm.houseCode))
      ? editRoomForm.houseCode
      : editingRoomModal?.houseCode
  ) || '';
  const isEditRoomDuplicate = Boolean(
    editingRoomModal &&
    editRoomForm.number &&
    String(editRoomForm.number).trim() &&
    editTargetHouse &&
    isDuplicateRoom(rooms, editRoomForm.number, editTargetHouse, editingRoomModal.id)
  );

  // Xác định cơ sở và số tầng tối đa khi Thêm Phòng Mới
  const targetHouseForAdd = useMemo(() => {
    return storedBoardingHouses.find((h) => h.code === addRoomTargetHouse) ||
           approvedHousesForUser.find((h) => h.code === addRoomTargetHouse) ||
           null;
  }, [storedBoardingHouses, approvedHousesForUser, addRoomTargetHouse]);

  const maxFloorsForAdd = useMemo(() => {
    if (!targetHouseForAdd) return 4;
    const fl = parseInt(String(targetHouseForAdd.floors || targetHouseForAdd.totalFloors || 4).replace(/\D/g, ''), 10);
    return fl > 0 ? fl : 4;
  }, [targetHouseForAdd]);

  const enteredNewRoomFloorNum = parseFloorNum(newRoom.floor);
  const isAddRoomFloorExceeded = Boolean(maxFloorsForAdd > 0 && enteredNewRoomFloorNum > maxFloorsForAdd);

  // Xác định cơ sở và số tầng tối đa khi Sửa Phòng
  const targetHouseForEdit = useMemo(() => {
    return storedBoardingHouses.find((h) => h.code === editTargetHouse) ||
           visibleHousesForUser.find((h) => h.code === editTargetHouse) ||
           null;
  }, [storedBoardingHouses, visibleHousesForUser, editTargetHouse]);

  const maxFloorsForEdit = useMemo(() => {
    if (!targetHouseForEdit) return 4;
    const fl = parseInt(String(targetHouseForEdit.floors || targetHouseForEdit.totalFloors || 4).replace(/\D/g, ''), 10);
    return fl > 0 ? fl : 4;
  }, [targetHouseForEdit]);

  const enteredEditFloorNum = parseFloorNum(editRoomForm.floor);
  const isEditRoomFloorExceeded = Boolean(maxFloorsForEdit > 0 && enteredEditFloorNum > maxFloorsForEdit);

  // Keep state perfectly synchronized with URL query parameter & tenant active facility
  useEffect(() => {
    const currentParam = searchParams.get('house') || 'ALL';
    if (isTenant && myRentedRoom && myRentedRoomObj?.houseCode) {
      setSelectedHouse(myRentedRoomObj.houseCode);
    } else if (isTenant && !myRentedRoom) {
      // Khách chưa thuê (Khách 3 / Marketplace): mặc định hiển thị TẤT CẢ các cơ sở (37 phòng)
      if (!searchParams.has('house')) {
        setSelectedHouse('ALL');
      } else {
        setSelectedHouse(currentParam);
      }
    } else {
      setSelectedHouse(currentParam);
    }
  }, [searchParams, isTenant, myRentedRoom, myRentedRoomObj]);

  const handleHouseChange = (code) => {
    setSelectedHouse(code);
    if (code === 'ALL') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('house');
      setSearchParams(nextParams);
    } else {
      setSearchParams({ house: code });
    }
  };

  const staffManageableRooms = useMemo(() => {
    if (user?.role === 'STAFF') {
      const allowedCodes = visibleHousesForUser.map((h) => h.code);
      return rooms.filter((r) => allowedCodes.includes(r.houseCode));
    }
    return rooms;
  }, [rooms, user, visibleHousesForUser]);

  const myRoomsCount = role === 'ADMIN' ? rooms.length : staffManageableRooms.length;

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      // QUY TẮC PHÂN QUYỀN STAFF & VÒNG ĐỜI KHÁCH THUÊ:
      if (user?.role === 'STAFF') {
        const staffManageableCodes = visibleHousesForUser.map((h) => h.code);
        // Nếu Staff chưa có hoặc chưa được phân công cơ sở nào: TUYỆT ĐỐI KHÔNG XEM PHÒNG CỦA STAFF KHÁC
        if (staffManageableCodes.length === 0) {
          return false;
        }
        // Staff chỉ xem phòng thuộc các cơ sở của mình:
        if (!staffManageableCodes.includes(r.houseCode)) {
          return false;
        }
      }

      if (isTenant) {
        if (tenantAssociatedLandlordKey) {
          // Khách đã được duyệt giữ chỗ / đang thuê tại chuỗi trọ của một chủ:
          // CHỈ ĐƯỢC XEM CÁC PHÒNG THUỘC CÁC CƠ SỞ CỦA CHỦ TRỌ NÀY
          const allowedHouseCodes = visibleHousesForUser.map((h) => h.code);
          if (!allowedHouseCodes.includes(r.houseCode)) {
            return false;
          }
        }
      }

      // Lọc theo cơ sở do người dùng chọn:
      const matchHouse = selectedHouse === 'ALL' || r.houseCode === selectedHouse;

      // Lọc theo trạng thái phòng:
      const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;

      // Lọc theo từ khóa tìm kiếm:
      const matchSearch =
        r.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.house.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.houseCode.toLowerCase().includes(searchTerm.toLowerCase());

      // Cơ sở đang chờ Admin duyệt thì chưa thể có phòng trọ hoạt động chính thức
      const roomHouse = storedBoardingHouses.find((h) => h.code === r.houseCode);
      if (roomHouse && roomHouse.status === 'PENDING_APPROVAL') {
        return false;
      }

      return matchHouse && matchStatus && matchSearch;
    });
  }, [rooms, isTenant, myRentedRoom, myRentedRoomObj, selectedHouse, filterStatus, searchTerm, user, visibleHousesForUser, storedBoardingHouses, tenantAssociatedLandlordKey]);

  const handleUpdateStatus = (id, newStatus) => {
    const targetRoom = rooms.find(r => r.id === id);
    if (newStatus === 'LOCKED' && targetRoom?.status === 'OCCUPIED') {
      if (!window.confirm(`⚠️ Phòng ${targetRoom.number} hiện đang có khách thuê!\n\nBạn có chắc chắn muốn TẠM KHÓA phòng này không? (Phòng sẽ ngừng tiếp nhận khách mới).`)) {
        return;
      }
    }
    updateRoomStatus(id, newStatus);
    setPriceToast({
      type: newStatus === 'LOCKED' ? 'WARNING' : 'SUCCESS',
      message: newStatus === 'LOCKED'
        ? `Đã tạm khóa phòng ${targetRoom?.number || id} thành công!`
        : newStatus === 'AVAILABLE'
        ? `Đã mở phòng ${targetRoom?.number || id} sang trạng thái Còn trống!`
        : `Đã cập nhật trạng thái phòng ${targetRoom?.number || id} thành ${newStatus}!`
    });
    setTimeout(() => setPriceToast(null), 3500);
  };

  // Kiểm tra hạn mức gói cước SaaS cho Chủ Trọ khi Thêm Phòng
  const [quotaExceededModal, setQuotaExceededModal] = useState(false);
  const { landlords = [] } = useData();

  // Xác định gói cước hiện tại của chủ trọ
  const currentLandlord = landlords.find(l => l.username === user?.username || l.fullName === user?.fullName) || landlords[0];
  const landlordPackage = (isZeroSandbox && (!currentLandlord || currentLandlord.packageCode === 'NONE'))
    ? 'NONE'
    : (currentLandlord?.packageCode || 'BASIC');
  const maxRoomsAllowed = landlordPackage === 'ENTERPRISE' ? 99999 : landlordPackage === 'PRO' ? 100 : (landlordPackage === 'NONE' || landlordPackage === 'TRIAL' ? 10 : 30);

  const handleOpenAddRoomModal = () => {
    if (visibleHousesForUser.length === 0) {
      alert(
        "⚠️ Chưa thể tạo phòng trọ!\n\nBạn chưa có Cơ sở nhà trọ nào trong hệ thống.\nTheo quy định nghiệp vụ: Mỗi phòng trọ bắt buộc phải trực thuộc một Cơ sở cụ thể.\n\nVui lòng vào menu 'Cơ Sở Nhà Trọ' để tạo Cơ sở trước!"
      );
      return;
    }

    if (selectedHouse !== 'ALL') {
      const selectedRecord = storedBoardingHouses.find((h) => h.code === selectedHouse);
      if (selectedRecord?.status === 'PENDING_APPROVAL') {
        alert(
          `⚠️ Không thể tạo phòng trọ!\n\nCơ sở "${selectedRecord.name || selectedHouse}" (${selectedHouse}) đang ở trạng thái CHỜ ADMIN DUYỆT.\n\nTheo quy định nghiệp vụ:\n• Cơ sở mới đăng ký phải được Quản Trị Viên (Admin) thẩm định giấy tờ & phê duyệt đưa vào hoạt động chính thức trước.\n• Vui lòng liên hệ Admin hoặc chuyển sang tài khoản Admin để phê duyệt cơ sở này trước khi tạo phòng trọ.`
        );
        return;
      }
      if (selectedRecord?.status === 'LOCKED') {
        alert(
          `⚠️ Không thể tạo phòng: Cơ sở "${selectedRecord.name || selectedHouse}" hiện đang bị TẠM KHÓA HOẠT ĐỘNG!\n\nVui lòng mở khóa cơ sở trước khi thêm phòng.`
        );
        return;
      }
    }

    if (approvedHousesForUser.length === 0) {
      alert(
        "⚠️ Chưa thể tạo phòng trọ!\n\nTất cả cơ sở của bạn hiện đang ở trạng thái CHỜ ADMIN DUYỆT hoặc TẠM KHÓA.\n\nTheo quy định nghiệp vụ: Bạn chỉ có thể tạo phòng trọ sau khi cơ sở được Quản Trị Viên (Admin) phê duyệt đưa vào hoạt động chính thức."
      );
      return;
    }

    const trial = getTrialStatus(currentLandlord);
    if (trial.isTrialExpired) {
      setQuotaExceededModal(true);
      return;
    }
    if (myRoomsCount >= maxRoomsAllowed) {
      setQuotaExceededModal(true);
      return;
    }
    const targetHouse = (selectedHouse && selectedHouse !== 'ALL' && approvedHousesForUser.some(h => h.code === selectedHouse))
      ? selectedHouse
      : (approvedHousesForUser[0]?.code || '');
    setNewRoom({
      number: '',
      houseCode: targetHouse,
      floor: 'Tầng 1',
      price: 3500000,
      area: 25,
      maxOccupants: 2,
      status: 'AVAILABLE',
      image: '/assets/images/room_studio_1.jpg'
    });
    setShowModal(true);
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!newRoom.number) return;

    const targetHouseCode = (
      (newRoom.houseCode && approvedHousesForUser.some(h => h.code === newRoom.houseCode))
        ? newRoom.houseCode
        : (selectedHouse && selectedHouse !== 'ALL' && approvedHousesForUser.some(h => h.code === selectedHouse))
          ? selectedHouse
          : approvedHousesForUser[0]?.code
    ) || '';

    if (!targetHouseCode) {
      alert("⚠️ Không thể tạo phòng: Bạn chưa có Cơ sở nào được phê duyệt hoạt động!\n\nVui lòng đợi Admin phê duyệt cơ sở trước khi thêm phòng.");
      setShowModal(false);
      return;
    }

    const targetRecord = storedBoardingHouses.find((h) => h.code === targetHouseCode);
    if (targetRecord?.status === 'PENDING_APPROVAL') {
      alert(
        `⚠️ Không thể tạo phòng: Cơ sở "${targetRecord.name || targetHouseCode}" đang CHỜ QUẢN TRỊ VIÊN (ADMIN) PHÊ DUYỆT!\n\nVui lòng đợi Admin phê duyệt cơ sở trước khi thêm phòng.`
      );
      return;
    }
    if (targetRecord?.status === 'LOCKED') {
      alert(`⚠️ Không thể tạo phòng: Cơ sở "${targetRecord.name || targetHouseCode}" đang bị TẠM KHÓA!`);
      return;
    }

    if (isDuplicateRoom(rooms, newRoom.number, targetHouseCode)) {
      alert(`⚠️ Không thể tạo phòng: Phòng "${newRoom.number}" đã tồn tại trong cơ sở này!\n\nTheo quy định nghiệp vụ: Trong cùng một cơ sở nhà trọ, các phòng phải có số / tên khác nhau để đảm bảo quản lý hợp đồng và ghi điện nước.`);
      return;
    }

    const houseMaxFloors = parseInt(String(targetRecord?.floors || targetRecord?.totalFloors || maxFloorsForAdd || 4).replace(/\D/g, ''), 10) || 4;
    const newFloorNum = parseFloorNum(newRoom.floor);
    if (houseMaxFloors > 0 && newFloorNum > houseMaxFloors) {
      alert(`⚠️ Không thể tạo phòng: Cơ sở "${targetRecord?.name || targetHouseCode}" chỉ có ${houseMaxFloors} tầng!\n\nBạn không thể tạo phòng ở tầng ${newFloorNum}. Vui lòng chọn tầng từ 1 đến ${houseMaxFloors}.`);
      return;
    }

    // Kiểm tra giới hạn số phòng của gói cước (tính theo chủ trọ hiện tại)
    if (myRoomsCount >= maxRoomsAllowed) {
      setShowModal(false);
      setQuotaExceededModal(true);
      return;
    }

    const resolvedHouseName = getHouseName(targetHouseCode, newRoom.house);

    addRoom({
      ...newRoom,
      houseCode: targetHouseCode,
      house: resolvedHouseName,
      image: newRoom.image || getRoomImage(newRoom)
    });
    setShowModal(false);
    setNewRoom({
      number: '',
      houseCode: targetHouseCode,
      floor: 'Tầng 1',
      price: 3500000,
      area: 25,
      maxOccupants: 2,
      status: 'AVAILABLE',
      image: '/assets/images/room_studio_1.jpg'
    });
  };

  const currentHouseInfo = dynamicHousesList.find(
    (h) => h.code === selectedHouse
  ) || dynamicHousesList[0] || { code: 'ALL', name: 'Toàn Bộ Các Cơ Sở', totalRooms: 0 };

  const currentHouseRecord = useMemo(() => {
    return storedBoardingHouses.find(
      (h) => h.code === selectedHouse
    );
  }, [storedBoardingHouses, selectedHouse]);

  const isCurrentHouseLocked = currentHouseRecord?.status === 'LOCKED';
  const isCurrentHousePendingApproval = currentHouseRecord?.status === 'PENDING_APPROVAL';

  const selectedRoomHouse = useMemo(() => {
    if (!selectedRoomDetails) return null;
    const hCode = selectedRoomDetails.houseCode || 'CS-01';
    return storedBoardingHouses.find((h) => h.code === hCode);
  }, [selectedRoomDetails, storedBoardingHouses]);

  const isSelectedRoomHouseLocked = selectedRoomHouse?.status === 'LOCKED';

  return (
    <div className="space-y-6">
      {/* Banner Hạn Dùng Thử 14 Ngày */}
      {!isTenant && (
        <TrialExpiryBanner
          currentLandlord={currentLandlord}
          onUpgradeClick={() => {
            window.location.href = '/invoices/saas';
          }}
        />
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {isTenant ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {selectedHouse !== 'ALL'
                  ? `Cơ sở: ${currentHouseInfo.name}`
                  : tenantLocation && !tenantViewAllFlat
                  ? `Khu vực: ${tenantLocation}`
                  : 'Tra Cứu Phòng Trọ Theo Địa Chỉ & Cơ Sở'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 mb-1">
              <Link to="/houses" className="hover:underline flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Chuỗi Cơ Sở Nhà Trọ</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 font-bold">
                {selectedHouse === 'ALL' ? `Toàn Bộ ${staffManageableRooms.length} Phòng` : currentHouseInfo.name}
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isTenant
              ? (selectedHouse !== 'ALL'
                  ? `Danh Sách Phòng: ${currentHouseInfo.name}`
                  : tenantLocation && !tenantViewAllFlat
                  ? `Các Cơ Sở Nhà Trọ Tại ${tenantLocation}`
                  : tenantViewAllFlat
                  ? (tenantAssociatedLandlordKey ? `Toàn Bộ Phòng Thuộc Chuỗi: ${tenantAssociatedLandlordName}` : 'Toàn Bộ Phòng Đang Mở Cho Thuê')
                  : (tenantAssociatedLandlordKey ? `Chuỗi Cơ Sở Của Chủ Trọ: ${tenantAssociatedLandlordName}` : 'Tìm Trọ Theo Địa Chỉ & Cơ Sở'))
              : selectedHouse === 'ALL'
              ? `Toàn Bộ Phòng Thuộc Chuỗi (${staffManageableRooms.length} Phòng)`
              : `Danh Sách Phòng: ${currentHouseInfo.name}`}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">
            {isTenant
              ? (selectedHouse !== 'ALL'
                  ? `Địa chỉ: ${getHouseFullAddress(currentHouseRecord)} • Quản lý: ${currentHouseInfo.landlordName || 'Chủ trọ'}`
                  : tenantLocation && !tenantViewAllFlat
                  ? `Chọn cơ sở bạn muốn xem để khám phá các phòng trống, tiện ích và giá niêm yết.`
                  : tenantViewAllFlat
                  ? (tenantAssociatedLandlordKey ? `Đang hiển thị toàn bộ phòng thuộc chuỗi các cơ sở của Chủ trọ ${tenantAssociatedLandlordName}.` : `Đang hiển thị toàn bộ phòng của tất cả các cơ sở trên toàn sàn.`)
                  : (tenantAssociatedLandlordKey ? `Danh sách các cơ sở trực thuộc chuỗi của Chủ trọ ${tenantAssociatedLandlordName}. Bạn có thể xem phòng, xin đổi phòng hoặc thuê thêm phòng.` : 'Chọn địa chỉ hoặc khu vực bạn muốn tìm phòng để xem các cơ sở của từng chủ trọ uy tín.'))
              : `Tổng số: ${filteredRooms.length} phòng | Trống: ${filteredRooms.filter((r) => r.status === 'AVAILABLE').length} | Giữ chỗ: ${filteredRooms.filter((r) => r.status === 'HOLDING').length} | Đang thuê: ${filteredRooms.filter((r) => r.status === 'OCCUPIED').length} | Bảo trì: ${filteredRooms.filter((r) => r.status === 'MAINTENANCE').length} | Tạm khóa: ${filteredRooms.filter((r) => r.status === 'LOCKED').length}`}
          </p>
        </div>

        {!isTenant ? (
          <div className="flex items-center gap-2.5">
            <button
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

            {/* Nút Sửa Giá Phòng Còn Trống */}
            <button
              type="button"
              onClick={() => {
                setRoomToEditPrice(null);
                setNewRoomPriceInput('');
                setPriceErrorMsg('');
                setShowPriceEditModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl shadow-xs transition-all btn-press cursor-pointer"
              title="Quy định: Chỉ được sửa giá các phòng còn trống"
            >
              <Pencil className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sửa Giá Phòng Trống</span>
            </button>

            <button
              onClick={handleOpenAddRoomModal}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all btn-press cursor-pointer ${
                isCurrentHousePendingApproval
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/25'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-600/25 hover:scale-105'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Phòng Mới</span>
              {visibleHousesForUser.length === 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                  Cần tạo Cơ sở trước
                </span>
              ) : isCurrentHousePendingApproval ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-950 animate-pulse">
                  Chờ Admin duyệt
                </span>
              ) : maxRoomsAllowed < 99999 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  myRoomsCount >= maxRoomsAllowed ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-white/20 text-white'
                }`}>
                  {myRoomsCount}/{maxRoomsAllowed}
                </span>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowRequestsManager(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold rounded-xl shadow-xs transition-all btn-press cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Lịch Sử Đơn Của Bạn ({myRequests.length})</span>
          </button>
        )}
      </div>

      {/* Banner biểu quyết khi có người xin vào ở ghép HOẶC bạn cùng phòng xin trả phòng */}
      {isTenant && pendingVoteForMe && (
        <div className={`border-2 rounded-2xl p-4 shadow-sm ${
          pendingVoteForMe.type === 'CHECKOUT'
            ? 'bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-rose-300'
            : 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-300'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0 ${
                pendingVoteForMe.type === 'CHECKOUT' ? 'bg-rose-600' : 'bg-amber-500'
              }`}>
                {pendingVoteForMe.type === 'CHECKOUT' ? '⚠️' : '🤝'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                    pendingVoteForMe.type === 'CHECKOUT' ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                  }`}>
                    Cần Bạn Biểu Quyết
                  </span>
                  <span className="text-xs font-extrabold text-slate-900">
                    {pendingVoteForMe.type === 'CHECKOUT'
                      ? `Bạn cùng phòng (${pendingVoteForMe.tenant}) vừa gửi yêu cầu TRẢ TOÀN BỘ PHÒNG ${pendingVoteForMe.targetRoom}!`
                      : `Có người xin vào ở ghép phòng ${pendingVoteForMe.targetRoom} cùng bạn!`}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium mt-1">
                  Bạn <strong>{pendingVoteForMe.tenant}</strong> (SĐT: {pendingVoteForMe.phone}) gửi lời nhắn:{' '}
                  <span className="italic font-semibold text-amber-950">"{pendingVoteForMe.note}"</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {pendingVoteForMe.type === 'CHECKOUT'
                    ? 'Quy định phòng ở chung: Việc trả TOÀN BỘ PHÒNG bắt buộc phải được TẤT CẢ các thành viên trong phòng đồng ý trước khi chuyển qua Ban Quản Lý phê duyệt.'
                    : 'Quy định ký túc xá / nhà trọ: Phải được thành viên trong phòng đồng ý thì đơn mới được chuyển lên Ban Quản Lý phê duyệt hợp đồng.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => voteRoommateRequest(pendingVoteForMe.id, user?.fullName || 'Khách thuê', true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all btn-press flex items-center gap-1.5 cursor-pointer"
              >
                <span>{pendingVoteForMe.type === 'CHECKOUT' ? '👍 Tôi Đồng Ý Trả Phòng' : '👍 Tôi Đồng Ý Cho Ở Cùng'}</span>
              </button>
              <button
                onClick={() => voteRoommateRequest(pendingVoteForMe.id, user?.fullName || 'Khách thuê', false)}
                className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs rounded-xl transition-all btn-press flex items-center gap-1 cursor-pointer"
              >
                <span>{pendingVoteForMe.type === 'CHECKOUT' ? '👎 Không Đồng Ý Trả' : '👎 Từ Chối'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ĐIỀU HƯỚNG TÌM TRỌ PHÂN CẤP THEO ĐỊA CHỈ CHO KHÁCH THUÊ vs BỘ CHỌN CƠ SỞ CHO ADMIN/STAFF */}
      {isTenant ? (
        <div className="space-y-4">
          {/* Thanh Breadcrumb Điều Hướng Đa Tầng */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setTenantLocation(null);
                  setTenantViewAllFlat(false);
                  handleHouseChange('ALL');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  !tenantLocation && selectedHouse === 'ALL' && !tenantViewAllFlat
                    ? 'bg-purple-600 text-white font-extrabold shadow-sm'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                }`}
              >
                <span>🏠 Tất Cả Địa Chỉ</span>
              </button>

              {(tenantLocation || (selectedHouse !== 'ALL' && activeDistrict)) && !tenantViewAllFlat && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  <button
                    type="button"
                    onClick={() => {
                      handleHouseChange('ALL');
                      if (activeDistrict && !tenantLocation) setTenantLocation(activeDistrict);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      selectedHouse === 'ALL'
                        ? 'bg-purple-600 text-white font-extrabold shadow-sm'
                        : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{tenantLocation || activeDistrict}</span>
                  </button>
                </>
              )}

              {selectedHouse !== 'ALL' && !tenantViewAllFlat && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 text-purple-900 font-extrabold border border-purple-200">
                    <Building2 className="w-3.5 h-3.5 text-purple-700" />
                    <span>{currentHouseInfo.name}</span>
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

            {/* Nút chuyển đổi nhanh chế độ xem */}
            <div className="flex items-center gap-2">
              {tenantViewAllFlat ? (
                <button
                  type="button"
                  onClick={() => {
                    setTenantViewAllFlat(false);
                    setTenantLocation(null);
                    handleHouseChange('ALL');
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
                    handleHouseChange('ALL');
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-purple-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  title="Xem toàn bộ phòng của tất cả cơ sở dạng lưới phẳng"
                >
                  <span>🏢 Xem nhanh tất cả phòng ({isTenant && tenantAssociatedLandlordKey ? tenantChainRoomsCount : rooms.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* BƯỚC 1: CHỌN ĐỊA CHỈ / KHU VỰC (Khi chưa chọn địa chỉ & chưa chọn cơ sở) */}
          {selectedHouse === 'ALL' && !tenantLocation && !tenantViewAllFlat && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  <span>Bước 1: Chọn Địa Chỉ / Khu Vực Bạn Muốn Tìm Trọ</span>
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
                              {group.minPrice > 0 ? `${(group.minPrice / 1000000).toFixed(1)} Tr` : '3.0 Tr'} - {group.maxPrice > 0 ? `${(group.maxPrice / 1000000).toFixed(1)} Tr` : '5.0 Tr'}/tháng
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-600">
                            <span>Chủ trọ / Ban QL:</span>
                            <span className="font-semibold truncate max-w-[150px] text-slate-800" title={group.landlordsList.join(', ')}>
                              {group.landlordsList.join(', ')}
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
          )}

          {/* BƯỚC 2: CÁC CƠ SỞ TẠI ĐỊA CHỈ ĐÃ CHỌN */}
          {selectedHouse === 'ALL' && tenantLocation && !tenantViewAllFlat && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-purple-700">
                    <Building2 className="w-4 h-4" />
                    <span>Bước 2: Chọn Cơ Sở Nhà Trọ Tại {tenantLocation}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Có {(locationGroups.find(g => g.district === tenantLocation)?.houses || []).length} cơ sở của các chủ trọ đang mở cho thuê. Chọn một cơ sở để xem danh sách phòng:
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
                {(locationGroups.find(g => g.district === tenantLocation)?.houses || []).map((house) => {
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
                          onClick={() => handleHouseChange(house.code)}
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
            </div>
          )}
        </div>
      ) : (
        /* GIAO DIỆN CHỌN CƠ SỞ CHO ADMIN & STAFF */
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>{isStaff ? 'Cơ Sở Của Bạn (Bấm Chọn Để Xem Phòng Riêng Biệt):' : 'Chọn Cơ Sở Để Xem Phòng Riêng Biệt:'}</span>
            </div>
            {!isStaff && selectedHouse !== 'ALL' && dynamicHousesList.length > 1 && (
              <button
                onClick={() => handleHouseChange('ALL')}
                className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xem tất cả ({rooms.length} phòng)</span>
              </button>
            )}
          </div>

          {/* Thanh lọc theo Chủ Trọ (Chỉ hiển thị cho Admin khi hệ thống có từ 2 Chủ trọ trở lên) */}
          {!isStaff && uniqueLandlords.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <span>👤 Lọc theo Chủ:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedLandlord('ALL');
                  handleHouseChange('ALL');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedLandlord === 'ALL'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất Cả ({visibleHousesForUser.length} cơ sở)
              </button>
              {uniqueLandlords.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => {
                    setSelectedLandlord(l.key);
                    handleHouseChange('ALL');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    selectedLandlord === l.key
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{l.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    selectedLandlord === l.key ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {l.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {dynamicHousesList.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-2">
              <p className="text-xs font-bold text-slate-700">
                {role === 'STAFF'
                  ? 'Bạn chưa tạo cơ sở nào hoặc chưa được phân công cơ sở nào!'
                  : 'Chưa có cơ sở nào được tạo trong hệ thống!'}
              </p>
              {role === 'STAFF' && (
                <p className="text-[11px] text-slate-500">
                  Vui lòng vào mục{' '}
                  <Link to="/houses" className="text-purple-600 font-bold underline hover:text-purple-800">
                    Cơ Sở Nhà Trọ
                  </Link>{' '}
                  để bấm "+ Thêm Cơ Sở Mới".
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {dynamicHousesList.map((h, idx) => {
                const isSelected = selectedHouse === h.code;
                return (
                  <button
                    key={`${h.code}-${h.id || idx}`}
                    onClick={() => handleHouseChange(h.code)}
                    className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all duration-200 btn-press cursor-pointer text-left ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-500/20'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2 truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <span>{h.code === 'ALL' ? '🏢' : '📍'}</span>
                        <span className="font-extrabold truncate text-xs">{h.rawName || h.name}</span>
                        {h.ownerTag && h.code !== 'ALL' && (
                          <span className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-black shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {h.ownerTag}
                          </span>
                        )}
                      </div>
                      {h.code !== 'ALL' ? (
                        <span className={`text-[11px] truncate mt-0.5 font-medium ${
                          isSelected ? 'text-white/85' : 'text-slate-400'
                        }`}>
                          {h.location ? `${h.location} • ` : ''}Chủ: {h.landlordName}
                        </span>
                      ) : (
                        <span className={`text-[11px] truncate mt-0.5 font-medium ${
                          isSelected ? 'text-white/85' : 'text-slate-400'
                        }`}>
                          Xem toàn bộ phòng trên sàn
                        </span>
                      )}
                    </div>
                    <span
                      className={`ml-2 px-2.5 py-1 rounded-full text-[11px] font-black shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                      }`}
                    >
                      {h.totalRooms} phòng
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* KHỐI TÌM KIẾM & DANH SÁCH PHÒNG: Chỉ hiển thị khi đã chọn cơ sở (Bước 3), hoặc xem tất cả phòng, hoặc là Admin/Staff */}
      {(!isTenant || selectedHouse !== 'ALL' || tenantViewAllFlat) && (
        <div className="space-y-4">
          {/* Banner giới thiệu cơ sở hiện tại dành cho khách thuê ở Bước 3 */}
          {isTenant && selectedHouse !== 'ALL' && (
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 p-4 rounded-2xl border border-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  🏢
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900">{currentHouseInfo.name}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 text-[10px] font-black">
                      {currentHouseInfo.code}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{getHouseFullAddress(currentHouseRecord)}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Chủ trọ / Quản lý: <strong>{currentHouseInfo.landlordName || 'Chủ trọ'}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleHouseChange('ALL');
                  if (activeDistrict) setTenantLocation(activeDistrict);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Đổi Cơ Sở Khác</span>
              </button>
            </div>
          )}

          {/* Tìm Kiếm & Lọc Trạng Thái */}
          <div className="bento-card p-3 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo số phòng (P.101, P.202...), tầng hoặc tiện ích..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: 'Tất cả trạng thái' },
                { id: 'AVAILABLE', label: 'Còn trống' },
                { id: 'HOLDING', label: '🔒 Đang giữ chỗ' },
                { id: 'OCCUPIED', label: 'Đang thuê' },
                { id: 'MAINTENANCE', label: 'Bảo trì' },
                { id: 'LOCKED', label: '🚫 Tạm khóa' },
                { id: 'CLEANING', label: '🧹 Chờ dọn dẹp' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    filterStatus === tab.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

      {/* Banner cảnh báo lọc cơ sở */}
      {selectedHouse !== 'ALL' && (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl text-xs gap-3 ${
          isCurrentHousePendingApproval
            ? 'bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-xs'
            : isCurrentHouseLocked
            ? 'bg-rose-50 border-2 border-rose-300 text-rose-950 shadow-xs'
            : 'bg-purple-50 border border-purple-200 text-purple-900'
        }`}>
          <div className="flex items-start sm:items-center gap-2.5">
            {isCurrentHousePendingApproval ? (
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              </div>
            ) : isCurrentHouseLocked ? (
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-rose-600" />
              </div>
            ) : (
              <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
            )}
            <div>
              {isCurrentHousePendingApproval ? (
                <>
                  <div className="font-extrabold text-amber-900">
                    🕒 Cơ sở "{currentHouseInfo?.name}" ({currentHouseInfo?.code}) đang ở trạng thái CHỜ ADMIN DUYỆT
                  </div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    Cơ sở đang chờ Quản trị viên (Admin) thẩm định giấy tờ & cấp phép hoạt động. Bạn <strong>chưa thể thêm phòng trọ</strong> cho cơ sở này cho đến khi được duyệt.
                  </div>
                </>
              ) : isCurrentHouseLocked ? (
                <>
                  <div className="font-extrabold text-rose-900">
                    ⚠️ Cơ sở "{currentHouseInfo?.name}" ({currentHouseInfo?.code}) đang ở trạng thái TẠM KHÓA HOẠT ĐỘNG
                  </div>
                  <div className="text-[11px] text-rose-700 mt-0.5">
                    Cơ sở đang tạm ngừng đón khách mới để đại tu cơ sở vật chất / kiểm tra PCCC. Đang hiển thị {filteredRooms.length} phòng của cơ sở này.
                  </div>
                </>
              ) : (
                <span>
                  Đang hiển thị đúng <strong>{filteredRooms.length} phòng</strong> thuộc cơ sở:{' '}
                  <strong className="underline">{currentHouseInfo?.name}</strong> ({currentHouseInfo?.code})
                  {currentHouseInfo?.location ? ` • 📍 ${currentHouseInfo.location}` : ''}
                  {currentHouseInfo?.landlordName ? ` • 👤 Quản lý: ${currentHouseInfo.landlordName}` : ''}.
                </span>
              )}
            </div>
          </div>
          {!isStaff && dynamicHousesList.length > 1 && (
            <button
              onClick={() => handleHouseChange('ALL')}
              className={`font-bold underline ml-2 whitespace-nowrap cursor-pointer text-right sm:text-left ${
                isCurrentHousePendingApproval
                  ? 'text-amber-800 hover:text-amber-950'
                  : isCurrentHouseLocked
                  ? 'text-rose-700 hover:text-rose-900'
                  : 'text-purple-700 hover:text-purple-900'
              }`}
            >
              Xem tất cả ({rooms.length} phòng)
            </button>
          )}
        </div>
      )}

      {/* Grid Danh Sách Phòng */}
      {filteredRooms.length === 0 ? (
        visibleHousesForUser.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-purple-200 p-8 shadow-xs max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-8 ring-purple-50/50 shadow-inner">
              <Building2 className="w-8 h-8" />
            </div>
            <p className="text-slate-900 font-black text-lg">
              Bạn Chưa Có Cơ Sở Nhà Trọ Nào
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
              Theo quy trình vận hành: Mỗi phòng trọ bắt buộc phải trực thuộc một <strong>Cơ sở (Chi nhánh)</strong> cụ thể để xác định địa chỉ, người quản lý và biểu giá dịch vụ (điện, nước).
              Vui lòng tạo Cơ sở trước khi tiến hành thêm phòng trọ!
            </p>
            {!isTenant && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link
                  to="/houses"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/25 transition-all btn-press cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Tạo Cơ Sở Nhà Trọ Ngay</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-6 shadow-xs">
            <div className="w-16 h-16 bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Home className="w-8 h-8" />
            </div>
            <p className="text-slate-800 font-extrabold text-base">
              {isCurrentHousePendingApproval
                ? 'Cơ sở đang chờ Quản trị viên (Admin) phê duyệt'
                : rooms.length === 0
                ? 'Chưa có phòng trọ nào trong hệ thống'
                : 'Không tìm thấy phòng trọ nào phù hợp'}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              {isCurrentHousePendingApproval
                ? 'Theo quy định nghiệp vụ: Cơ sở phải được Admin phê duyệt đưa vào hoạt động chính thức trước khi Chủ trọ có thể tạo danh mục phòng trọ.'
                : rooms.length === 0
                ? 'Cơ sở của bạn đã sẵn sàng. Hãy bấm nút bên dưới để thêm các phòng trọ đầu tiên!'
                : 'Thử đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc trạng thái'}
            </p>
            {!isTenant && (
              isCurrentHousePendingApproval ? (
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold shadow-xs">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Đang chờ Admin phê duyệt cơ sở này</span>
                </div>
              ) : (
                <button
                  onClick={handleOpenAddRoomModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/25 transition-all btn-press cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Thêm Phòng Trọ Mới
                </button>
              )
            )}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room, idx) => {
            const isMyRentedRoom = isTenant && myRentedRoom === room.number && (!myRentedRoomObj?.houseCode || room.houseCode === myRentedRoomObj.houseCode);

            return (
              <div
                key={room.id}
                className={`bento-card p-5 stagger-item stagger-${(idx % 8) + 1} flex flex-col justify-between transition-all group ${
                  isMyRentedRoom
                    ? 'border-2 border-emerald-400 bg-emerald-50/25 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-400/20'
                    : 'border-slate-200/80'
                }`}
              >
                <div>
                  {/* Ảnh phòng trọ chất lượng cao */}
                  <div className="relative h-44 -mx-5 -mt-5 mb-4 overflow-hidden rounded-t-2xl group/img bg-slate-100">
                    <img
                      src={room.image || getRoomImage(room)}
                      alt={`Ảnh phòng ${room.number}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-black/20 pointer-events-none" />

                    {/* Status badge on photo */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      {room.status === 'AVAILABLE' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-500/90 text-white backdrop-blur-md shadow-md border border-white/20">
                          🟢 Còn trống
                        </span>
                      )}
                      {room.status === 'HOLDING' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-500/95 text-white backdrop-blur-md shadow-md border border-white/20 animate-pulse flex items-center gap-1">
                          🔒 Giữ chỗ ({formatHoldingTime(room.holdingUntil)})
                        </span>
                      )}
                      {room.status === 'OCCUPIED' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-900/80 text-white backdrop-blur-md shadow-md border border-white/20">
                          Đang thuê
                        </span>
                      )}
                      {room.status === 'MAINTENANCE' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-500/90 text-white backdrop-blur-md shadow-md border border-white/20">
                          Bảo trì
                        </span>
                      )}
                      {room.status === 'LOCKED' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-rose-600/95 text-white backdrop-blur-md shadow-md border border-white/20 flex items-center gap-1 font-bold">
                          🔒 Tạm khóa
                        </span>
                      )}
                      {room.status === 'CLEANING' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-orange-500/90 text-white backdrop-blur-md shadow-md border border-white/20">
                          🧹 Chờ dọn dẹp
                        </span>
                      )}
                    </div>

                    {/* Room tag & Area on Photo */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs pointer-events-none">
                      <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-bold border border-white/20">
                        {room.houseCode} • {room.floor}
                      </span>
                      <span className="font-mono font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20">
                        {room.area} m²
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-slate-900">{room.number}</h3>
                        {isMyRentedRoom && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                            PHÒNG BẠN
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-[10px] font-black text-purple-800">
                          {room.houseCode}
                        </span>
                        <p className="text-xs text-slate-700 font-bold truncate max-w-[130px]" title={getHouseName(room.houseCode, room.house)}>
                          {getHouseName(room.houseCode, room.house)}
                        </p>
                        {(() => {
                          const h = getHouseDetails(room.houseCode);
                          const u = (h?.createdBy || h?.managerUsername || '').toLowerCase();
                          const ownerTag = (u === 'staff' || u === 'staff1' || room.houseCode?.startsWith('S1-')) ? 'Staff 1' : (u === 'staff2' || room.houseCode?.startsWith('S2-')) ? 'Staff 2' : '';
                          return ownerTag ? (
                            <span className="text-[9.5px] px-1.5 py-0.2 rounded font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                              {ownerTag}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">{room.floor}</p>
                    </div>

                    <div>
                      {room.status === 'AVAILABLE' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full status-pill status-pill-indigo">
                          Còn trống
                        </span>
                      )}
                      {room.status === 'HOLDING' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-2xs">
                          🔒 Giữ chỗ ({formatHoldingTime(room.holdingUntil)})
                        </span>
                      )}
                      {room.status === 'OCCUPIED' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full status-pill status-pill-success">
                          Đang thuê
                        </span>
                      )}
                      {room.status === 'MAINTENANCE' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                          Bảo trì
                        </span>
                      )}
                      {room.status === 'LOCKED' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs font-bold">
                          🔒 Tạm khóa
                        </span>
                      )}
                      {room.status === 'CLEANING' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-orange-50 text-orange-700 border border-orange-200 shadow-2xs">
                          🧹 Chờ dọn dẹp
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">Giá thuê:</div>
                      <div className="font-black text-purple-700 text-base mt-0.5">
                        {room.price.toLocaleString('vi-VN')} đ<span className="text-[11px] font-normal text-slate-400">/th</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 font-medium">Diện tích:</div>
                      <div className="font-bold text-slate-700 mt-0.5">
                        {room.area} m² ({Math.max(room.occupants || 0, roomMembers.filter((m) => m.roomNumber === room.number && m.status !== 'MOVED_OUT').length)}/{room.maxOccupants} người)
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {room.amenities.map((item, aIdx) => (
                      <span
                        key={aIdx}
                        className="px-2 py-0.5 rounded-md bg-purple-50 text-[10px] font-semibold text-purple-700 border border-purple-100/80 transition-colors hover:bg-purple-100/70"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {isTenant ? (
                    <div className="flex items-center justify-between w-full gap-2">
                      {isMyRentedRoom ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 shadow-2xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Phòng bạn đang thuê</span>
                        </span>
                      ) : room.status === 'AVAILABLE' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedRoomDetails(room)}
                            className="text-xs text-slate-700 hover:text-purple-700 font-bold px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all btn-press cursor-pointer flex-1 text-center"
                          >
                            Xem Chi Tiết
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRequestModal({ room, type: 'RENT' });
                              setRequestSuccess(false);
                              setRequestErrorMsg('');
                            }}
                            className="text-xs text-white font-bold px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-md shadow-purple-600/20 transition-all btn-press cursor-pointer flex-1 text-center"
                          >
                            Giữ Chỗ / Thuê
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs text-slate-400 font-medium">
                            {room.status === 'HOLDING' ? '🔒 Đang giữ chỗ' : 'Không trống'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedRoomDetails(room)}
                            className="text-xs text-purple-600 hover:text-purple-700 font-bold px-2.5 py-1 hover:bg-purple-50 rounded-lg transition-all cursor-pointer"
                          >
                            Chi tiết →
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-1.5 w-full">
                      <select
                        value={room.status}
                        onChange={(e) => handleUpdateStatus(room.id, e.target.value)}
                        className={`border text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none transition-colors cursor-pointer ${
                          room.status === 'LOCKED'
                            ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold focus:bg-white focus:border-rose-500'
                            : 'bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:border-purple-500'
                        }`}
                      >
                        <option value="AVAILABLE">🟢 Còn trống</option>
                        <option value="OCCUPIED">🔵 Đang thuê</option>
                        <option value="MAINTENANCE">🟠 Bảo trì</option>
                        <option value="LOCKED">🔒 Tạm khóa phòng</option>
                        <option value="CLEANING">🧹 Chờ dọn dẹp</option>
                      </select>

                      <div className="flex items-center gap-1.5">
                        {room.status === 'LOCKED' ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(room.id, 'AVAILABLE')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Mở khóa phòng này để sẵn sàng đón khách thuê"
                          >
                            <Unlock className="w-3 h-3 text-emerald-600" />
                            <span>Mở khóa</span>
                          </button>
                        ) : room.status === 'AVAILABLE' ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(room.id, 'LOCKED')}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Tạm khóa phòng này (ngừng cho thuê tạm thời)"
                          >
                            <Lock className="w-3 h-3 text-rose-600" />
                            <span>Tạm khóa</span>
                          </button>
                        ) : null}
                        {room.status === 'CLEANING' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(room.id, 'AVAILABLE')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                            title="Xong dọn dẹp -> Đưa vào cho thuê (AVAILABLE)"
                          >
                            Xong dọn dẹp
                          </button>
                        )}

                        {room.status === 'OCCUPIED' && (
                          <button
                            type="button"
                            onClick={() => {
                              const existing = moveOutSettlements.find(
                                (s) => s.roomNumber === room.number && s.refundStatus === 'PENDING'
                              ) || {
                                id: `ST-${Date.now()}`,
                                contractId: `HD-2026-${room.id}`,
                                roomNumber: room.number,
                                tenantName: 'Khách đang thuê',
                                moveOutDate: new Date().toISOString().split('T')[0],
                                reason: 'Thanh lý hợp đồng & nghiệm thu trả phòng',
                                originalDeposit: 3000000,
                                damageFee: 0,
                                damageDescription: '',
                                unpaidUtilitiesFee: 0,
                                refundAmount: 3000000,
                                bankAccount: '0987654321',
                                bankName: 'Vietcombank',
                                accountHolder: 'NGUYEN VAN A',
                                refundStatus: 'PENDING',
                              };
                              setSettlementDetailModal(existing);
                            }}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                            title="UC-S07: Nghiệm thu trả phòng & quyết toán hoàn cọc"
                          >
                            Trả phòng (UC-S07)
                          </button>
                        )}

                        {canManageRoom(room) && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditRoom(room)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Chỉnh sửa thông tin phòng trọ"
                            >
                              <Edit3 className="w-3 h-3 text-amber-600" />
                              <span>Sửa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteRoomSafe(room)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Xóa phòng trọ (chỉ xóa phòng trống)"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span>Xóa</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setSelectedRoomDetails(room)}
                          className="text-xs text-purple-600 hover:text-purple-700 font-bold px-2 py-1 hover:bg-purple-50 rounded-lg transition-all btn-press-ghost cursor-pointer"
                        >
                          Chi tiết →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        </div>
      )}

      {/* Modal Thêm Phòng Trọ Mới */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-md">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Thêm Phòng Trọ Mới</h2>
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div className="p-2.5 bg-purple-50/70 border border-purple-200/80 rounded-xl flex items-center gap-2 text-xs text-purple-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Phòng mới được kích hoạt ngay - <strong>Không cần Admin duyệt</strong> (Kiểm soát theo gói: {myRoomsCount}/{maxRoomsAllowed} phòng).</span>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mã / Số phòng</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: P.204"
              value={newRoom.number}
              onChange={(e) => setNewRoom({ ...newRoom, number: e.target.value })}
              className={`w-full border rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                isNewRoomDuplicate
                  ? 'bg-rose-50 border-rose-400 text-rose-900 focus:bg-white focus:border-rose-500 focus:ring-rose-500/20'
                  : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-purple-500/20'
              }`}
            />
            {isNewRoomDuplicate && (
              <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-1.5 text-xs text-rose-700 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Phòng "{newRoom.number}" đã tồn tại trong cơ sở này! Các phòng trong 1 cơ sở phải khác tên nhau.</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cơ sở thuộc chuỗi</label>
            {approvedHousesForUser.length > 0 ? (
              <select
                value={addRoomTargetHouse}
                onChange={(e) => {
                  const chosenCode = e.target.value;
                  const targetH = storedBoardingHouses.find((h) => h.code === chosenCode) || approvedHousesForUser.find((h) => h.code === chosenCode);
                  const targetMax = parseInt(String(targetH?.floors || targetH?.totalFloors || 4).replace(/\D/g, ''), 10) || 4;
                  const currentFl = parseFloorNum(newRoom.floor);
                  const nextFloor = (targetMax > 0 && currentFl > targetMax) ? 'Tầng 1' : (newRoom.floor || 'Tầng 1');
                  setNewRoom({ ...newRoom, houseCode: chosenCode, floor: nextFloor });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-purple-500 cursor-pointer"
              >
                {approvedHousesForUser.map((h) => (
                  <option key={h.code} value={h.code}>
                    {h.name} ({h.code})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Chưa có cơ sở nào được phê duyệt để thêm phòng!</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Cơ sở mới tạo phải được Quản Trị Viên (Admin) phê duyệt đưa vào hoạt động chính thức thì mới có thể thêm phòng trọ.
                </p>
                <Link
                  to="/houses"
                  onClick={() => setShowModal(false)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:underline pt-1"
                >
                  <span>Xem trạng thái cơ sở tại menu Cơ Sở</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Tầng</label>
                {maxFloorsForAdd > 0 && (
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    Tối đa {maxFloorsForAdd} tầng
                  </span>
                )}
              </div>
              <select
                value={newRoom.floor || 'Tầng 1'}
                onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })}
                className={`w-full border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer ${
                  isAddRoomFloorExceeded
                    ? 'bg-rose-50 border-rose-400 text-rose-900 focus:bg-white focus:border-rose-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-purple-500'
                }`}
              >
                {Array.from({ length: maxFloorsForAdd }, (_, i) => i + 1).map((fNum) => (
                  <option key={fNum} value={`Tầng ${fNum}`}>
                    Tầng {fNum}
                  </option>
                ))}
              </select>
              {isAddRoomFloorExceeded && (
                <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-1.5 text-[11px] text-rose-700 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Cơ sở này chỉ có {maxFloorsForAdd} tầng. Không thể thêm phòng tầng {enteredNewRoomFloorNum}!</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giá thuê (VNĐ)</label>
              <input
                type="number"
                value={newRoom.price}
                onChange={(e) => setNewRoom({ ...newRoom, price: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Diện tích (m²)</label>
              <input
                type="number"
                value={newRoom.area}
                onChange={(e) => setNewRoom({ ...newRoom, area: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số người tối đa</label>
              <input
                type="number"
                value={newRoom.maxOccupants}
                onChange={(e) => setNewRoom({ ...newRoom, maxOccupants: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
              />
            </div>
          </div>

          {/* Ảnh Đại Diện / Thumbnail Phòng Trọ */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <span>Ảnh Phòng Trọ / Thumbnail Thực Tế</span>
              </span>
              <label className="text-[10px] text-purple-600 font-bold hover:underline cursor-pointer flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>Tải ảnh từ máy</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleRoomImageUpload(e, false)}
                />
              </label>
            </label>

            <div className="relative h-32 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mb-2 group">
              <img
                src={newRoom.image || '/assets/images/room_studio_1.jpg'}
                alt="Preview phòng"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {ROOM_IMAGE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNewRoom({ ...newRoom, image: preset.url })}
                  className={`p-1.5 rounded-xl border text-left text-[10px] transition-all flex items-center gap-1.5 cursor-pointer ${
                    newRoom.image === preset.url
                      ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold ring-1 ring-purple-600'
                      : 'border-slate-200 hover:border-purple-300 bg-white text-slate-600'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-5 h-5 rounded-md object-cover" />
                  <span className="truncate">{preset.label}</span>
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Hoặc dán URL ảnh phòng (https://...)"
              value={newRoom.image}
              onChange={(e) => setNewRoom({ ...newRoom, image: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors btn-press-ghost"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={visibleHousesForUser.length === 0 || isNewRoomDuplicate || isAddRoomFloorExceeded}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                visibleHousesForUser.length === 0 || isNewRoomDuplicate || isAddRoomFloorExceeded
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-600/25 btn-press cursor-pointer'
              }`}
            >
              Lưu Phòng Mới
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Chi Tiết Phòng Trọ */}
      <Modal isOpen={!!selectedRoomDetails} onClose={() => setSelectedRoomDetails(null)} maxWidth="max-w-2xl">
        {selectedRoomDetails && (
          <>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-600/20 text-lg">
                  {selectedRoomDetails.number}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <span>Phòng {selectedRoomDetails.number}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold">
                      {selectedRoomDetails.houseCode}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {getHouseName(selectedRoomDetails.houseCode, selectedRoomDetails.house)} • {selectedRoomDetails.floor}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRoomDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors btn-press-ghost cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-200 mt-2">
              <button
                type="button"
                onClick={() => setRoomDetailsTab('SPECS')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  roomDetailsTab === 'SPECS'
                    ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                🏠 Thông Tin Phòng
              </button>
              <button
                type="button"
                onClick={() => setRoomDetailsTab('MEMBERS')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  roomDetailsTab === 'MEMBERS'
                    ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Thành Viên ({roomMembers.filter((m) => m.roomNumber === selectedRoomDetails.number && m.status !== 'MOVED_OUT').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setRoomDetailsTab('CONTRACT')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  roomDetailsTab === 'CONTRACT'
                    ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Hợp Đồng</span>
              </button>
            </div>

            {roomDetailsTab === 'SPECS' && (
              <div className="py-4 space-y-4 text-xs">
                {/* Ảnh phối cảnh thực tế phòng */}
                <div className="relative h-56 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 group">
                  <img
                    src={getRoomImage(selectedRoomDetails)}
                    alt={`Không gian phòng ${selectedRoomDetails.number}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                    <div>
                      <div className="text-xs text-slate-200 font-medium">{getHouseName(selectedRoomDetails.houseCode, selectedRoomDetails.house)}</div>
                      <div className="text-lg font-black">{selectedRoomDetails.number} • {selectedRoomDetails.area} m²</div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md border border-white/30">
                      {selectedRoomDetails.price?.toLocaleString('vi-VN')} đ/tháng
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                  <div>
                    <div className="text-slate-500 font-medium">Giá thuê:</div>
                    <div className="font-black text-purple-700 text-sm mt-0.5">
                      {selectedRoomDetails.price.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[10px] text-slate-400">/tháng</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-medium">Diện tích:</div>
                    <div className="font-black text-slate-800 text-sm mt-0.5">{selectedRoomDetails.area} m²</div>
                    <div className="text-[10px] text-slate-400">khép kín</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-medium">Hiện có:</div>
                    <div className="font-black text-slate-800 text-sm mt-0.5">
                      {Math.max(selectedRoomDetails.occupants || 0, roomMembers.filter((m) => m.roomNumber === selectedRoomDetails.number && m.status !== 'MOVED_OUT').length)}/{selectedRoomDetails.maxOccupants}
                    </div>
                    <div className="text-[10px] text-slate-400">người ở</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-white">
                  <span className="text-slate-600 font-bold text-xs">Trạng thái hiện tại:</span>
                  <div>
                    {selectedRoomDetails.status === 'AVAILABLE' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        🟢 Còn phòng trống (Sẵn sàng dọn vào)
                      </span>
                    )}
                    {selectedRoomDetails.status === 'OCCUPIED' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        🟣 Đang có khách thuê
                      </span>
                    )}
                    {selectedRoomDetails.status === 'MAINTENANCE' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        🟠 Đang sửa chữa / Bảo trì
                      </span>
                    )}
                    {selectedRoomDetails.status === 'LOCKED' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        🔒 Đang tạm khóa (Ngừng đón khách)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Trang thiết bị & Tiện nghi phòng:</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedRoomDetails.amenities || ['WiFi', 'Điều hòa', 'Nóng lạnh']).map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-semibold text-xs border border-purple-200/70 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>{item}</span>
                      </span>
                    ))}
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-slate-500" />
                      <span>Internet Cáp quang</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Khóa cửa vân tay / Camera 24/7</span>
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-purple-950">Ban Quản Lý Cơ Sở:</div>
                    <div className="text-slate-600 text-[11px]">Trần Văn Mạnh - Hỗ trợ kỹ thuật 24/7</div>
                  </div>
                  <a
                    href="tel:0912888666"
                    className="px-3 py-1.5 bg-white text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-100 transition-colors font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>0912.888.666</span>
                  </a>
                </div>
              </div>
            )}

            {roomDetailsTab === 'MEMBERS' && (
              <div className="py-4 space-y-3 text-xs">
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Bảo mật thông tin cư dân (NĐ 13/2023/NĐ-CP):</strong> Số CCCD của bạn cùng phòng được che mờ tự động (chỉ hiển thị dạng <code>00120101****</code>).
                  </span>
                </div>

                {(() => {
                  const members = roomMembers.filter((m) => m.roomNumber === selectedRoomDetails.number && m.status !== 'MOVED_OUT');
                  if (members.length === 0) {
                    return (
                      <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                        <p className="font-bold text-slate-600">Chưa có thành viên nào trong phòng này</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Phòng đang trống hoặc chưa có dữ liệu cư dân</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {members.map((m) => {
                        const isRep = m.roleInRoom === 'REPRESENTATIVE';
                        const displayCccd = isTenant
                          ? m.maskedCccd || (m.cccd ? m.cccd.slice(0, 8) + '****' : '00120101****')
                          : m.cccd || m.maskedCccd;
                        return (
                          <div
                            key={m.id}
                            className={`p-3 rounded-xl border transition-all ${
                              isRep ? 'bg-purple-50/40 border-purple-200' : 'bg-slate-50/70 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-900 text-sm">{m.fullName}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                      isRep ? 'bg-purple-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {isRep ? '👑 Đại Diện Hợp Đồng' : '👤 Ở Ghép'}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                                  <span>📞 {m.phone}</span>
                                  <span className="font-mono">🆔 CCCD: {displayCccd}</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                {m.temporaryResidenceStatus === 'REGISTERED' ? (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[10px]">
                                    🟢 Đã đăng ký tạm trú
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-md text-[10px]">
                                    🟡 Chưa đăng ký tạm trú
                                  </span>
                                )}

                                {!isTenant && (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateTemporaryResidence(
                                          m.id,
                                          m.temporaryResidenceStatus === 'REGISTERED'
                                            ? 'PENDING_REGISTRATION'
                                            : 'REGISTERED'
                                        )
                                      }
                                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                                    >
                                      [Đổi tạm trú]
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeRoomMember(m.id)}
                                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                                    >
                                      [Xóa]
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {!isTenant && (
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(true)}
                    className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl border border-purple-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Thêm Thành Viên Ở Ghép Vào Phòng {selectedRoomDetails.number}</span>
                  </button>
                )}
              </div>
            )}

            {roomDetailsTab === 'CONTRACT' && (
              <div className="py-4 space-y-3 text-xs">
                {(() => {
                  const contract = contracts.find((c) => c.roomNumber === selectedRoomDetails.number);
                  if (!contract) {
                    return (
                      <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                        <p className="font-bold text-slate-600">Phòng chưa có hợp đồng thuê hiệu lực</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Hợp đồng sẽ được khởi tạo khi tiếp nhận khách thuê mới
                        </p>
                      </div>
                    );
                  }
                  const isPending = contract.status === 'PENDING_SIGN';
                  return (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                        <div className="flex items-center justify-between pb-2 border-b border-purple-200/60">
                          <div>
                            <span className="font-mono font-black text-purple-900 text-sm">{contract.id}</span>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {contract.houseName} • {contract.roomNumber}
                            </p>
                          </div>
                          <div>
                            {isPending ? (
                              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px] border border-amber-300">
                                ⏳ Chờ Ký Điện Tử (OTP)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] border border-emerald-300">
                                🟢 Đã Ký Kết & Hiệu Lực
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
                          <div>
                            <span className="text-slate-500">Khách thuê:</span>{' '}
                            <span className="font-bold text-slate-800">{contract.tenantName}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">SĐT:</span>{' '}
                            <span className="font-mono font-bold text-slate-800">{contract.tenantPhone}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Thời hạn:</span>{' '}
                            <span className="font-bold text-slate-800">
                              {contract.startDate} - {contract.endDate}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Giá thuê:</span>{' '}
                            <span className="font-black text-purple-700">
                              {contract.rentalPrice?.toLocaleString('vi-VN')} đ/th
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Tiền cọc:</span>{' '}
                            <span className="font-bold text-slate-800">
                              {contract.depositAmount?.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Kỳ thanh toán:</span>{' '}
                            <span className="font-bold text-slate-800">Ngày {contract.paymentDay} hàng tháng</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100">
              {isTenant ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {myRentedRoom === selectedRoomDetails.number && (!myRentedRoomObj?.houseCode || selectedRoomDetails.houseCode === myRentedRoomObj.houseCode) ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span>Phòng của bạn đang thuê</span>
                      </span>
                      <Link
                        to="/maintenance"
                        className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all btn-press flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Báo Sự Cố Phòng Này</span>
                      </Link>
                      {renewalEligibility.canRenew && (
                        <button
                          onClick={() => {
                            setShowRenewalModal(true);
                            setRenewalSuccess(false);
                            setSelectedRoomDetails(null);
                          }}
                          className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all btn-press flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Gia Hạn Hợp Đồng</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setLeaveModal(selectedRoomDetails.number);
                          setAgreedForfeitLeave(false);
                          setLeaveReason('');
                          setLeaveSuccess(false);
                        }}
                        className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all btn-press flex items-center gap-1 cursor-pointer"
                        title="Cá nhân dọn đi, không bắt buộc bạn cùng phòng phải trả phòng theo"
                      >
                        <span>🚪 Rời Phòng Này</span>
                      </button>
                      <button
                        onClick={() => {
                          setCheckoutModal(selectedRoomDetails.number);
                          setAgreedForfeitDeposit(false);
                          setCheckoutReason('');
                          setCheckoutSuccess(false);
                        }}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all btn-press flex items-center gap-1 cursor-pointer"
                      >
                        <span>📤 Yêu Cầu Trả Phòng Này</span>
                      </button>
                    </div>
                  ) : selectedRoomDetails.status === 'HOLDING' ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {((selectedRoomDetails.holdingBy || '').toLowerCase() === (user?.fullName || '').toLowerCase() ||
                        (user?.phone && selectedRoomDetails.holdingPhone === user.phone)) ? (
                        <>
                          <span className="px-3 py-1.5 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                            <span>Bạn đang giữ chỗ phòng này (Còn {formatHoldingTime(selectedRoomDetails.holdingUntil)})</span>
                          </span>
                          <Link
                            to="/?tab=contract"
                            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                          >
                            <span>⚡ Nộp Cọc & Ký HĐ Ngay</span>
                          </Link>
                          <button
                            onClick={() => {
                              cancelRoomHold && cancelRoomHold(selectedRoomDetails.number, selectedRoomDetails.houseCode);
                              setSelectedRoomDetails(null);
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            <span>✕ Hủy giữ chỗ</span>
                          </button>
                        </>
                      ) : (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Phòng đang có khách giữ chỗ tạm thời (còn <strong>{formatHoldingTime(selectedRoomDetails.holdingUntil)}</strong>). Nếu khách không nộp cọc trong thời hạn này, hệ thống sẽ tự động mở lại phòng.
                          </span>
                        </div>
                      )}
                    </div>
                  ) : selectedRoomDetails.status === 'AVAILABLE' ? (
                    <div className="space-y-2">
                      {/* Cảnh báo khi đang giữ chỗ phòng khác */}
                      {isCurrentlyHolding && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🔒</span>
                            <span>
                              Bạn đang giữ chỗ phòng <strong>{heldRoomNumber}</strong> ({heldHouseCode}). Nút thuê phòng đang bị <strong>mờ và khóa</strong>.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Bạn có chắc chắn muốn hủy giữ chỗ phòng ${heldRoomNumber}? Nút đăng ký phòng ${selectedRoomDetails.number} sẽ sáng lên ngay lập tức.`)) {
                                if (cancelRoomHold) {
                                  cancelRoomHold(heldRoomNumber, heldHouseCode);
                                }
                              }
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                          >
                            Hủy Giữ Chỗ Phòng {heldRoomNumber} Để Thuê Phòng Này
                          </button>
                        </div>
                      )}

                      {isSelectedRoomHouseLocked ? (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                          <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            <strong>Cơ sở đang tạm khóa hoạt động:</strong> Cơ sở "{selectedRoomHouse?.name || selectedRoomDetails.houseCode}" đang tạm dừng đón khách để bảo trì. Tạm thời không thể tiếp nhận đăng ký thuê mới cho phòng này.
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          {myRentedRoom ? (
                            selectedRoomDetails.status === 'HOLDING' || selectedRoomDetails.status === 'RESERVED' ? (
                              <button
                                disabled
                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed flex items-center gap-1.5 shadow-none"
                                title="Phòng đang được giữ chỗ bởi khách khác, không thể chuyển sang phòng này"
                              >
                                <span>🔒 Phòng Đang Được Giữ Chỗ (Không Thể Đổi Sang)</span>
                              </button>
                            ) : (
                              <button
                                disabled={isCurrentlyHolding}
                                onClick={() => {
                                  if (isCurrentlyHolding) return;
                                  setRequestModal({ room: selectedRoomDetails, type: 'TRANSFER' });
                                  setTransferFromRoom(myRentedRoom);
                                  setRequestSuccess(false);
                                  setRequestNote(`Em có nguyện vọng muốn chuyển từ phòng ${myRentedRoom} sang phòng ${selectedRoomDetails.number}`);
                                }}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                                  isCurrentlyHolding
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50 shadow-none border border-slate-300 pointer-events-none'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-600/20 cursor-pointer btn-press'
                                }`}
                                title={isCurrentlyHolding ? `Nút đã bị mờ do bạn đang giữ chỗ phòng ${heldRoomNumber}. Hãy hủy giữ chỗ để kích hoạt lại nút.` : ''}
                              >
                                <span>🔄 Chuyển Sang Phòng Này (Tự Động Trả Phòng Cũ ${myRentedRoom})</span>
                              </button>
                            )
                          ) : (
                            <button
                              disabled={isCurrentlyHolding}
                              onClick={() => {
                                if (isCurrentlyHolding) return;
                                setRequestModal({ room: selectedRoomDetails, type: 'RENT' });
                                setRequestSuccess(false);
                                setRequestNote(`Em có nguyện vọng đăng ký thuê phòng ${selectedRoomDetails.number}`);
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                                isCurrentlyHolding
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50 shadow-none border border-slate-300 pointer-events-none'
                                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-600/20 cursor-pointer btn-press'
                              }`}
                              title={isCurrentlyHolding ? `Nút đã bị mờ do bạn đang giữ chỗ phòng ${heldRoomNumber}. Hãy hủy giữ chỗ để kích hoạt lại nút.` : ''}
                            >
                              <span>🔑 Đăng Ký Thuê Phòng Này</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : selectedRoomDetails.status === 'OCCUPIED' && selectedRoomDetails.occupants < selectedRoomDetails.maxOccupants ? (
                    <div className="space-y-2">
                      {/* Cảnh báo khi đang giữ chỗ phòng khác */}
                      {isCurrentlyHolding && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🔒</span>
                            <span>
                              Bạn đang giữ chỗ phòng <strong>{heldRoomNumber}</strong> ({heldHouseCode}). Nút xin vào ở ghép đang bị <strong>mờ và khóa</strong>.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Bạn có chắc chắn muốn hủy giữ chỗ phòng ${heldRoomNumber}? Nút xin ở ghép phòng ${selectedRoomDetails.number} sẽ sáng lên ngay lập tức.`)) {
                                if (cancelRoomHold) {
                                  cancelRoomHold(heldRoomNumber, heldHouseCode);
                                }
                              }
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                          >
                            Hủy Giữ Chỗ Phòng {heldRoomNumber}
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          disabled={isCurrentlyHolding}
                          onClick={() => {
                            if (isCurrentlyHolding) return;
                            setRequestModal({ room: selectedRoomDetails, type: 'ROOMMATE' });
                            setRequestSuccess(false);
                            setRequestNote(`Em có nguyện vọng muốn xin vào ở ghép cùng bạn phòng ${selectedRoomDetails.number}`);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                            isCurrentlyHolding
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50 shadow-none border border-slate-300 pointer-events-none'
                              : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-indigo-600/20 cursor-pointer btn-press'
                          }`}
                          title={isCurrentlyHolding ? `Nút đã bị mờ do bạn đang giữ chỗ phòng ${heldRoomNumber}. Hãy hủy giữ chỗ để kích hoạt lại nút.` : ''}
                        >
                          <span>{myRentedRoom ? `🔄 Xin Chuyển Sang Ở Ghép (Trả ${myRentedRoom})` : '🤝 Xin Vào Ở Ghép'}</span>
                        </button>
                        <span className="text-[11px] text-indigo-700 bg-indigo-50 font-bold px-2 py-1 rounded-lg border border-indigo-200">
                          Còn trống {selectedRoomDetails.maxOccupants - selectedRoomDetails.occupants} chỗ
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 font-medium italic">
                      {selectedRoomDetails.status === 'MAINTENANCE'
                        ? '🟠 Phòng đang bảo trì, tạm thời không nhận đăng ký.'
                        : selectedRoomDetails.status === 'LOCKED'
                        ? '🔒 Phòng đang tạm khóa, hiện không tiếp nhận đăng ký thuê.'
                        : `🔒 Phòng này đã đủ số lượng người ở (${selectedRoomDetails.occupants}/${selectedRoomDetails.maxOccupants} người).`}
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedRoomDetails(null)}
                    className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all btn-press cursor-pointer ml-auto"
                  >
                    Đóng
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Đổi trạng thái:</span>
                    <select
                      value={selectedRoomDetails.status}
                      onChange={(e) => {
                        handleUpdateStatus(selectedRoomDetails.id, e.target.value);
                        setSelectedRoomDetails({ ...selectedRoomDetails, status: e.target.value });
                      }}
                      className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:bg-white focus:border-purple-500"
                    >
                      <option value="AVAILABLE">Còn trống</option>
                      <option value="OCCUPIED">Đang thuê</option>
                      <option value="MAINTENANCE">Bảo trì</option>
                      <option value="LOCKED">🔒 Tạm khóa phòng</option>
                      <option value="CLEANING">🧹 Chờ dọn dẹp</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManageRoom(selectedRoomDetails) && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditRoom(selectedRoomDetails)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
                          title="Chỉnh sửa toàn diện phòng trọ"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                          <span>Sửa Phòng</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRoomSafe(selectedRoomDetails)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
                          title="Xóa phòng trọ (nếu trống)"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Xóa Phòng</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setSelectedRoomDetails(null)}
                      className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all btn-press cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Modal>

{/* Modal Đăng Ký Nguyện Vọng: Chuyển phòng / Thuê thêm / Ở ghép */}
      <Modal
        isOpen={!!requestModal}
        onClose={() => {
          setRequestModal(null);
          setRequestSuccess(false);
        }}
        maxWidth="max-w-md"
      >
        {requestModal && (
          <div>
            {requestSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 success-pop-icon">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {requestModal.type === 'TRANSFER' ? 'Đã Chuyển Phòng & Tự Đổi Hợp Đồng!' : 'Đã Gửi Yêu Cầu Thành Công!'}
                </h3>
                <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
                  {requestModal.type === 'TRANSFER' ? (
                    <>Bạn đã được chuyển sang <strong className="text-purple-700">Phòng {requestModal.room.number}</strong>. Hợp đồng điện tử và tiền cọc đã được tự động cập nhật sang phòng mới.</>
                  ) : requestModal.type === 'RENT' ? (
                    <>Đơn đăng ký thuê <strong className="text-purple-700">Phòng {requestModal.room.number}</strong> đã được gửi lên hệ thống. Đang chờ Quản lý/Staff cơ sở phê duyệt hồ sơ để mở cổng nộp cọc và ký hợp đồng giữ chỗ.</>
                  ) : (
                    <>Ban Quản Lý đã tiếp nhận nguyện vọng của bạn đối với <strong className="text-purple-700">Phòng {requestModal.room.number}</strong>.</>
                  )}
                </p>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-6 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hình thức đăng ký:</span>
                    <span className="font-bold text-purple-700">
                      {requestModal.type === 'TRANSFER'
                        ? '🔄 Đổi / Chuyển phòng'
                        : requestModal.type === 'ROOMMATE'
                        ? '🤝 Xin vào ở ghép'
                        : requestModal.type === 'RENT'
                        ? '🔑 Đăng ký thuê phòng mới'
                        : '➕ Thuê thêm phòng'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phòng đăng ký:</span>
                    <span className="font-bold text-slate-800">
                      {requestModal.room.number} ({requestModal.room.houseCode})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phòng hiện tại:</span>
                    <span className="font-bold text-slate-800">{transferFromRoom || myRentedRooms[0] || myRentedRoom || 'P.101'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Người gửi:</span>
                    <span className="font-bold text-slate-800">{user?.fullName || 'Nguyễn Văn Khách Thuê'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số điện thoại:</span>
                    <span className="font-mono font-bold text-slate-800">{requestPhone}</span>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-[11px] text-purple-900 text-left mb-6">
                  📞 Quản lý cơ sở (Trần Văn Mạnh - 0912.888.666) sẽ liên hệ lại trực tiếp qua số điện thoại của bạn để xếp lịch xem phòng và hỗ trợ làm thủ tục.
                </div>

                <button
                  onClick={() => {
                    setRequestModal(null);
                    setRequestSuccess(false);
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md btn-press cursor-pointer"
                >
                  Xác Nhận & Đóng
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">
                        {requestModal.type === 'TRANSFER'
                          ? 'Đăng Ký Chuyển Sang Phòng Này'
                          : requestModal.type === 'ROOMMATE'
                          ? 'Đăng Ký Xin Vào Ở Ghép'
                          : requestModal.type === 'RENT'
                          ? 'Đăng Ký Thuê Phòng Này'
                          : 'Đăng Ký Thuê Thêm Phòng Này'}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Gửi nguyện vọng trực tiếp đến Ban Quản Lý tòa nhà
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRequestModal(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 btn-press-ghost cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Target Room Specs */}
                <div className="my-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Phòng {requestModal.room.number}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                        {requestModal.room.houseCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {getHouseName(requestModal.room.houseCode, requestModal.room.house)} • {requestModal.room.floor}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-purple-700 text-sm">
                      {requestModal.room.price.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[10px] text-slate-400">/tháng ({requestModal.room.area}m²)</div>
                  </div>
                </div>

                {/* Rule explanation banners for Transfer vs Additional vs Roommate */}
                {requestModal.type === 'RENT' && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5 text-amber-900">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Quy Trình Duyệt Hồ Sơ & Nộp Tiền Cọc Trọ:</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Khi bạn nhấn <strong>Xác Nhận Đăng Ký Thuê</strong>, đơn sẽ được gửi lên Ban Quản Lý cơ sở duyệt hồ sơ.
                    </p>
                    <p className="text-[11px] text-purple-700 font-semibold">
                      Chỉ sau khi Quản lý/Staff kiểm tra và bấm <strong>[Phê Duyệt & Mở Cổng Nộp Cọc]</strong>, cổng thanh toán tiền cọc SePay QR (giữ chỗ 15 phút) mới được kích hoạt trên Trang Chủ của bạn.
                    </p>
                  </div>
                )}

                {requestModal.type === 'TRANSFER' && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <span>⚠️</span>
                      <span>Quy Định Chuyển Phòng: TỰ ĐỘNG BẢO LƯU HỢP ĐỒNG & TRẢ PHÒNG CŨ</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Khi xác nhận chuyển sang phòng <strong>{requestModal.room.number}</strong>, hệ thống sẽ <strong>tự động trả phòng cũ</strong> của bạn và chuyển bạn sang phòng mới này.
                    </p>
                    {myRentedRooms.length > 1 ? (
                      <div className="pt-2 border-t border-amber-200/80">
                        <label className="block font-bold text-amber-950 mb-1 text-[11px]">
                          Chọn phòng hiện tại bạn muốn trả khi chuyển sang phòng mới:
                        </label>
                        <select
                          value={transferFromRoom || myRentedRooms[0]}
                          onChange={(e) => setTransferFromRoom(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                        >
                          {myRentedRooms.map((rm) => (
                            <option key={rm} value={rm}>
                              Phòng {rm} (Trả phòng này khi chuyển)
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : myRentedRooms.length === 1 ? (
                      <div className="text-[11px] font-bold text-amber-950 pt-1 border-t border-amber-200/60">
                        Phòng cũ sẽ tự động trả khi duyệt chuyển: <span className="underline font-mono">Phòng {myRentedRooms[0]}</span>
                      </div>
                    ) : null}
                  </div>
                )}

                {requestModal.type === 'ADDITIONAL_RENT' && (
                  <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-1 text-purple-900">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>➕</span>
                      <span>Quy Định Thuê Thêm: KHÔNG TỰ ĐỘNG TRẢ PHÒNG CŨ</span>
                    </div>
                    <p className="text-[11px] text-purple-800 leading-relaxed">
                      Theo quy tắc Single Active Lease: Mỗi khách thuê chỉ thuê 1 phòng duy nhất. Khi đơn được duyệt, hệ thống sẽ tự động cập nhật bạn sang phòng mới.
                    </p>
                  </div>
                )}

                {requestModal.type === 'ROOMMATE' && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1 text-blue-900">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>🤝</span>
                      <span>Quy Định Xin Ở Ghép: KHÔNG TỰ ĐỘNG TRẢ PHÒNG CŨ</span>
                    </div>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      Đơn xin ở ghép sẽ được gửi đến tất cả thành viên trong phòng <strong>{requestModal.room.number}</strong> biểu quyết trước. Các phòng bạn đang thuê (nếu có) <strong>vẫn được giữ nguyên</strong> (hệ thống KHÔNG tự động trả phòng cũ).
                    </p>
                  </div>
                )}

                <form onSubmit={handleSendRoomRequest} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Số điện thoại liên hệ xác nhận:
                    </label>
                    <input
                      type="text"
                      required
                      value={requestPhone}
                      onChange={(e) => setRequestPhone(e.target.value)}
                      placeholder="09..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Ghi chú / Nguyện vọng của bạn:
                    </label>
                    <textarea
                      rows={3}
                      value={requestNote}
                      onChange={(e) => setRequestNote(e.target.value)}
                      placeholder={
                        requestModal.type === 'TRANSFER'
                          ? 'Ví dụ: Em muốn đổi sang phòng này từ ngày 01 tháng sau vì tầng 2 đi lại tiện hơn...'
                          : requestModal.type === 'ROOMMATE'
                          ? 'Ví dụ: Em sinh viên năm 3, sạch sẽ, không hút thuốc, muốn xin vào ở ghép để share tiền phòng...'
                          : 'Ví dụ: Em muốn thuê thêm phòng này cho bạn học cùng trường dọn vào ở...'
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                    />
                  </div>

                  {/* NGHIỆP VỤ 6: Cảnh báo sức chứa không phù hợp nếu chuyển phòng */}
                  {(() => {
                    if (requestModal.type !== 'TRANSFER') return null;
                    const curOcc = myRentedRoomObj?.occupants || 1;
                    const targetCap = requestModal.room?.maxOccupants || 2;
                    if (curOcc > targetCap) {
                      return (
                        <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
                          <span>⚠️</span>
                          <span>Số lượng người không phù hợp với phòng: Phòng hiện tại của bạn có {curOcc} người, vượt quá sức chứa tối đa ({targetCap} người) của phòng {requestModal.room.number}!</span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Hiển thị lỗi nghiệp vụ nếu có */}
                  {requestErrorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 font-bold flex items-start gap-2">
                      <span className="text-base leading-none">⚠️</span>
                      <span className="leading-relaxed">{requestErrorMsg}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setRequestModal(null)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-colors btn-press-ghost"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={requestModal.type === 'TRANSFER' && (myRentedRoomObj?.occupants || 1) > (requestModal.room?.maxOccupants || 2)}
                      className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/25 transition-all btn-press flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{requestModal.type === 'TRANSFER' ? 'Xác Nhận Đổi Sang Phòng Này' : 'Gửi Nguyện Vọng'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Quản Lý & Phê Duyệt Đơn Nguyện Vọng (Admin / Staff & Khách xem đơn) */}
      <Modal
        isOpen={showRequestsManager}
        onClose={() => setShowRequestsManager(false)}
        maxWidth="max-w-2xl"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-600/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {isTenant ? 'Lịch Sử Đơn Nguyện Vọng Của Bạn' : 'Xét Duyệt Đơn Chuyển / Thuê / Ở Ghép'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {isTenant
                    ? 'Theo dõi tiến độ phê duyệt từ các bạn cùng phòng và Ban Quản Lý'
                    : 'Phê duyệt nguyện vọng cư dân và tự động cập nhật sơ đồ phòng thuộc chuỗi'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRequestsManager(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 btn-press-ghost cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Tabs - Nhân viên cơ sở chỉ xem và đếm đơn thuộc đúng cơ sở mình */}
          {!isTenant && (
            <div className="flex items-center gap-2 pt-4 pb-2 overflow-x-auto text-xs">
              {[
                { 
                  id: 'ALL', 
                  label: 'Tất cả đơn', 
                  count: roomRequests.filter(r => isAllowedReqForStaff(r)).length 
                },
                {
                  id: 'PENDING',
                  label: 'Cần BQL duyệt',
                  count: roomRequests.filter(
                    (r) => isAllowedReqForStaff(r) &&
                      (r.status === 'PENDING' || r.status === 'ROOMMATES_APPROVED' || r.status === 'HOLDING')
                  ).length
                },
                {
                  id: 'WAITING',
                  label: 'Cư dân đang biểu quyết',
                  count: roomRequests.filter((r) => 
                    isAllowedReqForStaff(r) &&
                    r.status === 'WAITING_ROOMMATES'
                  ).length
                },
                {
                  id: 'APPROVED',
                  label: 'Đã duyệt',
                  count: roomRequests.filter((r) => 
                    isAllowedReqForStaff(r) &&
                    r.status === 'APPROVED'
                  ).length
                },
                {
                  id: 'REJECTED',
                  label: 'Đã từ chối',
                  count: roomRequests.filter(
                    (r) => isAllowedReqForStaff(r) &&
                      (r.status === 'REJECTED' || r.status === 'REJECTED_BY_ROOMMATES')
                  ).length
                },
                {
                  id: 'ROOMMATES_V2',
                  label: '🤝 Ở ghép CCCD (UC-S02B)',
                  count: roommateRequestsV2.filter(r => user?.role !== 'STAFF' || (staffAllowedCodes.length > 0 && staffAllowedCodes.includes(r.houseCode || 'CS-01'))).length
                },
                {
                  id: 'SETTLEMENTS',
                  label: '💰 Trả phòng & Hoàn cọc (UC-S07)',
                  count: moveOutSettlements.filter(s => user?.role !== 'STAFF' || (staffAllowedCodes.length > 0 && staffAllowedCodes.includes(s.houseCode || 'CS-01'))).length
                }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRequestFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    requestFilter === tab.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          )}

          {/* Request List */}
          <div className="py-4 space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
            {requestFilter === 'ROOMMATES_V2' ? (
              roommateRequestsV2.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <p>Chưa có yêu cầu đăng ký ở ghép CCCD nào.</p>
                </div>
              ) : (
                roommateRequestsV2.map((req) => (
                  <div key={req.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{req.fullName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-semibold font-mono">
                          CCCD: {req.identityCard}
                        </span>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status === 'APPROVED' ? 'Đã duyệt' : req.status === 'REJECTED' ? 'Đã từ chối' : 'Chờ BQL duyệt'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                      <div>Phòng xin vào: <strong className="text-slate-900 font-mono">{req.roomId}</strong></div>
                      <div>SĐT liên hệ: <strong className="text-slate-900 font-mono">{req.phone}</strong></div>
                      <div>Ngày sinh: <span>{req.birthDate}</span></div>
                      <div>Quê quán: <span>{req.hometown}</span></div>
                    </div>

                    {req.status === 'PENDING' && !isTenant && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => {
                            const reason = window.prompt('Nhập lý do từ chối:');
                            if (reason !== null) reviewRoommateRequest(req.id, 'REJECTED', reason || 'Không đủ điều kiện');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          Từ chối
                        </button>
                        <button
                          onClick={() => reviewRoommateRequest(req.id, 'APPROVED')}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition shadow-xs"
                        >
                          Duyệt vào phòng & Cấp tài khoản (UC-S02B)
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )
            ) : requestFilter === 'SETTLEMENTS' ? (
              moveOutSettlements.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <p>Chưa có hồ sơ thanh lý, trả phòng nào.</p>
                </div>
              ) : (
                moveOutSettlements.map((st) => (
                  <div key={st.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-sm text-slate-900">{st.tenantName}</span>
                        <span className="text-xs text-slate-500 ml-2">Phòng {st.roomNumber} ({st.contractId})</span>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        st.refundStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {st.refundStatus === 'COMPLETED' ? 'Đã hoàn cọc' : 'Chờ nghiệm thu / hoàn cọc'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                      <div>Ngày trả: <strong className="text-slate-900">{st.moveOutDate}</strong></div>
                      <div>Cọc gốc: <strong className="text-slate-900">{st.originalDeposit.toLocaleString('vi-VN')} đ</strong></div>
                      <div>Hỏng hóc khấu trừ: <strong className="text-rose-600">{(st.damageFee || 0).toLocaleString('vi-VN')} đ</strong></div>
                      <div>Hoàn thực tế: <strong className="text-emerald-700 font-bold">{st.refundAmount.toLocaleString('vi-VN')} đ</strong></div>
                      <div className="col-span-2 text-[11px] font-mono text-slate-500">
                        TK nhận: {st.bankName} - {st.bankAccount} ({st.accountHolder})
                      </div>
                    </div>

                    {!isTenant && (
                      <div className="flex items-center justify-end pt-2 border-t border-slate-200">
                        <button
                          onClick={() => setActiveSettlementModal(st)}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-lg transition"
                        >
                          Nghiệm thu & Quyết toán hoàn cọc (UC-S07)
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )
            ) : (!isTenant
              ? roomRequests.filter((r) => {
                  if (!isAllowedReqForStaff(r)) return false;
                  if (requestFilter === 'ALL') return true;
                  if (requestFilter === 'PENDING')
                    return r.status === 'PENDING' || r.status === 'ROOMMATES_APPROVED';
                  if (requestFilter === 'WAITING')
                    return r.status === 'WAITING_ROOMMATES';
                  if (requestFilter === 'APPROVED') return r.status === 'APPROVED';
                  if (requestFilter === 'REJECTED')
                    return r.status === 'REJECTED' || r.status === 'REJECTED_BY_ROOMMATES';
                  return true;
                })
              : myRequests
            ).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>Không có đơn yêu cầu nào trong danh mục này.</p>
              </div>
            ) : (
              (!isTenant
                ? roomRequests.filter((r) => {
                    if (!isAllowedReqForStaff(r)) return false;
                    if (requestFilter === 'ALL') return true;
                    if (requestFilter === 'PENDING')
                      return (
                        r.status === 'PENDING' ||
                        r.status === 'ROOMMATES_APPROVED' ||
                        r.status === 'WAITING_ROOMMATES' ||
                        r.status === 'HOLDING'
                      );
                    if (requestFilter === 'APPROVED') return r.status === 'APPROVED';
                    if (requestFilter === 'REJECTED')
                      return r.status === 'REJECTED' || r.status === 'REJECTED_BY_ROOMMATES';
                    return true;
                  })
                : myRequests
              ).map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 transition-all hover:border-purple-200 hover:bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] ${
                          req.type === 'TRANSFER'
                            ? 'bg-purple-100 text-purple-800'
                            : req.type === 'ROOMMATE'
                            ? 'bg-blue-100 text-blue-800'
                            : req.type === 'CHECKOUT'
                            ? 'bg-rose-100 text-rose-800'
                            : req.type === 'RENEW_CONTRACT'
                            ? 'bg-indigo-100 text-indigo-800'
                            : req.type === 'RENT' || req.type === 'NEW_RENT'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {req.type === 'TRANSFER'
                          ? '🔄 Đổi / Chuyển phòng'
                          : req.type === 'ROOMMATE'
                          ? '🤝 Xin vào ở ghép'
                          : req.type === 'CHECKOUT'
                          ? '📤 Trả phòng trước hạn (Mất cọc)'
                          : req.type === 'RENEW_CONTRACT'
                          ? `📄 Gia Hạn Hợp Đồng: ${req.durationMonths || 6} Tháng`
                          : req.type === 'RENT' || req.type === 'NEW_RENT'
                          ? '🔑 Đăng Ký Thuê Phòng Mới'
                          : '➕ Thuê thêm phòng'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-200 text-slate-700">
                        {req.houseCode || 'CS-01'}
                      </span>
                      <span className="text-slate-400 font-medium">{req.date}</span>
                    </div>

                    <div>
                      {req.status === 'WAITING_ROOMMATES' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <span>⏳</span> Đang chờ thành viên phòng {req.targetRoom} đồng ý
                        </span>
                      )}
                      {req.status === 'ROOMMATES_APPROVED' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                          <span>👍</span> Phòng {req.targetRoom} đã đồng ý (Chờ BQL duyệt)
                        </span>
                      )}
                      {req.status === 'REJECTED_BY_ROOMMATES' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <span>❌</span> Thành viên phòng {req.targetRoom} đã từ chối
                        </span>
                      )}
                      {(req.status === 'PENDING' || req.status === 'HOLDING') && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          🟡 Chờ BQL phê duyệt {req.status === 'HOLDING' ? '(Tạm giữ chỗ)' : ''}
                        </span>
                      )}
                      {req.status === 'APPROVED' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✅ Đã phê duyệt ({req.approvedAt || 'Xong'})
                        </span>
                      )}
                      {req.status === 'REJECTED' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          ❌ Ban Quản Lý từ chối
                        </span>
                      )}
                      {req.status === 'CANCELLED_BY_TENANT' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                          <span>⚪</span> Khách đã chủ động hủy giữ chỗ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="py-3 text-xs space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                      <div>
                        <span className="text-slate-500">Khách yêu cầu:</span>{' '}
                        <strong className="text-slate-900">{req.tenant}</strong> (
                        <a
                          href={`tel:${req.phone}`}
                          className="text-purple-600 hover:underline font-mono"
                        >
                          {req.phone}
                        </a>
                        )
                      </div>
                      <div>
                        <span className="text-slate-500">Phòng liên quan:</span>{' '}
                        <strong className="font-mono text-purple-700">{req.targetRoom}</strong>{' '}
                        <span className="text-slate-500">({req.houseCode || req.house})</span>
                      </div>
                      {req.currentRoom && req.type !== 'RENEW_CONTRACT' && (
                        <div>
                          <span className="text-slate-500">Phòng đang ở:</span>{' '}
                          <strong className="font-mono text-slate-900">{req.currentRoom}</strong>
                        </div>
                      )}
                    </div>

                    {req.type === 'RENEW_CONTRACT' && (
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-indigo-900 font-semibold">Gói thời hạn khách chọn:</span>
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-bold text-[11px]">
                            {req.durationMonths || 6} Tháng ({req.durationMonths === 12 ? '1 Năm' : `${req.durationMonths} Tháng`})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-900 font-semibold">Hạn hợp đồng hiện tại:</span>
                          <span className="font-mono font-medium text-slate-700">{req.currentContractEnd || '31/12/2026'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-900 font-semibold">Thời hạn gia hạn thỏa thuận:</span>
                          <span className="font-mono font-black text-purple-700">Từ {req.startDate} ➔ Đến {req.newContractEnd}</span>
                        </div>
                        <p className="text-[10px] text-indigo-700 italic pt-1 border-t border-indigo-200/60">
                          ⚖️ Quy định: Khách hàng chủ động chọn thời gian và ngày gia hạn. Staff & Admin kiểm tra và bấm phê duyệt hợp đồng.
                        </p>
                      </div>
                    )}

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 text-[11px] text-slate-600 italic">
                      "{req.note}"
                    </div>
                  </div>

                  {/* Admin Action Buttons */}
                  {!isTenant && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end gap-2">
                      {req.status === 'WAITING_ROOMMATES' && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 font-semibold w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">🔒</span>
                            <span>
                              <strong>Đang chờ cư dân biểu quyết:</strong> Bạn có thể đợi các bạn cùng phòng biểu quyết hoặc dùng quyền Chủ trọ để duyệt nhanh và chốt phòng ngay.
                            </span>
                          </div>
                          <button
                            onClick={() => approveRoomRequest(req.id)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-1.5 btn-press"
                          >
                            <span>⚡ Chủ Trọ Duyệt Nhanh</span>
                          </button>
                        </div>
                      )}

                      {(req.status === 'PENDING' || req.status === 'ROOMMATES_APPROVED' || req.status === 'HOLDING') && (
                        <>
                          <button
                            onClick={() => rejectRoomRequest(req.id)}
                            className="px-3.5 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all btn-press-ghost cursor-pointer"
                          >
                            Từ Chối
                          </button>
                          {req.type === 'CHECKOUT' ? (
                            <button
                              onClick={() => {
                                const activeContract = (contracts || []).find(
                                  (c) => c.roomNumber === req.targetRoom && c.status === 'ACTIVE'
                                ) || (contracts || []).find((c) => c.roomNumber === req.targetRoom);
                                const tenantObj = (tenants || []).find((t) =>
                                  (t.fullName || '').toLowerCase().includes((req.tenant || '').toLowerCase())
                                );
                                setActiveSettlementModal({
                                  id: req.id,
                                  requestId: req.id,
                                  roomNumber: req.targetRoom,
                                  tenantName: req.tenant,
                                  contractId: activeContract?.id || 1,
                                  originalDeposit: activeContract?.depositAmount || tenantObj?.deposit || 3500000,
                                  bankAccount: req.refundAccountNumber || tenantObj?.bankAccount || '0987654321',
                                  bankName: req.refundBank || tenantObj?.bankName || 'Vietcombank',
                                  accountHolder: req.refundAccountName || req.tenant || 'NGUYỄN VĂN AN',
                                  house: req.house,
                                  houseCode: req.houseCode,
                                  isContractExpired: Boolean(req.isContractExpired),
                                  leaveDate: req.date || new Date().toLocaleDateString('vi-VN')
                                });
                              }}
                              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md btn-press cursor-pointer flex items-center gap-1.5"
                            >
                              <span>📋 Nghiệm Thu Tài Sản & Quyết Toán Cọc</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => approveRoomRequest(req.id)}
                              className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 btn-press cursor-pointer flex items-center gap-1.5"
                            >
                              <span>
                                {req.type === 'RENEW_CONTRACT'
                                  ? '✅ Phê Duyệt Gia Hạn Hợp Đồng'
                                  : '✅ Phê Duyệt & Mở Cổng Nộp Cọc'}
                              </span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setShowRequestsManager(false)}
              className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all btn-press cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Trả Phòng Trước Hạn - Thông Báo Mất Cọc */}
      <Modal
        isOpen={!!checkoutModal}
        onClose={() => {
          setCheckoutModal(null);
          setCheckoutSuccess(false);
          setAgreedForfeitDeposit(false);
          setCheckoutReason('');
        }}
        maxWidth="max-w-md"
      >
        {checkoutModal && (
          <div>
            {checkoutSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 success-pop-icon">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {isCheckoutRoomMulti ? 'Đã Gửi Yêu Cầu Biểu Quyết Trả Phòng!' : 'Đã Gửi Yêu Cầu Trả Phòng!'}
                </h3>
                <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                  {isCheckoutRoomMulti ? (
                    <>
                      Do phòng <strong className="text-rose-600">Phòng {typeof checkoutModal === 'string' ? checkoutModal : checkoutModal?.number}</strong> hiện có {selectedCheckoutRoomObj?.occupants || 2} người ở, yêu cầu trả phòng đã được gửi tới tất cả bạn cùng phòng để biểu quyết. Khi tất cả cùng đồng ý, đơn sẽ tự động chuyển tới Ban Quản Lý phê duyệt.
                    </>
                  ) : (
                    <>
                      Phòng chỉ có 1 mình bạn nên yêu cầu đã được chuyển thẳng tới Ban Quản Lý để xếp lịch kiểm kê và hoàn tất thủ tục bàn giao.
                    </>
                  )}
                </p>

                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-5 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Phòng trả:</span>
                    <span className="font-bold text-slate-900">
                      {typeof checkoutModal === 'string' ? checkoutModal : checkoutModal?.number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tình trạng duyệt:</span>
                    <span className="font-bold text-purple-700">
                      {isCheckoutRoomMulti ? 'Chờ tất cả bạn cùng phòng đồng ý' : 'Đã chuyển BQL xếp lịch kiểm kê'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tiền cọc xử lý:</span>
                    <span className="font-bold text-rose-700">Tịch thu (Mất cọc trước hạn)</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 text-left mb-5">
                  📞 Nhân viên quản lý cơ sở sẽ liên hệ trực tiếp sau khi hoàn tất các thủ tục theo quy định.
                </div>

                <button
                  onClick={() => {
                    setCheckoutModal(null);
                    setCheckoutSuccess(false);
                    setAgreedForfeitDeposit(false);
                    setCheckoutReason('');
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md btn-press cursor-pointer"
                >
                  Đóng Thông Báo
                </button>
              </div>
            ) : (
              <div>
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">
                        {isCheckoutRoomMulti ? 'Yêu Cầu Biểu Quyết Trả Phòng' : 'Yêu Cầu Trả Phòng Trước Hạn'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Phòng {typeof checkoutModal === 'string' ? checkoutModal : checkoutModal?.number} (Hiện có {selectedCheckoutRoomObj?.occupants || 1} người đang ở)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCheckoutModal(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 btn-press-ghost cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Multi-occupant Rule Notice */}
                {isCheckoutRoomMulti && (
                  <div className="my-3 p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs space-y-1.5 text-indigo-900">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>👥</span>
                      <span>Quy Định Phòng Có Người Khác: Phải Hỏi Tất Cả Mọi Người</span>
                    </div>
                    <p className="text-[11px] text-indigo-800 leading-relaxed font-medium">
                      Phòng này hiện có <strong>{selectedCheckoutRoomObj?.occupants} người</strong>. Vì việc trả phòng ảnh hưởng đến toàn bộ cư dân trong phòng, hệ thống sẽ gửi thông báo biểu quyết tới <strong>tất cả các bạn cùng phòng</strong>. Đơn chỉ được chuyển tới Ban Quản Lý khi <strong>tất cả mọi người đều đồng ý</strong>.
                    </p>
                    <p className="text-[11px] text-amber-900 font-semibold pt-1 border-t border-indigo-200/60">
                      💡 Mẹo: Nếu bạn chỉ muốn dọn ra ngoài một mình và để các bạn khác tiếp tục ở, vui lòng chọn <strong>[Rời phòng]</strong> (không cần biểu quyết).
                    </p>
                  </div>
                )}

                {/* Important Forfeit Notice */}
                <div className="my-3.5 p-3.5 bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl border-2 border-rose-300 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <h4 className="font-black text-rose-900 uppercase tracking-wide text-[11px] mb-1">
                        Cảnh báo: Trả phòng chưa hết hạn hợp đồng!
                      </h4>
                      <p className="text-rose-800 leading-relaxed font-medium">
                        Hợp đồng thuê phòng vẫn còn hiệu lực. Theo quy định tại Hợp đồng thuê phòng, việc đơn phương trả phòng trước thời hạn sẽ{' '}
                        <strong className="text-rose-950 font-black underline">
                          KHÔNG ĐƯỢC HOÀN LẠI TIỀN CỌC
                        </strong>{' '}
                        (ước tính:{' '}
                        <span className="font-bold text-rose-950">
                          {(currentTenant?.deposit || 3500000).toLocaleString('vi-VN')} đ
                        </span>
                        ).
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSendCheckout} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Lý do bạn muốn trả phòng:
                    </label>
                    <textarea
                      rows={3}
                      value={checkoutReason}
                      onChange={(e) => setCheckoutReason(e.target.value)}
                      placeholder="Ví dụ: Em đổi chỗ làm/về quê gấp nên không thể tiếp tục thuê..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-rose-500"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedForfeitDeposit}
                        onChange={(e) => setAgreedForfeitDeposit(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                      />
                      <span className="text-xs text-amber-950 font-semibold leading-snug">
                        Tôi xác nhận đã đọc, hiểu rõ và chấp nhận điều khoản{' '}
                        <span className="text-rose-700 font-extrabold underline">
                          MẤT TOÀN BỘ TIỀN CỌC
                        </span>{' '}
                        khi gửi yêu cầu trả phòng trước hạn.
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCheckoutModal(null)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-colors btn-press-ghost"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={!agreedForfeitDeposit}
                      className={`px-5 py-2.5 font-bold rounded-xl shadow-md transition-all btn-press flex items-center gap-1.5 cursor-pointer ${
                        agreedForfeitDeposit
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <span>
                        {isCheckoutRoomMulti
                          ? 'Gửi Lấy Ý Kiến Bạn Cùng Phòng'
                          : 'Xác Nhận Trả Phòng (Mất Cọc)'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Rời Phòng Cá Nhân (Dọn ra ngoài, không bắt bạn cùng phòng trả theo) */}
      <Modal
        isOpen={!!leaveModal}
        onClose={() => {
          setLeaveModal(null);
          setLeaveSuccess(false);
          setAgreedForfeitLeave(false);
          setLeaveReason('');
        }}
        maxWidth="max-w-md"
      >
        {leaveModal && (
          <div>
            {leaveSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 success-pop-icon">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Đã Rời Phòng Thành Công!
                </h3>
                <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                  Bạn đã rút tên khỏi <strong className="text-emerald-700">Phòng {typeof leaveModal === 'string' ? leaveModal : leaveModal?.number}</strong>. Các bạn cùng phòng (nếu có) vẫn tiếp tục thuê và sinh hoạt bình thường.
                </p>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Phòng đã rời:</span>
                    <span className="font-bold text-slate-900">
                      {typeof leaveModal === 'string' ? leaveModal : leaveModal?.number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tình trạng:</span>
                    <span className="font-bold text-emerald-700">Đã cập nhật cổng khách thuê</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bạn cùng phòng:</span>
                    <span className="font-semibold text-slate-800">Không bị ảnh hưởng</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setLeaveModal(null);
                    setLeaveSuccess(false);
                    setAgreedForfeitLeave(false);
                    setLeaveReason('');
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md btn-press cursor-pointer"
                >
                  Đóng Thông Báo
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <LogOut className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">
                        Rời Khỏi Phòng Thuê (Cá Nhân)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Phòng {typeof leaveModal === 'string' ? leaveModal : leaveModal?.number}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setLeaveModal(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 btn-press-ghost cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="my-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <span>🚪</span>
                    <span>Quyền lợi Rời phòng cá nhân</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Bạn đang thực hiện rời khỏi phòng <strong>{typeof leaveModal === 'string' ? leaveModal : leaveModal?.number}</strong>. Thao tác này chỉ rút tên riêng của bạn khỏi phòng này, <strong>không yêu cầu bạn cùng phòng biểu quyết</strong> và <strong>không làm gián đoạn hợp đồng của các bạn cùng phòng khác</strong>.
                  </p>
                  <p className="text-[11px] text-rose-700 font-semibold pt-1 border-t border-amber-200/60">
                    ⚠️ Lưu ý: Tự nguyện rời phòng trước hạn sẽ không được hoàn lại tiền cọc cá nhân.
                  </p>
                </div>

                <form onSubmit={handleSendLeave} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Lý do bạn rời phòng:
                    </label>
                    <textarea
                      rows={3}
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="Ví dụ: Em chuyển chỗ làm/dọn ra ở riêng..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                    />
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedForfeitLeave}
                        onChange={(e) => setAgreedForfeitLeave(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                      />
                      <span className="text-xs text-amber-950 font-semibold leading-snug">
                        Tôi xác nhận tự nguyện rời khỏi phòng này và chấp nhận các điều khoản dọn đi trước hạn.
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setLeaveModal(null)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-colors btn-press-ghost"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={!agreedForfeitLeave}
                      className={`px-5 py-2.5 font-bold rounded-xl shadow-md transition-all btn-press flex items-center gap-1.5 cursor-pointer ${
                        agreedForfeitLeave
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <span>Xác Nhận Rời Phòng</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Đăng Ký Gia Hạn Hợp Đồng (Khách tự chọn 3, 6, 12 tháng và ngày gia hạn) */}
      <Modal
        isOpen={showRenewalModal}
        onClose={() => {
          setShowRenewalModal(false);
          setRenewalSuccess(false);
          setRenewalNote('');
        }}
        maxWidth="max-w-md"
      >
        <div>
          {renewalSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 success-pop-icon">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Đã Gửi Yêu Cầu Gia Hạn Hợp Đồng!
              </h3>
              <p className="text-xs text-slate-500 mb-5 max-w-xs mx-auto">
                Nguyện vọng gia hạn thêm <strong>{renewalDuration} tháng</strong> của bạn đã chuyển tới Ban Quản Lý (Admin & Staff) để phê duyệt.
              </p>

              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-5 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Phòng gia hạn:</span>
                  <span className="font-bold text-slate-900">{myRentedRooms.join(', ') || userRoom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Gói thời hạn:</span>
                  <span className="font-bold text-indigo-700">{renewalDuration} Tháng</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Thời gian gia hạn:</span>
                  <span className="font-mono font-bold text-purple-700">
                    Từ {renewalStartDate} ➔ Đến {calculateRenewalEnd(renewalStartDate, renewalDuration)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Trạng thái:</span>
                  <span className="font-semibold text-amber-700">Chờ Admin / Staff phê duyệt</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowRenewalModal(false);
                  setRenewalSuccess(false);
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md btn-press cursor-pointer"
              >
                Xác Nhận & Đóng
              </button>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Gia Hạn Hợp Đồng Thuê Trọ
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Phòng {myRentedRooms.join(', ') || userRoom}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRenewalModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 btn-press-ghost cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Contract Info */}
              <div className="my-4 p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-purple-900 font-semibold">Khách thuê:</span>
                  <span className="font-bold text-slate-900">{user?.fullName || 'Khách thuê'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-900 font-semibold">Hạn hợp đồng hiện tại:</span>
                  <span className="font-mono font-bold text-purple-800">{currentTenant?.contractEnd || '31/12/2026'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-900 font-semibold">Tiền cọc bảo chứng:</span>
                  <span className="font-bold text-emerald-700">{(currentTenant?.deposit || 3500000).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <form onSubmit={handleSendRenewal} className="space-y-4 text-xs">
                {/* 3 standard duration tiers */}
                <div>
                  <label className="block font-bold text-slate-800 mb-2">
                    1. Chọn thời gian gia hạn hợp đồng (3 mức chuẩn):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { months: 3, label: '3 Tháng', sub: 'Ngắn hạn' },
                      { months: 6, label: '6 Tháng', sub: 'Tiêu chuẩn' },
                      { months: 12, label: '12 Tháng', sub: 'Dài hạn (1 năm)' }
                    ].map((item) => (
                      <button
                        key={item.months}
                        type="button"
                        onClick={() => setRenewalDuration(item.months)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          renewalDuration === item.months
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/25 scale-[1.02]'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="font-black text-sm">{item.label}</div>
                        <div className={`text-[10px] mt-0.5 ${renewalDuration === item.months ? 'text-purple-100' : 'text-slate-400'}`}>
                          {item.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Renewal start date & calculated end date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      2. Ngày bắt đầu gia hạn:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="DD/MM/YYYY"
                      value={renewalStartDate}
                      onChange={(e) => setRenewalStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Hạn hợp đồng mới:
                    </label>
                    <div className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 text-xs font-mono font-black text-purple-700">
                      {calculateRenewalEnd(renewalStartDate, renewalDuration)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    3. Ghi chú gửi Ban Quản Lý (Tùy chọn):
                  </label>
                  <textarea
                    rows={2}
                    value={renewalNote}
                    onChange={(e) => setRenewalNote(e.target.value)}
                    placeholder="Ví dụ: Em muốn tiếp tục ở hết năm học tới..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                  ⚖️ <strong>Quy chế gia hạn:</strong> Thời gian hợp đồng (3, 6, 12 tháng) và ngày gia hạn do khách hàng chủ động đề xuất. Staff và Admin sẽ kiểm tra và phê duyệt hợp đồng chính thức.
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowRenewalModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-colors btn-press-ghost"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/25 transition-all btn-press cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi Yêu Cầu Gia Hạn Đến BQL</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </Modal>

      {/* Toast thông báo cập nhật giá phòng */}
      {priceToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{priceToast.message}</span>
        </div>
      )}

      {/* Modal Sửa Giá Phòng: CHỈ CHO PHÉP SỬA PHÒNG CÒN TRỐNG */}
      <Modal isOpen={showPriceEditModal} onClose={() => setShowPriceEditModal(false)} maxWidth="max-w-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Điều Chỉnh Giá Thuê Phòng
              </h2>
              <p className="text-xs text-slate-500">
                Quy định: Chỉ sửa giá phòng còn trống, không sửa phòng đang có người
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPriceEditModal(false)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveRoomPrice} className="space-y-4 pt-4 text-xs">
          {/* Quy định rõ ràng */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Quy định điều chỉnh giá phòng:</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed pl-5.5">
              Hệ thống <strong>chỉ cho phép sửa giá niêm yết của các phòng CÒN TRỐNG</strong> để đón khách mới. Các phòng <strong>ĐANG CÓ NGƯỜI Ở</strong> sẽ bị khóa, không được sửa giá nhằm bảo vệ tính pháp lý của hợp đồng thuê hiện hành.
            </p>
          </div>

          {/* Chọn phòng */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Chọn phòng còn trống cần sửa giá *
            </label>
            <select
              value={roomToEditPrice ? roomToEditPrice.id : ''}
              onChange={(e) => {
                const found = rooms.find((r) => r.id === Number(e.target.value));
                setRoomToEditPrice(found || null);
                if (found) {
                  setNewRoomPriceInput(String(found.price));
                  setPriceErrorMsg('');
                }
              }}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:bg-white focus:border-indigo-500 cursor-pointer"
            >
              <option value="">-- Chọn một phòng còn trống --</option>
              {rooms.map((r) => {
                const isVacant = r.status === 'AVAILABLE' || r.occupants === 0;
                return (
                  <option
                    key={r.id}
                    value={r.id}
                    disabled={!isVacant}
                    className={!isVacant ? 'text-slate-400 italic bg-slate-100' : 'font-bold text-slate-800'}
                  >
                    [{r.houseCode}] {r.number} • {r.floor} ({getHouseName(r.houseCode, r.house)}) - Hiện tại: {r.price.toLocaleString('vi-VN')} đ/th {isVacant ? '🟢 [Còn trống - Được sửa]' : '🔴 [ĐANG CÓ NGƯỜI - KHÓA SỬA]'}
                  </option>
                );
              })}
            </select>
          </div>

          {roomToEditPrice && (
            <>
              {/* Thông tin phòng đã chọn */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Phòng:</span>
                  <span className="font-mono font-bold text-slate-900">{roomToEditPrice.number} ({roomToEditPrice.houseCode})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trạng thái hiện tại:</span>
                  <span className="font-bold text-blue-700">
                    {roomToEditPrice.status === 'AVAILABLE' ? 'Còn trống (0 người ở)' : roomToEditPrice.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Giá thuê hiện tại:</span>
                  <span className="font-mono font-bold text-slate-700">{roomToEditPrice.price.toLocaleString('vi-VN')} đ/tháng</span>
                </div>
              </div>

              {/* Nhập giá mới */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đơn giá thuê mới (VNĐ / tháng) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={newRoomPriceInput}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const cleaned = raw.replace(/^0+(?=\d)/, '');
                      setNewRoomPriceInput(cleaned);
                      setPriceErrorMsg('');
                    }}
                    placeholder="Ví dụ: 3800000"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-indigo-700 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    đ/tháng
                  </span>
                </div>

                {/* Định dạng tiền */}
                {newRoomPriceInput && Number(newRoomPriceInput) > 0 && (
                  <p className="text-[11px] text-indigo-600 font-bold mt-1">
                    Bằng chữ / Hiển thị: {Number(newRoomPriceInput).toLocaleString('vi-VN')} đ/tháng
                  </p>
                )}
              </div>

              {/* Quick suggestions */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 mb-1 block">Chọn nhanh mức giá gợi ý:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[2800000, 3000000, 3200000, 3500000, 3800000, 4000000, 4200000, 4500000, 4800000, 5000000].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewRoomPriceInput(String(p))}
                      className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-mono text-[10px] font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      {p.toLocaleString('vi-VN')} đ
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {priceErrorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{priceErrorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowPriceEditModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!roomToEditPrice || !newRoomPriceInput}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-indigo-600/25 cursor-pointer btn-press"
            >
              Lưu Giá Phòng Mới
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Chỉnh Sửa Toàn Diện Phòng Trọ (Staff / Admin) */}
      <Modal isOpen={!!editingRoomModal} onClose={() => setEditingRoomModal(null)} maxWidth="max-w-lg">
        {editingRoomModal && (
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Chỉnh Sửa Thông Tin Phòng {editingRoomModal.number}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Cập nhật số phòng, giá thuê, diện tích và tiện nghi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRoomModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRoom} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số phòng / Mã phòng *</label>
                  <input
                    type="text"
                    required
                    value={editRoomForm.number}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, number: e.target.value })}
                    placeholder="Ví dụ: P.101"
                    className={`w-full px-3 py-2 border rounded-xl font-bold text-xs focus:outline-none font-mono ${
                      isEditRoomDuplicate
                        ? 'bg-rose-50 border-rose-400 text-rose-900 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-purple-500'
                    }`}
                  />
                  {isEditRoomDuplicate && (
                    <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-1.5 text-xs text-rose-700 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Phòng "{editRoomForm.number}" đã tồn tại trong cơ sở này! Các phòng trong 1 cơ sở phải khác tên nhau.</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thuộc cơ sở *</label>
                  <select
                    value={editRoomForm.houseCode}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, houseCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:bg-white focus:border-purple-500 cursor-pointer"
                  >
                    {dynamicHousesList.filter((h) => h.code !== 'ALL').map((h) => (
                      <option key={h.code} value={h.code}>
                        [{h.code}] {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Tầng *</label>
                    {maxFloorsForEdit > 0 && (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full">
                        Tối đa {maxFloorsForEdit} tầng
                      </span>
                    )}
                  </div>
                  <select
                    value={editRoomForm.floor || 'Tầng 1'}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, floor: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-xl font-bold text-xs focus:outline-none cursor-pointer ${
                      isEditRoomFloorExceeded
                        ? 'bg-rose-50 border-rose-400 text-rose-900 focus:bg-white focus:border-rose-500'
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-purple-500'
                    }`}
                  >
                    {Array.from({ length: maxFloorsForEdit }, (_, i) => i + 1).map((fNum) => (
                      <option key={fNum} value={`Tầng ${fNum}`}>
                        Tầng {fNum}
                      </option>
                    ))}
                  </select>
                  {isEditRoomFloorExceeded && (
                    <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-1.5 text-[11px] text-rose-700 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Cơ sở này chỉ có {maxFloorsForEdit} tầng. Vui lòng chọn từ tầng 1 đến {maxFloorsForEdit}!</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diện tích (m²) *</label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="150"
                    value={editRoomForm.area}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, area: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sức chứa tối đa *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="10"
                    value={editRoomForm.maxOccupants}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, maxOccupants: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá thuê niêm yết (đ/tháng) *</label>
                  <input
                    type="number"
                    required
                    step="100000"
                    min="500000"
                    value={editRoomForm.price}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-purple-700 text-xs focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                    {Number(editRoomForm.price || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tiền cọc giữ phòng (đ) *</label>
                  <input
                    type="number"
                    required
                    step="100000"
                    min="0"
                    value={editRoomForm.deposit}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, deposit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700 text-xs focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                    {Number(editRoomForm.deposit || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trạng thái phòng</label>
                <select
                  value={editRoomForm.status}
                  onChange={(e) => setEditRoomForm({ ...editRoomForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:bg-white focus:border-purple-500 cursor-pointer"
                >
                  <option value="AVAILABLE">🟢 Còn trống (Sẵn sàng đón khách)</option>
                  <option value="OCCUPIED">🔵 Đang có khách thuê</option>
                  <option value="MAINTENANCE">🟠 Đang sửa chữa / Bảo trì</option>
                  <option value="LOCKED">🔒 Tạm khóa phòng (Không cho thuê)</option>
                  <option value="CLEANING">🧹 Chờ dọn dẹp vệ sinh</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Tiện nghi trong phòng</label>
                <div className="grid grid-cols-3 gap-2">
                  {['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Máy giặt', 'Ban công', 'Giường nệm', 'Tủ quần áo', 'Bếp nấu'].map((amenity) => {
                    const isChecked = (editRoomForm.amenities || []).includes(amenity);
                    return (
                      <label
                        key={amenity}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium cursor-pointer transition ${
                          isChecked ? 'bg-purple-50 border-purple-200 text-purple-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditRoomForm({ ...editRoomForm, amenities: [...(editRoomForm.amenities || []), amenity] });
                            } else {
                              setEditRoomForm({ ...editRoomForm, amenities: (editRoomForm.amenities || []).filter((a) => a !== amenity) });
                            }
                          }}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span>{amenity}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Ảnh Đại Diện / Thumbnail Phòng Trọ */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>Ảnh Phòng Trọ / Thumbnail Thực Tế</span>
                  </span>
                  <label className="text-[10px] text-purple-600 font-bold hover:underline cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Tải ảnh mới từ máy</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleRoomImageUpload(e, true)}
                    />
                  </label>
                </label>

                <div className="relative h-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mb-2">
                  <img
                    src={editRoomForm.image || getRoomImage(editRoomForm)}
                    alt="Preview phòng"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {ROOM_IMAGE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditRoomForm({ ...editRoomForm, image: preset.url })}
                      className={`p-1.5 rounded-xl border text-left text-[10px] transition-all flex items-center gap-1.5 cursor-pointer ${
                        editRoomForm.image === preset.url
                          ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold ring-1 ring-purple-600'
                          : 'border-slate-200 hover:border-purple-300 bg-white text-slate-600'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-5 h-5 rounded-md object-cover" />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Hoặc dán link ảnh phòng (https://...)"
                  value={editRoomForm.image}
                  onChange={(e) => setEditRoomForm({ ...editRoomForm, image: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const target = editingRoomModal;
                    setEditingRoomModal(null);
                    handleDeleteRoomSafe(target);
                  }}
                  className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl border border-rose-200 transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa phòng này</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRoomModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isEditRoomDuplicate || isEditRoomFloorExceeded}
                    className={`px-5 py-2 font-bold rounded-xl shadow-md transition-all ${
                      isEditRoomDuplicate || isEditRoomFloorExceeded
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-600/25 cursor-pointer btn-press'
                    }`}
                  >
                    Lưu Thay Đổi
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal Thêm Thành Viên Ở Ghép Cho Staff */}
      <Modal isOpen={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} maxWidth="max-w-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Thêm Thành Viên Vào Phòng {selectedRoomDetails?.number}
              </h3>
              <p className="text-[11px] text-slate-500">Khai báo người ở ghép theo quy định tạm trú</p>
            </div>
          </div>
          <button onClick={() => setShowAddMemberModal(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!selectedRoomDetails || !newMemberForm.fullName || !newMemberForm.cccd) return;
            addRoomMember({
              roomId: selectedRoomDetails.id,
              roomNumber: selectedRoomDetails.number,
              fullName: newMemberForm.fullName,
              phone: newMemberForm.phone || '0987.000.000',
              cccd: newMemberForm.cccd,
              roleInRoom: newMemberForm.roleInRoom || 'MEMBER',
              temporaryResidenceStatus: 'REGISTERED'
            });
            setShowAddMemberModal(false);
            setNewMemberForm({ fullName: '', phone: '', cccd: '', roleInRoom: 'MEMBER' });
          }}
          className="space-y-3 pt-3 text-xs"
        >
          <div>
            <label className="block font-bold text-slate-700 mb-1">Họ và tên thành viên *</label>
            <input
              type="text"
              required
              value={newMemberForm.fullName}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, fullName: e.target.value })}
              placeholder="Ví dụ: Lê Thị Hoa"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Số điện thoại *</label>
            <input
              type="tel"
              required
              value={newMemberForm.phone}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
              placeholder="Ví dụ: 0912.333.444"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Số CCCD / Định danh cá nhân *</label>
            <input
              type="text"
              required
              maxLength={12}
              value={newMemberForm.cccd}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, cccd: e.target.value.replace(/\D/g, '') })}
              placeholder="12 chữ số CCCD (Ví dụ: 001201019842)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">Hệ thống sẽ tự động che mờ 4 số cuối đối với các cư dân khác (NĐ 13/2023)</p>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Vai trò trong phòng</label>
            <select
              value={newMemberForm.roleInRoom}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, roleInRoom: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            >
              <option value="MEMBER">Thành viên ở ghép (MEMBER)</option>
              <option value="REPRESENTATIVE">Người đại diện hợp đồng (REPRESENTATIVE)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddMemberModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
            >
              Lưu Thành Viên
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ký Hợp Đồng Điện Tử Cho Khách Thuê */}
      <ResidentContractModal
        isOpen={!!selectedContractForModal}
        onClose={() => setSelectedContractForModal(null)}
        contract={selectedContractForModal}
        onSignSuccess={(contractId) => {
          signContractElectronically(contractId);
          setSelectedContractForModal(null);
        }}
      />

      {/* UC-T07: Modal Đăng Ký Bạn Cùng Phòng Ở Ghép */}
      <RoommateRequestModal
        isOpen={showRoommateModal}
        onClose={() => setShowRoommateModal(false)}
        userRoom={rooms.find((r) => r.number === (myRentedRooms[0] || userRoom)) || { roomNumber: myRentedRooms[0] || 'P.101', id: '101' }}
        activeContract={contracts.find((c) => c.roomNumber === (myRentedRooms[0] || userRoom))}
      />

      {/* UC-T06: Modal Báo Trả Phòng & Quyết Toán Cọc Ngân Hàng */}
      <TenantMoveOutNoticeModal
        isOpen={showMoveOutModal}
        onClose={() => setShowMoveOutModal(false)}
        activeContract={contracts.find((c) => c.roomNumber === (myRentedRooms[0] || userRoom)) || { id: 'HD-2026-001', deposit: 3000000 }}
        userRoom={rooms.find((r) => r.number === (myRentedRooms[0] || userRoom)) || { roomNumber: myRentedRooms[0] || 'P.101', id: '101' }}
      />

      {/* UC-S07: Modal Nghiệm Thu Tài Sản & Quyết Toán Hoàn Cọc */}
      <MoveOutSettlementModal
        isOpen={!!activeSettlementModal}
        onClose={() => setActiveSettlementModal(null)}
        settlement={activeSettlementModal}
        room={rooms.find((r) => r.number === activeSettlementModal?.roomNumber)}
        contract={contracts.find((c) => c.id === activeSettlementModal?.contractId)}
      />

      {/* Modal Cảnh Báo Vượt Hạn Mức Gói Cước SaaS */}
      <Modal isOpen={quotaExceededModal} onClose={() => setQuotaExceededModal(false)} maxWidth="max-w-md">
        <div className="text-center p-2">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Vượt Quá Giới Hạn Gói Cước ({landlordPackage})</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Hệ thống quy định: <strong>Phòng trọ do Chủ trọ toàn quyền thêm & kích hoạt tự do (KHÔNG CẦN ADMIN DUYỆT)</strong>, nhưng phải tuân thủ hạn mức gói cước SaaS đã đăng ký.
          </p>
          <div className="my-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Gói cước hiện tại:</span>
              <span className="font-bold text-purple-700">{landlordPackage}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Hạn mức tối đa:</span>
              <span className="font-bold text-slate-800">{maxRoomsAllowed} phòng</span>
            </div>
            <div className="flex justify-between py-1 border-t border-slate-200 mt-1 pt-1">
              <span className="text-slate-500">Số phòng hiện tại:</span>
              <span className="font-black text-rose-600">{rooms.length} / {maxRoomsAllowed} phòng</span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setQuotaExceededModal(false)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
            <Link
              to="/invoices/saas"
              className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/25 transition text-center flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Nâng Cấp Gói Ngay</span>
            </Link>
          </div>
        </div>
      </Modal>

    </div>
  );
}
