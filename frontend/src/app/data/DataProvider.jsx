import { useMemo, useState } from 'react';
import { RentalDataContext as DataContext } from '../../shared/data/RentalDataContext';
import { useAuth } from '../../features/auth/AuthContext';
import useMutationFeedback from '../../shared/hooks/useMutationFeedback';
import { initial } from './resources';
import { useRentalLoader } from './useRentalLoader';
import { selectRentalView } from './selectRentalView';
import { createRentalActions } from './createRentalActions';

export function DataProvider({ children }) {
  const { user, testMode, loading: authLoading } = useAuth();
  const { notifications: mutationNotifications, dismiss: dismissMutationNotification, run: runMutation } = useMutationFeedback(`${user?.id}:${user?.role}`);
  const [state, setState] = useState(initial);
  const [billingMonth, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [drafts, setDrafts] = useState({});

  const { loading, error, refreshData } = useRentalLoader({ user, testMode, setState, setDrafts });
  const view = useMemo(() => selectRentalView(state, { billingMonth, drafts, user, testMode }), [state, billingMonth, drafts, user, testMode]);
  const actions = createRentalActions({ view, user, testMode, billingMonth, refreshData, setState, setDrafts, setMonth });
  // Every exported mutation completes its request before reporting success to a screen.
  const wrapped = Object.fromEntries(Object.entries(actions).map(([name,fn]) => [name, ['switchBillingMonth','updateMeterReading','unlockMeterReading','refreshData'].includes(name) ? fn : async (...args) => {
    return runMutation(name, () => fn(...args));
  }]));
  const availableBillingMonths = [...new Set([
    billingMonth,
    new Date().toISOString().slice(0, 7),
    ...state.invoices.map(invoice => `${invoice.year}-${String(invoice.month).padStart(2, '0')}`),
    ...state.readings.map(reading => reading.readingDate?.slice(0, 7)).filter(Boolean),
  ])].sort().reverse();
  const value = {
    ...view, ...wrapped,
    mutationNotifications, dismissMutationNotification,
    billingMonth, availableBillingMonths, loading, error,
    metersHistory: { [billingMonth]: view.meters },
    utilityPrices: {
      elecPrice: Number(view.houseServiceConfigs.find(config => config.serviceName === 'Điện')?.unitPrice || 3500),
      waterPrice: Number(view.houseServiceConfigs.find(config => config.serviceName === 'Nước')?.unitPrice || 25000),
    },
    systemNotices: state.notifications,
  };

  return (
    <DataContext.Provider value={value}>
      {authLoading ? <div role="status">Đang xác thực…</div> : children}
    </DataContext.Provider>
  );
}

