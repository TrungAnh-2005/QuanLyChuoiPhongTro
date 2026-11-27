
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import AppLayout from '../components/layouts/AppLayout';

// Auth
import LoginPage from '../features/auth/pages/LoginPage';

// Admin Pages
import AdminDashboard from '../features/dashboard/pages/AdminDashboard';
import AdminLandlordsPage from '../features/landlords/pages/AdminLandlordsPage';
import AdminHousesPage from '../features/properties/pages/AdminPropertiesPage';
import AdminSaasInvoicesPage from '../features/subscriptions/pages/AdminInvoicesPage';
import AdminIntegrationsPage from '../features/integrations/pages/AdminIntegrationsPage';
import AdminSystemPage from '../features/system/pages/SystemPage';
import AdminReportsPage from '../features/reports/pages/AdminReportsPage';

// Staff / Quản lý cơ sở Pages
import StaffDashboard from '../features/dashboard/pages/StaffDashboard';
import BoardingHousesPage from '../features/properties/pages/StaffPropertiesPage';
import StaffRoomsPage from '../features/rooms/pages/StaffRoomsPage';
import TenantsPage from '../features/tenants/pages/StaffTenantsPage';
import StaffMetersPage from '../features/meters/pages/StaffMetersPage';
import StaffInvoicesPage from '../features/invoices/pages/StaffInvoicesPage';
import StaffMaintenancePage from '../features/maintenance/pages/StaffMaintenancePage';
import StaffReportsPage from '../features/reports/pages/StaffReportsPage';

// User / Khách thuê Pages
import UserDashboard from '../features/dashboard/pages/TenantDashboard';
import UserRoomsPage from '../features/rooms/pages/TenantRoomsPage';
import UserMetersPage from '../features/meters/pages/TenantMetersPage';
import UserInvoicesPage from '../features/invoices/pages/TenantInvoicesPage';
import UserMaintenancePage from '../features/maintenance/pages/TenantMaintenancePage';

// Payment Callbacks
import VNPayReturnPage from '../features/payments/pages/VNPayReturnPage';
import MoMoReturnPage from '../features/payments/pages/MoMoReturnPage';


// Role-based Route Dispatchers
function RoleDashboard() {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <AdminDashboard />;
  if (user?.role === 'TENANT') return <UserDashboard />;
  return <StaffDashboard />;
}

function RoleRoomsPage() {
  const { user } = useAuth();
  if (user?.role === 'TENANT') return <UserRoomsPage />;
  return <StaffRoomsPage />;
}

function RoleMetersPage() {
  const { user } = useAuth();
  if (user?.role === 'TENANT') return <UserMetersPage />;
  return <StaffMetersPage />;
}

function RoleInvoicesPage({ forcedTab }) {
  const { user } = useAuth();
  if (user?.role === 'TENANT') return <UserInvoicesPage />;
  return <StaffInvoicesPage forcedTab={forcedTab} />;
}

function RoleMaintenancePage() {
  const { user } = useAuth();
  if (user?.role === 'TENANT') return <UserMaintenancePage />;
  return <StaffMaintenancePage />;
}

function RoleReportsPage() {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <AdminReportsPage />;
  return <StaffReportsPage />;
}

export default function AppRoutes() {
  return (<Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<AppLayout />}>
              {/* Dynamic Role Routes */}
              <Route index element={<RoleDashboard />} />
              <Route path="rooms" element={<RoleRoomsPage />} />
              <Route path="meters" element={<RoleMetersPage />} />
              <Route path="invoices" element={<RoleInvoicesPage />} />
              <Route path="invoices/tenant" element={<RoleInvoicesPage forcedTab="TENANT_INVOICES" />} />
              <Route path="invoices/saas" element={<RoleInvoicesPage forcedTab="SAAS_INVOICES" />} />
              <Route path="maintenance" element={<RoleMaintenancePage />} />
              <Route path="reports" element={<RoleReportsPage />} />

              {/* Staff-specific Routes */}
              <Route path="houses" element={<BoardingHousesPage />} />
              <Route path="tenants" element={<TenantsPage />} />

              {/* Admin-specific Routes */}
              <Route path="admin/landlords" element={<AdminLandlordsPage />} />
              <Route path="admin/houses" element={<AdminHousesPage />} />
              <Route path="admin/saas-invoices" element={<AdminSaasInvoicesPage />} />
              <Route path="admin/integrations" element={<AdminIntegrationsPage />} />
              <Route path="admin/system" element={<AdminSystemPage />} />

              {/* Payment Return Callbacks */}
              <Route path="payment/vnpay-return" element={<VNPayReturnPage />} />
              <Route path="payment/momo-return" element={<MoMoReturnPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>);
}
