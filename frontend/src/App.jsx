import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import AppLayout from './components/layout/AppLayout';
// Auth
import LoginPage from './pages/auth/LoginPage';

// Shared (dùng chung nhiều vai trò, phân nhánh theo role bên trong)
import Dashboard from './pages/shared/Dashboard';
import RoomsPage from './pages/shared/RoomsPage';
import MetersPage from './pages/shared/MetersPage';
import InvoicesPage from './pages/shared/InvoicesPage';
import MaintenancePage from './pages/shared/MaintenancePage';
import ReportsPage from './pages/shared/ReportsPage';

// Staff (Quản lý / Chủ trọ)
import BoardingHousesPage from './pages/staff/BoardingHousesPage';
import TenantsPage from './pages/staff/TenantsPage';

// Payment callbacks
import VNPayReturnPage from './pages/payment/VNPayReturnPage';
import MoMoReturnPage from './pages/payment/MoMoReturnPage';

// Admin
import AdminLandlordsPage from './pages/admin/AdminLandlordsPage';
import AdminHousesPage from './pages/admin/AdminHousesPage';
import AdminSaasInvoicesPage from './pages/admin/AdminSaasInvoicesPage';
import AdminIntegrationsPage from './pages/admin/AdminIntegrationsPage';
import AdminSystemPage from './pages/admin/AdminSystemPage';

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
              <Route path="meters" element={<MetersPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="invoices/tenant" element={<InvoicesPage forcedTab="TENANT_INVOICES" />} />
              <Route path="invoices/saas" element={<InvoicesPage forcedTab="SAAS_INVOICES" />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="admin/landlords" element={<AdminLandlordsPage />} />
              <Route path="admin/houses" element={<AdminHousesPage />} />
              <Route path="admin/saas-invoices" element={<AdminSaasInvoicesPage />} />
              <Route path="admin/integrations" element={<AdminIntegrationsPage />} />
              <Route path="admin/system" element={<AdminSystemPage />} />
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