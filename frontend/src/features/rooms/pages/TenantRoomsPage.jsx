import { getHouseFullAddress } from '../../properties/property.presentation.js';
import { buildTenantPropertyCatalog, roomBelongsToProperty } from '../../properties/property.catalog.js';
import { getRoomImage } from '../room.presentation.js';
import { useState, useMemo, useRef } from 'react';

import {
  MapPin,
  ArrowRight,
  ArrowLeft,
  Building2,
  ChevronRight,
  Search,
  FileText,
  X
} from 'lucide-react';
import { useData } from '../../../shared/data/RentalDataContext';
import Modal from '../../../shared/ui/Modal';
import HoldDepositDetails from '../components/HoldDepositDetails.jsx';
import { tenantRoomRequests, isRentalRequest, roomStatusLabel, requestStatusLabel } from '../room.rules.js';
import { useTenantResidency } from '../../tenants/useTenantResidency';
import TenantBuildingRooms from '../components/TenantBuildingRooms';
import { useReservationRefresh } from '../useReservationRefresh.js';

export default function TenantRoomsPage() {
  const residency = useTenantResidency();
  return residency.hasActiveRental
    ? <TenantBuildingRooms residency={residency} />
    : <TenantRoomMarketplace key={residency.currentTenant?.id || 'visitor'} currentTenant={residency.currentTenant} />;
}

function TenantRoomMarketplace({ currentTenant }) {
  const {boardingHouses:apiBoardingHouses=[]}=useData() || {};


  const {
    rooms = [],
    roomRequests = [],
    submitRoomRequest,
    refreshData
  } = useData();

  const [selectedHouse, setSelectedHouse] = useState('ALL');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [tenantViewAllFlat, setTenantViewAllFlat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [priceRange, setPriceRange] = useState('ALL');

  const [selectedRoomDetails, setSelectedRoomDetails] = useState(null);
  const [selectedHold, setSelectedHold] = useState(null);
  const [reservingRoomId, setReservingRoomId] = useState(null);
  const [reservationError, setReservationError] = useState('');
  const reservationInFlight = useRef(false);
  const newlyHeldRooms = useRef(new Map());
  const ownRequests = tenantRoomRequests(roomRequests, currentTenant?.id);
  const activeHolds = ownRequests.filter(req => isRentalRequest(req) && req.status === 'HOLDING');
  useReservationRefresh(activeHolds.length > 0 || rooms.some(room => room.status === 'HOLDING'));
  const [showRequestsHistory, setShowRequestsHistory] = useState(false);
  const [showPendingReviewModal, setShowPendingReviewModal] = useState(false);
  const [actionToast, setActionToast] = useState(null);


  const { visibleHouses: visibleHousesForUser, visibleRooms, addressGroups } = useMemo(
    () => buildTenantPropertyCatalog(apiBoardingHouses, rooms),
    [apiBoardingHouses, rooms],
  );

  // Helper: kiểm tra xem bản ghi có khớp với khách đang đăng nhập hay không
  const matchesCurrentTenant = useCallback((tName, tPhone, tUser, tCccd) => {
    const uName = (user?.fullName || '').toLowerCase().trim();
    const uPhone = (user?.phone || '').trim();
    const uUsername = (user?.username || '').toLowerCase().trim();
    const uCccd = (user?.cccd || '').trim();

    if (uUsername && tUser && tUser.toLowerCase().trim() === uUsername) return true;
    if (uPhone && tPhone && tPhone.trim() === uPhone) return true;
    if (uCccd && tCccd && tCccd.trim() === uCccd) return true;
    if (uName && tName) {
      const n = tName.toLowerCase().trim();
      if (n === uName || n.includes(uName) || uName.includes(n)) return true;
      if (uName.includes('an') && n.includes('an')) return true;
      if (uName.includes('cường') && n.includes('cường')) return true;
      if (uName.includes('nam') && n.includes('nam')) return true;
    }
    return false;
  }, [user]);

  // Kiểm tra một phòng cụ thể có phải là phòng mà khách này ĐANG THỰC SỰ THUÊ / CƯ TRÚ hay không
  // BẮT BUỘC: Phải khớp CẢ số phòng VÀ cơ sở / chủ trọ (không bao giờ đánh đồng P.101 của CS1 với P.101 của CS2)
  const isRoomRentedByCurrentUser = useCallback((room) => {
    if (!room || !room.number) return false;
    if (isTenantNew) return false;
    if (hasCurrentUserLeftRoom(room.number)) return false;

    const rNum = room.number || room.roomNumber;
    const roomHouseCode = normalizeHouseCode(room.houseCode || room.house);

    // 0. BẢO VỆ: Nếu khách đang có hợp đồng PENDING_DEPOSIT hoặc PENDING_SIGN nhưng chưa ký điện tử
    const hasPending = (contracts || []).some(
      (c) =>
        (c.status === 'PENDING_DEPOSIT' || c.status === 'PENDING_SIGN' || (c.depositPaid && !c.signedElectronically && c.status !== 'ACTIVE')) &&
        isSameRoom(c.roomNumber, rNum) &&
        matchesCurrentTenant(c.tenantName, c.tenantPhone, c.tenantUsername || c.username, c.tenantCccd)
    );
    if (hasPending) return false;

    // 1. NGUỒN SỰ THẬT TỐI CAO: Hợp đồng ACTIVE của chính khách này
    const hasActiveContract = (contracts || []).some((c) => {
      if (c.status !== 'ACTIVE' && c.status !== 'CHECKOUT_REQUESTED' && c.status !== 'PENDING_TERMINATION') return false;
      if (!isSameRoom(c.roomNumber, rNum)) return false;
      if (!matchesCurrentTenant(c.tenantName, c.tenantPhone, c.tenantUsername || c.username, c.tenantCccd)) return false;

      // Khớp cơ sở
      if (c.houseCode && room.houseCode && !isSameHouse(c.houseCode, room.houseCode)) return false;
      if (c.houseName && room.house && !isSameHouse(c.houseName, room.house)) return false;
      if (c.landlordId && room.landlordId && String(c.landlordId) !== String(room.landlordId)) return false;
      return true;
    });
    if (hasActiveContract) return true;

    // 2. Thành viên đang cư trú trong roomMembers (dành cho người ở ghép cùng phòng)
    const hasActiveMember = (roomMembers || []).some((m) => {
      if (m.status === 'MOVED_OUT' || m.status === 'INACTIVE') return false;
      const mRoom = m.roomNumber || m.room;
      if (!isSameRoom(mRoom, rNum)) return false;
      if (!matchesCurrentTenant(m.fullName, m.phone, m.username, m.cccd)) return false;

      // Khớp cơ sở
      if (m.houseCode && room.houseCode && !isSameHouse(m.houseCode, room.houseCode)) return false;
      if (m.house && room.house && !isSameHouse(m.house, room.house)) return false;
      return true;
    });
    if (hasActiveMember) return true;

    // 2.1. Đơn xin ở ghép đã được BQL duyệt (APPROVED)
    const hasApprovedRoommateReq = (roomRequests || []).some((r) => {
      if (r.status !== 'APPROVED') return false;
      if (r.type !== 'ROOMMATE' && r.type !== 'JOIN_ROOM') return false;
      const tRoom = r.targetRoom || r.roomNumber;
      if (!isSameRoom(tRoom, rNum)) return false;
      if (r.houseCode && room.houseCode && !isSameHouse(r.houseCode, room.houseCode)) return false;
      return matchesCurrentTenant(r.tenant || r.tenantName, r.phone || r.tenantPhone, r.username, r.cccd);
    });
    if (hasApprovedRoommateReq) return true;

    if (currentTenant?.status === 'INACTIVE' || currentTenant?.status === 'WAITING_ROOM') return false;

    // 3. Kiểm tra currentTenant từ danh sách tenants
    if (currentTenant && (currentTenant.room || (currentTenant.rooms && currentTenant.rooms.length > 0))) {
      const tRooms = currentTenant.rooms && currentTenant.rooms.length > 0 ? currentTenant.rooms : [currentTenant.room];
      const matchNumber = tRooms.some((tr) => isSameRoom(tr, rNum));
      if (matchNumber) {
        if (currentTenant.houseCode && room.houseCode && !isSameHouse(currentTenant.houseCode, room.houseCode)) return false;
        if (currentTenant.house && room.house && !isSameHouse(currentTenant.house, room.house)) return false;
        return true;
      }
    }

    // 4. Kiểm tra user từ AuthContext
    if (user && user.rooms && user.rooms.length > 0) {
      const matchNumber = user.rooms.some((ur) => isSameRoom(ur, rNum));
      if (matchNumber) {
        if (user.houseCode && room.houseCode && !isSameHouse(user.houseCode, room.houseCode)) return false;
        if (user.houseName && room.house && !isSameHouse(user.houseName, room.house)) return false;
        return true;
      }
    }

    return false;
  }, [contracts, roomMembers, currentTenant, user, isTenantNew, hasCurrentUserLeftRoom, matchesCurrentTenant, roomRequests]);

  const tenantAssociatedLandlordKey = useMemo(() => {
    // Chỉ áp dụng logic khóa theo chủ trọ cho tài khoản TENANT / Khách thuê
    if (user?.role === 'ADMIN' || (user?.role === 'STAFF' && user?.username !== 'tenant1' && user?.username !== 'tenant2' && user?.username !== 'tenant_new')) {
      return null;
    }

    // Helper: trích xuất key chủ trọ từ mã cơ sở hoặc tên cơ sở
    const findLandlordKeyForHouse = (hCode, hName) => {
      if (hCode) {
        const found = storedBoardingHouses.find((h) => isSameHouse(h.code, hCode));
        if (found) {
          const k = getLandlordKeyFromHouse(found);
          if (k) return k;
        }
      }
      return resolveLandlordKey(hCode, hName);
    };

    // Helper: trích xuất key chủ trọ từ số phòng
    const findLandlordKeyForRoom = (roomNum, hintHouseCode) => {
      if (!roomNum) return null;
      const cleanR = normalizeRoomNumber(roomNum);
      const matched = (rooms || []).find((r) =>
        normalizeRoomNumber(r.number) === cleanR &&
        (!hintHouseCode || isSameHouse(r.houseCode, hintHouseCode))
      );
      if (matched?.houseCode) {
        return findLandlordKeyForHouse(matched.houseCode, matched.house);
      }
      return null;
    };

    // 0. XÁC ĐỊNH TRẠNG THÁI KHÁCH CÓ ĐANG THỰC SỰ THUÊ / Ở PHÒNG NÀO KHÔNG
    const activeContract = (contracts || []).find((c) => {
      if (c.status !== 'ACTIVE' && c.status !== 'CHECKOUT_REQUESTED' && c.status !== 'PENDING_TERMINATION') return false;
      return matchesCurrentTenant(c.tenantName, c.tenantPhone, c.tenantUsername || c.username, c.tenantCccd);
    });

    const isActivelyRenting = Boolean(
      activeContract ||
      (myCurrentRoom && !hasCurrentUserLeftRoom(myCurrentRoom)) ||
      (Array.isArray(myRentedRooms) && myRentedRooms.some(r => !hasCurrentUserLeftRoom(r)))
    );

    // =========================================================================
    // TRƯỜNG HỢP 1: KHÁCH ĐANG TRONG PHÒNG THUÊ (ACTIVE RENTAL HOẶC ĐANG TRẢ PHÒNG CHƯA XONG)
    // =========================================================================
    if (isActivelyRenting) {
      // 1.1 HỢP ĐỒNG ACTIVE CỦA CHÍNH KHÁCH NÀY (ƯU TIÊN SỐ 1 - CHÍNH XÁC TUYỆT ĐỐI VÌ CÓ HOUSECODE VÀ CHỦ TRỌ)
      if (activeContract) {
        const lKey = findLandlordKeyForHouse(activeContract.houseCode, activeContract.houseName || activeContract.house) ||
                     findLandlordKeyForRoom(activeContract.roomNumber, activeContract.houseCode);
        if (lKey) return lKey;
      }

      // 1.1.b ĐƠN XIN Ở GHÉP ĐÃ ĐƯỢC BQL DUYỆT (APPROVED)
      const approvedRoommateReq = (roomRequests || []).find((r) => {
        if (r.status !== 'APPROVED') return false;
        if (r.type !== 'ROOMMATE' && r.type !== 'JOIN_ROOM') return false;
        const tRoom = r.targetRoom || r.roomNumber;
        if (hasCurrentUserLeftRoom(tRoom)) return false;
        return matchesCurrentTenant(r.tenant || r.tenantName, r.phone || r.tenantPhone, r.username, r.cccd);
      });
      if (approvedRoommateReq) {
        const lKey = findLandlordKeyForHouse(approvedRoommateReq.houseCode, approvedRoommateReq.house) ||
                     findLandlordKeyForRoom(approvedRoommateReq.targetRoom || approvedRoommateReq.roomNumber, approvedRoommateReq.houseCode);
        if (lKey) return lKey;
      }

      // 1.2 Kiểm tra xem có đơn báo trả phòng ĐANG TRONG QUÁ TRÌNH XỬ LÝ (PENDING hoặc WAITING_ROOMMATES)
      const inProgressCheckoutReq = (roomRequests || []).find((r) => {
        const isCheckoutType = r.type === 'CHECKOUT' || r.type === 'RETURN' || r.type === 'LEAVE_ROOM' || r.type === 'LEAVE';
        if (!isCheckoutType) return false;
        // Đã được duyệt, đã thanh lý, hoặc bị hủy/từ chối thì không phải đang chờ xử lý
        if (r.status === 'APPROVED' || r.status === 'SETTLED' || r.status === 'CHECKOUT_SETTLED' || Boolean(r.settledAt)) return false;
        if (r.status === 'REJECTED' || r.status === 'CANCELLED') return false;
        if (r.status !== 'PENDING' && r.status !== 'WAITING_ROOMMATES') return false;
        return matchesCurrentTenant(r.tenant || r.tenantName, r.phone || r.tenantPhone, r.username, r.cccd);
      });
      if (inProgressCheckoutReq) {
        const lKey = findLandlordKeyForHouse(inProgressCheckoutReq.houseCode, inProgressCheckoutReq.house) ||
                     findLandlordKeyForRoom(inProgressCheckoutReq.targetRoom || inProgressCheckoutReq.roomNumber || inProgressCheckoutReq.currentRoom, inProgressCheckoutReq.houseCode);
        if (lKey) return lKey;
      }

      // 1.3 Thành viên đang cư trú trong roomMembers (CÓ CHỨA CHÍNH XÁC HOUSECODE)
      const activeMember = (roomMembers || []).find((m) => {
        if (m.status === 'MOVED_OUT' || m.status === 'INACTIVE') return false;
        if (hasCurrentUserLeftRoom(m.roomNumber || m.room)) return false;
        return matchesCurrentTenant(m.fullName, m.phone, m.username, m.cccd);
      });
      if (activeMember) {
        const cleanR = normalizeRoomNumber(activeMember.roomNumber || activeMember.room);
        const lKey = findLandlordKeyForHouse(activeMember.houseCode, activeMember.house) ||
                     findLandlordKeyForRoom(cleanR, activeMember.houseCode);
        if (lKey) return lKey;
      }

      // 1.4 Cơ sở liên kết từ activeContract, currentTenant hoặc user
      const tenantHouseCode = activeContract?.houseCode || currentTenant?.houseCode || user?.houseCode;
      const tenantHouseName = activeContract?.houseName || currentTenant?.house || user?.houseName;
      if (tenantHouseCode || tenantHouseName) {
        const lKey = findLandlordKeyForHouse(tenantHouseCode, tenantHouseName);
        if (lKey) return lKey;
      }

      // 1.5 Phòng đang ở thực tế (myCurrentRoom) - CHỈ tìm phòng trong cơ sở của khách
      if (myCurrentRoom && !hasCurrentUserLeftRoom(myCurrentRoom)) {
        const cleanR = normalizeRoomNumber(myCurrentRoom);
        const matchRoom = (rooms || []).find((r) =>
          normalizeRoomNumber(r.number) === cleanR &&
          (!tenantHouseCode || isSameHouse(r.houseCode, tenantHouseCode))
        );
        const targetHouseCode = matchRoom?.houseCode || tenantHouseCode;
        const targetHouseName = matchRoom?.house || tenantHouseName;
        const lKey = findLandlordKeyForHouse(targetHouseCode, targetHouseName);
        if (lKey) return lKey;
      }
    }

    // =========================================================================
    // TRƯỜNG HỢP 2: KHÁCH ĐANG ĐẶT CỌC / GIỮ CHỖ PHÒNG MỚI (15 PHÚT NỘP CỌC HOẶC ĐƠN PENDING)
    // "Giữ chỗ của staff nào là vào phần phòng thuộc chuỗi chỉ thấy của staff đó"
    // =========================================================================

    // 2.1 Kiểm tra phòng đang được khách này giữ chỗ trực tiếp (getRoomHoldingOrDepositStatus)
    const myHeldRoom = (rooms || []).find((r) => {
      const holdInfo = getRoomHoldingOrDepositStatus(r);
      return holdInfo.isHeld && holdInfo.isMine && !hasCurrentUserLeftRoom(r.number);
    });
    if (myHeldRoom) {
      const lKey = findLandlordKeyForHouse(myHeldRoom.houseCode, myHeldRoom.house);
      if (lKey) return lKey;
    }

    // 2.2 Kiểm tra hợp đồng đang trong giai đoạn giữ chỗ / nộp cọc SePay (PENDING_DEPOSIT, PENDING_SIGN, HOLDING)
    const activeHoldingContract = (contracts || []).find((c) => {
      if (c.status === 'TERMINATED' || c.status === 'CANCELLED' || c.status === 'COMPLETED' || c.status === 'ACTIVE') return false;
      const isHoldingStatus =
        c.status === 'PENDING_DEPOSIT' ||
        c.status === 'PENDING_SIGN' ||
        c.status === 'HOLDING' ||
        c.status === 'WAITING_CONFIRMATION' ||
        (typeof localStorage !== 'undefined' && localStorage.getItem(`rental_deposit_paid_${c.id}`) === 'true');
      if (!isHoldingStatus) return false;
      if (hasCurrentUserLeftRoom(c.roomNumber)) return false;
      return matchesCurrentTenant(c.tenantName, c.tenantPhone, c.tenantUsername || c.username, c.tenantCccd);
    });
    if (activeHoldingContract) {
      const lKey = findLandlordKeyForHouse(activeHoldingContract.houseCode, activeHoldingContract.houseName || activeHoldingContract.house) ||
                   findLandlordKeyForRoom(activeHoldingContract.roomNumber, activeHoldingContract.houseCode);
      if (lKey) return lKey;
    }

    // 2.3 Kiểm tra đơn đăng ký thuê / giữ chỗ đang PENDING (đang chờ Staff duyệt)
    const activePendingRequest = (roomRequests || []).find((r) => {
      const isRentType = r.type === 'RENT' || r.type === 'NEW_RENT' || r.type === 'RENTAL' || r.type === 'HOLD';
      if (!isRentType) return false;
      // CHỈ xét đơn PENDING đang chờ duyệt! Tuyệt đối không match đơn APPROVED hay SETTLED cũ
      if (r.status !== 'PENDING') return false;
      return matchesCurrentTenant(r.tenant || r.tenantName, r.phone || r.tenantPhone, r.username, r.cccd);
    });
    if (activePendingRequest) {
      const lKey = findLandlordKeyForHouse(activePendingRequest.houseCode, activePendingRequest.house) ||
                   findLandlordKeyForRoom(activePendingRequest.targetRoom || activePendingRequest.roomNumber, activePendingRequest.houseCode);
      if (lKey) return lKey;
    }

    // =========================================================================
    // TRƯỜNG HỢP 3: KHÁCH ĐÃ TRẢ PHÒNG XONG / CHƯA THUÊ PHÒNG NÀO / KHÔNG CÓ ĐƠN GIỮ CHỖ ĐANG XỬ LÝ
    // "khách rời phòng xong không hiện cơ sở và phòng của tất cả chủ trọ mà chỉ hiện của mỗi chủ trọ mình mới trả phòng vậy"
    // -> BẮT BUỘC TRẢ VỀ NULL để hiển thị toàn bộ cơ sở và phòng của TẤT CẢ các chủ trọ trên toàn sàn!
    // =========================================================================
    return null;
  }, [user, storedBoardingHouses, myCurrentRoom, myRentedRooms, rooms, contracts, roomRequests, roomMembers, getRoomHoldingOrDepositStatus, resolveLandlordKey, getLandlordKeyFromHouse, hasCurrentUserLeftRoom]);

  // CHỈ HIỂN THỊ CƠ SỞ CỦA CHỦ TRỌ MÀ KHÁCH ĐANG ĐẶT CỌC / THUÊ (LỌC BỎ HOÀN TOÀN CƠ SỞ CỦA CHỦ TRỌ KHÁC)
  const visibleHousesForUser = useMemo(() => {
    const active = storedBoardingHouses.filter(
      (h) => h.status === 'ACTIVE' || (!h.status && h.status !== 'LOCKED' && h.status !== 'PENDING_APPROVAL')
    );
    if (tenantAssociatedLandlordKey) {
      const landlordHouses = active.filter((h) => getLandlordKeyFromHouse(h) === tenantAssociatedLandlordKey);
      return landlordHouses;
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

  // Tự động điều chỉnh khi bị giới hạn theo cơ sở của chủ trọ đang đặt cọc / đang ở
  const autoSelectedOnMountRef = useRef(false);
  const prevUserRef = useRef(user?.username);

  useEffect(() => {
    // Reset khi chuyển đổi tài khoản (ví dụ switchRole giữa Khách 1, Khách 2, Khách Mới)
    if (prevUserRef.current !== user?.username) {
      prevUserRef.current = user?.username;
      autoSelectedOnMountRef.current = false;
    }

    if (tenantAssociatedLandlordKey) {
      // 1. Chỉ tự động chọn thẳng cơ sở của phòng đang ở 1 lần duy nhất khi mới vào trang
      // để sau đó người dùng bấm [Đổi Cơ Sở Khác], [Tất Cả Địa Chỉ], [Quận Cầu Giấy] vẫn điều hướng tự do bình thường
      if (!autoSelectedOnMountRef.current && myCurrentRoom) {
        const cleanR = normalizeRoomNumber(myCurrentRoom);
        // Tìm contract active, đơn ở ghép approved, hoặc roomMembers để lấy chính xác cơ sở nhà trọ của khách
        const activeC = (contracts || []).find(c =>
          (c.status === 'ACTIVE' || c.status === 'CHECKOUT_REQUESTED') &&
          isSameRoom(c.roomNumber, myCurrentRoom) &&
          matchesCurrentTenant(c.tenantName, c.tenantPhone, c.tenantUsername || c.username, c.tenantCccd)
        );
        const approvedReq = (roomRequests || []).find(r =>
          r.status === 'APPROVED' &&
          (r.type === 'ROOMMATE' || r.type === 'JOIN_ROOM') &&
          isSameRoom(r.targetRoom || r.roomNumber, myCurrentRoom) &&
          matchesCurrentTenant(r.tenant || r.tenantName, r.phone || r.tenantPhone, r.username, r.cccd)
        );
        const memRecord = (roomMembers || []).find(m =>
          m.status !== 'MOVED_OUT' && m.status !== 'INACTIVE' &&
          isSameRoom(m.roomNumber || m.room, myCurrentRoom) &&
          matchesCurrentTenant(m.fullName, m.phone, m.username, m.cccd)
        );
        const targetHouseCode = activeC?.houseCode || approvedReq?.houseCode || memRecord?.houseCode || currentTenant?.houseCode || user?.houseCode;

        const matchRoom = (rooms || []).find((r) =>
          normalizeRoomNumber(r.number) === cleanR &&
          (!targetHouseCode || isSameHouse(r.houseCode, targetHouseCode))
        );
        const houseCodeToSelect = matchRoom?.houseCode || targetHouseCode;
        if (houseCodeToSelect) {
          const targetHouse = visibleHousesForUser.find((h) => isSameHouse(h.code, houseCodeToSelect));
          if (targetHouse) {
            setSelectedHouse(targetHouse.code);
            setTenantLocation(getHouseDistrict(targetHouse));
            autoSelectedOnMountRef.current = true;
            return;
          }
        }
      }

      autoSelectedOnMountRef.current = true;

      // 2. Bảo vệ an toàn: Nếu cơ sở đang chọn không thuộc danh sách cơ sở của chủ trọ này thì reset về 'ALL'
      if (selectedHouse !== 'ALL' && !visibleHousesForUser.some((h) => isSameHouse(h.code, selectedHouse))) {
        setSelectedHouse('ALL');
      }
      // Nếu khu vực đang chọn không thuộc các khu vực của chủ trọ này thì reset về null
      if (tenantLocation && !locationGroups.some((g) => g.district === tenantLocation)) {
        setTenantLocation(null);
      }
    }
  }, [tenantAssociatedLandlordKey, visibleHousesForUser, locationGroups, selectedHouse, tenantLocation, myCurrentRoom, rooms, user?.username]);

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
    return visibleRooms.filter((room) => {
      if (selectedHouse !== 'ALL' && room.houseCode !== selectedHouse) return false;
      if (selectedAddress && !tenantViewAllFlat && selectedHouse === 'ALL') {
        const h = visibleHousesForUser.find((house) => house.code === room.houseCode);
        if (!h || getHouseFullAddress(h) !== selectedAddress) return false;
      }
      if (filterStatus === 'AVAILABLE' && room.status !== 'AVAILABLE') return false;
      if (filterStatus === 'HOLDING' && room.status !== 'HOLDING') return false;
      if (filterStatus !== 'ALL' && room.status !== filterStatus) return false;

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
  }, [visibleRooms, selectedHouse, selectedAddress, tenantViewAllFlat, visibleHousesForUser, filterStatus, priceRange, searchTerm]);

  const handleDepositClick = async (room) => {
    if (reservationInFlight.current) return;
    const cached = newlyHeldRooms.current.get(room.id);
    const existing = ownRequests.find(req => isRentalRequest(req) && String(req.targetRoomId) === String(room.id) && ['HOLDING', 'PENDING'].includes(req.status))
      || (cached && !ownRequests.some(req => req.id === cached.id) ? cached : null);
    if (existing) { setSelectedHold(existing); return; }
    if (!currentTenant?.id) { setReservationError('Không tìm thấy hồ sơ khách thuê của bạn. Vui lòng liên hệ quản lý.'); return; }
    if (room.status !== 'AVAILABLE') return;
    reservationInFlight.current = true;
    setReservingRoomId(room.id);
    setReservationError('');
    try {
      const result = await submitRoomRequest({ type: 'RENT', tenantId: currentTenant.id, targetRoomId: room.id, durationMonths: 12,
        note: 'Đặt cọc giữ phòng. Khoản nộp trước 1.000.000 đ tính vào tổng cọc một tháng tiền thuê; chờ quản lý xác nhận tiền thực nhận.' });
      const hold = result.data || result;
      newlyHeldRooms.current.set(room.id, { ...hold, roomNumber: room.number });
      setSelectedHold({ ...hold, roomNumber: room.number });
      setActionToast('Đã giữ phòng. Vui lòng liên hệ quản lý cơ sở để nộp cọc và xác nhận tiền thực nhận.');
    } catch (error) {
      setSelectedHold(null);
      setActionToast(null);
      try { await refreshData(); } catch { /* Keep the original reservation error visible. */ }
      setReservationError(error.message || 'Không thể giữ phòng. Vui lòng thử lại.');
    }
    finally { reservationInFlight.current = false; setReservingRoomId(null); }
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
                : selectedAddress && !tenantViewAllFlat
                ? `Địa chỉ: ${selectedAddress}`
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
            Tìm phòng tại các cơ sở của nhiều chủ trọ, xem tiện ích và gửi yêu cầu đặt cọc giữ chỗ.
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

      {reservationError && <p role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">{reservationError}</p>}
      {activeHolds.map(hold => <div key={hold.id} className="bento-card p-4 border border-amber-200 bg-white"><HoldDepositDetails request={hold} /></div>)}

      {/* Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold flex-wrap">
          <button
            type="button"
            onClick={() => {
              setSelectedAddress(null);
              setTenantViewAllFlat(false);
              setSelectedHouse('ALL');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              !selectedAddress && selectedHouse === 'ALL' && !tenantViewAllFlat
                ? 'bg-purple-600 text-white font-extrabold shadow-sm'
                : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
            }`}
          >
            <span>🏠 Tất Cả Địa Chỉ</span>
          </button>

          {selectedAddress && !tenantViewAllFlat && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <button
                type="button"
                onClick={() => {
                  setSelectedHouse('ALL');
                  setTenantViewAllFlat(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${selectedHouse === 'ALL' && !tenantViewAllFlat
                  ? 'bg-purple-600 text-white font-extrabold shadow-sm'
                  : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                  }`}
              >
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{selectedAddress}</span>
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
                setSelectedAddress(null);
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
              <span>🏢 Xem tất cả {visibleRooms.length} phòng</span>
            </button>
          )}
        </div>
      </div>

      {/* BƯỚC 1: Chọn địa chỉ đã lưu */}
      {selectedHouse === 'ALL' && !selectedAddress && !tenantViewAllFlat ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-purple-700">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span>Bước 1: Chọn Địa Chỉ Bạn Muốn Tìm Trọ</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {addressGroups.length} địa chỉ ({visibleHousesForUser.length} cơ sở)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {addressGroups.map((group) => (
              <div
                key={group.address}
                onClick={() => setSelectedAddress(group.address)}
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
                    {group.address}
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
      ) : selectedHouse === 'ALL' && selectedAddress && !tenantViewAllFlat ? (
        /* BƯỚC 2: Chọn cơ sở tại địa chỉ đã chọn */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Bước 2: Chọn Cơ Sở Nhà Trọ Tại {selectedAddress}</span>
            </h2>
            <button
              type="button"
              onClick={() => setSelectedAddress(null)}
              className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
            >
              ← Đổi địa chỉ khác
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleHousesForUser
              .filter((h) => getHouseFullAddress(h) === selectedAddress)
              .map((house) => {
                const houseRooms = visibleRooms.filter(room => roomBelongsToProperty(room, house));
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
        </div>) : (
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
                  setTenantViewAllFlat(false);
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
              {['ALL', 'AVAILABLE', 'HOLDING', 'MAINTENANCE', 'LOCKED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${filterStatus === st
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {st === 'ALL' ? 'Tất cả' : roomStatusLabel(st)}
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
                return (
                  <div
                    key={room.id}
                    className="bento-card p-5 flex flex-col justify-between transition-all group bg-white border-slate-200/80"
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
                            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-500/95 text-white backdrop-blur-md shadow-md">
                              Đặt cọc
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-900/80 text-white backdrop-blur-md shadow-md">
                              {roomStatusLabel(room.status)}
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
                          </div>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            {room.house || room.houseCode}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                              <Users className="w-3 h-3 text-indigo-600" />
                              <span>{getActualOccupants(room)}/{room.maxOccupants || 2} người</span>
                            </span>
                            {(() => {
                              const holdStatus = getRoomHoldingOrDepositStatus(room);
                              const curOcc = getActualOccupants(room);
                              const maxOcc = room.maxOccupants || 2;
                              const roommateReq = getRoommateReqForRoom(room);
                              const isRejected = Boolean(roommateReq && (roommateReq.status === 'REJECTED_BY_ROOMMATES' || roommateReq.status === 'REJECTED'));

                              return (
                                <>
                                  {holdStatus.isHeld && (
                                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
                                      holdStatus.isDepositPaid
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                      <Lock className="w-2.5 h-2.5" />
                                      <span>{holdStatus.isDepositPaid ? 'Đã có người nộp cọc' : 'Đang giữ chỗ'}</span>
                                    </span>
                                  )}
                                  {curOcc > 0 && curOcc < maxOcc && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Còn trống {maxOcc - curOcc} chỗ
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                      <span>Đã từng bị từ chối</span>
                                    </span>
                                  )}
                                </>
                              );
                            })()}
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

                      {room.status === 'AVAILABLE' && (
                        <button
                          type="button"
                          disabled={reservingRoomId !== null}
                          onClick={() => handleDepositClick(room)}
                          className="text-xs text-white font-bold px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all flex-1 text-center btn-press cursor-pointer"
                        >
                          {reservingRoomId === room.id ? 'Đang giữ phòng…' : 'Đặt cọc 1tr'}
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
                  {roomStatusLabel(selectedRoomDetails.status)}
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
                  disabled={reservingRoomId !== null}
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

      {selectedHold && <Modal isOpen={!!selectedHold} onClose={() => setSelectedHold(null)} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="flex justify-between items-center"><h3 className="font-bold text-slate-900">Thông tin đặt cọc</h3><button aria-label="Đóng" onClick={() => setSelectedHold(null)}><X className="w-4 h-4" /></button></div>
          <HoldDepositDetails request={ownRequests.find(req => req.id === selectedHold.id) || selectedHold} />
        </div>
      </Modal>}

      {/* Requests History Modal */}
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

            <div className="space-y-2">
              {ownRequests.length === 0 ? (
                <p className="text-center py-6 text-slate-400">Bạn chưa gửi đơn nào</p>
              ) : (
                ownRequests.map((req) => (
                  <div key={req.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>{['RENT', 'RENTAL', 'NEW_RENT'].includes(req.type) ? 'Đơn Thuê Phòng / Đặt Cọc' : req.type === 'TRANSFER' ? 'Đổi Phòng' : 'Ở Ghép'}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {requestStatusLabel(req.status)}
                      </span>
                    </div>
                    {isRentalRequest(req) ? <HoldDepositDetails request={req} /> : <div className="text-slate-500">Phòng: {req.roomNumber || req.targetRoom}</div>}
                  </div>
                ))
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
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isCheckout ? 'bg-amber-100 text-amber-800 border border-amber-300' :
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
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${isReapplying ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                  {isReapplying ? <RotateCcw className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {isReapplying ? 'Xin Lại Ở Ghép' : 'Xin Vào Ở Ghép'} - Phòng {joinRoomModalData.number}
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

            {/* Banner hỗ trợ khi Nộp Lại Đơn */}
            {isReapplying && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-amber-800">Lưu ý khi nộp lại đơn ở ghép:</div>
                  <div className="text-amber-800 leading-relaxed font-semibold">
                    Đơn trước của bạn đã bị từ chối. Hãy cập nhật lời giới thiệu chi tiết hơn để các bạn trong phòng hiểu rõ hơn nhé!
                  </div>
                </div>
              </div>
            )}

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
                  {isReapplying ? <RotateCcw className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  <span>{isReapplying ? 'Gửi Lại Đơn Xin Ở Ghép' : 'Gửi Đơn Xin Vào Ở Ghép'}</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
