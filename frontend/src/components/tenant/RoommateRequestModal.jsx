import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

export default function RoommateRequestModal({ isOpen, onClose, userRoom, activeContract }) {
  const { submitRoommateRequest } = useData();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    identityCard: '',
    phone: '',
    birthDate: '',
    gender: 'MALE',
    hometown: '',
    cccdFrontUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    cccdBackUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation per UC-T07 & SO_DO_USECASE_VA_THUC_THE_CSDL.md
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ và tên người ở ghép.');
      return;
    }
    if (!/^\d{12}$/.test(formData.identityCard.trim())) {
      setError('Số Căn cước công dân (CCCD) phải bao gồm đúng 12 chữ số.');
      return;
    }
    if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(formData.phone.trim())) {
      setError('Số điện thoại không hợp lệ (cần 10 chữ số đầu 03, 05, 07, 08, 09).');
      return;
    }
    if (!formData.birthDate) {
      setError('Vui lòng chọn ngày tháng năm sinh.');
      return;
    }
    if (!formData.hometown.trim()) {
      setError('Vui lòng nhập quê quán/địa chỉ thường trú theo CCCD.');
      return;
    }

    try {
      submitRoommateRequest({
        requestedByTenantId: user?.id || 'KH-001',
        roomId: userRoom?.id || 'P101',
        contractId: activeContract?.id || 'HD-2026-001',
        ...formData,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Không thể gửi đăng ký ở ghép.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-white flex justify-between items-center">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-100 bg-emerald-700/50 px-2.5 py-0.5 rounded-full inline-block mb-1">
              UC-T07: Khách thuê
            </span>
            <h3 className="text-lg font-bold">Đăng ký bạn cùng phòng (Ở ghép)</h3>
            <p className="text-xs text-emerald-100">
              Phòng: {userRoom?.roomNumber || 'P.101'} | Cơ sở: {userRoom?.boardingHouseName || 'Nhà trọ Bách Khoa'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2 font-medium">
              <span>✅</span>
              <span>Đã gửi hồ sơ đăng ký ở ghép thành công! Chủ trọ/Quản lý sẽ duyệt trong vòng 24h.</span>
            </div>
          )}

          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-800 leading-relaxed">
            <span className="font-bold">Quy định ở ghép:</span> Theo quy chế quản lý trọ, chủ trọ cần khai báo tạm trú cho tất cả nhân khẩu sinh sống. Vui lòng điền thông tin chính xác theo Căn cước công dân.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên người ở ghép <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="VD: Nguyễn Văn B"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số CCCD (12 chữ số) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="identityCard"
                maxLength={12}
                value={formData.identityCard}
                onChange={handleChange}
                placeholder="001202008899"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại liên hệ <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                maxLength={10}
                value={formData.phone}
                onChange={handleChange}
                placeholder="0987654321"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày sinh <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giới tính
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quê quán / Hộ khẩu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="hometown"
                value={formData.hometown}
                onChange={handleChange}
                placeholder="VD: Hải Hậu, Nam Định"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Photo attachment preview */}
          <div className="border-t border-slate-100 pt-3">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Ảnh chụp CCCD 2 mặt (Dùng khai báo tạm trú & duyệt hồ sơ)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
                <span className="text-xl">🪪</span>
                <p className="text-xs font-medium text-slate-600 mt-1">Mặt trước CCCD</p>
                <p className="text-[11px] text-teal-600">Đã đính kèm ảnh mẫu</p>
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
                <span className="text-xl">💳</span>
                <p className="text-xs font-medium text-slate-600 mt-1">Mặt sau CCCD</p>
                <p className="text-[11px] text-teal-600">Đã đính kèm ảnh mẫu</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-lg shadow-sm shadow-teal-500/30 transition"
            >
              Gửi yêu cầu đăng ký (UC-T07)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
