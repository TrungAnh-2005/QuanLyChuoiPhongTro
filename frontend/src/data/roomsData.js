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

export const ALL_ROOMS = [
  // =========================================================================
  // CƠ SỞ 1: NHÀ TRỌ CẦU GIẤY (CS-01) - 5 TẦNG, ĐÚNG 12 PHÒNG
  // =========================================================================
  { id: 101, number: 'P.101', houseCode: 'CS-01', house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', floor: 'Tầng 1', price: 3500000, area: 25, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
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
  { id: 112, number: 'P.501', houseCode: 'CS-01', house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', floor: 'Tầng 5', price: 4200000, area: 32, occupants: 2, maxOccupants: 3, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Sân phơi riêng'] },

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
  { code: 'CS-02', name: 'Nhà Trọ Bách Khoa - Cơ Sở 2', totalRooms: 8 },
  { code: 'CS-03', name: 'Nhà Trọ Đống Đa - Cơ Sở 3', totalRooms: 16 },
];
