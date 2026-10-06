import React, { useState } from 'react';
import {
  Users,
  Plus,
  Receipt,
  FileText,
  Send,
  Check,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  Lock,
  Unlock,
  Key,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Award,
  Crown,
  Eye,
  X,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import Modal from '../../components/common/Modal';
import CreateLandlordAiModal from './landlords/CreateLandlordAiModal';

export default function AdminLandlordsPage() {
  const {
    landlords = [],
    createLandlord,
    toggleLandlordLock,
    updateLandlordPackage,
    landlordProfiles = [],
    verifyLandlordKyc
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPackage, setFilterPackage] = useState('ALL');
  const [adminTab, setAdminTab] = useState('ACCOUNTS'); // 'ACCOUNTS' | 'KYC'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedLandlordForPackage, setSelectedLandlordForPackage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [newLandlord, setNewLandlord] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    packageCode: 'BASIC',
    identityCard: '',
    birthDate: '1988-08-15',
    issueDate: '2021-04-20',
    issuePlace: 'Cục Cảnh sát QLHC về TTXH',
    permanentAddress: '',
    taxCode: ''
  });

  const showToast = (msg, type = 'SUCCESS') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newLandlord.fullName || !newLandlord.email || !newLandlord.phone) return;

    createLandlord({
      ...newLandlord,
      username: newLandlord.username || newLandlord.email.split('@')[0]
    });

    setShowAddModal(false);
    setNewLandlord({
      fullName: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      packageCode: 'BASIC',
      identityCard: '',
      birthDate: '1988-08-15',
      issueDate: '2021-04-20',
      issuePlace: 'Cục Cảnh sát QLHC về TTXH',
      permanentAddress: '',
      taxCode: ''
    });

    showToast('Tạo tài khoản Chủ trọ và gửi email kích hoạt thành công (UC-A01)!');
  };

  const handleToggleLock = (landlord) => {
    const isLocking = landlord.status === 'ACTIVE';
    const confirmAction = window.confirm(
      isLocking
        ? `Bạn có chắc muốn KHÓA tài khoản của Chủ trọ "${landlord.fullName}"?\n\nToàn bộ Token đăng nhập của chủ trọ và nhân viên cơ sở này sẽ bị vô hiệu hóa ngay lập tức.`
        : `Mở khóa và khôi phục quyền truy cập cho Chủ trọ "${landlord.fullName}"?`
    );
    if (!confirmAction) return;

    toggleLandlordLock(landlord.id);
    showToast(
      isLocking
        ? `Đã khóa tài khoản Chủ trọ ${landlord.fullName}!`
        : `Đã mở khóa tài khoản ${landlord.fullName}!`
    );
  };

  const handleSavePackage = (newPackage) => {
    if (!selectedLandlordForPackage) return;
    updateLandlordPackage(selectedLandlordForPackage.id, newPackage);
    setSelectedLandlordForPackage(null);
    showToast('Cập nhật gói dịch vụ và hạn mức chi nhánh thành công (UC-A04)!');
  };

  const filteredLandlords = (landlords || []).filter((l) => {
    const matchSearch =
      (l.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.phone || '').includes(searchTerm);
    const matchPackage =
      filterPackage === 'ALL' || l.packageCode === filterPackage;
    return matchSearch && matchPackage;
  });

  const activeCount = landlords.filter((l) => l.status === 'ACTIVE').length;
  const lockedCount = landlords.filter((l) => l.status === 'LOCKED').length;
  const totalFacilities = landlords.reduce((acc, l) => acc + (l.housesCount || 1), 0);
  const pendingKycCount = landlordProfiles.filter((p) => p.kycStatus === 'PENDING').length;

  return (
    <div className="space-y-6 page-enter">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold backdrop-blur-xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Header Bento Banner with Ambient Glow */}
      <div className="bento-card p-6 sm:p-7 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-white via-indigo-50/40 to-purple-50/30">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none animate-float-reverse" />
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="status-pill status-pill-indigo">
              <Crown className="w-3 h-3 text-indigo-600" />
              <span>Multi-Tenant SaaS Platform</span>
            </span>
            <span className="status-pill status-pill-success">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Định Danh KYC CCCD Chuẩn Pháp Lý</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quản Lý Đối Tác Chủ Trọ & Gói Dịch Vụ SaaS
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-2xl">
            Quản trị đối tác chủ trọ, duyệt định danh KYC CCCD và kiểm soát hạn mức quy mô cơ sở theo gói dịch vụ bản quyền.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAiModal(true)}
            className="btn-press btn-shimmer flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white text-xs sm:text-sm font-black rounded-2xl shadow-lg shadow-indigo-600/25 transition-all shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>⚡ Thêm Chủ Trọ Bằng AI OCR (CCCD)</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-press flex items-center justify-center gap-1.5 px-4 py-3 bg-white/90 hover:bg-white text-slate-800 text-xs sm:text-sm font-bold rounded-2xl border border-slate-200 shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thủ Công</span>
          </button>
        </div>
      </div>

      {/* Top 3 Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bento-card p-5 space-y-3 stagger-item stagger-1 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tổng Đối Tác Chủ Trọ
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold ring-1 ring-indigo-500/10">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{landlords.length}</div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              {activeCount} đang hoạt động
            </span>
          </div>
          <div className="text-xs text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Trạng thái tài khoản:</span>
            <span className={lockedCount > 0 ? "text-rose-600 font-bold" : "text-slate-600 font-medium"}>
              {lockedCount > 0 ? `${lockedCount} bị tạm khóa` : '100% Hoạt động tốt'}
            </span>
          </div>
        </div>

        <div className="bento-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tổng Cơ Sở Vận Hành
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold ring-1 ring-purple-500/10">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{totalFacilities} cơ sở</div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
              ~40 phòng toàn sàn
            </span>
          </div>
          <div className="text-xs text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Mô hình phân tán:</span>
            <span className="text-slate-700 font-semibold">Multi-tenant Cloud</span>
          </div>
        </div>

        <div className="bento-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Gói Dịch Vụ SaaS
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold ring-1 ring-amber-500/10">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight">PRO & ENTERPRISE</div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
              Tự động gia hạn
            </span>
          </div>
          <div className="text-xs text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Hạn mức mở rộng:</span>
            <span className="text-slate-700 font-semibold">Không giới hạn</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher: Modern Bento Segmented Control */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/60 rounded-2xl w-fit backdrop-blur-md">
        <button
          onClick={() => setAdminTab('ACCOUNTS')}
          className={`btn-press px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'ACCOUNTS'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Tài Khoản & Gói Cước ({landlords.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('KYC')}
          className={`btn-press px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'KYC'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Thẩm Định Hồ Sơ CCCD & KYC (UC-A01)</span>
          {pendingKycCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
              {pendingKycCount} mới
            </span>
          )}
        </button>
      </div>

      {adminTab === 'KYC' ? (
        /* KYC Management Bento Card */
        <div className="bento-card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Hồ Sơ Định Danh Căn Cước Công Dân (CCCD) Chủ Trọ</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Xác minh danh tính 12 số CCCD, đối chiếu ảnh chụp 2 mặt và mã số thuế theo quy chuẩn pháp lý.
              </p>
            </div>
            <span className="status-pill status-pill-indigo self-start sm:self-auto">
              Tổng số: {landlordProfiles.length} hồ sơ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 uppercase font-bold tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Chủ Trọ</th>
                  <th className="py-3.5 px-4">Số CCCD (12 số) & Ngày cấp</th>
                  <th className="py-3.5 px-4">Thường Trú & MST</th>
                  <th className="py-3.5 px-4">Ảnh CCCD 2 Mặt</th>
                  <th className="py-3.5 px-4">Trạng Thái KYC</th>
                  <th className="py-3.5 px-5 text-right">Thao Tác Thẩm Định</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {landlordProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 text-sm">{p.landlordName}</div>
                      <div className="text-slate-500 font-mono text-[11px] mt-0.5">{p.landlordPhone}</div>
                      <div className="text-slate-400 text-[11px]">ID: #{p.landlordId}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-mono font-bold text-indigo-700 text-sm">{p.identityCard}</div>
                      <div className="text-slate-500 text-[11px]">Cấp: {p.issueDate} tại {p.issuePlace}</div>
                      <div className="text-slate-400 text-[11px]">Ngày sinh: {p.birthDate}</div>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <div className="text-slate-800 line-clamp-2">{p.permanentAddress}</div>
                      <div className="text-slate-500 font-mono text-[11px] mt-0.5">MST: {p.taxCode}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-semibold border border-indigo-200">
                          Mặt trước
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-semibold border border-indigo-200">
                          Mặt sau
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1 ${
                        p.kycStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : p.kycStatus === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                      }`}>
                        {p.kycStatus === 'VERIFIED' ? '✓ Đã xác minh' : p.kycStatus === 'REJECTED' ? '✕ Bị từ chối' : '⏳ Chờ duyệt KYC'}
                      </span>
                      {p.rejectionReason && (
                        <div className="text-rose-600 text-[10px] mt-1 max-w-[150px] truncate" title={p.rejectionReason}>
                          Lý do: {p.rejectionReason}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.kycStatus !== 'VERIFIED' && (
                          <button
                            onClick={() => {
                              verifyLandlordKyc(p.id, 'VERIFIED');
                              showToast(`Đã xác minh KYC thành công cho chủ trọ ${p.landlordName}!`);
                            }}
                            className="btn-press px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            Duyệt KYC
                          </button>
                        )}

                        {p.kycStatus !== 'REJECTED' && (
                          <button
                            onClick={() => {
                              const reason = window.prompt('Nhập lý do từ chối hồ sơ KYC:');
                              if (reason !== null) {
                                verifyLandlordKyc(p.id, 'REJECTED', reason || 'Ảnh CCCD mờ hoặc thông tin không trùng khớp');
                                showToast(`Đã từ chối hồ sơ KYC của ${p.landlordName}!`, 'WARNING');
                              }
                            }}
                            className="btn-press px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Từ chối
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Filter and Landlords Table (ACCOUNTS TAB) */
        <div className="bento-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm chủ trọ, SĐT, Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterPackage}
                onChange={(e) => setFilterPackage(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">Tất Cả Các Gói</option>
                <option value="BASIC">Gói Cơ Bản (Max 2 Cơ Sở)</option>
                <option value="PRO">Gói Chuyên Nghiệp (Vô Hạn)</option>
                <option value="ENTERPRISE">Gói Doanh Nghiệp (Có AI OCR)</option>
              </select>
            </div>
          </div>

          {/* Landlords Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 uppercase font-bold tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Chủ Trọ & Tài Khoản</th>
                  <th className="py-3.5 px-4">Liên Hệ</th>
                  <th className="py-3.5 px-4">Gói Dịch Vụ & Hạn Mức</th>
                  <th className="py-3.5 px-4">Quy Mô (Cơ Sở & Phòng)</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-5 text-right">Thao Tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLandlords.map((landlord) => (
                  <tr key={landlord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500/15 via-purple-500/15 to-blue-500/15 text-indigo-700 font-black flex items-center justify-center text-sm border border-indigo-200/80">
                          {landlord.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {landlord.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Username: <span className="text-indigo-600 font-bold">{landlord.username}</span> • ID #{landlord.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{landlord.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-slate-300" />
                          <span>{landlord.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            landlord.packageCode === 'ENTERPRISE'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : landlord.packageCode === 'PRO'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          <Award className="w-3 h-3" />
                          <span>{landlord.subscriptionPackage}</span>
                        </span>
                        <div className="text-[10px] text-slate-400">
                          Hạn mức:{' '}
                          <strong className="text-slate-700">
                            {landlord.maxHousesLimit > 100
                              ? 'Không giới hạn'
                              : `Tối đa ${landlord.maxHousesLimit} nhà trọ`}
                          </strong>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{landlord.housesCount || 1} cơ sở</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{landlord.roomsCount || 10} phòng trọ</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {landlord.status === 'ACTIVE' ? (
                        <span className="status-pill status-pill-success">
                          Hoạt Động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Đã Khóa</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedLandlordForPackage(landlord)}
                        className="btn-press px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition border border-indigo-200 cursor-pointer"
                        title="Đổi gói dịch vụ Basic / Pro / Enterprise"
                      >
                        Đổi Gói Cước
                      </button>

                      <button
                        onClick={() => handleToggleLock(landlord)}
                        className={`btn-press px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                          landlord.status === 'ACTIVE'
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {landlord.status === 'ACTIVE' ? 'Khóa' : 'Mở Khóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Thêm Chủ Trọ Bằng AI OCR CCCD */}
      <CreateLandlordAiModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onSaveLandlord={(landlordData) => {
          createLandlord(landlordData);
          showToast(`Đã thêm thành công Chủ trọ ${landlordData.fullName} qua AI OCR CCCD!`);
        }}
      />

      {/* Modal Thêm Chủ Trọ Mới */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="max-w-lg">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">Thêm Đối Tác Chủ Trọ Mới (ROLE_STAFF)</h3>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Họ và Tên Chủ Trọ *</label>
              <input
                type="text"
                required
                value={newLandlord.fullName}
                onChange={(e) => setNewLandlord({ ...newLandlord, fullName: e.target.value })}
                placeholder="Ví dụ: Lê Thị Thu Ngân"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Số Điện Thoại *</label>
                <input
                  type="text"
                  required
                  value={newLandlord.phone}
                  onChange={(e) => setNewLandlord({ ...newLandlord, phone: e.target.value })}
                  placeholder="0912.xxx.xxx"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Kích Hoạt *</label>
                <input
                  type="email"
                  required
                  value={newLandlord.email}
                  onChange={(e) => setNewLandlord({ ...newLandlord, email: e.target.value })}
                  placeholder="landlord@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Số CCCD 12 Số *</label>
                <input
                  type="text"
                  value={newLandlord.identityCard}
                  onChange={(e) => setNewLandlord({ ...newLandlord, identityCard: e.target.value })}
                  placeholder="001201019999"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã Số Thuế (MST)</label>
                <input
                  type="text"
                  value={newLandlord.taxCode}
                  onChange={(e) => setNewLandlord({ ...newLandlord, taxCode: e.target.value })}
                  placeholder="8392019283"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Gói Cước Đăng Ký Ban Đầu</label>
              <select
                value={newLandlord.packageCode}
                onChange={(e) => setNewLandlord({ ...newLandlord, packageCode: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="BASIC">Gói Cơ Bản (BASIC - Tối đa 2 Cơ sở)</option>
                <option value="PRO">Gói Chuyên Nghiệp (PRO - Không giới hạn cơ sở)</option>
                <option value="ENTERPRISE">Gói Doanh Nghiệp (ENTERPRISE - Kèm AI OCR)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-press px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              Tạo Tài Khoản
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Cập Nhật Gói Cước & Hạn Mức */}
      <Modal isOpen={!!selectedLandlordForPackage} onClose={() => setSelectedLandlordForPackage(null)} maxWidth="max-w-md">
        {selectedLandlordForPackage && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Cập Nhật Gói Dịch Vụ SaaS</h3>
              <button
                type="button"
                onClick={() => setSelectedLandlordForPackage(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Điều chỉnh hạn mức quy mô và quyền lợi tính năng cho Chủ trọ <strong>{selectedLandlordForPackage.fullName}</strong>.
            </p>

            <div className="space-y-2.5">
              {[
                { code: 'BASIC', name: 'Gói Cơ Bản (BASIC)', limit: 'Tối đa 2 cơ sở, 30 phòng', price: '199.000 đ/tháng' },
                { code: 'PRO', name: 'Gói Chuyên Nghiệp (PRO)', limit: 'Không giới hạn cơ sở, Quota 100 phòng', price: '499.000 đ/tháng' },
                { code: 'ENTERPRISE', name: 'Gói Doanh Nghiệp (ENTERPRISE)', limit: 'Toàn bộ tính năng + AI OCR nhận diện đồng hồ', price: '999.000 đ/tháng' }
              ].map((pkg) => (
                <div
                  key={pkg.code}
                  onClick={() => handleSavePackage(pkg.code)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedLandlordForPackage.packageCode === pkg.code
                      ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{pkg.name}</span>
                    <span className="text-xs font-bold text-indigo-700 font-mono">{pkg.price}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{pkg.limit}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
