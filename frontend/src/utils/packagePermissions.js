// Hệ thống định nghĩa quyền hạn và hạn mức các gói bản quyền SaaS (Trọ Việt SaaS)

export const PACKAGE_TIERS = {
  NONE: {
    code: 'NONE',
    name: 'Gói Dùng Thử 0đ (TRIAL)',
    monthlyPrice: 0,
    maxHouses: 1,
    maxRooms: 10,
    badge: 'Dùng Thử 0đ',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    color: 'slate',
    features: {
      aiMeterOcr: false,
      aiCccdOcr: false,
      vatInvoice: false,
      eSign: false,
      staffRbac: false,
      autoVietQr: false,
      smsZaloNotification: false,
    }
  },
  TRIAL: {
    code: 'TRIAL',
    name: 'Gói Dùng Thử 0đ (TRIAL)',
    monthlyPrice: 0,
    maxHouses: 1,
    maxRooms: 10,
    badge: 'Dùng Thử 0đ',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    color: 'slate',
    features: {
      aiMeterOcr: false,
      aiCccdOcr: false,
      vatInvoice: false,
      eSign: false,
      staffRbac: false,
      autoVietQr: false,
      smsZaloNotification: false,
    }
  },
  BASIC: {
    code: 'BASIC',
    name: 'Gói Cơ Bản (BASIC)',
    monthlyPrice: 199000,
    maxHouses: 2,
    maxRooms: 30,
    badge: 'Tiết Kiệm',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    color: 'blue',
    features: {
      aiMeterOcr: false,
      aiCccdOcr: false,
      vatInvoice: false,
      eSign: false,
      staffRbac: false,
      autoVietQr: false, // VietQR tĩnh
      smsZaloNotification: false,
    }
  },
  PRO: {
    code: 'PRO',
    name: 'Gói Chuyên Nghiệp (PRO)',
    monthlyPrice: 499000,
    maxHouses: 999,
    maxRooms: 100,
    badge: 'Bán Chạy Nhất ⭐',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    color: 'purple',
    features: {
      aiMeterOcr: false,
      aiCccdOcr: false,
      vatInvoice: true,
      eSign: true,
      staffRbac: true,
      autoVietQr: true,
      smsZaloNotification: false,
    }
  },
  ENTERPRISE: {
    code: 'ENTERPRISE',
    name: 'Gói Doanh Nghiệp (ENTERPRISE)',
    monthlyPrice: 999000,
    maxHouses: 999,
    maxRooms: 99999,
    badge: 'Đỉnh Cao AI 👑',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    color: 'amber',
    features: {
      aiMeterOcr: true,
      aiCccdOcr: true,
      vatInvoice: true,
      eSign: true,
      staffRbac: true,
      autoVietQr: true,
      smsZaloNotification: true,
    }
  }
};

/**
 * Lấy mã gói cước chuẩn của chủ trọ hiện tại
 */
export function getLandlordPackageCode(landlord) {
  const isZero = typeof window !== 'undefined' && localStorage.getItem('rental_is_zero_sandbox') === 'true';
  if (!landlord) return isZero ? 'NONE' : 'PRO';
  if (isZero && (landlord.packageCode === 'NONE' || landlord.status === 'TRIAL')) return 'NONE';
  return landlord.packageCode || (isZero ? 'NONE' : 'BASIC');
}

/**
 * Lấy hạn mức tối đa số phòng theo gói
 */
export function getMaxRoomsAllowed(packageCode) {
  const code = (packageCode || 'NONE').toUpperCase();
  if (code === 'ENTERPRISE') return 99999;
  if (code === 'PRO') return 100;
  if (code === 'BASIC') return 30;
  return 10; // TRIAL / NONE
}

/**
 * Lấy hạn mức tối đa số cơ sở theo gói
 */
export function getMaxHousesAllowed(packageCode) {
  const code = (packageCode || 'NONE').toUpperCase();
  if (code === 'ENTERPRISE' || code === 'PRO') return 999;
  if (code === 'BASIC') return 2;
  return 1; // TRIAL / NONE
}

/**
 * Kiểm tra xem gói có quyền dùng tính năng hay không
 * @returns { allowed: boolean, requiredPackage: 'PRO' | 'ENTERPRISE' }
 */
export function checkPackageFeatureAccess(packageCode, featureKey) {
  const code = (packageCode || 'NONE').toUpperCase();
  const tier = PACKAGE_TIERS[code] || PACKAGE_TIERS.NONE;
  const isAllowed = Boolean(tier.features[featureKey]);

  if (isAllowed) {
    return { allowed: true, requiredPackage: code };
  }

  // Nếu không được phép, tìm gói tối thiểu yêu cầu tính năng này
  if (featureKey === 'aiMeterOcr' || featureKey === 'aiCccdOcr' || featureKey === 'smsZaloNotification') {
    return { allowed: false, requiredPackage: 'ENTERPRISE' };
  }

  return { allowed: false, requiredPackage: 'PRO' };
}
