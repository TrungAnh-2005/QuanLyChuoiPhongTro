import { Fragment, useState, useMemo } from 'react';
import {
  Wrench,
  Plus,
  ShieldCheck,
  Camera,
  UserCheck,
  Phone,
  Zap,
  Droplets,
  Armchair,
  Trash2,
  Search,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle2,
  MapPin,
  ImageOff
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useData } from '../../../shared/data/RentalDataContext';
import Modal from '../../../components/shared/Modal';
import MaintenancePhotoPreview from '../../../components/maintenance/MaintenancePhotoPreview';
import MaintenanceRequestModal from '../../../components/maintenance/MaintenanceRequestModal';

const CATEGORIES = [
  { id: 'ELECTRICITY', label: 'Hệ thống Điện (Đèn, điều hòa, quạt, ổ cắm)', shortLabel: 'Hệ thống Điện', icon: Zap, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'WATER', label: 'Hệ thống Nước (Vòi, rò rỉ, bồn cầu, nóng lạnh)', shortLabel: 'Hệ thống Nước', icon: Droplets, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'FURNITURE', label: 'Thiết bị Nội thất (Khóa cửa, giường, tủ, cửa sổ)', shortLabel: 'Nội thất', icon: Armchair, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { id: 'SANITATION', label: 'Vệ sinh & Môi trường (Rác thải, cống rãnh)', shortLabel: 'Vệ sinh', icon: Trash2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'OTHER', label: 'Sự cố khác', shortLabel: 'Sự cố khác', icon: Wrench, color: 'text-slate-700 bg-slate-50 border-slate-200' }
];

function formatReportDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function StatusBadge({ status }) {
  if (status === 'RESOLVED' || status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <CheckCircle2 className="w-3 h-3" />
        <span>Đã hoàn tất</span>
      </span>
    );
  }
  if (status === 'IN_PROGRESS') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
        <Wrench className="w-3 h-3" />
        <span>Đang xử lý</span>
      </span>
    );
  }
  if (status === 'CANCELLED' || status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
        <span>{status === 'CANCELLED' ? 'Đã hủy' : 'Từ chối'}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
      <Clock className="w-3 h-3" />
      <span>Chờ tiếp nhận</span>
    </span>
  );
}

function PriorityBadge({ priority }) {
  if (priority === 'HIGH' || priority === 'URGENT') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        Khẩn cấp
      </span>
    );
  }
  if (priority === 'MEDIUM') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        Bình thường
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
      Thấp
    </span>
  );
}

export default function StaffMaintenancePage() {
  const { boardingHouses: apiBoardingHouses = [] } = useData() || {};
  const { user } = useAuth();
  const { tickets = [], createTicket, updateTicketStatus, addMaintenanceFeeToInvoice, rooms = [] } = useData();
  const role = user?.role || 'STAFF';
  const isAdmin = role === 'ADMIN';

  const staffManageableHouses = useMemo(() => {
    try {
      const dynamicHouses = Array.isArray(apiBoardingHouses) ? apiBoardingHouses : [];
      if (isAdmin) return dynamicHouses;
      const u = (user?.username || '').toLowerCase();
      return dynamicHouses.filter((h) => {
        if (user?.isTestMode) return true;
        const created = (h.createdBy || '').toLowerCase();
        const manager = (h.managerUsername || '').toLowerCase();
        if (created && created === u) return true;
        if (manager && manager === u) return true;
        if (user?.houseCode && h.code === user.houseCode) return true;
        return false;
      });
    } catch {
      return [];
    }
  }, [user, isAdmin, apiBoardingHouses]);

  const staffHouseCodes = useMemo(() => staffManageableHouses.map((h) => h.code), [staffManageableHouses]);

  const [showModal, setShowModal] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [newTicket, setNewTicket] = useState({
    room: 'P.101',
    category: 'ELECTRICITY',
    issue: '',
    tenant: 'Quản lý cơ sở',
    priority: 'MEDIUM',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
  });

  const [staffForm, setStaffForm] = useState({
    technicianName: 'Nguyễn Văn Hùng',
    technicianPhone: '0988.112.233',
    cost: 150000,
    costBearer: 'LANDLORD',
    addToInvoice: true,
    status: 'IN_PROGRESS'
  });

  const handleCreateTicket = async (e) => {
    try {
      e.preventDefault();
      if (!newTicket.issue) return;
      const targetRoomObj = (rooms || []).find((r) => r.number === newTicket.room);
      const resolvedHouseCode = targetRoomObj?.houseCode || (staffHouseCodes[0] || null);

      await createTicket({
        room: newTicket.room,
        houseCode: resolvedHouseCode,
        category: newTicket.category,
        issue: newTicket.issue,
        tenant: newTicket.tenant || user?.fullName || 'Quản lý cơ sở',
        priority: newTicket.priority,
        imageUrl: newTicket.imageUrl,
        status: 'PENDING'
      });
      setShowModal(false);
      setNewTicket({
        room: 'P.101',
        category: 'ELECTRICITY',
        issue: '',
        tenant: 'Quản lý cơ sở',
        priority: 'MEDIUM',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'
      });
    } catch (error) {
      window.dispatchEvent(new CustomEvent('rental:api-error', { detail: error.message }));
      return { success: false, error: error.message };
    }
  };

  const handleSaveStaffAssignment = async (e) => {
    try {
      e.preventDefault();
      if (!assignModal) return;
      await updateTicketStatus(assignModal.id, staffForm.status, {
        cost: Number(staffForm.cost || 0),
        assignedTo: staffForm.technicianName,
        note: staffForm.technicianPhone || ''
      });
      if (staffForm.costBearer === 'TENANT' && staffForm.addToInvoice && staffForm.cost > 0 && addMaintenanceFeeToInvoice) {
        await addMaintenanceFeeToInvoice(assignModal.room, staffForm.cost, `Phí sửa chữa: ${assignModal.issue}`);
      }
      setAssignModal(null);
    } catch (error) {
      window.dispatchEvent(new CustomEvent('rental:api-error', { detail: error.message }));
      return { success: false, error: error.message };
    }
  };

  const displayedTickets = useMemo(() => {
    const base = isAdmin
      ? tickets || []
      : staffHouseCodes.length === 0
      ? []
      : (tickets || []).filter((t) => {
          if (t.houseCode && staffHouseCodes.includes(t.houseCode)) return true;
          const ticketRoom = (rooms || []).find((r) => String(r.id) === String(t.roomId) || r.number === t.room);
          if (ticketRoom?.houseCode) return staffHouseCodes.includes(ticketRoom.houseCode);
          if (t.room && t.room.startsWith('P.') && staffHouseCodes.includes('CS-01')) return true;
          return false;
        });

    return base.map((t) => {
      const roomObj = (rooms || []).find((r) => String(r.id) === String(t.roomId) || r.number === t.room);
      const houseObj = (apiBoardingHouses || []).find(
        (h) => String(h.id) === String(roomObj?.boardingHouseId) || (h.code && h.code === (t.houseCode || roomObj?.houseCode))
      );
      return {
        ...t,
        resolvedRoom: t.room || roomObj?.number || (t.roomId ? `Phòng #${t.roomId}` : 'Khu vực chung'),
        resolvedHouseName: houseObj?.name || roomObj?.house || t.houseCode || 'Chưa xác định cơ sở',
        resolvedAddress: houseObj?.address || '',
        resolvedReporter: t.tenant || (t.blocksRental ? 'Quản lý cơ sở (Bảo trì phòng trống)' : 'Khách thuê'),
        resolvedTechnician: t.assignedTo || t.technicianName || '',
        resolvedTechPhone: t.technicianPhone || t.note || ''
      };
    });
  }, [tickets, staffHouseCodes, rooms, isAdmin, apiBoardingHouses]);

  const statusCounts = useMemo(() => {
    const counts = { ALL: displayedTickets.length, PENDING: 0, IN_PROGRESS: 0, RESOLVED: 0 };
    displayedTickets.forEach((t) => {
      if (t.status === 'RESOLVED' || t.status === 'COMPLETED') counts.RESOLVED++;
      else if (t.status === 'IN_PROGRESS') counts.IN_PROGRESS++;
      else if (t.status === 'PENDING') counts.PENDING++;
    });
    return counts;
  }, [displayedTickets]);

  const filteredTickets = useMemo(() => {
    return displayedTickets.filter((t) => {
      if (statusFilter === 'RESOLVED') {
        if (t.status !== 'RESOLVED' && t.status !== 'COMPLETED') return false;
      } else if (statusFilter !== 'ALL' && t.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = [
          t.resolvedRoom,
          t.resolvedHouseName,
          t.resolvedAddress,
          t.resolvedReporter,
          t.title,
          t.issue,
          t.ticketCode
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [displayedTickets, statusFilter, searchQuery]);

  const openAssignModal = (ticket) => {
    setAssignModal(ticket);
    setStaffForm({
      technicianName: ticket.resolvedTechnician || 'Nguyễn Văn Hùng',
      technicianPhone: ticket.resolvedTechPhone || '0988.112.233',
      cost: Number(ticket.cost || 0) || 150000,
      costBearer: ticket.costBearer || 'LANDLORD',
      status: ticket.status || 'IN_PROGRESS',
      addToInvoice: true
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Yêu Cầu Sửa Chữa & Điều Phối Kỹ Thuật
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Theo dõi sự cố theo dạng bảng; nhấp vào từng hàng để mở rộng xem đầy đủ chi tiết phiếu ngay bên dưới.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-purple-600/25 transition-all btn-press cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Phiếu Sửa Chữa Mới</span>
        </button>
      </div>

      {/* Admin SLA Notice */}
      {isAdmin && (
        <div className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl flex items-center justify-between gap-3 shadow-md border border-slate-700 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <span className="font-extrabold text-white">Chế độ Giám sát SLA Bảo trì (Platform Administrator):</span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Admin giám sát tổng hợp thời gian phản hồi sự cố & SLA toàn chuỗi. Nghiệp vụ điều phối thợ sửa chữa và nghiệm thu thực tế do Chủ trọ (Staff) thực hiện độc lập.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0">
            SLA MONITORING
          </span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {[
            { id: 'ALL', label: `Tất cả (${statusCounts.ALL})` },
            { id: 'PENDING', label: `Chờ tiếp nhận (${statusCounts.PENDING})` },
            { id: 'IN_PROGRESS', label: `Đang xử lý (${statusCounts.IN_PROGRESS})` },
            { id: 'RESOLVED', label: `Đã hoàn tất (${statusCounts.RESOLVED})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm số phòng, địa chỉ, người báo..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-purple-500 font-medium"
          />
        </div>
      </div>

      {/* Master Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {filteredTickets.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60">
              <Wrench className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">
                Chưa có yêu cầu báo hỏng hay sự cố nào
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Hiện không có phiếu báo hỏng nào khớp với bộ lọc hiện tại trong các cơ sở thuộc thẩm quyền của bạn.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Số phòng</th>
                  <th className="px-4 py-3.5">Địa chỉ</th>
                  <th className="px-4 py-3.5">Người báo</th>
                  <th className="px-4 py-3.5">Ngày báo</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => {
                  const isSelected = String(ticket.id) === String(selectedTicketId);
                  const cat = CATEGORIES.find((c) => c.id === ticket.category) || CATEGORIES[0];
                  const CatIcon = cat.icon;
                  return (
                    <Fragment key={ticket.id}>
                      <tr
                        onClick={() => setSelectedTicketId(isSelected ? null : ticket.id)}
                        aria-expanded={isSelected}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-purple-50/70'
                            : 'hover:bg-slate-50/90'
                        }`}
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <ChevronDown className="w-4 h-4 text-purple-600 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="font-extrabold text-purple-700 px-2 py-0.5 rounded-lg bg-purple-50 border border-purple-200">
                              {ticket.resolvedRoom}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-800">{ticket.resolvedHouseName}</div>
                          {ticket.resolvedAddress && (
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {ticket.resolvedAddress}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                          {ticket.resolvedReporter}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {formatReportDate(ticket.date || ticket.requestedDate || ticket.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge status={ticket.status} />
                        </td>
                      </tr>

                      {isSelected && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={5} className="p-0 border-t border-purple-200/70">
                            <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs border-l-4 border-purple-500 animate-in fade-in">
                              {/* Left: Ticket Content & Evidence */}
                              <div className="lg:col-span-7 space-y-3.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                    {ticket.ticketCode || `#${ticket.id}`}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${cat.color}`}>
                                    <CatIcon className="w-3.5 h-3.5" />
                                    <span>{cat.shortLabel}</span>
                                  </span>
                                  <PriorityBadge priority={ticket.priority} />
                                </div>

                                <div>
                                  {ticket.title && ticket.title !== ticket.issue && (
                                    <h3 className="text-sm font-extrabold text-slate-900 mb-1">
                                      {ticket.title}
                                    </h3>
                                  )}
                                  <p className="text-sm text-slate-800 font-medium leading-relaxed bg-white border border-slate-200/80 rounded-xl p-3.5">
                                    {ticket.issue || ticket.description || 'Không có mô tả chi tiết.'}
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-slate-200/70 rounded-xl p-3">
                                  <div className="flex items-start gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                                    <div>
                                      <div className="font-bold text-slate-900">{ticket.resolvedHouseName}</div>
                                      {ticket.resolvedAddress && (
                                        <div className="text-[11px] text-slate-500">{ticket.resolvedAddress}</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-1 text-[11px]">
                                    <div>
                                      <span className="text-slate-500">Người báo: </span>
                                      <strong className="text-slate-900">{ticket.resolvedReporter}</strong>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Thời gian báo: </span>
                                      <span className="font-mono font-semibold text-slate-800">
                                        {formatReportDate(ticket.date || ticket.requestedDate || ticket.createdAt)}
                                      </span>
                                    </div>
                                    {ticket.resolvedAt && (
                                      <div>
                                        <span className="text-slate-500">Hoàn tất lúc: </span>
                                        <span className="font-mono font-semibold text-emerald-700">
                                          {formatReportDate(ticket.resolvedAt)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Photo Evidence */}
                                <div>
                                  {ticket.imageUrl ? (
                                    <div className="flex items-center gap-3">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedPhoto(ticket.imageUrl);
                                        }}
                                        className="group relative w-20 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:ring-2 hover:ring-purple-400 transition-all cursor-pointer shrink-0"
                                      >
                                        <img
                                          src={ticket.imageUrl}
                                          alt="Ảnh hiện trường"
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Camera className="w-4 h-4 text-white" />
                                        </div>
                                      </button>
                                      <span className="text-[11px] text-slate-500">
                                        Nhấp vào ảnh để phóng to bằng chứng hiện trường.
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-dashed border-slate-200 text-slate-400 text-[11px]">
                                      <ImageOff className="w-3.5 h-3.5" />
                                      <span>Phiếu này không đính kèm hình ảnh.</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right: Technician & Cost & Actions */}
                              <div className="lg:col-span-5 flex flex-col justify-between gap-3.5 bg-white border border-slate-200 rounded-2xl p-4">
                                <div className="space-y-2.5">
                                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Thông tin điều phối & chi phí
                                  </div>

                                  {ticket.resolvedTechnician ? (
                                    <div className="space-y-2 text-xs">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-slate-500 flex items-center gap-1.5">
                                          <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                                          <span>Thợ phụ trách:</span>
                                        </span>
                                        <strong className="text-slate-900">{ticket.resolvedTechnician}</strong>
                                      </div>
                                      {ticket.resolvedTechPhone && (
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-slate-500">Liên hệ / Ghi chú:</span>
                                          <a
                                            href={`tel:${ticket.resolvedTechPhone}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-indigo-600 hover:underline font-semibold inline-flex items-center gap-1"
                                          >
                                            <Phone className="w-3 h-3" />
                                            <span>{ticket.resolvedTechPhone}</span>
                                          </a>
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                        <span className="text-slate-500">Chi phí sửa chữa:</span>
                                        <strong className="font-mono text-slate-900">
                                          {Number(ticket.cost || 0) > 0
                                            ? `${Number(ticket.cost).toLocaleString('vi-VN')} đ`
                                            : '0 đ'}
                                        </strong>
                                      </div>
                                      {Number(ticket.cost || 0) > 0 && (
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-slate-500">Bên chịu chi phí:</span>
                                          <span className="font-semibold text-slate-700">
                                            {ticket.costBearer === 'TENANT' ? 'Khách thuê chịu phí' : 'Chủ trọ bảo hành'}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-slate-500 italic py-1">
                                      Chưa phân công thợ kỹ thuật cho phiếu này.
                                    </p>
                                  )}

                                  {ticket.blocksRental && (
                                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold">
                                      Phiếu bảo trì phòng trống: Hoàn tất phiếu sẽ tự động mở lại phòng về Trống.
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openAssignModal(ticket);
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Wrench className="w-3.5 h-3.5" />
                                    <span>Điều phối thợ & Cập nhật tiến độ</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tạo Phiếu Báo Hỏng Kèm Ảnh (Staff) */}
      <MaintenanceRequestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateTicket}
        newTicket={newTicket}
        setNewTicket={setNewTicket}
        categories={CATEGORIES}
      />

      {/* Modal Phân Công Kỹ Thuật Viên & Nghiệm Thu Cho Staff */}
      <Modal isOpen={!!assignModal} onClose={() => setAssignModal(null)} maxWidth="max-w-md">
        {assignModal && (
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-600" />
              <span>Điều Phối Thợ Sửa Chữa Phòng {assignModal.resolvedRoom || assignModal.room}</span>
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

              {staffForm.costBearer === 'TENANT' && (
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl text-purple-900 font-semibold">
                    <input
                      type="checkbox"
                      checked={staffForm.addToInvoice}
                      onChange={(e) => setStaffForm({ ...staffForm, addToInvoice: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Tự động tính chi phí này vào hóa đơn tháng tiếp theo của phòng</span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
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
      <MaintenancePhotoPreview photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </div>
  );
}
