import { roomBelongsToProperty } from '../properties/property.catalog.js';

const sameId = (left, right) => left != null && right != null && String(left) === String(right);
const normalized = value => String(value || '').trim().toLowerCase();

function findTenant(user, tenants) {
  if (!user) return null;
  const linked = tenants.find(tenant => sameId(tenant.id, user.tenantId) || sameId(tenant.userId, user.id));
  if (linked) return linked;
  if (normalized(user.email)) return tenants.find(tenant => normalized(tenant.email) === normalized(user.email)) || null;
  if (user.phone) return tenants.find(tenant => tenant.phone === user.phone) || null;
  return null;
}

function sharesBuilding(room, rentedRoom) {
  if (!sameId(room.boardingHouseId, rentedRoom.boardingHouseId)) return false;
  if (room.buildingId != null && rentedRoom.buildingId != null) return sameId(room.buildingId, rentedRoom.buildingId);
  if (room.buildingName && rentedRoom.buildingName) return room.buildingName === rentedRoom.buildingName;
  return true;
}

export function selectTenantResidency({ user, tenants = [], contracts = [], roomMembers = [], rooms = [], boardingHouses = [] }) {
  const currentTenant = findTenant(user, tenants);
  const activeContracts = currentTenant ? contracts.filter(contract => contract.status === 'ACTIVE' && (
    sameId(contract.tenantId, currentTenant.id) || roomMembers.some(member => member.status === 'ACTIVE'
      && sameId(member.tenantId, currentTenant.id) && sameId(member.contractId, contract.id)
      && sameId(member.roomId, contract.roomId))
  )) : [];
  const rentedRooms = rooms.filter(room => activeContracts.some(contract => sameId(contract.roomId, room.id)));
  const communityRooms = rooms.filter(room => rentedRooms.some(rentedRoom => sharesBuilding(room, rentedRoom)));
  const communityHouses = boardingHouses.filter(house => communityRooms.some(room => roomBelongsToProperty(room, house)));
  return { currentTenant, activeContracts, rentedRooms, communityRooms, communityHouses, hasActiveRental: activeContracts.length > 0 };
}

export function getRoomResidents(roomId, { contracts = [], roomMembers = [], tenants = [] }) {
  const residents = new Map();
  const add = (tenantId, role) => {
    if (tenantId == null || residents.has(String(tenantId))) return;
    const tenant = tenants.find(item => sameId(item.id, tenantId));
    residents.set(String(tenantId), { tenantId, name: tenant?.fullName || tenant?.name || 'Cư dân chưa cập nhật tên', role });
  };
  const activeContracts = contracts.filter(contract => sameId(contract.roomId, roomId) && contract.status === 'ACTIVE');
  for (const contract of activeContracts) add(contract.tenantId, 'REPRESENTATIVE');
  for (const member of roomMembers) {
    if (member.status === 'ACTIVE' && sameId(member.roomId, roomId)
      && activeContracts.some(contract => sameId(contract.id, member.contractId))) add(member.tenantId, 'MEMBER');
  }
  return [...residents.values()];
}
