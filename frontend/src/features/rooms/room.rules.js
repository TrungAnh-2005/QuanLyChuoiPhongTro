





export const isRoomLocked = room => room?.status === 'LOCKED';
export const isRoomHolding = room => room?.status === 'HOLDING';
export const isRoomMaintenance = room => room?.status === 'MAINTENANCE' || room?.maintenanceRequestId != null;
export const roomStatusLabel = status => ({ AVAILABLE: 'Còn trống', HOLDING: 'Đặt cọc', OCCUPIED: 'Đang thuê', LOCKED: 'Tạm khóa', MAINTENANCE: 'Bảo trì' }[status] || status);
export const requestStatusLabel = status => ({ HOLDING: 'Đặt cọc', PENDING: 'Chờ duyệt', APPROVED: 'Đã hoàn tất', REJECTED: 'Đã từ chối', CANCELLED: 'Đã hủy', EXPIRED: 'Hết hạn', WAITING_ROOMMATES: 'Chờ ý kiến ở ghép' }[status] || status);
export const isRentalRequest = request => ['RENT', 'RENTAL', 'NEW_RENT', 'HOLD'].includes(request?.type);
export const depositProgress = request => {
  const required = Number(request?.requiredDepositAmount ?? request?.rentalPriceSnapshot ?? 0);
  const paid = Number(request?.paidDepositAmount ?? 0);
  return { required, paid, remaining: Math.max(0, required - paid) };
};
export const tenantRoomRequests = (requests, tenantId) => tenantId == null ? [] : requests.filter(request => String(request.tenantId) === String(tenantId));
const sameId = (a, b) => a != null && b != null && String(a) === String(b);
export const hasRoomOccupants = (room, contracts = [], members = []) => room?.status === 'OCCUPIED'
  || Number(room?.occupants || 0) > 0
  || contracts.some(contract => sameId(contract.roomId, room?.id) && contract.status === 'ACTIVE')
  || members.some(member => sameId(member.roomId, room?.id) && member.status !== 'MOVED_OUT');



export function normalizeHouseCode(code) {
  if (!code) return '';
  const c = String(code).trim().toUpperCase();
  if (c === 'CS-01' || c === 'CS1') return 'CS-01';
  if (c === 'CS-02' || c === 'CS2') return 'CS-02';
  if (c === 'CS-03' || c === 'CS3') return 'CS-03';
  return c;
}

export function isSameHouse(codeA, codeB) {
  if (!codeA || !codeB) return false;
  return normalizeHouseCode(codeA) === normalizeHouseCode(codeB);
}

export function normalizeRoomNumber(number) {
  if (!number) return '';
  return String(number)
    .trim()
    .toLowerCase()
    .replace(/^phòng\s*/i, '')
    .replace(/^p[.\s_-]*/i, '')
    .trim();
}

export function isDuplicateRoom(existingRooms, targetNumber, targetHouseCode, excludeRoomId = null) {
  if (!targetNumber || !String(targetNumber).trim()) return false;
  const normNum = normalizeRoomNumber(targetNumber);
  if (!normNum) return false;
  const targetHouse = normalizeHouseCode(targetHouseCode);
  if (!targetHouse) return false;
  return (existingRooms || []).some((r) => {
    if (excludeRoomId !== null && excludeRoomId !== undefined && (r.id === excludeRoomId || r.number === excludeRoomId)) {
      return false;
    }
    return isSameHouse(r.houseCode, targetHouse) && normalizeRoomNumber(r.number) === normNum;
  });
}
