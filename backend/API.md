# API nghiệp vụ hiện tại

Base URL: `http://localhost:8080/api`. Đối chiếu theo mã nguồn ngày 16/11/2026. Danh sách đủ 98 endpoint, mô tả và vị trí FE/BE gọi nằm trong [API_LIST.md](../API_LIST.md); kết quả dọn API nằm trong [API_UNUSED_BY_FE.md](../API_UNUSED_BY_FE.md).

Khi `APPLICATION_TEST_MODE=true`, Gateway gắn ngữ cảnh kiểm thử thay cho JWT. Ngoài test mode, FE dùng token đăng nhập; các API quản lý có kiểm tra vai trò riêng.

Các endpoint hiện có trả cả hai dạng `{success:true,data:...}` và DTO trực tiếp. FE chuẩn hóa tại lớp API/context.

Các đường dẫn dưới đây tính từ base URL:

| Nghiệp vụ | Endpoint |
|---|---|
| Tài khoản | POST `/auth/login`, `/auth/register`, `/auth/refresh`; GET `/auth/me`; quản lý account/profile trong API_LIST.md |
| Cơ sở | GET/POST `/properties`; PUT/DELETE `/properties/{id}` |
| Phòng | GET/POST `/rooms`; GET/PUT/DELETE `/rooms/{id}`; PATCH `/rooms/{id}/status` |
| Tòa/tầng | GET/POST `/rooms/buildings`, `/rooms/floors` |
| Biểu giá dịch vụ | GET/POST `/rooms/service-configs`; PATCH/DELETE `/rooms/service-configs/{id}` |
| Khách thuê | GET/POST `/tenants`; GET/PUT/DELETE `/tenants/{id}` |
| Hợp đồng | GET/POST `/contracts`; GET `/contracts/{id}` |
| Ký/xác nhận cọc | POST `/contracts/{id}/sign`, `/contracts/{id}/confirm-deposit` |
| Rời phòng/chuyển người đại diện | POST `/contracts/{id}/leave` |
| Yêu cầu thuê/đổi/gia hạn/trả | GET/POST `/contracts/requests`; PATCH/DELETE `/contracts/requests/{id}` |
| Phê duyệt/biểu quyết | POST `/contracts/requests/{id}/approve`, `/contracts/requests/{id}/vote` |
| Thành viên phòng | GET/POST `/tenants/members`; PATCH/DELETE `/tenants/members/{id}` |
| Đề nghị ở ghép | GET/POST `/tenants/roommate-requests`; POST `/tenants/roommate-requests/{id}/review` |
| Chốt điện nước | POST `/meters/readings`; GET `/meters/rooms/{roomId}` |
| Chỉ số mới nhất (billing gọi nội bộ) | GET `/meters/rooms/{roomId}/latest` |
| Khiếu nại công tơ | GET/POST `/meters/disputes`; PATCH `/meters/disputes/{id}` |
| Hóa đơn | GET `/invoices`; POST `/invoices/generate-monthly` |
| Điều chỉnh phí | PUT `/invoices/{id}/meter-fees`; POST `/invoices/{id}/maintenance-fee` |
| Thu tiền | POST `/invoices/{id}/confirm-payment`; POST `/payments` |
| Hóa đơn SaaS | GET/POST `/invoices/saas`; POST `/invoices/saas/{id}/confirm-payment` |
| Thanh toán online | POST `/payments/vnpay/create-url`, `/payments/momo/create-url`; GET `/payments/vnpay/verify`, `/payments/momo/verify`, `/payments/sepay/accounts`, `/payments/sepay/check` |
| Bảo trì | GET/POST `/maintenance`; PUT `/maintenance/{id}/status` |
| Quyết toán trả phòng | GET/POST `/contracts/settlements`; POST `/contracts/settlements/{id}/complete` |
| Thông báo | GET/POST `/notifications`; GET `/notifications/unread-count`; PATCH `/notifications/{id}/read`, `/notifications/read-all` |
| Báo cáo | GET `/reports/dashboard-summary`, `/reports/revenue`, `/reports/occupancy`, `/reports/debt`, `/reports/contracts-expiring`, `/reports/system-status` |
| OCR multipart | POST `/ai/ocr/id-card` (front/back), `/ai/ocr/meter` (image + meterType) |

Tòa/tầng, biểu giá, thành viên phòng, yêu cầu phòng, quyết toán, khiếu nại và hóa đơn SaaS dùng controller và entity/repository riêng. Prefix `/records` cũ không còn là đường dẫn hiện hành.

Luồng tạo dữ liệu cơ bản theo mã nguồn:

1. POST `/properties` để tạo cơ sở. BE tạo tòa và tầng mặc định.
2. GET `/rooms/floors` lấy `floorId`; POST `/rooms` với `floorId`, `roomNumber`, `basePrice`, `area`, `maxOccupants`.
3. POST `/tenants` với `fullName`, `identityCard`, `birthDate`, `gender`, `phone`, `email`.
4. POST `/contracts` với `tenantId`, `roomId`, `startDate`, `endDate`, `rentalPrice`, `depositAmount`, `paymentCycle`.
5. Ký và xác nhận đã nhận cọc qua hai API tương ứng; tạo yêu cầu gia hạn/trả phòng qua `/contracts/requests`.
6. POST `/meters/readings` ghi điện nước; POST `/invoices/generate-monthly` tạo hóa đơn; FE cập nhật phí bằng PUT `/invoices/{id}/meter-fees` khi hóa đơn đã có.
7. POST `/invoices/{id}/confirm-payment` xác nhận thu tiền. POST `/payments` ghi nhận giao dịch trong nhánh thanh toán phù hợp.
8. POST `/maintenance`, PUT `/maintenance/{id}/status` xử lý bảo trì; POST `/invoices/{id}/maintenance-fee` nếu thu thêm phí.

API VNPay/MoMo/SePay/OCR cần cấu hình nhà cung cấp ở BE. Đây là tài liệu đối chiếu mã nguồn; build/test và kiểm thử đầu cuối cho lần dọn API này để sau theo yêu cầu người dùng.
