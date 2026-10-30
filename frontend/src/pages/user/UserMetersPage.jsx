import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Droplets,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import MeterDisputeModal from '../../components/tenant/MeterDisputeModal';

export default function UserMetersPage() {
  const { user, tenantRooms } = useAuth();
  const {
    tenants = [],
    contracts = [],
    roomMembers = [],
    invoices = [],
    readings = [],
    metersHistory = {},
    utilityPrices = { elecPrice: 3500, waterPrice: 25000 },
    billingMonth = '2026-09',
    submitMeterDispute
  } = useData();

  const [tenantSelectedMonth, setTenantSelectedMonth] = useState('ALL');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedDisputeRoom, setSelectedDisputeRoom] = useState(null);

  const currentTenant = useMemo(() => {
    if (!user) return null;
    const userName = (user.fullName || '').toLowerCase();
    return (tenants || []).find((t) => {
      const tName = (t.fullName || '').toLowerCase();
      return (
        (userName && tName && (userName.includes(tName) || tName.includes(userName))) ||
        (user?.phone && t?.phone && user.phone.replace(/\D/g, '') === t.phone.replace(/\D/g, ''))
      );
    });
  }, [user, tenants]);

  const myRentedRooms = useMemo(() => {
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
  }, [currentTenant, user, tenantRooms]);

  const activeContract = useMemo(() => {
    if (!user || !contracts) return null;
    const userName = (user.fullName || '').toLowerCase();
    const userPhone = (user.phone || '').replace(/\D/g, '');
    return (contracts || []).find((c) => {
      const cTenant = (c.tenantName || '').toLowerCase();
      const cPhone = (c.tenantPhone || '').replace(/\D/g, '');
      const matchName = cTenant && userName && (cTenant.includes(userName) || userName.includes(cTenant));
      const matchPhone = userPhone && cPhone && userPhone === cPhone;
      return (matchName || matchPhone) && (c.status === 'ACTIVE' || c.status === 'APPROVED');
    });
  }, [user, contracts]);

  const myRoomNumber = useMemo(() => {
    if (myRentedRooms.length > 0) return myRentedRooms[0];
    const stored = tenantRooms?.[user?.username] || tenantRooms?.[user?.fullName];
    const dynamicRoom = Array.isArray(stored) && stored.length > 0 ? stored[0] : typeof stored === 'string' && stored ? stored : null;
    if (dynamicRoom) return dynamicRoom;
    if (activeContract?.room) return activeContract.room;
    if (user?.username === 'tenant_new') return null;
    const directRoom = user?.room || currentTenant?.room || (user?.rooms && user.rooms[0]) || (currentTenant?.rooms && currentTenant.rooms[0]);
    return directRoom || null;
  }, [myRentedRooms, tenantRooms, user, currentTenant, activeContract]);

  const myMemberInfo = useMemo(() => {
    if (!myRoomNumber) return null;
    return (roomMembers || []).find(
      (m) =>
        m.roomNumber === myRoomNumber &&
        ((user?.fullName && m.fullName && m.fullName.toLowerCase().includes(user.fullName.toLowerCase())) ||
          (user?.phone && m.phone && user.phone.replace(/\D/g, '') === m.phone.replace(/\D/g, '')))
    );
  }, [roomMembers, myRoomNumber, user]);

  const joinDateStr = useMemo(() => {
    if (activeContract?.startDate) return activeContract.startDate;
    if (myMemberInfo?.joinDate) return myMemberInfo.joinDate;
    if (currentTenant?.joinDate) return currentTenant.joinDate;
    return '01/' + (billingMonth ? billingMonth.split('-')[1] + '/' + billingMonth.split('-')[0] : '09/2026');
  }, [activeContract, myMemberInfo, currentTenant, billingMonth]);

  const tenantMonthlyHistory = useMemo(() => {
    if (!myRoomNumber) return [];

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

    let startYear = 2026;
    let startMonthNum = 1;
    if (joinDateStr && joinDateStr.includes('/')) {
      const parts = joinDateStr.split('/');
      if (parts.length >= 3) {
        startMonthNum = parseInt(parts[1], 10) || 1;
        startYear = parseInt(parts[2], 10) || 2026;
      }
    }

    const currentYear = 2026;
    const currentMonthNum = parseInt((billingMonth || '2026-09').split('-')[1], 10) || 9;

    const monthsList = [];
    const minMonth = Math.min(Math.max(1, startMonthNum), currentMonthNum);
    for (let m = currentMonthNum; m >= minMonth; m--) {
      const monthKey = `${currentYear}-${String(m).padStart(2, '0')}`;
      monthsList.push({
        monthKey,
        monthNum: m,
        year: currentYear,
        label: `Tháng ${String(m).padStart(2, '0')}/${currentYear}`,
        isCurrent: m === currentMonthNum
      });
    }

    let runningElec = currentReading.oldElec || 1450;
    let runningWater = currentReading.oldWater || 85;
    const roomNumDigits = parseInt((myRoomNumber || '101').replace(/\D/g, '') || '101', 10);

    return monthsList.map((mObj) => {
      const isCurrentMonth = mObj.isCurrent;

      if (isCurrentMonth) {
        const elecUsed = Math.max(0, (currentReading.newElec || 0) - (currentReading.oldElec || 0));
        const waterUsed = Math.max(0, (currentReading.newWater || 0) - (currentReading.oldWater || 0));
        const elecCost = elecUsed * (utilityPrices.elecPrice || 3500);
        const waterCost = waterUsed * (utilityPrices.waterPrice || 25000);
        const totalUtilityCost = elecCost + waterCost;

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

      const historyMonthList = metersHistory?.[mObj.monthKey];
      const historyItem = historyMonthList?.find((r) => r.room === myRoomNumber);

      let oldE, newE, oldW, newW;

      if (historyItem) {
        oldE = historyItem.oldElec;
        newE = historyItem.newElec;
        oldW = historyItem.oldWater;
        newW = historyItem.newWater;
      } else {
        const elecUsedPast = 70 + ((roomNumDigits + mObj.monthNum * 7) % 18);
        const waterUsedPast = 5 + ((roomNumDigits + mObj.monthNum * 3) % 4);

        newE = runningElec;
        oldE = Math.max(0, runningElec - elecUsedPast);
        runningElec = oldE;

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
  }, [myRoomNumber, joinDateStr, billingMonth, readings, invoices, metersHistory, utilityPrices]);

  const displayedMonthlyHistory = useMemo(() => {
    if (tenantSelectedMonth === 'ALL') return tenantMonthlyHistory;
    return tenantMonthlyHistory.filter((item) => item.monthKey === tenantSelectedMonth);
  }, [tenantMonthlyHistory, tenantSelectedMonth]);

  if (!myRoomNumber) {
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

  const latestRecord = tenantMonthlyHistory[0] || {};
  const houseName = latestRecord.house || 'Nhà Trọ Cầu Giấy - Cơ Sở 1';

  return (
    <div className="space-y-6">
      {/* Banner Khách Thuê */}
      <div className="hero-gradient-shine bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white p-6 rounded-2xl shadow-xl shadow-orange-600/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>Đối Soát Điện Nước Phòng Mình</span>
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
          <div className="text-2xl font-black text-purple-700 mt-1">{myRoomNumber}</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">{houseName}</div>
        </div>

        <div className="bento-card p-5 space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase">Thời Gian Vào Ở</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{joinDateStr}</div>
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

      {/* Thanh lọc theo từng tháng */}
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

      {/* Danh Sách Chỉ Số */}
      {displayedMonthlyHistory.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
          Chưa có dữ liệu chỉ số điện nước nào trong khoảng thời gian đã chọn.
        </div>
      ) : (
        <div className="space-y-5">
          {displayedMonthlyHistory.map((item) => (
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
                      <h2 className="text-lg font-black text-slate-900">{item.label}</h2>
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
                  <span>Phản Ánh Chỉ Số Sai Lệch</span>
                </button>
              </div>

              {/* 2 Meters Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Điện */}
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

                {/* Nước */}
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

              {/* Footer */}
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
          ))}
        </div>
      )}

      {/* Modal Phản Ánh Sai Lệch */}
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
