import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { clearSession } from '../services/api';
const AuthContext = createContext(null);
const testMode = import.meta.env.VITE_TEST_MODE === 'true';
const testUser = { isTestMode:true,id:2,username:'staff',fullName:'Kiểm thử nghiệp vụ',email:'test@rental.local',role:'STAFF',rooms:[],room:null,packageCode:'ENTERPRISE' };
const normalizeUser = (user, token) => ({ ...user, token,
  role: (['ADMIN', 'STAFF', 'TENANT'].find(role => user.roles?.some(r => r.replace('ROLE_', '') === role)) || user.role || 'TENANT').replace('ROLE_', ''),
  rooms: user.rooms || [], room: user.room || null,
});
export function AuthProvider({ children }) {
  const [user, setUser] = useState(testMode ? testUser : null);
  const [loading, setLoading] = useState(!testMode);
  const save = (data) => {
    const current = normalizeUser(data.user, data.accessToken);
    sessionStorage.setItem('rental_token', data.accessToken);
    sessionStorage.setItem('rental_refresh_token', data.refreshToken);
    sessionStorage.setItem('rental_user', JSON.stringify(current));
    setUser(current);
    return current;
  };
  useEffect(() => {
    if(testMode) return;
    let active = true;
    const token = sessionStorage.getItem('rental_token');
    const restore = async () => {
      try { if (token) { const res = await api.get('/auth/me'); if (active) setUser(normalizeUser(res.data, token)); } }
      catch { clearSession(); }
      finally { if (active) setLoading(false); }
    };
    restore();
    const expired = () => setUser(null);
    window.addEventListener('rental:unauthorized', expired);
    return () => { active = false; window.removeEventListener('rental:unauthorized', expired); };
  }, []);
  const login = async (username, password) => {
    setLoading(true);
    try { const res = await api.post('/auth/login', { usernameOrEmail: username, password }); save(res.data); return { success: true }; }
    catch (error) { return { success: false, error: error.message }; }
    finally { setLoading(false); }
  };
  const register = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/register', { ...data, role: data.role === 'LANDLORD' ? 'STAFF' : data.role });
      return await login(data.username, data.password);
    } catch (error) { return { success: false, error: error.message }; }
    finally { setLoading(false); }
  };
  const logout = () => { clearSession(); setUser(testMode ? testUser : null); };
  const updateTenantRoom = (_name, rooms) => setUser(prev => prev ? ({ ...prev, rooms: Array.isArray(rooms) ? rooms : [rooms].filter(Boolean), room: Array.isArray(rooms) ? rooms[0] : rooms }) : prev);
  return <AuthContext.Provider value={{ user, login, logout, register, loading, updateTenantRoom, tenantRooms: {}, testMode, switchRole: (role,fields={}) => { if(testMode) setUser({...testUser,...fields,role}); else logout(); } }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
