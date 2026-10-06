import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const DEMO_USERS = {
  ADMIN: {
    username: 'admin',
    fullName: 'Quản Trị Viên Chuỗi (Admin)',
    email: 'admin@rental.vn',
    role: 'ADMIN',
    token: 'demo-admin-token'
  },
  STAFF: {
    username: 'staff',
    fullName: 'Lê Thị Thu Ngân (Staff CS1 - Cầu Giấy)',
    email: 'staff1@rental.vn',
    phone: '0912.888.666',
    houseCode: 'CS-01',
    houseName: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    role: 'STAFF',
    token: 'demo-staff-token'
  },
  STAFF_1: {
    username: 'staff',
    fullName: 'Lê Thị Thu Ngân (Staff CS1 - Cầu Giấy)',
    email: 'staff1@rental.vn',
    phone: '0912.888.666',
    houseCode: 'CS-01',
    houseName: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    role: 'STAFF',
    token: 'demo-staff-token'
  },
  STAFF_2: {
    username: 'staff2',
    fullName: 'Đàm Văn Táo (Staff CS2 - Bách Khoa)',
    email: 'staff2@rental.vn',
    phone: '0988.777.999',
    houseCode: 'CS-02',
    houseName: 'Nhà Trọ Bách Khoa - Cơ Sở 2',
    role: 'STAFF',
    token: 'demo-staff2-token'
  },
  TENANT: {
    username: 'tenant1',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@rental.vn',
    phone: '0987.654.321',
    room: 'P.101',
    rooms: ['P.101'],
    role: 'TENANT',
    token: 'demo-tenant-token'
  },
  TENANT_1: {
    username: 'tenant1',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@rental.vn',
    phone: '0987.654.321',
    room: 'P.101',
    rooms: ['P.101'],
    houseCode: 'CS-01',
    houseName: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    role: 'TENANT',
    token: 'demo-tenant-token'
  },
  TENANT_2: {
    username: 'tenant2',
    fullName: 'Phạm Minh Cường',
    email: 'cuong.pham@rental.vn',
    phone: '0912.888.999',
    room: 'P.103',
    rooms: ['P.103'],
    houseCode: 'CS-01',
    houseName: 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    role: 'TENANT',
    token: 'demo-tenant2-token'
  },
  TENANT_NEW: {
    username: 'tenant_new',
    fullName: 'Hoàng Văn Nam',
    email: 'nam.hv@gmail.com',
    phone: '0966.123.456',
    houseCode: null,
    houseName: null,
    room: null,
    rooms: [],
    role: 'TENANT',
    token: 'demo-tenantnew-token'
  }
};

const normalizeRoomList = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) {
    const list = val.filter(Boolean);
    // Quy tắc Single Active Lease: Mỗi khách thuê chỉ thuê DUY NHẤT 1 phòng
    return list.length > 0 ? [String(list[list.length - 1])] : [];
  }
  if (typeof val === 'string' && val.trim()) return [val.trim()];
  return [];
};

const getStoredTenantRooms = () => {
  let res = {
    tenant1: ['P.101'],
    'Nguyễn Văn An': ['P.101'],
    tenant2: ['P.103'],
    'Phạm Minh Cường': ['P.103'],
    tenant_new: [],
    'Hoàng Văn Nam': []
  };
  try {
    const s = localStorage.getItem('rental_tenant_rooms');
    if (s) {
      const parsed = JSON.parse(s);
      Object.keys(parsed).forEach((k) => {
        const normed = normalizeRoomList(parsed[k]);
        res[k] = normed;
      });
    }
  } catch {}

  // Đảm bảo Khách 1 (An) và Khách 2 (Cường) luôn cọc/thuê phòng tại CS-01 của chủ A
  if (!res.tenant1 || res.tenant1.length === 0) {
    res.tenant1 = ['P.101'];
    res['Nguyễn Văn An'] = ['P.101'];
  }
  if (!res.tenant2 || res.tenant2.length === 0) {
    res.tenant2 = ['P.103'];
    res['Phạm Minh Cường'] = ['P.103'];
  }

  // Tự động đối chiếu với rental_room_requests:
  try {
    const sReqs = localStorage.getItem('rental_room_requests');
    const pReqs = sReqs ? JSON.parse(sReqs) : null;
    if (Array.isArray(pReqs)) {
      pReqs.forEach((req) => {
        if (req.status === 'APPROVED' && req.targetRoom && req.tenant) {
          const tNorm = req.tenant.toLowerCase();
          if (tNorm.includes('nam')) {
            // Khách 3 (Nam): Chưa thuê phòng nào! Tuyệt đối không gán phòng khi chưa ký hợp đồng & đóng cọc hoàn tất
            if (!req.depositPaid || req.type === 'ROOMMATE') {
              return;
            }
            res.tenant_new = [req.targetRoom];
            res['Hoàng Văn Nam'] = [req.targetRoom];
          } else if (tNorm.includes('an')) {
            res.tenant1 = [req.targetRoom];
            res['Nguyễn Văn An'] = [req.targetRoom];
          } else if (tNorm.includes('cường')) {
            res.tenant2 = [req.targetRoom];
            res['Phạm Minh Cường'] = [req.targetRoom];
          } else {
            res[req.tenant] = [req.targetRoom];
          }
        }
      });
    }
  } catch {}

  // Kiểm tra rental_contracts: Nếu Khách Mới (Nam) chưa thanh toán cọc thì luôn giữ rooms = []
  try {
    const sContracts = localStorage.getItem('rental_contracts');
    if (sContracts) {
      const pContracts = JSON.parse(sContracts);
      const namContract = pContracts.find(c => c.tenantName?.includes('Nam'));
      if (!namContract || namContract.status === 'PENDING_DEPOSIT' || namContract.status === 'PENDING_SIGN' || !namContract.depositPaid) {
        res.tenant_new = [];
        res['Hoàng Văn Nam'] = [];
      }
    } else {
      res.tenant_new = [];
      res['Hoàng Văn Nam'] = [];
    }
  } catch {}

  if (!res.tenant_new) res.tenant_new = [];
  if (!res['Hoàng Văn Nam']) res['Hoàng Văn Nam'] = [];
  return res;
};

export const AuthProvider = ({ children }) => {
  const [tenantRooms, setTenantRooms] = useState(getStoredTenantRooms);

  const [user, setUser] = useState(() => {
    const currentRoomsMap = getStoredTenantRooms();

    // Helper to inject latest dynamic rooms array
    const injectRooms = (u) => {
      if (!u || u.role !== 'TENANT') return u;
      if (u.username === 'tenant2' || u.fullName?.includes('Cường')) {
        const matched = currentRoomsMap.tenant2 || currentRoomsMap['Phạm Minh Cường'] || ['P.103'];
        const roomsList = normalizeRoomList(matched);
        return {
          ...u,
          rooms: roomsList.length > 0 ? roomsList : ['P.103'],
          room: roomsList[0] || 'P.103',
          houseCode: 'CS-01',
          houseName: 'Nhà Trọ Cầu Giấy - Cơ Sở 1'
        };
      }
      if (u.username === 'tenant' || u.username === 'tenant1' || u.fullName?.includes('An')) {
        const matched = currentRoomsMap.tenant1 || currentRoomsMap['Nguyễn Văn An'] || ['P.101'];
        const roomsList = normalizeRoomList(matched);
        return {
          ...u,
          rooms: roomsList.length > 0 ? roomsList : ['P.101'],
          room: roomsList[0] || 'P.101',
          houseCode: 'CS-01',
          houseName: 'Nhà Trọ Cầu Giấy - Cơ Sở 1'
        };
      }
      if (u.username === 'tenant_new' || u.fullName?.includes('Nam')) {
        let hasActive = false;
        try {
          const sContracts = localStorage.getItem('rental_contracts');
          const pContracts = sContracts ? JSON.parse(sContracts) : null;
          hasActive = !!pContracts?.some(c => c.tenantName?.includes('Nam') && c.status === 'ACTIVE' && c.depositPaid);
        } catch {}
        if (!hasActive) {
          return {
            ...u,
            rooms: [],
            room: null,
            houseCode: null,
            houseName: null
          };
        }
      }
      const matched = currentRoomsMap[u.username] !== undefined
        ? currentRoomsMap[u.username]
        : (currentRoomsMap[u.fullName] !== undefined ? currentRoomsMap[u.fullName] : (u.rooms || (u.room ? [u.room] : [])));
      const roomsList = normalizeRoomList(matched);
      return {
        ...u,
        rooms: roomsList,
        room: roomsList[0] || null
      };
    };

    // 1. Check URL query param ?as=admin / ?as=staff / ?as=tenant for multi-tab testing
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const asRole = urlParams.get('as')?.toUpperCase();
      if (asRole && DEMO_USERS[asRole]) {
        const u = injectRooms(DEMO_USERS[asRole]);
        sessionStorage.setItem('rental_user', JSON.stringify(u));
        sessionStorage.setItem('rental_token', u.token);
        return u;
      }
    }

    // 2. Check tab-isolated sessionStorage first
    const sessionSaved = sessionStorage.getItem('rental_user');
    if (sessionSaved) {
      try {
        return injectRooms(JSON.parse(sessionSaved));
      } catch {}
    }

    // 3. Fallback to localStorage or default Admin
    const localSaved = localStorage.getItem('rental_user');
    if (localSaved) {
      try {
        return injectRooms(JSON.parse(localSaved));
      } catch {}
    }

    return DEMO_USERS.ADMIN;
  });

  const [loading, setLoading] = useState(false);

  // Cập nhật danh sách phòng cho khách thuê (Hỗ trợ: Chuyển phòng, Thuê thêm, Ở ghép, Trả phòng)
  const updateTenantRoom = (nameOrKey, roomsData, mode = 'REPLACE', houseInfo = null) => {
    setTenantRooms((prev) => {
      const norm = (str) => (str || '').toLowerCase();
      const targetNorm = norm(nameOrKey);

      let currentRooms = [];
      for (const key of Object.keys(prev)) {
        if (norm(key) === targetNorm || norm(key).includes(targetNorm) || targetNorm.includes(norm(key))) {
          currentRooms = normalizeRoomList(prev[key]);
          if (currentRooms.length > 0) break;
        }
      }

      let updatedRooms = [];
      if (mode === 'SET' || Array.isArray(roomsData)) {
        updatedRooms = normalizeRoomList(roomsData);
      } else if (mode === 'ADD') {
        // THUÊ THÊM hoặc Ở GHÉP: KHÔNG TỰ ĐỘNG TRẢ PHÒNG CŨ!
        updatedRooms = Array.from(new Set([...currentRooms, roomsData].filter(Boolean)));
      } else if (mode === 'REMOVE') {
        // TRẢ PHÒNG: gỡ phòng đó khỏi danh sách
        updatedRooms = currentRooms.filter((rm) => rm !== roomsData);
      } else {
        // CHUYỂN PHÒNG (REPLACE / TRANSFER): TỰ ĐỘNG TRẢ PHÒNG CŨ!
        if (typeof roomsData === 'object' && roomsData.oldRoom && roomsData.newRoom) {
          updatedRooms = currentRooms.map((r) => r === roomsData.oldRoom ? roomsData.newRoom : r);
          if (!updatedRooms.includes(roomsData.newRoom)) updatedRooms.push(roomsData.newRoom);
        } else if (roomsData) {
          updatedRooms = [roomsData];
        } else {
          updatedRooms = [];
        }
      }

      const updated = { ...prev };
      const assign = (key, list) => {
        updated[key] = list;
      };

      if (targetNorm.includes('an') || targetNorm.includes('thuê') || targetNorm.includes('tenant1')) {
        assign('tenant1', updatedRooms);
        assign('Nguyễn Văn An', updatedRooms);
        assign('Nguyễn Văn Khách Thuê', updatedRooms);
      } else if (targetNorm.includes('cường') || targetNorm.includes('tenant2')) {
        assign('tenant2', updatedRooms);
        assign('Phạm Minh Cường', updatedRooms);
      } else if (targetNorm.includes('nam') || targetNorm.includes('tenant_new')) {
        assign('tenant_new', updatedRooms);
        assign('Hoàng Văn Nam', updatedRooms);
      } else {
        assign(nameOrKey, updatedRooms);
      }

      localStorage.setItem('rental_tenant_rooms', JSON.stringify(updated));
      return updated;
    });

    // Cập nhật session user nếu người đó đang đăng nhập
    setUser((currentUser) => {
      if (!currentUser || currentUser.role !== 'TENANT') return currentUser;
      const curNorm = (currentUser.fullName || currentUser.username || '').toLowerCase();
      const targetNorm = (nameOrKey || '').toLowerCase();
      const isTarget = curNorm.includes(targetNorm) || targetNorm.includes(curNorm) ||
        (targetNorm.includes('an') && curNorm.includes('an')) ||
        (targetNorm.includes('nam') && curNorm.includes('nam')) ||
        (targetNorm.includes('cường') && curNorm.includes('cường'));

      if (!isTarget) return currentUser;

      const currentRooms = normalizeRoomList(currentUser.rooms || (currentUser.room ? [currentUser.room] : []));
      let newRoomsList = [];
      if (mode === 'SET' || Array.isArray(roomsData)) {
        newRoomsList = normalizeRoomList(roomsData);
      } else if (mode === 'ADD') {
        newRoomsList = Array.from(new Set([...currentRooms, roomsData].filter(Boolean)));
      } else if (mode === 'REMOVE') {
        newRoomsList = currentRooms.filter((rm) => rm !== roomsData);
      } else {
        if (typeof roomsData === 'object' && roomsData.oldRoom && roomsData.newRoom) {
          newRoomsList = currentRooms.map((r) => r === roomsData.oldRoom ? roomsData.newRoom : r);
          if (!newRoomsList.includes(roomsData.newRoom)) newRoomsList.push(roomsData.newRoom);
        } else if (roomsData) {
          newRoomsList = [roomsData];
        } else {
          newRoomsList = [];
        }
      }

      const updatedUser = {
        ...currentUser,
        rooms: newRoomsList,
        room: newRoomsList[0] || null,
        houseCode: houseInfo?.houseCode || currentUser.houseCode,
        house: houseInfo?.house || currentUser.house,
        houseName: houseInfo?.house || currentUser.houseName
      };
      sessionStorage.setItem('rental_user', JSON.stringify(updatedUser));
      localStorage.setItem('rental_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const switchRole = (newRole) => {
    const roleKey = newRole?.toUpperCase();
    const baseUser = DEMO_USERS[roleKey] || DEMO_USERS.ADMIN;
    
    // Đọc danh sách phòng mới nhất từ tenantRooms
    let currentRooms = normalizeRoomList(baseUser.rooms || (baseUser.room ? [baseUser.room] : []));
    let userHouseCode = baseUser.houseCode;
    let userHouseName = baseUser.houseName;

    if (baseUser.role === 'TENANT') {
      const latestRooms = getStoredTenantRooms();
      const val = latestRooms[baseUser.username] !== undefined
        ? latestRooms[baseUser.username]
        : (latestRooms[baseUser.fullName] !== undefined ? latestRooms[baseUser.fullName] : currentRooms);
      currentRooms = normalizeRoomList(val);

      if (roleKey === 'TENANT_2' || baseUser.username === 'tenant2') {
        // Khách 2 (Phạm Minh Cường): Đang cọc phòng P.103 của ông chủ A (CS-01)
        currentRooms = ['P.103'];
        userHouseCode = 'CS-01';
        userHouseName = 'Nhà Trọ Cầu Giấy - Cơ Sở 1';
        try {
          const sRooms = localStorage.getItem('rental_tenant_rooms');
          const pRooms = sRooms ? JSON.parse(sRooms) : {};
          pRooms.tenant2 = ['P.103'];
          pRooms['Phạm Minh Cường'] = ['P.103'];
          localStorage.setItem('rental_tenant_rooms', JSON.stringify(pRooms));
        } catch {}
        setTenantRooms(prev => ({ ...prev, tenant2: ['P.103'], 'Phạm Minh Cường': ['P.103'] }));
      } else if (roleKey === 'TENANT_1' || roleKey === 'TENANT' || baseUser.username === 'tenant1') {
        // Khách 1 (Nguyễn Văn An): Đang cọc phòng P.101 của ông chủ A (CS-01)
        currentRooms = ['P.101'];
        userHouseCode = 'CS-01';
        userHouseName = 'Nhà Trọ Cầu Giấy - Cơ Sở 1';
        try {
          const sRooms = localStorage.getItem('rental_tenant_rooms');
          const pRooms = sRooms ? JSON.parse(sRooms) : {};
          pRooms.tenant1 = ['P.101'];
          pRooms['Nguyễn Văn An'] = ['P.101'];
          localStorage.setItem('rental_tenant_rooms', JSON.stringify(pRooms));
        } catch {}
        setTenantRooms(prev => ({ ...prev, tenant1: ['P.101'], 'Nguyễn Văn An': ['P.101'] }));
      } else if (roleKey === 'TENANT_NEW' || baseUser.username === 'tenant_new') {
        // Khách 3 (Hoàng Văn Nam): Chưa thuê phòng nào -> Chế độ Marketplace xem toàn bộ phòng
        currentRooms = [];
        userHouseCode = null;
        userHouseName = null;
        try {
          const sRooms = localStorage.getItem('rental_tenant_rooms');
          const pRooms = sRooms ? JSON.parse(sRooms) : {};
          pRooms.tenant_new = [];
          pRooms['Hoàng Văn Nam'] = [];
          localStorage.setItem('rental_tenant_rooms', JSON.stringify(pRooms));
        } catch {}
        setTenantRooms(prev => ({ ...prev, tenant_new: [], 'Hoàng Văn Nam': [] }));
      }
    }

    const targetUser = {
      ...baseUser,
      rooms: currentRooms,
      room: currentRooms[0] || null,
      houseCode: userHouseCode || null,
      houseName: userHouseName || null
    };
    sessionStorage.setItem('rental_user', JSON.stringify(targetUser));
    sessionStorage.setItem('rental_token', targetUser.token);
    localStorage.setItem('rental_user', JSON.stringify(targetUser));
    localStorage.setItem('rental_token', targetUser.token);
    setUser(targetUser);
  };

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      if (res && res.data) {
        const userData = {
          username: res.data.username || username,
          fullName: res.data.fullName || username,
          email: res.data.email || `${username}@rental.vn`,
          role: res.data.role || (username === 'tenant' ? 'TENANT' : username === 'staff' ? 'STAFF' : 'ADMIN'),
          token: res.data.token || res.data.accessToken
        };
        sessionStorage.setItem('rental_token', userData.token);
        sessionStorage.setItem('rental_user', JSON.stringify(userData));
        localStorage.setItem('rental_token', userData.token);
        localStorage.setItem('rental_user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
    } catch (err) {
      console.warn('Backend API login offline/error, falling back to local session:', err);
      const roleKey = username.toLowerCase().includes('tenant') ? 'TENANT'
                    : username.toLowerCase().includes('staff') ? 'STAFF' : 'ADMIN';
      const targetUser = DEMO_USERS[roleKey];
      sessionStorage.setItem('rental_token', targetUser.token);
      sessionStorage.setItem('rental_user', JSON.stringify(targetUser));
      localStorage.setItem('rental_token', targetUser.token);
      localStorage.setItem('rental_user', JSON.stringify(targetUser));
      setUser(targetUser);
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('rental_token');
    sessionStorage.removeItem('rental_user');
    localStorage.removeItem('rental_token');
    localStorage.removeItem('rental_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole, loading, updateTenantRoom, tenantRooms }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
