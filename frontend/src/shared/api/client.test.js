import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
const storage = () => { const values = new Map(); return { getItem:key=>values.get(key) ?? null, setItem:(key,value)=>values.set(key,String(value)), removeItem:key=>values.delete(key), clear:()=>values.clear() }; };
globalThis.sessionStorage=storage(); globalThis.localStorage=storage(); globalThis.window=new EventTarget();
const {default:api}=await import('./client.js');
beforeEach(()=>{sessionStorage.clear();localStorage.clear();});
const response = (config,body) => ({data:body,status:200,statusText:'OK',headers:{},config});
test('uses the tab session token and preserves the gateway response envelope',async()=>{
 sessionStorage.setItem('rental_token','signed-token');localStorage.setItem('rental_token','stale-demo-token');
 api.defaults.adapter=async config=>{assert.equal(config.baseURL,'/api');assert.equal(config.headers.Authorization,'Bearer signed-token');return response(config,{success:true,data:{id:12}});};
 assert.deepEqual(await api.get('/rooms'),{success:true,data:{id:12}});
});
test('does not promote an old demo token to an authenticated request',async()=>{
 localStorage.setItem('rental_token','demo-admin-token');
 api.defaults.adapter=async config=>{assert.equal(config.headers.Authorization,undefined);return response(config,[]);};
 assert.deepEqual(await api.get('/rooms'),[]);
});
test('rejects an unsuccessful API envelope',async()=>{
 api.defaults.adapter=async config=>response(config,{success:false,message:'Room is occupied'});
 await assert.rejects(api.delete('/rooms/1'),/Room is occupied/);
});
test('clears sessions and notifies auth on an expired access token',async()=>{
 sessionStorage.setItem('rental_token','expired');localStorage.setItem('rental_user','old-user');let count=0;
 const listener=()=>count++;window.addEventListener('rental:unauthorized',listener);
 api.defaults.adapter=async config=>{throw new axios.AxiosError('Unauthorized','ERR_BAD_REQUEST',config,null,{status:401,data:{message:'Expired token'}});};
 await assert.rejects(api.get('/tenants'),/Expired token/);
 assert.equal(sessionStorage.getItem('rental_token'),null);assert.equal(localStorage.getItem('rental_user'),null);assert.equal(count,1);window.removeEventListener('rental:unauthorized',listener);
});
test('reports a network failure without returning fake success',async()=>{
 api.defaults.adapter=async config=>{throw new axios.AxiosError('Network Error','ERR_NETWORK',config);};
 await assert.rejects(api.post('/invoices',{}),/Không kết nối được máy chủ/);
});

test('shares one refresh across concurrent expired requests and retries with the new token', async () => {
 sessionStorage.setItem('rental_token', 'expired');
 sessionStorage.setItem('rental_refresh_token', 'refresh-one');
 let refreshes = 0;
 api.defaults.adapter = async config => {
  if (config.url === '/auth/refresh') {
   refreshes++;
   assert.deepEqual(JSON.parse(config.data), {refreshToken:'refresh-one'});
   await new Promise(resolve => setTimeout(resolve, 10));
   return response(config, {success:true,data:{accessToken:'renewed',refreshToken:'refresh-two'}});
  }
  if (config.headers.Authorization === 'Bearer expired') {
   throw new axios.AxiosError('Expired','ERR_BAD_REQUEST',config,null,{status:401,data:{}});
  }
  assert.equal(config.headers.Authorization, 'Bearer renewed');
  return response(config, {success:true,data:config.url});
 };
 const results = await Promise.all([api.get('/rooms'),api.get('/tenants')]);
 assert.equal(refreshes,1);
 assert.equal(results.length,2);
 assert.equal(sessionStorage.getItem('rental_refresh_token'),'refresh-two');
});

test('clears the session when refresh is rejected without retrying indefinitely', async () => {
 sessionStorage.setItem('rental_token','expired');
 sessionStorage.setItem('rental_refresh_token','invalid');
 let refreshes=0;
 api.defaults.adapter=async config=>{
  if(config.url==='/auth/refresh') refreshes++;
  throw new axios.AxiosError('Expired','ERR_BAD_REQUEST',config,null,{status:401,data:{}});
 };
 await assert.rejects(api.get('/rooms'));
 assert.equal(refreshes,1);
 assert.equal(sessionStorage.getItem('rental_token'),null);
 assert.equal(sessionStorage.getItem('rental_refresh_token'),null);
});

test('does not refresh again when the retried request still returns 401', async () => {
 sessionStorage.setItem('rental_token','expired');
 sessionStorage.setItem('rental_refresh_token','refresh-one');
 let refreshes=0;
 api.defaults.adapter=async config=>{
  if(config.url==='/auth/refresh') {
   refreshes++;
   return response(config,{success:true,data:{accessToken:'renewed',refreshToken:'refresh-two'}});
  }
  throw new axios.AxiosError('Unauthorized','ERR_BAD_REQUEST',config,null,{status:401,data:{}});
 };
 await assert.rejects(api.get('/rooms'));
 assert.equal(refreshes,1);
 assert.equal(sessionStorage.getItem('rental_token'),null);
});
