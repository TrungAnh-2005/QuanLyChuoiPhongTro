export const mapProperty = h => ({ ...h, code: h.code || `CS-${h.id}`, manager: h.managerName, floors: h.totalFloors || 1, status: h.status || 'ACTIVE' });
