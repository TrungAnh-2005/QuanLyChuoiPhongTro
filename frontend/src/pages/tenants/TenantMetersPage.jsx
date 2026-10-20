import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Clock,
  Droplets,
  CheckCircle2,
  AlertCircle,
  Calendar,
  AlertTriangle,
  Send,
  Eye,
  Info,
  Building2,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import MeterDisputeModal from '@/components/tenant/MeterDisputeModal';

export default function TenantMetersPage() {
  const { user, tenantRooms } = useAuth();
  const {
    billingMonth = '2026-09',
    meters: readings = [],
    metersHistory = {},
    utilityPrices = { elecPrice: 3500, waterPrice: 25000 },
    invoices = [],
    tenants = [],
    submitMeterDispute,
    contracts = []
  } = useData();

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedDisputeRoom, setSelectedDisputeRoom] = useState(null);
  const [tenantSelectedMonth, setTenantSelectedMonth] = useState('ALL');

  // Tìm khách thuê
  const currentTenant = useMemo(() => {
    return (tenants || []).find(
      (t) => t.username === user?.username || t.phone === user?.phone || (user?.fullName && t.fullName?.toLowerCase().includes(user.fullName.toLowerCase()))
    );
  }, [tenants, user]);

  const activeContract = useMemo(() => {
    return (contracts || []).find((c) => {
      const matchPhone = c.tenantPhone && user?.phone && c.tenantPhone === user.phone;
      const matchName = c.tenantName && user?.fullName && c.tenantName.toLowerCase().includes(user.fullName.toLowerCase());
      return (matchPhone || matchName) && (c.status === 'ACTIVE' || c.status === 'EXPIRED' || c.status === 'PENDING_TERMINATION');
    });
  }, [contracts, user]);

  const myRentedRooms = useMemo(() => {
    const list = [];
    if (activeContract?.roomNumber && !list.includes(activeContract.roomNumber)) list.push(activeContract.roomNumber);
    if (currentTenant?.room && !list.includes(currentTenant.room)) list.push(currentTenant.room);
    if (user?.room && !list.includes(user.room)) list.push(user.room);
    if (Array.isArray(tenantRooms)) {
      tenantRooms.forEach((r) => { if (r && !list.includes(r)) list.push(r); });
    }
    return list;
  }, [currentTenant, user, tenantRooms, activeContract]);

  const myRoomNumber = useMemo(() => {
    return myRentedRooms[0] || (user?.username === 'tenant' ? 'P.101' : null);
  }, [myRentedRooms, user]);

  const joinDateStr = useMemo(() => {
    return activeContract?.startDate || currentTenant?.startDate || '01/01/2026';
  }, [activeContract, currentTenant]);

  const tenantMonthlyHistory = useMemo(() => {
    if (!myRoomNumber) return [];

    const monthKeys = ['2026-09', '2026-08', '2026-07', '2026-06', '2026-05', '2026-04'];
    const monthLabels = {
      '2026-09': 'Tháng 09/2026 (Kỳ hiện tại)',
      '2026-08': 'Tháng 08/2026',
      '2026-07': 'Tháng 07/2026',
      '2026-06': 'Tháng 06/2026',
      '2026-05': 'Tháng 05/2026',
      '2026-04': 'Tháng 04/2026'
    };

    const currentRec = (readings || []).find((r) => r.room === myRoomNumber) || {
      room: myRoomNumber,
      house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
      oldElec: 1240,
      newElec: 1395,
      oldWater: 48,
      newWater: 56,
      recorded: true,
      paid: false
    };

    const res = [];
    monthKeys.forEach((mKey) => {
      let rec = null;
      if (mKey === billingMonth) {
        rec = currentRec;
      } else {
        const histForMonth = metersHistory[mKey] || [];
        rec = histForMonth.find((r) => r.room === myRoomNumber);
      }

      if (rec) {
        const elecDiff = Math.max(0, (rec.newElec || 0) - (rec.oldElec || 0));
        const waterDiff = Math.max(0, (rec.newWater || 0) - (rec.oldWater || 0));
        const elecPrice = utilityPrices.elecPrice || 3500;
        const waterPrice = utilityPrices.waterPrice || 25000;
        const elecCost = elecDiff * elecPrice;
        const waterCost = waterDiff * waterPrice;

        res.push({
          ...rec,
          id: `${rec.room}_${mKey}`,
          monthKey: mKey,
          label: monthLabels[mKey] || mKey,
          isCurrent: mKey === billingMonth,
          elecUsed: elecDiff,
          waterUsed: waterDiff,
          elecCost,
          waterCost,
          totalUtilityCost: elecCost + waterCost
        });
      }
    });

    return res;
  }, [myRoomNumber, billingMonth, readings, metersHistory, utilityPrices]);

  const displayedMonthlyHistory = useMemo(() => {
    if (tenantSelectedMonth === 'ALL') return tenantMonthlyHistory;
    return tenantMonthlyHistory.filter((item) => item.monthKey === tenantSelectedMonth);
  }, [tenantMonthlyHistory, tenantSelectedMonth]);

  if (!myRoomNumber) {
    return (
      <div className="space-y-6 page-enter">
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
    <div className="space-y-6 page-enter pb-10">
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
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Phòng Đang Ở</div>
          <div className="text-2xl font-black text-purple-700 mt-1">{myRoomNumber}</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">{houseName}</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Thời Gian Vào Ở</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{joinDateStr}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {tenantMonthlyHistory.length} tháng sinh hoạt đã ghi số
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Điện Kỳ Này ({latestRecord.label || 'Tháng 09'})</div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">
            {latestRecord.elecUsed || 0} <span className="text-sm font-bold text-slate-500">kWh</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {(latestRecord.elecCost || 0).toLocaleString('vi-VN')} đ (Số mới: {latestRecord.newElec || 0})
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Nước Kỳ Này ({latestRecord.label || 'Tháng 09'})</div>
          <div className="text-2xl font-black text-blue-600 font-mono mt-1">
            {latestRecord.waterUsed || 0} <span className="text-sm font-bold text-slate-500">m³</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {(latestRecord.waterCost || 0).toLocaleString('vi-VN')} đ (Số mới: {latestRecord.newWater || 0})
          </div>
        </div>
      </div>

      {/* Bộ Lọc Theo Tháng */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-bold text-slate-700">Lịch sử chỉ số theo tháng:</span>
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

      {/* Danh Sách Chỉ Số Điện Nước Theo Từng Tháng */}
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
                        <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Kỳ Hiện Tại
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      Cơ sở: <strong className="text-slate-700">{item.house}</strong> • Phòng:{' '}
                      <strong className="text-purple-700 font-mono">{item.room}</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDisputeRoom(item);
                    setShowDisputeModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-700 font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs shrink-0"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Phản Ánh Sai Lệch Chỉ Số</span>
                </button>
              </div>

              {/* 2 Khối Điện và Nước */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Khối Điện */}
                <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/30 border border-amber-200/70 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-amber-950">Đồng Hồ Điện Phòng {item.room}</span>
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

                {/* Khối Nước */}
                <div className="bg-gradient-to-br from-blue-50/60 to-cyan-50/30 border border-blue-200/70 rounded-2xl p-4 space-y-3">
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

              {/* Footer tổng tiền */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100 bg-slate-50/60 p-3 rounded-xl text-xs">
                <span className="text-slate-600">
                  Tổng tiền điện & nước {item.label}:{' '}
                  {item.recorded ? (
                    <strong className="text-purple-700 text-sm font-mono">
                      {item.totalUtilityCost.toLocaleString('vi-VN')} ₫
                    </strong>
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
