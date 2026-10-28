export function parseFloorNum(floorVal) {
  if (!floorVal) return 0;
  const match = String(floorVal).match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export function normalizeHouseCode(code) {
  if (!code) return '';
  const c = String(code).trim().toUpperCase();
  if (c === 'CS-01' || c === 'CS1') return 'CS-01';
  if (c === 'CS-02' || c === 'CS2') return 'CS-02';
  if (c === 'CS-03' || c === 'CS3') return 'CS-03';
  return c;
}

export function isSameHouse(codeA, codeB) {
  if (!codeA || !codeB) return false;
  return normalizeHouseCode(codeA) === normalizeHouseCode(codeB);
}

export function normalizeRoomNumber(number) {
  if (!number) return '';
  return String(number)
    .trim()
    .toLowerCase()
    .replace(/^phòng\s*/i, '')
    .replace(/^p[\.\s_-]*/i, '')
    .trim();
}

export function isDuplicateRoom(existingRooms, targetNumber, targetHouseCode, excludeRoomId = null) {
  if (!targetNumber || !String(targetNumber).trim()) return false;
  const normNum = normalizeRoomNumber(targetNumber);
  if (!normNum) return false;
  const targetHouse = normalizeHouseCode(targetHouseCode);
  if (!targetHouse) return false;
  return (existingRooms || []).some((r) => {
    if (excludeRoomId !== null && excludeRoomId !== undefined && (r.id === excludeRoomId || r.number === excludeRoomId)) {
      return false;
    }
    return isSameHouse(r.houseCode, targetHouse) && normalizeRoomNumber(r.number) === normNum;
  });
}

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

export function healBoardingHousesList(list) {
  if (!Array.isArray(list) || list.length === 0) return list;

  let changed = false;
  const usedCodes = new Set();
  const codeRenames = {};

  const healed = list.map((h) => {
    // Đảm bảo CS-01 chuẩn 4 tầng
    if ((h.code === 'CS-01' || (h.name && h.name.includes('Cầu Giấy'))) && h.floors === 5) {
      h = { ...h, floors: 4, totalFloors: 4 };
      changed = true;
    }
    const isCustom = (typeof h.id === 'number' && h.id > 1000) || h.createdAtMs || (h.createdAt && !h.features);
    let code = (h.code || '').trim().toUpperCase();
    const u = (h.createdBy || h.managerUsername || '').toLowerCase();

    let prefix = 'CS';
    if (u === 'staff' || u === 'staff1') prefix = 'S1-CS';
    else if (u === 'staff2') prefix = 'S2-CS';
    else if (u && u !== 'admin') prefix = `${u.toUpperCase()}-CS`;

    // Nếu là cơ sở tự tạo nhưng lại mang mã mẫu ban đầu CS-02 / CS-03
    if (isCustom && (code === 'CS-02' || code === 'CS-03')) {
      code = '';
    }

    // Nếu mã trống hoặc bị TRÙNG với một cơ sở khác trong danh sách
    if (!code || usedCodes.has(code)) {
      // Ưu tiên số thứ tự theo tên cơ sở (ví dụ tên "1" -> 01, tên "2" -> 02)
      let preferredNum = null;
      const numMatch = (h.name || '').match(/(\d+)/);
      if (numMatch) {
        const candidateNum = parseInt(numMatch[1], 10);
        const candidateCode = `${prefix}-${String(candidateNum).padStart(2, '0')}`;
        if (!usedCodes.has(candidateCode)) {
          preferredNum = candidateNum;
        }
      }

      let seq = preferredNum || 1;
      let newCode = `${prefix}-${String(seq).padStart(2, '0')}`;
      while (usedCodes.has(newCode)) {
        seq++;
        newCode = `${prefix}-${String(seq).padStart(2, '0')}`;
      }

      if (h.code && h.code !== newCode) {
        codeRenames[h.code] = newCode;
      }
      code = newCode;
      changed = true;
    }

    usedCodes.add(code);
    return code !== h.code ? { ...h, code } : h;
  });

  if (changed) {
    try {
      localStorage.setItem('rental_boarding_houses', JSON.stringify(healed));
    } catch {}

    // Đồng bộ phòng theo mã cơ sở mới nếu có thay đổi
    try {
      const savedRooms = localStorage.getItem('rental_rooms');
      if (savedRooms) {
        const parsedRooms = JSON.parse(savedRooms);
        if (Array.isArray(parsedRooms)) {
          let roomsChanged = false;
          const updatedRooms = parsedRooms.map((r) => {
            const matchedHouse = healed.find((h) =>
              (h.name && r.house && (h.name === r.house || String(r.house).trim() === String(h.name).trim())) ||
              (codeRenames[r.houseCode] && h.code === codeRenames[r.houseCode])
            );
            if (matchedHouse && matchedHouse.code !== r.houseCode) {
              roomsChanged = true;
              return { ...r, houseCode: matchedHouse.code, house: matchedHouse.name };
            }
            return r;
          });
          if (roomsChanged) {
            localStorage.setItem('rental_rooms', JSON.stringify(updatedRooms));
          }
        }
      }
    } catch {}
  }

  return healed;
}

export const ALL_ROOMS = [
  // =========================================================================
  // CƠ SỞ 1: NHÀ TRỌ CẦU GIẤY (CS-01) - 5 TẦNG, ĐÚNG 12 PHÒNG
  // =========================================================================
  { id: 101, number: 'P.101', houseCode: 'CS-01', house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', floor: 'Tầng 1', price: 3500000, area: 25, occupants: 1, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
  { id: 102, number: 'P.102', houseCode: 'CS-01', house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', floor: 'Tầng 1', price: 3800000, area: 28, occupants: 0, maxOccupants: 3, status: 'AVAILABLE', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Ban công'] },
  { id: 103, number: 'P.103', houseCode: 'CS-01', house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', floor: 'Tầng 1', price: 3200000, area: 22, occupants: 1, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Nóng lạnh'] },
  { id: 104, number: 'P.201', houseCode: 'CS-01', house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', floor: 'Tầng 2', price: 3600000, area: 25, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
  { id: 105, number: 'P.202', houseCode: 'CS-01', house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', floor: 'Tầng 2', price: 3500000, area: 25, occupants: 0, maxOccupants: 2, status: 'MAINTENANCE', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
  { id: 106, number: 'P.203', houseCode: 'CS-01', house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', floor: 'Tầng 2', price: 4000000, area: 30, occupants: 0, maxOccupants: 3, status: 'AVAILABLE', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Tủ lạnh'] },
  { id: 107, number: 'P.301', houseCode: 'CS-01', house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', floor: 'Tầng 3', price: 3700000, area: 26, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
  { id: 108, number: 'P.302', houseCode: 'CS-01', house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', floor: 'Tầng 3', price: 3700000, area: 26, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
  { id: 109, number: 'P.303', houseCode: 'CS-01', house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', floor: 'Tầng 3', price: 3900000, area: 28, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Ban công'] },
  { id: 110, number: 'P.401', houseCode: 'CS-01', house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', floor: 'Tầng 4', price: 3800000, area: 27, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
  { id: 111, number: 'P.402', houseCode: 'CS-01', house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', floor: 'Tầng 4', price: 3800000, area: 27, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
  { id: 112, number: 'P.403', houseCode: 'CS-01', house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', floor: 'Tầng 4', price: 3800000, area: 28, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Ban công'] },

  // =========================================================================
  // CƠ SỞ 2: NHÀ TRỌ BÁCH KHOA (CS-02) - 4 TẦNG, ĐÚNG 8 PHÒNG
  // =========================================================================
  { id: 201, number: 'P.101', houseCode: 'CS-02', house: 'Nhà Trọ Bách Khoa - Cơ Sở 2', floor: 'Tầng 1', price: 2800000, area: 20, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Nóng lạnh', 'Gần ĐH Bách Khoa'] },
  { id: 202, number: 'P.102', houseCode: 'CS-02', house: 'Nhà Trọ Bách Khoa - Cơ Sở 2', floor: 'Tầng 1', price: 3000000, area: 22, occupants: 0, maxOccupants: 2, status: 'AVAILABLE', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
  { id: 203, number: 'P.201', houseCode: 'CS-02', house: 'Nhà Trọ Bách Khoa - Cơ Sở 2', floor: 'Tầng 2', price: 3200000, area: 24, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
  { id: 204, number: 'P.202', houseCode: 'CS-02', house: 'Nhà Trọ Bách Khoa - Cơ Sở 2', floor: 'Tầng 2', price: 3200000, area: 24, occupants: 1, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
  { id: 205, number: 'P.301', houseCode: 'CS-02', house: 'Nhà Trọ Bách Khoa - Cơ Sở 2', floor: 'Tầng 3', price: 3400000, area: 26, occupants: 0, maxOccupants: 3, status: 'AVAILABLE', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Máy giặt chung'] },
  { id: 206, number: 'P.302', houseCode: 'CS-02', house: 'Nhà Trọ Bách Khoa - Cơ Sở 2', floor: 'Tầng 3', price: 3400000, area: 26, occupants: 0, maxOccupants: 3, status: 'AVAILABLE', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Máy giặt chung'] },
  { id: 207, number: 'P.401', houseCode: 'CS-02', house: 'Nhà Trọ Bách Khoa - Cơ Sở 2', floor: 'Tầng 4', price: 3600000, area: 28, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
  { id: 208, number: 'P.402', houseCode: 'CS-02', house: 'Nhà Trọ Bách Khoa - Cơ Sở 2', floor: 'Tầng 4', price: 3600000, area: 28, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },

  // =========================================================================
  // CƠ SỞ 3: NHÀ TRỌ ĐỐNG ĐA (CS-03) - 6 TẦNG, ĐÚNG 16 PHÒNG
  // =========================================================================
  { id: 301, number: 'P.101', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 1', price: 4200000, area: 30, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy', 'Khóa FaceID'] },
  { id: 302, number: 'P.102', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 1', price: 4500000, area: 32, occupants: 2, maxOccupants: 3, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy', 'Tủ lạnh'] },
  { id: 303, number: 'P.201', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 2', price: 4300000, area: 30, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy'] },
  { id: 304, number: 'P.202', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 2', price: 4300000, area: 30, occupants: 0, maxOccupants: 2, status: 'MAINTENANCE', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy'] },
  { id: 305, number: 'P.203', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 2', price: 4400000, area: 31, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy'] },
  { id: 306, number: 'P.301', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 3', price: 4600000, area: 32, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy', 'Ban công'] },
  { id: 307, number: 'P.302', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 3', price: 4800000, area: 34, occupants: 0, maxOccupants: 3, status: 'AVAILABLE', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy', 'Tủ lạnh', 'Máy giặt'] },
  { id: 308, number: 'P.303', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 3', price: 4600000, area: 32, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy'] },
  { id: 309, number: 'P.401', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 4', price: 4500000, area: 30, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy'] },
  { id: 310, number: 'P.402', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 4', price: 4500000, area: 30, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy'] },
  { id: 311, number: 'P.403', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 4', price: 4600000, area: 31, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy'] },
  { id: 312, number: 'P.501', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 5', price: 4700000, area: 33, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy'] },
  { id: 313, number: 'P.502', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 5', price: 4700000, area: 33, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy'] },
  { id: 314, number: 'P.503', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 5', price: 4800000, area: 34, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy'] },
  { id: 315, number: 'P.601', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 6', price: 5000000, area: 38, occupants: 2, maxOccupants: 3, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy', 'Sân thượng view đẹp'] },
  { id: 316, number: 'P.602', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 6', price: 5200000, area: 40, occupants: 2, maxOccupants: 3, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy', 'Penthouse mini'] },
];

export const HOUSES_LIST = [
  { code: 'ALL', name: 'Tất Cả Các Cơ Sở', totalRooms: 36 },
  { code: 'CS-01', name: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', totalRooms: 12 },
  { code: 'CS-02', name: 'Nhà Trọ Bách Khoa - Cơ Sở 2', totalRooms: 12 },
  { code: 'CS-03', name: 'Nhà Trọ Đống Đa - Cơ Sở 3', totalRooms: 16 },
];
