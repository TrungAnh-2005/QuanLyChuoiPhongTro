import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Camera,
  UserCheck,
  Phone,
  Zap,
  Droplets,
  Armchair,
  Trash2,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Modal from '../../components/common/Modal';

const CATEGORIES = [
  { id: 'ELECTRICITY', label: 'Hệ thống Điện (Đèn, điều hòa, quạt, ổ cắm)', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'WATER', label: 'Hệ thống Nước (Vòi, rò rỉ, bồn cầu, nóng lạnh)', icon: Droplets, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'FURNITURE', label: 'Thiết bị Nội thất (Khóa cửa, giường, tủ, cửa sổ)', icon: Armchair, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'SANITATION', label: 'Vệ sinh & Môi trường (Rác thải, cống rãnh)', icon: Trash2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'OTHER', label: 'Sự cố khác', icon: Wrench, color: 'text-slate-600 bg-slate-50 border-slate-200' }
];

export default function UserMaintenancePage() {
  const { user, tenantRooms } = useAuth();
  const { tickets, createTicket, tenants, rooms = [] } = useData();

  const isTenantNew = user?.username === 'tenant_new' || user?.fullName?.includes('Nam');
  const userRoom = !isTenantNew
    ? (user?.room !== undefined && user?.room !== null
        ? user.room
        : (tenantRooms?.[user?.username] || tenantRooms?.[user?.fullName] || null))
    : null;

  // Lấy toàn bộ các phòng mà khách thuê này đang thuê
  const currentTenant = (tenants || []).find((t) => {
    if (!user) return false;
    const userName = (user.fullName || '').toLowerCase();
    const tName = (t.fullName || '').toLowerCase();
    return userName.includes(tName) || tName.includes(userName.split(' ')[0]);
  });

  const myRentedRooms = !isTenantNew
    ? (currentTenant?.rooms && currentTenant.rooms.length > 0
        ? currentTenant.rooms
        : (currentTenant?.room ? [currentTenant.room] : (userRoom ? [userRoom] : [])))
    : [];

  const activeRentedRooms = (myRentedRooms || []).filter((r) => r && String(r).trim() && String(r).trim() !== 'null' && String(r).trim() !== 'undefined');

  const [showModal, setShowModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [newTicket, setNewTicket] = useState({
    room: myRentedRooms[0] || userRoom || 'Khu vực chung',
    category: 'ELECTRICITY',
    issue: '',
    tenant: user?.fullName || 'Khách thuê',
    priority: 'MEDIUM',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
  });

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!newTicket.issue) return;
    const targetRoomName = newTicket.room || myRentedRooms[0] || 'Khu vực chung';
    const targetRoomObj = (rooms || []).find((r) => r.number === targetRoomName);
    const resolvedHouseCode = targetRoomObj?.houseCode || null;

    createTicket({
      room: targetRoomName,
      houseCode: resolvedHouseCode,
      category: newTicket.category,
      issue: newTicket.issue,
      tenant: user?.fullName || 'Khách thuê',
      priority: newTicket.priority,
      imageUrl: newTicket.imageUrl,
      status: 'PENDING'
    });
    setShowModal(false);
    setNewTicket({
      room: myRentedRooms[0] || userRoom || 'Khu vực chung',
      category: 'ELECTRICITY',
      issue: '',
      tenant: user?.fullName || 'Khách thuê',
      priority: 'MEDIUM',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
    });
  };

  const displayedTickets = useMemo(() => {
    return (tickets || []).filter(
      (t) =>
        myRentedRooms.includes(t.room) ||
        (typeof t.room === 'string' && t.room.toLowerCase().includes('khu vực chung')) ||
        (t.tenant && t.tenant.toLowerCase().includes((user?.fullName || '').toLowerCase()))
    );
  }, [tickets, myRentedRooms, user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Yêu Cầu Báo Hỏng Thiết Bị ({activeRentedRooms.length > 0 ? activeRentedRooms.map((r) => `P.${String(r).replace('P.', '')}`).join(', ') : 'Chưa Thuê Phòng'})
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Gửi yêu cầu sửa chữa thiết bị, đính kèm hình ảnh hiện trường đến ban quản lý cơ sở.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-purple-600/25 transition-all btn-press cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Báo Hỏng Thiết Bị Kèm Ảnh</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedTickets.length === 0 ? (
          <div className="col-span-2 bg-white border border-slate-200/80 rounded-3xl p-10 text-center shadow-xs space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60 shadow-xs">
              <Wrench className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">
                Chưa có yêu cầu báo hỏng hay sự cố nào
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Trang thiết bị phòng đang hoạt động bình thường. Nếu phát sinh sự cố điện, nước hoặc nội thất, bạn có thể tạo phiếu mới ngay bên dưới.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 transition-all btn-press cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Báo Hỏng Thiết Bị Mới</span>
              </button>
            </div>
          </div>
        ) : (
          displayedTickets.map((ticket, idx) => {
            const cat = CATEGORIES.find((c) => c.id === ticket.category) || CATEGORIES[0];
            const CatIcon = cat.icon;

            return (
              <div
                key={ticket.id}
                className={`bg-white border border-slate-200/80 rounded-2xl p-5 card-interactive stagger-item stagger-${(idx % 4) + 1} flex flex-col justify-between shadow-xs`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-purple-700 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 shadow-2xs">
                        {ticket.room}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${cat.color}`}>
                        <CatIcon className="w-3 h-3" />
                        <span>{cat.id}</span>
                      </span>
                    </div>

                    <div>
                      {ticket.priority === 'HIGH' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                          Khẩn cấp
                        </span>
                      )}
                      {ticket.priority === 'MEDIUM' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                          Bình thường
                        </span>
                      )}
                      {ticket.priority === 'LOW' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          Thấp
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 font-medium mt-1">
                    Người báo: <strong className="text-slate-800">{ticket.tenant}</strong> • {ticket.date}
                  </div>

                  <div className="mt-3 text-sm text-slate-800 font-semibold leading-relaxed">
                    {ticket.issue}
                  </div>

                  {/* Photo evidence preview */}
                  {ticket.imageUrl && (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(ticket.imageUrl)}
                        className="group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:ring-2 hover:ring-purple-400 transition-all cursor-pointer"
                      >
                        <img
                          src={ticket.imageUrl}
                          alt="Ảnh hiện trường"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                      </button>
                      <span className="text-[11px] text-slate-500 italic">
                        (Nhấp vào ảnh để xem bằng chứng hiện trường)
                      </span>
                    </div>
                  )}

                  {/* Assigned Technician Info */}
                  {ticket.technicianName && (
                    <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span className="flex items-center gap-1.5 text-purple-700">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Thợ phụ trách: {ticket.technicianName}</span>
                        </span>
                        <a href={`tel:${ticket.technicianPhone}`} className="text-indigo-600 hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{ticket.technicianPhone}</span>
                        </a>
                      </div>
                      {ticket.cost > 0 && (
                        <div className="text-[11px] text-slate-600">
                          Chi phí sửa chữa: <strong className="text-slate-900">{Number(ticket.cost).toLocaleString('vi-VN')} đ</strong> ({ticket.costBearer === 'TENANT' ? 'Khách chịu phí' : 'Chủ trọ bảo hành'})
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Tiến độ:</span>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                      ticket.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : ticket.status === 'IN_PROGRESS'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {ticket.status === 'RESOLVED'
                        ? '🟢 Đã hoàn tất'
                        : ticket.status === 'IN_PROGRESS'
                        ? '🟣 Đang xử lý'
                        : '🟡 Chờ tiếp nhận'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Tạo Phiếu Báo Hỏng Kèm Ảnh */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-md">
        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-purple-600" />
          <span>Gửi Báo Hỏng Thiết Bị (Kèm Ảnh)</span>
        </h2>
        <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Vị trí / Phòng gặp sự cố *
            </label>
            <select
              value={newTicket.room}
              onChange={(e) => setNewTicket({ ...newTicket, room: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 cursor-pointer"
            >
              {myRentedRooms.map((rm) => (
                <option key={rm} value={rm}>
                  Phòng {rm} (Phòng bạn đang thuê)
                </option>
              ))}
              <option value="Khu vực chung">
                Khu vực sinh hoạt chung (Nhà xe, Sân phơi, Cổng chính)
              </option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Danh mục thiết bị gặp sự cố *</label>
            <select
              value={newTicket.category}
              onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Mô tả chi tiết hỏng hóc *</label>
            <textarea
              rows={3}
              required
              placeholder="Ví dụ: Vòi xịt bồn cầu bị rỉ nước liên tục, chảy tràn ra sàn..."
              value={newTicket.issue}
              onChange={(e) => setNewTicket({ ...newTicket, issue: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Mức độ ưu tiên</label>
            <select
              value={newTicket.priority}
              onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
            >
              <option value="LOW">Thấp (Đèn mờ, rèm lỏng...)</option>
              <option value="MEDIUM">Bình thường (Cửa kẹt, quạt kêu...)</option>
              <option value="HIGH">Khẩn cấp (Chập điện, vỡ ống nước, hỏng khóa chính...)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Hình ảnh bằng chứng hiện trường</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTicket.imageUrl}
                onChange={(e) => setNewTicket({ ...newTicket, imageUrl: e.target.value })}
                placeholder="Dán link ảnh hoặc chọn ảnh mẫu..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px]"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[
                { label: 'Ảnh vòi nước', url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop' },
                { label: 'Ảnh điều hòa', url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600&auto=format&fit=crop' },
                { label: 'Ảnh chập điện', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop' }
              ].map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => setNewTicket({ ...newTicket, imageUrl: sample.url })}
                  className="px-2 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-[10px] font-bold rounded-lg border border-slate-200 cursor-pointer"
                >
                  + {sample.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-md btn-press cursor-pointer"
            >
              Gửi Yêu Cầu Sửa Chữa
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Xem Ảnh Phóng To */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-xl max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedPhoto} alt="Ảnh sự cố" className="w-full h-auto rounded-xl object-contain max-h-[80vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
