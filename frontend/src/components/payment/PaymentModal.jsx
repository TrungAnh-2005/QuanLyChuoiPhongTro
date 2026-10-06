import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  X,
  CreditCard,
  QrCode,
  CheckCircle2,
  Copy,
  Building2,
  Smartphone,
  ShieldCheck,
  Receipt,
  Download,
  Check,
  ExternalLink,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Settings,
  HelpCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import {
  createVNPayPaymentUrl,
  VNPAY_TEST_CARD,
  getVNPayConfig,
  saveVNPayConfig,
  VNPAY_DEVREG_URL
} from '../../services/vnpayService';
import {
  createMoMoPaymentUrl,
  MOMO_TEST_ACCOUNT,
  getMoMoConfig,
  saveMoMoConfig,
  MOMO_DEVELOPERS_URL
} from '../../services/momoService';

import {
  generateSePayQrUrl,
  getSePayConfig,
  saveSePayConfig,
  simulateSePayWebhookPayload,
  checkSePayTransaction,
  SEPAY_PORTAL_URL,
  SEPAY_DOCS_URL
} from '../../services/sepayService';

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  invoice = {
    code: 'HD-202609-01',
    room: 'P.101',
    tenant: 'Nguyễn Văn Khách Thuê',
    total: 4037500,
    roomFee: 3500000,
    elec: 262500,
    water: 175000,
    service: 100000
  }
}) {
  if (!isOpen) return null;

  const navigate = useNavigate();
  const [method, setMethod] = useState('SEPAY'); // 'SEPAY' | 'VNPAY' | 'MOMO'
  const [sepayApiKey, setSepayApiKey] = useState(() => getSePayConfig().apiKey);
  const [sepayBank, setSepayBank] = useState(() => getSePayConfig().bank);
  const [sepayAcc, setSepayAcc] = useState(() => getSePayConfig().accountNumber);
  const [isCheckingSepay, setIsCheckingSepay] = useState(false);
  const [sepayStatusMsg, setSepayStatusMsg] = useState(null);
  const [detectedTx, setDetectedTx] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const modalOpenedAt = React.useRef(Date.now());

  // Cấu hình Sandbox tùy chỉnh
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [vnpayTmn, setVnpayTmn] = useState(() => getVNPayConfig().tmnCode || 'JDWJCCLC');
  const [vnpaySecret, setVnpaySecret] = useState(() => getVNPayConfig().hashSecret || 'RFQIDMWHCGBYGTCJPIGLEVGQGNQKAJGM');
  const [momoPartner, setMomoPartner] = useState(() => getMoMoConfig().partnerCode || 'MOMO');
  const [configToast, setConfigToast] = useState(null);

  const handleSaveSandboxConfig = (e) => {
    e.preventDefault();
    saveVNPayConfig({ tmnCode: vnpayTmn, hashSecret: vnpaySecret });
    saveMoMoConfig({ partnerCode: momoPartner });
    saveSePayConfig({ apiKey: sepayApiKey, bank: sepayBank, accountNumber: sepayAcc });
    setConfigToast('Đã lưu cấu hình SePay, VNPay và MoMo thành công!');
    setTimeout(() => {
      setConfigToast(null);
      setShowConfigModal(false);
    }, 1200);
  };

  const isSaas = Boolean(
    invoice.isSaas ||
    invoice.packageCode ||
    invoice.packageName ||
    String(invoice.id).startsWith('SAAS') ||
    String(invoice.code).includes('HD-SAAS')
  );

  const invoiceTotal = Number(invoice.total ?? invoice.amount ?? 4037500);
  const invoiceCode = invoice.code || (isSaas ? 'HD-SAAS' : 'HD');
  const invoiceRoom = isSaas ? (invoice.packageName || invoice.packageCode || 'Gói Bản Quyền SaaS') : (invoice.room || 'Phòng');
  const invoiceTenant = isSaas ? (invoice.providerName || 'CTCP SaaS Trọ Việt (Web Admin)') : (invoice.tenant || invoice.landlordName || 'Khách thuê');

  const sepayCfg = getSePayConfig();
  const bankInfo = {
    bankName: sepayBank || sepayCfg.bank || 'MBBank',
    accountNumber: sepayAcc || sepayCfg.accountNumber || '35825112005',
    accountName: sepayCfg.accountName || 'DAM TRUNG ANH',
    content: isSaas ? invoiceCode : `${invoiceCode} ${invoiceRoom}`.replace(/\s+/g, ' ').trim()
  };

  // Tự động lắng nghe SePay ngầm: Khi chuyển khoản xong -> Tự gạch nợ thành công tức thì!
  React.useEffect(() => {
    if (!isOpen || isDone || (method !== 'SEPAY' && method !== 'VIETQR')) return;

    let isMounted = true;
    const checkPayment = async () => {
      try {
        const res = await checkSePayTransaction({
          invoiceCode,
          amount: invoiceTotal,
          accountNumber: bankInfo.accountNumber,
          sinceTimestamp: modalOpenedAt.current
        });

        if (res.success && isMounted) {
          setDetectedTx(res.transaction);
          setIsDone(true);
          if (onSuccess) {
            onSuccess(invoice, 'SEPAY');
          }
        }
      } catch (err) {
        // silent
      }
    };

    // Kiểm tra ngay lập tức khi mở modal
    checkPayment();

    // Lặp lại mỗi 2 giây
    const pollTimer = setInterval(checkPayment, 5000);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, [isOpen, isDone, method, invoiceCode, invoiceTotal, bankInfo.accountNumber, invoice, onSuccess]);

  // 1. Mở cổng VNPay Sandbox bên ngoài trực tiếp
  const handleOpenVNPaySandbox = async () => {
    setIsRedirecting(true);
    try {
      // Lưu lại thông tin hóa đơn đang thanh toán để khi redirect về nhận diện chính xác 100%
      try {
        localStorage.setItem('rental_pending_payment', JSON.stringify({
          id: invoice.id,
          code: invoiceCode,
          room: invoiceRoom,
          total: invoiceTotal,
          type: isSaas ? 'SAAS' : 'ROOM',
          timestamp: Date.now()
        }));
      } catch {}

      const paymentUrl = await createVNPayPaymentUrl({
        invoiceId: invoice.id || invoice.room || invoice.code || '101',
        amount: invoiceTotal,
        orderInfo: isSaas ? `Nop cuoc SaaS ${invoiceCode}` : `Thanh toan ${invoiceCode} ${invoiceRoom}`,
        bankCode: 'NCB'
      });
      window.location.href = paymentUrl;
    } catch (err) {
      console.error('Lỗi tạo URL VNPay:', err);
      setIsRedirecting(false);
      alert('Không thể tạo URL VNPay. Vui lòng kiểm tra lại cấu hình kết nối Sandbox.');
    }
  };

  // 2. Mở cổng MoMo Sandbox API (Mở tab mới để tránh mất màn hình khi MoMo desktop tải chậm)
  const handleOpenMoMoSandbox = async () => {
    setIsRedirecting(true);
    try {
      try {
        localStorage.setItem('rental_pending_payment', JSON.stringify({
          id: invoice.id,
          code: invoiceCode,
          room: invoiceRoom,
          total: invoiceTotal,
          type: isSaas ? 'SAAS' : 'ROOM',
          timestamp: Date.now()
        }));
      } catch {}

      const payUrl = await createMoMoPaymentUrl({
        invoiceId: invoice.id || invoice.room || invoice.code || '101',
        amount: invoiceTotal,
        orderInfo: isSaas ? `Nop cuoc SaaS ${invoiceCode}` : `Thanh toan ${invoiceCode} ${invoiceRoom}`
      });
      setIsRedirecting(false);
      if (payUrl) {
        window.open(payUrl, '_blank');
      } else {
        throw new Error('Không nhận được liên kết thanh toán từ MoMo.');
      }
    } catch (err) {
      console.error('Lỗi tạo URL MoMo:', err);
      setIsRedirecting(false);
      alert('Không thể kết nối cổng MoMo Sandbox. Vui lòng kiểm tra lại cấu hình kết nối.');
    }
  };

  // Kiểm tra giao dịch qua SePay API
  const handleCheckSepay = async () => {
    setIsCheckingSepay(true);
    setSepayStatusMsg(null);
    try {
      const res = await checkSePayTransaction({
        invoiceCode,
        amount: invoiceTotal,
        accountNumber: bankInfo.accountNumber
      });
      if (res.success) {
        setSepayStatusMsg('Đã phát hiện giao dịch thành công trên SePay!');
        setTimeout(() => handleConfirmSimulation('SEPAY'), 800);
      } else {
        setSepayStatusMsg('Chưa phát hiện giao dịch mới trên SePay. Vui lòng chuyển khoản đúng nội dung hoặc bấm "Mô Phỏng SePay Webhook" để kiểm tra.');
      }
    } catch {
      setSepayStatusMsg('Không thể kết nối máy chủ SePay.');
    } finally {
      setIsCheckingSepay(false);
    }
  };

  // Giả lập SePay Webhook bắn sang hệ thống gạch nợ tự động
  const handleSimulateSepayWebhook = () => {
    setIsProcessing(true);
    setSepayStatusMsg('Đang nhận SePay Webhook và đối soát tự động...');
    setTimeout(() => {
      handleConfirmSimulation('SEPAY');
    }, 900);
  };

  // Xác nhận thanh toán (Mô phỏng tức thì cho VNPay / MoMo / VietQR)
  const handleConfirmSimulation = (selectedMethod) => {
    const finalMethod = selectedMethod || method;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsDone(true);
      if (onSuccess) {
        onSuccess(invoice, finalMethod);
      }
    }, 800);
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/65 z-50 flex items-center justify-center p-2 sm:p-4 modal-backdrop-smooth">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] modal-content-spring">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-purple-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-600/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Cổng Thanh Toán Trực Tuyến
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700">
                  Sandbox v2.1
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Hóa đơn <span className="font-mono font-bold text-purple-700">{invoiceCode}</span> • {invoiceRoom} ({invoiceTenant})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
              title="Cài đặt mã kết nối VNPay / MoMo Sandbox"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isDone ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-black text-emerald-700">
                  Thanh Toán Thành Công!
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Hóa đơn <strong className="text-teal-700">{invoice.code}</strong> ({invoiceRoom}) đã được SePay ghi nhận và gạch nợ thành công!
                </p>
                {detectedTx && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 text-left space-y-1 font-mono">
                    <div>• Ngân hàng: <strong>{detectedTx.bank_brand_name || 'MBBank'}</strong></div>
                    <div>• Số tiền: <strong>{Number(detectedTx.amount_in || invoiceTotal).toLocaleString('vi-VN')} đ</strong></div>
                    <div>• Mã giao dịch: <strong>{detectedTx.reference_number || 'FT26278857077324'}</strong></div>
                    <div>• Nội dung: <strong>{detectedTx.transaction_content}</strong></div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all btn-press cursor-pointer"
              >
                Đóng & Quay Lại
              </button>
            </div>
          ) : (
            <>
              {/* Payment Methods Tabs (VNPay, MoMo, VietQR) */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('VNPAY')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all duration-200 btn-press cursor-pointer ${
                    method === 'VNPAY'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>VNPay Sandbox</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('MOMO')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all duration-200 btn-press cursor-pointer ${
                    method === 'MOMO'
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/25 ring-2 ring-pink-500/20'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>MoMo Sandbox</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('SEPAY')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all duration-200 btn-press cursor-pointer ${
                    method === 'SEPAY'
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/25 ring-2 ring-teal-500/20'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <div className="flex flex-col items-start text-left">
                    <span className="leading-tight font-black">SePay (VietQR)</span>
                    <span className="text-[9px] opacity-90 font-medium">Tự động gạch nợ</span>
                  </div>
                </button>
              </div>

              {/* Amount Display */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-600 font-semibold text-xs">Số tiền thanh toán:</span>
                <span className="font-mono font-black text-purple-700 text-lg">
                  {invoiceTotal.toLocaleString('vi-VN')} đ
                </span>
              </div>

              {/* ========================================================================= */}
              {/* TAB 1: VNPAY SANDBOX                                                      */}
              {/* ========================================================================= */}
              {method === 'VNPAY' && (
                <div className="space-y-3.5">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 border border-blue-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-blue-900 text-sm">Cổng VNPay Sandbox</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                        TEST NCB
                      </span>
                    </div>

                    <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                      Hệ thống kết nối cổng VNPay Sandbox. Bạn có thể thanh toán trực quan ngay hoặc mở trực tiếp trang VNPay:
                    </p>

                    {/* Test Card Quick Copy Box */}
                    <div className="bg-white rounded-xl p-3 border border-blue-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Ngân hàng test:</span>
                        <span className="font-bold text-slate-900">{VNPAY_TEST_CARD.bank}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Số thẻ test:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {VNPAY_TEST_CARD.cardNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(VNPAY_TEST_CARD.cardNumber, 'vnpCard')}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                            title="Sao chép số thẻ"
                          >
                            {copiedField === 'vnpCard' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Tên chủ thẻ:</span>
                        <span className="font-bold text-slate-800">{VNPAY_TEST_CARD.cardHolder}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Ngày phát hành:</span>
                          <span className="font-mono font-bold text-slate-800">{VNPAY_TEST_CARD.issueDate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Mã OTP test:</span>
                          <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {VNPAY_TEST_CARD.otp}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions for VNPay */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={isRedirecting}
                      onClick={handleOpenVNPaySandbox}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 btn-press cursor-pointer disabled:opacity-60"
                    >
                      {isRedirecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang chuyển hướng sang VNPay Sandbox...</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          <span>🌐 Mở Cổng Thanh Toán VNPay Sandbox (Chuyển Hướng Bên Ngoài)</span>
                        </>
                      )}
                    </button>

                  </div>

                  {/* Hướng dẫn đăng ký Sandbox */}
                  <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Hướng dẫn đăng ký tài khoản VNPay Sandbox riêng:</span>
                    </div>
                    <p className="text-[10px] text-blue-800 leading-relaxed">
                      Bạn có thể đăng ký miễn phí tại{' '}
                      <a
                        href={VNPAY_DEVREG_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline text-blue-700 hover:text-blue-900 inline-flex items-center gap-0.5"
                      >
                        sandbox.vnpayment.vn/devreg <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      . Hệ thống VNPay sẽ gửi ngay mã TMN Code & Hash Secret qua email của bạn trong 1 phút để cài đặt vào nút ⚙️ ở góc phải!
                    </p>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: MOMO SANDBOX                                                       */}
              {/* ========================================================================= */}
              {method === 'MOMO' && (
                <div className="space-y-3.5">
                  {/* Cảnh báo quan trọng về App MoMo thật */}
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-[11px] text-amber-900 space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5 text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Tại sao App MoMo trên điện thoại không quét được?</span>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                      App MoMo trên điện thoại cá nhân (tải từ App Store / CH Play) là môi trường <strong>Production (Thật)</strong>, nên sẽ từ chối quét mã QR của cổng <strong>Sandbox / UAT (Thử nghiệm)</strong> để bảo mật.
                    </p>
                  </div>

                  {/* Mở Cổng MoMo Sandbox Web & Thẻ ATM Test */}
                  <div className="bg-white border border-pink-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-pink-900 text-xs flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-pink-600" />
                        <span>Mở Cổng MoMo Sandbox & Nhập Thẻ ATM Test</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-100 text-pink-700">
                        WEB GATEWAY
                      </span>
                    </div>

                    <div className="bg-pink-50/60 rounded-xl p-3 border border-pink-100 space-y-1.5 text-xs">
                      <span className="text-[11px] font-bold text-pink-950 block">
                        Thông tin thẻ ATM test khi mở trang MoMo (chọn tab "Thẻ ATM nội địa"):
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Số thẻ ATM test:</span>
                          <span className="font-mono font-bold text-slate-800">9704 0000 0000 0018</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Tên chủ thẻ:</span>
                          <span className="font-mono font-bold text-slate-800">NGUYEN VAN A</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Ngày phát hành:</span>
                          <span className="font-mono font-bold text-slate-800">03/07</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Mã OTP:</span>
                          <span className="font-mono font-bold text-emerald-700">000000 (bất kỳ)</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isRedirecting}
                      onClick={handleOpenMoMoSandbox}
                      className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-pink-600/25 transition-all flex items-center justify-center gap-2 btn-press cursor-pointer disabled:opacity-60"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>🌐 Mở Cổng Thanh Toán MoMo Sandbox (Chuyển Hướng Web)</span>
                    </button>

                  </div>

                  {/* Hướng dẫn cài App MoMo UAT nếu muốn quét bằng điện thoại */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Nếu muốn quét mã QR bằng điện thoại Android:</span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-relaxed">
                      Bạn cần cài ứng dụng <strong>MoMo UAT (file APK test)</strong> từ trang{' '}
                      <a
                        href={MOMO_DEVELOPERS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline text-pink-700 hover:text-pink-900 inline-flex items-center gap-0.5"
                      >
                        developers.momo.vn <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      {' '}và đăng nhập bằng tài khoản test (SĐT: <strong>0968238610</strong>, MK/OTP: <strong>000000</strong>).
                    </p>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: SEPAY VIETQR CHUYỂN KHOẢN TỰ ĐỘNG GẠCH NỢ (SEPAY.VN)               */}
              {/* ========================================================================= */}
              {(method === 'SEPAY' || method === 'VIETQR') && (
                <div className="space-y-3.5">
                  {/* SePay Status Banner */}
                  <div className="bg-gradient-to-r from-teal-900 via-cyan-900 to-slate-900 text-white p-3.5 rounded-2xl shadow-sm border border-teal-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-white">Cổng SePay Auto Reconcile</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                            LIVE 24/7
                          </span>
                        </div>
                        <p className="text-[10px] text-teal-200/80">
                          Tự động nhận diện giao dịch ngân hàng & gạch nợ sau 2-5 giây
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-300 bg-black/30 px-2 py-1 rounded-lg border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Listening...</span>
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="bg-gradient-to-b from-teal-50/60 to-white border border-teal-200 rounded-2xl p-4 flex flex-col items-center">
                    <div className="w-52 bg-white p-3 rounded-2xl border-2 border-teal-300 shadow-md flex flex-col items-center justify-between space-y-2">
                      <div className="w-full flex items-center justify-between border-b border-slate-100 pb-1.5 text-[10px] font-bold text-slate-600">
                        <span className="text-teal-700 font-black flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          SePay QR
                        </span>
                        <span className="font-mono">{bankInfo.bankName.split(' ')[0]}</span>
                      </div>

                      <div className="relative group">
                        <img
                          src={generateSePayQrUrl({
                            accountNumber: bankInfo.accountNumber,
                            bank: bankInfo.bankName.includes('MB') ? 'MBBank' : 'MBBank',
                            amount: invoiceTotal,
                            content: bankInfo.content,
                            template: 'compact'
                          })}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://api.vietqr.io/image/970422-${bankInfo.accountNumber}-compact2.jpg?amount=${invoiceTotal}&addInfo=${encodeURIComponent(bankInfo.content)}&accountName=${encodeURIComponent(bankInfo.accountName)}`;
                          }}
                          alt="SePay VietQR Code"
                          className="w-44 h-44 object-contain mx-auto rounded-lg"
                        />
                      </div>

                      <div className="text-center w-full pt-1 border-t border-slate-100">
                        <div className="text-xs font-black text-teal-800">
                          {invoiceTotal.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Quét bằng bất kỳ App Ngân Hàng nào
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Account Info */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                      <span className="font-bold text-slate-800">{bankInfo.bankName}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Số tài khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {bankInfo.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(bankInfo.accountNumber, 'acc')}
                          className="p-1 text-slate-400 hover:text-teal-600 rounded transition-colors cursor-pointer"
                          title="Sao chép STK"
                        >
                          {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Chủ tài khoản:</span>
                      <span className="font-bold text-slate-800">{bankInfo.accountName}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Nội dung chuyển khoản (Bắt buộc):</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                          {bankInfo.content}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(bankInfo.content, 'content')}
                          className="p-1 text-slate-400 hover:text-amber-700 rounded transition-colors cursor-pointer"
                          title="Sao chép nội dung"
                        >
                          {copiedField === 'content' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {sepayStatusMsg && (
                    <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{sepayStatusMsg}</span>
                    </div>
                  )}

                  {/* Actions for SePay: Tự động gạch nợ */}
                  <div className="pt-1">
                    <div className="flex items-center justify-center gap-2.5 py-3 px-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 text-emerald-900 rounded-2xl border border-emerald-200/90 text-xs font-bold shadow-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-teal-600 shrink-0" />
                      <span>Đang tự động quét giao dịch SePay... Chuyển khoản xong là hóa đơn tự động gạch nợ ngay!</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Cài Đặt Mã Kết Nối Sandbox Tùy Chỉnh */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-slate-900 text-sm">Cài Đặt Cổng Thanh Toán (SePay, VNPay, MoMo)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSandboxConfig} className="space-y-3.5 text-xs">
                            {/* SePay Gateway Config */}
              <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-900 block">Cổng Chuyển Khoản Tự Động SePay (sepay.vn)</span>
                  <a
                    href={SEPAY_PORTAL_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold text-teal-700 hover:underline flex items-center gap-0.5"
                  >
                    my.sepay.vn <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-0.5">SePay API Key (Token):</label>
                  <input
                    type="text"
                    value={sepayApiKey}
                    onChange={(e) => setSepayApiKey(e.target.value)}
                    placeholder="SEPAY_API_KEY_..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold block mb-0.5">Ngân Hàng:</label>
                    <input
                      type="text"
                      value={sepayBank}
                      onChange={(e) => setSepayBank(e.target.value)}
                      placeholder="MBBank"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold block mb-0.5">Số Tài Khoản:</label>
                    <input
                      type="text"
                      value={sepayAcc}
                      onChange={(e) => setSepayAcc(e.target.value)}
                      placeholder="9999888899"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-teal-800 bg-white p-2 rounded-lg border border-teal-200">
                  Webhook URL hệ thống: <strong>{window.location.origin}/api/payments/sepay/webhook</strong>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="font-bold text-blue-900 block">VNPay Sandbox Merchant</span>
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-0.5">TMN Code:</label>
                  <input
                    type="text"
                    required
                    value={vnpayTmn}
                    onChange={(e) => setVnpayTmn(e.target.value)}
                    placeholder="2QXUI4B4"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-0.5">Hash Secret:</label>
                  <input
                    type="text"
                    required
                    value={vnpaySecret}
                    onChange={(e) => setVnpaySecret(e.target.value)}
                    placeholder="RAOCTNVARZPHNZRFLKJVAGYUYGRDYNNX"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 bg-pink-50/60 border border-pink-200 rounded-2xl space-y-2">
                <span className="font-bold text-pink-900 block">MoMo Sandbox Partner</span>
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-0.5">Partner Code:</label>
                  <input
                    type="text"
                    required
                    value={momoPartner}
                    onChange={(e) => setMomoPartner(e.target.value)}
                    placeholder="MOMO"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              {configToast && (
                <p className="text-emerald-700 font-bold text-center">{configToast}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Lưu Cấu Hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
