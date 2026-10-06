import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  UserCheck,
  Key,
  Calendar,
  X,
  FileText,
  CheckCircle2,
  User,
  Edit3,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Home,
  Sparkles,
  Building2
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/common/Modal';
import CreateTenantModal from './admin/tenants/CreateTenantModal';

const FACILITIES = [
  { code: 'CS-01', name: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', shortName: 'Cơ Sở 1 - Cầu Giấy' },
  { code: 'CS-02', name: 'Nhà Trọ Bách Khoa - Cơ Sở 2', shortName: 'Cơ Sở 2 - Bách Khoa' },
  { code: 'CS-03', name: 'Nhà Trọ Đống Đa - Cơ Sở 3', shortName: 'Cơ Sở 3 - Đống Đa' }
];

export default function TenantsPage() {
  const { tenants, addTenant, updateTenant, deleteTenant, resetTenantPassword, rooms = [] } = useData();
  const [pwdResetToast, setPwdResetToast] = useState(null);
  const { user } = useAuth();
  const isStaffOrAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | INACTIVE
  const [showModal, setShowModal] = useState(false);
  const [showAiTenantModal, setShowAiTenantModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [resetPwdModal, setResetPwdModal] = useState(null);
  const [customPasswordInput, setCustomPasswordInput] = useState('');
  const [sendSmsOption, setSendSmsOption] = useState(true);
  const [forceChangeOption, setForceChangeOption] = useState(true);

  const handleOpenResetPassword = (tenant) => {
    setResetPwdModal(tenant);
    setCustomPasswordInput('TroVN@' + Math.floor(1000 + Math.random() * 9000));
  };
  const [confirmDeleteTenant, setConfirmDeleteTenant] = useState(null);
  const [deleteNotice, setDeleteNotice] = useState(null);

  // Helper tính ngày kết thúc hợp đồng theo các mức 3, 6, 12 tháng
  const calculateContractEnd = (startDateStr, months) => {
    try {
      let day = 25, month = 9, year = 2026;
      if (startDateStr && startDateStr.includes('/')) {
        const parts = startDateStr.split('/');
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      } else if (startDateStr && startDateStr.includes('-')) {
        const parts = startDateStr.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      }
      const d = new Date(year, month, day);
      d.setMonth(d.getMonth() + parseInt(months, 10));
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return '25/09/2027';
    }
  };

  // New tenant state với 3 mức thời hạn: 3, 6, 12 tháng
  const [manualHouseCode, setManualHouseCode] = useState('CS-01');
  const [newTenant, setNewTenant] = useState({
    fullName: '',
    cccd: '',
    phone: '',
    email: '',
    hometown: '',
    room: '',
    rooms: [],
    contractDuration: 12, // 3, 6, 12 tháng
    contractStart: '25/09/2026',
    contractEnd: '25/09/2027',
    deposit: 3500000,
    status: 'ACTIVE',
    daysSinceLeave: 0
  });

  // Lọc các phòng còn trống của cơ sở đang chọn cho modal thêm thủ công
  const manualVacantRooms = useMemo(() => {
    return (rooms || []).filter((r) => {
      if ((r.houseCode || 'CS-01') !== manualHouseCode) return false;
      if (r.status !== 'AVAILABLE') return false;
      if (r.occupants && r.occupants > 0) return false;
      return true;
    });
  }, [rooms, manualHouseCode]);

  useEffect(() => {
    if (manualVacantRooms.length > 0) {
      const isValid = manualVacantRooms.some((r) => r.number === newTenant.room);
      if (!isValid) {
        const first = manualVacantRooms[0];
        setNewTenant((prev) => ({
          ...prev,
          room: first.number,
          rooms: [first.number],
          deposit: first.price || 3500000
        }));
      }
    } else {
      setNewTenant((prev) => ({
        ...prev,
        room: '',
        rooms: []
      }));
    }
  }, [manualVacantRooms, manualHouseCode]);

  const handleManualRoomChange = (roomNum) => {
    const found = manualVacantRooms.find((r) => r.number === roomNum);
    setNewTenant((prev) => ({
      ...prev,
      room: roomNum,
      rooms: [roomNum],
      deposit: found?.price || prev.deposit
    }));
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.cccd.includes(searchTerm) ||
      t.phone.includes(searchTerm) ||
      (t.room && t.room.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.rooms && t.rooms.some((r) => r.toLowerCase().includes(searchTerm.toLowerCase())));

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'ACTIVE') return matchesSearch && t.status === 'ACTIVE';
    if (statusFilter === 'INACTIVE') return matchesSearch && t.status === 'INACTIVE';
    return matchesSearch;
  });

  const handleCreateTenant = (e) => {
    e.preventDefault();
    if (!newTenant.fullName || !newTenant.cccd) return;
    if (!newTenant.room) {
      alert('Vui lòng chọn cơ sở có phòng trống và chọn phòng cần thuê!');
      return;
    }
    const selectedFacilityObj = FACILITIES.find((f) => f.code === manualHouseCode);
    const calculatedEnd = calculateContractEnd(newTenant.contractStart, newTenant.contractDuration);

    addTenant({
      ...newTenant,
      houseCode: manualHouseCode,
      house: selectedFacilityObj?.name || 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
      contractEnd: calculatedEnd,
      rooms: [newTenant.room],
      room: newTenant.room
    });
    setShowModal(false);
    setDeleteNotice({
      type: 'SUCCESS',
      message: `Đã thêm thành công hồ sơ khách thuê "${newTenant.fullName}" vào phòng ${newTenant.room} (${selectedFacilityObj?.shortName || manualHouseCode})!`
    });
    setTimeout(() => setDeleteNotice(null), 5000);
    setNewTenant({
      fullName: '',
      cccd: '',
      phone: '',
      email: '',
      hometown: '',
      room: '',
      rooms: [],
      contractDuration: 12,
      contractStart: '25/09/2026',
      contractEnd: '25/09/2027',
      deposit: 3500000,
      status: 'ACTIVE',
      daysSinceLeave: 0
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingTenant) return;

    // QUY CHẾ HỆ THỐNG: Admin và Staff KHÔNG được sửa trạng thái hợp đồng và các phòng đang thuê!
    // Các dữ liệu này phải tự động cập nhật theo giao dịch của khách hàng.
    // Staff/Admin chỉ chỉnh sửa thông tin cá nhân và tiền cọc.
    updateTenant(editingTenant.id, {
      fullName: editingTenant.fullName,
      cccd: editingTenant.cccd,
      phone: editingTenant.phone,
      email: editingTenant.email,
      hometown: editingTenant.hometown,
      deposit: Number(editingTenant.deposit) || 0
    });

    if (selectedTenant && selectedTenant.id === editingTenant.id) {
      setSelectedTenant({
        ...selectedTenant,
        fullName: editingTenant.fullName,
        cccd: editingTenant.cccd,
        phone: editingTenant.phone,
        email: editingTenant.email,
        hometown: editingTenant.hometown,
        deposit: Number(editingTenant.deposit) || 0
      });
    }
    setEditingTenant(null);
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteTenant) return;
    const result = deleteTenant(confirmDeleteTenant.id);
    if (!result.success) {
      setDeleteNotice({ type: 'ERROR', message: result.message });
    } else {
      setDeleteNotice({ type: 'SUCCESS', message: result.message });
      setConfirmDeleteTenant(null);
      if (selectedTenant?.id === confirmDeleteTenant.id) {
        setSelectedTenant(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {pwdResetToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{pwdResetToast}</span>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-purple-600" />
            <span>Hồ Sơ Khách Thuê Phòng</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Quản lý thông tin cư dân, hợp đồng thuê nhiều phòng, lịch sử trả phòng và thanh lý tài khoản.
          </p>
        </div>

        {isStaffOrAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAiTenantModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white text-xs font-black rounded-2xl shadow-md shadow-indigo-600/20 transition-all btn-press cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>⚡ Thêm Khách Bằng AI OCR (CCCD)</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thủ Công</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete Notice Alert */}
      {deleteNotice && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border ${
            deleteNotice.type === 'SUCCESS'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-bold">
            {deleteNotice.type === 'SUCCESS' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{deleteNotice.message}</span>
          </div>
          <button
            onClick={() => setDeleteNotice(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bento-card p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tra cứu theo họ tên, CCCD, số điện thoại hoặc phòng..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            Tất cả ({tenants.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Đang thuê ({tenants.filter((t) => t.status === 'ACTIVE').length})
          </button>
          <button
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'INACTIVE'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã trả phòng ({tenants.filter((t) => t.status === 'INACTIVE').length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bento-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/90 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Họ và Tên</th>
                <th className="py-3.5 px-4">Số CCCD</th>
                <th className="py-3.5 px-4">Số Điện Thoại</th>
                <th className="py-3.5 px-4">Quê Quán</th>
                <th className="py-3.5 px-4">Phòng Đang Thuê</th>
                <th className="py-3.5 px-4">Hợp Đồng</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Không tìm thấy hồ sơ khách thuê nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const tenantRoomsList = t.rooms && t.rooms.length > 0
                    ? t.rooms
                    : (t.room ? [t.room] : []);
                  const roomCount = tenantRoomsList.length;
                  const canDelete = t.status === 'INACTIVE' && (t.daysSinceLeave || 0) >= 30;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-purple-50/40 transition-all duration-150"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                          {t.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold">{t.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-normal">
                            {t.email || `${t.phone}@rental.vn`}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 font-semibold">{t.cccd}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{t.phone}</td>
                      <td className="py-3 px-4 text-slate-600">{t.hometown || 'Chưa cập nhật'}</td>
                      
                      {/* Phòng đang thuê (hỗ trợ nhiều phòng) */}
                      <td className="py-3 px-4">
                        {roomCount > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {tenantRoomsList.map((rm) => (
                              <span
                                key={rm}
                                className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 shadow-2xs"
                              >
                                {rm}
                              </span>
                            ))}
                            {roomCount > 1 && (
                              <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">
                                ({roomCount} phòng)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Chưa có phòng
                          </span>
                        )}
                      </td>

                      {/* Hạn hợp đồng */}
                      <td className="py-3 px-4 text-slate-600">
                        <div>
                          <span className="text-[11px] text-slate-500">Từ:</span>{' '}
                          <strong>{t.contractStart || t.startDate || '01/01/2026'}</strong>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Đến: {t.contractEnd || '31/12/2026'}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-4 text-center">
                        {t.status === 'ACTIVE' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Đang Thuê</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                            <span>Đã rời ({t.daysSinceLeave || 0} ngày)</span>
                          </span>
                        )}
                      </td>

                      {/* Thao tác: Xem hồ sơ / Sửa / Xóa */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedTenant(t)}
                            title="Xem chi tiết hồ sơ khách thuê"
                            className="text-purple-600 hover:text-purple-700 font-bold px-2 py-1 hover:bg-purple-50 rounded-lg transition-colors btn-press-ghost cursor-pointer text-xs"
                          >
                            Xem
                          </button>
                          {isStaffOrAdmin && (
                            <button
                              onClick={() => handleOpenResetPassword(t)}
                              title="Cấp lại mật khẩu tạm thời cho khách (gửi OTP)"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isStaffOrAdmin && (
                            <>
                              <button
                                onClick={() =>
                                  setEditingTenant({
                                    ...t,
                                    room: tenantRoomsList.join(', ')
                                  })
                                }
                                title="Chỉnh sửa thông tin cá nhân khách thuê"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* QUY ĐỊNH NÚT XÓA:
                                  1. Nếu khách đang thuê (roomCount > 0): KHÔNG hiện nút xóa -> badge "Đang thuê".
                                  2. Nếu khách không thuê phòng (roomCount === 0) nhưng < 30 ngày: KHÔNG hiện nút xóa -> badge đếm ngược "🔒 Đợi X ngày hiện nút xóa".
                                  3. Chỉ khi roomCount === 0 VÀ ngày rời phòng >= 30 ngày (1 tháng): MỚI HIỆN NÚT XÓA ĐỎ NỔI BẬT!
                              */}
                              {roomCount > 0 ? (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold whitespace-nowrap">
                                  Đang thuê
                                </span>
                              ) : (t.daysSinceLeave || 0) < 30 ? (
                                <span
                                  className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-semibold whitespace-nowrap"
                                  title={`Số ngày phòng về 0: ${t.daysSinceLeave || 0}/30 ngày. Đủ 1 tháng (30 ngày) mới hiện nút xóa.`}
                                >
                                  🔒 Đợi {30 - (t.daysSinceLeave || 0)} ngày hiện nút xóa
                                </span>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteTenant(t)}
                                  title={`Đủ điều kiện xóa: Khách không còn thuê phòng trong 1 tháng (${t.daysSinceLeave} ngày >= 30 ngày)`}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-300 rounded-lg text-xs font-bold transition-all btn-press cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Xóa</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Modal Thêm Khách Thuê Mới */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-xl">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-purple-600" />
          <span>Tiếp Nhận Khách Thuê Mới (Thủ Công)</span>
        </h2>
        <form onSubmit={handleCreateTenant} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên khách</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Hoàng Văn Bảo"
              value={newTenant.fullName}
              onChange={(e) => setNewTenant({ ...newTenant, fullName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số CCCD / Định danh</label>
              <input
                type="text"
                required
                placeholder="12 chữ số"
                value={newTenant.cccd}
                onChange={(e) => setNewTenant({ ...newTenant, cccd: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                required
                placeholder="09..."
                value={newTenant.phone}
                onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Quê quán</label>
            <input
              type="text"
              placeholder="Tỉnh/Thành phố (Ví dụ: Nam Định, Hà Tĩnh, Hà Nội...)"
              value={newTenant.hometown}
              onChange={(e) => setNewTenant({ ...newTenant, hometown: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
            />
          </div>

          {/* Phân bổ Cơ sở & Phòng thuê còn trống */}
          <div className="p-4 bg-gradient-to-br from-purple-50/80 via-indigo-50/40 to-slate-50 border border-purple-200 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span>Phân Bổ Phòng Cho Thuê</span>
              </span>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-100/70 px-2.5 py-0.5 rounded-full">
                Chỉ hiện phòng còn trống
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Cơ sở thuê *</span>
                </label>
                <select
                  value={manualHouseCode}
                  onChange={(e) => setManualHouseCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 shadow-2xs cursor-pointer"
                >
                  {FACILITIES.map((f) => {
                    const countVacant = (rooms || []).filter(
                      (r) => (r.houseCode || 'CS-01') === f.code && r.status === 'AVAILABLE' && (!r.occupants || r.occupants === 0)
                    ).length;
                    return (
                      <option key={f.code} value={f.code}>
                        {f.name} ({countVacant} phòng trống)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>Phòng thuê còn trống *</span>
                  </span>
                  {manualVacantRooms.length > 0 && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                      {manualVacantRooms.length} phòng sẵn sàng
                    </span>
                  )}
                </label>
                {manualVacantRooms.length > 0 ? (
                  <select
                    value={newTenant.room}
                    onChange={(e) => handleManualRoomChange(e.target.value)}
                    className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2.5 text-xs font-bold text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-400/20 shadow-2xs cursor-pointer"
                  >
                    {manualVacantRooms.map((r) => (
                      <option key={r.number} value={r.number}>
                        Phòng {r.number} - {r.floor} ({r.area}m² - {(r.price || 3500000).toLocaleString('vi-VN')} đ/tháng)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-1.5">
                    <span>⚠️ Cơ sở này hiện đã kín phòng!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thời hạn hợp đồng</label>
              <select
                value={newTenant.contractDuration}
                onChange={(e) => {
                  const duration = Number(e.target.value);
                  const end = calculateContractEnd(newTenant.contractStart, duration);
                  setNewTenant({ ...newTenant, contractDuration: duration, contractEnd: end });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-purple-700 focus:outline-none focus:bg-white focus:border-purple-500 cursor-pointer"
              >
                <option value={3}>3 Tháng (Ngắn hạn)</option>
                <option value={6}>6 Tháng (Trung hạn)</option>
                <option value={12}>12 Tháng (1 năm - Tiêu chuẩn)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngày bắt đầu hợp đồng</label>
              <input
                type="text"
                value={newTenant.contractStart}
                onChange={(e) => {
                  const start = e.target.value;
                  const end = calculateContractEnd(start, newTenant.contractDuration);
                  setNewTenant({ ...newTenant, contractStart: start, contractEnd: end });
                }}
                placeholder="25/09/2026"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tiền cọc giữ chân (VNĐ)</label>
              <input
                type="number"
                value={newTenant.deposit}
                onChange={(e) => setNewTenant({ ...newTenant, deposit: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hạn hợp đồng đến ngày (Tự động)</label>
              <div className="w-full bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 text-xs text-purple-900 font-bold font-mono">
                {newTenant.contractEnd}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors btn-press-ghost"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-purple-600/25 transition-all btn-press cursor-pointer"
            >
              Lưu Khách Thuê Mới
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal Chỉnh Sửa Thông Tin Khách Thuê */}
      <Modal isOpen={!!editingTenant} onClose={() => setEditingTenant(null)} maxWidth="max-w-lg">
        {editingTenant && (
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <span>Chỉnh Sửa Hồ Sơ: {editingTenant.fullName}</span>
              </h2>
              <button
                onClick={() => setEditingTenant(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              {/* Cảnh báo quy chế: Admin & Staff KHÔNG được sửa trạng thái hợp đồng và các phòng đang thuê */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Quy định bảo vệ dữ liệu hợp đồng:</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Admin và Staff <strong>không được sửa trạng thái hợp đồng và các phòng đang thuê</strong>. Dữ liệu này được tự động cập nhật từ các giao dịch của khách hàng (thuê phòng, chuyển phòng, ở ghép, trả phòng). Thời hạn hợp đồng (3, 6, 12 tháng) do khách hàng chủ động đề xuất và Ban Quản Lý chỉ thực hiện duyệt.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1.5 text-[11px] border-t border-amber-200/60">
                  <div>
                    <span className="text-slate-500">Phòng đang thuê:</span>{' '}
                    <strong className="text-purple-700 font-mono">
                      {(editingTenant.rooms || (editingTenant.room ? [editingTenant.room] : [])).join(', ') || '0 phòng'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Trạng thái hợp đồng:</span>{' '}
                    <strong className={editingTenant.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-700'}>
                      {editingTenant.status === 'ACTIVE' ? 'Đang thuê phòng' : `Đã rời phòng (${editingTenant.daysSinceLeave || 0} ngày)`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Hạn hợp đồng hiện tại:</span>{' '}
                    <strong className="text-indigo-700 font-mono">
                      {editingTenant.contractEnd || '31/12/2026'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Xóa tài khoản:</span>{' '}
                    <strong className={(editingTenant.rooms?.length || 0) === 0 && (editingTenant.daysSinceLeave || 0) >= 30 ? 'text-rose-600' : 'text-slate-600'}>
                      {(editingTenant.rooms?.length || 0) === 0 && (editingTenant.daysSinceLeave || 0) >= 30 ? 'Đủ điều kiện xóa (>= 30 ngày)' : 'Chưa đủ điều kiện'}
                    </strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên khách</label>
                <input
                  type="text"
                  required
                  value={editingTenant.fullName}
                  onChange={(e) => setEditingTenant({ ...editingTenant, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số CCCD / Định danh</label>
                  <input
                    type="text"
                    required
                    value={editingTenant.cccd}
                    onChange={(e) => setEditingTenant({ ...editingTenant, cccd: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    required
                    value={editingTenant.phone}
                    onChange={(e) => setEditingTenant({ ...editingTenant, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ Email</label>
                  <input
                    type="email"
                    value={editingTenant.email || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quê quán</label>
                  <input
                    type="text"
                    value={editingTenant.hometown || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, hometown: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tiền cọc giữ chân (VNĐ)</label>
                <input
                  type="number"
                  value={editingTenant.deposit || 0}
                  onChange={(e) => setEditingTenant({ ...editingTenant, deposit: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors btn-press-ghost cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-md shadow-indigo-600/25 transition-all btn-press cursor-pointer"
                >
                  Lưu Cập Nhật
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* 3. Modal Xem Chi Tiết Hồ Sơ Khách Thuê */}
      <Modal isOpen={!!selectedTenant} onClose={() => setSelectedTenant(null)} maxWidth="max-w-lg">
        {selectedTenant && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-600/20">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{selectedTenant.fullName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selectedTenant.status === 'ACTIVE' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Đang Thuê Phòng
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Đã Rời Phòng ({selectedTenant.daysSinceLeave || 0} ngày)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTenant(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors btn-press-ghost cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid Info */}
            <div className="py-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-500 font-medium">Số CCCD / Định danh:</span>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{selectedTenant.cccd}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Số điện thoại liên hệ:</span>
                  <div className="font-mono font-bold text-purple-700 text-sm mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <a href={`tel:${selectedTenant.phone}`} className="hover:underline">
                      {selectedTenant.phone}
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Địa chỉ Email:</span>
                  <div className="font-medium text-slate-800 text-xs mt-0.5 truncate flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{selectedTenant.email || `${selectedTenant.phone}@rental.vn`}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Quê quán thường trú:</span>
                  <div className="font-bold text-slate-800 text-xs mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{selectedTenant.hometown || 'Chưa cập nhật'}</span>
                  </div>
                </div>
              </div>

              {/* Danh sách phòng đang thuê */}
              <div className="border border-purple-100 bg-purple-50/40 p-4 rounded-2xl space-y-2">
                <div className="font-bold text-xs text-purple-950 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-purple-600" />
                    <span>Các Phòng Đang Thuê:</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-purple-700">
                    {selectedTenant.room || selectedTenant.rooms?.[0] ? '1 Phòng' : '0 Phòng'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(selectedTenant.rooms || (selectedTenant.room ? [selectedTenant.room] : [])).length > 0 ? (
                    (selectedTenant.rooms || (selectedTenant.room ? [selectedTenant.room] : [])).map((rm) => (
                      <span
                        key={rm}
                        className="px-3 py-1 bg-white border border-purple-200 text-purple-800 rounded-xl font-mono font-bold text-xs shadow-2xs"
                      >
                        Phòng {rm}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-xs">Hiện không thuê phòng nào.</span>
                  )}
                </div>
              </div>

              {/* Thông tin Hợp Đồng & Tiền Cọc */}
              <div className="border border-slate-200 bg-slate-50/80 p-4 rounded-2xl space-y-2 text-[11px]">
                <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5 mb-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Điều Khoản Hợp Đồng & Tiền Đặt Cọc</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-500">Ngày bắt đầu:</span>{' '}
                    <strong className="text-slate-900">{selectedTenant.contractStart || selectedTenant.startDate || '01/01/2026'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Hạn hợp đồng:</span>{' '}
                    <strong className="text-purple-700">{selectedTenant.contractEnd || '31/12/2026'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Tiền cọc giữ chân:</span>{' '}
                    <strong className="text-emerald-700">
                      {selectedTenant.deposit ? selectedTenant.deposit.toLocaleString('vi-VN') : '3.500.000'} đ
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Quy định trả trước hạn:</span>{' '}
                    <strong className="text-rose-600">Bị mất cọc</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${selectedTenant.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all btn-press"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Gọi Điện</span>
                </a>

                {isStaffOrAdmin && (
                  <>
                    <button
                      onClick={() => {
                        setEditingTenant({
                          ...selectedTenant,
                          room: (selectedTenant.rooms || (selectedTenant.room ? [selectedTenant.room] : [])).join(', ')
                        });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all btn-press cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sửa Thông Tin</span>
                    </button>
                    <button
                      onClick={() => {
                        const t = selectedTenant;
                        setSelectedTenant(null);
                        handleOpenResetPassword(t);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition-all btn-press cursor-pointer shadow-2xs"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      <span>Cấp Lại MK Tạm</span>
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setSelectedTenant(null)}
                className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all btn-press cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* 4. Modal Xác Nhận Xác Nhận Lưu Trữ Hồ Sơ Khách (Chỉ khi >= 30 ngày) */}
      <Modal isOpen={!!confirmDeleteTenant} onClose={() => setConfirmDeleteTenant(null)} maxWidth="max-w-md">
        {confirmDeleteTenant && (
          <div>
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-rose-950">Thanh Lý Hợp Đồng & Lưu Trữ Hồ Sơ Khách</h3>
                <p className="text-xs text-rose-600 font-medium">Chuyển trạng thái sang Đã rời phòng (INACTIVE)</p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-700">
              <p>
                Bạn đang chuẩn bị xóa tài khoản của khách:{' '}
                <strong className="text-slate-900">{confirmDeleteTenant.fullName}</strong> (SĐT:{' '}
                {confirmDeleteTenant.phone}, CCCD: {confirmDeleteTenant.cccd}).
              </p>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã kiểm tra điều kiện hệ thống:</span>
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[11px]">
                  <li>Khách hiện không còn bất kỳ phòng nào đang thuê.</li>
                  <li>
                    Thời gian rời phòng: <strong>{confirmDeleteTenant.daysSinceLeave} ngày</strong> (Thỏa mãn quy chế &gt;= 30 ngày / 1 tháng).
                  </li>
                </ul>
              </div>
              <p className="text-slate-500 italic text-[11px]">
                Hồ sơ sẽ được lưu trữ với trạng thái ĐÃ RỜI PHÒNG (INACTIVE) để bảo lưu dữ liệu hóa đơn kế toán. Hệ thống không xóa vĩnh viễn tài khoản người dùng theo quy định bảo mật.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setConfirmDeleteTenant(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-600/25 transition-all btn-press cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Vĩnh Viễn Tài Khoản</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Thêm Khách Thuê với AI OCR CCCD */}
      <CreateTenantModal
        isOpen={showAiTenantModal}
        onClose={() => setShowAiTenantModal(false)}
        onSaveTenant={(newTenantData) => {
          addTenant(newTenantData);
          setDeleteNotice({
            type: 'SUCCESS',
            message: `Đã thêm thành công hồ sơ khách ${newTenantData.name || newTenantData.fullName} từ AI OCR CCCD!`
          });
          setTimeout(() => setDeleteNotice(null), 5000);
        }}
      />
          {/* UC-S02 & UC-A01: Modal Cấp Lại Mật Khẩu Tạm Cho Khách Thuê */}
      {resetPwdModal && (
        <Modal
          isOpen={!!resetPwdModal}
          onClose={() => setResetPwdModal(null)}
          title="🔑 Cấp Lại Mật Khẩu Tạm & Gửi SMS OTP (UC-S02 / UC-A01)"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-900">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Tài khoản khách: {resetPwdModal.fullName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-amber-200/60">
                <div>
                  <span className="text-amber-700 font-medium">Tên đăng nhập (SĐT):</span>
                  <div className="font-mono font-bold text-slate-900">{resetPwdModal.phone}</div>
                </div>
                <div>
                  <span className="text-amber-700 font-medium">CCCD định danh:</span>
                  <div className="font-mono font-bold text-slate-900">{resetPwdModal.cccd}</div>
                </div>
                <div>
                  <span className="text-amber-700 font-medium">Phòng đang thuê:</span>
                  <div className="font-bold text-purple-700">{resetPwdModal.room || resetPwdModal.rooms?.[0] || 'Đã trả phòng'}</div>
                </div>
                <div>
                  <span className="text-amber-700 font-medium">Trạng thái tài khoản:</span>
                  <div className="font-bold text-emerald-700">ACTIVE (Bảo lưu dữ liệu)</div>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = resetTenantPassword(resetPwdModal.id, customPasswordInput);
                setResetPwdModal(null);
                setCustomPasswordInput('');
                setPwdResetToast({
                  type: 'SUCCESS',
                  title: '🔑 Đã Cấp Lại Mật Khẩu Thành Công!',
                  message: `Mật khẩu tạm mới: "${res.tempPassword}". Mã xác thực OTP đã được gửi đến số điện thoại ${res.phone} của khách thuê ${res.tenantName}.`
                });
                setTimeout(() => setPwdResetToast(null), 8000);
              }}
              className="space-y-3.5"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Mật khẩu tạm thời mới *</label>
                  <button
                    type="button"
                    onClick={() => setCustomPasswordInput('TroVN@' + Math.floor(1000 + Math.random() * 9000))}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-800 hover:underline cursor-pointer"
                  >
                    Tạo ngẫu nhiên
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={customPasswordInput}
                  onChange={(e) => setCustomPasswordInput(e.target.value)}
                  placeholder="Ví dụ: TroVN@8392"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendSmsOption}
                    onChange={(e) => setSendSmsOption(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-700">Gửi SMS Brandname chứa mật khẩu tạm và mã OTP về SĐT khách</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceChangeOption}
                    onChange={(e) => setForceChangeOption(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-700">Yêu cầu khách đổi mật khẩu trong lần đăng nhập đầu tiên</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPwdModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Xác Nhận Cấp Mật Khẩu Tạm</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

    </div>
  );
}
