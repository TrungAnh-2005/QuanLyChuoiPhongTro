import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Home,
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  PlusCircle,
  Receipt,
  Zap,
  CheckCircle2,
  Clock,
  Phone,
  Droplets,
  Calendar,
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
  Activity,
  Layers,
  Check,
  Copy,
  Shield,
  ArrowRight,
  Settings
} from 'lucide-react';
import {
  generateSePayQrUrl,
  getSePayConfig,
  saveSePayConfig,
  checkSePayTransaction,
  simulateSePayWebhookPayload,
  syncBankAccountsFromSePay,
  SEPAY_PORTAL_URL
} from '../services/sepayService';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { getRoomImage } from '../data/roomsData';
import { useData } from '../contexts/DataContext';
import Modal from '../components/common/Modal';
import ResidentContractModal from '../components/tenant/ResidentContractModal';
import RoommateRequestModal from '../components/tenant/RoommateRequestModal';
import PaymentModal from '../components/payment/PaymentModal';

const revenueData = [
  { month: 'T1', revenue: 42000000, target: 40000000 },
  { month: 'T2', revenue: 45500000, target: 42000000 },
  { month: 'T3', revenue: 48000000, target: 45000000 },
  { month: 'T4', revenue: 47200000, target: 46000000 },
  { month: 'T5', revenue: 51800000, target: 48000000 },
  { month: 'T6', revenue: 54000000, target: 50000000 },
  { month: 'T7', revenue: 53200000, target: 52000000 },
  { month: 'T8', revenue: 58600000, target: 54000000 },
  { month: 'T9', revenue: 62400000, target: 56000000 },
];

// Custom Bento Tooltip for AreaChart
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const rev = payload[0]?.value || 0;
    const tgt = payload[1]?.value || 0;
    return (
      <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-xl text-xs space-y-1.5 min-w-[160px]">
        <div className="font-bold text-slate-300 pb-1 border-b border-slate-800 flex items-center justify-between">
          <span>Tháng {label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">Doanh thu</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Thực thu:</span>
          <span className="font-bold text-emerald-400 font-mono">{rev.toLocaleString('vi-VN')} ₫</span>
        </div>
        {tgt > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Chỉ tiêu:</span>
            <span className="font-bold text-slate-300 font-mono">{tgt.toLocaleString('vi-VN')} ₫</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user, tenantRooms } = useAuth();
  const {
    invoices = [],
    payInvoice,
    tickets = [],
    rooms = [],
    tenants = [],
    contracts = [],
    roomMembers = [],
    resetRoomPaymentStatus,
    signContractElectronically,
    payDepositAndSignContract,
    transferRoom,
    leaveRoom,
    cancelRoomHold
  } = useData();

  const role = user?.role || 'ADMIN';
  const isTenant = role === 'TENANT';

  // Modals state for Tenant
  const [showContractModal, setShowContractModal] = useState(false);
  const [showRoommateModal, setShowRoommateModal] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paySuccessToast, setPaySuccessToast] = useState(null);
  const [copiedGateField, setCopiedGateField] = useState(null);

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
  const navigate = useNavigate();



  // Tìm hợp đồng của khách thuê
  const myContract = useMemo(() => {
    if (!isTenant) return null;
    const list = contracts || [];
    return (
      list.find((c) => user?.fullName && c.tenantName?.toLowerCase().includes(user.fullName.toLowerCase())) ||
      list.find((c) => user?.phone && c.tenantPhone === user.phone) ||
      (user?.username === 'tenant_new' ? list.find((c) => c.contractCode === 'HD-2026-007') : null)
    );
  }, [contracts, user, isTenant]);

  // Kiểm tra hợp đồng đang chờ nộp cọc hoặc chờ ký:
  // Nghiệp vụ: Khách 1 & 2 có HĐ ACTIVE đã nộp cọc không bị chặn; Chỉ chặn khi hợp đồng chưa ACTIVE (PENDING_DEPOSIT / PENDING_SIGN)
  const isContractPending = Boolean(
    myContract &&
    myContract.status !== 'ACTIVE' && (
      myContract.status === 'PENDING_DEPOSIT' ||
      myContract.status === 'PENDING_SIGN' ||
      !myContract.depositPaid ||
      !myContract.signedElectronically
    )
  );

  // Đếm ngược thời hạn nộp cọc giữ phòng (Countdown Timer cho Onboarding Gate)
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
      if (cancelRoomHold) {
        cancelRoomHold(roomNum, houseCode);
      }
      setPaySuccessToast(`Đã hủy giữ chỗ phòng ${roomNum}. Phòng đã được mở lại cho người khác thuê.`);
      setTimeout(() => {
        setPaySuccessToast(null);
        navigate('/rooms');
      }, 1000);
    }
  };

  // Khách thuê: Quy tắc Single Active Lease (1 Khách - 1 Phòng duy nhất)
  const myRoomNumber = useMemo(() => {
    if (!isTenant) return 'P.101';
    // Nghiệp vụ cốt lõi: Chưa thanh toán cọc & chưa ký HĐ thì CHƯA CÓ phòng chính thức!
    if (isContractPending) return null;

    if (user?.username === 'tenant2' || user?.fullName?.includes('Cường')) {
      const stored = tenantRooms?.tenant2 || tenantRooms?.['Phạm Minh Cường'] || user?.room || user?.rooms?.[0];
      return (Array.isArray(stored) ? stored[0] : stored) || 'P.103';
    }
    if (user?.username === 'tenant' || user?.username === 'tenant1' || user?.fullName?.includes('An')) {
      const stored = tenantRooms?.tenant1 || tenantRooms?.['Nguyễn Văn An'] || user?.room || user?.rooms?.[0];
      return (Array.isArray(stored) ? stored[0] : stored) || 'P.101';
    }
    if (user?.username === 'tenant_new' || user?.fullName?.includes('Nam')) {
      const stored = tenantRooms?.tenant_new || tenantRooms?.['Hoàng Văn Nam'] || user?.room || user?.rooms?.[0];
      return (Array.isArray(stored) && stored.length > 0 ? stored[0] : (typeof stored === 'string' && stored ? stored : null));
    }

    if (user?.room) return user.room;
    if (user?.rooms && user.rooms.length > 0) return user.rooms[0];

    const found = tenants.find(
      (t) =>
        (user?.fullName && t.fullName?.toLowerCase().includes(user.fullName.toLowerCase())) ||
        (user?.phone && t.phone === user.phone)
    );
    return found?.room || found?.rooms?.[0] || 'P.101';
  }, [isTenant, user, tenants, tenantRooms, isContractPending]);

  // Thông tin hồ sơ chi tiết của khách thuê hiện tại (Định danh chính xác theo tài khoản)
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

  // Thông tin chi tiết phòng đang thuê - Xác định CHÍNH XÁC cơ sở CS-02 / CS-01 (NGHIỆP VỤ 7)
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

  // Danh sách các bạn cùng phòng (ở ghép) - KHÔNG bao gồm chính khách thuê đang đăng nhập
  const roommates = useMemo(() => {
    const myNameNorm = (currentTenant.fullName || '').toLowerCase().trim();
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

  // Lắng nghe giao dịch nộp cọc tự động qua SePay theo thời gian thực (5s/lần)
  useEffect(() => {
    if (!isTenant || !isContractPending || !myContract) return;
    let isMounted = true;
    const targetRoomNum = myContract.roomNumber || 'P.102';
    const transferMemo = `COC ${targetRoomNum.replace('.', '')} ${(user?.fullName || myContract.tenantName || 'NAM').replace(/\s+/g, ' ').toUpperCase()}`.trim();
    const depositAmount = myContract.depositAmount || 2800000;
    const bankAccount = sepayConfig.accountNumber || '35825112005';

    const checkDeposit = async () => {
      try {
        const res = await checkSePayTransaction({
          invoiceCode: transferMemo,
          amount: depositAmount,
          accountNumber: bankAccount
        });
        if (res.success && isMounted) {
          setIsDepositPaid(true);
          setPaySuccessToast(`⚡ SePay Xác Nhận: Đã nhận ${depositAmount.toLocaleString('vi-VN')} đ tiền cọc! Nút Ký Hợp Đồng đã sáng lên để bạn bấm.`);
          setTimeout(() => setPaySuccessToast(null), 6000);
        }
      } catch {}
    };

    const timer = setInterval(checkDeposit, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [isTenant, isContractPending, myContract, sepayConfig, payDepositAndSignContract, user]);

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

  const myCurrentInvoice = useMemo(() => {
    if (!myRoomNumber || isContractPending) return null;
    return invoices.find((inv) => inv.room === myRoomNumber && (!inv.houseCode || inv.houseCode === currentRoomObj?.houseCode)) || null;
  }, [invoices, myRoomNumber, currentRoomObj, isContractPending]);

  // =========================================================================
  // 1A. GIAO DIỆN BẮT BUỘC: NỘP TIỀN CỌC & KÝ HỢP ĐỒNG ĐIỆN TỬ (ONBOARDING GATE)
  // NGHIỆP VỤ: Chưa thanh toán cọc & chưa ký HĐ thì CHƯA CÓ thanh toán tiền phòng & CHƯA CÓ giao diện cư dân!
  // =========================================================================
  if (isTenant && isContractPending && myContract) {
    const depositAmount = myContract.depositAmount || 2800000;
    const targetRoomNum = myContract.roomNumber || 'P.102';
    const targetHouseName = myContract.houseName || 'Nhà Trọ Bách Khoa - Cơ Sở 2';
    const bankAccount = sepayConfig.accountNumber || '35825112005';
    const bankName = sepayConfig.bank || 'MBBank';
    const accountHolder = sepayConfig.accountName || 'DAM TRUNG ANH';
    const transferMemo = `COC ${targetRoomNum.replace('.', '')} ${(user?.fullName || myContract.tenantName || 'NAM').replace(/\s+/g, ' ').toUpperCase()}`.trim();
    const depositSepayQr = generateSePayQrUrl({
      accountNumber: bankAccount,
      bank: bankName,
      amount: depositAmount,
      content: transferMemo,
      template: 'compact'
    });

    const copyGate = (text, field) => {
      navigator.clipboard.writeText(String(text));
      setCopiedGateField(field);
      setTimeout(() => setCopiedGateField(null), 2000);
    };

    const handleConfirmDepositAndSign = () => {
      if (payDepositAndSignContract) {
        payDepositAndSignContract(myContract.id);
        setPaySuccessToast(`🎉 Chúc mừng bạn! Hợp đồng phòng ${targetRoomNum} đã được kích hoạt thành công. Bạn chính thức là cư dân!`);
        setTimeout(() => setPaySuccessToast(null), 6000);
      }
    };

    const handleCheckSepayDepositNow = async () => {
      setIsCheckingSepayDeposit(true);
      setSepayDepositStatusMsg(null);
      try {
        const res = await checkSePayTransaction({
          invoiceCode: transferMemo,
          amount: depositAmount,
          accountNumber: bankAccount
        });
        if (res.success) {
          setSepayDepositStatusMsg('✅ Đã phát hiện giao dịch nộp cọc thành công trên SePay!');
          setTimeout(() => handleConfirmDepositAndSign(), 800);
        } else {
          setSepayDepositStatusMsg('Chưa phát hiện giao dịch mới trên SePay. Vui lòng chuyển khoản đúng nội dung hoặc bấm "Mô phỏng Webhook".');
        }
      } catch {
        setSepayDepositStatusMsg('Không thể kết nối máy chủ SePay.');
      } finally {
        setIsCheckingSepayDeposit(false);
      }
    };

    const handleSimulateSepayWebhook = () => {
      setPaySuccessToast(`🧪 SePay Webhook Giả Lập: Đã ghi nhận ${depositAmount.toLocaleString('vi-VN')} đ tiền cọc phòng ${targetRoomNum} thành công!`);
      handleConfirmDepositAndSign();
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
        alert('Vui lòng dán SePay API Token trước khi đồng bộ!');
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
        alert(`Đã đồng bộ thành công tài khoản ${res.account.account_number} (${res.account.bank_short_name}) từ SePay!`);
      } else {
        alert('Không thể kết nối tài khoản SePay. Vui lòng kiểm tra lại API Token!');
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

        {/* BANNER ĐẾM NGƯỢC THỜI HẠN NỘP CỌC GIỮ PHÒNG (TTL 15 PHÚT) */}
        <div className={`p-5 rounded-3xl border shadow-xl transition-all ${
          holdingSecondsLeft === 0
            ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
            : holdingSecondsLeft <= 120
              ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-rose-500/60 text-rose-100 shadow-rose-900/30'
              : holdingSecondsLeft <= 300
                ? 'bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-amber-500/60 text-amber-100 shadow-amber-900/20'
                : 'bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/90 border-purple-500/50 text-purple-100 shadow-purple-900/20'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl shadow-lg ${
                holdingSecondsLeft === 0
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
                    <span className={`font-mono font-black text-base px-3 py-0.5 rounded-xl shadow-sm ${
                      holdingSecondsLeft <= 120
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

            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
              {holdingSecondsLeft > 0 ? (
                <button
                  type="button"
                  onClick={() => handleCancelHoldRoom(targetRoomNum, targetHouseCode)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-rose-600/30 hover:border-rose-500 text-slate-200 hover:text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Hủy đơn giữ phòng ngay lập tức để người khác có thể thuê"
                >
                  <X className="w-4 h-4 text-rose-400" />
                  <span>Hủy Giữ Chỗ / Không Thuê Nữa</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/rooms')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <span>🔍 Quay Lại Chọn Phòng Khác</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2 Cột Quy Trình Bắt Buộc: Font chữ rõ ràng, dễ đọc, bố cục cân xứng không khoảng trắng */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* CỘT 1: NỘP CỌC SEPAY */}
          <div className="bento-card p-5 sm:p-6 border border-purple-200/80 bg-white shadow-xl rounded-2xl space-y-3.5">
            {/* Header Cột 1 */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-purple-600/20">
                  1
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Nộp Tiền Cọc Giữ Phòng (1 Tháng Tiền Thuê)</h3>
                  <span className="text-xs text-purple-700 font-bold flex items-center gap-1">
                    <span>⚡ Cổng thanh toán tự động SePay (VietQR Napas 247)</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSepayConfigModal(true)}
                  className="px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Thay đổi thông tin tài khoản ngân hàng SePay nhận cọc của bạn"
                >
                  <Settings className="w-3.5 h-3.5 text-purple-600" />
                  <span>SePay Của Tôi</span>
                </button>
                <span className="status-pill status-pill-purple text-xs font-bold py-0.5 px-2.5">Chờ Nộp Cọc</span>
              </div>
            </div>

            {/* Quy chế tiền cọc */}
            <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-3 text-xs sm:text-[13px] text-purple-950 space-y-1">
              <div className="font-extrabold flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 text-purple-900">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Quy chế tiền cọc (Security Deposit qua SePay):</span>
                </div>
                <span className="text-xs font-black text-purple-700 bg-white px-2.5 py-0.5 rounded-full border border-purple-200">
                  Realtime Webhook
                </span>
              </div>
              <p className="leading-relaxed text-purple-900">
                Tiền cọc đúng bằng 1 tháng tiền phòng = <strong className="font-black text-purple-950 text-sm font-mono">{depositAmount.toLocaleString('vi-VN')} ₫</strong>. Chuyển khoản qua SePay để hệ thống tự động gạch nợ và mở khóa nút ký hợp đồng nhận phòng.
              </p>
            </div>

            {/* Thông tin chuyển khoản & Mã SePay QR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
              {/* Cụm thông tin tài khoản */}
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                  <span className="text-slate-500 block text-xs font-medium">Ngân hàng & Số tài khoản:</span>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm mr-1.5">{bankName}</span>
                      <span className="font-mono font-black text-indigo-700 text-sm sm:text-base">{bankAccount}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyGate(bankAccount, 'acc')}
                      className="p-1.5 text-slate-400 hover:text-purple-600 rounded transition-colors cursor-pointer"
                      title="Copy số tài khoản"
                    >
                      {copiedGateField === 'acc' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                  <span className="text-slate-500 block text-xs font-medium">Chủ tài khoản thụ hưởng:</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wide">{accountHolder}</span>
                    <button
                      type="button"
                      onClick={() => copyGate(accountHolder, 'holder')}
                      className="p-1.5 text-slate-400 hover:text-purple-600 rounded transition-colors cursor-pointer"
                      title="Copy tên chủ tài khoản"
                    >
                      {copiedGateField === 'holder' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                  <span className="text-slate-500 block text-xs font-medium">Số tiền cọc chính xác:</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono font-black text-purple-700 text-sm sm:text-base">{depositAmount.toLocaleString('vi-VN')} ₫</span>
                    <button
                      type="button"
                      onClick={() => copyGate(depositAmount, 'amt')}
                      className="p-1.5 text-slate-400 hover:text-purple-600 rounded transition-colors cursor-pointer"
                      title="Copy số tiền cọc"
                    >
                      {copiedGateField === 'amt' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                  <span className="text-slate-500 block text-xs font-medium">Nội dung chuyển khoản chuẩn SePay:</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono font-black text-slate-900 text-xs sm:text-sm truncate mr-1">{transferMemo}</span>
                    <button
                      type="button"
                      onClick={() => copyGate(transferMemo, 'memo')}
                      className="p-1.5 text-slate-400 hover:text-purple-600 rounded transition-colors cursor-pointer"
                      title="Copy nội dung chuyển khoản"
                    >
                      {copiedGateField === 'memo' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Khối Ảnh QR SePay */}
              <div 
                onClick={() => {
                  setIsDepositPaid(true);
                  setPaySuccessToast(`⚡ Đã ghi nhận chuyển cọc ${depositAmount.toLocaleString('vi-VN')} đ thành công! Nút Ký Hợp Đồng đã sáng lên.`);
                  setTimeout(() => setPaySuccessToast(null), 4000);
                }}
                title="Bấm vào để kích hoạt nhanh trạng thái đã chuyển tiền cọc"
                className="p-3 bg-gradient-to-b from-purple-50/40 to-white border border-purple-200/80 rounded-xl shadow-xs relative group cursor-pointer hover:border-purple-400 transition-all flex flex-col items-center justify-center text-center"
              >
                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black rounded tracking-wider shadow-xs">
                  SEPAY
                </div>
                <img
                  src={depositSepayQr}
                  alt="SePay QR nộp tiền cọc"
                  className="w-36 h-36 mx-auto object-contain rounded-lg shadow-xs group-hover:scale-105 transition-transform"
                />
                <span className="text-xs font-bold text-purple-900 mt-2 block">Quét QR SePay để chuyển cọc</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Tự động nhận diện sau 3-5 giây</span>
              </div>
            </div>

            {/* Footer Cột 1 */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-700 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/60 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Tự động gạch nợ & kích hoạt nhận phòng khi tiền vào SePay</span>
                </div>
                <span className="text-purple-700 font-extrabold text-xs bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                  Realtime 24/7
                </span>
              </div>
            </div>
          </div>

          {/* CỘT 2: KÝ HỢP ĐỒNG ĐIỆN TỬ */}
          <div className="bento-card p-5 sm:p-6 border border-indigo-200/80 bg-white shadow-xl rounded-2xl space-y-3.5">
            {/* Header Cột 2 */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-600/20">
                  2
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Ký Hợp Đồng Điện Tử (E-Signature)</h3>
                  <span className="text-xs text-slate-600 font-mono font-bold">Mã hợp đồng: {myContract.contractCode}</span>
                </div>
              </div>
              <span className={`status-pill ${isDepositPaid ? 'status-pill-emerald' : 'status-pill-indigo'} text-xs font-bold py-0.5 px-2.5`}>
                {isDepositPaid ? 'Đã Mở Khóa Ký HĐ' : 'Chờ Ký HĐ'}
              </span>
            </div>

            {/* Quy chế pháp lý hợp đồng điện tử */}
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 text-xs sm:text-[13px] text-indigo-950 space-y-1">
              <div className="font-extrabold flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 text-indigo-900">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Pháp lý Hợp Đồng Điện Tử (E-Contract):</span>
                </div>
                <span className="text-xs font-black text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Luật GDĐT 2023
                </span>
              </div>
              <p className="leading-relaxed text-indigo-900">
                Hợp đồng ký số có giá trị pháp lý đầy đủ, bảo lưu và <strong>hoàn trả 100% tiền cọc</strong> khi hết hạn hợp đồng và bàn giao phòng nguyên vẹn.
              </p>
            </div>

            {/* Bảng đặc tả chi tiết thông số hợp đồng 2 cột */}
            <div className="grid grid-cols-2 gap-2.5 text-xs sm:text-sm">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 block text-xs font-medium">Phòng thuê & Cơ sở:</span>
                <strong className="text-slate-900 font-mono text-sm sm:text-base font-black block mt-0.5">{targetRoomNum}</strong>
                <span className="text-xs text-slate-600 truncate block font-medium mt-0.5">{targetHouseName}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 block text-xs font-medium">Thời hạn hợp đồng:</span>
                <strong className="text-slate-900 font-extrabold text-xs sm:text-sm block mt-0.5">12 tháng (1 năm)</strong>
                <span className="text-xs text-slate-600 block font-medium mt-0.5">{myContract.startDate} – {myContract.endDate}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 block text-xs font-medium">Giá thuê định kỳ:</span>
                <strong className="text-indigo-600 font-mono font-black text-xs sm:text-sm block mt-0.5">
                  {(myContract.rentalPrice || 2800000).toLocaleString('vi-VN')} đ/tháng
                </strong>
                <span className="text-xs text-slate-600 block font-medium mt-0.5">Kỳ thanh toán: 01-05 hàng tháng</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 block text-xs font-medium">Tiền cọc bảo lưu:</span>
                <strong className="text-purple-700 font-mono font-black text-xs sm:text-sm block mt-0.5">
                  {depositAmount.toLocaleString('vi-VN')} đ
                </strong>
                <span className="text-xs text-slate-600 block font-medium mt-0.5">Hoàn lại 100% khi trả phòng</span>
              </div>
            </div>

            {/* Tiện ích & Quyền lợi kích hoạt tức thì khi ký */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Quyền Lợi Kích Hoạt Tức Thì:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowContractModal(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 underline cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Xem Toàn Văn HĐ (UC-T01)</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-100">
                  <span className="text-indigo-600 font-bold text-sm">🔑</span>
                  <span className="truncate">Cấp mã cửa phòng số</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-100">
                  <span className="text-indigo-600 font-bold text-sm">⚡</span>
                  <span className="truncate">Chốt số điện nước online</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-100">
                  <span className="text-emerald-600 font-bold text-sm">✅</span>
                  <span className="truncate">Chủ trọ đã ký số sẵn</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-100">
                  <span className="text-purple-600 font-bold text-sm">🛡️</span>
                  <span className="truncate">Ký số SHA-256 an toàn</span>
                </div>
              </div>
            </div>

            {/* Nút Ký Hợp Đồng: Chữ to rõ ràng, nổi bật */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <button
                type="button"
                disabled={!isDepositPaid}
                onClick={() => {
                  if (!isDepositPaid) return;
                  setShowContractModal(true);
                }}
                className={`w-full py-3 px-4 font-black text-sm sm:text-base rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 ${
                  isDepositPaid
                    ? 'btn-press bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-lg shadow-emerald-600/30 animate-pulse cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-80'
                }`}
              >
                {isDepositPaid ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
                    <span>✍️ Ký Hợp Đồng Điện Tử Nhận Phòng</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span>Ký Hợp Đồng Nhận Phòng (Chưa Chuyển Tiền)</span>
                  </>
                )}
              </button>
              <p className="text-xs text-center font-medium text-slate-500">
                {isDepositPaid ? (
                  <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                    <span>🎉</span> Đã nhận tiền cọc qua SePay! Hãy bấm nút phía trên để hoàn tất ký HĐ.
                  </span>
                ) : (
                  'Chuyển tiền cọc qua SePay QR thì nút Ký Hợp Đồng mới sáng lên để bấm.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Xem Toàn Văn Hợp Đồng Điện Tử */}
        <ResidentContractModal
          isOpen={showContractModal}
          onClose={() => setShowContractModal(false)}
          contract={myContract}
          onSignSuccess={(contractId) => {
            handleConfirmDepositAndSign();
            setShowContractModal(false);
          }}
        />

        {/* Modal Cấu Hình SePay Cá Nhân Của Người Dùng / Chủ Trọ */}
        <Modal
          isOpen={showSepayConfigModal}
          onClose={() => setShowSepayConfigModal(false)}
          maxWidth="max-w-md"
        >
          <div className="p-1 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-600/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Cấu Hình SePay Của Bạn</h3>
                  <p className="text-[11px] text-slate-400">Nhận tiền cọc & tiền trọ tự động về tài khoản</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSepayConfigModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSepayConfig} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ngân hàng thụ hưởng: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={sepayForm.bank}
                  onChange={(e) => setSepayForm({ ...sepayForm, bank: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 text-xs"
                >
                  <option value="MBBank">MBBank (Ngân hàng Quân Đội)</option>
                  <option value="Vietcombank">Vietcombank (VCB)</option>
                  <option value="Techcombank">Techcombank (TCB)</option>
                  <option value="ACB">ACB (Á Châu)</option>
                  <option value="VPBank">VPBank (Việt Nam Thịnh Vượng)</option>
                  <option value="TPBank">TPBank (Tiên Phong)</option>
                  <option value="BIDV">BIDV (Đầu tư & Phát triển)</option>
                  <option value="Agribank">Agribank (Nông nghiệp)</option>
                  <option value="VietinBank">VietinBank (Công Thương)</option>
                  <option value="Sacombank">Sacombank (Sài Gòn Thương Tín)</option>
                  <option value="VIB">VIB (Quốc tế)</option>
                  <option value="HDBank">HDBank (Phát triển TP.HCM)</option>
                  <option value="OCB">OCB (Phương Đông)</option>
                  <option value="MSB">MSB (Hàng Hải)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số tài khoản nhận cọc: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sepayForm.accountNumber}
                  onChange={(e) => setSepayForm({ ...sepayForm, accountNumber: e.target.value })}
                  placeholder="Ví dụ: 35825112005"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên chủ tài khoản: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sepayForm.accountName}
                  onChange={(e) => setSepayForm({ ...sepayForm, accountName: e.target.value.toUpperCase() })}
                  placeholder="Ví dụ: NGUYEN VAN AN"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 text-xs uppercase"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    SePay API Token (Kiểm tra tự động):
                  </label>
                  <a
                    href="https://my.sepay.vn"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-purple-600 hover:underline font-bold flex items-center gap-0.5"
                  >
                    <span>Lấy Token</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  value={sepayForm.apiKey}
                  onChange={(e) => setSepayForm({ ...sepayForm, apiKey: e.target.value })}
                  placeholder="Dán SePay API Key..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                />
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl text-[11px] text-purple-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Kết nối SePay tự động:</span>
                </div>
                <p className="text-purple-800 leading-relaxed text-[11px]">
                  Mã QR sẽ tự động sinh theo URL chính thức của SePay (<code className="font-mono bg-white px-1 rounded border border-purple-200">qr.sepay.vn</code>). Tiền cọc chuyển vào tài khoản sẽ được hệ thống bắt lệnh gạch nợ tức thì.
                </p>
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
  if (isTenant && !myRoomNumber) {
    return (
      <div className="space-y-6 page-enter">
        <div className="bento-card relative overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white border border-indigo-500/20 shadow-xl">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold backdrop-blur-md border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Chào Mừng Cư Dân Mới</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Xin chào, {user?.fullName || 'Quý khách'}!
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                Tài khoản của bạn đã được khởi tạo thành công trên hệ thống. Hiện tại chưa có hợp đồng phòng nào liên kết trực tiếp với tài khoản này.
              </p>
            </div>
            <Link
              to="/rooms"
              className="btn-press inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all shrink-0"
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
              <div className="text-slate-400 text-[11px] font-medium">Email liên hệ</div>
              <div className="font-bold text-slate-900 mt-1 truncate">{user?.email || 'nam.hv@gmail.com'}</div>
            </div>
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
              <div className="text-slate-400 text-[11px] font-medium">Quê quán</div>
              <div className="font-bold text-slate-900 mt-1">Thanh Hóa</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. GIAO DIỆN DÀNH CHO KHÁCH THUÊ ĐANG CƯ TRÚ (TENANT RESIDENT PORTAL)
  // =========================================================================
  if (isTenant) {
    return (
      <div className="space-y-6 page-enter">
        {/* Toast thông báo thanh toán */}
        {paySuccessToast && (
          <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-md backdrop-blur-md animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold">{paySuccessToast}</span>
            </div>
            <button onClick={() => setPaySuccessToast(null)} className="p-1 text-emerald-600 hover:text-emerald-800 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Hero Banner Khách Thuê: Sleek Bento Card with Ambient Glow */}
        <div className="bento-card-dark relative overflow-hidden p-6 sm:p-7 rounded-3xl border border-indigo-500/25 shadow-2xl">
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none animate-float-reverse" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-semibold backdrop-blur-md border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Cổng Cư Dân Trực Tuyến • Định Danh CCCD (1 Khách - 1 Phòng)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Xin chào, {user?.fullName || 'Khách thuê'}!
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                Bạn đang thuê phòng <strong className="text-white font-mono bg-white/20 px-2.5 py-0.5 rounded-lg border border-white/10">{myRoomNumber}</strong> tại {currentRoomObj.house}.
              </p>
            </div>

            {/* Phân quyền Người đại diện HĐ vs Người ở ghép (NGHIỆP VỤ 4) */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => setShowContractModal(true)}
                className="btn-press px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Hợp Đồng Điện Tử (UC-T01)</span>
              </button>
              <Link
                to="/maintenance"
                className="btn-press px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-xs transition-all border border-white/15 flex items-center gap-2 backdrop-blur-md"
              >
                <Wrench className="w-4 h-4 text-purple-300" />
                <span>Báo Sự Cố</span>
              </Link>
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
                <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
                  {(myCurrentInvoice?.total || 0).toLocaleString('vi-VN')} ₫
                </div>
                <div className="flex items-center justify-between gap-1 flex-wrap pt-0.5">
                  <span className="status-pill status-pill-success">✓ Đã thanh toán kỳ này</span>
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
                        {currentTenant.fullName || user?.fullName}
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
                      {currentTenant.cccd ? currentTenant.cccd.slice(0, 8) + '****' : '00120101****'}
                    </div>
                  </div>
                  <div className="bg-white/90 p-2 rounded-xl border border-slate-200/60">
                    <div className="text-slate-400 text-[10px] font-medium">Số điện thoại</div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {currentTenant.phone || user?.phone || '0987.654.321'}
                    </div>
                  </div>
                  <div className="bg-white/90 p-2 rounded-xl border border-slate-200/60">
                    <div className="text-slate-400 text-[10px] font-medium">Quê quán</div>
                    <div className="font-bold text-slate-800 mt-0.5 truncate">
                      {currentTenant.hometown || user?.hometown || 'Nam Định'}
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
            setPaySuccessToast(`Đã thanh toán thành công qua ${methodLabel} cho hóa đơn ${payingInvoice.code}!`);
            setTimeout(() => setPaySuccessToast(null), 6000);
          }}
          invoice={payingInvoice || undefined}
        />

      </div>
    );
  }

  // =========================================================================
  // 3. GIAO DIỆN DÀNH CHO ADMIN & STAFF MANAGEMENT DASHBOARD (BENTO GRID FLAGSHIP)
  // =========================================================================
  const scopedRooms = useMemo(() => {
    if (role === 'STAFF') {
      const houseCode = user?.houseCode || 'CS-01';
      return rooms.filter((r) => r.houseCode === houseCode);
    }
    return rooms;
  }, [rooms, role, user]);

  const occupiedCount = scopedRooms.filter((r) => r.status === 'OCCUPIED').length;
  const availableCount = scopedRooms.filter((r) => r.status === 'AVAILABLE').length;
  const maintenanceCount = scopedRooms.filter((r) => r.status === 'MAINTENANCE').length;
  const totalRooms = scopedRooms.length || (role === 'STAFF' ? (user?.houseCode === 'CS-02' ? 8 : 12) : 24);
  const occupancyRate = Math.round((occupiedCount / (totalRooms || 1)) * 100) || 85;

  const roomStatusData = [
    { name: 'Đang Thuê', value: occupiedCount || 16, color: '#6366f1' },
    { name: 'Còn Trống', value: availableCount || 6, color: '#10b981' },
    { name: 'Bảo Trì', value: maintenanceCount || 2, color: '#f59e0b' },
  ];

  const pendingMeterCount = invoices.filter((i) => i.status === 'PENDING_METER').length;
  const unpaidCount = invoices.filter((i) => i.status === 'UNPAID').length;
  const openTicketsCount = tickets.filter((t) => t.status === 'OPEN' || t.status === 'PENDING').length;

  return (
    <div className="space-y-6 page-enter">
      {/* Header Bento Banner with Ambient Backdrop Glow */}
      <div className="bento-card p-6 sm:p-7 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-white via-indigo-50/30 to-purple-50/20">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none animate-float-reverse" />
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="status-pill status-pill-indigo">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Microservices SaaS v2.5</span>
            </span>
            <span className="status-pill status-pill-success">
              <span className="pulse-dot-green shrink-0" />
              <span>Hệ Thống Trực Tuyến 99.9%</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {role === 'STAFF'
              ? `Tổng Quan Vận Hành: ${user?.houseName || 'Cơ Sở 1 - Cầu Giấy'}`
              : 'Tổng Quan Hệ Thống Quản Lý Chuỗi Nhà Trọ'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            {role === 'STAFF'
              ? `Quản lý trực tiếp chi nhánh ${user?.houseCode || 'CS-01'} • Cán bộ phụ trách: ${user?.fullName}`
              : 'Theo dõi trạng thái các cơ sở, phòng trọ, chỉ số điện nước và dòng tiền theo thời gian thực.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {role === 'ADMIN' ? (
            <>
              <Link
                to="/admin/landlords"
                className="btn-press btn-shimmer flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-indigo-600/20 transition-all"
              >
                <Users className="w-4 h-4" />
                <span>Quản Trị Chủ Trọ</span>
              </Link>
              <Link
                to="/admin/saas-invoices"
                className="btn-press flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-sm transition-all"
              >
                <Receipt className="w-4 h-4 text-indigo-400" />
                <span>Hóa Đơn Cước SaaS</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/rooms"
                className="btn-press flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                <span>Sơ Đồ Phòng</span>
              </Link>
              <Link
                to="/meters"
                className="btn-press btn-shimmer flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-purple-600/20 transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>Chốt Điện Nước (AI)</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 4 Stat Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Tổng số phòng */}
        <div className="bento-card p-5 space-y-3 stagger-item stagger-1 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Số Phòng</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold ring-1 ring-indigo-500/10">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{totalRooms}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{occupancyRate}% Lấp đầy</span>
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${occupancyRate}%` }} />
          </div>
        </div>

        {/* Card 2: Khách đang thuê */}
        <div className="bento-card p-5 space-y-3 stagger-item stagger-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Khách Đang Thuê</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold ring-1 ring-purple-500/10">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {tenants.filter((t) => t.status === 'ACTIVE').length || 4}
            </span>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
              1 khách - 1 phòng
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Đã xác thực CCCD & ký hợp đồng số</p>
        </div>

        {/* Card 3: Doanh thu tháng */}
        <div className="bento-card p-5 space-y-3 stagger-item stagger-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doanh Thu Tháng 9</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold ring-1 ring-emerald-500/10">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">62.4M</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+6.8% MoM</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Vượt mục tiêu tháng 6.4M</p>
        </div>

        {/* Card 4: Hóa đơn chờ thu */}
        <div className="bento-card p-5 space-y-3 stagger-item stagger-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hóa Đơn Chờ Thu</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold ring-1 ring-amber-500/10">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{unpaidCount}</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
              {pendingMeterCount} chờ chốt Đ/N
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Cập nhật SePay VietQR tức thì</p>
        </div>
      </div>

      {/* Bento Analytics Grid: Dòng Tiền & Tỷ Lệ Lấp Đầy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu Đồ Doanh Thu Chuỗi (Col Span 2) */}
        <div className="lg:col-span-2 bento-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Dòng Tiền & Tăng Trưởng Doanh Thu Chuỗi</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Doanh thu thực tế so với mục tiêu theo từng tháng (Đơn vị: VNĐ)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-indigo-600" />
                <span className="font-semibold text-slate-600">Thực thu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-slate-300" />
                <span className="font-semibold text-slate-400">Chỉ tiêu</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revGradient)"
                  isAnimationActive={true}
                  animationDuration={1400}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tỷ Lệ Lấp Đầy & Tình Trạng Phòng (Col Span 1) */}
        <div className="bento-card p-6 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600" />
              <span>Cơ Cấu Tình Trạng Phòng</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">Tổng: {totalRooms} phòng</span>
          </div>

          <div className="h-52 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roomStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={84}
                  paddingAngle={4}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationEasing="ease-out"
                >
                  {roomStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} phòng`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{occupancyRate}%</span>
              <span className="text-[11px] text-slate-400 font-medium">Lấp đầy</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
            {roomStatusData.map((s) => (
              <div key={s.name} className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span>{s.name}</span>
                </div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Phím Tắt Nghiệp Vụ & Cảnh Báo Vận Hành */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phím Tắt Nghiệp Vụ Nhanh (Col Span 2) */}
        <div className="lg:col-span-2 bento-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Phím Tắt Nghiệp Vụ Quản Trị</span>
          </h3>

          {role === 'ADMIN' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                to="/admin/landlords"
                className="p-4 bg-slate-50/80 hover:bg-indigo-50/50 border border-slate-200/70 hover:border-indigo-300 rounded-2xl transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div className="font-bold text-slate-900 text-xs">Quản Trị Chủ Trọ</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Quản lý đối tác & duyệt KYC</div>
              </Link>

              <Link
                to="/admin/saas-invoices"
                className="p-4 bg-slate-50/80 hover:bg-indigo-50/50 border border-slate-200/70 hover:border-indigo-300 rounded-2xl transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="font-bold text-slate-900 text-xs">Hóa Đơn Cước SaaS</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Cước bản quyền & VAT</div>
              </Link>

              <Link
                to="/admin/integrations"
                className="p-4 bg-slate-50/80 hover:bg-indigo-50/50 border border-slate-200/70 hover:border-indigo-300 rounded-2xl transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="font-bold text-slate-900 text-xs">Cấu Hình Tích Hợp</div>
                <div className="text-[11px] text-slate-400 mt-0.5">SePay, VNPay, Zalo, AI</div>
              </Link>

              <Link
                to="/admin/system"
                className="p-4 bg-slate-50/80 hover:bg-indigo-50/50 border border-slate-200/70 hover:border-indigo-300 rounded-2xl transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="font-bold text-slate-900 text-xs">Giám Sát Hệ Thống</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Health check & logs</div>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                to="/meters"
                className="p-4 bg-slate-50/80 hover:bg-indigo-50/50 border border-slate-200/70 hover:border-indigo-300 rounded-2xl transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="font-bold text-slate-900 text-xs">Chốt Điện Nước</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Nhận diện OCR camera</div>
              </Link>

              <Link
                to="/rooms"
                className="p-4 bg-slate-50/80 hover:bg-indigo-50/50 border border-slate-200/70 hover:border-indigo-300 rounded-2xl transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Home className="w-5 h-5" />
                </div>
                <div className="font-bold text-slate-900 text-xs">Sơ Đồ Phòng</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Phân tầng & trạng thái</div>
              </Link>

              <Link
                to="/tenants"
                className="p-4 bg-slate-50/80 hover:bg-indigo-50/50 border border-slate-200/70 hover:border-indigo-300 rounded-2xl transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div className="font-bold text-slate-900 text-xs">Quản Lý Cư Dân</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Định danh & KYC CCCD</div>
              </Link>

              <Link
                to="/invoices"
                className="p-4 bg-slate-50/80 hover:bg-indigo-50/50 border border-slate-200/70 hover:border-indigo-300 rounded-2xl transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="font-bold text-slate-900 text-xs">Hóa Đơn & Thu Phí</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Webhook SePay & VietQR</div>
              </Link>
            </div>
          )}
        </div>

        {/* Trạng Thái Vận Hành & Cảnh Báo (Col Span 1) */}
        <div className="bento-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Cảnh Báo Vận Hành</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-amber-900 font-semibold">Hóa đơn chờ chốt Đ/N</span>
              </div>
              <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg font-mono">
                {pendingMeterCount} phòng
              </span>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-rose-900 font-semibold">Hóa đơn quá hạn / chưa thu</span>
              </div>
              <span className="font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-lg font-mono">
                {unpaidCount} hóa đơn
              </span>
            </div>

            <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-indigo-900 font-semibold">Yêu cầu bảo trì đang mở</span>
              </div>
              <span className="font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-lg font-mono">
                {openTicketsCount || 2} sự cố
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
