import { isDuplicateRoom, isRoomHolding, isRoomMaintenance } from '../room.rules.js';
// Commands consume current state through the app's composition boundary.
export function createRoomsCommands({ actions, request, requireEmptyRoom, resolveFloor, room, roomPayload, view }) {
  return {
    addRoom: async input => {
      const payload = roomPayload(input);
      if (isDuplicateRoom(view.rooms, payload.roomNumber, input.houseCode)) {
        throw new Error(`Số phòng ${payload.roomNumber} đã tồn tại trong cơ sở này!`);
      }
      const floorId = await resolveFloor(input);
      return request('post', '/rooms', { ...payload, floorId });
    },
updateRoom: async (id,input) => { const target = room(id); if (isRoomHolding(target)) throw new Error('Phòng đang đặt cọc. Hãy xử lý đơn đặt cọc trước khi sửa phòng.'); const merged={...target,...input}; if (input.status && input.status !== target.status && (isRoomMaintenance(target) || input.status === 'MAINTENANCE' || input.status === 'HOLDING')) throw new Error('Trạng thái này phải được cập nhật qua đơn đặt cọc hoặc phiếu bảo trì.'); return request('put',`/rooms/${target.id}`,{...roomPayload(merged),floorId:await resolveFloor(merged)}); },
updateRoomPrice: (id, price) => { const r = room(id); if (r.status === 'OCCUPIED' || isRoomHolding(r)) throw new Error('Không thể sửa giá phòng đang thuê hoặc đặt cọc'); return actions.updateRoom(r.id, { price }); },
updateRoomStatus: (id, status) => { const target = room(id); if (isRoomHolding(target) || isRoomMaintenance(target) || ['HOLDING', 'MAINTENANCE'].includes(status)) throw new Error('Hãy xử lý đơn đặt cọc hoặc phiếu bảo trì của phòng.'); if (status === 'LOCKED') requireEmptyRoom(target); return request('patch', `/rooms/${target.id}/status`, { status }); },
completeRoomMaintenance: id => request('post', `/rooms/${room(id).id}/complete-maintenance`, {}),
deleteRoom: id => { const target = room(id); if (isRoomHolding(target) || isRoomMaintenance(target)) throw new Error('Hãy xử lý đơn đặt cọc hoặc phiếu bảo trì trước khi xóa phòng.'); requireEmptyRoom(target); return request('delete', `/rooms/${target.id}`); }
};
}
