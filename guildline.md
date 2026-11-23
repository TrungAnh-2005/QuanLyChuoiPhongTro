# Hướng Dẫn Cài Đặt & Chạy Dự Án — Quản Lý Chuỗi Phòng Trọ (Trọ Việt SaaS)

Tài liệu này hướng dẫn từng bước cho người mới sau khi `git clone` / `git pull` dự án về máy để có thể dựng môi trường, chạy toàn bộ **Backend (Microservices)**, **Frontend (React + Vite)** và chạy kiểm thử thành công.

---

## 1. Yêu cầu môi trường (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy đã cài đặt:

| Công cụ | Phiên bản khuyến nghị | Lệnh kiểm tra nhanh |
| --- | --- | --- |
| **Git** | Bất kỳ bản mới | `git --version` |
| **Java JDK** | **JDK 21** | `java -version` |
| **Apache Maven** | **3.9+** | `mvn -version` |
| **Node.js & npm** | **Node.js 20+** (hoặc 22/24) | `node -v && npm -v` |
| **Docker Desktop** | Bản mới nhất (để chạy MySQL 8 & RabbitMQ) | `docker --version` |

> **Lưu ý trên Windows:** Hãy mở **Docker Desktop** chạy sẵn trước khi chạy lệnh khởi động Backend.

---

## 2. Cấu trúc dự án & Bảng cổng (Ports)

| Thành phần | Thư mục | Cổng (Port) | Ghi chú |
| --- | --- | :---: | --- |
| **Frontend (React + Vite)** | `frontend/` | `5173` | Giao diện web chính (`http://localhost:5173`) |
| **Eureka Discovery Server** | `backend/discovery-server` | `8761` | Quản lý đăng ký services (`http://localhost:8761`) |
| **API Gateway** | `backend/api-gateway` | `8080` | Cổng API tập trung (`http://localhost:8080/api/...`) |
| **auth-service** | `backend/services/auth-service` | `8081` | Đăng nhập, JWT, tài khoản, phân quyền |
| **room-service** | `backend/services/room-service` | `8082` | Cơ sở nhà trọ, tòa/tầng, phòng, biểu giá dịch vụ |
| **tenant-service** | `backend/services/tenant-service` | `8083` | Hồ sơ khách thuê, thành viên ở ghép |
| **contract-service** | `backend/services/contract-service` | `8084` | Hợp đồng, đặt cọc giữ phòng, trả phòng & quyết toán |
| **meter-service** | `backend/services/meter-service` | `8085` | Chỉ số điện nước & khiếu nại chỉ số |
| **billing-service** | `backend/services/billing-service` | `8086` | Hóa đơn tiền phòng & hóa đơn SaaS |
| **payment-service** | `backend/services/payment-service` | `8087` | Thanh toán (SePay, VNPay, MoMo, tiền mặt) |
| **maintenance-service** | `backend/services/maintenance-service` | `8088` | Báo cáo sự cố, bảo trì phòng & điều phối thợ |
| **notification-service** | `backend/services/notification-service` | `8089` | Thông báo hệ thống |
| **report-service** | `backend/services/report-service` | `8090` | Báo cáo doanh thu & sức khỏe hệ thống |
| **ai-service** | `backend/services/ai-service` | `8091` | OCR CCCD & đọc chỉ số công tơ AI |
| **MySQL 8.0** | Docker (`docker-compose.infra.yml`) | `3306` hoặc `3307` | Tùy cấu hình `MYSQL_PORT` trong `.env` |
| **RabbitMQ** | Docker (`docker-compose.infra.yml`) | `5672` / `15672` | Message broker & Management UI (`http://localhost:15672`) |

---

## 3. Các bước cài đặt lần đầu sau khi Pull dự án

### Bước 1: Clone / Pull code mới nhất

```bash
git clone <url-repo-cua-ban>
cd QuanLyChuoiPhongTro
# Hoặc nếu đã clone từ trước:
git pull origin main
```

### Bước 2: Tạo file biến môi trường (`.env`)

Copy từ 2 file mẫu `.env.example` (tuyệt đối không commit file `.env` thật lên Git):

**Trên Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
Copy-Item frontend\.env.example frontend\.env
```

**Trên macOS / Linux:**
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Sau đó mở file `.env` ở **thư mục gốc** và kiểm tra các biến quan trọng:
1. **`JWT_SECRET_KEY`**: Điền một chuỗi Base64 dài tối thiểu 32 byte (dùng chung cho `auth-service` và `api-gateway`). Có thể sinh nhanh bằng Node:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
2. **Cấu hình MySQL**:
   * Nếu dùng **Docker tự khởi tạo** (khuyên dùng cho người mới): giữ nguyên mặc định trong `.env.example` (`MYSQL_PORT=3307`, `MYSQL_USER=rental_user`, `MYSQL_PASSWORD=rental_secret`) — tránh đụng MySQL cài sẵn trên cổng `3306`.
   * Nếu muốn nối vào **MySQL cài trực tiếp trên máy (cổng 3306)**: đổi `MYSQL_PORT=3306`, điền `MYSQL_USER=root` và `MYSQL_PASSWORD=<mật khẩu của bạn>`, đồng thời import file [`full_microservices_database_setup.sql`](./full_microservices_database_setup.sql) vào MySQL.
3. **Chế độ test nhanh nghiệp vụ**:
   * Trong `.env` gốc: `APPLICATION_TEST_MODE=true`
   * Trong `frontend/.env`: `VITE_TEST_MODE=true`
   * Khi bật 2 biến này, bạn có thể vào thẳng màn hình và chuyển đổi nhanh giữa vai trò **Admin / Staff / Tenant** ở góc dưới phải mà không cần đăng nhập lại. (Khi làm tính năng đăng nhập/phân quyền thật thì đổi cả hai về `false`).
4. **Các API key ngoài (`GEMINI_API_KEY`, `SEPAY_API_KEY`, `VNPAY_*`, `MOMO_*`)**: Có thể để trống nếu chưa cần test thanh toán thật hoặc AI OCR.

### Bước 3: Cài đặt thư viện Node (`npm install`)

Chạy ở **cả thư mục gốc và thư mục `frontend`**:

```bash
# Tại thư mục gốc QuanLyChuoiPhongTro
npm install

# Cài dependencies cho Frontend
cd frontend
npm install
cd ..
```

---

## 4. Khởi chạy hệ thống

### Bước 4.1: Khởi chạy Hạ tầng (MySQL + RabbitMQ) & Toàn bộ Backend

> Đảm bảo **Docker Desktop** đang mở trước khi chạy lệnh này.

Tại **thư mục gốc** `QuanLyChuoiPhongTro`, chạy:

```powershell
# Lần đầu tiên (hoặc sau khi pull/sửa code Java): build Maven + chạy toàn bộ 13 service
npm run be
```

Lệnh `npm run be` sẽ tự động làm tuần tự:
1. Kiểm tra và bật **MySQL + RabbitMQ** qua Docker (`scripts/start-infra.mjs`).
2. Đóng gói toàn bộ module Java (`mvn package -DskipTests`).
3. Mở **mỗi service trong 1 cửa sổ PowerShell riêng biệt** (tiêu đề ghi rõ `[tên-service] - Port <cổng>`) để bạn dễ theo dõi log từng service.
4. Tự động chờ toàn bộ service mở port và đăng ký thành công với **Eureka (`8761`)** và **API Gateway (`8080`)**.

#### Các lệnh quản lý Backend hay dùng hằng ngày:

```powershell
# Chạy nhanh KHÔNG build lại Maven (dùng khi không sửa code Java)
npm run be:fast

# Dừng toàn bộ Backend và tự động đóng tất cả cửa sổ PowerShell đã mở
npm run be:stop

# Chỉ chạy 1 hoặc vài service cụ thể (bỏ qua build)
npm run be -- -SkipBuild -Services room-service,contract-service

# Chạy toàn bộ service trong cùng 1 cửa sổ terminal duy nhất
npm run be -- -SkipBuild -SameWindow
```

> **Kiểm tra Backend đã sẵn sàng:** Mở trình duyệt vào `http://localhost:8761` (Eureka Dashboard) hoặc `http://localhost:8080/actuator/health` → thấy trạng thái **`UP`** và đủ các service là thành công.

### Bước 4.2: Khởi chạy Frontend

Mở **một cửa sổ terminal mới** tại thư mục gốc:

```bash
cd frontend
npm run dev
```

Truy cập ứng dụng tại: **http://localhost:5173**

---

## 5. Chạy Kiểm Thử (Testing) & Build

### Frontend
```bash
cd frontend

# Chạy toàn bộ unit test (rules, commands, API client)
npm test

# Kiểm tra lint (oxlint)
npm run lint

# Kiểm tra production build
npm run build
```

### Backend
Tại thư mục gốc:
```bash
# Chạy unit test cho toàn bộ backend
mvn -f backend/pom.xml test

# Hoặc chỉ test các service cụ thể (nhanh hơn)
mvn -f backend/pom.xml -pl services/room-service,services/contract-service,services/maintenance-service test
```

---

## 6. Quy trình làm việc chuẩn khi `git pull` lần sau

Mỗi khi pull code mới từ nhóm về:

1. Nếu có thay đổi `package.json`: chạy lại `npm install` (ở gốc và/hoặc `frontend/`).
2. Nếu có thay đổi code **Java (`backend/`)**: chạy **`npm run be`** (không dùng `be:fast`) để Maven build lại file `.jar` mới.
3. Nếu chỉ thay đổi code **Frontend (`frontend/`)**: Vite tự hot-reload, chỉ cần giữ `npm run dev` đang chạy (hoặc F5 trình duyệt).

---

## 7. Xử lý các lỗi thường gặp (Troubleshooting)

| Lỗi gặp phải | Nguyên nhân | Cách khắc phục |
| --- | --- | --- |
| `Khong ket noi duoc Docker` | Chưa mở Docker Desktop | Mở Docker Desktop, chờ biểu tượng Docker báo Running rồi chạy lại `npm run be`. |
| `Container mysql hien co khong map dung cong...` | `MYSQL_PORT` trong `.env` không khớp port của container MySQL đang có | Kiểm tra port container bằng `docker ps`, cập nhật lại `MYSQL_PORT` trong `.env` cho khớp. |
| `Khong tim thay mvn hoac mvn.cmd` | Chưa cài Maven hoặc chưa thêm `bin` của Maven vào `PATH` | Cài Maven 3.9+ và thêm vào biến môi trường `PATH`, sau đó mở lại terminal mới. |
| API trả về `404` / `500` sau khi pull code Backend mới | Đang chạy file `.jar` cũ do dùng `npm run be:fast` | Chạy `npm run be` (bỏ `-SkipBuild`) để build lại JAR mới. |
| Cổng `8080`–`8091` bị chiếm dụng / treo tiến trình cũ | Tiến trình Java cũ chưa tắt hẳn | Chạy `npm run be:stop` để dọn sạch toàn bộ JVM của workspace, sau đó chạy lại `npm run be:fast`. |
| Frontend không gọi được API (`ECONNREFUSED`) | Backend chưa khởi động xong hoặc `GATEWAY_URL` sai | Chờ cửa sổ chính của `npm run be` báo `Hoan tat!`, kiểm tra `GATEWAY_URL=http://localhost:8080` trong `frontend/.env`. |
