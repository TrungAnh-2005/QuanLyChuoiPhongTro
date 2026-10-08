import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bell,
  Search,
  User,
  LogOut,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Wrench,
  Calendar,
  X,
  CheckCheck,
  Building2,
  ExternalLink,
  Zap,
  Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Link } from 'react-router-dom';

/**
 * Trình sinh thông báo động, chính xác theo từng vai trò và từng tài khoản cụ thể.
 * Loại bỏ hoàn toàn tình trạng thông báo chung đụng, thông báo linh tinh không đúng tài khoản.
 */
function generateNotifications(user, data = {}, readSet = new Set()) {
  const {
    invoices = [],
    tickets = [],
    roomRequests = [],
    tenants = [],
    rooms = [],
    tenantRooms = {},
    systemNotices = [],
    roomPaymentNotices = [],
    roommateLeaveNotices = [],
    saasReminders = [],
    saasInvoices = [],
    landlords = []
  } = data;

  const role = user?.role || 'ADMIN';
  const username = user?.username || '';
  const fullName = user?.fullName || '';

  const list = [];

  const addNotif = (notif) => {
    const isRead = readSet.has(String(notif.id)) || Boolean(notif.defaultRead);
    list.push({
      ...notif,
      read: isRead
    });
  };

  if (role === 'ADMIN') {
    // =========================================================================
    // 👑 PLATFORM ADMIN (CTCP Trọ Việt SaaS): Quản trị hạ tầng, cước SaaS & đối tác
    // =========================================================================

    // 1. Hóa đơn cước SaaS chờ thu từ Chủ trọ
    const unpaidSaas = (saasInvoices || []).filter((inv) => inv.status === 'UNPAID');
    unpaidSaas.forEach((inv) => {
      addNotif({
        id: `admin-saas-due-${inv.id}`,
        type: 'URGENT',
        title: `Cước SaaS chờ thu: ${inv.code} (${inv.landlordName})`,
        desc: `Hóa đơn ${inv.packageName} (${Number(inv.amount || 0).toLocaleString('vi-VN')} đ) đến hạn ${inv.dueDate}. Hãy theo dõi đối soát.`,
        time: inv.dueDate ? `Hạn ${inv.dueDate}` : 'Đến hạn',
        defaultRead: false,
        link: '/admin/saas-invoices'
      });
    });

    // 2. Thu cước SaaS thành công (Đối soát doanh thu nền tảng)
    const paidSaas = (saasInvoices || []).filter((inv) => inv.status === 'PAID');
    paidSaas.slice(0, 2).forEach((inv) => {
      addNotif({
        id: `admin-saas-paid-${inv.id}`,
        type: 'INVOICE',
        title: `Thu cước SaaS thành công: ${inv.code}`,
        desc: `Chủ trọ ${inv.landlordName} đã thanh toán ${Number(inv.amount || 0).toLocaleString('vi-VN')} đ qua ${inv.paymentMethod || 'VietQR / VNPay'}.`,
        time: inv.paidAt || 'Gần đây',
        defaultRead: true,
        link: '/admin/saas-invoices'
      });
    });

    // 3. Thẩm định hồ sơ đối tác KYC Chủ trọ
    const pendingKyc = (landlords || []).filter((l) => l.kycStatus === 'PENDING' || l.status === 'PENDING');
    if (pendingKyc.length > 0) {
      pendingKyc.forEach((l) => {
        addNotif({
          id: `admin-kyc-${l.id}`,
          type: 'CONTRACT',
          title: `Thẩm định hồ sơ KYC: Chủ trọ ${l.fullName || l.name}`,
          desc: `Đối tác mới đăng ký kinh doanh trọ ${l.businessName || ''}. Cần Admin duyệt định danh CCCD và cấp quyền cơ sở.`,
          time: 'Hôm nay',
          defaultRead: false,
          link: '/admin/landlords'
        });
      });
    } else {
      addNotif({
        id: 'admin-kyc-status',
        type: 'CONTRACT',
        title: 'Hồ sơ KYC Chủ trọ nền tảng',
        desc: 'Tất cả đối tác Chủ trọ kinh doanh chuỗi đều đã được thẩm định hợp lệ 100%.',
        time: 'Hôm nay',
        defaultRead: true,
        link: '/admin/landlords'
      });
    }

    // 4. Giám sát hạ tầng Microservices APM
    addNotif({
      id: 'admin-apm-status',
      type: 'SYSTEM',
      title: 'Giám sát hạ tầng & Microservices (APM)',
      desc: '10/10 Microservices, Eureka Registry, RabbitMQ và MySQL Cluster đang vận hành ổn định 99.9%.',
      time: 'Vừa xong',
      defaultRead: true,
      link: '/admin/system'
    });
  } else if (role === 'STAFF') {
    // =========================================================================
    // 💼 STAFF: Phân quyền chính xác theo từng cơ sở (CS-01 hoặc CS-02)
    // =========================================================================
    const staffHouseCode = user?.houseCode || (user?.username === 'staff2' ? 'CS-02' : 'CS-01');
    const staffHouseName = user?.houseName || (staffHouseCode === 'CS-02' ? 'Cơ Sở 2 (Bách Khoa)' : 'Cơ Sở 1 (Cầu Giấy)');

    // 1. Danh sách sự cố cần cử thợ sửa chữa (Chỉ cho cơ sở của Staff này)
    const activeTickets = tickets.filter((t) => {
      if (t.status === 'RESOLVED') return false;
      const tHouse = t.houseCode || (rooms || []).find(rm => rm.number === t.room)?.houseCode || 'CS-01';
      return tHouse === staffHouseCode;
    });
    activeTickets.forEach((t) => {
      addNotif({
        id: `staff-ticket-${t.id}`,
        type: 'MAINTENANCE',
        title: `Nhiệm vụ sửa chữa (${staffHouseCode}): Phòng ${t.room}`,
        desc: `${t.tenant} báo: ${t.issue} (Mức độ: ${t.priority === 'HIGH' ? 'Khẩn cấp' : t.priority === 'MEDIUM' ? 'Trung bình' : 'Thường'}).`,
        time: t.date || 'Hôm nay',
        defaultRead: false,
        link: '/maintenance'
      });
    });

    // 2. Danh sách đơn chờ phê duyệt & kiểm kê tiếp nhận (Chỉ cho cơ sở của Staff này!)
    const pendingStaffRequests = roomRequests.filter((r) => {
      const isPending = r.status === 'PENDING' || r.status === 'WAITING_ROOMMATES' || r.status === 'ROOMMATES_APPROVED';
      if (!isPending) return false;
      const reqHouse = r.houseCode || (rooms || []).find(rm => rm.number === (r.targetRoom || r.currentRoom))?.houseCode || 'CS-01';
      return reqHouse === staffHouseCode;
    });

    pendingStaffRequests.forEach((req) => {
      let title = `Đơn cần xử lý (${staffHouseCode}): Phòng ${req.targetRoom || req.currentRoom}`;
      let desc = `Khách ${req.tenant} gửi yêu cầu ${req.type}.`;

      if (req.type === 'RENT' || req.type === 'NEW_RENT') {
        title = `Đơn đăng ký thuê phòng mới: Phòng ${req.targetRoom} (${staffHouseCode})`;
        desc = `Khách ${req.tenant} gửi đơn đăng ký thuê phòng ${req.targetRoom} tại ${staffHouseName}. Nhân viên trực cơ sở kiểm tra và duyệt hồ sơ.`;
      } else if (req.type === 'RENEW_CONTRACT') {
        title = `Đơn xin gia hạn hợp đồng (${staffHouseCode}): Phòng ${req.currentRoom || req.targetRoom}`;
        desc = `Khách ${req.tenant} xin gia hạn thêm ${req.durationMonths || req.extensionMonths || 6} tháng. Nhân viên đối soát và trình duyệt.`;
      } else if (req.type === 'CHECKOUT') {
        title = `Kiểm kê thiết bị (Trả phòng ${staffHouseCode}): Phòng ${req.currentRoom || req.targetRoom}`;
        desc = `Khách ${req.tenant} đăng ký trả phòng. Nhân viên trực cơ sở chuẩn bị kiểm kê bàn giao cơ sở vật chất.`;
      } else if (req.type === 'TRANSFER') {
        title = `Kiểm kê & đổi phòng (${staffHouseCode}): ${req.currentRoom} ➔ ${req.targetRoom}`;
        desc = `Khách ${req.tenant} nộp đơn chuyển phòng. Nhân viên kiểm tra hiện trạng 2 phòng tại cơ sở.`;
      } else if (req.type === 'ADDITIONAL_RENT') {
        title = `Đơn thuê thêm phòng (${staffHouseCode}): ${req.targetRoom}`;
        desc = `Khách ${req.tenant} (phòng ${req.currentRoom}) gửi đơn đăng ký thuê thêm phòng ${req.targetRoom}.`;
      } else if (req.type === 'ROOMMATE') {
        title = `Đơn xin ở ghép (${staffHouseCode}): Phòng ${req.targetRoom}`;
        desc = `Khách ${req.tenant} xin vào ở ghép phòng ${req.targetRoom} (Trạng thái: ${req.status}).`;
      }

      addNotif({
        id: `staff-req-${req.id}`,
        type: req.type === 'CHECKOUT' ? 'URGENT' : 'CONTRACT',
        title,
        desc,
        time: req.date || 'Hôm nay',
        defaultRead: false,
        link: '/rooms'
      });
    });

    // 3. Đối soát phiếu thu tiền phòng (Chỉ cho cơ sở của Staff này)
    const paidInvoices = invoices.filter((inv) => {
      if (inv.status !== 'PAID') return false;
      const invHouse = inv.houseCode || (rooms || []).find(rm => rm.number === inv.room)?.houseCode || 'CS-01';
      return invHouse === staffHouseCode;
    });
    if (paidInvoices.length > 0) {
      const latestPaid = paidInvoices[0];
      addNotif({
        id: `staff-paid-${latestPaid.id}`,
        type: 'INVOICE',
        title: `Xác nhận phiếu thu (${staffHouseCode}): Phòng ${latestPaid.room}`,
        desc: `Đã thu ${latestPaid.total.toLocaleString('vi-VN')} đ từ khách ${latestPaid.tenant} (${latestPaid.code}).`,
        time: latestPaid.paidAt || 'Hôm nay',
        defaultRead: true,
        link: '/invoices'
      });
    }

    // 4. Nhắc nợ cước SaaS từ Web Admin nền tảng
    const activeSaasReminders = (saasReminders || []).filter((r) => {
      const matchedInv = (saasInvoices || []).find((inv) => inv.code === r.invoiceCode || inv.id === r.invoiceId);
      return !matchedInv || matchedInv.status !== 'PAID';
    });
    activeSaasReminders.forEach((remind) => {
      addNotif({
        id: remind.id,
        type: 'URGENT',
        title: `⚠️ Web Admin Nhắc Nợ: Cước SaaS [${remind.invoiceCode}]`,
        desc: `Ban Quản Trị nền tảng đã gửi thông báo nhắc thanh toán ${remind.packageName || 'Gói Chuyên Nghiệp (PRO - Không Giới Hạn Cơ Sở)'} (${Number(remind.amount || 4990000).toLocaleString('vi-VN')} đ). Hạn chót: ${remind.dueDate || '15/10/2026'}. Vui lòng nộp cước để duy trì hoạt động phần mềm.`,
        time: remind.time || 'Vừa xong',
        defaultRead: false,
        link: '/invoices/saas'
      });
    });

    // 5. Khai báo tạm trú & hồ sơ
    addNotif({
      id: `staff-records-check-${staffHouseCode}`,
      type: 'CONTRACT',
      title: `Hồ sơ tạm trú cư dân - ${staffHouseCode}`,
      desc: `Đã hoàn tất đối chiếu CCCD 12 số cho các hợp đồng mới tại ${staffHouseName}.`,
      time: '3 giờ trước',
      defaultRead: true,
      link: '/tenants'
    });
  } else {
    // =========================================================================
    // 🏠 TENANT: Thông báo riêng biệt, đúng phòng, đúng hóa đơn, đúng việc từng khách
    // =========================================================================
    const currentTenant = tenants.find((t) => {
      const uName = (fullName || '').toLowerCase();
      const tName = (t.fullName || '').toLowerCase();
      return uName.includes(tName) || tName.includes(uName.split(' ')[0]);
    });

    const userRooms = currentTenant?.rooms && currentTenant.rooms.length > 0
      ? currentTenant.rooms
      : (currentTenant?.room
          ? [currentTenant.room]
          : (user?.room ? [user.room] : (tenantRooms?.[username] ? [tenantRooms[username]] : [])));

    // 0. Thông báo biến động đơn giá điện nước toàn chuỗi gửi tới TẤT CẢ các tài khoản khách thuê
    // CHỈ hiển thị khi có thông báo thay đổi giá thực tế, bỏ qua thông báo tĩnh mặc định
    systemNotices
      .filter((sn) => sn.id !== 'sys-notice-init')
      .forEach((sn) => {
        addNotif({
          id: sn.id,
          type: 'PRICE_CHANGE',
          title: sn.title,
          desc: sn.desc,
          time: sn.time || sn.date || 'Hôm nay',
          defaultRead: false,
          link: '/invoices'
        });
      });

    // 0.1. Thông báo khi một thành viên thanh toán tiền phòng thì các bạn cùng phòng đều được thông báo rõ ràng
    roomPaymentNotices.forEach((rpn) => {
      if (userRooms.includes(rpn.room)) {
        const isMe = (fullName || '').toLowerCase().trim() === (rpn.payer || '').toLowerCase().trim();
        addNotif({
          id: rpn.id,
          type: 'INVOICE',
          title: isMe
            ? `✅ Bạn đã thanh toán tiền phòng ${rpn.room} thành công!`
            : `🎉 Tiền phòng ${rpn.room} đã được "${rpn.payer}" thanh toán!`,
          desc: isMe
            ? `Bạn đã hoàn tất thanh toán hóa đơn ${rpn.room} (${(rpn.amount || 0).toLocaleString('vi-VN')} đ). Hóa đơn phòng đã được tất toán.`
            : `Bạn cùng phòng "${rpn.payer}" vừa hoàn tất thanh toán toàn bộ tiền phòng & điện nước ${rpn.room}. Tất cả thành viên trong phòng đều đã hết nợ cước kỳ này!`,
          time: rpn.time || 'Vừa xong',
          defaultRead: false,
          link: '/invoices'
        });
      }
    });

    // 0.2. Thông báo khi bạn cùng phòng rời khỏi phòng (2 người ở cùng 1 phòng, 1 người rời người kia được thông báo)
    roommateLeaveNotices.forEach((rln) => {
      if (userRooms.includes(rln.room)) {
        const isLeaver = (fullName || '').toLowerCase().trim() === (rln.leaver || '').toLowerCase().trim();
        if (!isLeaver) {
          addNotif({
            id: rln.id,
            type: 'URGENT',
            title: `🚪 Bạn cùng phòng đã rời phòng ${rln.room}!`,
            desc: `Thành viên "${rln.leaver}" đã rời khỏi phòng ${rln.room}. Phòng hiện tại đã giảm bớt thành viên. Hãy kiểm tra lại thông tin phòng & hợp đồng.`,
            time: rln.time || 'Vừa xong',
            defaultRead: false,
            link: '/rooms'
          });
        }
      }
    });

    // Bổ sung thông báo từ roomRequests loại CHECKOUT/LEAVE_ROOM đã được duyệt
    roomRequests.forEach((req) => {
      if ((req.type === 'LEAVE_ROOM' || req.type === 'CHECKOUT') && req.status === 'APPROVED') {
        const roomNum = req.targetRoom || req.currentRoom;
        if (userRooms.includes(roomNum)) {
          const isLeaver = (fullName || '').toLowerCase().trim() === (req.tenant || '').toLowerCase().trim();
          if (!isLeaver) {
            addNotif({
              id: `roommate-left-req-${req.id}`,
              type: 'URGENT',
              title: `🚪 Thành viên "${req.tenant}" đã trả/rời phòng ${roomNum}!`,
              desc: `Ban quản lý đã phê duyệt đơn trả/rời phòng của "${req.tenant}". Bạn hiện là thành viên còn lại của phòng ${roomNum}.`,
              time: req.date || 'Hôm nay',
              defaultRead: false,
              link: '/rooms'
            });
          }
        }
      }
    });

    // 1. Kiểm tra đơn biểu quyết ở ghép (CỰC KỲ QUAN TRỌNG CHO KHÁCH 2 - PHẠM MINH CƯỜNG P.103)
    roomRequests.forEach((req) => {
      if (req.type === 'ROOMMATE') {
        const isTargetMyRoom = userRooms.includes(req.targetRoom);
        if (isTargetMyRoom && req.status === 'WAITING_ROOMMATES') {
          addNotif({
            id: `tenant-roommate-vote-${req.id}`,
            type: 'URGENT',
            title: `🤝 Cần Biểu Quyết: Có người xin ở ghép ${req.targetRoom}!`,
            desc: `Bạn ${req.tenant} (SĐT: ${req.phone}) vừa gửi đơn xin vào ở ghép: "${req.note}". Hãy vào trang Phòng Trọ để biểu quyết.`,
            time: req.date || 'Hôm nay',
            defaultRead: false,
            link: '/rooms'
          });
        } else if (isTargetMyRoom && req.status === 'ROOMMATES_APPROVED') {
          addNotif({
            id: `tenant-roommate-voted-${req.id}`,
            type: 'CONTRACT',
            title: `Đã gửi biểu quyết đồng ý cho ở ghép ${req.targetRoom}`,
            desc: `Bạn đã đồng ý cho ${req.tenant} vào ở cùng. Ban Quản Lý đang làm thủ tục hợp đồng.`,
            time: req.date || 'Hôm nay',
            defaultRead: true,
            link: '/rooms'
          });
        }
      } else if (req.type === 'CHECKOUT') {
        const isTargetMyRoom = userRooms.includes(req.targetRoom);
        const isOtherTenant = req.tenant.toLowerCase() !== (fullName || '').toLowerCase();
        if (isTargetMyRoom && req.status === 'WAITING_ROOMMATES' && isOtherTenant) {
          addNotif({
            id: `tenant-checkout-vote-${req.id}`,
            type: 'URGENT',
            title: `⚠️ Biểu Quyết: Bạn cùng phòng xin trả phòng ${req.targetRoom}!`,
            desc: `Bạn ${req.tenant} đã yêu cầu trả phòng trước hạn. Tất cả thành viên trong phòng cùng đồng ý thì mới chuyển BQL. Hãy vào Phòng Trọ biểu quyết.`,
            time: req.date || 'Hôm nay',
            defaultRead: false,
            link: '/rooms'
          });
        }
      }

      // Kiểm tra đơn do chính khách thuê này gửi đi (ví dụ: Khách mới nộp đơn, Khách 1 xin đổi phòng/trả phòng)
      const isMyRequest =
        req.tenant.toLowerCase().includes((fullName || '').toLowerCase()) ||
        (user?.phone && req.phone === user.phone);

      if (isMyRequest) {
        if (req.type === 'ROOMMATE') {
          if (req.status === 'WAITING_ROOMMATES') {
            addNotif({
              id: `my-roommate-req-${req.id}`,
              type: 'CONTRACT',
              title: `Đơn xin ở ghép phòng ${req.targetRoom}`,
              desc: `Đơn của bạn đang chờ thành viên phòng ${req.targetRoom} biểu quyết đồng ý trước khi chuyển BQL.`,
              time: req.date || 'Hôm nay',
              defaultRead: false,
              link: '/rooms'
            });
          } else if (req.status === 'ROOMMATES_APPROVED') {
            addNotif({
              id: `my-roommate-req-${req.id}`,
              type: 'CONTRACT',
              title: `🎉 Phòng ${req.targetRoom} đã đồng ý cho bạn ở cùng!`,
              desc: `Thành viên phòng đã đồng ý! Đơn đang chờ Ban Quản Lý phê duyệt hợp đồng chính thức.`,
              time: req.date || 'Vừa xong',
              defaultRead: false,
              link: '/rooms'
            });
          } else if (req.status === 'APPROVED') {
            addNotif({
              id: `my-roommate-req-${req.id}`,
              type: 'SYSTEM',
              title: `✅ Chúc mừng bạn đã được nhận vào phòng ${req.targetRoom}!`,
              desc: `Hợp đồng đã được BQL duyệt. Hãy liên hệ quản lý để nhận bàn giao chìa khóa.`,
              time: 'Vừa xong',
              defaultRead: false,
              link: '/rooms'
            });
          }
        } else if (req.type === 'TRANSFER') {
          addNotif({
            id: `my-transfer-req-${req.id}`,
            type: 'CONTRACT',
            title: `Đơn xin chuyển sang phòng ${req.targetRoom}`,
            desc: `Nguyện vọng chuyển phòng (${req.status === 'PENDING' ? 'Đang chờ BQL xét duyệt' : req.status === 'APPROVED' ? 'Đã được duyệt' : 'Đã từ chối'}).`,
            time: req.date || 'Hôm nay',
            defaultRead: false,
            link: '/rooms'
          });
        } else if (req.type === 'CHECKOUT') {
          addNotif({
            id: `my-checkout-req-${req.id}`,
            type: 'URGENT',
            title: `Yêu cầu trả phòng ${req.targetRoom} (Mất cọc)`,
            desc: `Đã ghi nhận yêu cầu trả phòng trước hạn của bạn. Quản lý sẽ liên hệ kiểm kê bàn giao trong 24h.`,
            time: req.date || 'Hôm nay',
            defaultRead: false,
            link: '/rooms'
          });
        } else if (req.type === 'RENEW_CONTRACT') {
          addNotif({
            id: `my-renew-req-${req.id}`,
            type: 'CONTRACT',
            title: `Đơn xin gia hạn hợp đồng phòng ${req.currentRoom || req.targetRoom}`,
            desc: `Đơn gia hạn hợp đồng thêm ${req.extensionMonths || 6} tháng (${req.status === 'PENDING' ? 'Đang chờ BQL phê duyệt' : req.status === 'APPROVED' ? 'Đã được BQL phê duyệt' : 'Đã từ chối'}).`,
            time: req.date || 'Hôm nay',
            defaultRead: req.status !== 'APPROVED',
            link: '/rooms'
          });
        }
      }
    });

    // 2. Hóa đơn CHỈ của các phòng mà khách này đang thuê
    userRooms.forEach((rm) => {
      const roomInvoices = invoices.filter((inv) => inv.room === rm);
      roomInvoices.forEach((inv) => {
        if (inv.status === 'UNPAID' || inv.status === 'OVERDUE') {
          addNotif({
            id: `tenant-inv-${inv.id}`,
            type: 'URGENT',
            title: `Hóa đơn Tháng 09/2026 - Phòng ${inv.room}`,
            desc: `Số tiền: ${inv.total.toLocaleString('vi-VN')} đ (${inv.status === 'OVERDUE' ? 'Đã quá hạn' : 'Chưa thanh toán'}). Hạn nộp: 10/10/2026.`,
            time: 'Hôm nay',
            defaultRead: false,
            link: '/invoices'
          });
        } else if (inv.status === 'PAID') {
          addNotif({
            id: `tenant-inv-${inv.id}`,
            type: 'INVOICE',
            title: `Hóa đơn phòng ${inv.room} đã thanh toán`,
            desc: `Đã thanh toán thành công ${inv.total.toLocaleString('vi-VN')} đ (Tiền phòng + Điện nước).`,
            time: inv.paidAt || 'Tháng này',
            defaultRead: true,
            link: '/invoices'
          });
        }
      });
    });

    // 3. Tiến độ sự cố sửa chữa CHỈ của các phòng mà khách này đang thuê
    userRooms.forEach((rm) => {
      const roomTickets = tickets.filter((t) => t.room === rm);
      roomTickets.forEach((t) => {
        addNotif({
          id: `tenant-ticket-${t.id}`,
          type: 'MAINTENANCE',
          title: `Tiến độ sửa chữa: Phòng ${t.room}`,
          desc: `${t.issue}. Trạng thái: ${t.status === 'PENDING' ? 'BQL đã tiếp nhận' : t.status === 'IN_PROGRESS' ? 'Thợ đang sửa chữa' : 'Đã sửa chữa xong'}.`,
          time: t.date || 'Gần đây',
          defaultRead: t.status === 'RESOLVED',
          link: '/maintenance'
        });
      });
    });

    // 4. Hợp đồng & Thông báo an ninh tòa nhà
    if (userRooms.length > 0) {
      addNotif({
        id: `tenant-contract-${userRooms[0]}`,
        type: 'CONTRACT',
        title: `Hợp đồng thuê phòng ${userRooms.join(', ')}`,
        desc: `Hợp đồng thuê phòng có hiệu lực đến ${currentTenant?.contractEnd || '31/12/2026'}. Tiền đặt cọc bảo chứng: ${(currentTenant?.deposit || 3500000).toLocaleString('vi-VN')} đ.`,
        time: 'Định kỳ',
        defaultRead: true,
        link: '/rooms'
      });

      addNotif({
        id: 'tenant-notice-building',
        type: 'NOTICE',
        title: 'Bảo trì thang máy & Vệ sinh chung',
        desc: 'Ban quản lý tiến hành bảo trì thang máy và tổng vệ sinh hành lang định kỳ vào cuối tuần này.',
        time: 'Hôm qua',
        defaultRead: true,
        link: '/rooms'
      });
    } else {
      // Khách mới chưa có phòng
      addNotif({
        id: 'new-tenant-rooms-avail',
        type: 'NOTICE',
        title: 'Phòng trống đang mở nhận khách mới',
        desc: 'Hiện có các phòng trống tiện nghi đầy đủ điều hòa, nóng lạnh, wifi sẵn sàng dọn vào ngay tại Cơ sở 1, 2 và 3.',
        time: 'Hôm nay',
        defaultRead: false,
        link: '/rooms'
      });

      addNotif({
        id: 'new-tenant-help',
        type: 'SYSTEM',
        title: 'Hướng dẫn hẹn lịch xem phòng',
        desc: 'Bạn hãy bấm vào phòng còn trống để đăng ký hoặc liên hệ Quản lý cơ sở (0912.888.666) để được hỗ trợ xem phòng.',
        time: '1 ngày trước',
        defaultRead: true,
        link: '/rooms'
      });
    }
  }

  return list;
}

export default function Navbar({ onOpenMobileMenu = () => {} }) {
  const { user, logout, switchRole, tenantRooms } = useAuth();
  const dataContext = useData() || {};
  const role = user?.role || 'ADMIN';

  const formatRooms = (val, defaultVal = '') => {
    if (!val) return defaultVal;
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : defaultVal;
    return String(val);
  };

  const tenant1Room = formatRooms(tenantRooms?.tenant1 ?? tenantRooms?.['Nguyễn Văn An'] ?? (user?.username === 'tenant1' ? user.rooms : ['P.101']), '');
  const tenant2Room = formatRooms(tenantRooms?.tenant2 ?? tenantRooms?.['Phạm Minh Cường'] ?? (user?.username === 'tenant2' ? user.rooms : ['P.103']), '');
  const tenantNewRoom = formatRooms(tenantRooms?.tenant_new ?? tenantRooms?.['Hoàng Văn Nam'] ?? (user?.username === 'tenant_new' ? user.rooms : []), '');

  const accountKey = user?.username || user?.role || 'ADMIN';

  // Lưu trạng thái đã đọc riêng biệt theo từng tài khoản
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`rental_read_notifs_${accountKey}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Khi chuyển đổi tài khoản, nạp lại trạng thái đã đọc của tài khoản đó
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`rental_read_notifs_${accountKey}`);
      setReadNotifIds(saved ? JSON.parse(saved) : []);
    } catch {
      setReadNotifIds([]);
    }
  }, [accountKey]);

  // Sinh danh sách thông báo chính xác cho tài khoản hiện hành
  const notifications = useMemo(() => {
    return generateNotifications(
      user,
      {
        invoices: dataContext.invoices || [],
        tickets: dataContext.tickets || [],
        roomRequests: dataContext.roomRequests || [],
        tenants: dataContext.tenants || [],
        rooms: dataContext.rooms || [],
        systemNotices: dataContext.systemNotices || [],
        roomPaymentNotices: dataContext.roomPaymentNotices || [],
        roommateLeaveNotices: dataContext.roommateLeaveNotices || [],
        tenantRooms,
        saasReminders: dataContext.saasReminders || [],
        saasInvoices: dataContext.saasInvoices || [],
        landlords: dataContext.landlords || []
      },
      new Set(readNotifIds)
    );
  }, [user, dataContext, tenantRooms, readNotifIds]);

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Click outside to close notification dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => String(n.id));
    const merged = Array.from(new Set([...readNotifIds, ...allIds]));
    setReadNotifIds(merged);
    try {
      localStorage.setItem(`rental_read_notifs_${accountKey}`, JSON.stringify(merged));
    } catch (e) {
      console.error(e);
    }
  };

  const markSingleAsRead = (id) => {
    const strId = String(id);
    if (!readNotifIds.includes(strId)) {
      const updated = [...readNotifIds, strId];
      setReadNotifIds(updated);
      try {
        localStorage.setItem(`rental_read_notifs_${accountKey}`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const currentTenant = (dataContext.tenants || []).find((t) => {
    const uName = (user?.fullName || '').toLowerCase();
    const tName = (t.fullName || '').toLowerCase();
    return uName.includes(tName) || tName.includes(uName.split(' ')[0]);
  });

  const userRooms = role === 'TENANT'
    ? (currentTenant?.rooms && currentTenant.rooms.length > 0
        ? currentTenant.rooms
        : (currentTenant?.room
            ? [currentTenant.room]
            : (user?.room ? [user.room] : (tenantRooms?.[user?.username] ? [tenantRooms[user?.username]] : []))))
    : [];

  const notifHeaderTitle = role === 'ADMIN'
    ? 'Thông Báo Quản Trị (Admin)'
    : role === 'STAFF'
    ? 'Nhiệm Vụ Vận Hành (Staff)'
    : `Thông Báo: ${user?.fullName || 'Khách thuê'}`;

  const notifHeaderSubtitle = role === 'ADMIN'
    ? 'Duyệt đơn, hóa đơn quá hạn & chỉ số'
    : role === 'STAFF'
    ? 'Sửa chữa thiết bị, kiểm kê & phiếu thu'
    : userRooms.length > 0
    ? `Dành riêng cho phòng: ${userRooms.join(', ')}`
    : 'Dành riêng cho khách tìm phòng mới';

  return (
    <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors">
      {/* Trái: Nút Menu di động + Logo Trọ Việt + Thanh tìm kiếm Desktop */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-md min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-purple-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          title="Mở menu điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo rút gọn trên mobile */}
        <div className="lg:hidden flex items-center gap-1.5 font-black text-slate-900 text-xs sm:text-sm tracking-tight shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-xs shadow-purple-600/30">
            TV
          </div>
          <span className="hidden xs:inline">TRỌ VIỆT</span>
        </div>

        {/* Ô tìm kiếm: Ẩn hoàn toàn khi ở quyền Admin (vì Admin không quản lý phòng lẻ và khách thuê) */}
        {role === 'ADMIN' ? (
          <div className="hidden md:flex items-center gap-2.5 text-xs font-bold text-slate-600 bg-slate-100/80 px-3.5 py-2 rounded-xl border border-slate-200/70">
            <span className="pulse-dot-green shrink-0" />
            <span className="text-slate-800 font-extrabold tracking-tight">Cổng Quản Trị Nền Tảng SaaS</span>
            <span className="text-slate-400 text-[11px] font-normal">• Giám Sát Đối Tác Toàn Sàn</span>
          </div>
        ) : (
          <div className="hidden md:flex relative w-full group max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-purple-600" />
            <input
              type="text"
              placeholder={role === 'STAFF' ? "Tìm kiếm phòng, khách thuê chi nhánh..." : "Tìm kiếm phòng trống, hóa đơn..."}
              className="w-full bg-slate-100/70 hover:bg-slate-100 border border-slate-200/80 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-200 ease-out"
            />
          </div>
        )}
      </div>

      {/* Phải: Chuyển đổi vai trò + Thông báo + Thông tin tài khoản */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Quick Role & Multi-Tenant Switcher - Bản đầy đủ trên Desktop lớn */}
        <div className="hidden xl:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/90 text-xs shadow-inner gap-1">
          <button
            onClick={() => switchRole('ADMIN')}
            title="Quản trị viên hệ thống (Admin)"
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all duration-200 btn-press ${
              role === 'ADMIN'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 scale-[1.02]'
                : 'text-slate-600 hover:text-purple-700 hover:bg-white/60'
            }`}
          >
            👑 Admin
          </button>
          <button
            onClick={() => switchRole('STAFF_1')}
            title="Staff 1: Lê Thị Thu Ngân (Chỉ quản lý Cơ Sở 1 - Cầu Giấy)"
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all duration-200 btn-press ${
              role === 'STAFF' && (user?.username === 'staff' || user?.houseCode === 'CS-01')
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]'
                : 'text-slate-600 hover:text-indigo-700 hover:bg-white/60'
            }`}
          >
            👔 Staff 1 (CS1)
          </button>
          <button
            onClick={() => switchRole('STAFF_2')}
            title="Staff 2: Đàm Văn Táo (Chỉ quản lý Cơ Sở 2 - Bách Khoa)"
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all duration-200 btn-press ${
              role === 'STAFF' && (user?.username === 'staff2' || user?.houseCode === 'CS-02')
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 scale-[1.02]'
                : 'text-slate-600 hover:text-purple-700 hover:bg-white/60'
            }`}
          >
            👔 Staff 2 (CS2)
          </button>

          <span className="h-4 w-px bg-slate-300 mx-0.5" />

          <button
            onClick={() => switchRole('TENANT_1')}
            title={`Khách thuê 1: Nguyễn Văn An ${tenant1Room ? 'đang ở ' + tenant1Room : '(Chưa thuê)'}`}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all duration-200 btn-press flex items-center gap-1 ${
              role === 'TENANT' && (user?.username === 'tenant' || user?.username === 'tenant1')
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-white/60'
            }`}
          >
            <span>👤</span> Khách 1 <span className="text-[10px] opacity-80">({tenant1Room || 'Chưa thuê'})</span>
          </button>

          <button
            onClick={() => switchRole('TENANT_2')}
            title={`Khách thuê 2: Phạm Minh Cường ${tenant2Room ? 'đang ở ' + tenant2Room : '(Chưa thuê)'}`}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all duration-200 btn-press flex items-center gap-1 ${
              role === 'TENANT' && user?.username === 'tenant2'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 scale-[1.02]'
                : 'text-slate-600 hover:text-teal-700 hover:bg-white/60'
            }`}
          >
            <span>👤</span> Khách 2 <span className="text-[10px] opacity-80">({tenant2Room || 'Chưa thuê'})</span>
          </button>

          <button
            onClick={() => switchRole('TENANT_NEW')}
            title={`Khách mới: Hoàng Văn Nam ${tenantNewRoom ? 'đang ở ' + tenantNewRoom : '(Chưa có phòng)'}`}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all duration-200 btn-press flex items-center gap-1 ${
              role === 'TENANT' && user?.username === 'tenant_new'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 scale-[1.02]'
                : 'text-slate-600 hover:text-amber-700 hover:bg-white/60'
            }`}
          >
            <span>🔍</span> Khách Mới <span className="text-[10px] opacity-80 font-normal">({tenantNewRoom || 'Chưa thuê'})</span>
          </button>
        </div>

        {/* Nút Khôi Phục Gốc - Làm sạch dữ liệu demo */}
        <button
          onClick={() => {
            if (window.confirm('Bạn có chắc muốn khôi phục toàn bộ dữ liệu về trạng thái mẫu ban đầu? (Tất cả dữ liệu thử nghiệm trong bộ nhớ tạm sẽ được làm sạch)')) {
              const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith('rental_'));
              keysToRemove.forEach(k => localStorage.removeItem(k));
              sessionStorage.clear();
              window.location.reload();
            }
          }}
          title="Dọn sạch cache và khôi phục dữ liệu ban đầu"
          className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-xl text-xs font-bold transition border border-dashed border-slate-300 hover:border-purple-300 cursor-pointer btn-press"
        >
          <span>🔄 Khôi Phục Gốc</span>
        </button>

        {/* Chuyển đổi vai trò rút gọn trên Di động & Tablet (Dạng Select tiện lợi) */}
        <div className="xl:hidden flex items-center bg-slate-100/90 px-2 py-1 rounded-xl border border-slate-200/90 text-xs font-bold shadow-2xs">
          <select
            value={
              role === 'STAFF'
                ? (user?.username === 'staff2' || user?.houseCode === 'CS-02' ? 'STAFF_2' : 'STAFF_1')
                : (role === 'TENANT' ? (user?.username === 'tenant2' ? 'TENANT_2' : (user?.username === 'tenant_new' ? 'TENANT_NEW' : 'TENANT_1')) : role)
            }
            onChange={(e) => switchRole(e.target.value)}
            className="bg-transparent font-bold text-slate-800 text-[11px] outline-none cursor-pointer pr-1"
          >
            <option value="ADMIN">👑 Admin</option>
            <option value="STAFF_1">👔 Staff 1 (Cơ Sở 1)</option>
            <option value="STAFF_2">👔 Staff 2 (Cơ Sở 2)</option>
            <option value="TENANT_1">👤 Khách 1 (An)</option>
            <option value="TENANT_2">👤 Khách 2 (Cường)</option>
            <option value="TENANT_NEW">🔍 Khách Mới</option>
          </select>
        </div>

        {/* Notification bell & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            title="Xem thông báo hệ thống"
            className="bell-hover relative p-2 sm:p-2.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all duration-150 btn-press"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 bell-icon" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 px-1.5 py-0.2 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[9px] sm:text-[10px] font-black rounded-full shadow-xs live-indicator">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="fixed sm:absolute inset-x-2 sm:inset-x-auto right-auto sm:right-0 top-16 sm:top-auto sm:mt-2.5 w-auto sm:w-96 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl z-50 overflow-hidden dropdown-spring max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900">{notifHeaderTitle}</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black">
                          {unreadCount} mới
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">{notifHeaderSubtitle}</div>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-800 transition-colors btn-press-ghost"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Đọc tất cả</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    Không có thông báo mới nào
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <Link
                      key={notif.id}
                      to={notif.link}
                      onClick={() => {
                        markSingleAsRead(notif.id);
                        setShowDropdown(false);
                      }}
                      className={`p-3 sm:p-3.5 flex items-start gap-2.5 sm:gap-3 transition-colors hover:bg-slate-50 block ${
                        !notif.read ? 'bg-purple-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.type === 'URGENT' && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                        {notif.type === 'MAINTENANCE' && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                        {notif.type === 'INVOICE' && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                        {notif.type === 'CONTRACT' && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                        {notif.type === 'PRICE_CHANGE' && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                        {(notif.type === 'SYSTEM' || notif.type === 'NOTICE') && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {notif.title}
                          </h4>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                          {notif.desc}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">
                          {notif.time}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-50 text-center border-t border-slate-100 shrink-0">
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User profile */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-purple-500/20 text-xs sm:text-sm shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-bold text-slate-800 leading-tight flex items-center gap-1.5">
              <span className="truncate max-w-[120px]">{user?.fullName || 'Người dùng'}</span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold bg-purple-100 text-purple-700 border border-purple-200">
                {role}
              </span>
            </div>
            <div className="text-xs text-slate-500 truncate max-w-[140px]">{user?.email || 'user@rental.vn'}</div>
          </div>
          <button
            onClick={logout}
            title="Đăng xuất"
            className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
