import Modal from '../shared/Modal.jsx';
import { User } from 'lucide-react';
import { X } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import { Phone } from 'lucide-react';
import { Mail } from 'lucide-react';
import { MapPin } from 'lucide-react';
import { Home } from 'lucide-react';
import { FileText } from 'lucide-react';
import { Edit3 } from 'lucide-react';
import { Key } from 'lucide-react';

export default function TenantDetailsModal({ handleOpenResetPassword, isStaffOrAdmin, selectedTenant, setEditingTenant, setSelectedTenant }) {
  return (<Modal isOpen={!!selectedTenant} onClose={() => setSelectedTenant(null)} maxWidth="max-w-lg">
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
      </Modal>);
}
