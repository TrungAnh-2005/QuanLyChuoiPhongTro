import { useRef, useState } from 'react';
import Modal from '../../../shared/ui/Modal.jsx';
import { X } from 'lucide-react';
import HoldDepositDetails from './HoldDepositDetails.jsx';
import { depositProgress, isRentalRequest, requestStatusLabel } from '../room.rules.js';
import { useData } from '../../../shared/data/RentalDataContext';
import { findRoommateSponsor, missingSponsorMessage } from '../../contracts/roommate.rules';

const receiptKey = id => `rental:pending-deposit-receipt:${id}`;
const pendingReceipt = id => { try { return JSON.parse(sessionStorage.getItem(receiptKey(id)) || 'null'); } catch { return null; } };

export default function ResidentRequestsModal({
  pendingRequestsCount,
  reviewResidentRequest,
  reviewingRequest,
  roomRequests = [],
  setShowRequestsManager,
  showRequestsManager,
  confirmRoomRequestDeposit,
  cancelRentalRequest,
  approveRoomRequest,
  moveOutSettlements = [],
  onOpenSettlement,
  onSuccessToast,
  roomFilter,
  onClearRoomFilter
}) {
  const { roommateRequestsV2 = [], rooms = [], contracts = [], roomMembers = [], loading, reviewRoommateRequest } = useData();
  const [activeTab, setActiveTab] = useState('REQUESTS'); // 'REQUESTS' | 'CHECKOUT' | 'ROOMMATES'
  const [amounts, setAmounts] = useState({});
  const [reasons, setReasons] = useState({});
  const [roommateNotes, setRoommateNotes] = useState({});
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const inFlight = useRef(false);

  const approvedCheckoutWithoutSettlement = roomRequests.filter(
    (req) => req.type === 'CHECKOUT' && req.status === 'APPROVED'
      && !moveOutSettlements.some((item) => item.contractId === req.contractId)
  );
  const pendingSettlements = moveOutSettlements.filter((item) => item.refundStatus !== 'COMPLETED');
  const pendingRoommates = roommateRequestsV2.filter((row) => row.status === 'PENDING');

  const confirmReceipt = async req => {
    if (inFlight.current) return;
    const saved = pendingReceipt(req.id);
    const amount = saved?.amount ?? Number(amounts[req.id]);
    if (!Number.isFinite(amount) || amount <= 0 || (!saved && amount > depositProgress(req).remaining)) {
      setError('Nhập số tiền thực nhận lớn hơn 0 và không vượt số cọc còn thiếu.'); return;
    }
    const receipt = saved || { amount, receiptReference: crypto.randomUUID() };
    // Persist before the request: a timed-out response must be retried with the same receipt.
    sessionStorage.setItem(receiptKey(req.id), JSON.stringify(receipt));
    inFlight.current = true; setBusy(req.id); setError('');
    try {
      await confirmRoomRequestDeposit(req.id, receipt);
      sessionStorage.removeItem(receiptKey(req.id));
      setAmounts(previous => ({ ...previous, [req.id]: '' }));
    } catch (failure) {
      if (failure.receiptRejected) {
        sessionStorage.removeItem(receiptKey(req.id));
        setAmounts(previous => ({ ...previous, [req.id]: '' }));
        setError(`${failure.message || 'Biên nhận bị từ chối.'} Máy chủ chưa ghi nhận biên nhận này. Số cọc đã được tải lại; hãy nhập lại số tiền thực nhận phù hợp.`);
      } else setError(`${failure.message || 'Không thể xác nhận.'} Lần thử lại giữ nguyên mã và số tiền của biên nhận để tránh ghi nhận trùng.`);
    }
    finally { inFlight.current = false; setBusy(null); }
  };

  const cancelHold = async req => {
    if (inFlight.current) return;
    const reason = (reasons[req.id] || '').trim();
    if (!reason) { setError('Nhập lý do hủy đặt cọc.'); return; }
    inFlight.current = true; setBusy(req.id); setError('');
    try { await cancelRentalRequest(req.id, reason); }
    catch (failure) { setError(failure.message || 'Không thể hủy đặt cọc.'); }
    finally { inFlight.current = false; setBusy(null); }
  };

  const handleReviewRoommate = async (row, approved) => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(`rm-${row.id}`); setError('');
    try {
      await reviewRoommateRequest(row.id, approved, roommateNotes[row.id] || '');
      if (onSuccessToast) onSuccessToast(approved ? 'Đã duyệt yêu cầu ở ghép.' : 'Đã từ chối yêu cầu ở ghép.');
    } catch (failure) {
      setError(failure.message || 'Không thể xử lý yêu cầu ở ghép.');
    } finally {
      inFlight.current = false; setBusy(null);
    }
  };

  const disabled = busy !== null || reviewingRequest !== null;

  return (
    <Modal isOpen={showRequestsManager} onClose={() => setShowRequestsManager(false)} maxWidth="max-w-xl">
      <div className="space-y-4 text-xs">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Đơn cư dân & đặt cọc ({pendingRequestsCount} cần xử lý)</h3>
          <button type="button" aria-label="Đóng" onClick={() => setShowRequestsManager(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs gộp tất cả các loại đơn/yêu cầu */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl font-bold flex-wrap">
          {[
            { id: 'REQUESTS', label: `Đơn phòng & Đặt cọc (${roomRequests.length})` },
            { id: 'CHECKOUT', label: `Trả phòng & Quyết toán (${pendingSettlements.length + approvedCheckoutWithoutSettlement.length})` },
            { id: 'ROOMMATES', label: `Yêu cầu ở ghép (${pendingRoommates.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTab(tab.id); setError(''); }}
              className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all cursor-pointer text-center ${
                activeTab === tab.id
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {roomFilter && activeTab === 'REQUESTS' && (
          <p>
            Đang lọc theo phòng{' '}
            <button type="button" className="text-purple-700 underline cursor-pointer" onClick={onClearRoomFilter}>
              Xem tất cả đơn
            </button>
          </p>
        )}

        {error && <p role="alert" className="p-3 bg-rose-50 text-rose-700 rounded-xl">{error}</p>}

        <div className="space-y-3 max-h-[62vh] overflow-y-auto pr-1">
          {/* TAB 1: Đơn phòng & Đặt cọc */}
          {activeTab === 'REQUESTS' && (
            <>
              {roomRequests.length === 0 && (
                <p className="text-center py-6 text-slate-400">Không có đơn phòng hay đặt cọc nào cần xử lý.</p>
              )}
              {roomRequests.map(req => {
                const rental = isRentalRequest(req);
                const saved = pendingReceipt(req.id);
                return (
                  <div key={req.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
                      <span>{{ RENT: 'Thuê phòng / đặt cọc', RENTAL: 'Thuê phòng / đặt cọc', ROOMMATE: 'Tìm ở ghép', TRANSFER: 'Chuyển phòng', RENEW_CONTRACT: 'Gia hạn hợp đồng', CHECKOUT: 'Báo trả phòng' }[req.type] || 'Yêu cầu cư dân'}</span>
                      {!rental && <span>{requestStatusLabel(req.status)}</span>}
                    </div>
                    <div className="text-slate-600">Khách: <strong>{req.tenantName || req.sender}</strong> ({req.phone || 'Chưa có SĐT'}) · Cơ sở: {req.houseCode}</div>
                    {rental ? <HoldDepositDetails request={req} /> : <div>Phòng: <strong>{req.roomNumber || req.targetRoom}</strong></div>}
                    {req.note && <p className="text-slate-500">{req.note}</p>}
                    {rental && req.status === 'HOLDING' && (
                      <div className="space-y-3 pt-3 border-t border-slate-200">
                        <form onSubmit={event => { event.preventDefault(); confirmReceipt(req); }} className="space-y-2">
                          <label className="block font-bold" htmlFor={`receipt-${req.id}`}>Số tiền cọc thực tế đã nhận (VNĐ)</label>
                          <input id={`receipt-${req.id}`} type="number" min="1" max={saved ? undefined : depositProgress(req).remaining} step="1" required disabled={disabled || !!saved} value={saved?.amount ?? amounts[req.id] ?? ''} onChange={event => setAmounts(previous => ({ ...previous, [req.id]: event.target.value }))} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-60" placeholder="Ví dụ: 1000000" />
                          <p className="text-slate-500">Chỉ xác nhận khoản đã nhận thực tế. Đủ tổng cọc mới kích hoạt hợp đồng và chuyển phòng sang đang thuê.</p>
                          <button type="submit" disabled={disabled} className="px-3 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50">{busy === req.id ? 'Đang xử lý…' : saved ? 'Thử lại biên nhận đã gửi' : 'Xác nhận đã nhận tiền'}</button>
                        </form>
                        <form onSubmit={event => { event.preventDefault(); cancelHold(req); }} className="space-y-2">
                          <label htmlFor={`cancel-${req.id}`} className="block font-bold">Lý do hủy đặt cọc</label>
                          <input id={`cancel-${req.id}`} required value={reasons[req.id] || ''} onChange={event => setReasons(previous => ({ ...previous, [req.id]: event.target.value }))} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl" />
                          <p className="text-slate-500">Khoản đã nhận được giữ lại để quản lý đối soát hoàn tiền thủ công.</p>
                          <button type="submit" disabled={disabled} className="px-3 py-2 bg-rose-500/10 text-rose-700 font-bold rounded-xl cursor-pointer disabled:opacity-50">Hủy đặt cọc</button>
                        </form>
                      </div>
                    )}
                    {req.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                        <button type="button" disabled={disabled} onClick={() => reviewResidentRequest(req, false)} className="px-3 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer disabled:opacity-50">Từ chối</button>
                        <button type="button" disabled={disabled} onClick={() => reviewResidentRequest(req, true)} className="px-3 py-2 bg-emerald-600 text-white font-bold rounded-lg cursor-pointer disabled:opacity-50">{rental ? 'Duyệt giữ phòng' : 'Phê duyệt'}</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* TAB 2: Trả phòng & Quyết toán */}
          {activeTab === 'CHECKOUT' && (
            <>
              {approvedCheckoutWithoutSettlement.length === 0 && pendingSettlements.length === 0 && (
                <p className="text-center py-6 text-slate-400">Chưa có yêu cầu trả phòng hay quyết toán nào chờ xử lý.</p>
              )}
              {approvedCheckoutWithoutSettlement.map((req) => (
                <div key={`checkout-${req.id}`} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900">Phòng {req.targetRoom || req.roomNumber}</div>
                    <div className="text-slate-500">Đã duyệt trả phòng, chưa tạo hồ sơ quyết toán.</div>
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={async () => {
                      try {
                        await approveRoomRequest(req.id);
                        if (onSuccessToast) onSuccessToast('Đã tạo hồ sơ quyết toán.');
                      } catch (err) {
                        setError(err.message);
                      }
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    Tạo hồ sơ quyết toán
                  </button>
                </div>
              ))}
              {pendingSettlements.map((item) => (
                <div key={item.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900">{item.roomNumber} · {item.tenantName}</div>
                    <div className="text-slate-500">Ngày trả dự kiến: {item.moveOutDate || '—'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenSettlement && onOpenSettlement(item)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Quyết toán
                  </button>
                </div>
              ))}
            </>
          )}

          {/* TAB 3: Yêu cầu ở ghép */}
          {activeTab === 'ROOMMATES' && (
            <>
              {pendingRoommates.length === 0 && (
                <p className="text-center py-6 text-slate-400">Không có yêu cầu ở ghép nào chờ xử lý.</p>
              )}
              {pendingRoommates.map((row) => {
                const sponsorOk = !loading && Boolean(findRoommateSponsor(contracts, roomMembers, row));
                const roomLabel = rooms.find((r) => r.id === row.roomId)?.number || row.roomId;
                return (
                  <div key={row.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="font-bold text-slate-900">
                      Phòng {roomLabel} · {row.fullName || row.tenantName}
                    </div>
                    {row.note && <p className="text-slate-600">{row.note}</p>}
                    {!loading && !sponsorOk && (
                      <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2" role="note">
                        {missingSponsorMessage}
                      </p>
                    )}
                    <input
                      aria-label="Ghi chú xử lý"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                      value={roommateNotes[row.id] || ''}
                      onChange={(event) => setRoommateNotes((cur) => ({ ...cur, [row.id]: event.target.value }))}
                      placeholder="Ghi chú xử lý (tùy chọn)"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        disabled={disabled || loading}
                        onClick={() => handleReviewRoommate(row, false)}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer disabled:opacity-50"
                      >
                        Từ chối
                      </button>
                      <button
                        type="button"
                        disabled={disabled || loading || !sponsorOk}
                        onClick={() => handleReviewRoommate(row, true)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Duyệt ở ghép
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
