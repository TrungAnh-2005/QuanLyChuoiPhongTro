import React, { useState, useMemo } from 'react';
import {
  Zap,
  Clock,
  Droplets,
  Save,
  CheckCircle2,
  Pencil,
  Sparkles,
  Settings,
  DollarSign,
  X,
  AlertCircle,
  Building2,
  Search,
  ShieldCheck,
  User,
  Home,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Modal from '../../components/common/Modal';
import UpgradePromptModal from '../../components/common/UpgradePromptModal';
import BuySaasPackageModal from '../../components/staff/BuySaasPackageModal';
import PaymentModal from '../../components/payment/PaymentModal';
import MeterAiScannerModal from '../../components/staff/MeterAiScannerModal';
import TrialExpiryBanner from '../../components/common/TrialExpiryBanner';
import { getTrialStatus } from '../../utils/packagePermissions';

export default function StaffMetersPage() {
  const { user } = useAuth();
  const role = user?.role || 'STAFF';
  const isAdmin = role === 'ADMIN';

  const {
    billingMonth = '2026-09',
    switchBillingMonth,
    meters: readings = [],
    updateMeterReading,
    saveMeterReading,
    unlockMeterReading,
    utilityPrices = { elecPrice: 3500, waterPrice: 25000 },
    updateUtilityPrices,
    invoices = [],
    landlords = [],
    createSaasInvoice,
    paySaasInvoice,
    updateLandlordPackage
  } = useData();

  const [payingSaasInvoice, setPayingSaasInvoice] = useState(null);

  const currentLandlord = useMemo(() => {
    return (
      (landlords || []).find(
        (l) => l.username === user?.username || l.fullName === user?.fullName
      ) || (landlords && landlords.length > 0 ? landlords[0] : null)
    );
  }, [user, landlords]);

  const isZeroSandbox = typeof window !== 'undefined' && localStorage.getItem('rental_is_zero_sandbox') === 'true';
  const landlordPackage =
    isZeroSandbox && (!currentLandlord || currentLandlord.packageCode === 'NONE')
      ? 'NONE'
      : currentLandlord?.packageCode || 'BASIC';
  const isEnterprise = landlordPackage === 'ENTERPRISE';

  const [showAiScanner, setShowAiScanner] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBuyPackageModal, setShowBuyPackageModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [saveToast, setSaveToast] = useState(null);

  const [selectedHouse, setSelectedHouse] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [tempElecPrice, setTempElecPrice] = useState(String(utilityPrices.elecPrice || 3500));
  const [tempWaterPrice, setTempWaterPrice] = useState(String(utilityPrices.waterPrice || 25000));

  const handleUpdate = (id, field, value) => {
    updateMeterReading(id, field, value);
  };

  const handleSave = (id) => {
    const trial = getTrialStatus(currentLandlord);
    if (trial.isTrialExpired) {
      setSaveToast({
        type: 'ERROR',
        message: '⚠️ Hạn dùng thử 14 ngày đã kết thúc! Vui lòng kích hoạt gói bản quyền SaaS để tiếp tục chốt điện nước.'
      });
      setTimeout(() => setSaveToast(null), 4000);
      setShowUpgradeModal(true);
      return;
    }

    saveMeterReading(id);
    setSaveToast({
      type: 'SUCCESS',
      message: 'Đã lưu và chốt chỉ số công tơ thành công!'
    });
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleUnlock = (id) => {
    const target = readings.find((r) => r.id === id);
    const roomInv = invoices.find(
      (inv) =>
        inv.room === target?.room &&
        (!target?.houseCode || inv.house?.includes(target.houseCode) || inv.house === target?.house)
    );
    const isPaid = target?.paid || roomInv?.status === 'PAID';

    if (isPaid) {
      const confirmUnlock = window.confirm(
        `⚠️ Cảnh báo: Phòng ${target?.room} đã được xác nhận thu tiền cước kỳ này!\n\nBạn có chắc chắn muốn MỞ KHÓA để chỉnh sửa lại chỉ số điện nước không?\n(Sau khi chốt lại, số liệu hóa đơn phòng sẽ được tính toán lại theo số mới).`
      );
      if (!confirmUnlock) return;
    }

    unlockMeterReading(id);
    setSaveToast({
      type: 'INFO',
      message: `Đã mở khóa phòng ${target?.room}! Bạn có thể chỉnh sửa số hoặc chụp ảnh AI cho phòng này.`
    });
    setTimeout(() => setSaveToast(null), 3500);
  };

  const dynamicHouses = useMemo(() => {
    try {
      const saved = localStorage.getItem('rental_boarding_houses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      if (isZeroSandbox) return [];
      return [
        { code: 'CS-01', name: 'CS-01: Cầu Giấy' },
        { code: 'CS-02', name: 'CS-02: Bách Khoa' },
        { code: 'CS-03', name: 'CS-03: Đống Đa' }
      ];
    } catch {
      return isZeroSandbox ? [] : [
        { code: 'CS-01', name: 'CS-01: Cầu Giấy' },
        { code: 'CS-02', name: 'CS-02: Bách Khoa' },
        { code: 'CS-03', name: 'CS-03: Đống Đa' }
      ];
    }
  }, [isZeroSandbox]);

  const staffManageableHouses = useMemo(() => {
    if (user?.role !== 'STAFF') return dynamicHouses;
    const u = (user?.username || '').toLowerCase();
    return dynamicHouses.filter((h) => {
      const created = (h.createdBy || '').toLowerCase();
      const manager = (h.managerUsername || '').toLowerCase();
      if (created && created === u) return true;
      if (manager && manager === u) return true;
      if (user?.houseCode && h.code === user.houseCode) return true;
      if (!isZeroSandbox) {
        if (u === 'staff' && (h.code === 'CS-01' || !h.createdBy)) return true;
        if (u === 'staff2' && h.code === 'CS-02') return true;
      }
      return false;
    });
  }, [dynamicHouses, user, isZeroSandbox]);

  const staffHouseCodes = useMemo(() => {
    return staffManageableHouses.map((h) => h.code);
  }, [staffManageableHouses]);

  const scopedReadings = useMemo(() => {
    if (user?.role === 'STAFF') {
      return readings.filter((r) => staffHouseCodes.includes(r.houseCode));
    }
    return readings;
  }, [readings, user?.role, staffHouseCodes]);

  const isRoomClosedOrPaid = (r) => {
    if (r.recorded || r.paid) return true;
    const roomInv = invoices.find(
      (inv) => inv.room === r.room && (!r.houseCode || inv.house?.includes(r.houseCode) || inv.house === r.house)
    );
    return roomInv?.status === 'PAID';
  };

  const filteredReadings = useMemo(() => {
    return scopedReadings.filter((r) => {
      if (selectedHouse !== 'ALL' && r.houseCode !== selectedHouse) return false;
      if (statusFilter === 'OCCUPIED' && r.status !== 'OCCUPIED') return false;
      if (statusFilter === 'AVAILABLE' && r.status === 'OCCUPIED') return false;
      if (statusFilter === 'RECORDED' && !isRoomClosedOrPaid(r)) return false;
      if (statusFilter === 'UNRECORDED' && isRoomClosedOrPaid(r)) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchRoom = (r.room || '').toLowerCase().includes(query);
        const matchTenant = (r.tenant || '').toLowerCase().includes(query);
        const matchHouse = (r.house || '').toLowerCase().includes(query);
        if (!matchRoom && !matchTenant && !matchHouse) return false;
      }
      return true;
    });
  }, [scopedReadings, selectedHouse, statusFilter, searchTerm, invoices]);

  const roomsForAi = useMemo(() => {
    const unrecorded = scopedReadings.filter((r) => !isRoomClosedOrPaid(r));
    const roomsList = unrecorded.map((r) => r.room);
    return Array.from(new Set(roomsList));
  }, [scopedReadings, invoices]);

  const currentMetersData = useMemo(() => {
    return scopedReadings.reduce((acc, r) => {
      acc[r.room] = {
        elecOld: r.oldElec,
        waterOld: r.oldWater,
        closed: isRoomClosedOrPaid(r),
        status: r.status,
        house: r.house
      };
      return acc;
    }, {});
  }, [scopedReadings, invoices]);

  const recordedCount = useMemo(() => {
    return scopedReadings.filter((r) => isRoomClosedOrPaid(r)).length;
  }, [scopedReadings, invoices]);
  const totalRoomsCount = scopedReadings.length;
  const unrecordedCount = Math.max(0, totalRoomsCount - recordedCount);

  const handleSaveFromAi = (readingData) => {
    let target = null;
    if (readingData.roomId) {
      target = scopedReadings.find((r) => r.id === readingData.roomId);
    }
    if (!target && readingData.houseCode) {
      target = scopedReadings.find((r) => r.room === readingData.room && r.houseCode === readingData.houseCode);
    }
    if (!target) {
      target =
        scopedReadings.find(
          (r) => r.room === readingData.room && (!selectedHouse || selectedHouse === 'ALL' || r.houseCode === selectedHouse)
        ) || scopedReadings.find((r) => r.room === readingData.room);
    }

    if (target) {
      const updatedParts = [];
      if (readingData.newElec !== undefined && readingData.newElec !== null) {
        updateMeterReading(target.id, 'newElec', Number(readingData.newElec));
        updatedParts.push(`Điện: ${readingData.newElec} kWh`);
      }
      if (readingData.newWater !== undefined && readingData.newWater !== null) {
        updateMeterReading(target.id, 'newWater', Number(readingData.newWater));
        updatedParts.push(`Nước: ${readingData.newWater} m³`);
      }

      setSaveToast({
        type: 'SUCCESS',
        message: `Đã cập nhật chỉ số phòng ${target.room} từ AI OCR: ${updatedParts.join(' • ')}!`
      });
      setTimeout(() => setSaveToast(null), 4500);
    }
  };

  const handleSavePrices = (e) => {
    e.preventDefault();
    const numElec = Number(tempElecPrice);
    const numWater = Number(tempWaterPrice);
    if (!numElec || numElec <= 0 || !numWater || numWater <= 0) {
      setSaveToast({ type: 'ERROR', message: 'Đơn giá điện và nước phải lớn hơn 0!' });
      setTimeout(() => setSaveToast(null), 4000);
      return;
    }

    if (updateUtilityPrices) {
      updateUtilityPrices({ elecPrice: numElec, waterPrice: numWater });
    }

    setShowPriceModal(false);
    setSaveToast({
      type: 'SUCCESS',
      message: `Đã cập nhật đơn giá mới: Điện ${numElec.toLocaleString('vi-VN')} đ/kWh • Nước ${numWater.toLocaleString('vi-VN')} đ/m³!`
    });
    setTimeout(() => setSaveToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Banner Hạn Dùng Thử */}
      <TrialExpiryBanner
        currentLandlord={currentLandlord}
        onUpgradeClick={() => {
          setShowUpgradeModal(false);
          setShowBuyPackageModal(true);
        }}
      />

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>{user?.role === 'STAFF' ? 'Ghi Chỉ Số Điện & Nước Cơ Sở Của Tôi' : 'Ghi Chỉ Số Điện & Nước Toàn Chuỗi'}</span>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                  {billingMonth === '2026-09' ? 'Tháng 09/2026' : billingMonth === '2026-10' ? 'Tháng 10/2026' : 'Tháng 08/2026'}
                </span>
              </h1>
              <p className="text-slate-500 text-xs font-semibold mt-1 flex flex-wrap items-center gap-1.5">
                <span>Đơn giá niêm yết:</span>{' '}
                <strong className="text-amber-700 font-mono bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded">
                  Điện {(utilityPrices.elecPrice || 3500).toLocaleString('vi-VN')} đ/kWh
                </strong>
                ,{' '}
                <strong className="text-blue-700 font-mono bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded">
                  Nước {(utilityPrices.waterPrice || 25000).toLocaleString('vi-VN')} đ/m³
                </strong>
                <span className="hidden sm:inline">•</span>
                <span className="text-slate-400">
                  Đã chốt: <strong className="text-emerald-600">{recordedCount}/{totalRoomsCount} phòng</strong>
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0 sm:ml-auto">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs font-bold shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-amber-900 hidden sm:inline">Kỳ cước:</span>
              <select
                value={billingMonth}
                onChange={(e) => {
                  if (switchBillingMonth) {
                    switchBillingMonth(e.target.value);
                  }
                  setSaveToast({
                    type: 'INFO',
                    message: `Đã chuyển sang ${e.target.value === '2026-10' ? 'Kỳ cước Tháng 10/2026' : e.target.value === '2026-09' ? 'Kỳ cước Tháng 09/2026' : 'Kỳ cước Tháng 08/2026'}!`
                  });
                  setTimeout(() => setSaveToast(null), 3500);
                }}
                className="bg-transparent font-black text-amber-800 focus:outline-none cursor-pointer text-xs"
              >
                <option value="2026-09">Tháng 09/2026 (Hiện tại)</option>
                <option value="2026-10">Tháng 10/2026 (Kỳ tới)</option>
                <option value="2026-08">Tháng 08/2026 (Kỳ trước)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setTempElecPrice(String(utilityPrices.elecPrice || 3500));
                setTempWaterPrice(String(utilityPrices.waterPrice || 25000));
                setShowPriceModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200 shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span>Sửa Đơn Giá</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!isEnterprise) {
                setShowUpgradeModal(true);
              } else {
                setShowAiScanner(true);
              }
            }}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-white text-xs font-black rounded-xl shadow-md transition-all btn-press cursor-pointer ${
              isEnterprise
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-amber-500/25'
                : 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:to-black shadow-slate-900/30 border border-amber-400/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>⚡ Quét Công Tơ Bằng AI (OCR)</span>
            {!isEnterprise ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 flex items-center gap-1 shadow-xs">
                <span>👑</span>
                <span>GÓI ENTERPRISE</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/25 text-white">
                {unrecordedCount} phòng chờ
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Toast thông báo */}
      {saveToast && (
        <div
          className={`p-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-xs transition-all ${
            saveToast.type === 'SUCCESS'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-blue-50 border border-blue-200 text-blue-900'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveToast.message}</span>
        </div>
      )}

      {/* Thẻ Thống Kê & Thanh Lọc Cơ Sở */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 space-y-3.5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mr-1">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Cơ sở:</span>
            </span>
            {[
              {
                code: 'ALL',
                name: user?.role === 'STAFF' ? 'Toàn Bộ Cơ Sở Của Tôi' : 'Tất Cả Các Cơ Sở',
                count: scopedReadings.length
              },
              ...staffManageableHouses.map((h) => ({
                code: h.code,
                name: h.name.includes(':') ? h.name : `${h.code}: ${h.name.replace(/^Nhà Trọ\s*/i, '')}`,
                count: scopedReadings.filter((r) => r.houseCode === h.code).length
              }))
            ].map((house) => (
              <button
                key={house.code}
                type="button"
                onClick={() => setSelectedHouse(house.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedHouse === house.code
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{house.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedHouse === house.code ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {house.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo số phòng, tên khách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-semibold mr-1">Bộ lọc phòng:</span>
            {[
              { id: 'ALL', label: 'Toàn bộ phòng' },
              { id: 'OCCUPIED', label: 'Đang thuê' },
              { id: 'AVAILABLE', label: 'Phòng trống' },
              { id: 'UNRECORDED', label: `Chưa chốt (${unrecordedCount})` },
              { id: 'RECORDED', label: `Đã chốt (${recordedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Đã chốt: <strong className="text-slate-800">{recordedCount}</strong> phòng</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Chờ ghi số: <strong className="text-slate-800">{unrecordedCount}</strong> phòng</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs card-interactive">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/90 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Phòng / Khách Thuê</th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Điện Cũ (kWh)</span>
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Điện Mới (kWh)</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Tiêu thụ Điện</th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                    <Droplets className="w-3.5 h-3.5" />
                    <span>Nước Cũ (m³)</span>
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                    <Droplets className="w-3.5 h-3.5" />
                    <span>Nước Mới (m³)</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Tiêu thụ Nước</th>
                <th className="py-3.5 px-4 text-right">Tổng Tiền Điện+Nước</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái & Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReadings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Không tìm thấy phòng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredReadings.map((r) => {
                  const elecPrice = utilityPrices.elecPrice || r.elecPrice || 3500;
                  const waterPrice = utilityPrices.waterPrice || r.waterPrice || 25000;
                  const elecUsed = Math.max(0, r.newElec - r.oldElec);
                  const waterUsed = Math.max(0, r.newWater - r.oldWater);
                  const totalCost = elecUsed * elecPrice + waterUsed * waterPrice;

                  const roomInvoice = invoices.find(
                    (inv) => inv.room === r.room && (!r.houseCode || inv.house?.includes(r.houseCode) || inv.house === r.house)
                  );
                  const isPaidRoom = r.paid || roomInvoice?.status === 'PAID';
                  const isAvailableRoom = r.status === 'AVAILABLE' || r.status === 'MAINTENANCE';

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-purple-50/40 transition-all ${r.recorded ? 'bg-slate-50/40' : 'bg-white'}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{r.room}</span>
                          {r.houseCode && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              {r.houseCode}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] mt-0.5 flex items-center gap-1">
                          {isAvailableRoom ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                              <Home className="w-3 h-3 text-blue-500" />
                              <span>{r.status === 'MAINTENANCE' ? 'Bảo trì' : 'Phòng trống'}</span>
                            </span>
                          ) : (
                            <span className="text-slate-600 font-semibold flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{r.tenant || 'Khách Đang Thuê'}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold">
                        {r.oldElec}
                      </td>

                      <td className="py-3.5 px-4">
                        <input
                          type="number"
                          disabled={r.recorded || isPaidRoom}
                          value={r.newElec}
                          onChange={(e) => handleUpdate(r.id, 'newElec', e.target.value)}
                          className={`w-20 rounded-lg px-2.5 py-1 font-mono font-bold text-amber-700 focus:outline-none transition-all ${
                            isPaidRoom
                              ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed font-medium'
                              : r.recorded
                              ? 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-white border-2 border-amber-300 focus:border-amber-500 shadow-2xs'
                          }`}
                        />
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold font-mono text-amber-600">
                        {elecUsed} kWh
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold">
                        {r.oldWater}
                      </td>

                      <td className="py-3.5 px-4">
                        <input
                          type="number"
                          disabled={r.recorded || isPaidRoom}
                          value={r.newWater}
                          onChange={(e) => handleUpdate(r.id, 'newWater', e.target.value)}
                          className={`w-20 rounded-lg px-2.5 py-1 font-mono font-bold text-blue-700 focus:outline-none transition-all ${
                            isPaidRoom
                              ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed font-medium'
                              : r.recorded
                              ? 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-white border-2 border-blue-300 focus:border-blue-500 shadow-2xs'
                          }`}
                        />
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold font-mono text-blue-600">
                        {waterUsed} m³
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isRoomClosedOrPaid(r) ? (
                          <span className="font-black text-slate-900 text-sm">
                            {totalCost.toLocaleString('vi-VN')} đ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>Chờ chốt số</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {isPaidRoom ? (
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5 shadow-2xs"
                                title="Phòng này đã thanh toán xong tiền trọ - Khóa sổ vĩnh viễn"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Đã Thu Tiền</span>
                              </span>
                            </div>
                          ) : r.recorded ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Đã chốt</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUnlock(r.id)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-all btn-press inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Pencil className="w-3 h-3 text-amber-600" />
                                <span>Sửa số</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSave(r.id)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm flex items-center justify-center gap-1.5 mx-auto transition-all btn-press cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Lưu & Chốt Số</span>
                            </button>
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

      {/* Modal Sửa Đơn Giá */}
      <Modal isOpen={showPriceModal} onClose={() => setShowPriceModal(false)} maxWidth="max-w-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Điều Chỉnh Đơn Giá Điện & Nước</h2>
              <p className="text-xs text-slate-500">Áp dụng tính cước cho toàn bộ phòng</p>
            </div>
          </div>
          <button onClick={() => setShowPriceModal(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSavePrices} className="space-y-4 pt-4 text-xs">
          <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2">
            <label className="block font-bold text-amber-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Đơn Giá Điện (đ/kWh) *</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                required
                value={tempElecPrice}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setTempElecPrice(raw.replace(/^0+(?=\d)/, ''));
                }}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-amber-800 text-sm focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">đ / kWh</span>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-2">
            <label className="block font-bold text-blue-900 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-600" />
              <span>Đơn Giá Nước Sinh Hoạt (đ/m³) *</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                required
                value={tempWaterPrice}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setTempWaterPrice(raw.replace(/^0+(?=\d)/, ''));
                }}
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl font-mono font-bold text-blue-800 text-sm focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">đ / m³</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowPriceModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
            >
              Lưu Đơn Giá Mới
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Quét AI */}
      <MeterAiScannerModal
        isOpen={showAiScanner}
        onClose={() => setShowAiScanner(false)}
        onSaveReading={handleSaveFromAi}
        allRooms={scopedReadings}
        rooms={roomsForAi}
        currentMetersData={currentMetersData}
        utilityPrices={utilityPrices}
      />

      {/* Modal Nâng Cấp Gói */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="AI Vision OCR Quét Đồng Hồ Điện Nước"
        featureDescription="Hệ thống AI Vision tự động trích xuất chỉ số công tơ điện nước qua camera. Tính năng này chỉ có trên Gói Doanh Nghiệp (ENTERPRISE)."
        currentPackageCode={landlordPackage}
        requiredPackageCode="ENTERPRISE"
        onUpgradeClick={() => {
          setShowUpgradeModal(false);
          setShowBuyPackageModal(true);
        }}
      />

      {/* Modal Mua Gói */}
      <BuySaasPackageModal
        isOpen={showBuyPackageModal}
        onClose={() => setShowBuyPackageModal(false)}
        currentLandlord={currentLandlord}
        initialPackageCode="ENTERPRISE"
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

      {/* Modal Thanh Toán Gói SaaS */}
      <PaymentModal
        isOpen={!!payingSaasInvoice}
        onClose={() => setPayingSaasInvoice(null)}
        onSuccess={(inv, payMethod) => {
          const methodLabel = payMethod === 'VNPAY' ? 'Cổng VNPay' : payMethod === 'MOMO' ? 'Ví MoMo' : 'VietQR / SePay';
          if (paySaasInvoice) {
            paySaasInvoice(inv.id, methodLabel);
          }
          const targetLandlordId = currentLandlord?.id || (user?.username === 'staff2' ? 2 : 1);
          if (updateLandlordPackage) {
            updateLandlordPackage(targetLandlordId, inv.packageCode || 'ENTERPRISE');
          }
          setPayingSaasInvoice(null);
          setSaveToast({
            type: 'SUCCESS',
            message: `🎉 Nộp cước SaaS qua ${methodLabel} thành công! Đã kích hoạt toàn bộ tính năng AI Vision OCR.`
          });
          setTimeout(() => setSaveToast(null), 4000);
        }}
        invoice={payingSaasInvoice || undefined}
      />
    </div>
  );
}
