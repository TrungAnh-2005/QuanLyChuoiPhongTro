import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  Search,
  Check,
  X,
  AlertCircle,
  Filter,
  MapPin,
  Phone,
  User,
  Layers,
  Sparkles,
  ShieldCheck,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export default function AdminHousesPage() {
  const { houseDeleteNotices = [] } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'ACTIVE' | 'LOCKED'
  const [toastMessage, setToastMessage] = useState(null);

  const [housesList, setHousesList] = useState(() => {
    try {
      const saved = localStorage.getItem('rental_boarding_houses');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 1,
        code: 'CS-01',
        name: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
        address: 'Số 45, Ngõ 165 Cầu Giấy, Phường Dịch Vọng, Cầu Giấy, Hà Nội',
        manager: 'Lê Thị Thu Ngân (Staff CS1)',
        managerUsername: 'staff',
        createdBy: 'staff',
        managerPhone: '0912.888.666',
        floors: 5,
        totalRooms: 12,
        status: 'ACTIVE'
      },
      {
        id: 2,
        code: 'CS-02',
        name: 'Nhà Trọ Bách Khoa - Cơ Sở 2',
        address: 'Số 18, Ngõ Tự Do, Phường Đồng Tâm, Hai Bà Trưng, Hà Nội',
        manager: 'Đàm Văn Táo (Staff CS2)',
        managerUsername: 'staff2',
        createdBy: 'staff2',
        managerPhone: '0988.777.999',
        floors: 4,
        totalRooms: 8,
        status: 'ACTIVE'
      },
      {
        id: 3,
        code: 'CS-03',
        name: 'Nhà Trọ Đống Đa - Cơ Sở 3',
        address: 'Số 92, Phố Chùa Láng, Phường Láng Thượng, Đống Đa, Hà Nội',
        manager: 'Phạm Quốc Hùng',
        managerUsername: 'admin',
        createdBy: 'admin',
        managerPhone: '0936.555.222',
        floors: 6,
        totalRooms: 16,
        status: 'ACTIVE'
      }
    ];
  });

  const reloadHouses = () => {
    try {
      const saved = localStorage.getItem('rental_boarding_houses');
      if (saved) {
        setHousesList(JSON.parse(saved));
      }
    } catch {}
  };

  useEffect(() => {
    reloadHouses();
    const handleStorage = () => reloadHouses();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const showToast = (msg, type = 'SUCCESS') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApproveHouse = (code) => {
    const updated = housesList.map((h) =>
      h.code === code ? { ...h, status: 'ACTIVE', approvedAt: new Date().toLocaleDateString('vi-VN') } : h
    );
    setHousesList(updated);
    try {
      localStorage.setItem('rental_boarding_houses', JSON.stringify(updated));
    } catch {}
    showToast(`✅ Quản Trị Viên đã phê duyệt cơ sở ${code}! Cơ sở đã kích hoạt đưa vào hoạt động chính thức.`);
  };

  const handleRejectHouse = (code) => {
    if (window.confirm(`Xác nhận từ chối và gỡ bỏ cơ sở ${code}?`)) {
      const updated = housesList.filter((h) => h.code !== code);
      setHousesList(updated);
      try {
        localStorage.setItem('rental_boarding_houses', JSON.stringify(updated));
      } catch {}
      showToast(`Đã từ chối và gỡ bỏ hồ sơ cơ sở ${code}.`, 'WARNING');
    }
  };

  const handleToggleLockHouse = (code) => {
    const updated = housesList.map((h) => {
      if (h.code === code) {
        const nextStatus = h.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
        return { ...h, status: nextStatus };
      }
      return h;
    });
    setHousesList(updated);
    try {
      localStorage.setItem('rental_boarding_houses', JSON.stringify(updated));
    } catch {}
    showToast(`Đã cập nhật trạng thái cơ sở ${code}!`);
  };

  const pendingCount = housesList.filter((h) => h.status === 'PENDING_APPROVAL').length;
  const activeCount = housesList.filter((h) => h.status === 'ACTIVE' || !h.status).length;
  const lockedCount = housesList.filter((h) => h.status === 'LOCKED').length;

  const filteredHouses = housesList.filter((h) => {
    const matchSearch =
      (h.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.manager || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.managerPhone || '').includes(searchTerm);

    const matchStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'PENDING'
        ? h.status === 'PENDING_APPROVAL'
        : statusFilter === 'ACTIVE'
        ? h.status === 'ACTIVE' || !h.status
        : statusFilter === 'LOCKED'
        ? h.status === 'LOCKED'
        : true;

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 page-enter font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold backdrop-blur-xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="status-pill status-pill-indigo text-[11px] font-bold">
              Phân Hệ Thẩm Định & Quản Trị Cơ Sở
            </span>
            <span className="status-pill status-pill-emerald text-[11px] font-bold">
              Thẩm Quyền Quản Trị Viên (ADMIN)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-indigo-600" />
            <span>Quản Trị & Xét Duyệt Cơ Sở Toàn Sàn</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-2xl mt-1">
            Thẩm định tính pháp lý, cấp phép hoạt động cho các cơ sở nhà trọ mới do Chủ trọ đề xuất và giám sát an toàn vận hành toàn mạng lưới.
          </p>
        </div>
      </div>



      {/* Bento KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bento-card p-5 space-y-2 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tổng Cơ Sở Toàn Sàn
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{housesList.length}</div>
          <div className="text-xs text-slate-400 pt-1 border-t border-slate-100">
            Tất cả chi nhánh đã khai báo
          </div>
        </div>

        <div className="bento-card p-5 space-y-2 hover:shadow-lg transition-all border-amber-200/60 bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Chờ Thẩm Định / Duyệt
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-700">{pendingCount}</div>
          <div className="text-xs text-amber-600 font-bold pt-1 border-t border-amber-200/40">
            {pendingCount > 0 ? '⚡ Cần xử lý cấp phép ngay' : 'Đã thẩm định 100%'}
          </div>
        </div>

        <div className="bento-card p-5 space-y-2 hover:shadow-lg transition-all border-emerald-200/60 bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Đang Hoạt Động
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700">{activeCount}</div>
          <div className="text-xs text-emerald-600 font-bold pt-1 border-t border-emerald-200/40">
            Đủ điều kiện kinh doanh
          </div>
        </div>

        <div className="bento-card p-5 space-y-2 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tạm Khóa Hoạt Động
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600">{lockedCount}</div>
          <div className="text-xs text-slate-400 pt-1 border-t border-slate-100">
            {lockedCount > 0 ? `${lockedCount} chi nhánh đang khóa` : 'Không có vi phạm'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bento-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`btn-press px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất Cả ({housesList.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`btn-press px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'PENDING'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Chờ Duyệt ({pendingCount})</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`btn-press px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đang Hoạt Động ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('LOCKED')}
            className={`btn-press px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'LOCKED'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tạm Khóa ({lockedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, mã CS, địa chỉ, quản lý..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Main Table: House Approval & Management */}
      <div className="bento-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Danh Mục Cơ Sở Nhà Trọ & Trạng Thái Phê Duyệt</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Admin thực hiện thẩm định điều kiện cơ sở, phê duyệt hoặc đình chỉ cơ sở theo quy chuẩn quản trị nền tảng SaaS.
            </p>
          </div>
          <span className="status-pill status-pill-indigo self-start sm:self-auto font-mono">
            Hiển thị: {filteredHouses.length} / {housesList.length} cơ sở
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 uppercase font-bold tracking-wider text-[11px] border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Mã & Tên Cơ Sở</th>
                <th className="py-3.5 px-4">Địa Chỉ Chi Tiết</th>
                <th className="py-3.5 px-4">Chủ Trọ / Người Quản Lý</th>
                <th className="py-3.5 px-4">Quy Mô Thiết Kế</th>
                <th className="py-3.5 px-4">Trạng Thái Thẩm Định</th>
                <th className="py-3.5 px-5 text-right">Thao Tác Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredHouses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-600">Không tìm thấy cơ sở nào phù hợp</p>
                    <p className="text-xs text-slate-400 mt-0.5">Vui lòng thay đổi từ khóa hoặc điều kiện bộ lọc</p>
                  </td>
                </tr>
              ) : (
                filteredHouses.map((h) => (
                  <tr key={h.code} className="hover:bg-slate-50/60 transition-colors">
                    {/* Code, Name & Thumbnail */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={h.imageUrl || h.image || h.thumbnail || (h.code === 'CS-03' ? '/assets/images/house_dong_da.jpg' : '/assets/images/house_cau_giay.jpg')}
                          alt={h.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{h.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                              {h.code}
                            </span>
                            {h.approvedAt && (
                              <span className="text-slate-400 text-[10px]">Duyệt: {h.approvedAt}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="py-4 px-4 max-w-xs text-slate-600">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed">{h.address}</span>
                      </div>
                    </td>

                    {/* Manager / Landlord */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{h.manager || 'Quản lý cơ sở'}</span>
                      </div>
                      <div className="text-slate-500 font-mono text-[11px] mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{h.managerPhone || 'Chưa có SĐT'}</span>
                      </div>
                      <div className="text-slate-400 text-[10px]">Tài khoản: @{h.createdBy || h.managerUsername || 'staff'}</div>
                    </td>

                    {/* Scale (Floors & Target Rooms) */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">
                        {h.floors || 4} Tầng • {h.totalRooms || 10} Phòng dự kiến
                      </div>
                      <div className="text-slate-400 text-[10px] mt-0.5">
                        {h.features && Array.isArray(h.features) ? h.features.slice(0, 2).join(', ') : 'Đầy đủ tiện ích'}
                      </div>
                    </td>

                    {/* Approval Status */}
                    <td className="py-4 px-4">
                      {h.status === 'PENDING_APPROVAL' ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-300 font-bold text-xs animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Chờ Phê Duyệt</span>
                          </span>
                          <div className="text-[10px] text-amber-600 font-medium">Chưa cấp phép vận hành</div>
                        </div>
                      ) : h.status === 'LOCKED' ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs">
                            <Lock className="w-3.5 h-3.5 text-rose-600" />
                            <span>Đang Tạm Khóa</span>
                          </span>
                          <div className="text-[10px] text-rose-600 font-medium">Ngừng đón khách</div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã Phê Duyệt</span>
                          </span>
                          <div className="text-[10px] text-emerald-600 font-medium">Đang hoạt động tốt</div>
                        </div>
                      )}
                    </td>

                    {/* Admin Actions */}
                    <td className="py-4 px-5 text-right">
                      {h.status === 'PENDING_APPROVAL' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleApproveHouse(h.code)}
                            className="btn-press px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1"
                            title="Phê duyệt cơ sở nhà trọ đưa vào hoạt động chính thức"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Duyệt Cơ Sở</span>
                          </button>
                          <button
                            onClick={() => handleRejectHouse(h.code)}
                            className="btn-press px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                            title="Từ chối yêu cầu và gỡ bỏ cơ sở"
                          >
                            Từ Chối
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleLockHouse(h.code)}
                            className={`btn-press px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer flex items-center gap-1 ${
                              h.status === 'LOCKED'
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                            title={h.status === 'LOCKED' ? 'Mở khóa hoạt động cho cơ sở' : 'Tạm khóa cơ sở do vi phạm'}
                          >
                            {h.status === 'LOCKED' ? (
                              <>
                                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Mở Khóa</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-slate-500" />
                                <span>Tạm Khóa</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectHouse(h.code)}
                            className="btn-press p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Xóa / gỡ bỏ cơ sở này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
