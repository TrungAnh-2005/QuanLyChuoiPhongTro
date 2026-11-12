import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
const DataContext = createContext(null);
// Retained export names for consumers; application data always comes from Gateway.
export const ALL_ROOMS = [], DEFAULT_ROOM_MEMBERS = [], DEFAULT_CONTRACTS = [];
const normalizeGender = value => { const normalized=String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); return ['MALE','NAM','M'].includes(normalized)?'MALE':['FEMALE','NU','F'].includes(normalized)?'FEMALE':'OTHER'; };
const today = () => new Date().toISOString().slice(0, 10);
const isoDate = value => value?.includes('/') ? value.split('/').reverse().join('-') : value || today();
const camel = row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), value]));
const data = response => response?.data ?? response;
const initial = { rooms: [], tenants: [], contracts: [], invoices: [], tickets: [], boardingHouses: [], roomRequests: [], roomMembers: [], roommateRequestsV2: [], moveOutSettlements: [], meterDisputes: [], houseServiceConfigs: [], saasInvoices: [], landlords: [], landlordProfiles: [], auditLogs: [], notifications: [], readings: [], systemIntegrations: {}, microservices: [] };
const resources = { roomRequests: '/contracts/records/requests', roomMembers: '/tenants/records/members', roommateRequestsV2: '/tenants/records/roommate-requests', moveOutSettlements: '/contracts/records/settlements', meterDisputes: '/meters/records/disputes', houseServiceConfigs: '/rooms/records/service-configs', saasInvoices: '/invoices/records/saas' };
export function DataProvider({ children }) {
  const { user, testMode, loading: authLoading } = useAuth();
  const [state, setState] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [billingMonth, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [drafts, setDrafts] = useState({});
  const generation = useRef(0);
  const refreshData = useCallback(async () => {
    if (!user) return;
    const version = ++generation.current;
    setLoading(true); setError('');
    const endpoints = { rooms: '/rooms', tenants: '/tenants', contracts: '/contracts', invoices: '/invoices', tickets: '/maintenance', boardingHouses: '/properties', ...resources,
      notifications: '/notifications', ...(user.role==='ADMIN'?{microservices:'/reports/system-status'}:{}), ...(user.role!=='TENANT'?{revenueReport:'/reports/revenue',dashboardSummary:'/reports/dashboard-summary',debtReport:'/reports/debt',occupancyReport:'/reports/occupancy',expiringContracts:'/reports/contracts-expiring'}:{}), ...(!testMode && user.role==='STAFF'?{landlords:'/auth/accounts/me',landlordProfiles:'/auth/profiles'}:{}), ...(!testMode && user.role === 'ADMIN' ? { landlords: '/auth/accounts', landlordProfiles: '/auth/profiles', auditLogs: '/auth/audit-logs', systemIntegrations: '/auth/integrations',microservices:'/reports/system-status' } : {}) };
    const results = await Promise.allSettled(Object.entries(endpoints).map(async ([key, url]) => {
      const result = data(await api.get(url));
      return [key, Array.isArray(result) ? result.map(camel) : result?.content || result];
    }));
    if (version !== generation.current) return;
    const next = { ...initial }; const failures = [];
    results.forEach((result, index) => { if (result.status === 'fulfilled') next[result.value[0]] = result.value[1]; else failures.push(`${Object.keys(endpoints)[index]}: ${result.reason.message}`); });
    setState(next);
    setLoading(false); setError(failures.join('; '));
    // One-way compatibility cache for existing display-only selectors. Never read as authoritative data.
    localStorage.setItem('rental_boarding_houses', JSON.stringify(next.boardingHouses.map(h => ({ ...h, code: h.code || `CS-${h.id}`, manager: h.managerName, floors: h.totalFloors || 1, status: h.status || 'ACTIVE' }))));
    window.dispatchEvent(new Event('rental:data-loaded'));
    const readingResults = await Promise.allSettled(next.rooms.map(async room => [room.id, data(await api.get(`/meters/rooms/${room.id}`))]));
    if (version === generation.current) setState(prev => ({ ...prev, readings: readingResults.filter(r => r.status === 'fulfilled').flatMap(r => r.value[1].map(reading => ({ ...reading, roomId: r.value[0] }))) }));
  }, [user?.id, user?.role, testMode]);
  useEffect(() => { localStorage.setItem('rental_boarding_houses','[]'); window.dispatchEvent(new Event('rental:data-loaded')); setState(initial); setDrafts({}); if (user) refreshData(); else { generation.current++; setLoading(false); } }, [refreshData]);
  const view = useMemo(() => {
    const houses = state.boardingHouses.map(h => ({ ...h, code: h.code || `CS-${h.id}`, manager: h.managerName, floors: h.totalFloors || 1, status: h.status || 'ACTIVE' }));
    const rooms = state.rooms.map(r => { const h = houses.find(h => h.id === r.boardingHouseId); return { ...r, number: r.roomNumber, price: Number(r.basePrice), floor: `Tầng ${r.floorNumber || 1}`, house: h?.name || r.boardingHouseName, houseCode: h?.code, occupants: state.contracts.filter(c => c.roomId === r.id && c.status === 'ACTIVE').length }; });
    const contracts = state.contracts.map(c => ({ ...c, roomNumber: rooms.find(r => r.id === c.roomId)?.number, tenantName: state.tenants.find(t => t.id === c.tenantId)?.fullName, houseCode: rooms.find(r => r.id === c.roomId)?.houseCode }));
    const tenants = state.tenants.map(t => { const active = contracts.filter(c => c.status === 'ACTIVE' && (c.tenantId === t.id || state.roomMembers.some(m=>m.tenantId===t.id && m.contractId===c.id && m.status!=='MOVED_OUT'))); const r = rooms.find(r => r.id === active[0]?.roomId); return { ...t, name: t.fullName, cccd: t.identityCard, room: r?.number || null, rooms: active.map(c => c.roomNumber), houseCode: r?.houseCode, house: r?.house, contractStart: active[0]?.startDate, contractEnd: active[0]?.endDate, deposit: Number(active[0]?.depositAmount || 0) }; });
    const invoices = state.invoices.filter(i => `${i.year}-${String(i.month).padStart(2, '0')}` === billingMonth).map(i => ({ ...i, code: i.invoiceCode, room: rooms.find(r => r.id === i.roomId)?.number, house: rooms.find(r => r.id === i.roomId)?.house, tenant: tenants.find(t => t.id === i.tenantId)?.fullName, elec: Number(i.electricityFee), water: Number(i.waterFee), service: Number(i.serviceFee || 0) + Number(i.internetFee || 0) + Number(i.parkingFee || 0), total: Number(i.totalAmount), sentToTenant: true, meterRecorded: true }));
    const tickets = state.tickets.map(t => ({ ...t, room: rooms.find(r => r.id === t.roomId)?.number, houseCode: rooms.find(r => r.id === t.roomId)?.houseCode, tenant: tenants.find(x => x.id === t.tenantId)?.fullName, issue: t.description, date: t.requestedDate }));
    const enrich = rows => rows.map(row => ({ ...row, room: rooms.find(r => r.id === row.roomId)?.number, roomNumber: rooms.find(r => r.id === row.roomId)?.number, houseCode: rooms.find(r => r.id === row.roomId)?.houseCode, tenantName: tenants.find(t => t.id === row.tenantId)?.fullName }));
    const meters = rooms.map(r => {
      const readings = state.readings.filter(m => m.roomId === r.id && m.readingDate?.startsWith(billingMonth)).sort((a,b) => b.id - a.id);
      const e = readings.find(m => m.meterType === 'ELECTRICITY'), w = readings.find(m => m.meterType === 'WATER');
      return { ...r, id: r.id, roomId: r.id, room: r.number, tenant: tenants.find(t => t.room === r.number && t.houseCode === r.houseCode)?.fullName, oldElec: e?.oldReading ?? 0, newElec: e?.newReading ?? 0, oldWater: w?.oldReading ?? 0, newWater: w?.newReading ?? 0, elecPrice: Number(e?.unitPrice ?? 3500), waterPrice: Number(w?.unitPrice ?? 25000), recorded: !!e && !!w, paid: invoices.some(i => i.roomId === r.id && i.status === 'PAID'), ...drafts[r.id] };
    });
    return { ...state, allInvoices:state.invoices, landlordProfiles:state.landlordProfiles.map(p=>({...p,username:p.userId===user?.id?user.username:state.landlords.find(l=>l.id===p.userId)?.username})), boardingHouses: houses, rooms, tenants, contracts, invoices, tickets, meters, roomMembers: enrich(state.roomMembers).map(m => ({ ...m, fullName: tenants.find(t => t.id === m.tenantId)?.fullName, cccd: tenants.find(t => t.id === m.tenantId)?.cccd, temporaryResidenceStatus: m.temporaryResidenceStatus || m.tempResidenceStatus })), roomRequests: state.roomRequests.map(q => ({ ...q, tenant: tenants.find(t => t.id === q.tenantId)?.fullName, targetRoom: rooms.find(r => r.id === q.targetRoomId)?.number, currentRoom: rooms.find(r => r.id === q.currentRoomId)?.number })), roommateRequestsV2: enrich(state.roommateRequestsV2), moveOutSettlements: enrich(state.moveOutSettlements), meterDisputes: enrich(state.meterDisputes), houseServiceConfigs: state.houseServiceConfigs.map(c => ({ ...c, houseCode: houses.find(h => h.id === c.boardingHouseId)?.code })), landlords: (testMode ? [{...user,packageCode:'ENTERPRISE',status:'ACTIVE'}] : state.landlords).map(l => ({ ...l, isLocked: l.status === 'LOCKED' })) };
  }, [state, billingMonth, drafts]);
  const find = (rows, id) => { const row = rows.find(r => [r.id,r.number,r.code,r.contractCode].some(v => v != null && String(v) === String(id))); if (!row) throw new Error('Không tìm thấy dữ liệu'); return row; };
  const room = value => find(view.rooms, value);
  const tenantId = input => input.tenantId || view.tenants.find(t => t.email === user?.email)?.id || view.tenants.find(t => t.fullName === (input.tenant || input.tenantName || user?.fullName))?.id || (testMode ? view.tenants[0]?.id : undefined);
  const request = async (method, url, payload) => { const result = data(await api[method](url, payload)); await refreshData(); return { ...result, success: true, data: result }; };
  const create = (key, body) => request('post', resources[key], body);
  const patch = (key, id, body) => request('patch', `${resources[key]}/${id}`, body);
  const remove = (key, id) => request('delete', `${resources[key]}/${id}`);
  const roomPayload = input => ({ roomNumber: input.number || input.roomNumber, basePrice: Number(input.price ?? input.basePrice), area: Number(input.area), floorId: input.floorId, maxOccupants: Number(input.maxOccupants ?? 2), ...(input.status ? {status: input.status === 'LOCKED' ? 'MAINTENANCE' : input.status} : {}) });
  const tenantPayload = input => ({ fullName: input.fullName || input.name, identityCard: input.cccd || input.identityCard, phone: input.phone, email: input.email || undefined, birthDate: input.birthDate ? isoDate(input.birthDate) : undefined, gender: normalizeGender(input.gender), hometown: input.hometown, address: input.address });
  const resolveFloor = async input => {
    const floorNumber=Number(String(input.floor || input.floorNumber || 1).replace(/\D/g,'')) || 1;
    const house=find(view.boardingHouses,input.boardingHouseId || input.houseCode);
    const floors=data(await api.get('/rooms/records/floors')).map(camel),buildings=data(await api.get('/rooms/records/buildings')).map(camel);
    let building=buildings.find(b=>b.boardingHouseId===house.id);
    if(!building) building=camel(data(await api.post('/rooms/records/buildings',{boardingHouseId:house.id,name:'Tòa A'})));
    const existing=floors.find(f=>f.buildingId===building.id && f.floorNumber===floorNumber);
    return existing?.id || data(await api.post('/rooms/records/floors',{buildingId:building.id,floorNumber})).id;
  };
  const actions = {
    refreshData,
    unlockMeterReading: id => setDrafts(prev => ({...prev,[id]:{...prev[id],recorded:false}})),
    updateUtilityPrices: async prices => {
      for (const house of view.boardingHouses) for (const [serviceName,unitPrice] of [['Điện',prices.elecPrice],['Nước',prices.waterPrice]]) {
        const existing = view.houseServiceConfigs.find(c=>c.boardingHouseId===house.id && c.serviceName===serviceName);
        if(existing) await api.patch(`${resources.houseServiceConfigs}/${existing.id}`,{unitPrice:Number(unitPrice)});
        else await api.post(resources.houseServiceConfigs,{boardingHouseId:house.id,serviceName,calculationType:'METER',unitPrice:Number(unitPrice)});
      }
      await refreshData(); return {success:true};
    },
    addMaintenanceFeeToInvoice: (number,amount) => request('post',`/invoices/${view.invoices.find(i=>i.roomId===room(number).id && i.status!=='PAID')?.id}/maintenance-fee`,{amount:Number(amount)}),
    transferContractHolder: (number,_previous,name) => {
      const contract = view.contracts.find(c=>c.roomId===room(number).id && c.status==='ACTIVE');
      const successor = view.tenants.find(t=>t.fullName===name);
      return request('post',`/contracts/${contract.id}/representative`,{tenantId:successor?.id});
    },
    inspectAndApproveCheckout: id => actions.approveRoomRequest(id),
    voteRoommateRequest: (id,_name,approved) => request('post',`/contracts/requests/${id}/vote`,{approved}),
    sendSaasReminder: invoice => request('post','/notifications',{userId:invoice.landlordId,title:`Nhắc thanh toán ${invoice.code}`,content:`Vui lòng thanh toán hóa đơn ${invoice.code}`,type:'INVOICE'}),
    recordHouseDeletion: input => actions.addAuditLog({action:'DELETE_HOUSE',target:input.houseCode,details:input.houseName}),
    recordPackagePurchase: input => actions.addAuditLog({action:'PACKAGE_PURCHASE',target:input.invoiceCode || input.packageCode,details:input.packageName}),
    switchBillingMonth: setMonth,
    updateMeterReading: (id, field, value) => setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [field]: Number(value) } })),
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
    addRoom: async input => request('post','/rooms',{...roomPayload(input),floorId:await resolveFloor(input)}),
    updateRoom: async (id,input) => { const merged={...room(id),...input}; return request('put',`/rooms/${room(id).id}`,{...roomPayload(merged),floorId:await resolveFloor(merged)}); },
    updateRoomPrice: (id, price) => { const r = room(id); if (r.status === 'OCCUPIED') throw new Error('Không thể sửa giá phòng đang thuê'); return actions.updateRoom(r.id, { price }); },
    updateRoomStatus: (id, status) => request('patch', `/rooms/${room(id).id}/status`, { status: status === 'LOCKED' ? 'MAINTENANCE' : status }),
    deleteRoom: id => request('delete', `/rooms/${room(id).id}`),
    createTicket: input => request('post', '/maintenance', { roomId: input.roomId || room(input.room).id, tenantId: tenantId(input), title: input.title || input.issue, description: input.description || input.issue, imageUrl: input.imageUrl, priority: input.priority || 'MEDIUM' }),
    updateTicketStatus: (id, status, details={}) => request('put', `/maintenance/${id}/status`, { status, ...details }),
    payInvoice: async (id, method = 'CASH', payerName) => { if(method==='SEPAY') { await refreshData(); return {success:true}; } const inv = find(view.invoices,id); return request('post', '/payments', { invoiceId: inv.id, amount: inv.totalAmount, paymentMethod: method.toUpperCase().includes('CASH') ? 'CASH' : 'BANK_TRANSFER', payerName: payerName || user.fullName, note: method }); },
    saveMeterReading: async id => {
      const m = find(view.meters,id);
      for (const [meterType, newReading, unitPrice] of [['ELECTRICITY',m.newElec,m.elecPrice],['WATER',m.newWater,m.waterPrice]]) await api.post('/meters/readings', { roomId: m.roomId, meterType, newReading, unitPrice, readingDate: `${billingMonth}-01` });
      const contract=view.contracts.find(c=>c.roomId===m.roomId && c.status==='ACTIVE');
      const invoice=view.invoices.find(i=>i.roomId===m.roomId);
      if(invoice && invoice.status!=='PAID') await api.put(`/invoices/${invoice.id}/meter-fees`,{electricityFee:Math.max(0,m.newElec-m.oldElec)*m.elecPrice,waterFee:Math.max(0,m.newWater-m.oldWater)*m.waterPrice});
      else if(contract && !invoice) await api.post('/invoices/generate-monthly',{contractId:contract.id,month:Number(billingMonth.slice(5)),year:Number(billingMonth.slice(0,4))});
      setDrafts(prev => { const next = {...prev}; delete next[id]; return next; }); await refreshData(); return { success: true };
    },
    addHouseServiceConfig: input => create('houseServiceConfigs', { boardingHouseId: input.boardingHouseId || find(view.boardingHouses,input.houseCode).id, serviceName: input.serviceName, calculationType: input.calculationType, unitPrice: Number(input.unitPrice) }),
    updateHouseServiceConfig: (id, price, type) => patch('houseServiceConfigs',id,{ unitPrice: Number(price), ...(type ? {calculationType:type} : {}) }),
    deleteHouseServiceConfig: id => remove('houseServiceConfigs',id),
    submitRoomRequest: input => create('roomRequests', { type: input.type === 'NEW_RENT' || input.type === 'HOLD' ? 'RENT' : input.type, tenantId: tenantId(input), targetRoomId: input.targetRoomId || room(input.targetRoom || input.room).id, currentRoomId: input.currentRoom ? room(input.currentRoom).id : null, contractId:input.contractId || view.contracts.find(c=>c.tenantId===tenantId(input) && c.status==='ACTIVE')?.id, durationMonths: input.durationMonths || 12, note: input.note || input.reason || '' }),
    approveRoomRequest: id => request('post',`/contracts/requests/${id}/approve`,{}),
    rejectRoomRequest: (id, note) => patch('roomRequests',id,{ status: 'REJECTED', note }),
    submitCheckoutRequest: input => actions.submitRoomRequest({ ...input, type:'CHECKOUT',targetRoom:input.room }),
    submitContractRenewalRequest: input => actions.submitRoomRequest({ ...input, type:'RENEW_CONTRACT',targetRoom:input.room }),
    cancelRoomHold: number => { const q = view.roomRequests.find(q => q.targetRoom === number && q.status === 'PENDING'); return remove('roomRequests',q.id); },
    submitRoommateRequest: input => create('roommateRequestsV2', { roomId: input.roomId || room(input.room || input.roomNumber).id, requestedByTenantId: tenantId(input), fullName:input.fullName, identityCard: input.identityCard || input.cccd, phone:input.phone, birthDate:isoDate(input.birthDate),gender:normalizeGender(input.gender),hometown:input.hometown }),
    reviewRoommateRequest: (id, approved, reason = '') => request('post',`/tenants/roommate-requests/${id}/review`,{approved,rejectionReason:reason,contractId:view.contracts.find(c=>c.roomId===find(view.roommateRequestsV2,id).roomId && c.status==='ACTIVE')?.id}),
    addRoomMember: input => create('roomMembers',{ roomId: input.roomId || room(input.room || input.roomNumber).id, tenantId:tenantId(input),contractId: input.contractId || view.contracts.find(c=>c.roomId === (input.roomId || room(input.room || input.roomNumber).id) && c.status === 'ACTIVE')?.id,joinDate:today(),roleInRoom:input.roleInRoom || 'MEMBER' }),
    removeRoomMember: id => remove('roomMembers',id),
    updateTemporaryResidence: (id,status) => patch('roomMembers',id,{temporaryResidenceStatus:status}),
    updateResidentCccd: (id,input) => actions.updateTenant(find(view.roomMembers,id).tenantId,input),
    submitMeterDispute: input => create('meterDisputes',{roomId:input.roomId || room(input.room || input.roomNumber).id,tenantId:tenantId(input),recordedPeriod:input.recordedPeriod || billingMonth,meterType:input.meterType || 'ELECTRICITY',systemReading:Number(input.systemReading),reportedReading:Number(input.reportedReading),note:input.note || input.reason,imageUrl:input.imageUrl}),
    resolveMeterDispute: (id,status='RESOLVED',note='') => patch('meterDisputes',id,{status,resolutionNotes:note}),
    submitMoveOutNotice: input => { const c = input.contractId ? find(view.contracts,input.contractId) : view.contracts.find(c=>c.roomNumber === (input.roomNumber || input.room) && c.status === 'ACTIVE'); return create('moveOutSettlements',{contractId:c.id,roomId:c.roomId,tenantId:c.tenantId,moveOutDate:isoDate(input.moveOutDate),originalDeposit:c.depositAmount,refundAmount:c.depositAmount,reason:input.reason,bankAccount:input.bankAccount,bankName:input.bankName,accountHolder:input.accountHolder}); },
    settleMoveOut: async (id,input={}) => {
      const selected=find(view.moveOutSettlements,typeof id==='object'?id.id:id);
      const result=data(await api.post(`/contracts/settlements/${selected.id}/complete`,{damageFee:Number(input.damageFee || 0),unpaidUtilitiesFee:Number(input.unpaidUtilitiesFee || 0)}));
      for(const member of view.roomMembers.filter(m=>m.contractId===selected.contractId)) await api.patch(`${resources.roomMembers}/${member.id}`,{status:'MOVED_OUT'});
      await refreshData();return {success:true,data:result};
    },
    leaveRoom: number => actions.submitCheckoutRequest({room:number}),
    transferRoom: input => actions.submitRoomRequest({...input,type:'TRANSFER',currentRoom:input.oldRoom,targetRoom:input.newRoom,tenant:input.tenantName}),
    createSaasInvoice: input => create('saasInvoices',{code:input.code || `SAAS-${Date.now()}`,landlordId:input.landlordId,packageName:input.packageName,packageCode:input.packageCode,billingCycle:input.billingCycle || '12 tháng',period:input.period || billingMonth,amount:input.amount,dueDate:isoDate(input.dueDate)}),
    paySaasInvoice: (id,method='CASH') => request('post',`/invoices/saas/${find(view.saasInvoices,id).id}/confirm-payment`,{paymentMethod:method}),
    resetSaasInvoiceStatus: id => patch('saasInvoices',find(view.saasInvoices,id).id,{status:'UNPAID',paidAt:null}),
    createLandlord: input => request('post','/auth/accounts',{...input,role:'STAFF'}),
    toggleLandlordLock: id => request('patch',`/auth/accounts/${id}`,{status:find(view.landlords,id).isLocked ? 'ACTIVE':'LOCKED'}),
    updateLandlordPackage: (id,packageCode) => request('patch',`/auth/accounts/${id}`,{packageCode}),
    resetLandlordPassword: (id,password) => request('post',`/auth/accounts/${id}/reset-password`,{password}),
    resetTenantPassword: (id,password) => request('post','/auth/accounts/reset-by-email',{email:find(view.tenants,id).email,password}),
    verifyLandlordKyc: (id,approved,reason='') => request('patch',`/auth/profiles/${id}`,{kycStatus:approved ? 'VERIFIED':'REJECTED',rejectionReason:reason}),
    updateSystemIntegration: (key,config) => request('put',`/auth/integrations/${encodeURIComponent(key)}`,config),
    addAuditLog: input => request('post','/auth/audit-logs',input),
    signContractElectronically: id => request('post',`/contracts/${find(view.contracts,id).id}/sign`,{}),
    payDepositAndSignContract: (id,options={}) => request('post',`/contracts/${find(view.contracts,id).id}/confirm-deposit`,options),
    markNotificationRead: id => request('patch',`/notifications/${id}/read`,{}),
    markAllNotificationsRead: () => request('patch','/notifications/read-all',{}),
    addBoardingHouse: input => request('post','/properties',input),
    updateBoardingHouse: (id,input) => request('put',`/properties/${id}`,{...find(view.boardingHouses,id),...input}),
    deleteBoardingHouse: id => request('delete',`/properties/${id}`),
  };
  // Every exported mutation completes its request before reporting success to a screen.
  const wrapped = Object.fromEntries(Object.entries(actions).map(([name,fn]) => [name, ['switchBillingMonth','updateMeterReading','unlockMeterReading','refreshData'].includes(name) ? fn : async (...args) => {
    try { return await fn(...args); } catch (e) { setError(e.message); window.dispatchEvent(new CustomEvent('rental:api-error',{detail:e.message})); throw e; }
  }]));
  return <DataContext.Provider value={{...view,...wrapped,billingMonth,availableBillingMonths:[...new Set([billingMonth,new Date().toISOString().slice(0,7),...state.invoices.map(i=>`${i.year}-${String(i.month).padStart(2,'0')}`),...state.readings.map(r=>r.readingDate?.slice(0,7)).filter(Boolean)])].sort().reverse(),loading,error,metersHistory:{[billingMonth]:view.meters},invoicesHistory:{[billingMonth]:view.invoices},utilityPrices:{elecPrice:Number(view.houseServiceConfigs.find(c=>c.serviceName==='Điện')?.unitPrice || 3500),waterPrice:Number(view.houseServiceConfigs.find(c=>c.serviceName==='Nước')?.unitPrice || 25000)},systemNotices:state.notifications,roomPaymentNotices:[],roommateLeaveNotices:[],houseDeleteNotices:[],packagePurchaseNotices:[],saasReminders:[]}}>{authLoading ? <div role="status">Đang xác thực…</div> : children}</DataContext.Provider>;
}
export const useData = () => useContext(DataContext);
