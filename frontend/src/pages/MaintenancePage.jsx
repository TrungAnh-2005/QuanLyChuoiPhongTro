import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Camera,
  Upload,
  UserCheck,
  DollarSign,
  Phone,
  Image,
  Tag,
  X,
  Zap,
  Droplets,
  Armchair,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import Modal from '../components/common/Modal';

const CATEGORIES = [
  { id: 'ELECTRICITY', label: 'Hệ thống Điện (Đèn, điều hòa, quạt, ổ cắm)', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'WATER', label: 'Hệ thống Nước (Vòi, rò rỉ, bồn cầu, nóng lạnh)', icon: Droplets, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'FURNITURE', label: 'Thiết bị Nội thất (Khóa cửa, giường, tủ, cửa sổ)', icon: Armchair, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'SANITATION', label: 'Vệ sinh & Môi trường (Rác thải, cống rãnh)', icon: Trash2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'OTHER', label: 'Sự cố khác', icon: Wrench, color: 'text-slate-600 bg-slate-50 border-slate-200' }
];

export default function MaintenancePage() {
  const { user, tenantRooms } = useAuth();
  const { tickets, createTicket, updateTicketStatus, tenants } = useData();
  const role = user?.role || 'ADMIN';
  const isTenant = role === 'TENANT';
  const isStaff = role === 'STAFF';
  const isAdmin = role === 'ADMIN';

  const isTenantNew = user?.username === 'tenant_new' || user?.fullName?.includes('Nam');
  const userRoom = isTenant && !isTenantNew
    ? (user?.room !== undefined && user?.room !== null
        ? user.room
        : (tenantRooms?.[user?.username] || tenantRooms?.[user?.fullName] || null))
    : null;

  // Lấy toàn bộ các phòng mà khách thuê này đang thuê
  const currentTenant = tenants.find((t) => {
    if (!user) return false;
    const userName = (user.fullName || '').toLowerCase();
    const tName = (t.fullName || '').toLowerCase();
    return userName.includes(tName) || tName.includes(userName.split(' ')[0]);
  });

  const myRentedRooms = isTenant && !isTenantNew
    ? (currentTenant?.rooms && currentTenant.rooms.length > 0
        ? currentTenant.rooms
        : (currentTenant?.room ? [currentTenant.room] : (userRoom ? [userRoom] : [])))
    : [];

  const [showModal, setShowModal] = useState(false);
  const [assignModal, setAssignModal] = useState(null); // ticket being assigned/updated by staff
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [newTicket, setNewTicket] = useState({
    room: myRentedRooms[0] || userRoom || 'Khu vực chung',
    category: 'ELECTRICITY',
    issue: '',
    tenant: user?.fullName || 'Khách thuê',
    priority: 'MEDIUM',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
  });

  const [staffForm, setStaffForm] = useState({
    technicianName: 'Nguyễn Văn Hùng',
    technicianPhone: '0988.112.233',
    cost: 150000,
    costBearer: 'LANDLORD', // LANDLORD | TENANT
    status: 'IN_PROGRESS'
  });

  const handleStatusChange = (id, newStatus) => {
    updateTicketStatus(id, newStatus);
  };

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!newTicket.issue) return;
    createTicket({
      room: isTenant ? (newTicket.room || myRentedRooms[0] || 'Khu vực chung') : newTicket.room,
      category: newTicket.category,
      issue: newTicket.issue,
      tenant: isTenant ? (user?.fullName || 'Khách thuê') : newTicket.tenant,
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

  const handleSaveStaffAssignment = (e) => {
    e.preventDefault();
    if (!assignModal) return;
    updateTicketStatus(assignModal.id, staffForm.status);
    // Lưu thông tin thợ và chi phí vào ticket
    assignModal.technicianName = staffForm.technicianName;
    assignModal.technicianPhone = staffForm.technicianPhone;
    assignModal.cost = staffForm.cost;
    assignModal.costBearer = staffForm.costBearer;
    setAssignModal(null);
  };

  const displayedTickets = isTenant
    ? tickets.filter(
        (t) =>
          myRentedRooms.includes(t.room) ||
          t.room.toLowerCase().includes('khu vực chung') ||
          (t.tenant && t.tenant.toLowerCase().includes((user?.fullName || '').toLowerCase()))
      )
    : tickets;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isTenant
              ? `Yêu Cầu Báo Hỏng Thiết Bị (${myRentedRooms.length > 0 ? myRentedRooms.map((r) => `P.${r.replace('P.', '')}`).join(', ') : 'Cư Dân'})`
              : 'Yêu Cầu Sửa Chữa & Điều Phối Kỹ Thuật'}
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {isTenant
              ? 'Gửi yêu cầu sửa chữa thiết bị, đính kèm hình ảnh hiện trường đến ban quản lý cơ sở.'
              : 'Tiếp nhận báo hỏng từ cư dân, phân công thợ sửa chữa và theo dõi chi phí phát sinh.'}
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-purple-600/25 transition-all btn-press cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isTenant ? 'Báo Hỏng Thiết Bị Kèm Ảnh' : 'Tạo Phiếu Sửa Chữa Mới'}</span>
          </button>
        )}
      </div>

      {/* Admin SoD Notice */}
      {isAdmin && (
        <div className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl flex items-center justify-between gap-3 shadow-md border border-slate-700 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <span className="font-extrabold text-white">Chế độ Giám sát SLA Bảo trì (Platform Administrator):</span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Admin giám sát tổng hợp thời gian phản hồi sự cố & SLA toàn chuỗi. Nghiệp vụ điều phối thợ sửa chữa và nghiệm thu thực tế do Chủ trọ (Staff) thực hiện độc lập theo nguyên tắc Tách biệt Trách nhiệm (SoD).
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0">
            SLA MONITORING
          </span>
        </div>
      )}

      {/* Tickets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedTickets.length === 0 ? (
          <div className="col-span-2 bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-500 text-sm">
            Hiện không có yêu cầu sửa chữa nào.
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

                  {isStaff && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssignModal(ticket);
                        setStaffForm({
                          technicianName: ticket.technicianName || 'Nguyễn Văn Hùng',
                          technicianPhone: ticket.technicianPhone || '0988.112.233',
                          cost: ticket.cost || 150000,
                          costBearer: ticket.costBearer || 'LANDLORD',
                          status: ticket.status || 'IN_PROGRESS'
                        });
                      }}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Điều phối thợ</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Tạo Phiếu Báo Hỏng Kèm Ảnh (UC-T04) */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-md">
        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-purple-600" />
          <span>Gửi Báo Hỏng Thiết Bị (Kèm Ảnh)</span>
        </h2>
        <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {isTenant ? 'Vị trí / Phòng gặp sự cố' : 'Số phòng hoặc khu vực sự cố'} *
            </label>
            {isTenant ? (
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
            ) : (
              <input
                type="text"
                required
                placeholder="Ví dụ: P.101 hoặc Khu vực chung"
                value={newTicket.room}
                onChange={(e) => setNewTicket({ ...newTicket, room: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
              />
            )}
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

          {/* Photo attachment */}
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
                  className="px-2 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-[10px] font-bold rounded-lg border border-slate-200"
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
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
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

      {/* Modal Phân Công Kỹ Thuật Viên & Nghiệm Thu Cho Staff (UC-S05) */}
      <Modal isOpen={!!assignModal} onClose={() => setAssignModal(null)} maxWidth="max-w-md">
        {assignModal && (
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-600" />
              <span>Điều Phối Thợ Sửa Chữa Phòng {assignModal.room}</span>
            </h2>

            <form onSubmit={handleSaveStaffAssignment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Trạng thái xử lý sự cố *</label>
                <select
                  value={staffForm.status}
                  onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="PENDING">🟡 Chờ tiếp nhận</option>
                  <option value="IN_PROGRESS">🟣 Đang xử lý / Đã phân công thợ</option>
                  <option value="RESOLVED">🟢 Đã hoàn tất & Nghiệm thu xong</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ tên thợ kỹ thuật *</label>
                <input
                  type="text"
                  required
                  value={staffForm.technicianName}
                  onChange={(e) => setStaffForm({ ...staffForm, technicianName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ thợ *</label>
                <input
                  type="tel"
                  required
                  value={staffForm.technicianPhone}
                  onChange={(e) => setStaffForm({ ...staffForm, technicianPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chi phí sửa chữa (VNĐ)</label>
                  <input
                    type="number"
                    value={staffForm.cost}
                    onChange={(e) => setStaffForm({ ...staffForm, cost: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bên chịu chi phí</label>
                  <select
                    value={staffForm.costBearer}
                    onChange={(e) => setStaffForm({ ...staffForm, costBearer: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="LANDLORD">Chủ trọ chịu (Bảo hành)</option>
                    <option value="TENANT">Khách thuê tự chịu</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md cursor-pointer"
                >
                  Cập Nhật Tiến Độ & Phân Công
                </button>
              </div>
            </form>
          </div>
        )}
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
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black"
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
