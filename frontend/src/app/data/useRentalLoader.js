import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../shared/api/client.js';
import { data, camel } from '../../shared/utils/data.js';
import { initial, resources } from './resources.js';

export function useRentalLoader({ user, testMode, setState, setDrafts }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
  }, [user?.id, user?.role, testMode, setState]);
  useEffect(() => { localStorage.setItem('rental_boarding_houses','[]'); window.dispatchEvent(new Event('rental:data-loaded')); setState(initial); setDrafts({}); if (user) refreshData(); else { generation.current++; setLoading(false); } }, [refreshData, setState, setDrafts]);

  return { loading, error, refreshData };
}
