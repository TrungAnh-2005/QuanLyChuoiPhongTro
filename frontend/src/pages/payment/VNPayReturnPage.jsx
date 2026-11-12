import React, {useEffect,useState} from 'react';
import {useSearchParams,Link} from 'react-router-dom';
import api from '../../services/api';
import {useData} from '../../contexts/DataContext';
export default function VNPayReturnPage() {
 const [params]=useSearchParams(); const [result,setResult]=useState(null); const {refreshData}=useData();
 useEffect(()=>{ let active=true; api.get('/payments/vnpay/verify',{params:Object.fromEntries(params)}).then(async response=>{if(active)setResult(response);await refreshData();}).catch(error=>{if(active)setResult({success:false,message:error.message});}); return ()=>{active=false;}; },[params]);
 return <main className="max-w-xl mx-auto p-8"><h1 className="text-xl font-bold">Kết quả thanh toán VNPay</h1><p role="status" className="my-6">{result ? result.message : 'Đang xác minh giao dịch với máy chủ…'}</p><Link to="/invoices">Quay lại hóa đơn</Link></main>;
}
