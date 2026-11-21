export const amenityNames = values => [...new Set((Array.isArray(values) ? values : [])
  .map(value => typeof value === 'string' ? value : value?.name).filter(Boolean))];

export const roomPayload = input => ({
  roomNumber: input.number || input.roomNumber,
  basePrice: Number(input.price ?? input.basePrice), area: Number(input.area), floorId: input.floorId,
  maxOccupants: Number(input.maxOccupants ?? 2),
  ...(input.status ? { status: input.status } : {}),
  ...(input.amenities !== undefined ? { amenities: amenityNames(input.amenities) } : {}),
  ...(input.image !== undefined || input.imageUrl !== undefined ? { imageUrl: input.image ?? input.imageUrl } : {}),
});

export function mapRoom(room, houses, contracts) {
  const house = houses.find(house => house.id === room.boardingHouseId);
  return {
    ...room,
    amenities: amenityNames(room.amenities),
    image: room.imageUrl || room.image,
    number: room.roomNumber,
    price: Number(room.basePrice),
    floor: `Tầng ${room.floorNumber || 1}`,
    house: house?.name || room.boardingHouseName,
    houseCode: house?.code,
    occupants: contracts.filter(contract => contract.roomId === room.id && contract.status === 'ACTIVE').length,
  };
}
