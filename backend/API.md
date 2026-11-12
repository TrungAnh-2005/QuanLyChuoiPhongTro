# API dành cho bản test nghiệp vụ

Base URL: `http://localhost:8080/api`. Khi `APPLICATION_TEST_MODE=true`, không gửi JWT hay thông tin account. Mọi thao tác frontend đi qua Gateway.

Các endpoint hiện có trả cả hai dạng: `{success:true,data:...}` và DTO trực tiếp. Frontend chuẩn hóa tại lớp API/context; lỗi HTTP không được chuyển thành thành công giả.

| Nghiệp vụ | Endpoint chính |
| --- | --- |
| Cơ sở | GET/POST `/properties`, GET/PUT/DELETE `/properties/{id}` |
| Phòng | GET/POST `/rooms`, GET/PUT/DELETE `/rooms/{id}`, PATCH `/rooms/{id}/status` |
| Tòa/tầng | GET/POST `/rooms/records/buildings`, `/rooms/records/floors` |
| Biểu giá dịch vụ | GET/POST `/rooms/records/service-configs`, PATCH/DELETE `/rooms/records/service-configs/{id}` |
| Khách thuê | GET/POST `/tenants`, GET/PUT/DELETE `/tenants/{id}` |
| Hợp đồng | GET/POST `/contracts`, GET `/contracts/{id}` |
| Gia hạn/chấm dứt | POST `/contracts/{id}/renew`, `/contracts/{id}/terminate` |
| Ký/xác nhận cọc | POST `/contracts/{id}/sign`, `/contracts/{id}/confirm-deposit` |
| Yêu cầu thuê/đổi/gia hạn/trả | GET/POST `/contracts/records/requests`, PATCH `/contracts/records/requests/{id}` |
| Phê duyệt yêu cầu | POST `/contracts/requests/{id}/approve` |
| Biểu quyết yêu cầu | POST `/contracts/requests/{id}/vote` |
| Thành viên phòng | GET/POST `/tenants/records/members`, PATCH/DELETE `/tenants/records/members/{id}` |
| Đề nghị ở ghép | GET/POST `/tenants/records/roommate-requests` |
| Duyệt ở ghép | POST `/tenants/roommate-requests/{id}/review` |
| Chốt điện nước | POST `/meters/readings`, GET `/meters/rooms/{roomId}` |
| Khiếu nại công tơ | GET/POST `/meters/records/disputes`, PATCH `/meters/records/disputes/{id}` |
| Hóa đơn | GET/POST `/invoices`, GET `/invoices/{id}`, POST `/invoices/generate-monthly` |
| Điều chỉnh điện nước/phí sửa | PUT `/invoices/{id}/meter-fees`, POST `/invoices/{id}/maintenance-fee` |
| Thu tiền | POST `/payments`, GET `/payments`, GET `/payments/invoice/{invoiceId}` |
| Bảo trì | GET/POST `/maintenance`, GET `/maintenance/{id}`, PUT `/maintenance/{id}/status` |
| Quyết toán trả phòng | GET/POST `/contracts/records/settlements`, POST `/contracts/settlements/{id}/complete` |
| Thông báo | GET/POST `/notifications`, GET `/notifications/unread-count` |
| Đọc thông báo | PATCH `/notifications/{id}/read`, `/notifications/read-all` |
| Báo cáo | GET `/reports/dashboard-summary`, `/reports/revenue`, `/reports/occupancy`, `/reports/debt`, `/reports/contracts-expiring` |

Các resource `/records/` đọc danh sách theo thứ tự ID giảm dần, tối đa 2.000 bản ghi. Trường trả về từ SQL là snake_case; frontend đổi thành camelCase. Khi gửi JSON có thể dùng camelCase. Chỉ chấp nhận các cột nằm trong allowlist; không nhận tên bảng/cột SQL từ client.

Luồng thử nhanh:

1. POST `/properties` với `name`, `address`, `code`, `managerPhone`, `managerUsername`. Backend tạo tòa và tầng mặc định.
2. GET `/rooms/records/floors` để lấy `floorId`, POST `/rooms` với `floorId`, `roomNumber`, `basePrice`, `area`, `maxOccupants`.
3. POST `/tenants` với `fullName`, `identityCard`, `birthDate`, `gender`, `phone`, `email`.
4. POST `/contracts` với `tenantId`, `roomId`, `startDate`, `endDate`, `rentalPrice`, `depositAmount`, `paymentCycle`. Phòng phải AVAILABLE; backend chuyển sang OCCUPIED.
5. POST `/meters/readings` một lần cho ELECTRICITY và một lần cho WATER: `roomId`, `meterType`, `newReading`, `unitPrice`, `readingDate`. Sửa cùng tháng giữ số cũ đầu kỳ và cập nhật bản ghi đã có.
6. POST `/invoices/generate-monthly`: `contractId`, `month`, `year`; hoặc POST `/invoices` để lập hóa đơn có phí cụ thể.
7. POST `/payments`: `invoiceId`, `amount`, `paymentMethod:"CASH"`. RabbitMQ chuyển sự kiện để billing cập nhật trạng thái hóa đơn; có thể cần tải lại sau khi consumer xử lý.
8. POST `/maintenance` để báo hỏng, PUT `/{id}/status` để giao/hoàn tất, POST `/invoices/{id}/maintenance-fee` nếu thu thêm tiền sửa chữa.

Các API VNPay/MoMo/SePay/OCR cần khóa nhà cung cấp ở backend. Bản test cơ bản có thể dùng nhập chỉ số thủ công và thu tiền mặt. Việc xác minh tài khoản, JWT, phân quyền và cô lập dữ liệu người dùng được để lại cho giai đoạn sau.
