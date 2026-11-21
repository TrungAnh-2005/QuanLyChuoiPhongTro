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

function setup(overrides = {}) {
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
  const actions = createRentalActions({ view, user: { id: 2, role: 'STAFF' }, testMode: true, billingMonth: '2026-11', refreshData: async () => { refreshes++; }, setState: () => {}, setDrafts: () => {}, setMonth: () => {} });
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
