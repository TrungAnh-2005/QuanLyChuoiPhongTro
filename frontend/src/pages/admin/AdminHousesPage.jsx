import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock,
  Search,
  Check,
  X,
  AlertCircle,
  MapPin,
  Phone,
  User,
  Users,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Layers,
  Crown,
  Lock
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export default function AdminHousesPage() {
  const { landlords = [] } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'ACTIVE'
  const [toastMessage, setToastMessage] = useState(null);

  // Expanded landlords state (key: landlord identifier -> boolean)
  const [expandedLandlords, setExpandedLandlords] = useState({});

  const [housesList, setHousesList] = useState(() => {
    try {
      const saved = localStorage.getItem('rental_boarding_houses');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
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
        status: 'ACTIVE'
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
        status: 'ACTIVE'
      },
      {
        id: 3,
        code: 'CS-03',
        name: 'Nhà Trọ Đống Đa - Cơ Sở 3',
        address: 'Số 92, Phố Chùa Láng, Phường Láng Thượng, Đống Đa, Hà Nội',
        manager: 'Phạm Quốc Hùng',
        managerUsername: 'landlord_dd',
        createdBy: 'landlord_dd',
        managerPhone: '0936.555.222',
        floors: 6,
        totalRooms: 16,
        status: 'ACTIVE'
      }
    ];
  });

  const reloadHouses = () => {
    try {
      const saved = localStorage.getItem('rental_boarding_houses');
      if (saved) {
        setHousesList(JSON.parse(saved));
      }
    } catch {}
  };

  useEffect(() => {
    reloadHouses();
    const handleStorage = () => reloadHouses();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const showToast = (msg, type = 'SUCCESS') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApproveHouse = (code) => {
    const updated = housesList.map((h) =>
      h.code === code ? { ...h, status: 'ACTIVE', approvedAt: new Date().toLocaleDateString('vi-VN') } : h
    );
    setHousesList(updated);
    try {
      localStorage.setItem('rental_boarding_houses', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch {}
    showToast(`✅ Quản Trị Viên đã phê duyệt cơ sở ${code}! Cơ sở đã kích hoạt đưa vào hoạt động chính thức.`);
  };

  const handleRejectHouse = (code) => {
    if (window.confirm(`Xác nhận từ chối và gỡ bỏ cơ sở ${code}?`)) {
      const updated = housesList.filter((h) => h.code !== code);
      setHousesList(updated);
      try {
        localStorage.setItem('rental_boarding_houses', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      } catch {}
      showToast(`Đã từ chối và gỡ bỏ hồ sơ cơ sở ${code}.`, 'WARNING');
    }
  };

  // Base list of landlords with fallbacks if empty
  const activeLandlords = useMemo(() => {
    if (landlords && landlords.length > 0) return landlords;
    return [
      {
        id: 1,
        username: 'staff',
        fullName: 'Lê Thị Thu Ngân',
        email: 'staff@rental.vn',
        phone: '0912.888.666',
        packageCode: 'PRO',
        subscriptionPackage: 'Gói Chuyên Nghiệp',
        status: 'ACTIVE'
      },
      {
        id: 2,
        username: 'staff2',
        fullName: 'Đàm Văn Táo',
        email: 'staff2@rental.vn',
        phone: '0988.777.999',
        packageCode: 'BASIC',
        subscriptionPackage: 'Gói Cơ Bản',
        status: 'ACTIVE'
      },
      {
        id: 3,
        username: 'landlord_dd',
        fullName: 'Phạm Quốc Hùng',
        email: 'hung.pq@rental.vn',
        phone: '0936.555.222',
        packageCode: 'ENTERPRISE',
        subscriptionPackage: 'Gói Doanh Nghiệp',
        status: 'ACTIVE'
      }
    ];
  }, [landlords]);

  // Group houses by Landlord
  const landlordGroups = useMemo(() => {
    const assignedCodes = new Set();
    const groups = activeLandlords.map((landlord) => {
      const myHouses = housesList.filter((h) => {
        const u = (h.managerUsername || h.createdBy || '').toLowerCase();
        const lUser = (landlord.username || '').toLowerCase();
        if (u === lUser) return true;
        if (
          h.manager &&
          landlord.fullName &&
          (h.manager.toLowerCase().includes(landlord.fullName.toLowerCase()) ||
            landlord.fullName.toLowerCase().includes(h.manager.toLowerCase()))
        ) {
          return true;
        }
        if (
          h.managerPhone &&
          landlord.phone &&
          h.managerPhone.replace(/\D/g, '') === landlord.phone.replace(/\D/g, '')
        ) {
          return true;
        }
        return false;
      });

      myHouses.forEach((h) => assignedCodes.add(h.code));

      return {
        key: landlord.username || String(landlord.id),
        landlord,
        houses: myHouses
      };
    });

    // Handle any orphaned houses not explicitly matching activeLandlords
    const unassigned = housesList.filter((h) => !assignedCodes.has(h.code));
    if (unassigned.length > 0) {
      // Group unassigned by manager name or createdBy
      const unassignedMap = {};
      unassigned.forEach((h) => {
        const key = h.manager || h.createdBy || 'Khác';
        if (!unassignedMap[key]) unassignedMap[key] = [];
        unassignedMap[key].push(h);
      });

      Object.entries(unassignedMap).forEach(([key, list]) => {
        const first = list[0];
        groups.push({
          key: `extra_${key}`,
          landlord: {
            id: `extra_${key}`,
            username: first.createdBy || first.managerUsername || 'staff',
            fullName: first.manager || key,
            phone: first.managerPhone || 'Chưa cập nhật',
            email: `${first.createdBy || 'chutro'}@rental.vn`,
            packageCode: 'PRO',
            subscriptionPackage: 'Gói Đối Tác',
            status: 'ACTIVE'
          },
          houses: list
        });
      });
    }

    return groups;
  }, [activeLandlords, housesList]);

  // Overall counts for KPIs
  const totalHousesCount = housesList.length;
  const pendingCount = housesList.filter((h) => h.status === 'PENDING_APPROVAL').length;
  const activeCount = housesList.filter((h) => h.status === 'ACTIVE' || !h.status).length;
  const totalLandlordsCount = landlordGroups.length;

  // Auto-expand landlords that have pending houses or match search
  useEffect(() => {
    const initial = {};
    landlordGroups.forEach((group) => {
      const hasPending = group.houses.some((h) => h.status === 'PENDING_APPROVAL');
      if (hasPending || statusFilter === 'PENDING') {
        initial[group.key] = true;
      }
    });
    setExpandedLandlords((prev) => ({ ...initial, ...prev }));
  }, [landlordGroups, statusFilter]);

  // Filter groups and their houses
  const filteredGroups = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return landlordGroups
      .map((group) => {
        const landlordMatches =
          !q ||
          (group.landlord.fullName || '').toLowerCase().includes(q) ||
          (group.landlord.phone || '').includes(q) ||
          (group.landlord.email || '').toLowerCase().includes(q) ||
          (group.landlord.username || '').toLowerCase().includes(q);

        // Filter houses inside group based on status & search
        const matchedHouses = group.houses.filter((h) => {
          const matchStatus =
            statusFilter === 'ALL'
              ? true
              : statusFilter === 'PENDING'
              ? h.status === 'PENDING_APPROVAL'
              : statusFilter === 'ACTIVE'
              ? h.status === 'ACTIVE' || !h.status
              : true;

          const matchHouseQuery =
            !q ||
            landlordMatches ||
            (h.name || '').toLowerCase().includes(q) ||
            (h.code || '').toLowerCase().includes(q) ||
            (h.address || '').toLowerCase().includes(q);

          return matchStatus && matchHouseQuery;
        });

        return {
          ...group,
          filteredHouses: matchedHouses,
          isMatch: matchedHouses.length > 0 || (landlordMatches && statusFilter === 'ALL')
        };
      })
      .filter((group) => group.isMatch);
  }, [landlordGroups, searchTerm, statusFilter]);

  // Toggle single landlord accordion
  const toggleLandlord = (key) => {
    setExpandedLandlords((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Expand / Collapse all
  const areAllExpanded = filteredGroups.length > 0 && filteredGroups.every((g) => expandedLandlords[g.key]);
  const toggleExpandAll = () => {
    const nextState = !areAllExpanded;
    const update = {};
    filteredGroups.forEach((g) => {
      update[g.key] = nextState;
    });
    setExpandedLandlords((prev) => ({ ...prev, ...update }));
  };

  const getPackageBadge = (code) => {
    switch (code) {
      case 'ENTERPRISE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-700 border border-purple-200">
            <Crown className="w-3 h-3 text-purple-600" />
            ENTERPRISE
          </span>
        );
      case 'PRO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            PRO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            BASIC
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 page-enter font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold backdrop-blur-xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="status-pill status-pill-indigo text-[11px] font-bold">
              Phân Hệ Quản Trị & Xét Duyệt Cơ Sở Toàn Sàn
            </span>
            <span className="status-pill status-pill-emerald text-[11px] font-bold">
              Thẩm Quyền Quản Trị Viên (ADMIN)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-indigo-600" />
            <span>Quản Trị Cơ Sở Theo Chủ Trọ</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-2xl mt-1">
            Mô hình phân cấp quản lý theo Chủ trọ: Bấm vào tên Chủ trọ để mở rộng danh sách cơ sở, thẩm định hồ sơ cấp phép và theo dõi quy mô kinh doanh.
          </p>
        </div>
      </div>

      {/* Bento KPI Summary Cards - 3 Core Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Landlords */}
        <div className="bento-card p-5 space-y-2 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tổng Đối Tác Chủ Trọ
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalLandlordsCount}</div>
          <div className="text-xs text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Sở hữu {totalHousesCount} cơ sở trên toàn sàn</span>
            <span className="text-indigo-600 font-bold">100% tài khoản</span>
          </div>
        </div>

        {/* KPI 2: Pending Approval Houses */}
        <div className="bento-card p-5 space-y-2 hover:shadow-lg transition-all border-amber-200/60 bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Cơ Sở Chờ Thẩm Định / Duyệt
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-700 flex items-center gap-2">
            <span>{pendingCount}</span>
            {pendingCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-bold animate-pulse">
                Cần xử lý
              </span>
            )}
          </div>
          <div className="text-xs text-amber-600 font-bold pt-1 border-t border-amber-200/40">
            {pendingCount > 0 ? '⚡ Có hồ sơ cơ sở mới cần Admin cấp phép' : 'Đã hoàn tất thẩm định 100%'}
          </div>
        </div>

        {/* KPI 3: Active Houses */}
        <div className="bento-card p-5 space-y-2 hover:shadow-lg transition-all border-emerald-200/60 bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Cơ Sở Đang Hoạt Động
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700">{activeCount}</div>
          <div className="text-xs text-emerald-600 font-bold pt-1 border-t border-emerald-200/40">
            Đã cấp phép vận hành & đủ điều kiện kinh doanh
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bento-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`btn-press px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất Cả ({totalHousesCount})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`btn-press px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'PENDING'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Chờ Duyệt ({pendingCount})</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`btn-press px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đang Hoạt Động ({activeCount})
          </button>
        </div>

        {/* Right tools: Search & Expand All */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo chủ trọ, SĐT, tên CS, mã CS..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            onClick={toggleExpandAll}
            className="btn-press shrink-0 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title={areAllExpanded ? 'Thu gọn tất cả chủ trọ' : 'Mở rộng tất cả chủ trọ'}
          >
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">
              {areAllExpanded ? 'Thu Gọn Tất Cả' : 'Mở Rộng Tất Cả'}
            </span>
          </button>
        </div>
      </div>

      {/* Accordion List: Grouped by Landlord */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="bento-card p-12 text-center text-slate-400 space-y-2">
            <Building2 className="w-12 h-12 mx-auto text-slate-300" />
            <h4 className="font-bold text-slate-700 text-sm">Không tìm thấy Chủ trọ hoặc Cơ sở phù hợp</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc chuyển sang bộ lọc "Tất Cả" để xem danh sách toàn sàn.
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isExpanded = !!expandedLandlords[group.key];
            const landlord = group.landlord;
            const houses = group.filteredHouses || [];
            const hasPendingInGroup = group.houses.some((h) => h.status === 'PENDING_APPROVAL');

            return (
              <div
                key={group.key}
                className="bento-card overflow-hidden transition-all duration-300 border border-slate-200/80"
              >
                {/* Landlord Header (Clickable Accordion Row) */}
                <div
                  onClick={() => toggleLandlord(group.key)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer bg-white hover:bg-slate-50/70 transition-colors select-none"
                >
                  {/* Left: Avatar & Landlord Identity */}
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
                        {landlord.fullName ? landlord.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" title="Chủ trọ hợp lệ" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm sm:text-base hover:text-indigo-600 transition">
                          {landlord.fullName}
                        </span>
                        {getPackageBadge(landlord.packageCode)}
                        {hasPendingInGroup && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Có cơ sở chờ duyệt
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-mono">{landlord.phone || '09xx.xxx.xxx'}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          @{landlord.username}
                        </span>
                        {landlord.email && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-400">{landlord.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Facility Counts & Expand Toggle */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100/80">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{group.houses.length} Cơ sở</span>
                      </span>

                      <Link
                        to="/admin/landlords"
                        onClick={(e) => e.stopPropagation()}
                        className="btn-press px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 text-xs font-bold transition flex items-center gap-1"
                        title="Xem hồ sơ chi tiết và quản lý gói cước chủ trọ này"
                      >
                        <User className="w-3 h-3" />
                        <span className="hidden md:inline">Hồ sơ</span>
                      </Link>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center transition-transform duration-200">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${
                          isExpanded ? 'rotate-180 text-indigo-600' : 'text-slate-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Section: Boarding Houses List */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Danh Sách Cơ Sở Thuộc Sở Hữu ({houses.length})</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Admin thẩm định pháp lý & cấp phép hoạt động
                      </span>
                    </div>

                    {houses.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/60">
                        <p className="text-xs font-semibold text-slate-500">
                          Không có cơ sở nào phù hợp với bộ lọc hiện tại của Chủ trọ này.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50/90 text-slate-400 uppercase font-bold tracking-wider text-[11px] border-b border-slate-100">
                            <tr>
                              <th className="py-3 px-4">Mã & Tên Cơ Sở</th>
                              <th className="py-3 px-4">Địa Chỉ Chi Tiết</th>
                              <th className="py-3 px-4">Quy Mô Thiết Kế</th>
                              <th className="py-3 px-4">Trạng Thái Thẩm Định</th>
                              <th className="py-3 px-4 text-right">Thao Tác Thẩm Định</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {houses.map((h) => (
                              <tr key={h.code} className="hover:bg-slate-50/70 transition-colors">
                                {/* Code, Name & Thumbnail */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={
                                        h.imageUrl ||
                                        h.image ||
                                        h.thumbnail ||
                                        (h.code === 'CS-03'
                                          ? '/assets/images/house_dong_da.jpg'
                                          : '/assets/images/house_cau_giay.jpg')
                                      }
                                      alt={h.name}
                                      className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                                    />
                                    <div>
                                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                        {h.name}
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                                          {h.code}
                                        </span>
                                        {h.approvedAt && (
                                          <span className="text-slate-400 text-[10px]">
                                            Cấp phép: {h.approvedAt}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Address */}
                                <td className="py-3.5 px-4 max-w-xs text-slate-600">
                                  <div className="flex items-start gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                    <span className="line-clamp-2 leading-relaxed">{h.address}</span>
                                  </div>
                                </td>

                                {/* Scale */}
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-slate-800">
                                    {h.floors || 4} Tầng • {h.totalRooms || 10} Phòng dự kiến
                                  </div>
                                  <div className="text-slate-400 text-[10px] mt-0.5">
                                    {h.features && Array.isArray(h.features)
                                      ? h.features.slice(0, 2).join(', ')
                                      : 'Đầy đủ tiện ích tiêu chuẩn'}
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="py-3.5 px-4">
                                  {h.status === 'PENDING_APPROVAL' ? (
                                    <div className="space-y-1">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-300 font-bold text-xs animate-pulse">
                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Chờ Phê Duyệt</span>
                                      </span>
                                      <div className="text-[10px] text-amber-600 font-medium">
                                        Chưa cấp phép vận hành
                                      </div>
                                    </div>
                                  ) : h.status === 'LOCKED' ? (
                                    <div className="space-y-1">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs">
                                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Tạm Khóa Hoạt Động</span>
                                      </span>
                                      <div className="text-[10px] text-rose-600 font-medium">
                                        Chủ trọ tạm dừng đón khách (bảo trì)
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-xs">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Đã Phê Duyệt</span>
                                      </span>
                                      <div className="text-[10px] text-emerald-600 font-medium">
                                        Đang hoạt động tốt
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Action Buttons */}
                                <td className="py-3.5 px-4 text-right">
                                  {h.status === 'PENDING_APPROVAL' ? (
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        onClick={() => handleApproveHouse(h.code)}
                                        className="btn-press px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1"
                                        title="Phê duyệt cơ sở nhà trọ đưa vào hoạt động chính thức"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Duyệt Cơ Sở</span>
                                      </button>
                                      <button
                                        onClick={() => handleRejectHouse(h.code)}
                                        className="btn-press px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                                        title="Từ chối yêu cầu và gỡ bỏ cơ sở"
                                      >
                                        Từ Chối
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[11px] font-semibold border border-slate-200">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                        Đã Cấp Phép
                                      </span>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
