// Commands consume current state through the app's composition boundary.
export function createSubscriptionsCommands({ billingMonth, create, find, isoDate, request, view }) {
  return {
sendSaasReminder: invoice => request('post','/notifications',{userId:invoice.landlordId,title:`Nhắc thanh toán ${invoice.code}`,content:`Vui lòng thanh toán hóa đơn ${invoice.code}`,type:'INVOICE'}),
createSaasInvoice: input => create('saasInvoices',{code:input.code || `SAAS-${Date.now()}`,landlordId:input.landlordId,packageName:input.packageName,packageCode:input.packageCode,billingCycle:input.billingCycle || '12 tháng',period:input.period || billingMonth,amount:input.amount,dueDate:isoDate(input.dueDate)}),
paySaasInvoice: (id,method='CASH') => request('post',`/invoices/saas/${find(view.saasInvoices,id).id}/confirm-payment`,{paymentMethod:method}),
updateLandlordPackage: (id,packageCode) => request('patch',`/auth/accounts/${id}`,{packageCode})
};
}
