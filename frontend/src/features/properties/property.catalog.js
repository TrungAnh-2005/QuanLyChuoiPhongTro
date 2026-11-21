import { getHouseFullAddress } from './property.presentation.js';

export function roomBelongsToProperty(room, house) {
  if (room.boardingHouseId != null) return house.id != null && String(room.boardingHouseId) === String(house.id);
  return Boolean(room.houseCode && house.code && room.houseCode === house.code);
}

export function buildTenantPropertyCatalog(houses, rooms) {
  const visibleHouses = houses.filter(house => house.status === 'ACTIVE');
  const visibleRooms = rooms.filter(room => visibleHouses.some(house => roomBelongsToProperty(room, house)));
  const groups = new Map();
  for (const house of visibleHouses) {
    const address = getHouseFullAddress(house);
    if (!groups.has(address)) groups.set(address, []);
    groups.get(address).push(house);
  }
  const addressGroups = [...groups].map(([address, housesAtAddress]) => {
    const propertyRooms = visibleRooms.filter(room => housesAtAddress.some(house => roomBelongsToProperty(room, house)));
    const prices = propertyRooms.map(room => Number(room.price ?? room.basePrice) || 0).filter(price => price > 0);
    return {
      address,
      houses: housesAtAddress,
      totalRoomsCount: propertyRooms.length,
      availableRoomsCount: propertyRooms.filter(room => room.status === 'AVAILABLE').length,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
    };
  });
  return { visibleHouses, visibleRooms, addressGroups };
}
