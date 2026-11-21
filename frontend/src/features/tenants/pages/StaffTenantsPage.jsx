import ManualTenantModal from '../components/ManualTenantModal.jsx';
import EditTenantModal from '../components/EditTenantModal.jsx';
import TenantDetailsModal from '../components/TenantDetailsModal.jsx';
import ArchiveTenantModal from '../components/ArchiveTenantModal.jsx';
import ResetTenantPasswordModal from '../components/ResetTenantPasswordModal.jsx';
import ResidenceStatusModal from '../components/ResidenceStatusModal.jsx';
import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Search, MapPin, ShieldCheck, Key, X, CheckCircle2, Edit3, Trash2, AlertCircle, Sparkles, Building2, Download, Clock } from 'lucide-react';
import { useData } from '../../../shared/data/RentalDataContext';
import { useAuth } from '../../auth/AuthContext';

import UpgradePromptModal from '../../subscriptions/components/UpgradePromptModal';
import BuySaasPackageModal from '../../subscriptions/components/BuySaasPackageModal';
import PaymentModal from '../../payments/components/PaymentModal';
import CreateTenantModal from '../components/CreateTenantModal';

const DEFAULT_FACILITIES = [
  { code: 'CS-01', name: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', shortName: 'Cơ Sở 1 - Cầu Giấy' },
  { code: 'CS-02', name: 'Nhà Trọ Bách Khoa - Cơ Sở 2', shortName: 'Cơ Sở 2 - Bách Khoa' },
  { code: 'CS-03', name: 'Nhà Trọ Đống Đa - Cơ Sở 3', shortName: 'Cơ Sở 3 - Đống Đa' }
];

export default function TenantsPage() {
  const {boardingHouses:apiBoardingHouses=[]}=useData() || {};

  const {
    tenants,
    addTenant,
    updateTenant,
    deleteTenant,
    resetTenantPassword,
    rooms = [],
    roomMembers = [],
    contracts = [],
    addRoomMember,
    updateTemporaryResidence,
    landlords = [],
    createSaasInvoice,
    paySaasInvoice,
    updateLandlordPackage
  } = useData();
  const [pwdResetToast, setPwdResetToast] = useState(null);
  const [payingSaasInvoice, setPayingSaasInvoice] = useState(null);
  const { user } = useAuth();
  const isStaffOrAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';

  // Xác định gói cước của Chủ trọ hiện tại
  const currentLandlord = useMemo(() => {
    return (landlords || []).find(
      (l) => l.username === user?.username || l.fullName === user?.fullName
    ) || (landlords && landlords.length > 0 ? landlords[0] : null);
  }, [user, landlords]);

  const isZeroSandbox = true;

  // Danh mục Cơ sở năng động (Đọc từ localStorage hoặc dữ liệu chuỗi trọ thực tế)
  const facilities = useMemo(() => {
    try {
      const saved = JSON.stringify(apiBoardingHouses);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((h) => ({
            code: h.code,
            name: h.name,
            shortName: `${h.code} - ${h.name.replace(/^Nhà Trọ\s*/i, '')}`
          }));
        }
      }
      if (isZeroSandbox) return [];
      return DEFAULT_FACILITIES;
    } catch {
      return isZeroSandbox ? [] : DEFAULT_FACILITIES;
    }
  }, [isZeroSandbox,apiBoardingHouses]);

  const staffManageableHouses = useMemo(() => {
    if (user?.role !== 'STAFF') return facilities;
    const u = (user?.username || '').toLowerCase();
    try {
      const saved = JSON.stringify(apiBoardingHouses);
      const parsedHouses = saved ? JSON.parse(saved) : [];
      return facilities.filter((h) => { if(user?.isTestMode) return true;
        const fullHouse = parsedHouses.find((ph) => ph.code === h.code);
        const created = (fullHouse?.createdBy || '').toLowerCase();
        const manager = (fullHouse?.managerUsername || '').toLowerCase();
        if (created && created === u) return true;
        if (manager && manager === u) return true;
        if (user?.houseCode && h.code === user.houseCode) return true;
        if (!isZeroSandbox) {
          if (u === 'staff' && (h.code === 'CS-01' || !created)) return true;
          if (u === 'staff2' && h.code === 'CS-02') return true;
        }
        return false;
      });
    } catch {
      return facilities;
    }
  }, [facilities, user, isZeroSandbox,apiBoardingHouses]);

  const staffHouseCodes = useMemo(() => staffManageableHouses.map((h) => h.code), [staffManageableHouses]);

  const landlordPackage = (isZeroSandbox && (!currentLandlord || currentLandlord.packageCode === 'NONE'))
    ? 'NONE'
    : (currentLandlord?.packageCode || 'BASIC');
  const isEnterprise = landlordPackage === 'ENTERPRISE';

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBuyPackageModal, setShowBuyPackageModal] = useState(false);

    const [activeTab, setActiveTab] = useState('CONTRACTS'); // 'CONTRACTS' | 'RESIDENTS'
  const [residentSearch, setResidentSearch] = useState('');
  const [residentFacilityFilter, setResidentFacilityFilter] = useState('ALL'); // 'ALL' | 'CS-01' | 'CS-02' | 'CS-03'
  const [residentStatusFilter, setResidentStatusFilter] = useState('ALL');
  const [, setSelectedResidentCccd] = useState(null);
  const [, setIsEditingCccd] = useState(false);
  const [, setCccdFormData] = useState({});
  const [statusChangeModal, setStatusChangeModal] = useState(null);
  const [statusChangeSelected, setStatusChangeSelected] = useState('REGISTERED');
  const [, setStatusChangeNotes] = useState('');
  const [savingResidence, setSavingResidence] = useState(false);
  const [residenceError, setResidenceError] = useState('');
  const [, setShowExportModal] = useState(false);

  // Hợp nhất danh sách nhân khẩu: Cả Người đại diện hợp đồng + Người ở ghép (Rule 1: Full Resident Inclusion)
  const combinedResidents = useMemo(() => {
    const map = new Map();

    // 1. Lấy từ roomMembers (chứa cả người ký HĐ và bạn ở ghép)
    (roomMembers || []).filter((m) => m.status !== 'MOVED_OUT').forEach((m) => {
      const matchRoom = (rooms || []).find((r) => r.number === m.roomNumber && (!m.houseCode || r.houseCode === m.houseCode));
      const hCode = m.houseCode || matchRoom?.houseCode || 'CS-01';
      const hName = m.house || matchRoom?.house || (hCode === 'CS-02' ? 'Nhà Trọ Bách Khoa - Cơ Sở 2' : 'Nhà Trọ Cầu Giấy - Cơ Sở 1');
      const key = `${m.roomNumber}_${m.fullName}_${hCode}`;
      map.set(key, {
        id: m.id,
        fullName: m.fullName,
        phone: m.phone || '0987.654.321',
        email: m.email || '',
        cccd: m.cccd || '001201012345',
        maskedCccd: m.maskedCccd || (m.cccd ? m.cccd.slice(0, 8) + '****' : '00120101****'),
        roomNumber: m.roomNumber,
        houseCode: hCode,
        house: hName,
        roleInRoom: m.roleInRoom || (m.fullName.includes('Bạn cùng phòng') ? 'MEMBER' : 'REPRESENTATIVE'),
        temporaryResidenceStatus: m.temporaryResidenceStatus || 'PENDING_REGISTRATION',
        issueDate: m.issueDate || '20/04/2021',
        issuePlace: m.issuePlace || 'Cục Cảnh sát QLHC về TTXH',
        permanentAddress: m.permanentAddress || 'Hà Nội',
        cccdFrontUrl: m.cccdFrontUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop',
        cccdBackUrl: m.cccdBackUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop',
        status: 'ACTIVE'
      });
    });

    // 2. Bổ sung các tenants đang ACTIVE chưa có trong roomMembers
    (tenants || []).filter((t) => t.status === 'ACTIVE' && t.room).forEach((t) => {
      const matchRoom = (rooms || []).find((r) => r.number === t.room);
      const hCode = t.houseCode || matchRoom?.houseCode || 'CS-01';
      const hName = t.house || matchRoom?.house || 'Nhà Trọ Cầu Giấy - Cơ Sở 1';
      const key = `${t.room}_${t.fullName}_${hCode}`;
      if (!map.has(key)) {
        map.set(key, {
          id: `T-${t.id}`,
          fullName: t.fullName,
          phone: t.phone,
          email: t.email,
          cccd: t.cccd,
          maskedCccd: t.cccd ? t.cccd.slice(0, 8) + '****' : '00120101****',
          roomNumber: t.room,
          houseCode: hCode,
          house: hName,
          roleInRoom: 'REPRESENTATIVE',
          temporaryResidenceStatus: t.temporaryResidenceStatus || 'PENDING_REGISTRATION',
          issueDate: '20/04/2021',
          issuePlace: 'Cục Cảnh sát QLHC về TTXH',
          permanentAddress: 'Hà Nội',
          cccdFrontUrl: t.cccdFrontUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop',
          cccdBackUrl: t.cccdBackUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop',
          status: 'ACTIVE'
        });
      }
    });

    let list = Array.from(map.values());
    if (user?.role === 'STAFF') {
      if (staffHouseCodes.length === 0) return [];
      list = list.filter((r) => staffHouseCodes.includes(r.houseCode));
    }
    return list;
  }, [roomMembers, tenants, rooms, user, staffHouseCodes]);

  // Bộ lọc cư dân theo tìm kiếm, cơ sở và trạng thái
  const filteredResidents = useMemo(() => {
    return combinedResidents.filter((r) => {
      const matchSearch =
        (r.fullName || '').toLowerCase().includes(residentSearch.toLowerCase()) ||
        (r.phone || '').includes(residentSearch) ||
        (r.cccd || '').includes(residentSearch) ||
        (r.roomNumber || '').toLowerCase().includes(residentSearch.toLowerCase());

      const matchFacility =
        residentFacilityFilter === 'ALL' || r.houseCode === residentFacilityFilter;

      const matchStatus =
        residentStatusFilter === 'ALL' ||
        (residentStatusFilter === 'REGISTERED' && (r.temporaryResidenceStatus === 'REGISTERED' || r.temporaryResidenceStatus === 'APPROVED')) ||
        (residentStatusFilter === 'PENDING_REGISTRATION' && (r.temporaryResidenceStatus === 'PENDING_REGISTRATION' || r.temporaryResidenceStatus === 'SUBMITTED')) ||
        (residentStatusFilter === 'NOT_REGISTERED' && (r.temporaryResidenceStatus === 'NOT_REGISTERED' || !r.temporaryResidenceStatus));

      return matchSearch && matchFacility && matchStatus;
    });
  }, [combinedResidents, residentSearch, residentFacilityFilter, residentStatusFilter]);

  // Chỉ số thống kê KPI Tạm trú
  const residentStats = useMemo(() => {
    const total = combinedResidents.length;
    const registered = combinedResidents.filter(
      (r) => r.temporaryResidenceStatus === 'REGISTERED' || r.temporaryResidenceStatus === 'APPROVED'
    ).length;
    const pending = combinedResidents.filter(
      (r) => r.temporaryResidenceStatus === 'PENDING_REGISTRATION' || r.temporaryResidenceStatus === 'SUBMITTED'
    ).length;
    const unregistered = Math.max(0, total - registered - pending);
    return { total, registered, pending, unregistered };
  }, [combinedResidents]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | INACTIVE
  const [showModal, setShowModal] = useState(false);
  const [showAiTenantModal, setShowAiTenantModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [resetPwdModal, setResetPwdModal] = useState(null);
  const [customPasswordInput, setCustomPasswordInput] = useState('');
  const [sendSmsOption, setSendSmsOption] = useState(true);
  const [forceChangeOption, setForceChangeOption] = useState(true);

  const handleOpenResetPassword = (tenant) => {
    setResetPwdModal(tenant);
    setCustomPasswordInput('TroVN@' + Math.floor(1000 + Math.random() * 9000));
  };
  const [confirmDeleteTenant, setConfirmDeleteTenant] = useState(null);
  const [deleteNotice, setDeleteNotice] = useState(null);

  // =========================================================================
  // 🛡️ MULTI-TENANT BOUNDARY GUARD: Giới hạn quyền riêng tư dữ liệu cư dân
  // Admin nền tảng chỉ quản lý đối tác (Chủ trọ), không can thiệp khách thuê
  // =========================================================================


  // Helper tính ngày kết thúc hợp đồng theo các mức 3, 6, 12 tháng
  const calculateContractEnd = (startDateStr, months) => {
    try {
      let day = 25, month = 9, year = 2026;
      if (startDateStr && startDateStr.includes('/')) {
        const parts = startDateStr.split('/');
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      } else if (startDateStr && startDateStr.includes('-')) {
        const parts = startDateStr.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      }
      const d = new Date(year, month, day);
      d.setMonth(d.getMonth() + parseInt(months, 10));
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return '25/09/2027';
    }
  };

  // New tenant state với 3 mức thời hạn: 3, 6, 12 tháng
  const [manualHouseCode, setManualHouseCode] = useState(() => {
    return staffManageableHouses[0]?.code || facilities[0]?.code || '';
  });

  useEffect(() => {
    const validFacilities = user?.role === 'STAFF' ? staffManageableHouses : facilities;
    if (validFacilities.length > 0 && (!manualHouseCode || !validFacilities.some((f) => f.code === manualHouseCode))) {
      setManualHouseCode(validFacilities[0].code);
    }
  }, [facilities, staffManageableHouses, manualHouseCode, user?.role]);

  const [newTenant, setNewTenant] = useState({
    fullName: '',
    cccd: '',
    phone: '',
    email: '',
    hometown: '',
    room: '',
    rooms: [],
    contractDuration: 12, // 3, 6, 12 tháng
    contractStart: '25/09/2026',
    contractEnd: '25/09/2027',
    deposit: 3500000,
    status: 'ACTIVE',
    daysSinceLeave: 0
  });

  // Lọc các phòng còn trống của cơ sở đang chọn cho modal thêm thủ công
  const manualVacantRooms = useMemo(() => {
    return (rooms || []).filter((r) => {
      if (!manualHouseCode) return false;
      if (r.houseCode !== manualHouseCode && !(manualHouseCode === 'CS-01' && !r.houseCode)) return false;
      if (r.status !== 'AVAILABLE') return false;
      if (r.occupants && r.occupants > 0) return false;
      return true;
    });
  }, [rooms, manualHouseCode]);

  useEffect(() => {
    if (manualVacantRooms.length > 0) {
      const isValid = manualVacantRooms.some((r) => r.number === newTenant.room);
      if (!isValid) {
        const first = manualVacantRooms[0];
        setNewTenant((prev) => ({
          ...prev,
          room: first.number,
          rooms: [first.number],
          deposit: first.price || 3500000
        }));
      }
    } else {
      setNewTenant((prev) => ({
        ...prev,
        room: '',
        rooms: []
      }));
    }
  }, [manualVacantRooms, manualHouseCode]);

  const handleManualRoomChange = (roomNum) => {
    const found = manualVacantRooms.find((r) => r.number === roomNum);
    setNewTenant((prev) => ({
      ...prev,
      room: roomNum,
      rooms: [roomNum],
      deposit: found?.price || prev.deposit
    }));
  };

  // Lấy tập hợp khách thuộc phạm vi cơ sở (Tenant Scoping & Multi-tenancy Isolation)
  // Tuyệt đối không hiển thị khách tự do chưa thuê bất kỳ phòng nào trong danh bạ quản lý của Staff
  const scopedTenants = useMemo(() => {
    return (tenants || []).filter((t) => {
      // 1. Nếu là Staff: chỉ quản lý khách thuộc các cơ sở do Staff này phụ trách
      if (user?.role === 'STAFF') {
        if (staffHouseCodes.length === 0) return false;
        const matchHouse =
          staffHouseCodes.includes(t.houseCode) ||
          staffHouseCodes.some((c) => t.house && t.house.includes(c));
        if (!matchHouse) return false;
      }

      // 2. Chỉ hiển thị khách ĐANG THUÊ hoặc ĐÃ TỪNG THUÊ tại cơ sở này
      const tenantRoomsList = t.rooms && t.rooms.length > 0 ? t.rooms : (t.room ? [t.room] : []);
      const hasRoom = tenantRoomsList.length > 0;
      const isPastTenant = t.status === 'INACTIVE' && (t.daysSinceLeave || 0) > 0;

      // Khách vãng lai / chưa có phòng (WAITING_ROOM) không thuộc cơ sở nào -> không cho Staff xem
      return hasRoom || isPastTenant;
    });
  }, [tenants, staffHouseCodes, user]);

  const filteredTenants = useMemo(() => {
    return scopedTenants.filter((t) => {
      const matchesSearch =
        (t.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.cccd || '').includes(searchTerm) ||
        (t.phone || '').includes(searchTerm) ||
        (t.room && t.room.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.rooms && t.rooms.some((r) => r.toLowerCase().includes(searchTerm.toLowerCase())));

      if (statusFilter === 'ALL') return matchesSearch;
      if (statusFilter === 'ACTIVE') return matchesSearch && t.status === 'ACTIVE';
      if (statusFilter === 'INACTIVE') return matchesSearch && t.status === 'INACTIVE';
      return matchesSearch;
    });
  }, [scopedTenants, searchTerm, statusFilter]);

  const handleCreateTenant = async (e) => {
try {

    e.preventDefault();
    if (!newTenant.fullName || !newTenant.cccd) return;
    if (!newTenant.room) {
      setPwdResetToast({ type: 'ERROR', title: 'Chưa Chọn Phòng', message: 'Vui lòng chọn cơ sở có phòng trống và chọn phòng cần thuê!' }); setTimeout(() => setPwdResetToast(null), 5000);
      return;
    }
    const selectedFacilityObj = facilities.find((f) => f.code === manualHouseCode);
    const calculatedEnd = calculateContractEnd(newTenant.contractStart, newTenant.contractDuration);

    await addTenant({
      ...newTenant,
      houseCode: manualHouseCode,
      house: selectedFacilityObj?.name || (facilities[0]?.name || 'Cơ sở nhà trọ'),
      contractEnd: calculatedEnd,
      rooms: [newTenant.room],
      room: newTenant.room
    });
    setShowModal(false);
    setDeleteNotice({
      type: 'SUCCESS',
      message: `Đã thêm thành công hồ sơ khách thuê "${newTenant.fullName}" vào phòng ${newTenant.room} (${selectedFacilityObj?.shortName || manualHouseCode})!`
    });
    setTimeout(() => setDeleteNotice(null), 5000);
    setNewTenant({
      fullName: '',
      cccd: '',
      phone: '',
      email: '',
      hometown: '',
      room: '',
      rooms: [],
      contractDuration: 12,
      contractStart: '25/09/2026',
      contractEnd: '25/09/2027',
      deposit: 3500000,
      status: 'ACTIVE',
      daysSinceLeave: 0
    });

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
};

  const handleSaveEdit = async (e) => {
try {

    e.preventDefault();
    if (!editingTenant) return;

    // QUY CHẾ HỆ THỐNG: Admin và Staff KHÔNG được sửa trạng thái hợp đồng và các phòng đang thuê!
    // Các dữ liệu này phải tự động cập nhật theo giao dịch của khách hàng.
    // Staff/Admin chỉ chỉnh sửa thông tin cá nhân và tiền cọc.
    await updateTenant(editingTenant.id, {
      fullName: editingTenant.fullName,
      cccd: editingTenant.cccd,
      phone: editingTenant.phone,
      email: editingTenant.email,
      hometown: editingTenant.hometown,
      deposit: Number(editingTenant.deposit) || 0
    });

    if (selectedTenant && selectedTenant.id === editingTenant.id) {
      setSelectedTenant({
        ...selectedTenant,
        fullName: editingTenant.fullName,
        cccd: editingTenant.cccd,
        phone: editingTenant.phone,
        email: editingTenant.email,
        hometown: editingTenant.hometown,
        deposit: Number(editingTenant.deposit) || 0
      });
    }
    setEditingTenant(null);

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
};

  const handleConfirmDelete = async () => {
try {

    if (!confirmDeleteTenant) return;
    const result = await deleteTenant(confirmDeleteTenant.id);
    if (!result.success) {
      setDeleteNotice({ type: 'ERROR', message: result.message });
    } else {
      setDeleteNotice({ type: 'SUCCESS', message: result.message });
      setConfirmDeleteTenant(null);
      if (selectedTenant?.id === confirmDeleteTenant.id) {
        setSelectedTenant(null);
      }
    }

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
};

  if (user?.role === 'ADMIN') {
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto py-6">
        <div className="bento-card p-8 sm:p-10 border border-amber-300/80 bg-gradient-to-b from-amber-50/60 to-white rounded-3xl shadow-xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl font-black shadow-inner">
            🛡️
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider rounded-full border border-amber-300">
              Quy Định Phân Quyền Multi-Tenant SaaS
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Giới Hạn Quyền Riêng Tư Cư Dân (Tenant Data Isolation)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Theo chính sách bảo mật của nền tảng <strong>Trọ Việt SaaS</strong>, Ban Quản Trị Hệ Thống (Platform Admin) chỉ quản lý hạ tầng máy chủ, microservices và hợp đồng đối tác với các <strong>Chủ trọ</strong>.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Dữ liệu danh bạ định danh, CCCD và tài khoản của khách thuê thuộc toàn quyền sở hữu và vận hành của <strong>Staff / Chủ trọ từng cơ sở</strong>.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/admin/landlords"
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer btn-press"
            >
              <Building2 className="w-4 h-4" />
              <span>Chuyển đến Quản Lý Đối Tác Chủ Trọ (/admin/landlords)</span>
            </Link>
            <Link
              to="/admin/saas-invoices"
              className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 cursor-pointer btn-press"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Quản Lý Cước SaaS (/admin/saas-invoices)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }
return (
    <div className="space-y-6">
      {pwdResetToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{pwdResetToast}</span>
        </div>
      )}
            {/* 2 Tabs Chuyển Đổi Phân Hệ: Hợp Đồng vs Khai Báo Tạm Trú VNeID */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit mb-2">
        <button
          type="button"
          onClick={() => setActiveTab('CONTRACTS')}
          className={`btn-press px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'CONTRACTS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>📋 Hợp Đồng & Khách Ký Thuê ({tenants.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RESIDENTS')}
          className={`btn-press px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'RESIDENTS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>🛡️ 🏛️ Khai Báo Tạm Trú & Cư Dân (VNeID)</span>
          {residentStats.unregistered > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
              {residentStats.unregistered} chưa nộp
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'RESIDENTS' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
            }`}>
              ✓ Đầy đủ
            </span>
          )}
        </button>
      </div>

      {activeTab === 'CONTRACTS' ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                <Users className="w-7 h-7 text-purple-600" />
                <span>Hồ Sơ Khách Thuê Phòng</span>
              </h1>
              <p className="text-slate-500 text-sm mt-1 font-medium">
                Quản lý thông tin cư dân, hợp đồng thuê nhiều phòng, lịch sử trả phòng và thanh lý tài khoản.
              </p>
            </div>

        {isStaffOrAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!isEnterprise) {
                  setShowUpgradeModal(true);
                } else {
                  setShowAiTenantModal(true);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-white text-xs font-black rounded-2xl shadow-md transition-all btn-press cursor-pointer ${
                isEnterprise
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 shadow-indigo-600/20'
                  : 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:to-black shadow-slate-900/30 border border-amber-400/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>⚡ Thêm Khách Bằng AI OCR (CCCD)</span>
              {!isEnterprise && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 flex items-center gap-1 shadow-xs">
                  <span>👑</span>
                  <span>GÓI ENTERPRISE</span>
                </span>
              )}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thủ Công</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete Notice Alert */}
      {deleteNotice && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border ${
            deleteNotice.type === 'SUCCESS'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-bold">
            {deleteNotice.type === 'SUCCESS' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{deleteNotice.message}</span>
          </div>
          <button
            onClick={() => setDeleteNotice(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bento-card p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tra cứu theo họ tên, CCCD, số điện thoại hoặc phòng..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            Tất cả ({scopedTenants.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Đang thuê ({scopedTenants.filter((t) => t.status === 'ACTIVE').length})
          </button>
          <button
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'INACTIVE'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã trả phòng ({scopedTenants.filter((t) => t.status === 'INACTIVE').length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bento-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/90 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Họ và Tên</th>
                <th className="py-3.5 px-4">Số CCCD</th>
                <th className="py-3.5 px-4">Số Điện Thoại</th>
                <th className="py-3.5 px-4">Quê Quán</th>
                <th className="py-3.5 px-4">Phòng Đang Thuê</th>
                <th className="py-3.5 px-4">Hợp Đồng</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Không tìm thấy hồ sơ khách thuê nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const tenantRoomsList = t.rooms && t.rooms.length > 0
                    ? t.rooms
                    : (t.room ? [t.room] : []);
                  const roomCount = tenantRoomsList.length;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-purple-50/40 transition-all duration-150"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                          {t.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold">{t.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-normal">
                            {t.email || `${t.phone}@rental.vn`}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 font-semibold">{t.cccd}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{t.phone}</td>
                      <td className="py-3 px-4 text-slate-600">{t.hometown || 'Chưa cập nhật'}</td>

                      {/* Phòng đang thuê (hỗ trợ nhiều phòng) */}
                      <td className="py-3 px-4">
                        {roomCount > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {tenantRoomsList.map((rm) => (
                              <span
                                key={rm}
                                className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 shadow-2xs"
                              >
                                {rm}
                              </span>
                            ))}
                            {roomCount > 1 && (
                              <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">
                                ({roomCount} phòng)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Chưa có phòng
                          </span>
                        )}
                      </td>

                      {/* Hạn hợp đồng */}
                      <td className="py-3 px-4 text-slate-600">
                        {t.contractStart ? (
                          <div>
                            <div>
                              <span className="text-[11px] text-slate-500">Từ:</span>{' '}
                              <strong>{t.contractStart || t.startDate}</strong>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Đến: {t.contractEnd || 'Chưa xác định'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Chưa có hợp đồng
                          </span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-4 text-center">
                        {t.status === 'ACTIVE' && roomCount > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Đang Thuê</span>
                          </span>
                        ) : t.status === 'INACTIVE' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                            <span>Đã rời ({t.daysSinceLeave || 0} ngày)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                            <span>Chờ nhận phòng</span>
                          </span>
                        )}
                      </td>

                      {/* Thao tác: Xem hồ sơ / Sửa / Xóa */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedTenant(t)}
                            title="Xem chi tiết hồ sơ khách thuê"
                            className="text-purple-600 hover:text-purple-700 font-bold px-2 py-1 hover:bg-purple-50 rounded-lg transition-colors btn-press-ghost cursor-pointer text-xs"
                          >
                            Xem
                          </button>
                          {isStaffOrAdmin && (
                            <button
                              onClick={() => handleOpenResetPassword(t)}
                              title="Cấp lại mật khẩu tạm thời cho khách (gửi OTP)"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isStaffOrAdmin && (
                            <>
                              <button
                                onClick={() =>
                                  setEditingTenant({
                                    ...t,
                                    room: tenantRoomsList.join(', ')
                                  })
                                }
                                title="Chỉnh sửa thông tin cá nhân khách thuê"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* QUY ĐỊNH NÚT XÓA:
                                  1. Nếu khách đang thuê (roomCount > 0): KHÔNG hiện nút xóa -> badge "Đang thuê".
                                  2. Nếu khách không thuê phòng (roomCount === 0) nhưng < 30 ngày: KHÔNG hiện nút xóa -> badge đếm ngược "🔒 Đợi X ngày hiện nút xóa".
                                  3. Chỉ khi roomCount === 0 VÀ ngày rời phòng >= 30 ngày (1 tháng): MỚI HIỆN NÚT XÓA ĐỎ NỔI BẬT!
                              */}
                              {roomCount > 0 ? (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold whitespace-nowrap">
                                  Đang thuê
                                </span>
                              ) : (t.daysSinceLeave || 0) < 30 ? (
                                <span
                                  className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-semibold whitespace-nowrap"
                                  title={`Số ngày phòng về 0: ${t.daysSinceLeave || 0}/30 ngày. Đủ 1 tháng (30 ngày) mới hiện nút xóa.`}
                                >
                                  🔒 Đợi {30 - (t.daysSinceLeave || 0)} ngày hiện nút xóa
                                </span>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteTenant(t)}
                                  title={`Đủ điều kiện xóa: Khách không còn thuê phòng trong 1 tháng (${t.daysSinceLeave} ngày >= 30 ngày)`}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-300 rounded-lg text-xs font-bold transition-all btn-press cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Xóa</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* TAB 2: KHAI BÁO TẠM TRÚ & QUẢN LÝ CƯ DÂN (VNeID)                          */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Header Tab 2 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                <ShieldCheck className="w-7 h-7 text-indigo-600" />
                <span>Quản Lý Cư Dân & Khai Báo Tạm Trú (VNeID)</span>
              </h1>
              <p className="text-slate-500 text-sm mt-1 font-medium">
                Theo dõi pháp lý cư trú 100% nhân khẩu (Người đại diện hợp đồng + Thành viên ở ghép). Cung cấp hồ sơ nộp Cảnh sát khu vực và Cổng Dịch Vụ Công Quốc Gia.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="btn-press px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2"
                title="Xuất bảng kê danh sách nhân khẩu nộp Công an hoặc nộp Dịch vụ công"
              >
                <Download className="w-4 h-4" />
                <span>📥 Xuất Bảng Kê (Mẫu CT01 / Excel)</span>
              </button>

              <span className="px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs">
                <Building2 className="w-3.5 h-3.5" />
                Cơ Sở Hiện Tại: CS-01 (Cầu Giấy)
              </span>
            </div>
          </div>

          {/* 4 Thẻ KPI Thống Kê Tạm Trú (Task 1) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Tổng Nhân Khẩu */}
            <div className="bento-card p-4 flex items-center gap-3.5 border-l-4 border-l-purple-500 shadow-sm hover:shadow transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Nhân Khẩu Đang Ở</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-slate-900">{residentStats.total}</span>
                  <span className="text-xs text-slate-500 font-medium">người</span>
                </div>
                <p className="text-[10px] text-purple-700 font-medium mt-0.5">Bao gồm đại diện & ở ghép</p>
              </div>
            </div>

            {/* KPI 2: Đã Cấp Tạm Trú */}
            <div className="bento-card p-4 flex items-center gap-3.5 border-l-4 border-l-emerald-500 shadow-sm hover:shadow transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đã Đăng Ký Hợp Lệ</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-emerald-700">{residentStats.registered}</span>
                  <span className="text-xs text-emerald-600 font-medium">người</span>
                </div>
                <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Đạt chuẩn lưu trú hợp pháp</p>
              </div>
            </div>

            {/* KPI 3: Chờ DVC VNeID */}
            <div className="bento-card p-4 flex items-center gap-3.5 border-l-4 border-l-amber-500 shadow-sm hover:shadow transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chờ DVC Duyệt</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-amber-700">{residentStats.pending}</span>
                  <span className="text-xs text-amber-600 font-medium">hồ sơ</span>
                </div>
                <p className="text-[10px] text-amber-700 font-medium mt-0.5">Đã nộp Cổng DVC Bộ CA</p>
              </div>
            </div>

            {/* KPI 4: Chưa Khai Báo */}
            <div className="bento-card p-4 flex items-center gap-3.5 border-l-4 border-l-rose-500 shadow-sm hover:shadow transition">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chưa Khai Báo</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-rose-700">{residentStats.unregistered}</span>
                  <span className="text-xs text-rose-600 font-medium">người</span>
                </div>
                <p className="text-[10px] text-rose-700 font-bold mt-0.5">⚠️ Nguy cơ phạt hành chính</p>
              </div>
            </div>
          </div>

          {/* BANNER THÔNG TIN PHÁP LÝ */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-amber-50 border border-indigo-200/80 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase">
                  Luật Cư Trú 2020 (Đ.27)
                </span>
                <span className="text-xs font-bold text-indigo-950">
                  Hợp Nhất 100% Nhân Khẩu: Đại diện ký hợp đồng & Bạn cùng phòng ở ghép
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Theo dõi sát sao từng phòng để xuất danh bạ nộp Cảnh sát khu vực hoặc nộp Cổng Dịch Vụ Công Quốc Gia (VNeID), tránh phạt hành chính khi kiểm tra đêm.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 shrink-0">
              <span className="px-3 py-1.5 bg-white/80 border border-indigo-200 rounded-xl shadow-xs">
                Tổng hiển thị: {filteredResidents.length} cư dân
              </span>
            </div>
          </div>

          {/* SEARCH & FILTER BAR CHO TAB CƯ DÂN (TASK 3) */}
          <div className="bento-card p-3 flex flex-col lg:flex-row items-center justify-between gap-3 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={residentSearch}
                onChange={(e) => setResidentSearch(e.target.value)}
                placeholder="Tra cứu cư dân theo họ tên, số CCCD, phòng, số điện thoại..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Filter Facility & Status */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Lọc Cơ Sở */}
              <select
                value={residentFacilityFilter}
                onChange={(e) => setResidentFacilityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">🏢 {user?.role === 'STAFF' ? 'Tất Cả Cơ Sở Của Tôi' : 'Tất Cả Cơ Sở'}</option>
                {staffManageableHouses.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.name}
                  </option>
                ))}
              </select>

              {/* Lọc Trạng Thái Tạm Trú */}
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setResidentStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    residentStatusFilter === 'ALL'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất Cả ({combinedResidents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setResidentStatusFilter('REGISTERED')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    residentStatusFilter === 'REGISTERED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  🟢 Đã Cấp ({residentStats.registered})
                </button>
                <button
                  type="button"
                  onClick={() => setResidentStatusFilter('PENDING_REGISTRATION')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    residentStatusFilter === 'PENDING_REGISTRATION'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-amber-700'
                  }`}
                >
                  🟡 Chờ DVC ({residentStats.pending})
                </button>
                <button
                  type="button"
                  onClick={() => setResidentStatusFilter('NOT_REGISTERED')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    residentStatusFilter === 'NOT_REGISTERED'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  🔴 Chưa Nộp ({residentStats.unregistered})
                </button>
              </div>
            </div>
          </div>

          {/* BẢNG CƯ DÂN HỢP NHẤT & QUẢN LÝ TẠM TRÚ (TASK 3) */}
          <div className="bento-card overflow-hidden shadow-xs border border-slate-200/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-3.5 px-4">Cư Dân</th>
                    <th className="py-3.5 px-4">Vai Trò Phòng</th>
                    <th className="py-3.5 px-4">Phòng & Cơ Sở</th>
                    <th className="py-3.5 px-4">CCCD & Thường Trú</th>
                    <th className="py-3.5 px-4 text-center">Trạng Thái Tạm Trú</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResidents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-600">Không tìm thấy cư dân nào phù hợp với bộ lọc</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Thử đổi từ khóa tìm kiếm hoặc chọn cơ sở khác.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredResidents.map((resident, idx) => {
                      const isRep = resident.roleInRoom === 'REPRESENTATIVE';
                      const isRegistered = resident.temporaryResidenceStatus === 'REGISTERED' || resident.temporaryResidenceStatus === 'APPROVED';
                      const isPending = resident.temporaryResidenceStatus === 'PENDING_REGISTRATION' || resident.temporaryResidenceStatus === 'SUBMITTED';

                      return (
                        <tr
                          key={resident.id || idx}
                          className="hover:bg-indigo-50/30 transition-colors duration-150 group"
                        >
                          {/* 1. Cư Dân */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-xs ${
                                isRep
                                  ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-200'
                                  : 'bg-teal-100 text-teal-700 ring-1 ring-teal-200'
                              }`}>
                                {resident.fullName?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{resident.fullName}</span>
                                  {isRep && (
                                    <span title="Chủ hợp đồng" className="text-amber-500 text-[10px]">👑</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                                  <span>📞 {resident.phone}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Vai Trò Trong Phòng */}
                          <td className="py-3.5 px-4">
                            {isRep ? (
                              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                                <Key className="w-3 h-3 text-purple-600" />
                                <span>Chủ Hợp Đồng</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1">
                                <Users className="w-3 h-3 text-cyan-600" />
                                <span>Ở Ghép Cùng Phòng</span>
                              </span>
                            )}
                          </td>

                          {/* 3. Phòng & Cơ Sở */}
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-black text-slate-900 text-sm">
                              {resident.roomNumber}
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[130px]">{resident.house || resident.houseCode}</span>
                            </div>
                          </td>

                          {/* 4. CCCD & Thường Trú */}
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-slate-900 text-xs">
                              {resident.cccd || 'Chưa cập nhật'}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{resident.permanentAddress || 'Hà Nội'}</span>
                            </div>
                            <div className="mt-1">
                              {resident.cccdFrontUrl ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-200">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Có ảnh 2 mặt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold border border-amber-200">
                                  ⚠️ Chưa có ảnh
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 5. Trạng Thái Tạm Trú */}
                          <td className="py-3.5 px-4 text-center">
                            {isRegistered ? (
                              <div className="inline-flex flex-col items-center gap-0.5">
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Đã Cấp Tạm Trú</span>
                                </span>
                                <span className="text-[10px] text-emerald-600 font-medium">Hợp pháp</span>
                              </div>
                            ) : isPending ? (
                              <div className="inline-flex flex-col items-center gap-0.5">
                                <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Chờ DVC Duyệt</span>
                                </span>
                                <span className="text-[10px] text-amber-600 font-medium">Đã gửi hồ sơ</span>
                              </div>
                            ) : (
                              <div className="inline-flex flex-col items-center gap-0.5">
                                <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Chưa Khai Báo</span>
                                </span>
                                <span className="text-[10px] text-rose-600 font-bold">Cần xử lý gấp</span>
                              </div>
                            )}
                          </td>

                          {/* 6. Thao Tác */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedResidentCccd(resident);
                                  setIsEditingCccd(false);
                                  setCccdFormData({
                                    cccd: resident.cccd || '',
                                    issueDate: resident.issueDate || '20/04/2021',
                                    issuePlace: resident.issuePlace || 'Cục Cảnh sát QLHC về TTXH',
                                    permanentAddress: resident.permanentAddress || 'Hà Nội',
                                    cccdFrontUrl: resident.cccdFrontUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop',
                                    cccdBackUrl: resident.cccdBackUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop'
                                  });
                                }}
                                className="btn-press px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1 shadow-xs"
                                title="Mở kho lưu trữ ảnh CCCD 2 mặt và hồ sơ định danh"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Xem CCCD</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setResidenceError('');
                                  setStatusChangeModal(resident);
                                  setStatusChangeSelected(resident.temporaryResidenceStatus || 'REGISTERED');
                                  setStatusChangeNotes('');
                                }}
                                className="btn-press px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                                title="Cập nhật trạng thái tạm trú VNeID & đồng bộ sơ đồ phòng"
                              >
                                <span>Đổi Trạng Thái</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 1. Modal Thêm Khách Thuê Mới */}
      <ManualTenantModal
          calculateContractEnd={calculateContractEnd}
          facilities={facilities}
          handleCreateTenant={handleCreateTenant}
          handleManualRoomChange={handleManualRoomChange}
          manualHouseCode={manualHouseCode}
          manualVacantRooms={manualVacantRooms}
          newTenant={newTenant}
          rooms={rooms}
          setManualHouseCode={setManualHouseCode}
          setNewTenant={setNewTenant}
          setShowModal={setShowModal}
          showModal={showModal}
          staffManageableHouses={staffManageableHouses}
          user={user}
        />

      {/* 2. Modal Chỉnh Sửa Thông Tin Khách Thuê */}
      <EditTenantModal
          editingTenant={editingTenant}
          handleSaveEdit={handleSaveEdit}
          setEditingTenant={setEditingTenant}
        />

      {/* 3. Modal Xem Chi Tiết Hồ Sơ Khách Thuê */}
      <TenantDetailsModal
          handleOpenResetPassword={handleOpenResetPassword}
          isStaffOrAdmin={isStaffOrAdmin}
          selectedTenant={selectedTenant}
          setEditingTenant={setEditingTenant}
          setSelectedTenant={setSelectedTenant}
        />

      {/* 4. Modal Xác Nhận Xác Nhận Lưu Trữ Hồ Sơ Khách (Chỉ khi >= 30 ngày) */}
      <ArchiveTenantModal
          confirmDeleteTenant={confirmDeleteTenant}
          handleConfirmDelete={handleConfirmDelete}
          setConfirmDeleteTenant={setConfirmDeleteTenant}
        />

      {/* Modal Thêm Khách Thuê với AI OCR CCCD */}
      <CreateTenantModal
        isOpen={showAiTenantModal}
        onClose={() => setShowAiTenantModal(false)}
        onSaveTenant={async (newTenantData) => {
try {

          await addTenant(newTenantData);
          setDeleteNotice({
            type: 'SUCCESS',
            message: `Đã thêm thành công hồ sơ khách ${newTenantData.name || newTenantData.fullName} từ AI OCR CCCD!`
          });
          setTimeout(() => setDeleteNotice(null), 5000);

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
}}
      />
          {/* UC-S02 & UC-A01: Modal Cấp Lại Mật Khẩu Tạm Cho Khách Thuê */}
      {resetPwdModal && (
        <ResetTenantPasswordModal
          customPasswordInput={customPasswordInput}
          forceChangeOption={forceChangeOption}
          resetPwdModal={resetPwdModal}
          resetTenantPassword={resetTenantPassword}
          sendSmsOption={sendSmsOption}
          setCustomPasswordInput={setCustomPasswordInput}
          setForceChangeOption={setForceChangeOption}
          setPwdResetToast={setPwdResetToast}
          setResetPwdModal={setResetPwdModal}
          setSendSmsOption={setSendSmsOption}
        />
      )}

      {/* Modal Cảnh Báo Bản Quyền & Nâng Cấp Gói */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="AI Vision OCR Định Danh 2 Mặt CCCD"
        featureDescription="Công nghệ AI Vision OCR tự động trích xuất thông tin Căn Cước Công Dân (12 số, họ tên, quê quán, thường trú) chuẩn KYC. Tính năng này yêu cầu Gói Doanh Nghiệp (ENTERPRISE)."
        currentPackageCode={landlordPackage}
        requiredPackageCode="ENTERPRISE"
        onUpgradeClick={() => {
          setShowUpgradeModal(false);
          setShowBuyPackageModal(true);
        }}
      />

      {/* Modal Mua Gói Bản Quyền SaaS */}
      <BuySaasPackageModal
        isOpen={showBuyPackageModal}
        onClose={() => setShowBuyPackageModal(false)}
        currentLandlord={currentLandlord}
        initialPackageCode="ENTERPRISE"
        onConfirmPurchase={async (planData) => {
try {

          setShowBuyPackageModal(false);
          const targetLandlordId = currentLandlord?.id || (user?.username === 'staff2' ? 2 : 1);
          const newInv = {
            id: `SAAS-${Date.now()}`,
            code: `HD-SAAS-2026-${Date.now().toString().slice(-4)}`,
            landlordId: targetLandlordId,
            landlordUsername: user?.username || (targetLandlordId === 2 ? 'staff2' : 'staff'),
            landlordName: currentLandlord?.fullName || user?.fullName || 'Quản lý cơ sở',
            landlordPhone: currentLandlord?.phone || user?.phone || '0900.000.000',
            packageName: planData.packageName,
            packageCode: planData.packageCode,
            billingCycle: planData.billingCycle,
            period: `${planData.months} Tháng`,
            amount: planData.amount,
            total: planData.amount,
            dueDate: new Date(Date.now() + 7 * 86400000).toLocaleDateString('vi-VN'),
            status: 'UNPAID',
            isSaas: true
          };
          const createdInv = createSaasInvoice ? await createSaasInvoice(newInv) : newInv;
          setPayingSaasInvoice(createdInv || newInv);

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
}}
      />

      {/* Modal Cổng Thanh Toán SePay VietQR / VNPay / MoMo Cho Gói SaaS */}
      <PaymentModal
        isOpen={!!payingSaasInvoice}
        onClose={() => setPayingSaasInvoice(null)}
        onSuccess={async (inv, payMethod) => {
try {

          const methodLabel = payMethod === 'VNPAY' ? 'Cổng VNPay' : (payMethod === 'MOMO' ? 'Ví MoMo' : 'VietQR / SePay');
          if (paySaasInvoice) {
            await paySaasInvoice(inv.id, methodLabel);
          }
          const targetLandlordId = currentLandlord?.id || (user?.username === 'staff2' ? 2 : 1);
          if (updateLandlordPackage) {
            await updateLandlordPackage(targetLandlordId, inv.packageCode || 'ENTERPRISE');
          }
          setPayingSaasInvoice(null);
          setPwdResetToast({
            type: 'SUCCESS',
            title: 'Nộp Cước Thành Công',
            message: `🎉 Nộp cước SaaS qua ${methodLabel} thành công! Đã kích hoạt toàn bộ tính năng AI OCR CCCD.`
          });
          setTimeout(() => setPwdResetToast(null), 4000);

} catch (error) { window.dispatchEvent(new CustomEvent("rental:api-error", {detail:error.message})); return {success:false,error:error.message}; }
}}
        invoice={payingSaasInvoice || undefined}
      />

      <ResidenceStatusModal
          addRoomMember={addRoomMember}
          contracts={contracts}
          residenceError={residenceError}
          savingResidence={savingResidence}
          setResidenceError={setResidenceError}
          setSavingResidence={setSavingResidence}
          setStatusChangeModal={setStatusChangeModal}
          setStatusChangeSelected={setStatusChangeSelected}
          statusChangeModal={statusChangeModal}
          statusChangeSelected={statusChangeSelected}
          updateTemporaryResidence={updateTemporaryResidence}
        />
    </div>
  );
}
