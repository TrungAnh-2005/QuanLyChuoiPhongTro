/**
 * BẢN SAO LƯU DỮ LIỆU MOCK TEMPLATE BAN ĐẦU CỦA ĐỒ ÁN TRỌ VIỆT SAAS
 * Lưu giữ toàn bộ dữ liệu mẫu ban đầu để có thể khôi phục lại bất kỳ lúc nào chỉ bằng 1 nút bấm (Khôi Phục Gốc).
 */

export const BACKUP_ALL_ROOMS = [
  // CS-01: Nhà Trọ Cầu Giấy (12 phòng)
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
  { id: 112, number: 'P.403', houseCode: 'CS-01', house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1', floor: 'Tầng 4', price: 3800000, area: 28, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Ban công'] },

  // CS-02: Nhà Trọ Bách Khoa (8 phòng)
  { id: 201, number: 'P.101', houseCode: 'CS-02', house: 'Nhà Trọ Bách Khoa - Cơ Sở 2', floor: 'Tầng 1', price: 2800000, area: 20, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Nóng lạnh', 'Gần ĐH Bách Khoa'] },
  { id: 202, number: 'P.102', houseCode: 'CS-02', house: 'Nhà Trọ Bách Khoa - Cơ Sở 2', floor: 'Tầng 1', price: 3000000, area: 22, occupants: 0, maxOccupants: 2, status: 'AVAILABLE', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
  { id: 203, number: 'P.201', houseCode: 'CS-02', house: 'Nhà Trọ Bách Khoa - Cơ Sở 2', floor: 'Tầng 2', price: 3200000, area: 24, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
  { id: 204, number: 'P.202', houseCode: 'CS-02', house: 'Nhà Trọ Bách Khoa - Cơ Sở 2', floor: 'Tầng 2', price: 3200000, area: 24, occupants: 1, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
  { id: 205, number: 'P.301', houseCode: 'CS-02', house: 'Nhà Trọ Bách Khoa - Cơ Sở 2', floor: 'Tầng 3', price: 3400000, area: 26, occupants: 0, maxOccupants: 3, status: 'AVAILABLE', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Máy giặt chung'] },
  { id: 206, number: 'P.302', houseCode: 'CS-02', house: 'Nhà Trọ Bách Khoa - Cơ Sở 2', floor: 'Tầng 3', price: 3400000, area: 26, occupants: 0, maxOccupants: 3, status: 'AVAILABLE', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Máy giặt chung'] },
  { id: 207, number: 'P.401', houseCode: 'CS-02', house: 'Nhà Trọ Bách Khoa - Cơ Sở 2', floor: 'Tầng 4', price: 3600000, area: 28, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },
  { id: 208, number: 'P.402', houseCode: 'CS-02', house: 'Nhà Trọ Bách Khoa - Cơ Sở 2', floor: 'Tầng 4', price: 3600000, area: 28, occupants: 2, maxOccupants: 2, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh'] },

  // CS-03: Nhà Trọ Đống Đa (16 phòng)
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
  { id: 316, number: 'P.602', houseCode: 'CS-03', house: 'Nhà Trọ Đống Đa - Cơ Sở 3', floor: 'Tầng 6', price: 5200000, area: 40, occupants: 2, maxOccupants: 3, status: 'OCCUPIED', amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh', 'Thang máy', 'Penthouse mini'] }
];

export const BACKUP_BOARDING_HOUSES = [
  {
    id: 1,
    code: 'CS-01',
    name: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    address: 'Số 45, Ngõ 165 Cầu Giấy, Phường Dịch Vọng, Cầu Giấy, Hà Nội',
    manager: 'Lê Thị Thu Ngân (Staff CS1)',
    managerUsername: 'staff',
    createdBy: 'staff',
    managerPhone: '0912.888.666',
    floors: 4,
    totalRooms: 12,
    occupiedRooms: 9,
    availableRooms: 2,
    maintenanceRooms: 1,
    monthlyRevenue: 34500000,
    features: ['Thang máy', 'Khóa cổng vân tay', 'Camera an ninh 24/7', 'Nhà để xe có bảo vệ', 'Sân phơi rộng']
  },
  {
    id: 2,
    code: 'CS-02',
    name: 'Nhà Trọ Bách Khoa - Cơ Sở 2',
    address: 'Số 18, Ngõ Tự Do, Phường Đồng Tâm, Hai Bà Trưng, Hà Nội',
    manager: 'Đàm Văn Táo (Staff CS2)',
    managerUsername: 'staff2',
    createdBy: 'staff2',
    managerPhone: '0988.777.999',
    floors: 4,
    totalRooms: 8,
    occupiedRooms: 5,
    availableRooms: 3,
    maintenanceRooms: 0,
    monthlyRevenue: 22800000,
    features: ['Khóa cổng vân tay', 'Camera an ninh 24/7', 'Nhà để xe', 'Máy giặt chung', 'Gần các trường ĐH']
  }
];

export const BACKUP_INVOICES = [
  { id: 1, code: 'HD-202609-01', room: 'P.101', house: 'Cơ Sở 1 - Cầu Giấy', tenant: 'Nguyễn Văn An', roomFee: 2000, elec: 0, water: 0, service: 0, total: 2000, status: 'UNPAID', paidAt: null },
  { id: 2, code: 'HD-202609-02', room: 'P.102', house: 'Cơ Sở 1 - Cầu Giấy', tenant: 'Trần Thị Bình', roomFee: 3800000, elec: 266000, water: 175000, service: 100000, total: 4341000, status: 'UNPAID', paidAt: null },
  { id: 3, code: 'HD-202609-03', room: 'P.101', house: 'Cơ Sở 1 - Cầu Giấy', tenant: 'Phạm Minh Cường', roomFee: 3200000, elec: 294000, water: 200000, service: 100000, total: 3794000, status: 'PAID', paidAt: '07/09/2026' },
  { id: 4, code: 'HD-202609-04', room: 'P.201', house: 'Cơ Sở 1 - Cầu Giấy', tenant: 'Vũ Hoàng Dũng', roomFee: 3600000, elec: 0, water: 0, service: 100000, total: 3700000, status: 'PENDING_METER', paidAt: null },
  { id: 6, code: 'HD-202609-06', room: 'P.101', house: 'Cơ Sở 3 - Đống Đa', tenant: 'Trịnh Thanh Tùng', roomFee: 4200000, elec: 350000, water: 200000, service: 120000, total: 4870000, status: 'UNPAID', paidAt: null }
];

export const BACKUP_TICKETS = [
  { id: 1, room: 'P.102', houseCode: 'CS-01', category: 'WATER', issue: 'Hỏng vòi sen nhà tắm bị rò rỉ nước', tenant: 'Trần Thị Bình', date: '20/09/2026', priority: 'HIGH', status: 'IN_PROGRESS' },
  { id: 2, room: 'P.202', houseCode: 'CS-02', category: 'ELECTRICITY', issue: 'Điều hòa không lạnh, có tiếng kêu to', tenant: 'Vũ Hoàng Dũng', date: '21/09/2026', priority: 'HIGH', status: 'PENDING' },
  { id: 3, room: 'P.301', houseCode: 'CS-01', category: 'ELECTRICITY', issue: 'Bóng đèn tuýp ban công bị cháy', tenant: 'Đỗ Thị Mai', date: '18/09/2026', priority: 'LOW', status: 'RESOLVED' },
  { id: 4, room: 'P.101', houseCode: 'CS-01', category: 'FURNITURE', issue: 'Cửa sổ ban công bị kẹt khóa', tenant: 'Nguyễn Văn An', date: '15/09/2026', priority: 'MEDIUM', status: 'RESOLVED' },
  { id: 5, room: 'P.101', houseCode: 'CS-01', category: 'WATER', issue: 'Áp lực nước vòi sen yếu vào giờ cao điểm', tenant: 'Phạm Minh Cường', date: '22/09/2026', priority: 'LOW', status: 'IN_PROGRESS' }
];

export const BACKUP_TENANTS = [
  {
    id: 1,
    fullName: 'Nguyễn Văn An',
    cccd: '001201012345',
    phone: '0987.654.321',
    email: 'an.nguyen@rental.vn',
    hometown: 'Nam Định',
    room: 'P.101',
    rooms: ['P.101'],
    houseCode: 'CS-01',
    house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    contractStart: '01/01/2026',
    contractEnd: '31/12/2026',
    deposit: 3500000,
    status: 'ACTIVE',
    daysSinceLeave: 0
  },
  {
    id: 2,
    fullName: 'Trần Thị Bình',
    cccd: '001202023456',
    phone: '0978.123.456',
    email: 'binh.tt@gmail.com',
    hometown: 'Hà Nam',
    room: 'P.102',
    rooms: ['P.102'],
    houseCode: 'CS-01',
    house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    contractStart: '15/02/2026',
    contractEnd: '15/02/2027',
    deposit: 3800000,
    status: 'ACTIVE',
    daysSinceLeave: 0
  },
  {
    id: 3,
    fullName: 'Lê Văn Cường',
    cccd: '034203039999',
    phone: '0912.777.666',
    email: 'cuong.le@gmail.com',
    hometown: 'Hải Phòng',
    room: 'P.103',
    rooms: ['P.103'],
    houseCode: 'CS-01',
    house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    contractStart: '10/03/2026',
    contractEnd: '10/03/2027',
    deposit: 3200000,
    status: 'ACTIVE',
    daysSinceLeave: 0
  },
  {
    id: 11,
    fullName: 'Phạm Minh Cường',
    cccd: '034203034567',
    phone: '0912.888.999',
    email: 'cuong.pham@rental.vn',
    hometown: 'Hải Phòng',
    room: 'P.101',
    rooms: ['P.101'],
    houseCode: 'CS-01',
    house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    contractStart: '01/01/2026',
    contractEnd: '31/12/2026',
    deposit: 3500000,
    status: 'ACTIVE',
    daysSinceLeave: 0
  },
  {
    id: 4,
    fullName: 'Vũ Hoàng Dũng',
    cccd: '025204045678',
    phone: '0945.678.901',
    email: 'dung.vh@gmail.com',
    hometown: 'Thái Bình',
    room: 'P.201',
    rooms: ['P.201'],
    houseCode: 'CS-01',
    house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    contractStart: '01/04/2026',
    contractEnd: '01/04/2027',
    deposit: 3500000,
    status: 'ACTIVE',
    daysSinceLeave: 0
  },
  {
    id: 5,
    fullName: 'Lê Văn Khang',
    cccd: '038206067890',
    phone: '0967.890.123',
    email: 'khang.lv@gmail.com',
    hometown: 'Nghệ An',
    room: null,
    rooms: [],
    contractStart: '01/01/2025',
    contractEnd: '01/08/2026',
    deposit: 0,
    status: 'INACTIVE',
    daysSinceLeave: 45
  },
  {
    id: 6,
    fullName: 'Đỗ Thị Mai',
    cccd: '019205056789',
    phone: '0934.567.890',
    email: 'mai.dt@gmail.com',
    hometown: 'Bắc Ninh',
    room: null,
    rooms: [],
    contractStart: '10/05/2025',
    contractEnd: '10/09/2026',
    deposit: 0,
    status: 'INACTIVE',
    daysSinceLeave: 14
  },
  {
    id: 7,
    fullName: 'Hoàng Văn Nam',
    cccd: '036207078901',
    phone: '0966.123.456',
    email: 'nam.hv@gmail.com',
    hometown: 'Thanh Hóa',
    room: null,
    rooms: [],
    houseCode: null,
    house: null,
    contractStart: '01/09/2026',
    contractEnd: '01/09/2027',
    deposit: 0,
    status: 'INACTIVE',
    daysSinceLeave: 0
  }
];

export const BACKUP_ROOM_REQUESTS = [
  {
    id: 2,
    type: 'TRANSFER',
    targetRoom: 'P.203',
    house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    houseCode: 'CS-01',
    currentRoom: 'P.101',
    tenant: 'Nguyễn Văn An',
    phone: '0987.654.321',
    email: 'an.nguyen@rental.vn',
    note: 'Em muốn đổi từ P.101 lên P.203 từ tháng sau vì tầng 2 có ban công thoáng mát hơn.',
    date: '24/09/2026',
    status: 'PENDING',
    roommateVotes: []
  },
  {
    id: 3,
    type: 'TRANSFER',
    targetRoom: 'P.102',
    house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    houseCode: 'CS-01',
    currentRoom: 'P.201',
    tenant: 'Vũ Hoàng Dũng',
    phone: '0945.678.901',
    email: 'dung.vh@gmail.com',
    note: 'Em muốn xin chuyển từ phòng P.201 sang phòng P.102 ở tầng 1 để tiện đi lại.',
    date: '23/09/2026',
    status: 'PENDING',
    roommateVotes: []
  },
  {
    id: 5,
    type: 'RENEW_CONTRACT',
    tenant: 'Nguyễn Văn An',
    targetRoom: 'P.101',
    currentRoom: 'P.101',
    house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    houseCode: 'CS-01',
    phone: '0987.654.321',
    email: 'an.nguyen@rental.vn',
    durationMonths: 6,
    startDate: '01/01/2027',
    newContractEnd: '01/07/2027',
    currentContractEnd: '31/12/2026',
    note: 'Em muốn đăng ký gia hạn tiếp hợp đồng 6 tháng (từ 01/01/2027 đến 01/07/2027) để tiếp tục ở.',
    date: '25/09/2026',
    status: 'PENDING',
    roommateVotes: []
  }
];

export const BACKUP_ROOM_MEMBERS = [
  {
    id: 1,
    roomId: 101,
    roomNumber: 'P.101',
    houseCode: 'CS-01',
    tenantId: 1,
    fullName: 'Nguyễn Văn An',
    phone: '0987.654.321',
    cccd: '001201012345',
    maskedCccd: '00120101****',
    hometown: 'Nam Định',
    roleInRoom: 'REPRESENTATIVE',
    joinDate: '01/01/2026',
    temporaryResidenceStatus: 'REGISTERED',
    status: 'ACTIVE'
  },
  {
    id: 2,
    roomId: 101,
    roomNumber: 'P.101',
    houseCode: 'CS-01',
    tenantId: 2,
    fullName: 'Phạm Minh Cường',
    phone: '0912.888.999',
    cccd: '034203034567',
    maskedCccd: '03420303****',
    hometown: 'Hải Phòng',
    roleInRoom: 'MEMBER',
    joinDate: '01/01/2026',
    temporaryResidenceStatus: 'REGISTERED',
    status: 'ACTIVE'
  },
  {
    id: 3,
    roomId: 102,
    roomNumber: 'P.102',
    houseCode: 'CS-01',
    tenantId: 3,
    fullName: 'Trần Thị Bình',
    phone: '0978.123.456',
    cccd: '001202023456',
    maskedCccd: '00120202****',
    hometown: 'Bắc Ninh',
    roleInRoom: 'REPRESENTATIVE',
    joinDate: '15/02/2026',
    temporaryResidenceStatus: 'REGISTERED',
    status: 'ACTIVE'
  },
  {
    id: 4,
    roomId: 103,
    roomNumber: 'P.103',
    houseCode: 'CS-01',
    tenantId: 4,
    fullName: 'Lê Văn Cường',
    phone: '0912.777.666',
    cccd: '034203039999',
    maskedCccd: '03420303****',
    hometown: 'Hải Phòng',
    roleInRoom: 'REPRESENTATIVE',
    joinDate: '10/03/2026',
    temporaryResidenceStatus: 'REGISTERED',
    status: 'ACTIVE'
  },
  {
    id: 5,
    roomId: 201,
    roomNumber: 'P.201',
    houseCode: 'CS-01',
    tenantId: 5,
    fullName: 'Vũ Hoàng Dũng',
    phone: '0945.678.901',
    cccd: '025204045678',
    maskedCccd: '02520404****',
    roleInRoom: 'REPRESENTATIVE',
    joinDate: '01/04/2026',
    temporaryResidenceStatus: 'REGISTERED',
    status: 'ACTIVE'
  }
];

export const BACKUP_CONTRACTS = [
  {
    id: 1,
    contractCode: 'HD-2026-001',
    roomNumber: 'P.101',
    houseCode: 'CS-01',
    houseName: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    tenantName: 'Nguyễn Văn An',
    tenantPhone: '0987.654.321',
    startDate: '01/01/2026',
    endDate: '31/12/2026',
    rentalPrice: 3500000,
    depositAmount: 3500000,
    paymentCycle: 1,
    paymentDay: 5,
    terms: 'Bên thuê có trách nhiệm thanh toán tiền nhà đúng hạn từ ngày 01 đến ngày 05 hàng tháng. Giữ gìn an ninh trật tự, không nuôi thú cưng gây ồn, tiết kiệm điện nước và tuân thủ tuyệt đối quy định PCCC.',
    status: 'ACTIVE',
    depositPaid: true,
    depositPaidAt: '01/01/2026 09:30',
    depositPaymentMethod: 'VIETQR',
    signedElectronically: true,
    signedAt: '01/01/2026 09:30'
  },
  {
    id: 2,
    contractCode: 'HD-2026-003',
    roomNumber: 'P.103',
    houseCode: 'CS-01',
    houseName: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    tenantName: 'Lê Văn Cường',
    tenantPhone: '0912.777.666',
    startDate: '10/03/2026',
    endDate: '10/03/2027',
    rentalPrice: 3200000,
    depositAmount: 3200000,
    paymentCycle: 1,
    paymentDay: 5,
    terms: 'Hợp đồng thuê phòng 12 tháng. Tiền cọc tương đương 1 tháng tiền phòng. Hoàn cọc khi bàn giao phòng nguyên vẹn không hỏng hóc.',
    status: 'ACTIVE',
    depositPaid: true,
    depositPaidAt: '10/03/2026 14:00',
    depositPaymentMethod: 'VIETQR',
    signedElectronically: true,
    signedAt: '10/03/2026 14:00'
  }
];

export const BACKUP_METER_DISPUTES = [
  {
    id: 1,
    room: 'P.102',
    houseCode: 'CS-01',
    tenantName: 'Trần Thị Bình',
    month: '2026-09',
    meterType: 'WATER',
    systemReading: 48,
    reportedReading: 43,
    note: 'Em kiểm tra đồng hồ nước thực tế ở cửa phòng chỉ mới nhảy 43 m3, trên app báo 48 m3. Nhờ chủ trọ kiểm tra lại giúp em ạ.',
    imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop',
    status: 'PENDING',
    date: '26/09/2026'
  }
];

export const BACKUP_ROOMMATE_REQUESTS_V2 = [
  {
    id: 1,
    roomId: 101,
    roomNumber: 'P.101',
    houseCode: 'CS-01',
    requestedByTenantId: 1,
    requestedByTenantName: 'Nguyễn Văn An',
    fullName: 'Đặng Tuấn Anh',
    identityCard: '001202008899',
    maskedIdentityCard: '00120200****',
    phone: '0977.888.999',
    birthDate: '2002-05-15',
    gender: 'MALE',
    hometown: 'Thái Bình',
    cccdFrontUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop',
    cccdBackUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop',
    status: 'PENDING',
    rejectionReason: null,
    createdAt: '2026-10-02T10:30:00Z',
    reviewedAt: null
  }
];

export const BACKUP_MOVE_OUT_SETTLEMENTS = [
  {
    id: 1,
    contractId: 'HD-2026-003',
    roomNumber: 'P.103',
    houseCode: 'CS-01',
    tenantName: 'Phạm Minh Cường',
    tenantPhone: '0912.888.999',
    bankAccount: '1903456789012',
    bankName: 'Techcombank',
    accountHolder: 'PHAM MINH CUONG',
    moveOutDate: '2026-10-05',
    reason: 'Hết hạn hợp đồng, chuyển công tác vào TP. Hồ Chí Minh',
    originalDeposit: 3200000,
    unpaidUtilitiesFee: 245000,
    damageFee: 0,
    damageDescription: 'Không hư hại thiết bị, bàn giao đầy đủ 2 chìa khóa và thẻ thang máy',
    refundAmount: 2955000,
    refundStatus: 'PENDING',
    settledAt: '2026-10-03 16:30',
    createdAt: '2026-10-01'
  }
];

export const BACKUP_LANDLORDS = [
  {
    id: 1,
    username: 'staff',
    fullName: 'Lê Thị Thu Ngân',
    email: 'staff@rental.vn',
    phone: '0912.888.666',
    role: 'STAFF',
    status: 'ACTIVE',
    subscriptionPackage: 'Gói Chuyên Nghiệp (Không giới hạn)',
    packageCode: 'PRO',
    housesCount: 1,
    roomsCount: 10,
    maxHousesLimit: 999,
    createdAt: '01/01/2026'
  },
  {
    id: 2,
    username: 'staff2',
    fullName: 'Đàm Văn Táo',
    email: 'staff2@rental.vn',
    phone: '0988.777.999',
    role: 'STAFF',
    status: 'ACTIVE',
    subscriptionPackage: 'Gói Cơ Bản (Tối đa 2 cơ sở)',
    packageCode: 'BASIC',
    housesCount: 1,
    roomsCount: 8,
    maxHousesLimit: 2,
    createdAt: '15/02/2026'
  }
];

export const BACKUP_SAAS_INVOICES = [
  {
    id: 'SAAS-2026-001',
    code: 'HD-SAAS-2026-01',
    landlordId: 1,
    landlordUsername: 'staff',
    landlordName: 'Lê Thị Thu Ngân',
    landlordPhone: '0912.888.666',
    packageName: 'Gói Chuyên Nghiệp (PRO - Không Giới Hạn Cơ Sở)',
    packageCode: 'PRO',
    billingCycle: '12 Tháng (Năm 2026)',
    period: '01/01/2026 - 31/12/2026',
    amount: 4990000,
    issuedDate: '01/01/2026',
    dueDate: '10/01/2026',
    paidAt: '02/01/2026 10:15:20',
    paymentMethod: 'VietQR Chuyển Khoản Nền Tảng (Tự Động Gạch Nợ)',
    status: 'PAID',
    landlordTaxCode: '8392019283',
    providerName: 'HỆ THỐNG NỀN TẢNG SAAS QUẢN LÝ CHUỖI TRỌ (CTCP SAAS TRỌ VIỆT)',
    providerTaxCode: '0108998877',
    providerBank: '9999888899 - MBBank (Ngân hàng Quân Đội)'
  },
  {
    id: 'SAAS-2026-002',
    code: 'HD-SAAS-2026-02',
    landlordId: 2,
    landlordUsername: 'staff2',
    landlordName: 'Đàm Văn Táo',
    landlordPhone: '0988.777.999',
    packageName: 'Gói Cơ Bản (BASIC - Quản lý 10 phòng)',
    packageCode: 'BASIC',
    billingCycle: '12 Tháng (Năm 2026)',
    period: '15/02/2026 - 15/02/2027',
    amount: 1910400,
    total: 1910400,
    issuedDate: '15/02/2026',
    dueDate: '25/02/2026',
    paidAt: null,
    paymentMethod: 'Cổng VietQR Nền Tảng',
    status: 'UNPAID',
    landlordTaxCode: '8392019284',
    providerName: 'HỆ THỐNG NỀN TẢNG SAAS QUẢN LÝ CHUỖI TRỌ (CTCP SAAS TRỌ VIỆT)',
    providerTaxCode: '0108998877',
    providerBank: '9999888899 - MBBank (Ngân hàng Quân Đội)'
  }
];

export const BACKUP_HOUSE_SERVICE_CONFIGS = [
  { id: 1, boardingHouseId: 1, houseCode: 'CS-01', serviceName: 'Tiền điện', calculationType: 'METER', unitPrice: 3500 },
  { id: 2, boardingHouseId: 1, houseCode: 'CS-01', serviceName: 'Tiền nước', calculationType: 'METER', unitPrice: 25000 },
  { id: 3, boardingHouseId: 1, houseCode: 'CS-01', serviceName: 'Phí vệ sinh & rác', calculationType: 'PER_ROOM', unitPrice: 50000 },
  { id: 4, boardingHouseId: 1, houseCode: 'CS-01', serviceName: 'Internet Cáp quang', calculationType: 'PER_ROOM', unitPrice: 100000 },
  { id: 5, boardingHouseId: 1, houseCode: 'CS-01', serviceName: 'Phí gửi xe máy', calculationType: 'PER_CAPITA', unitPrice: 80000 },
  { id: 6, boardingHouseId: 2, houseCode: 'CS-02', serviceName: 'Tiền điện', calculationType: 'METER', unitPrice: 3800 },
  { id: 7, boardingHouseId: 2, houseCode: 'CS-02', serviceName: 'Tiền nước', calculationType: 'PER_CAPITA', unitPrice: 100000 },
  { id: 8, boardingHouseId: 2, houseCode: 'CS-02', serviceName: 'Phí vệ sinh & rác', calculationType: 'PER_ROOM', unitPrice: 40000 },
  { id: 9, boardingHouseId: 2, houseCode: 'CS-02', serviceName: 'Internet Cáp quang', calculationType: 'PER_ROOM', unitPrice: 80000 },
  { id: 10, boardingHouseId: 3, houseCode: 'CS-03', serviceName: 'Tiền điện', calculationType: 'METER', unitPrice: 4000 },
  { id: 11, boardingHouseId: 3, houseCode: 'CS-03', serviceName: 'Tiền nước', calculationType: 'METER', unitPrice: 30000 },
  { id: 12, boardingHouseId: 3, houseCode: 'CS-03', serviceName: 'Phí dịch vụ thang máy & rác', calculationType: 'PER_ROOM', unitPrice: 150000 }
];

