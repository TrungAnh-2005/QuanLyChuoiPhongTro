import React, { useState, useEffect, useMemo, useRef } from 'react';
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

// Đúng chuẩn 10 Microservices nghiệp vụ cốt lõi theo kiến trúc dự án
const DEFAULT_10_SERVICES = [
  { id: 'auth-service', name: 'Auth Service (JWT, RBAC & KYC)', port: 8081, maxMem: 1024, defaultUsed: 380, defaultCpu: 1.7, defaultThreads: 30, defaultReq: 92 },
  { id: 'room-service', name: 'Room & Boarding House Service', port: 8082, maxMem: 1024, defaultUsed: 360, defaultCpu: 2.1, defaultThreads: 30, defaultReq: 45 },
  { id: 'tenant-service', name: 'Tenant Service (Roommates & VNeID)', port: 8083, maxMem: 1024, defaultUsed: 310, defaultCpu: 1.8, defaultThreads: 38, defaultReq: 38 },
  { id: 'contract-service', name: 'Contract Service (E-Signature)', port: 8084, maxMem: 1024, defaultUsed: 290, defaultCpu: 1.4, defaultThreads: 25, defaultReq: 22 },
  { id: 'meter-service', name: 'Meter Reading Service (Chỉ Số Điện Nước)', port: 8085, maxMem: 1024, defaultUsed: 320, defaultCpu: 2.0, defaultThreads: 32, defaultReq: 48 },
  { id: 'billing-service', name: 'Billing & Invoice Service', port: 8086, maxMem: 1024, defaultUsed: 350, defaultCpu: 2.3, defaultThreads: 32, defaultReq: 51 },
  { id: 'payment-service', name: 'Payment Service (SePay/VietQR/VNPay)', port: 8087, maxMem: 1024, defaultUsed: 330, defaultCpu: 2.0, defaultThreads: 35, defaultReq: 58 },
  { id: 'maintenance-service', name: 'Maintenance & Ticket Service', port: 8088, maxMem: 512, defaultUsed: 195, defaultCpu: 1.1, defaultThreads: 24, defaultReq: 18, isLight: true },
  { id: 'report-service', name: 'Report & BI Aggregation Service', port: 8089, maxMem: 1024, defaultUsed: 410, defaultCpu: 2.8, defaultThreads: 34, defaultReq: 31 },
  { id: 'ai-service', name: 'AI Computer Vision & OCR Service', port: 8000, maxMem: 2048, defaultUsed: 620, defaultCpu: 5.4, defaultThreads: 42, defaultReq: 64, isHeavy: true }
];

export default function AdminSystemPage() {
  const { auditLogs = [], addAuditLog } = useData();

  const [activeTab, setActiveTab] = useState('apm'); // 'apm' | 'audit'
  const [logFilterAction, setLogFilterAction] = useState('ALL');
  const [logFilterRole, setLogFilterRole] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 1. Điều khiển Đang Live / Tạm Dừng
  const [isPaused, setIsPaused] = useState(false);

  // 2. Thử tải đột biến (Spike Load Test) - 6.5s
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [stressCountdown, setStressCountdown] = useState(0);

  // 3. Timer cho luồng WebSocket/Actuator Stream (Bắt đầu từ 01:23:05 khớp media_1791397426014.png)
  const [streamSeconds, setStreamSeconds] = useState(4985); // 01:23:05 in seconds

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setStreamSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Format giây thành HH:mm:ss
  const streamTimeFormatted = useMemo(() => {
    const hrs = Math.floor(streamSeconds / 3600);
    const mins = Math.floor((streamSeconds % 3600) / 60);
    const secs = streamSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [streamSeconds]);

  // Bộ đếm countdown 6.5 giây khi thử tải đột biến
  useEffect(() => {
    if (!isStressTesting) return;
    if (stressCountdown <= 0) {
      setIsStressTesting(false);
      return;
    }
    const timer = setTimeout(() => {
      setStressCountdown((prev) => {
        const next = +(prev - 0.5).toFixed(1);
        if (next <= 0) {
          setIsStressTesting(false);
          return 0;
        }
        return next;
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [isStressTesting, stressCountdown]);

  // Kích hoạt Thử Tải Đột Biến (Simulate Spike Load)
  const toggleStressTest = () => {
    if (isStressTesting) {
      setIsStressTesting(false);
      setStressCountdown(0);
    } else {
      setIsStressTesting(true);
      setStressCountdown(6.5); // 6.5 giây mô phỏng thuyết trình
      if (addAuditLog) {
        addAuditLog({
          role: 'ROLE_ADMIN',
          username: 'admin',
          action: 'APM_SPIKE_SIMULATION',
          target: 'API Gateway & 10 Microservices',
          details: 'Kích hoạt thử tải đột biến APM Spike Load: bơm lưu lượng kiểm thử mô phỏng thuyết trình (4.500 msgs/s, 70ms)'
        });
      }
    }
  };

  // Trạng thái Garbage Collection Clean của từng service
  const [gcCleanMap, setGcCleanMap] = useState({});

  // Dữ liệu đo lường thời gian thực (Live Metrics)
  const [liveMetrics, setLiveMetrics] = useState(() => {
    const init = {};
    DEFAULT_10_SERVICES.forEach((svc) => {
      init[svc.id] = {
        cpu: `${svc.defaultCpu}%`,
        cpuNum: svc.defaultCpu,
        heap: `${svc.defaultUsed}MB / ${svc.maxMem}MB`,
        heapPercent: Math.round((svc.defaultUsed / svc.maxMem) * 100),
        memUsed: svc.defaultUsed,
        threads: svc.defaultThreads,
        reqPerSec: svc.defaultReq
      };
    });
    return init;
  });

  // Ticker cập nhật mỗi 2 giây (hoặc 1.2s khi đang thử tải)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setLiveMetrics((prev) => {
        const next = { ...prev };
        DEFAULT_10_SERVICES.forEach((svc) => {
          const current = prev[svc.id] || {
            cpuNum: svc.defaultCpu,
            memUsed: svc.defaultUsed,
            heapPercent: Math.round((svc.defaultUsed / svc.maxMem) * 100),
            threads: svc.defaultThreads,
            reqPerSec: svc.defaultReq
          };

          if (isStressTesting) {
            // Khi thử tải đột biến: CPU vọt lên 45% - 80% (thanh đo chuyển đỏ rực), req/s vọt lên cao
            const cpuNum = +(48 + Math.random() * 30).toFixed(1);
            const memUsed = Math.min(svc.maxMem - 20, Math.floor(svc.maxMem * (0.70 + Math.random() * 0.18)));
            const memPercent = Math.round((memUsed / svc.maxMem) * 100);
            const threads = Math.floor(svc.defaultThreads * 4.5 + Math.random() * 20);
            const reqPerSec = Math.floor(380 + Math.random() * 250);

            next[svc.id] = {
              cpu: `${cpuNum}%`,
              cpuNum,
              heap: `${memUsed}MB / ${svc.maxMem}MB`,
              heapPercent: memPercent,
              memUsed,
              threads,
              reqPerSec
            };
          } else {
            // Trạng thái bình thường:
            // 1. CPU dao động tự nhiên theo từng service:
            // - Service nhẹ (Eureka, Maintenance): 0.8% - 2.0%
            // - Service nặng (Meter Reading & AI OCR): 3.5% - 8.5%
            // - Service khác: 1.2% - 3.2%
            let cpuNum = svc.defaultCpu;
            if (svc.isLight) {
              cpuNum = +(0.8 + Math.random() * 1.2).toFixed(1);
            } else if (svc.isHeavy) {
              cpuNum = +(3.5 + Math.random() * 5.0).toFixed(1);
            } else {
              const jitter = +(Math.random() * 0.8 - 0.4).toFixed(1);
              cpuNum = Math.max(0.9, +(svc.defaultCpu + jitter).toFixed(1));
            }

            // 2. Mô phỏng JVM Heap Memory tăng dần & Minor GC khi đạt >= 78%
            let newMemUsed = current.memUsed + Math.floor(12 + Math.random() * 18);
            let currentHeapPercent = Math.round((newMemUsed / svc.maxMem) * 100);

            if (currentHeapPercent >= 78) {
              // Kích hoạt Minor GC! Thu hồi RAM về mức an toàn ~42% - 48%
              newMemUsed = Math.floor(svc.maxMem * (0.42 + Math.random() * 0.06));
              currentHeapPercent = Math.round((newMemUsed / svc.maxMem) * 100);

              // Bật cờ nhãn GC Clean nhấp nháy màu tím trong 2.5s
              setGcCleanMap((m) => ({ ...m, [svc.id]: true }));
              setTimeout(() => {
                setGcCleanMap((m) => ({ ...m, [svc.id]: false }));
              }, 2500);
            }

            next[svc.id] = {
              cpu: `${cpuNum}%`,
              cpuNum,
              heap: `${newMemUsed}MB / ${svc.maxMem}MB`,
              heapPercent: currentHeapPercent,
              memUsed: newMemUsed,
              threads: svc.defaultThreads,
              reqPerSec: Math.max(12, svc.defaultReq + Math.floor(Math.random() * 6 - 3))
            };
          }
        });
        return next;
      });
    }, isStressTesting ? 1200 : 2000);

    return () => clearInterval(interval);
  }, [isPaused, isStressTesting]);

  // Nút Làm Mới - ép cập nhật tức thì và ghi audit log
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLiveMetrics((prev) => {
        const next = { ...prev };
        DEFAULT_10_SERVICES.forEach((svc) => {
          let cpuNum = svc.defaultCpu;
          if (svc.isLight) cpuNum = +(0.9 + Math.random() * 1.0).toFixed(1);
          else if (svc.isHeavy) cpuNum = +(4.0 + Math.random() * 4.0).toFixed(1);
          else cpuNum = +(svc.defaultCpu + Math.random() * 0.6 - 0.3).toFixed(1);

          const memUsed = Math.floor(svc.maxMem * (0.45 + Math.random() * 0.15));
          next[svc.id] = {
            cpu: `${cpuNum}%`,
            cpuNum,
            heap: `${memUsed}MB / ${svc.maxMem}MB`,
            heapPercent: Math.round((memUsed / svc.maxMem) * 100),
            memUsed,
            threads: svc.defaultThreads,
            reqPerSec: svc.defaultReq
          };
        });
        return next;
      });

      if (addAuditLog) {
        addAuditLog({
          role: 'ROLE_ADMIN',
          username: 'admin',
          action: 'MANUAL_METRICS_REFRESH',
          target: 'Eureka Registry & Actuator',
          details: 'Ép đồng bộ và làm mới các chỉ số vi dịch vụ thủ công'
        });
      }
    }, 600);
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
  const clusterCpu = isStressTesting ? '68.5% TB Tải' : '2.4% TB Tải';
  const clusterRamText = isStressTesting
    ? 'RAM: 7.640 / 10.240 MB (74.6%)'
    : 'RAM: 3.565 / 10.240 MB (34.8%)';
  const rabbitMqText = isStressTesting ? '4.520 msgs/s' : '1.443 msgs/s';
  const rabbitMqSub = isStressTesting
    ? 'Dead Letter: 0 msg lỗi • 28 Backlog'
    : 'Dead Letter: 0 msg lỗi • 0 Backlog';
  const latencyText = isStressTesting ? '71.4 ms' : '15.7 ms';

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
              Giám Sát 10 Vi Dịch Vụ & Nhật Ký Kiểm Toán (Audit Logs)
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Luồng giám sát thời gian thực kết nối Spring Boot Actuator, kiểm soát tải CPU, Heap Memory JVM, hàng đợi RabbitMQ Broker và truy vết an ninh nền tảng.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0 flex-wrap">
            {/* 1. NÚT ĐIỀU KHIỂN: ĐANG LIVE / TẠM DỪNG */}
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              className={`flex items-center gap-2 px-3.5 py-2 border rounded-xl text-xs font-bold transition-all btn-press cursor-pointer ${
                isPaused
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md'
              }`}
              title="Nhấn để tạm dừng hoặc tiếp tục nhảy số thời gian thực"
            >
              <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              <span>{isPaused ? '⏸️ Tạm Dừng' : '🟢 Đang Live'}</span>
            </button>

            {/* 2. NÚT THỬ TẢI ĐỘT BIẾN - 6.5s CHO THUYẾT TRÌNH / DEMO */}
            <button
              type="button"
              onClick={toggleStressTest}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md btn-press cursor-pointer ${
                isStressTesting
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white border border-rose-300 animate-pulse ring-2 ring-rose-400'
                  : 'bg-amber-600/90 hover:bg-amber-600 text-white border border-amber-400/40'
              }`}
              title="Kích hoạt mô phỏng đợt bùng nổ tải thuyết trình: CPU 45%-80%, RabbitMQ 4.500 msgs/s, Gateway 70ms trong 6.5s"
            >
              <span>⚡</span>
              <span>{isStressTesting ? `🔥 Đang Thử Tải (${stressCountdown}s)` : 'Thử Tải Đột Biến'}</span>
            </button>

            {/* 3. LÀM MỚI - ÉP ĐỒNG BỘ CHỈ SỐ NGAY LẬP TỨC */}
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all btn-press cursor-pointer"
              title="Ép đồng bộ và làm mới các chỉ số vi dịch vụ thủ công"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Làm Mới</span>
            </button>

            {/* 4. Eureka Portal */}
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
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-rose-800 text-xs font-semibold animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
            <div>
              <strong className="font-extrabold text-rose-900">MÔ PHỎNG THỬ TẢI ĐỘT BIẾN (DEMO APM SPIKE LOAD):</strong> Đang bơm lưu lượng kiểm thử ~4.500 msgs/s qua API Gateway và RabbitMQ. Tự động phục hồi sau {stressCountdown}s.
            </div>
          </div>
          <button
            onClick={() => { setIsStressTesting(false); setStressCountdown(0); }}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px] hover:bg-rose-700 transition cursor-pointer shrink-0"
          >
            Dừng Ngay
          </button>
        </div>
      )}

      {/* Điều hướng 2 Tab: APM Microservices & Nhật Ký Kiểm Toán */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('apm')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all btn-press cursor-pointer ${
              activeTab === 'apm'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📊 APM 10 Microservices & Cụm Server
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all btn-press cursor-pointer flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🛡️ Nhật Ký Kiểm Toán An Ninh</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'audit' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {auditLogs.length}
            </span>
          </button>
        </div>

        {/* Đèn tín hiệu nhấp nháy Live: ● WebSocket/Actuator Stream: [HH:MM:SS] */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
          <span>WebSocket/Actuator Stream:</span>
          <span className="text-indigo-600 font-bold">{streamTimeFormatted}</span>
        </div>
      </div>

      {/* TAB 1: APM 12 MICROSERVICES */}
      {activeTab === 'apm' && (
        <div className="space-y-6">
          {/* 4 THẺ KPI CHÍNH */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Dịch vụ sẵn sàng */}
            <div className="bento-card p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>DỊCH VỤ SẴN SÀNG</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                10/10
              </div>
              <div className="text-xs text-slate-500 font-medium">
                100% UP • Eureka Heartbeat: 30s
              </div>
            </div>

            {/* KPI 2: RabbitMQ Event Bus */}
            <div className="bento-card p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>RABBITMQ EVENT BUS</span>
                <Radio className="w-4 h-4 text-purple-600" />
              </div>
              <div className={`text-3xl font-black tracking-tight font-mono ${
                isStressTesting ? 'text-rose-600' : 'text-slate-900'
              }`}>
                {rabbitMqText}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {rabbitMqSub}
              </div>
            </div>

            {/* KPI 3: Độ trễ API Gateway */}
            <div className="bento-card p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>ĐỘ TRỄ API GATEWAY</span>
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <div className={`text-3xl font-black tracking-tight font-mono ${
                isStressTesting ? 'text-rose-600' : 'text-slate-900'
              }`}>
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

          {/* LƯỚI 10 VI DỊCH VỤ NGHIỆP VỤ - 3 CỘT KHỚP 100% KIẾN TRÚC */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEFAULT_10_SERVICES.map((svc) => {
              const liveCpu = liveMetrics[svc.id]?.cpu || `${svc.defaultCpu}%`;
              const liveCpuNum = liveMetrics[svc.id]?.cpuNum ?? svc.defaultCpu;
              const liveHeap = liveMetrics[svc.id]?.heap || `${svc.defaultUsed}MB / ${svc.maxMem}MB`;
              const heapPercent = liveMetrics[svc.id]?.heapPercent ?? Math.round((svc.defaultUsed / svc.maxMem) * 100);
              const threads = liveMetrics[svc.id]?.threads || svc.defaultThreads;
              const reqPerSec = liveMetrics[svc.id]?.reqPerSec || svc.defaultReq;
              const isGcCleaning = Boolean(gcCleanMap[svc.id]);

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
                    {/* Heap Memory & Nhãn GC Clean */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">Heap Memory (JVM):</span>
                          {/* Nhãn GC Clean nhấp nháy màu tím khi Minor GC thu hồi bộ nhớ */}
                          {isGcCleaning && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-100 text-purple-700 border border-purple-300 animate-pulse">
                              GC Clean
                            </span>
                          )}
                        </div>
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

                    {/* CPU Usage - Progress Bar đổi màu thông minh: Xanh (<10%) -> Vàng (10%-25%) -> Đỏ (>25%) */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">CPU Usage:</span>
                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          liveCpuNum > 25
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : liveCpuNum >= 10
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                        }`}>
                          {liveCpu}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            liveCpuNum > 25
                              ? 'bg-rose-500'
                              : liveCpuNum >= 10
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
                <option value="APM_SPIKE_SIMULATION">APM_SPIKE_SIMULATION</option>
                <option value="MANUAL_METRICS_REFRESH">MANUAL_METRICS_REFRESH</option>
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
                          : log.action.includes('REFRESH')
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
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
