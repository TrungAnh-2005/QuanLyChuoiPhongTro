export const normalizeGender = value => { const normalized=String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); return ['MALE','NAM','M'].includes(normalized)?'MALE':['FEMALE','NU','F'].includes(normalized)?'FEMALE':'OTHER'; };
export const today = () => new Date().toISOString().slice(0, 10);
export const isoDate = value => value?.includes('/') ? value.split('/').reverse().join('-') : value || today();
export const camel = row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), value]));
export const data = response => response?.data ?? response;