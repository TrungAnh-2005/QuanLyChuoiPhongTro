// Commands consume current state through the app's composition boundary.
export function createMetersCommands({ api, billingMonth, create, find, patch, refreshData, room, setDrafts, setMonth, tenantId, view }) {
  return {
unlockMeterReading: id => setDrafts(prev => ({...prev,[id]:{...prev[id],recorded:false}})),
switchBillingMonth: setMonth,
updateMeterReading: (id, field, value) => setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [field]: Number(value) } })),
saveMeterReading: async id => {
      const m = find(view.meters,id);
      for (const [meterType, newReading, unitPrice] of [['ELECTRICITY',m.newElec,m.elecPrice],['WATER',m.newWater,m.waterPrice]]) await api.post('/meters/readings', { roomId: m.roomId, meterType, newReading, unitPrice, readingDate: `${billingMonth}-01` });
      const contract=view.contracts.find(c=>c.roomId===m.roomId && c.status==='ACTIVE');
      const invoice=view.invoices.find(i=>i.roomId===m.roomId);
      if(invoice && invoice.status!=='PAID') await api.put(`/invoices/${invoice.id}/meter-fees`,{electricityFee:Math.max(0,m.newElec-m.oldElec)*m.elecPrice,waterFee:Math.max(0,m.newWater-m.oldWater)*m.waterPrice});
      else if(contract && !invoice) await api.post('/invoices/generate-monthly',{contractId:contract.id,month:Number(billingMonth.slice(5)),year:Number(billingMonth.slice(0,4))});
      setDrafts(prev => { const next = {...prev}; delete next[id]; return next; }); await refreshData(); return { success: true };
    },
submitMeterDispute: input => create('meterDisputes',{roomId:input.roomId || room(input.room || input.roomNumber).id,tenantId:tenantId(input),recordedPeriod:input.recordedPeriod || billingMonth,meterType:input.meterType || 'ELECTRICITY',systemReading:Number(input.systemReading),reportedReading:Number(input.reportedReading),note:input.note || input.reason,imageUrl:input.imageUrl}),
resolveMeterDispute: (id,status='RESOLVED',note='') => patch('meterDisputes',id,{status,resolutionNotes:note})
};
}
