import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseURL = process.env.DEPOSIT_TEST_URL || 'http://localhost:5173';
async function setup(t, { active = true, submit } = {}) {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(10000);
  const posts = [];
  const fixtures = {
    '/api/properties': [{ id: 91, code: 'CS-TEST', name: 'Cơ sở kiểm thử', status: 'ACTIVE' }],
    '/api/rooms': [{ id: 901, boardingHouseId: 91, roomNumber: 'P.TEST', basePrice: 2500000, status: 'AVAILABLE' }],
    '/api/tenants': [{ id: 92, fullName: 'Khách kiểm thử', email: 'tenant@test.local' }],
    '/api/contracts': [{ id: 93, tenantId: 92, roomId: 901, status: active ? 'ACTIVE' : 'TERMINATED' }],
    '/api/contracts/requests': [{ id: 94, type: 'RENT', tenantId: 92, targetRoomId: 901, status: 'PENDING' }],
    '/api/tenants/roommate-requests': [{ id: 95, requestedByTenantId: 92, roomId: 901, fullName: 'Bạn ở ghép', status: 'PENDING' }],
  };
  await page.route('**/api/**', async route => {
    if (route.request().method() === 'POST') {
      posts.push({ path: new URL(route.request().url()).pathname, body: route.request().postDataJSON() });
      return submit ? submit(route, posts.length) : route.fulfill({ json: { success: true, data: 95 } });
    }
    return route.fulfill({ json: { success: true, data: fixtures[new URL(route.request().url()).pathname] ?? [] } });
  });
  await page.goto(`${baseURL}/rooms`);
  await page.getByText('Bạn ở ghép', { exact: false }).waitFor();
  return { page, posts };
}

test('staff recognises a RENT request as a deposit booking and cannot double approve', async t => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const { page, posts } = await setup(t, { submit: async route => {
    await pending;
    return route.fulfill({ json: { success: true, data: 94 } });
  } });
  await page.getByRole('button', { name: /Duyệt Đơn Cư Dân/ }).click();
  await page.getByText('Đơn Thuê / Đặt Cọc', { exact: true }).waitFor();
  const approve = page.getByRole('button', { name: 'Phê duyệt', exact: true });
  await approve.click();
  await page.locator('.u070-t[data-state="pending"]').waitFor();
  assert.equal(await approve.isDisabled(), true);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].path, '/api/contracts/requests/94/approve');
  await mkdir('test-results/deposit-review', { recursive: true });
  await page.screenshot({ path: 'test-results/deposit-review/desktop-pending.png' });
  release();
  await page.locator('.u070-t[data-state="success"]').waitFor();
  await page.screenshot({ path: 'test-results/deposit-review/desktop-success.png' });
});

test('orphan roommate request explains missing active contract and still allows rejection', async t => {
  const { page, posts } = await setup(t, { active: false });
  assert.equal(await page.getByRole('button', { name: 'Duyệt ở ghép', exact: true }).isDisabled(), true);
  await page.getByText(/chưa có hợp đồng.*hiệu lực/i).first().waitFor();
  assert.equal(posts.length, 0);
  await page.getByRole('button', { name: 'Từ chối', exact: true }).click();
  await page.locator('.u070-t[data-state="success"]').waitFor();
  assert.equal(posts[0].body.approved, false);
});

test('roommate approval waits for network, shows red failure, then green on retry', async t => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const { page, posts } = await setup(t, { submit: async (route, attempt) => {
    if (attempt === 1) {
      await pending;
      return route.fulfill({ status: 409, json: { success: false, message: 'Hợp đồng vừa kết thúc' } });
    }
    return route.fulfill({ json: { success: true, data: 95 } });
  } });
  const approve = page.getByRole('button', { name: 'Duyệt ở ghép', exact: true });
  await approve.click();
  await page.locator('.u070-t[data-state="pending"]').waitFor();
  assert.equal(await approve.isDisabled(), true);
  release();
  await page.locator('.u070-t[data-state="error"]').filter({ hasText: 'Hợp đồng vừa kết thúc' }).waitFor();
  assert.equal(await approve.isEnabled(), true);
  assert.equal(posts[0].body.contractId, 93);
  await approve.click();
  await page.locator('.u070-t[data-state="success"]').waitFor();
  assert.equal(posts.length, 2);
});

test('mobile feedback supports long errors, dark theme, reduced motion and keyboard dismissal', async t => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const { page } = await setup(t, { submit: async route => {
    await pending;
    return route.fulfill({ status: 409, json: { success: false, message: 'Hợp đồng của người gửi đã kết thúc. Vui lòng kiểm tra và duyệt đúng đơn thuê / đặt cọc trước khi đăng ký người ở ghép.' } });
  } });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Duyệt ở ghép', exact: true }).focus();
  await page.keyboard.press('Enter');
  const toast = page.locator('.u070-t').first();
  await page.locator('.u070-t[data-state="pending"]').waitFor();
  await page.clock.install();
  await page.clock.runFor(5000);
  assert.equal(await toast.getAttribute('data-state'), 'pending', 'Pending must never expire before the response');
  await mkdir('test-results/deposit-review', { recursive: true });
  await page.screenshot({ path: 'test-results/deposit-review/mobile-pending.png' });
  release();
  await page.locator('.u070-t[data-state="error"]').waitFor();
  // Legacy screens may emit the same API error after the operation has failed.
  await page.evaluate(message => window.dispatchEvent(new CustomEvent('rental:api-error', { detail: message })), await toast.locator('small').textContent());
  const bounds = await toast.boundingBox();
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 375);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: 'test-results/deposit-review/mobile-error-light.png' });
  await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
  assert.equal(await toast.evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(19, 20, 28)');
  await page.screenshot({ path: 'test-results/deposit-review/mobile-error-dark.png' });
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.clock.runFor(500);
  await page.locator('.u070-t[data-state="error"]').waitFor({ state: 'detached' });
});
