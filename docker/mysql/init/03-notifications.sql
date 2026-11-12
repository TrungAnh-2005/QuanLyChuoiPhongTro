USE notification_db;
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


