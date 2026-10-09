import React, { useState } from 'react';
import {
  Crown,
  Sparkles,
  Check,
  ShieldCheck,
  X,
  Building2,
  Zap,
  CreditCard,
  QrCode,
  ArrowRight,
  Award,
  Layers,
  CheckCircle2
} from 'lucide-react';
import Modal from '../common/Modal';

const PACKAGES = [
  {
    code: 'BASIC',
    name: 'Gói Cơ Bản (BASIC)',
    tagline: 'Phù hợp chủ nhà trọ quy mô nhỏ (1-2 cơ sở)',
    monthlyPrice: 199000,
    maxHouses: 2,
    maxRooms: 30,
    badge: 'Tiết Kiệm',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    color: 'blue',
    features: [
      'Quản lý tối đa 2 cơ sở nhà trọ',
      'Hạn mức 30 phòng trọ',
      'Quản lý hồ sơ cư dân & hợp đồng cơ bản',
      'Tính tiền phòng & chốt điện nước tự động',
      'Tạo mã QR thanh toán SePay / VietQR'
    ]
  },
  {
    code: 'PRO',
    name: 'Gói Chuyên Nghiệp (PRO)',
    tagline: 'Lựa chọn phổ biến nhất cho chuỗi phòng trọ & chung cư mini',
    monthlyPrice: 499000,
    maxHouses: 999,
    maxRooms: 100,
    badge: 'Bán Chạy Nhất ⭐',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 font-black animate-pulse',
    popular: true,
    color: 'purple',
    features: [
      'Không giới hạn số lượng cơ sở nhà trọ',
      'Hạn mức mở rộng lên đến 100 phòng',
      'Cổng VietQR tự động gạch nợ thanh toán 24/7',
      'Xuất phiếu thu & Hóa đơn điện tử VAT chuẩn thuế',
      'Hợp đồng thuê điện tử ký trực tuyến (E-Sign)',
      'Phân quyền nhân viên quản lý (Staff RBAC)'
    ]
  },
  {
    code: 'ENTERPRISE',
    name: 'Gói Doanh Nghiệp (ENTERPRISE)',
    tagline: 'Hệ thống vận hành toàn diện với AI và định danh CCCD',
    monthlyPrice: 999000,
    maxHouses: 999,
    maxRooms: 999,
    badge: 'Đỉnh Cao AI 👑',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-black',
    color: 'amber',
    features: [
      'Không giới hạn cơ sở & không giới hạn phòng trọ',
      'AI Vision OCR: Tự nhận diện chỉ số đồng hồ điện nước qua ảnh',
      'Định danh KYC CCCD chuẩn pháp lý (12 số & quét ảnh)',
      'Tự động gửi thông báo hóa đơn qua SMS & Zalo ZNS',
      'Báo cáo dòng tiền, GMV, MRR đa cơ sở chuyên sâu',
      'Hỗ trợ kỹ thuật VIP 24/7 & sao lưu dữ liệu tự động'
    ]
  }
];

const CYCLES = [
  { months: 1, label: '1 Tháng', discount: 0, sublabel: 'Thanh toán từng tháng' },
  { months: 6, label: '6 Tháng', discount: 0.1, sublabel: 'Tiết kiệm 10%' },
  { months: 12, label: '12 Tháng (1 Năm)', discount: 0.2, sublabel: 'Tiết kiệm 20% ⭐' }
];

export default function BuySaasPackageModal({
  isOpen,
  onClose,
  currentLandlord,
  onConfirmPurchase
}) {
  const [selectedCode, setSelectedCode] = useState(
    currentLandlord?.packageCode === 'ENTERPRISE' ? 'ENTERPRISE' : 'PRO'
  );
  const [selectedMonths, setSelectedMonths] = useState(12);

  const selectedPkg = PACKAGES.find((p) => p.code === selectedCode) || PACKAGES[1];
  const selectedCycle = CYCLES.find((c) => c.months === selectedMonths) || CYCLES[2];

  // Tính toán số tiền sau chiết khấu
  const rawTotal = selectedPkg.monthlyPrice * selectedMonths;
  const discountAmount = Math.round(rawTotal * selectedCycle.discount);
  const finalTotal = rawTotal - discountAmount;

  const handleBuy = () => {
    onConfirmPurchase({
      packageCode: selectedPkg.code,
      packageName: selectedPkg.name,
      months: selectedMonths,
      amount: finalTotal,
      billingCycle: `${selectedMonths} Tháng (Giảm ${selectedCycle.discount * 100}%)`,
      maxHouses: selectedPkg.maxHouses
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-purple-500/10 text-purple-700 text-xs font-black border border-purple-200/60">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Bản Quyền Nền Tảng Trọ Việt SaaS • B2B Subscription</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Bảng Giá & Mua Gói Dịch Vụ SaaS
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm max-w-2xl">
              Nâng cấp tài khoản Chủ trọ của <strong>{currentLandlord?.fullName || 'bạn'}</strong> để mở khóa toàn bộ tính năng tự động và mở rộng hạn mức cơ sở.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chu kỳ thanh toán */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-bold text-slate-700">Chọn chu kỳ thanh toán:</span>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {CYCLES.map((cycle) => (
              <button
                key={cycle.months}
                type="button"
                onClick={() => setSelectedMonths(cycle.months)}
                className={`btn-press px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  selectedMonths === cycle.months
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{cycle.label}</span>
                {cycle.discount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${
                      selectedMonths === cycle.months ? 'bg-amber-400 text-slate-950' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    -{cycle.discount * 100}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Bento Cards Gói Cước */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PACKAGES.map((pkg) => {
            const isSelected = selectedCode === pkg.code;
            return (
              <div
                key={pkg.code}
                onClick={() => setSelectedCode(pkg.code)}
                className={`bento-card p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'ring-2 ring-purple-600 border-purple-500 bg-gradient-to-b from-purple-50/40 via-white to-white shadow-xl -translate-y-1'
                    : 'hover:border-purple-300 hover:shadow-md'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-xs">
                    KHUYÊN DÙNG ⭐
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${pkg.badgeClass}`}>
                      {pkg.badge}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-black text-slate-900 text-base">{pkg.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 min-h-[32px]">{pkg.tagline}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 font-mono">
                        {pkg.monthlyPrice.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/tháng</span>
                    </div>
                    <div className="text-[11px] text-purple-700 font-bold mt-1">
                      Hạn mức: {pkg.maxHouses > 100 ? 'Không giới hạn cơ sở' : `Tối đa ${pkg.maxHouses} cơ sở`}
                    </div>
                  </div>

                  {/* Danh sách tính năng */}
                  <div className="space-y-2 pt-2">
                    {pkg.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100">
                  <button
                    type="button"
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{isSelected ? 'Đã Chọn Gói Này' : 'Chọn Gói Này'}</span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tóm tắt thanh toán & Nút mua ngay */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="text-xs text-purple-200">
              Đang chọn: <strong className="text-white">{selectedPkg.name}</strong> • Chu kỳ: <strong className="text-amber-300">{selectedCycle.label}</strong>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                {finalTotal.toLocaleString('vi-VN')} đ
              </span>
              {discountAmount > 0 && (
                <span className="text-xs text-purple-300 line-through">
                  {rawTotal.toLocaleString('vi-VN')} đ
                </span>
              )}
              <span className="text-xs text-purple-200">
                (Đã gồm thuế GTGT & chiết khấu)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Nhận tiền: MBBank 9999888899 • CTCP SaaS Trọ Việt (Website Admin)
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Để Sau
            </button>
            <button
              type="button"
              onClick={handleBuy}
              className="btn-press btn-shimmer flex-1 sm:flex-initial px-6 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4 text-slate-950" />
              <span>Nộp Tiền & Kích Hoạt Ngay</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
