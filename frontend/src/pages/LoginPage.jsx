import React, { useState } from 'react';
import { Layers, Lock, User, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(username, password);
    if (res?.success) {
      navigate('/');
    } else {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
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

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-5 sm:p-8 shadow-2xl relative z-10 modal-content-spring">
        {/* Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-purple-500/25 mb-3 transition-transform duration-300 hover:scale-110 hover:rotate-3">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hệ Thống Quản Lý Chuỗi Nhà Trọ</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Đăng nhập cổng quản trị Microservices Cloud</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center stagger-item">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
