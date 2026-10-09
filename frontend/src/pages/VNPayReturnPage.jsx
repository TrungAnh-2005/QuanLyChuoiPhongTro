import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, FileCheck, XCircle, Home, FileText, ArrowRight, ShieldCheck, Printer } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function VNPayReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { payInvoice, invoices } = useData();

  const [processed, setProcessed] = useState(false);

  // VNPay Sandbox return parameters
  const responseCode = searchParams.get('vnp_ResponseCode');
  const txnRef = searchParams.get('vnp_TxnRef') || '';
  const amountStr = searchParams.get('vnp_Amount') || '0';
  const bankCode = searchParams.get('vnp_BankCode') || 'NCB';
  const transactionNo = searchParams.get('vnp_TransactionNo') || 'VNP' + Date.now().toString().slice(-8);
  const orderInfo = searchParams.get('vnp_OrderInfo') || '';

  const isSuccess = responseCode === '00';
  const amount = Number(amountStr) / 100; // VNPay chia 100

  // Trích xuất invoiceId hoặc phòng từ txnRef hoặc thông tin lưu tạm pending
  const invoiceId = txnRef.includes('_') ? txnRef.split('_')[0] : txnRef;

  const pendingInfo = (() => {
    try {
      const s = localStorage.getItem('rental_pending_payment');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (isSuccess && !processed) {
      setProcessed(true);

      // Gạch nợ hóa đơn thành công với tất cả các khóa nhận diện khả dĩ
      const keysToPay = new Set([
        pendingInfo?.code,
        pendingInfo?.id,
        pendingInfo?.room,
        invoiceId,
        (orderInfo || '').match(/P\.\d+/i)?.[0],
        (orderInfo || '').match(/HD-\d+-\d+/i)?.[0]
      ].filter(Boolean));

      const isSaas = Boolean(
        pendingInfo?.type === 'SAAS' ||
        String(invoiceId).startsWith('SAAS') ||
        String(pendingInfo?.id).startsWith('SAAS') ||
        String(orderInfo || '').includes('HD-SAAS') ||
        String(pendingInfo?.code).includes('HD-SAAS')
      );

      if (isSaas && paySaasInvoice) {
        paySaasInvoice(pendingInfo?.id || invoiceId || pendingInfo?.code, `VNPay Sandbox (${bankCode})`);
      } else {
        keysToPay.forEach((key) => {
          payInvoice(key, `VNPay Sandbox (${bankCode})`);
        });
      }

      // Xóa pending sau khi đã gạch nợ thành công
      try {
        localStorage.removeItem('rental_pending_payment');
      } catch {}
    }
  }, [isSuccess, processed, invoiceId, pendingInfo, bankCode, orderInfo, payInvoice]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden">
        {/* Banner */}
        <div
          className={`p-6 text-white text-center ${
            isSuccess
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600'
              : 'bg-gradient-to-r from-rose-600 to-amber-600'
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-lg">
            {isSuccess ? (
              <CheckCircle2 className="w-9 h-9 text-white stroke-[2.5]" />
            ) : (
              <XCircle className="w-9 h-9 text-white stroke-[2.5]" />
            )}
          </div>
          <h1 className="text-2xl font-black">
            {isSuccess
              ? 'Giao Dịch VNPay Sandbox Thành Công!'
              : 'Giao Dịch VNPay Thất Bại Hoặc Bị Hủy'}
          </h1>
          <p className="text-white/90 text-xs mt-1">
            {isSuccess
              ? 'Hóa đơn tiền phòng đã được thanh toán và gạch nợ tự động trên hệ thống.'
              : `Mã lỗi phản hồi từ cổng VNPay Sandbox: ${responseCode || 'CANCELLED'}`}
          </p>
        </div>

        {/* Transaction Receipt Details */}
        <div className="p-6 space-y-5">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                Chi Tiết Giao Dịch VNPay Sandbox
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                CỔNG VNPAY TEST
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Mã hóa đơn / Phòng:</span>
              <span className="font-mono font-bold text-purple-700">{invoiceId || 'P.101'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Số tiền thanh toán:</span>
              <span className="font-mono font-black text-slate-900 text-sm">
                {(amount || 4037500).toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Ngân hàng thanh toán:</span>
              <span className="font-bold text-slate-800">{bankCode} (Ngân hàng Quốc Dân Test)</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Mã giao dịch VNPay:</span>
              <span className="font-mono font-medium text-slate-700">{transactionNo}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Mã tham chiếu hệ thống:</span>
              <span className="font-mono text-slate-600">{txnRef}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Thời gian giao dịch:</span>
              <span className="font-medium text-slate-800">{new Date().toLocaleString('vi-VN')}</span>
            </div>

            <div className="flex justify-between pt-1 border-t border-slate-200/80">
              <span className="text-slate-500">Trạng thái:</span>
              <span
                className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                  isSuccess
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {isSuccess ? '00 - GIAO DỊCH THÀNH CÔNG' : 'GIAO DỊCH THẤT BẠI'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl text-[11px] text-purple-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              <strong>Ghi nhận kế toán:</strong> Dữ liệu thanh toán qua cổng VNPay Sandbox đã được đồng bộ vào hệ thống quản lý chuỗi phòng trọ.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu Thu</span>
            </button>
            {Boolean(pendingInfo?.type === 'SAAS' || String(invoiceId).startsWith('SAAS') || String(orderInfo || '').includes('HD-SAAS')) ? (
              <Link
                to="/invoices/saas"
                className="w-full sm:flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-1.5 btn-press"
              >
                <FileCheck className="w-4 h-4" />
                <span>Về Hóa Đơn Nộp Tiền (Admin)</span>
              </Link>
            ) : (
              <Link
                to="/"
                className="w-full sm:flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-1.5 btn-press"
              >
                <Home className="w-4 h-4" />
                <span>Về Trang Cổng Khách Thuê</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
