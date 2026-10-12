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

/**
 * Lấy trạng thái hạn dùng thử 14 ngày (Free Trial 14 Days)
 */
export function getTrialStatus(landlord) {
  const packageCode = getLandlordPackageCode(landlord);
  const isTrial = packageCode === 'NONE' || packageCode === 'TRIAL' || landlord?.status === 'TRIAL';

  if (!isTrial) {
    return {
      isTrial: false,
      isTrialExpired: false,
      daysLeft: null,
      statusText: 'Đã Kích Hoạt Bản Quyền'
    };
  }

  // Hỗ trợ kiểm thử mô phỏng hết hạn 14 ngày (Toggle cho Admin / Giáo viên demo)
  const isSimulatedExpired =
    typeof window !== 'undefined' && localStorage.getItem('rental_simulate_trial_expired') === 'true';

  if (isSimulatedExpired) {
    return {
      isTrial: true,
      isTrialExpired: true,
      daysLeft: 0,
      statusText: 'Hết Hạn Dùng Thử 14 Ngày'
    };
  }

  // Mặc định còn 14 ngày hoặc tính từ ngày tạo
  let daysLeft = 14;
  if (landlord?.trialDaysLeft !== undefined) {
    daysLeft = Number(landlord.trialDaysLeft);
  } else if (landlord?.createdAt) {
    try {
      const parts = String(landlord.createdAt).split('/');
      if (parts.length === 3) {
        const createdDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        const now = new Date();
        const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        daysLeft = Math.max(0, 14 - diffDays);
      }
    } catch {}
  }

  const isExpired = daysLeft <= 0;
  return {
    isTrial: true,
    isTrialExpired: isExpired,
    daysLeft,
    statusText: isExpired ? 'Hết Hạn Dùng Thử 14 Ngày' : `Dùng Thử 14 Ngày (Còn ${daysLeft} ngày)`
  };
}

/**
 * Kiểm tra chống gian lận đa tài khoản (Anti-Abuse KYC):
 * Mỗi số CCCD (12 số) và mỗi STK Ngân Hàng chỉ được hưởng gói Dùng Thử 14 ngày 1 lần duy nhất!
 */
export function checkKycTrialAbuse({ identityCard, bankAccount, currentLandlordId, existingLandlords = [] }) {
  if (!identityCard && !bankAccount) {
    return { isAbuse: false };
  }

  // 1. Kiểm tra trong sổ bộ KYC Dùng Thử (Trial KYC Registry)
  let registry = { cccdList: ['001202008899', '038099012345'], bankList: ['9999888899'] };
  try {
    const saved = localStorage.getItem('rental_trial_kyc_registry');
    if (saved) registry = JSON.parse(saved);
  } catch {}

  const cleanCccd = String(identityCard || '').trim();
  const cleanBank = String(bankAccount || '').trim();

  // Kiểm tra trùng CCCD với tài khoản khác đã từng hưởng Free
  if (cleanCccd) {
    const isCccdUsed = registry.cccdList?.includes(cleanCccd);
    const isUsedInOtherLandlord = existingLandlords.some(
      (l) => l.id !== currentLandlordId && l.identityCard === cleanCccd && (l.packageCode === 'NONE' || l.packageCode === 'TRIAL')
    );

    if (isCccdUsed || isUsedInOtherLandlord) {
      return {
        isAbuse: true,
        reason: `Số CCCD ${cleanCccd} đã từng được sử dụng để kích hoạt Gói Dùng Thử 14 Ngày trên hệ thống! Chính sách chống lạm dụng: Mỗi CCCD chỉ được hưởng 1 lần dùng thử. Vui lòng chọn gói bản quyền trả phí (BASIC / PRO / ENTERPRISE).`,
        type: 'CCCD_DUPLICATE'
      };
    }
  }

  // Kiểm tra trùng STK Ngân Hàng
  if (cleanBank) {
    const isBankUsed = registry.bankList?.includes(cleanBank);
    if (isBankUsed) {
      return {
        isAbuse: true,
        reason: `Số tài khoản ngân hàng ${cleanBank} đã từng liên kết với tài khoản dùng thử khác. Vui lòng chọn gói bản quyền để tiếp tục!`,
        type: 'BANK_DUPLICATE'
      };
    }
  }

  return { isAbuse: false };
}

/**
 * Ghi nhận số CCCD / STK vào sổ bộ chống gian lận dùng thử
 */
export function registerKycTrial({ identityCard, bankAccount }) {
  let registry = { cccdList: ['001202008899', '038099012345'], bankList: ['9999888899'] };
  try {
    const saved = localStorage.getItem('rental_trial_kyc_registry');
    if (saved) registry = JSON.parse(saved);
  } catch {}

  if (identityCard && !registry.cccdList.includes(identityCard)) {
    registry.cccdList.push(identityCard);
  }
  if (bankAccount && !registry.bankList.includes(bankAccount)) {
    registry.bankList.push(bankAccount);
  }

  try {
    localStorage.setItem('rental_trial_kyc_registry', JSON.stringify(registry));
  } catch {}
}
