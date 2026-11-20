import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import useMutationFeedback from '../hooks/useMutationFeedback';
import { findRoommateSponsor, missingSponsorMessage } from '../services/roommateWorkflow';
const DataContext = createContext(null);
const normalizeGender = value => { const normalized=String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); return ['MALE','NAM','M'].includes(normalized)?'MALE':['FEMALE','NU','F'].includes(normalized)?'FEMALE':'OTHER'; };
const today = () => new Date().toISOString().slice(0, 10);
const isoDate = value => value?.includes('/') ? value.split('/').reverse().join('-') : value || today();
const camel = row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), value]));
const data = response => response?.data ?? response;
const initial = { rooms: [], tenants: [], contracts: [], invoices: [], tickets: [], boardingHouses: [], roomRequests: [], roomMembers: [], roommateRequestsV2: [], moveOutSettlements: [], meterDisputes: [], houseServiceConfigs: [], saasInvoices: [], landlords: [], landlordProfiles: [], auditLogs: [], notifications: [], unreadNotificationCount: 0, readings: [], systemIntegrations: {}, microservices: [] };
const resources = { roomRequests: '/contracts/requests', roomMembers: '/tenants/members', roommateRequestsV2: '/tenants/roommate-requests', moveOutSettlements: '/contracts/settlements', meterDisputes: '/meters/disputes', houseServiceConfigs: '/rooms/service-configs', saasInvoices: '/invoices/saas' };
export function DataProvider({ children }) {
  const { user, testMode, loading: authLoading } = useAuth();
  const { notifications: mutationNotifications, dismiss: dismissMutationNotification, run: runMutation } = useMutationFeedback(`${user?.id}:${user?.role}`);
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
    const isTenant = user.role === 'TENANT';
    const baseResources = isTenant
      ? { roomRequests: '/contracts/requests', roomMembers: '/tenants/members', roommateRequestsV2: '/tenants/roommate-requests', moveOutSettlements: '/contracts/settlements', meterDisputes: '/meters/disputes', houseServiceConfigs: '/rooms/service-configs' }
      : resources;
    const endpoints = {
      rooms: '/rooms',
      tenants: '/tenants',
      contracts: '/contracts',
      invoices: '/invoices',
      tickets: '/maintenance',
      boardingHouses: '/properties',
      ...baseResources,
      readings: '/meters/readings',
      notifications: '/notifications',
      ...(user.role === 'ADMIN' ? { microservices: '/reports/system-status' } : {}),
      ...(!isTenant ? { revenueReport: '/reports/revenue' } : {}),
      ...(!testMode && user.role === 'STAFF' ? { landlords: '/auth/accounts/me', landlordProfiles: '/auth/profiles' } : {}),
      ...(!testMode && user.role === 'ADMIN' ? { landlords: '/auth/accounts', landlordProfiles: '/auth/profiles', auditLogs: '/auth/audit-logs', systemIntegrations: '/auth/integrations', microservices: '/reports/system-status' } : {})
    };
    const results = await Promise.allSettled(Object.entries(endpoints).map(async ([key, url]) => {
      const result = data(await api.get(url));
      return [key, Array.isArray(result) ? result.map(camel) : result?.content || result];
    }));
    if (version !== generation.current) return;
    const next = { ...initial }; const failures = [];
    let readingsBatchLoaded = false;
    results.forEach((result, index) => {
      const key = Object.keys(endpoints)[index];
      if (result.status === 'fulfilled') {
        next[key] = result.value[1];
        if (key === 'readings') readingsBatchLoaded = true;
      } else if (key !== 'readings') {
        failures.push(`${key}: ${result.reason.message}`);
      }
    });
    next.unreadNotificationCount = Array.isArray(next.notifications)
      ? next.notifications.filter(n => !n.isRead && !n.read).length
      : 0;
    setState(next);
    setLoading(false); setError(failures.join('; '));
    // One-way compatibility cache for existing display-only selectors. Never read as authoritative data.
    localStorage.setItem('rental_boarding_houses', JSON.stringify(next.boardingHouses.map(h => ({ ...h, code: h.code || `CS-${h.id}`, manager: h.managerName, floors: h.totalFloors || 1, status: h.status || 'ACTIVE' }))));
    window.dispatchEvent(new Event('rental:data-loaded'));
    if (!readingsBatchLoaded) {
      let targetRooms = next.rooms;
      if (isTenant) {
        const myTenant = next.tenants.find(t => (t.email && t.email === user?.email) || t.fullName === user?.fullName);
        const myRoomIds = new Set(
          next.contracts
            .filter(c => c.status === 'ACTIVE' && (c.tenantId === myTenant?.id || next.roomMembers.some(m => m.contractId === c.id && m.tenantId === myTenant?.id && m.status !== 'MOVED_OUT')))
            .map(c => c.roomId)
        );
        targetRooms = next.rooms.filter(r => myRoomIds.has(r.id));
      } else {
        targetRooms = next.rooms.filter(r => r.status === 'OCCUPIED');
      }
      if (targetRooms.length > 0) {
        const readingResults = await Promise.allSettled(targetRooms.map(async room => [room.id, data(await api.get(`/meters/rooms/${room.id}`))]));
        if (version === generation.current) setState(prev => ({ ...prev, readings: readingResults.filter(r => r.status === 'fulfilled').flatMap(r => r.value[1].map(reading => ({ ...camel(reading), roomId: r.value[0] }))) }));
      }
    }
  }, [user?.id, user?.role, testMode]);
  useEffect(() => { localStorage.setItem('rental_boarding_houses','[]'); window.dispatchEvent(new Event('rental:data-loaded')); setState(initial); setDrafts({}); if (user) refreshData(); else { generation.current++; setLoading(false); } }, [refreshData]);
  const view = useMemo(() => {
    const houses = state.boardingHouses.map(h => ({ ...h, code: h.code || `CS-${h.id}`, manager: h.managerName, floors: h.totalFloors || 1, status: h.status || 'ACTIVE' }));
    const rooms = state.rooms.map(r => { const h = houses.find(h => h.id === r.boardingHouseId); return { ...r, number: r.roomNumber, price: Number(r.basePrice), floor: `Tầng ${r.floorNumber || 1}`, house: h?.name || r.boardingHouseName, houseCode: h?.code, occupants: state.contracts.filter(c => c.roomId === r.id && c.status === 'ACTIVE').length }; });
    const contracts = state.contracts.map(c => ({ ...c, roomNumber: rooms.find(r => r.id === c.roomId)?.number, tenantName: state.tenants.find(t => t.id === c.tenantId)?.fullName, houseCode: rooms.find(r => r.id === c.roomId)?.houseCode }));
    const tenants = state.tenants.map(t => { const active = contracts.filter(c => c.status === 'ACTIVE' && (c.tenantId === t.id || state.roomMembers.some(m=>m.tenantId===t.id && m.contractId===c.id && m.status!=='MOVED_OUT'))); const r = rooms.find(r => r.id === active[0]?.roomId); return { ...t, name: t.fullName, cccd: t.identityCard, room: r?.number || null, rooms: active.map(c => c.roomNumber), houseCode: r?.houseCode, house: r?.house, contractStart: active[0]?.startDate, contractEnd: active[0]?.endDate, deposit: Number(active[0]?.depositAmount || 0) }; });
    const allInvoices = state.invoices.map(i => {
      const r = rooms.find(r => r.id === i.roomId);
      const t = tenants.find(t => t.id === i.tenantId);
      const monthStr = `${i.year}-${String(i.month).padStart(2, '0')}`;
      return {
        ...i,
        code: i.invoiceCode || `HD-${i.year}${String(i.month).padStart(2, '0')}-${String(i.id).padStart(2, '0')}`,
        room: r?.number,
        roomNumber: r?.number,
        house: r?.house,
        houseCode: r?.houseCode,
        tenant: t?.fullName,
        tenantName: t?.fullName,
        phone: t?.phone,
        month: `Tháng ${String(i.month).padStart(2, '0')}/${i.year}`,
        monthKey: monthStr,
        rent: Number(i.roomFee || 0),
        roomFee: Number(i.roomFee || 0),
        elec: Number(i.electricityFee || 0),
        electricityFee: Number(i.electricityFee || 0),
        electricFee: Number(i.electricityFee || 0),
        water: Number(i.waterFee || 0),
        waterFee: Number(i.waterFee || 0),
        service: Number(i.serviceFee || 0) + Number(i.internetFee || 0) + Number(i.parkingFee || 0),
        serviceFee: Number(i.serviceFee || 0) + Number(i.internetFee || 0) + Number(i.parkingFee || 0),
        total: Number(i.totalAmount || 0),
        totalAmount: Number(i.totalAmount || 0),
        sentToTenant: true,
        meterRecorded: true
      };
    });
    const invoices = allInvoices.filter(i => i.monthKey === billingMonth);
    const tickets = state.tickets.map(t => ({ ...t, room: rooms.find(r => r.id === t.roomId)?.number, houseCode: rooms.find(r => r.id === t.roomId)?.houseCode, tenant: tenants.find(x => x.id === t.tenantId)?.fullName, issue: t.description, date: t.requestedDate }));
    const enrich = rows => rows.map(row => ({ ...row, room: rooms.find(r => r.id === row.roomId)?.number, roomNumber: rooms.find(r => r.id === row.roomId)?.number, houseCode: rooms.find(r => r.id === row.roomId)?.houseCode, tenantName: tenants.find(t => t.id === row.tenantId)?.fullName }));
    const meters = rooms.map(r => {
      const readings = state.readings.filter(m => m.roomId === r.id && m.readingDate?.startsWith(billingMonth)).sort((a,b) => b.id - a.id);
      const e = readings.find(m => m.meterType === 'ELECTRICITY'), w = readings.find(m => m.meterType === 'WATER');
      return { ...r, id: r.id, roomId: r.id, room: r.number, tenant: tenants.find(t => t.room === r.number && t.houseCode === r.houseCode)?.fullName, oldElec: e?.oldReading ?? 0, newElec: e?.newReading ?? 0, oldWater: w?.oldReading ?? 0, newWater: w?.newReading ?? 0, elecPrice: Number(e?.unitPrice ?? 3500), waterPrice: Number(w?.unitPrice ?? 25000), recorded: !!e && !!w, paid: invoices.some(i => i.roomId === r.id && i.status === 'PAID'), ...drafts[r.id] };
    });
    return { ...state, allInvoices: allInvoices, landlordProfiles:state.landlordProfiles.map(p=>({...p,username:p.userId===user?.id?user.username:state.landlords.find(l=>l.id===p.userId)?.username})), boardingHouses: houses, rooms, tenants, contracts, invoices, tickets, meters, roomMembers: enrich(state.roomMembers).map(m => ({ ...m, fullName: tenants.find(t => t.id === m.tenantId)?.fullName, cccd: tenants.find(t => t.id === m.tenantId)?.cccd, temporaryResidenceStatus: m.temporaryResidenceStatus || m.tempResidenceStatus })), roomRequests: state.roomRequests.map(q => ({ ...q, tenant: tenants.find(t => t.id === q.tenantId)?.fullName, tenantName: tenants.find(t => t.id === q.tenantId)?.fullName, phone: tenants.find(t => t.id === q.tenantId)?.phone, houseCode: rooms.find(r => r.id === q.targetRoomId)?.houseCode, roomNumber: rooms.find(r => r.id === q.targetRoomId)?.number, targetRoom: rooms.find(r => r.id === q.targetRoomId)?.number, currentRoom: rooms.find(r => r.id === q.currentRoomId)?.number })), roommateRequestsV2: enrich(state.roommateRequestsV2), moveOutSettlements: enrich(state.moveOutSettlements), meterDisputes: enrich(state.meterDisputes), houseServiceConfigs: state.houseServiceConfigs.map(c => ({ ...c, houseCode: houses.find(h => h.id === c.boardingHouseId)?.code })), landlords: (testMode ? [{...user,packageCode:'ENTERPRISE',status:'ACTIVE'}] : state.landlords).map(l => ({ ...l, isLocked: l.status === 'LOCKED' })) };
  }, [state, billingMonth, drafts]);
  const find = (rows, id, label = 'dữ liệu') => {
    const row = rows?.find(r => [r.id, r.number, r.code, r.contractCode].some(v => v != null && String(v) === String(id)));
    if (!row) throw new Error(`Không tìm thấy ${label} (ID/Mã: ${id || 'trống'})`);
    return row;
  };
  const room = value => find(view.rooms, value, 'phòng');
  const tenantId = input => input.tenantId || view.tenants.find(t => t.email === user?.email)?.id || view.tenants.find(t => t.fullName === (input.tenant || input.tenantName || user?.fullName))?.id || (testMode ? view.tenants[0]?.id : undefined);
  const request = async (method, url, payload) => { const result = data(await api[method](url, payload)); await refreshData(); return { ...result, success: true, data: result }; };
  const create = (key, body) => request('post', resources[key], body);
  const patch = (key, id, body) => request('patch', `${resources[key]}/${id}`, body);
  const remove = (key, id) => request('delete', `${resources[key]}/${id}`);
  const roomPayload = input => ({ roomNumber: input.number || input.roomNumber, basePrice: Number(input.price ?? input.basePrice), area: Number(input.area), floorId: input.floorId, maxOccupants: Number(input.maxOccupants ?? 2), ...(input.status ? {status: input.status === 'LOCKED' ? 'MAINTENANCE' : input.status} : {}) });
  const tenantPayload = input => ({ fullName: input.fullName || input.name, identityCard: input.cccd || input.identityCard, phone: input.phone, email: input.email || undefined, birthDate: input.birthDate ? isoDate(input.birthDate) : undefined, gender: normalizeGender(input.gender), hometown: input.hometown, address: input.address });
  const resolveFloor = async input => {
    const floorNumber = Number(String(input.floor || input.floorNumber || 1).replace(/\D/g,'')) || 1;
    const targetHouse = input.boardingHouseId || input.houseCode;
    const house = (targetHouse ? view.boardingHouses.find(h => [h.id, h.code].some(v => v != null && String(v).toUpperCase() === String(targetHouse).toUpperCase())) : null) || view.boardingHouses[0];
    if (!house) throw new Error('Chưa có cơ sở nhà trọ nào trên hệ thống');
    const floors = data(await api.get('/rooms/floors')).map(camel), buildings = data(await api.get('/rooms/buildings')).map(camel);
    let building = buildings.find(b => b.boardingHouseId === house.id);
    if (!building) building = camel(data(await api.post('/rooms/buildings', { boardingHouseId: house.id, name: 'Tòa A' })));
    const existing = floors.find(f => f.buildingId === building.id && f.floorNumber === floorNumber);
    return existing?.id || data(await api.post('/rooms/floors', { buildingId: building.id, floorNumber })).id;
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
    voteRoommateRequest: (id,_name,approved) => request('post',`/contracts/requests/${id}/vote`,{approved}),
    sendSaasReminder: invoice => request('post','/notifications',{userId:invoice.landlordId,title:`Nhắc thanh toán ${invoice.code}`,content:`Vui lòng thanh toán hóa đơn ${invoice.code}`,type:'INVOICE'}),
    recordHouseDeletion: input => actions.addAuditLog({action:'DELETE_HOUSE',target:input.houseCode,details:input.houseName}),
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
    },
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
    submitRoomRequest: input => create('roomRequests', { type: input.type === 'NEW_RENT' || input.type === 'HOLD' ? 'RENT' : input.type, tenantId: tenantId(input), targetRoomId: input.targetRoomId || room(input.targetRoom || input.room).id, currentRoomId: input.currentRoom ? room(input.currentRoom).id : null, contractId: ['RENT', 'NEW_RENT', 'HOLD'].includes(input.type) ? undefined : (input.contractId || view.contracts.find(c=>c.tenantId===tenantId(input) && c.status==='ACTIVE')?.id), durationMonths: input.durationMonths || 12, note: input.note || input.reason || '' }),
    approveRoomRequest: id => request('post',`/contracts/requests/${id}/approve`,{}),
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
    addRoomMember: input => create('roomMembers',{ roomId: input.roomId || room(input.room || input.roomNumber).id, tenantId:tenantId(input),contractId: input.contractId || view.contracts.find(c=>c.roomId === (input.roomId || room(input.room || input.roomNumber).id) && c.status === 'ACTIVE')?.id,joinDate:today(),roleInRoom:input.roleInRoom || 'MEMBER',temporaryResidenceStatus:input.temporaryResidenceStatus || 'NOT_REGISTERED' }),
    removeRoomMember: id => remove('roomMembers',id),
    updateTemporaryResidence: (id,status) => patch('roomMembers',id,{temporaryResidenceStatus:status}),
    updateResidentCccd: (id,input) => actions.updateTenant(find(view.roomMembers,id).tenantId,input),
    submitMeterDispute: input => create('meterDisputes',{roomId:input.roomId || room(input.room || input.roomNumber).id,tenantId:tenantId(input),recordedPeriod:input.recordedPeriod || billingMonth,meterType:input.meterType || 'ELECTRICITY',systemReading:Number(input.systemReading),reportedReading:Number(input.reportedReading),note:input.note || input.reason,imageUrl:input.imageUrl}),
    resolveMeterDispute: (id,status='RESOLVED',note='') => patch('meterDisputes',id,{status,resolutionNotes:note}),
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
    createSaasInvoice: input => create('saasInvoices',{code:input.code || `SAAS-${Date.now()}`,landlordId:input.landlordId,packageName:input.packageName,packageCode:input.packageCode,billingCycle:input.billingCycle || '12 tháng',period:input.period || billingMonth,amount:input.amount,dueDate:isoDate(input.dueDate)}),
    paySaasInvoice: (id,method='CASH') => request('post',`/invoices/saas/${find(view.saasInvoices,id).id}/confirm-payment`,{paymentMethod:method}),
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
    return runMutation(name, () => fn(...args));
  }]));
  return <DataContext.Provider value={{...view,...wrapped,mutationNotifications,dismissMutationNotification,billingMonth,availableBillingMonths:[...new Set([billingMonth,new Date().toISOString().slice(0,7),...state.invoices.map(i=>`${i.year}-${String(i.month).padStart(2,'0')}`),...state.readings.map(r=>r.readingDate?.slice(0,7)).filter(Boolean)])].sort().reverse(),loading,error,metersHistory:{[billingMonth]:view.meters},utilityPrices:{elecPrice:Number(view.houseServiceConfigs.find(c=>c.serviceName==='Điện')?.unitPrice || 3500),waterPrice:Number(view.houseServiceConfigs.find(c=>c.serviceName==='Nước')?.unitPrice || 25000)},systemNotices:state.notifications}}>{authLoading ? <div role="status">Đang xác thực…</div> : children}</DataContext.Provider>;
}
export const useData = () => useContext(DataContext);
