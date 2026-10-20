import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import UserDashboard from '@/pages/user/UserDashboard';
import TenantDashboard from '@/pages/tenants/TenantDashboard';

/**
 * Dashboard Dispatcher Controller
 * Tự động điều hướng đến đúng Dashboard theo vai trò tài khoản:
 * - ADMIN: AdminDashboard (Quản trị toàn sàn SaaS Master)
 * - USER / Staff / Landlord: UserDashboard (Tổng quan vận hành cơ sở chi nhánh)
 * - TENANT: TenantDashboard (Cổng khách thuê, nộp cọc & ký HĐ Onboarding)
 */
export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  if (role === 'TENANT') {
    return <TenantDashboard />;
  }

  if (role === 'ADMIN') {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
}
