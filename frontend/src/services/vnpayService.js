import api from "./api";
export const VNPAY_DEVREG_URL = 'https://sandbox.vnpayment.vn/devreg/';
export const VNPAY_TEST_CARD = {
  bank: 'NCB (Ngân hàng Quốc Dân - Test VNPay)',
  cardNumber: '9704198526191432198',
  cardHolder: 'NGUYEN VAN A',
  issueDate: '07/15',
  otp: '123456'
};
export function getVNPayConfig() { return {configuredOnServer:true}; }
export async function saveVNPayConfig(config) { return api.put('/auth/integrations/vnpay',config); }
export async function createVNPayPaymentUrl(input) {
 const result = await api.post('/payments/vnpay/create-url',{...input,invoiceId:Number(input.invoiceId),returnUrl:window.location.origin+'/payment/vnpay-return'});
 if (!result.paymentUrl) throw new Error(result.message || 'Không tạo được liên kết thanh toán');
 return result.paymentUrl;
}
