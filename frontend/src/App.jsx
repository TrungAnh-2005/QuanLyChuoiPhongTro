import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import AppLayout from './components/layout/AppLayout';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLandlordsPage from './pages/admin/AdminLandlordsPage';
import AdminHousesPage from './pages/admin/AdminHousesPage';
import AdminSaasInvoicesPage from './pages/admin/AdminSaasInvoicesPage';
import AdminIntegrationsPage from './pages/admin/AdminIntegrationsPage';
import AdminSystemPage from './pages/admin/AdminSystemPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';

// Staff / Quản lý cơ sở Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import BoardingHousesPage from './pages/staff/StaffBoardingHousesPage';
import StaffRoomsPage from './pages/staff/StaffRoomsPage';
import TenantsPage from './pages/staff/StaffTenantsPage';
import StaffMetersPage from './pages/staff/StaffMetersPage';
import StaffInvoicesPage from './pages/staff/StaffInvoicesPage';
import StaffMaintenancePage from './pages/staff/StaffMaintenancePage';
import StaffReportsPage from './pages/staff/StaffReportsPage';

// User / Khách thuê Pages
import UserDashboard from './pages/user/UserDashboard';
import UserRoomsPage from './pages/user/UserRoomsPage';
import UserMetersPage from './pages/user/UserMetersPage';
import UserInvoicesPage from './pages/user/UserInvoicesPage';
import UserMaintenancePage from './pages/user/UserMaintenancePage';

// Payment Callbacks
import VNPayReturnPage from './pages/payment/VNPayReturnPage';
import MoMoReturnPage from './pages/payment/MoMoReturnPage';

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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
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
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}