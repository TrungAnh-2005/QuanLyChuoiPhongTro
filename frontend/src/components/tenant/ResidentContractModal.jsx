import React, { useState, useRef } from 'react';
import {
  Sparkles,

  Eye,

  Camera,

  FileText,
  CheckCircle2,
  AlertTriangle,
  PenTool,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  X,
  Lock,
  Download,
  Printer
} from 'lucide-react';
import Modal from '../common/Modal';

export default function ResidentContractModal({
  isOpen,
  onClose,
  contract,
  onSignSuccess
}) {
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedTemporaryResidence, setAgreedTemporaryResidence] = useState(true);
  const [cccdNumber, setCccdNumber] = useState(contract?.tenantCccd || '001201012345');
  const [issueDate, setIssueDate] = useState('20/04/2021');
  const [issuePlace, setIssuePlace] = useState('Cục Cảnh sát QLHC về TTXH');
  const [permanentAddress, setPermanentAddress] = useState('Ba Đình, Hà Nội');
  const [cccdFrontUrl, setCccdFrontUrl] = useState(
    contract?.tenantCccdFrontUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop'
  );
  const [cccdBackUrl, setCccdBackUrl] = useState(
    contract?.tenantCccdBackUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop'
  );
  const [frontUploaded, setFrontUploaded] = useState(false);
  const [backUploaded, setBackUploaded] = useState(false);
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  const handleUploadFrontFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCccdFrontUrl(reader.result);
        setFrontUploaded(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadBackFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCccdBackUrl(reader.result);
        setBackUploaded(true);
      };
      reader.readAsDataURL(file);
    }
  };
  const [signatureType, setSignatureType] = useState('OTP'); // 'OTP' | 'DRAW'
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);
  const [pdfNotice, setPdfNotice] = useState(null);
  const isHolding = contract?.status === 'HOLDING' || contract?.status === 'PENDING_DEPOSIT' || contract?.status === 'PENDING';
  const isActive = contract?.status === 'ACTIVE' || signedSuccess;

  if (!contract) return null;

  const handleSendOtp = () => {
    setOtpSent(true);
  };

  const handleConfirmSign = (e) => {
    e.preventDefault();
    if (!agreedTerms) return;

    setIsSubmitting(true);
    const cccdData = {
      cccdNumber: cccdNumber.trim(),
      issueDate: issueDate.trim(),
      issuePlace: issuePlace.trim(),
      permanentAddress: permanentAddress.trim(),
      cccdFrontUrl,
      cccdBackUrl,
      consentTemporaryResidence: agreedTemporaryResidence
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setSignedSuccess(true);
      if (onSignSuccess) {
        onSignSuccess(contract.id, cccdData);
      }
    }, 700);
  };

  // Hàm tạo và tải file Hợp đồng PDF chuẩn pháp lý
  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setPdfNotice('Vui lòng cho phép mở popup trên trình duyệt để tải và in Hợp đồng PDF!');
      return;
    }

    const printHtml = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Hop_Dong_Thue_Phong_${contract.contractCode || 'HD'}.pdf</title>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 13pt;
            line-height: 1.5;
            color: #000;
            margin: 25mm 20mm 20mm 20mm;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .header-line {
            width: 160px;
            height: 1px;
            background: #000;
            margin: 4px auto 16px auto;
          }
          .title {
            font-size: 16pt;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 4px;
          }
          .code {
            font-size: 11pt;
            font-style: italic;
            margin-bottom: 24px;
          }
          .section-title {
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 14px;
            margin-bottom: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
          }
          table, th, td {
            border: 1px solid #000;
          }
          th, td {
            padding: 6px 10px;
            text-align: left;
          }
          .signature-box {
            display: flex;
            justify-content: space-between;
            margin-top: 36px;
            page-break-inside: avoid;
          }
          .signature-col {
            width: 45%;
            text-align: center;
          }
          .stamp-badge {
            display: inline-block;
            border: 2px solid #059669;
            color: #059669;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: bold;
            margin-top: 12px;
            font-size: 11pt;
          }
          @media print {
            @page { margin: 15mm; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="text-center font-bold">
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
          <span style="font-size: 12pt;">Độc lập - Tự do - Hạnh phúc</span>
          <div class="header-line"></div>
        </div>

        <div class="text-center">
          <div class="title uppercase">HỢP ĐỒNG THUÊ PHÒNG TRỌ ĐIỆN TỬ</div>
          <div class="code">Số: ${contract.contractCode || 'HD-2026-001'} • Ngày ký: ${contract.startDate || '01/01/2026'}</div>
        </div>

        <p>Hôm nay, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}, tại cơ sở ${contract.houseName || 'Hệ thống Quản lý Chuỗi Nhà Trọ'}, hai bên chúng tôi gồm có:</p>

        <div class="section-title">BÊN CHO THUÊ (BÊN A):</div>
        <p>
          - Đại diện: <strong>BAN QUẢN LÝ / CHỦ NHÀ TRỌ</strong><br>
          - Cơ sở: <strong>${contract.houseName || 'Cơ Sở 1 - Cầu Giấy'}</strong><br>
          - Điện thoại liên hệ: <strong>0912.888.666</strong><br>
          - Nền tảng chứng thực: Hệ thống Microservices SaaS Quản lý Chuỗi Trọ Việt
        </p>

        <div class="section-title">BÊN THUÊ PHÒNG (BÊN B):</div>
        <p>
          - Ông/Bà: <strong>${contract.tenantName || 'Nguyễn Văn An'}</strong><br>
          - Số CCCD/Định danh cá nhân: <strong>001201012345</strong> (Đã xác thực định danh 12 số)<br>
          - Số điện thoại: <strong>0987.654.321</strong><br>
          - Phòng đăng ký thuê: <strong>Phòng ${contract.roomNumber || 'P.101'}</strong>
        </p>

        <div class="section-title">ĐIỀU KHOẢN HỢP ĐỒNG:</div>
        <p>
          <strong>1. Thời hạn thuê:</strong> Từ ngày <strong>${contract.startDate || '01/01/2026'}</strong> đến hết ngày <strong>${contract.endDate || '31/12/2026'}</strong>.<br>
          <strong>2. Giá thuê phòng:</strong> <strong>${(contract.rentalPrice || 3500000).toLocaleString('vi-VN')} VNĐ/tháng</strong> (Thanh toán định kỳ hàng tháng trước ngày 05 qua VietQR).<br>
          <strong>3. Tiền đặt cọc bảo chứng:</strong> <strong>${(contract.depositAmount || 3500000).toLocaleString('vi-VN')} VNĐ</strong> (Được hoàn trả lại khi thanh lý hợp đồng đúng cam kết).<br>
          <strong>4. Biểu giá dịch vụ:</strong> Điện: 3.500 đ/kWh, Nước: 25.000 đ/m³, Rác & Wifi: 100.000 đ/tháng.<br>
          <strong>5. Quy định an toàn & cư trú:</strong> Bên B tuân thủ tối đa 2 người/phòng, khai báo tạm trú đầy đủ, không sang nhượng phòng trái phép.
        </p>

        <div class="signature-box">
          <div class="signature-col">
            <strong>ĐẠI DIỆN BÊN A (CHỦ TRỌ)</strong><br>
            <em>(Ký số & Đóng dấu điện tử)</em><br><br>
            <div class="stamp-badge">
              ✔ CHỨNG THỰC BỞI CHỦ TRỌ<br>
              <span style="font-size: 9pt; font-weight: normal;">Hệ Thống SaaS Quản Lý Trọ</span>
            </div>
          </div>
          <div class="signature-col">
            <strong>ĐẠI DIỆN BÊN B (KHÁCH THUÊ)</strong><br>
            <em>(Đã ký xác nhận điện tử e-Sign)</em><br><br>
            <div class="stamp-badge" style="border-color: #2563eb; color: #2563eb;">
              ✔ ĐÃ KÝ ĐIỆN TỬ E-SIGN<br>
              <span style="font-size: 9pt; font-weight: normal;">Xác thực qua OTP SĐT chính chủ</span>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Hợp Đồng Thuê Phòng Điện Tử (UC-T01)
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Mã HĐ: <span className="font-bold text-purple-700">{contract.contractCode}</span> • Phòng {contract.roomNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Tải Hợp Đồng PDF theo yêu cầu */}
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Tải hoặc in bản Hợp đồng thuê nhà có chữ ký số điện tử"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Hợp Đồng PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {signedSuccess || contract.status === 'ACTIVE' ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              {signedSuccess ? 'Ký Xác Nhận Hợp Đồng Thành Công!' : 'Hợp Đồng Điện Tử Đang Có Hiệu Lực'}
            </h3>
            <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
              Hợp đồng thuê <strong>Phòng {contract.roomNumber}</strong> đã được xác thực điện tử chính chủ (Trạng thái: <code className="text-emerald-700 font-bold font-mono">ACTIVE</code>).
            </p>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 max-w-lg mx-auto mb-5 text-left text-xs space-y-2">
              <div className="flex justify-between pb-1.5 border-b border-emerald-200/60">
                <span className="text-slate-600">Mã hợp đồng:</span>
                <span className="font-bold font-mono text-purple-700">{contract.contractCode}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-emerald-200/60">
                <span className="text-slate-600">Cơ sở nhà trọ:</span>
                <span className="font-bold text-slate-900">{contract.houseName || 'Cơ Sở 1 - Cầu Giấy'}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-emerald-200/60">
                <span className="text-slate-600">Thời hạn thuê:</span>
                <span className="font-bold text-slate-900">{contract.startDate} → {contract.endDate}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-emerald-200/60">
                <span className="text-slate-600">Giá thuê cố định:</span>
                <span className="font-bold text-purple-700">{(contract.rentalPrice || 3500000).toLocaleString('vi-VN')} đ/tháng</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tiền đặt cọc phòng:</span>
                <span className="font-bold text-emerald-700">{(contract.depositAmount || 3500000).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleDownloadPdf}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer btn-press"
              >
                <Download className="w-4 h-4" />
                <span>Tải File PDF (Bản Có Chữ Ký Số)</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        ) : (
          /* Luồng Ký Điện Tử e-Sign khi chưa ký */
          <form onSubmit={handleConfirmSign} className="py-4 space-y-4 text-xs">
            {isHolding && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5 shadow-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-950">⚠️ Bản Thảo Giữ Chỗ — Chưa Có Hiệu Lực Pháp Lý (Trạng thái: HOLDING)</div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    Phòng đang trong thời gian giữ chỗ tạm thời (15 phút). Hợp đồng chỉ chính thức phát sinh hiệu lực pháp lý sau khi hoàn tất chuyển khoản tiền đặt cọc và xác thực chữ ký điện tử.
                  </div>
                </div>
              </div>
            )}
            {pdfNotice && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center justify-between">
                <span>⚠️ {pdfNotice}</span>
                <button type="button" onClick={() => setPdfNotice(null)} className="text-rose-400 hover:text-rose-700 font-bold p-1 cursor-pointer">✕</button>
              </div>
            )}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 max-h-56 overflow-y-auto">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Tóm Tắt Các Điều Khoản Quan Trọng</h4>
              <p className="text-slate-600">• Bên thuê thanh toán tiền phòng định kỳ từ ngày 01 đến ngày 05 hàng tháng qua chuyển khoản VietQR.</p>
              <p className="text-slate-600">• Tiền đặt cọc được bảo chứng an toàn và quyết toán hoàn lại sau khi nghiệm thu trả phòng hợp lệ.</p>
              <p className="text-slate-600">• Tuân thủ nghiêm ngặt quy định PCCC và số người ở tối đa cho phép của phòng.</p>
            </div>

            {/* PHẦN ĐÍNH KÈM CCCD & KHAI BÁO TẠM TRÚ VNeID (TASK 2) */}
            <div className="p-4 bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-blue-50/90 border border-indigo-200/90 rounded-2xl space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-indigo-950 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>Hồ Sơ Căn Cước Công Dân (CCCD) & Khai Báo Tạm Trú VNeID</span>
                </div>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-bold rounded-md text-[10px]">
                  Bắt Buộc Pháp Lý
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Theo quy định Luật Cư Trú 2020, thông tin CCCD sẽ được tự động gửi đến Quản lý cơ sở để đăng ký Tạm Trú với Công an khu vực ngay khi bạn ký hợp đồng.
              </p>

              {/* Grid Nhập Liệu Định Danh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Số Căn Cước Công Dân (12 số) *</label>
                  <input
                    type="text"
                    required
                    value={cccdNumber}
                    onChange={(e) => setCccdNumber(e.target.value)}
                    placeholder="Ví dụ: 001201012345"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nơi Thường Trú / Quê Quán *</label>
                  <input
                    type="text"
                    required
                    value={permanentAddress}
                    onChange={(e) => setPermanentAddress(e.target.value)}
                    placeholder="Ví dụ: Ba Đình, Hà Nội"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Ngày Cấp CCCD</label>
                  <input
                    type="text"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    placeholder="20/04/2021"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nơi Cấp</label>
                  <input
                    type="text"
                    value={issuePlace}
                    onChange={(e) => setIssuePlace(e.target.value)}
                    placeholder="Cục Cảnh sát QLHC về TTXH"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Ảnh 2 Mặt CCCD & Nút Tải / Cập Nhật Ảnh (TASK 2 FIX) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Ảnh Chụp 2 Mặt Căn Cước Công Dân <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    (Hỗ trợ PNG, JPG, JPEG hoặc chụp ảnh trực tiếp)
                  </span>
                </div>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={frontInputRef}
                  onChange={handleUploadFrontFile}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={backInputRef}
                  onChange={handleUploadBackFile}
                  accept="image/*"
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mặt trước CCCD */}
                  <div className="space-y-1.5">
                    <div
                      onClick={() => frontInputRef.current?.click()}
                      className="relative rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 overflow-hidden bg-slate-900 group aspect-[16/10] cursor-pointer transition shadow-xs"
                      title="Bấm để chọn hoặc đổi ảnh mặt trước CCCD"
                    >
                      <img
                        src={cccdFrontUrl}
                        alt="Mặt trước CCCD"
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-75 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-bold shadow-md flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-indigo-600" /> Đổi ảnh mặt trước
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-center justify-between p-2">
                        <span className="text-[10px] font-bold text-white flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Mặt trước CCCD {frontUploaded && <span className="text-emerald-300 font-mono">(Đã cập nhật)</span>}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => frontInputRef.current?.click()}
                      className="w-full py-1.5 px-3 bg-white hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-300 text-indigo-700 text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{frontUploaded ? 'Đổi Ảnh Mặt Trước' : 'Tải Ảnh Mặt Trước'}</span>
                    </button>
                  </div>

                  {/* Mặt sau CCCD */}
                  <div className="space-y-1.5">
                    <div
                      onClick={() => backInputRef.current?.click()}
                      className="relative rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 overflow-hidden bg-slate-900 group aspect-[16/10] cursor-pointer transition shadow-xs"
                      title="Bấm để chọn hoặc đổi ảnh mặt sau CCCD"
                    >
                      <img
                        src={cccdBackUrl}
                        alt="Mặt sau CCCD"
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-75 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-bold shadow-md flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-indigo-600" /> Đổi ảnh mặt sau
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-center justify-between p-2">
                        <span className="text-[10px] font-bold text-white flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Mặt sau CCCD (Có chip) {backUploaded && <span className="text-emerald-300 font-mono">(Đã cập nhật)</span>}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => backInputRef.current?.click()}
                      className="w-full py-1.5 px-3 bg-white hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-300 text-indigo-700 text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{backUploaded ? 'Đổi Ảnh Mặt Sau' : 'Tải Ảnh Mặt Sau'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tích chọn ủy quyền tạm trú */}
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTemporaryResidence}
                  onChange={(e) => setAgreedTemporaryResidence(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded mt-0.5 shrink-0"
                />
                <span className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  Tôi đồng ý chuyển thông tin CCCD cho Quản lý cơ sở để tiến hành đăng ký Tạm Trú / Lưu Trú với Cơ quan Công an theo đúng quy định hiện hành.
                </span>
              </label>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="font-bold text-slate-800">
                Tôi đã đọc, hiểu rõ và đồng ý với toàn bộ các điều khoản hợp đồng thuê phòng trên.
              </span>
            </label>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!agreedTerms || isSubmitting}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? 'Đang xác thực e-Sign...' : 'Ký Xác Nhận Điện Tử'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
