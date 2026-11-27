import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import api from '../../shared/api/client.js';
import { createRentalActions } from './createRentalActions.js';
import { selectRentalView } from './selectRentalView.js';
import { initial } from './resources.js';

const storage = () => { const entries = new Map(); return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, String(value)), removeItem: key => entries.delete(key) }; };
globalThis.localStorage = storage();
globalThis.sessionStorage = storage();
globalThis.window = new EventTarget();
beforeEach(() => { globalThis.sessionStorage = storage(); });

function setup(overrides = {}, user = { id: 2, role: 'STAFF' }) {
  const calls = [];
  const state = { ...initial,
    boardingHouses: [{ id: 1, code: 'CS-1', name: 'Test house' }],
    rooms: [{ id: 101, boardingHouseId: 1, floorId: 13, floorNumber: 1, roomNumber: 'P.101', basePrice: 3500000, area: 25, maxOccupants: 2, status: 'AVAILABLE', amenities: [{ id: 1, name: 'WiFi' }], imageUrl: '/room.jpg' }],
    tenants: [{ id: 201, fullName: 'Resident', email: 'resident@example.test' }],
    ...overrides,
  };
  const view = selectRentalView(state, { billingMonth: '2026-11', drafts: {}, user: { id: 2, role: 'STAFF' }, testMode: true });
  let refreshes = 0;
  api.defaults.adapter = async config => {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    calls.push({ method: config.method, url: config.url, body });
    const data = config.url === '/rooms/buildings' ? [{ id: 12, boardingHouseId: 1 }]
      : config.url === '/rooms/floors' ? [{ id: 13, buildingId: 12, floorNumber: 1 }]
      : { id: 999 };
    return { config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data } };
  };
  const actions = createRentalActions({ view, user, testMode: true, billingMonth: '2026-11', refreshData: async () => { refreshes++; }, setState: () => {}, setDrafts: () => {}, setMonth: () => {} });
  return { actions, calls, view, refreshes: () => refreshes };
}

test('room price updates retain amenities, image and the resolved floor', async () => {
  const { actions, calls, refreshes } = setup();
  await actions.updateRoomPrice(101, 4000000);
  assert.deepEqual(calls.at(-1), { method: 'put', url: '/rooms/101', body: {
    roomNumber: 'P.101', basePrice: 4000000, area: 25, floorId: 13, maxOccupants: 2,
    status: 'AVAILABLE', amenities: ['WiFi'], imageUrl: '/room.jpg',
  } });
  assert.equal(refreshes(), 1);
});

test('creating a room rejects an equivalent room number in the same property before any API call', async () => {
  const { actions, calls, refreshes } = setup();
  await assert.rejects(actions.addRoom({ number: 'Phòng 101', houseCode: 'CS-1' }), /Số phòng .* đã tồn tại/);
  assert.deepEqual(calls, []);
  assert.equal(refreshes(), 0);
});

test('creating a room allows the same room number in a different property', async () => {
  const { actions, calls, refreshes } = setup({
    boardingHouses: [{ id: 1, code: 'CS-1' }, { id: 2, code: 'CS-2' }],
    rooms: [{ id: 101, boardingHouseId: 2, roomNumber: 'P.101', basePrice: 3500000 }],
  });
  await actions.addRoom({ number: 'P.101', houseCode: 'CS-1', floor: 'Tầng 1', price: 3500000, area: 25 });
  assert.deepEqual(calls.at(-1), { method: 'post', url: '/rooms', body: {
    roomNumber: 'P.101', basePrice: 3500000, area: 25, floorId: 13, maxOccupants: 2,
  } });
  assert.equal(refreshes(), 1);
});

test('house creation always requests approval and only admin uses the approval endpoint', async () => {
  const staff = setup();
  await staff.actions.addBoardingHouse({ name: 'New house', status: 'ACTIVE' });
  assert.equal(staff.calls[0].body.status, 'PENDING_APPROVAL');
  assert.throws(() => staff.actions.approveBoardingHouse(1), /Admin/);
  const admin = setup({}, { id: 1, role: 'ADMIN' });
  await admin.actions.approveBoardingHouse(1);
  assert.equal(admin.calls[0].url, '/properties/1/approval');
  assert.equal(admin.calls[0].method, 'patch');
});

test('utility price commands retain service endpoints and refresh after both rates', async () => {
  const { actions, calls, refreshes } = setup();
  await actions.updateUtilityPrices({ elecPrice: 3500, waterPrice: 25000 });
  assert.deepEqual(calls.map(row => row.url), ['/rooms/service-configs', '/rooms/service-configs']);
  assert.deepEqual(calls.map(row => row.body.unitPrice), [3500, 25000]);
  assert.equal(refreshes(), 1);
});

test('active residents prevent room lock and house deletion before sending an API request', () => {
  const { actions, calls } = setup({ roomMembers: [{ id: 1, roomId: 101, tenantId: 201, status: 'ACTIVE' }] });
  assert.throws(() => actions.updateRoomStatus(101, 'LOCKED'), /còn người thuê/);
  assert.throws(() => actions.deleteBoardingHouse(1), /còn người thuê/);
  assert.equal(calls.length, 0);
});

test('vacant rooms send distinct lock and unlock statuses through the shared request client', async () => {
  const { actions, calls, refreshes } = setup();
  await actions.updateRoomStatus(101, 'LOCKED');
  await actions.updateRoomStatus(101, 'AVAILABLE');
  assert.deepEqual(calls.map(row => row.body), [{ status: 'LOCKED' }, { status: 'AVAILABLE' }]);
  assert.equal(refreshes(), 2);
});

test('resident identity edits delegate to tenant update with existing details preserved', async () => {
  const { actions, calls } = setup({ roomMembers: [{ id: 9, roomId: 101, tenantId: 201, status: 'ACTIVE' }] });
  await actions.updateResidentCccd(9, { cccd: '012345678901' });
  assert.equal(calls.at(-1).url, '/tenants/201');
  assert.equal(calls.at(-1).body.identityCard, '012345678901');
  assert.equal(calls.at(-1).body.fullName, 'Resident');
});

test('checkout requests retain active contract and explicit forfeiture details', async () => {
  const { actions, calls } = setup({ contracts: [{ id: 301, roomId: 101, tenantId: 201, status: 'ACTIVE' }] });
  await actions.submitCheckoutRequest({ roomId: 101, tenantId: 201, forfeitDeposit: true, moveOutDate: '2026-11-30', reason: 'Moving' });
  assert.equal(calls.at(-1).url, '/contracts/requests');
  assert.equal(calls.at(-1).body.contractId, 301);
  assert.equal(calls.at(-1).body.forfeitDeposit, true);
  assert.equal(calls.at(-1).body.moveOutDate, '2026-11-30');
});

test('cross-feature house deletion audit delegates to the audit command', async () => {
  const { actions, calls } = setup();
  await actions.recordHouseDeletion({ houseCode: 'CS-1', houseName: 'Test house' });
  assert.deepEqual(calls.at(-1), { method: 'post', url: '/auth/audit-logs', body: { action: 'DELETE_HOUSE', target: 'CS-1', details: 'Test house' } });
});

test('view composition keeps all invoices while filtering the selected billing month', () => {
  const { view } = setup({ invoices: [
    { id: 1, roomId: 101, tenantId: 201, month: 10, year: 2026, totalAmount: 100 },
    { id: 2, roomId: 101, tenantId: 201, month: 11, year: 2026, totalAmount: 200 },
  ] });
  assert.deepEqual(view.invoices.map(row => row.id), [2]);
  assert.deepEqual(view.allInvoices.map(row => row.id), [1, 2]);
  assert.equal(view.invoices[0].houseCode, 'CS-1');
});

test('deposit receipt and manager cancellation preserve server commands and refresh authoritative state', async () => {
  const { actions, calls, refreshes } = setup();
  const receipt = { amount: '1000000', receiptReference: '65996c3f-0c4b-492c-8596-851a9aee323e' };
  await actions.confirmRoomRequestDeposit(501, receipt);
  await actions.confirmRoomRequestDeposit(501, receipt);
  await actions.cancelRentalRequest(501, 'Tenant requested cancellation');
  assert.deepEqual(calls.slice(0, 2).map(call => call.body), [
    { amount: 1000000, receiptReference: receipt.receiptReference },
    { amount: 1000000, receiptReference: receipt.receiptReference },
  ]);
  assert.equal(calls[0].url, '/contracts/requests/501/deposit');
  assert.deepEqual(calls[2], { method: 'post', url: '/contracts/requests/501/cancel', body: { reason: 'Tenant requested cancellation' } });
  assert.equal(refreshes(), 3);
});

test('definitively rejected receipts unlock amount entry only after an empty authoritative ledger and refresh', async () => {
  for (const status of [400, 409]) {
    const { actions, refreshes } = setup();
    const urls = [];
    api.defaults.adapter = async config => {
      urls.push(config.url);
      if (config.method === 'post') {
        const failure = new Error('Stale amount');
        failure.config = config; failure.response = { status, data: { message: 'Stale amount' } };
        throw failure;
      }
      return { config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: [] } };
    };
    await assert.rejects(actions.confirmRoomRequestDeposit(501, { amount: 3000000, receiptReference: 'retry-ref' }), failure => failure.receiptRejected === true);
    assert.deepEqual(urls, ['/contracts/requests/501/deposit', '/contracts/requests/501/receipts']);
    assert.equal(refreshes(), 1);
  }
});

test('an already committed receipt is reconciled from the ledger after a conflict', async () => {
  const { actions, refreshes } = setup();
  const recorded = { amount: 1000000, receiptReference: 'already-committed' };
  api.defaults.adapter = async config => {
    if (config.method === 'post') {
      const failure = new Error('Conflict');
      failure.config = config; failure.response = { status: 409, data: { message: 'Conflict' } };
      throw failure;
    }
    return { config, status: 200, statusText: 'OK', headers: {}, data: { success: true, data: [recorded] } };
  };
  assert.deepEqual(await actions.getRoomRequestReceipts(501), [recorded]);
  const result = await actions.confirmRoomRequestDeposit(501, recorded);
  assert.equal(result.reconciled, true);
  assert.deepEqual(result.data, recorded);
  assert.equal(refreshes(), 1);
});

test('uncertain receipt failures retain their reference when the network, server or ledger is unavailable', async () => {
  for (const scenario of ['network', 'server', 'ledger']) {
    const { actions, refreshes } = setup();
    const urls = [];
    api.defaults.adapter = async config => {
      urls.push(config.url);
      const failure = new Error('Unavailable');
      failure.config = config;
      if (scenario !== 'network') failure.response = { status: scenario === 'ledger' && config.method === 'post' ? 409 : 503, data: { message: 'Unavailable' } };
      throw failure;
    };
    await assert.rejects(actions.confirmRoomRequestDeposit(501, { amount: 1000000, receiptReference: 'must-retain' }), failure => failure.receiptRejected === undefined);
    assert.equal(urls.length, scenario === 'ledger' ? 2 : 1);
    assert.equal(refreshes(), 0);
  }
});

test('held and maintenance rooms reject generic release, price editing and deletion', async () => {
  for (const status of ['HOLDING', 'MAINTENANCE']) {
    const { actions, calls } = setup({ rooms: [{ id: 101, boardingHouseId: 1, roomNumber: 'P.101', basePrice: 3500000, status }] });
    assert.throws(() => actions.updateRoomStatus(101, 'AVAILABLE'), /đặt cọc|bảo trì/);
    assert.throws(() => actions.deleteRoom(101), /đặt cọc|bảo trì/);
    if (status === 'HOLDING') {
      assert.throws(() => actions.updateRoomPrice(101, 4000000), /đặt cọc/);
      await assert.rejects(actions.updateRoom(101, { price: 4000000 }), /đặt cọc/);
    }
    assert.equal(calls.length, 0);
  }
});

test('blocking maintenance is explicit while occupied repairs retain non-blocking tickets', async () => {
  const { actions, calls, refreshes } = setup();
  await actions.createTicket({ roomId: 101, title: 'Repair', description: 'Vacant room repair', blocksRental: true });
  await actions.updateTicketStatus(901, 'RESOLVED');
  await actions.createTicket({ roomId: 101, tenantId: 201, title: 'Repair', description: 'Occupied repair' });
  assert.equal(calls[0].body.blocksRental, true);
  assert.equal(Object.hasOwn(calls[0].body, 'tenantId'), false);
  assert.equal(calls[1].url, '/maintenance/901/status');
  assert.equal(calls[1].body.status, 'RESOLVED');
  assert.equal(calls[2].body.blocksRental, false);
  assert.equal(calls[2].body.tenantId, 201);
  assert.equal(refreshes(), 3);
});
