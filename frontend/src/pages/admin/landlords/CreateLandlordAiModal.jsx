import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  CreditCard,
  Calendar,
  MapPin,
  Building2,
  Phone,
  Mail,
  Loader2,
  Trash2,
  HelpCircle,
  Award,
  Crown,
  ShieldCheck,
  ArrowLeftRight
} from 'lucide-react';
import { ocrIdCard, classifyCccdImage, validateCccdMatch } from '../../../services/aiService';

const SAMPLE_LANDLORDS = [
  {
    label: '⭐ Đàm Trung Anh (Thái Bình - 2005)',
    fullName: 'ĐÀM TRUNG ANH',
    identityCard: '034205005539',
    birthDate: '2005-11-25',
    gender: 'NAM',
    hometown: 'Vũ Trung, Kiến Xương, Thái Bình',
    address: 'Thôn 5A, Vũ Trung, Kiến Xương, Thái Bình',
    phone: '0358.251.120',
    email: 'trunganh.dam@gmail.com',
    taxCode: '8592019482',
    issueDate: '2021-04-20',
    issuePlace: 'Cục Cảnh sát QLHC về TTXH'
  },
  {
    label: '⭐ Đàm Văn Táo (Thái Bình - 1975)',
    fullName: 'ĐÀM VĂN TÁO',
    identityCard: '034075000679',
    birthDate: '1975-06-06',
    gender: 'NAM',
    hometown: 'Kiến Xương, Thái Bình',
    address: 'Thôn 5A, Vũ Trung, Kiến Xương, Thái Bình',
    phone: '0912.839.201',
    email: 'taodv@rental.vn',
    taxCode: '8392019283',
    issueDate: '2021-05-15',
    issuePlace: 'Cục Cảnh sát QLHC về TTXH'
  },
  {
    label: 'Lê Thị Thu Ngân (Hà Nội - 1990)',
    fullName: 'LÊ THỊ THU NGÂN',
    identityCard: '001190012345',
    birthDate: '1990-03-12',
    gender: 'NỮ',
    hometown: 'Đống Đa, Hà Nội',
    address: 'Số 45 Tây Sơn, Quang Trung, Đống Đa, Hà Nội',
    phone: '0988.765.432',
    email: 'ngan.le@troviet.vn',
    taxCode: '8102938475',
    issueDate: '2021-08-10',
    issuePlace: 'Cục Cảnh sát QLHC về TTXH'
  },
  {
    label: 'Nguyễn Văn An (Nam Định - 1988)',
    fullName: 'NGUYỄN VĂN AN',
    identityCard: '001201012345',
    birthDate: '1988-08-15',
    gender: 'NAM',
    hometown: 'Hải Hậu, Nam Định',
    address: 'Xã Hải Trung, Huyện Hải Hậu, Tỉnh Nam Định',
    phone: '0987.654.321',
    email: 'an.nguyen@rental.vn',
    taxCode: '8291029384',
    issueDate: '2021-04-20',
    issuePlace: 'Cục Cảnh sát QLHC về TTXH'
  }
];

export default function CreateLandlordAiModal({ isOpen, onClose, onSaveLandlord }) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);

  const [frontError, setFrontError] = useState(null);
  const [backError, setBackError] = useState(null);
  const [mismatchError, setMismatchError] = useState(null);
  const [swapError, setSwapError] = useState(null);
  const [globalScanError, setGlobalScanError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  // Form fields cho Chủ trọ
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    identityCard: '',
    birthDate: '1988-08-15',
    gender: 'NAM',
    hometown: '',
    permanentAddress: '',
    phone: '',
    email: '',
    taxCode: '',
    issueDate: '2021-04-20',
    issuePlace: 'Cục Cảnh sát QLHC về TTXH',
    packageCode: 'PRO'
  });

  const generateUsername = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/g, '');
  };

  const handleSelectSample = (sample) => {
    const uName = generateUsername(sample.fullName);
    setFormData((prev) => ({
      ...prev,
      fullName: sample.fullName,
      username: uName,
      identityCard: sample.identityCard,
      birthDate: sample.birthDate,
      gender: sample.gender,
      hometown: sample.hometown,
      permanentAddress: sample.address,
      phone: sample.phone,
      email: sample.email,
      taxCode: sample.taxCode,
      issueDate: sample.issueDate || '2021-04-20',
      issuePlace: sample.issuePlace || 'Cục Cảnh sát QLHC về TTXH'
    }));

    setScanSuccess(true);
    setFrontError(null);
    setBackError(null);
    setMismatchError(null);
    setSwapError(null);
    setGlobalScanError(null);
    setSubmitError(null);
    setScanMessage(`Đã nạp thành công hồ sơ mẫu CCCD: ${sample.fullName}`);
  };

  const handleFrontFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setScanSuccess(false);
      setFrontError(null);
      setBackError(null);
      setMismatchError(null);
      setSwapError(null);
      setGlobalScanError(null);
      setSubmitError(null);
      setFrontImage(file);
      setFrontPreview(URL.createObjectURL(file));
    }
  };

  const handleBackFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setScanSuccess(false);
      setFrontError(null);
      setBackError(null);
      setMismatchError(null);
      setSwapError(null);
      setGlobalScanError(null);
      setSubmitError(null);
      setBackImage(file);
      setBackPreview(URL.createObjectURL(file));
    }
  };

  const triggerScan = async (fImg, bImg) => {
    setIsScanning(true);
    setScanSuccess(false);
    setFrontError(null);
    setBackError(null);
    setMismatchError(null);
    setSwapError(null);
    setGlobalScanError(null);
    setScanMessage('Đang đối soát 2 mặt CCCD và trích xuất dữ liệu bằng AI Vision OCR...');

    try {
      const data = await ocrIdCard(fImg, bImg);
      if (data) {
        const uName = generateUsername(data.fullName || formData.fullName);
        setFormData((prev) => ({
          ...prev,
          fullName: data.fullName || prev.fullName,
          username: uName || prev.username,
          identityCard: data.idNumber || prev.identityCard,
          birthDate: data.dateOfBirth || prev.birthDate,
          gender: data.gender || prev.gender,
          hometown: data.hometown || prev.hometown,
          permanentAddress: data.permanentAddress || prev.permanentAddress,
          issueDate: data.issueDate || prev.issueDate,
          issuePlace: data.issuePlace || prev.issuePlace
        }));
        setScanSuccess(true);
        setMismatchError(null);
        setSwapError(null);
        setGlobalScanError(null);
        setScanMessage(data.notes || '✓ Trích xuất thông tin CCCD Chủ trọ thành công 100%! Mặt trước và mặt sau hoàn toàn trùng khớp.');
      }
    } catch (err) {
      console.error('Lỗi quét AI:', err);
      const errType = err.errorType || '';
      if (errType === 'SWAPPED_SIDES' || err.canSwap) {
        setSwapError({
          title: 'Gửi Nhầm Mặt Trước & Mặt Sau',
          message: err.message || 'Bạn đã gửi nhầm vị trí: Ô Mặt Trước đang chứa Mặt Sau và ngược lại!'
        });
      } else if (errType === 'MISMATCH') {
        setMismatchError(err.message || 'Ảnh Mặt Trước và Mặt Sau KHÔNG CÙNG MỘT NGƯỜI!');
      } else {
        setGlobalScanError({
          title: 'Lỗi Quét AI',
          message: err.message || 'Không thể trích xuất thông tin từ ảnh. Vui lòng thử lại hoặc chọn mẫu CCCD có sẵn.'
        });
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.identityCard) {
      setSubmitError('Vui lòng quét CCCD hoặc nhập đầy đủ Họ tên và Số CCCD 12 số.');
      return;
    }

    if (formData.identityCard.length !== 12) {
      setSubmitError('Số Căn Cước Công Dân bắt buộc phải có đúng 12 chữ số.');
      return;
    }

    const payload = {
      fullName: formData.fullName,
      username: formData.username || generateUsername(formData.fullName),
      email: formData.email || `${generateUsername(formData.fullName)}@rental.vn`,
      phone: formData.phone || '0912.839.201',
      identityCard: formData.identityCard,
      birthDate: formData.birthDate,
      issueDate: formData.issueDate,
      issuePlace: formData.issuePlace,
      permanentAddress: formData.permanentAddress,
      taxCode: formData.taxCode || '8592019482',
      packageCode: formData.packageCode,
      frontImage: frontPreview,
      backImage: backPreview
    };

    onSaveLandlord(payload);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFrontImage(null);
    setBackImage(null);
    setFrontPreview(null);
    setBackPreview(null);
    setFrontError(null);
    setBackError(null);
    setMismatchError(null);
    setSwapError(null);
    setGlobalScanError(null);
    setSubmitError(null);
    setScanSuccess(false);
    setScanMessage('');
    setFormData({
      fullName: '',
      username: '',
      identityCard: '',
      birthDate: '1988-08-15',
      gender: 'NAM',
      hometown: '',
      permanentAddress: '',
      phone: '',
      email: '',
      taxCode: '',
      issueDate: '2021-04-20',
      issuePlace: 'Cục Cảnh sát QLHC về TTXH',
      packageCode: 'PRO'
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-400 text-[10px] font-bold border border-white/10 mb-0.5">
                <span>⚡ AI Vision OCR 2 Mặt • Định Danh Chuẩn KYC</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Thêm Đối Tác Chủ Trọ Bằng AI OCR (CCCD)
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Quick Sample Selector */}
          <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Nạp Nhanh Hồ Sơ Mẫu Để Kiểm Thử (Không Cần Tìm Ảnh)</span>
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold">1-Chạm điền dữ liệu</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_LANDLORDS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className="btn-press px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-800 text-xs font-bold rounded-xl border border-indigo-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2 Upload Dropzones: Mặt Trước & Mặt Sau */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mặt trước */}
            <div className="bento-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>1. Ảnh Mặt Trước (Chân dung & Mã QR)</span>
                </span>
                {frontPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setFrontImage(null);
                      setFrontPreview(null);
                    }}
                    className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                )}
              </div>

              {frontPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-[16/10] bg-slate-900 flex items-center justify-center">
                  <img src={frontPreview} alt="Mặt trước" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                    ✓ Đã tải mặt trước
                  </span>
                </div>
              ) : (
                <div
                  onClick={() => frontInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-50/50 aspect-[16/10]"
                >
                  <UploadCloud className="w-8 h-8 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-700">Tải ảnh Mặt Trước CCCD</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG hoặc WebP</span>
                </div>
              )}
              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                onChange={handleFrontFileChange}
                className="hidden"
              />
              {frontError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{frontError.message}</span>
                </div>
              )}
            </div>

            {/* Mặt sau */}
            <div className="bento-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <span>2. Ảnh Mặt Sau (Chip vi mạch & Mã MRZ)</span>
                </span>
                {backPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setBackImage(null);
                      setBackPreview(null);
                    }}
                    className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                )}
              </div>

              {backPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-[16/10] bg-slate-900 flex items-center justify-center">
                  <img src={backPreview} alt="Mặt sau" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                    ✓ Đã tải mặt sau
                  </span>
                </div>
              ) : (
                <div
                  onClick={() => backInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-slate-300 hover:border-purple-500 p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-50/50 aspect-[16/10]"
                >
                  <UploadCloud className="w-8 h-8 text-purple-500" />
                  <span className="text-xs font-bold text-slate-700">Tải ảnh Mặt Sau CCCD</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG hoặc WebP</span>
                </div>
              )}
              <input
                ref={backInputRef}
                type="file"
                accept="image/*"
                onChange={handleBackFileChange}
                className="hidden"
              />
              {backError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{backError.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Nút Kích Hoạt Quét AI OCR */}
          {(frontImage || backImage) && (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={isScanning}
                onClick={() => triggerScan(frontImage, backImage)}
                className="btn-press flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white text-xs sm:text-sm font-black rounded-2xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Đang Phân Tích & Đối Soát 2 Mặt...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>⚡ Phân Tích & Trích Xuất Bằng AI OCR</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Feedback & Error Banners */}
          {swapError && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{swapError.message}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const fImg = frontImage;
                  const bImg = backImage;
                  const fPrev = frontPreview;
                  const bPrev = backPreview;
                  setFrontImage(bImg);
                  setFrontPreview(bPrev);
                  setBackImage(fImg);
                  setBackPreview(fPrev);
                  setSwapError(null);
                }}
                className="btn-press px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs"
              >
                Đổi vị trí 2 ảnh
              </button>
            </div>
          )}

          {mismatchError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl flex items-center gap-2 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{mismatchError}</span>
            </div>
          )}

          {globalScanError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl flex items-center gap-2 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{globalScanError.message}</span>
            </div>
          )}

          {scanSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{scanMessage}</span>
            </div>
          )}

          {/* Form Thông Tin Chi Tiết Chủ Trọ */}
          <form id="landlord-ai-form" onSubmit={handleSubmit} className="bento-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Thông Tin Đối Tác Chủ Trọ Đã Xác Thực KYC</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và Tên Chủ Trọ *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({ ...formData, fullName: name, username: generateUsername(name) });
                  }}
                  placeholder="Ví dụ: Đàm Trung Anh"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Đăng Nhập (Username) *</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="damtrunganh"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-indigo-700 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số CCCD 12 Số (Định danh) *</label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={formData.identityCard}
                  onChange={(e) => setFormData({ ...formData, identityCard: e.target.value })}
                  placeholder="034205005539"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-purple-700 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ngày Sinh</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số Điện Thoại *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0358.xxx.xxx"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Kích Hoạt *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="trunganh@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã Số Thuế (MST)</label>
                <input
                  type="text"
                  value={formData.taxCode}
                  onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                  placeholder="8592019482"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Địa Chỉ Thường Trú (Theo CCCD)</label>
                <input
                  type="text"
                  value={formData.permanentAddress}
                  onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                  placeholder="Thôn 5A, Vũ Trung, Kiến Xương, Thái Bình"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-slate-700 mb-1">Gói Cước Bản Quyền Ban Đầu</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { code: 'BASIC', name: 'Gói Cơ Bản (BASIC)', desc: 'Tối đa 2 cơ sở, 30 phòng', price: '199.000 ₫/th' },
                    { code: 'PRO', name: 'Gói Chuyên Nghiệp (PRO)', desc: 'Không giới hạn cơ sở, Quota 100 phòng', price: '499.000 ₫/th' },
                    { code: 'ENTERPRISE', name: 'Gói Doanh Nghiệp (ENTERPRISE)', desc: 'Toàn bộ tính năng + AI OCR nhận diện đồng hồ', price: '999.000 ₫/th' }
                  ].map((pkg) => (
                    <div
                      key={pkg.code}
                      onClick={() => setFormData({ ...formData, packageCode: pkg.code })}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        formData.packageCode === pkg.code
                          ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold text-slate-900 text-xs">{pkg.name}</div>
                      <div className="text-[11px] font-extrabold text-indigo-700 font-mono mt-0.5">{pkg.price}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{pkg.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 font-medium">
            Định danh CCCD tự động kích hoạt tài khoản vai trò <strong className="text-slate-700">ROLE_STAFF</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              form="landlord-ai-form"
              className="btn-press flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Lưu Hồ Sơ & Kích Hoạt Chủ Trọ</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
