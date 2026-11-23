export function getHouseFullAddress(h) {
  return typeof h?.address === 'string' && h.address.trim()
    ? h.address.trim()
    : 'Chưa cập nhật địa chỉ';
}
