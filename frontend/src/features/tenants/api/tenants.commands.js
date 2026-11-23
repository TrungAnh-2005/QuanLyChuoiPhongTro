// Commands consume current state through the app's composition boundary.
export function createTenantsCommands({ actions, api, create, data, find, isoDate, patch, refreshData, remove, request, room, tenantId, tenantPayload, today, view }) {
  return {
addTenant: async input => {
      const existing=view.tenants.find(t=>t.identityCard===(input.cccd || input.identityCard));
      const created=existing || data(await api.post('/tenants',tenantPayload(input)));
      const selected=input.roomId || input.rooms?.[0] || input.room;
      if(selected && !view.contracts.some(c=>c.tenantId===created.id && c.status==='ACTIVE')) {
        const target=room(selected);
        const start=isoDate(input.contractStart || input.startDate); const end=new Date(start);end.setMonth(end.getMonth()+Number(input.durationMonths || 12));
        await api.post('/contracts',{tenantId:created.id,roomId:target.id,startDate:start,endDate:input.contractEnd?isoDate(input.contractEnd):end.toISOString().slice(0,10),rentalPrice:target.price,depositAmount:Number(input.deposit ?? target.price),paymentCycle:1});
      }
      await refreshData();return {...created,success:true};
    },
updateTenant: (id, input) => request('put', `/tenants/${id}`, tenantPayload({ ...find(view.tenants,id), ...input })),
deleteTenant: id => request('delete', `/tenants/${id}`),
addRoomMember: input => create('roomMembers',{ roomId: input.roomId || room(input.room || input.roomNumber).id, tenantId:tenantId(input),contractId: input.contractId || view.contracts.find(c=>c.roomId === (input.roomId || room(input.room || input.roomNumber).id) && c.status === 'ACTIVE')?.id,joinDate:today(),roleInRoom:input.roleInRoom || 'MEMBER',temporaryResidenceStatus:input.temporaryResidenceStatus || 'NOT_REGISTERED' }),
removeRoomMember: id => remove('roomMembers',id),
updateTemporaryResidence: (id,status) => patch('roomMembers',id,{temporaryResidenceStatus:status}),
updateResidentCccd: (id,input) => actions.updateTenant(find(view.roomMembers,id).tenantId,input),
resetTenantPassword: (id,password) => request('post','/auth/accounts/reset-by-email',{email:find(view.tenants,id).email,password})
};
}
