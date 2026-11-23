import { useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useData } from '../../shared/data/RentalDataContext';
import { selectTenantResidency } from './tenant-residency.js';

export function useTenantResidency() {
  const { user } = useAuth();
  const { tenants, contracts, roomMembers, rooms, boardingHouses } = useData();
  return useMemo(() => selectTenantResidency({ user, tenants, contracts, roomMembers, rooms, boardingHouses }),
    [user, tenants, contracts, roomMembers, rooms, boardingHouses]);
}
