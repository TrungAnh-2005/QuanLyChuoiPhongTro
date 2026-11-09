import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const isZeroSandbox = typeof window === 'undefined' || localStorage.getItem('rental_is_zero_sandbox') !== 'false';

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
    fullName: 'Lê Thị Thu Ngân',
    email: 'staff1@rental.vn',
    phone: '0912.888.666',
    houseCode: isZeroSandbox ? null : 'CS-01',
    houseName: isZeroSandbox ? null : 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    role: 'STAFF',
    token: 'demo-staff-token'
  },
  STAFF_1: {
    username: 'staff',
    fullName: 'Lê Thị Thu Ngân',
    email: 'staff1@rental.vn',
    phone: '0912.888.666',
    houseCode: isZeroSandbox ? null : 'CS-01',
    houseName: isZeroSandbox ? null : 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    role: 'STAFF',
    token: 'demo-staff-token'
  },
  STAFF_2: {
    username: 'staff2',
    fullName: 'Đàm Văn Táo',
    email: 'staff2@rental.vn',
    phone: '0988.777.999',
    houseCode: isZeroSandbox ? null : 'CS-02',
    houseName: isZeroSandbox ? null : 'Nhà Trọ Bách Khoa - Cơ Sở 2',
    role: 'STAFF',
    token: 'demo-staff2-token'
  },
  TENANT: {
    username: 'tenant1',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@rental.vn',
    phone: '0987.654.321',
    cccd: '001201012345',
    hometown: 'Nam Định',
    room: isZeroSandbox ? null : 'P.101',
    rooms: isZeroSandbox ? [] : ['P.101'],
    role: 'TENANT',
    token: 'demo-tenant-token'
  },
  TENANT_1: {
    username: 'tenant1',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@rental.vn',
    phone: '0987.654.321',
    cccd: '001201012345',
    hometown: 'Nam Định',
    room: isZeroSandbox ? null : 'P.101',
    rooms: isZeroSandbox ? [] : ['P.101'],
    houseCode: isZeroSandbox ? null : 'CS-01',
    houseName: isZeroSandbox ? null : 'Nhà Trọ Cầu Giấy - Cơ Sở 1',
    role: 'TENANT',
    token: 'demo-tenant-token'
  },
  TENANT_2: {
    username: 'tenant2',
    fullName: 'Phạm Minh Cường',
    email: 'cuong.pham@rental.vn',
    phone: '0912.888.999',
    cccd: '034203034567',
    hometown: 'Hải Phòng',
    room: isZeroSandbox ? null : 'P.101',
    rooms: isZeroSandbox ? [] : ['P.101'],
    houseCode: isZeroSandbox ? null : 'CS-02',
    houseName: isZeroSandbox ? null : 'Nhà Trọ Bách Khoa - Cơ Sở 2',
    role: 'TENANT',
    token: 'demo-tenant2-token'
  },
  TENANT_NEW: {
    username: 'tenant_new',
    fullName: 'Hoàng Văn Nam',
    email: 'nam.hv@gmail.com',
    phone: '0966.123.456',
    cccd: '001201019999',
    hometown: 'Hà Nội',
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
  let res = isZeroSandbox
    ? {
        tenant1: [],
        'Nguyễn Văn An': [],
        tenant2: [],
        'Phạm Minh Cường': [],
        tenant_new: [],
        'Hoàng Văn Nam': []
      }
    : {
        tenant1: ['P.101'],
        'Nguyễn Văn An': ['P.101'],
        tenant2: ['P.101'],
        'Phạm Minh Cường': ['P.101'],
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

  // Tôn trọng mảng rỗng [] khi khách đã trả phòng hoặc chuyển đi

  // Tự động đối chiếu với rental_room_requests:
  try {
    const sReqs = localStorage.getItem('rental_room_requests');
    const pReqs = sReqs ? JSON.parse(sReqs) : null;
    if (Array.isArray(pReqs)) {
      pReqs.forEach((req) => {
        const isSettledOrApproved = req.status === 'APPROVED' || req.status === 'CHECKOUT_SETTLED' || req.status === 'SETTLED' || req.settledAt;
        if (isSettledOrApproved && (req.targetRoom || req.currentRoom) && req.tenant) {
          const tNorm = req.tenant.toLowerCase();
          const targetNum = String(req.targetRoom || req.currentRoom || '').replace(/^phòng\s*/i, '').replace(/^p[\.\s_-]*/i, '').trim().toLowerCase();

          // NẾU LÀ ĐƠN TRẢ TOÀN BỘ PHÒNG (CHECKOUT / RETURN) -> TẤT CẢ KHÁCH TRONG PHÒNG ĐỀU DỌN RA!
          if (req.type === 'CHECKOUT' || req.type === 'RETURN') {
            Object.keys(res).forEach((k) => {
              if (Array.isArray(res[k])) {
                res[k] = res[k].filter((rm) => String(rm || '').replace(/^phòng\s*/i, '').replace(/^p[\.\s_-]*/i, '').trim().toLowerCase() !== targetNum);
              }
            });
            if (targetNum === '101') {
              res.tenant1 = [];
              res['Nguyễn Văn An'] = [];
              res.tenant2 = [];
              res['Phạm Minh Cường'] = [];
            }
            if (tNorm.includes('an')) {
              res.tenant1 = [];
              res['Nguyễn Văn An'] = [];
            }
            if (tNorm.includes('cường')) {
              res.tenant2 = [];
              res['Phạm Minh Cường'] = [];
            }
            if (tNorm.includes('nam')) {
              res.tenant_new = [];
              res['Hoàng Văn Nam'] = [];
            }
            res[req.tenant] = [];
            return;
          }

          // NẾU LÀ ĐƠN CÁ NHÂN RỜI PHÒNG (LEAVE_ROOM)
          if (req.type === 'LEAVE_ROOM') {
            const hasRejoinAfter = pReqs.some((other) =>
              (other.status === 'APPROVED' || other.status === 'ROOMMATES_APPROVED') &&
              (other.type === 'ROOMMATE' || other.type === 'JOIN_ROOM' || other.type === 'RENT' || other.type === 'NEW_RENT') &&
              String(other.targetRoom || other.roomNumber || '').replace(/^P\.?/i, '').trim().toLowerCase() === targetNum &&
              (
                (tNorm.includes('cường') && (other.tenant || '').toLowerCase().includes('cường')) ||
                (tNorm.includes('an') && (other.tenant || '').toLowerCase().includes('an')) ||
                (tNorm.includes('nam') && (other.tenant || '').toLowerCase().includes('nam'))
              )
            );
            if (!hasRejoinAfter) {
              if (tNorm.includes('an')) {
                res.tenant1 = [];
                res['Nguyễn Văn An'] = [];
              } else if (tNorm.includes('cường')) {
                res.tenant2 = [];
                res['Phạm Minh Cường'] = [];
              } else if (tNorm.includes('nam')) {
                res.tenant_new = [];
                res['Hoàng Văn Nam'] = [];
              } else {
                res[req.tenant] = [];
              }
            }
            return;
          }

          // Gán phòng khi là đơn thuê mới, chuyển phòng hoặc ở ghép đã được duyệt
          if (req.type === 'RENT' || req.type === 'NEW_RENT' || req.type === 'TRANSFER' || req.type === 'ROOMMATE' || req.type === 'JOIN_ROOM') {
            if (tNorm.includes('nam')) {
              if (!req.depositPaid && req.type !== 'TRANSFER' && req.type !== 'ROOMMATE' && req.type !== 'JOIN_ROOM') return;
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
        }
      });
    }
  } catch {}

  // Kiểm tra rental_move_out_settlements: Nếu phòng đã nghiệm thu thanh lý cọc -> giải phóng toàn bộ cư dân
  try {
    const sSt = localStorage.getItem('rental_move_out_settlements');
    if (sSt) {
      const sts = JSON.parse(sSt);
      if (Array.isArray(sts)) {
        sts.forEach((s) => {
          if (s.settledAt || s.refundStatus === 'COMPLETED' || s.status === 'SETTLED') {
            const num = String(s.roomNumber || '').replace(/^P\.?/i, '').trim();
            if (num === '101') {
              res.tenant1 = [];
              res['Nguyễn Văn An'] = [];
              res.tenant2 = [];
              res['Phạm Minh Cường'] = [];
            }
          }
        });
      }
    }
  } catch {}

  // Kiểm tra rental_contracts: Nếu phòng P.101 không còn hợp đồng ACTIVE -> giải phóng cư dân
  try {
    const sC = localStorage.getItem('rental_contracts');
    if (sC) {
      const pC = JSON.parse(sC);
      if (Array.isArray(pC)) {
        const p101Contracts = pC.filter(c => String(c.roomNumber || '').replace(/^P\.?/i, '').trim() === '101');
        const hasActive101 = p101Contracts.some(c => c.status === 'ACTIVE');
        const hasEnded101 = p101Contracts.some(c => c.status === 'TERMINATED' || c.status === 'COMPLETED');
        if (hasEnded101 && !hasActive101) {
          res.tenant1 = [];
          res['Nguyễn Văn An'] = [];
          res.tenant2 = [];
          res['Phạm Minh Cường'] = [];
        }
      }
    }
  } catch {}

  // Kiểm tra rental_rooms: Nếu phòng P.101 đã về AVAILABLE hoặc 0 người ở
  try {
    const sR = localStorage.getItem('rental_rooms');
    if (sR) {
      const pR = JSON.parse(sR);
      if (Array.isArray(pR)) {
        const r101 = pR.find(r => String(r.number || '').replace(/^P\.?/i, '').trim() === '101');
        if (r101 && (r101.status === 'AVAILABLE' || r101.occupants === 0)) {
          // Chỉ xóa nếu phòng cũ là 101 và không có phòng khác trong rental_room_members
          if (Array.isArray(res.tenant1) && res.tenant1.includes('P.101')) res.tenant1 = [];
          if (Array.isArray(res['Nguyễn Văn An']) && res['Nguyễn Văn An'].includes('P.101')) res['Nguyễn Văn An'] = [];
          if (Array.isArray(res.tenant2) && res.tenant2.includes('P.101')) res.tenant2 = [];
          if (Array.isArray(res['Phạm Minh Cường']) && res['Phạm Minh Cường'].includes('P.101')) res['Phạm Minh Cường'] = [];
        }
      }
    }
  } catch {}

  // ĐỐI CHIẾU NGUỒN SỰ THẬT TỐI CAO: rental_room_members (Cư dân thực tế đang ở trong phòng)
  try {
    const sMem = localStorage.getItem('rental_room_members');
    if (sMem) {
      const pMem = JSON.parse(sMem);
      if (Array.isArray(pMem)) {
        pMem.forEach((m) => {
          if (m.status !== 'MOVED_OUT' && m.status !== 'INACTIVE' && m.roomNumber) {
            const mNorm = (m.fullName || '').toLowerCase().trim();
            if (mNorm.includes('an')) {
              res.tenant1 = [m.roomNumber];
              res['Nguyễn Văn An'] = [m.roomNumber];
            } else if (mNorm.includes('cường')) {
              res.tenant2 = [m.roomNumber];
              res['Phạm Minh Cường'] = [m.roomNumber];
            } else if (mNorm.includes('nam')) {
              res.tenant_new = [m.roomNumber];
              res['Hoàng Văn Nam'] = [m.roomNumber];
            } else if (m.fullName) {
              res[m.fullName] = [m.roomNumber];
            }
          }
        });
      }
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

      const isP101CheckedOut = (() => {
        try {
          const sReqs = localStorage.getItem('rental_room_requests');
          if (sReqs) {
            const reqs = JSON.parse(sReqs);
            return reqs.some(r =>
              (r.type === 'CHECKOUT' || r.type === 'RETURN') &&
              String(r.targetRoom || r.currentRoom || '').replace(/^P\.?/i, '').trim() === '101' &&
              (r.status === 'APPROVED' || r.status === 'CHECKOUT_SETTLED' || r.settledAt)
            );
          }
        } catch {}
        return false;
      })();

      if (u.username === 'tenant2' || u.fullName?.includes('Cường')) {
        const defaultRooms = isP101CheckedOut ? [] : ['P.101'];
        const matched = currentRoomsMap.tenant2 !== undefined ? currentRoomsMap.tenant2 : (currentRoomsMap['Phạm Minh Cường'] !== undefined ? currentRoomsMap['Phạm Minh Cường'] : defaultRooms);
        const roomsList = normalizeRoomList(matched);
        const hasRooms = roomsList.length > 0;
        return {
          ...u,
          rooms: roomsList,
          room: hasRooms ? roomsList[0] : null,
          houseCode: hasRooms ? (u.houseCode || 'CS-02') : null,
          houseName: hasRooms ? (u.houseName || 'Nhà Trọ Bách Khoa - Cơ Sở 2') : null
        };
      }
      if (u.username === 'tenant' || u.username === 'tenant1' || u.fullName?.includes('An')) {
        const defaultRooms = isP101CheckedOut ? [] : ['P.101'];
        const matched = currentRoomsMap.tenant1 !== undefined ? currentRoomsMap.tenant1 : (currentRoomsMap['Nguyễn Văn An'] !== undefined ? currentRoomsMap['Nguyễn Văn An'] : defaultRooms);
        const roomsList = normalizeRoomList(matched);
        const hasRooms = roomsList.length > 0;
        return {
          ...u,
          rooms: roomsList,
          room: hasRooms ? roomsList[0] : null,
          houseCode: hasRooms ? 'CS-01' : null,
          houseName: hasRooms ? 'Nhà Trọ Cầu Giấy - Cơ Sở 1' : null
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
        const rmNorm = String(roomsData || '').replace(/^phòng\s*/i, '').replace(/^p[\.\s_-]*/i, '').trim().toLowerCase();
        updatedRooms = currentRooms.filter((rm) => String(rm || '').replace(/^phòng\s*/i, '').replace(/^p[\.\s_-]*/i, '').trim().toLowerCase() !== rmNorm);
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
        const rmNorm = String(roomsData || '').replace(/^phòng\s*/i, '').replace(/^p[\.\s_-]*/i, '').trim().toLowerCase();
        newRoomsList = currentRooms.filter((rm) => String(rm || '').replace(/^phòng\s*/i, '').replace(/^p[\.\s_-]*/i, '').trim().toLowerCase() !== rmNorm);
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

      const isZero = newRoomsList.length === 0;
      const updatedUser = {
        ...currentUser,
        rooms: newRoomsList,
        room: newRoomsList[0] || null,
        houseCode: isZero ? null : (houseInfo?.houseCode || currentUser.houseCode),
        house: isZero ? null : (houseInfo?.house || currentUser.house),
        houseName: isZero ? null : (houseInfo?.house || currentUser.houseName)
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

    if (baseUser.role === 'STAFF') {
      if (isZeroSandbox) {
        userHouseCode = null;
        userHouseName = null;
      } else {
        try {
          const sHouses = localStorage.getItem('rental_boarding_houses');
          if (sHouses) {
            const pHouses = JSON.parse(sHouses);
            if (Array.isArray(pHouses)) {
              if (pHouses.length === 0) {
                userHouseCode = null;
                userHouseName = null;
              } else {
                const myHouse = pHouses.find(h => h.createdBy === baseUser.username || h.managerUsername === baseUser.username);
                if (myHouse) {
                  userHouseCode = myHouse.code;
                  userHouseName = myHouse.name;
                }
              }
            }
          }
        } catch {}
      }
    } else if (baseUser.role === 'TENANT') {
      const latestRooms = getStoredTenantRooms();
      const val = latestRooms[baseUser.username] !== undefined
        ? latestRooms[baseUser.username]
        : (latestRooms[baseUser.fullName] !== undefined ? latestRooms[baseUser.fullName] : currentRooms);
      currentRooms = normalizeRoomList(val);

      if (currentRooms.length === 0 || isZeroSandbox) {
        userHouseCode = null;
        userHouseName = null;
      } else {
        // Tự động đồng bộ cơ sở thực tế từ roomMembers hoặc contracts của phòng đang thuê (khớp đúng người dùng)
        let matchedHouse = null;
        try {
          const sM = localStorage.getItem('rental_room_members');
          const pM = sM ? JSON.parse(sM) : [];
          const mem = pM.find(m => currentRooms.includes(m.roomNumber) && m.status !== 'MOVED_OUT' && (
            (baseUser.fullName && m.fullName && (m.fullName.includes(baseUser.fullName) || baseUser.fullName.includes(m.fullName))) ||
            (baseUser.phone && m.phone === baseUser.phone)
          ));
          if (mem?.houseCode) {
            matchedHouse = { code: mem.houseCode, name: mem.house };
          } else {
            const sC = localStorage.getItem('rental_contracts');
            const pC = sC ? JSON.parse(sC) : [];
            const contract = pC.find(c => currentRooms.includes(c.roomNumber) && c.status === 'ACTIVE' && (
              (baseUser.fullName && c.tenantName && (c.tenantName.includes(baseUser.fullName) || baseUser.fullName.includes(c.tenantName))) ||
              (baseUser.phone && c.tenantPhone === baseUser.phone) ||
              c.tenantUsername === baseUser.username
            ));
            if (contract?.houseCode) {
              matchedHouse = { code: contract.houseCode, name: contract.houseName };
            }
          }
        } catch {}

        userHouseCode = matchedHouse?.code || baseUser.houseCode || 'CS-01';
        userHouseName = matchedHouse?.name || baseUser.houseName || 'Nhà Trọ Cầu Giấy - Cơ Sở 1';
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
      // Kiểm tra mật khẩu reset trong rental_user_passwords
      try {
        const sPwds = localStorage.getItem('rental_user_passwords');
        const pwds = sPwds ? JSON.parse(sPwds) : {};
        if (pwds[username] && pwds[username] !== password) {
          return { success: false, error: 'Mật khẩu không chính xác.' };
        }
      } catch {}
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


  const register = async ({ role = 'STAFF', fullName, username, email, phone, password, identityCard = '' }) => {
    setLoading(true);
    try {
      const isLandlord = role === 'STAFF' || role === 'LANDLORD';
      const actualRole = isLandlord ? 'STAFF' : 'TENANT';
      const newUserObj = {
        username: (username || '').trim(),
        fullName: (fullName || '').trim(),
        email: (email || '').trim(),
        phone: (phone || '').trim() || '0900.000.000',
        role: actualRole,
        token: 'demo-registered-' + Date.now(),
        identityCard: (identityCard || '').trim(),
        houseCode: isLandlord ? null : null,
        houseName: isLandlord ? null : null,
        room: null,
        rooms: [],
        createdAt: new Date().toISOString()
      };

      // 1. Lưu mật khẩu vào rental_user_passwords
      try {
        const sPwds = localStorage.getItem('rental_user_passwords');
        const pwds = sPwds ? JSON.parse(sPwds) : {};
        pwds[newUserObj.username] = password;
        localStorage.setItem('rental_user_passwords', JSON.stringify(pwds));
      } catch {}

      // 2. Nếu là Chủ trọ (STAFF/LANDLORD): Đồng bộ vào hồ sơ Admin quản lý
      if (isLandlord) {
        try {
          const sL = localStorage.getItem('rental_landlords');
          const landlords = sL ? JSON.parse(sL) : [];
          const newLandlord = {
            id: Date.now(),
            code: 'CT-' + String(landlords.length + 1).padStart(2, '0'),
            fullName: newUserObj.fullName,
            username: newUserObj.username,
            email: newUserObj.email,
            phone: newUserObj.phone,
            packageCode: 'TRIAL',
            packageName: 'Gói Dùng Thử 14 Ngày',
            status: 'PENDING_KYC',
            isLocked: false,
            identityCard: identityCard.trim() || 'Chưa cung cấp',
            totalHouses: 0,
            totalRooms: 0,
            activeTenants: 0,
            registeredDate: new Date().toLocaleDateString('vi-VN')
          };
          landlords.unshift(newLandlord);
          localStorage.setItem('rental_landlords', JSON.stringify(landlords));

          const sP = localStorage.getItem('rental_landlord_profiles');
          const profiles = sP ? JSON.parse(sP) : [];
          profiles.unshift({
            id: newLandlord.id,
            landlordId: newLandlord.id,
            fullName: newLandlord.fullName,
            phone: newLandlord.phone,
            email: newLandlord.email,
            identityCard: newLandlord.identityCard,
            status: 'PENDING',
            submittedAt: new Date().toISOString()
          });
          localStorage.setItem('rental_landlord_profiles', JSON.stringify(profiles));
        } catch (err) {
          console.warn('Lỗi lưu landlord profile:', err);
        }
      } else {
        try {
          const sRooms = localStorage.getItem('rental_tenant_rooms');
          const tRooms = sRooms ? JSON.parse(sRooms) : {};
          tRooms[newUserObj.username] = [];
          tRooms[newUserObj.fullName] = [];
          localStorage.setItem('rental_tenant_rooms', JSON.stringify(tRooms));
        } catch {}
      }

      sessionStorage.setItem('rental_token', newUserObj.token);
      sessionStorage.setItem('rental_user', JSON.stringify(newUserObj));
      localStorage.setItem('rental_token', newUserObj.token);
      localStorage.setItem('rental_user', JSON.stringify(newUserObj));
      setUser(newUserObj);

      return { success: true, user: newUserObj };
    } catch (err) {
      return { success: false, error: err.message };
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
    <AuthContext.Provider value={{ user, login, logout, register, switchRole, loading, updateTenantRoom, tenantRooms }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
