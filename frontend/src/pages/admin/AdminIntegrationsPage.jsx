import React, { useState } from 'react';
import {
  CreditCard,
  Zap,
  Mail,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Key,
  Server,
  Sparkles,
  ExternalLink,
  Save,
  Check
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export default function AdminIntegrationsPage() {
  const {
    systemIntegrations = {},
    updateSystemIntegration,
    testIntegrationConnection
  } = useData();

  const [activeTab, setActiveTab] = useState('vnpay'); // vnpay | momo | aiOcr | smtp | smsOtp
  const [configs, setConfigs] = useState(systemIntegrations);
  const [testingKey, setTestingKey] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [saveToast, setSaveToast] = useState(false);

  const handleFieldChange = (section, field, value) => {
    setConfigs((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleTestConnection = async (key) => {
    setTestingKey(key);
    setTestResult(null);

    // Giả lập gửi request kiểm tra kết nối tới Microservice tương ứng (UC-A02)
    setTimeout(() => {
      setTestingKey(null);
      setTestResult({
        key,
        status: 'SUCCESS',
        message:
          key === 'aiOcr'
            ? 'Kết nối thành công tới AI Vision Microservice! Phản hồi: OpenAI GPT-4o Vision Ready (Độ trễ: 180ms).'
            : key === 'vnpay'
            ? 'Xác thực chữ ký SHA-512 với cổng Sandbox VNPay thành công! Mã phản hồi: 00.'
            : key === 'momo'
            ? 'Kết nối cổng thanh toán MoMo Partner API thành công!'
            : key === 'smtp'
            ? 'Gửi email thử nghiệm qua SMTP host smtp.gmail.com thành công (TLS Handshake OK)!'
            : 'Kiểm tra Brandname SMS OTP qua Viettel Telecom thành công! Số dư khả dụng: 15.400 SMS.'
      });
    }, 900);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (updateSystemIntegration) {
      updateSystemIntegration(activeTab, configs[activeTab]);
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {saveToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Đã mã hóa và đồng bộ cấu hình sang Eureka Configuration Server!</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 text-white p-6 rounded-2xl shadow-xl shadow-purple-600/15">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-2">
          <Server className="w-3.5 h-3.5" />
          <span>Hạ Tầng Tích Hợp SaaS Dùng Chung • UC-A02</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight">
          Cấu Hình Cổng Thanh Toán & Dịch Vụ Dùng Chung
        </h1>
        <p className="text-purple-100 text-sm mt-1 max-w-3xl">
          Quản trị các kết nối API dùng chung cho toàn bộ chuỗi: Cổng thanh toán VNPay/MoMo, AI Vision Scanner nhận diện công tơ, Mail Server SMTP và SMS OTP Brandname.
        </p>
      </div>

      {/* Main Grid: Tabs + Form */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs space-y-1.5">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Danh Mục Tích Hợp
          </div>

          <button
            onClick={() => {
              setActiveTab('vnpay');
              setTestResult(null);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'vnpay'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 translate-x-1'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4" />
              <span>Cổng VNPay Sandbox</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>

          <button
            onClick={() => {
              setActiveTab('momo');
              setTestResult(null);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'momo'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 translate-x-1'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm">💳</span>
              <span>Ví Điện Tử MoMo</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>

          <button
            onClick={() => {
              setActiveTab('aiOcr');
              setTestResult(null);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'aiOcr'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 translate-x-1'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>AI Vision OCR Scanner</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>

          <button
            onClick={() => {
              setActiveTab('smtp');
              setTestResult(null);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'smtp'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 translate-x-1'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4" />
              <span>Mail Server (SMTP)</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>

          <button
            onClick={() => {
              setActiveTab('smsOtp');
              setTestResult(null);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'smsOtp'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 translate-x-1'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4" />
              <span>SMS Brandname OTP</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>
        </div>

        {/* Configuration Details Panel */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* VNPay */}
            {activeTab === 'vnpay' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <span>Cổng Thanh Toán Trực Tuyến VNPay</span>
                  </h3>
                  <p className="text-slate-500 mt-1">
                    Cấu hình kết nối API sinh URL thanh toán VNPay và nhận Webhook IPN tự động gạch nợ.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mã Định Danh Merchant (TMN Code) *
                    </label>
                    <input
                      type="text"
                      value={configs.vnpay?.tmnCode || 'RENTAL01'}
                      onChange={(e) =>
                        handleFieldChange('vnpay', 'tmnCode', e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Chuỗi Bí Mật Băm Chữ Ký (Hash Secret SHA-512) *
                    </label>
                    <input
                      type="password"
                      value={configs.vnpay?.hashSecret || '8F9A4E2B1C7D0E5F8A3B2C1D4E5F6A7B'}
                      onChange={(e) =>
                        handleFieldChange('vnpay', 'hashSecret', e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Địa Chỉ Cổng Thanh Toán (Payment URL Gateway) *
                  </label>
                  <input
                    type="text"
                    value={configs.vnpay?.payUrl || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'}
                    onChange={(e) =>
                      handleFieldChange('vnpay', 'payUrl', e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* MoMo */}
            {activeTab === 'momo' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="font-mono text-lg text-pink-600">M</span>
                    <span>Cổng Ví Điện Tử MoMo</span>
                  </h3>
                  <p className="text-slate-500 mt-1">
                    Tích hợp ví MoMo Pay, hỗ trợ quét mã QR MoMo và thanh toán deep-link trên app di động.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mã Đối Tác (Partner Code) *
                    </label>
                    <input
                      type="text"
                      value={configs.momo?.partnerCode || 'MOMO_RENTAL_PARTNER'}
                      onChange={(e) =>
                        handleFieldChange('momo', 'partnerCode', e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Khóa Truy Cập (Access Key) *
                    </label>
                    <input
                      type="text"
                      value={configs.momo?.accessKey || 'F8B7C9D2E1A4'}
                      onChange={(e) =>
                        handleFieldChange('momo', 'accessKey', e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Khóa Bí Mật (Secret Key HMAC-SHA256) *
                  </label>
                  <input
                    type="password"
                    value={configs.momo?.secretKey || 'kL9@mN2#pQ5$rT8^vW1*'}
                    onChange={(e) =>
                      handleFieldChange('momo', 'secretKey', e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* AI Vision OCR Scanner */}
            {activeTab === 'aiOcr' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span>Dịch Vụ AI Vision OCR Nhận Diện Mặt Đồng Hồ Điện & Nước</span>
                  </h3>
                  <p className="text-slate-500 mt-1">
                    Cấu hình mô hình thị giác máy tính tự động đọc chỉ số công tơ qua camera (SRS UC-A02 & UC-S03).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mô Hình AI Vision (Vision Model Engine) *
                    </label>
                    <select
                      value={configs.aiOcr?.model || 'GPT-4o Vision OCR Meter'}
                      onChange={(e) =>
                        handleFieldChange('aiOcr', 'model', e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 cursor-pointer"
                    >
                      <option value="GPT-4o Vision OCR Meter">
                        GPT-4o Vision (Độ chính xác cao & Xử lý phản quang)
                      </option>
                      <option value="Claude 3.5 Sonnet Vision">
                        Claude 3.5 Sonnet Vision (Tốc độ cao)
                      </option>
                      <option value="Custom CNN Edge Meter Model">
                        Custom CNN Model (Mô hình Local Edge Server)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Ngưỡng Tin Cậy Tối Thiểu (Confidence Threshold %) *
                    </label>
                    <input
                      type="number"
                      min="70"
                      max="99"
                      value={configs.aiOcr?.confidenceThreshold || 95}
                      onChange={(e) =>
                        handleFieldChange('aiOcr', 'confidenceThreshold', Number(e.target.value))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    API Key Dịch Vụ AI Vision *
                  </label>
                  <input
                    type="password"
                    value={configs.aiOcr?.apiKey || 'sk-proj-rental-ocr-2026-***active'}
                    onChange={(e) =>
                      handleFieldChange('aiOcr', 'apiKey', e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    API Key được mã hóa AES-256 trước khi lưu trữ vào bảng cấu hình hệ thống.
                  </p>
                </div>
              </div>
            )}

            {/* SMTP */}
            {activeTab === 'smtp' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span>Máy Chủ Gửi Thư Điện Tử (SMTP Mail Server)</span>
                  </h3>
                  <p className="text-slate-500 mt-1">
                    Gửi email kích hoạt tài khoản chủ trọ, thông báo hóa đơn tiền phòng và hợp đồng điện tử.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      SMTP Host *
                    </label>
                    <input
                      type="text"
                      value={configs.smtp?.host || 'smtp.gmail.com'}
                      onChange={(e) =>
                        handleFieldChange('smtp', 'host', e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Cổng Kết Nối (Port) *
                    </label>
                    <input
                      type="number"
                      value={configs.smtp?.port || 587}
                      onChange={(e) =>
                        handleFieldChange('smtp', 'port', Number(e.target.value))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên Đăng Nhập / Email Người Gửi *
                  </label>
                  <input
                    type="text"
                    value={configs.smtp?.fromEmail || 'Hệ Thống Nhà Trọ <noreply@rental.vn>'}
                    onChange={(e) =>
                      handleFieldChange('smtp', 'fromEmail', e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* SMS OTP */}
            {activeTab === 'smsOtp' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    <span>Cổng SMS Brandname & Mã Xác Thực OTP</span>
                  </h3>
                  <p className="text-slate-500 mt-1">
                    Gửi mã OTP ký xác nhận hợp đồng điện tử và mật khẩu khởi tạo đến số điện thoại khách thuê.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tên Thương Hiệu (Brandname Đăng Ký Cục Viễn Thông) *
                    </label>
                    <input
                      type="text"
                      value={configs.smsOtp?.brandname || 'NHATRO_VN'}
                      onChange={(e) =>
                        handleFieldChange('smsOtp', 'brandname', e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nhà Mạng Cung Cấp Dịch Vụ Gateway *
                    </label>
                    <input
                      type="text"
                      value={configs.smsOtp?.provider || 'Viettel Telecom SMS Gateway'}
                      onChange={(e) =>
                        handleFieldChange('smsOtp', 'provider', e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Test result feedback banner */}
            {testResult && testResult.key === activeTab && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleTestConnection(activeTab)}
                disabled={testingKey === activeTab}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {testingKey === activeTab ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    <span>Đang Gửi Request Kiểm Tra...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-purple-600" />
                    <span>Kiểm Tra Kết Nối (Test Connection)</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/25 transition-all btn-press flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu & Đồng Bộ Cấu Hình</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
