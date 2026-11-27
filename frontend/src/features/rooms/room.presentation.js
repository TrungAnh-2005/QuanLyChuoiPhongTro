import { roomBelongsToProperty } from '../properties/property.catalog.js';

export function getRoomImage(room) {
  if (room?.image) return room.image;
  const floor = parseInt(room?.floor?.replace(/\D/g, '') || '1', 10);
  const amenities = Array.isArray(room?.amenities) ? room.amenities : [];
  if (floor >= 5 || amenities.some(a => typeof a === 'string' && (a.toLowerCase().includes('ban công') || a.toLowerCase().includes('penthouse') || a.toLowerCase().includes('sân phơi')))) {
    return '/assets/images/room_suite_3.jpg';
  }
  if (floor >= 3 || amenities.some(a => typeof a === 'string' && (a.toLowerCase().includes('máy giặt') || a.toLowerCase().includes('tủ lạnh')))) {
    return '/assets/images/room_duplex_2.jpg';
  }
  return '/assets/images/room_studio_1.jpg';
}

export function parseFloorNum(floorVal) {
  if (!floorVal) return 0;
  const match = String(floorVal).match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export function groupRoomsByProperty(rooms, houses) {
  const groups = new Map();

  for (const room of rooms) {
    const house = houses.find(house => roomBelongsToProperty(room, house));
    const id = house?.id ?? room.boardingHouseId;
    const code = house?.code || room.houseCode;
    const key = id != null ? `id:${id}` : `code:${code || ''}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        code,
        name: house?.name || room.house || code || 'Chưa xác định cơ sở',
        roomCount: 0,
        floors: new Map(),
      });
    }

    const group = groups.get(key);
    const floor = room.floor || 'Tầng 1';
    if (!group.floors.has(floor)) group.floors.set(floor, []);
    group.floors.get(floor).push(room);
    group.roomCount += 1;
  }

  return [...groups.values()]
    .sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true }))
    .map(group => ({
      ...group,
      floors: [...group.floors].sort(([a], [b]) => parseFloorNum(a) - parseFloorNum(b)),
    }));
}
