import React, { useState } from 'react';
import {
  Server,
  Activity,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Clock,
  Eye,
  ExternalLink,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export default function AdminSystemPage() {
  const {
    microservices = [],
    auditLogs = []
  } = useData();

  const [activeTab, setActiveTab] = useState('apm'); // 'apm' | 'audit'
  const [logFilterAction, setLogFilterAction] = useState('ALL');
  const [logFilterRole, setLogFilterRole] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const filteredLogs = (auditLogs || []).filter((log) => {
    const matchAction =
      logFilterAction === 'ALL' || log.action === logFilterAction;
    const matchRole =
      logFilterRole === 'ALL' || log.role === logFilterRole;
    const matchSearch =
      (log.details || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.username || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.ip || '').includes(logSearch) ||
      (log.target || '').toLowerCase().includes(logSearch.toLowerCase());
    return matchAction && matchRole && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 text-white p-6 rounded-2xl shadow-xl shadow-purple-600/15">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-2">
            <Activity className="w-3.5 h-3.5 text-emerald-300" />
            <span>Giám Sát Hạ Tầng & An Ninh • UC-A03</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Giám Sát Vi Dịch Vụ & Nhật Ký Kiểm Toán (Audit Logs)
          </h1>
          <p className="text-purple-100 text-sm mt-1 max-w-3xl">
            Theo dõi trạng thái sức khỏe của 12 vi dịch vụ Spring Boot trên Eureka Service Registry, lưu lượng hàng đợi RabbitMQ Broker và truy vết nhật ký bảo mật người dùng.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all btn-press cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
          <a
            href="http://localhost:8761"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-purple-700 hover:bg-purple-50 rounded-xl text-xs font-bold transition-all shadow-md btn-press"
          >
            <span>Eureka Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Switcher Tab */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('apm')}
          className={`pb-3 px-2 text-xs font-black transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'apm'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Sức Khỏe 12 Vi Dịch Vụ & Message Broker (APM)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-2 text-xs font-black transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Nhật Ký Kiểm Toán An Ninh (Security Audit Logs)</span>
        </button>
      </div>

      {/* Tab 1: APM Microservices & RabbitMQ */}
      {activeTab === 'apm' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>DỊCH VỤ SẴN SÀNG</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2">
                12 / 12 Services
              </div>
              <div className="text-xs text-emerald-600 font-bold mt-1">
                Trạng thái: 100% HEALTHY UP
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>RABBITMQ BROKER QUEUE</span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2">
                0 Backlog
              </div>
              <div className="text-xs text-blue-600 font-bold mt-1">
                Dead Letter Exchange: 0 message lỗi
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>TRUNG BÌNH ĐỘ TRỄ API</span>
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-black text-purple-700 mt-2">
                18.4 ms
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">
                Gateway proxy routing latency
              </div>
            </div>
          </div>

          {/* Microservices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {microservices.map((svc) => (
              <div
                key={svc.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:border-purple-300 transition-all card-interactive"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs border border-purple-100">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs truncate max-w-[170px]">
                        {svc.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Port :{svc.port}
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>UP</span>
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Heap Memory:</span>
                    <span className="font-mono font-bold text-slate-700">{svc.heap}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">CPU Usage:</span>
                    <span className="font-mono font-bold text-slate-700">{svc.cpu}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Security Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm IP, username, hành động..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={logFilterRole}
                onChange={(e) => setLogFilterRole(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">Tất Cả Vai Trò</option>
                <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                <option value="ROLE_STAFF">ROLE_STAFF</option>
                <option value="ROLE_TENANT">ROLE_TENANT</option>
              </select>

              <select
                value={logFilterAction}
                onChange={(e) => setLogFilterAction(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">Tất Cả Hành Động</option>
                <option value="SAVE_METER_READINGS">Chốt Chỉ Số Điện Nước</option>
                <option value="CREATE_INVOICE_BATCH">Phát Hành Hóa Đơn</option>
                <option value="SIGN_CONTRACT">Ký Hợp Đồng</option>
                <option value="ONLINE_PAYMENT_VNPAY">Thanh Toán Trực Tuyến</option>
                <option value="UPDATE_INTEGRATION_KEY">Cấu Hình Tích Hợp</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-500 uppercase font-black tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Địa Chỉ IP</th>
                  <th className="py-3 px-4">Người Thực Hiện</th>
                  <th className="py-3 px-4">Hành Động Nghiệp Vụ</th>
                  <th className="py-3 px-4">Đối Tượng</th>
                  <th className="py-3 px-4">Chi Tiết Nhật Ký</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {log.ip}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-900">{log.username}</span>
                        <span
                          className={`ml-1.5 px-2 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                            log.role === 'ROLE_ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : log.role === 'ROLE_STAFF'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {log.role}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {log.target}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>SUCCESS</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
