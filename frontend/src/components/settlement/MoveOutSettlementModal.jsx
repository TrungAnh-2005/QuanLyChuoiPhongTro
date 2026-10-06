import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Copy,
  Check,
  Wrench,
  Zap,
  Droplets,
  DollarSign,
  FileText,
  Calendar,
  User,
  Building,
  Home,
  CreditCard,
  X
} from 'lucide-react';

const STANDARD_EQUIPMENT = [
  { id: 'ac', name: 'Điều hòa & Remote điều khiển', defaultFee: 500000, desc: 'Làm lạnh tốt, remote đầy đủ pin' },
  { id: 'heater', name: 'Bình nóng lạnh & Vòi sen, Lavabo', defaultFee: 250000, desc: 'Nóng nhanh, không rò rỉ nước' },
  { id: 'bed', name: 'Giường & Nệm, Ga trải', defaultFee: 300000, desc: 'Nguyên vẹn, không xẹp lún, không vấy bẩn' },
  { id: 'wardrobe', name: 'Tủ quần áo (cửa trượt/ngăn kéo)', defaultFee: 200000, desc: 'Bản lề chắc chắn, không vỡ gương' },
  { id: 'desk', name: 'Bàn ghế làm việc / học tập', defaultFee: 150000, desc: 'Mặt bàn sạch, chân ghế vững chắc' },
  { id: 'keys', name: 'Khóa cửa, Chìa khóa & Thẻ thang máy', defaultFee: 100000, desc: 'Đủ 2 chìa khóa phòng và 1 thẻ từ' },
  { id: 'lights', name: 'Bóng đèn & Ổ cắm, Công tắc điện', defaultFee: 80000, desc: 'Sáng đều, không cháy nổ, an toàn điện' },
  { id: 'wall', name: 'Sơn tường & Trần nhà (Khoan đục/Vẽ bẩn)', defaultFee: 300000, desc: 'Không đóng đinh bừa bãi, không bong tróc' },
  { id: 'clean', name: 'Vệ sinh phòng tổng thể khi bàn giao', defaultFee: 200000, desc: 'Dọn sạch rác, lau dọn sàn nhà sạch sẽ' }
];

const getBankId = (name) => {
  const n = (name || '').toLowerCase();
  if (n.includes('vietcom') || n.includes('vcb')) return 'vietcombank';
  if (n.includes('techcom') || n.includes('tcb')) return 'techcombank';
  if (n.includes('mb') || n.includes('quân đội')) return 'mbbank';
  if (n.includes('bidv')) return 'bidv';
  if (n.includes('vietin') || n.includes('icb')) return 'vietinbank';
  if (n.includes('acb')) return 'acb';
  if (n.includes('vp')) return 'vpbank';
  if (n.includes('tp')) return 'tpbank';
  if (n.includes('sacom') || n.includes('stb')) return 'sacombank';
  if (n.includes('vib')) return 'vib';
  if (n.includes('hd')) return 'hdbank';
  if (n.includes('shb')) return 'shb';
  if (n.includes('ocb')) return 'ocb';
  if (n.includes('seabank')) return 'seabank';
  return 'vietcombank';
};

export default function MoveOutSettlementModal({ isOpen, onClose, settlement, room, contract }) {
  const { settleMoveOut, rooms, contracts, utilityPrices, invoices = [] } = useData();

  // Khởi tạo checklist trang thiết bị
  const [equipmentList, setEquipmentList] = useState(
    STANDARD_EQUIPMENT.map((eq) => ({ ...eq, status: 'OK', fee: eq.defaultFee }))
  );

  // Chốt chỉ số điện nước tháng cuối
  const [metersInput, setMetersInput] = useState({
    oldElec: 120,
    newElec: 165,
    oldWater: 30,
    newWater: 34
  });

  const [isEarlyTermination, setIsEarlyTermination] = useState(false);
  const [formData, setFormData] = useState({
    damageFee: 0,
    damageDescription: '',
    unpaidUtilitiesFee: 0,
    refundStatus: 'COMPLETED'
  });

  const [copiedField, setCopiedField] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Đơn giá điện nước
  const elecPrice = utilityPrices?.elec || 3500;
  const waterPrice = utilityPrices?.water || 25000;

  // Tính tiền điện nước tự động
  const elecUsage = Math.max(0, Number(metersInput.newElec || 0) - Number(metersInput.oldElec || 0));
  const waterUsage = Math.max(0, Number(metersInput.newWater || 0) - Number(metersInput.oldWater || 0));
  const autoUtilitiesFee = elecUsage * elecPrice + waterUsage * waterPrice;

  useEffect(() => {
    if (settlement) {
      const reasonLower = (settlement.reason || '').toLowerCase();
      const isEarly = settlement.forfeitDeposit || reasonLower.includes('trước hạn') || reasonLower.includes('mất cọc') || reasonLower.includes('đột xuất');
      setIsEarlyTermination(Boolean(isEarly));

      setFormData({
        damageFee: settlement.damageFee || 0,
        damageDescription: settlement.damageDescription || '',
        unpaidUtilitiesFee: settlement.unpaidUtilitiesFee !== undefined ? settlement.unpaidUtilitiesFee : autoUtilitiesFee,
        refundStatus: settlement.refundStatus || 'COMPLETED'
      });

      // Reset equipment checklist
      setEquipmentList(
        STANDARD_EQUIPMENT.map((eq) => ({
          ...eq,
          status: 'OK',
          fee: eq.defaultFee
        }))
      );
    }
  }, [settlement]);

  // Cập nhật phí bồi thường hư hỏng từ checklist
  const handleToggleEquipment = (id) => {
    setEquipmentList((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'OK' ? 'DAMAGED' : 'OK';
          return { ...item, status: nextStatus };
        }
        return item;
      });

      // Tính tổng phí hư hỏng
      const totalDamage = updated.filter((i) => i.status === 'DAMAGED').reduce((sum, i) => sum + i.fee, 0);
      const damageNotes = updated
        .filter((i) => i.status === 'DAMAGED')
        .map((i) => `${i.name} (Hư hại/mất: -${i.fee.toLocaleString('vi-VN')} đ)`)
        .join('; ');

      setFormData((f) => ({
        ...f,
        damageFee: totalDamage,
        damageDescription: damageNotes || 'Không có hư hại thiết bị, bàn giao đầy đủ.'
      }));

      return updated;
    });
  };

  const handleEquipmentFeeChange = (id, newFee) => {
    setEquipmentList((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, fee: Math.max(0, Number(newFee)) } : item));
      const totalDamage = updated.filter((i) => i.status === 'DAMAGED').reduce((sum, i) => sum + i.fee, 0);
      const damageNotes = updated
        .filter((i) => i.status === 'DAMAGED')
        .map((i) => `${i.name} (Hư hại: -${i.fee.toLocaleString('vi-VN')} đ)`)
        .join('; ');

      setFormData((f) => ({
        ...f,
        damageFee: totalDamage,
        damageDescription: damageNotes
      }));
      return updated;
    });
  };

  if (!isOpen) return null;

  const originalDeposit = settlement?.originalDeposit || contract?.deposit || 3000000;
  // Nếu trả trước hạn -> Tịch thu 100% tiền cọc (effectiveDeposit = 0)
  const effectiveDeposit = isEarlyTermination ? 0 : originalDeposit;
  const damageFee = Number(formData.damageFee) || 0;
  const unpaidUtilitiesFee = Number(formData.unpaidUtilitiesFee) || 0;

  // Quét tiền phòng chưa trả để cấn trừ vào cọc
  const unpaidRentInvoices = useMemo(() => {
    return (invoices || []).filter(
      (inv) => inv.room === settlement?.roomNumber && inv.status !== 'PAID'
    );
  }, [invoices, settlement]);
  const unpaidRentFee = useMemo(() => {
    return unpaidRentInvoices.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0);
  }, [unpaidRentInvoices]);

  // Tiền cọc thực trả lại cho khách (Cấn trừ tiền phòng nợ + điện nước + đồ đạc hư hỏng)
  const calculatedRefund = isEarlyTermination
    ? 0
    : Math.max(0, effectiveDeposit - unpaidRentFee - damageFee - unpaidUtilitiesFee);

  // Số tiền khách phải đóng bù (nếu cọc không đủ bù hoặc trước hạn mất cọc mà còn nợ nần)
  const tenantMustPayExtra = isEarlyTermination
    ? unpaidRentFee + damageFee + unpaidUtilitiesFee
    : Math.max(0, unpaidRentFee + damageFee + unpaidUtilitiesFee - effectiveDeposit);

  const bankAccount = settlement?.bankAccount || '0987654321';
  const bankName = settlement?.bankName || 'Vietcombank';
  const accountHolder = settlement?.accountHolder || 'NGUYEN VAN A';
  const bankId = getBankId(bankName);
  const transferContent = `HOAN_COC_P${settlement?.roomNumber || '102'}_${settlement?.tenantName?.replace(/\s+/g, '_') || 'KHACH'}`;

  // VietQR Dynamic URL (Chuẩn Napas 247)
  const vietQrUrl = `https://img.vietqr.io/image/${bankId}-${bankAccount}-compact.png?amount=${calculatedRefund}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountHolder)}`;

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(String(text));
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    try {
      if (settlement?.id) {
        settleMoveOut(settlement.id, {
          damageFee,
          damageDescription: formData.damageDescription,
          unpaidUtilitiesFee,
          unpaidRentFee,
          refundStatus: formData.refundStatus,
          isEarlyTermination,
          refundAmount: calculatedRefund
        });
      } else {
        setError('Không tìm thấy bản ghi quyết toán hợp lệ.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Lỗi khi thực hiện quyết toán hoàn cọc.');
    }
  };

  const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                UC-S07: Quyết toán bàn giao phòng & hoàn cọc
              </span>
              <span className="text-[10px] font-bold text-indigo-300 bg-indigo-900/70 px-2 py-0.5 rounded-full border border-indigo-700/50">
                {settlement?.houseCode || 'CS-01'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <span>Nghiệm Thu Thiết Bị & Thanh Lý Hợp Đồng</span>
              <span className="font-mono text-amber-300 text-sm">Phòng {settlement?.roomNumber || room?.roomNumber}</span>
            </h3>
            <p className="text-xs text-slate-300">
              Khách thuê: <strong className="text-white">{settlement?.tenantName}</strong> | SĐT: {settlement?.tenantPhone || '0987.654.321'} | HĐ: {settlement?.contractId || 'HD-2026'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã hoàn tất nghiệm thu & quyết toán trả phòng! Phòng được chuyển sang trạng thái "🧹 Chờ dọn dẹp". Hợp đồng kết thúc.</span>
            </div>
          )}

          {/* Phân loại hợp đồng: Đúng hạn vs Trước hạn */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <span className="text-slate-500 font-medium block">Tình trạng thanh lý hợp đồng:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${isEarlyTermination ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                    {isEarlyTermination ? '⚠️ Trả phòng trước hạn (Tịch thu cọc)' : '✅ Hết hạn hợp đồng (Được hoàn cọc)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEarlyTermination(!isEarlyTermination)}
                    className="text-[11px] text-purple-600 hover:text-purple-800 underline font-semibold cursor-pointer"
                  >
                    [Đổi sang {isEarlyTermination ? 'Hết hạn đúng cam kết' : 'Trả trước hạn mất cọc'}]
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="text-slate-500 font-medium block">Ngày bàn giao trả phòng:</span>
                <span className="font-bold text-slate-800 text-sm font-mono">{settlement?.moveOutDate || 'Hôm nay'}</span>
              </div>
            </div>

            {/* Cảnh báo trước hạn */}
            {isEarlyTermination ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Điều khoản vi phạm hợp đồng trước thời hạn:</strong> Toàn bộ số tiền cọc gốc <strong>{formatVND(originalDeposit)}</strong> bị tịch thu để bù đắp chi phí trống phòng. Khách thuê vẫn có nghĩa vụ thanh toán đầy đủ tiền điện nước kỳ cuối và chi phí bồi thường hư hỏng tài sản.
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Hợp đồng hoàn thành đúng hạn:</strong> Tiền cọc gốc <strong>{formatVND(originalDeposit)}</strong> sẽ được cấn trừ tiền điện nước tháng cuối và chi phí đồ đạc hỏng hóc (nếu có), phần còn lại chuyển khoản hoàn trả 100% về tài khoản của khách.
                </div>
              </div>
            )}
          </div>

          {/* 1. NGHIỆM THU TRANG THIẾT BỊ (Asset Inspection Checklist) */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-600" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  1. Biên Bản Nghiệm Thu Trang Thiết Bị & Đánh Dấu Đồ Hỏng
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Tick chọn đồ hỏng để tự động cộng dồn phí bồi thường
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {equipmentList.map((item) => {
                const isDamaged = item.status === 'DAMAGED';
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                      isDamaged
                        ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300'
                        : 'bg-slate-50/60 border-slate-200 hover:border-purple-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-800 leading-tight">{item.name}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleEquipment(item.id)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0 transition-all cursor-pointer ${
                            isDamaged
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                        >
                          {isDamaged ? '❌ HỎNG / MẤT' : '✅ TỐT'}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{item.desc}</p>
                    </div>

                    {isDamaged && (
                      <div className="mt-2.5 pt-2 border-t border-rose-200 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-rose-700">Khấu trừ:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="10000"
                            value={item.fee}
                            onChange={(e) => handleEquipmentFeeChange(item.id, e.target.value)}
                            className="w-24 px-1.5 py-0.5 text-right font-mono font-bold text-xs text-rose-700 bg-white border border-rose-300 rounded focus:outline-none"
                          />
                          <span className="text-[10px] text-rose-600 font-bold">đ</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tổng phí bồi thường hư hỏng */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-700 text-xs">Tổng chi phí bồi thường hư hỏng:</span>
                <span className="text-[11px] text-slate-500 block">
                  {formData.damageDescription || 'Tất cả trang thiết bị đạt yêu cầu, không phát sinh chi phí'}
                </span>
              </div>
              <div className="font-mono font-black text-base text-rose-600">
                {damageFee > 0 ? `-${formatVND(damageFee)}` : '0 đ'}
              </div>
            </div>
          </div>

          {/* 2. CHỐT CÔNG TƠ ĐIỆN NƯỚC KỲ CUỐI */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  2. Chốt Chỉ Số Công Tơ Điện Nước Kỳ Cuối (Tháng dọn đi)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Điện: {elecPrice.toLocaleString('vi-VN')} đ/kWh • Nước: {waterPrice.toLocaleString('vi-VN')} đ/m³
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Điện */}
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>Số điện (kWh)</span>
                  </span>
                  <span className="font-mono font-bold text-amber-800 text-xs">
                    Dùng: {elecUsage} kWh = {formatVND(elecUsage * elecPrice)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Số cũ đầu tháng:</label>
                    <input
                      type="number"
                      value={metersInput.oldElec}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMetersInput((m) => ({ ...m, oldElec: val }));
                        const usage = Math.max(0, metersInput.newElec - val);
                        setFormData((f) => ({ ...f, unpaidUtilitiesFee: usage * elecPrice + waterUsage * waterPrice }));
                      }}
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Số chốt ngày dọn:</label>
                    <input
                      type="number"
                      value={metersInput.newElec}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMetersInput((m) => ({ ...m, newElec: val }));
                        const usage = Math.max(0, val - metersInput.oldElec);
                        setFormData((f) => ({ ...f, unpaidUtilitiesFee: usage * elecPrice + waterUsage * waterPrice }));
                      }}
                      className="w-full px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-800"
                    />
                  </div>
                </div>
              </div>

              {/* Nước */}
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-blue-600" />
                    <span>Số nước (m³)</span>
                  </span>
                  <span className="font-mono font-bold text-blue-800 text-xs">
                    Dùng: {waterUsage} m³ = {formatVND(waterUsage * waterPrice)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Số cũ đầu tháng:</label>
                    <input
                      type="number"
                      value={metersInput.oldWater}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMetersInput((m) => ({ ...m, oldWater: val }));
                        const usage = Math.max(0, metersInput.newWater - val);
                        setFormData((f) => ({ ...f, unpaidUtilitiesFee: elecUsage * elecPrice + usage * waterPrice }));
                      }}
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Số chốt ngày dọn:</label>
                    <input
                      type="number"
                      value={metersInput.newWater}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMetersInput((m) => ({ ...m, newWater: val }));
                        const usage = Math.max(0, val - metersInput.oldWater);
                        setFormData((f) => ({ ...f, unpaidUtilitiesFee: elecUsage * elecPrice + usage * waterPrice }));
                      }}
                      className="w-full px-2.5 py-1 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold text-blue-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ô nhập trực tiếp nếu muốn ghi đè */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-600 font-medium">Tổng tiền điện nước chốt kỳ cuối:</span>
              <div className="flex items-center gap-1.5 font-mono font-black text-rose-600 text-sm">
                <span>-</span>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={formData.unpaidUtilitiesFee}
                  onChange={(e) => setFormData({ ...formData, unpaidUtilitiesFee: Number(e.target.value) })}
                  className="w-28 px-2 py-0.5 text-right font-mono font-bold border border-slate-200 rounded-lg text-xs"
                />
                <span>đ</span>
              </div>
            </div>
          </div>

          {/* 3. TÀI KHOẢN NGÂN HÀNG CỦA KHÁCH & MÃ VIETQR HOÀN TIỀN */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  3. Tài Khoản Khách Nhận Cọc & Quét Mã VietQR Chuyển Tiền
                </h4>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                Napas 247 Hoàn Tiền Tức Thì
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Thông tin tài khoản */}
              <div className="space-y-2">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <strong className="text-indigo-900 font-bold">{bankName}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="font-mono font-black text-slate-900 text-sm">{bankAccount}</strong>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(bankAccount, 'acc')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                        title="Sao chép số tài khoản"
                      >
                        {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <strong className="uppercase font-semibold text-slate-800">{accountHolder}</strong>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Số tiền hoàn cọc:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="font-mono font-black text-emerald-600 text-sm">{formatVND(calculatedRefund)}</strong>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(calculatedRefund, 'amt')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                        title="Sao chép số tiền"
                      >
                        {copiedField === 'amt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Nội dung chuyển:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-slate-600 truncate max-w-[140px]">{transferContent}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(transferContent, 'desc')}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                        title="Sao chép nội dung"
                      >
                        {copiedField === 'desc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>Mở ứng dụng ngân hàng bất kỳ trên điện thoại, chọn <strong>Quét mã QR</strong> để chuyển tiền ngay.</span>
                </div>
              </div>

              {/* Mã VietQR động */}
              <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl">
                {calculatedRefund > 0 ? (
                  <div className="text-center">
                    <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-100 inline-block mb-1.5">
                      <img
                        src={vietQrUrl}
                        alt="Mã VietQR Hoàn Cọc"
                        className="w-40 h-40 object-contain mx-auto"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-purple-600" />
                      <span>VietQR Hoàn Cọc {formatVND(calculatedRefund)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 px-4">
                    <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto mb-2" />
                    <span className="font-bold text-rose-700 text-xs block">Không Có Tiền Cọc Hoàn Lại</span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isEarlyTermination
                        ? 'Do khách vi phạm thời hạn hợp đồng nên tiền cọc bị tịch thu.'
                        : 'Các khoản phí khấu trừ lớn hơn hoặc bằng số tiền cọc ban đầu.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BẢNG TỔNG KẾT QUYẾT TOÁN TÀI CHÍNH */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl space-y-2.5">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>(+) Tiền cọc gốc ban đầu:</span>
              <span className="font-mono font-bold text-white text-sm">{formatVND(originalDeposit)}</span>
            </div>
            {isEarlyTermination && (
              <div className="flex justify-between items-center text-xs text-rose-300">
                <span>(-) Phạt vi phạm hủy hợp đồng trước hạn (Tịch thu 100% cọc, không hoàn tiền phòng):</span>
                <span className="font-mono font-bold text-rose-400">-{formatVND(originalDeposit)}</span>
              </div>
            )}
            {unpaidRentFee > 0 && (
              <div className="flex justify-between items-center text-xs text-rose-300">
                <span>(-) Tiền phòng chưa thanh toán (Cấn trừ vào cọc):</span>
                <span className="font-mono font-bold text-rose-400">-{formatVND(unpaidRentFee)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>(-) Tiền điện nước kỳ cuối (thực tế đồng hồ):</span>
              <span className="font-mono font-bold text-amber-400">-{formatVND(unpaidUtilitiesFee)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>(-) Chi phí bồi thường thiết bị hư hại:</span>
              <span className="font-mono font-bold text-rose-400">-{formatVND(damageFee)}</span>
            </div>

            <div className="pt-2.5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  {calculatedRefund > 0 ? '👉 TỔNG TIỀN CHỦ TRỌ HOÀN TRẢ KHÁCH:' : '👉 KHÔNG CÓ TIỀN CỌC HOÀN LẠI:'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {calculatedRefund > 0
                    ? 'Chuyển khoản theo mã VietQR ở trên để hoàn tất nghĩa vụ'
                    : tenantMustPayExtra > 0
                    ? `Khách thuê còn phải nộp thêm ${formatVND(tenantMustPayExtra)} tiền điện nước/hỏng hóc`
                    : 'Hai bên đã thanh toán xong nghĩa vụ tài chính'}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {formatVND(calculatedRefund)}
              </div>
            </div>
          </div>

          {/* Trạng thái hoàn tiền */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-slate-700">Trạng thái hoàn trả tiền:</span>
            <select
              value={formData.refundStatus}
              onChange={(e) => setFormData({ ...formData, refundStatus: e.target.value })}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="COMPLETED">✅ Đã chuyển khoản hoàn tất</option>
              <option value="PENDING">⏳ Chờ chuyển khoản sau</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Hủy / Đóng
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all btn-press cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận Nghiệm Thu & Hoàn Cọc (UC-S07)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
