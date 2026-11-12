import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
const storage = () => { const values = new Map(); return { getItem:key=>values.get(key) ?? null, setItem:(key,value)=>values.set(key,String(value)), removeItem:key=>values.delete(key), clear:()=>values.clear() }; };
globalThis.sessionStorage=storage(); globalThis.localStorage=storage(); globalThis.window=new EventTarget();
const {default:api}=await import('./api.js');
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
