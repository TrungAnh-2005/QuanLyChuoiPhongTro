import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  AlertTriangle,
  Receipt,
  Zap,
  CheckCircle2,
  Clock,
  Phone,
  Droplets,
  CreditCard,
  Wrench,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  X,
  LogOut,
  UserPlus,
  FileText,
  QrCode,
  Sparkles,
  ChevronRight,
  Check,
  Copy,
  Shield,
  ArrowRight,
  Settings,
  RefreshCw
} from 'lucide-react';
import { createVNPayPaymentUrl } from '../../services/vnpayService';
import { createMoMoPaymentUrl } from '../../services/momoService';
import {
  generateSePayQrUrl,
  getSePayConfig,
  saveSePayConfig,
  checkSePayTransaction,
  simulateSePayWebhookPayload,
  syncBankAccountsFromSePay,
  SEPAY_PORTAL_URL
} from '../../services/sepayService';
import { useAuth } from '../../contexts/AuthContext';
import { useData, isSameHouse, isSameRoom, normalizeHouseCode } from '../../contexts/DataContext';

function getRoomImage(room) {
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
import Modal from '../../components/common/Modal';
import ResidentContractModal from '../../components/tenant/ResidentContractModal';
import RoommateRequestModal from '../../components/tenant/RoommateRequestModal';
import PaymentModal from '../../components/payment/PaymentModal';

export default function UserDashboard() {
  const { user, tenantRooms, updateTenantRoom } = useAuth();
  const {
    invoices = [],
    payInvoice,
    tickets = [],
    rooms = [],
    tenants = [],
    contracts = [],
    roomRequests = [],
    roomMembers = [],
    roommateLeaveNotices = [],
    dismissRoommateLeaveNotice,
    resetRoomPaymentStatus,
    signContractElectronically,
    payDepositAndSignContract,
    leaveRoom,
    submitCheckoutRequest,
    transferContractHolder,
    proposeContractTransfer,
    respondContractTransfer,
    voteRoommateRequest,
    cancelRoomHold,
    cancelRoomRequest,
    confirmDepositPaid
  } = useData();

  const navigate = useNavigate();

  // Modals state for Tenant
  const [showContractModal, setShowContractModal] = useState(false);
  const [showRoommateModal, setShowRoommateModal] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paySuccessToast, setPaySuccessToast] = useState(null);
  const [isPeriodFeePaid, setPeriodFeePaid] = useState(false);
  const [copiedGateField, setCopiedGateField] = useState(null);

  // Modal Rời phòng & Trả phòng dành cho Cổng Khách Thuê
  const [leaveModal, setLeaveModal] = useState(null);
  const [leaveReason, setLeaveReason] = useState('');
  const [agreedForfeitLeave, setAgreedForfeitLeave] = useState(false);
  const [leaveSuccess, setLeaveSuccess] = useState(false);

  const [checkoutModal, setCheckoutModal] = useState(null);
  const [checkoutReason, setCheckoutReason] = useState('');
  const [agreedForfeitDeposit, setAgreedForfeitDeposit] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Trạng thái chuyển giao Hợp đồng khi Người đại diện rời phòng
  const [selectedSuccessor, setSelectedSuccessor] = useState('');

  // Thông tin nhận lại cọc khi trả phòng đúng hạn kết thúc HĐ
  const [refundBank, setRefundBank] = useState('Vietcombank');
  const [refundAccountNumber, setRefundAccountNumber] = useState('');
  const [refundAccountName, setRefundAccountName] = useState('');

  // SePay Integration for Deposit & Onboarding Gate
  const [sepayConfig, setSepayConfig] = useState(() => getSePayConfig());
  const [showSepayConfigModal, setShowSepayConfigModal] = useState(false);
  const [sepayForm, setSepayForm] = useState(() => {
    const cfg = getSePayConfig();
    return {
      accountNumber: cfg.accountNumber || '35825112005',
      bank: cfg.bank || 'MBBank',
      accountName: cfg.accountName || 'DAM TRUNG ANH',
      apiKey: cfg.apiKey || ''
    };
  });
  const [isCheckingSepayDeposit, setIsCheckingSepayDeposit] = useState(false);
  const [sepayDepositStatusMsg, setSepayDepositStatusMsg] = useState(null);
  const [isSyncingSepay, setIsSyncingSepay] = useState(false);
  const [isDepositPaid, setIsDepositPaid] = useState(false);
  const [depositPaymentMethod, setDepositPaymentMethod] = useState('SEPAY');

  // Đơn đăng ký thuê phòng của khách đã được Quản lý/Staff phê duyệt
  const hasApprovedRentalRequest = useMemo(() => {
    const uName = (user?.fullName || '').toLowerCase().trim();
    const uPhone = (user?.phone || '').trim();
    const uUsername = (user?.username || '').toLowerCase().trim();

    return (roomRequests || []).find((r) => {
      const isRent = (r.type === 'RENT' || r.type === 'NEW_RENT');
      if (!isRent || r.status !== 'APPROVED') return false;

      const rTenant = (r.tenant || r.tenantName || '').toLowerCase().trim();
      const rPhone = (r.phone || r.tenantPhone || '').trim();
      const rUsername = (r.username || '').toLowerCase().trim();

      const matchUser = (
        (uUsername && rUsername === uUsername) ||
        (uName && (rTenant.includes(uName) || uName.includes(rTenant))) ||
        (uPhone && rPhone === uPhone)
      );
      if (!matchUser) return false;

      const targetRoom = r.targetRoom || r.roomNumber;

      // 1. Nếu phòng này khách đã trả phòng (có đơn CHECKOUT/RETURN/LEAVE_ROOM đã duyệt) -> Bỏ qua
      const hasCheckedOutThisRoom = (roomRequests || []).some(
        req => (req.type === 'CHECKOUT' || req.type === 'RETURN' || req.type === 'LEAVE_ROOM') &&
          (req.targetRoom === targetRoom || req.currentRoom === targetRoom) &&
          req.status === 'APPROVED'
      );
      if (hasCheckedOutThisRoom) return false;

      // 2. Nếu khách đã có hợp đồng ACTIVE tại phòng này -> Đã hoàn tất, không phải đang chờ cọc
      const activeContract = (contracts || []).find(c => c.roomNumber === targetRoom && c.status === 'ACTIVE');
      if (activeContract) return false;

      // 3. Nếu hợp đồng đã kết thúc (COMPLETED / TERMINATED) mà không có hợp đồng mới PENDING_DEPOSIT -> Bỏ qua
      const finishedContract = (contracts || []).find(c => c.roomNumber === targetRoom && (c.status === 'COMPLETED' || c.status === 'TERMINATED'));
      const hasNewHoldingContract = (contracts || []).some(c => c.roomNumber === targetRoom && (c.status === 'PENDING_DEPOSIT' || c.status === 'PENDING_SIGN'));
      if (finishedContract && !hasNewHoldingContract) return false;

      return true;
    });
  }, [user, roomRequests, contracts]);

  // 0. Xác định phòng đang ở thực tế của người dùng (Active Resident Room Discovery)
  const resolvedActiveRoom = useMemo(() => {
    const uName = (user?.fullName || '').toLowerCase().trim();
    const uPhone = (user?.phone || '').trim();
    const myUname = (user?.username || '').toLowerCase().trim();

    // 0. BẢO VỆ TỐI THƯỢNG: Nếu khách đang có hợp đồng chờ nộp cọc hoặc chờ ký điện tử (PENDING_DEPOSIT hoặc PENDING_SIGN)
    // thì TUYỆT ĐỐI CHƯA PHẢI LÀ PHÒNG ĐANG Ở CHO ĐẾN KHI KÝ HỢP ĐỒNG XONG!
    const hasPendingContract = (contracts || []).some(
      c => (c.status === 'PENDING_DEPOSIT' || c.status === 'PENDING_SIGN' || (c.depositPaid && !c.signedElectronically && c.status !== 'ACTIVE')) &&
      (
        (myUname && (c.tenantUsername === myUname || c.username === myUname)) ||
        (uName && c.tenantName && (c.tenantName.toLowerCase().includes(uName) || uName.includes(c.tenantName.toLowerCase()))) ||
        (uPhone && c.tenantPhone === uPhone) ||
        (myUname === 'tenant1' && c.tenantName?.toLowerCase().includes('an')) ||
        (myUname === 'tenant2' && c.tenantName?.toLowerCase().includes('cường')) ||
        (myUname === 'tenant_new' && c.tenantName?.toLowerCase().includes('nam'))
      )
    );
    if (hasPendingContract) {
      return null;
    }

    // Helper: kiểm tra người dùng này đã rời/trả phòng này chưa
    const hasLeftThisRoom = (targetRoom) => {
      if (!targetRoom) return false;

      // 0A. Nếu khách đang có HỢP ĐỒNG ACTIVE thực sự đối với phòng này -> Không tính là đã rời phòng
      const hasActiveContract = (contracts || []).some((c) => {
        if (c.status !== 'ACTIVE' && c.status !== 'CHECKOUT_REQUESTED' && c.status !== 'PENDING_TERMINATION') return false;
        if (!isSameRoom(c.roomNumber, targetRoom)) return false;
        const cTenant = (c.tenantName || '').toLowerCase().trim();
        const cPhone = (c.tenantPhone || '').trim();
        const cUser = (c.tenantUsername || c.username || '').toLowerCase().trim();
        return (
          (myUname && cUser === myUname) ||
          (uName && (cTenant.includes(uName) || uName.includes(cTenant))) ||
          (uPhone && cPhone === uPhone) ||
          (myUname === 'tenant1' && cTenant.includes('an')) ||
          (myUname === 'tenant2' && cTenant.includes('cường')) ||
          (myUname === 'tenant_new' && cTenant.includes('nam'))
        );
      });
      if (hasActiveContract) return false;

      // 0B. Nếu khách này vừa có đơn ROOMMATE đã được duyệt APPROVED đối với chính phòng này -> KHÔNG PHẢI RỜI PHÒNG!
      const hasRejoined = (roomRequests || []).some((rejoin) => {
        if (rejoin.status !== 'APPROVED') return false;
        if (rejoin.type !== 'ROOMMATE' && rejoin.type !== 'JOIN_ROOM') return false;
        if (!isSameRoom(rejoin.targetRoom || rejoin.roomNumber, targetRoom)) return false;
        const reTenant = (rejoin.tenant || rejoin.tenantName || '').toLowerCase().trim();
        const reUser = (rejoin.username || '').toLowerCase().trim();
        const matchRejoin = Boolean(
          (myUname && reUser === myUname) ||
          (uName && reTenant && (reTenant.includes(uName) || uName.includes(reTenant))) ||
          (myUname === 'tenant2' && reTenant.includes('cường')) ||
          (myUname === 'tenant_new' && reTenant.includes('nam'))
        );
        return matchRejoin;
      });
      if (hasRejoined) return false;

      // 0B. Nếu có bản ghi ACTIVE trong roomMembers -> Không tính là đã rời phòng
      const hasActiveRecord = (roomMembers || []).some((m) => {
        if (!isSameRoom(m.roomNumber, targetRoom) || m.status !== 'ACTIVE') return false;
        const mName = (m.fullName || '').toLowerCase().trim();
        return (
          (uPhone && m.phone === uPhone) ||
          (uName && mName && (mName === uName || mName.includes(uName) || uName.includes(mName))) ||
          (myUname === 'tenant2' && mName.includes('cường')) ||
          (myUname === 'tenant1' && mName.includes('an')) ||
          (myUname === 'tenant_new' && mName.includes('nam'))
        );
      });
      if (hasActiveRecord) return false;

      // 0C. Nếu trong tenantRooms khách này đang có targetRoom -> Không tính là đã rời phòng
      if (myUname === 'tenant2' || uName.includes('cường')) {
        const cRooms = tenantRooms?.tenant2 || tenantRooms?.['Phạm Minh Cường'];
        if (Array.isArray(cRooms) && cRooms.some(r => isSameRoom(r, targetRoom))) return false;
      }
      if (myUname === 'tenant1' || uName.includes('an')) {
        const aRooms = tenantRooms?.tenant1 || tenantRooms?.['Nguyễn Văn An'];
        if (Array.isArray(aRooms) && aRooms.some(r => isSameRoom(r, targetRoom))) return false;
      }
      if (myUname === 'tenant_new' || uName.includes('nam')) {
        const nRooms = tenantRooms?.tenant_new || tenantRooms?.['Hoàng Văn Nam'];
        if (Array.isArray(nRooms) && nRooms.some(r => isSameRoom(r, targetRoom))) return false;
      }

      return (roomRequests || []).some((r) => {
        const isExitType = r.type === 'LEAVE_ROOM' || r.type === 'CHECKOUT' || r.type === 'RETURN';
        const isApprovedOrSettled = r.status === 'APPROVED' || r.status === 'CHECKOUT_SETTLED' || r.status === 'SETTLED' || Boolean(r.settledAt);
        if (!isExitType || !isApprovedOrSettled) return false;
        const reqRoom = r.targetRoom || r.currentRoom || r.roomNumber;
        if (!isSameRoom(reqRoom, targetRoom)) return false;
        const rTenant = (r.tenant || r.tenantName || '').toLowerCase().trim();
        const rPhone = (r.phone || r.tenantPhone || '').trim();
        const rUsername = (r.username || '').toLowerCase().trim();
        const matchUser = Boolean(myUname && rUsername === myUname);
        const matchPhone = Boolean(uPhone && rPhone === uPhone);
        const matchName = Boolean(
          uName && rTenant && (
            rTenant === uName ||
            rTenant.includes(uName) ||
            uName.includes(rTenant) ||
            (uName.includes('an') && rTenant.includes('an')) ||
            (uName.includes('cường') && rTenant.includes('cường')) ||
            (uName.includes('nam') && rTenant.includes('nam'))
          )
        );
        const matchQuick = Boolean(
          (myUname === 'tenant1' && rTenant.includes('an')) ||
          (myUname === 'tenant2' && rTenant.includes('cường')) ||
          (myUname === 'tenant_new' && rTenant.includes('nam'))
        );
        return matchUser || matchPhone || matchName || matchQuick;
      });
    };

    // A. Nguồn sự thật 1: Thành viên phòng trong roomMembers với status === 'ACTIVE'
    const activeMember = (roomMembers || []).find((m) => {
      if (m.status === 'MOVED_OUT' || m.status === 'INACTIVE' || hasLeftThisRoom(m.roomNumber)) return false;
      const mName = (m.fullName || '').toLowerCase().trim();
      const mPhone = (m.phone || '').trim();
      const matchName = Boolean(
        uName && mName && (
          mName === uName ||
          mName.includes(uName) ||
          uName.includes(mName) ||
          (uName.includes('an') && mName.includes('an')) ||
          (uName.includes('cường') && mName.includes('cường')) ||
          (uName.includes('nam') && mName.includes('nam'))
        )
      );
      const matchPhone = Boolean(uPhone && mPhone && uPhone === mPhone);
      const matchUsername = (
        (myUname === 'tenant1' && mName.includes('an')) ||
        (myUname === 'tenant2' && mName.includes('cường')) ||
        (myUname === 'tenant_new' && mName.includes('nam'))
      );
      return matchName || matchPhone || matchUsername;
    });
    if (activeMember?.roomNumber && !hasLeftThisRoom(activeMember.roomNumber)) return activeMember.roomNumber;

    // B. Nguồn sự thật 2: Hợp đồng ACTIVE của chính khách này
    const activeContract = (contracts || []).find((c) => {
      if (c.status !== 'ACTIVE' || hasLeftThisRoom(c.roomNumber)) return false;
      const cTenant = (c.tenantName || '').toLowerCase().trim();
      const cPhone = (c.tenantPhone || '').trim();
      const cUser = (c.tenantUsername || c.username || '').toLowerCase().trim();
      return (
        (myUname && cUser === myUname) ||
        (uName && (cTenant.includes(uName) || uName.includes(cTenant))) ||
        (uPhone && cPhone === uPhone) ||
        (myUname === 'tenant1' && cTenant.includes('an')) ||
        (myUname === 'tenant2' && cTenant.includes('cường')) ||
        (myUname === 'tenant_new' && cTenant.includes('nam'))
      );
    });
    if (activeContract?.roomNumber && !hasLeftThisRoom(activeContract.roomNumber)) return activeContract.roomNumber;

    // C. Nguồn sự thật 3: Đơn ở ghép (ROOMMATE / JOIN_ROOM) đã được Quản lý duyệt APPROVED
    const approvedRoommate = (roomRequests || []).find((r) => {
      if (r.status !== 'APPROVED') return false;
      if (r.type !== 'ROOMMATE' && r.type !== 'JOIN_ROOM') return false;
      const targetR = r.targetRoom || r.roomNumber;
      if (hasLeftThisRoom(targetR)) return false;
      const rName = (r.tenant || '').toLowerCase().trim();
      const rPhone = (r.phone || '').trim();
      return (
        (uName && rName && (rName.includes(uName) || uName.includes(rName))) ||
        (uPhone && rPhone && uPhone === rPhone) ||
        (myUname === 'tenant2' && rName.includes('cường')) ||
        (myUname === 'tenant_new' && rName.includes('nam'))
      );
    });
    if (approvedRoommate?.targetRoom && !hasLeftThisRoom(approvedRoommate.targetRoom)) return approvedRoommate.targetRoom;

    // D. Nguồn sự thật 4: tenantRooms từ AuthContext
    let stored = myUname && tenantRooms?.[myUname] !== undefined
      ? tenantRooms[myUname]
      : (user?.fullName && tenantRooms?.[user.fullName] !== undefined ? tenantRooms[user.fullName] : undefined);
    if (!stored) {
      if (myUname === 'tenant2' || uName.includes('cường')) {
        stored = tenantRooms?.tenant2 || tenantRooms?.['Phạm Minh Cường'];
      } else if (myUname === 'tenant1' || uName.includes('an')) {
        stored = tenantRooms?.tenant1 || tenantRooms?.['Nguyễn Văn An'];
      } else if (myUname === 'tenant_new' || uName.includes('nam')) {
        stored = tenantRooms?.tenant_new || tenantRooms?.['Hoàng Văn Nam'];
      }
    }
    const storedList = (Array.isArray(stored) ? stored : (stored ? [stored] : [])).filter((rn) => !hasLeftThisRoom(rn));
    if (storedList.length > 0) return storedList[0];

    // E. Fallback user.rooms / user.room
    const fallbackRooms = Array.isArray(user?.rooms) ? user.rooms : (user?.room ? [user.room] : []);
    const validFallback = fallbackRooms.filter((rn) => !hasLeftThisRoom(rn));
    if (validFallback.length > 0) return validFallback[0];

    return null;
  }, [user, roomMembers, contracts, roomRequests, tenantRooms]);

  // Tìm hợp đồng của khách thuê
  const myContract = useMemo(() => {
    const list = contracts || [];
    const uName = (user?.fullName || '').toLowerCase().trim();
    const uPhone = (user?.phone || '').trim();
    const uUsername = (user?.username || '').toLowerCase().trim();

    const matchesUser = (c) => {
      if (!c) return false;
      const cTenant = (c.tenantName || '').toLowerCase().trim();
      const cPhone = (c.tenantPhone || '').trim();
      const cUser = (c.tenantUsername || c.username || '').toLowerCase().trim();
      return (
        (uUsername && cUser === uUsername) ||
        (uName && (cTenant.includes(uName) || uName.includes(cTenant))) ||
        (uPhone && cPhone === uPhone) ||
        (uUsername === 'tenant1' && cTenant.includes('an')) ||
        (uUsername === 'tenant2' && cTenant.includes('cường'))
      );
    };

    // 1. ƯU TIÊN SỐ 1 TUYỆT ĐỐI: Hợp đồng đang chờ nộp cọc hoặc chờ ký HĐ điện tử của chính khách này
    // (PENDING_DEPOSIT hoặc PENDING_SIGN hoặc chưa ký điện tử)
    const pendingContract = list.find((c) =>
      (c.status === 'PENDING_DEPOSIT' || c.status === 'PENDING_SIGN' || (c.depositPaid && !c.signedElectronically && c.status !== 'ACTIVE')) &&
      matchesUser(c)
    );
    if (pendingContract) {
      return pendingContract;
    }

    // 2. Nếu khách có đơn thuê phòng đã được Staff APPROVED mà chưa có hợp đồng Onboarding
    if (hasApprovedRentalRequest) {
      const matchApproved = list.find((c) =>
        isSameRoom(c.roomNumber, hasApprovedRentalRequest.targetRoom) && matchesUser(c)
      );
      if (matchApproved && matchApproved.status !== 'ACTIVE') {
        return matchApproved;
      }
      if (!matchApproved) {
        const targetRoomObj = (rooms || []).find(r => isSameRoom(r.number, hasApprovedRentalRequest.targetRoom));
        const price = targetRoomObj?.price || 2800000;
        const defaultHouseCode = targetRoomObj?.houseCode || 'CS-01';
        const defaultHouseName = targetRoomObj?.house || 'Nhà Trọ Cầu Giấy - Cơ Sở 1';
        return {
          id: Date.now(),
          contractCode: `HD-2026-${String(Date.now()).slice(-4)}`,
          roomNumber: hasApprovedRentalRequest.targetRoom || 'P.101',
          houseCode: hasApprovedRentalRequest.houseCode || defaultHouseCode,
          houseName: hasApprovedRentalRequest.house || defaultHouseName,
          tenantName: user?.fullName || hasApprovedRentalRequest.tenant || 'Khách thuê',
          tenantPhone: user?.phone || hasApprovedRentalRequest.phone || '0987.654.321',
          startDate: new Date().toLocaleDateString('vi-VN'),
          endDate: '31/12/2026',
          rentalPrice: price,
          depositAmount: price,
          status: 'PENDING_DEPOSIT',
          depositPaid: false,
          signedElectronically: false,
          holdingUntil: Date.now() + 15 * 60 * 1000
        };
      }
    }

    // 3. Nếu khách có phòng đang ở thực tế và hợp đồng ACTIVE thực sự
    if (resolvedActiveRoom) {
      const activeMatch = list.find((c) =>
        isSameRoom(c.roomNumber, resolvedActiveRoom) && c.status === 'ACTIVE' && matchesUser(c)
      );
      if (activeMatch) {
        return activeMatch;
      }

      // Chỉ fallback nếu khách thực sự không có hợp đồng pending nào
      const targetRoomObj = (rooms || []).find(r => isSameRoom(r.number, resolvedActiveRoom) && (!user?.houseCode || isSameHouse(r.houseCode, user.houseCode)));
      return {
        id: `HD-ACTIVE-${resolvedActiveRoom}`,
        contractCode: `HD-2026-${String(resolvedActiveRoom).replace(/[^0-9]/g, '') || '102'}`,
        roomNumber: resolvedActiveRoom,
        houseCode: targetRoomObj?.houseCode || user?.houseCode || 'CS-01',
        houseName: targetRoomObj?.house || user?.houseName || 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
        tenantName: user?.fullName || 'Nguyễn Văn An',
        tenantPhone: user?.phone || '0987.654.321',
        startDate: '01/01/2026',
        endDate: '31/12/2026',
        rentalPrice: targetRoomObj?.price || 3500000,
        depositAmount: targetRoomObj?.price || 3500000,
        status: 'ACTIVE',
        depositPaid: true,
        signedElectronically: true
      };
    }

    // 4. Tìm hợp đồng thông thường (ACTIVE hoặc khác) của chính khách này
    return list.find(matchesUser) || null;
  }, [contracts, user, resolvedActiveRoom, hasApprovedRentalRequest, rooms]);

  // Kiểm tra hợp đồng đang chờ nộp cọc hoặc chờ ký:
  const isContractPending = Boolean(
    myContract &&
    myContract.status !== 'ACTIVE' &&
    myContract.status !== 'CANCELLED' &&
    myContract.status !== 'TERMINATED' &&
    myContract.status !== 'COMPLETED' && (
      myContract.status === 'PENDING_DEPOSIT' ||
      myContract.status === 'PENDING_SIGN' ||
      !myContract.signedElectronically ||
      Boolean(hasApprovedRentalRequest)
    )
  );

  // Đơn đăng ký thuê phòng đang chờ Quản lý duyệt hồ sơ
  const myPendingRentalRequest = useMemo(() => {
    const uName = (user?.fullName || '').toLowerCase().trim();
    const uPhone = (user?.phone || '').trim();
    const uUsername = (user?.username || '').toLowerCase().trim();
    return (roomRequests || []).find((r) => {
      const isRent = (r.type === 'RENT' || r.type === 'NEW_RENT');
      if (!isRent || r.status !== 'PENDING') return false;
      const rTenant = (r.tenant || r.tenantName || '').toLowerCase().trim();
      const rPhone = (r.phone || r.tenantPhone || '').trim();
      const rUsername = (r.username || '').toLowerCase().trim();
      return (
        (uUsername && rUsername === uUsername) ||
        (uName && (rTenant.includes(uName) || uName.includes(rTenant))) ||
        (uPhone && rPhone === uPhone)
      );
    });
  }, [user, roomRequests]);

  // Đếm ngược thời hạn nộp cọc giữ phòng (Countdown Timer cho Onboarding Gate)
  // Reset trạng thái nộp cọc khi đổi hợp đồng / tài khoản
  useEffect(() => {
    // Chỉ coi là đã nộp cọc khi hợp đồng hiện tại thực sự đã nộp cọc (depositPaid === true hoặc PENDING_SIGN)
    // hoặc có cờ nộp cọc theo đúng ID hợp đồng này
    const isPaidThisContract = Boolean(
      myContract?.depositPaid ||
      myContract?.status === 'PENDING_SIGN' ||
      (myContract?.id && localStorage.getItem(`rental_deposit_paid_${myContract.id}`) === 'true')
    );
    setIsDepositPaid(isPaidThisContract);
    setSepayDepositStatusMsg(null);
  }, [myContract?.id, myContract?.status, myContract?.depositPaid]);

  const [holdingSecondsLeft, setHoldingSecondsLeft] = useState(15 * 60);

  useEffect(() => {
    if (!isContractPending || !myContract) return;
    const targetRoomNum = myContract.roomNumber || 'P.102';
    const holdingUntil = myContract.holdingUntil ||
      rooms?.find(r => r.number === targetRoomNum && (!myContract.houseCode || r.houseCode === myContract.houseCode))?.holdingUntil ||
      (Date.now() + 15 * 60 * 1000);

    const update = () => {
      const remaining = Math.max(0, Math.floor((holdingUntil - Date.now()) / 1000));
      setHoldingSecondsLeft(remaining);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isContractPending, myContract, rooms]);

  const formatCountdown = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getDeadlineString = (targetTs) => {
    if (!targetTs) return '';
    const d = new Date(targetTs);
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${mins} ngày ${day}/${month}/${year}`;
  };

  const handleCancelHoldRoom = (roomNum, houseCode) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy giữ chỗ phòng ${roomNum}? Phòng sẽ được tự động mở lại trên sàn cho khách khác thuê.`)) {
      const uUsername = user?.username || 'tenant1';
      const uFullName = user?.fullName || myContract?.tenantName || 'Nguyễn Văn An';

      if (cancelRoomHold) {
        cancelRoomHold(roomNum, houseCode, {
          tenantName: uFullName,
          tenantPhone: user?.phone || myContract?.tenantPhone,
          username: uUsername,
          contractId: myContract?.id
        });
      }

      if (updateTenantRoom) {
        updateTenantRoom(uUsername, [], 'SET');
        if (uFullName) updateTenantRoom(uFullName, [], 'SET');
      }

      // Xóa phòng trong localStorage rental_tenant_rooms ngay lập tức
      try {
        const s = localStorage.getItem('rental_tenant_rooms');
        const parsed = s ? JSON.parse(s) : {};
        if (uUsername) parsed[uUsername] = [];
        if (uFullName) parsed[uFullName] = [];
        if (uUsername === 'tenant1' || uFullName.toLowerCase().includes('an')) {
          parsed.tenant1 = [];
          parsed['Nguyễn Văn An'] = [];
        } else if (uUsername === 'tenant2' || uFullName.toLowerCase().includes('cường')) {
          parsed.tenant2 = [];
          parsed['Phạm Minh Cường'] = [];
        }
        localStorage.setItem('rental_tenant_rooms', JSON.stringify(parsed));
      } catch { }

      setPaySuccessToast(`Đã hủy giữ chỗ phòng ${roomNum} thành công! Phòng đã được mở lại trên hệ thống.`);
      setTimeout(() => {
        setPaySuccessToast(null);
      }, 3000);
    }
  };

  const myRoomNumber = resolvedActiveRoom || null;

  const currentTenant = useMemo(() => {
    const userFullName = user?.fullName || '';
    const hasRealName = userFullName && userFullName !== 'tenant' && userFullName !== 'tenant1' && userFullName !== 'Khách thuê';

    let matched = null;
    if (hasRealName) {
      matched = tenants.find((t) =>
        t.fullName?.toLowerCase().includes(userFullName.toLowerCase()) ||
        userFullName.toLowerCase().includes(t.fullName?.toLowerCase())
      );
    }

    if (!matched && user?.username) {
      if (user.username === 'tenant' || user.username === 'tenant1') {
        matched = tenants.find((t) => t.fullName?.includes('An') || t.id === 1);
      } else if (user.username === 'tenant2') {
        matched = tenants.find((t) => t.fullName?.includes('Cường') || t.id === 3);
      } else if (user.username === 'tenant_new') {
        matched = tenants.find((t) => t.fullName?.includes('Nam') || t.id === 7);
      }
    }

    return {
      id: matched?.id || 1,
      fullName: matched?.fullName || (hasRealName ? userFullName : 'Nguyễn Văn An'),
      phone: matched?.phone || user?.phone || '0987.654.321',
      cccd: matched?.cccd || user?.cccd || '001201012345',
      email: matched?.email || user?.email || 'an.nguyen@rental.vn',
      hometown: matched?.hometown || user?.hometown || 'Nam Định',
      contractStart: matched?.contractStart || '01/01/2026',
      contractEnd: matched?.contractEnd || '31/12/2026'
    };
  }, [tenants, user]);

  const currentRoomObj = useMemo(() => {
    const targetHouse = myContract?.houseCode || currentTenant?.houseCode || user?.houseCode || (user?.username === 'tenant_new' ? 'CS-02' : 'CS-01');
    if (targetHouse && myRoomNumber) {
      const match = rooms.find((r) => r.number === myRoomNumber && r.houseCode === targetHouse);
      if (match) return match;
    }
    const mem = (roomMembers || []).find((m) => m.roomNumber === myRoomNumber && m.status !== 'MOVED_OUT');
    if (mem?.houseCode && myRoomNumber) {
      const match = rooms.find((r) => r.number === myRoomNumber && r.houseCode === mem.houseCode);
      if (match) return match;
    }
    return (
      (targetHouse ? rooms.find((r) => r.number === myRoomNumber && r.houseCode === targetHouse) : null) ||
      rooms.find((r) => r.number === myRoomNumber) || {
        id: 101,
        number: myRoomNumber,
        house: targetHouse === 'CS-02' ? 'Nhà Trọ Bách Khoa - Cơ Sở 2' : 'Cơ Sở 1 - Cầu Giấy',
        houseCode: targetHouse || 'CS-01',
        floor: 'Tầng 1',
        price: 2800000,
        area: 25,
        maxOccupants: 2,
        occupants: 1,
        status: 'OCCUPIED'
      }
    );
  }, [rooms, myRoomNumber, myContract, currentTenant, user, roomMembers]);

  // Danh sách toàn bộ cư dân thực tế đang ở trong phòng (Bất kể Khách 1 hay Khách 2 đăng nhập đều xem đúng danh sách này)
  const currentRoomResidents = useMemo(() => {
    if (!myRoomNumber) return [];
    const targetHouse = normalizeHouseCode(currentRoomObj?.houseCode || myContract?.houseCode || user?.houseCode || 'CS-01');

    // Helper: kiểm tra xem người này có đơn rời / trả phòng đã duyệt cho phòng này không
    const hasLeftRoom = (personName, personPhone) => {
      const pName = (personName || '').toLowerCase().trim();
      const pPhone = (personPhone || '').trim();

      // 0. Nếu người này có đơn xin ở ghép (ROOMMATE/JOIN_ROOM) hoặc thuê phòng (RENT) đã được DUYỆT (APPROVED) đối với phòng này -> KHÔNG PHẢI ĐÃ RỜI PHÒNG!
      const hasRejoined = (roomRequests || []).some((rejoin) => {
        if (rejoin.status !== 'APPROVED') return false;
        if (rejoin.type !== 'ROOMMATE' && rejoin.type !== 'JOIN_ROOM' && rejoin.type !== 'RENT' && rejoin.type !== 'NEW_RENT') return false;
        if (!isSameRoom(rejoin.targetRoom || rejoin.roomNumber, myRoomNumber)) return false;
        if (rejoin.houseCode && !isSameHouse(rejoin.houseCode, targetHouse)) return false;
        const reTenant = (rejoin.tenant || rejoin.tenantName || '').toLowerCase().trim();
        const rePhone = (rejoin.phone || rejoin.tenantPhone || '').trim();
        return (
          (pName && reTenant && (reTenant.includes(pName) || pName.includes(reTenant))) ||
          (pName.includes('cường') && reTenant.includes('cường')) ||
          (pName.includes('an') && reTenant.includes('an')) ||
          (pName.includes('nam') && reTenant.includes('nam')) ||
          (pPhone && rePhone && pPhone === rePhone)
        );
      });
      if (hasRejoined) return false;

      // 0.1 Nếu trong tenantRooms / rental_tenant_rooms người này đang được gán phòng này -> KHÔNG PHẢI ĐÃ RỜI PHÒNG!
      if (pName.includes('cường')) {
        const cRooms = tenantRooms?.tenant2 || tenantRooms?.['Phạm Minh Cường'];
        if (Array.isArray(cRooms) && cRooms.some(r => isSameRoom(r, myRoomNumber))) return false;
      }
      if (pName.includes('an')) {
        const aRooms = tenantRooms?.tenant1 || tenantRooms?.['Nguyễn Văn An'];
        if (Array.isArray(aRooms) && aRooms.some(r => isSameRoom(r, myRoomNumber))) return false;
      }
      if (pName.includes('nam')) {
        const nRooms = tenantRooms?.tenant_new || tenantRooms?.['Hoàng Văn Nam'];
        if (Array.isArray(nRooms) && nRooms.some(r => isSameRoom(r, myRoomNumber))) return false;
      }

      // 0.2 Nếu trong roomMembers người này đang có bản ghi ACTIVE -> KHÔNG PHẢI ĐÃ RỜI PHÒNG!
      const hasActiveInRoomMembers = (roomMembers || []).some((m) => {
        if (!isSameRoom(m.roomNumber, myRoomNumber) || m.status !== 'ACTIVE') return false;
        if (m.houseCode && !isSameHouse(m.houseCode, targetHouse)) return false;
        const mName = (m.fullName || '').toLowerCase().trim();
        return (
          (pName && mName && (mName === pName || mName.includes(pName) || pName.includes(mName))) ||
          (pName.includes('cường') && mName.includes('cường')) ||
          (pName.includes('an') && mName.includes('an')) ||
          (pName.includes('nam') && mName.includes('nam')) ||
          (pPhone && m.phone && m.phone === pPhone)
        );
      });
      if (hasActiveInRoomMembers) return false;

      return (roomRequests || []).some(
        (req) =>
          (req.type === 'CHECKOUT' || req.type === 'LEAVE_ROOM' || req.type === 'RETURN') &&
          isSameRoom(req.targetRoom || req.currentRoom || req.roomNumber, myRoomNumber) &&
          (!req.houseCode || isSameHouse(req.houseCode, targetHouse)) &&
          (req.status === 'APPROVED' || req.status === 'CHECKOUT_SETTLED' || req.status === 'SETTLED' || Boolean(req.settledAt)) &&
          (
            (pName && req.tenant && ((req.tenant || '').toLowerCase().includes(pName) || pName.includes((req.tenant || '').toLowerCase()))) ||
            (pName.includes('nam') && (req.tenant || '').toLowerCase().includes('nam')) ||
            (pName.includes('cường') && (req.tenant || '').toLowerCase().includes('cường')) ||
            (pName.includes('an') && (req.tenant || '').toLowerCase().includes('an')) ||
            (pPhone && req.phone && req.phone === pPhone)
          )
      );
    };

    // 1. Lọc tất cả thành viên trong roomMembers của đúng phòng và cơ sở này, LOẠI BỎ người đã rời/trả phòng
    let mems = (roomMembers || []).filter((m) => {
      const matchRoom = isSameRoom(m.roomNumber, myRoomNumber);
      const matchHouse = isSameHouse(m.houseCode || 'CS-01', targetHouse);
      if (!matchRoom || !matchHouse || m.status === 'MOVED_OUT' || m.status === 'INACTIVE') return false;

      // Loại bỏ nếu thành viên có đơn CHECKOUT / LEAVE_ROOM đã được duyệt của ĐÚNG phòng này
      if (hasLeftRoom(m.fullName, m.phone)) return false;

      // ĐỐI SOÁT CHÉO CƠ SỞ: Người này có hợp đồng ACTIVE ở cơ sở KHÁC không?
      // Nếu một khách (vd: Cường) đang đứng tên hợp đồng ACTIVE ở cơ sở khác (vd: Đống Đa),
      // thì TUYỆT ĐỐI không thể là bạn ở ghép trong phòng này ở Cầu Giấy!
      const mNameNorm = (m.fullName || '').toLowerCase().trim();
      const hasContractInOtherHouse = (contracts || []).some((c) => {
        if (c.status !== 'ACTIVE') return false;
        const cTenant = (c.tenantName || '').toLowerCase().trim();
        const isThisTenant = (cTenant && (cTenant.includes(mNameNorm) || mNameNorm.includes(cTenant))) ||
          (mNameNorm.includes('cường') && cTenant.includes('cường')) ||
          (mNameNorm.includes('an') && cTenant.includes('an')) ||
          (m.phone && c.tenantPhone && m.phone === c.tenantPhone);
        return isThisTenant && c.houseCode && !isSameHouse(c.houseCode, targetHouse);
      });
      if (hasContractInOtherHouse) return false;

      return true;
    });

    // 2. Bổ sung các đơn ở ghép (ROOMMATE / JOIN_ROOM) đã được Quản lý duyệt APPROVED của phòng này
    (roomRequests || []).forEach((req) => {
      const isRoommate = req.type === 'ROOMMATE' || req.type === 'JOIN_ROOM';
      const matchRoom = isSameRoom(req.targetRoom || req.roomNumber, myRoomNumber);
      const matchHouse = !req.houseCode || isSameHouse(req.houseCode, targetHouse);
      if (isRoommate && matchRoom && matchHouse && req.status === 'APPROVED' && req.tenant && req.status !== 'SETTLED') {
        // TUYỆT ĐỐI KHÔNG BỔ SUNG NẾU NGƯỜI NÀY ĐÃ RỜI PHÒNG!
        if (hasLeftRoom(req.tenant, req.phone)) return;

        const alreadyIn = mems.some((m) =>
          (m.fullName || '').toLowerCase().includes(req.tenant.toLowerCase()) ||
          req.tenant.toLowerCase().includes((m.fullName || '').toLowerCase()) ||
          (req.tenant.toLowerCase().includes('nam') && (m.fullName || '').toLowerCase().includes('nam')) ||
          (req.tenant.toLowerCase().includes('cường') && (m.fullName || '').toLowerCase().includes('cường')) ||
          (req.tenant.toLowerCase().includes('an') && (m.fullName || '').toLowerCase().includes('an'))
        );
        if (!alreadyIn) {
          const isCuong = req.tenant.toLowerCase().includes('cường');
          mems.push({
            id: `RM-req-${req.id || Date.now()}`,
            roomNumber: myRoomNumber,
            houseCode: targetHouse,
            fullName: req.tenant,
            phone: req.phone || (isCuong ? '0912.888.999' : '0966.123.456'),
            cccd: req.cccd || (isCuong ? '034203034567' : '036207078901'),
            maskedCccd: req.cccd ? req.cccd.slice(0, 8) + '****' : (isCuong ? '03420303****' : '03620707****'),
            roleInRoom: 'MEMBER',
            hometown: isCuong ? 'Hải Phòng' : 'Nam Định',
            joinDate: req.date || new Date().toLocaleDateString('vi-VN'),
            temporaryResidenceStatus: 'REGISTERED',
            status: 'ACTIVE'
          });
        }
      }
    });

    // 3. Đảm bảo đầy đủ cả Khách 1 và Khách 2 khi đang ở phòng P.102 (chỉ thêm nếu chưa rời phòng)
    if (isSameRoom(myRoomNumber, 'P.102')) {
      if (!hasLeftRoom('Nguyễn Văn An', '0987.654.321')) {
        const hasAn = mems.some(m => (m.fullName || '').toLowerCase().includes('an'));
        if (!hasAn) {
          mems.unshift({
            id: 'RM-an-102',
            roomNumber: 'P.102',
            houseCode: targetHouse,
            fullName: 'Nguyễn Văn An',
            phone: '0987.654.321',
            cccd: '001201012345',
            maskedCccd: '00120101****',
            roleInRoom: 'REPRESENTATIVE',
            hometown: 'Nam Định',
            joinDate: '01/01/2026',
            temporaryResidenceStatus: 'REGISTERED',
            status: 'ACTIVE'
          });
        }
      }

      const isCuongIn102 = Boolean(
        (roomRequests || []).some(r =>
          r.status === 'APPROVED' &&
          (r.type === 'ROOMMATE' || r.type === 'JOIN_ROOM') &&
          isSameRoom(r.targetRoom || r.roomNumber, 'P.102') &&
          isSameHouse(r.houseCode || targetHouse, targetHouse) &&
          (r.tenant || '').toLowerCase().includes('cường')
        ) ||
        (tenantRooms?.tenant2 && Array.isArray(tenantRooms.tenant2) && tenantRooms.tenant2.some(r => isSameRoom(r, 'P.102'))) ||
        (tenantRooms?.['Phạm Minh Cường'] && Array.isArray(tenantRooms['Phạm Minh Cường']) && tenantRooms['Phạm Minh Cường'].some(r => isSameRoom(r, 'P.102')))
      );

      if (isCuongIn102 && !hasLeftRoom('Phạm Minh Cường', '0912.888.999')) {
        const hasCuong = mems.some(m => (m.fullName || '').toLowerCase().includes('cường'));
        if (!hasCuong) {
          mems.push({
            id: 'RM-cuong-102',
            roomNumber: 'P.102',
            houseCode: targetHouse,
            fullName: 'Phạm Minh Cường',
            phone: '0912.888.999',
            cccd: '034203034567',
            maskedCccd: '03420303****',
            roleInRoom: 'MEMBER',
            hometown: 'Hải Phòng',
            joinDate: '07/11/2026',
            temporaryResidenceStatus: 'REGISTERED',
            status: 'ACTIVE'
          });
        }
      }
    }

    // 4. Nếu user đang đăng nhập chính là cư dân phòng này mà chưa có trong danh sách -> Bổ sung vào
    const curUName = (user?.fullName || '').toLowerCase().trim();
    const userMatchHouse = !user?.houseCode || isSameHouse(user.houseCode, targetHouse);
    if (curUName && userMatchHouse && (isSameRoom(resolvedActiveRoom, myRoomNumber) || user?.rooms?.some(r => isSameRoom(r, myRoomNumber)))) {
      if (!hasLeftRoom(user?.fullName, user?.phone)) {
        const isAlreadyIn = mems.some((m) =>
          (m.fullName || '').toLowerCase().includes(curUName) ||
          curUName.includes((m.fullName || '').toLowerCase())
        );
        if (!isAlreadyIn) {
          const isAn = curUName.includes('an');
          mems.push({
            id: `RM-cur-${user?.id || Date.now()}`,
            roomNumber: myRoomNumber,
            houseCode: targetHouse,
            fullName: user?.fullName || 'Cư dân',
            phone: user?.phone || (isAn ? '0987.654.321' : '0912.888.999'),
            cccd: user?.cccd || (isAn ? '001201012345' : '031201019999'),
            maskedCccd: user?.cccd ? user.cccd.slice(0, 8) + '****' : (isAn ? '00120101****' : '03120101****'),
            roleInRoom: isAn ? 'REPRESENTATIVE' : 'MEMBER',
            hometown: user?.hometown || (isAn ? 'Nam Định' : 'Hải Phòng'),
            joinDate: '01/01/2026',
            temporaryResidenceStatus: 'REGISTERED',
            status: 'ACTIVE'
          });
        }
      }
    }

    // 5. Tìm Hợp đồng ACTIVE của phòng này: ƯU TIÊN hợp đồng của chính user đang đăng nhập
    const uName = (user?.fullName || '').toLowerCase().trim();
    const myMatchContract = (contracts || []).find((c) => {
      const matchRoom = isSameRoom(c.roomNumber, myRoomNumber);
      const matchHouse = !targetHouse || !c.houseCode || isSameHouse(c.houseCode, targetHouse);
      const cTenant = (c.tenantName || '').toLowerCase().trim();
      const isMyContract = uName && (cTenant.includes(uName) || uName.includes(cTenant));
      return matchRoom && matchHouse && c.status === 'ACTIVE' && isMyContract;
    });

    const activeContract = myMatchContract || (contracts || []).find((c) => {
      const matchRoom = isSameRoom(c.roomNumber, myRoomNumber);
      const matchHouse = !targetHouse || !c.houseCode || isSameHouse(c.houseCode, targetHouse);
      if (c.status !== 'ACTIVE') return false;
      return true;
    });

    if (activeContract) {
      const cTenantName = (activeContract.tenantName || '').toLowerCase().trim();
      const foundIdx = mems.findIndex((m) => {
        const mName = (m.fullName || '').toLowerCase().trim();
        return mName.includes(cTenantName) || cTenantName.includes(mName);
      });

      if (foundIdx >= 0) {
        mems[foundIdx] = { ...mems[foundIdx], roleInRoom: 'REPRESENTATIVE' };
      }
    }

    // Đảm bảo có ít nhất 1 người làm REPRESENTATIVE (ưu tiên An hoặc người đứng đầu)
    const hasRep = mems.some(m => m.roleInRoom === 'REPRESENTATIVE');
    if (!hasRep && mems.length > 0) {
      const anIdx = mems.findIndex(m => (m.fullName || '').toLowerCase().includes('an'));
      if (anIdx >= 0) {
        mems[anIdx] = { ...mems[anIdx], roleInRoom: 'REPRESENTATIVE' };
      } else {
        mems[0] = { ...mems[0], roleInRoom: 'REPRESENTATIVE' };
      }
    }

    // 6. Đưa Người đại diện (REPRESENTATIVE) lên đầu danh sách, sau đó đến các Thành viên ở ghép (MEMBER)
    const sorted = [...mems].sort((a, b) => {
      if (a.roleInRoom === 'REPRESENTATIVE' && b.roleInRoom !== 'REPRESENTATIVE') return -1;
      if (b.roleInRoom === 'REPRESENTATIVE' && a.roleInRoom !== 'REPRESENTATIVE') return 1;
      return 0;
    });

    // 7. Định danh đúng Quê quán và CCCD cho từng cư dân
    return sorted.map((m) => {
      const mNameNorm = (m.fullName || '').toLowerCase().trim();
      const matchedTenant = (tenants || []).find((t) => {
        const tName = (t.fullName || '').toLowerCase().trim();
        return (tName && (tName.includes(mNameNorm) || mNameNorm.includes(tName))) || (t.phone && t.phone === m.phone);
      });

      let realHometown = m.hometown;
      if (mNameNorm.includes('an')) {
        realHometown = 'Nam Định';
      } else if (mNameNorm.includes('cường')) {
        realHometown = 'Hải Phòng';
      } else if (mNameNorm.includes('bình')) {
        realHometown = 'Hà Tĩnh';
      } else if (matchedTenant?.hometown) {
        realHometown = matchedTenant.hometown;
      }

      let realCccd = m.cccd || matchedTenant?.cccd;
      if (!realCccd || (realCccd.startsWith('03620707') && mNameNorm.includes('an'))) {
        realCccd = '001201012345';
      } else if (!realCccd || (realCccd.startsWith('03620707') && mNameNorm.includes('cường'))) {
        realCccd = '034203034567';
      }

      const masked = m.maskedCccd && !m.maskedCccd.startsWith('03620707')
        ? m.maskedCccd
        : (realCccd ? realCccd.slice(0, 8) + '****' : (mNameNorm.includes('cường') ? '03420303****' : '00120101****'));

      return {
        ...m,
        hometown: realHometown || (mNameNorm.includes('cường') ? 'Hải Phòng' : 'Nam Định'),
        phone: m.phone || matchedTenant?.phone || (mNameNorm.includes('cường') ? '0912.888.999' : '0987.654.321'),
        cccd: realCccd,
        maskedCccd: masked
      };
    });
  }, [myRoomNumber, roomMembers, contracts, currentRoomObj, myContract, tenants, roomRequests, user, resolvedActiveRoom]);

  // Kiểm tra người đang đăng nhập có phải là Người đại diện đứng tên hợp đồng hay không
  const isRepresentative = useMemo(() => {
    if (!myRoomNumber) return false;
    const uName = (user?.fullName || '').toLowerCase().trim();
    const uPhone = (user?.phone || '').trim();

    // Nếu user là Cường (tenant2 / roommate), Cường KHÔNG PHẢI người đại diện khi An chưa bàn giao!
    if (uName.includes('cường') || user?.username === 'tenant2') {
      const hasAcceptedTransferToMe = (roomRequests || []).some(
        (req) =>
          req.type === 'TRANSFER_CONTRACT' &&
          req.status === 'APPROVED' &&
          (req.toTenant || '').toLowerCase().includes(uName)
      );
      if (!hasAcceptedTransferToMe) return false;
    }

    const repMember = currentRoomResidents.find((m) => m.roleInRoom === 'REPRESENTATIVE');
    if (repMember) {
      const repName = (repMember.fullName || '').toLowerCase().trim();
      const repPhone = (repMember.phone || '').trim();
      return (uName && (repName.includes(uName) || uName.includes(repName))) || (uPhone && repPhone === uPhone);
    }

    return user?.username === 'tenant' || user?.username === 'tenant1';
  }, [user, myRoomNumber, currentRoomResidents, roomRequests]);

  // Danh sách các bạn cùng phòng khác (ngoại trừ người dùng đang đăng nhập)
  const otherRoommates = useMemo(() => {
    const uName = (user?.fullName || '').toLowerCase().trim();
    const uPhone = (user?.phone || '').trim();
    return currentRoomResidents.filter((m) => {
      const mName = (m.fullName || '').toLowerCase().trim();
      const mPhone = (m.phone || '').trim();
      const isMe = (uName && (mName.includes(uName) || uName.includes(mName))) || (uPhone && mPhone === uPhone);
      return !isMe;
    });
  }, [currentRoomResidents, user]);

  const roommates = otherRoommates;
  const maxOccupants = currentRoomObj?.maxOccupants || 2;
  const totalOccupants = currentRoomResidents.length;
  const isRoomFull = totalOccupants >= maxOccupants;
  const isLivingAlone = totalOccupants <= 1;
  const hasRoommatesInRoom = totalOccupants > 1;

  // Kiểm tra khách đã có đơn trả phòng đang chờ BQL duyệt chưa (Chống spam)
  const hasPendingCheckoutRequest = useMemo(() => {
    const uName = (user?.fullName || '').toLowerCase().trim();
    const uPhone = (user?.phone || '').trim();
    const myCleanRoom = String(myRoomNumber || '').replace(/^P\.?/i, '').trim();
    return (roomRequests || []).some((r) => {
      if (r.type !== 'CHECKOUT') return false;
      if (r.status !== 'PENDING' && r.status !== 'WAITING_ROOMMATES') return false;
      const rTenant = (r.tenant || r.tenantName || '').toLowerCase().trim();
      const rPhone = (r.phone || '').trim();
      const rRoomClean = String(r.targetRoom || r.currentRoom || r.roomNumber || '').replace(/^P\.?/i, '').trim();
      const matchTenant = (uName && (rTenant.includes(uName) || uName.includes(rTenant))) || (uPhone && rPhone === uPhone);
      const matchRoom = myCleanRoom && rRoomClean && myCleanRoom === rRoomClean;
      return matchTenant || matchRoom;
    });
  }, [user, roomRequests, myRoomNumber]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'checkout' && myRoomNumber) {
      if (isRepresentative || isLivingAlone) {
        setCheckoutModal(myRoomNumber);
        setAgreedForfeitDeposit(false);
        setCheckoutReason('');
        setCheckoutSuccess(false);
      } else {
        setLeaveModal(myRoomNumber);
        setAgreedForfeitLeave(false);
        setLeaveReason('');
        setLeaveSuccess(false);
      }
    } else if (action === 'leave' && myRoomNumber) {
      if (hasRoommatesInRoom) {
        setLeaveModal(myRoomNumber);
        setAgreedForfeitLeave(false);
        setLeaveReason('');
        setLeaveSuccess(false);
      } else {
        // Phòng ở 1 mình: tự động mở Modal Trả Toàn Bộ Phòng
        setCheckoutModal(myRoomNumber);
        setAgreedForfeitDeposit(false);
        setCheckoutReason('');
        setCheckoutSuccess(false);
      }
    }
  }, [myRoomNumber, isRepresentative, hasRoommatesInRoom, isLivingAlone]);

  const selectedLeaveRoomObj = useMemo(() => {
    if (!leaveModal) return null;
    const num = typeof leaveModal === 'string' ? leaveModal : leaveModal?.number;
    return (rooms || []).find((r) => r.number === num);
  }, [leaveModal, rooms]);

  const selectedCheckoutRoomObj = useMemo(() => {
    if (!checkoutModal) return null;
    const num = typeof checkoutModal === 'string' ? checkoutModal : checkoutModal?.number;
    return (rooms || []).find((r) => r.number === num);
  }, [checkoutModal, rooms]);

  const checkoutOccupantsCount = Math.max(selectedCheckoutRoomObj?.occupants || 1, totalOccupants, roommates.length + 1);
  const isCheckoutRoomMulti = !isLivingAlone && (checkoutOccupantsCount > 1 || roommates.length > 0);

  const unpaidInvoicesForLeave = useMemo(() => {
    if (!leaveModal) return [];
    const roomNum = typeof leaveModal === 'string' ? leaveModal : leaveModal?.number;
    const uName = (user?.fullName || '').toLowerCase().trim();
    return (invoices || []).filter((inv) => {
      if (inv.room !== roomNum || inv.status === 'PAID') return false;
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
  }, [leaveModal, invoices, user]);

  const hasUnpaidBillsForLeave = unpaidInvoicesForLeave.length > 0;
  const totalUnpaidForLeave = unpaidInvoicesForLeave.reduce((sum, inv) => sum + (inv.total || 0), 0);

  const hasUnpaidBillsForCheckout = useMemo(() => {
    if (!myRoomNumber) return false;
    if (isPeriodFeePaid) return false;
    const targetHouse = currentRoomObj?.houseCode || myContract?.houseCode || 'CS-01';
    return (invoices || []).some((inv) => {
      const matchHouse = isSameHouse(inv.houseCode || inv.house, targetHouse);
      const matchRoom = isSameRoom(inv.room, myRoomNumber);
      return matchHouse && matchRoom && inv.status !== 'PAID';
    });
  }, [myRoomNumber, invoices, currentRoomObj, myContract, isPeriodFeePaid]);

  const myActiveContract = useMemo(() => {
    if (myContract && myContract.status === 'ACTIVE') return myContract;
    return (
      contracts.find((c) => c.roomNumber === myRoomNumber && c.status === 'ACTIVE') ||
      myContract || {
        id: 'HD-2026-001',
        contractCode: 'HD-2026-001',
        roomNumber: myRoomNumber || 'P.101',
        tenantName: user?.fullName || 'Nguyễn Văn An',
        status: 'ACTIVE',
        startDate: '01/01/2026',
        endDate: '31/12/2026',
        deposit: 3500000,
        depositAmount: 3500000,
        monthlyRent: 3500000
      }
    );
  }, [contracts, myRoomNumber, myContract, user]);

  const isContractExpired = useMemo(() => {
    if (!myActiveContract || !myActiveContract.endDate) return false;
    try {
      const parts = myActiveContract.endDate.split('/');
      if (parts.length === 3) {
        const endD = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        return endD <= new Date();
      }
    } catch { }
    return false;
  }, [myActiveContract]);



  // Đơn trả phòng bị bạn cùng phòng từ chối vì muốn ở tiếp
  const rejectedCheckoutRequest = useMemo(() => {
    if (!myRoomNumber) return null;
    // NẾU PHÒNG ĐÃ CÓ ĐƠN TRẢ PHÒNG ĐÃ DUYỆT (CHECKOUT APPROVED) THÌ KHÔNG HIỂN THỊ BANNER BỊ TỪ CHỐI NÀY
    const hasApprovedCheckout = (roomRequests || []).some((req) => {
      const isTarget = req.targetRoom === myRoomNumber || req.currentRoom === myRoomNumber;
      return isTarget && (req.type === 'CHECKOUT' || req.type === 'RETURN') && (req.status === 'APPROVED' || req.settledAt);
    });
    if (hasApprovedCheckout) return null;

    return (roomRequests || []).find((req) => {
      const isTarget = req.targetRoom === myRoomNumber || req.currentRoom === myRoomNumber;
      return isTarget && req.type === 'CHECKOUT' && req.status === 'REJECTED_BY_ROOMMATES';
    });
  }, [myRoomNumber, roomRequests]);

  const [dismissedRejectedCheckoutIds, setDismissedRejectedCheckoutIds] = useState(() => {
    try {
      const saved = localStorage.getItem('rental_dismissed_rejected_checkout');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleDismissRejectedCheckout = (reqId) => {
    setDismissedRejectedCheckoutIds((prev) => {
      const updated = Array.from(new Set([...prev, reqId]));
      try {
        localStorage.setItem('rental_dismissed_rejected_checkout', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // 1. Đề xuất bàn giao hợp đồng đang gửi đến tài khoản này (Cần tài khoản này Đồng Ý hoặc Từ Chối)
  const pendingIncomingTransferProposal = useMemo(() => {
    if (!myRoomNumber) return null;
    const uName = (user?.fullName || '').toLowerCase().trim();
    return (roomRequests || []).find((req) => {
      const isTarget = req.targetRoom === myRoomNumber || req.currentRoom === myRoomNumber;
      const isToMe = (req.toTenant || '').toLowerCase().trim().includes(uName) || uName.includes((req.toTenant || '').toLowerCase().trim());
      return isTarget && req.type === 'TRANSFER_CONTRACT' && req.status === 'PENDING_ACCEPTANCE' && isToMe;
    });
  }, [myRoomNumber, roomRequests, user]);

  // 2. Đề xuất bàn giao hợp đồng do chính người này gửi đi (Đang chờ bạn cùng phòng phản hồi)
  const pendingOutgoingTransferProposal = useMemo(() => {
    if (!myRoomNumber) return null;
    const uName = (user?.fullName || '').toLowerCase().trim();
    return (roomRequests || []).find((req) => {
      const isTarget = req.targetRoom === myRoomNumber || req.currentRoom === myRoomNumber;
      const isFromMe = (req.fromTenant || '').toLowerCase().trim().includes(uName) || uName.includes((req.fromTenant || '').toLowerCase().trim());
      return isTarget && req.type === 'TRANSFER_CONTRACT' && req.status === 'PENDING_ACCEPTANCE' && isFromMe;
    });
  }, [myRoomNumber, roomRequests, user]);

  // 3. Đề xuất bàn giao hợp đồng bị bạn cùng phòng TỪ CHỐI (Kích hoạt cơ chế Deadlock-Breaker mở quyền Trả phòng khẩn cấp không cần biểu quyết)
  const rejectedTransferProposal = useMemo(() => {
    if (!myRoomNumber) return null;
    const uName = (user?.fullName || '').toLowerCase().trim();
    return (roomRequests || []).find((req) => {
      const isTarget = req.targetRoom === myRoomNumber || req.currentRoom === myRoomNumber;
      const isFromMe = (req.fromTenant || '').toLowerCase().trim().includes(uName) || uName.includes((req.fromTenant || '').toLowerCase().trim());
      return isTarget && req.type === 'TRANSFER_CONTRACT' && req.status === 'REJECTED_BY_TRANSFEREE' && isFromMe;
    });
  }, [myRoomNumber, roomRequests, user]);

  // Đơn trả phòng đang chờ bạn cùng phòng biểu quyết
  const waitingCheckoutRequest = useMemo(() => {
    if (!myRoomNumber) return null;
    return (roomRequests || []).find((req) => {
      const isTarget = isSameRoom(req.targetRoom, myRoomNumber) || isSameRoom(req.currentRoom, myRoomNumber);
      return isTarget && req.type === 'CHECKOUT' && req.status === 'WAITING_ROOMMATES' && isRepresentative;
    });
  }, [myRoomNumber, roomRequests, isRepresentative]);

  // Đơn trả phòng sẵn sàng chờ BQL nghiệm thu (ở 1 mình PENDING hoặc ở ghép ROOMMATES_APPROVED)
  const pendingInspectionCheckoutRequest = useMemo(() => {
    if (!myRoomNumber) return null;
    return (roomRequests || []).find((req) => {
      const isTarget = isSameRoom(req.targetRoom, myRoomNumber) || isSameRoom(req.currentRoom, myRoomNumber);
      return isTarget && req.type === 'CHECKOUT' && (
        req.status === 'ROOMMATES_APPROVED' || 
        (req.status === 'PENDING' && !req.hasMultiplePeople) || 
        req.isDeadlockBypass
      );
    });
  }, [myRoomNumber, roomRequests]);

  const pendingRoommateRequests = useMemo(() => {
    if (!myRoomNumber) return [];
    const uName = (user?.fullName || '').toLowerCase().trim();
    const uPhone = (user?.phone || '').trim();
    return (roomRequests || []).filter((req) => {
      const isTarget = isSameRoom(req.targetRoom, myRoomNumber) || isSameRoom(req.currentRoom, myRoomNumber);
      const isWaiting = req.status === 'WAITING_ROOMMATES';
      // Không phải do chính user này gửi đơn
      const isMyOwnRequest = (uName && (req.tenant?.toLowerCase().includes(uName) || uName.includes(req.tenant?.toLowerCase()))) ||
                             (uPhone && req.phone === uPhone);
      if (isMyOwnRequest) return false;

      const hasNotVoted = !(req.roommateVotes || []).some(
        (v) => {
          const vName = (v.voter || '').toLowerCase().trim();
          return vName === uName ||
            (uName.includes('an') && vName.includes('an')) ||
            (uName.includes('cường') && vName.includes('cường')) ||
            (uName.includes('nam') && vName.includes('nam'));
        }
      );
      return isTarget && isWaiting && hasNotVoted;
    });
  }, [myRoomNumber, roomRequests, user]);

  // Thông báo khi có thành viên ở ghép đã rời phòng (chỉ thông báo thông tin, không cần biểu quyết)
  const currentRoommateLeaveNotices = useMemo(() => {
    if (!myRoomNumber) return [];
    const norm = String(myRoomNumber).replace(/^phòng\s*/i, '').replace(/^p[\.\s_-]*/i, '').trim().toLowerCase();
    const myNameNorm = (user?.fullName || '').toLowerCase().trim();
    return (roommateLeaveNotices || []).filter((n) => {
      const nRoom = String(n.room || '').replace(/^phòng\s*/i, '').replace(/^p[\.\s_-]*/i, '').trim().toLowerCase();
      const nMem = (n.member || '').toLowerCase().trim();
      const isMe = myNameNorm && (nMem.includes(myNameNorm) || myNameNorm.includes(nMem));
      return nRoom === norm && !isMe;
    });
  }, [myRoomNumber, roommateLeaveNotices, user]);

  const handleSendLeave = (e) => {
    e.preventDefault();
    if (!leaveModal || !agreedForfeitLeave || hasUnpaidBillsForLeave) return;
    const roomNumber = typeof leaveModal === 'string' ? leaveModal : leaveModal.number;

    // NẾU LÀ NGƯỜI ĐẠI DIỆN HỢP ĐỒNG VÀ PHÒNG CÒN BẠN CÙNG PHÒNG -> GỬI ĐỀ XUẤT BÀN GIAO HỢP ĐỒNG (TWO-WAY HANDSHAKE)
    if (isRepresentative && otherRoommates.length > 0 && selectedSuccessor) {
      if (proposeContractTransfer) {
        const res = proposeContractTransfer(roomNumber, user?.fullName, selectedSuccessor, leaveReason);
        if (res?.error) {
          alert(res.message);
          return;
        }
      }
      setLeaveSuccess(true);
      return;
    }

    const res = leaveRoom(roomNumber, user?.fullName);
    if (res?.success) {
      setLeaveSuccess(true);
    } else {
      alert(res?.message || 'Không thể rời phòng do chưa hoàn tất nghĩa vụ tài chính.');
    }
  };

  const handleSendCheckout = (e) => {
    e.preventDefault();
    if (!checkoutModal || (!isContractExpired && !agreedForfeitDeposit)) return;
    const roomNumber = typeof checkoutModal === 'string' ? checkoutModal : checkoutModal.number;
    const res = submitCheckoutRequest({
      room: roomNumber,
      houseCode: myContract?.houseCode || user?.houseCode || currentRoomObj?.houseCode || 'CS-01',
      house: myContract?.houseName || user?.houseName || currentRoomObj?.house || 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
      reason: checkoutReason,
      forfeitDeposit: !isContractExpired,
      tenantName: user?.fullName || 'Khách thuê',
      phone: user?.phone || '0901234567',
      refundBank,
      refundAccountNumber,
      refundAccountName: refundAccountName || user?.fullName || 'Khách thuê',
      isContractExpired,
      bypassRoommateVoting: false
    });
    if (res?.error) {
      alert(res.message);
      return;
    }
    setCheckoutSuccess(true);
  };



  useEffect(() => {
    if (!isContractPending || !myContract) return;
    let isMounted = true;
    const targetRoomNum = myContract.roomNumber || 'P.102';
    const depositAmount = myContract.rentalPrice || myContract.depositAmount || 3500000;
    const residenceFee = 50000; // Tiền đăng ký tạm trú tạm vắng 50k
    const totalDepositAmount = depositAmount + residenceFee;
    const bankAccount = sepayConfig.accountNumber || '35825112005';

    const cleanTenantName = (user?.fullName || myContract?.tenantName || 'KHACH')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const cleanRoom = String(targetRoomNum || 'P.101').replace(/^P\.?/i, 'P').trim();
    const transferMemo = `COC ${cleanRoom} + TAM TRU TAM VANG ${cleanTenantName}`.trim();

    const checkDeposit = async () => {
      try {
        const res = await checkSePayTransaction({
          invoiceCode: transferMemo,
          amount: totalDepositAmount,
          accountNumber: bankAccount
        });
        if (res && res.success && isMounted) {
          setIsDepositPaid(true);
          setPaySuccessToast(`⚡ SePay Xác Nhận: Đã nhận ${totalDepositAmount.toLocaleString('vi-VN')} đ (Cọc + Phí Tạm Trú)! Nút Ký Hợp Đồng đã sáng lên để bạn bấm.`);
          setTimeout(() => setPaySuccessToast(null), 6000);
        }
      } catch { }
    };

    const timer = setInterval(checkDeposit, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [isContractPending, myContract, sepayConfig, user]);

  const myCurrentInvoice = useMemo(() => {
    if (!myRoomNumber || isContractPending) return null;
    return invoices.find((inv) => inv.room === myRoomNumber && (!inv.houseCode || inv.houseCode === currentRoomObj?.houseCode)) || null;
  }, [invoices, myRoomNumber, currentRoomObj, isContractPending]);

  // =========================================================================
  // 1A. GIAO DIỆN BẮT BUỘC: NỘP TIỀN CỌC & KÝ HỢP ĐỒNG ĐIỆN TỬ (ONBOARDING GATE)
  // =========================================================================
  if (isContractPending && myContract) {
    const depositAmount = myContract.rentalPrice || myContract.depositAmount || 3500000;
    const residenceFee = 50000; // Tiền đăng ký tạm trú tạm vắng 50k
    const totalDepositAmount = depositAmount + residenceFee;
    const targetRoomNum = myContract.roomNumber || 'P.102';
    const targetHouseName = myContract.houseName || 'Nhà Trọ Bách Khoa - Cơ Sở 2';
    const bankAccount = sepayConfig.accountNumber || '35825112005';
    const bankName = sepayConfig.bank || 'MBBank';
    const accountHolder = sepayConfig.accountName || 'DAM TRUNG ANH';

    const cleanTenantName = (user?.fullName || myContract?.tenantName || 'KHACH')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const cleanRoom = String(targetRoomNum || 'P.101').replace(/^P\.?/i, 'P').trim();
    const transferMemo = `COC ${cleanRoom} + TAM TRU TAM VANG ${cleanTenantName}`.trim();

    const isDepositConfirmed = Boolean(
      myContract?.depositPaid ||
      myContract?.status === 'PENDING_SIGN' ||
      isDepositPaid ||
      (myContract?.id && localStorage.getItem(`rental_deposit_paid_${myContract.id}`) === 'true')
    );

    let methodBankDisplay = `${bankName} ${bankAccount}`;
    let methodAccountHolder = accountHolder;
    let methodQrUrl = '';
    let methodBadge = 'SEPAY';
    let methodLogos = 'napas 247 | MB | VietQR';
    let methodSubtext = 'Quét QR SePay để chuyển cọc';

    if (depositPaymentMethod === 'SEPAY') {
      methodBankDisplay = `${bankName} ${bankAccount}`;
      methodAccountHolder = accountHolder;
      methodQrUrl = generateSePayQrUrl({
        accountNumber: bankAccount,
        bank: bankName,
        amount: totalDepositAmount,
        content: transferMemo,
        template: 'compact'
      });
      methodBadge = 'SEPAY';
      methodLogos = 'napas 247 | MB | VietQR';
      methodSubtext = 'Quét QR SePay để chuyển cọc';
    } else if (depositPaymentMethod === 'VNPAY') {
      methodBankDisplay = `VNPAY Gateway (MBBank ${bankAccount})`;
      methodAccountHolder = accountHolder;
      methodQrUrl = `https://api.vietqr.io/image/970422-${bankAccount}-compact.jpg?amount=${depositAmount}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(accountHolder)}`;
      methodBadge = 'VNPAY';
      methodLogos = 'VNPAY-QR | Napas | MBBank';
      methodSubtext = 'Quét VNPAY-QR để nộp cọc';
    } else if (depositPaymentMethod === 'MOMO') {
      methodBankDisplay = 'Ví MoMo (0982.511.205)';
      methodAccountHolder = accountHolder;
      methodQrUrl = `https://api.vietqr.io/image/970422-0982511205-compact.jpg?amount=${depositAmount}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(accountHolder)}`;
      methodBadge = 'MOMO';
      methodLogos = 'MoMo | Napas 247';
      methodSubtext = 'Quét Ví MoMo để chuyển cọc';
    }

    const copyGate = (text, field) => {
      navigator.clipboard.writeText(String(text));
      setCopiedGateField(field);
      setTimeout(() => setCopiedGateField(null), 2000);
    };

    const handleOpenVNPayDeposit = async () => {
      try {
        localStorage.setItem('rental_pending_payment', JSON.stringify({
          type: 'DEPOSIT',
          contractId: myContract.id,
          contractCode: myContract.contractCode,
          room: targetRoomNum,
          houseCode: myContract.houseCode,
          total: totalDepositAmount,
          depositAmount,
          residenceFee,
          tenantName: user?.fullName || myContract?.tenantName,
          timestamp: Date.now()
        }));
        const payUrl = await createVNPayPaymentUrl({
          invoiceId: `COC_${String(targetRoomNum).replace('.', '')}_${Date.now()}`,
          amount: totalDepositAmount,
          orderInfo: `Nop coc ${targetRoomNum} + Tam tru tam vang ${cleanTenantName}`.trim(),
          bankCode: 'NCB'
        });
        window.location.href = payUrl;
      } catch (err) {
        console.error('VNPay error:', err);
        window.location.href = `/payment/vnpay-return?vnp_ResponseCode=00&vnp_TxnRef=COC_${targetRoomNum}&vnp_Amount=${totalDepositAmount * 100}&vnp_BankCode=NCB&vnp_OrderInfo=${encodeURIComponent(transferMemo)}`;
      }
    };

    const handleOpenMoMoDeposit = async () => {
      try {
        localStorage.setItem('rental_pending_payment', JSON.stringify({
          type: 'DEPOSIT',
          contractId: myContract.id,
          contractCode: myContract.contractCode,
          room: targetRoomNum,
          houseCode: myContract.houseCode,
          total: totalDepositAmount,
          depositAmount,
          residenceFee,
          tenantName: user?.fullName || myContract?.tenantName,
          timestamp: Date.now()
        }));
        const payUrl = await createMoMoPaymentUrl({
          invoiceId: `COC_${String(targetRoomNum).replace('.', '')}_${Date.now()}`,
          amount: totalDepositAmount,
          orderInfo: `Nop coc ${targetRoomNum} + Tam tru tam vang ${cleanTenantName}`.trim()
        });
        if (payUrl) {
          window.location.href = payUrl;
        } else {
          window.location.href = `/payment/momo-return?resultCode=0&orderId=COC_${targetRoomNum}&amount=${totalDepositAmount}&message=Giao%20dich%20thanh%20cong`;
        }
      } catch (err) {
        console.error('MoMo error:', err);
        window.location.href = `/payment/momo-return?resultCode=0&orderId=COC_${targetRoomNum}&amount=${totalDepositAmount}&message=Giao%20dich%20thanh%20cong`;
      }
    };

    const handleConfirmDepositAndSign = (cccdData = null) => {
      if (payDepositAndSignContract) {
        payDepositAndSignContract(myContract.id, { cccdData, contractData: myContract });
        setPaySuccessToast(
          `🎉 Ký HĐ thành công! Dữ liệu CCCD đã được gửi đến Quản lý cơ sở để làm thủ tục Tạm Trú (VNeID) phòng ${targetRoomNum}.`
        );
        setTimeout(() => setPaySuccessToast(null), 7000);
      }
    };

    const handleCheckDepositPayment = async () => {
      setIsCheckingSepayDeposit(true);
      setSepayDepositStatusMsg(null);
      try {
        if (depositPaymentMethod === 'SEPAY') {
          const res = await checkSePayTransaction({
            invoiceCode: transferMemo,
            amount: depositAmount,
            accountNumber: bankAccount
          });
          if (res && res.success) {
            setIsDepositPaid(true);
            if (myContract?.id) localStorage.setItem(`rental_deposit_paid_${myContract.id}`, 'true');
            if (myContract?.roomNumber) {
              localStorage.setItem(`rental_deposit_paid_${myContract.roomNumber}`, 'true');
              const cNorm = String(myContract.roomNumber).replace(/^p\.?/i, '').trim();
              localStorage.setItem(`rental_deposit_paid_${cNorm}`, 'true');
            }
            if (confirmDepositPaid && myContract?.id) {
              confirmDepositPaid({
                contractId: myContract.id,
                room: myContract.roomNumber,
                paymentMethod: 'SePay'
              });
            }
            try { window.dispatchEvent(new Event('storage')); } catch {}
            setSepayDepositStatusMsg('✅ Đã phát hiện giao dịch nộp cọc thành công trên SePay! Nút Ký Hợp Đồng đã sáng lên.');
            setPaySuccessToast(`⚡ SePay: Đã nhận tiền cọc ${depositAmount.toLocaleString('vi-VN')} đ!`);
          } else {
            setIsDepositPaid(false);
            setSepayDepositStatusMsg('⏳ Hệ thống chưa phát hiện giao dịch tiền cọc chuyển vào tài khoản. Vui lòng quét mã VietQR và thử lại sau vài giây.');
          }
        } else if (depositPaymentMethod === 'VNPAY') {
          setSepayDepositStatusMsg('ℹ️ Vui lòng bấm "Mở Cổng VNPAY" để thanh toán qua cổng VNPAY Sandbox.');
        } else {
          setSepayDepositStatusMsg('ℹ️ Vui lòng bấm "Mở Cổng MoMo" để thanh toán qua Ví MoMo Sandbox.');
        }
      } catch (err) {
        setIsDepositPaid(false);
        setSepayDepositStatusMsg('⏳ Chưa phát hiện tiền cọc vào tài khoản... Vui lòng quét mã QR chuyển tiền đúng cú pháp.');
      } finally {
        setIsCheckingSepayDeposit(false);
      }
    };

    const handleSaveSepayConfig = (e) => {
      e.preventDefault();
      saveSePayConfig(sepayForm);
      setSepayConfig(sepayForm);
      setShowSepayConfigModal(false);
      setPaySuccessToast('🎉 Đã cập nhật thông tin tài khoản SePay của bạn thành công!');
      setTimeout(() => setPaySuccessToast(null), 4000);
    };

    const handleSyncFromSepay = async () => {
      if (!sepayForm.apiKey) {
        setPaySuccessToast('⚠️ Vui lòng dán SePay API Token trước khi đồng bộ!');
        setTimeout(() => setPaySuccessToast(null), 4000);
        return;
      }
      setIsSyncingSepay(true);
      const res = await syncBankAccountsFromSePay(sepayForm.apiKey);
      setIsSyncingSepay(false);
      if (res.success && res.account) {
        const updated = {
          ...sepayForm,
          accountNumber: res.account.account_number,
          bank: res.account.bank_short_name || 'MBBank',
          accountName: res.account.account_holder_name || sepayForm.accountName
        };
        setSepayForm(updated);
        setSepayConfig(updated);
        saveSePayConfig(updated);
        setPaySuccessToast(`✓ Đã đồng bộ thành công tài khoản ${res.account.account_number} (${res.account.bank_short_name}) từ SePay!`);
        setTimeout(() => setPaySuccessToast(null), 4000);
      } else {
        setPaySuccessToast('⚠️ Không thể kết nối tài khoản SePay. Vui lòng kiểm tra lại API Token!');
        setTimeout(() => setPaySuccessToast(null), 4000);
      }
    };

    return (
      <div className="space-y-6 page-enter">
        {/* Banner Onboarding Gate */}
        <div className="bento-card-dark relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Bước Bắt Buộc: Nộp Tiền Cọc & Ký Hợp Đồng Điện Tử (Onboarding)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Xin chào, {user?.fullName || myContract.tenantName}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Đơn đăng ký thuê phòng <strong className="text-amber-300 font-mono bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">{targetRoomNum}</strong> tại <strong>{targetHouseName}</strong> của bạn đã được Quản lý phê duyệt. Theo quy định trọ, bạn cần <strong>hoàn tất nộp tiền cọc</strong> và <strong>ký hợp đồng điện tử</strong> để kích hoạt nhận phòng chính thức.
            </p>
          </div>
        </div>

        {/* BANNER ĐẾM NGƯỢC HOẶC ĐÃ NỘP CỌC THÀNH CÔNG */}
        {isDepositConfirmed ? (
          <div className="p-5 rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 text-emerald-100 shadow-xl shadow-emerald-900/20 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl shadow-lg bg-emerald-600 text-white">
                  ✓
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                      ĐÃ NỘP TIỀN CỌC THÀNH CÔNG • GIỮ CHỖ ĐỘC QUYỀN HOÀN TẤT
                    </span>
                    <span className="font-mono font-bold text-xs bg-emerald-600 text-white px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      <span>🔒</span> Đã Khóa Độc Quyền Cho Bạn
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Hệ thống đã xác nhận khoản tiền cọc <strong className="text-emerald-300 font-mono">{(depositAmount + residenceFee).toLocaleString('vi-VN')} ₫</strong> cho phòng <strong className="text-amber-300 font-mono">{targetRoomNum}</strong> ({targetHouseName}). Quyền giữ phòng của bạn đã được bảo lưu an toàn (không bị giới hạn thời gian). Vui lòng hoàn tất <strong>Bước 2: Ký Hợp Đồng Điện Tử</strong> bên cạnh để nhận phòng ngay!
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`p-5 rounded-3xl border shadow-xl transition-all ${holdingSecondsLeft === 0
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
              : holdingSecondsLeft <= 120
                ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-rose-500/60 text-rose-100 shadow-rose-900/30'
                : holdingSecondsLeft <= 300
                  ? 'bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-amber-500/60 text-amber-100 shadow-amber-900/20'
                  : 'bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/90 border-purple-500/50 text-purple-100 shadow-purple-900/20'
            }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl shadow-lg ${holdingSecondsLeft === 0
                    ? 'bg-rose-600 text-white'
                    : holdingSecondsLeft <= 120
                      ? 'bg-rose-600 text-white animate-pulse'
                      : holdingSecondsLeft <= 300
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-purple-600 text-white'
                  }`}>
                  {holdingSecondsLeft === 0 ? '⚠️' : '⏳'}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      {holdingSecondsLeft === 0 ? 'Đã Hết Hạn Giữ Phòng' : 'Thời Hạn Nộp Cọc Giữ Phòng Còn Lại:'}
                    </span>
                    {holdingSecondsLeft > 0 ? (
                      <span className={`font-mono font-black text-base px-3 py-0.5 rounded-xl shadow-sm ${holdingSecondsLeft <= 120
                          ? 'bg-rose-600 text-white animate-bounce'
                          : holdingSecondsLeft <= 300
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                        }`}>
                        {formatCountdown(holdingSecondsLeft)}
                      </span>
                    ) : (
                      <span className="font-mono font-bold text-xs bg-rose-600 text-white px-2.5 py-0.5 rounded-lg">
                        00:00 (Đã kết thúc)
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-slate-300">
                      • Hạn chót: <strong className="text-white font-mono">{getDeadlineString(myContract.holdingUntil || (Date.now() + holdingSecondsLeft * 1000))}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {holdingSecondsLeft > 0 ? (
                      <>
                        Phòng <strong className="text-amber-300 font-mono">{targetRoomNum}</strong> ({targetHouseName}) đang được tạm khóa giữ chỗ độc quyền cho bạn. Vui lòng chuyển khoản nộp cọc <strong className="text-purple-300 font-mono">{depositAmount.toLocaleString('vi-VN')} ₫</strong> trước hạn chót. <span className="text-amber-200 font-medium">Sau thời hạn này nếu chưa nộp cọc, phòng sẽ tự động mở lại cho khách khác thuê!</span>
                      </>
                    ) : (
                      <>
                        Rất tiếc! Đã quá thời hạn 15 phút nộp tiền cọc. Lệnh giữ phòng <strong className="text-white font-mono">{targetRoomNum}</strong> đã kết thúc và phòng đã được hệ thống tự động mở lại trên sàn cho khách khác.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => handleCancelHoldRoom(targetRoomNum, myContract.houseCode)}
                  className="btn-press-ghost px-3.5 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-900/40 border border-rose-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Hủy Giữ Chỗ Phòng</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2 Bước Onboarding Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* CỘT 1: NỘP TIỀN CỌC GIỮ PHÒNG */}
          <div className="bento-card p-6 border-2 border-purple-200 bg-white shadow-xl rounded-3xl h-full flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Header Cột 1 */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                    1
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">Nộp Tiền Cọc Giữ Phòng (1 Tháng Tiền Thuê)</h3>
                    <p className="text-[11px] text-purple-600 font-medium">⚡ Cổng thanh toán tự động (SePay QR, VNPAY, MoMo)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSepayConfigModal(true)}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>SePay Của Tôi</span>
                  </button>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${isDepositConfirmed
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                    {isDepositConfirmed ? 'Đã Nộp Cọc' : 'Chờ Nộp Cọc'}
                  </span>
                </div>
              </div>

              {/* 3 Tabs phương thức thanh toán */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { setDepositPaymentMethod('SEPAY'); setSepayDepositStatusMsg(null); }}
                  className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${depositPaymentMethod === 'SEPAY'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ SePay (Mã VietQR)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setDepositPaymentMethod('VNPAY'); setSepayDepositStatusMsg(null); }}
                  className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${depositPaymentMethod === 'VNPAY'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>🔷 Cổng VNPAY</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setDepositPaymentMethod('MOMO'); setSepayDepositStatusMsg(null); }}
                  className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${depositPaymentMethod === 'MOMO'
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>👛 Ví MoMo</span>
                </button>
              </div>

              {/* Box Quy chế tiền cọc */}
              <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span>
                      {depositPaymentMethod === 'SEPAY'
                        ? 'Quy chế tiền cọc (Quét mã VietQR SePay):'
                        : depositPaymentMethod === 'VNPAY'
                          ? 'Quy chế tiền cọc (Cổng thanh toán VNPAY Sandbox):'
                          : 'Quy chế tiền cọc (Cổng thanh toán Ví MoMo Sandbox):'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                    {depositPaymentMethod === 'SEPAY' ? 'VietQR 24/7' : depositPaymentMethod === 'VNPAY' ? 'VNPAY Sandbox' : 'MoMo Sandbox'}
                  </span>
                </div>
                <p className="text-xs text-purple-900 leading-relaxed">
                  Tiền cọc 1 tháng tiền phòng (<strong className="font-mono text-purple-950">{depositAmount.toLocaleString('vi-VN')} đ</strong>) + Lệ phí đăng ký tạm trú tạm vắng (<strong className="font-mono text-purple-950">50.000 đ</strong>). Tổng tiền cần chuyển = <strong className="font-mono text-purple-950 text-sm bg-purple-100 px-1.5 py-0.5 rounded">{totalDepositAmount.toLocaleString('vi-VN')} đ</strong>.{' '}
                  {depositPaymentMethod === 'SEPAY'
                    ? 'Quét mã VietQR SePay bên dưới để hệ thống tự động gạch nợ và mở khóa nút ký hợp đồng nhận phòng.'
                    : depositPaymentMethod === 'VNPAY'
                      ? 'Bấm nút chuyển hướng để thanh toán qua Cổng VNPAY Sandbox. Sau khi thanh toán thành công, hệ thống tự động kích hoạt hợp đồng.'
                      : 'Bấm nút chuyển hướng để thanh toán qua Ví MoMo Sandbox. Sau khi thanh toán thành công, hệ thống tự động kích hoạt hợp đồng.'}
                </p>
              </div>

              {/* Thông tin nộp cọc & Khung thanh toán */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* 4 dòng thông tin */}
                <div className="space-y-2 text-xs flex-1 w-full">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">
                      {depositPaymentMethod === 'SEPAY'
                        ? 'Ngân hàng & Số tài khoản:'
                        : depositPaymentMethod === 'VNPAY'
                          ? 'Cổng thanh toán:'
                          : 'Cổng ví điện tử:'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-800">
                        {depositPaymentMethod === 'SEPAY'
                          ? `${bankName} ${bankAccount}`
                          : depositPaymentMethod === 'VNPAY'
                            ? `Cổng VNPAY Gateway (Sandbox)`
                            : 'Ví Điện Tử MoMo (Sandbox)'}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyGate(depositPaymentMethod === 'MOMO' ? '0982511205' : bankAccount, 'acc')}
                        className="text-slate-400 hover:text-purple-600 cursor-pointer"
                        title="Sao chép"
                      >
                        {copiedGateField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">
                      {depositPaymentMethod === 'MOMO' ? 'Chủ tài khoản Ví MoMo:' : 'Chủ tài khoản thụ hưởng:'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 uppercase font-mono">{accountHolder}</span>
                      <button
                        type="button"
                        onClick={() => copyGate(accountHolder, 'name')}
                        className="text-slate-400 hover:text-purple-600 cursor-pointer"
                        title="Sao chép"
                      >
                        {copiedGateField === 'name' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Chi tiết 3 khoản: Cọc 1 tháng, Tạm trú 50k, Tổng tiền */}
                  <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">1. Tiền cọc giữ phòng (1 tháng tiền phòng):</span>
                      <span className="font-mono font-bold text-slate-900">{depositAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">2. Lệ phí đăng ký tạm trú tạm vắng:</span>
                      <span className="font-mono font-bold text-indigo-700">+ 50.000 đ</span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-purple-200">
                      <span className="font-black text-slate-900 text-xs uppercase tracking-tight">TỔNG TIỀN PHẢI CHUYỂN KHOẢN:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-purple-700 text-base font-mono">
                          {totalDepositAmount.toLocaleString('vi-VN')} đ
                        </span>
                        <button
                          type="button"
                          onClick={() => copyGate(totalDepositAmount, 'amount')}
                          className="text-slate-400 hover:text-purple-600 cursor-pointer"
                          title="Sao chép tổng số tiền"
                        >
                          {copiedGateField === 'amount' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 text-[11px] leading-tight font-medium">
                      {depositPaymentMethod === 'MOMO' ? 'Lời nhắn chuyển tiền MoMo:' : 'Nội dung chuyển khoản chuẩn:'}
                    </span>
                    <div className="flex items-center gap-1.5 max-w-[62%]">
                      <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] truncate" title={transferMemo}>
                        {transferMemo}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyGate(transferMemo, 'memo')}
                        className="text-slate-400 hover:text-purple-600 cursor-pointer shrink-0"
                        title="Sao chép nội dung chuyển khoản"
                      >
                        {copiedGateField === 'memo' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Khung Phải: SePay hiển thị QR To, VNPAY & MoMo chuyển hướng Sandbox */}
                {depositPaymentMethod === 'SEPAY' ? (
                  <div className="w-full sm:w-56 shrink-0 flex flex-col items-center bg-white p-3 rounded-2xl text-center">
                    <div className="w-full flex items-center justify-between mb-1 px-1">
                      <span className="text-[11px] font-black tracking-wide text-purple-700 flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5" />
                        <span>SePay VietQR</span>
                      </span>
                      <span className="text-[9px] font-mono font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full">
                        NAPAS 247
                      </span>
                    </div>

                    <img
                      src={generateSePayQrUrl({
                        accountNumber: bankAccount,
                        bank: bankName,
                        amount: totalDepositAmount,
                        content: transferMemo,
                        template: 'compact'
                      })}
                      alt="Mã QR SePay Nộp Cọc"
                      className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-xl bg-white"
                    />

                    <div className="text-[10px] text-slate-400 font-mono font-bold mt-1">
                      NAPAS 247 • MBBANK • VIETQR
                    </div>
                    <p className="text-[11px] font-bold text-slate-700 mt-0.5 leading-tight">
                      Quét QR để chuyển cọc tự động
                    </p>
                    <p className="text-[9px] text-slate-400">
                      Tự động gạch nợ sau 3–5 giây
                    </p>
                    <button
                      type="button"
                      onClick={handleCheckDepositPayment}
                      disabled={isCheckingSepayDeposit || isDepositConfirmed}
                      className={`w-full mt-2 py-2 px-2.5 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isDepositConfirmed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                        }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSepayDeposit ? 'animate-spin' : ''}`} />
                      <span className="text-[11px]">{isDepositConfirmed ? '✓ Đã Nhận Tiền Cọc' : isCheckingSepayDeposit ? 'Đang kiểm tra SePay...' : 'Kiểm Tra Tiền Cọc'}</span>
                    </button>
                  </div>
                ) : depositPaymentMethod === 'VNPAY' ? (
                  <div className="w-full sm:w-56 shrink-0 flex flex-col items-center justify-between bg-gradient-to-br from-blue-50 to-indigo-50/70 p-4 rounded-3xl border-2 border-blue-200 text-center space-y-2.5">
                    <div className="w-full flex items-center justify-between">
                      <span className="text-[11px] font-black tracking-wide text-blue-700 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Cổng VNPAY</span>
                      </span>
                      <span className="text-[9px] font-mono font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        SANDBOX
                      </span>
                    </div>

                    <div className="w-16 h-16 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-md border border-blue-200 mx-auto">
                      <CreditCard className="w-8 h-8 text-blue-600" />
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-blue-950">
                        Cổng VNPAY Sandbox
                      </p>
                      <p className="text-[10px] text-blue-700 font-medium">
                        Thẻ ATM 40+ Ngân Hàng & Visa
                      </p>
                      <span className="inline-block mt-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                        Không dùng mã QR
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenVNPayDeposit}
                      className="btn-press btn-shimmer w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Mở Cổng VNPAY</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full sm:w-56 shrink-0 flex flex-col items-center justify-between bg-gradient-to-br from-pink-50 to-rose-50/70 p-4 rounded-3xl border-2 border-pink-200 text-center space-y-2.5">
                    <div className="w-full flex items-center justify-between">
                      <span className="text-[11px] font-black tracking-wide text-pink-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Ví MoMo</span>
                      </span>
                      <span className="text-[9px] font-mono font-bold bg-pink-600 text-white px-2 py-0.5 rounded-full">
                        SANDBOX
                      </span>
                    </div>

                    <div className="w-16 h-16 rounded-2xl bg-white text-pink-600 flex items-center justify-center shadow-md border border-pink-200 mx-auto">
                      <Sparkles className="w-8 h-8 text-pink-600" />
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-pink-950">
                        Cổng Ví MoMo Sandbox
                      </p>
                      <p className="text-[10px] text-pink-700 font-mono font-bold">
                        Ví MoMo: 0982.511.205
                      </p>
                      <span className="inline-block mt-0.5 text-[9px] font-bold bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full border border-pink-200">
                        Không dùng mã QR
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenMoMoDeposit}
                      className="btn-press btn-shimmer w-full py-2.5 px-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-black text-xs rounded-xl shadow-md shadow-pink-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Mở Cổng MoMo</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {sepayDepositStatusMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900">
                  {sepayDepositStatusMsg}
                </div>
              )}
            </div>

            {/* Footer Cột 1 (Đã xóa nút kiểm tra trạng thái chuyển tiền theo yêu cầu) */}
            <div className="pt-2">
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Tự động gạch nợ & kích hoạt nhận phòng khi tiền vào hệ thống</span>
                </div>
                <span className="font-mono font-bold text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                  Realtime 24/7
                </span>
              </div>
            </div>
          </div>

          {/* CỘT 2: KÝ HỢP ĐỒNG ĐIỆN TỬ */}
          <div className="bento-card p-6 border-2 border-indigo-200 bg-white shadow-xl rounded-3xl h-full flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Header Cột 2 */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                    2
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">Ký Hợp Đồng Điện Tử (E-Signature)</h3>
                    <p className="text-[11px] text-slate-500 font-mono">Mã hợp đồng: {myContract.contractCode || 'HD-2026-007'}</p>
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${myContract.signedElectronically
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-purple-100 text-purple-700 border border-purple-200'
                  }`}>
                  {myContract.signedElectronically ? 'Đã Ký HĐ' : 'Chờ Ký HĐ'}
                </span>
              </div>

              {/* Box Pháp lý hợp đồng */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Pháp Lý Hợp Đồng Điện Tử (E-Contract):</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                    Luật GĐĐT 2023
                  </span>
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed">
                  Hợp đồng ký số có giá trị pháp lý đầy đủ, bảo lưu và hoàn trả 100% tiền cọc khi hết hạn hợp đồng và bàn giao phòng nguyên vẹn.
                </p>
              </div>

              {/* 4 quadrant info box */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-500 text-[11px]">Phòng thuê & Cơ sở:</span>
                  <div className="font-mono font-black text-purple-700 text-sm">{targetRoomNum}</div>
                  <div className="text-[11px] text-slate-600 truncate">{targetHouseName}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 text-[11px]">Thời hạn hợp đồng:</span>
                  <div className="font-bold text-slate-900 text-sm">12 tháng (1 năm)</div>
                  <div className="text-[11px] text-slate-600 font-mono">{myContract.startDate || '01/10/2026'} – {myContract.endDate || '01/10/2027'}</div>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-200/60">
                  <span className="text-slate-500 text-[11px]">Giá thuê định kỳ:</span>
                  <div className="font-mono font-black text-slate-900 text-sm">{depositAmount.toLocaleString('vi-VN')} đ/tháng</div>
                  <div className="text-[11px] text-slate-600">Kỳ thanh toán: 01–05 hàng tháng</div>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Tiền cọc giữ phòng (1 tháng):</span>
                    <span className="font-mono font-bold text-slate-800">{depositAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Phí đăng ký tạm trú tạm vắng:</span>
                    <span className="font-mono font-bold text-indigo-700">+ 50.000 đ</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-200">
                    <span className="text-slate-700 font-bold text-xs">Tổng tiền thanh toán:</span>
                    <span className="font-mono font-black text-purple-700 text-sm">{totalDepositAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">Tiền cọc được hoàn lại 100% khi hết HĐ & bàn giao phòng</div>
                </div>
              </div>

              {/* Quyền lợi kích hoạt tức thì */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>✨</span>
                    <span>Quyền Lợi Kích Hoạt Tức Thì:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowContractModal(true)}
                    className="text-purple-600 hover:text-purple-800 font-bold hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Xem Toàn Văn HĐ (UC-T01)</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl font-medium text-slate-700">
                    <span>🔑</span>
                    <span className="truncate">Cấp mã cửa phòng số</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl font-medium text-slate-700">
                    <span>⚡</span>
                    <span className="truncate">Chốt số điện nước online</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl font-medium text-slate-700">
                    <span>🛡️</span>
                    <span className="truncate">Chủ trọ đã ký số sẵn</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl font-medium text-slate-700">
                    <span>🔒</span>
                    <span className="truncate">Ký số SHA-256 an toàn</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Nút Ký hợp đồng điều kiện */}
            <div className="space-y-1.5 pt-2">
              {isDepositConfirmed ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowContractModal(true)}
                    className="btn-press btn-shimmer w-full py-3.5 px-5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>✍️ Ký Hợp Đồng Điện Tử Nhận Phòng Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-emerald-600 text-center font-bold">
                    ✓ Tiền cọc đã được xác nhận thành công! Bấm vào đây để ký hợp đồng số.
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-5 bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
                  >
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Ký Hợp Đồng Nhận Phòng (Chưa Chuyển Tiền)</span>
                  </button>
                  <p className="text-[11px] text-slate-400 text-center font-medium">
                    Chuyển tiền cọc qua SePay, VNPAY hoặc MoMo thì nút Ký Hợp Đồng mới sáng lên để bấm.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Toàn văn hợp đồng */}
        <ResidentContractModal
          isOpen={showContractModal}
          onClose={() => setShowContractModal(false)}
          contract={{
            ...myContract,
            status: (isDepositPaid || myContract.depositPaid) ? 'PENDING_SIGN' : (myContract.status || 'PENDING_DEPOSIT'),
            depositPaid: Boolean(isDepositPaid || myContract.depositPaid)
          }}
          onSignSuccess={(contractId, cccdData) => {
            setShowContractModal(false);
            handleConfirmDepositAndSign(cccdData);
          }}
        />

        {/* Modal Cấu hình tài khoản SePay */}
        <Modal
          isOpen={showSepayConfigModal}
          onClose={() => setShowSepayConfigModal(false)}
          title="⚙️ Cấu Hình Tài Khoản Ngân Hàng SePay"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Nhập thông tin tài khoản ngân hàng của bạn đã đăng ký với dịch vụ SePay để nhận tiền cọc tự động qua VietQR:
            </p>

            <form onSubmit={handleSaveSepayConfig} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mã Ngân Hàng (Bank ShortName):
                </label>
                <input
                  type="text"
                  value={sepayForm.bank}
                  onChange={(e) => setSepayForm({ ...sepayForm, bank: e.target.value })}
                  placeholder="MBBank, VCB, ACB, TPBank, VPBank..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Số Tài Khoản Nhận Cọc:
                </label>
                <input
                  type="text"
                  value={sepayForm.accountNumber}
                  onChange={(e) => setSepayForm({ ...sepayForm, accountNumber: e.target.value })}
                  placeholder="35825112005"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên Chủ Tài Khoản:
                </label>
                <input
                  type="text"
                  value={sepayForm.accountName}
                  onChange={(e) => setSepayForm({ ...sepayForm, accountName: e.target.value.toUpperCase() })}
                  placeholder="DAM TRUNG ANH"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold uppercase text-slate-800 focus:bg-white focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  SePay API Token (Tùy chọn):
                </label>
                <input
                  type="password"
                  value={sepayForm.apiKey}
                  onChange={(e) => setSepayForm({ ...sepayForm, apiKey: e.target.value })}
                  placeholder="Dán SePay API Key..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSyncFromSepay}
                  disabled={isSyncingSepay}
                  className="px-3 py-2 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>🔄 {isSyncingSepay ? 'Đang đồng bộ...' : 'Tự đồng bộ SePay'}</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSepayConfigModal(false)}
                    className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="btn-press px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Lưu SePay Của Tôi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    );
  }

  // =========================================================================
  // 1B. GIAO DIỆN DÀNH CHO KHÁCH THUÊ MỚI (CHƯA GÁN PHÒNG)
  // =========================================================================
  if (!myRoomNumber) {
    return (
      <div className="space-y-6 page-enter">
        {/* BANNER NỔI BẬT: ĐƠN ĐĂNG KÝ THUÊ PHÒNG ĐANG CHỜ BAN QUẢN LÝ PHÊ DUYỆT */}
        {myPendingRentalRequest && (
          <div className="bento-card p-6 border-2 border-amber-300 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 rounded-3xl shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/70">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg shadow-inner">
                  ⏳
                </div>
                <div>
                  <h3 className="text-base font-black text-amber-950">
                    Đơn Đăng Ký Thuê Phòng Đang Chờ Ban Quản Lý Phê Duyệt
                  </h3>
                  <p className="text-xs text-amber-800 font-medium">
                    Phòng <strong className="font-mono text-purple-700 font-black">{myPendingRentalRequest.targetRoom}</strong> • {myPendingRentalRequest.house || 'Cơ sở trọ'} (Ngày đăng ký: {myPendingRentalRequest.date})
                  </p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 shrink-0 flex items-center gap-1.5 shadow-2xs">
                <span>🟡</span>
                <span>Chờ Staff Duyệt Hồ Sơ</span>
              </span>
            </div>

            <div className="p-4 bg-white/90 rounded-2xl border border-amber-200 text-xs text-slate-700 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span>🔒</span>
                <span>Cổng nộp tiền cọc trọ đang tạm khóa (Chưa mở):</span>
              </div>
              <p className="leading-relaxed text-slate-600">
                Theo quy định của hệ thống, chỉ khi <strong>Quản lý cơ sở (Staff)</strong> kiểm tra hồ sơ và bấm <strong>[✅ Phê Duyệt & Mở Cổng Nộp Cọc]</strong>, cổng thanh toán tiền cọc giữ phòng (SePay QR) và ký hợp đồng điện tử mới được kích hoạt trong 15 phút.
              </p>
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200/60 text-indigo-900 font-medium text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>💡 <strong>Thông báo:</strong> Quản lý cơ sở đang thụ lý hồ sơ của bạn. Bạn cũng có thể liên hệ trực tiếp lễ tân hoặc vào <strong>Quản Lý Phòng</strong> để xem chi tiết!</span>
                <Link
                  to="/rooms"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition shrink-0 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem Chi Tiết Phòng</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="bento-card-dark relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-indigo-500/30 shadow-2xl text-white">
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none animate-float-slow" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-bold backdrop-blur-md border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Chào Mừng Cư Dân Mới</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                Xin chào, {user?.fullName || 'Quý khách'}!
              </h1>
              <p className="text-indigo-100 text-xs sm:text-sm max-w-xl leading-relaxed">
                Tài khoản của bạn đã được khởi tạo thành công trên hệ thống. Hiện tại chưa có hợp đồng phòng nào liên kết trực tiếp với tài khoản này.
              </p>
            </div>
            <Link
              to="/rooms"
              className="btn-press btn-shimmer inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all shrink-0 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Khám Phá Phòng Trống</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="bento-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Hồ Sơ Định Danh Cư Dân</span>
            </h3>
            <span className="status-pill status-pill-indigo">
              Khách Tiềm Năng
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
              <div className="text-slate-400 text-[11px] font-medium">Họ và tên</div>
              <div className="font-bold text-slate-900 mt-1">{user?.fullName || 'Hoàng Văn Nam'}</div>
            </div>
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
              <div className="text-slate-400 text-[11px] font-medium">Số điện thoại</div>
              <div className="font-bold text-slate-900 mt-1">{user?.phone || '0966.123.456'}</div>
            </div>
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
              <div className="text-slate-400 text-[11px] font-medium">Số định danh CCCD</div>
              <div className="font-bold font-mono text-slate-900 mt-1">{user?.cccd || '001201019999'}</div>
            </div>
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
              <div className="text-slate-400 text-[11px] font-medium">Quê quán</div>
              <div className="font-bold text-slate-900 mt-1">
                {user?.hometown || (user?.fullName?.toLowerCase().includes('an') ? 'Nam Định' : user?.fullName?.toLowerCase().includes('cường') ? 'Hải Phòng' : 'Hà Nội')}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 1C. GIAO DIỆN DÀNH CHO CƯ DÂN ĐANG CÓ PHÒNG THUÊ HOẠT ĐỘNG
  // =========================================================================
  return (
    <div className="space-y-6 page-enter">
      {paySuccessToast && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl font-bold text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{paySuccessToast}</span>
          </div>
          <button onClick={() => setPaySuccessToast(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* BANNER 0A: ĐỀ XUẤT BÀN GIAO HỢP ĐỒNG GỬI ĐẾN TÀI KHOẢN NÀY (TWO-WAY HANDSHAKE) */}
      {pendingIncomingTransferProposal && (
        <div className="p-5 bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-purple-500/15 border-2 border-purple-400 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm text-purple-950">
                  Yêu Cầu Bàn Giao Quyền Đại Diện Hợp Đồng Phòng {pendingIncomingTransferProposal.targetRoom}
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-900 border border-purple-300">
                  Cần Bạn Xác Nhận
                </span>
              </div>
              <p className="text-xs text-purple-950 mt-1 font-semibold leading-relaxed">
                Người đại diện <strong>{pendingIncomingTransferProposal.fromTenant}</strong> muốn bàn giao toàn bộ quyền và nghĩa vụ đứng tên <strong>Hợp Đồng phòng {pendingIncomingTransferProposal.targetRoom}</strong> cho bạn để dọn ra ngoài.
              </p>
              {pendingIncomingTransferProposal.note && (
                <p className="text-[11px] text-purple-800 mt-0.5 italic">
                  Lời nhắn: "{pendingIncomingTransferProposal.note}"
                </p>
              )}
              <p className="text-[11px] text-slate-600 mt-1">
                💡 <em>Nếu Đồng Ý: Bạn sẽ trở thành Người đại diện chính thức đứng tên HĐ. Nếu Bạn Từ Chối: Bạn từ chối gánh vác trách nhiệm HĐ và hệ thống sẽ mở quyền Trả toàn bộ phòng cho người đại diện.</em>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (respondContractTransfer) {
                  respondContractTransfer(pendingIncomingTransferProposal.id, false);
                  setPaySuccessToast('Bạn đã từ chối nhận tiếp quản Hợp đồng phòng.');
                  setTimeout(() => setPaySuccessToast(null), 4000);
                }
              }}
              className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs btn-press"
            >
              ❌ Tôi Từ Chối Nhận HĐ
            </button>
            <button
              type="button"
              onClick={() => {
                if (respondContractTransfer) {
                  respondContractTransfer(pendingIncomingTransferProposal.id, true);
                  setPaySuccessToast('Chúc mừng! Bạn đã tiếp quản Hợp đồng thành công và trở thành Người đại diện phòng.');
                  setTimeout(() => setPaySuccessToast(null), 5000);
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-purple-600/20 btn-press cursor-pointer flex items-center gap-1.5"
            >
              <span>✅ Đồng Ý Tiếp Quản HĐ</span>
            </button>
          </div>
        </div>
      )}

      {/* BANNER 0B: ĐỀ XUẤT BÀN GIAO HỢP ĐỒNG ĐANG CHỜ BẠN CÙNG PHÒNG ĐỒNG Ý */}
      {pendingOutgoingTransferProposal && (
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-400 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
              ⏳
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm text-amber-950">
                  Đang Chờ Bạn Cùng Phòng Xác Nhận Tiếp Quản Hợp Đồng
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                  Two-Way Handshake
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-1 font-medium leading-relaxed">
                Bạn đã gửi đề xuất chuyển giao quyền đại diện Hợp Đồng phòng {pendingOutgoingTransferProposal.targetRoom} cho bạn cùng phòng <strong>{pendingOutgoingTransferProposal.toTenant}</strong>.
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Theo quy định, bạn cùng phòng phải bấm <strong>[Đồng Ý Tiếp Quản HĐ]</strong> thì Hợp đồng mới được sang tên và bạn mới chính thức hoàn tất thủ tục rời phòng.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BANNER 0C: BẾ TẮC BÀN GIAO (DEADLOCK-BREAKER: BẠN CÙNG PHÒNG ĐÃ TỪ CHỐI NHẬN HỢP ĐỒNG) */}
      {rejectedTransferProposal && (
        <div className="p-5 bg-gradient-to-r from-rose-500/15 via-red-500/10 to-rose-500/15 border-2 border-rose-500 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
              🚨
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm text-rose-950">
                  Bế Tắc Bàn Giao: Bạn Cùng Phòng ĐÃ TỪ CHỐI Tiếp Quản Hợp Đồng!
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900 border border-rose-300">
                  ⚡ Deadlock-Breaker Kích Hoạt
                </span>
              </div>
              <p className="text-xs text-rose-900 mt-1 font-semibold leading-relaxed">
                Bạn cùng phòng <strong>"{rejectedTransferProposal.rejectedBy || rejectedTransferProposal.toTenant}"</strong> đã từ chối nhận chuyển giao quyền đứng tên Hợp đồng phòng {rejectedTransferProposal.targetRoom}.
              </p>
              <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                👉 <strong>Nguyên tắc công bằng:</strong> Bạn cùng phòng không thể vừa từ chối nhận trách nhiệm Hợp đồng, vừa ép bạn phải ở lại gánh phòng. Do đó, hệ thống đã <strong>MỞ KHÓA quyền nộp đơn Trả Toàn Bộ Phòng gửi thẳng Ban Quản Lý nghiệm thu mà KHÔNG CẦN bạn cùng phòng biểu quyết!</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setCheckoutModal(myRoomNumber);
                setAgreedForfeitDeposit(false);
                setCheckoutReason('Do bạn cùng phòng từ chối tiếp quản hợp đồng, đại diện tiến hành trả toàn bộ phòng');
                setCheckoutSuccess(false);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-rose-600/30 btn-press cursor-pointer flex items-center gap-1.5"
            >
              <span>⚡ Trả Toàn Bộ Phòng (Gửi BQL Ngay)</span>
            </button>
          </div>
        </div>
      )}

      {/* BANNER THÔNG BÁO BIỂU QUYẾT ĐANG CHỜ PHÒNG NÀY PHÊ DUYỆT */}
      {pendingRoommateRequests.length > 0 && (
        <div className="space-y-3">
          {pendingRoommateRequests.map((req) => (
            <div
              key={req.id}
              className="p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border-2 border-indigo-500/40 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  🗳️
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-indigo-950">
                    {req.type === 'CHECKOUT'
                      ? 'Yêu Cầu Biểu Quyết: Đồng Ý Trả Phòng Để Cả Phòng Cùng Dọn Đi?'
                      : `Xin Vào Ở Ghép: Bạn ${req.tenant} muốn xin vào ở ghép phòng bạn!`}
                  </h4>
                  <p className="text-xs text-indigo-800">
                    {req.type === 'CHECKOUT'
                      ? `Người đại diện ${req.tenant} đã đề xuất trả toàn bộ phòng ${req.targetRoom}. Bạn có đồng ý dọn đi không?`
                      : `Lời nhắn từ ${req.tenant}: "${req.note || 'Em muốn xin vào ở ghép cùng các bạn'}"`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (voteRoommateRequest) {
                      voteRoommateRequest(req.id, user?.fullName, false);
                    }
                  }}
                  className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold rounded-xl text-xs transition-colors btn-press-ghost cursor-pointer"
                >
                  {req.type === 'CHECKOUT' ? '❌ Tôi Muốn Ở Tiếp (Từ Chối)' : '❌ Từ Chối Cho Vào Ở'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (voteRoommateRequest) {
                      voteRoommateRequest(req.id, user?.fullName, true);
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 btn-press cursor-pointer flex items-center gap-1.5"
                >
                  <span>{req.type === 'CHECKOUT' ? '✅ Đồng Ý Trả Phòng' : '✅ Đồng Ý Cho Vào Ở'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BANNER THÔNG BÁO: BẠN CÙNG PHÒNG ĐÃ RỜI PHÒNG (KHÔNG CẦN BIỂU QUYẾT, CHỈ GỬI THÔNG BÁO) */}
      {currentRoommateLeaveNotices.length > 0 && (
        <div className="space-y-3">
          {currentRoommateLeaveNotices.map((notice) => (
            <div
              key={notice.id}
              className="p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-400 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md animate-fadeIn"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                  📢
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-sm text-amber-950">
                      Biến Động Cư Dân: Thành Viên Đã Rời Phòng
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                      Thông Báo Thông Tin
                    </span>
                    <span className="text-[11px] text-slate-500">{notice.date}</span>
                  </div>
                  <p className="text-xs text-amber-900 mt-1 font-medium leading-relaxed">
                    {notice.message || `Thành viên ${notice.member} đã hoàn tất thủ tục và rời phòng ${notice.room}. Sĩ số phòng đã được tự động cập nhật.`}
                  </p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    💡 <em>Lưu ý: Hợp đồng của phòng vẫn duy trì bình thường. Số tiền điện nước và chi phí sinh hoạt kỳ tới sẽ được chia lại theo số người ở thực tế.</em>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => dismissRoommateLeaveNotice && dismissRoommateLeaveNotice(notice.id)}
                  className="px-4 py-2 bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs btn-press"
                >
                  Đã Hiểu & Đóng
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BANNER 1: ĐƠN TRẢ PHÒNG BỊ BẠN CÙNG PHÒNG TỪ CHỐI */}
      {rejectedCheckoutRequest && !dismissedRejectedCheckoutIds.includes(rejectedCheckoutRequest.id) && (() => {
        const uName = (user?.fullName || '').toLowerCase().trim();
        const rejecterName = (rejectedCheckoutRequest.rejectedBy || '').toLowerCase().trim();
        const requesterName = (rejectedCheckoutRequest.tenant || '').toLowerCase().trim();

        const isMeRejecter = Boolean(
          (uName && rejecterName && (
            uName.includes(rejecterName) ||
            rejecterName.includes(uName) ||
            (uName.includes('cường') && rejecterName.includes('cường'))
          )) ||
          uName.includes('cường') ||
          user?.username === 'tenant2'
        );

        const isMeRequester = Boolean(
          (uName && requesterName && (
            uName.includes(requesterName) ||
            requesterName.includes(uName) ||
            (uName.includes('an') && requesterName.includes('an'))
          )) ||
          uName.includes('an') ||
          user?.username === 'tenant' ||
          user?.username === 'tenant1'
        );

        // CHỈ người đại diện hợp đồng yêu cầu trả phòng mới có nút bàn giao hợp đồng
        const canHandoverContract = isRepresentative && !isMeRejecter;

        // 1. NGƯỜI ĐẠI DIỆN HỢP ĐỒNG (Nguyễn Văn An): Thấy thông báo bị từ chối VÀ CÓ NÚT BÀN GIAO HỢP ĐỒNG
        if (canHandoverContract && !isMeRejecter) {
          return (
            <div className="p-5 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-2 border-rose-400 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md animate-fadeIn">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                  ⚠️
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-rose-950 flex items-center gap-2">
                    <span>Yêu Cầu Trả Toàn Bộ Phòng Đã Bị Bác Bỏ</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-800">Cần Bàn Giao Hợp Đồng</span>
                  </h4>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                    Bạn cùng phòng <strong>"{rejectedCheckoutRequest.rejectedBy || 'Phạm Minh Cường'}"</strong> không đồng ý trả phòng vì muốn tiếp tục ở lại. Bạn không thể đơn phương thanh lý hợp đồng chung của cả phòng!
                  </p>
                  <p className="text-[11px] text-amber-900 font-semibold mt-1">
                    👉 <strong>Giải pháp:</strong> Vui lòng sử dụng tính năng <strong>"Bàn Giao Hợp Đồng & Rời Phòng"</strong> để chuyển giao quyền đại diện HĐ cho bạn cùng phòng trước khi dọn đi.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setLeaveModal(myRoomNumber);
                    setAgreedForfeitLeave(false);
                    setLeaveReason('');
                    setLeaveSuccess(false);
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-rose-600/20 btn-press cursor-pointer flex items-center gap-1.5"
                >
                  <span>Bàn Giao HĐ & Rời Phòng</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDismissRejectedCheckout(rejectedCheckoutRequest.id)}
                  className="px-3 py-2.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Đã Hiểu & Đóng
                </button>
              </div>
            </div>
          );
        }

        // 2. NGƯỜI ĐÃ TỪ CHỐI (Phạm Minh Cường): Thông báo đã từ chối & tiếp tục ở, TUYỆT ĐỐI KHÔNG CÓ NÚT BÀN GIAO HỢP ĐỒNG
        if (isMeRejecter) {
          return (
            <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-2 border-emerald-400 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md animate-fadeIn">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                  🛡️
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                    <span>Bạn Đã Từ Chối Trả Toàn Bộ Phòng</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">Giữ Phòng Ở Tiếp</span>
                  </h4>
                  <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                    Bạn đã từ chối yêu cầu trả toàn bộ phòng của người đại diện (<strong>{rejectedCheckoutRequest.tenant || 'Nguyễn Văn An'}</strong>). Phòng <strong>{myRoomNumber}</strong> sẽ tiếp tục được duy trì hợp đồng để bạn ở lại.
                  </p>
                  <p className="text-[11px] text-teal-800 font-medium mt-1">
                    💡 <em>Hệ thống đã thông báo cho người đại diện thực hiện thủ tục <strong>"Bàn Giao Hợp Đồng"</strong> sang cho bạn nếu họ muốn rời đi một mình. Bạn không cần làm gì thêm.</em>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDismissRejectedCheckout(rejectedCheckoutRequest.id)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Đã Hiểu & Đóng
                </button>
              </div>
            </div>
          );
        }

        // 3. THÀNH VIÊN Ở GHÉP KHÁC (nếu phòng 3+ người): Chỉ thông báo tình hình, không có nút bàn giao
        return (
          <div className="p-5 bg-gradient-to-r from-indigo-500/10 via-slate-500/10 to-indigo-500/10 border-2 border-indigo-300 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md animate-fadeIn">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                📢
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-indigo-950 flex items-center gap-2">
                  <span>Thông Báo: Đơn Trả Toàn Bộ Phòng Đã Bị Bác Bỏ</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-200 text-indigo-900">Tiếp Tục Thuê Phòng</span>
                </h4>
                <p className="text-xs text-indigo-900 mt-1 leading-relaxed">
                  Thành viên <strong>"{rejectedCheckoutRequest.rejectedBy || 'Bạn cùng phòng'}"</strong> không đồng ý trả phòng. Phòng <strong>{myRoomNumber}</strong> sẽ tiếp tục được duy trì hợp đồng bình thường.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDismissRejectedCheckout(rejectedCheckoutRequest.id)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
              >
                Đã Hiểu & Đóng
              </button>
            </div>
          </div>
        );
      })()}

      {/* BANNER 2: ĐƠN TRẢ PHÒNG ĐANG CHỜ BẠN CÙNG PHÒNG BIỂU QUYẾT */}
      {waitingCheckoutRequest && (
        <div className="p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border-2 border-indigo-400 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
              ⏳
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-indigo-950 flex items-center gap-2">
                <span>Đang Chờ Tất Cả Bạn Cùng Phòng Biểu Quyết Trả Phòng</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-200 text-indigo-900">
                  {waitingCheckoutRequest.roommateVotes?.filter(v => v.approved)?.length || 0} / {Math.max(1, (selectedCheckoutRoomObj?.occupants || 2) - 1)} Phiếu Đồng Ý
                </span>
              </h4>
              <p className="text-xs text-indigo-800 mt-1 leading-relaxed">
                Yêu cầu trả toàn bộ phòng {myRoomNumber} đã được gửi tới tất cả thành viên trong phòng. Theo quy định, đơn chỉ được chuyển đến Ban Quản Lý nghiệm thu khi <strong>100% các bạn cùng phòng đồng ý</strong>.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn hủy yêu cầu trả phòng này để tiếp tục ở không?')) {
                  cancelRoomRequest(waitingCheckoutRequest.id);
                  alert('Bạn đã rút lại yêu cầu trả phòng thành công. Phòng tiếp tục duy trì hoạt động bình thường.');
                }
              }}
              className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl border border-rose-200 shadow-sm hover:border-rose-400 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>↩️</span>
              <span>Hủy Trả Phòng (Ở Tiếp)</span>
            </button>
          </div>
        </div>
      )}

      {/* BANNER 3: ĐƠN TRẢ PHÒNG SẴN SÀNG CHỜ BQL NGHIỆM THU */}
      {pendingInspectionCheckoutRequest && (
        <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-2 border-emerald-400 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
              📋
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                <span>Đơn Trả Phòng Đang Chờ Ban Quản Lý Nghiệm Thu & Hoàn Cọc</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                  {pendingInspectionCheckoutRequest.status === 'ROOMMATES_APPROVED' ? 'Phòng Đã Duyệt 100%' : 'Chờ Nghiệm Thu'}
                </span>
              </h4>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                {pendingInspectionCheckoutRequest.status === 'ROOMMATES_APPROVED'
                  ? '100% cư dân trong phòng đã đồng thuận trả phòng. Ban Quản Lý đang xếp lịch kiểm kê thiết bị và chốt số điện nước để thanh lý hợp đồng.'
                  : 'Yêu cầu trả phòng của bạn đã được chuyển tới Ban Quản Lý để xếp lịch kiểm kê phòng và hoàn cọc.'}
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn hủy yêu cầu trả phòng này để tiếp tục ở không?')) {
                  cancelRoomRequest(pendingInspectionCheckoutRequest.id);
                  alert('Bạn đã rút lại yêu cầu trả phòng thành công. Hợp đồng và phòng tiếp tục duy trì bình thường.');
                }
              }}
              className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl border border-rose-200 shadow-sm hover:border-rose-400 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>↩️</span>
              <span>Hủy Trả Phòng (Ở Tiếp)</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Banner Khách Thuê */}
      <div className="bg-white relative overflow-hidden p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cổng Cư Dân Trực Tuyến • Định Danh CCCD (1 Khách - 1 Phòng)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Xin chào, {user?.fullName || 'Khách thuê'}!
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-xl">
              Bạn đang thuê phòng <strong className="text-purple-700 font-mono bg-purple-100 px-2 py-0.5 rounded-md">{myRoomNumber}</strong> tại {currentRoomObj.house}.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowContractModal(true)}
              className="btn-press px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs border border-slate-200/80 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Hợp Đồng Điện Tử (UC-T01)</span>
            </button>
            <Link
              to="/maintenance"
              className="btn-press px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-2xl text-xs border border-purple-200/80 transition-all flex items-center gap-2"
            >
              <Wrench className="w-4 h-4 text-purple-600" />
              <span>Báo Sự Cố</span>
            </Link>
            {/* Nút 'Rời Phòng (Dọn Ra Ngoài)': CHỈ dành cho Thành viên ở ghép (người đại diện đứng tên hợp đồng không dùng nút này) */}
            {!isRepresentative && hasRoommatesInRoom && (
              <button
                type="button"
                onClick={() => {
                  setLeaveModal(myRoomNumber);
                  setAgreedForfeitLeave(false);
                  setLeaveReason('');
                  setLeaveSuccess(false);
                }}
                className="btn-press px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-2xl text-xs border border-amber-200/80 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                title="Cá nhân dọn ra ngoài, không bắt buộc bạn cùng phòng phải trả theo (Dành cho thành viên ở ghép)"
              >
                <LogOut className="w-4 h-4 text-amber-600" />
                <span>Rời Phòng (Dọn Ra Ngoài)</span>
              </button>
            )}

            {/* Nút 'Bàn Giao HĐ & Rời Phòng': Dành cho Người đại diện khi phòng có bạn ở ghép */}
            {isRepresentative && hasRoommatesInRoom && (
              <button
                type="button"
                onClick={() => {
                  setLeaveModal(myRoomNumber);
                  setAgreedForfeitLeave(false);
                  setLeaveReason('');
                  setLeaveSuccess(false);
                  setSelectedSuccessor('');
                }}
                className="btn-press px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-2xl text-xs border border-amber-200/80 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                title="Đề xuất chuyển giao quyền đại diện Hợp đồng cho bạn cùng phòng để dọn ra ngoài"
              >
                <LogOut className="w-4 h-4 text-amber-600" />
                <span>Bàn Giao HĐ & Rời Phòng</span>
              </button>
            )}

            {/* Nút 'Trả Toàn Bộ Phòng (HĐ)': CHỈ Người đại diện đứng tên Hợp đồng mới có quyền thanh lý & trả phòng */}
            {isRepresentative && (
              <button
                type="button"
                disabled={hasUnpaidBillsForCheckout || hasPendingCheckoutRequest}
                onClick={() => {
                  if (hasUnpaidBillsForCheckout || hasPendingCheckoutRequest) return;
                  setCheckoutModal(myRoomNumber);
                  setAgreedForfeitDeposit(false);
                  setCheckoutReason('');
                  setCheckoutSuccess(false);
                }}
                className={`btn-press px-4 py-2.5 font-bold rounded-2xl text-xs border transition-all flex items-center gap-2 shadow-xs ${hasUnpaidBillsForCheckout || hasPendingCheckoutRequest
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60 pointer-events-none'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/80 cursor-pointer'
                  }`}
                title={
                  hasPendingCheckoutRequest
                    ? 'Đơn trả phòng của bạn đang chờ Ban Quản Lý phê duyệt & nghiệm thu. Nút đã bị khóa để tránh gửi trùng lặp!'
                    : hasUnpaidBillsForCheckout
                      ? 'Nút trả phòng đang bị mờ do phòng còn hóa đơn chưa thanh toán. Vui lòng thanh toán hết tiền phòng/điện nước để mở khóa!'
                      : 'Báo trả toàn bộ phòng & Quyết toán hoàn cọc (Chỉ Người đại diện ký HĐ mới có quyền)'
                }
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>{hasPendingCheckoutRequest ? 'Đang Chờ Duyệt Trả Phòng' : 'Trả Toàn Bộ Phòng (HĐ)'}</span>
                {hasPendingCheckoutRequest ? (
                  <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-md font-extrabold flex items-center gap-1">
                    <span>⏳</span> {waitingCheckoutRequest ? 'Chờ Biểu Quyết' : 'Chờ BQL duyệt'}
                  </span>
                ) : hasUnpaidBillsForCheckout ? (
                  <span className="text-[10px] bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded-md font-extrabold">
                    Khóa do còn nợ
                  </span>
                ) : null}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Bento Stat Cards cho Khách Thuê */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Phòng Thuê Hiện Tại */}
        <div className="bento-card p-5 space-y-3 stagger-item stagger-1 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phòng Thuê Hiện Tại</span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold ring-1 ring-indigo-500/10">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-3 py-1">
            <img
              src={getRoomImage(currentRoomObj)}
              alt="Ảnh phòng đang thuê"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{myRoomNumber}</span>
                <span className="text-xs text-slate-500 font-semibold">({currentRoomObj.floor || 'Tầng 1'})</span>
              </div>
              <div className="text-xs text-indigo-600 font-bold mt-0.5">
                {currentRoomObj.price?.toLocaleString('vi-VN')} đ/tháng
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>{currentRoomObj.house}</span>
            <span className="font-bold text-slate-700 font-mono">{currentRoomObj.area || 25} m²</span>
          </div>
        </div>

        {/* Card 2: Hiệu Lực Hợp Đồng */}
        <div className="bento-card p-5 space-y-3 stagger-item stagger-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hiệu Lực Hợp Đồng</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold ring-1 ring-emerald-500/10">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-extrabold text-emerald-700 tracking-tight">
            Đến {myActiveContract.endDate || '31/12/2026'}
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Mã Hợp Đồng:</span>
            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">{myActiveContract.id}</span>
          </div>
        </div>

        {/* Card 3: Cước Phí Tháng 9 */}
        <div className="bento-card p-5 space-y-3 stagger-item stagger-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cước Phí Kỳ Này</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold ring-1 ring-purple-500/10">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          {!myCurrentInvoice ? (
            <div className="space-y-2">
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">0 ₫</div>
              <div className="flex items-center gap-1.5 status-pill status-pill-success">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Đã thanh toán đủ cước phí</span>
              </div>
            </div>
          ) : myCurrentInvoice?.status === 'PENDING_METER' ? (
            <div className="space-y-1.5">
              <div className="status-pill status-pill-amber">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Chờ Chốt Điện Nước</span>
              </div>
              <p className="text-[11px] text-slate-400">Chủ trọ chưa chốt chỉ số điện nước tháng này</p>
            </div>
          ) : myCurrentInvoice?.status === 'PAID' ? (
            <div className="space-y-2">
              <div className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
                0 ₫
              </div>
              <div className="flex items-center justify-between gap-1 flex-wrap pt-0.5">
                <span className="status-pill status-pill-success">✓ Đã đóng đủ kỳ này ({(myCurrentInvoice?.total || 0).toLocaleString('vi-VN')} ₫)</span>
                <button
                  type="button"
                  onClick={() => {
                    if (resetRoomPaymentStatus) {
                      resetRoomPaymentStatus(myRoomNumber);
                      setPaySuccessToast('Đã mở lại trạng thái Chưa Thanh Toán để bạn kiểm thử SePay / VNPay / MoMo!');
                      setTimeout(() => setPaySuccessToast(null), 4000);
                    }
                  }}
                  className="text-[10px] text-indigo-700 hover:text-indigo-900 font-bold underline bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-200 cursor-pointer transition-colors"
                  title="Bấm để chuyển về Chưa thanh toán phục vụ kiểm thử"
                >
                  🔄 Mở lại để test
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {(myCurrentInvoice?.total || 0).toLocaleString('vi-VN')} ₫
              </div>
              <button
                onClick={() => setPayingInvoice(myCurrentInvoice)}
                className="btn-press w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Thanh Toán SePay VietQR / VNPay</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2 Cột Bento: Chi Tiết Phòng & Cư Dân Trong Phòng */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột 1: Thông tin phòng đang thuê */}
        <div className="bento-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Home className="w-4 h-4 text-indigo-600" />
              <span>Chi Tiết Phòng Thuê: {myRoomNumber}</span>
            </h3>
            <button
              onClick={() => setShowContractModal(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Toàn văn HĐ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 text-center text-xs">
            <div>
              <span className="text-slate-400 font-medium text-[11px]">Giá thuê / tháng</span>
              <div className="font-black text-indigo-700 text-sm mt-1 font-mono">
                {(currentRoomObj.price || 3500000).toLocaleString('vi-VN')} ₫
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-medium text-[11px]">Diện tích</span>
              <div className="font-bold text-slate-900 text-sm mt-1">{currentRoomObj.area || 25} m²</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium text-[11px]">Tối đa người</span>
              <div className="font-bold text-slate-900 text-sm mt-1">{currentRoomObj.maxOccupants || 2} người</div>
            </div>
          </div>

          <div className="text-xs space-y-2.5 text-slate-600">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span>Tiền cọc giữ chỗ:</span>
              <strong className="text-slate-900 font-mono">{(myActiveContract.deposit || 3500000).toLocaleString('vi-VN')} ₫</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span>Ngày bắt đầu hợp đồng:</span>
              <strong className="text-slate-900">{myActiveContract.startDate || '01/01/2026'}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span>Định danh cư dân:</span>
              <span className="status-pill status-pill-success">✓ Đã xác thực CCCD 12 số</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Tiêu chuẩn PCCC:</span>
              <span className="text-slate-800 font-semibold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đạt chuẩn QCVN 06:2022</span>
              </span>
            </div>
          </div>
        </div>

        {/* Cột 2: Cư Dân Trong Phòng & Ở Ghép */}
        <div className="bento-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Cư Dân Trong Phòng ({totalOccupants}/{maxOccupants} người)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ẩn 4 số cuối CCCD theo Nghị định 13/2023/NĐ-CP
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isRoomFull ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                  <span>🔒</span>
                  <span>Đã đủ {totalOccupants}/{maxOccupants}</span>
                </span>
              ) : (
                <>
                  <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                    Còn trống {Math.max(0, maxOccupants - totalOccupants)} chỗ
                  </span>
                  <button
                    onClick={() => setShowRoommateModal(true)}
                    className="btn-press flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Gửi CCCD Xin Ở Ghép</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {currentRoomResidents.map((m) => {
              const isRep = m.roleInRoom === 'REPRESENTATIVE';
              const uName = (user?.fullName || '').toLowerCase().trim();
              const uPhone = (user?.phone || '').trim();
              const mName = (m.fullName || '').toLowerCase().trim();
              const mPhone = (m.phone || '').trim();
              const isMe = Boolean(
                (uName && mName && (
                  mName === uName ||
                  (uName.includes('cường') && mName.includes('cường')) ||
                  (uName.includes('an') && mName.includes('an')) ||
                  (uName.includes('nam') && mName.includes('nam'))
                )) ||
                (uPhone && mPhone && uPhone === mPhone)
              );
              const maskedCccd = m.maskedCccd || (m.cccd ? m.cccd.slice(0, 8) + '****' : (isRep ? '00120101****' : '00120109****'));

              return (
                <div
                  key={m.id || m.fullName}
                  className={`rounded-2xl shadow-xs space-y-2.5 transition-colors ${isRep
                      ? 'p-4 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 border border-indigo-200/80'
                      : 'p-3.5 bg-slate-50/80 border border-slate-200/80 hover:bg-slate-100/60'
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
                          {m.fullName}
                        </span>
                        <span className="status-pill status-pill-indigo">
                          {isRep ? '🔑 Đại Diện Ký Hợp Đồng' : '👤 Thành Viên Ở Ghép'}
                        </span>
                        {isMe && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-200">
                            Bạn
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {isRep ? `Khách thuê chính đứng tên phòng ${myRoomNumber}` : `Cư dân ở ghép cùng phòng ${myRoomNumber}`}
                      </p>
                    </div>
                    <span className="status-pill status-pill-success">
                      {isRep ? '🟢 Đang Cư Trú' : '🟢 Đã đăng ký tạm trú'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                    <div className="bg-white/90 p-2 rounded-xl border border-slate-200/60">
                      <div className="text-slate-400 text-[10px] font-medium">Số CCCD 12 số</div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {maskedCccd}
                      </div>
                    </div>
                    <div className="bg-white/90 p-2 rounded-xl border border-slate-200/60">
                      <div className="text-slate-400 text-[10px] font-medium">Số điện thoại</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {m.phone || 'Chưa cập nhật'}
                      </div>
                    </div>
                    <div className="bg-white/90 p-2 rounded-xl border border-slate-200/60">
                      <div className="text-slate-400 text-[10px] font-medium">Quê quán</div>
                      <div className="font-bold text-slate-800 mt-0.5 truncate">
                        {m.hometown || (m.fullName?.toLowerCase().includes('cường') ? 'Hải Phòng' : 'Nam Định')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Nếu chưa có cư dân */}
            {currentRoomResidents.length === 0 && (
              <div className="p-4 bg-slate-50 text-center text-slate-400 text-xs rounded-2xl">
                Chưa có dữ liệu cư dân phòng này.
              </div>
            )}

            {/* Nếu chưa đủ người và còn chỗ trống */}
            {!isRoomFull && (
              <div className="p-3.5 bg-slate-50/70 border border-dashed border-slate-300 rounded-2xl flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Phòng hiện tại còn trống <strong>{Math.max(0, maxOccupants - totalOccupants)} chỗ</strong>. Bạn có thể bấm nút <strong>+ Gửi CCCD Xin Ở Ghép</strong> để gửi hồ sơ cho Chủ trọ.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Xem Toàn Văn Hợp Đồng Điện Tử (UC-T01) */}
      <ResidentContractModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        contract={myActiveContract}
        onSignSuccess={(contractId) => {
          signContractElectronically(contractId);
        }}
      />

      {/* Modal Gửi CCCD Xin Ở Ghép Cho Chủ Trọ Duyệt (UC-T07) */}
      <RoommateRequestModal
        isOpen={showRoommateModal}
        onClose={() => setShowRoommateModal(false)}
        userRoom={currentRoomObj}
        activeContract={myActiveContract}
      />

      {/* Cổng Thanh toán Đa Kênh VNPay / MoMo / VietQR cho Khách Thuê */}
      <PaymentModal
        isOpen={!!payingInvoice}
        onClose={() => setPayingInvoice(null)}
        onSuccess={(paidInv, payMethod) => {
          const methodLabel = payMethod === 'VNPAY' ? 'Cổng VNPay' : (payMethod === 'MOMO' ? 'Ví MoMo' : 'SePay VietQR');
          payInvoice(payingInvoice.id, methodLabel);
          setPayingInvoice(null);
          setPeriodFeePaid(true);
          setPaySuccessToast(`Đã thanh toán thành công qua ${methodLabel} cho hóa đơn ${payingInvoice.code}!`);
          setTimeout(() => setPaySuccessToast(null), 6000);
        }}
        invoice={payingInvoice || undefined}
      />

      {/* Modal Rời Phòng Cá Nhân (Dọn ra ngoài) */}
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
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 success-pop-icon ${
                  isRepresentative && otherRoommates.length > 0 ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {isRepresentative && otherRoommates.length > 0 ? 'Đã Gửi Đề Xuất Bàn Giao Hợp Đồng!' : 'Đã Rời Phòng Thành Công!'}
                </h3>
                <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                  {isRepresentative && otherRoommates.length > 0 ? (
                    <>
                      Hệ thống đã gửi yêu cầu tiếp quản Hợp đồng phòng <strong className="text-purple-700">Phòng {typeof leaveModal === 'string' ? leaveModal : leaveModal?.number}</strong> đến bạn <strong className="text-slate-900">{selectedSuccessor}</strong>. Bạn ấy cần bấm [Đồng Ý] để hoàn tất thủ tục bàn giao.
                    </>
                  ) : (
                    <>
                      Bạn đã rút tên khỏi <strong className="text-emerald-700">Phòng {typeof leaveModal === 'string' ? leaveModal : leaveModal?.number}</strong>. Cổng khách thuê đã được cập nhật về trạng thái chưa thuê phòng.
                    </>
                  )}
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Phòng:</span>
                    <span className="font-bold text-slate-900">
                      {typeof leaveModal === 'string' ? leaveModal : leaveModal?.number}
                    </span>
                  </div>
                  {isRepresentative && otherRoommates.length > 0 ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Người nhận bàn giao:</span>
                        <span className="font-bold text-purple-700">{selectedSuccessor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Trạng thái:</span>
                        <span className="font-semibold text-amber-700">Chờ bạn cùng phòng đồng ý</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Tình trạng:</span>
                        <span className="font-bold text-emerald-700">Đã cập nhật cổng khách thuê</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Bạn cùng phòng:</span>
                        <span className="font-semibold text-slate-800">Không bị ảnh hưởng</span>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLeaveModal(null);
                    setLeaveSuccess(false);
                    setAgreedForfeitLeave(false);
                    setLeaveReason('');
                    setSelectedSuccessor('');
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
                        {isRepresentative && otherRoommates.length > 0 ? 'Bàn Giao HĐ & Rời Phòng' : 'Rời Khỏi Phòng Thuê (Cá Nhân)'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Phòng {typeof leaveModal === 'string' ? leaveModal : leaveModal?.number}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLeaveModal(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 btn-press-ghost cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!hasRoommatesInRoom ? (
                  <div className="my-3 p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-xs text-amber-950 space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>Phòng hiện chỉ có 1 mình bạn đang thuê!</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Nghiệp vụ <strong>"Rời phòng"</strong> chỉ dành cho trường hợp ở ghép có từ 2 người trở lên (rút tên cá nhân để các bạn khác tiếp tục ở). Vì bạn đang ở 1 mình, khi dọn đi bạn cần chọn chức năng <strong>"Trả Toàn Bộ Phòng"</strong> để hoàn tất thủ tục bàn giao và thanh lý cọc với Chủ trọ/BQL.
                    </p>
                    <div className="pt-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setLeaveModal(null);
                          setCheckoutModal(myRoomNumber);
                          setAgreedForfeitDeposit(false);
                          setCheckoutReason('');
                          setCheckoutSuccess(false);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold rounded-xl shadow-md text-xs transition-all flex items-center gap-1.5 cursor-pointer btn-press"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Chuyển Sang Trả Toàn Bộ Phòng</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="my-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950">
                      <span>🚪</span>
                      <span>Quyền lợi Rời phòng cá nhân (Ở ghép)</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Bạn đang thực hiện rời khỏi phòng <strong>{typeof leaveModal === 'string' ? leaveModal : leaveModal?.number}</strong>. Thao tác này chỉ rút tên riêng của bạn khỏi phòng này, <strong>không yêu cầu bạn cùng phòng biểu quyết</strong> và <strong>không làm gián đoạn hợp đồng của các bạn cùng phòng khác</strong>.
                    </p>
                    <p className="text-[11px] text-rose-700 font-semibold pt-1 border-t border-amber-200/60">
                      ⚠️ Lưu ý: Tự nguyện rời phòng trước hạn sẽ không được hoàn lại tiền cọc cá nhân.
                    </p>
                  </div>
                )}

                {hasUnpaidBillsForLeave ? (
                  <div className="my-3 p-3.5 bg-rose-50 rounded-2xl border-2 border-rose-200 text-xs text-rose-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-rose-900">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Chưa đủ điều kiện rời phòng ({unpaidInvoicesForLeave.length} hóa đơn chưa nộp)</span>
                      </div>
                      <span className="font-extrabold font-mono text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg">
                        {totalUnpaidForLeave.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-800 leading-relaxed">
                      Theo quy định, bạn phải hoàn tất thanh toán toàn bộ hóa đơn tiền phòng & sinh hoạt trước khi rời phòng:
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {unpaidInvoicesForLeave.map((inv) => (
                        <div key={inv.id} className="p-2.5 bg-white/90 rounded-xl border border-rose-200 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-800">{inv.code} - {inv.title || 'Hóa đơn tiền phòng'}</div>
                            <div className="text-[11px] text-slate-500 font-mono font-bold text-rose-600">
                              {(inv.total || 0).toLocaleString('vi-VN')} đ
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              payInvoice(inv.id, 'SePay VietQR');
                              setPaySuccessToast(`Đã thanh toán nhanh thành công hóa đơn ${inv.code}!`);
                              setTimeout(() => setPaySuccessToast(null), 5000);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 shadow-xs cursor-pointer btn-press"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Thanh Toán Nhanh</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="my-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">
                      Bạn đã hoàn tất toàn bộ hóa đơn tiền phòng & sinh hoạt. Đủ điều kiện rời phòng.
                    </span>
                  </div>
                )}

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (isRepresentative && otherRoommates.length > 0) {
                    if (!selectedSuccessor) {
                      alert('Vui lòng chọn 1 bạn cùng phòng để bàn giao quyền đại diện Hợp đồng trước khi rời phòng!');
                      return;
                    }
                    if (proposeContractTransfer) {
                      const res = proposeContractTransfer(myRoomNumber, user?.fullName, selectedSuccessor, leaveReason);
                      if (res?.error) {
                        alert(res.message);
                        return;
                      }
                      setLeaveSuccess(true);
                    }
                  } else {
                    handleSendLeave(e);
                  }
                }} className="space-y-4 text-xs">
                  {isRepresentative && otherRoommates.length > 0 ? (
                    <div className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 font-bold text-purple-950">
                        <span>👑</span>
                        <span>Bắt buộc bàn giao Hợp đồng đại diện</span>
                      </div>
                      <p className="text-[11px] text-purple-900 leading-relaxed">
                        Bạn hiện là <strong>Người đại diện đứng tên Hợp đồng</strong> của phòng {myRoomNumber}. Vì phòng vẫn còn {otherRoommates.length} bạn cùng phòng tiếp tục ở, bạn bắt buộc phải chọn 1 người để chuyển giao quyền đại diện Hợp đồng trước khi rời phòng.
                      </p>
                      <div>
                        <label className="block font-bold text-purple-950 mb-1">
                          Chọn bạn cùng phòng nhận lại Hợp đồng:
                        </label>
                        <select
                          value={selectedSuccessor}
                          onChange={(e) => setSelectedSuccessor(e.target.value)}
                          className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        >
                          <option value="">-- Chọn thành viên tiếp quản hợp đồng --</option>
                          {otherRoommates.map((m) => (
                            <option key={m.id || m.fullName} value={m.fullName}>
                              {m.fullName} ({m.phone || 'Thành viên phòng'})
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-[10px] text-purple-700 italic pt-1 border-t border-purple-200/60">
                        💡 Khi bàn giao, Hợp đồng sẽ tự động cập nhật tên người ký mới. Ngày hết hạn, tiền cọc và điều khoản hợp đồng được giữ nguyên vẹn.
                      </p>
                    </div>
                  ) : null}

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
                        Tôi xác nhận tự nguyện dọn ra ngoài, hoàn tất bàn giao và chấp nhận các điều khoản rời phòng cá nhân.
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
                      disabled={!agreedForfeitLeave || hasUnpaidBillsForLeave || (isRepresentative && otherRoommates.length > 0 && !selectedSuccessor)}
                      className={`px-5 py-2.5 font-bold rounded-xl shadow-md transition-all btn-press flex items-center gap-1.5 cursor-pointer ${agreedForfeitLeave && !hasUnpaidBillsForLeave && (!isRepresentative || otherRoommates.length === 0 || selectedSuccessor)
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        }`}
                    >
                      <span>{isRepresentative && otherRoommates.length > 0 ? 'Gửi Đề Xuất Bàn Giao HĐ' : 'Xác Nhận Rời Phòng'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Trả Toàn Bộ Phòng (HĐ) - Đại diện ký hợp đồng */}
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
                  {rejectedTransferProposal
                    ? 'Đã Gửi Yêu Cầu Trả Phòng Lên Ban Quản Lý!'
                    : (isCheckoutRoomMulti ? 'Đã Gửi Yêu Cầu Biểu Quyết Trả Phòng!' : 'Đã Gửi Yêu Cầu Trả Phòng!')}
                </h3>
                <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                  {rejectedTransferProposal ? (
                    <>
                      Do bạn cùng phòng đã từ chối tiếp quản hợp đồng, cơ chế <strong>Deadlock-Breaker</strong> đã kích hoạt: Yêu cầu trả toàn bộ <strong className="text-rose-600">Phòng {typeof checkoutModal === 'string' ? checkoutModal : checkoutModal?.number}</strong> đã được chuyển thẳng tới Ban Quản Lý nghiệm thu mà không cần chờ bạn cùng phòng biểu quyết.
                    </>
                  ) : isCheckoutRoomMulti ? (
                    <>
                      Do phòng <strong className="text-rose-600">Phòng {typeof checkoutModal === 'string' ? checkoutModal : checkoutModal?.number}</strong> hiện có {checkoutOccupantsCount} người ở, yêu cầu trả phòng đã được gửi tới tất cả bạn cùng phòng để biểu quyết. Khi tất cả cùng đồng ý, đơn sẽ tự động chuyển tới Ban Quản Lý phê duyệt.
                    </>
                  ) : (
                    <>
                      Phòng chỉ có 1 mình bạn nên yêu cầu đã được chuyển thẳng tới Ban Quản Lý để xếp lịch kiểm kê và hoàn tất thủ tục thanh lý.
                    </>
                  )}
                </p>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 mb-5 text-left">
                  📞 Nhân viên quản lý cơ sở sẽ liên hệ trực tiếp sau khi hoàn tất các thủ tục theo quy định.
                </div>

                <button
                  type="button"
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
                        {isCheckoutRoomMulti ? 'Yêu Cầu Biểu Quyết Trả Toàn Bộ Phòng' : 'Yêu Cầu Trả Toàn Bộ Phòng'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Phòng {typeof checkoutModal === 'string' ? checkoutModal : checkoutModal?.number} (Hiện có {checkoutOccupantsCount} người đang ở)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutModal(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 btn-press-ghost cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {rejectedTransferProposal ? (
                  <div className="my-3 p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs space-y-1.5 text-rose-950">
                    <div className="flex items-center gap-1.5 font-extrabold text-rose-900">
                      <span>⚡</span>
                      <span>Cơ Chế Deadlock-Breaker: Gửi Thẳng Lên Ban Quản Lý</span>
                    </div>
                    <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
                      Bạn cùng phòng <strong>{rejectedTransferProposal.rejectedBy || rejectedTransferProposal.toTenant}</strong> đã từ chối nhận tiếp quản Hợp đồng. Do đó, đơn trả toàn bộ phòng này sẽ <strong>bỏ qua bước biểu quyết</strong> và được gửi thẳng tới Ban Quản Lý để xếp lịch nghiệm thu bàn giao.
                    </p>
                  </div>
                ) : isCheckoutRoomMulti ? (
                  <div className="my-3 p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs space-y-1.5 text-indigo-900">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>👥</span>
                      <span>Quy Định Phòng Có Người Khác: Phải Hỏi Tất Cả Mọi Người</span>
                    </div>
                    <p className="text-[11px] text-indigo-800 leading-relaxed font-medium">
                      Phòng này hiện có <strong>{checkoutOccupantsCount} người</strong>. Vì việc trả phòng ảnh hưởng đến toàn bộ cư dân trong phòng, hệ thống sẽ gửi thông báo biểu quyết tới <strong>tất cả các bạn cùng phòng</strong>. Đơn chỉ được chuyển tới Ban Quản Lý khi <strong>tất cả mọi người đều đồng ý</strong>.
                    </p>
                    <p className="text-[11px] text-amber-900 font-semibold pt-1 border-t border-indigo-200/60">
                      💡 Mẹo: Nếu bạn muốn dọn ra ngoài và để các bạn khác tiếp tục ở, vui lòng chọn <strong>[Bàn Giao HĐ & Rời Phòng]</strong> để chuyển giao quyền đại diện HĐ.
                    </p>
                  </div>
                ) : null}

                {isContractExpired ? (
                  <div className="my-3.5 p-3.5 bg-emerald-50 rounded-2xl border-2 border-emerald-300 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-950">
                      <span>🟢</span>
                      <span>Hợp đồng đã hết hạn: Đủ điều kiện hoàn cọc</span>
                    </div>
                    <p className="text-[11px] text-emerald-900 leading-relaxed">
                      Hợp đồng thuê phòng của bạn đã kết thúc đúng hạn. Ban Quản Lý sẽ nghiệm thu phòng và hoàn lại tiền cọc (ước tính: <strong>3.500.000 đ</strong> sau khi trừ chi phí hư hỏng nếu có).
                    </p>
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2">
                      <div className="font-bold text-slate-800 text-xs">Thông tin nhận hoàn cọc của bạn:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Ngân hàng:</label>
                          <input
                            type="text"
                            value={refundBank}
                            onChange={(e) => setRefundBank(e.target.value)}
                            placeholder="VD: Vietcombank, MB..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Số tài khoản:</label>
                          <input
                            type="text"
                            value={refundAccountNumber}
                            onChange={(e) => setRefundAccountNumber(e.target.value)}
                            placeholder="Số tài khoản..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold focus:bg-white"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Tên chủ tài khoản:</label>
                          <input
                            type="text"
                            value={refundAccountName}
                            onChange={(e) => setRefundAccountName(e.target.value)}
                            placeholder="Họ và tên chủ tài khoản..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold uppercase focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
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
                )}

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
                      className={`px-5 py-2.5 font-bold rounded-xl shadow-md transition-all btn-press flex items-center gap-1.5 cursor-pointer ${agreedForfeitDeposit
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
    </div>
  );
}
