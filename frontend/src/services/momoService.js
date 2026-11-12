import api from "./api";
export const MOMO_DEVELOPERS_URL = 'https://developers.momo.vn/';
export const MOMO_TEST_ACCOUNT = {
  wallet: 'Ví MoMo UAT / Test Sandbox',
  phone: '0968238610 (Tài khoản App MoMo UAT)',
  atmCard: '9704 0000 0000 0018',
  cardHolder: 'NGUYEN VAN A',
  cardDate: '03/07',
  otp: '000000 hoặc OTP bất kỳ',
  note: 'Mở cổng MoMo -> Chọn tab Thẻ ATM nội địa -> Nhập thẻ test 9704 0000 0000 0018'
};
export function getMoMoConfig() { return {configuredOnServer:true}; }
export async function saveMoMoConfig(config) { return api.put('/auth/integrations/momo',config); }
export async function createMoMoPaymentUrl(input) {
 const result = await api.post('/payments/momo/create-url',{...input,invoiceId:Number(input.invoiceId),returnUrl:window.location.origin+'/payment/momo-return'});
 if (!result.payUrl) throw new Error(result.message || 'Không tạo được liên kết thanh toán');
 return result.payUrl;
}
