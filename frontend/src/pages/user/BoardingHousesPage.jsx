import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Home,
  Users,
  DollarSign,
  ShieldCheck,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Receipt,
  Settings,
  Edit3,
  Trash2,
  X,
  Image as ImageIcon,
  Upload,
  Lock,
  Unlock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import Modal from '@/components/common/Modal';
import UpgradePromptModal from '@/components/common/UpgradePromptModal';
import BuySaasPackageModal from '@/components/staff/BuySaasPackageModal';
import PaymentModal from '@/components/payment/PaymentModal';
import HouseServiceConfigModal from '@/components/staff/HouseServiceConfigModal';
import TrialExpiryBanner from '@/components/common/TrialExpiryBanner';
import { getTrialStatus } from '@/utils/packagePermissions';
import { healBoardingHousesList } from '@/data/roomsData';

const isZeroSandbox = typeof window !== 'undefined' && localStorage.getItem('rental_is_zero_sandbox') === 'true';

export const HOUSE_IMAGE_PRESETS = [
  { label: 'Tòa Thang Máy Hiện Đại', url: '/assets/images/house_cau_giay.jpg' },
  { label: 'Nhà Phố Đống Đa', url: '/assets/images/house_dong_da.jpg' },
  { label: 'Căn Hộ Dịch Vụ Mini', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop' },
  { label: 'Chung Cư Ban Công Kính', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop' },
  { label: 'Khu Nhà Trọ Liền Kề', url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop' },
  { label: 'Chung Cư Mini Cao Cấp', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop' }
];

const initialHouses = [
  {
    id: 1,
    code: 'CS-01',
    name: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    address: 'Số 45, Ngõ 165 Cầu Giấy, Phường Dịch Vọng, Cầu Giấy, Hà Nội',
    manager: 'Lê Thị Thu Ngân (Staff CS1)',
    managerUsername: 'staff',
    createdBy: 'staff',
    managerPhone: '0912.888.666',
    floors: 5,
    totalRooms: 12,
    occupiedRooms: 9,
    availableRooms: 2,
    maintenanceRooms: 1,
    monthlyRevenue: 34500000,
    features: ['Thang máy', 'Khóa cổng vân tay', 'Camera an ninh 24/7', 'Nhà để xe có bảo vệ', 'Sân phơi rộng']
  },
  {
    id: 2,
    code: 'CS-02',
    name: 'Nhà Trọ Bách Khoa - Cơ Sở 2',
    address: 'Số 18, Ngõ Tự Do, Phường Đồng Tâm, Hai Bà Trưng, Hà Nội',
    manager: 'Đàm Văn Táo (Staff CS2)',
    managerUsername: 'staff2',
    createdBy: 'staff2',
    managerPhone: '0988.777.999',
    floors: 4,
    totalRooms: 8,
    occupiedRooms: 5,
    availableRooms: 3,
    maintenanceRooms: 0,
    monthlyRevenue: 22800000,
    features: ['Khóa cổng vân tay', 'Camera an ninh 24/7', 'Nhà để xe', 'Máy giặt chung', 'Gần các trường ĐH']
  },
  {
    id: 3,
    code: 'CS-03',
    name: 'Nhà Trọ Đống Đa - Cơ Sở 3',
    address: 'Số 92, Phố Chùa Láng, Phường Láng Thượng, Đống Đa, Hà Nội',
    manager: 'Phạm Quốc Hùng',
    managerUsername: 'admin',
    createdBy: 'admin',
    managerPhone: '0936.555.222',
    floors: 6,
    totalRooms: 16,
    occupiedRooms: 14,
    availableRooms: 1,
    maintenanceRooms: 1,
    monthlyRevenue: 51200000,
    features: ['Thang máy tốc độ cao', 'Khóa vân tay & FaceID', 'Bảo vệ túc trực', 'Hầm để xe riêng', 'PCCC tự động']
  }
];

export default function BoardingHousesPage() {
  const { user } = useAuth();
  const {
    rooms = [],
    tenants = [],
    invoices = [],
    landlords = [],
    createSaasInvoice,
    paySaasInvoice,
    updateLandlordPackage,
    deleteRoom,
    recordHouseDeletion
  } = useData();
  const role = user?.role || 'ADMIN';
  const isTenant = role === 'TENANT';
  const isStaff = role === 'STAFF';
  const staffHouseCode = isStaff ? (user?.houseCode || (isZeroSandbox ? null : 'CS-01')) : null;
  const [houseScopeTab, setHouseScopeTab] = useState(isStaff ? 'ASSIGNED' : 'ALL'); // 'ALL' | 'ASSIGNED'
  const [houseStatusTab, setHouseStatusTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'LOCKED' | 'PENDING'

  // Kiểm tra quyền sở hữu cơ sở: Chỉ Staff/Chủ trọ phụ trách cơ sở đó mới được Sửa, Xóa, Cài đặt Biểu giá (Admin không can thiệp)
  const canManageHouse = (house) => {
    if (!house) return false;
    if (role !== 'STAFF') return false;
    const myUsername = user?.username;
    if (!myUsername) return false;
    return (
      house.createdBy === myUsername ||
      house.managerUsername === myUsername ||
      (!isZeroSandbox && myUsername === 'staff' && (house.code === 'CS-01' || !house.createdBy)) ||
      (!isZeroSandbox && myUsername === 'staff2' && house.code === 'CS-02') ||
      (staffHouseCode && house.code === staffHouseCode)
    );
  };

  // Xác định gói cước và hạn mức cơ sở của Chủ trọ hiện tại
  const currentLandlord = useMemo(() => {
    return (landlords || []).find(
      (l) => l.username === user?.username || l.fullName === user?.fullName
    ) || (landlords && landlords.length > 0 ? landlords[0] : null);
  }, [user, landlords]);

  const landlordPackage = (isZeroSandbox && (!currentLandlord || currentLandlord.packageCode === 'NONE'))
    ? 'NONE'
    : (currentLandlord?.packageCode || 'BASIC');

  const maxHousesAllowed = landlordPackage === 'ENTERPRISE' || landlordPackage === 'PRO'
    ? 999
    : landlordPackage === 'BASIC'
    ? 2
    : 1;

  const maxRoomsAllowed = landlordPackage === 'ENTERPRISE'
    ? 99999
    : landlordPackage === 'PRO'
    ? 100
    : (landlordPackage === 'NONE' || landlordPackage === 'TRIAL' ? 10 : 30);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBuyPackageModal, setShowBuyPackageModal] = useState(false);

  const healCustomHouses = (list) => {
    if (!Array.isArray(list)) return list;
    const healed = healBoardingHousesList(list);
    return healed.map((h) => ({
      ...h,
      totalRooms: Math.min(Number(h.totalRooms) || 10, maxRoomsAllowed),
      availableRooms: Math.min(Number(h.availableRooms ?? h.totalRooms) || 10, maxRoomsAllowed)
    }));
  };

  const [rawHouses, setHouses] = useState(() => {
    try {
      const saved = localStorage.getItem('rental_boarding_houses');
      if (saved) {
        const parsed = JSON.parse(saved);
        return healCustomHouses(parsed);
      }
      if (isZeroSandbox) return [];
      return initialHouses;
    } catch {
      return isZeroSandbox ? [] : initialHouses;
    }
  });

  // Đếm số cơ sở mà Chủ trọ / Staff hiện tại đang sở hữu / quản lý (không tính gộp cơ sở của chủ trọ khác)
  const myHousesCount = useMemo(() => {
    if (role === 'ADMIN') return rawHouses.length;
    return rawHouses.filter((h) => canManageHouse(h)).length;
  }, [rawHouses, role, user]);

  // TÍNH TOÁN DỮ LIỆU ĐỘNG CHUẨN XÁC THEO THỜI GIAN THỰC (TASK 3 FIX)
  const enrichedHouses = useMemo(() => {
    return rawHouses.map((house) => {
      // Lấy danh sách phòng thuộc cơ sở này
      const houseRooms = (rooms || []).filter(
        (r) => r.houseCode === house.code || (house.code === 'CS-01' && !r.houseCode)
      );

      // Nếu cơ sở đang ở trạng thái CHỜ ADMIN DUYỆT (PENDING_APPROVAL), cơ sở chưa được cấp phép nên số phòng hoạt động bằng 0
      const isPending = house.status === 'PENDING_APPROVAL';
      const rawFallbackRooms = Number(house.totalRooms) || 10;
      const totalRooms = isPending
        ? 0
        : (houseRooms.length > 0 ? houseRooms.length : Math.min(rawFallbackRooms, maxRoomsAllowed));
      const occupiedRooms = isPending
        ? 0
        : (houseRooms.length > 0 ? houseRooms.filter((r) => r.status === 'OCCUPIED').length : (house.occupiedRooms || 0));
      const availableRooms = isPending
        ? 0
        : (houseRooms.length > 0 ? houseRooms.filter((r) => r.status === 'AVAILABLE').length : Math.min(Number(house.availableRooms ?? rawFallbackRooms) || 0, maxRoomsAllowed));
      const holdingRooms = isPending ? 0 : (houseRooms.length > 0 ? houseRooms.filter((r) => r.status === 'HOLDING').length : 0);
      const maintenanceRooms = isPending ? 0 : (houseRooms.length > 0 ? houseRooms.filter((r) => r.status === 'MAINTENANCE').length : 0);

      // Doanh thu ước tính hàng tháng của cơ sở
      const monthlyRevenue = isPending
        ? 0
        : (houseRooms.length > 0
            ? houseRooms
                .filter((r) => r.status === 'OCCUPIED')
                .reduce((sum, r) => sum + (r.price || 3500000), 0)
            : (house.monthlyRevenue || 0));

      // Danh sách khách thuê thực tế đang ở tại cơ sở này
      const houseTenants = (tenants || []).filter((t) => {
        if (t.status !== 'ACTIVE') return false;
        return houseRooms.some((r) => (r.number === t.room || (Array.isArray(t.rooms) && t.rooms.includes(r.number))) && r.status === 'OCCUPIED');
      });

      return {
        ...house,
        totalRooms,
        occupiedRooms,
        availableRooms,
        holdingRooms,
        maintenanceRooms,
        monthlyRevenue,
        tenantCount: houseTenants.length,
        isAssignedToStaff: canManageHouse(house)
      };
    });
  }, [rawHouses, rooms, tenants, isStaff, staffHouseCode, user]);

  // Bộ lọc theo quyền hạn và tìm kiếm
  const houses = useMemo(() => {
    let list = enrichedHouses;

    if (isTenant) {
      list = list.filter((h) => h.code === 'CS-01');
    } else if (isStaff) {
      // Staff chỉ xem cơ sở thuộc quyền quản lý của mình (Multi-Tenancy)
      list = list.filter((h) => canManageHouse(h));
    }

    // Lọc theo trạng thái vận hành của cơ sở (Tất cả, Đang hoạt động, Tạm khóa, Chờ duyệt)
    if (houseStatusTab === 'ACTIVE') {
      list = list.filter((h) => h.status === 'ACTIVE' || (!h.status && h.status !== 'LOCKED' && h.status !== 'PENDING_APPROVAL'));
    } else if (houseStatusTab === 'LOCKED') {
      list = list.filter((h) => h.status === 'LOCKED');
    } else if (houseStatusTab === 'PENDING') {
      list = list.filter((h) => h.status === 'PENDING_APPROVAL');
    }

    // Sắp xếp cơ sở theo thứ tự số và chữ cái tăng dần (1 trước 2, A trước Z)
    return [...list].sort((a, b) => {
      const nameA = String(a.name || a.code || '').trim();
      const nameB = String(b.name || b.code || '').trim();
      const cmp = nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      return String(a.code || '').localeCompare(String(b.code || ''), undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [enrichedHouses, isTenant, isStaff, houseStatusTab, staffHouseCode, user]);

  const houseCounts = useMemo(() => {
    const baseList = isStaff
      ? enrichedHouses.filter(canManageHouse)
      : enrichedHouses;
    return {
      all: baseList.length,
      active: baseList.filter((h) => h.status === 'ACTIVE' || (!h.status && h.status !== 'LOCKED' && h.status !== 'PENDING_APPROVAL')).length,
      locked: baseList.filter((h) => h.status === 'LOCKED').length,
      pending: baseList.filter((h) => h.status === 'PENDING_APPROVAL').length,
    };
  }, [enrichedHouses, isStaff]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [payingSaasInvoice, setPayingSaasInvoice] = useState(null);
  const [serviceConfigModalOpen, setServiceConfigModalOpen] = useState(false);
  const [selectedHouseForConfig, setSelectedHouseForConfig] = useState(() => {
    return isStaff ? (user?.houseCode || (user?.username === 'staff2' ? 'CS-02' : 'CS-01')) : 'CS-01';
  });
  const [loading, setLoading] = useState(false);
  const [newHouse, setNewHouse] = useState({
    code: '',
    name: '',
    address: '',
    manager: '',
    managerPhone: '',
    floors: 4,
    totalRooms: 10,
    imageUrl: '/assets/images/house_cau_giay.jpg'
  });

  const isNewNameDuplicate = useMemo(() => {
    const clean = (newHouse.name || '').trim().toLowerCase();
    if (!clean) return false;
    // Multi-tenancy: Chỉ kiểm tra trùng tên trong các cơ sở thuộc quyền của Chủ trọ hiện tại
    const myHouses = rawHouses.filter((h) => canManageHouse(h));
    return myHouses.some((h) => (h.name || '').trim().toLowerCase() === clean);
  }, [newHouse.name, rawHouses, user, role]);

  const handleImageFileUpload = (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh có dung lượng dưới 4MB!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result;
      if (isEdit) {
        setEditHouseForm((prev) => ({ ...prev, imageUrl: b64 }));
      } else {
        setNewHouse((prev) => ({ ...prev, imageUrl: b64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await api.get('/properties');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(item => ({
          id: item.id,
          code: item.code || `CS-0${item.id}`,
          name: item.name,
          address: item.address,
          manager: item.managerName || 'Quản lý cơ sở',
          managerPhone: item.managerPhone || '0900.000.000',
          floors: item.totalFloors || 4,
          totalRooms: item.totalRooms || 10,
          occupiedRooms: Math.floor((item.totalRooms || 10) * 0.75),
          availableRooms: Math.ceil((item.totalRooms || 10) * 0.25),
          maintenanceRooms: 0,
          monthlyRevenue: (item.totalRooms || 10) * 3200000,
          features: item.facilities && item.facilities.length > 0
            ? item.facilities.map(f => f.facilityName)
            : ['Khóa cổng vân tay', 'Camera an ninh 24/7', 'Nhà để xe']
        }));
        setHouses(mapped);
      }
    } catch {
      // Graceful fallback to initialHouses demo data
    } finally {
      setLoading(false);
    }
  };

  // Scoping theo quyền Staff và tìm kiếm (đã được sắp xếp tăng dần từ `houses`)
  const filtered = useMemo(() => {
    return houses.filter(h => {
      if (staffHouseCode && h.code !== staffHouseCode && !isZeroSandbox && houseScopeTab === 'ASSIGNED') {
        return false;
      }
      return (
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.manager.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [houses, staffHouseCode, isZeroSandbox, houseScopeTab, searchTerm]);


  const handleApproveHouse = (code) => {
    const nextList = rawHouses.map((h) => (h.code === code ? { ...h, status: 'ACTIVE', approvedAt: new Date().toLocaleDateString('vi-VN') } : h));
    setHouses(nextList);
    try { localStorage.setItem('rental_boarding_houses', JSON.stringify(nextList)); } catch {}
    alert(`✅ Quản Trị Viên đã phê duyệt cơ sở ${code}! Cơ sở đã chuyển sang trạng thái Hoạt Động chính thức.`);
  };

  const handleRejectHouse = (code) => {
    if (window.confirm(`Xác nhận từ chối và gỡ bỏ hồ sơ cơ sở ${code}?`)) {
      const nextList = rawHouses.filter((h) => h.code !== code);
      setHouses(nextList);
      try { localStorage.setItem('rental_boarding_houses', JSON.stringify(nextList)); } catch {}
      alert(`Đã từ chối và gỡ bỏ cơ sở ${code}.`);
    }
  };

  const handleToggleLockHouse = (houseOrCode) => {
    const code = typeof houseOrCode === 'string' ? houseOrCode : houseOrCode.code;
    const targetHouse = rawHouses.find((h) => h.code === code) || (typeof houseOrCode === 'object' ? houseOrCode : null);

    if (targetHouse && !canManageHouse(targetHouse)) {
      alert(`⚠️ Bạn không có quyền thao tác cơ sở này!\nCơ sở này do "${targetHouse.manager || 'Quản lý khác'}" phụ trách.`);
      return;
    }

    const isCurrentlyLocked = targetHouse?.status === 'LOCKED';
    const actionText = isCurrentlyLocked ? 'MỞ KHÓA' : 'TẠM KHÓA';
    const confirmMsg = isCurrentlyLocked
      ? `🔓 Xác nhận MỞ KHÓA hoạt động cơ sở "${targetHouse?.name || code}" (${code})?\n\nCơ sở sẽ hoạt động trở lại bình thường và sẵn sàng đón nhận khách thuê phòng mới.`
      : `🔒 Xác nhận TẠM KHÓA cơ sở "${targetHouse?.name || code}" (${code})?\n\nCơ sở sẽ chuyển sang trạng thái tạm dừng đón khách (dành cho đại tu tòa nhà, bảo trì hệ thống PCCC hoặc sắp hết hạn thuê đất).\n• Khách mới trên sàn sẽ KHÔNG THỂ đăng ký thuê phòng tại cơ sở này.\n• Các hợp đồng của khách đang ở vẫn được tiếp tục bình thường cho đến khi hết hạn.`;

    if (window.confirm(confirmMsg)) {
      const nextStatus = isCurrentlyLocked ? 'ACTIVE' : 'LOCKED';
      const nextList = rawHouses.map((h) => {
        if (h.code === code) {
          return { ...h, status: nextStatus };
        }
        return h;
      });
      setHouses(nextList);
      try {
        localStorage.setItem('rental_boarding_houses', JSON.stringify(nextList));
        window.dispatchEvent(new Event('storage'));
      } catch {}
      alert(`✅ Đã ${actionText} cơ sở "${targetHouse?.name || code}" thành công!`);
    }
  };

  const [editingHouse, setEditingHouse] = useState(null);
  const [editHouseForm, setEditHouseForm] = useState({
    name: '',
    address: '',
    manager: '',
    managerPhone: '',
    floors: 4,
    features: [],
    imageUrl: ''
  });

  const isEditNameDuplicate = useMemo(() => {
    if (!editingHouse) return false;
    const clean = (editHouseForm.name || '').trim().toLowerCase();
    if (!clean) return false;
    const myHouses = rawHouses.filter((h) => canManageHouse(h));
    return myHouses.some(
      (h) => h.code !== editingHouse.code && (h.name || '').trim().toLowerCase() === clean
    );
  }, [editHouseForm.name, editingHouse, rawHouses, user, role]);

  const handleSaveEditHouse = (e) => {
    e.preventDefault();
    if (!editingHouse) return;
    const cleanName = (editHouseForm.name || '').trim();
    const cleanAddress = (editHouseForm.address || '').trim();
    if (!cleanName || !cleanAddress) return;

    if (isEditNameDuplicate) {
      alert(`⚠️ Tên cơ sở "${cleanName}" đã tồn tại trong chuỗi nhà trọ!\n\nVui lòng đặt tên cơ sở khác để phân biệt giữa các chi nhánh.`);
      return;
    }

    const nextList = rawHouses.map((h) => {
      if (h.code === editingHouse.code) {
        return {
          ...h,
          name: cleanName,
          address: cleanAddress,
          manager: editHouseForm.manager,
          managerPhone: editHouseForm.managerPhone,
          floors: Number(editHouseForm.floors) || h.floors,
          features: editHouseForm.features,
          imageUrl: editHouseForm.imageUrl || h.imageUrl || h.image || '/assets/images/house_cau_giay.jpg'
        };
      }
      return h;
    });
    setHouses(nextList);
    try { 
      localStorage.setItem('rental_boarding_houses', JSON.stringify(nextList)); 
      const savedRooms = localStorage.getItem('rental_rooms');
      if (savedRooms) {
        const parsedRooms = JSON.parse(savedRooms);
        if (Array.isArray(parsedRooms)) {
          const updatedRooms = parsedRooms.map(r => {
            if (r.houseCode === editingHouse.code) {
              return { ...r, house: cleanName };
            }
            return r;
          });
          localStorage.setItem('rental_rooms', JSON.stringify(updatedRooms));
        }
      }
      window.dispatchEvent(new Event('storage'));
    } catch {}
    setEditingHouse(null);
  };

  const handleOpenEditHouse = (house) => {
    if (!canManageHouse(house)) {
      alert(`⚠️ Bạn không có quyền chỉnh sửa cơ sở này!\nCơ sở này do "${house.manager || 'Quản lý khác'}" phụ trách.`);
      return;
    }
    setEditingHouse(house);
    setEditHouseForm({
      name: house.name,
      address: house.address,
      manager: house.manager,
      managerPhone: house.managerPhone,
      floors: house.floors || 4,
      features: Array.isArray(house.features) ? [...house.features] : ['Khóa cổng vân tay', 'Camera an ninh 24/7', 'Nhà để xe'],
      imageUrl: house.imageUrl || house.image || house.thumbnail || '/assets/images/house_cau_giay.jpg'
    });
  };

  const handleDeleteHouse = (houseOrCode) => {
    const code = typeof houseOrCode === 'string' ? houseOrCode : houseOrCode.code;
    const targetHouse = enrichedHouses.find((h) => h.code === code) || (typeof houseOrCode === 'object' ? houseOrCode : null);
    
    if (targetHouse && !canManageHouse(targetHouse)) {
      alert(`⚠️ Bạn không có quyền xóa cơ sở này!\nCơ sở này do "${targetHouse.manager || 'Quản lý khác'}" phụ trách.`);
      return;
    }

    const actualOccupied = targetHouse ? (Number(targetHouse.occupiedRooms) || 0) : 0;

    if (actualOccupied > 0) {
      alert(`⚠️ Không thể xóa cơ sở ${targetHouse?.name || code}!\n\nCơ sở này hiện đang có ${actualOccupied} phòng đang có khách thuê. Vui lòng thanh lý hợp đồng và trả phòng trước khi xóa cơ sở.`);
      return;
    }

    if (window.confirm(`Xác nhận xóa vĩnh viễn cơ sở "${targetHouse?.name || code}" (${code})?\n\nDữ liệu cơ sở này và toàn bộ danh mục phòng trực thuộc sẽ được dọn sạch khỏi hệ thống.`)) {
      const nextList = rawHouses.filter((h) => h.code !== code);
      setHouses(nextList);
      try { localStorage.setItem('rental_boarding_houses', JSON.stringify(nextList)); } catch {}

      // Xóa đồng bộ các phòng thuộc cơ sở này
      const houseRoomsToDelete = (rooms || []).filter((r) => r.houseCode === code || (code === 'CS-01' && !r.houseCode));
      if (typeof deleteRoom === 'function') {
        houseRoomsToDelete.forEach((r) => deleteRoom(r.id));
      }
      try {
        const savedRooms = localStorage.getItem('rental_rooms');
        if (savedRooms) {
          const parsed = JSON.parse(savedRooms);
          const filtered = parsed.filter((r) => r.houseCode !== code && !(code === 'CS-01' && !r.houseCode));
          localStorage.setItem('rental_rooms', JSON.stringify(filtered));
        }
      } catch {}

      // Gửi thông báo khẩn cấp đến Quản Trị Viên (Admin) và ghi nhận Audit Log
      if (typeof recordHouseDeletion === 'function') {
        recordHouseDeletion({
          houseCode: code,
          houseName: targetHouse?.name || code,
          deletedBy: user?.fullName || user?.username || (isStaff ? 'Quản lý cơ sở (Staff)' : 'Admin'),
          deletedByRole: role,
          deletedByUsername: user?.username || (isStaff ? 'staff' : 'admin'),
          roomsCount: houseRoomsToDelete.length
        });
      }

      alert(`✅ Đã xóa cơ sở "${targetHouse?.name || code}".\n\n🚨 Hệ thống đã tự động gửi Cảnh Báo Khẩn Cấp đến Quản Trị Viên (Admin) trên thanh thông báo và ghi nhận vào Nhật Ký Kiểm Toán (Audit Log).`);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const cleanName = (newHouse.name || '').trim();
    const cleanAddress = (newHouse.address || '').trim();
    if (!cleanName || !cleanAddress) return;

    if (isNewNameDuplicate) {
      alert(`⚠️ Tên cơ sở "${cleanName}" đã tồn tại trong chuỗi nhà trọ!\n\nMỗi cơ sở cần có tên riêng biệt (ví dụ: kèm tên quận hoặc số cơ sở) để tránh nhầm lẫn khi xếp phòng, ký hợp đồng và lập hóa đơn.`);
      return;
    }

    if (myHousesCount >= maxHousesAllowed) {
      setShowModal(false);
      setShowUpgradeModal(true);
      return;
    }
    
    // Mã cơ sở do hệ thống tự sinh theo từng Chuỗi của Chủ trọ (Staff 1: S1-CS-01, Staff 2: S2-CS-01, Admin: CS-01...)
    const staffPrefix = isStaff
      ? (user?.username === 'staff2' ? 'S2-CS' : (user?.username === 'staff' ? 'S1-CS' : `${(user?.username || 'S').toUpperCase()}-CS`))
      : 'CS';

    // Đếm số thứ tự cơ sở trong riêng chuỗi trọ của Chủ trọ hiện tại
    const myHouses = rawHouses.filter((h) => canManageHouse(h));
    const existingSamePrefix = myHouses.filter((h) => (h.code || '').toUpperCase().startsWith(staffPrefix));
    let nextPrefixNum = 1;
    existingSamePrefix.forEach((h) => {
      const match = (h.code || '').match(new RegExp(`${staffPrefix}-(\\d+)`, 'i'));
      if (match) {
        const n = parseInt(match[1], 10);
        if (n >= nextPrefixNum) nextPrefixNum = n + 1;
      }
    });

    const newCode = `${staffPrefix}-${String(nextPrefixNum).padStart(2, '0')}`;
    const initialStatus = isStaff ? 'PENDING_APPROVAL' : 'ACTIVE';
    const targetRooms = Math.min(Number(newHouse.totalRooms) || 10, maxRoomsAllowed);
    const creatorUser = user?.username || (isStaff ? 'staff' : 'admin');
    const assignedManager = newHouse.manager || user?.fullName || 'Quản lý cơ sở';
    const assignedPhone = newHouse.managerPhone || user?.phone || '0900.000.000';

    const payload = {
      code: newCode,
      name: newHouse.name,
      address: newHouse.address,
      managerName: assignedManager,
      managerPhone: assignedPhone,
      totalFloors: Number(newHouse.floors),
      totalRooms: targetRooms,
      status: initialStatus,
      facilities: [
        { facilityName: 'Khóa cổng vân tay' },
        { facilityName: 'Camera an ninh 24/7' },
        { facilityName: 'Nhà để xe' }
      ]
    };

    try {
      await api.post('/properties', payload);
    } catch {
      // Proceed locally if offline
    }

    const now = Date.now();
    const created = {
      id: now,
      createdAtMs: now,
      createdAt: new Date().toLocaleString('vi-VN'),
      code: newCode,
      ...newHouse,
      imageUrl: newHouse.imageUrl || '/assets/images/house_cau_giay.jpg',
      manager: assignedManager,
      managerPhone: assignedPhone,
      createdBy: creatorUser,
      managerUsername: creatorUser,
      creatorRole: role,
      totalRooms: targetRooms,
      occupiedRooms: 0,
      availableRooms: targetRooms,
      maintenanceRooms: 0,
      monthlyRevenue: 0,
      status: initialStatus,
      features: ['Khóa cổng vân tay', 'Camera an ninh 24/7', 'Nhà để xe']
    };
    const nextList = [...rawHouses, created];
    setHouses(nextList);
    try { localStorage.setItem('rental_boarding_houses', JSON.stringify(nextList)); } catch {}
    setShowModal(false);
    setNewHouse({
      code: '',
      name: '',
      address: '',
      manager: '',
      managerPhone: '',
      floors: 4,
      totalRooms: Math.min(10, maxRoomsAllowed),
      imageUrl: '/assets/images/house_cau_giay.jpg'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản Lý Chuỗi Nhà Trọ (Các Cơ Sở)</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Quản trị mạng lưới các cơ sở tòa nhà trọ, người quản lý chi nhánh và chỉ số vận hành từng cơ sở.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isStaff && (
            <button
              onClick={() => {
                const myHouseCode = houses[0]?.code || staffHouseCode || (user?.username === 'staff2' ? 'CS-02' : 'CS-01');
                setSelectedHouseForConfig(myHouseCode);
                setServiceConfigModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl shadow-xs transition-all"
              title="UC-S01B: Cài đặt Biểu giá dịch vụ chi nhánh (Điện, Nước, Dịch vụ)"
            >
              <Receipt className="w-4 h-4 text-purple-600" />
              <span>Biểu giá dịch vụ chi nhánh (UC-S01B)</span>
            </button>
          )}

          <button
            onClick={() => {
              const trial = getTrialStatus(currentLandlord);
              if (trial.isTrialExpired) {
                setShowBuyPackageModal(true);
                return;
              }
              if (myHousesCount >= maxHousesAllowed) {
                setShowUpgradeModal(true);
              } else {
                let nextNum = 1;
                rawHouses.forEach((h) => {
                  const match = (h.code || '').match(/CS-(\d+)/i);
                  if (match) {
                    const n = parseInt(match[1], 10);
                    if (n >= nextNum) nextNum = n + 1;
                  }
                });
                const autoCode = `CS-${String(nextNum).padStart(2, '0')}`;
                setNewHouse((prev) => ({
                  ...prev,
                  code: autoCode,
                  name: '',
                  address: '',
                  manager: user?.fullName || '',
                  managerPhone: user?.phone || '',
                  floors: 4,
                  totalRooms: 10,
                  imageUrl: '/assets/images/house_cau_giay.jpg'
                }));
                setShowModal(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-purple-600/25 transition-all btn-press cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Cơ Sở Nhà Trọ</span>
            {maxHousesAllowed < 999 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                myHousesCount >= maxHousesAllowed
                  ? 'bg-amber-400 text-slate-950 animate-pulse'
                  : 'bg-white/20 text-white'
              }`}>
                {myHousesCount}/{maxHousesAllowed}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Banner Cảnh Báo Dùng Thử 14 Ngày */}
      <TrialExpiryBanner
        currentLandlord={currentLandlord}
        onUpgradeClick={() => setShowBuyPackageModal(true)}
      />

      {/* Top Aggregation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs card-interactive stagger-item stagger-1">
          <div className="text-xs font-bold text-slate-500 uppercase">Quy mô chuỗi</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{houses.length} Tòa nhà trọ</div>
          <div className="text-xs text-purple-600 font-semibold mt-1">Trải rộng 3 quận nội thành</div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs card-interactive stagger-item stagger-2">
          <div className="text-xs font-bold text-slate-500 uppercase">Tổng số phòng trong chuỗi</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {houses.reduce((acc, h) => acc + h.totalRooms, 0)} Phòng
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">Đang cho thuê: {houses.reduce((acc, h) => acc + h.occupiedRooms, 0)} phòng</div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs card-interactive stagger-item stagger-3">
          <div className="text-xs font-bold text-slate-500 uppercase">Tỷ lệ lấp đầy toàn chuỗi</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {houses.reduce((acc, h) => acc + (h.totalRooms || 0), 0) > 0 ? Math.round((houses.reduce((acc, h) => acc + (h.occupiedRooms || 0), 0) / houses.reduce((acc, h) => acc + (h.totalRooms || 0), 0)) * 100) : 0}%
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Hiệu suất khai thác cao</div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs card-interactive stagger-item stagger-4">
          <div className="text-xs font-bold text-slate-500 uppercase">Tổng dòng tiền / tháng</div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {(houses.reduce((acc, h) => acc + h.monthlyRevenue, 0) / 1000000).toFixed(1)} Tr đ
          </div>
          <div className="text-xs text-blue-600 font-semibold mt-1">3 cơ sở đang sinh lời</div>
        </div>
      </div>

      {/* Search & Staff Scope & Status Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm cơ sở nhà trọ theo tên, mã CS, địa chỉ, người quản lý..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {isStaff && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setHouseScopeTab('ASSIGNED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  houseScopeTab === 'ASSIGNED'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>⭐ Cơ Sở Bạn Quản Lý ({enrichedHouses.filter(canManageHouse).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setHouseScopeTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  houseScopeTab === 'ALL'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏢 Toàn Chuỗi ({enrichedHouses.length})
              </button>
            </div>
          )}
        </div>

        {/* Status Filter Tabs (Tất cả, Đang hoạt động, Tạm khóa, Chờ duyệt) */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={() => setHouseStatusTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              houseStatusTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất Cả ({houseCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setHouseStatusTab('ACTIVE')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              houseStatusTab === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đang Hoạt Động ({houseCounts.active})</span>
          </button>
          <button
            type="button"
            onClick={() => setHouseStatusTab('LOCKED')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              houseStatusTab === 'LOCKED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-rose-700 hover:bg-rose-50'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Tạm Khóa ({houseCounts.locked})</span>
          </button>
          <button
            type="button"
            onClick={() => setHouseStatusTab('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              houseStatusTab === 'PENDING'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ Duyệt ({houseCounts.pending})</span>
          </button>
        </div>
      </div>

      {/* Chain Houses Cards Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-300 shadow-xs">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Chưa có cơ sở nhà trọ nào</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Hệ thống đang ở chế độ làm sạch (Sandbox 0). Bạn có thể bấm nút bên dưới để tạo cơ sở tòa nhà trọ đầu tiên (CS-01, CS-02...) và bắt đầu quản lý!
          </p>
          <button
            onClick={() => {
              const trial = getTrialStatus(currentLandlord);
              if (trial.isTrialExpired) {
                setShowBuyPackageModal(true);
                return;
              }
              if (myHousesCount >= maxHousesAllowed) {
                setShowUpgradeModal(true);
                return;
              }
              let nextNum = 1;
              rawHouses.forEach((h) => {
                const match = (h.code || '').match(/CS-(\d+)/i);
                if (match) {
                  const n = parseInt(match[1], 10);
                  if (n >= nextNum) nextNum = n + 1;
                }
              });
              const autoCode = `CS-${String(nextNum).padStart(2, '0')}`;
              setNewHouse((prev) => ({
                ...prev,
                code: autoCode,
                name: '',
                address: '',
                manager: user?.fullName || '',
                managerPhone: user?.phone || '',
                floors: 4,
                totalRooms: 10,
                imageUrl: '/assets/images/house_cau_giay.jpg'
              }));
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/25 transition-all btn-press cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm Cơ Sở Nhà Trọ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filtered.map((house, idx) => {
          const occupancyRate = Math.round((house.occupiedRooms / house.totalRooms) * 100);
          const houseImg = house.imageUrl || house.image || house.thumbnail || (house.code === 'CS-03' ? '/assets/images/house_dong_da.jpg' : '/assets/images/house_cau_giay.jpg');

          return (
            <div
              key={house.id}
              className={`bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs card-interactive stagger-item stagger-${(idx % 6) + 1} flex flex-col justify-between group`}
            >
              <div>
                {/* Ảnh phối cảnh thực tế cơ sở tòa nhà */}
                <div className="relative h-44 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-2xl group/img bg-slate-100">
                  <img
                    src={houseImg}
                    alt={`Ảnh tòa nhà ${house.name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-black/20 pointer-events-none" />

                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-purple-600/90 text-white backdrop-blur-md border border-white/20 shadow-md">
                      {house.code}
                    </span>
                    {house.status === 'PENDING_APPROVAL' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-white backdrop-blur-md border border-white/20 shadow-md animate-pulse flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Chờ Admin Duyệt
                      </span>
                    ) : house.status === 'LOCKED' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-600 text-white backdrop-blur-md border border-white/20 shadow-md">
                        Đã Khóa
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-600 text-white backdrop-blur-md border border-white/20 shadow-md">
                        Hoạt Động
                      </span>
                    )}
                    {house.isAssignedToStaff ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-400 text-slate-950 shadow-md border border-white/40">
                        ⭐ Cơ sở của bạn
                      </span>
                    ) : isStaff ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-800/80 text-amber-200 shadow-md border border-white/20 backdrop-blur-md">
                        🔒 Chi nhánh khác (QL: {house.manager})
                      </span>
                    ) : null}
                  </div>

                  <div className="absolute top-3 right-3 z-10">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/90 text-white backdrop-blur-md border border-white/20 shadow-md">
                      {occupancyRate}% Lấp đầy
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-4 right-4 text-white pointer-events-none">
                    <h3 className="text-base font-black drop-shadow-md truncate">
                      {house.name}
                    </h3>
                  </div>
                </div>

                {/* House Header */}
                <div className="flex items-start justify-between">
                  {house.status === 'PENDING_APPROVAL' && isStaff ? (
                    <div
                      className="flex items-center gap-3 cursor-pointer group"
                      title="Cơ sở đang chờ Quản trị viên (Admin) xét duyệt"
                      onClick={() => alert(`⚠️ Cơ sở "${house.name}" (${house.code}) đang ở trạng thái 'Chờ Admin Phê Duyệt'.\n\nVui lòng đợi Quản trị viên thẩm định giấy tờ & cấp phép trước khi bạn có thể thiết lập phòng trọ và đón khách.`)}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-sm">
                        <Clock className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                          {house.code}
                        </span>
                        <h3 className="text-base font-black text-slate-800 mt-1">
                          {house.name}
                        </h3>
                        <div className="text-[11px] text-amber-600 font-bold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> Chờ Quản trị viên phê duyệt
                        </div>
                      </div>
                    </div>
                  ) : house.status === 'LOCKED' ? (
                    <Link
                      to={`/rooms?house=${house.code}`}
                      className="flex items-center gap-3 group"
                      title={`Bấm để xem danh sách phòng của ${house.name} (Đang tạm khóa)`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                            {house.code}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            🔒 Đang Tạm Khóa
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-1 group-hover:text-rose-600 transition-colors">
                          {house.name}
                        </h3>
                        <div className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-0.5">
                          Tạm ngừng tiếp nhận khách mới
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      to={`/rooms?house=${house.code}`}
                      className="flex items-center gap-3 group"
                      title={`Bấm để xem danh sách phòng của ${house.name}`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20 group-hover:scale-105 transition-transform">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                          {house.code}
                        </span>
                        <h3 className="text-base font-black text-slate-900 mt-1 group-hover:text-purple-600 transition-colors">
                          {house.name}
                        </h3>
                      </div>
                    </Link>
                  )}
                </div>

                {/* Address & Manager */}
                <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{house.address}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500">Quản lý cơ sở:</span>
                    <span className="font-bold text-slate-800">{house.manager}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">SĐT Liên hệ:</span>
                    <span className="font-mono font-bold text-purple-700">{house.managerPhone}</span>
                  </div>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-500">Tỷ lệ lấp đầy phòng:</span>
                    <span className="font-bold text-purple-700">{occupancyRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                      style={{ width: `${occupancyRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats Breakdown (Dữ liệu thời gian thực đồng bộ Sơ đồ phòng) */}
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-slate-100 text-center">
                  <div className="p-1.5 rounded-xl bg-purple-50 border border-purple-100">
                    <div className="text-[9px] font-bold text-purple-700 uppercase">Đang ở</div>
                    <div className="text-sm font-black text-purple-900 mt-0.5">{house.occupiedRooms}</div>
                  </div>
                  <div className="p-1.5 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="text-[9px] font-bold text-blue-700 uppercase">Trống</div>
                    <div className="text-sm font-black text-blue-900 mt-0.5">{house.availableRooms}</div>
                  </div>
                  <div className="p-1.5 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="text-[9px] font-bold text-amber-700 uppercase">Giữ chỗ</div>
                    <div className="text-sm font-black text-amber-900 mt-0.5">{house.holdingRooms || 0}</div>
                  </div>
                  <div className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="text-[9px] font-bold text-emerald-700 uppercase">Doanh thu</div>
                    <div className="text-xs font-black text-emerald-800 mt-0.5">
                      {(house.monthlyRevenue / 1000000).toFixed(1)}Tr
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-500 mb-1.5">Tiện ích cơ sở:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {house.features.map((f, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Thông báo cơ sở chờ duyệt cho Chủ trọ */}
              {house.status === 'PENDING_APPROVAL' && (
                <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Cơ sở đang chờ Quản trị viên (Admin) thẩm định giấy tờ & phê duyệt đưa vào hoạt động chính thức.</span>
                </div>
              )}

              {/* Thông báo cơ sở đang tạm khóa */}
              {house.status === 'LOCKED' && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Cơ sở đang tạm khóa: Tạm ngừng đón khách mới để đại tu/bảo trì. Các phòng đang có người ở vẫn duy trì thu tiền bình thường.</span>
                </div>
              )}

              {/* Action */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                {/* Nút Phê Duyệt / Từ Chối dành riêng cho ADMIN */}
                {role === 'ADMIN' && house.status === 'PENDING_APPROVAL' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApproveHouse(house.code)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl shadow-sm transition btn-press cursor-pointer"
                      title="Phê duyệt cơ sở nhà trọ đưa vào hoạt động"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Duyệt Cơ Sở Ngay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectHouse(house.code)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition btn-press cursor-pointer"
                      title="Từ chối và gỡ bỏ cơ sở này"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Từ Chối</span>
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Quyền quản trị sàn của Admin đối với cơ sở đã kích hoạt */}
                  {role === 'ADMIN' && house.status !== 'PENDING_APPROVAL' && (
                    <button
                      type="button"
                      onClick={() => handleToggleLockHouse(house)}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition border cursor-pointer ${
                        house.status === 'LOCKED'
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 shadow-xs'
                          : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                      }`}
                      title={house.status === 'LOCKED' ? 'Mở khóa kích hoạt lại cơ sở đón khách' : 'Tạm khóa cơ sở (bảo trì / đại tu)'}
                    >
                      {house.status === 'LOCKED' ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Mở Khóa</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Tạm Khóa</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Quyền của Chủ trọ phụ trách cơ sở: Tạm khóa, Biểu giá, Sửa, Xóa */}
                  {canManageHouse(house) ? (
                    <>
                      {/* Nút Tạm Khóa / Mở Khóa Cơ Sở */}
                      {house.status !== 'PENDING_APPROVAL' && (
                        <button
                          type="button"
                          onClick={() => handleToggleLockHouse(house)}
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition border cursor-pointer ${
                            house.status === 'LOCKED'
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 shadow-xs'
                              : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                          }`}
                          title={house.status === 'LOCKED' ? 'Mở khóa kích hoạt lại cơ sở đón khách' : 'Tạm khóa cơ sở (bảo trì / đại tu)'}
                        >
                          {house.status === 'LOCKED' ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Mở Khóa</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Tạm Khóa</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedHouseForConfig(house.code);
                          setServiceConfigModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 px-2.5 py-1.5 rounded-xl transition border border-slate-200 cursor-pointer"
                        title="UC-S01B: Cài đặt Biểu giá dịch vụ chi nhánh"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Biểu giá</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditHouse(house)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-xl transition border border-indigo-200 cursor-pointer"
                        title="Chỉnh sửa thông tin cơ sở nhà trọ"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteHouse(house)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl transition border border-rose-200 cursor-pointer"
                        title="Xóa vĩnh viễn cơ sở nhà trọ này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </>
                  ) : (
                    role !== 'ADMIN' && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200"
                        title={`Cơ sở này do ${house.manager || 'Quản lý khác'} phụ trách`}
                      >
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Chỉ xem ({house.manager || 'Nhân sự khác'})</span>
                      </span>
                    )
                  )}
                </div>

                <Link
                  to={`/rooms?house=${house.code}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-purple-600/20 hover:scale-105"
                >
                  <span>Xem {house.totalRooms} phòng {house.code}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Modal Thêm Cơ Sở Nhà Trọ */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-xl">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Thêm Cơ Sở Nhà Trọ Vào Chuỗi</h2>
            <p className="text-xs text-slate-500">Khai báo tòa nhà, cấu hình thông tin và ảnh đại diện chi nhánh</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Ảnh Thumbnail Cơ Sở */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <span>Ảnh Phối Cảnh / Thumbnail Cơ Sở</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Tùy chọn tải ảnh hoặc chọn mẫu</span>
            </label>

            {/* Preview Box */}
            <div className="relative h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mb-2.5 group">
              <img
                src={newHouse.imageUrl || '/assets/images/house_cau_giay.jpg'}
                alt="Preview cơ sở"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 hover:bg-slate-50">
                  <Upload className="w-3.5 h-3.5 text-purple-600" />
                  <span>Tải ảnh từ máy</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageFileUpload(e, false)}
                  />
                </label>
              </div>
            </div>

            {/* Thư viện chọn nhanh ảnh mẫu */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-600">Hoặc chọn nhanh từ thư viện ảnh mẫu:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {HOUSE_IMAGE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewHouse({ ...newHouse, imageUrl: preset.url })}
                    className={`p-1.5 rounded-xl border text-left text-[10px] transition-all flex items-center gap-1.5 cursor-pointer ${
                      newHouse.imageUrl === preset.url
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold ring-1 ring-purple-600'
                        : 'border-slate-200 hover:border-purple-300 bg-white text-slate-600'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-6 h-6 rounded-md object-cover" />
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* URL nhập trực tiếp */}
            <div className="mt-2">
              <input
                type="text"
                placeholder="Hoặc dán đường dẫn ảnh trực tiếp (https://...)"
                value={newHouse.imageUrl}
                onChange={(e) => setNewHouse({ ...newHouse, imageUrl: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Tên cơ sở nhà trọ *</label>
              {isNewNameDuplicate && (
                <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Đã tồn tại tên cơ sở này
                </span>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="Ví dụ: Nhà Trọ Tây Hồ - Cơ Sở 4"
              value={newHouse.name}
              onChange={(e) => setNewHouse({ ...newHouse, name: e.target.value })}
              className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white font-semibold transition-colors ${
                isNewNameDuplicate
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/40 text-rose-900'
                  : 'border-slate-200 focus:border-purple-500'
              }`}
            />
            {isNewNameDuplicate && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                ⚠️ Mỗi cơ sở trong hệ thống phải có tên riêng biệt để tránh nhầm lẫn trong hợp đồng và hóa đơn.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ chi tiết *</label>
            <input
              type="text"
              required
              placeholder="Số nhà, đường, phường, quận..."
              value={newHouse.address}
              onChange={(e) => setNewHouse({ ...newHouse, address: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số tầng</label>
              <input
                type="number"
                value={newHouse.floors}
                onChange={(e) => setNewHouse({ ...newHouse, floors: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Tổng số phòng dự kiến</label>
                <span className="text-[10px] font-bold text-purple-700">
                  Tối đa {maxRoomsAllowed} phòng ({landlordPackage})
                </span>
              </div>
              <input
                type="number"
                min={1}
                max={maxRoomsAllowed}
                value={newHouse.totalRooms}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setNewHouse({ ...newHouse, totalRooms: val > maxRoomsAllowed ? maxRoomsAllowed : val });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
              />
            </div>
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
              disabled={isNewNameDuplicate}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all ${
                isNewNameDuplicate
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-600/25 btn-press'
              }`}
            >
              Thêm Cơ Sở
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Chỉnh Sửa Cơ Sở Nhà Trọ */}
      <Modal isOpen={!!editingHouse} onClose={() => setEditingHouse(null)} maxWidth="max-w-xl">
        {editingHouse && (
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Chỉnh Sửa Cơ Sở ({editingHouse.code})
                  </h2>
                  <p className="text-xs text-slate-500">Cập nhật thông tin chi nhánh và ảnh phối cảnh tòa nhà</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingHouse(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditHouse} className="space-y-3.5 pt-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
              {/* Ảnh Thumbnail Cơ Sở */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>Ảnh Phối Cảnh / Thumbnail Cơ Sở</span>
                  </span>
                  <label className="text-[10px] text-purple-600 font-bold hover:underline cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Tải ảnh mới từ máy</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileUpload(e, true)}
                    />
                  </label>
                </label>

                <div className="relative h-36 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mb-2">
                  <img
                    src={editHouseForm.imageUrl || '/assets/images/house_cau_giay.jpg'}
                    alt="Preview cơ sở"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {HOUSE_IMAGE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditHouseForm({ ...editHouseForm, imageUrl: preset.url })}
                      className={`p-1.5 rounded-xl border text-left text-[10px] transition-all flex items-center gap-1.5 cursor-pointer ${
                        editHouseForm.imageUrl === preset.url
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
                  placeholder="Hoặc dán link ảnh (https://...)"
                  value={editHouseForm.imageUrl}
                  onChange={(e) => setEditHouseForm({ ...editHouseForm, imageUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Tên cơ sở nhà trọ *</label>
                  {isEditNameDuplicate && (
                    <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Đã tồn tại tên cơ sở này
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={editHouseForm.name}
                  onChange={(e) => setEditHouseForm({ ...editHouseForm, name: e.target.value })}
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white transition-colors ${
                    isEditNameDuplicate
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/40 text-rose-900'
                      : 'border-slate-200 focus:border-purple-500'
                  }`}
                />
                {isEditNameDuplicate && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    ⚠️ Trùng tên với một cơ sở khác trong hệ thống. Vui lòng chọn tên khác.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa chỉ chi tiết *</label>
                <input
                  type="text"
                  required
                  value={editHouseForm.address}
                  onChange={(e) => setEditHouseForm({ ...editHouseForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Người quản lý cơ sở *</label>
                  <input
                    type="text"
                    required
                    value={editHouseForm.manager}
                    onChange={(e) => setEditHouseForm({ ...editHouseForm, manager: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SĐT liên hệ quản lý *</label>
                  <input
                    type="text"
                    required
                    value={editHouseForm.managerPhone}
                    onChange={(e) => setEditHouseForm({ ...editHouseForm, managerPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số tầng tòa nhà</label>
                  <input
                    type="number"
                    min={1}
                    value={editHouseForm.floors}
                    onChange={(e) => setEditHouseForm({ ...editHouseForm, floors: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quy mô hiện tại</label>
                  <div className="px-3 py-2 bg-slate-100 rounded-xl text-slate-600 font-bold">
                    {editingHouse.totalRooms} Phòng
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiện ích cơ sở (cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={editHouseForm.features.join(', ')}
                  onChange={(e) =>
                    setEditHouseForm({
                      ...editHouseForm,
                      features: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    })
                  }
                  placeholder="Thang máy, Khóa cổng vân tay, Camera 24/7..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingHouse(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isEditNameDuplicate}
                  className={`px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-all ${
                    isEditNameDuplicate
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white cursor-pointer'
                  }`}
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* UC-S01B: Cài đặt Biểu giá dịch vụ chi nhánh */}
      <HouseServiceConfigModal
        isOpen={serviceConfigModalOpen}
        onClose={() => setServiceConfigModalOpen(false)}
        houseCode={selectedHouseForConfig}
        defaultHouseId={selectedHouseForConfig}
      />

      {/* Modal Cảnh Báo Bản Quyền & Nâng Cấp Gói */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Mở Rộng Thêm Cơ Sở / Tòa Nhà Mới"
        featureDescription={`Gói hiện tại (${landlordPackage}) chỉ cho phép tối đa ${maxHousesAllowed} cơ sở nhà trọ (Hiện bạn đã có ${houses.length} cơ sở). Để quản lý chuỗi không giới hạn tòa nhà trọ, vui lòng nâng cấp lên Gói Chuyên Nghiệp (PRO) hoặc Gói Doanh Nghiệp (ENTERPRISE).`}
        currentPackageCode={landlordPackage}
        requiredPackageCode="PRO"
        onUpgradeClick={(reqCode) => {
          setShowUpgradeModal(false);
          setShowBuyPackageModal(true);
        }}
      />

      {/* Modal Mua Gói Bản Quyền SaaS */}
      <BuySaasPackageModal
        isOpen={showBuyPackageModal}
        onClose={() => setShowBuyPackageModal(false)}
        currentLandlord={currentLandlord}
        initialPackageCode="PRO"
        onConfirmPurchase={(planData) => {
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
          const createdInv = createSaasInvoice ? createSaasInvoice(newInv) : newInv;
          setPayingSaasInvoice(createdInv || newInv);
        }}
      />

      {/* Modal Cổng Thanh Toán SePay VietQR / VNPay / MoMo Cho Gói SaaS */}
      <PaymentModal
        isOpen={!!payingSaasInvoice}
        onClose={() => setPayingSaasInvoice(null)}
        onSuccess={(inv, payMethod) => {
          const methodLabel = payMethod === 'VNPAY' ? 'Cổng VNPay' : (payMethod === 'MOMO' ? 'Ví MoMo' : 'VietQR / SePay');
          if (paySaasInvoice) {
            paySaasInvoice(inv.id, methodLabel);
          }
          const targetLandlordId = currentLandlord?.id || (user?.username === 'staff2' ? 2 : 1);
          if (updateLandlordPackage) {
            updateLandlordPackage(targetLandlordId, inv.packageCode || 'PRO');
          }
          setPayingSaasInvoice(null);
          alert(`🎉 Nộp tiền cước SaaS qua ${methodLabel} thành công!\nGói ${inv.packageName || inv.packageCode} đã được kích hoạt, bạn có thể tạo cơ sở không giới hạn.`);
        }}
        invoice={payingSaasInvoice || undefined}
      />
    </div>
  );
}
