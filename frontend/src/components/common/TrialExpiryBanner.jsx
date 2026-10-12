import React, { useState } from 'react';
import {
  Clock,
  AlertOctagon,
  Sparkles,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { getTrialStatus } from '../../utils/packagePermissions';

export default function TrialExpiryBanner({ currentLandlord, onUpgradeClick }) {
  const trial = getTrialStatus(currentLandlord);
  const [toggleState, setToggleState] = useState(0);

  if (!trial.isTrial) return null;

  const handleToggleSimulateExpired = () => {
    const current = localStorage.getItem('rental_simulate_trial_expired') === 'true';
    if (current) {
      localStorage.removeItem('rental_simulate_trial_expired');
    } else {
      localStorage.setItem('rental_simulate_trial_expired', 'true');
    }
    setToggleState((prev) => prev + 1);
    window.dispatchEvent(new Event('storage'));
  };

  if (trial.isTrialExpired) {
    return (
      <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white rounded-2xl p-4 shadow-lg shadow-rose-600/25 border border-rose-500/50 mb-6 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <AlertOctagon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-white text-rose-800">
                  HẾT HẠN DÙNG THỬ
                </span>
                <span className="text-xs text-rose-200 font-mono">0 ngày còn lại</span>
              </div>
              <h3 className="text-sm sm:text-base font-black tracking-tight mt-0.5">
                Hạn Dùng Thử 14 Ngày Đã Kết Thúc!
              </h3>
              <p className="text-xs text-rose-100/90 mt-0.5 max-w-2xl leading-relaxed">
                Tài khoản đã hết thời hạn trải nghiệm miễn phí. Các tính năng phát hành hóa đơn mới, chốt điện nước tháng mới và tạo thêm phòng đang bị khóa. Vui lòng kích hoạt gói bản quyền (Chỉ từ 199.000 đ/tháng) để tiếp tục vận hành.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleToggleSimulateExpired}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Phục hồi trạng thái còn hạn dùng thử để test"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi Phục Dùng Thử (Demo)</span>
            </button>
            <button
              type="button"
              onClick={onUpgradeClick}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950 text-xs font-black shadow-md shadow-amber-400/30 flex items-center gap-1.5 btn-press cursor-pointer transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>Kích Hoạt Bản Quyền Ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-purple-500/10 border border-amber-300/80 rounded-2xl p-3.5 mb-6 shadow-xs backdrop-blur-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25 font-black text-sm">
            ⏳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-900 tracking-tight">
                Gói Dùng Thử 14 Ngày (Miễn Phí 0đ)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
                Còn {trial.daysLeft} ngày
              </span>
              <span className="text-[10px] text-slate-500 font-semibold hidden md:inline">
                • Hạn mức: 1 cơ sở, tối đa 10 phòng
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Sau 14 ngày, bạn cần mua gói bản quyền để tiếp tục chốt điện nước và thu tiền phòng.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleSimulateExpired}
            className="px-2.5 py-1.5 rounded-lg border border-amber-300/80 hover:bg-amber-100/50 text-amber-900 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
            title="Mô phỏng hiệu ứng khi hết hạn 14 ngày"
          >
            <span>🧪 Test Hết Hạn 14 Ngày</span>
          </button>
          <button
            type="button"
            onClick={onUpgradeClick}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-[11px] font-black shadow-sm transition flex items-center gap-1 btn-press cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Nâng Cấp Gói Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
