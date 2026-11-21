// Commands consume current state through the app's composition boundary.
export function createRoomsCommands({ actions, request, requireEmptyRoom, resolveFloor, room, roomPayload }) {
  return {
addRoom: async input => request('post','/rooms',{...roomPayload(input),floorId:await resolveFloor(input)}),
updateRoom: async (id,input) => { const merged={...room(id),...input}; return request('put',`/rooms/${room(id).id}`,{...roomPayload(merged),floorId:await resolveFloor(merged)}); },
updateRoomPrice: (id, price) => { const r = room(id); if (r.status === 'OCCUPIED') throw new Error('Không thể sửa giá phòng đang thuê'); return actions.updateRoom(r.id, { price }); },
updateRoomStatus: (id, status) => { const target = room(id); if (['LOCKED', 'MAINTENANCE'].includes(status)) requireEmptyRoom(target); return request('patch', `/rooms/${target.id}/status`, { status }); },
deleteRoom: id => { const target = room(id); requireEmptyRoom(target); return request('delete', `/rooms/${target.id}`); }
};
}
