import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Home,
  Phone,
  Mail,
  Loader2,
  Trash2,
  Settings,
  HelpCircle,
  Copy,
  AlertTriangle,
  Building2,
  ArrowLeftRight
} from 'lucide-react';
import { ocrIdCard, classifyCccdImage, validateCccdMatch, decodeCccdQrCode, parseCccdQrData } from '../../../services/aiService';
import { useData } from '../../../contexts/DataContext';

const FACILITIES = [
  { code: 'CS-01', name: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', shortName: 'Cơ Sở 1 - Cầu Giấy' },
  { code: 'CS-02', name: 'Nhà Trọ Bách Khoa - Cơ Sở 2', shortName: 'Cơ Sở 2 - Bách Khoa' },
  { code: 'CS-03', name: 'Nhà Trọ Đống Đa - Cơ Sở 3', shortName: 'Cơ Sở 3 - Đống Đa' }
];

const SAMPLE_CCCDS = [
  {
    label: '⭐ Đàm Văn Táo (Thái Bình - 1975)',
    fullName: 'ĐÀM VĂN TÁO',
    identityCard: '034075000679',
    birthDate: '1975-06-06',
    gender: 'NAM',
    hometown: 'Kiến Xương, Thái Bình',
    address: 'Thôn 5A, Vũ Trung, Kiến Xương, Thái Bình'
  },
  {
    label: '⭐ Đàm Trung Anh (Thái Bình - 2005)',
    fullName: 'ĐÀM TRUNG ANH',
    identityCard: '034205005539',
    birthDate: '2005-11-25',
    gender: 'NAM',
    hometown: 'Vũ Trung, Kiến Xương, Thái Bình',
    address: 'Thôn 5A, Vũ Trung, Kiến Xương, Thái Bình'
  },
  {
    label: 'Nguyễn Văn An (Thái Bình)',
    fullName: 'NGUYỄN VĂN AN',
    identityCard: '001099014523',
    birthDate: '1999-05-15',
    gender: 'NAM',
    hometown: 'Thái Thụy, Thái Bình',
    address: 'Số 45, Ngõ 165 Cầu Giấy, Phường Dịch Vọng, Cầu Giấy, Hà Nội'
  },
  {
    label: 'Trần Thị Hồng Phượng (Ninh Bình)',
    fullName: 'TRẦN THỊ HỒNG PHƯỢNG',
    identityCard: '037198023456',
    birthDate: '1998-11-20',
    gender: 'NỮ',
    hometown: 'Kim Sơn, Ninh Bình',
    address: 'Số 12, Phố Chùa Láng, Phường Láng Thượng, Đống Đa, Hà Nội'
  },
  {
    label: 'Phạm Minh Cường (Nam Định)',
    fullName: 'PHẠM MINH CƯỜNG',
    identityCard: '036097034567',
    birthDate: '1997-03-10',
    gender: 'NAM',
    hometown: 'Nam Trực, Nam Định',
    address: 'Số 88, Đường Tạ Quang Bửu, Phường Bách Khoa, Hai Bà Trưng, Hà Nội'
  },
  {
    label: 'Đỗ Thị Mai (Bắc Ninh)',
    fullName: 'ĐỖ THỊ MAI',
    identityCard: '019195045678',
    birthDate: '1995-08-25',
    gender: 'NỮ',
    hometown: 'Thuận Thành, Bắc Ninh',
    address: 'Số 102, Đường Trần Đại Nghĩa, Phường Đồng Tâm, Hai Bà Trưng, Hà Nội'
  },
  {
    label: 'Hoàng Văn Nam (Thanh Hóa)',
    fullName: 'HOÀNG VĂN NAM',
    identityCard: '038096056789',
    birthDate: '1996-09-02',
    gender: 'NAM',
    hometown: 'Hoằng Hóa, Thanh Hóa',
    address: 'Tổ 8, Phường Nghĩa Đô, Cầu Giấy, Hà Nội'
  }
];

export default function CreateTenantModal({ isOpen, onClose, onSaveTenant }) {
  const { rooms = [], tenants = [] } = useData();
  const [selectedHouseCode, setSelectedHouseCode] = useState('CS-01');

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

  // Lọc các phòng còn trống của cơ sở đang chọn (phòng có người ở tuyệt đối không hiện)
  const vacantRooms = useMemo(() => {
    return (rooms || []).filter((r) => {
      if ((r.houseCode || 'CS-01') !== selectedHouseCode) return false;
      if (r.status !== 'AVAILABLE') return false;
      if (r.occupants && r.occupants > 0) return false;
      return true;
    });
  }, [rooms, selectedHouseCode]);

  // Form fields
  const [formData, setFormData] = useState({
    fullName: '',
    identityCard: '',
    birthDate: '',
    gender: 'NAM',
    hometown: '',
    address: '',
    phone: '',
    email: '',
    room: '',
    deposit: 3500000,
    contractDuration: 12
  });

  // Tự động đồng bộ phòng và tiền cọc khi đổi cơ sở hoặc danh sách phòng trống thay đổi
  useEffect(() => {
    if (vacantRooms.length > 0) {
      const isCurrentValid = vacantRooms.some((r) => r.number === formData.room);
      if (!isCurrentValid) {
        const firstRoom = vacantRooms[0];
        setFormData((prev) => ({
          ...prev,
          room: firstRoom.number,
          deposit: firstRoom.price || 3500000
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        room: ''
      }));
    }
  }, [vacantRooms, selectedHouseCode]);

  const handleRoomChange = (roomNumber) => {
    const chosen = vacantRooms.find((r) => r.number === roomNumber);
    setFormData((prev) => ({
      ...prev,
      room: roomNumber,
      deposit: chosen?.price || prev.deposit
    }));
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

      // Cho phép chọn ảnh và xem trước mượt mà
      // TUYỆT ĐỐI KHÔNG kết luận hay chặn lỗi sớm tại bước chọn ảnh (phải quét 2 ảnh mới kết luận)
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

      // Cho phép chọn ảnh và xem trước mượt mà
      setBackImage(file);
      setBackPreview(URL.createObjectURL(file));
    }
  };

  const handleSelectSample = (sample) => {
    setFormData((prev) => ({
      ...prev,
      fullName: sample.fullName,
      identityCard: sample.identityCard,
      birthDate: sample.birthDate,
      gender: sample.gender,
      hometown: sample.hometown,
      address: sample.address,
      phone: '',
      email: ''
    }));
    setScanSuccess(true);
    setFrontError(null);
    setBackError(null);
    setSubmitError(null);
    setScanMessage(`Đã nạp thành công dữ liệu mẫu CCCD: ${sample.fullName}`);

    if (backImage) {
      const matchCheck = validateCccdMatch(sample, backImage, '', frontImage);
      if (!matchCheck.isMatch) {
        setMismatchError(matchCheck.error);
      } else {
        setMismatchError(null);
      }
    } else {
      setMismatchError(null);
    }
  };

  const handleScanError = (err) => {
    const errType = err.errorType || '';

    if (errType === 'SWAPPED_SIDES' || errType === 'SWAPPED_BOTH' || err.canSwap) {
      // Trường hợp 3: Gửi nhầm mặt trước mặt sau (đảo vị trí 2 mặt)
      setSwapError({
        title: err.title || 'Gửi Nhầm Mặt Trước & Mặt Sau',
        message: err.message || 'Bạn đã gửi nhầm vị trí: Ô "Mặt trước" đang chứa Mặt Sau và ô "Mặt sau" đang chứa Mặt Trước!'
      });
    } else if (errType === 'SWAPPED_SIDE_FRONT') {
      // Trường hợp 3: Chỉ tải 1 mặt nhưng ô Mặt Trước lại là Mặt Sau
      setFrontError({
        title: err.title || 'Gửi Nhầm Mặt Sau Vào Ô Mặt Trước',
        message: err.message || 'Bạn đang tải Mặt Sau vào ô Mặt Trước! Vui lòng tải đúng Mặt Trước (có ảnh chân dung và mã QR) vào ô này.'
      });
    } else if (errType === 'SWAPPED_SIDE_BACK') {
      // Trường hợp 3: Tải Mặt Trước vào ô Mặt Sau
      setBackError({
        title: err.title || 'Gửi Nhầm Mặt Trước Vào Ô Mặt Sau',
        message: err.message || 'Bạn đang tải Mặt Trước vào ô Mặt Sau! Vui lòng tải đúng Mặt Sau (có chip vi mạch và mã MRZ) vào ô này.'
      });
    } else if (errType === 'DUPLICATE_FRONT' || errType === 'DUPLICATE_BACK') {
      setSwapError({
        title: err.title || 'Tải Trùng Mặt',
        message: err.message
      });
    } else if (errType === 'MISMATCH') {
      // Trường hợp 2: Mặt trước mặt sau không trùng khớp
      setMismatchError(err.message || 'CẢNH BÁO BẤT THƯỜNG: Ảnh Mặt Trước và Mặt Sau KHÔNG CÙNG MỘT NGƯỜI!');
    } else if (errType === 'BOTH_NOT_CCCD') {
      // Trường hợp 6: Cả 2 ảnh không phải CCCD
      setGlobalScanError({
        title: err.title || 'Cả 2 Ảnh Không Phải CCCD',
        message: err.message || 'Cả 2 ảnh tải lên đều không phải là Căn Cước Công Dân hợp lệ (ví dụ: ảnh đồng hồ điện/nước, hóa đơn, thú cưng, đồ vật...). Vui lòng tải đúng ảnh thẻ CCCD!'
      });
    } else if (errType === 'FRONT_NOT_CCCD') {
      // Trường hợp 4: Ảnh mặt trước không phải CCCD
      setFrontError({
        title: err.title || 'Ảnh Mặt Trước Không Phải CCCD',
        message: err.message || 'Ảnh tải lên ở ô Mặt Trước không phải là Căn Cước Công Dân!'
      });
    } else if (errType === 'BACK_NOT_CCCD') {
      // Trường hợp 5: Ảnh mặt sau không phải CCCD
      setBackError({
        title: err.title || 'Ảnh Mặt Sau Không Phải CCCD',
        message: err.message || 'Ảnh tải lên ở ô Mặt Sau không phải là Căn Cước Công Dân!'
      });
    } else if (errType === 'GLARE') {
      // Trường hợp 7: Ảnh bị loá
      setGlobalScanError({
        title: err.title || 'Ảnh Bị Loá Sáng',
        message: err.message || 'Ảnh CCCD bị chói loá sáng. Vui lòng chụp góc hơi nghiêng để tránh bóng phản chiếu!'
      });
    } else if (errType === 'BLUR') {
      // Trường hợp 8: Ảnh bị mờ
      setGlobalScanError({
        title: err.title || 'Ảnh Bị Mờ',
        message: err.message || 'Ảnh CCCD bị mờ, không rõ chi tiết. Vui lòng chạm lấy nét và chụp lại!'
      });
    } else if (errType === 'MOTION_BLUR') {
      // Trường hợp 9: Ảnh bị nhoè
      setGlobalScanError({
        title: err.title || 'Ảnh Bị Nhoè (Rung Tay)',
        message: err.message || 'Ảnh CCCD bị rung tay nhoè nét chuyển động. Vui lòng giữ chắc tay và chụp lại!'
      });
    } else if (errType === 'NOT_CCCD') {
      setFrontError({
        title: err.title || 'Ảnh Không Phải CCCD',
        message: err.message || 'Hệ thống không nhận diện được thẻ Căn Cước Công Dân hợp lệ.'
      });
    } else {
      setGlobalScanError({
        title: 'Lỗi Quét AI',
        message: err.message || 'Không thể trích xuất thông tin từ ảnh. Vui lòng kiểm tra lại ảnh hoặc nhập thủ công.'
      });
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
    setScanMessage('Đang phân tích 2 mặt CCCD và trích xuất dữ liệu bằng AI Vision OCR...');

    try {
      const data = await ocrIdCard(fImg, bImg);
      if (data) {
        setFormData((prev) => ({
          ...prev,
          fullName: data.fullName || prev.fullName,
          identityCard: data.idNumber || prev.identityCard,
          birthDate: data.dateOfBirth || prev.birthDate,
          gender: data.gender || prev.gender,
          hometown: data.hometown || prev.hometown,
          address: data.permanentAddress || prev.address,
        }));
        setScanSuccess(true);
        setMismatchError(null);
        setSwapError(null);
        setGlobalScanError(null);
        setScanMessage(data.notes || '✓ Trích xuất thông tin CCCD thành công 100%! Mặt trước và mặt sau hoàn toàn trùng khớp.');
      }
    } catch (err) {
      console.error('Lỗi quét AI:', err);
      handleScanError(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanWithAi = () => {
    if (!frontImage && !backImage) {
      setGlobalScanError({
        title: 'Chưa Tải Ảnh CCCD',
        message: 'Hệ thống yêu cầu quét đủ 2 ảnh (Mặt trước & Mặt sau) mới kết luận trường hợp! Vui lòng tải lên cả 2 ảnh CCCD.'
      });
      return;
    }
    if (!frontImage) {
      setFrontError({
        title: 'Chưa Tải Ảnh Mặt Trước',
        message: 'Hệ thống yêu cầu quét đủ 2 ảnh mới kết luận trường hợp! Vui lòng tải ảnh Mặt Trước CCCD.'
      });
      return;
    }
    if (!backImage) {
      setBackError({
        title: 'Chưa Tải Ảnh Mặt Sau',
        message: 'Hệ thống yêu cầu quét đủ 2 ảnh mới kết luận trường hợp! Vui lòng tải thêm ảnh Mặt Sau CCCD.'
      });
      return;
    }
    triggerScan(frontImage, backImage);
  };

  const handleSwapSides = async () => {
    const tempImg = frontImage;
    const tempPrev = frontPreview;
    const newFrontImg = backImage;
    const newFrontPrev = backPreview;
    const newBackImg = tempImg;
    const newBackPrev = tempPrev;

    setFrontImage(newFrontImg);
    setFrontPreview(newFrontPrev);
    setBackImage(newBackImg);
    setBackPreview(newBackPrev);

    setFrontError(null);
    setBackError(null);
    setMismatchError(null);
    setSwapError(null);
    setGlobalScanError(null);

    // Tự động quét lại ngay sau khi hoán đổi 2 mặt đúng vị trí
    if (newFrontImg) {
      await triggerScan(newFrontImg, newBackImg);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!formData.fullName || !formData.identityCard) {
      setSubmitError('Họ tên và Số CCCD là thông tin bắt buộc!');
      return;
    }
    if (!formData.room) {
      setSubmitError('Vui lòng chọn cơ sở có phòng trống và chọn phòng cần thuê!');
      return;
    }

    const selectedFacilityObj = FACILITIES.find((f) => f.code === selectedHouseCode);
    const selectedRoomObj = vacantRooms.find((r) => r.number === formData.room);

    const newTenant = {
      id: `T${Date.now().toString().slice(-4)}`,
      name: formData.fullName,
      fullName: formData.fullName,
      phone: formData.phone || '',
      cccd: formData.identityCard,
      gender: formData.gender,
      dob: formData.birthDate,
      hometown: formData.hometown,
      address: formData.address,
      email: formData.email || '',
      houseCode: selectedHouseCode,
      house: selectedFacilityObj?.name || 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
      room: formData.room,
      rooms: [formData.room],
      status: 'ACTIVE',
      contractDuration: formData.contractDuration,
      deposit: Number(formData.deposit) || selectedRoomObj?.price || 3500000,
      createdAt: new Date().toISOString()
    };

    if (onSaveTenant) {
      onSaveTenant(newTenant);
    }
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-hidden">
      <div className="relative bg-white border border-slate-200/90 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] my-auto">
        {/* Header (Cố định ở trên) */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-purple-50 to-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-600/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Thêm Khách Thuê Mới
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  Tích Hợp AI OCR
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Tải ảnh CCCD để hệ thống tự động nhận diện và điền hồ sơ khách thuê
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body (Cuộn mượt mà bên trong, bắt đầu từ đỉnh) */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">

          {/* Quick Sample Selector */}
          <div className="p-3 bg-purple-50/50 border border-purple-200/70 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-purple-600" />
                <span>Nạp nhanh mẫu CCCD chuẩn để kiểm thử (Test 1-Click):</span>
              </span>
              <span className="text-[10px] text-purple-600 font-medium">Bấm chọn để nạp tức thì</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_CCCDS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className="px-2.5 py-1 bg-white hover:bg-purple-100 text-slate-700 hover:text-purple-800 border border-purple-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload CCCD Section */}
          <div className="bg-gradient-to-br from-slate-50 to-purple-50/30 border border-purple-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span>Ảnh Căn Cước Công Dân (CCCD)</span>
              </div>
              <span className="text-[11px] text-purple-700 font-medium">
                Hỗ trợ ảnh chụp JPG, PNG (nghiêng, lóa)
              </span>
            </div>

            {/* Cảnh báo gửi nhầm mặt trước & mặt sau */}
            {swapError && (
              <div className="p-3.5 bg-amber-50 border-2 border-amber-400 rounded-2xl text-amber-950 text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-amber-950 uppercase tracking-wide">⚠️ {swapError.title || 'Gửi Nhầm Mặt Trước & Mặt Sau'}</p>
                    <p className="leading-relaxed font-normal text-amber-900 mt-0.5">{swapError.message}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSwapSides}
                  className="shrink-0 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer text-xs transition-all hover:scale-102 active:scale-98"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Đổi Chỗ 2 Mặt Ngay</span>
                </button>
              </div>
            )}

            {/* Cảnh báo không trùng khớp giữa mặt trước và mặt sau */}
            {mismatchError && (
              <div className="p-3 bg-rose-50 border-2 border-rose-400 rounded-2xl text-rose-900 text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-black text-rose-950 uppercase tracking-wide">⚠️ Phát hiện thông tin không trùng khớp</p>
                  <p className="whitespace-pre-line leading-relaxed font-normal">{mismatchError}</p>
                </div>
              </div>
            )}

            {/* Cảnh báo lỗi quét tổng thể (Cả 2 ảnh không phải CCCD, ảnh bị loá, ảnh bị mờ, ảnh bị nhoè) */}
            {globalScanError && (
              <div className="p-3.5 bg-rose-50 border-2 border-rose-400 rounded-2xl text-rose-950 text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-black text-rose-950 uppercase tracking-wide">⚠️ {globalScanError.title || 'Lỗi Kiểm Tra Ảnh CCCD'}</p>
                  <p className="whitespace-pre-line leading-relaxed font-normal">{globalScanError.message}</p>
                </div>
              </div>
            )}

            {/* Nút hoán đổi nhanh khi người dùng đã chọn cả 2 mặt */}
            {frontPreview && backPreview && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSwapSides}
                  className="px-3 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer hover:border-purple-400"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-purple-600" />
                  <span>Đổi vị trí 2 mặt CCCD</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mặt trước */}
              <div className="border-2 border-dashed border-purple-200 rounded-2xl p-3 bg-white hover:border-purple-400 transition-colors flex flex-col items-center justify-center text-center relative group min-h-[140px]">
                {frontPreview ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <img
                      src={frontPreview}
                      alt="CCCD Mặt trước"
                      className="max-h-28 rounded-lg object-contain shadow-xs border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFrontImage(null);
                        setFrontPreview(null);
                        setFrontError(null);
                        setMismatchError(null);
                      }}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="mt-1 text-[11px] font-bold text-emerald-700">✓ Đã tải mặt trước</span>
                  </div>
                ) : (
                  <div
                    onClick={() => frontInputRef.current?.click()}
                    className="cursor-pointer flex flex-col items-center py-2"
                  >
                    <UploadCloud className="w-8 h-8 text-purple-500 mb-1" />
                    <span className="font-bold text-slate-800">Tải ảnh Mặt Trước CCCD *</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Nhấp hoặc kéo thả file vào đây</span>
                  </div>
                )}
                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFrontFileChange}
                  className="hidden"
                />

                {/* Cảnh báo lỗi ảnh mặt trước */}
                {frontError && (
                  <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-medium flex items-start gap-2 animate-fadeIn w-full text-left">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-950">{frontError.title || 'Lỗi ảnh mặt trước'}</p>
                      <p className="leading-relaxed mt-0.5">{frontError.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Mặt sau */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-3 bg-white hover:border-purple-400 transition-colors flex flex-col items-center justify-center text-center relative group min-h-[140px]">
                {backPreview ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <img
                      src={backPreview}
                      alt="CCCD Mặt sau"
                      className="max-h-28 rounded-lg object-contain shadow-xs border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBackImage(null);
                        setBackPreview(null);
                        setBackError(null);
                        setMismatchError(null);
                      }}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="mt-1 text-[11px] font-bold text-emerald-700">✓ Đã tải mặt sau</span>
                  </div>
                ) : (
                  <div
                    onClick={() => backInputRef.current?.click()}
                    className="cursor-pointer flex flex-col items-center py-2"
                  >
                    <UploadCloud className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="font-bold text-slate-700">Tải ảnh Mặt Sau CCCD *</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Bắt buộc đủ 2 mặt để AI đối soát 9 trường hợp</span>
                  </div>
                )}
                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBackFileChange}
                  className="hidden"
                />

                {/* Cảnh báo lỗi ảnh mặt sau */}
                {backError && (
                  <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-medium flex items-start gap-2 animate-fadeIn w-full text-left">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-950">{backError.title || 'Lỗi ảnh mặt sau'}</p>
                      <p className="leading-relaxed mt-0.5">{backError.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nút Quét AI */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                disabled={(!frontImage && !backImage) || isScanning}
                onClick={handleScanWithAi}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer btn-press"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang đối soát 2 mặt & trích xuất dữ liệu bằng AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>⚡ Quét & Đối Soát 2 Mặt CCCD Bằng AI Vision OCR</span>
                  </>
                )}
              </button>
            </div>

            {/* Thông báo quét thành công */}
            {scanSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="leading-relaxed">{scanMessage}</span>
              </div>
            )}
          </div>

          {/* Form điền thông tin */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <User className="w-4 h-4 text-purple-600" />
                <span>Hồ Sơ Khách Thuê (Cho Phép Kiểm Tra & Chỉnh Sửa Trực Tiếp)</span>
              </div>
              <span className="text-[11px] text-slate-500">
                ✏️ Bạn có thể sửa đổi bất kỳ ô nào bên dưới
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="NGUYỄN VĂN AN"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500 focus:bg-white transition-all uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Số Căn Cước Công Dân (12 số) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.identityCard}
                  onChange={(e) => setFormData({ ...formData, identityCard: e.target.value })}
                  placeholder="001099012345"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Giới tính
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                >
                  <option value="NAM">NAM</option>
                  <option value="NỮ">NỮ</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0987654321"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="khachthue@gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Quê quán / Nơi ĐKKS
                </label>
                <input
                  type="text"
                  value={formData.hometown}
                  onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                  placeholder="Thái Thụy, Thái Bình"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nơi thường trú
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Số 45, Cầu Giấy, Hà Nội"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Cơ sở thuê *</span>
                </label>
                <select
                  value={selectedHouseCode}
                  onChange={(e) => setSelectedHouseCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer"
                >
                  {FACILITIES.map((f) => {
                    const countVacant = (rooms || []).filter((r) => {
                      if ((r.houseCode || 'CS-01') !== f.code) return false;
                      if (r.status !== 'AVAILABLE') return false;
                      if (r.occupants && r.occupants > 0) return false;
                      return true;
                    }).length;
                    return (
                      <option key={f.code} value={f.code}>
                        {f.name} ({countVacant} phòng trống)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-purple-600" />
                    <span>Phòng thuê còn trống *</span>
                  </span>
                  {vacantRooms.length > 0 && (
                    <span className="text-[10px] text-emerald-600 font-bold">
                      {vacantRooms.length} phòng sẵn sàng
                    </span>
                  )}
                </label>
                {vacantRooms.length > 0 ? (
                  <select
                    value={formData.room}
                    onChange={(e) => handleRoomChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-purple-700 focus:outline-none focus:border-purple-500 focus:bg-white transition-all cursor-pointer"
                  >
                    {vacantRooms.map((r) => (
                      <option key={r.number} value={r.number}>
                        Phòng {r.number} - {r.floor} ({r.area}m² - {(r.price || 3500000).toLocaleString('vi-VN')} đ/tháng)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                    ⚠️ Cơ sở này hiện đã kín phòng (không còn phòng trống)!
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Tiền cọc bảo chứng (VNĐ)
                </label>
                <input
                  type="number"
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Cảnh báo lỗi submit nếu thiếu thông tin */}
            {submitError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 transition-all cursor-pointer btn-press"
              >
                Lưu Hồ Sơ Khách Thuê
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
