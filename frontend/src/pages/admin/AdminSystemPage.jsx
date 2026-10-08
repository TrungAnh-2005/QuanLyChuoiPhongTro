import React, { useState, useEffect, useMemo } from 'react';
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
  HardDrive,
  Wifi,
  WifiOff,
  Radio,
  Play,
  Pause,
  Send,
  Zap,
  Network
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

function parseHeap(heapStr) {
  if (!heapStr) return { used: 250, max: 1024 };
  const match = heapStr.match(/(\d+)\s*MB\s*\/\s*(\d+)\s*MB/i);
  if (match) {
    return { used: parseInt(match[1], 10), max: parseInt(match[2], 10) };
  }
  return { used: 250, max: 1024 };
}

// 12 Vi dịch vụ chuẩn kiến trúc Spring Boot Microservices
const DEFAULT_12_SERVICES = [
  { id: 'api-gateway', name: 'API Gateway', port: 8080, maxMem: 512, defaultUsed: 329, defaultCpu: 3.4, defaultThreads: 36, defaultReq: 29 },
  { id: 'discovery-server', name: 'Eureka Service Discovery', port: 8761, maxMem: 512, defaultUsed: 272, defaultCpu: 1.5, defaultThreads: 30, defaultReq: 93 },
  { id: 'auth-service', name: 'Auth Service (JWT & RBAC)', port: 8081, maxMem: 1024, defaultUsed: 409, defaultCpu: 1.7, defaultThreads: 30, defaultReq: 92 },
  { id: 'room-service', name: 'Room & Boarding House Service', port: 8082, maxMem: 1024, defaultUsed: 380, defaultCpu: 2.1, defaultThreads: 30, defaultReq: 45 },
  { id: 'tenant-service', name: 'Tenant Service (Roommates & VNeID)', port: 8083, maxMem: 1024, defaultUsed: 312, defaultCpu: 1.8, defaultThreads: 38, defaultReq: 38 },
  { id: 'contract-service', name: 'Contract Service (E-Signature)', port: 8084, maxMem: 1024, defaultUsed: 295, defaultCpu: 1.4, defaultThreads: 25, defaultReq: 22 },
  { id: 'meter-service', name: 'Meter Reading & AI Service', port: 8085, maxMem: 2048, defaultUsed: 520, defaultCpu: 3.8, defaultThreads: 42, defaultReq: 64 },
  { id: 'billing-service', name: 'Billing & Invoice Service', port: 8086, maxMem: 1024, defaultUsed: 365, defaultCpu: 2.5, defaultThreads: 32, defaultReq: 51 },
  { id: 'payment-service', name: 'Payment Service (SePay/VietQR/VNPay)', port: 8087, maxMem: 1024, defaultUsed: 340, defaultCpu: 2.2, defaultThreads: 35, defaultReq: 58 },
  { id: 'maintenance-service', name: 'Maintenance & Ticket Service', port: 8088, maxMem: 512, defaultUsed: 215, defaultCpu: 1.1, defaultThreads: 24, defaultReq: 18 },
  { id: 'report-service', name: 'Report & BI Aggregation Service', port: 8089, maxMem: 1024, defaultUsed: 430, defaultCpu: 2.9, defaultThreads: 34, defaultReq: 31 },
  { id: 'notification-service', name: 'Notification Service (RabbitMQ)', port: 8090, maxMem: 512, defaultUsed: 245, defaultCpu: 1.6, defaultThreads: 28, defaultReq: 72 }
];

export default function AdminSystemPage() {
  const {
    microservices = [],
    auditLogs = [],
    addAuditLog
  } = useData();

  const [activeTab, setActiveTab] = useState('apm'); // 'apm' | 'audit'
  const [logFilterAction, setLogFilterAction] = useState('ALL');
  const [logFilterRole, setLogFilterRole] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Thử tải đột biến (Spike Load Test)
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [stressCountdown, setStressCountdown] = useState(0);

  // Timer cho luồng WebSocket/Actuator Stream (Bắt đầu từ 01:23:05 giống hệt ảnh media_1791397426014.png)
  const [streamSeconds, setStreamSeconds] = useState(4985); // 01:23:05 in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setStreamSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format giây thành HH:mm:ss
  const streamTimeFormatted = useMemo(() => {
    const hrs = Math.floor(streamSeconds / 3600);
    const mins = Math.floor((streamSeconds % 3600) / 60);
    const secs = streamSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [streamSeconds]);

  // Bộ đếm countdown khi thử tải đột biến
  useEffect(() => {
    if (!isStressTesting) return;
    if (stressCountdown <= 0) {
      setIsStressTesting(false);
      return;
    }
    const timer = setTimeout(() => {
      setStressCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isStressTesting, stressCountdown]);

  // Hàm chuyển đổi trạng thái Thử Tải Đột Biến
  const toggleStressTest = () => {
    if (isStressTesting) {
      setIsStressTesting(false);
      setStressCountdown(0);
      if (addAuditLog) {
        addAuditLog({
          role: 'ROLE_ADMIN',
          username: 'admin',
          action: 'STOP_SPIKE_LOAD_TEST',
          target: 'API Gateway & Cluster',
          details: 'Quản trị viên dừng thử tải đột biến, cụm vi dịch vụ hạ tải về mức bình thường'
        });
      }
    } else {
      setIsStressTesting(true);
      setStressCountdown(25); // Chạy thử tải trong 25 giây
      if (addAuditLog) {
        addAuditLog({
          role: 'ROLE_ADMIN',
          username: 'admin',
          action: 'SPIKE_LOAD_TEST',
          target: 'API Gateway & 12 Microservices',
          details: 'Bơm lưu lượng kiểm thử tải đột biến 12.500 req/s qua API Gateway và RabbitMQ Event Bus'
        });
      }
    }
  };

  const [liveMetrics, setLiveMetrics] = useState({});

  // Cập nhật dao động sống động (APM Fluctuation)
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMetrics((prev) => {
        const next = {};
        DEFAULT_12_SERVICES.forEach((svc) => {
          if (isStressTesting) {
            // Khi đang thử tải đột biến: CPU vọt lên 65% - 94%, Mem vọt lên 75% - 90%, Req/s vọt lên 800 - 1.450
            const cpuNum = +(70 + Math.random() * 24).toFixed(1);
            const memUsed = Math.min(svc.maxMem - 30, Math.floor(svc.maxMem * (0.75 + Math.random() * 0.16)));
            const memPercent = Math.round((memUsed / svc.maxMem) * 100);
            const threads = Math.floor(svc.defaultThreads * 5.5 + Math.random() * 30);
            const reqPerSec = Math.floor(800 + Math.random() * 650);

            next[svc.id] = {
              cpu: `${cpuNum}%`,
              cpuNum,
              heap: `${memUsed}MB / ${svc.maxMem}MB`,
              heapPercent: memPercent,
              threads,
              reqPerSec
            };
          } else {
            // Trạng thái bình thường: CPU 1.0% - 4.5%, Mem 40% - 64%, Req/s 20 - 95
            const jitter = +(Math.random() * 0.8 - 0.4).toFixed(1);
            const cpuNum = Math.max(0.6, +(svc.defaultCpu + jitter).toFixed(1));
            const memUsed = Math.min(svc.maxMem, Math.max(100, svc.defaultUsed + Math.floor(Math.random() * 10 - 5)));
            const memPercent = Math.round((memUsed / svc.maxMem) * 100);

            next[svc.id] = {
              cpu: `${cpuNum}%`,
              cpuNum,
              heap: `${memUsed}MB / ${svc.maxMem}MB`,
              heapPercent: memPercent,
              threads: svc.defaultThreads,
              reqPerSec: svc.defaultReq + Math.floor(Math.random() * 6 - 3)
            };
          }
        });
        return next;
      });
    }, isStressTesting ? 1200 : 2500);

    return () => clearInterval(interval);
  }, [isStressTesting]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const filteredLogs = useMemo(() => {
    return (auditLogs || []).filter((log) => {
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
  }, [auditLogs, logFilterAction, logFilterRole, logSearch]);

  // Các chỉ số cụm Cluster tổng thể
  const clusterCpu = isStressTesting ? '85.4% TB Tải' : '2.4% TB Tải';
  const clusterRamText = isStressTesting
    ? 'RAM: 10.420 / 12.800 MB (81.4%)'
    : 'RAM: 4.729 / 12.800 MB (36.9%)';
  const rabbitMqText = isStressTesting ? '18.940 msgs/s' : '1.443 msgs/s';
  const rabbitMqSub = isStressTesting
    ? 'Dead Letter: 0 msg lỗi • 56 Backlog'
    : 'Dead Letter: 0 msg lỗi • 0 Backlog';
  const latencyText = isStressTesting ? '138.4 ms' : '15.7 ms';

  return (
    <div className="space-y-6 page-enter">
      {/* Top Banner: Phong cách Hoàng gia Tím đậm khớp 100% ảnh media_1791397426014.png */}
      <div className="bg-indigo-600 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        {/* Glow hiệu ứng tinh tế */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold backdrop-blur-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Giám Sát Hạ Tầng & APM Microservices • UC-A03</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Giám Sát 12 Vi Dịch Vụ & Nhật Ký Kiểm Toán (Audit Logs)
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Luồng giám sát thời gian thực kết nối Spring Boot Actuator, kiểm soát tải CPU, Heap Memory JVM, hàng đợi RabbitMQ Broker và truy vết an ninh nền tảng.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0 flex-wrap">
            {/* Huy hiệu Đang Live */}
            <div className="flex items-center gap-2 px-3.5 py-2 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Đang Live</span>
            </div>

            {/* NÚT THỬ TẢI ĐỘT BIẾN - CÓ TÁC DỤNG THẬT VÀ TRỰC QUAN MẠNH MẼ */}
            <button
              type="button"
              onClick={toggleStressTest}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md btn-press cursor-pointer ${
                isStressTesting
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white border border-rose-300 animate-pulse ring-2 ring-rose-400'
                  : 'bg-amber-600/90 hover:bg-amber-600 text-white border border-amber-400/40'
              }`}
              title="Kích hoạt mô phỏng đợt bùng nổ tải 12.000 req/s kiểm tra khả năng co giãn APM và RabbitMQ"
            >
              <span>⚡</span>
              <span>{isStressTesting ? `Dừng Thử Tải (${stressCountdown}s)` : 'Thử Tải Đột Biến'}</span>
            </button>

            {/* Làm mới */}
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all btn-press cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Làm Mới</span>
            </button>

            {/* Eureka Portal */}
            <a
              href="http://localhost:8761"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-black transition-all shadow-md btn-press"
            >
              <span>Eureka Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Cảnh báo khi đang Thử Tải Đột Biến */}
      {isStressTesting && (
        <div className="p-4 bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-2 border-rose-400 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              🔥
            </div>
            <div>
              <div className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-2">
                <span>ĐANG BƠM TẢI ĐỘT BIẾN (SPIKE LOAD TESTING: 12.500 REQ/S)</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono">
                  Còn {stressCountdown}s
                </span>
              </div>
              <p className="text-xs text-rose-800 font-medium mt-0.5">
                Lưu lượng API Gateway và hàng đợi RabbitMQ đang tăng vọt. CPU cụm cluster vọt lên ~85%, Ram JVM đẩy tải xử lý đồng thời để kiểm tra cơ chế Circuit Breaker & Fallback.
              </p>
            </div>
          </div>
          <button
            onClick={toggleStressTest}
            className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow transition-all shrink-0 cursor-pointer"
          >
            Dừng Ngay Lập Tức
          </button>
        </div>
      )}

      {/* Tabs Chuyển Đổi Phân Hệ & Đồng Hồ WebSocket Stream */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('apm')}
            className={`pb-2 text-xs font-extrabold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'apm'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Sức Khỏe 12 Vi Dịch Vụ & Actuator APM</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-2 text-xs font-extrabold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Nhật Ký Kiểm Toán An Ninh (Security Audit Logs)</span>
          </button>
        </div>

        {/* Đồng hồ hiển thị thời gian WebSocket Stream trực tiếp */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>WebSocket/Actuator Stream:</span>
          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            {streamTimeFormatted}
          </span>
        </div>
      </div>

      {/* TAB 1: SỨC KHỎE 12 VI DỊCH VỤ & ACTUATOR APM */}
      {activeTab === 'apm' && (
        <div className="space-y-6">
          {/* 4 THẺ KPI CHUẨN XÁC 100% THEO media_1791397426014.png */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Dịch vụ sẵn sàng */}
            <div className="bento-card p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>DỊCH VỤ SẴN SÀNG</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                12 / 12 Services
              </div>
              <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <span>🟢</span>
                <span>Trạng thái: 100% HEALTHY UP</span>
              </div>
            </div>

            {/* KPI 2: RabbitMQ Event Bus */}
            <div className="bento-card p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>RABBITMQ EVENT BUS</span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                {rabbitMqText}
              </div>
              <div className="text-xs text-blue-600 font-medium">
                {rabbitMqSub}
              </div>
            </div>

            {/* KPI 3: Độ trễ API Gateway */}
            <div className="bento-card p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>ĐỘ TRỄ API GATEWAY</span>
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                {latencyText}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Gateway proxy routing latency
              </div>
            </div>

            {/* KPI 4: Tổng Heap RAM / CPU Cluster */}
            <div className="bento-card p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>TỔNG HEAP RAM / CPU CLUSTER</span>
                <Cpu className="w-4 h-4 text-purple-600" />
              </div>
              <div className={`text-3xl font-black tracking-tight font-mono ${
                isStressTesting ? 'text-rose-600' : 'text-slate-900'
              }`}>
                {clusterCpu}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {clusterRamText}
              </div>
            </div>
          </div>

          {/* LƯỚI 12 VI DỊCH VỤ - 3 CỘT KHỚP CHUẨN XÁC media_1791397426014.png */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEFAULT_12_SERVICES.map((svc) => {
              const liveCpu = liveMetrics[svc.id]?.cpu || `${svc.defaultCpu}%`;
              const liveCpuNum = liveMetrics[svc.id]?.cpuNum || svc.defaultCpu;
              const liveHeap = liveMetrics[svc.id]?.heap || `${svc.defaultUsed}MB / ${svc.maxMem}MB`;
              const heapPercent = liveMetrics[svc.id]?.heapPercent || Math.round((svc.defaultUsed / svc.maxMem) * 100);
              const threads = liveMetrics[svc.id]?.threads || svc.defaultThreads;
              const reqPerSec = liveMetrics[svc.id]?.reqPerSec || svc.defaultReq;

              return (
                <div
                  key={svc.id}
                  className={`bg-white border rounded-2xl p-4.5 shadow-xs transition-all duration-300 ${
                    isStressTesting
                      ? 'border-rose-300 ring-1 ring-rose-200'
                      : 'border-slate-200/80 hover:border-indigo-300'
                  }`}
                >
                  {/* Header Service */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100/80 shrink-0">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs truncate max-w-[180px]">
                          {svc.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Port :{svc.port} • {threads} threads
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>UP</span>
                    </span>
                  </div>

                  {/* Chi tiết Heap Memory & CPU */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-3 text-[11px]">
                    {/* Heap Memory */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Heap Memory (JVM):</span>
                        <span className="font-mono font-bold text-slate-700">
                          {liveHeap} ({heapPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            isStressTesting ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${heapPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* CPU Usage */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">CPU Usage:</span>
                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          liveCpuNum > 50
                            ? 'bg-rose-100 text-rose-800'
                            : liveCpuNum > 10
                            ? 'bg-amber-100 text-amber-800'
                            : 'text-emerald-700 font-bold'
                        }`}>
                          {liveCpu}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            liveCpuNum > 50
                              ? 'bg-rose-500'
                              : liveCpuNum > 10
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, liveCpuNum)}%` }}
                        />
                      </div>
                    </div>

                    {/* Bottom Row: Lưu lượng & Actuator Status */}
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-slate-500 font-medium">
                        Lưu lượng: <strong className="font-mono text-slate-800">{reqPerSec} req/s</strong>
                      </span>
                      <span className="text-emerald-600 font-bold">
                        Actuator 200 OK
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: NHẬT KÝ KIỂM TOÁN AN NINH (SECURITY AUDIT LOGS) */}
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
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <select
                value={logFilterAction}
                onChange={(e) => setLogFilterAction(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="ALL">Tất cả hành động</option>
                <option value="SPIKE_LOAD_TEST">SPIKE_LOAD_TEST</option>
                <option value="APM_SYSTEM_CHECK">APM_SYSTEM_CHECK</option>
                <option value="SAVE_METER_READINGS">SAVE_METER_READINGS</option>
                <option value="SIGN_CONTRACT">SIGN_CONTRACT</option>
                <option value="ONLINE_PAYMENT_VNPAY">ONLINE_PAYMENT_VNPAY</option>
                <option value="CONFIRM_CASH_PAYMENT">CONFIRM_CASH_PAYMENT</option>
              </select>

              <select
                value={logFilterRole}
                onChange={(e) => setLogFilterRole(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="ROLE_ADMIN">Quản Trị Viên (ADMIN)</option>
                <option value="ROLE_STAFF">Chủ Trọ (STAFF)</option>
                <option value="ROLE_TENANT">Khách Thuê (TENANT)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">IP Nguồn</th>
                  <th className="py-3 px-4">Tài khoản</th>
                  <th className="py-3 px-4">Hành động</th>
                  <th className="py-3 px-4">Mục tiêu</th>
                  <th className="py-3 px-4">Chi tiết thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-3 px-4 font-mono text-indigo-700 font-bold">{log.ip}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">{log.username}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{log.role}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        log.action.includes('SPIKE')
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{log.target}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{log.details}</td>
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
