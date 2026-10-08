import { Link } from 'react-router-dom';
import React, { useState, useMemo } from 'react';
import {
  Zap,
  Clock,
  Droplets,
  Calculator,
  Save,
  CheckCircle2,
  History,
  Pencil,
  Sparkles,
  Camera,
  Settings,
  DollarSign,
  X,
  AlertCircle,
  Building2,
  Filter,
  Search,
  Check,
  ShieldCheck,
  CreditCard,
  User,
  Home,
  Calendar,
  AlertTriangle,
  Send,
  Eye,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import Modal from '../components/common/Modal';
import MeterAiScannerModal from './admin/meters/MeterAiScannerModal';
import MeterDisputeModal from '../components/tenant/MeterDisputeModal';

export default function MetersPage() {
  const { user, tenantRooms } = useAuth();
  const role = user?.role || 'ADMIN';
  const isTenant = role === 'TENANT';
  const isAdmin = role === 'ADMIN';

  const {
    billingMonth = '2026-09',
    switchBillingMonth,
    meters: readings = [],
    metersHistory = {},
    roomMembers = [],
    updateMeterReading,
    saveMeterReading,
    unlockMeterReading,
    utilityPrices = { elecPrice: 3500, waterPrice: 25000 },
    updateUtilityPrices,
    invoices = [],
    tenants = [],
    meterDisputes = [],
    submitMeterDispute
  } = useData();

  const [showAiScanner, setShowAiScanner] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedDisputeRoom, setSelectedDisputeRoom] = useState(null);
  const [saveToast, setSaveToast] = useState(null);
  const [tenantSelectedMonth, setTenantSelectedMonth] = useState('ALL');

  // Bộ lọc cơ sở & trạng thái
  const [selectedHouse, setSelectedHouse] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'OCCUPIED' | 'AVAILABLE' | 'RECORDED' | 'UNRECORDED'
  const [searchTerm, setSearchTerm] = useState('');

  // State cho modal chỉnh sửa đơn giá (dùng string để người dùng gõ xóa số 0 ở đầu mượt mà)
  const [tempElecPrice, setTempElecPrice] = useState(String(utilityPrices.elecPrice || 3500));
  const [tempWaterPrice, setTempWaterPrice] = useState(String(utilityPrices.waterPrice || 25000));

  const handleUpdate = (id, field, value) => {
    updateMeterReading(id, field, value);
  };

  const handleSave = (id) => {
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

  const handleSaveFromAi = (readingData) => {
    // Ưu tiên khớp theo roomId để tránh xung đột trùng tên phòng giữa các cơ sở
    let target = null;
    if (readingData.roomId) {
      target = readings.find((r) => r.id === readingData.roomId);
    }
    if (!target && readingData.houseCode) {
      target = readings.find((r) => r.room === readingData.room && r.houseCode === readingData.houseCode);
    }
    if (!target) {
      target = readings.find((r) => r.room === readingData.room && (!selectedHouse || selectedHouse === 'ALL' || r.houseCode === selectedHouse))
            || readings.find((r) => r.room === readingData.room);
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
      if (readingData.meterType === 'ELECTRICITY' && readingData.newReading !== undefined && readingData.newElec === undefined) {
        updateMeterReading(target.id, 'newElec', Number(readingData.newReading));
        updatedParts.push(`Điện: ${readingData.newReading} kWh`);
      } else if (readingData.meterType === 'WATER' && readingData.newReading !== undefined && readingData.newWater === undefined) {
        updateMeterReading(target.id, 'newWater', Number(readingData.newReading));
        updatedParts.push(`Nước: ${readingData.newReading} m³`);
      }

      setSaveToast({
        type: 'SUCCESS',
        message: `Đã cập nhật chỉ số phòng ${target.room} (${target.houseCode || 'Toàn chuỗi'}) từ AI OCR: ${updatedParts.join(' • ')}!`
      });
      setTimeout(() => setSaveToast(null), 4500);
    }
  };

  const handleSavePrices = (e) => {
    e.preventDefault();
    const numElec = Number(tempElecPrice);
    const numWater = Number(tempWaterPrice);
    if (!numElec || numElec <= 0 || !numWater || numWater <= 0) {
      setSaveToast({ type: 'ERROR', message: 'Đơn giá điện và nước phải lớn hơn 0!' }); setTimeout(() => setSaveToast(null), 4000);
      return;
    }

    if (updateUtilityPrices) {
      updateUtilityPrices({
        elecPrice: numElec,
        waterPrice: numWater
      });
    }

    setShowPriceModal(false);
    setSaveToast({
      type: 'SUCCESS',
      message: `Đã cập nhật đơn giá mới: Điện ${numElec.toLocaleString('vi-VN')} đ/kWh • Nước ${numWater.toLocaleString('vi-VN')} đ/m³ áp dụng toàn hệ thống!`
    });
    setTimeout(() => setSaveToast(null), 5000);
  };

  // QUY TẮC BẮT BUỘC THEO YÊU CẦU:
  // "Những phòng đã thanh toán khoá chốt điện nước phải được tính vào phòng đã chốt chứ không phải đang chờ chốt."
  const isRoomClosedOrPaid = (r) => {
    if (r.recorded || r.paid) return true;
    const roomInv = invoices.find(
      (inv) => inv.room === r.room && (!r.houseCode || inv.house?.includes(r.houseCode) || inv.house === r.house)
    );
    return roomInv?.status === 'PAID';
  };

  // Danh sách hiển thị theo bộ lọc
  const filteredReadings = useMemo(() => {
    return readings.filter((r) => {
      // Scoping theo Staff: Mỗi Staff chỉ chốt số cho cơ sở mình phụ trách
      if (user?.role === 'STAFF') {
        const staffHouse = user?.houseCode || 'CS-01';
        if (r.houseCode !== staffHouse) {
          return false;
        }
      }
      // Lọc theo cơ sở
      if (selectedHouse !== 'ALL' && r.houseCode !== selectedHouse) {
        return false;
      }
      // Lọc theo trạng thái
      if (statusFilter === 'OCCUPIED' && r.status !== 'OCCUPIED') return false;
      if (statusFilter === 'AVAILABLE' && r.status === 'OCCUPIED') return false;
      if (statusFilter === 'RECORDED' && !isRoomClosedOrPaid(r)) return false;
      if (statusFilter === 'UNRECORDED' && isRoomClosedOrPaid(r)) return false;

      // Lọc theo từ khóa tìm kiếm
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchRoom = (r.room || '').toLowerCase().includes(query);
        const matchTenant = (r.tenant || '').toLowerCase().includes(query);
        const matchHouse = (r.house || '').toLowerCase().includes(query);
        if (!matchRoom && !matchTenant && !matchHouse) return false;
      }

      return true;
    });
  }, [readings, selectedHouse, statusFilter, searchTerm, invoices]);

  // QUY TẮC QUAN TRỌNG:
  // Phòng đã thu tiền / đã chốt không được sửa số và không đưa vào danh sách quét AI
  const roomsForAi = useMemo(() => {
    const unrecorded = readings.filter((r) => !isRoomClosedOrPaid(r));
    const roomsList = unrecorded.map((r) => r.room);
    return Array.from(new Set(roomsList));
  }, [readings, invoices]);

  // Chuẩn bị dữ liệu chỉ số cũ và trạng thái chốt cho modal
  const currentMetersData = useMemo(() => {
    return readings.reduce((acc, r) => {
      acc[r.room] = {
        elecOld: r.oldElec,
        waterOld: r.oldWater,
        closed: isRoomClosedOrPaid(r),
        status: r.status,
        house: r.house
      };
      return acc;
    }, {});
  }, [readings, invoices]);

  // Thống kê nhanh: Phòng đã thanh toán / khóa chốt được tính vào phòng đã chốt!
  // Lấy hồ sơ khách thuê hiện tại từ danh bạ tenants
  const recordedCount = useMemo(() => {
    return readings.filter((r) => isRoomClosedOrPaid(r)).length;
  }, [readings, invoices]);
  const totalRoomsCount = readings.length || 36;
  const unrecordedCount = Math.max(0, totalRoomsCount - recordedCount);

  const currentTenant = useMemo(() => {
    if (!user) return null;
    const userName = (user.fullName || '').toLowerCase();
    return (tenants || []).find((t) => {
      const tName = (t?.fullName || '').toLowerCase();
      return (
        (userName && tName && (userName.includes(tName) || tName.includes(userName))) ||
        (user?.phone && t?.phone && user.phone.replace(/\D/g, '') === t.phone.replace(/\D/g, ''))
      );
    });
  }, [user, tenants]);

  // Danh sách phòng khách đang thuê
  const myRentedRooms = useMemo(() => {
    if (!isTenant) return [];
    const roomsSet = new Set();
    const stored = tenantRooms?.[user?.username] || tenantRooms?.[user?.fullName];
    if (Array.isArray(stored)) {
      stored.forEach((r) => r && roomsSet.add(r));
    } else if (typeof stored === 'string' && stored) {
      roomsSet.add(stored);
    }
    if (roomsSet.size > 0) return Array.from(roomsSet);

    if (user?.username === 'tenant_new' || user?.fullName?.includes('Nam')) {
      return [];
    }

    if (currentTenant?.rooms && Array.isArray(currentTenant.rooms)) {
      currentTenant.rooms.forEach((r) => r && roomsSet.add(r));
    } else if (currentTenant?.room) {
      roomsSet.add(currentTenant.room);
    }
    if (user?.rooms && Array.isArray(user.rooms)) {
      user.rooms.forEach((r) => r && roomsSet.add(r));
    } else if (user?.room) {
      roomsSet.add(user.room);
    }
    return Array.from(roomsSet);
  }, [isTenant, currentTenant, user, tenantRooms]);

  // Lấy thông tin phòng của khách thuê đang ở (Chỉ 1 phòng duy nhất theo quy định)
  const myRoomNumber = useMemo(() => {
    if (!isTenant) return 'P.101';
    if (myRentedRooms.length > 0) return myRentedRooms[0];
    const stored = tenantRooms?.[user?.username] || tenantRooms?.[user?.fullName];
    const dynamicRoom = (Array.isArray(stored) && stored.length > 0) ? stored[0] : (typeof stored === 'string' && stored ? stored : null);
    if (dynamicRoom) return dynamicRoom;
    if (user?.username === 'tenant_new' || user?.fullName?.includes('Nam')) {
      return null;
    }
    return user?.room || currentTenant?.room || (user?.rooms && user.rooms[0]) || 'P.101';
  }, [isTenant, myRentedRooms, tenantRooms, user, currentTenant]);

  // Thông tin ngày vào ở từ hồ sơ phòng hoặc thành viên
  const myMemberInfo = useMemo(() => {
    if (!myRoomNumber) return null;
    return (roomMembers || []).find(
      (m) =>
        m.roomNumber === myRoomNumber &&
        ((user?.fullName && m.fullName && m.fullName.toLowerCase().includes(user.fullName.toLowerCase())) ||
          (user?.phone && m.phone && user.phone.replace(/\D/g, '') === m.phone.replace(/\D/g, '')))
    );
  }, [roomMembers, myRoomNumber, user]);

  const joinDateStr = myMemberInfo?.joinDate || currentTenant?.joinDate || '01/01/2026';

  // Tính toán lịch sử chỉ số điện nước từng tháng từ khi vào ở đến nay
  const tenantMonthlyHistory = useMemo(() => {
    if (!isTenant || !myRoomNumber) return [];

    // Tìm thông tin phòng hiện tại trong readings
    const currentReading = readings.find((r) => r.room === myRoomNumber) || {
      id: `current-${myRoomNumber}`,
      room: myRoomNumber,
      house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
      houseCode: 'CS-01',
      oldElec: 1450,
      newElec: 1525,
      oldWater: 85,
      newWater: 92,
      recorded: true,
      paid: false
    };

    // Phân tích ngày vào ở để xác định tháng bắt đầu
    let startYear = 2026;
    let startMonthNum = 1;
    if (joinDateStr && joinDateStr.includes('/')) {
      const parts = joinDateStr.split('/');
      if (parts.length >= 3) {
        startMonthNum = parseInt(parts[1], 10) || 1;
        startYear = parseInt(parts[2], 10) || 2026;
      }
    }

    // Tháng hiện tại (kỳ chốt hiện tại: 2026-09)
    const currentYear = 2026;
    const currentMonthNum = parseInt((billingMonth || '2026-09').split('-')[1], 10) || 9;

    // Sinh danh sách các tháng từ tháng hiện tại lùi về tháng vào ở
    const monthsList = [];
    for (let m = currentMonthNum; m >= startMonthNum; m--) {
      const monthKey = `${currentYear}-${String(m).padStart(2, '0')}`;
      monthsList.push({
        monthKey,
        monthNum: m,
        year: currentYear,
        label: `Tháng ${String(m).padStart(2, '0')}/${currentYear}`,
        isCurrent: m === currentMonthNum
      });
    }

    // Số điện và nước cơ sở để tính lùi liên tục
    let runningElec = currentReading.oldElec || 1450;
    let runningWater = currentReading.oldWater || 85;

    // Seed tính toán theo số phòng để số liệu ổn định
    const roomNumDigits = parseInt((myRoomNumber || '101').replace(/\D/g, '') || '101', 10);

    return monthsList.map((mObj) => {
      const isCurrentMonth = mObj.isCurrent;

      // Nếu là tháng hiện tại, lấy số liệu live
      if (isCurrentMonth) {
        const elecUsed = Math.max(0, (currentReading.newElec || 0) - (currentReading.oldElec || 0));
        const waterUsed = Math.max(0, (currentReading.newWater || 0) - (currentReading.oldWater || 0));
        const elecCost = elecUsed * (utilityPrices.elecPrice || 3500);
        const waterCost = waterUsed * (utilityPrices.waterPrice || 25000);
        const totalUtilityCost = elecCost + waterCost;

        // Trạng thái thanh toán của phòng trong hóa đơn kỳ này
        const roomInv = invoices.find(
          (inv) =>
            inv.room === myRoomNumber &&
            (!currentReading.houseCode || inv.house?.includes(currentReading.houseCode) || inv.house === currentReading.house)
        );
        const isPaid = currentReading.paid || roomInv?.status === 'PAID';

        return {
          id: `meter-${mObj.monthKey}-${myRoomNumber}`,
          monthKey: mObj.monthKey,
          label: mObj.label,
          isCurrent: true,
          room: myRoomNumber,
          house: currentReading.house || 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
          houseCode: currentReading.houseCode || 'CS-01',
          oldElec: currentReading.oldElec || 1450,
          newElec: currentReading.newElec || 1525,
          elecUsed,
          elecCost,
          oldWater: currentReading.oldWater || 85,
          newWater: currentReading.newWater || 92,
          waterUsed,
          waterCost,
          totalUtilityCost,
          recorded: currentReading.recorded,
          paid: isPaid,
          statusText: isPaid ? 'Đã thanh toán' : currentReading.recorded ? 'Chờ thanh toán' : 'Chờ BQL chốt số'
        };
      }

      // Kiểm tra xem trong metersHistory có lưu số liệu tháng này không
      const historyMonthList = metersHistory?.[mObj.monthKey];
      const historyItem = historyMonthList?.find((r) => r.room === myRoomNumber);

      let oldE, newE, oldW, newW;

      if (historyItem) {
        oldE = historyItem.oldElec;
        newE = historyItem.newElec;
        oldW = historyItem.oldWater;
        newW = historyItem.newWater;
      } else {
        // Tính lùi có tính liên tục (new của tháng trước = old của tháng sau)
        const elecUsedPast = 70 + ((roomNumDigits + mObj.monthNum * 7) % 18);
        const waterUsedPast = 5 + ((roomNumDigits + mObj.monthNum * 3) % 4);

        newE = runningElec;
        oldE = Math.max(0, runningElec - elecUsedPast);
        runningElec = oldE; // cập nhật cho tháng kế tiếp lùi lại

        newW = runningWater;
        oldW = Math.max(0, runningWater - waterUsedPast);
        runningWater = oldW;
      }

      const elecUsed = Math.max(0, newE - oldE);
      const waterUsed = Math.max(0, newW - oldW);
      const elecCost = elecUsed * (utilityPrices.elecPrice || 3500);
      const waterCost = waterUsed * (utilityPrices.waterPrice || 25000);
      const totalUtilityCost = elecCost + waterCost;

      return {
        id: `meter-${mObj.monthKey}-${myRoomNumber}`,
        monthKey: mObj.monthKey,
        label: mObj.label,
        isCurrent: false,
        room: myRoomNumber,
        house: currentReading.house || 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
        houseCode: currentReading.houseCode || 'CS-01',
        oldElec: oldE,
        newElec: newE,
        elecUsed,
        elecCost,
        oldWater: oldW,
        newWater: newW,
        waterUsed,
        waterCost,
        totalUtilityCost,
        recorded: true,
        paid: true,
        statusText: 'Đã hoàn tất thanh toán'
      };
    });
  }, [isTenant, myRoomNumber, joinDateStr, billingMonth, readings, invoices, metersHistory, utilityPrices]);

  const displayedMonthlyHistory = useMemo(() => {
    if (tenantSelectedMonth === 'ALL') return tenantMonthlyHistory;
    return tenantMonthlyHistory.filter((item) => item.monthKey === tenantSelectedMonth);
  }, [tenantMonthlyHistory, tenantSelectedMonth]);

  // =========================================================================
  // GIAO DIỆN TRA CỨU ĐIỆN NƯỚC DÀNH CHO KHÁCH THUÊ (RESIDENT PORTAL - UC-T02)
  // Chỉ hiển thị chỉ số điện nước của phòng mình đang ở từng tháng từ khi vào ở
  // =========================================================================
  if (isTenant && !myRoomNumber) {
    return (
      <div className="space-y-6">
        <div className="hero-gradient-shine bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white p-6 rounded-2xl shadow-xl shadow-orange-600/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Đối Soát Điện Nước • Cổng Cư Dân</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Tra Cứu Chỉ Số Điện Nước</h1>
            <p className="text-orange-100 text-sm mt-1 max-w-2xl">
              Bạn hiện chưa có hợp đồng thuê phòng hoặc ở ghép nào được kích hoạt trong hệ thống.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center max-w-lg mx-auto shadow-xs space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-inner">
            ⚡
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 text-lg">Chưa Có Dữ Liệu Công Tơ Điện Nước</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Sau khi bạn được Chủ trọ phê duyệt đăng ký thuê phòng hoặc vào ở ghép, chỉ số điện nước từng tháng và tính năng gửi phản ánh sai lệch sẽ tự động mở tại đây.
            </p>
          </div>
          <Link
            to="/rooms"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <span>🔍 Xem Danh Sách Phòng & Đăng Ký Thuê</span>
          </Link>
        </div>
      </div>
    );
  }

  if (isTenant) {
    const latestRecord = tenantMonthlyHistory[0] || {};
    const houseName = latestRecord.house || 'Nhà Trọ Cầu Giấy - Cơ Sở 1';

    return (
      <div className="space-y-6">
        {/* Banner Khách Thuê */}
        <div className="hero-gradient-shine bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white p-6 rounded-2xl shadow-xl shadow-orange-600/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Đối Soát Điện Nước Phòng Mình • UC-T02</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Chỉ Số Điện & Nước Phòng {myRoomNumber}
            </h1>
            <p className="text-orange-100 text-sm mt-1 max-w-2xl">
              Lịch sử chỉ số công tơ điện nước từng tháng từ khi bạn vào ở ({joinDateStr}) đến nay. Bạn có thể đối soát số cũ, số mới và gửi phản ánh trực tiếp đến BQL nếu có nghi vấn sai lệch.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3.5 text-xs text-right space-y-1">
            <span className="text-orange-200 block text-[11px] font-semibold">Đơn giá niêm yết:</span>
            <div className="font-bold">
              Điện: <span className="font-mono text-amber-200">{(utilityPrices.elecPrice || 3500).toLocaleString('vi-VN')} đ/kWh</span>
            </div>
            <div className="font-bold">
              Nước: <span className="font-mono text-cyan-200">{(utilityPrices.waterPrice || 25000).toLocaleString('vi-VN')} đ/m³</span>
            </div>
          </div>
        </div>

        {/* Thống kê nhanh phòng mình */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bento-card p-5 space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase">Phòng Đang Ở</div>
            <div className="text-2xl font-black text-purple-700 mt-1">
              {myRoomNumber}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">
              {houseName}
            </div>
          </div>

          <div className="bento-card p-5 space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase">Thời Gian Vào Ở</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {joinDateStr}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              {tenantMonthlyHistory.length} tháng sinh hoạt đã ghi số
            </div>
          </div>

          <div className="bento-card p-5 space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase">Điện Kỳ Này ({latestRecord.label || 'Tháng 09'})</div>
            <div className="text-2xl font-black text-amber-600 font-mono mt-1">
              {latestRecord.elecUsed || 0} <span className="text-sm font-bold text-slate-500">kWh</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              {(latestRecord.elecCost || 0).toLocaleString('vi-VN')} đ (Số mới: {latestRecord.newElec || 0})
            </div>
          </div>

          <div className="bento-card p-5 space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase">Nước Kỳ Này ({latestRecord.label || 'Tháng 09'})</div>
            <div className="text-2xl font-black text-blue-600 font-mono mt-1">
              {latestRecord.waterUsed || 0} <span className="text-sm font-bold text-slate-500">m³</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              {(latestRecord.waterCost || 0).toLocaleString('vi-VN')} đ (Số mới: {latestRecord.newWater || 0})
            </div>
          </div>
        </div>

        {/* Thanh lọc theo từng tháng từ khi vào ở */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-700">Chọn Kỳ Đối Soát:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTenantSelectedMonth('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                tenantSelectedMonth === 'ALL'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả các tháng ({tenantMonthlyHistory.length})
            </button>
            {tenantMonthlyHistory.map((item) => (
              <button
                key={item.monthKey}
                type="button"
                onClick={() => setTenantSelectedMonth(item.monthKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  tenantSelectedMonth === item.monthKey
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.label} {item.isCurrent && '(Kỳ này)'}
              </button>
            ))}
          </div>
        </div>

        {/* Danh Sách Chỉ Số Điện Nước Theo Từng Tháng Từ Khi Vào Ở */}
        {displayedMonthlyHistory.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
            Chưa có dữ liệu chỉ số điện nước nào trong khoảng thời gian đã chọn.
          </div>
        ) : (
          <div className="space-y-5">
            {displayedMonthlyHistory.map((item) => {
              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4 transition-all hover:border-purple-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-black text-slate-900">
                            {item.label}
                          </h2>
                          {item.isCurrent && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white">
                              ⭐ KỲ HIỆN TẠI
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              item.paid
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : item.recorded
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {item.paid ? '✅ Đã thanh toán' : item.recorded ? '⚠️ Cước chưa nộp' : '⏳ Chờ BQL chốt số'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Phòng {item.room} • {item.house}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDisputeRoom({
                          room: item.room,
                          houseCode: item.houseCode,
                          newElec: item.newElec,
                          newWater: item.newWater,
                          month: item.label
                        });
                        setShowDisputeModal(true);
                      }}
                      className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-xl text-xs transition-all btn-press cursor-pointer"
                      title="Gửi phản ánh chỉ số sai lệch đến Chủ trọ"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Phản Ánh Chỉ Số Sai Lệch (UC-T03)</span>
                    </button>
                  </div>

                  {/* 2 Meters Display (Điện & Nước) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Công tơ điện */}
                    <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-5 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-sm text-amber-950">Công Tơ Điện Phòng {item.room}</span>
                            <span className="text-[10px] text-amber-700 block">Đơn giá: {(utilityPrices.elecPrice || 3500).toLocaleString('vi-VN')} đ/kWh</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                          {item.recorded ? 'Đã Chốt Số' : 'Chưa Chốt'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-white/90 rounded-xl p-3 border border-amber-100 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Chỉ Số Cũ</span>
                          <span className="text-base font-black font-mono text-slate-700">{item.oldElec}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Chỉ Số Mới</span>
                          <span className="text-base font-black font-mono text-amber-700">{item.newElec}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Tiêu Thụ</span>
                          <span className="text-base font-black font-mono text-emerald-600">+{item.elecUsed} kWh</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-slate-600">Thành tiền điện tháng này:</span>
                        <span className="font-black text-amber-900 text-sm font-mono">
                          {item.elecCost.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>

                    {/* Đồng hồ nước */}
                    <div className="bg-blue-50/40 border border-blue-200/80 rounded-2xl p-5 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold">
                            <Droplets className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-sm text-blue-950">Đồng Hồ Nước Phòng {item.room}</span>
                            <span className="text-[10px] text-blue-700 block">Đơn giá: {(utilityPrices.waterPrice || 25000).toLocaleString('vi-VN')} đ/m³</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                          {item.recorded ? 'Đã Chốt Số' : 'Chưa Chốt'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-white/90 rounded-xl p-3 border border-blue-100 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Chỉ Số Cũ</span>
                          <span className="text-base font-black font-mono text-slate-700">{item.oldWater}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Chỉ Số Mới</span>
                          <span className="text-base font-black font-mono text-blue-700">{item.newWater}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Tiêu Thụ</span>
                          <span className="text-base font-black font-mono text-emerald-600">+{item.waterUsed} m³</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-slate-600">Thành tiền nước tháng này:</span>
                        <span className="font-black text-blue-900 text-sm font-mono">
                          {item.waterCost.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer tổng tiền điện + nước */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 bg-slate-50/60 p-3 rounded-xl text-xs">
                    <span className="text-slate-600">
                      Tổng tiền điện & nước {item.label}: {item.recorded ? (
                        <strong className="text-purple-700 text-sm font-mono">{item.totalUtilityCost.toLocaleString('vi-VN')} ₫</strong>
                      ) : (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-xs">
                          Chờ Ban Quản Lý chốt số (Chưa tính tiền)
                        </span>
                      )}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      🔒 Chỉ số được đối soát tự động từ công tơ riêng của phòng {item.room}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Phản Ánh Sai Lệch UC-T02 */}
        <MeterDisputeModal
          isOpen={showDisputeModal}
          onClose={() => {
            setShowDisputeModal(false);
            setSelectedDisputeRoom(null);
          }}
          roomNumber={selectedDisputeRoom?.room || myRoomNumber}
          houseCode={selectedDisputeRoom?.houseCode || 'CS-01'}
          systemElec={selectedDisputeRoom?.newElec || 0}
          systemWater={selectedDisputeRoom?.newWater || 0}
          onSubmitDispute={(data) => {
            if (submitMeterDispute) {
              submitMeterDispute(data);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>Ghi Chỉ Số Điện & Nước Toàn Chuỗi</span>
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

        {/* Action Controls: Xếp 2 tầng sát mép phải (Trên: Kỳ cước & Sửa đơn giá, Dưới: AI Quét công tơ vàng cam) */}
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0 sm:ml-auto">
          {/* Hàng trên: Kỳ cước & Sửa đơn giá */}
          <div className="flex items-center gap-2">
            {/* Bộ chọn tháng tính cước */}
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
                <option value="2026-10">Tháng 10/2026 (Kỳ tới - Mở lại ghi số)</option>
                <option value="2026-08">Tháng 08/2026 (Kỳ trước)</option>
              </select>
            </div>

            {/* Nút Sửa Đơn Giá */}
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

          {/* Hàng dưới: Nút Quét AI màu vàng cam ấn tượng */}
          <button
            type="button"
            onClick={() => setShowAiScanner(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-black rounded-xl shadow-md shadow-amber-500/25 transition-all btn-press cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>⚡ Quét Công Tơ Bằng AI (OCR)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/25 text-white">
              {unrecordedCount} phòng chờ
            </span>
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
          {/* Lọc Nhà Trọ / Cơ Sở */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mr-1">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Cơ sở:</span>
            </span>
            {[
              { code: 'ALL', name: 'Tất Cả Các Cơ Sở', count: readings.length },
              ...(user?.role === 'STAFF' && user?.houseCode === 'CS-02'
                ? [{ code: 'CS-02', name: 'CS-02: Bách Khoa', count: readings.filter((r) => r.houseCode === 'CS-02').length }]
                : user?.role === 'STAFF' && user?.houseCode === 'CS-01'
                ? [{ code: 'CS-01', name: 'CS-01: Cầu Giấy', count: readings.filter((r) => r.houseCode === 'CS-01').length }]
                : [
                    { code: 'CS-01', name: 'CS-01: Cầu Giấy', count: readings.filter((r) => r.houseCode === 'CS-01').length },
                    { code: 'CS-02', name: 'CS-02: Bách Khoa', count: readings.filter((r) => r.houseCode === 'CS-02').length },
                    { code: 'CS-03', name: 'CS-03: Đống Đa', count: readings.filter((r) => r.houseCode === 'CS-03').length },
                  ]),
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

          {/* Ô Tìm Kiếm Nhanh */}
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

        {/* Thanh lọc trạng thái phòng & tiến độ ghi số */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-semibold mr-1">Bộ lọc phòng:</span>
            {[
              { id: 'ALL', label: 'Toàn bộ phòng' },
              { id: 'OCCUPIED', label: 'Đang thuê' },
              { id: 'AVAILABLE', label: 'Phòng trống (Chưa thuê)' },
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

      {/* Main Table: Hiển thị toàn bộ các phòng (cả phòng thuê và chưa thuê) */}
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

                  // Kiểm tra phòng đã thanh toán tiền trọ chưa
                  const roomInvoice = invoices.find((inv) => inv.room === r.room && (!r.houseCode || inv.house?.includes(r.houseCode) || inv.house === r.house));
                  const isPaidRoom = r.paid || roomInvoice?.status === 'PAID';
                  const isAvailableRoom = r.status === 'AVAILABLE' || r.status === 'MAINTENANCE';

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-purple-50/40 hover:translate-x-0.5 transition-all duration-150 ${
                        r.recorded ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      {/* Cột Phòng & Khách Thuê */}
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
                              <span>{r.status === 'MAINTENANCE' ? 'Bảo trì (Chưa thuê)' : 'Phòng trống (Chưa thuê)'}</span>
                            </span>
                          ) : (
                            <span className="text-slate-600 font-semibold flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{r.tenant || 'Khách Đang Thuê'}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Điện cũ */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold">
                        {r.oldElec}
                      </td>

                      {/* Điện mới (Khóa không cho sửa nếu phòng đã thu tiền hoặc đã chốt) */}
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
                              : 'bg-white border-2 border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs'
                          }`}
                        />
                      </td>

                      {/* Tiêu thụ Điện */}
                      <td className="py-3.5 px-4 text-center font-bold font-mono text-amber-600">
                        {elecUsed} kWh
                      </td>

                      {/* Nước cũ */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold">
                        {r.oldWater}
                      </td>

                      {/* Nước mới (Khóa không cho sửa nếu phòng đã thu tiền hoặc đã chốt) */}
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
                              : 'bg-white border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs'
                          }`}
                        />
                      </td>

                      {/* Tiêu thụ Nước */}
                      <td className="py-3.5 px-4 text-center font-bold font-mono text-blue-600">
                        {waterUsed} m³
                      </td>

                      {/* Tổng Tiền */}
                      <td className="py-3.5 px-4 text-right">
                        {isRoomClosedOrPaid(r) ? (
                          <span className="font-black text-slate-900 text-sm">
                            {totalCost.toLocaleString('vi-VN')} ?
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>Chờ chốt số</span>
                          </span>
                        )}
                      </td>

                      {/* Trạng Thái & Thao Tác: Phòng đã thu tiền thì KHÓA SỔ HOÀN TOÀN, không có nút sửa */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {isPaidRoom ? (
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5 shadow-2xs"
                                title="Phòng này đã thanh toán xong tiền trọ (đã thu tiền điện nước kèm tiền phòng) - Khóa sổ vĩnh viễn, không được sửa"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Đã Thu Tiền (Khóa)</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">Không thể sửa</span>
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
                                title="Bấm nút sửa để mở khóa cho phòng quay lại trạng thái Lưu, khi đó phòng mới xuất hiện lại trong AI Scanner"
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

      {/* Modal Sửa Đơn Giá Điện & Nước */}
      <Modal isOpen={showPriceModal} onClose={() => setShowPriceModal(false)} maxWidth="max-w-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Điều Chỉnh Đơn Giá Điện & Nước
              </h2>
              <p className="text-xs text-slate-500">
                Áp dụng tự động tính cước cho toàn bộ chuỗi phòng
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPriceModal(false)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSavePrices} className="space-y-4 pt-4 text-xs">
          {/* Đơn giá điện */}
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
                  const cleaned = raw.replace(/^0+(?=\d)/, '');
                  setTempElecPrice(cleaned);
                }}
                placeholder="3500"
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-amber-800 text-sm focus:outline-none focus:border-amber-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                đ / kWh
              </span>
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-500">Gợi ý nhanh:</span>
              {[3500, 3800, 4000].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTempElecPrice(String(p))}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    Number(tempElecPrice) === p
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {p.toLocaleString('vi-VN')} đ
                </button>
              ))}
            </div>
          </div>

          {/* Đơn giá nước */}
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
                  const cleaned = raw.replace(/^0+(?=\d)/, '');
                  setTempWaterPrice(cleaned);
                }}
                placeholder="25000"
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl font-mono font-bold text-blue-800 text-sm focus:outline-none focus:border-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                đ / m³
              </span>
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-500">Gợi ý nhanh:</span>
              {[20000, 25000, 30000, 35000].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTempWaterPrice(String(p))}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    Number(tempWaterPrice) === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  {p.toLocaleString('vi-VN')} đ
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              Khi bấm lưu, hệ thống tự động cập nhật ngay lập tức đơn giá cho toàn bộ bảng ghi chỉ số và các máy quét AI.
            </span>
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
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/25 cursor-pointer btn-press"
            >
              Lưu Đơn Giá Mới
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Quét Công Tơ Bằng AI (Đầy đủ tất cả các phòng allRooms={readings}) */}
      <MeterAiScannerModal
        isOpen={showAiScanner}
        onClose={() => setShowAiScanner(false)}
        onSaveReading={handleSaveFromAi}
        allRooms={readings}
        rooms={roomsForAi}
        currentMetersData={currentMetersData}
        utilityPrices={utilityPrices}
      />
    </div>
  );
}
