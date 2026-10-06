-- ==============================================================================
-- SCRIPT SEED DATA ĐẦY ĐỦ CHO TOÀN BỘ 10 MICROSERVICES CHUỖI NHÀ TRỌ
-- NGUYÊN TẮC: Khởi tạo dữ liệu thực tế cho từng cơ sở, phòng, khách thuê, hóa đơn
-- ==============================================================================

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

-- 2. PROPERTY_DB (Chuỗi Nhà Trọ - Cơ Sở & Tiện Ích Tòa Nhà)
USE `property_db`;

INSERT IGNORE INTO `boarding_houses` (`id`, `code`, `name`, `address`, `ward`, `district`, `city`, `manager_name`, `manager_phone`, `total_floors`, `total_rooms`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'CS-01', 'Nhà Trọ Cầu Giấy - Cơ Sở 1', 'Số 45, Ngõ 165 Cầu Giấy', 'Dịch Vọng', 'Cầu Giấy', 'Hà Nội', 'Trần Văn Mạnh', '0912888666', 5, 12, 'Cơ sở chính khu vực Cầu Giấy, gần các trường đại học lớn', 'ACTIVE', NOW(), NOW()),
(2, 'CS-02', 'Nhà Trọ Bách Khoa - Cơ Sở 2', 'Số 18, Ngõ Tự Do', 'Đồng Tâm', 'Hai Bà Trưng', 'Hà Nội', 'Nguyễn Thị Hằng', '0988777999', 4, 8, 'Cơ sở Bách Khoa, Hai Bà Trưng gần Kinh Tế Quốc Dân', 'ACTIVE', NOW(), NOW()),
(3, 'CS-03', 'Nhà Trọ Đống Đa - Cơ Sở 3', 'Số 92, Phố Chùa Láng', 'Láng Thượng', 'Đống Đa', 'Hà Nội', 'Phạm Quốc Hùng', '0936555222', 6, 16, 'Cơ sở cao cấp Đống Đa thang máy thẻ từ, PCCC tự động', 'ACTIVE', NOW(), NOW());

INSERT IGNORE INTO `branch_facilities` (`id`, `boarding_house_id`, `name`, `icon`) VALUES
(1, 1, 'Thang Máy Tốc Độ Cao', 'elevator'),
(2, 1, 'Khóa Cổng Vân Tay & FaceID', 'fingerprint'),
(3, 1, 'Camera An Ninh 24/7', 'camera'),
(4, 1, 'Nhà Để Xe Có Bảo Vệ', 'parking'),
(5, 2, 'Khóa Cổng Vân Tay', 'fingerprint'),
(6, 2, 'Camera An Ninh 24/7', 'camera'),
(7, 3, 'Thang Máy Thẻ Từ', 'elevator'),
(8, 3, 'Bảo Vệ Túc Trực 24/7', 'shield'),
(9, 3, 'Hệ Thống PCCC Tự Động', 'flame');

-- 3. ROOM_DB (Phòng Trọ, Tòa nhà, Tầng, Tiện ích)
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
(8, 3, 'P.302', 3500000, 24.0, 2, 'AVAILABLE', NOW(), NOW()),
(9, 4, 'P.BK-101', 3200000, 22.0, 2, 'OCCUPIED', NOW(), NOW()),
(10, 4, 'P.BK-102', 3400000, 25.0, 2, 'OCCUPIED', NOW(), NOW()),
(11, 5, 'P.BK-201', 3600000, 26.0, 2, 'AVAILABLE', NOW(), NOW()),
(12, 6, 'P.ĐĐ-101', 4500000, 35.0, 3, 'OCCUPIED', NOW(), NOW()),
(13, 7, 'P.ĐĐ-201', 4800000, 38.0, 4, 'OCCUPIED', NOW(), NOW());

INSERT IGNORE INTO `amenities` (`id`, `name`, `icon`) VALUES
(1, 'WiFi Tốc Độ Cao', 'wifi'),
(2, 'Điều Hòa Inverter', 'wind'),
(3, 'Bình Nóng Lạnh', 'flame'),
(4, 'Tủ Lạnh 2 Cánh', 'refrigerator'),
(5, 'Máy Giặt Riêng', 'washing-machine'),
(6, 'Ban Công Thoáng', 'sun'),
(7, 'Khóa Cửa Vân Tay', 'fingerprint');

INSERT IGNORE INTO `room_amenities` (`room_id`, `amenity_id`) VALUES
(1, 1), (1, 2), (1, 3),
(2, 1), (2, 2), (2, 3), (2, 6),
(3, 1), (3, 3),
(4, 1), (4, 2), (4, 3),
(5, 1), (5, 2), (5, 3),
(6, 1), (6, 2), (6, 3), (6, 4),
(7, 1), (7, 2), (7, 3), (7, 4), (7, 5),
(8, 1), (8, 2), (8, 3),
(12, 1), (12, 2), (12, 3), (12, 4), (12, 7),
(13, 1), (13, 2), (13, 3), (13, 4), (13, 5), (13, 7);

-- 3. TENANT_DB (Khách thuê)
USE `tenant_db`;

INSERT IGNORE INTO `tenants` (`id`, `full_name`, `identity_card`, `birth_date`, `gender`, `phone`, `email`, `hometown`, `address`, `start_date`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Nguyễn Văn An', '001201012345', '2001-05-12', 'MALE', '0987654321', 'an.nv@gmail.com', 'Nam Định', 'Xã Hải Phương, Huyện Hải Hậu, Nam Định', '2026-01-01', 'ACTIVE', NOW(), NOW()),
(2, 'Trần Thị Bình', '001202023456', '2002-08-20', 'FEMALE', '0978123456', 'binh.tt@gmail.com', 'Hà Nam', 'Phường Lê Hồng Phong, Phủ Lý, Hà Nam', '2026-02-15', 'ACTIVE', NOW(), NOW()),
(3, 'Phạm Minh Cường', '034203034567', '1999-11-03', 'MALE', '0912345678', 'cuong.pm@gmail.com', 'Hải Phòng', 'Quận Lê Chân, Hải Phòng', '2026-03-10', 'ACTIVE', NOW(), NOW()),
(4, 'Vũ Hoàng Dũng', '025204045678', '2000-02-17', 'MALE', '0945678901', 'dung.vh@gmail.com', 'Thái Bình', 'Huyện Tiền Hải, Thái Bình', '2026-04-01', 'ACTIVE', NOW(), NOW()),
(5, 'Đỗ Thị Mai', '019205056789', '2003-09-25', 'FEMALE', '0934567890', 'mai.dt@gmail.com', 'Bắc Ninh', 'TP Từ Sơn, Bắc Ninh', '2026-05-20', 'ACTIVE', NOW(), NOW()),
(6, 'Lê Văn Khang', '038206067890', '2001-12-30', 'MALE', '0967890123', 'khang.lv@gmail.com', 'Nghệ An', 'TP Vinh, Nghệ An', '2026-05-20', 'ACTIVE', NOW(), NOW());

-- 4. CONTRACT_DB (Hợp đồng thuê)
USE `contract_db`;

INSERT IGNORE INTO `contracts` (`id`, `contract_code`, `tenant_id`, `room_id`, `start_date`, `end_date`, `rental_price`, `deposit_amount`, `payment_cycle`, `status`, `created_at`, `updated_at`) VALUES
(1, 'HD-202601-01', 1, 1, '2026-01-01', '2027-01-01', 3500000, 3500000, 1, 'ACTIVE', NOW(), NOW()),
(2, 'HD-202602-02', 2, 2, '2026-02-15', '2027-02-15', 3800000, 3800000, 1, 'ACTIVE', NOW(), NOW()),
(3, 'HD-202603-03', 3, 3, '2026-03-10', '2027-03-10', 3200000, 3200000, 1, 'ACTIVE', NOW(), NOW()),
(4, 'HD-202604-04', 4, 4, '2026-04-01', '2027-04-01', 3600000, 3600000, 1, 'ACTIVE', NOW(), NOW()),
(5, 'HD-202605-05', 5, 7, '2026-05-20', '2027-05-20', 4200000, 4200000, 1, 'ACTIVE', NOW(), NOW());

-- 5. METER_DB (Chỉ số điện nước)
USE `meter_db`;

INSERT IGNORE INTO `meter_readings` (`id`, `room_id`, `recorded_month`, `recorded_year`, `old_electricity`, `new_electricity`, `old_water`, `new_water`, `created_at`, `updated_at`) VALUES
(1, 1, 9, 2026, 1240, 1315, 85, 92, NOW(), NOW()),
(2, 2, 9, 2026, 890, 980, 60, 67, NOW(), NOW()),
(3, 3, 9, 2026, 2100, 2190, 140, 149, NOW(), NOW()),
(4, 4, 9, 2026, 1560, 1655, 105, 113, NOW(), NOW()),
(5, 7, 9, 2026, 3420, 3560, 220, 235, NOW(), NOW());

-- 6. BILLING_DB (Hóa đơn)
USE `billing_db`;

INSERT IGNORE INTO `invoices` (`id`, `invoice_code`, `contract_id`, `room_id`, `tenant_id`, `month`, `year`, `room_fee`, `electricity_fee`, `water_fee`, `service_fee`, `total_amount`, `status`, `paid_at`, `created_at`, `updated_at`) VALUES
(1, 'HD-202609-01', 1, 1, 1, 9, 2026, 3500000, 262500, 175000, 100000, 4037500, 'PAID', NOW(), NOW(), NOW()),
(2, 'HD-202609-02', 2, 2, 2, 9, 2026, 3800000, 315000, 175000, 100000, 4390000, 'UNPAID', NULL, NOW(), NOW()),
(3, 'HD-202609-03', 3, 3, 3, 9, 2026, 3200000, 315000, 225000, 100000, 3840000, 'PAID', NOW(), NOW(), NOW()),
(4, 'HD-202609-04', 4, 4, 4, 9, 2026, 3600000, 332500, 200000, 100000, 4232500, 'OVERDUE', NULL, NOW(), NOW()),
(5, 'HD-202609-05', 5, 7, 5, 9, 2026, 4200000, 490000, 375000, 100000, 5165000, 'UNPAID', NULL, NOW(), NOW());

-- 7. MAINTENANCE_DB (Sự cố bảo trì)
USE `maintenance_db`;

INSERT IGNORE INTO `maintenance_requests` (`id`, `room_id`, `tenant_id`, `title`, `description`, `priority`, `status`, `created_at`, `updated_at`) VALUES
(1, 2, 2, 'Hong voi sen nha tam', 'Voi sen nha tam bi ro ri nuoc can thay the', 'HIGH', 'IN_PROGRESS', NOW(), NOW()),
(2, 5, 4, 'Dieu hoa khong mat', 'Dieu hoa chay yeu co tieng keu to khong mat', 'HIGH', 'PENDING', NOW(), NOW()),
(3, 7, 5, 'Chay bong den ban cong', 'Bong den tuyp ban cong bi chay can thay moi', 'LOW', 'RESOLVED', NOW(), NOW());

-- 8. REPORT_DB (Tổng hợp số liệu)
USE `report_db`;

INSERT IGNORE INTO `monthly_reports` (`id`, `month`, `year`, `total_revenue`, `total_expense`, `net_profit`, `occupancy_rate`, `created_at`, `updated_at`) VALUES
(1, 1, 2026, 42000000, 8500000, 33500000, 65.0, NOW(), NOW()),
(2, 2, 2026, 45500000, 9000000, 36500000, 70.0, NOW(), NOW()),
(3, 3, 2026, 48000000, 9200000, 38800000, 72.5, NOW(), NOW()),
(4, 4, 2026, 47200000, 8800000, 38400000, 70.0, NOW(), NOW()),
(5, 5, 2026, 51800000, 10100000, 41700000, 75.0, NOW(), NOW()),
(6, 6, 2026, 54000000, 10500000, 43500000, 76.5, NOW(), NOW()),
(7, 7, 2026, 53200000, 10000000, 43200000, 75.0, NOW(), NOW()),
(8, 8, 2026, 58600000, 11200000, 47400000, 78.0, NOW(), NOW()),
(9, 9, 2026, 62400000, 11800000, 50600000, 82.0, NOW(), NOW());
