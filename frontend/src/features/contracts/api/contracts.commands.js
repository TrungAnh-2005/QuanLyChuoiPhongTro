// Commands consume current state through the app's composition boundary.
export function createContractsCommands({ api, create, data, find, findRoommateSponsor, isoDate, missingSponsorMessage, normalizeGender, patch, refreshData, remove, request, room, tenantId, user, view }) {
  return {
voteRoommateRequest: (id,_name,approved) => request('post',`/contracts/requests/${id}/vote`,{approved}),
submitRoomRequest: input => create('roomRequests', { type: input.type === 'NEW_RENT' || input.type === 'HOLD' ? 'RENT' : input.type, tenantId: tenantId(input), targetRoomId: input.targetRoomId || room(input.targetRoom || input.room).id, currentRoomId: input.currentRoom ? room(input.currentRoom).id : null, contractId: ['RENT', 'NEW_RENT', 'HOLD'].includes(input.type) ? undefined : (input.contractId || view.contracts.find(c=>c.tenantId===tenantId(input) && c.status==='ACTIVE')?.id), durationMonths: input.durationMonths || 12, note: input.note || input.reason || '' }),
approveRoomRequest: id => request('post',`/contracts/requests/${id}/approve`,{}),
getRoomRequestReceipts: async id => data(await api.get(`/contracts/requests/${id}/receipts`)),
confirmRoomRequestDeposit: async (id, input) => {
      try { return await request('post', `/contracts/requests/${id}/deposit`, { amount: Number(input.amount), receiptReference: input.receiptReference }); }
      catch (failure) {
        if (![400, 409].includes(failure.response?.status)) throw failure;
        let receipts;
        try {
          receipts = data(await api.get(`/contracts/requests/${id}/receipts`));
          if (!Array.isArray(receipts)) throw new Error('Invalid receipt ledger');
          await refreshData();
        } catch { throw failure; } // An unavailable ledger cannot prove that a receipt was rejected.
        const recorded = receipts.find(receipt => receipt.receiptReference === input.receiptReference);
        if (recorded) return { success: true, data: recorded, reconciled: true };
        failure.receiptRejected = true;
        throw failure;
      }
    },
cancelRentalRequest: (id, reason) => request('post', `/contracts/requests/${id}/cancel`, { reason }),
rejectRoomRequest: (id, note) => patch('roomRequests',id,{ status: 'REJECTED', note }),
submitCheckoutRequest: input => {
      const target = input.roomId ? room(input.roomId) : room(input.room);
      const ownerId = input.tenantId || tenantId(input);
      const contract = view.contracts.find(c => c.roomId === target.id && c.tenantId === ownerId && c.status === 'ACTIVE'
        && (!input.contractId || c.id === input.contractId));
      if (!contract) throw new Error('Không tìm thấy hợp đồng đang thuê của người đại diện phòng');
      const existing = view.roomRequests.find(q => q.type === 'CHECKOUT' && q.contractId === contract.id
        && ['PENDING', 'WAITING_ROOMMATES', 'APPROVED'].includes(q.status));
      if (existing) return Promise.resolve({success:true,data:existing});
      return create('roomRequests', {type:'CHECKOUT',tenantId:ownerId,targetRoomId:target.id,contractId:contract.id,
        note:input.reason || '',forfeitDeposit:Boolean(input.forfeitDeposit),moveOutDate:isoDate(input.moveOutDate),
        bankAccount:input.refundAccountNumber || input.bankAccount,bankName:input.refundBank || input.bankName,
        accountHolder:input.refundAccountName || input.accountHolder});
    },
cancelRoomHold: number => { const q = view.roomRequests.find(q => q.targetRoom === number && q.status === 'PENDING'); return remove('roomRequests',q.id); },
submitRoommateRequest: input => {
      const targetRoomId = input.roomId || room(input.room || input.roomNumber).id;
      const ownerId = input.requestedByTenantId || tenantId(input);
      if (!findRoommateSponsor(view.contracts, view.roomMembers, { roomId: targetRoomId, requestedByTenantId: ownerId })) throw new Error(missingSponsorMessage);
      return create('roommateRequestsV2', { roomId: targetRoomId, requestedByTenantId: ownerId, fullName:input.fullName, identityCard: input.identityCard || input.cccd, phone:input.phone, birthDate:isoDate(input.birthDate),gender:normalizeGender(input.gender),hometown:input.hometown });
    },
reviewRoommateRequest: (id, approved, reason = '') => {
      const row = find(view.roommateRequestsV2, id);
      const sponsor = findRoommateSponsor(view.contracts, view.roomMembers, row);
      if (approved && !sponsor) throw new Error(missingSponsorMessage);
      return request('post', `/tenants/roommate-requests/${id}/review`, { approved, rejectionReason: reason, ...(approved ? { contractId: sponsor.id } : {}) });
    },
submitMoveOutNotice: input => { const c = input.contractId ? find(view.contracts,input.contractId) : view.contracts.find(c=>c.roomNumber === (input.roomNumber || input.room) && c.status === 'ACTIVE'); return create('moveOutSettlements',{contractId:c.id,roomId:c.roomId,tenantId:c.tenantId,moveOutDate:isoDate(input.moveOutDate),originalDeposit:c.depositAmount,refundAmount:c.depositAmount,reason:input.reason,bankAccount:input.bankAccount,bankName:input.bankName,accountHolder:input.accountHolder}); },
settleMoveOut: async (id,input={}) => {
      const selected=find(view.moveOutSettlements,typeof id==='object'?id.id:id);
      const result=data(await api.post(`/contracts/settlements/${selected.id}/complete`,{damageFee:Number(input.damageFee || 0),unpaidUtilitiesFee:Number(input.unpaidUtilitiesFee || 0)}));
      await refreshData();return {success:true,data:result};
    },
leaveRoom: (number, _name, input = {}) => {
      const tenant = view.tenants.find(t => t.email && t.email === user?.email)
        || view.tenants.find(t => t.fullName === user?.fullName);
      if (!tenant) throw new Error('Không tìm thấy hồ sơ khách thuê của bạn');
      const target = input.roomId ? find(view.rooms, input.roomId) : room(number);
      const contract = view.contracts.find(c => c.roomId === target.id && c.status === 'ACTIVE'
        && (c.tenantId === tenant.id || view.roomMembers.some(m => m.contractId === c.id && m.tenantId === tenant.id && m.status === 'ACTIVE')));
      if (!contract) throw new Error('Không tìm thấy hợp đồng đang thuê của bạn');
      return request('post', `/contracts/${contract.id}/leave`, { tenantId: tenant.id, successorTenantId: input.successorTenantId || null, reason: input.reason || '' });
    },
signContractElectronically: id => request('post',`/contracts/${find(view.contracts,id).id}/sign`,{}),
payDepositAndSignContract: (id,options={}) => request('post',`/contracts/${find(view.contracts,id).id}/confirm-deposit`,options)
};
}
