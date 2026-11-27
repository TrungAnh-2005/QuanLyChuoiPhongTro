import { useEffect, useState } from 'react';
import { depositProgress, requestStatusLabel } from '../../features/rooms/room.rules.js';

export default function HoldDepositDetails({ request }) {
  const { required, paid, remaining } = depositProgress(request);
  const money = amount => `${amount.toLocaleString('vi-VN')} đ`;
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (request.status !== 'HOLDING' || !request.holdExpiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [request.status, request.holdExpiresAt]);
  const secondsLeft = Math.max(0, Math.floor((new Date(request.holdExpiresAt).getTime() - now) / 1000));
  return <div className="space-y-3 text-xs">
    <div className="flex flex-wrap justify-between gap-2 font-bold">
      <span>Phòng {request.roomNumber || request.targetRoom || request.targetRoomId}</span>
      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg">{requestStatusLabel(request.status)}</span>
    </div>
    <dl className="space-y-2 bg-slate-50 border border-slate-200 p-3 rounded-xl">
      <div className="flex justify-between gap-3"><dt>Tổng cọc (1 tháng tiền thuê)</dt><dd className="font-bold">{money(required)}</dd></div>
      <div className="flex justify-between gap-3"><dt>Đã được quản lý xác nhận</dt><dd className="font-bold text-emerald-700">{money(paid)}</dd></div>
      <div className="flex justify-between gap-3"><dt>Còn phải nộp</dt><dd className="font-bold">{money(remaining)}</dd></div>
    </dl>
    {request.holdExpiresAt && <p>Hạn giữ phòng: <strong>{new Date(request.holdExpiresAt).toLocaleString('vi-VN')}</strong></p>}
    {request.status === 'HOLDING' && request.holdExpiresAt && <p className="text-amber-800">{secondsLeft > 0 ? `Còn ${Math.floor(secondsLeft / 3600)} giờ ${Math.floor(secondsLeft % 3600 / 60)} phút ${secondsLeft % 60} giây` : 'Đã đến hạn giữ phòng. Đang chờ máy chủ cập nhật trạng thái.'}</p>}
    {request.status === 'HOLDING' && <p className="text-slate-600 leading-relaxed">Nộp trước 1.000.000 đ cho quản lý cơ sở theo hướng dẫn của cơ sở. Khoản này được tính vào tổng cọc một tháng tiền thuê. Số tiền chỉ được ghi nhận khi quản lý xác nhận đã nhận thực tế; hợp đồng và quyền cư trú được kích hoạt khi đủ cọc. Liên hệ quản lý cơ sở nếu muốn hủy đặt cọc.</p>}
    {['CANCELLED', 'EXPIRED'].includes(request.status) && paid > 0 && <p className="text-amber-800">Đã ghi nhận {money(paid)}. Liên hệ quản lý để đối soát và xử lý hoàn tiền.</p>}
  </div>;
}
