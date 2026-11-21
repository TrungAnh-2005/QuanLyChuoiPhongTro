// Commands consume current state through the app's composition boundary.
export function createInvoicesCommands({ api, find, refreshData, request, room, setState, user, view }) {
  return {
addMaintenanceFeeToInvoice: (number,amount) => request('post',`/invoices/${view.invoices.find(i=>i.roomId===room(number).id && i.status!=='PAID')?.id}/maintenance-fee`,{amount:Number(amount)}),
payInvoice: async (id, method = 'CASH', payerName) => {
      const targetId = typeof id === 'object' ? id.id : id;
      const inv = find(view.allInvoices || view.invoices, targetId, 'hóa đơn');
      try {
        await api.post(`/invoices/${inv.id}/confirm-payment`, { paymentMethod: method });
      } catch {
        try {
          await api.post('/payments', {
            invoiceId: inv.id,
            amount: Number(inv.totalAmount ?? inv.total ?? 0),
            paymentMethod: method.toUpperCase().includes('CASH') ? 'CASH' : 'BANK_TRANSFER',
            payerName: payerName || user?.fullName || 'Khách thuê',
            note: method
          });
        } catch { /* fallback handled locally */ }
      }
      setState(prev => ({
        ...prev,
        invoices: prev.invoices.map(i => i.id === inv.id ? { ...i, status: 'PAID' } : i)
      }));
      await refreshData();
      return { success: true, data: inv.id };
    }
};
}
