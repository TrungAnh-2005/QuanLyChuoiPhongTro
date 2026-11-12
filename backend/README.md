# Backend quản lý chuỗi phòng trọ — bản test nghiệp vụ

Spring Boot 3.3.4, Java 21, Spring Cloud Gateway, Eureka, MySQL và RabbitMQ. Mỗi service dùng database riêng. Frontend gọi `/api` qua Gateway cổng 8080.

Bản hiện tại ưu tiên kiểm thử nghiệp vụ. `auth-service` thuộc profile `accounts` nên không tự chạy trong bản test; khi làm tài khoản sau này có thể bật bằng `docker compose --profile accounts up -d auth-service`. `.env` đã bật `APPLICATION_TEST_MODE=true`, và `frontend/.env` bật `VITE_TEST_MODE=true`: không cần đăng nhập hay JWT. Gateway gắn ngữ cảnh kiểm thử cố định để các service hiện có hoạt động. Bộ chọn ở góc dưới frontend chuyển màn hình quản lý/khách thuê/quản trị, không tạo account mới. Tắt cả hai biến khi triển khai phần xác thực sau này; phân quyền và cô lập dữ liệu theo chủ trọ chưa nằm trong phạm vi kiểm thử này.

Chạy từ thư mục gốc:

```bash
docker compose up --build -d
```

Frontend Docker: http://localhost:3000. Gateway: http://localhost:8080. Eureka: http://localhost:8761.

Chạy frontend bằng Vite:

```bash
cd frontend
npm install
npm run dev
```

Vite đọc `frontend/.env`; `GATEWAY_URL=http://localhost:8080` là đích proxy, `VITE_API_BASE_URL=/api` là đường dẫn frontend sử dụng. Không đặt secret nhà cung cấp trong biến `VITE_*`.

MySQL hiện có của bạn đang dùng cổng 3306. `.env` bản test dùng cổng host 3307, volume `rental_backend_test_mysql_v1` và mạng riêng để không ảnh hưởng dữ liệu đang có; kết nối giữa các container vẫn dùng `mysql:3306`.

Các file `.env` và `.env.example` nằm ở thư mục gốc, `backend`, `frontend`. Docker Compose đọc `.env` gốc và chuyển các biến cần thiết cho container. Khi chạy Maven tại gốc, Spring Boot đọc `.env` gốc ưu tiên hơn `backend/.env`; khi chạy tại `backend`, đọc `.env` tại đó. JWT được giữ trong cấu hình cho giai đoạn sau, không được kiểm tra khi bật test mode.

`JAVA_OPTS` trong `.env` giới hạn JVM cho môi trường test. Các service và MySQL/RabbitMQ vẫn dùng chung RAM Docker; có thể kiểm thử theo nhóm nếu Docker bị thiếu bộ nhớ. Không đặt `SERVER_PORT` chung cho tất cả service.

| Service | Cổng | API |
| --- | --- | --- |
| api-gateway | 8080 | `/api/**` |
| auth-service | 8081 | `/api/auth` (để giai đoạn tài khoản) |
| room-service | 8082 | `/api/rooms`, `/api/properties`, `/api/boarding-houses` |
| tenant-service | 8083 | `/api/tenants` |
| contract-service | 8084 | `/api/contracts` |
| meter-service | 8085 | `/api/meters` |
| billing-service | 8086 | `/api/invoices` |
| payment-service | 8087 | `/api/payments` |
| maintenance-service | 8088 | `/api/maintenance` |
| notification-service | 8089 | `/api/notifications` |
| report-service | 8090 | `/api/reports` |
| ai-service | 8091 | `/api/ai` |

Các nhóm chức năng đã nối Gateway: cơ sở/phòng; khách thuê và tạo hợp đồng khi xếp phòng; yêu cầu thuê/đổi/gia hạn/trả phòng; ký và xác nhận cọc; ở ghép và cư trú; điện nước/biểu giá/khiếu nại; hóa đơn/thu tiền; bảo trì; quyết toán và thông báo. Các resource bổ sung dùng `/api/{domain}/records/{resource}`, chỉ nhận các trường thuộc allowlist của bảng nghiệp vụ.

Database mới: Compose chạy `01-init-databases.sql`, `03-notifications.sql`, `04-workflow-resources.sql`. Hibernate tạo/cập nhật các bảng entity nghiệp vụ; auth-service có seed riêng. Script seed cũ `02-seed-data.sql` vẫn được giữ để tham khảo nhưng không chạy tự động vì dùng nhiều bảng/schema không khớp với backend hiện tại.

Database đang có: không xóa volume. Áp dụng các script bổ sung sau khi sao lưu và kiểm tra schema. File `init-scripts/full_microservices_database_setup.sql` có `DROP TABLE` và một số cấu trúc khác entity hiện tại (đặc biệt meter_readings), vì vậy không tự import vào database đang sử dụng.

Thu tiền mặt được ghi qua payment-service, billing cập nhật hóa đơn bằng sự kiện RabbitMQ. VNPay/MoMo/SePay và OCR cần thông tin nhà cung cấp thật trong `.env` backend. Khi chưa cấu hình hoặc nhà cung cấp lỗi, API báo lỗi; không tạo thanh toán hay kết quả OCR giả. Các màn hình cấu hình SMTP/SMS và gửi email/SMS thực tế chưa được triển khai. Thông báo hiện tại là IN_APP; chưa tự phát cho mọi sự kiện nghiệp vụ.

Kiểm tra mã:

```bash
mvn test
mvn package
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run lint
```

Các bài test và build không thay thế kiểm thử tích hợp trên database thực tế của bạn.
