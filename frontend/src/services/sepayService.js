import api from './api';
export const SEPAY_PORTAL_URL = 'https://my.sepay.vn';
export const SEPAY_DOCS_URL = 'https://docs.sepay.vn';
export const getProcessedSepayTxIds = () => [];
export const markSepayTxAsProcessed = () => {};
export const getSePayConfig = () => ({configuredOnServer:true,accountNumber:import.meta.env.VITE_BANK_ACCOUNT || '',bank:import.meta.env.VITE_BANK_CODE || '',accountName:import.meta.env.VITE_BANK_ACCOUNT_NAME || '',autoCheckInterval:10000});
export const saveSePayConfig = config => api.put('/auth/integrations/sepay',config);
export const syncBankAccountsFromSePay = () => api.get('/payments/sepay/accounts');
export const generateSePayQrUrl = ({accountNumber,bank,amount,description,content}) => `https://qr.sepay.vn/img?${new URLSearchParams({acc:accountNumber,bank,amount,des:description || content || '',template:'compact'})}`;
export async function checkSePayTransaction({invoiceId}) { const res=await api.get('/payments/sepay/check',{params:{invoiceId}}); return {...res,success:!!res.transaction}; }
