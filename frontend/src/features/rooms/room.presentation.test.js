import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupRoomsByProperty } from './room.presentation.js';

test('rooms on matching floors stay with their own property', () => {
  const houses = [
    { id: 1, code: 'CS-01', name: 'Cơ sở 1' },
    { id: 2, code: 'CS-02', name: 'Cơ sở 2' },
  ];
  const rooms = [
    { id: 1, boardingHouseId: 2, floor: 'Tầng 1', number: 'P.101' },
    { id: 2, boardingHouseId: 1, floor: 'Tầng 10' },
    { id: 3, houseCode: 'CS-01', floor: 'Tầng 1', number: 'P.101' },
    { id: 4, boardingHouseId: '1', houseCode: 'CS-02', floor: 'Tầng 2' },
  ];

  const groups = groupRoomsByProperty(rooms, houses);

  assert.deepEqual(groups.map(({ code, floors }) => [
    code,
    floors.map(([floor, floorRooms]) => [floor, floorRooms.map(room => room.id)]),
  ]), [
    ['CS-01', [['Tầng 1', [3]], ['Tầng 2', [4]], ['Tầng 10', [2]]]],
    ['CS-02', [['Tầng 1', [1]]]],
  ]);
});
