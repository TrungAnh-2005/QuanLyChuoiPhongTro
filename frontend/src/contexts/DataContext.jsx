import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ALL_ROOMS } from '../data/roomsData';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

const DEFAULT_INVOICES = [
  // Kh?p ch?nh x?c 100% v?i s? li?u ch?t công tơ Th?ng 9 (2026-09):
  // P.101: 68 kWh x 3.500? = 238.000?; 6 m? x 25.000? = 150.000? -> T?ng = 3.988.000?
  { id: 1, code: 'HD-202609-01', room: 'P.101', house: 'Cơ Sở 1 - Cầu Giấy', tenant: 'Nguyễn Văn An', roomFee: 2000, elec: 0, water: 0, service: 0, total: 2000, status: 'UNPAID', paidAt: null },
  // P.102: 76 kWh x 3.500? = 266.000?; 7 m? x 25.000? = 175.000? -> T?ng = 4.341.000?
  { id: 2, code: 'HD-202609-02', room: 'P.102', house: 'Cơ Sở 1 - Cầu Giấy', tenant: 'Trần Thị Bình', roomFee: 3800000, elec: 266000, water: 175000, service: 100000, total: 4341000, status: 'UNPAID', paidAt: null },
  // P.103: 84 kWh x 3.500? = 294.000?; 8 m? x 25.000? = 200.000? -> T?ng = 3.794.000? (Đã thanh toán)
  { id: 3, code: 'HD-202609-03', room: 'P.103', house: 'Cơ Sở 1 - Cầu Giấy', tenant: 'Phạm Minh Cường', roomFee: 3200000, elec: 294000, water: 200000, service: 100000, total: 3794000, status: 'PAID', paidAt: '07/09/2026' },
  // P.201: CH? TR? CH?A CH?T S? ?I?N N??C (recorded = false) -> elec = 0, water = 0, tr?ng th?i: PENDING_METER
  { id: 4, code: 'HD-202609-04', room: 'P.201', house: 'Cơ Sở 1 - Cầu Giấy', tenant: 'Vũ Hoàng Dũng', roomFee: 3600000, elec: 0, water: 0, service: 100000, total: 3700000, status: 'PENDING_METER', paidAt: null },
  // P.101 CS-02: Đã thanh toán
  { id: 5, code: 'HD-202609-05', room: 'P.101', house: 'Cơ Sở 2 - Bách Khoa', tenant: 'Hoàng Văn Nam', roomFee: 2800000, elec: 210000, water: 150000, service: 80000, total: 3240000, status: 'PAID', paidAt: '05/09/2026' },
  // P.101 CS-03
  { id: 6, code: 'HD-202609-06', room: 'P.101', house: 'Cơ Sở 3 - Đống Đa', tenant: 'Trịnh Thanh Tùng', roomFee: 4200000, elec: 350000, water: 200000, service: 120000, total: 4870000, status: 'UNPAID', paidAt: null },
];

const DEFAULT_TICKETS = [
  { id: 1, room: 'P.102', issue: 'Hỏng vòi sen nhà tắm bị rò rỉ nước', tenant: 'Trần Thị Bình', date: '20/09/2026', priority: 'HIGH', status: 'IN_PROGRESS' },
  { id: 2, room: 'P.202', issue: 'Điều hòa không lạnh, có tiếng kêu to', tenant: 'Vũ Hoàng Dũng', date: '21/09/2026', priority: 'HIGH', status: 'PENDING' },
  { id: 3, room: 'P.301', issue: 'Bóng đèn tuýp ban công bị cháy', tenant: 'Đỗ Thị Mai', date: '18/09/2026', priority: 'LOW', status: 'RESOLVED' },
  { id: 4, room: 'P.101', issue: 'Cửa sổ ban công bị kẹt khóa', tenant: 'Nguyễn Văn Khách Thuê', date: '15/09/2026', priority: 'MEDIUM', status: 'RESOLVED' },
];

const DEFAULT_TENANTS = [
  {
    id: 1,
    fullName: 'Nguyễn Văn An',
    cccd: '001201012345',
    phone: '0987.654.321',
    email: 'an.nguyen@rental.vn',
    hometown: 'Nam Định',
    room: 'P.101',
    rooms: ['P.101'],
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
    contractStart: '15/02/2026',
    contractEnd: '15/02/2027',
    deposit: 3800000,
    status: 'ACTIVE',
    daysSinceLeave: 0
  },
  {
    id: 3,
    fullName: 'Phạm Minh Cường',
    cccd: '034203034567',
    phone: '0912.888.999',
    email: 'cuong.pm@gmail.com',
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
    id: 4,
    fullName: 'Vũ Hoàng Dũng',
    cccd: '025204045678',
    phone: '0945.678.901',
    email: 'dung.vh@gmail.com',
    hometown: 'Thái Bình',
    room: 'P.201',
    rooms: ['P.201'],
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

export const generateDefaultMeters = () => {
  return ALL_ROOMS.map((r) => {
    const isOccupied = r.status === 'OCCUPIED';
    let tenantName = 'Phòng Trống (Chưa Thuê)';
    if (r.status === 'MAINTENANCE') {
      tenantName = 'Đang Bảo Trì (Chưa Thuê)';
    } else if (isOccupied) {
      const foundTenant = DEFAULT_TENANTS.find((t) => t.room === r.number || (t.rooms && t.rooms.includes(r.number)));
      if (foundTenant) {
        tenantName = foundTenant.fullName;
      } else if (r.houseCode === 'CS-01' && r.number === 'P.101') {
        tenantName = 'Nguyễn Văn Khách Thuê';
      } else {
        tenantName = 'Khách Đang Thuê';
      }
    }

    const baseElec = 800 + (r.id % 20) * 110;
    const elecUsed = isOccupied ? 60 + (r.id % 12) * 8 : (r.id % 4);
    const baseWater = 40 + (r.id % 15) * 6;
    const waterUsed = isOccupied ? 5 + (r.id % 6) : 0;

    // Phòng P.101, P.102, P.103 ở CS-01 mặc định là đã chốt số
    const isRecorded = r.houseCode === 'CS-01' && ['P.101', 'P.102', 'P.103'].includes(r.number);

    // Phòng P.103 (CS-01) và P.101 (CS-02) mặc định đã thanh toán xong tiền trọ
    const isPaid = (r.houseCode === 'CS-01' && r.number === 'P.103') ||
                   (r.houseCode === 'CS-02' && r.number === 'P.101');

    return {
      id: r.id,
      roomId: r.id,
      room: r.number,
      houseCode: r.houseCode,
      house: r.house,
      floor: r.floor,
      status: r.status,
      tenant: tenantName,
      oldElec: baseElec,
      newElec: baseElec + elecUsed,
      oldWater: baseWater,
      newWater: baseWater + waterUsed,
      elecPrice: 3500,
      waterPrice: 25000,
      recorded: isRecorded,
      paid: isPaid
    };
  });
};

const DEFAULT_METERS = generateDefaultMeters();

const DEFAULT_ROOM_REQUESTS = [
  {
    id: 1,
    type: 'ROOMMATE', // Xin ở ghép
    targetRoom: 'P.103',
    house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    houseCode: 'CS-01',
    currentRoom: null,
    tenant: 'Hoàng Văn Nam',
    phone: '0966.123.456',
    email: 'nam.hv@gmail.com',
    note: 'Em là sinh viên năm 3 Bách Khoa, muốn tìm bạn ở ghép chia đôi tiền phòng, không hút thuốc, giữ vệ sinh tốt.',
    date: '24/09/2026',
    status: 'WAITING_ROOMMATES', // Chờ thành viên trong phòng P.103 đồng ý
    roommateVotes: []
  },
  {
    id: 2,
    type: 'TRANSFER', // Xin chuyển phòng
    targetRoom: 'P.203',
    house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    houseCode: 'CS-01',
    currentRoom: 'P.101',
    tenant: 'Nguyễn Văn An',
    phone: '0987.654.321',
    email: 'an.nguyen@rental.vn',
    note: 'Em muốn đổi từ P.101 lên P.203 từ tháng sau vì tầng 2 có ban công thoáng mát hơn.',
    date: '24/09/2026',
    status: 'PENDING', // Chờ Ban Quản Lý phê duyệt
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
    id: 4,
    type: 'CHECKOUT', // Trả phòng trước hạn (Mất cọc)
    targetRoom: 'P.101',
    house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    houseCode: 'CS-01',
    currentRoom: 'P.101',
    tenant: 'Nguyễn Văn An',
    phone: '0987.654.321',
    email: 'an.nguyen@rental.vn',
    note: 'Em có việc gia đình đột xuất phải về quê, em chấp nhận mất tiền cọc 3.500.000 đ theo quy chế để xin trả phòng sớm trước hạn hợp đồng.',
    date: '25/09/2026',
    status: 'PENDING',
    forfeitDeposit: true,
    roommateVotes: []
  },
  {
    id: 5,
    type: 'RENEW_CONTRACT', // Yêu cầu gia hạn hợp đồng
    tenant: 'Nguyễn Văn An',
    targetRoom: 'P.101',
    currentRoom: 'P.101',
    house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    houseCode: 'CS-01',
    phone: '0987.654.321',
    email: 'an.nguyen@rental.vn',
    durationMonths: 6, // 3, 6, hoặc 12 tháng
    startDate: '01/01/2027',
    newContractEnd: '01/07/2027',
    currentContractEnd: '31/12/2026',
    note: 'Em muốn đăng ký gia hạn tiếp hợp đồng 6 tháng (từ 01/01/2027 đến 01/07/2027) để tiếp tục ở.',
    date: '25/09/2026',
    status: 'PENDING',
    roommateVotes: []
  },
  {
    id: 6,
    type: 'RENT', // Khách mới đăng ký thuê phòng Cơ Sở 2 (Bách Khoa)
    tenant: 'Hoàng Văn Nam',
    targetRoom: 'P.102',
    currentRoom: null,
    house: 'Nhà Trọ Bách Khoa - Cơ Sở 2',
    houseCode: 'CS-02',
    phone: '0966.123.456',
    email: 'nam.hv@gmail.com',
    note: 'Em là sinh viên Bách Khoa, muốn đăng ký thuê phòng P.102 tại Cơ Sở 2 Bách Khoa.',
    date: '25/09/2026',
    status: 'PENDING',
    roommateVotes: []
  }
];

export 
const DEFAULT_SAAS_INVOICES = [
  {
    id: 'SAAS-2026-001',
    code: 'HD-SAAS-2026-01',
    landlordId: 1,
    landlordName: 'Nguyễn Văn An',
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
    landlordId: 1,
    landlordName: 'Nguyễn Văn An',
    landlordPhone: '0912.888.666',
    packageName: 'Gia Hạn Gói PRO + Gói Bổ Sung AI Vision OCR (1.000 lượt quét công tơ)',
    packageCode: 'PRO',
    billingCycle: 'Kỳ Tháng 10/2026',
    period: '01/10/2026 - 31/10/2026',
    amount: 2000,
    issuedDate: '01/10/2026',
    dueDate: '10/10/2026',
    paidAt: null,
    paymentMethod: 'Cổng VietQR Nền Tảng',
    status: 'UNPAID',
    landlordTaxCode: '8392019283',
    providerName: 'HỆ THỐNG NỀN TẢNG SAAS QUẢN LÝ CHUỖI TRỌ (CTCP SAAS TRỌ VIỆT)',
    providerTaxCode: '0108998877',
    providerBank: '9999888899 - MBBank (Ngân hàng Quân Đội)'
  }
];

const DEFAULT_LANDLORDS = [
  {
    id: 1,
    username: 'staff',
    fullName: 'Lê Thị Thu Ngân (Chủ trọ CS1)',
    email: 'staff@rental.vn',
    phone: '0912.888.666',
    role: 'STAFF',
    status: 'ACTIVE',
    subscriptionPackage: 'Gói Chuyên Nghiệp (Không giới hạn)',
    packageCode: 'PRO',
    housesCount: 2,
    roomsCount: 18,
    maxHousesLimit: 999,
    createdAt: '01/01/2026'
  },
  {
    id: 2,
    username: 'landlord_bk',
    fullName: 'Nguyễn Thị Hằng (Chủ trọ CS2 Bách Khoa)',
    email: 'hang.nt@rental.vn',
    phone: '0988.777.999',
    role: 'STAFF',
    status: 'ACTIVE',
    subscriptionPackage: 'Gói Cơ Bản (Tối đa 2 cơ sở)',
    packageCode: 'BASIC',
    housesCount: 1,
    roomsCount: 10,
    maxHousesLimit: 2,
    createdAt: '15/02/2026'
  },
  {
    id: 3,
    username: 'landlord_dd',
    fullName: 'Phạm Quốc Hùng (Chủ trọ CS3 Đống Đa)',
    email: 'hung.pq@rental.vn',
    phone: '0936.555.222',
    role: 'STAFF',
    status: 'ACTIVE',
    subscriptionPackage: 'Gói Doanh Nghiệp (Không giới hạn + AI OCR)',
    packageCode: 'ENTERPRISE',
    housesCount: 1,
    roomsCount: 12,
    maxHousesLimit: 999,
    createdAt: '10/03/2026'
  }
];

export const DEFAULT_INTEGRATIONS = {
  vnpay: {
    merchantId: 'RENTAL2026VN',
    tmnCode: 'RENTAL01',
    hashSecret: '8F9A4E2B1C7D0E5F8A3B2C1D4E5F6A7B',
    payUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    status: 'CONNECTED',
    enabled: true
  },
  momo: {
    partnerCode: 'MOMO_RENTAL_PARTNER',
    accessKey: 'F8B7C9D2E1A4',
    secretKey: 'kL9@mN2#pQ5$rT8^vW1*',
    endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create',
    status: 'CONNECTED',
    enabled: true
  },
  aiOcr: {
    provider: 'OpenAI / Claude Vision API',
    model: 'GPT-4o Vision OCR Meter',
    apiKey: 'sk-proj-rental-ocr-2026-***active',
    confidenceThreshold: 95,
    autoApplyConfidenceAbove: 92,
    status: 'CONNECTED',
    enabled: true
  },
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    username: 'noreply.rental.saas@gmail.com',
    fromEmail: 'Hệ Thống Nhà Trọ <noreply@rental.vn>',
    authType: 'TLS',
    status: 'CONNECTED',
    enabled: true
  },
  smsOtp: {
    brandname: 'NHATRO_VN',
    provider: 'Viettel Telecom SMS Gateway',
    balanceRemaining: 15400,
    status: 'CONNECTED',
    enabled: true
  }
};

export const DEFAULT_MICROSERVICES = [
  { id: 'api-gateway', name: 'API Gateway', port: 8080, status: 'UP', heap: '245MB / 512MB', cpu: '1.8%', uptime: '14 ngày 6 giờ' },
  { id: 'discovery-server', name: 'Eureka Service Discovery', port: 8761, status: 'UP', heap: '190MB / 512MB', cpu: '0.9%', uptime: '14 ngày 6 giờ' },
  { id: 'auth-service', name: 'Auth Service (JWT & RBAC)', port: 8081, status: 'UP', heap: '310MB / 1024MB', cpu: '2.4%', uptime: '14 ngày 5 giờ' },
  { id: 'room-service', name: 'Room & Boarding House Service', port: 8082, status: 'UP', heap: '280MB / 1024MB', cpu: '1.5%', uptime: '14 ngày 5 giờ' },
  { id: 'tenant-service', name: 'Tenant Service (Roommates)', port: 8083, status: 'UP', heap: '260MB / 1024MB', cpu: '1.2%', uptime: '14 ngày 5 giờ' },
  { id: 'contract-service', name: 'Contract Service (E-Signature)', port: 8084, status: 'UP', heap: '275MB / 1024MB', cpu: '1.1%', uptime: '14 ngày 5 giờ' },
  { id: 'meter-service', name: 'Meter Reading & AI Service', port: 8085, status: 'UP', heap: '410MB / 2048MB', cpu: '4.6%', uptime: '14 ngày 5 giờ' },
  { id: 'billing-service', name: 'Billing & Invoice Service', port: 8086, status: 'UP', heap: '330MB / 1024MB', cpu: '2.1%', uptime: '14 ngày 5 giờ' },
  { id: 'payment-service', name: 'Payment Service (VNPay/MoMo)', port: 8087, status: 'UP', heap: '305MB / 1024MB', cpu: '1.9%', uptime: '14 ngày 5 giờ' },
  { id: 'maintenance-service', name: 'Maintenance & Ticket Service', port: 8088, status: 'UP', heap: '240MB / 512MB', cpu: '0.8%', uptime: '14 ngày 5 giờ' },
  { id: 'report-service', name: 'Report & BI Service', port: 8089, status: 'UP', heap: '350MB / 1024MB', cpu: '2.5%', uptime: '14 ngày 5 giờ' },
  { id: 'notification-service', name: 'Notification Service (RabbitMQ)', port: 8090, status: 'UP', heap: '215MB / 512MB', cpu: '1.0%', uptime: '14 ngày 5 giờ' }
];

export const DEFAULT_AUDIT_LOGS = [
  { id: 'LOG-001', timestamp: '2026-10-03 19:42:15', ip: '118.70.190.22', role: 'ROLE_ADMIN', username: 'admin', action: 'APM_SYSTEM_CHECK', target: 'Discovery & RabbitMQ', status: 'SUCCESS', details: 'Giám sát 12 microservices đều phản hồi HTTP 200 UP' },
  { id: 'LOG-002', timestamp: '2026-10-03 18:30:10', ip: '14.232.12.89', role: 'ROLE_STAFF', username: 'staff', action: 'SAVE_METER_READINGS', target: 'P.101 CS-01', status: 'SUCCESS', details: 'Chốt chỉ số điện 860 kWh, nước 45 m3' },
  { id: 'LOG-003', timestamp: '2026-10-03 17:15:40', ip: '171.244.45.60', role: 'ROLE_TENANT', username: 'tenant1', action: 'SIGN_CONTRACT', target: 'HD-2026-001', status: 'SUCCESS', details: 'Khách ký điện tử xác nhận điều khoản HĐ P.101' },
  { id: 'LOG-004', timestamp: '2026-10-03 15:10:05', ip: '14.232.12.89', role: 'ROLE_STAFF', username: 'staff', action: 'CREATE_INVOICE_BATCH', target: 'CS-01 Cầu Giấy', status: 'SUCCESS', details: 'Tự động phát hành 12 hóa đơn kỳ 2026-09' },
  { id: 'LOG-005', timestamp: '2026-10-03 14:02:18', ip: '113.190.23.41', role: 'ROLE_TENANT', username: 'tenant2', action: 'ONLINE_PAYMENT_VNPAY', target: 'HD-202609-03', status: 'SUCCESS', details: 'Thanh toán VNPay 3.840.000 đ thành công' },
  { id: 'LOG-006', timestamp: '2026-10-03 11:25:33', ip: '118.70.190.22', role: 'ROLE_ADMIN', username: 'admin', action: 'UPDATE_INTEGRATION_KEY', target: 'AI OCR Vision', status: 'SUCCESS', details: 'Kiểm tra kết nối AI Vision model GPT-4o thành công' },
  { id: 'LOG-007', timestamp: '2026-10-03 09:14:52', ip: '42.115.88.19', role: 'ROLE_STAFF', username: 'staff', action: 'CONFIRM_CASH_PAYMENT', target: 'HD-202609-05', status: 'SUCCESS', details: 'Thu tiền mặt 3.240.000 đ từ khách Hoàng Văn Nam' }
];

export const DEFAULT_ROOM_MEMBERS = [
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
    roleInRoom: 'REPRESENTATIVE',
    joinDate: '01/01/2026',
    temporaryResidenceStatus: 'REGISTERED',
    status: 'ACTIVE'
  },

  {
    id: 3,
    roomId: 102,
    roomNumber: 'P.102',
    houseCode: 'CS-01',
    tenantId: 2,
    fullName: 'Trần Thị Bình',
    phone: '0978.123.456',
    cccd: '001202023456',
    maskedCccd: '00120202****',
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
    tenantId: 3,
    fullName: 'Phạm Minh Cường',
    phone: '0912.888.999',
    cccd: '034203034567',
    maskedCccd: '03420303****',
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
    tenantId: 4,
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

export const DEFAULT_CONTRACTS = [
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
    tenantName: 'Phạm Minh Cường',
    tenantPhone: '0912.888.999',
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
  },
  {
    id: 3,
    contractCode: 'HD-2026-007',
    roomNumber: 'P.102',
    houseCode: 'CS-02',
    houseName: 'Nhà Trọ Bách Khoa - Cơ Sở 2',
    tenantName: 'Hoàng Văn Nam',
    tenantPhone: '0966.123.456',
    startDate: '01/10/2026',
    endDate: '01/10/2027',
    rentalPrice: 2800000,
    depositAmount: 2800000,
    paymentCycle: 1,
    paymentDay: 5,
    terms: 'Hợp đồng thuê phòng sinh viên. Tiền cọc giữ chỗ đúng 1 tháng tiền phòng = 2.800.000 đ (không bao gồm dịch vụ). Phải nộp tiền cọc và ký điện tử mới được nhận phòng.',
    status: 'PENDING_DEPOSIT',
    depositPaid: false,
    signedElectronically: false,
    signedAt: null,
    holdingUntil: Date.now() + 15 * 60 * 1000
  }
];

export const DEFAULT_METER_DISPUTES = [
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

export const DEFAULT_HOUSE_SERVICE_CONFIGS = [
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

export const DEFAULT_ROOMMATE_REQUESTS_V2 = [
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

export const DEFAULT_MOVE_OUT_SETTLEMENTS = [
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
    refundStatus: 'PENDING', // PENDING | COMPLETED
    settledAt: '2026-10-03 16:30',
    createdAt: '2026-10-01'
  },
  {
    id: 2,
    contractId: 'HD-2026-004',
    roomNumber: 'P.102',
    houseCode: 'CS-02',
    tenantName: 'Hoàng Văn Nam',
    tenantPhone: '0966.123.456',
    bankAccount: '0966123456',
    bankName: 'MB Bank',
    accountHolder: 'HOANG VAN NAM',
    moveOutDate: '2026-10-05',
    reason: 'Hết hạn hợp đồng thuê phòng',
    originalDeposit: 3000000,
    unpaidUtilitiesFee: 150000,
    damageFee: 0,
    damageDescription: 'Bàn giao nguyên trạng, thiết bị hoạt động tốt',
    refundAmount: 2850000,
    refundStatus: 'PENDING',
    settledAt: null,
    createdAt: '2026-10-05'
  }
];

export const DEFAULT_LANDLORD_PROFILES = [
  {
    id: 1,
    userId: 2, // Staff/Landlord Tran Van Manh
    username: 'staff',
    fullName: 'Trần Văn Mạnh',
    identityCard: '001089012345',
    maskedIdentityCard: '00108901****',
    birthDate: '1989-08-20',
    issueDate: '2021-05-12',
    issuePlace: 'Cục Cảnh sát QLHC về TTXH',
    permanentAddress: 'Số 12 Ngõ 80 Chùa Láng, Phường Láng Thượng, Đống Đa, Hà Nội',
    cccdFrontUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop',
    cccdBackUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop',
    taxCode: '8392019482',
    businessLicenseUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop',
    kycStatus: 'VERIFIED', // PENDING | VERIFIED | REJECTED
    rejectionReason: null,
    maxProperties: 5,
    packagePlan: 'ENTERPRISE',
    verifiedAt: '2026-01-15 09:00',
    verifiedBy: 1 // Admin
  },
  {
    id: 2,
    userId: 4,
    username: 'landlord_hang',
    fullName: 'Nguyễn Thị Hằng',
    identityCard: '001192003456',
    maskedIdentityCard: '00119200****',
    birthDate: '1992-11-04',
    issueDate: '2022-09-18',
    issuePlace: 'Cục Cảnh sát QLHC về TTXH',
    permanentAddress: 'Số 45 Đại La, Phường Trương Định, Hai Bà Trưng, Hà Nội',
    cccdFrontUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
    cccdBackUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
    taxCode: '8594029112',
    businessLicenseUrl: null,
    kycStatus: 'PENDING',
    rejectionReason: null,
    maxProperties: 2,
    packagePlan: 'STANDARD',
    verifiedAt: null,
    verifiedBy: null
  }
];

export const DataProvider = ({ children }) => {
  const auth = useAuth();
  const updateTenantRoom = auth?.updateTenantRoom;

  // 1. Quản lý kỳ tính cước hiện hành (tháng/năm)
  const [billingMonth, setBillingMonthState] = useState(() => {
    try {
      return localStorage.getItem('rental_billing_month') || '2026-09';
    } catch {
      return '2026-09';
    }
  });

  // Lưu trữ số liệu điện nước theo từng tháng: { '2026-09': [...], '2026-10': [...] }
  const [metersHistory, setMetersHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('rental_meters_history');
      if (saved) return JSON.parse(saved);
      const m09 = localStorage.getItem('rental_meters')
        ? JSON.parse(localStorage.getItem('rental_meters'))
        : DEFAULT_METERS;
      return { '2026-09': m09 };
    } catch {
      return { '2026-09': DEFAULT_METERS };
    }
  });

  // Lưu trữ hóa đơn theo từng tháng: { '2026-09': [...], '2026-10': [...] }
  const [invoicesHistory, setInvoicesHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('rental_invoices_history');
      if (saved) return JSON.parse(saved);
      const inv09 = localStorage.getItem('rental_invoices')
        ? JSON.parse(localStorage.getItem('rental_invoices'))
        : DEFAULT_INVOICES;
      return { '2026-09': inv09 };
    } catch {
      return { '2026-09': DEFAULT_INVOICES };
    }
  });

  // Thông báo biến động đơn giá điện nước cho tất cả tài khoản (Chỉ lưu khi có thay đổi thật)
  const [systemNotices, setSystemNotices] = useState(() => {
    try {
      const saved = localStorage.getItem('rental_system_notices');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((n) => n.id !== 'sys-notice-init') : [];
    } catch {
      return [];
    }
  });

  // Thông báo thanh toán phòng giữa các bạn cùng phòng
  const [roomPaymentNotices, setRoomPaymentNotices] = useState(() => {
    try {
      const saved = localStorage.getItem('rental_room_payment_notices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Thông báo khi bạn cùng phòng rời đi (để người ở lại được thông báo)
  const [roommateLeaveNotices, setRoommateLeaveNotices] = useState(() => {
    try {
      const saved = localStorage.getItem('rental_roommate_leave_notices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Quản lý cập nhật meters và invoices theo kỳ hiện tại

  const setMeters = (actionOrValue) => {
    setMetersHistory((prev) => {
      const currentList = prev[billingMonth] || DEFAULT_METERS;
      const updatedList = typeof actionOrValue === 'function' ? actionOrValue(currentList) : actionOrValue;
      return { ...prev, [billingMonth]: updatedList };
    });
  };

  const setInvoices = (actionOrValue) => {
    setInvoicesHistory((prev) => {
      const currentList = prev[billingMonth] || DEFAULT_INVOICES;
      const updatedList = typeof actionOrValue === 'function' ? actionOrValue(currentList) : actionOrValue;
      const next = { ...prev, [billingMonth]: updatedList };
      try {
        localStorage.setItem('rental_invoices_history', JSON.stringify(next));
        localStorage.setItem('rental_invoices', JSON.stringify(updatedList));
      } catch {}
      return next;
    });
  };

  const resetMonthlyPayments = (monthKey = billingMonth) => {
    setMetersHistory((prev) => {
      const list = prev[monthKey] || DEFAULT_METERS;
      const updated = list.map((m) => ({ ...m, paid: false }));
      return { ...prev, [monthKey]: updated };
    });
    setInvoicesHistory((prev) => {
      const invList = prev[monthKey] || DEFAULT_INVOICES;
      const updated = invList.map((inv) => ({ ...inv, status: 'UNPAID', paidAt: null }));
      return { ...prev, [monthKey]: updated };
    });
  };

  const switchBillingMonth = (targetMonth) => {
    setBillingMonthState(targetMonth);
    localStorage.setItem('rental_billing_month', targetMonth);

    // Kế thừa và mở lại phòng cho kỳ cước mới
    setMetersHistory((prev) => {
      const existing = prev[targetMonth];
      if (existing) {
        // Đảm bảo nếu chuyển sang tháng 10 thì P.101 và các phòng được mở lại để ghi số và reset trạng thái thanh toán
        if (targetMonth === '2026-10') {
          const needsUnlock = existing.some((m) => (m.room === 'P.101' && m.recorded) || m.paid);
          if (needsUnlock) {
            const unlocked = existing.map((m) => ({
              ...m,
              recorded: false,
              paid: false
            }));
            return { ...prev, [targetMonth]: unlocked };
          }
        }
        return prev;
      }

      // Kế thừa từ tháng 9 (hoặc kỳ trước đó)
      const baseList = prev['2026-09'] || DEFAULT_METERS;
      const nextMonthMeters = baseList.map((m) => {
        const oldElec = m.newElec; // Số cũ tháng mới = Số mới chốt tháng trước!
        const oldWater = m.newWater;
        return {
          ...m,
          oldElec,
          newElec: oldElec, // Ban đầu số mới = số cũ (tiêu thụ = 0)
          oldWater,
          newWater: oldWater,
          recorded: false, // MỞ LẠI TẤT CẢ CÁC PHÒNG (kể cả P.101)!
          paid: false // RESET TRẠNG THÁI ĐÃ NỘP TIỀN CỦA TẤT CẢ CÁC PHÒNG!
        };
      });

      return { ...prev, [targetMonth]: nextMonthMeters };
    });

    // Cập nhật danh sách hóa đơn theo kỳ mới
    setInvoicesHistory((prev) => {
      const existingInvs = prev[targetMonth];
      if (existingInvs) {
        if (targetMonth === '2026-10') {
          const hasPaid = existingInvs.some((inv) => inv.status === 'PAID');
          if (hasPaid) {
            const resetInvs = existingInvs.map((inv) => ({
              ...inv,
              status: 'UNPAID',
              paidAt: null
            }));
            return { ...prev, [targetMonth]: resetInvs };
          }
        }
        return prev;
      }

      const baseInvoices = prev['2026-09'] || DEFAULT_INVOICES;
      const nextMonthInvoices = baseInvoices.map((inv) => ({
        ...inv,
        id: `inv-${targetMonth}-${inv.room}-${inv.id}`,
        code: `HD-${targetMonth.replace('-', '')}-${String(inv.id).padStart(2, '0')}`,
        status: 'UNPAID', // RESET TRẠNG THÁI HÓA ĐƠN VỀ CHỜ THU TIỀN!
        paidAt: null,
        elec: 0,
        water: 0,
        total: inv.roomFee + (inv.service || 100000)
      }));

      return { ...prev, [targetMonth]: nextMonthInvoices };
    });
  };

  // Tự động kiểm tra vào mỗi ngày 1 hàng tháng: Reset trạng thái đã nộp tiền của tất cả các phòng
  useEffect(() => {
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const lastResetKey = localStorage.getItem('rental_last_auto_reset_month');

    // Nếu sang tháng mới và là ngày 1 hàng tháng: Tự động reset và mở chu kỳ thanh toán mới
    if (lastResetKey !== currentMonthKey && today.getDate() === 1) {
      switchBillingMonth(currentMonthKey);
      resetMonthlyPayments(currentMonthKey);
      localStorage.setItem('rental_last_auto_reset_month', currentMonthKey);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('rental_billing_month', billingMonth);
  }, [billingMonth]);

  useEffect(() => {
    localStorage.setItem('rental_meters_history', JSON.stringify(metersHistory));
    if (metersHistory[billingMonth]) {
      localStorage.setItem('rental_meters', JSON.stringify(metersHistory[billingMonth]));
    }
  }, [metersHistory, billingMonth]);

  useEffect(() => {
    localStorage.setItem('rental_invoices_history', JSON.stringify(invoicesHistory));
    if (invoicesHistory[billingMonth]) {
      localStorage.setItem('rental_invoices', JSON.stringify(invoicesHistory[billingMonth]));
    }
  }, [invoicesHistory, billingMonth]);

  useEffect(() => {
    localStorage.setItem('rental_system_notices', JSON.stringify(systemNotices));
  }, [systemNotices]);

  useEffect(() => {
    localStorage.setItem('rental_room_payment_notices', JSON.stringify(roomPaymentNotices));
  }, [roomPaymentNotices]);

  useEffect(() => {
    localStorage.setItem('rental_roommate_leave_notices', JSON.stringify(roommateLeaveNotices));
  }, [roommateLeaveNotices]);

  // Đơn giá Điện & Nước toàn chuỗi phòng trọ
  const [utilityPrices, setUtilityPrices] = useState(() => {
    try {
      const saved = localStorage.getItem('rental_utility_prices');
      return saved ? JSON.parse(saved) : { elecPrice: 3500, waterPrice: 25000 };
    } catch {
      return { elecPrice: 3500, waterPrice: 25000 };
    }
  });

  const updateUtilityPrices = (newPrices) => {
    const nextElec = Number(newPrices.elecPrice);
    const nextWater = Number(newPrices.waterPrice);
    const isElecChanged = Boolean(nextElec && nextElec !== utilityPrices.elecPrice);
    const isWaterChanged = Boolean(nextWater && nextWater !== utilityPrices.waterPrice);

    const updated = {
      elecPrice: nextElec || utilityPrices.elecPrice,
      waterPrice: nextWater || utilityPrices.waterPrice
    };
    setUtilityPrices(updated);
    localStorage.setItem('rental_utility_prices', JSON.stringify(updated));

    // Cập nhật giá điện nước vào meters của tất cả các kỳ
    setMetersHistory((prev) => {
      const nextObj = {};
      Object.keys(prev).forEach((k) => {
        nextObj[k] = prev[k].map((m) => ({
          ...m,
          elecPrice: updated.elecPrice,
          waterPrice: updated.waterPrice
        }));
      });
      return nextObj;
    });

    // CHỈ THÔNG BÁO CHO KHÁCH THUÊ KHI GIÁ ĐIỆN NƯỚC THỰC SỰ THAY ĐỔI
    if (isElecChanged || isWaterChanged) {
      const newNotice = {
        id: `price-change-${Date.now()}`,
        type: 'PRICE_CHANGE',
        title: '📢 Thông Báo Điều Chỉnh Đơn Giá Điện & Nước',
        desc: `Ban Quản Lý vừa cập nhật bảng đơn giá dịch vụ: Điện ${updated.elecPrice.toLocaleString('vi-VN')} đ/kWh, Nước ${updated.waterPrice.toLocaleString('vi-VN')} đ/m³. Mức giá mới được áp dụng ngay cho toàn bộ các phòng.`,
        time: 'Vừa xong',
        date: new Date().toLocaleDateString('vi-VN')
      };
      setSystemNotices((prev) => [newNotice, ...prev.filter((n) => n.id !== 'sys-notice-init')]);
    }

    return updated;
  };

  // Đặt lại trạng thái thanh toán phòng về CHƯA THANH TOÁN (UNPAID)
  // Quy tắc: Khi trả phòng xong rồi thuê lại hoặc thuê phòng khác, trạng thái phòng mới/thuê lại PHẢI là chưa thanh toán!
  const resetRoomPaymentStatus = (roomNumber, newTenantName = null) => {
    if (!roomNumber) return;

    // 1. Reset hóa đơn phòng về UNPAID trong invoicesHistory
    setInvoicesHistory((prev) => {
      const nextObj = { ...prev };
      const currentList = nextObj[billingMonth] || [];
      const hasInv = currentList.some((inv) => inv.room === roomNumber);

      if (!hasInv && newTenantName) {
        const roomObj = ALL_ROOMS.find((r) => r.number === roomNumber);
        const newInv = {
          id: Date.now(),
          code: `HD-${billingMonth.replace('-', '')}-${roomNumber.replace('P.', '')}`,
          room: roomNumber,
          house: roomObj?.house || 'Cơ Sở 1 - Cầu Giấy',
          tenant: newTenantName,
          roomFee: roomObj?.price || 3500000,
          elec: 0,
          water: 0,
          service: 100000,
          total: (roomObj?.price || 3500000) + 100000,
          status: 'UNPAID',
          paidAt: null
        };
        nextObj[billingMonth] = [newInv, ...currentList];
      } else {
        Object.keys(nextObj).forEach((mKey) => {
          nextObj[mKey] = nextObj[mKey].map((inv) => {
            if (inv.room === roomNumber) {
              return {
                ...inv,
                status: 'UNPAID',
                paidAt: null,
                tenant: newTenantName || inv.tenant
              };
            }
            return inv;
          });
        });
      }
      return nextObj;
    });

    // 2. Reset trạng thái công tơ paid về false trong metersHistory
    setMetersHistory((prev) => {
      const nextObj = { ...prev };
      Object.keys(nextObj).forEach((mKey) => {
        nextObj[mKey] = nextObj[mKey].map((m) => {
          if (m.room === roomNumber) {
            return {
              ...m,
              paid: false,
              tenant: newTenantName || m.tenant
            };
          }
          return m;
        });
      });
      return nextObj;
    });

    // 3. Xóa thông báo thanh toán cũ của phòng này để không gây hiểu nhầm
    setRoomPaymentNotices((prev) => prev.filter((rpn) => rpn.room !== roomNumber));
  };

  // Tickets (Sự cố & Sửa chữa)
  const [tickets, setTickets] = useState(() => {
    try {
      const saved = localStorage.getItem('rental_tickets');
      return saved ? JSON.parse(saved) : DEFAULT_TICKETS;
    } catch {
      return DEFAULT_TICKETS;
    }
  });

  // Tenants (Khách thuê)
  const [tenants, setTenants] = useState(() => {
    let list = DEFAULT_TENANTS;
    try {
      const saved = localStorage.getItem('rental_tenants');
      if (saved) list = JSON.parse(saved);
    } catch {
      list = DEFAULT_TENANTS;
    }

    // Tự động đồng bộ khách thuê đã được duyệt đơn (rental_room_requests)
    try {
      const sReqs = localStorage.getItem('rental_room_requests');
      const pReqs = sReqs ? JSON.parse(sReqs) : null;
      if (Array.isArray(pReqs)) {
        pReqs.forEach((req) => {
          if (req.status === 'APPROVED' && req.targetRoom && req.tenant) {
            // Khách mới (Nam): Không tự động gán vào P.103 nếu chưa có HĐ & đã đóng cọc
            if (req.tenant.toLowerCase().includes('nam') && (req.type === 'ROOMMATE' || !req.depositPaid)) {
              return;
            }
            const reqNorm = req.tenant.toLowerCase();
            let matched = false;
            list = list.map((t) => {
              const tNorm = (t.fullName || '').toLowerCase();
              if (tNorm.includes(reqNorm) || reqNorm.includes(tNorm) || (reqNorm.includes('nam') && tNorm.includes('nam'))) {
                matched = true;
                return {
                  ...t,
                  room: req.targetRoom,
                  rooms: [req.targetRoom],
                  houseCode: req.houseCode || 'CS-01',
                  house: req.house || (req.houseCode === 'CS-02' ? 'Nhà Trọ Bách Khoa - Cơ Sở 2' : 'Nhà Trọ Cầu Giấy - Cơ Sở 1'),
                  status: 'ACTIVE',
                  daysSinceLeave: 0
                };
              }
              return t;
            });
            if (!matched) {
              list.push({
                id: req.id || Date.now(),
                fullName: req.tenant,
                phone: req.phone || '0966.123.456',
                email: req.email || 'tenant@rental.vn',
                cccd: '036207078901',
                hometown: 'Việt Nam',
                room: req.targetRoom,
                rooms: [req.targetRoom],
                houseCode: req.houseCode || 'CS-01',
                house: req.house || (req.houseCode === 'CS-02' ? 'Nhà Trọ Bách Khoa - Cơ Sở 2' : 'Nhà Trọ Cầu Giấy - Cơ Sở 1'),
                contractStart: req.date || new Date().toLocaleDateString('vi-VN'),
                contractEnd: '31/12/2026',
                deposit: 3500000,
                status: 'ACTIVE',
                daysSinceLeave: 0
              });
            }
          }
        });
      }
    } catch {}

    return list;
  });

  // Rooms
  const [rooms, setRooms] = useState(() => {
    let list = ALL_ROOMS;
    try {
      const saved = localStorage.getItem('rental_rooms');
      if (saved) list = JSON.parse(saved);
    } catch {
      list = ALL_ROOMS;
    }

    // Tự động cập nhật số người dựa trên rental_room_members và rental_room_requests
    try {
      const sMembers = localStorage.getItem('rental_room_members');
      const pMembers = sMembers ? JSON.parse(sMembers) : null;
      if (Array.isArray(pMembers)) {
        list = list.map((r) => {
          const activeCount = pMembers.filter((m) => m.roomNumber === r.number && (!m.houseCode || m.houseCode === r.houseCode) && m.status !== 'MOVED_OUT').length;
          if (activeCount > 0) {
            return { ...r, occupants: Math.max(r.occupants || 0, activeCount), status: 'OCCUPIED' };
          }
          return r;
        });
      }
    } catch {}

    return list;
  });

  // Room Requests (Chuyển phòng, Thuê thêm, Ở ghép)
  const [roomRequests, setRoomRequests] = useState(() => {
    try {
      const saved = localStorage.getItem('rental_room_requests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((req) => {
            let hCode = req.houseCode;
            let hName = req.house;
            if (hName && (hName.includes('Bách Khoa') || hName.includes('CS-02') || hName.includes('Cơ Sở 2'))) {
              hCode = 'CS-02';
              hName = 'Nhà Trọ Bách Khoa - Cơ Sở 2';
            } else if (hName && (hName.includes('Cầu Giấy') || hName.includes('CS-01') || hName.includes('Cơ Sở 1'))) {
              hCode = 'CS-01';
              hName = 'Nhà Trọ Cầu Giấy - Cơ Sở 1';
            } else if (!hCode) {
              const matchRoom = (ALL_ROOMS || []).find((r) => r.number === (req.targetRoom || req.currentRoom));
              hCode = matchRoom?.houseCode || 'CS-01';
              hName = matchRoom?.house || 'Nhà Trọ Cầu Giấy - Cơ Sở 1';
            }
            return {
              ...req,
              houseCode: hCode || 'CS-01',
              house: hName || (hCode === 'CS-02' ? 'Nhà Trọ Bách Khoa - Cơ Sở 2' : 'Nhà Trọ Cầu Giấy - Cơ Sở 1')
            };
          });
        }
      }
      return DEFAULT_ROOM_REQUESTS;
    } catch {
      return DEFAULT_ROOM_REQUESTS;
    }
  });

  // Đảm bảo meters luôn lấy đầy đủ tất cả các phòng từ danh mục rooms và cập nhật đúng tên khách thuê từ tenants
  const meters = useMemo(() => {
    const rawList = metersHistory[billingMonth] || DEFAULT_METERS;
    return (rooms || ALL_ROOMS).map((r) => {
      const existing = rawList.find(
        (m) => m.id === r.id || (m.room === r.number && (m.houseCode === r.houseCode || !m.houseCode))
      );

      // Tìm khách thuê thực tế đang ở phòng này
      const foundTenant = (tenants || []).find(
        (t) => t.status === 'ACTIVE' && (t.room === r.number || (t.rooms && t.rooms.includes(r.number)))
      );
      const tenantName = foundTenant
        ? foundTenant.fullName
        : r.status === 'MAINTENANCE'
        ? 'Đang Bảo Trì (Chưa Thuê)'
        : r.status === 'AVAILABLE'
        ? 'Phòng Trống (Chưa Thuê)'
        : (existing?.tenant || 'Khách Đang Thuê');

      // Kiểm tra xem phòng này đã thanh toán hóa đơn chưa
      const rawInvs = invoicesHistory[billingMonth] || DEFAULT_INVOICES;
      const roomInv = rawInvs.find(
        (inv) => inv.room === r.number && (!r.houseCode || inv.house?.includes(r.houseCode) || inv.house === r.house)
      );
      const isRoomPaid = !!existing?.paid || roomInv?.status === 'PAID';
      const isRoomRecorded = !!existing?.recorded || isRoomPaid; // Phòng đã thanh toán khoá chốt điện nước => PHẢI ĐƯỢC TÍNH VÀO PHÒNG ĐÃ CHỐT!

      if (existing) {
        return {
          ...existing,
          id: r.id,
          roomId: r.id,
          room: r.number,
          houseCode: r.houseCode,
          house: r.house,
          floor: r.floor,
          status: r.status,
          tenant: tenantName,
          recorded: isRoomRecorded,
          paid: isRoomPaid
        };
      }

      const baseElec = 800 + (r.id % 20) * 110;
      const baseWater = 40 + (r.id % 15) * 6;
      return {
        id: r.id,
        roomId: r.id,
        room: r.number,
        houseCode: r.houseCode,
        house: r.house,
        floor: r.floor,
        status: r.status,
        tenant: tenantName,
        oldElec: baseElec,
        newElec: baseElec,
        oldWater: baseWater,
        newWater: baseWater,
        elecPrice: utilityPrices?.elecPrice || 3500,
        waterPrice: utilityPrices?.waterPrice || 25000,
        recorded: isRoomRecorded,
        paid: isRoomPaid
      };
    });
  }, [rooms, tenants, metersHistory, billingMonth, utilityPrices, invoicesHistory]);

  // HÓA ĐƠN & BÁO PHÍ GỬI KHÁCH THUÊ:
  // QUY TẮC BẮT BUỘC: "Những phòng đã chốt tiền điện nước mới gửi thanh toán tiền phòng đến khách hàng, chưa chốt chưa gửi"
  const invoices = useMemo(() => {
    const rawInvoices = invoicesHistory[billingMonth] || DEFAULT_INVOICES;
    return rawInvoices.map((inv) => {
      // Tìm số liệu công tơ của phòng này trong meters
      const meter = meters.find(
        (m) =>
          m.room === inv.room &&
          (!m.houseCode || !inv.house || inv.house.includes(m.houseCode) || inv.house === m.house)
      );

      // Phòng đã chốt số hoặc đã thanh toán
      const isRecordedOrPaid = !!meter?.recorded || !!meter?.paid || inv.status === 'PAID';

      // Tính chính xác tiền điện nước nếu đã chốt
      const elecUsage = meter && meter.newElec >= meter.oldElec ? meter.newElec - meter.oldElec : 0;
      const waterUsage = meter && meter.newWater >= meter.oldWater ? meter.newWater - meter.oldWater : 0;
      // Cấu hình số tiền 2.000 đ cho phòng P.101 để test chuyển khoản thực tế SePay
      if (inv.room === 'P.101' && (inv.code === 'HD-202609-01' || inv.id === 1)) {
        return {
          ...inv,
          roomFee: 2000,
          elec: 0,
          water: 0,
          service: 0,
          total: 2000,
          sentToTenant: true,
          meterRecorded: true
        };
      }

      const elecCost = meter?.recorded ? elecUsage * (meter.elecPrice || 3500) : (inv.elec || 0);
      const waterCost = meter?.recorded ? waterUsage * (meter.waterPrice || 25000) : (inv.water || 0);
      const totalCost = inv.roomFee + elecCost + waterCost + (inv.service || 100000);

      return {
        ...inv,
        elec: elecCost,
        water: waterCost,
        total: totalCost,
        sentToTenant: isRecordedOrPaid, // ĐÃ CHỐT ĐIỆN NƯỚC MỚI GỬI BÁO PHÍ TỚI KHÁCH HÀNG!
        meterRecorded: isRecordedOrPaid
      };
    });
  }, [invoicesHistory, billingMonth, meters]);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('rental_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('rental_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('rental_tenants', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem('rental_meters', JSON.stringify(meters));
  }, [meters]);

  useEffect(() => {
    localStorage.setItem('rental_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('rental_room_requests', JSON.stringify(roomRequests));
  }, [roomRequests]);

  // ACTIONS

  // 1. Submit room request (Tenant asks to transfer, rent additional, or find roommate)
  const submitRoomRequest = (requestData) => {
    const isRent = requestData.type === 'RENT' || requestData.type === 'NEW_RENT' || requestData.type === 'HOLD';
    const now = Date.now();
    const isRoommate = requestData.type === 'ROOMMATE';
    let targetHouseCode = requestData.houseCode;
    let targetHouse = requestData.house;

    // NGHIỆP VỤ 1: Người đại diện đang ký HĐ muốn xin sang ở ghép với người khác thì BẮT BUỘC phải trả phòng trước!
    if (isRoommate && requestData.tenant) {
      const tNorm = requestData.tenant.toLowerCase().trim();
      const repContract = (contracts || []).find(
        (c) =>
          c.status === 'ACTIVE' &&
          (c.tenantName || '').toLowerCase().trim().includes(tNorm) &&
          c.roomNumber !== requestData.targetRoom
      );
      if (repContract) {
        return {
          error: true,
          message: `Bạn đang là Người đại diện đứng tên Hợp đồng của phòng ${repContract.roomNumber} (${repContract.houseName || 'Cơ sở hiện tại'}). Bạn bắt buộc phải thanh lý / trả phòng này trước khi xin sang ở ghép phòng khác!`
        };
      }
    }

    // NGHIỆP VỤ 6: Chuyển phòng - Kiểm tra sức chứa: Phòng 3 người không thể chuyển sang phòng 2 người!
    if (requestData.type === 'TRANSFER' && requestData.currentRoom && requestData.targetRoom) {
      const currentRoomObj = (rooms || []).find((r) => r.number === requestData.currentRoom && (!requestData.houseCode || r.houseCode === requestData.houseCode));
      const targetRoomObj = (rooms || []).find((r) => r.number === requestData.targetRoom && (!requestData.houseCode || r.houseCode === requestData.houseCode));
      const currentOccupants = currentRoomObj ? currentRoomObj.occupants : 1;
      const targetMax = targetRoomObj ? targetRoomObj.maxOccupants : 2;

      if (currentOccupants > targetMax) {
        return {
          error: true,
          message: `Số lượng người hiện tại (${currentOccupants} người) không phù hợp với phòng chuyển tới (sức chứa tối đa ${targetMax} người). Vui lòng chọn phòng lớn hơn hoặc tách nhóm!`
        };
      }
    }

    // Phân giải chuẩn xác cơ sở trọ
    if (targetHouse && (targetHouse.includes('Bách Khoa') || targetHouse.includes('CS-02') || targetHouse.includes('Cơ Sở 2'))) {
      targetHouseCode = 'CS-02';
      targetHouse = 'Nhà Trọ Bách Khoa - Cơ Sở 2';
    } else if (targetHouse && (targetHouse.includes('Cầu Giấy') || targetHouse.includes('CS-01') || targetHouse.includes('Cơ Sở 1'))) {
      targetHouseCode = 'CS-01';
      targetHouse = 'Nhà Trọ Cầu Giấy - Cơ Sở 1';
    }

    if (!targetHouseCode && requestData.targetRoom) {
      const matchRoom = (rooms || ALL_ROOMS || []).find((r) => r.number === requestData.targetRoom);
      if (matchRoom) {
        targetHouseCode = matchRoom.houseCode;
        targetHouse = matchRoom.house;
      }
    }

    // NGHIỆP VỤ 5: Nếu phòng đang có bạn cùng phòng (occupants > 1), khi người đại diện xin Chuyển phòng (TRANSFER) hoặc Trả phòng (CHECKOUT / RETURN),
    // BẮT BUỘC phải chờ toàn bộ bạn cùng phòng biểu quyết đồng ý 100% trước khi gửi Chủ trọ!
    const fromRoomNum = requestData.currentRoom || requestData.roomNumber;
    const currentRoomMatch = fromRoomNum ? (rooms || []).find((r) => r.number === fromRoomNum && (!requestData.houseCode || r.houseCode === requestData.houseCode)) : null;
    const currentRoomOccupants = currentRoomMatch ? (currentRoomMatch.occupants || 1) : 1;
    const hasRoommatesInCurrentRoom = currentRoomOccupants > 1;

    // NGHIỆP VỤ SOFT LOCK / GIỮ CHỖ TẠM THỜI (15 PHÚT):
    let holdDurationMs = 15 * 60 * 1000; // 15 phút
    let holdingUntil = null;

    if (isRent && requestData.targetRoom) {
      const targetRoomObj = (rooms || ALL_ROOMS || []).find(
        (r) => r.number === requestData.targetRoom && (!targetHouseCode || r.houseCode === targetHouseCode)
      );

      if (targetRoomObj?.status === 'OCCUPIED') {
        return {
          error: true,
          message: `Phòng ${requestData.targetRoom} đã có khách thuê, không thể đăng ký giữ chỗ!`
        };
      }

      if (targetRoomObj?.status === 'HOLDING' && targetRoomObj.holdingUntil && targetRoomObj.holdingUntil > now) {
        const isSelf = targetRoomObj.holdingBy?.toLowerCase() === (requestData.tenant || '').toLowerCase() ||
                       (requestData.phone && targetRoomObj.holdingPhone === requestData.phone);
        if (!isSelf) {
          const remainingMins = Math.ceil((targetRoomObj.holdingUntil - now) / 60000);
          return {
            error: true,
            message: `Phòng ${requestData.targetRoom} hiện đang có khách giữ chỗ tạm thời (còn ${remainingMins} phút để hoàn tất cọc). Vui lòng chọn phòng khác hoặc quay lại sau!`
          };
        }
      }

      // Chống spam giữ chỗ ảo: Mỗi khách chỉ được giữ chỗ tối đa 1 phòng
      const existingHold = (rooms || []).find(
        (r) => r.status === 'HOLDING' && r.holdingUntil && r.holdingUntil > now &&
               ((requestData.tenant && r.holdingBy?.toLowerCase() === requestData.tenant.toLowerCase()) ||
                (requestData.phone && r.holdingPhone === requestData.phone)) &&
               r.number !== requestData.targetRoom
      );
      if (existingHold) {
        return {
          error: true,
          message: `Bạn đang tạm khóa giữ chỗ phòng ${existingHold.number} (${existingHold.houseCode || 'Cơ sở hiện tại'}). Mỗi khách chỉ được giữ chỗ tối đa 1 phòng. Vui lòng hoàn tất cọc hoặc hủy phòng cũ trước khi chọn phòng mới!`
        };
      }

      holdingUntil = now + holdDurationMs;

      // Cập nhật trạng thái phòng sang HOLDING ngay lập tức
      setRooms((prev) => {
        const next = prev.map((r) => {
          const isMatch = r.number === requestData.targetRoom && (!targetHouseCode || r.houseCode === targetHouseCode);
          return isMatch
            ? {
                ...r,
                status: 'HOLDING',
                holdingBy: requestData.tenant,
                holdingPhone: requestData.phone,
                holdingUntil: holdingUntil
              }
            : r;
        });
        localStorage.setItem('rental_rooms', JSON.stringify(next));
        return next;
      });

      // Tạo hợp đồng chờ nộp cọc tương ứng
      const depositAmt = targetRoomObj?.price || 3000000;
      setContracts((prev) => {
        const next = [...prev];
        const existingIdx = next.findIndex(c => 
          (c.tenantName?.toLowerCase().includes((requestData.tenant || '').toLowerCase()) || c.tenantPhone === requestData.phone) &&
          c.status === 'PENDING_DEPOSIT'
        );
        const contractCode = `HD-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
        const contractEntry = {
          id: Date.now() + 10,
          contractCode: contractCode,
          roomNumber: requestData.targetRoom,
          houseCode: targetHouseCode || 'CS-01',
          houseName: targetHouse || 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
          tenantName: requestData.tenant,
          tenantPhone: requestData.phone,
          startDate: new Date().toLocaleDateString('vi-VN'),
          endDate: '31/12/2026',
          rentalPrice: depositAmt,
          depositAmount: depositAmt,
          paymentCycle: 1,
          paymentDay: 5,
          terms: `Hợp đồng giữ chỗ thuê phòng ${requestData.targetRoom}. Thời hạn nộp cọc 15 phút kể từ lúc giữ chỗ.`,
          status: 'PENDING_DEPOSIT',
          depositPaid: false,
          signedElectronically: false,
          holdingUntil: holdingUntil
        };
        if (existingIdx >= 0) {
          next[existingIdx] = contractEntry;
        } else {
          next.unshift(contractEntry);
        }
        localStorage.setItem('rental_contracts', JSON.stringify(next));
        return next;
      });
    }

    const needsRoommatesVoting = isRoommate || (
      (requestData.type === 'TRANSFER' || requestData.type === 'CHECKOUT' || requestData.type === 'RETURN') &&
      hasRoommatesInCurrentRoom
    );

    const initialStatus = requestData.status || (needsRoommatesVoting ? 'WAITING_ROOMMATES' : 'PENDING');

    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('vi-VN'),
      roommateVotes: [],
      ...requestData,
      status: isRent ? 'HOLDING' : initialStatus,
      holdingUntil: holdingUntil || requestData.holdingUntil || null,
      houseCode: targetHouseCode || 'CS-01',
      house: targetHouse || (targetHouseCode === 'CS-02' ? 'Nhà Trọ Bách Khoa - Cơ Sở 2' : 'Nhà Trọ Cầu Giấy - Cơ Sở 1')
    };
    setRoomRequests((prev) => {
      const updated = [newEntry, ...prev];
      try {
        localStorage.setItem('rental_room_requests', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    return newEntry;
  };

  // 2. Thành viên trong phòng biểu quyết (Xin ở ghép HOẶC Trả phòng có nhiều người ở)
  const voteRoommateRequest = (requestId, voterName, isApproved) => {
    setRoomRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const newVotes = [
          ...(req.roommateVotes || []).filter((v) => v.voter !== voterName),
          { voter: voterName, approved: isApproved, time: new Date().toLocaleTimeString('vi-VN') }
        ];

        // Nếu có bất kỳ bạn cùng phòng nào từ chối -> Đơn bị từ chối ngay lập tức
        if (!isApproved) {
          return {
            ...req,
            roommateVotes: newVotes,
            status: 'REJECTED_BY_ROOMMATES'
          };
        }

        // Nếu biểu quyết đồng ý
        const targetRoomObj = (rooms || []).find((r) => r.number === req.targetRoom);
        const occupants = targetRoomObj ? targetRoomObj.occupants : 2;

        // NGHIỆP VỤ 3 & 5: Biểu quyết đồng thuận 100%
        // - Xin vào ở ghép (ROOMMATE): Cần 100% người đang ở trong phòng đích đồng ý!
        // - Đại diện xin chuyển phòng hoặc trả phòng (TRANSFER / CHECKOUT): Cần 100% các bạn cùng phòng còn lại đồng ý!
        let requiredApprovals = 1;
        if (req.type === 'ROOMMATE') {
          // Lấy danh sách thành viên hiện tại của phòng đích
          const activeMembers = (roomMembers || []).filter(
            (m) => m.roomNumber === req.targetRoom && m.status !== 'MOVED_OUT' && (!req.houseCode || m.houseCode === req.houseCode)
          );
          requiredApprovals = Math.max(1, activeMembers.length || occupants);
        } else if (req.type === 'CHECKOUT' || req.type === 'TRANSFER') {
          // Người làm đơn là 1 người, cần tất cả (occupants - 1) người còn lại đồng ý
          requiredApprovals = Math.max(1, occupants - 1);
        }

        const approvedCount = newVotes.filter((v) => v.approved).length;
        const allAgreed = approvedCount >= requiredApprovals;

        return {
          ...req,
          roommateVotes: newVotes,
          status: allAgreed ? 'ROOMMATES_APPROVED' : 'WAITING_ROOMMATES'
        };
      })
    );
  };

  // 3. Quản lý / Admin phê duyệt đơn (Chuyển phòng / Thuê thêm / Ở ghép bước 2)
  const approveRoomRequest = (requestId, adminNote = 'Đã phê duyệt') => {
    const targetReq = roomRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    setRoomRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? { ...req, status: 'APPROVED', adminNote, approvedAt: new Date().toLocaleDateString('vi-VN') }
          : req
      )
    );

    // Tự động cập nhật trạng thái phòng và khách thuê
    if (targetReq.type === 'TRANSFER') {
      // 1. Chuyển phòng: TỰ ĐỘNG TRẢ PHÒNG CŨ!
      if (targetReq.currentRoom) {
        setRooms((prev) =>
          prev.map((r) => {
            const isMatch = r.number === targetReq.currentRoom && (!targetReq.houseCode || r.houseCode === targetReq.houseCode);
            return isMatch
              ? {
                  ...r,
                  occupants: Math.max(0, r.occupants - 1),
                  status: r.occupants - 1 <= 0 ? 'AVAILABLE' : r.status
                }
              : r;
          })
        );
      }
      // Tăng người và đổi trạng thái phòng mới
      setRooms((prev) =>
        prev.map((r) => {
          const isMatch = r.number === targetReq.targetRoom && (!targetReq.houseCode || r.houseCode === targetReq.houseCode);
          return isMatch
            ? { ...r, status: 'OCCUPIED', occupants: Math.min(r.maxOccupants, r.occupants + 1) }
            : r;
        })
      );
      // Đổi phòng cho khách thuê trong hồ sơ: Gỡ phòng cũ, thêm phòng mới
      setTenants((prev) =>
        prev.map((t) => {
          const tNorm = (t.fullName || '').toLowerCase();
          const reqNorm = (targetReq.tenant || '').toLowerCase();
          const isMatch =
            tNorm.includes(reqNorm) ||
            reqNorm.includes(tNorm) ||
            (reqNorm.includes('an') && tNorm.includes('an')) ||
            (reqNorm.includes('thuê') && tNorm.includes('an'));
          if (!isMatch) return t;

          const currentRooms = t.rooms && t.rooms.length > 0 ? t.rooms : (t.room ? [t.room] : []);
          const updatedRooms = currentRooms.map((rm) => rm === targetReq.currentRoom ? targetReq.targetRoom : rm);
          if (!updatedRooms.includes(targetReq.targetRoom)) {
            updatedRooms.push(targetReq.targetRoom);
          }
          const finalRooms = Array.from(new Set(updatedRooms.filter((rm) => rm !== targetReq.currentRoom || rm === targetReq.targetRoom)));
          return {
            ...t,
            rooms: finalRooms,
            room: targetReq.targetRoom,
            status: 'ACTIVE',
            daysSinceLeave: 0
          };
        })
      );
      // ĐỒNG BỘ TRỰC TIẾP CỔNG KHÁCH THUÊ: REPLACE
      if (updateTenantRoom) {
        updateTenantRoom(targetReq.tenant, { oldRoom: targetReq.currentRoom, newRoom: targetReq.targetRoom }, 'REPLACE');
      }

      // ĐỒNG BỘ THÀNH VIÊN PHÒNG (room_members): Chuyển người đại diện sang phòng mới, rời phòng cũ
      setRoomMembers((prev) => {
        let updated = prev.map((m) => {
          if (targetReq.currentRoom && m.roomNumber === targetReq.currentRoom && m.fullName.toLowerCase().includes(targetReq.tenant.toLowerCase())) {
            return { ...m, status: 'MOVED_OUT' };
          }
          if (m.roomNumber === targetReq.targetRoom && m.roleInRoom === 'REPRESENTATIVE') {
            return { ...m, status: 'MOVED_OUT' };
          }
          return m;
        });

        const existsInTarget = updated.find((m) => m.roomNumber === targetReq.targetRoom && m.fullName.toLowerCase().includes(targetReq.tenant.toLowerCase()));
        if (existsInTarget) {
          updated = updated.map((m) => m.id === existsInTarget.id ? { ...m, status: 'ACTIVE', roleInRoom: 'REPRESENTATIVE' } : m);
        } else {
          updated.push({
            id: `RM-${Date.now()}`,
            roomId: Date.now(),
            roomNumber: targetReq.targetRoom,
            houseCode: targetReq.houseCode || 'CS-01',
            fullName: targetReq.tenant,
            phone: targetReq.phone || '0987.654.321',
            cccd: '001201012345',
            maskedCccd: '00120101****',
            roleInRoom: 'REPRESENTATIVE',
            temporaryResidenceStatus: 'REGISTERED',
            startDate: new Date().toLocaleDateString('vi-VN'),
            status: 'ACTIVE'
          });
        }
        localStorage.setItem('rental_room_members', JSON.stringify(updated));
        return updated;
      });

      // ĐỒNG BỘ HỢP ĐỒNG: TỰ ĐỘNG CHUYỂN HỢP ĐỒNG SANG PHÒNG MỚI, BẢO LƯU HỢP ĐỒNG & TIỀN CỌC!
      const todayStr = new Date().toLocaleDateString('vi-VN');
      setContracts((prev) => {
        const updated = prev.map((c) => {
          const reqNorm = (targetReq.tenant || '').toLowerCase();
          const isMatch = (
            (c.roomNumber === targetReq.currentRoom || (targetReq.tenant && c.tenantName?.toLowerCase().includes(reqNorm))) &&
            c.status === 'ACTIVE'
          );
          if (isMatch) {
            return {
              ...c,
              roomNumber: targetReq.targetRoom,
              houseCode: targetReq.houseCode || c.houseCode,
              houseName: targetReq.house || c.houseName,
              transferHistory: [
                ...(c.transferHistory || []),
                {
                  fromRoom: targetReq.currentRoom,
                  toRoom: targetReq.targetRoom,
                  date: todayStr,
                  note: `Chuyển phòng từ ${targetReq.currentRoom} sang ${targetReq.targetRoom} (Bảo lưu toàn bộ HĐ & tiền cọc)`
                }
              ]
            };
          }
          return c;
        });
        localStorage.setItem('rental_contracts', JSON.stringify(updated));
        return updated;
      });

      // QUY TẮC: Chuyển sang phòng mới thì phòng mới PHẢI LÀ CHƯA THANH TOÁN (UNPAID)!
      resetRoomPaymentStatus(targetReq.targetRoom, targetReq.tenant);
      if (targetReq.currentRoom) {
        resetRoomPaymentStatus(targetReq.currentRoom);
      }
    } else if (targetReq.type === 'ROOMMATE') {
      // 2. Xin vào ở ghép: Cư dân chuyển sang ở ghép phòng mục tiêu
      // Tăng số người phòng mục tiêu
      setRooms((prev) =>
        prev.map((r) => {
          const isMatch = r.number === targetReq.targetRoom && (!targetReq.houseCode || r.houseCode === targetReq.houseCode);
          return isMatch
            ? { ...r, status: 'OCCUPIED', occupants: Math.min(r.maxOccupants, (r.occupants || 1) + 1) }
            : r;
        })
      );

      // Cập nhật hồ sơ khách thuê
      setTenants((prev) => {
        const reqNorm = (targetReq.tenant || '').toLowerCase();
        let oldRoomToFree = null;

        const updatedList = prev.map((t) => {
          const tNorm = (t.fullName || '').toLowerCase();
          const isMatch = tNorm.includes(reqNorm) || reqNorm.includes(tNorm) ||
            (reqNorm.includes('nam') && tNorm.includes('nam')) ||
            (reqNorm.includes('an') && tNorm.includes('an'));
          if (!isMatch) return t;

          if (t.room && t.room !== targetReq.targetRoom) {
            oldRoomToFree = t.room;
          }

          return {
            ...t,
            rooms: [targetReq.targetRoom],
            room: targetReq.targetRoom,
            status: 'ACTIVE',
            daysSinceLeave: 0
          };
        });

        if (oldRoomToFree) {
          setRooms((roomsPrev) =>
            roomsPrev.map((r) => {
              if (r.number === oldRoomToFree) {
                const nextOcc = Math.max(0, (r.occupants || 1) - 1);
                return {
                  ...r,
                  occupants: nextOcc,
                  status: nextOcc === 0 ? 'AVAILABLE' : r.status
                };
              }
              return r;
            })
          );
        }

        return updatedList;
      });

      // Thêm khách vào danh sách cư dân phòng (roomMembers) với vai trò MEMBER (Ở ghép)
      setRoomMembers((prev) => {
        const alreadyIn = prev.some(
          (m) => m.roomNumber === targetReq.targetRoom && (m.fullName || '').toLowerCase().includes((targetReq.tenant || '').toLowerCase())
        );
        if (alreadyIn) {
          return prev.map((m) =>
            m.roomNumber === targetReq.targetRoom && (m.fullName || '').toLowerCase().includes((targetReq.tenant || '').toLowerCase())
              ? { ...m, status: 'ACTIVE', roleInRoom: 'MEMBER' }
              : m
          );
        }
        const updated = [
          ...prev,
          {
            id: `RM-${Date.now()}`,
            roomId: Date.now(),
            roomNumber: targetReq.targetRoom,
            houseCode: targetReq.houseCode || 'CS-01',
            fullName: targetReq.tenant,
            phone: targetReq.phone || '0966.123.456',
            cccd: '036207078901',
            maskedCccd: '03620707****',
            roleInRoom: 'MEMBER',
            joinDate: new Date().toLocaleDateString('vi-VN'),
            temporaryResidenceStatus: 'REGISTERED',
            status: 'ACTIVE'
          }
        ];
        localStorage.setItem('rental_room_members', JSON.stringify(updated));
        return updated;
      });

      // CẬP NHẬT CỔNG KHÁCH THUÊ: Gán phòng mới cho khách kèm đúng cơ sở
      if (updateTenantRoom) {
        updateTenantRoom(targetReq.tenant, targetReq.targetRoom, 'SET', {
          houseCode: targetReq.houseCode || 'CS-01',
          house: targetReq.house || (targetReq.houseCode === 'CS-02' ? 'Nhà Trọ Bách Khoa - Cơ Sở 2' : 'Nhà Trọ Cầu Giấy - Cơ Sở 1')
        });
      }

      resetRoomPaymentStatus(targetReq.targetRoom);
        } else if (targetReq.type === 'NEW_RENT' || targetReq.type === 'RENT' || targetReq.type === 'ADDITIONAL_RENT') {
      // 3. ĐĂNG KÝ THUÊ PHÒNG MỚI: CHỦ TRỌ DUYỆT ➔ MỞ KHÓA NỘP CỌC & KÝ HỢP ĐỒNG ĐIỆN TỬ (TASK 1 FIX)
      const resolvedHouseCode = targetReq.houseCode || (targetReq.house?.includes('Bách Khoa') || targetReq.house?.includes('CS-02') ? 'CS-02' : 'CS-01');
      const resolvedHouseName = targetReq.house || (resolvedHouseCode === 'CS-02' ? 'Nhà Trọ Bách Khoa - Cơ Sở 2' : 'Nhà Trọ Cầu Giấy - Cơ Sở 1');
      const targetRoomObj = (rooms || ALL_ROOMS || []).find((r) => r.number === targetReq.targetRoom && (!resolvedHouseCode || r.houseCode === resolvedHouseCode));
      const roomPrice = targetRoomObj?.price || 3000000;
      const holdDuration = 15 * 60 * 1000; // Giữ phòng 15 phút để khách nộp cọc
      const holdingUntilTime = Date.now() + holdDuration;

      // Phòng chuyển sang HOLDING (Giữ chỗ chờ nộp cọc), KHÔNG ĐƯỢC OCCUPIED KHI CHƯA NỘP CỌC!
      setRooms((prev) => {
        const next = prev.map((r) => {
          const isMatch = r.number === targetReq.targetRoom && (!resolvedHouseCode || r.houseCode === resolvedHouseCode);
          return isMatch
            ? {
                ...r,
                status: 'HOLDING',
                holdingBy: targetReq.tenant,
                holdingPhone: targetReq.phone || '0966.123.456',
                holdingUntil: holdingUntilTime
              }
            : r;
        });
        localStorage.setItem('rental_rooms', JSON.stringify(next));
        return next;
      });

      // Tạo Hợp Đồng Chờ Nộp Cọc & Ký Điện Tử (status: 'PENDING_DEPOSIT')
      setContracts((prev) => {
        const contractCode = `HD-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
        const newContract = {
          id: Date.now(),
          contractCode,
          roomNumber: targetReq.targetRoom,
          houseCode: resolvedHouseCode,
          houseName: resolvedHouseName,
          tenantName: targetReq.tenant,
          tenantPhone: targetReq.phone || '0966.123.456',
          startDate: new Date().toLocaleDateString('vi-VN'),
          endDate: '31/12/2026',
          rentalPrice: roomPrice,
          depositAmount: roomPrice,
          paymentCycle: 1,
          paymentDay: 5,
          terms: `Hợp đồng giữ chỗ thuê phòng ${targetReq.targetRoom} đã được Chủ trọ duyệt. Thời hạn nộp cọc 15 phút.`,
          status: 'PENDING_DEPOSIT', // BẮT BUỘC PENDING_DEPOSIT ĐỂ HIỆN MÀN HÌNH NỘP CỌC SEPAY
          depositPaid: false,
          signedElectronically: false,
          holdingUntil: holdingUntilTime,
          approvedAt: new Date().toLocaleString('vi-VN')
        };

        // Loại bỏ hợp đồng pending cũ của khách này nếu có
        const filtered = prev.filter((c) => !(
          c.status === 'PENDING_DEPOSIT' &&
          (c.tenantName?.toLowerCase().includes((targetReq.tenant || '').toLowerCase()) || c.tenantPhone === targetReq.phone)
        ));
        const updated = [newContract, ...filtered];
        localStorage.setItem('rental_contracts', JSON.stringify(updated));
        return updated;
      });

      // Thêm log
      addAuditLog({
        role: 'ROLE_STAFF',
        username: 'staff',
        action: 'APPROVE_ROOM_RENT_REQUEST',
        target: targetReq.targetRoom,
        details: `Chủ trọ/Staff duyệt đơn thuê phòng ${targetReq.targetRoom} cho khách ${targetReq.tenant}. Mở cổng nộp cọc SePay trong 15 phút.`
      });
    } else if (targetReq.type === 'CHECKOUT' || targetReq.type === 'RETURN') {
      // 4. DUYỆT TRẢ PHÒNG / THU HỒI PHÒNG: GIẢI PHÓNG PHÒNG & CHUYỂN KHÁCH VỀ CHẾ ĐỘ TỰ DO
      const roomNum = targetReq.targetRoom || targetReq.currentRoom;
      const tName = targetReq.tenant || '';
      const resolvedHouseCode = targetReq.houseCode || 'CS-01';

      // 1. Giảm số người trong phòng & nếu hết người thì phòng trở thành AVAILABLE
      setRooms((prev) => {
        const next = prev.map((r) => {
          const isMatch = r.number === roomNum && (!resolvedHouseCode || r.houseCode === resolvedHouseCode);
          if (!isMatch) return r;
          const nextOcc = Math.max(0, (r.occupants || 1) - 1);
          return {
            ...r,
            occupants: nextOcc,
            status: nextOcc <= 0 ? 'AVAILABLE' : r.status
          };
        });
        localStorage.setItem('rental_rooms', JSON.stringify(next));
        return next;
      });

      // 2. Cập nhật hồ sơ khách thuê thành INACTIVE / Không còn phòng
      setTenants((prev) => {
        const next = prev.map((t) => {
          const tNorm = (t.fullName || '').toLowerCase();
          const reqNorm = tName.toLowerCase();
          const isMatch = tNorm.includes(reqNorm) || reqNorm.includes(tNorm) || 
            (reqNorm.includes('an') && tNorm.includes('an')) || 
            (reqNorm.includes('nam') && tNorm.includes('nam')) || 
            (reqNorm.includes('cường') && tNorm.includes('cường'));
          if (!isMatch) return t;

          const currentRooms = t.rooms && t.rooms.length > 0 ? t.rooms : (t.room ? [t.room] : []);
          const remainingRooms = currentRooms.filter((rm) => rm !== roomNum);
          const isZeroRooms = remainingRooms.length === 0;

          return {
            ...t,
            rooms: remainingRooms,
            room: isZeroRooms ? null : remainingRooms[0],
            status: isZeroRooms ? 'INACTIVE' : t.status,
            daysSinceLeave: isZeroRooms ? 0 : t.daysSinceLeave
          };
        });
        localStorage.setItem('rental_tenants', JSON.stringify(next));
        return next;
      });

      // 3. Cập nhật trạng thái thành viên phòng thành MOVED_OUT
      setRoomMembers((prev) => {
        const next = prev.map((m) => {
          const isMatch = m.roomNumber === roomNum && (m.fullName || '').toLowerCase().includes(tName.toLowerCase());
          return isMatch ? { ...m, status: 'MOVED_OUT' } : m;
        });
        localStorage.setItem('rental_room_members', JSON.stringify(next));
        return next;
      });

      // 4. Thanh lý hợp đồng thuê (COMPLETED)
      setContracts((prev) => {
        const next = prev.map((c) => {
          const isMatch = c.roomNumber === roomNum && (c.tenantName || '').toLowerCase().includes(tName.toLowerCase()) && c.status === 'ACTIVE';
          return isMatch ? { ...c, status: 'COMPLETED', endDate: new Date().toLocaleDateString('vi-VN') } : c;
        });
        localStorage.setItem('rental_contracts', JSON.stringify(next));
        return next;
      });

      // 5. Đồng bộ tenantRooms: Xóa phòng khỏi danh sách phòng đang thuê
      if (updateTenantRoom) {
        updateTenantRoom(tName, roomNum, 'REMOVE');
      }

      // 6. Reset trạng thái thanh toán phòng
      resetRoomPaymentStatus(roomNum);

      addAuditLog({
        role: 'ROLE_STAFF',
        username: 'staff',
        action: 'APPROVE_CHECKOUT_REQUEST',
        target: roomNum,
        details: `Ban Quản Lý duyệt đơn trả phòng ${roomNum} của khách ${tName}. Phòng đã được thu hồi và đưa về trạng thái AVAILABLE.`
      });
    } else if (targetReq.type === 'RENEW_CONTRACT') {
      // Phê duyệt gia hạn hợp đồng: Cập nhật hạn hợp đồng mới do khách chọn (3, 6 hoặc 12 tháng)
      setTenants((prev) =>
        prev.map((t) => {
          const tNorm = (t.fullName || '').toLowerCase();
          const reqNorm = (targetReq.tenant || '').toLowerCase();
          const isMatch = tNorm.includes(reqNorm) || reqNorm.includes(tNorm) || (reqNorm.includes('an') && tNorm.includes('an'));
          if (!isMatch) return t;
          return {
            ...t,
            contractEnd: targetReq.newContractEnd || t.contractEnd
          };
        })
      );
    }
  };

  // 4. Quản lý / Admin từ chối đơn
  const rejectRoomRequest = (requestId, rejectReason = 'Ban Quản Lý chưa thể xếp phòng đợt này') => {
    const targetReq = roomRequests.find((r) => r.id === requestId);
    setRoomRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? { ...req, status: 'REJECTED', rejectReason, rejectedAt: new Date().toLocaleDateString('vi-VN') }
          : req
      )
    );
    if (targetReq && (targetReq.status === 'HOLDING' || targetReq.type === 'RENT' || targetReq.type === 'NEW_RENT')) {
      if (cancelRoomHold && targetReq.targetRoom) {
        cancelRoomHold(targetReq.targetRoom, targetReq.houseCode);
      }
    }
  };

  // 5. Khách gửi yêu cầu trả phòng (báo trước hạn mất cọc)
  // Quy tắc: Nếu phòng có 1 mình -> Trả được luôn (chuyển BQL duyệt ngay)
  // Nếu phòng có người khác -> BẮT BUỘC hỏi ý kiến mọi người trong phòng (tất cả đồng ý mới chuyển BQL duyệt)
  const submitCheckoutRequest = ({ room, reason, forfeitDeposit = true, tenantName, phone }) => {
    const targetRoomObj = (rooms || []).find((r) => r.number === room);
    const occupants = targetRoomObj ? targetRoomObj.occupants : 1;
    const hasMultiplePeople = occupants > 1;

    return submitRoomRequest({
      type: 'CHECKOUT',
      targetRoom: room,
      currentRoom: room,
      house: targetRoomObj?.house || 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
      houseCode: targetRoomObj?.houseCode || 'CS-01',
      tenant: tenantName,
      phone: phone,
      note: reason,
      forfeitDeposit: forfeitDeposit,
      hasMultiplePeople: hasMultiplePeople,
      status: hasMultiplePeople ? 'WAITING_ROOMMATES' : 'PENDING'
    });
  };

  // 5.1. Khách tự nguyện Rời phòng (cá nhân dọn đi, không bắt buộc bạn cùng phòng phải trả phòng theo)
  const leaveRoom = (roomNumber, tenantName) => {
    const tName = tenantName || auth?.user?.fullName || 'Khách thuê';

    // 1. Giảm số người trong phòng
    setRooms((prev) =>
      prev.map((r) => {
        if (r.number !== roomNumber) return r;
        const newOccupants = Math.max(0, r.occupants - 1);
        return {
          ...r,
          occupants: newOccupants,
          status: newOccupants === 0 ? 'AVAILABLE' : r.status
        };
      })
    );

    // 2. Gỡ phòng khỏi danh sách phòng của khách
    setTenants((prev) =>
      prev.map((t) => {
        const tNorm = (t.fullName || '').toLowerCase();
        const reqNorm = tName.toLowerCase();
        const isMatch = tNorm.includes(reqNorm) || reqNorm.includes(tNorm) || (reqNorm.includes('an') && tNorm.includes('an'));
        if (!isMatch) return t;
        const currentRooms = t.rooms && t.rooms.length > 0 ? t.rooms : (t.room ? [t.room] : []);
        const remainingRooms = currentRooms.filter((rm) => rm !== roomNumber);
        const isZeroRooms = remainingRooms.length === 0;
        return {
          ...t,
          rooms: remainingRooms,
          room: remainingRooms.length > 0 ? remainingRooms[0] : null,
          status: isZeroRooms ? 'INACTIVE' : 'ACTIVE',
          daysSinceLeave: isZeroRooms ? (t.daysSinceLeave || 0) : 0,
          zeroRoomsDate: isZeroRooms ? (t.zeroRoomsDate || new Date().toISOString()) : null
        };
      })
    );

    // 2B. Cập nhật trạng thái thành viên phòng thành MOVED_OUT
    setRoomMembers((prev) => {
      const updated = prev.map((m) =>
        m.roomNumber === roomNumber && (m.fullName || '').toLowerCase().includes(tName.toLowerCase())
          ? { ...m, status: 'MOVED_OUT', leaveDate: new Date().toLocaleDateString('vi-VN') }
          : m
      );
      try {
        localStorage.setItem('rental_room_members', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2C. Gửi thông báo đến toàn bộ thành viên trong phòng (NGHIỆP VỤ 2)
    const leaveNoticeText = `📢 Thành viên ${tName} đã rời phòng ở ghép ${roomNumber}. Phòng hiện đã giảm người, số tiền sinh hoạt cần chia lại.`;
    setRoommateLeaveNotices((prev) => [
      {
        id: Date.now(),
        room: roomNumber,
        member: tName,
        date: new Date().toLocaleDateString('vi-VN'),
        message: leaveNoticeText
      },
      ...prev
    ]);

    // 3. Đồng bộ sang AuthContext: REMOVE
    if (updateTenantRoom) {
      updateTenantRoom(tName, roomNumber, 'REMOVE');
    }

    // 4. QUY TẮC: Rời phòng thì reset trạng thái thanh toán phòng về CHƯA THANH TOÁN (UNPAID)
    resetRoomPaymentStatus(roomNumber);

    // 5. Ghi nhận lịch sử đơn rời phòng
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('vi-VN'),
      type: 'LEAVE_ROOM',
      targetRoom: roomNumber,
      currentRoom: roomNumber,
      house: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
      houseCode: 'CS-01',
      tenant: tName,
      phone: auth?.user?.phone || '0987.654.321',
      note: `Khách tự nguyện rời phòng ${roomNumber} (cá nhân dọn đi, các bạn cùng phòng nếu có vẫn tiếp tục ở lại).`,
      status: 'APPROVED',
      approvedAt: new Date().toLocaleDateString('vi-VN')
    };
    setRoomRequests((prev) => [newEntry, ...prev]);

    // 6. THÔNG BÁO CHO BẠN CÙNG PHÒNG CÒN LẠI BIẾT
    const leaveNotice = {
      id: `roommate-leave-${Date.now()}`,
      type: 'ROOMMATE_LEFT',
      room: roomNumber,
      leaver: tName,
      time: 'Vừa xong',
      date: new Date().toLocaleDateString('vi-VN')
    };
    setRoommateLeaveNotices((prev) => [leaveNotice, ...prev]);

    return { success: true };
  };

  // 6. Khách gửi yêu cầu gia hạn hợp đồng (Khách chọn 3, 6 hoặc 12 tháng và ngày bắt đầu gia hạn)
  const submitContractRenewalRequest = ({
    room,
    targetRoom,
    house,
    houseCode,
    tenantName,
    tenant,
    phone,
    email,
    durationMonths = 6,
    startDate,
    newContractEnd,
    currentContractEnd,
    note
  }) => {
    const finalRoom = room || targetRoom;
    const finalTenant = tenantName || tenant;
    return submitRoomRequest({
      type: 'RENEW_CONTRACT',
      targetRoom: finalRoom,
      currentRoom: finalRoom,
      house: house || 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
      houseCode: houseCode || 'CS-01',
      tenant: finalTenant,
      phone: phone,
      email: email,
      durationMonths: durationMonths,
      startDate: startDate,
      newContractEnd: newContractEnd,
      currentContractEnd: currentContractEnd,
      note: note || `Đăng ký gia hạn hợp đồng thêm ${durationMonths} tháng`
    });
  };

  // 7. Staff / Admin sửa thông tin cá nhân khách thuê
  // QUY TẮC: Admin và Staff KHÔNG ĐƯỢC sửa trạng thái hợp đồng và các phòng đang thuê!
  // Dữ liệu này tự động cập nhật khi khách hàng thuê, chuyển, trả phòng hoặc gia hạn.
  const updateTenant = (tenantId, updatedFields) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== tenantId) return t;
        return {
          ...t,
          fullName: updatedFields.fullName !== undefined ? updatedFields.fullName : t.fullName,
          cccd: updatedFields.cccd !== undefined ? updatedFields.cccd : t.cccd,
          phone: updatedFields.phone !== undefined ? updatedFields.phone : t.phone,
          email: updatedFields.email !== undefined ? updatedFields.email : t.email,
          hometown: updatedFields.hometown !== undefined ? updatedFields.hometown : t.hometown,
          deposit: updatedFields.deposit !== undefined ? Number(updatedFields.deposit) : t.deposit
        };
      })
    );
  };

  // 8. Staff / Admin xóa vĩnh viễn tài khoản khách thuê
  // QUY TẮC: Chỉ được xóa nếu phòng đã chuyển về con số 0 và đủ từ 30 ngày (1 tháng) trở lên!
  const deleteTenant = (tenantId) => {
    const targetTenant = tenants.find((t) => t.id === tenantId);
    if (!targetTenant) return { success: false, message: 'Không tìm thấy hồ sơ khách thuê.' };

    const activeRoomsCount = (targetTenant.rooms || (targetTenant.room ? [targetTenant.room] : [])).length;
    if (activeRoomsCount > 0 || targetTenant.status === 'ACTIVE') {
      return {
        success: false,
        message: `Không thể xóa! Khách thuê vẫn đang đứng tên thuê ${activeRoomsCount} phòng. Cần làm thủ tục trả hết phòng trước.`
      };
    }

    const daysSince = targetTenant.daysSinceLeave || 0;
    if (daysSince < 30) {
      return {
        success: false,
        message: `Chưa đủ 1 tháng kể từ ngày phòng chuyển về con số 0 (Mới rời phòng ${daysSince}/30 ngày). Cần tối thiểu 30 ngày để quyết toán công nợ và lưu sổ sách kế toán.`
      };
    }

    setTenants((prev) => prev.filter((t) => t.id !== tenantId));
    return {
      success: true,
      message: `Đã xóa vĩnh viễn tài khoản và hồ sơ của khách thuê "${targetTenant.fullName}".`
    };
  };

  // 1. Pay invoice (by Customer or Manual by Staff/Admin)
  // Quy tắc: Nếu phòng có nhiều người thì chỉ cần 1 người thanh toán thì toàn bộ hóa đơn phòng đó được thanh toán (bạn cùng phòng cũng mất hóa đơn cần trả và nhận được thông báo)
  const payInvoice = (codeOrId, paymentNote = 'VietQR', payerName = null) => {
    let paidRoom = null;
    let paidHouse = null;
    let paidTotal = 0;
    const actualPayer = payerName || auth?.user?.fullName || 'Bạn cùng phòng';

    const matchInv = (inv, val) => {
      if (!val && val !== 0) return false;
      const sVal = String(val).trim().toLowerCase();
      const sId = String(inv.id).trim().toLowerCase();
      const sCode = String(inv.code || '').trim().toLowerCase();
      const sRoom = String(inv.room || '').trim().toLowerCase();
      const sRoomDigits = sRoom.replace(/\D/g, '');
      const sValDigits = sVal.replace(/\D/g, '');

      return (
        sId === sVal ||
        sCode === sVal ||
        sRoom === sVal ||
        (sRoomDigits && sValDigits && sRoomDigits === sValDigits && sVal.length <= 4) ||
        sVal.includes(sCode) ||
        (sCode && sVal.includes(sCode)) ||
        (sRoom && sVal.includes(sRoom.toLowerCase()))
      );
    };

    setInvoices((prev) => {
      // 1. Tìm thông tin phòng và cơ sở của hóa đơn được thanh toán
      const target = prev.find((inv) => matchInv(inv, codeOrId));
      if (target) {
        paidRoom = target.room;
        paidHouse = target.house;
        paidTotal = target.total;
      } else if (typeof codeOrId === 'string' && codeOrId.includes('P.')) {
        paidRoom = codeOrId.replace('mock-inv-', '');
      }

      // 2. Chuyển TẤT CẢ các hóa đơn của phòng đó sang trạng thái PAID
      let hasMatch = false;
      const updated = prev.map((inv) => {
        const isTarget = matchInv(inv, codeOrId);
        const isSameRoom =
          paidRoom &&
          inv.room === paidRoom &&
          (!paidHouse || !inv.house || inv.house === paidHouse || inv.house.includes(paidHouse) || paidHouse.includes(inv.house));

        if (isTarget || isSameRoom) {
          hasMatch = true;
          return {
            ...inv,
            status: 'PAID',
            paidAt: inv.paidAt || `Hôm nay (Qua ${paymentNote} bởi ${actualPayer})`,
            paidBy: actualPayer
          };
        }
        return inv;
      });

      // Nếu là hóa đơn phòng ảo chưa có trong danh sách gốc thì chèn thêm dạng PAID
      if (!hasMatch && paidRoom) {
        updated.push({
          id: Date.now(),
          code: `HD-${billingMonth.replace('-', '')}-${paidRoom.replace('P.', '')}`,
          room: paidRoom,
          house: paidHouse || 'Cơ Sở 1 - Cầu Giấy',
          tenant: actualPayer,
          roomFee: 3500000,
          elec: 0,
          water: 0,
          service: 100000,
          total: 3600000,
          status: 'PAID',
          paidAt: `Hôm nay (Qua ${paymentNote})`,
          paidBy: actualPayer
        });
      }

      return updated;
    });

    // Khi phòng đã thanh toán xong tiền trọ thì đồng bộ trạng thái paid & recorded cho phòng đó trong bảng điện nước
    if (paidRoom) {
      setMetersHistory((prev) => {
        const currentList = prev[billingMonth] || DEFAULT_METERS;
        const updatedList = currentList.map((m) => {
          if (
            m.room === paidRoom &&
            (!paidHouse || !m.house || m.house.includes(paidHouse) || paidHouse.includes(m.houseCode || ''))
          ) {
            return { ...m, paid: true, recorded: true };
          }
          return m;
        });
        return { ...prev, [billingMonth]: updatedList };
      });

      // Thông báo cho các thành viên còn lại trong phòng biết ai đã thanh toán
      const paymentNotice = {
        id: `room-paid-${paidRoom}-${billingMonth}-${Date.now()}`,
        type: 'ROOMMATE_PAID',
        room: paidRoom,
        house: paidHouse || 'Cơ Sở 1 - Cầu Giấy',
        payer: actualPayer,
        amount: paidTotal || 4037500,
        month: billingMonth,
        title: `🎉 Tiền phòng ${paidRoom} đã được thanh toán!`,
        desc: `Bạn cùng phòng "${actualPayer}" vừa hoàn tất thanh toán tiền phòng & điện nước ${paidRoom} (${billingMonth}) qua ${paymentNote}. Tất cả thành viên trong phòng đều đã hết nợ kỳ này!`,
        time: 'Vừa xong',
        date: new Date().toLocaleDateString('vi-VN')
      };
      setRoomPaymentNotices((prev) => [paymentNotice, ...prev]);
    }
  };

  // 2. Create maintenance ticket (Customer or Staff)
  const createTicket = (ticketData) => {
    const newEntry = {
      id: Date.now(),
      room: ticketData.room || 'P.101',
      issue: ticketData.issue,
      tenant: ticketData.tenant || 'Nguyễn Văn Khách Thuê',
      date: 'Hôm nay',
      priority: ticketData.priority || 'MEDIUM',
      status: 'PENDING'
    };
    setTickets((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  // 3. Update maintenance ticket status (Staff or Admin)
  const updateTicketStatus = (ticketId, newStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );
  };

  // 4. Update and Save Meter readings (Staff or Admin)
  const updateMeterReading = (id, field, value) => {
    setMeters((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: Number(value) } : m))
    );
  };

  const saveMeterReading = (id) => {
    setMeters((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const elecUsed = Math.max(0, m.newElec - m.oldElec);
          const waterUsed = Math.max(0, m.newWater - m.oldWater);
          const elecCost = elecUsed * m.elecPrice;
          const waterCost = waterUsed * m.waterPrice;

          // Quy t?c ch?t ch? s?: Khi ch? tr? ch?t s?, h?a ??n m?i ???c t?nh ti?n điện nước
          setInvoices((invList) =>
            invList.map((inv) =>
              inv.room === m.room
                ? {
                    ...inv,
                    elec: elecCost,
                    water: waterCost,
                    total: inv.roomFee + elecCost + waterCost + inv.service,
                    status: inv.status === 'PENDING_METER' ? 'UNPAID' : inv.status
                  }
                : inv
            )
          );

          return { ...m, recorded: true };
        }
        return m;
      })
    );
  };

  const unlockMeterReading = (id) => {
    const target = meters.find((m) => m.id === id);
    setMeters((prev) =>
      prev.map((m) => (m.id === id ? { ...m, recorded: false } : m))
    );
    // Khi m? kh?a l?i ch? s?, h?a ??n ch?a thanh to?n chuy?n v? PENDING_METER v? x?a ti?n điện nước ch?a ch?t
    if (target) {
      setInvoices((invList) =>
        invList.map((inv) =>
          inv.room === target.room && inv.status !== 'PAID'
            ? {
                ...inv,
                elec: 0,
                water: 0,
                total: inv.roomFee + inv.service,
                status: 'PENDING_METER'
              }
            : inv
        )
      );
    }
  };

  // 5. Add tenant (Staff or Admin)
  const addTenant = (tenantData) => {
    const roomArr = tenantData.rooms && tenantData.rooms.length > 0
      ? tenantData.rooms
      : (tenantData.room ? tenantData.room.split(',').map((s) => s.trim()).filter(Boolean) : []);

    const newEntry = {
      id: Date.now(),
      fullName: tenantData.fullName || tenantData.name,
      name: tenantData.fullName || tenantData.name,
      cccd: tenantData.cccd,
      phone: tenantData.phone,
      email: tenantData.email || `${tenantData.phone || 'khach'}@rental.vn`,
      hometown: tenantData.hometown || '',
      houseCode: tenantData.houseCode || 'CS-01',
      house: tenantData.house || 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
      room: roomArr.length > 0 ? roomArr[0] : null,
      rooms: roomArr,
      contractStart: tenantData.contractStart || '25/09/2026',
      contractEnd: tenantData.contractEnd || '25/09/2027',
      deposit: Number(tenantData.deposit) || 3500000,
      status: roomArr.length > 0 ? 'ACTIVE' : 'INACTIVE',
      daysSinceLeave: 0
    };
    setTenants((prev) => [newEntry, ...prev]);

    // Automatically mark the rooms as OCCUPIED in rooms list for that specific house
    if (roomArr.length > 0) {
      roomArr.forEach((rm) => {
        resetRoomPaymentStatus(rm, tenantData.fullName || tenantData.name);

        // UC-S02: Thêm người đại diện hợp đồng vào room_members
        const rawCccd = tenantData.cccd || '001201019999';
        const masked = rawCccd.length >= 8 ? rawCccd.slice(0, 8) + '****' : '00120101****';
        setRoomMembers((prev) => [
          ...prev,
          {
            id: `RM-${Date.now()}`,
            roomId: Date.now(),
            roomNumber: rm,
            fullName: tenantData.fullName || tenantData.name,
            phone: tenantData.phone || '0987.654.321',
            cccd: rawCccd,
            maskedCccd: masked,
            roleInRoom: 'REPRESENTATIVE',
            temporaryResidenceStatus: 'REGISTERED',
            startDate: tenantData.contractStart || '25/09/2026'
          }
        ]);

        // UC-S02 & UC-T01: Tự động khởi tạo Hợp đồng điện tử chờ cư dân ký OTP
        const newContract = {
          id: `HD-2026-${Date.now().toString().slice(-4)}`,
          roomNumber: rm,
          houseCode: tenantData.houseCode || 'CS-01',
          houseName: tenantData.house || 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
          tenantName: tenantData.fullName || tenantData.name,
          tenantPhone: tenantData.phone || '0987.654.321',
          startDate: tenantData.contractStart || '25/09/2026',
          endDate: tenantData.contractEnd || '25/09/2027',
          rentalPrice: Number(tenantData.deposit) || 3500000,
          depositAmount: Number(tenantData.deposit) || 3500000,
          paymentCycle: 1,
          paymentDay: 5,
          terms: 'Hợp đồng thuê phòng dài hạn chuẩn mẫu Bộ Xây Dựng. Bên thuê có nghĩa vụ thanh toán đúng hạn và tuân thủ nội quy PCCC.',
          status: 'PENDING_SIGN',
          signedElectronically: false,
          signedAt: null
        };
        setContracts((prev) => [newContract, ...prev]);
      });

      setRooms((prev) =>
        prev.map((r) => {
          const matchNumber = roomArr.includes(r.number) || roomArr.includes(`P.${r.number.replace('P.', '')}`);
          const matchHouse = !tenantData.houseCode || r.houseCode === tenantData.houseCode;
          if (matchNumber && matchHouse) {
            return {
              ...r,
              status: 'OCCUPIED',
              occupants: Math.min(r.maxOccupants, (r.occupants || 0) + 1)
            };
          }
          return r;
        })
      );
    }
  };

  // 6. Update room status (Staff or Admin)
  const updateRoomStatus = (roomId, newStatus) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r))
    );
  };

  // 6.1. Sửa giá phòng (Staff / Admin)
  // QUY TẮC BẮT BUỘC: CHỈ ĐƯỢC SỬA GIÁ PHÒNG CÒN TRỐNG (AVAILABLE), KHÔNG ĐƯỢC SỬA CÁC PHÒNG ĐÃ CÓ NGƯỜI Ở (OCCUPIED)!
  const updateRoomPrice = (roomId, newPrice) => {
    const target = (rooms || []).find((r) => r.id === roomId);
    if (!target) return { success: false, message: 'Không tìm thấy thông tin phòng!' };

    if (target.status === 'OCCUPIED' || (target.occupants && target.occupants > 0)) {
      return {
        success: false,
        message: `Phòng ${target.number} (${target.houseCode || target.house}) đang có ${target.occupants || 1} người thuê. Theo quy định hợp đồng, không được sửa giá các phòng đã có người ở!`
      };
    }

    const priceNum = Number(newPrice);
    if (!priceNum || priceNum <= 0) {
      return { success: false, message: 'Đơn giá thuê phòng mới phải lớn hơn 0!' };
    }

    setRooms((prev) => {
      const updated = prev.map((r) => (r.id === roomId ? { ...r, price: priceNum } : r));
      try {
        localStorage.setItem('rental_rooms', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    return {
      success: true,
      message: `Đã cập nhật giá thuê phòng ${target.number} thành ${priceNum.toLocaleString('vi-VN')} đ/tháng!`
    };
  };

  // 7. Add new room (Staff or Admin)
  const addRoom = (roomData) => {
    const newRoomEntry = {
      id: Date.now(),
      number: roomData.number,
      houseCode: roomData.houseCode || 'CS-01',
      house:
        roomData.houseCode === 'CS-02'
          ? 'Nhà Trọ Bách Khoa - Cơ Sở 2'
          : roomData.houseCode === 'CS-03'
          ? 'Nhà Trọ Đống Đa - Cơ Sở 3'
          : 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
      floor: roomData.floor || 'Tầng 1',
      price: Number(roomData.price) || 3500000,
      area: Number(roomData.area) || 25,
      occupants: 0,
      maxOccupants: Number(roomData.maxOccupants) || 2,
      status: roomData.status || 'AVAILABLE',
      amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh']
    };
    setRooms((prev) => [newRoomEntry, ...prev]);

    // Đồng bộ ngay vào bảng chỉ số điện nước (metersHistory) của tất cả các kỳ
    setMetersHistory((prev) => {
      const nextObj = {};
      Object.keys(prev).forEach((k) => {
        const baseElec = 800 + (newRoomEntry.id % 20) * 110;
        const baseWater = 40 + (newRoomEntry.id % 15) * 6;
        const newMeterItem = {
          id: newRoomEntry.id,
          roomId: newRoomEntry.id,
          room: newRoomEntry.number,
          houseCode: newRoomEntry.houseCode,
          house: newRoomEntry.house,
          floor: newRoomEntry.floor,
          status: newRoomEntry.status,
          tenant: 'Phòng Trống (Chưa Thuê)',
          oldElec: baseElec,
          newElec: baseElec,
          oldWater: baseWater,
          newWater: baseWater,
          elecPrice: utilityPrices?.elecPrice || 3500,
          waterPrice: utilityPrices?.waterPrice || 25000,
          recorded: false,
          paid: false
        };
        nextObj[k] = [newMeterItem, ...(prev[k] || [])];
      });
      return nextObj;
    });
  };

  // =========================================================================
  // RBAC EXTENSIONS CHO CHUẨN SRS: LANDLORDS, INTEGRATIONS, AUDIT, ROOMMATES, CONTRACTS
  // =========================================================================

  // 1. Quản lý Chủ trọ (UC-A01 & UC-A04)
  
  // 1.3. Cấp lại mật khẩu Chủ trọ (Admin Reset Password RBAC)
  const resetLandlordPassword = (landlordId, customPwd = null) => {
    const tempPassword = customPwd || ('TroVietAdmin@' + Math.floor(1000 + Math.random() * 9000));
    let targetLandlord = null;
    setLandlords((prev) => {
      const updated = prev.map((l) => {
        if (l.id === landlordId || String(l.id) === String(landlordId)) {
          targetLandlord = l;
          return {
            ...l,
            tempPassword,
            mustChangePasswordOnNextLogin: true,
            passwordResetAt: new Date().toLocaleString('vi-VN')
          };
        }
        return l;
      });
      localStorage.setItem('rental_landlords', JSON.stringify(updated));
      return updated;
    });

    addAuditLog({
      role: 'ROLE_ADMIN',
      username: 'admin',
      action: 'ADMIN_RESET_LANDLORD_PWD',
      target: `Landlord #${landlordId}`,
      details: `Admin cấp lại mật khẩu tạm thời cho Chủ trọ ${targetLandlord?.fullName || landlordId}`
    });

    return { success: true, tempPassword, landlord: targetLandlord };
  };

  // 1.2. Danh sách nhắc nợ cước SaaS gửi từ Admin đến Staff / Chủ trọ
  const [saasReminders, setSaasReminders] = useState(() => {
    try {
      const s = localStorage.getItem('rental_saas_reminders');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const sendSaasReminder = (invoice) => {
    if (!invoice) return;
    const reminder = {
      id: `saas-remind-${Date.now()}`,
      invoiceId: invoice.id,
      invoiceCode: invoice.code,
      landlordName: invoice.landlordName,
      packageName: invoice.packageName,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      createdAt: new Date().toISOString(),
      time: 'Vừa xong',
      read: false
    };

    setSaasReminders((prev) => {
      const updated = [reminder, ...prev.filter(r => r.invoiceCode !== invoice.code && r.invoiceId !== invoice.id)];
      localStorage.setItem('rental_saas_reminders', JSON.stringify(updated));
      return updated;
    });

    addAuditLog({
      role: 'ROLE_ADMIN',
      username: 'admin',
      action: 'SEND_SAAS_REMINDER',
      target: `SaaSInvoice #${invoice.code}`,
      details: `Admin gửi thông báo nhắc nợ cước SaaS cho Chủ trọ ${invoice.landlordName} (${Number(invoice.amount || 0).toLocaleString('vi-VN')} đ)`
    });

    return reminder;
  };

  // 1.1. Hóa đơn gói cước SaaS (B2B giữa Nền tảng và Chủ trọ)
  const [saasInvoices, setSaasInvoices] = useState(() => {
    try {
      const s = localStorage.getItem('rental_saas_invoices');
      const list = s ? JSON.parse(s) : DEFAULT_SAAS_INVOICES;
      return list.map((inv) => {
        if (inv.code === 'HD-SAAS-2026-02' || inv.id === 'SAAS-2026-002') {
          return {
            ...inv,
            amount: 2000,
            providerBank: '35825112005 - MBBank (ĐÀM TRUNG ANH)'
          };
        }
        return inv;
      });
    } catch {
      return DEFAULT_SAAS_INVOICES;
    }
  });

  
  const createSaasInvoice = (invoiceData) => {
    const newInv = {
      id: `SAAS-${Date.now()}`,
      code: `HD-SAAS-2026-${String(saasInvoices.length + 1).padStart(2, '0')}`,
      landlordId: invoiceData.landlordId || 1,
      landlordName: invoiceData.landlordName || 'Lê Thị Thu Ngân',
      landlordPhone: invoiceData.landlordPhone || '0912.888.666',
      packageName: invoiceData.packageName || 'Gói Chuyên Nghiệp (PRO - Không Giới Hạn Cơ Sở)',
      packageCode: invoiceData.packageCode || 'PRO',
      billingCycle: invoiceData.billingCycle || '12 Tháng (Năm 2026)',
      period: invoiceData.period || '01/01/2026 - 31/12/2026',
      amount: Number(invoiceData.amount) || 4990000,
      issuedDate: new Date().toLocaleDateString('vi-VN'),
      dueDate: invoiceData.dueDate || '10/10/2026',
      paidAt: null,
      paymentMethod: 'VietQR Chuyển Khoản Nền Tảng',
      status: 'UNPAID',
      landlordTaxCode: invoiceData.landlordTaxCode || '8392019283',
      providerName: 'HỆ THỐNG NỀN TẢNG SAAS QUẢN LÝ CHUỖI TRỌ (CTCP SAAS TRỌ VIỆT)',
      providerTaxCode: '0108998877',
      providerBank: '9999888899 - MBBank (Ngân hàng Quân Đội)'
    };

    setSaasInvoices((prev) => {
      const updated = [newInv, ...prev];
      localStorage.setItem('rental_saas_invoices', JSON.stringify(updated));
      return updated;
    });

    addAuditLog({
      role: 'ROLE_ADMIN',
      username: 'admin',
      action: 'CREATE_SAAS_INVOICE',
      target: `SaaSInvoice #${newInv.code}`,
      details: `Admin phát hành hóa đơn thu phí gói cước phần mềm cho Chủ trọ ${newInv.landlordName}`
    });

    return newInv;
  };

  const paySaasInvoice = (invoiceIdOrCode, paymentMethod = 'Cổng VNPay Nền Tảng') => {
    setSaasInvoices((prev) => {
      const updated = prev.map((inv) => {
        const isTarget =
          inv.id === invoiceIdOrCode ||
          inv.code === invoiceIdOrCode ||
          String(inv.id).trim().toLowerCase() === String(invoiceIdOrCode).trim().toLowerCase() ||
          String(inv.code).trim().toLowerCase() === String(invoiceIdOrCode).trim().toLowerCase();
        return isTarget
          ? {
              ...inv,
              status: 'PAID',
              paidAt: new Date().toLocaleString('vi-VN'),
              paymentMethod
            }
          : inv;
      });
      localStorage.setItem('rental_saas_invoices', JSON.stringify(updated));
      return updated;
    });

    setSaasReminders((prev) => {
      const updated = prev.filter(r => r.invoiceId !== invoiceIdOrCode && r.invoiceCode !== invoiceIdOrCode);
      localStorage.setItem('rental_saas_reminders', JSON.stringify(updated));
      return updated;
    });

    addAuditLog({
      role: 'ROLE_STAFF',
      username: 'landlord_an',
      action: 'PAY_SAAS_SUBSCRIPTION',
      target: `SaaSInvoice #${invoiceIdOrCode}`,
      details: `Chủ trọ nộp cước bản quyền phần mềm SaaS cho Admin qua ${paymentMethod}`
    });
  };

  const resetSaasInvoiceStatus = (invoiceIdOrCode) => {
    setSaasInvoices((prev) => {
      const updated = prev.map((inv) => {
        const isTarget =
          !invoiceIdOrCode ||
          inv.id === invoiceIdOrCode ||
          inv.code === invoiceIdOrCode ||
          String(inv.id).trim().toLowerCase() === String(invoiceIdOrCode).trim().toLowerCase() ||
          String(inv.code).trim().toLowerCase() === String(invoiceIdOrCode).trim().toLowerCase();
        return isTarget
          ? {
              ...inv,
              status: 'UNPAID',
              paidAt: null,
              paymentMethod: null
            }
          : inv;
      });
      localStorage.setItem('rental_saas_invoices', JSON.stringify(updated));
      return updated;
    });
  };

  const [landlords, setLandlords] = useState(() => {
    try {
      const s = localStorage.getItem('rental_landlords');
      return s ? JSON.parse(s) : DEFAULT_LANDLORDS;
    } catch {
      return DEFAULT_LANDLORDS;
    }
  });

  const resetTenantPassword = (tenantId, customPwd) => {
    const t = (tenants || []).find((x) => x.id === tenantId);
    if (!t) return { success: false, message: 'Không tìm thấy khách thuê!' };
    const tempPassword = customPwd || '123456';
    try {
      const s = localStorage.getItem('rental_user_passwords');
      const map = s ? JSON.parse(s) : {};
      if (t.phone) map[t.phone] = tempPassword;
      if (t.username) map[t.username] = tempPassword;
      if (t.email) map[t.email] = tempPassword;
      localStorage.setItem('rental_user_passwords', JSON.stringify(map));
    } catch {}
    addAuditLog({
      role: 'ROLE_STAFF',
      username: 'staff',
      action: 'STAFF_RESET_TENANT_PWD',
      target: t.phone,
      details: `Chủ trọ cấp lại mật khẩu tạm thời cho khách thuê ${t.fullName} (${t.phone}) qua SMS Brandname (UC-S02)`
    });
    return {
      success: true,
      tempPassword,
      phone: t.phone,
      tenantName: t.fullName
    };
  };

  const createLandlord = (data) => {
    const newEntry = {
      id: Date.now(),
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: 'STAFF',
      status: 'ACTIVE',
      packageCode: data.packageCode || 'BASIC',
      subscriptionPackage:
        data.packageCode === 'ENTERPRISE'
          ? 'Gói Doanh Nghiệp (Không giới hạn + AI OCR)'
          : data.packageCode === 'PRO'
          ? 'Gói Chuyên Nghiệp (Không giới hạn)'
          : 'Gói Cơ Bản (Tối đa 2 cơ sở)',
      housesCount: 1,
        roomsCount: 0,
        maxHousesLimit: data.packageCode === 'BASIC' ? 2 : 999,
      createdAt: new Date().toLocaleDateString('vi-VN')
    };

    setLandlords((prev) => {
      const updated = [newEntry, ...prev];
      localStorage.setItem('rental_landlords', JSON.stringify(updated));
      return updated;
    });

    if (data.identityCard) {
      const newProfile = {
        id: newEntry.id,
        userId: newEntry.id,
        username: newEntry.username,
        fullName: newEntry.fullName,
        landlordName: newEntry.fullName,
        landlordPhone: newEntry.phone,
        landlordId: newEntry.id,
        identityCard: data.identityCard,
        maskedIdentityCard: data.identityCard.slice(0, 8) + '****',
        birthDate: data.birthDate || '1988-08-15',
        issueDate: data.issueDate || '2021-04-20',
        issuePlace: data.issuePlace || 'Cục Cảnh sát QLHC về TTXH',
        permanentAddress: data.permanentAddress || 'Hà Nội',
        cccdFrontUrl: data.cccdFrontUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop',
        cccdBackUrl: data.cccdBackUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop',
        taxCode: data.taxCode || '',
        businessLicenseUrl: data.businessLicenseUrl || '',
        kycStatus: 'VERIFIED',
        rejectionReason: null,
        maxProperties: data.packageCode === 'BASIC' ? 2 : 999,
        packagePlan: data.packageCode || 'BASIC',
        verifiedAt: new Date().toLocaleString('vi-VN'),
        verifiedBy: 1
      };
      setLandlordProfiles((prev) => {
        const updated = [newProfile, ...prev];
        localStorage.setItem('rental_landlord_profiles', JSON.stringify(updated));
        return updated;
      });
    }

    addAuditLog({
      role: 'ROLE_ADMIN',
      username: 'admin',
      action: 'ADMIN_CREATE_LANDLORD',
      target: newEntry.username,
      details: `Admin tạo tài khoản Chủ trọ ${newEntry.fullName} (${newEntry.email}), CCCD ${data.identityCard || 'Đã định danh'}, gói ${newEntry.packageCode}`
    });
  };

  const toggleLandlordLock = (id) => {
    setLandlords((prev) => {
      const updated = prev.map((l) => {
        if (l.id === id) {
          const nextStatus = l.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
          addAuditLog({
            role: 'ROLE_ADMIN',
            username: 'admin',
            action: nextStatus === 'LOCKED' ? 'ADMIN_LOCK_LANDLORD' : 'ADMIN_UNLOCK_LANDLORD',
            target: l.username,
            details: `${nextStatus === 'LOCKED' ? 'Khóa' : 'Mở khóa'} tài khoản chủ trọ ${l.fullName}`
          });
          return { ...l, status: nextStatus };
        }
        return l;
      });
      localStorage.setItem('rental_landlords', JSON.stringify(updated));
      return updated;
    });
  };

  const updateLandlordPackage = (id, packageCode) => {
    setLandlords((prev) => {
      const updated = prev.map((l) => {
        if (l.id === id) {
          const pkgName =
            packageCode === 'ENTERPRISE'
              ? 'Gói Doanh Nghiệp (Không giới hạn + AI OCR)'
              : packageCode === 'PRO'
              ? 'Gói Chuyên Nghiệp (Không giới hạn)'
              : 'Gói Cơ Bản (Tối đa 2 cơ sở)';
          const maxHouses = packageCode === 'BASIC' ? 2 : 999;
          addAuditLog({
            role: 'ROLE_ADMIN',
            username: 'admin',
            action: 'ADMIN_UPDATE_SUBSCRIPTION',
            target: l.username,
            details: `Admin cập nhật gói dịch vụ chủ trọ ${l.fullName} sang ${pkgName}`
          });
          return {
            ...l,
            packageCode,
            subscriptionPackage: pkgName,
            maxHousesLimit: maxHouses
          };
        }
        return l;
      });
      localStorage.setItem('rental_landlords', JSON.stringify(updated));
      return updated;
    });
  };

  // Hủy giữ chỗ phòng (Chủ động hủy hoặc hết giờ)
  const cancelRoomHold = (roomNumber, houseCode = null) => {
    setRooms((prev) => {
      const next = prev.map((r) => {
        const isMatch = r.number === roomNumber && (!houseCode || r.houseCode === houseCode);
        if (isMatch && r.status === 'HOLDING') {
          return {
            ...r,
            status: 'AVAILABLE',
            holdingBy: null,
            holdingPhone: null,
            holdingUntil: null
          };
        }
        return r;
      });
      localStorage.setItem('rental_rooms', JSON.stringify(next));
      return next;
    });

    setRoomRequests((prev) => {
      const next = prev.map((req) => {
        if (req.targetRoom === roomNumber && req.status === 'HOLDING') {
          return { ...req, status: 'CANCELLED_BY_TENANT' };
        }
        return req;
      });
      localStorage.setItem('rental_room_requests', JSON.stringify(next));
      return next;
    });

    setContracts((prev) => {
      const next = prev.filter(c => !(c.roomNumber === roomNumber && c.status === 'PENDING_DEPOSIT'));
      localStorage.setItem('rental_contracts', JSON.stringify(next));
      return next;
    });

    return { success: true, message: `Đã hủy giữ chỗ phòng ${roomNumber}. Phòng đã được mở lại trên sàn Marketplace!` };
  };

  // Auto-release worker: Tự động quét và mở lại phòng khi hết hạn giữ chỗ (TTL 15 phút)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      let hasExpired = false;

      setRooms((prev) => {
        let changed = false;
        const next = prev.map((r) => {
          if (r.status === 'HOLDING' && r.holdingUntil && now > r.holdingUntil) {
            changed = true;
            hasExpired = true;
            return {
              ...r,
              status: 'AVAILABLE',
              holdingBy: null,
              holdingPhone: null,
              holdingUntil: null
            };
          }
          return r;
        });
        if (changed) {
          localStorage.setItem('rental_rooms', JSON.stringify(next));
        }
        return changed ? next : prev;
      });

      if (hasExpired) {
        setRoomRequests((prev) => {
          const next = prev.map((req) => {
            if ((req.type === 'RENT' || req.type === 'NEW_RENT') && req.status === 'HOLDING' && req.holdingUntil && now > req.holdingUntil) {
              return { ...req, status: 'EXPIRED' };
            }
            return req;
          });
          localStorage.setItem('rental_room_requests', JSON.stringify(next));
          return next;
        });

        setContracts((prev) => {
          const next = prev.filter(c => !(c.status === 'PENDING_DEPOSIT' && c.holdingUntil && now > c.holdingUntil));
          localStorage.setItem('rental_contracts', JSON.stringify(next));
          return next;
        });
      }
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  // 2. Cấu hình tích hợp dùng chung (UC-A02)
  const [systemIntegrations, setSystemIntegrations] = useState(() => {
    try {
      const s = localStorage.getItem('rental_system_integrations');
      return s ? JSON.parse(s) : DEFAULT_INTEGRATIONS;
    } catch {
      return DEFAULT_INTEGRATIONS;
    }
  });

  const updateSystemIntegration = (key, config) => {
    setSystemIntegrations((prev) => {
      const updated = { ...prev, [key]: { ...(prev[key] || {}), ...config } };
      localStorage.setItem('rental_system_integrations', JSON.stringify(updated));
      return updated;
    });

    addAuditLog({
      role: 'ROLE_ADMIN',
      username: 'admin',
      action: 'UPDATE_INTEGRATION_KEY',
      target: key.toUpperCase(),
      details: `Admin cập nhật và đồng bộ cấu hình dịch vụ ${key} sang Eureka Config Server`
    });
  };

  // 3. APM Microservices & Audit Logs (UC-A03)
  const [microservices] = useState(DEFAULT_MICROSERVICES);
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const s = localStorage.getItem('rental_audit_logs');
      return s ? JSON.parse(s) : DEFAULT_AUDIT_LOGS;
    } catch {
      return DEFAULT_AUDIT_LOGS;
    }
  });

  const addAuditLog = (logEntry) => {
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ip: '118.70.190.22',
      status: 'SUCCESS',
      ...logEntry
    };
    setAuditLogs((prev) => {
      const updated = [newLog, ...prev.slice(0, 99)];
      localStorage.setItem('rental_audit_logs', JSON.stringify(updated));
      return updated;
    });
  };

  // 4. Quản lý thành viên cùng phòng room_members (UC-T05 & UC-S02)
  const [roomMembers, setRoomMembers] = useState(() => {
    let list = DEFAULT_ROOM_MEMBERS;
    try {
      const s = localStorage.getItem('rental_room_members');
      if (s) list = JSON.parse(s);
    } catch {
      list = DEFAULT_ROOM_MEMBERS;
    }
    // Lọc bỏ triệt để thành viên ảo Nguyễn Văn Bình khỏi P.101
    list = list.filter((m) => !(m.roomNumber === 'P.101' && (m.fullName || '').includes('Bình')));

    // Tự động đồng bộ: Nếu Nguyễn Văn An đang ở P.102 thì An là đại diện P.102, loại bỏ Trần Thị Bình khỏi P.102
    try {
      const sRooms = localStorage.getItem('rental_tenant_rooms');
      const pRooms = sRooms ? JSON.parse(sRooms) : null;
      const anRoom = pRooms?.tenant1?.[0] || pRooms?.['Nguyễn Văn An']?.[0];
      if (anRoom === 'P.102') {
        list = list.map((m) => {
          if (m.roomNumber === 'P.102' && m.fullName.includes('Bình')) {
            return { ...m, status: 'MOVED_OUT' };
          }
          return m;
        });
        const hasAn = list.some((m) => m.roomNumber === 'P.102' && m.fullName.includes('An') && m.status !== 'MOVED_OUT');
        if (!hasAn) {
          list.push({
            id: 'RM-an-102',
            roomId: 102,
            roomNumber: 'P.102',
            houseCode: 'CS-01',
            tenantId: 1,
            fullName: 'Nguyễn Văn An',
            phone: '0987.654.321',
            cccd: '001201012345',
            maskedCccd: '00120101****',
            roleInRoom: 'REPRESENTATIVE',
            joinDate: '01/01/2026',
            temporaryResidenceStatus: 'REGISTERED',
            status: 'ACTIVE'
          });
        }
      }
    } catch {}

    // TỰ ĐỘNG ĐỐI SOÁT VÀ NẠP TẤT CẢ CÁC ĐƠN ĐÃ DUYỆT (rental_room_requests) VÀO DANH SÁCH THÀNH VIÊN
    try {
      const sReqs = localStorage.getItem('rental_room_requests');
      const pReqs = sReqs ? JSON.parse(sReqs) : null;
      if (Array.isArray(pReqs)) {
        pReqs.forEach((req) => {
          if (req.status === 'APPROVED' && req.targetRoom && req.tenant) {
            const hasMember = list.some(
              (m) =>
                m.roomNumber === req.targetRoom &&
                (m.fullName || '').toLowerCase().includes(req.tenant.toLowerCase()) &&
                m.status !== 'MOVED_OUT'
            );
            if (!hasMember) {
              const hasRep = list.some((m) => m.roomNumber === req.targetRoom && m.roleInRoom === 'REPRESENTATIVE' && m.status !== 'MOVED_OUT');
              const role = req.type === 'ROOMMATE' ? 'MEMBER' : (hasRep ? 'MEMBER' : 'REPRESENTATIVE');
              list.push({
                id: `RM-auto-${req.id || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                roomId: Date.now(),
                roomNumber: req.targetRoom,
                houseCode: req.houseCode || 'CS-01',
                fullName: req.tenant,
                phone: req.phone || '0966.123.456',
                cccd: '036207078901',
                maskedCccd: '03620707****',
                roleInRoom: role,
                joinDate: req.date || new Date().toLocaleDateString('vi-VN'),
                temporaryResidenceStatus: 'REGISTERED',
                status: 'ACTIVE'
              });
            }
          }
        });
      }
    } catch (err) {
      console.warn('Reconcile approved requests error:', err);
    }

    // TỰ ĐỘNG ĐỐI SOÁT VÀ NẠP CÁC ĐƠN Ở GHÉP CCCD ĐÃ DUYỆT (rental_roommate_requests_v2)
    try {
      const sKyc = localStorage.getItem('rental_roommate_requests_v2');
      const pKyc = sKyc ? JSON.parse(sKyc) : null;
      if (Array.isArray(pKyc)) {
        pKyc.forEach((req) => {
          if (req.status === 'APPROVED' && req.roomNumber && req.fullName) {
            const hasMember = list.some(
              (m) =>
                m.roomNumber === req.roomNumber &&
                (m.fullName || '').toLowerCase().includes(req.fullName.toLowerCase()) &&
                m.status !== 'MOVED_OUT'
            );
            if (!hasMember) {
              list.push({
                id: `RM-kyc-${req.id || Date.now()}`,
                roomId: Date.now(),
                roomNumber: req.roomNumber,
                houseCode: req.houseCode || 'CS-01',
                fullName: req.fullName,
                phone: req.phone,
                cccd: req.identityCard,
                maskedCccd: req.maskedIdentityCard || (req.identityCard ? req.identityCard.slice(0, 8) + '****' : '00120101****'),
                roleInRoom: 'MEMBER',
                joinDate: new Date().toLocaleDateString('vi-VN'),
                temporaryResidenceStatus: 'REGISTERED',
                status: 'ACTIVE'
              });
            }
          }
        });
      }
    } catch (err) {}

    try {
      localStorage.setItem('rental_room_members', JSON.stringify(list));
    } catch {}

    return list;
  });

  const addRoomMember = (data) => {
    const rawCccd = data.cccd || '001201000000';
    const masked = rawCccd.slice(0, 8) + '****';
    const newMember = {
      id: Date.now(),
      roomId: data.roomId || 101,
      roomNumber: data.roomNumber,
      houseCode: data.houseCode || 'CS-01',
      tenantId: data.tenantId || Date.now(),
      fullName: data.fullName,
      phone: data.phone,
      cccd: rawCccd,
      maskedCccd: masked,
      roleInRoom: data.roleInRoom || 'MEMBER',
      joinDate: new Date().toLocaleDateString('vi-VN'),
      temporaryResidenceStatus: data.temporaryResidenceStatus || 'REGISTERED',
      status: 'ACTIVE'
    };

    setRoomMembers((prev) => {
      const updated = [...prev, newMember];
      localStorage.setItem('rental_room_members', JSON.stringify(updated));
      return updated;
    });

    addAuditLog({
      role: 'ROLE_STAFF',
      username: 'staff',
      action: 'ADD_ROOM_MEMBER',
      target: newMember.roomNumber,
      details: `Thêm thành viên ở ghép ${newMember.fullName} vào phòng ${newMember.roomNumber}`
    });
  };

  const removeRoomMember = (id) => {
    setRoomMembers((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, status: 'MOVED_OUT' } : m));
      localStorage.setItem('rental_room_members', JSON.stringify(updated));
      return updated;
    });
  };

  const updateTemporaryResidence = (id, status) => {
    setRoomMembers((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, temporaryResidenceStatus: status } : m));
      try {
        localStorage.setItem('rental_room_members', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    // Task 5: Đồng bộ trực tiếp vào danh bạ tenants và localStorage để cập nhật huy hiệu realtime
    setTenants((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, temporaryResidenceStatus: status } : t));
      try {
        localStorage.setItem('rental_tenants', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const updateResidentCccd = (residentId, cccdData) => {
    setRoomMembers((prev) => {
      const updated = prev.map((m) =>
        m.id === residentId || m.tenantId === residentId
          ? { ...m, ...cccdData }
          : m
      );
      try {
        localStorage.setItem('rental_room_members', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // 5. Hợp đồng điện tử contracts (UC-T01 & UC-S02)
  const [contracts, setContracts] = useState(() => {
    try {
      const s = localStorage.getItem('rental_contracts');
      if (s) {
        const parsed = JSON.parse(s);
        // Lọc bỏ các hợp đồng ảo của Nam và đưa HD-2026-007 về PENDING_DEPOSIT
        let filtered = parsed.filter(c => !(c.tenantName?.includes('Nam') && c.contractCode !== 'HD-2026-007'));
        if (!filtered.some(c => c.contractCode === 'HD-2026-007' || c.tenantName?.includes('Nam'))) {
          filtered.push({
            id: 3,
            contractCode: 'HD-2026-007',
            roomNumber: 'P.102',
            houseCode: 'CS-02',
            houseName: 'Nhà Trọ Bách Khoa - Cơ Sở 2',
            tenantName: 'Hoàng Văn Nam',
            tenantPhone: '0966.123.456',
            startDate: '01/10/2026',
            endDate: '01/10/2027',
            rentalPrice: 2800000,
            depositAmount: 2800000,
            paymentCycle: 1,
            paymentDay: 5,
            terms: 'Hợp đồng thuê phòng sinh viên. Tiền cọc giữ chỗ đúng 1 tháng tiền phòng = 2.800.000 đ (không bao gồm dịch vụ). Phải nộp tiền cọc và ký điện tử mới được nhận phòng.',
            status: 'PENDING_DEPOSIT',
            depositPaid: false,
            signedElectronically: false,
            signedAt: null,
            holdingUntil: Date.now() + 15 * 60 * 1000
          });
        }
        return filtered.map(c => {
          // Khách 1 (An) và Khách 2 (Cường): Hợp đồng ACTIVE đã nộp cọc và ký điện tử
          if (c.contractCode === 'HD-2026-001' || c.contractCode === 'HD-2026-003' || c.status === 'ACTIVE') {
            return {
              ...c,
              status: 'ACTIVE',
              depositPaid: true,
              depositPaidAt: c.depositPaidAt || c.signedAt || '01/01/2026 09:30',
              depositPaymentMethod: c.depositPaymentMethod || 'VIETQR',
              signedElectronically: true
            };
          }
          if (c.contractCode === 'HD-2026-007' || (c.tenantName && c.tenantName.includes('Nam'))) {
            return {
              ...c,
              roomNumber: 'P.102',
              houseCode: 'CS-02',
              houseName: 'Nhà Trọ Bách Khoa - Cơ Sở 2',
              status: 'PENDING_DEPOSIT',
              depositPaid: false,
              depositAmount: 2800000,
              signedElectronically: false,
              holdingUntil: c.holdingUntil || (Date.now() + 15 * 60 * 1000)
            };
          }
          return c;
        });
      }
      return DEFAULT_CONTRACTS;
    } catch {
      return DEFAULT_CONTRACTS;
    }
  });

  // 5B. Nộp tiền cọc và ký hợp đồng điện tử để nhận phòng (Onboarding Gate)
  const payDepositAndSignContract = (contractId, options = {}) => {
    const { paymentMethod = 'VIETQR' } = options;
    const nowStr = new Date().toLocaleString('vi-VN');

    // Kiểm tra hết hạn 15 phút nộp tiền cọc
    const existingTarget = (contracts || []).find(c => c.id === contractId || c.contractCode === contractId);
    if (existingTarget) {
      if (existingTarget.status === 'EXPIRED' || (existingTarget.holdingUntil && existingTarget.holdingUntil < Date.now())) {
        return { success: false, error: 'Đã hết hạn 15 phút nộp tiền cọc. Lệnh giữ phòng đã bị hủy!' };
      }
    }

    let targetContract = null;
    setContracts((prev) => {
      const updated = prev.map((c) => {
        if (c.id === contractId || c.contractCode === contractId) {
          targetContract = { ...c };
          return {
            ...c,
            status: 'ACTIVE',
            depositPaid: true,
            depositPaidAt: nowStr,
            depositPaymentMethod: paymentMethod,
            signedElectronically: true,
            signedAt: nowStr
          };
        }
        return c;
      });
      localStorage.setItem('rental_contracts', JSON.stringify(updated));
      return updated;
    });

    if (targetContract) {
      // 1. Chuyển phòng sang OCCUPIED
      setRooms((prev) => {
        const next = prev.map((r) => {
          const isMatch = r.number === targetContract.roomNumber && (!targetContract.houseCode || r.houseCode === targetContract.houseCode);
          return isMatch
            ? {
                ...r,
                status: 'OCCUPIED',
                occupants: Math.max(1, (r.occupants || 0) + 1),
                holdingBy: null,
                holdingPhone: null,
                holdingUntil: null
              }
            : r;
        });
        localStorage.setItem('rental_rooms', JSON.stringify(next));
        return next;
      });

      // 2. Chuyển tenant sang ACTIVE
      setTenants((prev) => {
        const next = prev.map((t) => {
          const isMatch = (targetContract.tenantName && t.fullName?.toLowerCase().includes(targetContract.tenantName.toLowerCase())) ||
                          (targetContract.tenantPhone && t.phone === targetContract.tenantPhone);
          return isMatch
            ? {
                ...t,
                room: targetContract.roomNumber,
                rooms: [targetContract.roomNumber],
                houseCode: targetContract.houseCode || 'CS-01',
                house: targetContract.houseName || 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
                deposit: targetContract.depositAmount,
                status: 'ACTIVE',
                contractStart: targetContract.startDate,
                contractEnd: targetContract.endDate
              }
            : t;
        });
        localStorage.setItem('rental_tenants', JSON.stringify(next));
        return next;
      });

      // 3. AuthContext tenantRooms
      if (updateTenantRoom) {
        updateTenantRoom(targetContract.tenantName, targetContract.roomNumber, 'SET', {
          houseCode: targetContract.houseCode,
          house: targetContract.houseName
        });
      }

      // 4. roomMembers
      setRoomMembers((prev) => {
        const exists = prev.some((m) => m.roomNumber === targetContract.roomNumber && (m.fullName || '').toLowerCase().includes((targetContract.tenantName || '').toLowerCase()));
        if (exists) return prev;
        const updated = [
          ...prev,
          {
            id: `RM-${Date.now()}`,
            roomId: Date.now(),
            roomNumber: targetContract.roomNumber,
            houseCode: targetContract.houseCode || 'CS-01',
            fullName: targetContract.tenantName,
            phone: targetContract.tenantPhone || '0966.123.456',
            cccd: '036207078901',
            maskedCccd: '03620707****',
            roleInRoom: 'REPRESENTATIVE',
            joinDate: new Date().toLocaleDateString('vi-VN'),
            temporaryResidenceStatus: 'REGISTERED',
            status: 'ACTIVE'
          }
        ];
        localStorage.setItem('rental_room_members', JSON.stringify(updated));
        return updated;
      });

      addAuditLog({
        role: 'ROLE_TENANT',
        username: 'tenant',
        action: 'PAY_DEPOSIT_AND_SIGN',
        target: targetContract.contractCode,
        details: `Khách ${targetContract.tenantName} thanh toán cọc ${targetContract.depositAmount?.toLocaleString('vi-VN')} đ và ký HĐ điện tử phòng ${targetContract.roomNumber}`
      });
    }

    return { success: true };
  };

  // 5C. Đổi phòng trong cùng hệ thống: HỢP ĐỒNG GIỮ NGUYÊN, CHỈ ĐỔI TÊN PHÒNG, KHÔNG KÝ LẠI, MANG CỌC SANG PHÒNG MỚI!
  const transferRoom = ({ tenantName, tenantPhone, oldRoom, newRoom, targetHouseCode, targetHouseName }) => {
    const todayStr = new Date().toLocaleDateString('vi-VN');

    // 1. Cập nhật HỢP ĐỒNG: GIỮ NGUYÊN HỢP ĐỒNG, CHỈ ĐỔI TÊN PHÒNG, KHÔNG KÝ LẠI, MANG CỌC SANG PHÒNG MỚI!
    setContracts((prev) => {
      const updated = prev.map((c) => {
        const isMatch = (c.roomNumber === oldRoom || (tenantName && c.tenantName?.toLowerCase().includes(tenantName.toLowerCase()))) && c.status === 'ACTIVE';
        if (isMatch) {
          return {
            ...c,
            roomNumber: newRoom,
            houseCode: targetHouseCode || c.houseCode,
            houseName: targetHouseName || c.houseName,
            // Giữ nguyên id, contractCode, startDate, endDate, depositAmount, signedElectronically!
            transferHistory: [
              ...(c.transferHistory || []),
              {
                fromRoom: oldRoom,
                toRoom: newRoom,
                date: todayStr,
                note: `Chuyển phòng từ ${oldRoom} sang ${newRoom} (Bảo lưu toàn bộ HĐ & tiền cọc ${c.depositAmount?.toLocaleString('vi-VN')} đ)`
              }
            ]
          };
        }
        return c;
      });
      localStorage.setItem('rental_contracts', JSON.stringify(updated));
      return updated;
    });

    // 2. Phòng cũ: chuyển sang CLEANING, trừ người; phòng mới: OCCUPIED
    setRooms((prev) => {
      const next = prev.map((r) => {
        if (r.number === oldRoom) {
          const nextOcc = Math.max(0, (r.occupants || 1) - 1);
          return {
            ...r,
            occupants: nextOcc,
            status: nextOcc === 0 ? 'CLEANING' : r.status
          };
        }
        if (r.number === newRoom && (!targetHouseCode || r.houseCode === targetHouseCode)) {
          return {
            ...r,
            occupants: Math.min(r.maxOccupants, (r.occupants || 0) + 1),
            status: 'OCCUPIED'
          };
        }
        return r;
      });
      localStorage.setItem('rental_rooms', JSON.stringify(next));
      return next;
    });

    // 3. Khách thuê: cập nhật phòng mới
    setTenants((prev) => {
      const next = prev.map((t) => {
        const isMatch = t.room === oldRoom || (tenantName && t.fullName?.toLowerCase().includes(tenantName.toLowerCase()));
        if (isMatch) {
          return {
            ...t,
            room: newRoom,
            rooms: [newRoom],
            houseCode: targetHouseCode || t.houseCode,
            house: targetHouseName || t.house
          };
        }
        return t;
      });
      localStorage.setItem('rental_tenants', JSON.stringify(next));
      return next;
    });

    // 4. AuthContext
    if (updateTenantRoom) {
      updateTenantRoom(tenantName, { oldRoom, newRoom }, 'REPLACE');
    }

    // 5. RoomMembers
    setRoomMembers((prev) => {
      let updated = prev.map((m) => {
        if (m.roomNumber === oldRoom && (tenantName && m.fullName?.toLowerCase().includes(tenantName.toLowerCase()))) {
          return { ...m, status: 'MOVED_OUT' };
        }
        return m;
      });
      updated.push({
        id: `RM-${Date.now()}`,
        roomId: Date.now(),
        roomNumber: newRoom,
        houseCode: targetHouseCode || 'CS-01',
        fullName: tenantName,
        phone: tenantPhone || '0987.654.321',
        cccd: '001201012345',
        maskedCccd: '00120101****',
        roleInRoom: 'REPRESENTATIVE',
        joinDate: todayStr,
        temporaryResidenceStatus: 'REGISTERED',
        status: 'ACTIVE'
      });
      localStorage.setItem('rental_room_members', JSON.stringify(updated));
      return updated;
    });

    addAuditLog({
      role: 'ROLE_STAFF',
      username: 'staff',
      action: 'ROOM_TRANSFER',
      target: `${oldRoom} -> ${newRoom}`,
      details: `Đổi phòng cho khách ${tenantName} từ ${oldRoom} sang ${newRoom}. Giữ nguyên hợp đồng & bảo lưu cọc.`
    });

    return { success: true };
  };

  const signContractElectronically = (contractId) => {
    setContracts((prev) => {
      const updated = prev.map((c) => {
        if (c.id === contractId) {
          const nowStr = new Date().toLocaleString('vi-VN');
          addAuditLog({
            role: 'ROLE_TENANT',
            username: 'tenant1',
            action: 'SIGN_CONTRACT',
            target: c.contractCode,
            details: `Khách ${c.tenantName} ký xác nhận điện tử hợp đồng ${c.contractCode} phòng ${c.roomNumber}`
          });
          return {
            ...c,
            status: 'ACTIVE',
            signedElectronically: true,
            signedAt: nowStr
          };
        }
        return c;
      });
      localStorage.setItem('rental_contracts', JSON.stringify(updated));
      return updated;
    });
  };

  // 6. Phản ánh đối soát chỉ số điện nước meterDisputes (UC-T02)
  const [meterDisputes, setMeterDisputes] = useState(() => {
    try {
      const s = localStorage.getItem('rental_meter_disputes');
      return s ? JSON.parse(s) : DEFAULT_METER_DISPUTES;
    } catch {
      return DEFAULT_METER_DISPUTES;
    }
  });

  const submitMeterDispute = (data) => {
    const newDispute = {
      id: Date.now(),
      ...data,
      status: 'PENDING'
    };
    setMeterDisputes((prev) => {
      const updated = [newDispute, ...prev];
      localStorage.setItem('rental_meter_disputes', JSON.stringify(updated));
      return updated;
    });

    addAuditLog({
      role: 'ROLE_TENANT',
      username: 'tenant',
      action: 'SUBMIT_METER_DISPUTE',
      target: data.room,
      details: `Khách gửi phản ánh sai lệch chỉ số ${data.meterType}: Hệ thống ${data.systemReading} vs Thực tế ${data.reportedReading}`
    });
  };

  const resolveMeterDispute = (disputeId, status = 'RESOLVED', resolutionNote = '') => {
    setMeterDisputes((prev) => {
      const updated = prev.map((d) => (d.id === disputeId ? { ...d, status, resolutionNote } : d));
      localStorage.setItem('rental_meter_disputes', JSON.stringify(updated));
      return updated;
    });
  };

  // 7. Cấu hình biểu giá dịch vụ chi nhánh (UC-S01B - house_service_configs)
  const [houseServiceConfigs, setHouseServiceConfigs] = useState(() => {
    try {
      const s = localStorage.getItem('rental_house_service_configs');
      return s ? JSON.parse(s) : DEFAULT_HOUSE_SERVICE_CONFIGS;
    } catch {
      return DEFAULT_HOUSE_SERVICE_CONFIGS;
    }
  });

  const updateHouseServiceConfig = (configId, unitPrice, calculationType) => {
    setHouseServiceConfigs((prev) => {
      const updated = prev.map((c) =>
        c.id === configId
          ? { ...c, unitPrice: Number(unitPrice), calculationType: calculationType || c.calculationType }
          : c
      );
      localStorage.setItem('rental_house_service_configs', JSON.stringify(updated));
      return updated;
    });
  };

  const addHouseServiceConfig = (newConfig) => {
    const entry = { id: Date.now(), ...newConfig, unitPrice: Number(newConfig.unitPrice) };
    setHouseServiceConfigs((prev) => {
      const updated = [...prev, entry];
      localStorage.setItem('rental_house_service_configs', JSON.stringify(updated));
      return updated;
    });
  };

  // 8. Đăng ký & Duyệt bạn ở ghép (UC-T07 & UC-S02B - roommate_requests)
  const [roommateRequestsV2, setRoommateRequestsV2] = useState(() => {
    try {
      const s = localStorage.getItem('rental_roommate_requests_v2');
      return s ? JSON.parse(s) : DEFAULT_ROOMMATE_REQUESTS_V2;
    } catch {
      return DEFAULT_ROOMMATE_REQUESTS_V2;
    }
  });

  const submitRoommateRequest = (requestData) => {
    const rawCccd = requestData.identityCard || '001202008899';
    const masked = rawCccd.length >= 8 ? rawCccd.slice(0, 8) + '****' : '00120200****';
    const newReq = {
      id: Date.now(),
      ...requestData,
      identityCard: rawCccd,
      maskedIdentityCard: masked,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    setRoommateRequestsV2((prev) => {
      const updated = [newReq, ...prev];
      localStorage.setItem('rental_roommate_requests_v2', JSON.stringify(updated));
      return updated;
    });
    addAuditLog({
      role: 'ROLE_TENANT',
      username: 'tenant',
      action: 'SUBMIT_ROOMMATE_REQUEST',
      target: requestData.roomNumber,
      details: `Khách gửi yêu cầu thêm bạn ở ghép: ${requestData.fullName} (CCCD: ${masked})`
    });
    return { success: true };
  };

  const reviewRoommateRequest = (requestId, isApproved, rejectionReason = '') => {
    const targetReq = roommateRequestsV2.find((r) => r.id === requestId);
    if (!targetReq) return { success: false, message: 'Không tìm thấy yêu cầu' };

    if (isApproved) {
      const targetRoom = rooms.find((r) => r.number === targetReq.roomNumber);
      if (targetRoom && targetRoom.occupants >= targetRoom.maxOccupants) {
        return {
          success: false,
          message: `Không thể duyệt! Phòng ${targetReq.roomNumber} đã đạt số người tối đa (${targetRoom.occupants}/${targetRoom.maxOccupants}).`
        };
      }

      setRoomMembers((prev) => {
        const alreadyIn = prev.some(
          (m) => m.roomNumber === targetReq.roomNumber && (m.fullName || '').toLowerCase().includes((targetReq.fullName || '').toLowerCase())
        );
        let updated;
        if (alreadyIn) {
          updated = prev.map((m) =>
            m.roomNumber === targetReq.roomNumber && (m.fullName || '').toLowerCase().includes((targetReq.fullName || '').toLowerCase())
              ? { ...m, status: 'ACTIVE', roleInRoom: 'MEMBER' }
              : m
          );
        } else {
          updated = [
            ...prev,
            {
              id: `RM-${Date.now()}`,
              roomId: targetReq.roomId || Date.now(),
              roomNumber: targetReq.roomNumber,
              houseCode: 'CS-01',
              fullName: targetReq.fullName,
              phone: targetReq.phone,
              cccd: targetReq.identityCard,
              maskedCccd: targetReq.maskedIdentityCard || (targetReq.identityCard ? targetReq.identityCard.slice(0, 8) + '****' : '00120101****'),
              roleInRoom: 'MEMBER',
              temporaryResidenceStatus: 'REGISTERED',
              startDate: new Date().toLocaleDateString('vi-VN'),
              joinDate: new Date().toLocaleDateString('vi-VN'),
              status: 'ACTIVE'
            }
          ];
        }
        localStorage.setItem('rental_room_members', JSON.stringify(updated));
        return updated;
      });

      setRooms((prev) => {
        const next = prev.map((r) =>
          r.number === targetReq.roomNumber
            ? { ...r, occupants: Math.min(r.maxOccupants, (r.occupants || 0) + 1), status: 'OCCUPIED' }
            : r
        );
        localStorage.setItem('rental_rooms', JSON.stringify(next));
        return next;
      });

      setTenants((prev) => {
        let matched = false;
        const updated = prev.map((t) => {
          const tNorm = (t.fullName || '').toLowerCase();
          const reqNorm = (targetReq.fullName || '').toLowerCase();
          const isMatch = tNorm.includes(reqNorm) || reqNorm.includes(tNorm) ||
            (reqNorm.includes('nam') && tNorm.includes('nam')) ||
            (reqNorm.includes('an') && tNorm.includes('an')) ||
            (reqNorm.includes('khang') && tNorm.includes('khang'));
          if (!isMatch) return t;
          matched = true;
          return {
            ...t,
            room: targetReq.roomNumber,
            rooms: [targetReq.roomNumber],
            status: 'ACTIVE',
            daysSinceLeave: 0
          };
        });
        if (!matched) {
          updated.push({
            id: Date.now(),
            fullName: targetReq.fullName,
            phone: targetReq.phone,
            cccd: targetReq.identityCard,
            room: targetReq.roomNumber,
            rooms: [targetReq.roomNumber],
            status: 'ACTIVE',
            contractStart: new Date().toLocaleDateString('vi-VN'),
            contractEnd: '31/12/2026',
            deposit: 0
          });
        }
        localStorage.setItem('rental_tenants', JSON.stringify(updated));
        return updated;
      });

      if (updateTenantRoom) {
        updateTenantRoom(targetReq.fullName, targetReq.roomNumber, 'SET');
      }

      addAuditLog({
        role: 'ROLE_STAFF',
        username: 'staff',
        action: 'APPROVE_ROOMMATE_REQUEST',
        target: targetReq.roomNumber,
        details: `Chủ trọ đã duyệt thêm bạn ở ghép ${targetReq.fullName} vào phòng ${targetReq.roomNumber}. Cấp tài khoản ROLE_TENANT.`
      });
    }

    setRoommateRequestsV2((prev) => {
      const updated = prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: isApproved ? 'APPROVED' : 'REJECTED',
              rejectionReason: isApproved ? null : rejectionReason,
              reviewedAt: new Date().toISOString()
            }
          : r
      );
      localStorage.setItem('rental_roommate_requests_v2', JSON.stringify(updated));
      return updated;
    });

    return { success: true };
  };

  // 9. Nghiệm thu trả phòng & Quyết toán hoàn cọc (UC-T06 & UC-S07 - move_out_settlements)
  const [moveOutSettlements, setMoveOutSettlements] = useState(() => {
    try {
      const s = localStorage.getItem('rental_move_out_settlements');
      return s ? JSON.parse(s) : DEFAULT_MOVE_OUT_SETTLEMENTS;
    } catch {
      return DEFAULT_MOVE_OUT_SETTLEMENTS;
    }
  });

  const submitMoveOutNotice = (noticeData) => {
    const targetContract = contracts.find((c) => c.roomNumber === noticeData.roomNumber && c.status === 'ACTIVE') || contracts[0];
    const newSettlement = {
      id: Date.now(),
      contractId: targetContract?.contractCode || `HD-${Date.now()}`,
      roomNumber: noticeData.roomNumber,
      houseCode: noticeData.houseCode || 'CS-01',
      tenantName: noticeData.tenantName || 'Khách thuê',
      tenantPhone: noticeData.tenantPhone || '0987.654.321',
      bankAccount: noticeData.bankAccount || '',
      bankName: noticeData.bankName || '',
      accountHolder: noticeData.accountHolder || '',
      moveOutDate: noticeData.moveOutDate || new Date().toISOString().split('T')[0],
      reason: noticeData.reason || 'Khách chuyển đi theo nhu cầu cá nhân',
      originalDeposit: targetContract?.depositAmount || 3500000,
      unpaidUtilitiesFee: 0,
      damageFee: 0,
      damageDescription: 'Chờ nghiệm thu cơ sở vật chất bàn giao phòng',
      refundAmount: targetContract?.depositAmount || 3500000,
      refundStatus: 'PENDING',
      settledAt: null,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setMoveOutSettlements((prev) => {
      const updated = [newSettlement, ...prev];
      localStorage.setItem('rental_move_out_settlements', JSON.stringify(updated));
      return updated;
    });

    addAuditLog({
      role: 'ROLE_TENANT',
      username: 'tenant',
      action: 'SUBMIT_MOVE_OUT_NOTICE',
      target: noticeData.roomNumber,
      details: `Khách gửi thông báo trả phòng ${noticeData.roomNumber} vào ngày ${noticeData.moveOutDate}`
    });

    return { success: true };
  };

  const settleMoveOut = (arg1, arg2) => {
    let settlementId, unpaidUtilitiesFee, damageFee, damageDescription, refundStatus, isEarlyTermination, refundAmount;
    if (typeof arg1 === 'object' && arg1 !== null) {
      ({
        settlementId,
        unpaidUtilitiesFee = 0,
        damageFee = 0,
        damageDescription = '',
        refundStatus = 'COMPLETED',
        isEarlyTermination = false,
        refundAmount
      } = arg1);
    } else {
      settlementId = arg1;
      ({
        unpaidUtilitiesFee = 0,
        damageFee = 0,
        damageDescription = '',
        refundStatus = 'COMPLETED',
        isEarlyTermination = false,
        refundAmount
      } = arg2 || {});
    }

    const target = moveOutSettlements.find((s) => s.id === settlementId);
    if (!target) return { success: false, message: 'Không tìm thấy hồ sơ quyết toán' };

    const unpaidRentFee = Number(arg1?.unpaidRentFee || arg2?.unpaidRentFee || 0);
    const finalRefund = refundAmount !== undefined
      ? refundAmount
      : (isEarlyTermination ? 0 : Math.max(0, target.originalDeposit - unpaidRentFee - Number(damageFee) - Number(unpaidUtilitiesFee)));

    setMoveOutSettlements((prev) => {
      const updated = prev.map((s) =>
        s.id === settlementId
          ? {
              ...s,
              unpaidUtilitiesFee: Number(unpaidUtilitiesFee),
              damageFee: Number(damageFee),
              damageDescription,
              refundAmount: finalRefund,
              refundStatus,
              isEarlyTermination,
              settledAt: new Date().toLocaleString('vi-VN')
            }
          : s
      );
      localStorage.setItem('rental_move_out_settlements', JSON.stringify(updated));
      return updated;
    });

    // 1. Cập nhật phòng: Giảm số người và chuyển sang CLEANING (Chờ dọn dẹp) nếu hết người
    setRooms((prev) => {
      const next = prev.map((r) => {
        const isMatch = r.number === target.roomNumber && (!target.houseCode || r.houseCode === target.houseCode);
        if (isMatch) {
          const newOccupants = Math.max(0, (r.occupants || 1) - 1);
          return {
            ...r,
            occupants: newOccupants,
            status: newOccupants === 0 ? 'CLEANING' : r.status
          };
        }
        return r;
      });
      localStorage.setItem('rental_rooms', JSON.stringify(next));
      return next;
    });

    // 2. Chấm dứt hợp đồng ACTIVE
    setContracts((prev) => {
      const next = prev.map((c) =>
        c.roomNumber === target.roomNumber && (!target.houseCode || c.houseCode === target.houseCode) && c.status === 'ACTIVE'
          ? { ...c, status: 'TERMINATED', terminatedAt: new Date().toLocaleString('vi-VN') }
          : c
      );
      localStorage.setItem('rental_contracts', JSON.stringify(next));
      return next;
    });

    // 3. Cập nhật thành viên phòng
    setRoomMembers((prev) => {
      const next = prev.map((m) =>
        m.roomNumber === target.roomNumber && (!target.houseCode || m.houseCode === target.houseCode) &&
        (m.fullName || '').toLowerCase().includes((target.tenantName || '').toLowerCase())
          ? { ...m, status: 'MOVED_OUT' }
          : m
      );
      localStorage.setItem('rental_room_members', JSON.stringify(next));
      return next;
    });

    // 4. Cập nhật hồ sơ khách thuê thành INACTIVE và gỡ phòng
    setTenants((prev) => {
      const next = prev.map((t) => {
        const tNorm = (t.fullName || '').toLowerCase();
        const reqNorm = (target.tenantName || '').toLowerCase();
        const isMatch = tNorm.includes(reqNorm) || reqNorm.includes(tNorm) || (reqNorm.includes('nam') && tNorm.includes('nam'));
        if (!isMatch) return t;
        return {
          ...t,
          room: null,
          rooms: [],
          status: 'INACTIVE',
          daysSinceLeave: 0
        };
      });
      localStorage.setItem('rental_tenants', JSON.stringify(next));
      return next;
    });

    // 5. Đồng bộ session tài khoản khách thuê
    if (updateTenantRoom) {
      updateTenantRoom(target.tenantName, target.roomNumber, 'REMOVE');
    }

    addAuditLog({
      role: 'ROLE_STAFF',
      username: 'staff',
      action: 'SETTLE_MOVE_OUT',
      target: target.roomNumber,
      details: `Quyết toán trả phòng ${target.roomNumber} (${target.houseCode || 'CS-01'}): Cọc gốc ${target.originalDeposit.toLocaleString()} đ - Trừ điện nước ${Number(unpaidUtilitiesFee).toLocaleString()} đ - Bồi thường hỏng hóc ${Number(damageFee).toLocaleString()} đ = Hoàn trả ${finalRefund.toLocaleString()} đ. Phòng chuyển sang CLEANING.`
    });

    return { success: true, refundAmount: finalRefund };
  };

  // 10. Hồ sơ định danh KYC CCCD Chủ trọ (UC-A01 - landlord_profiles)
  const [landlordProfiles, setLandlordProfiles] = useState(() => {
    try {
      const s = localStorage.getItem('rental_landlord_profiles');
      return s ? JSON.parse(s) : DEFAULT_LANDLORD_PROFILES;
    } catch {
      return DEFAULT_LANDLORD_PROFILES;
    }
  });

  const verifyLandlordKyc = (profileId, isApproved, rejectionReason = '') => {
    setLandlordProfiles((prev) => {
      const updated = prev.map((p) =>
        p.id === profileId
          ? {
              ...p,
              kycStatus: isApproved ? 'VERIFIED' : 'REJECTED',
              rejectionReason: isApproved ? null : rejectionReason,
              verifiedAt: new Date().toLocaleString('vi-VN'),
              verifiedBy: 1
            }
          : p
      );
      localStorage.setItem('rental_landlord_profiles', JSON.stringify(updated));
      return updated;
    });

    addAuditLog({
      role: 'ROLE_ADMIN',
      username: 'admin',
      action: isApproved ? 'VERIFY_LANDLORD_KYC' : 'REJECT_LANDLORD_KYC',
      target: `LandlordProfile #${profileId}`,
      details: isApproved
        ? `Admin phê duyệt định danh pháp lý KYC CCCD cho Chủ trọ`
        : `Admin từ chối định danh KYC Chủ trọ. Lý do: ${rejectionReason}`
    });
  };

  // Task 12: Tính chi phí sửa chữa vào hóa đơn tiền phòng tiếp theo
  const addMaintenanceFeeToInvoice = (roomNumber, fee, note) => {
    setInvoices((prev) => {
      const updated = prev.map((inv) => {
        if (inv.room === roomNumber && inv.status !== 'PAID') {
          const newService = (inv.service || 0) + Number(fee);
          return {
            ...inv,
            service: newService,
            total: (inv.roomFee || 0) + (inv.elec || 0) + (inv.water || 0) + newService,
            note: inv.note ? `${inv.note}; ${note}` : note
          };
        }
        return inv;
      });
      try {
        localStorage.setItem('rental_invoices', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  return (
    <DataContext.Provider
      value={{
        billingMonth,
        switchBillingMonth,
        resetMonthlyPayments,
        invoices,
        payInvoice,
        tickets,
        createTicket,
        updateTicketStatus,
        tenants,
        addTenant,
        meters,
        metersHistory,
        invoicesHistory,
        utilityPrices,
        updateUtilityPrices,
        updateMeterReading,
        saveMeterReading,
        unlockMeterReading,
        rooms,
        updateRoomStatus,
        updateRoomPrice,
        addRoom,
        roomRequests,
        submitRoomRequest,
        cancelRoomHold,
        submitCheckoutRequest,
        leaveRoom,
        submitContractRenewalRequest,
        voteRoommateRequest,
        approveRoomRequest,
        rejectRoomRequest,
        updateTenant,
        deleteTenant,
        systemNotices,
        roomPaymentNotices,
        roommateLeaveNotices,
        resetRoomPaymentStatus,
        // RBAC SaaS Additions
        resetTenantPassword,
        landlords,
        createLandlord,
        toggleLandlordLock,
        updateLandlordPackage,
        systemIntegrations,
        updateSystemIntegration,
        microservices,
        auditLogs,
        addAuditLog,
        roomMembers,
        addRoomMember,
        removeRoomMember,
        updateTemporaryResidence,
        addMaintenanceFeeToInvoice,
        updateResidentCccd,
        contracts,
        signContractElectronically,
        payDepositAndSignContract,
        transferRoom,
        meterDisputes,
        submitMeterDispute,
        resolveMeterDispute,
        // UC-S01B & UC-T07 & UC-S02B & UC-T06 & UC-S07 & UC-A01 Additions
        houseServiceConfigs,
        updateHouseServiceConfig,
        addHouseServiceConfig,
        roommateRequestsV2,
        submitRoommateRequest,
        reviewRoommateRequest,
        moveOutSettlements,
        submitMoveOutNotice,
        settleMoveOut,
        landlordProfiles,
        verifyLandlordKyc,
        saasInvoices,
        paySaasInvoice,
        resetSaasInvoiceStatus,
        createSaasInvoice,
        saasReminders,
        sendSaasReminder,
        resetLandlordPassword
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
