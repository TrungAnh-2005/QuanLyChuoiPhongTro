USE `room_db`;

CREATE TABLE IF NOT EXISTS `house_service_configs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `boarding_house_id` BIGINT NOT NULL COMMENT 'FK tới boarding_houses.id',
    `service_name` VARCHAR(100) NOT NULL COMMENT 'Tên dịch vụ: Tiền điện, Tiền nước, Rác, WiFi...',
    `calculation_type` VARCHAR(30) NOT NULL COMMENT 'Hình thức tính: METER (công tơ), PER_ROOM (phòng), PER_CAPITA (người)',
    `unit_price` DECIMAL(15,2) NOT NULL COMMENT 'Đơn giá dịch vụ VND',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Đang áp dụng hay tạm ngừng',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_hsc_house` (`boarding_house_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `buildings` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã tòa nhà',
    `boarding_house_id` BIGINT NOT NULL COMMENT 'Thuộc cơ sở trọ nào',
    `name` VARCHAR(100) NOT NULL COMMENT 'Tên tòa: Tòa A Cầu Giấy, Tòa B Bách Khoa...',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_building_house` (`boarding_house_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `floors` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã tầng',
    `building_id` BIGINT NOT NULL COMMENT 'Thuộc tòa nhà nào',
    `floor_number` INT NOT NULL COMMENT 'Thứ tự tầng: 1, 2, 3, 4...',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_floor_building` (`building_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE `tenant_db`;

CREATE TABLE IF NOT EXISTS `room_members` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã định danh cư trú phòng',
    `room_id` BIGINT NOT NULL COMMENT 'Mã phòng đang ở (Logical FK -> room_db.rooms.id)',
    `tenant_id` BIGINT NOT NULL COMMENT 'Liên kết hồ sơ khách thuê',
    `contract_id` BIGINT NOT NULL COMMENT 'Hợp đồng bảo trợ (Logical FK -> contract_db.contracts.id)',
    `role_in_room` VARCHAR(20) NOT NULL DEFAULT 'MEMBER' COMMENT 'Vai trò: REPRESENTATIVE (Đại diện), MEMBER (Ở cùng)',
    `join_date` DATE NOT NULL COMMENT 'Ngày bắt đầu vào ở',
    `temporary_residence_status` VARCHAR(20) NOT NULL DEFAULT 'REGISTERED' COMMENT 'Tạm trú: REGISTERED, NOT_REGISTERED',
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái cư trú: ACTIVE, MOVED_OUT',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_rm_room` (`room_id`),
    INDEX `idx_rm_tenant` (`tenant_id`),
    INDEX `idx_rm_contract` (`contract_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `roommate_requests` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã yêu cầu thêm bạn cùng phòng',
    `room_id` BIGINT NOT NULL COMMENT 'Phòng xin ở ghép (Logical FK -> room_db.rooms.id)',
    `requested_by_tenant_id` BIGINT NOT NULL COMMENT 'Khách đang ở gửi đề nghị',
    `full_name` VARCHAR(100) NOT NULL COMMENT 'Họ tên bạn cùng phòng mới',
    `identity_card` VARCHAR(20) NOT NULL COMMENT 'Số CCCD 12 số của bạn mới',
    `phone` VARCHAR(20) NOT NULL COMMENT 'Số điện thoại bạn mới',
    `birth_date` DATE NOT NULL COMMENT 'Ngày sinh',
    `gender` VARCHAR(10) NOT NULL DEFAULT 'MALE' COMMENT 'Giới tính',
    `hometown` VARCHAR(255) NULL COMMENT 'Quê quán',
    `cccd_front_url` VARCHAR(500) NULL COMMENT 'Ảnh chụp mặt trước CCCD',
    `cccd_back_url` VARCHAR(500) NULL COMMENT 'Ảnh chụp mặt sau CCCD',
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái duyệt: PENDING, APPROVED, REJECTED',
    `rejection_reason` VARCHAR(255) NULL COMMENT 'Lý do từ chối nếu không duyệt',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `reviewed_at` DATETIME NULL COMMENT 'Thời điểm chủ trọ duyệt',
    INDEX `idx_rr_room` (`room_id`),
    INDEX `idx_rr_requester` (`requested_by_tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE `contract_db`;

CREATE TABLE IF NOT EXISTS `room_requests` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã yêu cầu từ cư dân',
    `type` VARCHAR(30) NOT NULL COMMENT 'Loại yêu cầu: TRANSFER (Đổi phòng), RENEW_CONTRACT (Gia hạn), CHECKOUT (Trả trước hạn), RENT (Khách mới thuê)',
    `contract_id` BIGINT NULL COMMENT 'Hợp đồng hiện tại (nếu có)',
    `tenant_id` BIGINT NOT NULL COMMENT 'Người gửi yêu cầu (Logical FK -> tenant_db.tenants.id)',
    `target_room_id` BIGINT NOT NULL COMMENT 'Phòng mục tiêu (Logical FK -> room_db.rooms.id)',
    `current_room_id` BIGINT NULL COMMENT 'Phòng đang ở hiện tại (Logical FK -> room_db.rooms.id)',
    `duration_months` INT NULL COMMENT 'Số tháng muốn gia hạn thêm',
    `note` TEXT NULL COMMENT 'Lý do & lời nhắn từ khách',
    `forfeit_deposit` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Chấp nhận mất cọc nếu trả sớm trước hạn',
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái: PENDING, APPROVED, REJECTED, WAITING_ROOMMATES',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `reviewed_at` DATETIME NULL,
    INDEX `idx_rr_tenant` (`tenant_id`),
    INDEX `idx_rr_target_room` (`target_room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `move_out_settlements` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã quyết toán thanh lý hợp đồng',
    `contract_id` BIGINT NOT NULL COMMENT 'FK tới contracts.id',
    `room_id` BIGINT NOT NULL COMMENT 'Phòng trả lại (Logical FK -> room_db.rooms.id)',
    `tenant_id` BIGINT NOT NULL COMMENT 'Khách nhận hoàn cọc (Logical FK -> tenant_db.tenants.id)',
    `move_out_date` DATE NOT NULL COMMENT 'Ngày rời đi thực tế',
    `reason` VARCHAR(255) NULL COMMENT 'Lý do trả phòng',
    `original_deposit` DECIMAL(15,2) NOT NULL COMMENT 'Tiền cọc ban đầu trên hợp đồng',
    `unpaid_utilities_fee` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Tiền điện nước phát sinh ngày lẻ',
    `damage_fee` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Tiền bồi thường hỏng hóc thiết bị',
    `damage_description` VARCHAR(255) NULL COMMENT 'Biên bản ghi nhận hư hại tài sản',
    `refund_amount` DECIMAL(15,2) NOT NULL COMMENT 'Số tiền cọc thực trả lại cho khách',
    `bank_account` VARCHAR(50) NULL COMMENT 'Số tài khoản nhận hoàn cọc',
    `bank_name` VARCHAR(100) NULL COMMENT 'Tên ngân hàng',
    `account_holder` VARCHAR(100) NULL COMMENT 'Tên chủ tài khoản thụ hưởng',
    `refund_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái: PENDING (Chờ chuyển), COMPLETED (Đã hoàn)',
    `settled_at` DATETIME NULL COMMENT 'Thời điểm nghiệm thu hoàn tất',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_mos_contract` (`contract_id`),
    INDEX `idx_mos_room` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE `meter_db`;

CREATE TABLE IF NOT EXISTS `meter_disputes` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã phiếu khiếu nại chỉ số điện nước',
    `room_id` BIGINT NOT NULL COMMENT 'Phòng phát sinh khiếu nại (Logical FK -> room_db.rooms.id)',
    `tenant_id` BIGINT NOT NULL COMMENT 'Khách gửi khiếu nại (Logical FK -> tenant_db.tenants.id)',
    `recorded_period` VARCHAR(20) NOT NULL COMMENT 'Kỳ tháng: 2026-09...',
    `meter_type` VARCHAR(20) NOT NULL COMMENT 'ELECTRICITY hoặc WATER',
    `system_reading` DOUBLE NOT NULL COMMENT 'Chỉ số do hệ thống/chủ trọ nhập',
    `reported_reading` DOUBLE NOT NULL COMMENT 'Chỉ số khách tự đọc thực tế',
    `note` TEXT NOT NULL COMMENT 'Ý kiến phản ánh của cư dân',
    `image_url` VARCHAR(500) NULL COMMENT 'Ảnh chụp đối chứng của cư dân',
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái: PENDING (Chờ xử lý), RESOLVED (Đã giải quyết), REJECTED (Bác bỏ)',
    `resolution_notes` VARCHAR(255) NULL COMMENT 'Ghi chú giải quyết từ chủ trọ',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `resolved_at` DATETIME NULL,
    INDEX `idx_md_room` (`room_id`),
    INDEX `idx_md_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE `billing_db`;

CREATE TABLE IF NOT EXISTS `saas_invoices` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã hóa đơn gói phần mềm',
    `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Số hóa đơn SaaS: HD-SAAS-2026-01...',
    `landlord_id` BIGINT NOT NULL COMMENT 'Chủ trọ thanh toán (Logical FK -> auth_db.users.id)',
    `package_name` VARCHAR(150) NOT NULL COMMENT 'Tên gói: Gói Chuyên Nghiệp (PRO)...',
    `package_code` VARCHAR(30) NOT NULL COMMENT 'Mã gói: FREE, BASIC, PRO, ENTERPRISE',
    `billing_cycle` VARCHAR(50) NOT NULL COMMENT 'Chu kỳ: 12 Tháng...',
    `period` VARCHAR(100) NOT NULL COMMENT 'Thời hạn kích hoạt: 01/01/2026 - 31/12/2026',
    `amount` DECIMAL(15,2) NOT NULL COMMENT 'Giá trị gói VND',
    `status` VARCHAR(20) NOT NULL DEFAULT 'UNPAID' COMMENT 'Trạng thái: PAID, UNPAID, OVERDUE',
    `due_date` DATE NOT NULL COMMENT 'Hạn chót nộp tiền',
    `paid_at` DATETIME NULL COMMENT 'Thời điểm thanh toán',
    `payment_method` VARCHAR(100) NULL DEFAULT 'VietQR Chuyển Khoản Nền Tảng',
    `vat_number` VARCHAR(50) NULL COMMENT 'Số hóa đơn đỏ VAT điện tử',
    `landlord_tax_code` VARCHAR(30) NULL COMMENT 'Mã số thuế của chủ trọ',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_saas_landlord` (`landlord_id`),
    INDEX `idx_saas_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE auth_db;
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã nhật ký',
    `log_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã log hiển thị: LOG-001...',
    `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm ghi nhận',
    `ip_address` VARCHAR(50) NOT NULL COMMENT 'Địa chỉ IP người dùng',
    `user_role` VARCHAR(30) NOT NULL COMMENT 'Vai trò người dùng thao tác',
    `username` VARCHAR(50) NOT NULL COMMENT 'Tên đăng nhập',
    `action` VARCHAR(100) NOT NULL COMMENT 'Hành động: APM_SYSTEM_CHECK, SAVE_METER_READINGS...',
    `target` VARCHAR(150) NOT NULL COMMENT 'Đối tượng bị tác động',
    `status` VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' COMMENT 'Trạng thái: SUCCESS, FAILED',
    `details` TEXT NULL COMMENT 'Chi tiết nhật ký hoạt động',
    INDEX `idx_audit_user` (`username`),
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_time` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE contract_db;
CREATE TABLE IF NOT EXISTS room_request_votes(request_id BIGINT NOT NULL,user_id BIGINT NOT NULL,approved BOOLEAN NOT NULL,PRIMARY KEY(request_id,user_id));
