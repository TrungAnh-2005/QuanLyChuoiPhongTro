import React, { useState, useMemo } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Zap,
  Droplets,
  Armchair,
  Home,
  X,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Modal from '@/components/common/Modal';

const CATEGORIES = [
  { id: 'ELECTRICITY', label: 'Hệ thống Điện (Đèn, quạt, điều hòa, ổ cắm)', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'WATER', label: 'Hệ thống Nước (Vòi, bồn cầu, bình nóng lạnh, rò rỉ)', icon: Droplets, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'FURNITURE', label: 'Nội thất & Khóa (Khóa cửa, bản lề, giường, tủ)', icon: Armchair, color: 'text-purple-600 bg-purple-50 border-purple-200' },
];

export default function TenantMaintenancePage() {
  const { user, tenantRooms } = useAuth();
  const { tickets = [], createTicket, tenants = [], contracts = [] } = useData();

  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'

  // Tìm phòng của khách thuê
  const currentTenant = useMemo(() => {
    return (tenants || []).find(
      (t) => t.username === user?.username || t.phone === user?.phone || (user?.fullName && t.fullName?.toLowerCase().includes(user.fullName.toLowerCase()))
    );
  }, [tenants, user]);

  const activeContract = useMemo(() => {
    return (contracts || []).find((c) => {
      const matchPhone = c.tenantPhone && user?.phone && c.tenantPhone === user.phone;
      const matchName = c.tenantName && user?.fullName && c.tenantName.toLowerCase().includes(user.fullName.toLowerCase());
      return (matchPhone || matchName) && (c.status === 'ACTIVE' || c.status === 'EXPIRED' || c.status === 'PENDING_TERMINATION');
    });
  }, [contracts, user]);

  const myRentedRooms = useMemo(() => {
    const list = [];
    if (activeContract?.roomNumber && !list.includes(activeContract.roomNumber)) list.push(activeContract.roomNumber);
    if (currentTenant?.room && !list.includes(currentTenant.room)) list.push(currentTenant.room);
    if (user?.room && !list.includes(user.room)) list.push(user.room);
    if (Array.isArray(tenantRooms)) {
      tenantRooms.forEach((r) => { if (r && !list.includes(r)) list.push(r); });
    }
    return list;
  }, [currentTenant, user, tenantRooms, activeContract]);

  const defaultRoom = myRentedRooms[0] || 'P.101';

  // Form tạo phiếu mới
  const [newTicket, setNewTicket] = useState({
    room: defaultRoom,
    category: 'ELECTRICITY',
    issue: '',
    priority: 'MEDIUM',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTicket.issue.trim()) return;

    createTicket({
      room: newTicket.room || defaultRoom,
      category: newTicket.category,
      issue: newTicket.issue,
      tenant: user?.fullName || 'Khách thuê',
      priority: newTicket.priority,
      imageUrl: newTicket.imageUrl,
      status: 'PENDING'
    });

    setShowModal(false);
    setNewTicket({
      room: defaultRoom,
      category: 'ELECTRICITY',
      issue: '',
      priority: 'MEDIUM',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
    });
  };

  // Lọc vé bảo trì của khách thuê
  const myTickets = useMemo(() => {
    return (tickets || []).filter((t) => {
      const isMyRoom = myRentedRooms.includes(t.room) || (t.room && myRentedRooms.some(r => t.room.includes(r)));
      const isMyName = t.tenant && user?.fullName && t.tenant.toLowerCase().includes(user.fullName.toLowerCase());
      const isCommon = typeof t.room === 'string' && t.room.toLowerCase().includes('khu vực chung');
      return isMyRoom || isMyName || isCommon;
    });
  }, [tickets, myRentedRooms, user]);

  const displayedTickets = useMemo(() => {
    if (filterStatus === 'ALL') return myTickets;
    return myTickets.filter((t) => t.status === filterStatus);
  }, [myTickets, filterStatus]);

  const pendingCount = myTickets.filter((t) => t.status === 'PENDING').length;
  const inProgressCount = myTickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = myTickets.filter((t) => t.status === 'RESOLVED').length;

  return (
    <div className="space-y-6 page-enter pb-10">
      {/* Header Banner */}
      <div className="hero-gradient-shine bg-gradient-to-r from-rose-700 via-pink-700 to-indigo-700 text-white p-6 rounded-2xl shadow-xl shadow-rose-600/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-2">
            <Wrench className="w-3.5 h-3.5" />
            <span>Báo Hỏng & Sửa Chữa • Cổng Cư Dân</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Tiếp Nhận Sự Cố & Bảo Trì Thiết Bị {myRentedRooms.length > 0 && `(Phòng ${myRentedRooms.join(', ')})`}
          </h1>
          <p className="text-rose-100 text-sm mt-1 max-w-2xl">
            Gửi yêu cầu sửa chữa hỏng hóc thiết bị phòng trọ kèm hình ảnh hiện trường để Ban Quản Lý phân công kỹ thuật viên xử lý nhanh nhất.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-press px-5 py-2.5 bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Báo Hỏng Thiết Bị Kèm Ảnh</span>
        </button>
      </div>

      {/* 3 Thẻ Thống Kê Nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Chờ Tiếp Nhận</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {pendingCount} phiếu
          </div>
          <div className="text-xs text-slate-400 font-medium">BQL đang sắp xếp thợ kỹ thuật</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Đang Xử Lý</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 font-mono">
            {inProgressCount} phiếu
          </div>
          <div className="text-xs text-slate-400 font-medium">Thợ đang tiến hành kiểm tra sửa chữa</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Đã Hoàn Thành</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {resolvedCount} phiếu
          </div>
          <div className="text-xs text-slate-400 font-medium">Đã nghiệm thu và bàn giao phòng</div>
        </div>
      </div>

      {/* Bộ Lọc Trạng Thái */}
      <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất Cả ({myTickets.length})
          </button>
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Chờ Xử Lý ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('IN_PROGRESS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'IN_PROGRESS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Đang Xử Lý ({inProgressCount})
          </button>
          <button
            onClick={() => setFilterStatus('RESOLVED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'RESOLVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Đã Xong ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Danh Sách Vé Báo Hỏng */}
      {displayedTickets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <p className="font-semibold text-slate-700">Hiện tại không có sự cố hoặc phiếu bảo trì nào.</p>
          <p className="text-xs text-slate-400">Nếu phòng bạn gặp trục trặc thiết bị, hãy bấm nút &quot;Báo Hỏng Thiết Bị&quot; ở trên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedTickets.map((t) => {
            const isResolved = t.status === 'RESOLVED';
            const isInProgress = t.status === 'IN_PROGRESS';
            const cat = CATEGORIES.find((c) => c.id === t.category) || CATEGORIES[0];
            const CatIcon = cat.icon;

            return (
              <div
                key={t.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3 hover:border-rose-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cat.color}`}>
                      <CatIcon className="w-3 h-3" />
                      <span>{cat.label.split('(')[0].trim()}</span>
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isResolved
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : isInProgress
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {isResolved ? '✓ Đã Hoàn Thành' : isInProgress ? '⏳ Đang Xử Lý' : 'Chờ Tiếp Nhận'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{t.issue}</h3>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Home className="w-3.5 h-3.5 text-slate-400" />
                        <span>Phòng: <strong className="text-purple-700 font-mono">{t.room}</strong></span>
                      </span>
                      <span>•</span>
                      <span>Ưu tiên: <strong className="text-slate-700 font-semibold">{t.priority || 'Trung bình'}</strong></span>
                    </div>
                  </div>

                  {t.imageUrl && (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                      <img src={t.imageUrl} alt="Hiện trường sự cố" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {t.technicianName && (
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between bg-slate-50/60 p-2.5 rounded-xl">
                    <span>Thợ phụ trách: <strong className="text-slate-800">{t.technicianName}</strong></span>
                    {t.technicianPhone && <span className="font-mono text-purple-700 font-bold">{t.technicianPhone}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Báo Hỏng Kèm Ảnh */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Báo Hỏng Thiết Bị & Gửi Sự Cố"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Khu vực sự cố (Phòng)
              </label>
              <input
                type="text"
                value={newTicket.room}
                onChange={(e) => setNewTicket({ ...newTicket, room: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50"
                placeholder="VD: P.101"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Danh mục thiết bị
              </label>
              <select
                value={newTicket.category}
                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mô tả chi tiết sự cố hỏng hóc *
              </label>
              <textarea
                rows={3}
                required
                value={newTicket.issue}
                onChange={(e) => setNewTicket({ ...newTicket, issue: e.target.value })}
                placeholder="VD: Điều hòa chảy nước liên tục, vòi sen bị gãy..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Link ảnh hiện trường (Tùy chọn)
              </label>
              <input
                type="url"
                value={newTicket.imageUrl}
                onChange={(e) => setNewTicket({ ...newTicket, imageUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Gửi Phiếu Báo Hỏng
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
