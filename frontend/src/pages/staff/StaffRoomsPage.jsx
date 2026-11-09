import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
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
export const ROOM_IMAGE_PRESETS = [
  { label: 'Phòng Studio Tiêu Chuẩn', url: '/assets/images/room_studio_1.jpg' },
  { label: 'Căn Duplex Gác Lửng', url: '/assets/images/room_duplex_2.jpg' },
  { label: 'Phòng Suite Ban Công Penthouse', url: '/assets/images/room_suite_3.jpg' },
  { label: 'Phòng Ngủ Tối Giản Hiện Đại', url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop' },
  { label: 'Phòng Full Nội Thất Cao Cấp', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop' }
];

export function getRoomImage(room) {
  if (room?.image) return room.image;
  const floor = parseInt(String(room?.floor || '').replace(/\D/g, '') || '1', 10);
  const amenities = Array.isArray(room?.amenities) ? room.amenities : [];
  if (floor >= 5 || amenities.some(a => typeof a === 'string' && (a.toLowerCase().includes('ban công') || a.toLowerCase().includes('penthouse') || a.toLowerCase().includes('sân phơi')))) {
    return '/assets/images/room_suite_3.jpg';
  }
  if (floor >= 3 || amenities.some(a => typeof a === 'string' && (a.toLowerCase().includes('máy giặt') || a.toLowerCase().includes('tủ lạnh')))) {
    return '/assets/images/room_duplex_2.jpg';
  }
  return '/assets/images/room_studio_1.jpg';
}

export function parseFloorNum(floorVal) {
  if (!floorVal) return 0;
  const match = String(floorVal).match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export function normalizeHouseCode(code) {
  if (!code) return '';
  const c = String(code).trim().toUpperCase();
  if (c === 'CS-01' || c === 'CS1') return 'CS-01';
  if (c === 'CS-02' || c === 'CS2') return 'CS-02';
  if (c === 'CS-03' || c === 'CS3') return 'CS-03';
  return c;
}

export function isSameHouse(codeA, codeB) {
  if (!codeA || !codeB) return false;
  const a = normalizeHouseCode(codeA);
  const b = normalizeHouseCode(codeB);
  if (a === b) return true;
  if ((a === 'CS-01' && b === 'S1-CS-01') || (a === 'S1-CS-01' && b === 'CS-01')) return true;
  if ((a === 'CS-02' && b === 'S2-CS-02') || (a === 'S2-CS-02' && b === 'CS-02')) return true;
  return false;
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

export function isDuplicateRoom(existingRooms, targetNumber, targetHouseCode, excludeRoomId = null) {
  if (!targetNumber || !String(targetNumber).trim()) return false;
  const normNum = normalizeRoomNumber(targetNumber);
  if (!normNum) return false;
  const targetHouse = normalizeHouseCode(targetHouseCode);
  if (!targetHouse) return false;
  return (existingRooms || []).some((r) => {
    if (excludeRoomId !== null && excludeRoomId !== undefined && (r.id === excludeRoomId || r.number === excludeRoomId)) {
      return false;
    }
    return isSameHouse(r.houseCode, targetHouse) && normalizeRoomNumber(r.number) === normNum;
  });
}

export function healBoardingHousesList(list) {
  if (!Array.isArray(list)) return [];
  return list;
}

const isZeroSandbox = typeof window === 'undefined' || localStorage.getItem('rental_is_zero_sandbox') !== 'false';

const AMENITY_OPTIONS = [
  'WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Máy giặt',
  'Giường nệm', 'Tủ quần áo', 'Ban công', 'Bếp riêng', 'Gác lửng', 'Khóa FaceID', 'Thang máy'
];

// Bảng màu nhận diện riêng cho từng Cơ sở / Tòa nhà (Phương án 2)
const HOUSE_COLOR_THEMES = [
  {
    name: 'purple',
    headerBg: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    ribbonBg: 'bg-purple-600 text-white',
    softBg: 'bg-purple-50/70',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    cardTopBorder: 'border-t-4 border-t-purple-600',
    sectionBorder: 'border-purple-200/90',
    dot: 'bg-purple-600',
    tabActive: 'bg-purple-600 text-white shadow-md shadow-purple-600/25',
    priceText: 'text-purple-700'
  },
  {
    name: 'teal',
    headerBg: 'bg-gradient-to-r from-teal-600 to-emerald-600',
    ribbonBg: 'bg-teal-600 text-white',
    softBg: 'bg-teal-50/70',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
    cardTopBorder: 'border-t-4 border-t-teal-600',
    sectionBorder: 'border-teal-200/90',
    dot: 'bg-teal-600',
    tabActive: 'bg-teal-600 text-white shadow-md shadow-teal-600/25',
    priceText: 'text-teal-700'
  },
  {
    name: 'amber',
    headerBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    ribbonBg: 'bg-amber-500 text-white',
    softBg: 'bg-amber-50/70',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
    cardTopBorder: 'border-t-4 border-t-amber-500',
    sectionBorder: 'border-amber-200/90',
    dot: 'bg-amber-500',
    tabActive: 'bg-amber-500 text-white shadow-md shadow-amber-500/25',
    priceText: 'text-amber-700'
  },
  {
    name: 'blue',
    headerBg: 'bg-gradient-to-r from-blue-600 to-cyan-600',
    ribbonBg: 'bg-blue-600 text-white',
    softBg: 'bg-blue-50/70',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    cardTopBorder: 'border-t-4 border-t-blue-600',
    sectionBorder: 'border-blue-200/90',
    dot: 'bg-blue-600',
    tabActive: 'bg-blue-600 text-white shadow-md shadow-blue-600/25',
    priceText: 'text-blue-700'
  },
  {
    name: 'rose',
    headerBg: 'bg-gradient-to-r from-rose-600 to-pink-600',
    ribbonBg: 'bg-rose-600 text-white',
    softBg: 'bg-rose-50/70',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
    cardTopBorder: 'border-t-4 border-t-rose-600',
    sectionBorder: 'border-rose-200/90',
    dot: 'bg-rose-600',
    tabActive: 'bg-rose-600 text-white shadow-md shadow-rose-600/25',
    priceText: 'text-rose-700'
  }
];

export default function StaffRoomsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    tenants = [],
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
    return [];
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

  // Lọc cơ sở mà Staff có thẩm quyền (Cách ly 100% giữa Staff 1 và Staff 2)
  const staffManageableHouses = useMemo(() => {
    if (user?.role === 'ADMIN') return storedBoardingHouses;
    const u = (user?.username || '').toLowerCase();

    return storedBoardingHouses.filter((h) => {
      if (!h) return false;
      const created = (h.createdBy || '').toLowerCase();
      const manager = (h.managerUsername || '').toLowerCase();
      const code = (h.code || '').toUpperCase();

      // NẾU LÀ STAFF 2 (Đàm Văn Táo): Tuyệt đối KHÔNG thấy CS-01 hay bất kỳ cơ sở nào của Staff 1
      if (u === 'staff2') {
        if (created === 'staff' || created === 'staff1' || manager === 'staff' || manager === 'staff1' || code.startsWith('S1-') || code === 'CS-01') {
          return false;
        }
        if (created === 'staff2' || manager === 'staff2' || code.startsWith('S2-')) return true;
        if (!isZeroSandbox && code === 'CS-02') return true;
        return false;
      }

      // NẾU LÀ STAFF 1 (Lê Thị Thu Ngân): Tuyệt đối KHÔNG thấy CS-02 hay bất kỳ cơ sở nào của Staff 2
      if (u === 'staff' || u === 'staff1') {
        if (created === 'staff2' || manager === 'staff2' || code.startsWith('S2-') || code === 'CS-02') {
          return false;
        }
        if (created === 'staff' || created === 'staff1' || manager === 'staff' || manager === 'staff1' || code.startsWith('S1-')) return true;
        if (!isZeroSandbox && (code === 'CS-01' || !h.createdBy)) return true;
        return false;
      }

      if (created && created === u) return true;
      if (manager && manager === u) return true;
      if (user?.houseCode && isSameHouse(h.code, user.houseCode)) return true;
      return false;
    });
  }, [storedBoardingHouses, user]);

  const staffHouseCodes = useMemo(() => staffManageableHouses.map((h) => h.code), [staffManageableHouses]);

  // Các cơ sở mà Staff có thể quản lý và thêm phòng (chỉ loại trừ cơ sở bị LOCKED)
  const activeManageableHouses = useMemo(() => {
    return staffManageableHouses.filter(
      (h) => h.status !== 'LOCKED'
    );
  }, [staffManageableHouses]);

  const [selectedHouse, setSelectedHouse] = useState(() => {
    if (rawParam !== 'ALL' && staffHouseCodes.some((c) => isSameHouse(c, rawParam) || c === rawParam)) return rawParam;
    return 'ALL';
  });

  // Tự động giải phóng selectedHouse nếu cơ sở đã chọn không thuộc quyền quản lý của Staff hiện tại
  useEffect(() => {
    if (selectedHouse !== 'ALL' && !staffHouseCodes.some((c) => isSameHouse(c, selectedHouse) || c === selectedHouse)) {
      setSelectedHouse('ALL');
    }
  }, [user, staffHouseCodes, selectedHouse]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showPriceEditModal, setShowPriceEditModal] = useState(false);
  const [showRequestsManager, setShowRequestsManager] = useState(false);
  const [highlightedRequestId, setHighlightedRequestId] = useState(null);

  // Tự động mở Modal Duyệt Đơn khi click từ Thông Báo Navbar hoặc URL có action=review-requests
  useEffect(() => {
    const action = searchParams.get('action');
    const reqId = searchParams.get('requestId');
    if (action === 'review-requests' || reqId) {
      setShowRequestsManager(true);
      if (reqId) setHighlightedRequestId(Number(reqId));
    }
  }, [searchParams]);

  useEffect(() => {
    const handleOpenReqManager = (e) => {
      setShowRequestsManager(true);
      if (e?.detail?.requestId) {
        setHighlightedRequestId(Number(e.detail.requestId));
      } else if (e?.detail?.notif?.id) {
        const match = String(e.detail.notif.id).match(/req-(\d+)/);
        if (match) setHighlightedRequestId(Number(match[1]));
      }
    };
    window.addEventListener('rental:open-requests-manager', handleOpenReqManager);
    return () => {
      window.removeEventListener('rental:open-requests-manager', handleOpenReqManager);
    };
  }, []);
  const [selectedRoomForMembers, setSelectedRoomForMembers] = useState(null);
  const [activeSettlementModal, setActiveSettlementModal] = useState(null);
  const [quotaExceededModal, setQuotaExceededModal] = useState(false);
  const [noHouseWarningModal, setNoHouseWarningModal] = useState(null); // null | 'NO_HOUSE' | 'NO_ACTIVE_HOUSE'
  const [roomFormError, setRoomFormError] = useState('');
  const [actionToast, setActionToast] = useState(null);

  // Form thêm / sửa phòng (Không fallback cứng vào 'CS-01' khi chưa có cơ sở)
  const [roomFormData, setRoomFormData] = useState({
    number: '',
    houseCode: activeManageableHouses[0]?.code || staffHouseCodes[0] || '',
    floor: 'Tầng 1',
    price: 3500000,
    area: 25,
    maxOccupants: 2,
    status: 'AVAILABLE',
    amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'],
    image: '/assets/images/room_studio_1.jpg'
  });

  // Tự động tạo danh sách option Tầng theo đúng số tầng của cơ sở đang chọn trong form
  const selectedFormHouse = useMemo(() => {
    const list = editingRoom ? staffManageableHouses : activeManageableHouses;
    return list.find((h) => h.code === roomFormData.houseCode) || list[0] || null;
  }, [editingRoom, staffManageableHouses, activeManageableHouses, roomFormData.houseCode]);

  const maxFloorsForSelectedHouse = useMemo(() => {
    return Math.max(1, Number(selectedFormHouse?.floors || selectedFormHouse?.totalFloors || 4));
  }, [selectedFormHouse]);

  const floorOptionsForForm = useMemo(() => {
    return Array.from({ length: maxFloorsForSelectedHouse }, (_, idx) => `Tầng ${idx + 1}`);
  }, [maxFloorsForSelectedHouse]);

  const [newRoomPriceInput, setNewRoomPriceInput] = useState('');
  const [roomToEditPrice, setRoomToEditPrice] = useState(null);

  // Lọc phòng thuộc quyền quản lý
  const staffRooms = useMemo(() => {
    if (user?.role === 'ADMIN') return rooms;
    return rooms.filter((r) =>
      staffHouseCodes.some((code) => isSameHouse(code, r.houseCode) || code === r.houseCode) ||
      (staffHouseCodes.some((c) => isSameHouse(c, 'CS-01')) && !r.houseCode)
    );
  }, [rooms, staffHouseCodes, user?.role]);

  const filteredRooms = useMemo(() => {
    return staffRooms.filter((r) => {
      if (selectedHouse !== 'ALL' && !isSameHouse(r.houseCode, selectedHouse) && r.houseCode !== selectedHouse) return false;
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

  // Hàm tính toán và đối soát dữ liệu cư dân thực tế chuẩn xác của phòng theo cơ sở
  const getRoomOccupancyInfo = useCallback(
    (room, buildingHouseCode) => {
      if (!room) return { count: 0, members: [], hasDrift: false };

      // 1. Nếu phòng có trạng thái Còn trống (AVAILABLE), Tạm khóa (LOCKED), Bảo trì (MAINTENANCE)
      // thì BẮT BUỘC số người ở phải là 0, không có cư dân
      if (room.status === 'AVAILABLE' || room.status === 'LOCKED' || room.status === 'MAINTENANCE') {
        return { count: 0, members: [], hasDrift: false };
      }

      const roomHouse = normalizeHouseCode(room.houseCode || buildingHouseCode || 'CS-01');
      const normNum = normalizeRoomNumber(room.number);

      // 0. Nếu phòng mang trạng thái AVAILABLE hoặc occupants === 0
      if (room.status === 'AVAILABLE' || room.occupants === 0) {
        return { count: 0, members: [], hasDrift: false };
      }

      // 1.1. Nếu phòng có đơn CHECKOUT hoặc RETURN đã APPROVED / SETTLED -> BẮT BUỘC 0 người ở
      let hasCheckout = (roomRequests || []).some(
        (r) =>
          (r.type === 'CHECKOUT' || r.type === 'RETURN') &&
          normalizeRoomNumber(r.targetRoom || r.currentRoom || r.roomNumber) === normNum &&
          (!r.houseCode || isSameHouse(r.houseCode, roomHouse)) &&
          (r.status === 'APPROVED' || r.status === 'CHECKOUT_SETTLED' || r.status === 'SETTLED' || r.settledAt)
      );

      if (!hasCheckout) {
        try {
          const sSt = localStorage.getItem('rental_move_out_settlements');
          if (sSt) {
            const sts = JSON.parse(sSt);
            hasCheckout = Array.isArray(sts) && sts.some(s =>
              normalizeRoomNumber(s.roomNumber) === normNum && (s.settledAt || s.refundStatus === 'COMPLETED' || s.status === 'SETTLED')
            );
          }
        } catch {}
      }

      // 1.2. Kiểm tra hợp đồng: Nếu phòng có hợp đồng đã kết thúc và KHÔNG CÒN hợp đồng ACTIVE
      const roomContracts = (contracts || []).filter(c =>
        normalizeRoomNumber(c.roomNumber) === normNum &&
        (!c.houseCode || isSameHouse(c.houseCode, roomHouse))
      );
      const hasActiveContract = roomContracts.some(c => c.status === 'ACTIVE');

      // Nếu phòng đã có đơn checkout/nghiệm thu HOẶC không còn hợp đồng active nào -> BẮT BUỘC 0 người ở (loại bỏ hoàn toàn người ảo)
      if (hasCheckout || (roomContracts.length > 0 && !hasActiveContract)) {
        return { count: 0, members: [], hasDrift: false };
      }

      // 2. Lấy danh sách thành viên hợp lệ từ roomMembers khớp cả số phòng VÀ cơ sở
      let storedTenantRoomsMap = null;
      try {
        const sTR = localStorage.getItem('rental_tenant_rooms');
        if (sTR) storedTenantRoomsMap = JSON.parse(sTR);
      } catch {}

      const activeMembers = (roomMembers || []).filter((m) => {
        if (m.status === 'MOVED_OUT' || m.status === 'INACTIVE') return false;
        const memHouse = normalizeHouseCode(m.houseCode || 'CS-01');
        const memRoom = normalizeRoomNumber(m.roomNumber);
        if (memRoom !== normNum || !isSameHouse(memHouse, roomHouse)) return false;

        // Nếu rental_tenant_rooms ghi nhận rõ khách này không còn ở phòng này -> loại bỏ
        if (storedTenantRoomsMap) {
          const mName = (m.fullName || '').toLowerCase().trim();
          let relevantKeys = [mName];
          if (mName.includes('an')) relevantKeys.push('tenant1', 'nguyễn văn an', 'tenant');
          if (mName.includes('cường')) relevantKeys.push('tenant2', 'phạm minh cường');
          if (mName.includes('nam')) relevantKeys.push('tenant_new', 'hoàng văn nam');

          for (const key of Object.keys(storedTenantRoomsMap)) {
            const kNorm = key.toLowerCase().trim();
            if (relevantKeys.some(rk => rk === kNorm || rk.includes(kNorm) || kNorm.includes(rk))) {
              const roomsArr = storedTenantRoomsMap[key];
              if (Array.isArray(roomsArr) && !roomsArr.some(rn => normalizeRoomNumber(rn) === normNum)) {
                return false;
              }
            }
          }
        }
        return true;
      });

      if (activeMembers.length > 0 && (hasActiveContract || roomContracts.length === 0)) {
        return { count: activeMembers.length, members: activeMembers, hasDrift: false };
      }

      // 3. Fallback: Nếu roomMembers chưa có, kiểm tra hợp đồng ACTIVE khớp cả số phòng & cơ sở
      const activeContracts = roomContracts.filter(c => c.status === 'ACTIVE');

      if (activeContracts.length > 0) {
        const contractMems = activeContracts.map((c, idx) => ({
          id: `contract-mem-${c.id || idx}`,
          fullName: c.tenantName || 'Khách thuê hợp đồng',
          phone: c.tenantPhone || 'Chưa có SĐT',
          cccd: c.tenantCccd || 'Chưa cung cấp',
          role: 'HOST',
          roleInRoom: 'REPRESENTATIVE',
          temporaryResidenceStatus: 'REGISTERED',
          contractCode: c.contractCode,
          startDate: c.startDate
        }));
        return { count: contractMems.length, members: contractMems, hasDrift: false };
      }

      // 4. Fallback: Kiểm tra danh sách khách thuê tenants
      const activeTenants = (tenants || []).filter((t) => {
        if (t.status !== 'ACTIVE') return false;
        const tHouse = normalizeHouseCode(t.houseCode || 'CS-01');
        const inRooms = Array.isArray(t.rooms) ? t.rooms.map(normalizeRoomNumber) : [normalizeRoomNumber(t.room)];
        return inRooms.includes(normNum) && isSameHouse(tHouse, roomHouse);
      });

      if (activeTenants.length > 0 && hasActiveContract) {
        const tenantMems = activeTenants.map((t) => ({
          id: `tenant-mem-${t.id}`,
          fullName: t.fullName,
          phone: t.phone || 'Chưa có SĐT',
          cccd: t.cccd || 'Chưa cung cấp',
          role: 'HOST',
          roleInRoom: 'REPRESENTATIVE',
          temporaryResidenceStatus: 'REGISTERED'
        }));
        return { count: tenantMems.length, members: tenantMems, hasDrift: false };
      }

      // 5. Nếu phòng mang trạng thái OCCUPIED (Đang thuê) nhưng tuyệt đối không có khách nào
      // -> Đây là hiện tượng lỗi lệch đồng bộ dữ liệu (phantom occupied)
      return { count: 0, members: [], hasDrift: room.status === 'OCCUPIED' };
    },
    [roomMembers, contracts, tenants, roomRequests]
  );

  // Tự động dọn dẹp các phòng ma (drifted phantom occupied) để đảm bảo không có người ảo
  useEffect(() => {
    let hasDriftFixed = false;
    const healed = rooms.map((r) => {
      if (r.status === 'OCCUPIED') {
        const occ = getRoomOccupancyInfo(r, r.houseCode);
        if (occ.count === 0) {
          hasDriftFixed = true;
          return { ...r, status: 'AVAILABLE', occupants: 0 };
        }
      }
      return r;
    });
    if (hasDriftFixed) {
      try {
        localStorage.setItem('rental_rooms', JSON.stringify(healed));
      } catch {}
      try {
        const sM = localStorage.getItem('rental_room_members');
        if (sM) {
          const pM = JSON.parse(sM);
          if (Array.isArray(pM)) {
            let memsChanged = false;
            const updatedMems = pM.map((m) => {
              const normM = normalizeRoomNumber(m.roomNumber);
              const isRoomEmpty = healed.some((hr) => normalizeRoomNumber(hr.number) === normM && hr.status === 'AVAILABLE' && hr.occupants === 0);
              if (isRoomEmpty && m.status !== 'MOVED_OUT') {
                memsChanged = true;
                return { ...m, status: 'MOVED_OUT' };
              }
              return m;
            });
            if (memsChanged) {
              localStorage.setItem('rental_room_members', JSON.stringify(updatedMems));
            }
          }
        }
      } catch {}
      if (updateRoom) {
        healed.forEach((hr) => {
          if (hr.status === 'AVAILABLE' && hr.occupants === 0) {
            updateRoom(hr.id, { status: 'AVAILABLE', occupants: 0 });
          }
        });
      }
    }
  }, [rooms, getRoomOccupancyInfo, updateRoom]);

  // Nhóm theo tầng (dùng khi xem 1 cơ sở)
  const groupedByFloor = useMemo(() => {
    const map = new Map();
    filteredRooms.forEach((r) => {
      const fl = r.floor || 'Tầng 1';
      if (!map.has(fl)) map.set(fl, []);
      map.get(fl).push(r);
    });
    return Array.from(map.entries()).sort((a, b) => parseFloorNum(a[0]) - parseFloorNum(b[0]));
  }, [filteredRooms]);

  // State thu gọn / mở rộng từng khối cơ sở
  const [collapsedHouses, setCollapsedHouses] = useState({});
  const toggleCollapseHouse = (code) => {
    setCollapsedHouses((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  // Hàm lấy màu nhận diện riêng cho từng cơ sở (Phương án 2)
  const getHouseTheme = useCallback(
    (houseCode) => {
      const norm = normalizeHouseCode(houseCode);
      const idx = staffManageableHouses.findIndex((h) => normalizeHouseCode(h.code) === norm);
      if (idx >= 0) return HOUSE_COLOR_THEMES[idx % HOUSE_COLOR_THEMES.length];
      if (norm.includes('02')) return HOUSE_COLOR_THEMES[1];
      if (norm.includes('03')) return HOUSE_COLOR_THEMES[2];
      return HOUSE_COLOR_THEMES[0];
    },
    [staffManageableHouses]
  );

  // Phân khối theo từng Cơ sở / Tòa nhà trước, bên trong mỗi tòa mới chia theo Tầng (Phương án 1)
  const groupedByBuildingAndFloor = useMemo(() => {
    const houseMap = new Map();

    // Khởi tạo theo thứ tự cơ sở của chủ trọ
    const targetHouses =
      selectedHouse === 'ALL'
        ? staffManageableHouses
        : staffManageableHouses.filter((h) => isSameHouse(h.code, selectedHouse) || h.code === selectedHouse);

    targetHouses.forEach((h) => {
      houseMap.set(h.code, {
        houseCode: h.code,
        houseName: h.name,
        floorsCount: h.floors || h.totalFloors || 4,
        address: h.address || '',
        rooms: []
      });
    });

    filteredRooms.forEach((r) => {
      const code = r.houseCode || 'CS-01';
      let foundEntry = null;
      for (const [hCode, grp] of houseMap.entries()) {
        if (isSameHouse(hCode, code) || hCode === code) {
          foundEntry = grp;
          break;
        }
      }
      if (foundEntry) {
        foundEntry.rooms.push(r);
      } else {
        const matchedHouse = staffManageableHouses.find((h) => isSameHouse(h.code, code));
        const resolvedCode = matchedHouse ? matchedHouse.code : code;
        if (!houseMap.has(resolvedCode)) {
          houseMap.set(resolvedCode, {
            houseCode: resolvedCode,
            houseName: matchedHouse?.name || r.house || `Cơ sở ${resolvedCode}`,
            floorsCount: matchedHouse?.floors || 4,
            address: matchedHouse?.address || '',
            rooms: []
          });
        }
        houseMap.get(resolvedCode).rooms.push(r);
      }
    });

    const result = [];
    houseMap.forEach((group) => {
      if (group.rooms.length === 0 && (searchTerm || filterStatus !== 'ALL')) return;
      const floorMap = new Map();
      group.rooms.forEach((r) => {
        const fl = r.floor || 'Tầng 1';
        if (!floorMap.has(fl)) floorMap.set(fl, []);
        floorMap.get(fl).push(r);
      });
      const sortedFloors = Array.from(floorMap.entries()).sort(
        (a, b) => parseFloorNum(a[0]) - parseFloorNum(b[0])
      );
      const isRoomReallyOccupied = (r) => {
        if (r.status !== 'OCCUPIED') return false;
        const occ = getRoomOccupancyInfo(r, group.houseCode);
        return occ.count > 0;
      };
      const availableCount = group.rooms.filter((r) => r.status === 'AVAILABLE' || (r.status === 'OCCUPIED' && !isRoomReallyOccupied(r))).length;
      const occupiedCount = group.rooms.filter(isRoomReallyOccupied).length;
      const holdingCount = group.rooms.filter((r) => r.status === 'HOLDING').length;

      result.push({
        ...group,
        floors: sortedFloors,
        availableCount,
        occupiedCount,
        holdingCount,
        theme: getHouseTheme(group.houseCode)
      });
    });

    return result;
  }, [filteredRooms, staffManageableHouses, selectedHouse, searchTerm, filterStatus, getHouseTheme]);

  // Dedup danh sách đơn yêu cầu (tránh hiển thị trùng lặp đơn trả phòng & chỉ hiển thị đơn thuộc cơ sở của Staff)
  const dedupedRoomRequests = useMemo(() => {
    const list = roomRequests || [];
    const seen = new Set();
    return list.filter((r) => {
      if (user?.role !== 'ADMIN' && staffHouseCodes.length > 0) {
        const isMyHouse = staffHouseCodes.some((code) => isSameHouse(code, r.houseCode) || code === r.houseCode);
        if (!isMyHouse) return false;
      }
      const key = [
        r.type,
        String(r.targetRoom || r.roomNumber || r.currentRoom || '').replace(/^P\.?/i, '').trim().toLowerCase(),
        (r.tenant || r.tenantName || r.sender || '').toLowerCase().trim(),
        r.status
      ].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [roomRequests, staffHouseCodes, user?.role]);

  const sortedDedupedRequests = useMemo(() => {
    return [...dedupedRoomRequests].sort((a, b) => {
      if (highlightedRequestId) {
        if (Number(a.id) === Number(highlightedRequestId)) return -1;
        if (Number(b.id) === Number(highlightedRequestId)) return 1;
      }
      const isActionableA = a.status === 'ROOMMATES_APPROVED' || a.status === 'PENDING';
      const isActionableB = b.status === 'ROOMMATES_APPROVED' || b.status === 'PENDING';
      if (isActionableA && !isActionableB) return -1;
      if (!isActionableA && isActionableB) return 1;
      return (b.id || 0) - (a.id || 0);
    });
  }, [dedupedRoomRequests, highlightedRequestId]);

  const pendingRequestsCount = useMemo(() => {
    return dedupedRoomRequests.filter((req) => {
      const isPendingStatus = req.status === 'PENDING' || req.status === 'ROOMMATES_APPROVED';
      if (!isPendingStatus) return false;
      if (user?.role === 'ADMIN') return true;
      return staffHouseCodes.some((code) => isSameHouse(code, req.houseCode));
    }).length;
  }, [dedupedRoomRequests, staffHouseCodes, user?.role]);

  // State & Handler cho Sửa Giá Phòng Trống
  const [priceErrorMsg, setPriceErrorMsg] = useState('');

  const handleSaveRoomPrice = (e) => {
    e.preventDefault();
    if (!roomToEditPrice) {
      setPriceErrorMsg('Vui lòng chọn một phòng còn trống!');
      return;
    }
    const res = updateRoomPrice(roomToEditPrice.id, newRoomPriceInput);
    if (!res?.success) {
      setPriceErrorMsg(res?.message || 'Có lỗi khi cập nhật giá phòng!');
      return;
    }
    setShowPriceEditModal(false);
    setActionToast(res.message);
    setTimeout(() => setActionToast(null), 4000);
  };

  const handleOpenAddModal = () => {
    // 1. Nếu chưa có cơ sở nào
    if (staffManageableHouses.length === 0) {
      alert('Bạn chưa có cơ sở/tòa nhà nào! Vui lòng khởi tạo cơ sở nhà trọ trước.');
      navigate('/houses');
      return;
    }
    // 2. Kiểm tra hạn mức gói cước SaaS
    if (staffRooms.length >= maxRoomsAllowed) {
      setQuotaExceededModal(true);
      return;
    }

    const u = (user?.username || '').toLowerCase();
    const isStaff2 = u === 'staff2';
    const availableList = activeManageableHouses.length > 0 ? activeManageableHouses : staffManageableHouses;
    const defaultHouseCode =
      selectedHouse && selectedHouse !== 'ALL' && availableList.some((h) => isSameHouse(h.code, selectedHouse) || h.code === selectedHouse)
        ? selectedHouse
        : (availableList[0]?.code || (isStaff2 ? 'CS-02' : 'CS-01'));

    setRoomFormError('');
    setRoomFormData({
      number: '101',
      houseCode: defaultHouseCode,
      floor: 'Tầng 1',
      price: isStaff2 ? 2800000 : 3500000,
      area: isStaff2 ? 20 : 25,
      maxOccupants: isStaff2 ? 2 : 3,
      status: 'AVAILABLE',
      amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'],
      image: '/assets/images/room_studio_1.jpg'
    });
    setShowAddModal(true);
  };

  const handleSaveRoom = (e) => {
    e.preventDefault();
    setRoomFormError('');

    const rawNumber = String(roomFormData.number || '').trim();
    if (!rawNumber) {
      setRoomFormError('Vui lòng nhập số/mã phòng!');
      return;
    }

    // Kiểm tra cơ sở tồn tại và hợp lệ
    const selectableHouses = editingRoom ? staffManageableHouses : (activeManageableHouses.length > 0 ? activeManageableHouses : staffManageableHouses);
    const targetHouse = selectableHouses.find((h) => isSameHouse(h.code, roomFormData.houseCode) || h.code === roomFormData.houseCode);
    if (!targetHouse) {
      setRoomFormError(
        staffManageableHouses.length === 0
          ? 'Bạn chưa tạo cơ sở/tòa nhà nào! Vui lòng khởi tạo cơ sở trước khi tạo phòng.'
          : 'Vui lòng chọn một cơ sở/tòa nhà hợp lệ!'
      );
      return;
    }

    // Kiểm tra số tầng hợp lệ theo quy mô của cơ sở
    const floorNum = parseFloorNum(roomFormData.floor) || 1;
    const maxFloors = Number(targetHouse.floors || targetHouse.totalFloors || 30);
    if (!floorNum || floorNum < 1 || floorNum > maxFloors) {
      setRoomFormError(
        `Tầng không hợp lệ! Cơ sở "${targetHouse.name}" có quy mô từ Tầng 1 đến Tầng ${maxFloors}.`
      );
      return;
    }

    // Lấy số phòng chuẩn hóa
    const onlyDigits = rawNumber.replace(/^P\.?/i, '').trim();
    if (!onlyDigits) {
      setRoomFormError('Vui lòng nhập số phòng hợp lệ (ví dụ: 101, 102)!');
      return;
    }

    const formattedRoomNumber = `P.${onlyDigits}`;

    // Kiểm tra trùng mã phòng trong cùng cơ sở (cho cả Thêm mới và Chỉnh sửa)
    if (isDuplicateRoom(rooms, formattedRoomNumber, targetHouse.code, editingRoom ? editingRoom.id : null)) {
      setRoomFormError(`Số phòng "${formattedRoomNumber}" đã tồn tại trong cơ sở "${targetHouse.name}"!`);
      return;
    }

    // Kiểm tra diện tích, sức chứa, giá thuê > 0
    const areaVal = Number(roomFormData.area);
    if (!Number.isFinite(areaVal) || areaVal <= 0 || areaVal > 500) {
      setRoomFormError('Diện tích phòng phải lớn hơn 0 m² và tối đa 500 m²!');
      return;
    }

    const maxOccVal = Number(roomFormData.maxOccupants);
    if (!Number.isFinite(maxOccVal) || maxOccVal < 1 || maxOccVal > 20) {
      setRoomFormError('Sức chứa tối đa phải từ 1 đến 20 người!');
      return;
    }

    const priceVal = Number(roomFormData.price);
    if (!Number.isFinite(priceVal) || priceVal <= 0) {
      setRoomFormError('Giá thuê phòng phải lớn hơn 0 VNĐ/tháng!');
      return;
    }

    const normalizedPayload = {
      ...roomFormData,
      number: formattedRoomNumber,
      houseCode: targetHouse.code,
      house: targetHouse.name,
      floor: `Tầng ${floorNum}`,
      area: areaVal,
      maxOccupants: maxOccVal,
      price: priceVal
    };

    if (editingRoom) {
      if (updateRoom) {
        updateRoom(editingRoom.id, normalizedPayload);
      }
      setEditingRoom(null);
      setActionToast(`Đã cập nhật thông tin phòng ${formattedRoomNumber} thành công!`);
    } else {
      const newRoomObj = {
        ...normalizedPayload,
        id: `room-${Date.now()}`,
        occupants: 0
      };
      if (addRoom) {
        const res = addRoom(newRoomObj);
        if (res && res.success === false) {
          setRoomFormError(res.message);
          return;
        }
      }
      setShowAddModal(false);
      setActionToast(`Đã thêm mới phòng ${formattedRoomNumber} vào cơ sở ${targetHouse.name}!`);
    }
    setTimeout(() => setActionToast(null), 3500);
  };

  const handleDeleteRoom = (room) => {
    const roomId = room?.id;
    const roomNumber = room?.number;
    const hasActiveMembers = (roomMembers || []).some(
      (m) =>
        m.roomNumber === roomNumber &&
        m.status !== 'MOVED_OUT' &&
        (!m.houseCode || !room?.houseCode || m.houseCode === room.houseCode)
    );
    if (room?.status === 'OCCUPIED' || room?.status === 'HOLDING' || hasActiveMembers) {
      alert(
        `Không thể xóa phòng ${roomNumber} vì phòng đang có người ở hoặc đang giữ chỗ cọc! Vui lòng thực hiện Quyết toán trả phòng trước.`
      );
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa phòng ${roomNumber} không?`)) {
      if (deleteRoom) deleteRoom(roomId);
      setActionToast(`Đã xóa phòng ${roomNumber} thành công!`);
      setTimeout(() => setActionToast(null), 3000);
    }
  };

  const handleToggleRoomLock = (room) => {
    const hasActiveMembers = (roomMembers || []).some(
      (m) =>
        m.roomNumber === room.number &&
        m.status !== 'MOVED_OUT' &&
        (!m.houseCode || !room.houseCode || m.houseCode === room.houseCode)
    );
    if (room.status === 'OCCUPIED' || room.status === 'HOLDING' || (room.status !== 'LOCKED' && hasActiveMembers)) {
      alert(
        `Không thể tạm khóa phòng ${room.number} khi phòng đang có cư dân lưu trú hoặc đang giữ cọc!`
      );
      return;
    }
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
            onClick={() => {
              setRoomToEditPrice(null);
              setNewRoomPriceInput('');
              setPriceErrorMsg('');
              setShowPriceEditModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-purple-300 hover:text-purple-700 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all btn-press cursor-pointer"
            title="Quy định: Chỉ được sửa giá các phòng còn trống"
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-600" />
            <span>Sửa Giá Phòng Trống</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/25 transition-all btn-press cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Phòng Mới</span>
            {activeManageableHouses.length === 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 shadow-2xs">
                Cần tạo Cơ sở trước
              </span>
            )}
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

      {/* House selector tabs (Phương án 2: Có chấm màu nhận diện riêng cho từng tòa nhà) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 text-xs font-bold">
        <button
          onClick={() => setSelectedHouse('ALL')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            selectedHouse === 'ALL'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <span>🏢 Toàn Bộ Cơ Sở ({staffRooms.length})</span>
        </button>

        {staffManageableHouses.map((h) => {
          const theme = getHouseTheme(h.code);
          const count = rooms.filter((r) => isSameHouse(r.houseCode, h.code) || r.houseCode === h.code).length;
          const isSelected = selectedHouse === h.code || isSameHouse(selectedHouse, h.code);
          return (
            <button
              key={h.code}
              onClick={() => setSelectedHouse(h.code)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                isSelected ? theme.tabActive : 'bg-white/70 text-slate-700 hover:bg-white border border-slate-200/60'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-white' : theme.dot}`}></span>
              <span>
                [{h.code}] {h.name} ({count})
              </span>
            </button>
          );
        })}
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
            placeholder="Tìm theo số phòng, tên tòa nhà..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-purple-500 font-medium"
          />
        </div>
      </div>

      {/* Sơ Đồ Phòng: Phân khối theo từng Tòa nhà (Phương án 1) + Màu nhận diện riêng trên từng Thẻ phòng (Phương án 2) */}
      <div className="space-y-8">
        {groupedByBuildingAndFloor.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-400 text-sm">
            Chưa có phòng nào phù hợp với bộ lọc trong cơ sở này.
          </div>
        ) : (
          groupedByBuildingAndFloor.map((building) => {
            const { theme } = building;
            const isCollapsed = !!collapsedHouses[building.houseCode];

            return (
              <div
                key={building.houseCode}
                className={`rounded-3xl border-2 ${theme.sectionBorder} bg-white shadow-xs overflow-hidden transition-all`}
              >
                {/* Header Banner của Tòa nhà / Cơ sở */}
                <div className={`${theme.headerBg} px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-xs border border-white/30 shrink-0">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg bg-white text-slate-900 font-mono font-black text-xs shadow-2xs">
                          {building.houseCode}
                        </span>
                        <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                          {building.houseName}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-black/25 text-white/95 text-[11px] font-bold">
                          Quy mô {building.floorsCount} tầng
                        </span>
                      </div>
                      {building.address && (
                        <p className="text-xs text-white/80 font-medium mt-0.5">{building.address}</p>
                      )}
                    </div>
                  </div>

                  {/* Thống kê nhanh của Tòa nhà + Nút Thu gọn */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-xl bg-white/15 backdrop-blur-xs text-white text-xs font-bold border border-white/20">
                      Tổng: <strong>{building.rooms.length}</strong> phòng
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/30 text-white text-xs font-bold border border-emerald-300/40">
                      🟢 Trống: <strong>{building.availableCount}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-white/15 text-white text-xs font-bold border border-white/20">
                      🟣 Đang thuê: <strong>{building.occupiedCount}</strong>
                    </span>
                    {building.holdingCount > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/30 text-white text-xs font-bold border border-amber-300/40">
                        🔒 Giữ chỗ: <strong>{building.holdingCount}</strong>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleCollapseHouse(building.houseCode)}
                      className="ml-1 px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition cursor-pointer"
                    >
                      {isCollapsed ? 'Mở rộng ▼' : 'Thu gọn ▲'}
                    </button>
                  </div>
                </div>

                {/* Danh sách Tầng & Phòng bên trong Tòa nhà */}
                {!isCollapsed && (
                  <div className={`p-5 space-y-6 ${theme.softBg}`}>
                    {building.floors.length === 0 ? (
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center text-slate-400 text-xs font-medium">
                        Cơ sở {building.houseName} hiện chưa có phòng nào được tạo.
                      </div>
                    ) : (
                      building.floors.map(([floorName, floorRooms]) => (
                        <div key={`${building.houseCode}-${floorName}`} className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                              <span className={`w-2.5 h-2.5 rounded-full ${theme.dot}`}></span>
                              <span>
                                {floorName} — {building.houseName} ({floorRooms.length} Phòng)
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${theme.badgeBg}`}>
                              🏢 {building.houseCode}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {floorRooms.map((room) => {
                              const occInfo = getRoomOccupancyInfo(room, building.houseCode);
                              const isEffectivelyOccupied = Boolean(room.status === 'OCCUPIED' && occInfo.count > 0 && !occInfo.hasDrift);
                              const occupantsCount = isEffectivelyOccupied ? occInfo.count : 0;

                              return (
                                <div
                                  key={room.id}
                                  className={`bento-card p-4 bg-white border border-slate-200/90 ${theme.cardTopBorder} rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all`}
                                >
                                  <div>
                                    {/* Dải nhãn nhận diện Tòa nhà trên đỉnh mỗi Thẻ phòng (Phương án 2) */}
                                    <div className="flex items-center justify-between gap-1.5 mb-2.5 pb-2 border-b border-slate-100">
                                      <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${theme.badgeBg} truncate`}
                                        title={building.houseName}
                                      >
                                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">
                                          [{room.houseCode || building.houseCode}] {building.houseName}
                                        </span>
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-500 shrink-0">
                                        {room.floor || floorName}
                                      </span>
                                    </div>

                                    {/* Ảnh phòng & badge trạng thái */}
                                    <div className="relative h-32 mb-3 overflow-hidden rounded-xl bg-slate-100">
                                      <img
                                        src={room.image || getRoomImage(room)}
                                        alt={`Phòng ${room.number}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute top-2 right-2">
                                        <span
                                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white backdrop-blur-md shadow-xs ${
                                            isEffectivelyOccupied
                                              ? 'bg-purple-600/90'
                                              : (room.status === 'AVAILABLE' || !isEffectivelyOccupied)
                                              ? 'bg-emerald-600/90'
                                              : room.status === 'HOLDING'
                                              ? 'bg-amber-600/90'
                                              : 'bg-slate-700/90'
                                          }`}
                                        >
                                          {isEffectivelyOccupied
                                            ? '🟣 Đang thuê'
                                            : (room.status === 'AVAILABLE' || !isEffectivelyOccupied)
                                            ? '🟢 Còn trống'
                                            : room.status === 'HOLDING'
                                            ? '🔒 Giữ chỗ'
                                            : 'Bảo trì / Khóa'}
                                        </span>
                                      </div>

                                      <div className="absolute bottom-2 left-2.5 text-white text-[10px] font-bold bg-black/55 px-2 py-0.5 rounded backdrop-blur-xs">
                                        Diện tích: {room.area} m²
                                      </div>
                                    </div>

                                    <div className="flex items-start justify-between">
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <h3 className="text-lg font-black text-slate-900">{room.number}</h3>
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${theme.ribbonBg}`}>
                                            {room.houseCode || building.houseCode}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-semibold truncate max-w-[160px]">
                                          {building.houseName}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <div className={`text-sm font-black ${theme.priceText}`}>
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
                                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedRoomForMembers({
                                        ...room,
                                        houseCode: room.houseCode || building.houseCode,
                                        houseName: building.houseName
                                      })}
                                      className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                                      title="Hồ sơ người ở"
                                    >
                                      <Users className="w-3.5 h-3.5" />
                                      <span>Hồ sơ</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRoomFormError('');
                                        setEditingRoom(room);
                                        setRoomFormData({
                                          ...room,
                                          number: String(room.number || '').replace(/^P\.?/i, '')
                                        });
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
                                      {room.status === 'LOCKED' ? (
                                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRoom(room)}
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
                )}
              </div>
            );
          })
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
              {roomFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{roomFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cơ sở *</label>
                  <select
                    required
                    value={roomFormData.houseCode}
                    onChange={(e) => {
                      const nextHouseCode = e.target.value;
                      const list = editingRoom ? staffManageableHouses : activeManageableHouses;
                      const nextHouseObj = list.find((h) => h.code === nextHouseCode);
                      const nextMaxFloors = Math.max(
                        1,
                        Number(nextHouseObj?.floors || nextHouseObj?.totalFloors || 4)
                      );
                      const prevFloorNum = parseFloorNum(roomFormData.floor) || 1;
                      const nextFloorNum = Math.min(nextMaxFloors, Math.max(1, prevFloorNum));
                      const prevDigits = String(roomFormData.number || '').replace(/\D/g, '');
                      const prevPrefix = String(prevFloorNum);
                      const suffix = prevDigits.startsWith(prevPrefix)
                        ? prevDigits.slice(prevPrefix.length).slice(0, 2)
                        : prevDigits.slice(-2);

                      setRoomFormData({
                        ...roomFormData,
                        houseCode: nextHouseCode,
                        floor: `Tầng ${nextFloorNum}`,
                        number: `${nextFloorNum}${suffix}`
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="" disabled>
                      -- Chọn cơ sở --
                    </option>
                    {(editingRoom ? staffManageableHouses : activeManageableHouses).map((h) => (
                      <option key={h.code} value={h.code}>
                        {h.name} ({h.floors || 4} tầng)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Chọn tầng (1–{maxFloorsForSelectedHouse}) *
                  </label>
                  <select
                    required
                    value={
                      floorOptionsForForm.includes(roomFormData.floor)
                        ? roomFormData.floor
                        : `Tầng ${Math.min(maxFloorsForSelectedHouse, Math.max(1, parseFloorNum(roomFormData.floor) || 1))}`
                    }
                    onChange={(e) => {
                      const nextFloorLabel = e.target.value;
                      const nextFloorNum = parseFloorNum(nextFloorLabel) || 1;
                      const prevFloorNum = parseFloorNum(roomFormData.floor) || 1;
                      const prevDigits = String(roomFormData.number || '').replace(/\D/g, '');
                      const prevPrefix = String(prevFloorNum);
                      const suffix = prevDigits.startsWith(prevPrefix)
                        ? prevDigits.slice(prevPrefix.length).slice(0, 2)
                        : prevDigits.slice(0, 2);

                      setRoomFormData({
                        ...roomFormData,
                        floor: nextFloorLabel,
                        number: `${nextFloorNum}${suffix}`
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 cursor-pointer"
                  >
                    {floorOptionsForForm.map((fl) => (
                      <option key={fl} value={fl}>
                        {fl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số phòng ({parseFloorNum(roomFormData.floor) || 1}xx) *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 font-bold select-none">P.</span>
                    <input
                      type="text"
                      required
                      placeholder={`${parseFloorNum(roomFormData.floor) || 1}01`}
                      value={String(roomFormData.number || '').replace(/^P\.?/i, '')}
                      onChange={(e) => {
                        const curFloorStr = String(parseFloorNum(roomFormData.floor) || 1);
                        const rawDigits = String(e.target.value || '').replace(/\D/g, '');
                        let suffix = '';
                        if (rawDigits.startsWith(curFloorStr)) {
                          suffix = rawDigits.slice(curFloorStr.length).slice(0, 2);
                        } else {
                          suffix = rawDigits.slice(0, 2);
                        }
                        setRoomFormData({
                          ...roomFormData,
                          number: `${curFloorStr}${suffix}`
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 font-mono font-bold text-purple-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diện tích (m²) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={500}
                    value={roomFormData.area}
                    onChange={(e) => setRoomFormData({ ...roomFormData, area: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sức chứa *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={20}
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
                  min={100000}
                  step={50000}
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
        <Modal
          isOpen={showRequestsManager}
          onClose={() => {
            setShowRequestsManager(false);
            setHighlightedRequestId(null);
            if (searchParams.get('action') || searchParams.get('requestId')) {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete('action');
              newParams.delete('requestId');
              setSearchParams(newParams, { replace: true });
            }
          }}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Xét Duyệt Đơn Từ Cư Dân ({pendingRequestsCount} Đơn Chờ)</h3>
              <button
                onClick={() => {
                  setShowRequestsManager(false);
                  setHighlightedRequestId(null);
                  if (searchParams.get('action') || searchParams.get('requestId')) {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('action');
                    newParams.delete('requestId');
                    setSearchParams(newParams, { replace: true });
                  }
                }}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sortedDedupedRequests.length === 0 ? (
                <p className="text-center py-6 text-slate-400">Không có đơn nào cần xử lý</p>
              ) : (
                sortedDedupedRequests.map((req) => {
                  const isHighlighted = highlightedRequestId && Number(req.id) === Number(highlightedRequestId);
                  return (
                    <div
                      key={req.id}
                      className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                        isHighlighted
                          ? 'bg-purple-50/90 border-purple-500 shadow-md ring-2 ring-purple-400'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">
                            {['RENTAL', 'RENT', 'NEW_RENT'].includes(req.type) ? 'Đơn Thuê / Giữ Trọ Đặt Cọc' : req.type === 'ROOMMATE' ? 'Tìm Ở Ghép' : req.type === 'TRANSFER' ? 'Chuyển Phòng' : 'Báo Trả Phòng'}
                          </span>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-600 text-white animate-pulse">
                              ✨ Đơn Vừa Chọn
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          req.status === 'ROOMMATES_APPROVED' ? 'bg-purple-100 text-purple-800' :
                          req.status === 'REJECTED_BY_ROOMMATES' || req.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                          (req.status === 'CANCELLED' || req.status === 'CANCELLED_BY_TENANT' || req.status === 'CANCELLED_BY_CANDIDATE') ? 'bg-slate-100 text-slate-700' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status === 'APPROVED' ? 'Đã duyệt' :
                           req.status === 'ROOMMATES_APPROVED' ? 'Phòng đã duyệt 100%' :
                           req.status === 'REJECTED_BY_ROOMMATES' ? 'Phòng đã từ chối' :
                           req.status === 'REJECTED' ? 'Đã từ chối' :
                           req.status === 'CANCELLED_BY_CANDIDATE' ? 'Khách đã rút đơn' :
                           (req.status === 'CANCELLED_BY_TENANT' || req.status === 'CANCELLED') ? 'Khách đã hủy đơn' :
                           req.status === 'WAITING_ROOMMATES' ? 'Chờ phòng biểu quyết' : 'Chờ duyệt'}
                        </span>
                      </div>

                      <div className="text-slate-600 space-y-0.5">
                        <div>Khách: <strong>{req.tenantName || req.tenant || req.sender}</strong> ({req.phone || 'Chưa có SĐT'})</div>
                      <div>Phòng: <strong>{req.roomNumber || req.targetRoom}</strong> • Cơ sở: {req.houseCode}</div>
                      {req.note && <div className="text-slate-500 italic">"{req.note}"</div>}
                    </div>

                    {/* Trạng thái đơn đang chờ biểu quyết (ROOMMATE hoặc CHECKOUT) */}
                    {req.status === 'WAITING_ROOMMATES' && (
                      <div className="pt-2 border-t border-slate-200 text-[11px] text-amber-800 font-semibold flex items-center justify-between">
                        <span>
                          ⏳ Đang chờ cư dân phòng {req.targetRoom || req.roomNumber} biểu quyết ({req.roommateVotes?.filter(v => v.approved)?.length || 0} phiếu đồng ý)...
                        </span>
                        <span className="text-[10px] text-slate-500 italic">Cần 100% phòng đồng thuận</span>
                      </div>
                    )}

                    {/* Trạng thái đơn bị cư dân trong phòng từ chối */}
                    {req.status === 'REJECTED_BY_ROOMMATES' && (
                      <div className="pt-2 border-t border-slate-200 text-[11px] text-rose-700 font-semibold flex items-center justify-between">
                        <span>
                          ❌ {req.type === 'CHECKOUT'
                            ? `Cư dân bác bỏ: "${req.rejectedBy || 'Thành viên trong phòng'}" muốn ở tiếp, không đồng ý trả cả phòng.`
                            : 'Có thành viên trong phòng từ chối yêu cầu ở ghép này.'}
                        </span>
                      </div>
                    )}

                    {/* Trạng thái đơn khách tự hủy / rút lại */}
                    {(req.status === 'CANCELLED' || req.status === 'CANCELLED_BY_TENANT' || req.status === 'CANCELLED_BY_CANDIDATE') && (
                      <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 font-semibold flex items-center justify-between">
                        <span>
                          ↩️ {req.cancelReason || 'Khách đã chủ động rút lại yêu cầu này.'}
                        </span>
                        {req.cancelledAt && <span className="text-[10px] text-slate-400 font-normal">Hủy ngày: {req.cancelledAt}</span>}
                      </div>
                    )}

                    {/* Có thể phê duyệt: với đơn ROOMMATE/JOIN_ROOM BẮT BUỘC phải là ROOMMATES_APPROVED (đã đạt 100% cư dân duyệt), không cho duyệt khi đang WAITING_ROOMMATES hoặc PENDING */}
                    {((req.type === 'ROOMMATE' || req.type === 'JOIN_ROOM') ? req.status === 'ROOMMATES_APPROVED' : (req.status === 'PENDING' || req.status === 'ROOMMATES_APPROVED')) && (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 flex-wrap">
                        {req.status === 'ROOMMATES_APPROVED' && (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <span>✅</span> 100% cư dân phòng đã đồng ý!
                          </span>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
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
                              const msg = req.type === 'CHECKOUT'
                                ? `🎉 Đã nghiệm thu & thanh lý phòng ${req.targetRoom || req.roomNumber}! Phòng đã trống và mở lại cho khách mới đặt cọc.`
                                : req.type === 'ROOMMATE'
                                ? '🎉 Đã phê duyệt nhận bạn vào ở ghép!'
                                : '🎉 Đã phê duyệt đơn!';
                              setActionToast(msg);
                              setTimeout(() => setActionToast(null), 4000);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1"
                          >
                            <span>{req.type === 'CHECKOUT' ? 'Nghiệm Thu & Thanh Lý' : 'Phê duyệt'}</span>
                          </button>
                        </div>
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

      {/* Modal Hồ Sơ Khách & CCCD / Tạm Trú */}
      {selectedRoomForMembers && (() => {
        const occInfo = getRoomOccupancyInfo(
          selectedRoomForMembers,
          selectedRoomForMembers.houseCode
        );
        const isVacant =
          selectedRoomForMembers.status === 'AVAILABLE' ||
          selectedRoomForMembers.status === 'LOCKED' ||
          selectedRoomForMembers.status === 'MAINTENANCE';

        return (
          <Modal isOpen={!!selectedRoomForMembers} onClose={() => setSelectedRoomForMembers(null)} maxWidth="max-w-md">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Hồ Sơ Cư Dân: Phòng {selectedRoomForMembers.number}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-medium">
                    [{selectedRoomForMembers.houseCode}] {selectedRoomForMembers.houseName || 'Cơ sở nhà trọ'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRoomForMembers(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isVacant ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center space-y-2">
                  <div className="inline-flex p-2 bg-emerald-100 text-emerald-700 rounded-full">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-emerald-900 text-sm">Phòng Hiện Đang Còn Trống</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Phòng {selectedRoomForMembers.number} chưa có cư dân nào lưu trú. Bạn có thể đón khách thuê mới hoặc nhận giữ chỗ cọc cho khách.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-4 text-[11px] font-bold text-emerald-800">
                    <span>Sức chứa: {selectedRoomForMembers.maxOccupants || 2} người</span>
                    <span>•</span>
                    <span>Giá: {(selectedRoomForMembers.price || 0).toLocaleString('vi-VN')} đ/tháng</span>
                  </div>
                </div>
              ) : occInfo.members.length === 0 ? (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-3">
                  <div className="text-amber-800 font-bold text-sm">
                    ⚠️ Phát Hiện Lỗi Bất Đồng Bộ Dữ Liệu
                  </div>
                  <p className="text-amber-900/90 text-xs leading-relaxed">
                    Phòng {selectedRoomForMembers.number} tại [{selectedRoomForMembers.houseCode}] đang mang trạng thái <strong>Đang thuê</strong> nhưng hệ thống không tìm thấy bất kỳ hợp đồng hiệu lực hay hồ sơ cư dân nào tại cơ sở này.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (updateRoomStatus) {
                        updateRoomStatus(selectedRoomForMembers.id, 'AVAILABLE');
                      }
                      setSelectedRoomForMembers(null);
                      setActionToast(`Đã tự động đồng bộ & khôi phục phòng ${selectedRoomForMembers.number} về trạng thái Còn Trống!`);
                      setTimeout(() => setActionToast(null), 3500);
                    }}
                    className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>⚡ Đồng Bộ & Khôi Phục Về Phòng Trống</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
                    <span>Cư dân đang ở ({occInfo.members.length}/{selectedRoomForMembers.maxOccupants || 2} người):</span>
                    <span className="text-purple-700 font-bold">🟣 Đang thuê</span>
                  </div>
                  {occInfo.members.map((mem) => (
                    <div key={mem.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{mem.fullName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                          {mem.role === 'HOST' || mem.roleInRoom === 'REPRESENTATIVE' ? 'Chủ hợp đồng' : 'Ở ghép'}
                        </span>
                      </div>
                      <div className="text-slate-600 text-xs">
                        SĐT: <span className="font-semibold text-slate-800">{mem.phone || 'Chưa cập nhật'}</span> • CCCD: <span className="font-mono text-slate-700">{mem.maskedCccd || mem.cccd || 'Chưa cung cấp'}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span>
                          Tạm trú: {mem.temporaryResidenceStatus === 'REGISTERED' ? '🟢 Đã ĐK tạm trú' : '🟡 Chưa đăng ký'}
                        </span>
                        {mem.contractCode && (
                          <span className="font-mono text-[10px] text-purple-700 font-bold">
                            HĐ: {mem.contractCode}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* Modal Cảnh Báo Chưa Có Cơ Sở / Cơ Sở Chưa Duyệt */}
      {noHouseWarningModal && (
        <Modal isOpen={!!noHouseWarningModal} onClose={() => setNoHouseWarningModal(null)} maxWidth="max-w-md">
          <div className="text-center p-2 text-xs space-y-3">
            <Building2 className="w-12 h-12 text-rose-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">
              {noHouseWarningModal === 'NO_HOUSE'
                ? 'Chưa Khởi Tạo Cơ Sở / Tòa Nhà'
                : 'Cơ Sở Chưa Được Phê Duyệt Hoạt Động'}
            </h3>
            <p className="text-slate-600 leading-relaxed">
              {noHouseWarningModal === 'NO_HOUSE'
                ? 'Bạn chưa tạo bất kỳ cơ sở nhà trọ nào trong hệ thống. Vui lòng tạo cơ sở tại mục "Quản lý Chuỗi Cơ Sở" trước khi thêm phòng mới!'
                : 'Các cơ sở của bạn hiện đang ở trạng thái "Chờ Admin phê duyệt" hoặc đang bị tạm khóa. Bạn chỉ có thể thêm phòng vào cơ sở đã được duyệt hoạt động!'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNoHouseWarningModal(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Đóng
              </button>
              <Link
                to="/boarding-houses"
                onClick={() => setNoHouseWarningModal(null)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
              >
                Đi tới Quản lý Cơ Sở ngay
              </Link>
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

      {/* Modal Sửa Giá Phòng: CHỈ CHO PHÉP SỬA PHÒNG CÒN TRỐNG */}
      <Modal isOpen={showPriceEditModal} onClose={() => setShowPriceEditModal(false)} maxWidth="max-w-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
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
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Quy định điều chỉnh giá phòng:</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed pl-5.5">
              Hệ thống <strong>chỉ cho phép sửa giá niêm yết của các phòng CÒN TRỐNG</strong> để đón khách mới. Các phòng <strong>ĐANG CÓ NGƯỜI Ở</strong> sẽ bị khóa, không được sửa giá nhằm bảo vệ tính pháp lý của hợp đồng thuê hiện hành.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Chọn phòng còn trống cần sửa giá *
            </label>
            <select
              value={roomToEditPrice ? roomToEditPrice.id : ''}
              onChange={(e) => {
                const found = (staffRooms || []).find((r) => r.id === Number(e.target.value));
                setRoomToEditPrice(found || null);
                if (found) {
                  setNewRoomPriceInput(String(found.price));
                } else {
                  setNewRoomPriceInput('');
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-purple-500"
            >
              <option value="">-- Chọn phòng còn trống --</option>
              {(staffRooms || [])
                .filter((r) => r.status === 'AVAILABLE')
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    Phòng {r.number} ({r.houseCode || 'CS'}) - Giá hiện tại: {Number(r.price).toLocaleString('vi-VN')} đ/tháng
                  </option>
                ))}
            </select>
          </div>

          {roomToEditPrice && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Giá thuê mới (VNĐ / tháng) *
              </label>
              <input
                type="number"
                step="50000"
                min="500000"
                required
                value={newRoomPriceInput}
                onChange={(e) => setNewRoomPriceInput(e.target.value)}
                placeholder="Nhập giá mới (VD: 3500000)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-500 text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {newRoomPriceInput && !isNaN(Number(newRoomPriceInput))
                  ? `Bằng chữ: ${Number(newRoomPriceInput).toLocaleString('vi-VN')} đ/tháng`
                  : ''}
              </p>
            </div>
          )}

          {priceErrorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
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
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-purple-600/25 cursor-pointer btn-press"
            >
              Lưu Giá Phòng Mới
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
