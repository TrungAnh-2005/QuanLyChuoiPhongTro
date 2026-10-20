# SƠ ĐỒ USE CASE
## Hệ Thống Quản Lý Chuỗi Phòng Trọ Đa Chi Nhánh (Microservices SaaS)

> Phân tích từ source code thực tế — Backend (Spring Boot Microservices) + Frontend (React/Vite)

---

## 1. Sơ đồ Use Case Tổng thể

```mermaid
flowchart LR
    %% ===== ACTORS =====
    ADMIN(("Admin\nNền tảng"))
    STAFF(("Staff\nChủ trọ / Quản lý"))
    TENANT(("Tenant\nKhách thuê"))

    %% ===== ADMIN MODULE =====
    subgraph ADM["Phân hệ Quản trị Nền tảng (admin-service)"]
        direction TB
        A01(["UC-A01\nQuản lý Chủ trọ & KYC"])
        A02(["UC-A02\nCấu hình tích hợp\nVietQR / MoMo / VNPay / AI / SMS"])
        A03(["UC-A03\nGiám sát Microservices\n& Audit Logs"])
        A04(["UC-A04\nQuản lý SaaS Invoices"])
        A05(["UC-A05\nKhóa / Mở khóa\ntài khoản vi phạm"])
    end

    %% ===== STAFF MODULE =====
    subgraph STA["Phân hệ Vận hành (property-service / room-service)"]
        direction TB
        S01(["UC-S01\nThiết lập Cơ sở, Tòa nhà\nTầng & Phòng trọ"])
        S01B(["UC-S01B\nCấu hình biểu giá\ndịch vụ cơ sở"])
        S02(["UC-S02\nLập hợp đồng & Nhận phòng"])
        S02B(["UC-S02B\nDuyệt thêm\nthành viên ở ghép"])
        S03(["UC-S03\nChốt chỉ số\nĐiện & Nước (AI/Tay)"])
        S04(["UC-S04\nTính hóa đơn\n& Thu tiền phòng"])
        S05(["UC-S05\nĐiều phối\nbảo trì sửa chữa"])
        S06(["UC-S06\nBáo cáo Doanh thu\n& Tỷ lệ lấp đầy"])
        S07(["UC-S07\nTrả phòng & Quyết toán\nhoàn cọc"])
    end

    %% ===== TENANT MODULE =====
    subgraph TEN["Cổng Cư dân (Resident Portal)"]
        direction TB
        T01(["UC-T01\nXem hợp đồng\n& Ký điện tử"])
        T02(["UC-T02\nTra cứu điện nước\n& Đối soát"])
        T03(["UC-T03\nXem hóa đơn\n& Quét VietQR / MoMo / VNPay"])
        T04(["UC-T04\nGửi yêu cầu Báo hỏng\nkèm ảnh hiện trường"])
        T05(["UC-T05\nXem danh sách\nbạn cùng phòng"])
        T06(["UC-T06\nGửi thông báo\nTrả phòng & Hoàn cọc"])
        T07(["UC-T07\nĐăng ký\nbạn cùng phòng ở ghép"])
    end

    %% ===== CONNECTIONS =====
    ADMIN --- A01
    ADMIN --- A02
    ADMIN --- A03
    ADMIN --- A04
    ADMIN --- A05

    STAFF --- S01
    STAFF --- S01B
    STAFF --- S02
    STAFF --- S02B
    STAFF --- S03
    STAFF --- S04
    STAFF --- S05
    STAFF --- S06
    STAFF --- S07

    TENANT --- T01
    TENANT --- T02
    TENANT --- T03
    TENANT --- T04
    TENANT --- T05
    TENANT --- T06
    TENANT --- T07
```

---

## 2. Sơ đồ chi tiết từng phân hệ Microservice

### 2.1 — auth-service & admin-service (Xác thực & Quản trị)

```mermaid
flowchart LR
    ADMIN(("Admin"))
    STAFF(("Staff"))
    TENANT(("Tenant"))

    subgraph AUTH["auth-service (auth_db)"]
        L01(["Đăng nhập\n/api/auth/login"])
        L02(["Đổi mật khẩu\n/api/auth/change-password"])
        L03(["Làm mới Token\n/api/auth/refresh-token"])
    end

    subgraph ADMFN["admin-service"]
        A01a(["Danh sách Chủ trọ\n/api/admin/landlords"])
        A01b(["Duyệt / Từ chối KYC\n/api/admin/landlords/:id/kyc"])
        A01c(["Khóa / Mở khóa tài khoản\n/api/admin/users/:id/status"])
        A02a(["Cấu hình VietQR / MoMo / VNPay\n/api/admin/integrations"])
        A03a(["Xem Audit Logs\n/api/admin/system/logs"])
        A04a(["Quản lý SaaS Invoices\n/api/admin/saas-invoices"])
    end

    ADMIN --> L01
    STAFF  --> L01
    TENANT --> L01

    ADMIN --> A01a
    ADMIN --> A01b
    ADMIN --> A01c
    ADMIN --> A02a
    ADMIN --> A03a
    ADMIN --> A04a
    ADMIN --> L02
    STAFF  --> L02
    TENANT --> L02
```

---

### 2.2 — property-service & room-service (Cơ sở & Phòng)

```mermaid
flowchart LR
    STAFF(("Staff"))

    subgraph PROP["property-service / room-service (room_db)"]
        direction TB
        P01(["Tạo / Sửa Cơ sở nhà trọ\n(boarding_houses)"])
        P02(["Thêm Tòa nhà\n(buildings)"])
        P03(["Thêm Tầng\n(floors)"])
        P04(["Tạo / Sửa Phòng trọ\n(rooms) — AVAILABLE / OCCUPIED"])
        P05(["Cấu hình Biểu giá dịch vụ\n(house_service_configs)\nDiện / Nuoc / Rac / Wifi / Gui xe"])
        P06(["Xem Dashboard\nTổng quan cơ sở"])
    end

    STAFF --> P01
    STAFF --> P02
    STAFF --> P03
    STAFF --> P04
    STAFF --> P05
    STAFF --> P06
```

---

### 2.3 — tenant-service & contract-service (Khách thuê & Hợp đồng)

```mermaid
flowchart LR
    STAFF(("Staff"))
    TENANT(("Tenant"))

    subgraph TEN_SV["tenant-service (tenant_db)"]
        TN01(["Tạo hồ sơ Khách thuê\n(tenants)"])
        TN02(["Xem danh sách Khách thuê"])
        TN03(["Duyệt yêu cầu\nthêm bạn cùng phòng\n(roommate_requests)"])
        TN04(["Xem danh sách\nbạn cùng phòng\n(room_members)"])
        TN05(["Gửi yêu cầu\nbạn cùng phòng ở ghép"])
    end

    subgraph CON_SV["contract-service (contract_db)"]
        C01(["Lập hợp đồng mới\n(contracts — PENDING_SIGN)"])
        C02(["Ký xác nhận HĐ điện tử\n(ACTIVE)"])
        C03(["Xem chi tiết hợp đồng"])
        C04(["Xử lý trả phòng\n(TERMINATED)"])
        C05(["Quyết toán hoàn cọc\n(move_out_settlements)"])
        C06(["Gửi thông báo\ntrả phòng"])
    end

    STAFF --> TN01
    STAFF --> TN02
    STAFF --> TN03
    STAFF --> C01
    STAFF --> C04
    STAFF --> C05

    TENANT --> TN04
    TENANT --> TN05
    TENANT --> C02
    TENANT --> C03
    TENANT --> C06
```

---

### 2.4 — meter-service & ai-service (Điện Nước & AI OCR)

```mermaid
flowchart LR
    STAFF(("Staff"))
    TENANT(("Tenant"))

    subgraph MTR["meter-service (meter_db)"]
        M01(["Ghi nhận chỉ số\nĐiện & Nước thủ công\n(meter_readings — MONTHLY)"])
        M02(["Chốt chỉ số\nngày trả phòng (MOVE_OUT)"])
        M03(["Xem lịch sử\nchỉ số 6 tháng"])
        M04(["Đính kèm ảnh chụp\nđồng hồ làm bằng chứng"])
    end

    subgraph AI["ai-service"]
        AI01(["Quét ảnh đồng hồ\nbằng AI Vision OCR\n/api/ai/scan-meter"])
        AI02(["Tự động nhận diện\nchỉ số (AUTO_AI)"])
    end

    STAFF --> M01
    STAFF --> M02
    STAFF --> M04
    STAFF --> AI01

    AI01 --> AI02
    AI02 --> M01

    TENANT --> M03
```

---

### 2.5 — billing-service & payment-service (Hóa đơn & Thanh toán)

```mermaid
flowchart LR
    STAFF(("Staff"))
    TENANT(("Tenant"))

    subgraph BILL["billing-service (billing_db)"]
        B01(["Tạo hóa đơn hàng tháng\n(invoices — UNPAID)"])
        B02(["Xem danh sách hóa đơn\n(UNPAID / PAID / OVERDUE)"])
        B03(["Xác nhận thu tiền mặt\n(CASH -> PAID)"])
        B04(["Phát hành thông báo\nkèm mã VietQR"])
    end

    subgraph PAY["payment-service (payment_db)"]
        P01(["Tạo mã VietQR động\n/api/payment/vietqr/create"])
        P02(["Thanh toán MoMo\n/api/payment/momo/create"])
        P03(["Thanh toán VNPay\n/api/payment/vnpay/create"])
        P04(["Webhook xác nhận\ngiao dịch thành công\n(payments — SUCCESS)"])
        P05(["Xem lịch sử\ngiao dịch"])
    end

    STAFF --> B01
    STAFF --> B02
    STAFF --> B03
    STAFF --> B04

    TENANT --> B02
    TENANT --> P01
    TENANT --> P02
    TENANT --> P03

    P01 --> P04
    P02 --> P04
    P03 --> P04
    P04 --> B03
```

---

### 2.6 — maintenance-service (Bảo trì sửa chữa)

```mermaid
flowchart LR
    STAFF(("Staff"))
    TENANT(("Tenant"))

    subgraph MAIN["maintenance-service (maintenance_db)"]
        MN01(["Gửi phiếu báo hỏng\n+ 1-3 ảnh hiện trường\n(maintenance_requests — PENDING)"])
        MN02(["Tiếp nhận & Phân công thợ\n(IN_PROGRESS)"])
        MN03(["Cập nhật tiến độ\n& Chi phí sửa chữa\n(RESOLVED)"])
        MN04(["Xem lịch sử sự cố\ntheo phòng"])
    end

    TENANT --> MN01
    STAFF  --> MN02
    STAFF  --> MN03
    STAFF  --> MN04
    TENANT --> MN04
```

---

### 2.7 — report-service & notification-service (Báo cáo & Thông báo)

```mermaid
flowchart LR
    STAFF(("Staff"))

    subgraph REP["report-service (report_db)"]
        R01(["Báo cáo Doanh thu\nhàng tháng\n(monthly_reports)"])
        R02(["Tỷ lệ lấp đầy phòng (%)"])
        R03(["Danh sách nợ đọng\nquá hạn"])
        R04(["Thống kê Chi phí\nbảo trì"])
    end

    subgraph NOTIF["notification-service"]
        N01(["Gửi SMS / Email\nThông báo hóa đơn"])
        N02(["Gửi OTP / Mật khẩu tạm\ncho khách mới"])
        N03(["Nhắc nợ tự động\nqua RabbitMQ"])
    end

    STAFF --> R01
    STAFF --> R02
    STAFF --> R03
    STAFF --> R04
```

---

## 3. Bảng Danh mục Use Case Đầy đủ

### ADMIN — Quản trị nền tảng SaaS

| Ma UC | Ten chuc nang | Microservice | Route / Endpoint |
|:------|:-------------|:------------|:----------------|
| **UC-A01** | Quan ly Chu tro & Duyet KYC | `auth-service` | `/admin/landlords` |
| **UC-A02** | Cau hinh tich hop VietQR / MoMo / VNPay / AI / SMS | `api-gateway` / `payment-service` | `/admin/integrations` |
| **UC-A03** | Giam sat Microservices & Audit Logs | `discovery-server` | `/admin/system` |
| **UC-A04** | Quan ly SaaS Invoices | `billing-service` | `/admin/saas-invoices` |
| **UC-A05** | Khoa / Mo khoa tai khoan vi pham | `auth-service` | `/admin/users/:id/status` |

---

### STAFF — Vận hành cơ sở nhà trọ

| Ma UC | Ten chuc nang | Microservice | Page Frontend |
|:------|:-------------|:------------|:-------------|
| **UC-S01** | Thiet lap Co so, Toa nha, Tang, Phong | `room-service` / `property-service` | `BoardingHousesPage`, `RoomsPage` |
| **UC-S01B** | Cau hinh bieu gia dich vu co so | `room-service` | `BoardingHousesPage` |
| **UC-S02** | Tiep nhan khach, Lap hop dong & Nhan phong | `contract-service` + `tenant-service` | `TenantsPage` |
| **UC-S02B** | Duyet yeu cau them thanh vien o ghep | `tenant-service` + `auth-service` | `TenantsPage` |
| **UC-S03** | Ghi nhan & Chot chi so Dien Nuoc (AI/Tay) | `meter-service` + `ai-service` | `MetersPage` |
| **UC-S04** | Tinh hoa don & Thu tien phong | `billing-service` + `payment-service` | `InvoicesPage` |
| **UC-S05** | Tiep nhan & Dieu phoi bao tri sua chua | `maintenance-service` | `MaintenancePage` |
| **UC-S06** | Bao cao Doanh thu, Chi phi & Lap day | `report-service` | `ReportsPage` |
| **UC-S07** | Tra phong, Nghiem thu & Quyet toan cop | `contract-service` + `room-service` | `TenantsPage` |

---

### TENANT — Cổng Cư dân (Resident Portal)

| Ma UC | Ten chuc nang | Microservice | Ghi chu |
|:------|:-------------|:------------|:--------|
| **UC-T01** | Xem hop dong & Ky xac nhan dien tu | `contract-service` | e-sign |
| **UC-T02** | Tra cuu chi so dien nuoc & Doi soat anh | `meter-service` | Xem 6 thang gan nhat |
| **UC-T03** | Xem hoa don & Quet ma VietQR / MoMo / VNPay | `billing-service` + `payment-service` | Gach no tu dong 5-10s |
| **UC-T04** | Gui yeu cau Bao hong kem anh hien truong | `maintenance-service` | Chon muc uu tien |
| **UC-T05** | Xem danh sach ban cung phong (Mask CCCD) | `tenant-service` | An CCCD bao ve rieng tu |
| **UC-T06** | Gui thong bao Tra phong & Doi soat hoan cop | `contract-service` | Nhap STK nhan cop |
| **UC-T07** | Dang ky ban cung phong o ghep | `tenant-service` | Cho Staff duyet |

---

## 4. Kiến trúc Microservices — Tương quan với Use Case

```mermaid
graph TB
    FE["Frontend\nReact + Vite"] --> GW

    GW["API Gateway\n(Spring Cloud Gateway)"] --> EU
    EU["Discovery Server\n(Eureka)"]

    GW --> AUTH["auth-service"]
    GW --> ROOM["room-service"]
    GW --> PROP["property-service"]
    GW --> TEN["tenant-service"]
    GW --> CON["contract-service"]
    GW --> MTR["meter-service"]
    GW --> BILL["billing-service"]
    GW --> PAY["payment-service"]
    GW --> MAIN["maintenance-service"]
    GW --> REP["report-service"]
    GW --> AI["ai-service"]
    GW --> NOTIF["notification-service"]

    AUTH -->|"auth_db"| DB1[("MySQL")]
    ROOM -->|"room_db"| DB2[("MySQL")]
    TEN  -->|"tenant_db"| DB3[("MySQL")]
    CON  -->|"contract_db"| DB4[("MySQL")]
    MTR  -->|"meter_db"| DB5[("MySQL")]
    BILL -->|"billing_db"| DB6[("MySQL")]
    PAY  -->|"payment_db"| DB7[("MySQL")]
    MAIN -->|"maintenance_db"| DB8[("MySQL")]

    NOTIF <-->|"RabbitMQ Events"| MQ[("RabbitMQ")]
    BILL  <-->|"Event: invoice_created"| MQ
    PAY   <-->|"Event: payment_success"| MQ
    CON   <-->|"Event: contract_terminated"| MQ
```

---

## 5. Nguyên tắc Phân quyền (Authorization Rules)

```mermaid
flowchart TD
    subgraph ROLES["Phan cap quyen han"]
        direction LR
        R1["ROLE_ADMIN\nToan quyen ky thuat\nKhong can thiep nghiep vu dan su"]
        R2["ROLE_STAFF\nToan quyen van hanh\nco so minh so huu"]
        R3["ROLE_TENANT\nChi xem du lieu\ncua phong minh dang thue"]
    end

    subgraph RULES["Rang buoc quan trong"]
        direction TB
        RU1["1 Khach = 1 HĐ ACTIVE\n(Single Active Lease)"]
        RU2["Co lap Du lieu:\nChu tro A khong xem du lieu Chu tro B"]
        RU3["Khi tra phong:\nTai khoan khong bi xoa/khoa\n(status van ACTIVE)"]
        RU4["Tai khoan chi bi LOCKED:\nBrute-force / Vi pham nghiem trong"]
    end
```

---

## 6. Luồng nghiệp vụ chính (Main Business Flows)

```mermaid
sequenceDiagram
    autonumber
    actor STAFF as Staff
    actor TENANT as Tenant

    Note over STAFF,TENANT: Luong 1 — Nhan phong & Ky hop dong
    STAFF->>+auth-service: Tao tai khoan TENANT (phone + OTP)
    auth-service-->>-TENANT: Gui mat khau tam qua SMS
    STAFF->>+contract-service: Lap hop dong (PENDING_SIGN)
    TENANT->>+contract-service: Ky xac nhan dien tu (ACTIVE)
    contract-service-->>-STAFF: Cap nhat room status -> OCCUPIED

    Note over STAFF,TENANT: Luong 2 — Thu tien hang thang
    STAFF->>+meter-service: Chot chi so dien nuoc (AI OCR / thu cong)
    STAFF->>+billing-service: Tao hoa don (UNPAID)
    billing-service-->>TENANT: Thong bao hoa don + ma VietQR
    TENANT->>+payment-service: Quet VietQR / MoMo / VNPay
    payment-service-->>-billing-service: Webhook -> Invoice PAID

    Note over STAFF,TENANT: Luong 3 — Tra phong & Quyet toan
    TENANT->>+contract-service: Gui thong bao tra phong
    STAFF->>+meter-service: Chot chi so cuoi (MOVE_OUT)
    STAFF->>+contract-service: Nghiem thu & Quyet toan cop
    contract-service-->>room-service: Room status -> CLEANING / AVAILABLE
    contract-service-->>TENANT: Thu hoi quyen truy cap phong cu
```
