import React from 'react';
import {
  Sparkles,
  Crown,
  Lock,
  ArrowRight,
  CheckCircle2,
  X,
  ShieldCheck,
  Zap
} from 'lucide-react';
import Modal from './Modal';
import { PACKAGE_TIERS } from '../../utils/packagePermissions';

export default function UpgradePromptModal({
  isOpen,
  onClose,
  featureName = 'Tính Năng Cao Cấp',
  featureDescription = 'Tính năng này yêu cầu gói bản quyền cao hơn để sử dụng.',
  currentPackageCode = 'BASIC',
  requiredPackageCode = 'ENTERPRISE',
  onUpgradeClick
}) {
  const currentTier = PACKAGE_TIERS[currentPackageCode?.toUpperCase()] || PACKAGE_TIERS.NONE;
  const requiredTier = PACKAGE_TIERS[requiredPackageCode?.toUpperCase()] || PACKAGE_TIERS.ENTERPRISE;

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      <div className="relative overflow-hidden">
        {/* Glow Background Header */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pt-2 pb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-purple-600 shadow-lg shadow-orange-500/30 text-white mb-3 animate-bounce">
            {requiredPackageCode === 'ENTERPRISE' ? (
              <Crown className="w-7 h-7 text-amber-200" />
            ) : (
              <Sparkles className="w-7 h-7 text-purple-200" />
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/80 mb-2">
            <Lock className="w-3 h-3 text-amber-600" />
            <span>Đặc Quyền {requiredTier.name}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Nâng Cấp Để Mở Khóa Tính Năng
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            {featureDescription}
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Current Tier */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Gói Hiện Tại Của Bạn
              </div>
              <div className="text-base font-black text-slate-800 mt-1 flex items-center gap-1.5">
                <span>{currentTier.name}</span>
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-0.5">
                {currentTier.monthlyPrice > 0
                  ? `${currentTier.monthlyPrice.toLocaleString('vi-VN')} đ/tháng`
                  : '0 đ / tháng'}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs text-rose-600 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Chưa hỗ trợ: {featureName}</span>
            </div>
          </div>

          {/* Required Tier */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/50 to-purple-50 border-2 border-amber-400 shadow-sm relative flex flex-col justify-between">
            <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
              Đề Xuất
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                Gói Yêu Cầu Mở Khóa
              </div>
              <div className="text-base font-black text-purple-950 mt-1 flex items-center gap-1.5">
                <span>{requiredTier.name}</span>
              </div>
              <div className="text-xs text-purple-700 font-bold mt-0.5">
                {requiredTier.monthlyPrice.toLocaleString('vi-VN')} đ/tháng
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-200/60 text-xs text-emerald-700 font-black flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Mở khóa toàn quyền {featureName}</span>
            </div>
          </div>
        </div>

        {/* Benefits bullets */}
        <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-3.5 mb-6 text-xs text-slate-700 space-y-2">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Quyền lợi vượt trội khi nâng cấp {requiredTier.name}:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Hạn mức mở rộng {requiredTier.maxRooms >= 999 ? 'Không giới hạn' : `${requiredTier.maxRooms} phòng`}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Quản lý {requiredTier.maxHouses >= 999 ? 'Không giới hạn' : `${requiredTier.maxHouses} cơ sở`}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Kích hoạt tự động ngay sau thanh toán</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Hỗ trợ cổng thanh toán VietQR 24/7</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-1/3 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
          >
            Để Sau
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onUpgradeClick?.(requiredPackageCode);
            }}
            className="w-full sm:w-2/3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all btn-press cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Nâng Cấp Lên {requiredTier.name} Ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
