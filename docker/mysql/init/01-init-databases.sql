-- ==========================================================
-- SCRIPT KHỞI TẠO CÁC DATABASE ĐỘC LẬP CHO TỪNG MICROSERVICE
-- NGUYÊN TẮC: Database per Service, KHÔNG FOREIGN KEY CHÉO
-- ==========================================================

-- 1. Database cho Auth & User Service
CREATE DATABASE IF NOT EXISTS `auth_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Database cho Property & Room Service
CREATE DATABASE IF NOT EXISTS `property_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `room_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `tenant_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Database cho Contract & Lease Service
CREATE DATABASE IF NOT EXISTS `contract_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Database cho Utility & Meter Service
CREATE DATABASE IF NOT EXISTS `utility_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `meter_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Database cho Billing & Invoice Service
CREATE DATABASE IF NOT EXISTS `billing_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. Database cho Payment Service
CREATE DATABASE IF NOT EXISTS `payment_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 7. Database cho Maintenance & Incident Service
CREATE DATABASE IF NOT EXISTS `maintenance_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 8. Database cho Notification Service
CREATE DATABASE IF NOT EXISTS `notification_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 9. Database cho Report Service
CREATE DATABASE IF NOT EXISTS `report_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Phân quyền cho user kết nối
GRANT ALL PRIVILEGES ON `auth_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `property_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `room_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `tenant_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `contract_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `utility_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `meter_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `billing_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `payment_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `maintenance_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `notification_db`.* TO 'rental_user'@'%';
GRANT ALL PRIVILEGES ON `report_db`.* TO 'rental_user'@'%';

FLUSH PRIVILEGES;


