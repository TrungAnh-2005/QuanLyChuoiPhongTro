import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import AppLayout from './components/layout/AppLayout';

// Auth & Dispatcher
import LoginPage from '@/pages/auth/LoginPage';
import Dashboard from '@/pages/Dashboard';

// Admin Pages (Quản trị viên nền tảng SaaS)
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminLandlordsPage from '@/pages/admin/AdminLandlordsPage';
import AdminHousesPage from '@/pages/admin/AdminHousesPage';
import AdminSaasInvoicesPage from '@/pages/admin/AdminSaasInvoicesPage';
import AdminIntegrationsPage from '@/pages/admin/AdminIntegrationsPage';
import AdminSystemPage from '@/pages/admin/AdminSystemPage';

// User / Staff / Landlord Pages (Chủ trọ / Người dùng vận hành)
import UserDashboard from '@/pages/user/UserDashboard';
import BoardingHousesPage from '@/pages/user/BoardingHousesPage';
import RoomsPage from '@/pages/user/RoomsPage';
import TenantsPage from '@/pages/user/TenantsPage';
import MetersPage from '@/pages/user/MetersPage';
import MeterDashboard from '@/pages/user/MeterDashboard';
import InvoicesPage from '@/pages/user/InvoicesPage';
import MaintenancePage from '@/pages/user/MaintenancePage';
import ReportsPage from '@/pages/user/ReportsPage';

// Tenant Pages (Khách thuê - 5 Màn hình)
import TenantDashboard from '@/pages/tenants/TenantDashboard';
import TenantRoomsPage from '@/pages/tenants/TenantRoomsPage';
import TenantMetersPage from '@/pages/tenants/TenantMetersPage';
import TenantInvoicesPage from '@/pages/tenants/TenantInvoicesPage';
import TenantMaintenancePage from '@/pages/tenants/TenantMaintenancePage';

// Payment Return Callbacks
import VNPayReturnPage from '@/pages/payment/VNPayReturnPage';
import MoMoReturnPage from '@/pages/payment/MoMoReturnPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="houses" element={<BoardingHousesPage />} />
              <Route path="rooms" element={<RoomsPage />} />
              <Route path="tenants" element={<TenantsPage />} />
              <Route path="tenants/dashboard" element={<TenantDashboard />} />
              <Route path="tenants/rooms" element={<TenantRoomsPage />} />
              <Route path="tenants/meters" element={<TenantMetersPage />} />
              <Route path="tenants/invoices" element={<TenantInvoicesPage />} />
              <Route path="tenants/maintenance" element={<TenantMaintenancePage />} />
              <Route path="meters" element={<MetersPage />} />
              <Route path="meters/dashboard" element={<MeterDashboard />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="invoices/tenant" element={<InvoicesPage forcedTab="TENANT_INVOICES" />} />
              <Route path="invoices/saas" element={<InvoicesPage forcedTab="SAAS_INVOICES" />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="admin/dashboard" element={<AdminDashboard />} />
              <Route path="admin/landlords" element={<AdminLandlordsPage />} />
              <Route path="admin/houses" element={<AdminHousesPage />} />
              <Route path="admin/saas-invoices" element={<AdminSaasInvoicesPage />} />
              <Route path="admin/integrations" element={<AdminIntegrationsPage />} />
              <Route path="admin/system" element={<AdminSystemPage />} />
              <Route path="user/dashboard" element={<UserDashboard />} />
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