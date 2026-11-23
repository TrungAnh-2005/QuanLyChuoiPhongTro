import Modal from '../../../shared/ui/Modal.jsx';
import { AlertTriangle } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';
import { Trash2 } from 'lucide-react';

export default function ArchiveTenantModal({ confirmDeleteTenant, handleConfirmDelete, setConfirmDeleteTenant }) {
  return (<Modal isOpen={!!confirmDeleteTenant} onClose={() => setConfirmDeleteTenant(null)} maxWidth="max-w-md">
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
      </Modal>);
}
