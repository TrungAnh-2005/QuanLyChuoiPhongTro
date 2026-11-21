import Modal from '../../../shared/ui/Modal.jsx';
import { X } from 'lucide-react';

export default function ResidentRequestsModal({ pendingRequestsCount, reviewResidentRequest, reviewingRequest, roomRequests, setShowRequestsManager, showRequestsManager }) {
  return (<Modal isOpen={showRequestsManager} onClose={() => setShowRequestsManager(false)} maxWidth="max-w-lg">
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Xét Duyệt Đơn Từ Cư Dân ({pendingRequestsCount} Đơn Chờ)</h3>
              <button onClick={() => setShowRequestsManager(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {roomRequests.length === 0 ? (
                <p className="text-center py-6 text-slate-400">Không có đơn nào cần xử lý</p>
              ) : (
                roomRequests.map((req) => (
                  <div key={req.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {{ RENT: 'Đơn Thuê / Đặt Cọc', RENTAL: 'Đơn Thuê / Đặt Cọc', ROOMMATE: 'Tìm Ở Ghép', TRANSFER: 'Đơn Chuyển Phòng', RENEW_CONTRACT: 'Gia Hạn Hợp Đồng', CHECKOUT: 'Báo Trả Phòng' }[req.type] || 'Đơn Yêu Cầu'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {{ APPROVED: 'Đã duyệt', REJECTED: 'Đã từ chối', WAITING_ROOMMATES: 'Chờ ý kiến ở ghép', PENDING: 'Chờ duyệt' }[req.status] || req.status}
                      </span>
                    </div>

                    <div className="text-slate-600 space-y-0.5">
                      <div>Khách: <strong>{req.tenantName || req.sender}</strong> ({req.phone || 'Chưa có SĐT'})</div>
                      <div>Phòng: <strong>{req.roomNumber || req.targetRoom}</strong> • Cơ sở: {req.houseCode}</div>
                      {req.note && <div className="text-slate-500 italic">"{req.note}"</div>}
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                        <button
                          type="button"
                          disabled={reviewingRequest !== null} onClick={() => reviewResidentRequest(req, false)} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer"
                        >
                          Từ chối
                        </button>
                        <button
                          type="button"
                          disabled={reviewingRequest !== null} onClick={() => reviewResidentRequest(req, true)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                        >
                          Phê duyệt
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>);
}
