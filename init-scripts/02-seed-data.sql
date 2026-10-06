-- Copy of seed data in init-scripts
-- 1. AUTH_DB (Tài khoản người dùng)
USE `auth_db`;

INSERT IGNORE INTO `roles` (`id`, `name`) VALUES 
(1, 'ROLE_ADMIN'),
(2, 'ROLE_STAFF'),
(3, 'ROLE_TENANT');

INSERT IGNORE INTO `users` (`id`, `username`, `email`, `password`, `full_name`, `phone`, `status`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@example.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'Quản Trị Viên Chuỗi Nhà Trọ', '0901000001', 'ACTIVE', NOW(), NOW()),
(2, 'staff', 'staff@example.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'Nhân Viên Vận Hành Chi Nhánh', '0901000002', 'ACTIVE', NOW(), NOW()),
(3, 'tenant', 'tenant@example.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'Nguyễn Văn Khách Thuê', '0901000003', 'ACTIVE', NOW(), NOW());

INSERT IGNORE INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1),
(2, 2),
(3, 3);

-- 2. ROOM_DB
USE `room_db`;

INSERT IGNORE INTO `boarding_houses` (`id`, `name`, `address`, `manager_phone`, `created_at`, `updated_at`) VALUES
(1, 'Nhà Trọ Cầu Giấy - Cơ Sở 1', 'Số 45, Ngõ 165 Cầu Giấy, Cầu Giấy, Hà Nội', '0912888666', NOW(), NOW()),
(2, 'Nhà Trọ Bách Khoa - Cơ Sở 2', 'Số 18, Ngõ Tự Do, Hai Bà Trưng, Hà Nội', '0988777999', NOW(), NOW()),
(3, 'Nhà Trọ Đống Đa - Cơ Sở 3', 'Số 92, Phố Chùa Láng, Đống Đa, Hà Nội', '0936555222', NOW(), NOW());

INSERT IGNORE INTO `buildings` (`id`, `boarding_house_id`, `name`, `created_at`, `updated_at`) VALUES
(1, 1, 'Tòa A Cầu Giấy', NOW(), NOW()),
(2, 2, 'Tòa B Bách Khoa', NOW(), NOW()),
(3, 3, 'Tòa C Đống Đa', NOW(), NOW());

INSERT IGNORE INTO `floors` (`id`, `building_id`, `floor_number`, `created_at`, `updated_at`) VALUES
(1, 1, 1, NOW(), NOW()),
(2, 1, 2, NOW(), NOW()),
(3, 1, 3, NOW(), NOW()),
(4, 2, 1, NOW(), NOW()),
(5, 2, 2, NOW(), NOW()),
(6, 3, 1, NOW(), NOW()),
(7, 3, 2, NOW(), NOW());

INSERT IGNORE INTO `rooms` (`id`, `floor_id`, `room_number`, `base_price`, `area`, `max_occupants`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'P.101', 3500000, 25.0, 2, 'OCCUPIED', NOW(), NOW()),
(2, 1, 'P.102', 3800000, 28.0, 3, 'AVAILABLE', NOW(), NOW()),
(3, 1, 'P.103', 3200000, 22.0, 2, 'OCCUPIED', NOW(), NOW()),
(4, 2, 'P.201', 3600000, 25.0, 2, 'OCCUPIED', NOW(), NOW()),
(5, 2, 'P.202', 3500000, 25.0, 2, 'MAINTENANCE', NOW(), NOW()),
(6, 2, 'P.203', 4000000, 30.0, 3, 'AVAILABLE', NOW(), NOW()),
(7, 3, 'P.301', 4200000, 32.0, 3, 'OCCUPIED', NOW(), NOW()),
(8, 3, 'P.302', 3500000, 24.0, 2, 'AVAILABLE', NOW(), NOW());
