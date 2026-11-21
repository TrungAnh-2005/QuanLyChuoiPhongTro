import api from '../../shared/api/client.js';
import { data, camel, normalizeGender, isoDate, today } from '../../shared/utils/data.js';
import { resources } from './resources.js';
import { findRoommateSponsor, missingSponsorMessage } from '../../features/contracts/roommate.rules.js';
import { roomPayload } from '../../features/rooms/room.mapper.js';
import { hasRoomOccupants } from '../../features/rooms/room.rules.js';
import { createRoomsCommands } from '../../features/rooms/api/rooms.commands.js';
import { createPropertiesCommands } from '../../features/properties/api/properties.commands.js';
import { createTenantsCommands } from '../../features/tenants/api/tenants.commands.js';
import { createContractsCommands } from '../../features/contracts/api/contracts.commands.js';
import { createInvoicesCommands } from '../../features/invoices/api/invoices.commands.js';
import { createMetersCommands } from '../../features/meters/api/meters.commands.js';
import { createMaintenanceCommands } from '../../features/maintenance/api/maintenance.commands.js';
import { createSubscriptionsCommands } from '../../features/subscriptions/api/subscriptions.commands.js';
import { createLandlordsCommands } from '../../features/landlords/api/landlords.commands.js';
import { createSystemCommands } from '../../features/system/api/system.commands.js';
import { createNotificationsCommands } from '../../features/notifications/api/notifications.commands.js';

export function createRentalActions({ view, user, testMode, billingMonth, refreshData, setState, setDrafts, setMonth }) {
  const find = (rows, id, label = 'dữ liệu') => {
    const row = rows?.find(r => [r.id, r.number, r.code, r.contractCode].some(v => v != null && String(v) === String(id)));
    if (!row) throw new Error(`Không tìm thấy ${label} (ID/Mã: ${id || 'trống'})`);
    return row;
  };
  const room = value => find(view.rooms, value, 'phòng');
  const tenantId = input => input.tenantId || view.tenants.find(t => t.email === user?.email)?.id || view.tenants.find(t => t.fullName === (input.tenant || input.tenantName || user?.fullName))?.id || (testMode ? view.tenants[0]?.id : undefined);
  const request = async (method, url, payload) => { const result = data(await api[method](url, payload)); await refreshData(); return { ...result, success: true, data: result }; };
  const create = (key, body) => request('post', resources[key], body);
  const patch = (key, id, body) => request('patch', `${resources[key]}/${id}`, body);
  const remove = (key, id) => request('delete', `${resources[key]}/${id}`);
  const requireEmptyRoom = target => {
    if (hasRoomOccupants(target, view.contracts, view.roomMembers)) throw new Error(`Phòng ${target.number} còn người thuê. Vui lòng trả phòng trước khi khóa hoặc xóa.`);
  };
  const requireEmptyHouse = id => {
    const occupied = view.rooms.filter(r => String(r.boardingHouseId) === String(id))
      .some(r => hasRoomOccupants(r, view.contracts, view.roomMembers));
    if (occupied) throw new Error('Cơ sở còn người thuê. Vui lòng trả hết phòng trước khi khóa hoặc xóa cơ sở.');
  };
  const tenantPayload = input => ({ fullName: input.fullName || input.name, identityCard: input.cccd || input.identityCard, phone: input.phone, email: input.email || undefined, birthDate: input.birthDate ? isoDate(input.birthDate) : undefined, gender: normalizeGender(input.gender), hometown: input.hometown, address: input.address });
  const resolveFloor = async input => {
    const floorNumber = Number(String(input.floor || input.floorNumber || 1).replace(/\D/g,'')) || 1;
    const targetHouse = input.boardingHouseId || input.houseCode;
    const house = (targetHouse ? view.boardingHouses.find(h => [h.id, h.code].some(v => v != null && String(v).toUpperCase() === String(targetHouse).toUpperCase())) : null) || view.boardingHouses[0];
    if (!house) throw new Error('Chưa có cơ sở nhà trọ nào trên hệ thống');
    const floors = data(await api.get('/rooms/floors')).map(camel), buildings = data(await api.get('/rooms/buildings')).map(camel);
    let building = buildings.find(b => b.boardingHouseId === house.id);
    if (!building) building = camel(data(await api.post('/rooms/buildings', { boardingHouseId: house.id, name: 'Tòa A' })));
    const existing = floors.find(f => f.buildingId === building.id && f.floorNumber === floorNumber);
    return existing?.id || data(await api.post('/rooms/floors', { buildingId: building.id, floorNumber })).id;
  };

  const actions = {};
  const dependencies = { find, room, tenantId, request, create, patch, remove, requireEmptyRoom, requireEmptyHouse, tenantPayload, resolveFloor, view, user, testMode, billingMonth, refreshData, setState, setDrafts, setMonth, api, data, camel, normalizeGender, isoDate, today, findRoommateSponsor, missingSponsorMessage, roomPayload, hasRoomOccupants, resources, actions };
  Object.assign(actions, { refreshData,
    ...createRoomsCommands(dependencies),
    ...createPropertiesCommands(dependencies),
    ...createTenantsCommands(dependencies),
    ...createContractsCommands(dependencies),
    ...createInvoicesCommands(dependencies),
    ...createMetersCommands(dependencies),
    ...createMaintenanceCommands(dependencies),
    ...createSubscriptionsCommands(dependencies),
    ...createLandlordsCommands(dependencies),
    ...createSystemCommands(dependencies),
    ...createNotificationsCommands(dependencies),
  });
  return actions;
}
