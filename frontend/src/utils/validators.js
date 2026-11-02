/**
 * Bộ hàm tiện ích kiểm tra dữ liệu (Validation Helpers) dùng chung cho toàn bộ Frontend
 */

/**
 * Kiểm tra số điện thoại Việt Nam hợp lệ (10-11 chữ số, bắt đầu bằng 0 hoặc +84)
 */
export function isValidVietnamPhone(phone) {
  if (!phone) return false;
  const cleaned = String(phone).trim().replace(/[\s.-]/g, '');
  return /^(0|\+84)\d{9,10}$/.test(cleaned);
}

/**
 * Kiểm tra số CCCD gắn chip hợp lệ (đúng 12 chữ số)
 */
export function isValidCCCD(cccd) {
  if (!cccd) return false;
  const cleaned = String(cccd).trim().replace(/\s+/g, '');
  return /^\d{12}$/.test(cleaned);
}

/**
 * Kiểm tra giá trị số hợp lệ (> 0 hoặc >= 0)
 */
export function isPositiveNumber(val, allowZero = false) {
  const num = Number(val);
  if (Number.isNaN(num) || !Number.isFinite(num)) return false;
  return allowZero ? num >= 0 : num > 0;
}

/**
 * Kiểm tra ngày chọn không nằm trong quá khứ (so với ngày hiện tại theo giờ địa phương)
 */
export function isFutureOrTodayDate(dateStr) {
  if (!dateStr) return false;
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return false;
  const selected = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (Number.isNaN(selected.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected >= today;
}

/**
 * Lấy chuỗi ngày hôm nay dạng YYYY-MM-DD để làm thuộc tính min cho <input type="date">
 */
export function getTodayDateInputMin() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Kiểm tra số tài khoản ngân hàng (6 - 20 chữ số)
 */
export function isValidBankAccount(accountNo) {
  if (!accountNo) return false;
  const cleaned = String(accountNo).trim().replace(/\s+/g, '');
  return /^\d{6,20}$/.test(cleaned);
}

