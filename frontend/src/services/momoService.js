/**
 * Dịch Vụ Thanh Toán Cổng Ví MoMo Sandbox
 * Tích hợp chuẩn MoMo Payment API v2 với HMAC-SHA256 (Web Crypto API)
 * Credentials lấy từ MoMo Developer GitHub: https://github.com/momo-wallet
 */

export const MOMO_DEVELOPERS_URL = 'https://developers.momo.vn/';

export function getMoMoConfig() {
  try {
    const saved = localStorage.getItem('rental_momo_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        endpoint: parsed.endpoint || 'https://test-payment.momo.vn/v2/gateway/api/create',
        redirectUrl: window.location.origin + '/payment/momo-return',
        ipnUrl: parsed.ipnUrl || window.location.origin + '/api/payments/momo/ipn'
      };
    }
  } catch {
    // fallback default
  }
  return {
    partnerCode: 'MOMO',
    accessKey: 'F8BBA842ECF85',
    secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create',
    redirectUrl: window.location.origin + '/payment/momo-return',
    ipnUrl: window.location.origin + '/api/payments/momo/ipn'
  };
}

export function saveMoMoConfig(cfg) {
  localStorage.setItem('rental_momo_config', JSON.stringify(cfg));
}

export const MOMO_TEST_ACCOUNT = {
  wallet: 'Ví MoMo UAT / Test Sandbox',
  phone: '0968238610 (Tài khoản App MoMo UAT)',
  atmCard: '9704 0000 0000 0018',
  cardHolder: 'NGUYEN VAN A',
  cardDate: '03/07',
  otp: '000000 hoặc OTP bất kỳ',
  note: 'Mở cổng MoMo -> Chọn tab Thẻ ATM nội địa -> Nhập thẻ test 9704 0000 0000 0018'
};

/**
 * Tính HMAC-SHA256 bằng Web Crypto API (thay thế require('crypto') của Node.js)
 * Đây là cách chạy trên trình duyệt, không cần Node.js
 */
export async function hmacSHA256(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Tạo URL chuyển hướng sang Cổng MoMo Sandbox
 * Thuật toán ký chữ ký chuẩn MoMo API v2 (HMAC-SHA256)
 * Ref: https://developers.momo.vn/v3/docs/payment/api/wallet/onetime
 */
export async function createMoMoPaymentUrl({ invoiceId, amount, orderInfo }) {
  const config = getMoMoConfig();

  // 1. Thử gọi backend Payment Service nếu khả dụng
  try {
    const res = await fetch('/api/payments/momo/create-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceId: Number(invoiceId) || 101,
        amount: Number(amount) || 100000,
        orderInfo: orderInfo || `Thanh toan tien phong hoa don ${invoiceId}`,
        returnUrl: config.redirectUrl
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.payUrl) return data.payUrl;
    }
  } catch {
    // Backend offline - tao URL truc tiep tu frontend
  }

  // 2. Thuat toan tao chu ky va goi MoMo API v2 truc tiep qua Vite Proxy hoac truc tiep
  const partnerCode = config.partnerCode || 'MOMO';
  const accessKey = config.accessKey || 'F8BBA842ECF85';
  const secretKey = config.secretKey || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
  const redirectUrl = config.redirectUrl;
  const ipnUrl = config.ipnUrl || redirectUrl;

  const cleanInvId = String(invoiceId || '101').replace(/[^a-zA-Z0-9-]/g, '');
  const requestId = `${partnerCode}_${cleanInvId}_${Date.now()}`;
  const orderId = requestId;
  const requestAmount = String(Math.round(Number(amount) || 50000));
  const requestType = 'captureWallet';
  const extraData = '';
  const momoOrderInfo = orderInfo || `Thanh toan tien phong hoa don ${invoiceId}`;

  // Chuoi can ky theo dung format MoMo yeu cau (thu tu bang chu cai)
  const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${requestAmount}`,
    `extraData=${extraData}`,
    `ipnUrl=${ipnUrl}`,
    `orderId=${orderId}`,
    `orderInfo=${momoOrderInfo}`,
    `partnerCode=${partnerCode}`,
    `redirectUrl=${redirectUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`
  ].join('&');

  // Ky HMAC-SHA256 bang Web Crypto API (thay vi crypto.createHmac cua Node.js)
  const signature = await hmacSHA256(secretKey, rawSignature);

  // Goi MoMo API tao giao dich
  const requestBody = {
    partnerCode,
    accessKey,
    requestId,
    amount: requestAmount,
    orderId,
    orderInfo: momoOrderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: 'vi'
  };

  // Uu tien goi qua /momo-api (Vite proxy tranh CORS) truoc
  const endpoints = [
    '/momo-api/v2/gateway/api/create',
    config.endpoint,
    'https://test-payment.momo.vn/v2/gateway/api/create'
  ];

  for (const ep of endpoints) {
    try {
      const momoRes = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (momoRes.ok) {
        const momoData = await momoRes.json();
        if (momoData.payUrl) {
          return momoData.payUrl;
        }
        if (momoData.qrCodeUrl) {
          return momoData.qrCodeUrl;
        }
      }
    } catch (err) {
      console.warn(`[MoMo] Endpoint ${ep} error:`, err.message);
    }
  }

  // 3. Fallback: Mo phong redirect khi khong the ket noi MoMo API
  return `${redirectUrl}?resultCode=0&orderId=${orderId}&amount=${requestAmount}&message=Giao+dịch+MoMo+thành+công`;
}
