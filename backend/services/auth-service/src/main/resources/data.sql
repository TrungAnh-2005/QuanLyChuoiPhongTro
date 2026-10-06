INSERT IGNORE INTO roles (id, name) VALUES 
(1, 'ROLE_ADMIN'),
(2, 'ROLE_STAFF'),
(3, 'ROLE_TENANT');

-- Mật khẩu mặc định là: 123456 (BCrypt: $2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW)
INSERT IGNORE INTO users (id, username, email, password, full_name, phone, status, created_at, updated_at) VALUES
(1, 'admin', 'admin@example.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'System Administrator', '0901000001', 'ACTIVE', NOW(), NOW()),
(2, 'staff', 'staff@example.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'Property Staff', '0901000002', 'ACTIVE', NOW(), NOW()),
(3, 'tenant', 'tenant@example.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'Nguyen Van Tenant', '0901000003', 'ACTIVE', NOW(), NOW()),
(4, 'staff2', 'staff2@example.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 'Đàm Văn Táo (Staff CS2)', '0988777999', 'ACTIVE', NOW(), NOW());

INSERT IGNORE INTO user_roles (user_id, role_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 2);
