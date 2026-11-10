import { chromium } from 'playwright';

async function testRoomMembersIsolation() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  console.log('1. Loading application at http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1500);

  // Setup dual facility scenario:
  // Facility 1: Staff 1 (Lê Thị Thu Ngân), House code 'S1-CS-01', name 'Cầu Giấy', room 'P.101', max 3
  // Facility 2: Staff 2 (Đàm Văn Tảo), House code 'S2-CS-01', name 'Đống Đa', room 'P.101', max 2
  // Khách 1 (Nguyễn Văn An): Contract ACTIVE in P.101 Cầu Giấy
  // Khách 2 (Phạm Minh Cường): Contract ACTIVE in P.101 Đống Đa
  await page.evaluate(() => {
    localStorage.setItem('rental_is_zero_sandbox', 'false');
    const houses = [
      {
        id: 1,
        code: 'S1-CS-01',
        name: 'Cầu Giấy',
        address: '1 Cầu Giấy, Hà Nội',
        landlordId: 1,
        createdBy: 'staff1',
        manager: 'Lê Thị Thu Ngân',
        floors: 4,
        status: 'ACTIVE'
      },
      {
        id: 2,
        code: 'S2-CS-01',
        name: 'Đống Đa',
        address: '2 Đống Đa, Hà Nội',
        landlordId: 2,
        createdBy: 'staff2',
        manager: 'Đàm Văn Tảo',
        floors: 4,
        status: 'ACTIVE'
      }
    ];

    const rooms = [
      {
        id: 101,
        number: 'P.101',
        houseCode: 'S1-CS-01',
        house: 'Cầu Giấy',
        floor: 1,
        area: 25,
        price: 3500000,
        maxOccupants: 3,
        occupants: 1,
        status: 'OCCUPIED',
        amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh']
      },
      {
        id: 201,
        number: 'P.101',
        houseCode: 'S2-CS-01',
        house: 'Đống Đa',
        floor: 1,
        area: 28,
        price: 2800000,
        maxOccupants: 2,
        occupants: 1,
        status: 'OCCUPIED',
        amenities: ['WiFi', 'Điều hòa', 'Nóng lạnh']
      }
    ];

    const contracts = [
      {
        id: 1794254076762,
        contractCode: 'HD-2026-101',
        roomNumber: 'P.101',
        houseCode: 'S1-CS-01',
        houseName: 'Cầu Giấy',
        tenantName: 'Nguyễn Văn An',
        tenantPhone: '0987.654.321',
        tenantUsername: 'tenant1',
        startDate: '10/11/2026',
        endDate: '31/12/2026',
        rentalPrice: 3500000,
        depositAmount: 3500000,
        status: 'ACTIVE',
        depositPaid: true,
        signedElectronically: true
      },
      {
        id: 1794254076763,
        contractCode: 'HD-2026-201',
        roomNumber: 'P.101',
        houseCode: 'S2-CS-01',
        houseName: 'Đống Đa',
        tenantName: 'Phạm Minh Cường',
        tenantPhone: '0912.888.999',
        tenantUsername: 'tenant2',
        startDate: '01/01/2026',
        endDate: '31/12/2026',
        rentalPrice: 2800000,
        depositAmount: 2800000,
        status: 'ACTIVE',
        depositPaid: true,
        signedElectronically: true
      }
    ];

    const roomMembers = [
      {
        id: 1,
        roomId: 101,
        roomNumber: 'P.101',
        houseCode: 'S1-CS-01',
        tenantId: 1,
        fullName: 'Nguyễn Văn An',
        phone: '0987.654.321',
        cccd: '001201012345',
        maskedCccd: '00120101****',
        hometown: 'Nam Định',
        roleInRoom: 'REPRESENTATIVE',
        status: 'ACTIVE'
      },
      {
        id: 2,
        roomId: 201,
        roomNumber: 'P.101',
        houseCode: 'S2-CS-01',
        tenantId: 2,
        fullName: 'Phạm Minh Cường',
        phone: '0912.888.999',
        cccd: '034203034567',
        maskedCccd: '03420303****',
        hometown: 'Hải Phòng',
        roleInRoom: 'REPRESENTATIVE',
        status: 'ACTIVE'
      }
    ];

    localStorage.setItem('rental_boarding_houses', JSON.stringify(houses));
    localStorage.setItem('rental_rooms', JSON.stringify(rooms));
    localStorage.setItem('rental_contracts', JSON.stringify(contracts));
    localStorage.setItem('rental_room_members', JSON.stringify(roomMembers));
    localStorage.setItem('rental_tenant_rooms', JSON.stringify({
      tenant1: ['P.101'],
      'Nguyễn Văn An': ['P.101'],
      tenant2: ['P.101'],
      'Phạm Minh Cường': ['P.101']
    }));
  });

  // Reload page so React context picks up newly set localStorage
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);

  // Test 1: Check Khách 1
  console.log('2. Switching to Khách 1 (Nguyễn Văn An)...');
  await page.locator('button:has-text("Khách 1")').first().click();
  await page.waitForTimeout(1500);

  let body = await page.innerText('body');
  console.log('Checking Khách 1 Dashboard...');
  console.log('Page body snippet:\n', body.slice(0, 1000));
  
  // Verify header
  if (!body.includes('Nguyễn Văn An')) {
    throw new Error('Khách 1: Name Nguyễn Văn An not found in header!');
  }
  if (!body.includes('Cầu Giấy')) {
    throw new Error('Khách 1: House Cầu Giấy not found!');
  }

  // Resident section
  const k1ResidentsHeader = await page.locator('text=Cư Dân Trong Phòng').first().innerText();
  console.log('Khách 1 resident header:', k1ResidentsHeader);
  if (!k1ResidentsHeader.includes('1/3')) {
    throw new Error(`Khách 1: Expected (1/3 người) but got: ${k1ResidentsHeader}`);
  }

  const k1ResidentSection = await page.locator('div:has-text("Cư Dân Trong Phòng")').nth(1).innerText();
  if (k1ResidentSection.includes('Phạm Minh Cường')) {
    throw new Error('Khách 1 BUG: Phạm Minh Cường LEAKED into Nguyễn Văn An room in Cầu Giấy!');
  }
  console.log('✓ PASS: Khách 1 room ONLY contains Nguyễn Văn An (1/3 người)!');

  // Test 2: Check Khách 2
  console.log('3. Switching to Khách 2 (Phạm Minh Cường)...');
  await page.locator('button:has-text("Khách 2")').first().click();
  await page.waitForTimeout(1500);

  body = await page.innerText('body');
  console.log('Checking Khách 2 Dashboard...');

  if (!body.includes('Phạm Minh Cường')) {
    throw new Error('Khách 2: Name Phạm Minh Cường not found in header!');
  }
  if (!body.includes('Đống Đa')) {
    throw new Error('Khách 2: House Đống Đa not found!');
  }

  const k2ResidentsHeader = await page.locator('text=Cư Dân Trong Phòng').first().innerText();
  console.log('Khách 2 resident header:', k2ResidentsHeader);
  if (!k2ResidentsHeader.includes('1/2')) {
    throw new Error(`Khách 2: Expected (1/2 người) but got: ${k2ResidentsHeader}`);
  }

  const k2ResidentSection = await page.locator('div:has-text("Cư Dân Trong Phòng")').nth(1).innerText();
  if (k2ResidentSection.includes('Nguyễn Văn An')) {
    throw new Error('Khách 2 BUG: Nguyễn Văn An LEAKED into Phạm Minh Cường room in Đống Đa!');
  }
  console.log('✓ PASS: Khách 2 room ONLY contains Phạm Minh Cường (1/2 người)!');

  // Test 3: Legacy drift test
  // If rental_room_members accidentally has Cường in CS-01:
  console.log('4. Testing cross-facility isolation guard with contaminated roomMembers...');
  await page.evaluate(() => {
    // Add contaminated record of Cường in CS-01
    const sM = JSON.parse(localStorage.getItem('rental_room_members') || '[]');
    sM.push({
      id: 9999,
      roomNumber: 'P.101',
      houseCode: 'S1-CS-01', // contaminated!
      fullName: 'Phạm Minh Cường',
      roleInRoom: 'MEMBER',
      status: 'ACTIVE'
    });
    localStorage.setItem('rental_room_members', JSON.stringify(sM));
  });

  // Switch back to Khách 1 and verify the cross-facility contract sanity check blocks it!
  await page.locator('button:has-text("Khách 1")').first().click();
  await page.waitForTimeout(1500);

  const k1HeaderContaminated = await page.locator('text=Cư Dân Trong Phòng').first().innerText();
  console.log('Khách 1 resident header after contaminated record:', k1HeaderContaminated);
  if (!k1HeaderContaminated.includes('1/3')) {
    throw new Error(`Contamination test failed: Expected 1/3 but got ${k1HeaderContaminated}`);
  }

  console.log('✓ PASS: Cross-facility active contract check successfully blocked contaminated record!');

  await browser.close();
}

testRoomMembersIsolation().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
