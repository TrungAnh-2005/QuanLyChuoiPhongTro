export function healBoardingHousesList(list) {
  if (!Array.isArray(list) || list.length === 0) return list;

  let changed = false;
  const usedCodes = new Set();
  const codeRenames = {};

  const healed = list.map((h) => {
    if ((h.code === 'CS-01' || (h.name && h.name.includes('Cầu Giấy'))) && h.floors === 5) {
      h = { ...h, floors: 4, totalFloors: 4 };
      changed = true;
    }
    const isCustom = (typeof h.id === 'number' && h.id > 1000) || h.createdAtMs || (h.createdAt && !h.features);
    let code = (h.code || '').trim().toUpperCase();
    const u = (h.createdBy || h.managerUsername || '').toLowerCase();

    let prefix = 'CS';
    if (u === 'staff' || u === 'staff1') prefix = 'S1-CS';
    else if (u === 'staff2') prefix = 'S2-CS';
    else if (u && u !== 'admin') prefix = `${u.toUpperCase()}-CS`;

    if (isCustom && (code === 'CS-02' || code === 'CS-03')) {
      code = '';
    }

    if (!code || usedCodes.has(code)) {
      let preferredNum = null;
      const numMatch = (h.name || '').match(/(\d+)/);
      if (numMatch) {
        const candidateNum = parseInt(numMatch[1], 10);
        const candidateCode = `${prefix}-${String(candidateNum).padStart(2, '0')}`;
        if (!usedCodes.has(candidateCode)) {
          preferredNum = candidateNum;
        }
      }

      let seq = preferredNum || 1;
      let newCode = `${prefix}-${String(seq).padStart(2, '0')}`;
      while (usedCodes.has(newCode)) {
        seq++;
        newCode = `${prefix}-${String(seq).padStart(2, '0')}`;
      }

      if (h.code && h.code !== newCode) {
        codeRenames[h.code] = newCode;
      }
      code = newCode;
      changed = true;
    }

    usedCodes.add(code);
    return code !== h.code ? { ...h, code } : h;
  });

  if (changed) {
    try {
      localStorage.setItem('rental_boarding_houses', JSON.stringify(healed));
    } catch {}

    try {
      const savedRooms = localStorage.getItem('rental_rooms');
      if (savedRooms) {
        const parsedRooms = JSON.parse(savedRooms);
        if (Array.isArray(parsedRooms)) {
          let roomsChanged = false;
          const updatedRooms = parsedRooms.map((r) => {
            const matchedHouse = healed.find((h) =>
              (h.name && r.house && (h.name === r.house || String(r.house).trim() === String(h.name).trim())) ||
              (codeRenames[r.houseCode] && h.code === codeRenames[r.houseCode])
            );
            if (matchedHouse && matchedHouse.code !== r.houseCode) {
              roomsChanged = true;
              return { ...r, houseCode: matchedHouse.code, house: matchedHouse.name };
            }
            return r;
          });
          if (roomsChanged) {
            localStorage.setItem('rental_rooms', JSON.stringify(updatedRooms));
          }
        }
      }
    } catch {}
  }

  return healed;
}
