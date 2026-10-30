import React, { useState } from 'react';
import { Layers, Lock, User, Shield, CheckCircle2, ArrowRight, Building2, UserCheck, CreditCard, Sparkles, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState('LOGIN'); // 'LOGIN' | 'REGISTER'
  const [selectedRole, setSelectedRole] = useState('STAFF'); // 'STAFF' (Chủ trọ) | 'TENANT' (Khách thuê)

  // Login Form
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');

  // Register Form
  const [regData, setRegData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    identityCard: ''
  });

  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(username, password);
    if (res?.success) {
      navigate('/');
    } else {
      setError(res?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regData.fullName || !regData.username || !regData.password) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (selectedRole === 'STAFF' && !regData.identityCard) {
      setError('Vui lòng nhập Số CCCD để gửi Quản trị viên (Admin) xét duyệt hồ sơ chủ trọ.');
      return;
    }

    const res = await register({
      role: selectedRole,
      fullName: regData.fullName,
      username: regData.username,
      email: regData.email || `${regData.username}@gmail.com`,
      phone: regData.phone || '0900.000.000',
      password: regData.password,
      identityCard: regData.identityCard
    });

    if (res?.success) {
      setSuccessMsg(
        selectedRole === 'STAFF'
          ? '🎉 Đăng ký tài khoản Chủ Trọ thành công! Hồ sơ đã được đồng bộ cho Admin xét duyệt. Đang chuyển hướng...'
          : '🎉 Đăng ký tài khoản Khách Thuê thành công! Đang chuyển hướng đến cổng tìm phòng...'
      );
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } else {
      setError(res?.error || 'Đăng ký không thành công. Vui lòng thử lại.');
    }
  };

  const handleQuickLogin = async (roleName, userVal) => {
    setUsername(userVal);
    setPassword('123456');
    await login(userVal, '123456');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background organic floating glow effects */}
      <div className="absolute top-1/6 left-1/5 w-96 h-96 bg-purple-300/40 rounded-full blur-3xl pointer-events-none float-orb-1"></div>
      <div className="absolute bottom-1/6 right-1/5 w-96 h-96 bg-blue-300/40 rounded-full blur-3xl pointer-events-none float-orb-2"></div>
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-200/30 rounded-full blur-2xl pointer-events-none"></div>

      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-5 sm:p-8 shadow-2xl relative z-10 modal-content-spring my-8">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-purple-500/25 mb-3 transition-transform duration-300 hover:scale-110 hover:rotate-3">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hệ Thống Quản Lý Chuỗi Nhà Trọ</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Cổng đăng nhập & đăng ký Microservices Cloud</p>
        </div>

        {/* Tab Toggle Login / Register */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setAuthMode('LOGIN'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
              authMode === 'LOGIN'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Đăng Nhập</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('REGISTER'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
              authMode === 'REGISTER'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Đăng Ký Tài Khoản</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center stagger-item">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center stagger-item flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* --- FORM ĐĂNG NHẬP --- */}
        {authMode === 'LOGIN' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên đăng nhập / Email</label>
              <div className="relative group">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-purple-600" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-200"
                  placeholder="admin, staff hoặc tenant"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu</label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-purple-600" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-200"
                  placeholder="••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 btn-press"
            >
              <span>{loading ? 'Đang xác thực...' : 'Đăng Nhập Vào Hệ Thống'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* --- FORM ĐĂNG KÝ TÀI KHOẢN --- */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Chọn vai trò: Chủ trọ vs Khách thuê */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Chọn Loại Tài Khoản:</label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setSelectedRole('STAFF')}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedRole === 'STAFF'
                      ? 'border-purple-600 bg-purple-50/70 text-purple-900 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className={`w-4 h-4 ${selectedRole === 'STAFF' ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs">Chủ Trọ / Quản Lý</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Quản lý chuỗi nhà, phòng, hóa đơn & cước SaaS
                  </p>
                </div>

                <div
                  onClick={() => setSelectedRole('TENANT')}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedRole === 'TENANT'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <UserCheck className={`w-4 h-4 ${selectedRole === 'TENANT' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs">Khách Thuê Phòng</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Tìm phòng trọ, thanh toán hóa đơn & ký hợp đồng
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={regData.fullName}
                  onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên đăng nhập *</label>
                <input
                  type="text"
                  required
                  value={regData.username}
                  onChange={(e) => setRegData({ ...regData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                  placeholder="nguyenvana"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regData.phone}
                    onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                    placeholder="0912.xxx.xxx"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                    placeholder="vana@gmail.com"
                  />
                </div>
              </div>
            </div>

            {/* Mục CCCD khi đăng ký làm Chủ Trọ */}
            {selectedRole === 'STAFF' && (
              <div className="p-3 bg-purple-50/50 border border-purple-200/80 rounded-2xl">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                    <span>Số CCCD / Mã Định Danh Chủ Trọ *</span>
                  </label>
                  <span className="text-[10px] font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Admin Duyệt Hồ Sơ</span>
                </div>
                <input
                  type="text"
                  required
                  value={regData.identityCard}
                  onChange={(e) => setRegData({ ...regData, identityCard: e.target.value })}
                  className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  placeholder="Nhập 12 số CCCD gắn chip (VD: 001201012345)"
                />
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                  🛡️ Hồ sơ chủ trọ sẽ được gửi cho Quản trị viên (Admin) xét duyệt định danh và cấp quyền quản lý cơ sở.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu *</label>
                <input
                  type="password"
                  required
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                  placeholder="••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Xác nhận mật khẩu *</label>
                <input
                  type="password"
                  required
                  value={regData.confirmPassword}
                  onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                  placeholder="••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 btn-press"
            >
              <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng Ký & Bắt Đầu Ngay'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Quick Demo Login */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
            Hoặc Đăng Nhập Nhanh (1 Click Demo)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleQuickLogin('ADMIN', 'admin')}
              className="px-2 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all text-center btn-press shadow-2xs"
            >
              👑 Admin
            </button>
            <button
              onClick={() => handleQuickLogin('STAFF_1', 'staff')}
              className="px-2 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all text-center btn-press shadow-2xs"
              title="Staff 1: Quản lý Cơ Sở 1 - Cầu Giấy"
            >
              💼 Staff 1 (CS1)
            </button>
            <button
              onClick={() => handleQuickLogin('STAFF_2', 'staff2')}
              className="px-2 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-bold transition-all text-center btn-press shadow-2xs"
              title="Staff 2: Quản lý Cơ Sở 2 - Bách Khoa"
            >
              💼 Staff 2 (CS2)
            </button>
            <button
              onClick={() => handleQuickLogin('TENANT', 'tenant1')}
              className="px-2 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all text-center btn-press shadow-2xs"
            >
              🏠 Tenant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
