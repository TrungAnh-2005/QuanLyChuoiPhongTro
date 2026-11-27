import { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { useData } from '../../shared/data/RentalDataContext';
import PaymentModal from '../payments/PaymentModal';
import BuySaasPackageModal from './BuySaasPackageModal';

const paymentLabels = { VNPAY: 'Cổng VNPay', MOMO: 'Ví MoMo' };

export default function SaasPackageCheckout({ isOpen, onClose, currentLandlord, initialPackageCode = 'ENTERPRISE', onPaid }) {
  const { user } = useAuth();
  const { createSaasInvoice, paySaasInvoice, updateLandlordPackage } = useData();
  const [invoice, setInvoice] = useState(null);
  const landlordId = currentLandlord?.id || (user?.username === 'staff2' ? 2 : 1);

  async function confirmPurchase(plan) {
    try {
      onClose();
      const now = Date.now();
      const draft = {
        id: `SAAS-${now}`,
        code: `HD-SAAS-2026-${String(now).slice(-4)}`,
        landlordId,
        landlordUsername: user?.username || (landlordId === 2 ? 'staff2' : 'staff'),
        landlordName: currentLandlord?.fullName || user?.fullName || 'Quản lý cơ sở',
        landlordPhone: currentLandlord?.phone || user?.phone || '0900.000.000',
        packageName: plan.packageName,
        packageCode: plan.packageCode,
        billingCycle: plan.billingCycle,
        period: `${plan.months} Tháng`,
        amount: plan.amount,
        total: plan.amount,
        dueDate: new Date(now + 7 * 86400000).toLocaleDateString('vi-VN'),
        status: 'UNPAID',
        isSaas: true,
      };
      const created = await createSaasInvoice?.(draft);
      setInvoice(created || draft);
    } catch (error) {
      window.dispatchEvent(new CustomEvent('rental:api-error', { detail: error.message }));
      return { success: false, error: error.message };
    }
  }

  async function confirmPayment(paidInvoice, method) {
    try {
      const methodLabel = paymentLabels[method] || 'VietQR / SePay';
      await paySaasInvoice?.(paidInvoice.id, methodLabel);
      await updateLandlordPackage?.(landlordId, paidInvoice.packageCode || initialPackageCode);
      setInvoice(null);
      onPaid(paidInvoice, methodLabel);
    } catch (error) {
      window.dispatchEvent(new CustomEvent('rental:api-error', { detail: error.message }));
      return { success: false, error: error.message };
    }
  }

  return (
    <>
      <BuySaasPackageModal
        isOpen={isOpen}
        onClose={onClose}
        currentLandlord={currentLandlord}
        initialPackageCode={initialPackageCode}
        onConfirmPurchase={confirmPurchase}
      />
      <PaymentModal isOpen={!!invoice} onClose={() => setInvoice(null)} onSuccess={confirmPayment} invoice={invoice || undefined} />
    </>
  );
}
