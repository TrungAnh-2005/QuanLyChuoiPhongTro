-- ==============================================================================
-- HỆ THỐNG QUẢN LÝ CHUỖI PHÒNG TRỌ ĐA CHI NHÁNH (MICROSERVICES SAAS ARCHITECTURE)
-- KỊCH BẢN KHỞI TẠO CƠ SỞ DỮ LIỆU ĐỘC LẬP & DỮ LIỆU MẪU TOÀN DIỆN (FULL SETUP)
-- ==============================================================================
-- ⚠️ HƯỚNG DẪN THỰC THI TRÊN CÔNG CỤ DBEAVER / NAVICAT / DATA-GRIP:
--    Trên DBeaver: Nhấn tổ hợp phím ALT + X (Execute SQL Script)
--    HOẶC nhấn nút biểu tượng [▶▶] (Execute SQL Script) trên thanh công cụ.
--    KHÔNG nhấn Ctrl + Enter vì Ctrl + Enter chỉ chạy 1 câu lệnh đơn lẻ tại con trỏ.
-- ==============================================================================

SET NAMES 'utf8mb4';

SET FOREIGN_KEY_CHECKS = 0;

-- ==============================================================================
-- PHẦN 1: KHỞI TẠO CÁC DATABASE ĐỘC LẬP CHO TỪNG VI DỊCH VỤ (MICROSERVICES)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `auth_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `room_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `tenant_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `contract_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `meter_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `billing_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `payment_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `maintenance_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `report_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `notification_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `ai_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Cấp quyền kết nối cho user dịch vụ backend
CREATE USER IF NOT EXISTS 'rental_user'@'%' IDENTIFIED BY 'rental_secret';
GRANT ALL PRIVILEGES ON `auth_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `room_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `tenant_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `contract_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `meter_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `billing_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `payment_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `maintenance_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `report_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `notification_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `ai_db`.* TO 'rental_user'@'%';
FLUSH PRIVILEGES;

-- ==============================================================================
-- 1. AUTH_DB (Microservice: auth-service, Port: 8081)
-- Quản lý xác thực JWT, RBAC, Định danh pháp lý chủ trọ (KYC) & Nhật ký Audit Log
-- ==============================================================================
USE `auth_db`;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `refresh_tokens`;
DROP TABLE IF EXISTS `landlord_profiles`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `roles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã vai trò',
    `name` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Tên quyền: ROLE_ADMIN, ROLE_STAFF, ROLE_TENANT',
    `description` VARCHAR(255) NULL COMMENT 'Mô tả quyền'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã tài khoản duy nhất',
    `username` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Tên đăng nhập hệ thống',
    `email` VARCHAR(100) NULL UNIQUE COMMENT 'Email liên hệ nhận thông báo/hóa đơn',
    `password` VARCHAR(255) NOT NULL COMMENT 'Mật khẩu mã hóa BCrypt',
    `full_name` VARCHAR(100) NOT NULL COMMENT 'Họ và tên đầy đủ',
    `phone` VARCHAR(20) NOT NULL UNIQUE COMMENT 'Số điện thoại chính chủ',
    `role` VARCHAR(20) NOT NULL DEFAULT 'ROLE_TENANT' COMMENT 'Vai trò chính: ROLE_ADMIN, ROLE_STAFF, ROLE_TENANT',
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái: ACTIVE, LOCKED',
    `subscription_package` VARCHAR(50) NULL DEFAULT 'FREE' COMMENT 'Gói cước SaaS cho chủ trọ: FREE, BASIC, PRO, ENTERPRISE',
    `max_houses_limit` INT NOT NULL DEFAULT 1 COMMENT 'Số cơ sở tối đa được tạo theo gói SaaS',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
    `user_id` BIGINT NOT NULL COMMENT 'FK tới users.id',
    `role_id` BIGINT NOT NULL COMMENT 'FK tới roles.id',
    PRIMARY KEY (`user_id`, `role_id`),
    CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `landlord_profiles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính hồ sơ KYC chủ trọ',
    `user_id` BIGINT NOT NULL UNIQUE COMMENT 'Liên kết tài khoản users.id (ROLE_STAFF)',
    `identity_card` VARCHAR(20) NOT NULL UNIQUE COMMENT 'Số CCCD 12 số của chủ trọ',
    `full_name` VARCHAR(100) NOT NULL COMMENT 'Họ và tên chuẩn trên thẻ CCCD',
    `birth_date` DATE NOT NULL COMMENT 'Ngày tháng năm sinh',
    `issue_date` DATE NOT NULL COMMENT 'Ngày cấp CCCD',
    `issue_place` VARCHAR(150) NOT NULL COMMENT 'Nơi cấp (Cục Cảnh sát QLHC về TTXH)',
    `permanent_address` VARCHAR(255) NOT NULL COMMENT 'Địa chỉ thường trú trên CCCD',
    `cccd_front_url` VARCHAR(500) NOT NULL COMMENT 'Ảnh chụp mặt trước CCCD',
    `cccd_back_url` VARCHAR(500) NOT NULL COMMENT 'Ảnh chụp mặt sau CCCD',
    `tax_code` VARCHAR(30) NULL COMMENT 'Mã số thuế cá nhân hoặc hộ kinh doanh cá thể',
    `business_license_url` VARCHAR(500) NULL COMMENT 'Link ảnh giấy phép kinh doanh / PCCC',
    `kyc_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái: PENDING, VERIFIED, REJECTED',
    `rejection_reason` VARCHAR(255) NULL COMMENT 'Lý do từ chối phê duyệt hồ sơ',
    `verified_at` DATETIME NULL COMMENT 'Thời điểm Admin phê duyệt',
    `verified_by` BIGINT NULL COMMENT 'Mã Admin phê duyệt (Logical FK -> users.id)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_lp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `refresh_tokens` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `token` VARCHAR(255) NOT NULL UNIQUE,
    `expiry_date` DATETIME NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_token_user` (`user_id`),
    CONSTRAINT `fk_rt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_logs` (
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


-- ==============================================================================
-- 2. ROOM_DB (Microservice: room-service, Port: 8082)
-- Quản lý Cơ sở nhà trọ, Tòa nhà, Tầng, Phòng trọ, Tiện ích & Biểu giá dịch vụ
-- ==============================================================================
USE `room_db`;

DROP TABLE IF EXISTS `room_amenities`;
DROP TABLE IF EXISTS `amenities`;
DROP TABLE IF EXISTS `house_service_configs`;
DROP TABLE IF EXISTS `branch_facilities`;
DROP TABLE IF EXISTS `rooms`;
DROP TABLE IF EXISTS `floors`;
DROP TABLE IF EXISTS `buildings`;
DROP TABLE IF EXISTS `boarding_houses`;

CREATE TABLE `boarding_houses` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã cơ sở nhà trọ',
    `owner_id` BIGINT NOT NULL COMMENT 'Mã chủ sở hữu (Logical FK -> auth_db.users.id)',
    `code` VARCHAR(20) NOT NULL UNIQUE COMMENT 'Mã định danh cơ sở: CS-01, CS-02, CS-03...',
    `name` VARCHAR(150) NOT NULL COMMENT 'Tên cơ sở: Nhà Trọ Cầu Giấy - Cơ Sở 1...',
    `address` VARCHAR(255) NOT NULL COMMENT 'Địa chỉ chi tiết: số nhà, tên ngõ, tên đường',
    `ward` VARCHAR(100) NULL COMMENT 'Phường / Xã',
    `district` VARCHAR(100) NULL COMMENT 'Quận / Huyện',
    `city` VARCHAR(100) NULL COMMENT 'Tỉnh / Thành phố',
    `manager_name` VARCHAR(100) NULL COMMENT 'Họ tên quản lý cơ sở',
    `manager_phone` VARCHAR(20) NOT NULL COMMENT 'Hotline hỗ trợ cư dân',
    `total_floors` INT NOT NULL DEFAULT 1 COMMENT 'Tổng số tầng',
    `total_rooms` INT NOT NULL DEFAULT 0 COMMENT 'Tổng số phòng',
    `description` TEXT NULL COMMENT 'Mô tả cơ sở',
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái: ACTIVE, INACTIVE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_house_owner` (`owner_id`),
    INDEX `idx_house_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `branch_facilities` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `boarding_house_id` BIGINT NOT NULL COMMENT 'FK tới boarding_houses.id',
    `name` VARCHAR(100) NOT NULL COMMENT 'Tên tiện ích: Thang máy, FaceID, Camera 24/7...',
    `icon` VARCHAR(50) NOT NULL COMMENT 'Mã icon giao diện',
    CONSTRAINT `fk_bf_house` FOREIGN KEY (`boarding_house_id`) REFERENCES `boarding_houses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `buildings` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã tòa nhà',
    `boarding_house_id` BIGINT NOT NULL COMMENT 'Thuộc cơ sở trọ nào',
    `name` VARCHAR(100) NOT NULL COMMENT 'Tên tòa: Tòa A Cầu Giấy, Tòa B Bách Khoa...',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_building_house` (`boarding_house_id`),
    CONSTRAINT `fk_bld_house` FOREIGN KEY (`boarding_house_id`) REFERENCES `boarding_houses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `floors` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã tầng',
    `building_id` BIGINT NOT NULL COMMENT 'Thuộc tòa nhà nào',
    `floor_number` INT NOT NULL COMMENT 'Thứ tự tầng: 1, 2, 3, 4...',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_floor_building` (`building_id`),
    CONSTRAINT `fk_floor_bld` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rooms` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã định danh phòng trọ',
    `floor_id` BIGINT NOT NULL COMMENT 'Phòng nằm ở tầng nào',
    `room_number` VARCHAR(20) NOT NULL COMMENT 'Số phòng: P.101, P.102...',
    `base_price` DECIMAL(15,2) NOT NULL COMMENT 'Đơn giá thuê cơ bản VND/tháng',
    `area` DOUBLE NOT NULL COMMENT 'Diện tích phòng (m2)',
    `max_occupants` INT NOT NULL DEFAULT 2 COMMENT 'Số người ở tối đa cho phép',
    `status` VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' COMMENT 'Trạng thái: AVAILABLE, OCCUPIED, MAINTENANCE, CLEANING',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_room_floor` (`floor_id`),
    INDEX `idx_room_number` (`room_number`),
    INDEX `idx_room_status` (`status`),
    CONSTRAINT `fk_room_floor` FOREIGN KEY (`floor_id`) REFERENCES `floors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `amenities` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Tên tiện ích: WiFi, Điều hòa, Nóng lạnh, Tủ lạnh...',
    `icon` VARCHAR(50) NOT NULL COMMENT 'Tên icon hiển thị trên FE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `room_amenities` (
    `room_id` BIGINT NOT NULL,
    `amenity_id` BIGINT NOT NULL,
    PRIMARY KEY (`room_id`, `amenity_id`),
    CONSTRAINT `fk_ra_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ra_amenity` FOREIGN KEY (`amenity_id`) REFERENCES `amenities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `house_service_configs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `boarding_house_id` BIGINT NOT NULL COMMENT 'FK tới boarding_houses.id',
    `service_name` VARCHAR(100) NOT NULL COMMENT 'Tên dịch vụ: Tiền điện, Tiền nước, Rác, WiFi...',
    `calculation_type` VARCHAR(30) NOT NULL COMMENT 'Hình thức tính: METER (công tơ), PER_ROOM (phòng), PER_CAPITA (người)',
    `unit_price` DECIMAL(15,2) NOT NULL COMMENT 'Đơn giá dịch vụ VND',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Đang áp dụng hay tạm ngừng',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_hsc_house` (`boarding_house_id`),
    CONSTRAINT `fk_hsc_house` FOREIGN KEY (`boarding_house_id`) REFERENCES `boarding_houses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- 3. TENANT_DB (Microservice: tenant-service, Port: 8083)
-- Quản lý Khách thuê, Thành viên cư trú, Đăng ký ở ghép & Hồ sơ cư dân
-- ==============================================================================
USE `tenant_db`;

DROP TABLE IF EXISTS `roommate_requests`;
DROP TABLE IF EXISTS `tenant_documents`;
DROP TABLE IF EXISTS `tenant_contacts`;
DROP TABLE IF EXISTS `room_members`;
DROP TABLE IF EXISTS `tenants`;

CREATE TABLE `tenants` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã hồ sơ khách thuê',
    `user_id` BIGINT NULL UNIQUE COMMENT 'Tài khoản đăng nhập (Logical FK -> auth_db.users.id)',
    `full_name` VARCHAR(100) NOT NULL COMMENT 'Họ và tên đầy đủ theo CCCD',
    `identity_card` VARCHAR(20) NOT NULL UNIQUE COMMENT 'Số CCCD 12 chữ số',
    `birth_date` DATE NOT NULL COMMENT 'Ngày sinh',
    `gender` VARCHAR(10) NOT NULL DEFAULT 'MALE' COMMENT 'Giới tính: MALE, FEMALE, OTHER',
    `phone` VARCHAR(20) NOT NULL UNIQUE COMMENT 'Số điện thoại chính chủ',
    `email` VARCHAR(100) NULL COMMENT 'Email nhận thông báo hóa đơn',
    `hometown` VARCHAR(255) NULL COMMENT 'Quê quán',
    `address` VARCHAR(255) NULL COMMENT 'Địa chỉ thường trú',
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái: ACTIVE, INACTIVE, BLACKLIST',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_tenant_phone` (`phone`),
    INDEX `idx_tenant_ic` (`identity_card`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `room_members` (
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
    INDEX `idx_rm_contract` (`contract_id`),
    CONSTRAINT `fk_rm_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `roommate_requests` (
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
    INDEX `idx_rr_requester` (`requested_by_tenant_id`),
    CONSTRAINT `fk_rr_requester` FOREIGN KEY (`requested_by_tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tenant_documents` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT NOT NULL,
    `document_type` VARCHAR(50) NOT NULL COMMENT 'Loại giấy tờ: CCCD_FRONT, CCCD_BACK, TEMPORARY_RESIDENCE',
    `document_url` VARCHAR(500) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_td_tenant` (`tenant_id`),
    CONSTRAINT `fk_td_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tenant_contacts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT NOT NULL,
    `contact_name` VARCHAR(100) NOT NULL COMMENT 'Tên người liên hệ khẩn cấp',
    `relationship` VARCHAR(50) NOT NULL COMMENT 'Mối quan hệ: Bố mẹ, Anh chị, Bạn bè',
    `phone` VARCHAR(20) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_tc_tenant` (`tenant_id`),
    CONSTRAINT `fk_tc_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- 4. CONTRACT_DB (Microservice: contract-service, Port: 8084)
-- Quản lý Hợp đồng thuê phòng, Ký điện tử, Quyết toán hoàn cọc & Thanh lý
-- ==============================================================================
USE `contract_db`;

DROP TABLE IF EXISTS `move_out_settlements`;
DROP TABLE IF EXISTS `room_requests`;
DROP TABLE IF EXISTS `contracts`;

CREATE TABLE `contracts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã hợp đồng',
    `contract_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Số hợp đồng: HD-2026-001...',
    `tenant_id` BIGINT NOT NULL COMMENT 'Đại diện hợp đồng (Logical FK -> tenant_db.tenants.id)',
    `room_id` BIGINT NOT NULL COMMENT 'Phòng thuê (Logical FK -> room_db.rooms.id)',
    `start_date` DATE NOT NULL COMMENT 'Ngày bắt đầu tính tiền thuê',
    `end_date` DATE NOT NULL COMMENT 'Ngày hết hạn hợp đồng',
    `rental_price` DECIMAL(15,2) NOT NULL COMMENT 'Giá thuê thỏa thuận VND/tháng',
    `deposit_amount` DECIMAL(15,2) NOT NULL COMMENT 'Tiền đặt cọc phòng',
    `payment_cycle` INT NOT NULL DEFAULT 1 COMMENT 'Chu kỳ thanh toán (tháng/lần)',
    `payment_day` INT NOT NULL DEFAULT 5 COMMENT 'Ngày thanh toán hàng tháng (thường mùng 5)',
    `terms` TEXT NULL COMMENT 'Nội dung điều khoản hợp đồng',
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái: PENDING_SIGN, WAITING_APPROVAL, ACTIVE, EXPIRED, TERMINATED',
    `deposit_paid` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Đã thanh toán cọc hay chưa',
    `deposit_paid_at` DATETIME NULL COMMENT 'Thời điểm thanh toán cọc',
    `deposit_payment_method` VARCHAR(30) NULL DEFAULT 'VIETQR' COMMENT 'Hình thức trả cọc: VIETQR, CASH...',
    `signed_electronically` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Đã ký điện tử hay chưa',
    `signed_at` DATETIME NULL COMMENT 'Thời điểm khách ký e-sign',
    `signature_hash` VARCHAR(255) NULL COMMENT 'Mã băm chữ ký điện tử',
    `contract_file_url` VARCHAR(500) NULL COMMENT 'Link tải file PDF hợp đồng có chữ ký',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_contract_tenant` (`tenant_id`),
    INDEX `idx_contract_room` (`room_id`),
    INDEX `idx_contract_code` (`contract_code`),
    INDEX `idx_contract_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `move_out_settlements` (
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
    INDEX `idx_mos_room` (`room_id`),
    CONSTRAINT `fk_mos_contract` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `room_requests` (
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


-- ==============================================================================
-- 5. METER_DB (Microservice: meter-service, Port: 8085)
-- Quản lý Đồng hồ đo, Chốt chỉ số điện nước định kỳ kèm ảnh & Đối soát tranh chấp
-- ==============================================================================
USE `meter_db`;

DROP TABLE IF EXISTS `meter_disputes`;
DROP TABLE IF EXISTS `meter_readings`;
DROP TABLE IF EXISTS `meters`;

CREATE TABLE `meters` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã công tơ/đồng hồ',
    `room_id` BIGINT NOT NULL COMMENT 'Phòng lắp đặt (Logical FK -> room_db.rooms.id)',
    `meter_type` VARCHAR(20) NOT NULL COMMENT 'Loại: ELECTRICITY (Điện), WATER (Nước)',
    `serial_number` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Số seri in trên công tơ',
    `initial_reading` DOUBLE NOT NULL DEFAULT 0 COMMENT 'Chỉ số ban đầu khi lắp đặt',
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái: ACTIVE, BROKEN, REPLACED',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_meter_room` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `meter_readings` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã bản ghi đo',
    `room_id` BIGINT NOT NULL COMMENT 'Phòng đo (Logical FK -> room_db.rooms.id)',
    `reading_date` DATE NOT NULL COMMENT 'Ngày chốt số thực tế',
    `reading_type` VARCHAR(20) NOT NULL DEFAULT 'MONTHLY' COMMENT 'Loại chốt: MONTHLY (Định kỳ), MOVE_IN (Nhận phòng), MOVE_OUT (Trả phòng lẻ)',
    `recorded_month` INT NOT NULL COMMENT 'Tháng chốt số (1 - 12)',
    `recorded_year` INT NOT NULL COMMENT 'Năm chốt số (VD: 2026)',
    `old_electricity` DOUBLE NOT NULL COMMENT 'Chỉ số điện cũ',
    `new_electricity` DOUBLE NOT NULL COMMENT 'Chỉ số điện mới chốt',
    `electricity_usage` DOUBLE GENERATED ALWAYS AS (`new_electricity` - `old_electricity`) STORED COMMENT 'Số kWh tiêu thụ tự tính',
    `old_water` DOUBLE NOT NULL COMMENT 'Chỉ số nước cũ',
    `new_water` DOUBLE NOT NULL COMMENT 'Chỉ số nước mới chốt',
    `water_usage` DOUBLE GENERATED ALWAYS AS (`new_water` - `old_water`) STORED COMMENT 'Số m3 nước tiêu thụ tự tính',
    `image_evidence_url` VARCHAR(500) NULL COMMENT 'Ảnh chụp công tơ để đối soát chống gian lận',
    `recorded_by` VARCHAR(50) NOT NULL DEFAULT 'STAFF' COMMENT 'Người ghi nhận: Tên Staff hoặc AUTO_AI',
    `status` VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' COMMENT 'Trạng thái: CONFIRMED, DISPUTED, CANCELLED',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_mr_room_period` (`room_id`, `recorded_year`, `recorded_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `meter_disputes` (
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


-- ==============================================================================
-- 6. BILLING_DB (Microservice: billing-service, Port: 8086)
-- Quản lý Hóa đơn thu tiền phòng, Bảng kê chi phí & Hóa đơn gói cước SaaS B2B
-- ==============================================================================
USE `billing_db`;

DROP TABLE IF EXISTS `invoice_items`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `saas_invoices`;

CREATE TABLE `invoices` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã hóa đơn',
    `invoice_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã hiển thị: HD-202609-01...',
    `contract_id` BIGINT NOT NULL COMMENT 'Hợp đồng bảo trợ (Logical FK -> contract_db.contracts.id)',
    `room_id` BIGINT NOT NULL COMMENT 'Phòng thu tiền (Logical FK -> room_db.rooms.id)',
    `tenant_id` BIGINT NOT NULL COMMENT 'Khách đứng tên nhận hóa đơn (Logical FK -> tenant_db.tenants.id)',
    `month` INT NOT NULL COMMENT 'Kỳ tháng thu (1 - 12)',
    `year` INT NOT NULL COMMENT 'Kỳ năm thu (VD: 2026)',
    `room_fee` DECIMAL(15,2) NOT NULL COMMENT 'Tiền thuê phòng',
    `electricity_fee` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Tiền điện tiêu thụ',
    `water_fee` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Tiền nước tiêu thụ',
    `service_fee` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Phí dịch vụ cố định (rác, wifi, vệ sinh)',
    `discount` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Số tiền giảm giá khuyến mãi',
    `total_amount` DECIMAL(15,2) NOT NULL COMMENT 'Tổng số tiền phải nộp',
    `status` VARCHAR(20) NOT NULL DEFAULT 'UNPAID' COMMENT 'Trạng thái: PENDING_METER, UNPAID, PAID, OVERDUE, CANCELLED',
    `due_date` DATE NOT NULL COMMENT 'Hạn chót thanh toán',
    `paid_at` DATETIME NULL COMMENT 'Thời điểm gạch nợ thành công',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_inv_room` (`room_id`),
    INDEX `idx_inv_tenant` (`tenant_id`),
    INDEX `idx_inv_contract` (`contract_id`),
    INDEX `idx_inv_code` (`invoice_code`),
    INDEX `idx_inv_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invoice_items` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã dòng chi tiết',
    `invoice_id` BIGINT NOT NULL COMMENT 'FK tới invoices.id',
    `item_name` VARCHAR(150) NOT NULL COMMENT 'Tên khoản mục: Tiền phòng, Tiền điện, Tiền nước, Internet...',
    `quantity` DOUBLE NOT NULL DEFAULT 1 COMMENT 'Số lượng',
    `unit_price` DECIMAL(15,2) NOT NULL COMMENT 'Đơn giá',
    `amount` DECIMAL(15,2) NOT NULL COMMENT 'Thành tiền: quantity * unit_price',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_item_invoice` (`invoice_id`),
    CONSTRAINT `fk_ii_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `saas_invoices` (
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


-- ==============================================================================
-- 7. PAYMENT_DB (Microservice: payment-service, Port: 8087)
-- Quản lý Giao dịch thanh toán tự động VietQR, SePay, VNPay, MoMo & Tiền mặt
-- ==============================================================================
USE `payment_db`;

DROP TABLE IF EXISTS `payment_gateways_config`;
DROP TABLE IF EXISTS `payments`;

CREATE TABLE `payments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã giao dịch thanh toán',
    `invoice_id` BIGINT NULL COMMENT 'Hóa đơn tiền phòng (Logical FK -> billing_db.invoices.id)',
    `saas_invoice_id` BIGINT NULL COMMENT 'Hóa đơn SaaS nếu nộp phí phần mềm (Logical FK -> billing_db.saas_invoices.id)',
    `payment_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã giao dịch duy nhất: PAY-202609-001...',
    `amount` DECIMAL(15,2) NOT NULL COMMENT 'Số tiền thực tế thanh toán',
    `payment_method` VARCHAR(30) NOT NULL COMMENT 'Hình thức: VIETQR, SEPAY, VNPAY, MOMO, CASH, BANK_TRANSFER',
    `transaction_ref` VARCHAR(100) NULL COMMENT 'Mã tham chiếu ngân hàng từ Webhook',
    `bank_code` VARCHAR(30) NULL COMMENT 'Ngân hàng thực hiện: VCB, MB, TCB...',
    `status` VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' COMMENT 'Trạng thái: PENDING, SUCCESS, FAILED',
    `payment_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm hoàn tất',
    `note` VARCHAR(255) NULL COMMENT 'Nội dung chuyển khoản hoặc ghi chú thu tiền mặt',
    `webhook_payload` JSON NULL COMMENT 'Lưu trữ toàn văn payload trả về từ cổng thanh toán',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_pay_invoice` (`invoice_id`),
    INDEX `idx_pay_saas` (`saas_invoice_id`),
    INDEX `idx_pay_code` (`payment_code`),
    INDEX `idx_pay_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payment_gateways_config` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `gateway_name` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Tên cổng: VNPAY, MOMO, SEPAY, VIETQR, SMTP, SMS_OTP',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `merchant_id` VARCHAR(100) NULL,
    `access_key` VARCHAR(150) NULL,
    `secret_key` VARCHAR(255) NULL,
    `endpoint_url` VARCHAR(255) NULL,
    `extra_config` JSON NULL COMMENT 'Lưu thông số phụ (tmnCode, bankAccount, apiKey...)',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- 8. MAINTENANCE_DB (Microservice: maintenance-service, Port: 8088)
-- Quản lý Phiếu báo hỏng sửa chữa, Điều phối thợ kỹ thuật & Chi phí bảo trì
-- ==============================================================================
USE `maintenance_db`;

DROP TABLE IF EXISTS `maintenance_logs`;
DROP TABLE IF EXISTS `maintenance_requests`;

CREATE TABLE `maintenance_requests` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã phiếu báo sự cố',
    `ticket_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã hiển thị: SC-2026-001...',
    `room_id` BIGINT NOT NULL COMMENT 'Phòng xảy ra sự cố (Logical FK -> room_db.rooms.id)',
    `tenant_id` BIGINT NOT NULL COMMENT 'Cư dân gửi phản ánh (Logical FK -> tenant_db.tenants.id)',
    `category` VARCHAR(50) NOT NULL COMMENT 'Phân loại: WATER (Nước), ELECTRICITY (Điện), FURNITURE (Nội thất), APPLIANCE (Thiết bị), OTHER',
    `title` VARCHAR(255) NOT NULL COMMENT 'Tiêu đề ngắn gọn: Hỏng vòi sen nhà tắm...',
    `description` TEXT NULL COMMENT 'Mô tả chi tiết tình trạng hư hại',
    `image_url` VARCHAR(500) NULL COMMENT 'Ảnh chụp hiện trường từ camera cư dân',
    `priority` VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' COMMENT 'Mức ưu tiên: LOW, MEDIUM, HIGH, URGENT',
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái: PENDING (Chờ tiếp nhận), IN_PROGRESS (Đang sửa), RESOLVED (Đã sửa xong), CANCELLED',
    `cost` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Chi phí sửa chữa thực tế phát sinh',
    `assigned_to` VARCHAR(100) NULL COMMENT 'Thợ hoặc nhân sự kỹ thuật chịu trách nhiệm',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `resolved_at` DATETIME NULL COMMENT 'Thời điểm hoàn tất nghiệm thu',
    INDEX `idx_mrq_room` (`room_id`),
    INDEX `idx_mrq_tenant` (`tenant_id`),
    INDEX `idx_mrq_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `maintenance_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `request_id` BIGINT NOT NULL COMMENT 'FK tới maintenance_requests.id',
    `actor_username` VARCHAR(50) NOT NULL COMMENT 'Người thực hiện thao tác',
    `action` VARCHAR(50) NOT NULL COMMENT 'ASSIGNED, STARTED, RESOLVED, ADD_NOTE',
    `notes` TEXT NULL COMMENT 'Ghi chú kỹ thuật',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_ml_request` (`request_id`),
    CONSTRAINT `fk_ml_request` FOREIGN KEY (`request_id`) REFERENCES `maintenance_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- 9. REPORT_DB (Microservice: report-service, Port: 8089)
-- Báo cáo thống kê tài chính, Dòng tiền thu chi, Công nợ & Tỷ lệ lấp đầy
-- ==============================================================================
USE `report_db`;

DROP TABLE IF EXISTS `room_occupancy_metrics`;
DROP TABLE IF EXISTS `revenue_records`;
DROP TABLE IF EXISTS `monthly_revenue_reports`;

CREATE TABLE `monthly_revenue_reports` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã bản ghi báo cáo',
    `boarding_house_id` BIGINT NOT NULL COMMENT 'Cơ sở trọ thống kê (Logical FK -> room_db.boarding_houses.id)',
    `month` INT NOT NULL COMMENT 'Tháng báo cáo',
    `year` INT NOT NULL COMMENT 'Năm báo cáo',
    `total_revenue` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Tổng doanh thu thực thu',
    `total_expense` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Tổng chi phí vận hành & bảo trì',
    `net_profit` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Lợi nhuận ròng: Doanh thu - Chi phí',
    `occupancy_rate` DOUBLE NOT NULL DEFAULT 0 COMMENT 'Tỷ lệ lấp đầy phòng (%)',
    `occupied_rooms` INT NOT NULL DEFAULT 0 COMMENT 'Số phòng đang có khách',
    `total_rooms` INT NOT NULL DEFAULT 0 COMMENT 'Tổng số phòng cơ sở',
    `generated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_mrr_house_period` (`boarding_house_id`, `year`, `month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `revenue_records` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `boarding_house_id` BIGINT NOT NULL COMMENT 'Cơ sở trọ (Logical FK -> room_db.boarding_houses.id)',
    `category` VARCHAR(50) NOT NULL COMMENT 'Hạng mục: ROOM_RENT, UTILITIES, MAINTENANCE_FEE, MANAGEMENT_FEE',
    `record_type` VARCHAR(20) NOT NULL COMMENT 'INCOME (Thu) hoặc EXPENSE (Chi)',
    `amount` DECIMAL(15,2) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `record_date` DATE NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_rr_house` (`boarding_house_id`),
    INDEX `idx_rr_date` (`record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `room_occupancy_metrics` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `boarding_house_id` BIGINT NOT NULL COMMENT 'Logical FK -> room_db.boarding_houses.id',
    `record_date` DATE NOT NULL,
    `total_rooms` INT NOT NULL,
    `occupied_rooms` INT NOT NULL,
    `available_rooms` INT NOT NULL,
    `maintenance_rooms` INT NOT NULL,
    `occupancy_rate` DOUBLE NOT NULL,
    INDEX `idx_rom_house` (`boarding_house_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- 10. NOTIFICATION_DB (Microservice: notification-service, Port: 8090)
-- Quản lý Thông báo đẩy trong App, SMS OTP Brandname & Email hóa đơn
-- ==============================================================================
USE `notification_db`;

DROP TABLE IF EXISTS `notification_templates`;
DROP TABLE IF EXISTS `notifications`;

CREATE TABLE `notifications` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL COMMENT 'Người nhận thông báo (Logical FK -> auth_db.users.id)',
    `title` VARCHAR(200) NOT NULL COMMENT 'Tiêu đề thông báo',
    `content` TEXT NOT NULL COMMENT 'Nội dung chi tiết',
    `type` VARCHAR(50) NOT NULL COMMENT 'Phân loại: INVOICE, CONTRACT, MAINTENANCE, SYSTEM, SMS_OTP',
    `channel` VARCHAR(20) NOT NULL DEFAULT 'IN_APP' COMMENT 'Kênh: IN_APP, EMAIL, SMS',
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Đã đọc hay chưa',
    `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_noti_user` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notification_templates` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `template_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã mẫu: TPL_INVOICE_ISSUED, TPL_OTP_RESET...',
    `subject` VARCHAR(200) NOT NULL,
    `body_template` TEXT NOT NULL,
    `channel` VARCHAR(20) NOT NULL DEFAULT 'EMAIL'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- 11. AI_DB (Microservice: ai-service, Port: 8000)
-- Quản lý Nhận diện hình ảnh công tơ điện nước (OCR Vision) & Độ tin cậy
-- ==============================================================================
USE `ai_db`;

DROP TABLE IF EXISTS `ai_ocr_logs`;

CREATE TABLE `ai_ocr_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `room_id` BIGINT NOT NULL COMMENT 'Phòng kiểm tra (Logical FK -> room_db.rooms.id)',
    `image_url` VARCHAR(500) NOT NULL COMMENT 'Đường dẫn ảnh công tơ đưa vào AI',
    `raw_result_json` JSON NULL COMMENT 'Kết quả thô trả về từ OpenAI GPT-4o Vision',
    `detected_electricity` DOUBLE NULL COMMENT 'Chỉ số điện bóc tách được',
    `detected_water` DOUBLE NULL COMMENT 'Chỉ số nước bóc tách được',
    `confidence_score` DOUBLE NOT NULL DEFAULT 0 COMMENT 'Điểm độ tin cậy nhận diện (%)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_ocr_room` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- PHẦN 2: SEED DATA DỮ LIỆU MẪU ĐỒNG BỘ 100% VỚI FRONTEND VÀ THỰC TẾ NGHIỆP VỤ
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED DATA: AUTH_DB
-- ------------------------------------------------------------------------------
USE `auth_db`;

INSERT INTO `roles` (`id`, `name`, `description`) VALUES 
(1, 'ROLE_ADMIN', 'Quản trị viên nền tảng SaaS'),
(2, 'ROLE_STAFF', 'Chủ nhà trọ & Quản lý cơ sở chi nhánh'),
(3, 'ROLE_TENANT', 'Khách thuê trọ / Cư dân');

-- Mật khẩu mặc định của tất cả tài khoản mẫu là: password (đã mã hóa BCrypt)
-- Hash: $2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW
INSERT INTO `users` (`id`, `username`, `email`, `password`, `full_name`, `phone`, `role`, `status`, `subscription_package`, `max_houses_limit`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@rental.vn', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'Quản Trị Viên Chuỗi Nhà Trọ', '0901000001', 'ROLE_ADMIN', 'ACTIVE', 'ENTERPRISE', 999, '2026-01-01 08:00:00', '2026-01-01 08:00:00'),
(2, 'staff', 'staff@rental.vn', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'Lê Thị Thu Ngân', '0912888666', 'ROLE_STAFF', 'ACTIVE', 'PRO', 999, '2026-01-01 08:00:00', '2026-01-01 08:00:00'),
(3, 'staff2', 'staff2@rental.vn', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'Đàm Văn Táo', '0988777999', 'ROLE_STAFF', 'ACTIVE', 'BASIC', 2, '2026-02-15 09:30:00', '2026-02-15 09:30:00'),
(4, 'landlord_dd', 'hung.pq@rental.vn', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'Phạm Quốc Hùng', '0936555222', 'ROLE_STAFF', 'ACTIVE', 'ENTERPRISE', 999, '2026-03-10 10:00:00', '2026-03-10 10:00:00'),
(5, 'tenant', 'an.nguyen@rental.vn', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'Nguyễn Văn An', '0987654321', 'ROLE_TENANT', 'ACTIVE', 'FREE', 1, '2026-01-01 09:00:00', '2026-01-01 09:00:00'),
(6, 'tenant2', 'binh.tt@gmail.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'Trần Thị Bình', '0978123456', 'ROLE_TENANT', 'ACTIVE', 'FREE', 1, '2026-02-15 10:00:00', '2026-02-15 10:00:00'),
(7, 'tenant3', 'cuong.pm@gmail.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'Phạm Minh Cường', '0912888999', 'ROLE_TENANT', 'ACTIVE', 'FREE', 1, '2026-03-10 11:00:00', '2026-03-10 11:00:00'),
(8, 'tenant4', 'dung.vh@gmail.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'Vũ Hoàng Dũng', '0945678901', 'ROLE_TENANT', 'ACTIVE', 'FREE', 1, '2026-04-01 08:30:00', '2026-04-01 08:30:00');

INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1),
(2, 2),
(3, 2),
(4, 2),
(5, 3),
(6, 3),
(7, 3),
(8, 3);

INSERT INTO `landlord_profiles` (`id`, `user_id`, `identity_card`, `full_name`, `birth_date`, `issue_date`, `issue_place`, `permanent_address`, `cccd_front_url`, `cccd_back_url`, `tax_code`, `business_license_url`, `kyc_status`, `rejection_reason`, `verified_at`, `verified_by`, `created_at`, `updated_at`) VALUES
(1, 2, '001089012345', 'Lê Thị Thu Ngân', '1989-08-20', '2021-05-12', 'Cục Cảnh sát QLHC về TTXH', 'Số 12 Ngõ 80 Chùa Láng, Phường Láng Thượng, Đống Đa, Hà Nội', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600', '8392019482', 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600', 'VERIFIED', NULL, '2026-01-15 09:00:00', 1, '2026-01-01 08:30:00', '2026-01-15 09:00:00'),
(2, 3, '001088098765', 'Đàm Văn Táo', '1988-11-15', '2022-03-10', 'Cục Cảnh sát QLHC về TTXH', 'Số 45 Ngõ Tự Do, Đồng Tâm, Hai Bà Trưng, Hà Nội', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', '8392019284', NULL, 'VERIFIED', NULL, '2026-02-18 10:00:00', 1, '2026-02-15 09:40:00', '2026-02-18 10:00:00'),
(3, 4, '001085055443', 'Phạm Quốc Hùng', '1985-04-22', '2020-08-15', 'Cục Cảnh sát QLHC về TTXH', 'Số 92 Phố Chùa Láng, Đống Đa, Hà Nội', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600', '8392019555', 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600', 'VERIFIED', NULL, '2026-03-12 14:00:00', 1, '2026-03-10 10:15:00', '2026-03-12 14:00:00');

INSERT INTO `audit_logs` (`id`, `log_code`, `timestamp`, `ip_address`, `user_role`, `username`, `action`, `target`, `status`, `details`) VALUES
(1, 'LOG-001', '2026-10-03 19:42:15', '118.70.190.22', 'ROLE_ADMIN', 'admin', 'APM_SYSTEM_CHECK', 'Discovery & RabbitMQ', 'SUCCESS', 'Giám sát 12 microservices đều phản hồi HTTP 200 UP'),
(2, 'LOG-002', '2026-10-03 18:30:10', '14.232.12.89', 'ROLE_STAFF', 'staff', 'SAVE_METER_READINGS', 'P.101 CS-01', 'SUCCESS', 'Chốt chỉ số điện 860 kWh, nước 45 m3'),
(3, 'LOG-003', '2026-10-03 17:15:40', '171.244.45.60', 'ROLE_TENANT', 'tenant', 'SIGN_CONTRACT', 'HD-2026-001', 'SUCCESS', 'Khách ký điện tử xác nhận điều khoản HĐ P.101'),
(4, 'LOG-004', '2026-10-03 15:10:05', '14.232.12.89', 'ROLE_STAFF', 'staff', 'CREATE_INVOICE_BATCH', 'CS-01 Cầu Giấy', 'SUCCESS', 'Tự động phát hành 12 hóa đơn kỳ 2026-09'),
(5, 'LOG-005', '2026-10-03 14:02:18', '113.190.23.41', 'ROLE_TENANT', 'tenant2', 'ONLINE_PAYMENT_VNPAY', 'HD-202609-03', 'SUCCESS', 'Thanh toán VNPay 3.840.000 đ thành công'),
(6, 'LOG-006', '2026-10-03 11:25:33', '118.70.190.22', 'ROLE_ADMIN', 'admin', 'UPDATE_INTEGRATION_KEY', 'AI OCR Vision', 'SUCCESS', 'Kiểm tra kết nối AI Vision model GPT-4o thành công'),
(7, 'LOG-007', '2026-10-03 09:14:52', '42.115.88.19', 'ROLE_STAFF', 'staff', 'CONFIRM_CASH_PAYMENT', 'HD-202609-05', 'SUCCESS', 'Thu tiền mặt 3.240.000 đ từ khách Hoàng Văn Nam');


-- ------------------------------------------------------------------------------
-- 2. SEED DATA: ROOM_DB
-- ------------------------------------------------------------------------------
USE `room_db`;

INSERT INTO `boarding_houses` (`id`, `owner_id`, `code`, `name`, `address`, `ward`, `district`, `city`, `manager_name`, `manager_phone`, `total_floors`, `total_rooms`, `description`, `status`) VALUES
(1, 2, 'CS-01', 'Nhà Trọ Cầu Giấy - Cơ Sở 1', 'Số 45, Ngõ 165 Cầu Giấy', 'Dịch Vọng', 'Cầu Giấy', 'Hà Nội', 'Lê Thị Thu Ngân', '0912888666', 4, 12, 'Cơ sở chính khu vực Cầu Giấy, gần các trường đại học lớn', 'ACTIVE'),
(2, 3, 'CS-02', 'Nhà Trọ Bách Khoa - Cơ Sở 2', 'Số 18, Ngõ Tự Do', 'Đồng Tâm', 'Hai Bà Trưng', 'Hà Nội', 'Đàm Văn Táo', '0988777999', 4, 8, 'Cơ sở Bách Khoa, Hai Bà Trưng gần Kinh Tế Quốc Dân', 'ACTIVE'),
(3, 4, 'CS-03', 'Nhà Trọ Đống Đa - Cơ Sở 3', 'Số 92, Phố Chùa Láng', 'Láng Thượng', 'Đống Đa', 'Hà Nội', 'Phạm Quốc Hùng', '0936555222', 6, 16, 'Cơ sở cao cấp Đống Đa thang máy thẻ từ, PCCC tự động', 'ACTIVE');

INSERT INTO `branch_facilities` (`id`, `boarding_house_id`, `name`, `icon`) VALUES
(1, 1, 'Thang Máy Tốc Độ Cao', 'elevator'),
(2, 1, 'Khóa Cổng Vân Tay & FaceID', 'fingerprint'),
(3, 1, 'Camera An Ninh 24/7', 'camera'),
(4, 1, 'Nhà Để Xe Có Bảo Vệ', 'parking'),
(5, 2, 'Khóa Cổng Vân Tay', 'fingerprint'),
(6, 2, 'Camera An Ninh 24/7', 'camera'),
(7, 3, 'Thang Máy Thẻ Từ', 'elevator'),
(8, 3, 'Bảo Vệ Túc Trực 24/7', 'shield'),
(9, 3, 'Hệ Thống PCCC Tự Động', 'flame');

INSERT INTO `buildings` (`id`, `boarding_house_id`, `name`) VALUES
(1, 1, 'Tòa A Cầu Giấy'),
(2, 2, 'Tòa B Bách Khoa'),
(3, 3, 'Tòa C Đống Đa');

INSERT INTO `floors` (`id`, `building_id`, `floor_number`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 3),
(4, 1, 4),
(5, 2, 1),
(6, 2, 2),
(7, 2, 3),
(8, 2, 4),
(9, 3, 1),
(10, 3, 2),
(11, 3, 3),
(12, 3, 4),
(13, 3, 5),
(14, 3, 6);

-- Cơ sở 1: Cầu Giấy (12 phòng, ID: 101 - 112)
INSERT INTO `rooms` (`id`, `floor_id`, `room_number`, `base_price`, `area`, `max_occupants`, `status`) VALUES
(101, 1, 'P.101', 3500000, 25.0, 2, 'OCCUPIED'),
(102, 1, 'P.102', 3800000, 28.0, 3, 'AVAILABLE'),
(103, 1, 'P.103', 3200000, 22.0, 2, 'OCCUPIED'),
(104, 2, 'P.201', 3600000, 25.0, 2, 'OCCUPIED'),
(105, 2, 'P.202', 3500000, 25.0, 2, 'MAINTENANCE'),
(106, 2, 'P.203', 4000000, 30.0, 3, 'AVAILABLE'),
(107, 3, 'P.301', 3700000, 26.0, 2, 'OCCUPIED'),
(108, 3, 'P.302', 3700000, 26.0, 2, 'OCCUPIED'),
(109, 3, 'P.303', 3900000, 28.0, 2, 'OCCUPIED'),
(110, 4, 'P.401', 3800000, 27.0, 2, 'OCCUPIED'),
(111, 4, 'P.402', 3800000, 27.0, 2, 'OCCUPIED'),
(112, 4, 'P.403', 3800000, 28.0, 2, 'OCCUPIED');

-- Cơ sở 2: Bách Khoa (8 phòng, ID: 201 - 208)
INSERT INTO `rooms` (`id`, `floor_id`, `room_number`, `base_price`, `area`, `max_occupants`, `status`) VALUES
(201, 5, 'P.101', 2800000, 20.0, 2, 'OCCUPIED'),
(202, 5, 'P.102', 3000000, 22.0, 2, 'AVAILABLE'),
(203, 6, 'P.201', 3200000, 24.0, 2, 'OCCUPIED'),
(204, 6, 'P.202', 3200000, 24.0, 2, 'OCCUPIED'),
(205, 7, 'P.301', 3400000, 26.0, 3, 'AVAILABLE'),
(206, 7, 'P.302', 3400000, 26.0, 3, 'AVAILABLE'),
(207, 8, 'P.401', 3600000, 28.0, 2, 'OCCUPIED'),
(208, 8, 'P.402', 3600000, 28.0, 2, 'OCCUPIED');

-- Cơ sở 3: Đống Đa (16 phòng, ID: 301 - 316)
INSERT INTO `rooms` (`id`, `floor_id`, `room_number`, `base_price`, `area`, `max_occupants`, `status`) VALUES
(301, 9, 'P.101', 4200000, 30.0, 2, 'OCCUPIED'),
(302, 9, 'P.102', 4500000, 32.0, 3, 'OCCUPIED'),
(303, 10, 'P.201', 4300000, 30.0, 2, 'OCCUPIED'),
(304, 10, 'P.202', 4300000, 30.0, 2, 'MAINTENANCE'),
(305, 10, 'P.203', 4400000, 31.0, 2, 'OCCUPIED'),
(306, 11, 'P.301', 4600000, 32.0, 2, 'OCCUPIED'),
(307, 11, 'P.302', 4800000, 34.0, 3, 'AVAILABLE'),
(308, 11, 'P.303', 4600000, 32.0, 2, 'OCCUPIED'),
(309, 12, 'P.401', 4500000, 30.0, 2, 'OCCUPIED'),
(310, 12, 'P.402', 4500000, 30.0, 2, 'OCCUPIED'),
(311, 12, 'P.403', 4600000, 31.0, 2, 'OCCUPIED'),
(312, 13, 'P.501', 4700000, 33.0, 2, 'OCCUPIED'),
(313, 13, 'P.502', 4700000, 33.0, 2, 'OCCUPIED'),
(314, 13, 'P.503', 4800000, 34.0, 2, 'OCCUPIED'),
(315, 14, 'P.601', 5000000, 38.0, 3, 'OCCUPIED'),
(316, 14, 'P.602', 5200000, 40.0, 3, 'OCCUPIED');

INSERT INTO `amenities` (`id`, `name`, `icon`) VALUES
(1, 'WiFi Tốc Độ Cao', 'wifi'),
(2, 'Điều Hòa Inverter', 'wind'),
(3, 'Bình Nóng Lạnh', 'flame'),
(4, 'Tủ Lạnh', 'refrigerator'),
(5, 'Máy Giặt', 'washing-machine'),
(6, 'Ban Công Thoáng', 'sun'),
(7, 'Thang Máy Thẻ Từ', 'elevator'),
(8, 'Khóa Cửa Vân Tay', 'fingerprint');

INSERT INTO `room_amenities` (`room_id`, `amenity_id`) VALUES
(101, 1), (101, 2), (101, 3),
(102, 1), (102, 2), (102, 3), (102, 6),
(103, 1), (103, 3),
(104, 1), (104, 2), (104, 3),
(105, 1), (105, 2), (105, 3),
(106, 1), (106, 2), (106, 3), (106, 4),
(107, 1), (107, 2), (107, 3),
(201, 1), (201, 3),
(202, 1), (202, 2), (202, 3),
(301, 1), (301, 2), (301, 3), (301, 7), (301, 8),
(307, 1), (307, 2), (307, 3), (307, 4), (307, 5), (307, 7);

INSERT INTO `house_service_configs` (`id`, `boarding_house_id`, `service_name`, `calculation_type`, `unit_price`, `is_active`) VALUES
(1, 1, 'Tiền điện', 'METER', 3500.00, TRUE),
(2, 1, 'Tiền nước', 'METER', 25000.00, TRUE),
(3, 1, 'Phí vệ sinh & rác', 'PER_ROOM', 50000.00, TRUE),
(4, 1, 'Internet Cáp quang', 'PER_ROOM', 100000.00, TRUE),
(5, 1, 'Phí gửi xe máy', 'PER_CAPITA', 80000.00, TRUE),
(6, 2, 'Tiền điện', 'METER', 3800.00, TRUE),
(7, 2, 'Tiền nước', 'PER_CAPITA', 100000.00, TRUE),
(8, 2, 'Phí vệ sinh & rác', 'PER_ROOM', 40000.00, TRUE),
(9, 2, 'Internet Cáp quang', 'PER_ROOM', 80000.00, TRUE),
(10, 3, 'Tiền điện', 'METER', 4000.00, TRUE),
(11, 3, 'Tiền nước', 'METER', 30000.00, TRUE),
(12, 3, 'Phí dịch vụ thang máy & rác', 'PER_ROOM', 150000.00, TRUE);


-- ------------------------------------------------------------------------------
-- 3. SEED DATA: TENANT_DB
-- ------------------------------------------------------------------------------
USE `tenant_db`;

INSERT INTO `tenants` (`id`, `user_id`, `full_name`, `identity_card`, `birth_date`, `gender`, `phone`, `email`, `hometown`, `address`, `status`) VALUES
(1, 5, 'Nguyễn Văn An', '001201012345', '2001-05-12', 'MALE', '0987654321', 'an.nguyen@rental.vn', 'Nam Định', 'Xã Hải Phương, Huyện Hải Hậu, Nam Định', 'ACTIVE'),
(2, 6, 'Trần Thị Bình', '001202023456', '2002-08-20', 'FEMALE', '0978123456', 'binh.tt@gmail.com', 'Hà Nam', 'Phường Lê Hồng Phong, TP Phủ Lý, Hà Nam', 'ACTIVE'),
(3, 7, 'Phạm Minh Cường', '034203034567', '1999-11-03', 'MALE', '0912888999', 'cuong.pm@gmail.com', 'Hải Phòng', 'Quận Lê Chân, Hải Phòng', 'ACTIVE'),
(4, 8, 'Vũ Hoàng Dũng', '025204045678', '2000-02-17', 'MALE', '0945678901', 'dung.vh@gmail.com', 'Thái Bình', 'Huyện Tiền Hải, Thái Bình', 'ACTIVE'),
(5, NULL, 'Lê Văn Khang', '038206067890', '2001-12-30', 'MALE', '0967890123', 'khang.lv@gmail.com', 'Nghệ An', 'TP Vinh, Nghệ An', 'INACTIVE'),
(6, NULL, 'Đỗ Thị Mai', '019205056789', '2003-09-25', 'FEMALE', '0934567890', 'mai.dt@gmail.com', 'Bắc Ninh', 'TP Từ Sơn, Bắc Ninh', 'INACTIVE'),
(7, NULL, 'Hoàng Văn Nam', '036207078901', '2002-03-14', 'MALE', '0966123456', 'nam.hv@gmail.com', 'Thanh Hóa', 'TP Thanh Hóa', 'ACTIVE');

INSERT INTO `room_members` (`id`, `room_id`, `tenant_id`, `contract_id`, `role_in_room`, `join_date`, `temporary_residence_status`, `status`) VALUES
(1, 101, 1, 1, 'REPRESENTATIVE', '2026-01-01', 'REGISTERED', 'ACTIVE'),
(2, 102, 2, 2, 'REPRESENTATIVE', '2026-02-15', 'REGISTERED', 'ACTIVE'),
(3, 103, 3, 3, 'REPRESENTATIVE', '2026-03-10', 'REGISTERED', 'ACTIVE'),
(4, 104, 4, 4, 'REPRESENTATIVE', '2026-04-01', 'REGISTERED', 'ACTIVE'),
(5, 201, 7, 5, 'REPRESENTATIVE', '2026-05-01', 'REGISTERED', 'ACTIVE');

INSERT INTO `roommate_requests` (`id`, `room_id`, `requested_by_tenant_id`, `full_name`, `identity_card`, `phone`, `birth_date`, `gender`, `hometown`, `cccd_front_url`, `cccd_back_url`, `status`, `rejection_reason`, `created_at`, `reviewed_at`) VALUES
(1, 101, 1, 'Đặng Tuấn Anh', '001202008899', '0977888999', '2002-05-15', 'MALE', 'Thái Bình', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600', 'PENDING', NULL, '2026-10-02 10:30:00', NULL);


-- ------------------------------------------------------------------------------
-- 4. SEED DATA: CONTRACT_DB
-- ------------------------------------------------------------------------------
USE `contract_db`;

INSERT INTO `contracts` (`id`, `contract_code`, `tenant_id`, `room_id`, `start_date`, `end_date`, `rental_price`, `deposit_amount`, `payment_cycle`, `payment_day`, `terms`, `status`, `deposit_paid`, `deposit_paid_at`, `deposit_payment_method`, `signed_electronically`, `signed_at`) VALUES
(1, 'HD-2026-001', 1, 101, '2026-01-01', '2026-12-31', 3500000.00, 3500000.00, 1, 5, 'Bên thuê có trách nhiệm thanh toán tiền nhà đúng hạn từ mùng 1 đến mùng 5 hàng tháng. Giữ gìn an ninh trật tự, tiết kiệm điện nước và tuân thủ tuyệt đối quy định PCCC.', 'ACTIVE', TRUE, '2026-01-01 09:30:00', 'VIETQR', TRUE, '2026-01-01 09:30:00'),
(2, 'HD-2026-002', 2, 102, '2026-02-15', '2027-02-15', 3800000.00, 3800000.00, 1, 5, 'Hợp đồng thuê phòng 12 tháng. Tiền cọc tương đương 1 tháng tiền phòng. Hoàn trả cọc sau khi thanh lý phòng đầy đủ.', 'ACTIVE', TRUE, '2026-02-15 10:00:00', 'VIETQR', TRUE, '2026-02-15 10:00:00'),
(3, 'HD-2026-003', 3, 103, '2026-03-10', '2027-03-10', 3200000.00, 3200000.00, 1, 5, 'Hợp đồng thuê phòng 12 tháng tại P.103 Cơ Sở 1 Cầu Giấy. Giữ gìn tài sản chung.', 'ACTIVE', TRUE, '2026-03-10 14:00:00', 'VIETQR', TRUE, '2026-03-10 14:00:00'),
(4, 'HD-2026-004', 4, 104, '2026-04-01', '2027-04-01', 3600000.00, 3600000.00, 1, 5, 'Hợp đồng thuê phòng P.201 Tòa A Cầu Giấy.', 'ACTIVE', TRUE, '2026-04-01 09:00:00', 'VIETQR', TRUE, '2026-04-01 09:00:00'),
(5, 'HD-2026-005', 7, 201, '2026-05-01', '2027-05-01', 2800000.00, 2800000.00, 1, 5, 'Hợp đồng thuê phòng sinh viên Bách Khoa.', 'ACTIVE', TRUE, '2026-05-01 08:30:00', 'CASH', TRUE, '2026-05-01 08:30:00');

INSERT INTO `move_out_settlements` (`id`, `contract_id`, `room_id`, `tenant_id`, `move_out_date`, `reason`, `original_deposit`, `unpaid_utilities_fee`, `damage_fee`, `damage_description`, `refund_amount`, `bank_account`, `bank_name`, `account_holder`, `refund_status`, `settled_at`, `created_at`) VALUES
(1, 3, 103, 3, '2026-10-05', 'Hết hạn hợp đồng, chuyển công tác vào TP. Hồ Chí Minh', 3200000.00, 245000.00, 0.00, 'Không hư hại thiết bị, bàn giao đầy đủ 2 chìa khóa và thẻ thang máy', 2955000.00, '1903456789012', 'Techcombank', 'PHAM MINH CUONG', 'PENDING', '2026-10-03 16:30:00', '2026-10-01 09:00:00');

INSERT INTO `room_requests` (`id`, `type`, `contract_id`, `tenant_id`, `target_room_id`, `current_room_id`, `duration_months`, `note`, `forfeit_deposit`, `status`, `created_at`) VALUES
(1, 'ROOMMATE', 3, 7, 103, NULL, NULL, 'Em là sinh viên năm 3 Bách Khoa, muốn tìm bạn ở ghép chia đôi tiền phòng, giữ vệ sinh tốt.', FALSE, 'WAITING_ROOMMATES', '2026-09-24 14:00:00'),
(2, 'TRANSFER', 1, 1, 106, 101, NULL, 'Em muốn đổi từ P.101 lên P.203 từ tháng sau vì tầng 2 có ban công thoáng mát hơn.', FALSE, 'PENDING', '2026-09-24 15:30:00'),
(3, 'CHECKOUT', 1, 1, 101, 101, NULL, 'Em có việc gia đình đột xuất phải về quê, chấp nhận mất cọc theo quy chế để xin trả phòng sớm.', TRUE, 'PENDING', '2026-09-25 09:00:00'),
(4, 'RENEW_CONTRACT', 1, 1, 101, 101, 6, 'Em muốn đăng ký gia hạn tiếp hợp đồng 6 tháng (từ 01/01/2027 đến 01/07/2027).', FALSE, 'PENDING', '2026-09-25 10:15:00');


-- ------------------------------------------------------------------------------
-- 5. SEED DATA: METER_DB
-- ------------------------------------------------------------------------------
USE `meter_db`;

INSERT INTO `meters` (`id`, `room_id`, `meter_type`, `serial_number`, `initial_reading`, `status`) VALUES
(1, 101, 'ELECTRICITY', 'EM-CG01-101', 800.0, 'ACTIVE'),
(2, 101, 'WATER', 'WM-CG01-101', 40.0, 'ACTIVE'),
(3, 102, 'ELECTRICITY', 'EM-CG01-102', 910.0, 'ACTIVE'),
(4, 102, 'WATER', 'WM-CG01-102', 46.0, 'ACTIVE'),
(5, 103, 'ELECTRICITY', 'EM-CG01-103', 1020.0, 'ACTIVE'),
(6, 103, 'WATER', 'WM-CG01-103', 52.0, 'ACTIVE'),
(7, 104, 'ELECTRICITY', 'EM-CG01-201', 1130.0, 'ACTIVE'),
(8, 104, 'WATER', 'WM-CG01-201', 58.0, 'ACTIVE');

-- Số liệu chốt công tơ Tháng 09/2026:
-- P.101: điện cũ 800, mới 868 (tiêu thụ 68 kWh); nước cũ 40, mới 46 (tiêu thụ 6 m3)
-- P.102: điện cũ 910, mới 986 (tiêu thụ 76 kWh); nước cũ 46, mới 53 (tiêu thụ 7 m3)
-- P.103: điện cũ 1020, mới 1104 (tiêu thụ 84 kWh); nước cũ 52, mới 60 (tiêu thụ 8 m3)
-- P.104: điện cũ 1130, mới 1210 (tiêu thụ 80 kWh); nước cũ 58, mới 66 (tiêu thụ 8 m3)
INSERT INTO `meter_readings` (`id`, `room_id`, `reading_date`, `reading_type`, `recorded_month`, `recorded_year`, `old_electricity`, `new_electricity`, `old_water`, `new_water`, `image_evidence_url`, `recorded_by`, `status`) VALUES
(1, 101, '2026-09-30', 'MONTHLY', 9, 2026, 800.0, 868.0, 40.0, 46.0, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600', 'STAFF', 'CONFIRMED'),
(2, 102, '2026-09-30', 'MONTHLY', 9, 2026, 910.0, 986.0, 46.0, 53.0, 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600', 'STAFF', 'DISPUTED'),
(3, 103, '2026-09-30', 'MONTHLY', 9, 2026, 1020.0, 1104.0, 52.0, 60.0, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600', 'STAFF', 'CONFIRMED'),
(4, 104, '2026-09-30', 'MONTHLY', 9, 2026, 1130.0, 1210.0, 58.0, 66.0, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600', 'AUTO_AI', 'CONFIRMED');

INSERT INTO `meter_disputes` (`id`, `room_id`, `tenant_id`, `recorded_period`, `meter_type`, `system_reading`, `reported_reading`, `note`, `image_url`, `status`, `created_at`) VALUES
(1, 102, 2, '2026-09', 'WATER', 53.0, 48.0, 'Em kiểm tra đồng hồ nước thực tế ở cửa phòng chỉ mới nhảy 48 m3, trên app báo 53 m3. Nhờ chủ trọ kiểm tra lại giúp em ạ.', 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600', 'PENDING', '2026-09-26 11:00:00');


-- ------------------------------------------------------------------------------
-- 6. SEED DATA: BILLING_DB
-- ------------------------------------------------------------------------------
USE `billing_db`;

-- Hóa đơn tiền trọ tháng 09/2026 khớp số liệu chỉ số điện nước
INSERT INTO `invoices` (`id`, `invoice_code`, `contract_id`, `room_id`, `tenant_id`, `month`, `year`, `room_fee`, `electricity_fee`, `water_fee`, `service_fee`, `discount`, `total_amount`, `status`, `due_date`, `paid_at`) VALUES
(1, 'HD-202609-01', 1, 101, 1, 9, 2026, 3500000.00, 238000.00, 150000.00, 100000.00, 0.00, 3988000.00, 'UNPAID', '2026-10-05', NULL),
(2, 'HD-202609-02', 2, 102, 2, 9, 2026, 3800000.00, 266000.00, 175000.00, 100000.00, 0.00, 4341000.00, 'UNPAID', '2026-10-05', NULL),
(3, 'HD-202609-03', 3, 103, 3, 9, 2026, 3200000.00, 294000.00, 200000.00, 100000.00, 0.00, 3794000.00, 'PAID', '2026-10-05', '2026-09-07 14:20:00'),
(4, 'HD-202609-04', 4, 104, 4, 9, 2026, 3600000.00, 0.00, 0.00, 100000.00, 0.00, 3700000.00, 'PENDING_METER', '2026-10-05', NULL),
(5, 'HD-202609-05', 5, 201, 7, 9, 2026, 2800000.00, 210000.00, 150000.00, 80000.00, 0.00, 3240000.00, 'PAID', '2026-10-05', '2026-09-05 09:15:00');

INSERT INTO `invoice_items` (`id`, `invoice_id`, `item_name`, `quantity`, `unit_price`, `amount`) VALUES
(1, 1, 'Tiền thuê phòng P.101', 1, 3500000.00, 3500000.00),
(2, 1, 'Tiền điện (68 kWh)', 68, 3500.00, 238000.00),
(3, 1, 'Tiền nước (6 m3)', 6, 25000.00, 150000.00),
(4, 1, 'Internet & Phí vệ sinh', 1, 100000.00, 100000.00),
(5, 2, 'Tiền thuê phòng P.102', 1, 3800000.00, 3800000.00),
(6, 2, 'Tiền điện (76 kWh)', 76, 3500.00, 266000.00),
(7, 2, 'Tiền nước (7 m3)', 7, 25000.00, 175000.00),
(8, 2, 'Internet & Phí vệ sinh', 1, 100000.00, 100000.00),
(9, 3, 'Tiền thuê phòng P.103', 1, 3200000.00, 3200000.00),
(10, 3, 'Tiền điện (84 kWh)', 84, 3500.00, 294000.00),
(11, 3, 'Tiền nước (8 m3)', 8, 25000.00, 200000.00),
(12, 3, 'Internet & Phí vệ sinh', 1, 100000.00, 100000.00);

-- Hóa đơn thu phí bản quyền gói SaaS của Chủ trọ nộp cho Nền tảng
INSERT INTO `saas_invoices` (`id`, `code`, `landlord_id`, `package_name`, `package_code`, `billing_cycle`, `period`, `amount`, `status`, `due_date`, `paid_at`, `payment_method`, `vat_number`, `landlord_tax_code`) VALUES
(1, 'HD-SAAS-2026-01', 2, 'Gói Chuyên Nghiệp (PRO - Không Giới Hạn Cơ Sở)', 'PRO', '12 Tháng (Năm 2026)', '01/01/2026 - 31/12/2026', 4990000.00, 'PAID', '2026-01-10', '2026-01-02 10:15:20', 'VietQR Chuyển Khoản Nền Tảng (Tự Động Gạch Nợ)', 'VAT-0108998877-001', '8392019482'),
(2, 'HD-SAAS-2026-02', 3, 'Gói Cơ Bản (BASIC - Quản lý 10 phòng)', 'BASIC', '12 Tháng (Năm 2026)', '15/02/2026 - 15/02/2027', 1910400.00, 'UNPAID', '2026-02-25', NULL, 'Cổng VietQR Nền Tảng', NULL, '8392019284');


-- ------------------------------------------------------------------------------
-- 7. SEED DATA: PAYMENT_DB
-- ------------------------------------------------------------------------------
USE `payment_db`;

INSERT INTO `payments` (`id`, `invoice_id`, `saas_invoice_id`, `payment_code`, `amount`, `payment_method`, `transaction_ref`, `bank_code`, `status`, `payment_time`, `note`) VALUES
(1, 3, NULL, 'PAY-202609-001', 3794000.00, 'VIETQR', 'FT2609071420988', 'MBBANK', 'SUCCESS', '2026-09-07 14:20:00', 'Thanh toan tien phong P.103 thang 9'),
(2, 5, NULL, 'PAY-202609-002', 3240000.00, 'CASH', 'CASH-REC-2026-05', 'TIEN_MAT', 'SUCCESS', '2026-09-05 09:15:00', 'Thu tien mat truc tiep tai quay quan ly'),
(3, NULL, 1, 'PAY-SAAS-2026-01', 4990000.00, 'VIETQR', 'SAAS26010210158', 'MBBANK', 'SUCCESS', '2026-01-02 10:15:20', 'Thanh toan goi cuoc SaaS PRO chu tro Le Thi Thu Ngan');

INSERT INTO `payment_gateways_config` (`id`, `gateway_name`, `is_active`, `merchant_id`, `access_key`, `secret_key`, `endpoint_url`, `extra_config`) VALUES
(1, 'VNPAY', TRUE, 'RENTAL2026VN', 'RENTAL01', '8F9A4E2B1C7D0E5F8A3B2C1D4E5F6A7B', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', '{"tmnCode": "RENTAL01", "version": "2.1.0"}'),
(2, 'MOMO', TRUE, 'MOMO_RENTAL_PARTNER', 'F8B7C9D2E1A4', 'kL9@mN2#pQ5$rT8^vW1*', 'https://test-payment.momo.vn/v2/gateway/api/create', '{"partnerName": "Quan Ly Tro Viet"}'),
(3, 'SEPAY', TRUE, 'SEPAY_RENTAL_MERCHANT', 'SPY_KEY_2026_LIVE', 'SPY_SEC_9876543210', 'https://my.sepay.vn/userapi', '{"bankAccount": "9999888899", "bankName": "MBBank"}'),
(4, 'AI_OCR', TRUE, 'OPENAI_VISION', 'sk-proj-rental-ocr-2026-***active', 'sk-proj-rental-ocr-2026-***active', 'https://api.openai.com/v1/chat/completions', '{"model": "gpt-4o", "confidenceThreshold": 95}'),
(5, 'SMTP', TRUE, 'noreply.rental.saas@gmail.com', 'noreply.rental.saas@gmail.com', 'app_password_rental_smtp', 'smtp.gmail.com', '{"port": 587, "authType": "TLS"}'),
(6, 'SMS_OTP', TRUE, 'NHATRO_VN', 'VIETTEL_SMS_CLIENT', 'VIETTEL_SMS_SECRET', 'https://api.vietteltelecom.vn/sms/v1', '{"balanceRemaining": 15400}');


-- ------------------------------------------------------------------------------
-- 8. SEED DATA: MAINTENANCE_DB
-- ------------------------------------------------------------------------------
USE `maintenance_db`;

INSERT INTO `maintenance_requests` (`id`, `ticket_code`, `room_id`, `tenant_id`, `category`, `title`, `description`, `image_url`, `priority`, `status`, `cost`, `assigned_to`, `created_at`, `resolved_at`) VALUES
(1, 'SC-2026-001', 102, 2, 'WATER', 'Hỏng vòi sen nhà tắm bị rò rỉ nước', 'Vòi sen nhà tắm bị rò nước liên tục ở khớp nối van khóa, áp lực nước phun yếu.', 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600', 'HIGH', 'IN_PROGRESS', 150000.00, 'Thợ nước Nguyễn Tuấn', '2026-09-20 08:30:00', NULL),
(2, 'SC-2026-002', 105, 4, 'ELECTRICITY', 'Điều hòa không lạnh, có tiếng kêu to', 'Bật 18 độ nhưng quạt gió kêu rè rè không phả ra hơi lạnh sau 30 phút.', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600', 'HIGH', 'PENDING', 0.00, NULL, '2026-09-21 09:15:00', NULL),
(3, 'SC-2026-003', 107, 6, 'ELECTRICITY', 'Bóng đèn tuýp ban công bị cháy', 'Bóng đèn tuýp LED ban công bị chớp nháy rồi tắt hẳn.', 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600', 'LOW', 'RESOLVED', 60000.00, 'Bảo vệ Trần Văn Mạnh', '2026-09-18 10:00:00', '2026-09-19 14:00:00'),
(4, 'SC-2026-004', 101, 1, 'FURNITURE', 'Cửa sổ ban công bị kẹt khóa', 'Tay nắm cửa sổ bị gãy then gài, không khép chặt được khi trời mưa.', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600', 'MEDIUM', 'RESOLVED', 80000.00, 'Thợ cơ khí Lê Văn Tuấn', '2026-09-15 14:20:00', '2026-09-16 11:00:00'),
(5, 'SC-2026-005', 103, 3, 'WATER', 'Áp lực nước vòi sen yếu vào giờ cao điểm', 'Khoảng 18h - 20h tối nước tắm chảy chậm, ban ngày thì chảy bình thường.', NULL, 'LOW', 'IN_PROGRESS', 0.00, 'Kỹ thuật tòa nhà', '2026-09-22 19:40:00', NULL);

INSERT INTO `maintenance_logs` (`id`, `request_id`, `actor_username`, `action`, `notes`, `created_at`) VALUES
(1, 1, 'staff', 'ASSIGNED', 'Đã phân công thợ nước kiểm tra và mang theo cụm vòi sen mới', '2026-09-20 09:00:00'),
(2, 3, 'staff', 'RESOLVED', 'Đã thay mới bóng tuýp LED Rạng Đông 1.2m bảo hành 12 tháng', '2026-09-19 14:00:00'),
(3, 4, 'staff', 'RESOLVED', 'Đã sửa lại bản lề và lắp then gài inox chắc chắn', '2026-09-16 11:00:00');


-- ------------------------------------------------------------------------------
-- 9. SEED DATA: REPORT_DB
-- ------------------------------------------------------------------------------
USE `report_db`;

INSERT INTO `monthly_revenue_reports` (`id`, `boarding_house_id`, `month`, `year`, `total_revenue`, `total_expense`, `net_profit`, `occupancy_rate`, `occupied_rooms`, `total_rooms`, `generated_at`) VALUES
(1, 1, 9, 2026, 44250000.00, 4800000.00, 39450000.00, 83.33, 10, 12, '2026-10-01 00:00:00'),
(2, 2, 9, 2026, 26800000.00, 3200000.00, 23600000.00, 75.00, 6, 8, '2026-10-01 00:00:00'),
(3, 3, 9, 2026, 68500000.00, 8500000.00, 60000000.00, 87.50, 14, 16, '2026-10-01 00:00:00');

INSERT INTO `revenue_records` (`id`, `boarding_house_id`, `category`, `record_type`, `amount`, `description`, `record_date`) VALUES
(1, 1, 'ROOM_RENT', 'INCOME', 35000000.00, 'Doanh thu tien thue phong thang 9 CS-01', '2026-09-30'),
(2, 1, 'UTILITIES', 'INCOME', 9250000.00, 'Tien dien nuoc internet thuc thu thang 9', '2026-09-30'),
(3, 1, 'MAINTENANCE_FEE', 'EXPENSE', 1800000.00, 'Chi phi sua chua dien nuoc & thay linh kien', '2026-09-25'),
(4, 1, 'MANAGEMENT_FEE', 'EXPENSE', 3000000.00, 'Tien thu gom rac & ve sinh hanh lang', '2026-09-28');

INSERT INTO `room_occupancy_metrics` (`id`, `boarding_house_id`, `record_date`, `total_rooms`, `occupied_rooms`, `available_rooms`, `maintenance_rooms`, `occupancy_rate`) VALUES
(1, 1, '2026-09-30', 12, 10, 1, 1, 83.33),
(2, 2, '2026-09-30', 8, 6, 2, 0, 75.00),
(3, 3, '2026-09-30', 16, 14, 1, 1, 87.50);


-- ------------------------------------------------------------------------------
-- 10. SEED DATA: NOTIFICATION_DB
-- ------------------------------------------------------------------------------
USE `notification_db`;

INSERT INTO `notifications` (`id`, `user_id`, `title`, `content`, `type`, `channel`, `is_read`, `sent_at`) VALUES
(1, 5, 'Thông báo phát hành hóa đơn Tháng 09/2026', 'Hóa đơn tiền phòng P.101 kỳ 2026-09 đã được phát hành với tổng số tiền 3.988.000 đ. Vui lòng thanh toán trước ngày 05/10/2026.', 'INVOICE', 'IN_APP', FALSE, '2026-10-01 08:00:00'),
(2, 6, 'Thông báo phát hành hóa đơn Tháng 09/2026', 'Hóa đơn tiền phòng P.102 kỳ 2026-09 đã được phát hành với tổng số tiền 4.341.000 đ. Bạn có thể quét mã VietQR để thanh toán tự động.', 'INVOICE', 'IN_APP', FALSE, '2026-10-01 08:00:00'),
(3, 5, 'Tiếp nhận yêu cầu đổi phòng', 'Yêu cầu chuyển phòng từ P.101 lên P.203 của bạn đã được gửi tới Ban Quản Lý và đang chờ xét duyệt.', 'CONTRACT', 'IN_APP', TRUE, '2026-09-24 15:35:00'),
(4, 6, 'Phiếu bảo trì đang được xử lý', 'Sự cố "Hỏng vòi sen nhà tắm" của phòng bạn đã được phân công thợ nước kiểm tra.', 'MAINTENANCE', 'IN_APP', TRUE, '2026-09-20 09:05:00');

INSERT INTO `notification_templates` (`id`, `template_code`, `subject`, `body_template`, `channel`) VALUES
(1, 'TPL_INVOICE_ISSUED', 'Thông báo phát hành hóa đơn tiền phòng kỳ {{month}}/{{year}}', 'Kính gửi Quý cư dân {{fullName}}, Hóa đơn phòng {{roomNumber}} số tiền {{totalAmount}} đ đã được phát hành.', 'EMAIL'),
(2, 'TPL_OTP_RESET', 'Mã xác thực OTP đặt lại mật khẩu', 'Ma OTP xac thuc tai khoan Nha Tro cua ban la: {{otpCode}}. Ma co hieu luc trong 5 phut.', 'SMS');


-- ------------------------------------------------------------------------------
-- 11. SEED DATA: AI_DB
-- ------------------------------------------------------------------------------
USE `ai_db`;

INSERT INTO `ai_ocr_logs` (`id`, `room_id`, `image_url`, `raw_result_json`, `detected_electricity`, `detected_water`, `confidence_score`, `created_at`) VALUES
(1, 101, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600', '{"meter_type": "ELECTRICITY", "model": "GPT-4o-Vision", "digits": "00868", "confidence": 0.985}', 868.0, NULL, 98.5, '2026-09-30 08:15:00'),
(2, 104, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600', '{"meter_type": "ELECTRICITY", "model": "GPT-4o-Vision", "digits": "01210", "confidence": 0.962}', 1210.0, NULL, 96.2, '2026-09-30 08:45:00');

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- HOÀN TẤT THIẾT LẬP CƠ SỞ DỮ LIỆU MICROSERVICES ĐẦY ĐỦ VÀ CHUẨN XÁC 100%
-- ==============================================================================
