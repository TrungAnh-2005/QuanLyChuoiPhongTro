import React, { useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  X,
  Zap,
  Droplets,
  Image as ImageIcon,
  Upload,
  Send
} from 'lucide-react';
import Modal from '../common/Modal';

export default function MeterDisputeModal({
  isOpen,
  onClose,
  roomNumber,
  houseCode,
  systemElec,
  systemWater,
  onSubmitDispute
}) {
  const [meterType, setMeterType] = useState('ELECTRICITY'); // 'ELECTRICITY' | 'WATER'
  const [actualReading, setActualReading] = useState('');
  const [note, setNote] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!actualReading) return;

    if (onSubmitDispute) {
      onSubmitDispute({
        room: roomNumber,
        houseCode: houseCode || 'CS-01',
        meterType,
        systemReading: meterType === 'ELECTRICITY' ? systemElec : systemWater,
        reportedReading: Number(actualReading),
        note,
        imageUrl: imagePreview,
        date: new Date().toLocaleDateString('vi-VN')
      });
    }

    setSubmitted(true);
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setActualReading('');
    setNote('');
    setImagePreview(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleResetAndClose} maxWidth="max-w-md">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Phản Ánh Chỉ Số Sai Lệch (UC-T02)
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Đối soát công tơ điện nước Phòng {roomNumber}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 animate-bounce">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">
              Đã Gửi Phản Ánh Tới Chủ Trọ!
            </h4>
            <p className="text-xs text-slate-500 mb-5 max-w-xs mx-auto">
              Ban Quản Lý cơ sở sẽ tiến hành đối soát ảnh chụp công tơ thực tế và hiệu chỉnh lại hóa đơn phòng của bạn trong vòng 24 giờ.
            </p>
            <button
              onClick={handleResetAndClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md btn-press cursor-pointer"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-4 space-y-4 text-xs">
            {/* Choose type */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Loại Đồng Hồ Cần Phản Ánh
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMeterType('ELECTRICITY')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                    meterType === 'ELECTRICITY'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Công Tơ Điện</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMeterType('WATER')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                    meterType === 'WATER'
                      ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span>Đồng Hồ Nước</span>
                </button>
              </div>
            </div>

            {/* Current system reading vs Actual */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Chỉ số hệ thống báo:</span>
                <span className="text-base font-black font-mono text-rose-600">
                  {meterType === 'ELECTRICITY' ? `${systemElec} kWh` : `${systemWater} m³`}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Chỉ số bạn nhìn thấy *:
                </label>
                <input
                  type="number"
                  required
                  placeholder="Gõ số thực tế"
                  value={actualReading}
                  onChange={(e) => setActualReading(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Upload Evidence Image */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ảnh Chụp Mặt Đồng Hồ Làm Bằng Chứng (Tùy chọn)
              </label>
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-40">
                  <img src={imagePreview} alt="Evidence" className="w-full h-36 object-cover" />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-lg hover:bg-black/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-xl bg-slate-50/50 hover:bg-purple-50/30 transition-all cursor-pointer">
                  <Camera className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-600">
                    Bấm để chụp hoặc tải ảnh mặt đồng hồ
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Hỗ trợ JPG, PNG, WebP (Rõ nét số công tơ)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mô Tả Chi Tiết Hoặc Lý Do Phản Ánh
              </label>
              <textarea
                rows={2}
                placeholder="VD: Lúc 18h tối qua em kiểm tra đồng hồ chỉ mới chạy đến số..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-md shadow-amber-600/25 transition-all btn-press flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Gửi Khiếu Nại Đối Soát</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
