import { mapRoom } from '../../features/rooms/room.mapper.js';
import { mapProperty } from '../../features/properties/property.mapper.js';

export function selectRentalView(state, { billingMonth, drafts, user, testMode }) {
    const houses = state.boardingHouses.map(mapProperty);
    const rooms = state.rooms.map(r => mapRoom(r, houses, state.contracts));
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
  
}
