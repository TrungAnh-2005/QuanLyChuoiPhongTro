import { test } from 'node:test';
import assert from 'node:assert/strict';
import { amenityNames, roomPayload } from './room.mapper.js';
import { amenityOptions } from './room.config.js';
import { hasRoomOccupants, isRoomLocked, isRoomHolding, isRoomMaintenance, isDuplicateRoom, depositProgress, tenantRoomRequests } from './room.rules.js';

test('room edit payload preserves selected amenities, image and distinct lock status', () => {
  const payload = roomPayload({ number: 'P.101', price: 3500000, area: 25, maxOccupants: 2,
    amenities: ['WiFi', 'Ban công'], image: '/assets/images/room_duplex_2.jpg', status: 'LOCKED' });
  assert.deepEqual(payload.amenities, ['WiFi', 'Ban công']);
  assert.equal(payload.imageUrl, '/assets/images/room_duplex_2.jpg');
  assert.equal(payload.status, 'LOCKED');
});

test('saved amenity objects are usable as checked names, including unknown existing options', () => {
  const names = amenityNames([{ id: 1, name: 'WiFi Tốc Độ Cao' }, { id: 9, name: 'Bàn làm việc' }]);
  assert.deepEqual(names, ['WiFi Tốc Độ Cao', 'Bàn làm việc']);
  assert.ok(amenityOptions(names).includes('WiFi Tốc Độ Cao'));
  assert.ok(amenityOptions(names).includes('Bàn làm việc'));
  assert.ok(!amenityOptions(names).includes('WiFi'));
});

test('empty amenities explicitly clears selections while omitted amenities remains omitted', () => {
  assert.deepEqual(roomPayload({ amenities: [] }).amenities, []);
  assert.equal(Object.hasOwn(roomPayload({}), 'amenities'), false);
});

test('occupied status, active contract or remaining member independently prevents locking', () => {
  const vacant = { id: 1, number: 'P.101', status: 'AVAILABLE' };
  assert.equal(hasRoomOccupants({ ...vacant, status: 'OCCUPIED' }), true);
  assert.equal(hasRoomOccupants(vacant, [{ roomId: 1, status: 'ACTIVE' }]), true);
  assert.equal(hasRoomOccupants(vacant, [], [{ roomId: 1, status: 'ACTIVE' }]), true);
  assert.equal(hasRoomOccupants(vacant, [{ roomId: 2, status: 'ACTIVE' }], [{ roomId: 2, roomNumber: 'P.101', status: 'ACTIVE' }]), false);
  assert.equal(hasRoomOccupants(vacant, [{ roomId: 1, status: 'TERMINATED' }], [{ roomId: 1, status: 'MOVED_OUT' }]), false);
});

test('maintenance and deposits cannot be released using the generic lock toggle', () => {
  assert.equal(isRoomLocked({ status: 'LOCKED' }), true);
  assert.equal(isRoomLocked({ status: 'MAINTENANCE' }), false);
  assert.equal(isRoomLocked({ status: 'AVAILABLE' }), false);
  assert.equal(isRoomHolding({ status: 'HOLDING' }), true);
  assert.equal(isRoomHolding({ status: 'OCCUPIED', holdRequestId: 5 }), false);
  assert.equal(isRoomMaintenance({ maintenanceRequestId: 9 }), true);
});

test('initial receipt counts toward one month deposit without assuming any money was paid', () => {
  assert.deepEqual(depositProgress({ requiredDepositAmount: 3500000 }), { required: 3500000, paid: 0, remaining: 3500000 });
  assert.deepEqual(depositProgress({ requiredDepositAmount: 3500000, paidDepositAmount: 1000000 }), { required: 3500000, paid: 1000000, remaining: 2500000 });
  assert.deepEqual(depositProgress({ requiredDepositAmount: 3500000, paidDepositAmount: 3500000 }), { required: 3500000, paid: 3500000, remaining: 0 });
});

test('tenant requests use the linked tenant id and never a shared display name', () => {
  const requests = [{ id: 1, tenantId: 10, tenantName: 'Same name' }, { id: 2, tenantId: 20, tenantName: 'Same name' }];
  assert.deepEqual(tenantRoomRequests(requests, '10').map(request => request.id), [1]);
  assert.deepEqual(tenantRoomRequests(requests, undefined), []);
});

test('duplicate room checks normalize labels but stay scoped to the house and exclude the edited room', () => {
  const rooms = [{ id: 101, number: 'P.101', houseCode: 'CS-01' }];
  assert.equal(isDuplicateRoom(rooms, '101', 'CS1'), true);
  assert.equal(isDuplicateRoom(rooms, '101', 'CS-02'), false);
  assert.equal(isDuplicateRoom(rooms, '101', 'CS-01', 101), false);
});
