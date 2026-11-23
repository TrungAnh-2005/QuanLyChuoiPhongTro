import HoldDepositDetails from '../../rooms/components/HoldDepositDetails.jsx';
import { tenantRoomRequests, isRentalRequest } from '../../rooms/room.rules.js';
import { useTenantResidency } from '../../tenants/useTenantResidency';
import { useReservationRefresh } from '../../rooms/useReservationRefresh.js';
import LeaveRoomModal from '../components/LeaveRoomModal.jsx';
import CheckoutRequestModal from '../components/CheckoutRequestModal.jsx';
import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Users, Receipt, CheckCircle2, Clock, CreditCard, Wrench, ShieldCheck, X, LogOut, UserPlus, FileText, Sparkles, ChevronRight, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useData } from '../../../shared/data/RentalDataContext';

function getRoomImage(room) {
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

import ResidentContractModal from '../../contracts/components/ResidentContractModal';
import RoommateRequestModal from '../../contracts/components/RoommateRequestModal';
import PaymentModal from '../../payments/components/PaymentModal';

export default function UserDashboard() {
  const { user } = useAuth();
  const { currentTenant: linkedTenant } = useTenantResidency();
  const {
    invoices = [],
    allInvoices = [],
    payInvoice,
    rooms = [],
    tenants = [],
    contracts = [],
    roomRequests = [],
    roomMembers = [],
    resetRoomPaymentStatus,
    signContractElectronically,
    leaveRoom,
    submitCheckoutRequest,
    voteRoommateRequest
  } = useData();

  // Modals state for Tenant
  const [showContractModal, setShowContractModal] = useState(false);
  const [showRoommateModal, setShowRoommateModal] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paySuccessToast, setPaySuccessToast] = useState(null);

  // Modal Rời phòng & Trả phòng dành cho Cổng Khách Thuê
  const [leaveModal, setLeaveModal] = useState(null);
  const [leaveReason, setLeaveReason] = useState('');
  const [agreedForfeitLeave, setAgreedForfeitLeave] = useState(false);
  const [leaveSuccess, setLeaveSuccess] = useState(false);

  const [checkoutModal, setCheckoutModal] = useState(null);
  const [checkoutReason, setCheckoutReason] = useState('');
  const [agreedForfeitDeposit, setAgreedForfeitDeposit] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Trạng thái chuyển giao Hợp đồng khi Người đại diện rời phòng
  const [selectedSuccessor, setSelectedSuccessor] = useState('');

  // Thông tin nhận lại cọc khi trả phòng đúng hạn kết thúc HĐ
  const [refundBank, setRefundBank] = useState('Vietcombank');
  const [refundAccountNumber, setRefundAccountNumber] = useState('');
  const [refundAccountName, setRefundAccountName] = useState('');

  // Tìm hợp đồng của khách thuê
  const myTenant = linkedTenant;

  const myContract = useMemo(() => {
    if (!myTenant) return null;
    const mine = contracts.filter(c => c.tenantId === myTenant.id || roomMembers.some(m =>
      m.contractId === c.id && m.tenantId === myTenant.id && m.status === 'ACTIVE'
    ));
    return mine.find(c => c.status === 'PENDING_DEPOSIT' || c.status === 'PENDING_SIGN')
      || mine.find(c => c.status === 'ACTIVE') || null;
  }, [contracts, roomMembers, myTenant]);

  // Kiểm tra hợp đồng đang chờ nộp cọc hoặc chờ ký:
  const isContractPending = Boolean(
    myContract &&
    myContract.status !== 'ACTIVE' &&
    myContract.status !== 'CANCELLED' && (
      myContract.status === 'PENDING_DEPOSIT' ||
      myContract.status === 'PENDING_SIGN'
    ) &&
    (!myContract.depositPaid || !myContract.signedElectronically)
  );

  // Đơn đăng ký thuê phòng đang chờ Quản lý duyệt hồ sơ
  const myPendingRentalRequest = tenantRoomRequests(roomRequests, myTenant?.id).find(request => isRentalRequest(request) && ['HOLDING', 'PENDING'].includes(request.status));
  useReservationRefresh(myPendingRentalRequest?.status === 'HOLDING');

  const myMembership = useMemo(() => roomMembers.find(m =>
    m.tenantId === myTenant?.id && m.status === 'ACTIVE'
      && contracts.some(c => c.id === m.contractId && c.status === 'ACTIVE')
  ), [roomMembers, myTenant, contracts]);

  const myRentalContract = useMemo(() => contracts.find(c => c.status === 'ACTIVE'
    && (c.tenantId === myTenant?.id || c.id === myMembership?.contractId)
  ), [contracts, myTenant, myMembership]);

  const myRoomNumber = isContractPending ? null : myRentalContract?.roomNumber || null;
  const isRepresentative = Boolean(myRentalContract && myRentalContract.tenantId === myTenant?.id);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'checkout' && myRoomNumber) {
      if (isRepresentative) {
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
      setLeaveModal(myRoomNumber);
      setAgreedForfeitLeave(false);
      setLeaveReason('');
      setLeaveSuccess(false);
    }
  }, [myRoomNumber, isRepresentative]);

  const selectedCheckoutRoomObj = useMemo(() => {
    if (!checkoutModal) return null;
    const num = typeof checkoutModal === 'string' ? checkoutModal : checkoutModal?.number;
    return rooms.find(r => r.id === myRentalContract?.roomId && r.number === num);
  }, [checkoutModal, rooms, myRentalContract]);

  const isCheckoutRoomMulti = (selectedCheckoutRoomObj?.occupants || 1) > 1;

  const unpaidInvoicesForLeave = useMemo(() => {
    if (!leaveModal) return [];
    return (allInvoices || []).filter(inv =>
      inv.roomId === myRentalContract?.roomId && inv.tenantId === myTenant?.id
        && inv.status !== 'PAID' && inv.status !== 'CANCELLED'
    );
  }, [leaveModal, allInvoices, myRentalContract, myTenant]);

  const hasUnpaidBillsForLeave = unpaidInvoicesForLeave.length > 0;
  const totalUnpaidForLeave = unpaidInvoicesForLeave.reduce((sum, inv) => sum + (Number(inv.totalAmount ?? inv.total) || 0), 0);

  const hasUnpaidBillsForCheckout = useMemo(() => allInvoices.some(inv =>
    inv.roomId === myRentalContract?.roomId && !['PAID', 'CANCELLED'].includes(inv.status)
  ), [allInvoices, myRentalContract]);

  const myActiveContract = myRentalContract || myContract;

  const isContractExpired = useMemo(() => {
    const value = myActiveContract?.endDate;
    if (!value) return false;
    const iso = value.includes('/') ? value.split('/').reverse().join('-') : value.slice(0, 10);
    const end = new Date(`${iso}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !Number.isNaN(end.getTime()) && end <= today;
  }, [myActiveContract]);

  const otherRoommates = useMemo(() => (roomMembers || []).filter(m =>
    m.contractId === myRentalContract?.id && m.roomId === myRentalContract?.roomId
      && m.status === 'ACTIVE' && m.tenantId !== myTenant?.id
  ), [roomMembers, myRentalContract, myTenant]);

  const pendingRoommateRequests = useMemo(() => {
    if (!myRoomNumber) return [];
    const uName = (user?.fullName || '').toLowerCase().trim();
    return (roomRequests || []).filter((req) => {
      const isTarget = req.targetRoom === myRoomNumber;
      const isWaiting = req.status === 'WAITING_ROOMMATES';
      const hasNotVoted = !(req.roommateVotes || []).some(
        (v) => (v.voter || '').toLowerCase().trim() === uName
      );
      return isTarget && isWaiting && hasNotVoted;
    });
  }, [myRoomNumber, roomRequests, user]);

  const handleSendLeave = async (e) => {
try {

    e.preventDefault();
    if (!leaveModal || !agreedForfeitLeave || hasUnpaidBillsForLeave) return;
    const roomNumber = typeof leaveModal === 'string' ? leaveModal : leaveModal.number;
    if (isRepresentative && otherRoommates.length > 0 && !selectedSuccessor) return;
    const res = await leaveRoom(roomNumber, user?.fullName, {
      roomId: myRentalContract?.roomId,
      successorTenantId: selectedSuccessor ? Number(selectedSuccessor) : null,
      reason: leaveReason
    });
    if (res?.success) {
      setLeaveSuccess(true);
    } else {
      alert(res?.message || 'Không thể rời phòng do chưa hoàn tất nghĩa vụ tài chính.');
    }

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
};

  const handleSendCheckout = async (e) => {
    e.preventDefault();
    if (!checkoutModal || checkoutSubmitting || (!isContractExpired && !agreedForfeitDeposit)) return;
    setCheckoutError('');
    if (!myRentalContract || !isRepresentative) {
      setCheckoutError('Chỉ người đại diện hợp đồng đang thuê được yêu cầu trả toàn bộ phòng.');
      return;
    }
    if (hasUnpaidBillsForCheckout) {
      setCheckoutError('Vui lòng thanh toán các hóa đơn còn nợ trước khi trả phòng.');
      return;
    }
    if (isContractExpired && (!refundBank.trim() || !refundAccountNumber.trim())) {
      setCheckoutError('Vui lòng nhập ngân hàng và số tài khoản nhận hoàn cọc.');
      return;
    }
    setCheckoutSubmitting(true);
    try {
      await submitCheckoutRequest({
        room: myRentalContract.roomNumber, roomId: myRentalContract.roomId,
        contractId: myRentalContract.id, tenantId: myTenant.id,
        reason: checkoutReason, forfeitDeposit: !isContractExpired,
        refundBank, refundAccountNumber, refundAccountName: refundAccountName || user?.fullName,
      });
      setCheckoutSuccess(true);
    } catch (error) {
      setCheckoutError(error.message || 'Không thể gửi yêu cầu trả phòng.');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

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
    const rentedRoom = rooms.find(r => r.id === myRentalContract?.roomId);
    if (rentedRoom) return rentedRoom;
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
  }, [rooms, myRoomNumber, myContract, currentTenant, user, roomMembers, myRentalContract]);

  const roommates = useMemo(() => {
    const myNameNorm = (currentTenant?.fullName || user?.fullName || '').toLowerCase().trim();
    const maxCapacity = currentRoomObj?.maxOccupants || 2;
    const maxAllowedRoommates = Math.max(0, maxCapacity - 1);

    const otherRoomTenants = new Set(
      tenants
        .filter((t) => {
          const r = t.rooms && t.rooms.length > 0 ? t.rooms[0] : t.room;
          return r && r !== myRoomNumber;
        })
        .map((t) => (t.fullName || '').toLowerCase().trim())
    );

    const fromMembers = roomMembers.filter((m) => {
      if (m.roomNumber !== myRoomNumber) return false;
      if (m.status === 'MOVED_OUT') return false;
      const mNameNorm = (m.fullName || '').toLowerCase().trim();

      if (mNameNorm === myNameNorm || mNameNorm.includes(myNameNorm) || myNameNorm.includes(mNameNorm)) {
        return false;
      }

      if (m.roleInRoom !== 'MEMBER') {
        return false;
      }

      if (otherRoomTenants.has(mNameNorm)) {
        return false;
      }

      return true;
    });

    return fromMembers.slice(0, maxAllowedRoommates);
  }, [roomMembers, myRoomNumber, currentTenant, currentRoomObj, tenants]);

  const maxOccupants = currentRoomObj?.maxOccupants || 2;
  const totalOccupants = Math.min(maxOccupants, 1 + roommates.length);
  const isRoomFull = totalOccupants >= maxOccupants;

  const myCurrentInvoice = useMemo(() => {
    if (!myRoomNumber || isContractPending) return null;
    return invoices.find((inv) => inv.room === myRoomNumber && (!inv.houseCode || inv.houseCode === currentRoomObj?.houseCode)) || null;
  }, [invoices, myRoomNumber, currentRoomObj, isContractPending]);

  // =========================================================================
  // 1A. GIAO DIỆN BẮT BUỘC: NỘP TIỀN CỌC & KÝ HỢP ĐỒNG ĐIỆN TỬ (ONBOARDING GATE)
  // =========================================================================
  if (isContractPending && myContract) {
    return <section className="bento-card p-6 space-y-3">
      <h1 className="text-xl font-bold">Hợp đồng đang chờ xác nhận tiền cọc</h1>
      <p className="text-sm text-slate-600">Vui lòng liên hệ quản lý cơ sở để xác nhận tiền thực nhận. Hợp đồng và quyền cư trú chỉ được kích hoạt sau khi máy chủ xác nhận đủ tiền cọc.</p>
      {myPendingRentalRequest && <HoldDepositDetails request={myPendingRentalRequest} />}
      <Link to="/rooms" className="text-purple-700 font-bold text-sm">Xem đơn của tôi</Link>
    </section>;
  }

  if (!myRoomNumber) {
    return (
      <div className="space-y-6 page-enter">
        {myPendingRentalRequest && <section className="bento-card p-5 border border-amber-200 space-y-3">
          <h2 className="font-bold text-slate-900">{myPendingRentalRequest.status === 'HOLDING' ? 'Phòng đang đặt cọc' : 'Yêu cầu thuê phòng đang chờ duyệt'}</h2>
          <HoldDepositDetails request={myPendingRentalRequest} />
          <p className="text-xs text-slate-600">Liên hệ quản lý cơ sở nếu cần hủy đặt cọc hoặc đối soát khoản đã nộp.</p>
          <Link to="/rooms" className="inline-block text-xs font-bold text-purple-700">Xem đơn đặt cọc và lịch sử</Link>
        </section>}

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
              <div className="font-bold text-slate-900 mt-1">{user?.hometown || 'Hà Nội'}</div>
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
                  onClick={async () => {
try {

                    if (voteRoommateRequest) {
                      await voteRoommateRequest(req.id, user?.fullName, false);
                    }

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
}}
                  className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold rounded-xl text-xs transition-colors btn-press-ghost cursor-pointer"
                >
                  ❌ Từ Chối
                </button>
                <button
                  type="button"
                  onClick={async () => {
try {

                    if (voteRoommateRequest) {
                      await voteRoommateRequest(req.id, user?.fullName, true);
                    }

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
}}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 btn-press cursor-pointer flex items-center gap-1.5"
                >
                  <span>✅ Đồng Ý</span>
                </button>
              </div>
            </div>
          ))}
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
            <button
              type="button"
              onClick={() => {
                setLeaveModal(myRoomNumber);
                setAgreedForfeitLeave(false);
                setLeaveReason('');
                setLeaveSuccess(false);
              }}
              className="btn-press px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-2xl text-xs border border-amber-200/80 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              title="Cá nhân dọn ra ngoài, không bắt buộc bạn cùng phòng phải trả theo"
            >
              <LogOut className="w-4 h-4 text-amber-600" />
              <span>Rời Phòng (Dọn Ra Ngoài)</span>
            </button>

            {isRepresentative && (
              <button
                type="button"
                disabled={hasUnpaidBillsForCheckout}
                onClick={() => {
                  if (hasUnpaidBillsForCheckout) return;
                  setCheckoutModal(myRoomNumber);
                  setAgreedForfeitDeposit(false);
                  setCheckoutReason('');
                  setCheckoutSuccess(false);
                }}
                className={`btn-press px-4 py-2.5 font-bold rounded-2xl text-xs border transition-all flex items-center gap-2 shadow-xs ${
                  hasUnpaidBillsForCheckout
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/80 cursor-pointer'
                }`}
                title={
                  hasUnpaidBillsForCheckout
                    ? 'Nút trả phòng đang bị mờ do phòng còn hóa đơn chưa thanh toán. Vui lòng thanh toán hết tiền phòng/điện nước để mở khóa!'
                    : 'Báo trả toàn bộ phòng & Quyết toán hoàn cọc (Chỉ Người đại diện ký HĐ mới có quyền)'
                }
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Trả Toàn Bộ Phòng (HĐ)</span>
                {hasUnpaidBillsForCheckout && (
                  <span className="text-[10px] bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded-md font-extrabold">
                    Khóa do còn nợ
                  </span>
                )}
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
            {/* Chủ Hợp Đồng (Chính bạn) */}
            <div className="p-4 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 border border-indigo-200/80 rounded-2xl shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">
                      {currentTenant?.fullName || user?.fullName}
                    </span>
                    <span className="status-pill status-pill-indigo">
                      🔑 Đại Diện Ký Hợp Đồng
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Khách thuê chính đứng tên phòng {myRoomNumber}
                  </p>
                </div>
                <span className="status-pill status-pill-success">
                  🟢 Đang Cư Trú
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-indigo-100 text-[11px]">
                <div className="bg-white/90 p-2 rounded-xl border border-slate-200/60">
                  <div className="text-slate-400 text-[10px] font-medium">Số CCCD 12 số</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">
                    {currentTenant?.cccd ? currentTenant.cccd.slice(0, 8) + '****' : '00120101****'}
                  </div>
                </div>
                <div className="bg-white/90 p-2 rounded-xl border border-slate-200/60">
                  <div className="text-slate-400 text-[10px] font-medium">Số điện thoại</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {currentTenant?.phone || user?.phone || '0987.654.321'}
                  </div>
                </div>
                <div className="bg-white/90 p-2 rounded-xl border border-slate-200/60">
                  <div className="text-slate-400 text-[10px] font-medium">Quê quán</div>
                  <div className="font-bold text-slate-800 mt-0.5 truncate">
                    {currentTenant?.hometown || user?.hometown || 'Nam Định'}
                  </div>
                </div>
              </div>
            </div>

            {/* Các thành viên ở ghép (nếu có) */}
            {roommates.map((m) => {
              const maskedCccd = m.maskedCccd || (m.cccd ? m.cccd.slice(0, 8) + '****' : '00120109****');
              return (
                <div
                  key={m.id}
                  className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-2 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{m.fullName}</span>
                        <span className="status-pill status-pill-indigo">
                          👤 Thành Viên Ở Ghép
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Cư dân ở ghép cùng phòng {myRoomNumber}
                      </p>
                    </div>
                    <span className="status-pill status-pill-success">
                      🟢 Đã đăng ký tạm trú
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                      <div className="text-slate-400 text-[10px] font-medium">Số CCCD 12 số</div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">{maskedCccd}</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                      <div className="text-slate-400 text-[10px] font-medium">Số điện thoại</div>
                      <div className="font-bold text-slate-800 mt-0.5">{m.phone || '0981.222.333'}</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                      <div className="text-slate-400 text-[10px] font-medium">Ngày vào ở</div>
                      <div className="font-bold text-slate-800 mt-0.5">{m.joinDate || '01/02/2026'}</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Nếu chưa có người ở ghép và còn chỗ */}
            {roommates.length === 0 && !isRoomFull && (
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
        onSignSuccess={async (contractId) => {
try {

          await signContractElectronically(contractId);

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
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
        onSuccess={async (paidInv, payMethod) => {
try {

          const methodLabel = payMethod === 'VNPAY' ? 'Cổng VNPay' : (payMethod === 'MOMO' ? 'Ví MoMo' : 'SePay VietQR');
          await payInvoice(payingInvoice.id, methodLabel);
          setPayingInvoice(null);
          setPaySuccessToast(`Đã thanh toán thành công qua ${methodLabel} cho hóa đơn ${payingInvoice.code}!`);
          setTimeout(() => setPaySuccessToast(null), 6000);

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
}}
        invoice={payingInvoice || undefined}
      />

      {/* Modal Rời Phòng Cá Nhân (Dọn ra ngoài) */}
      <LeaveRoomModal
          agreedForfeitLeave={agreedForfeitLeave}
          handleSendLeave={handleSendLeave}
          hasUnpaidBillsForLeave={hasUnpaidBillsForLeave}
          isRepresentative={isRepresentative}
          leaveModal={leaveModal}
          leaveReason={leaveReason}
          leaveSuccess={leaveSuccess}
          myRoomNumber={myRoomNumber}
          otherRoommates={otherRoommates}
          payInvoice={payInvoice}
          selectedSuccessor={selectedSuccessor}
          setAgreedForfeitLeave={setAgreedForfeitLeave}
          setLeaveModal={setLeaveModal}
          setLeaveReason={setLeaveReason}
          setLeaveSuccess={setLeaveSuccess}
          setPaySuccessToast={setPaySuccessToast}
          setSelectedSuccessor={setSelectedSuccessor}
          totalUnpaidForLeave={totalUnpaidForLeave}
          unpaidInvoicesForLeave={unpaidInvoicesForLeave}
        />

      {/* Modal Trả Toàn Bộ Phòng (HĐ) - Đại diện ký hợp đồng */}
      <CheckoutRequestModal
          agreedForfeitDeposit={agreedForfeitDeposit}
          checkoutError={checkoutError}
          checkoutModal={checkoutModal}
          checkoutReason={checkoutReason}
          checkoutSubmitting={checkoutSubmitting}
          checkoutSuccess={checkoutSuccess}
          currentTenant={currentTenant}
          handleSendCheckout={handleSendCheckout}
          isCheckoutRoomMulti={isCheckoutRoomMulti}
          isContractExpired={isContractExpired}
          refundAccountName={refundAccountName}
          refundAccountNumber={refundAccountNumber}
          refundBank={refundBank}
          selectedCheckoutRoomObj={selectedCheckoutRoomObj}
          setAgreedForfeitDeposit={setAgreedForfeitDeposit}
          setCheckoutModal={setCheckoutModal}
          setCheckoutReason={setCheckoutReason}
          setCheckoutSuccess={setCheckoutSuccess}
          setRefundAccountName={setRefundAccountName}
          setRefundAccountNumber={setRefundAccountNumber}
          setRefundBank={setRefundBank}
        />
    </div>
  );
}
