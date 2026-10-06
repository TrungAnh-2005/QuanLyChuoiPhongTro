/**
 * Dịch Vụ Thanh Toán Cổng VNPay Sandbox
 * Hỗ trợ tạo URL thanh toán chuẩn VNPay Sandbox v2.1.0 và kiểm tra kết quả
 */

export const VNPAY_DEVREG_URL = 'https://sandbox.vnpayment.vn/devreg/';

export function getVNPayConfig() {
  try {
    const saved = localStorage.getItem('rental_vnpay_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        payUrl: parsed.payUrl || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        returnUrl: window.location.origin + '/payment/vnpay-return'
      };
    }
  } catch {
    // fallback default
  }
  return {
    tmnCode: 'JDWJCCLC',
    hashSecret: 'RFQIDMWHCGBYGTCJPIGLEVGQGNQKAJGM',
    payUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: window.location.origin + '/payment/vnpay-return'
  };
}

export function saveVNPayConfig(cfg) {
  localStorage.setItem('rental_vnpay_config', JSON.stringify(cfg));
}

// Thông tin thẻ ngân hàng test chính thức của VNPay Sandbox
export const VNPAY_TEST_CARD = {
  bank: 'NCB (Ngân hàng Quốc Dân - Test VNPay)',
  cardNumber: '9704198526191432198',
  cardHolder: 'NGUYEN VAN A',
  issueDate: '07/15',
  otp: '123456'
};

/**
 * Tính HMAC-SHA512 bằng Web Crypto API
 */
export async function hmacSHA512(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function formatDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
}

/**
 * Tạo URL chuyển hướng sang Cổng VNPay Sandbox
 */
export async function createVNPayPaymentUrl({
  invoiceId,
  amount,
  orderInfo,
  bankCode = ''
}) {
  const config = getVNPayConfig();

  // 1. Thử gọi Backend Payment Service trước nếu khả dụng
  try {
    const res = await fetch('/api/payments/vnpay/create-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceId: Number(invoiceId) || 101,
        amount: Number(amount) || 100000,
        orderInfo: orderInfo || `Thanh toan hoa don phong ${invoiceId}`,
        bankCode: bankCode,
        returnUrl: config.returnUrl
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.paymentUrl) return data.paymentUrl;
    }
  } catch {
    // Nếu backend chưa bật, fallback sang thuật toán sinh URL VNPay Sandbox trực tiếp
  }

  // 2. Thuật toán sinh URL chuẩn VNPay Sandbox v2.1.0
  const now = new Date();
  const createDate = formatDate(now);
  const expireDate = formatDate(new Date(now.getTime() + 15 * 60 * 1000));
  const txnRef = `${invoiceId || 'INV'}_${Date.now()}`;
  const vnpAmount = Math.round(Number(amount)) * 100; // VNPay nhân 100

  const vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: config.tmnCode || 'JDWJCCLC',
    vnp_Amount: String(vnpAmount),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo || `Thanh toan tien phong hoa don ${invoiceId}`,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate
  };

  if (bankCode) {
    vnp_Params.vnp_BankCode = bankCode;
  }

  // Sắp xếp các tham số theo bảng chữ cái A-Z và mã hóa chuẩn RFC 3986 (spaces -> +)
  const sortedKeys = Object.keys(vnp_Params).sort();
  const hashParts = [];
  const queryParts = [];

  for (const key of sortedKeys) {
    const value = vnp_Params[key];
    if (value !== undefined && value !== null && value !== '') {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(String(value)).replace(/%20/g, '+');
      hashParts.push(`${encodedKey}=${encodedValue}`);
      queryParts.push(`${encodedKey}=${encodedValue}`);
    }
  }

  const hashData = hashParts.join('&');
  const secretKey = config.hashSecret || 'RFQIDMWHCGBYGTCJPIGLEVGQGNQKAJGM';
  const secureHash = await hmacSHA512(secretKey, hashData);
  const paymentUrl = `${config.payUrl}?${queryParts.join('&')}&vnp_SecureHash=${secureHash}`;

  return paymentUrl;
}
