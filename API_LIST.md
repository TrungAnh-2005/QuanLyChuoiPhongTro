# Danh sách API hệ thống Quản lý Chuỗi Phòng Trọ

Tài liệu tổng hợp toàn bộ các REST API hiện có từ các microservice backend (gọi qua API Gateway mặc định `http://localhost:8080`).

Đối chiếu mã nguồn ngày 16/11/2026: **98 endpoint** theo cặp method + path, gồm **94 endpoint có lời gọi từ FE** và **4 endpoint chỉ được gọi nội bộ**. Đã bỏ 7 endpoint thừa so với 105 endpoint trước lần rà soát này. Cột nơi gọi ghi vị trí lời gọi trong mã nguồn; chưa xác nhận vận hành bằng build/test hoặc kiểm thử đầu cuối cho thay đổi này.

---

## 1. Auth Service (`/api/auth/**`)

### `AuthController`
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `POST` | `/api/auth/login` | Đăng nhập, trả về access/refresh token | FE: [AuthContext.jsx:37](frontend/src/contexts/AuthContext.jsx#L37) |
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới | FE: [AuthContext.jsx:44](frontend/src/contexts/AuthContext.jsx#L44) |
| `POST` | `/api/auth/refresh` | Làm mới access token | FE: [api.js:25](frontend/src/services/api.js#L25) |
| `GET` | `/api/auth/me` | Lấy thông tin tài khoản đang đăng nhập | FE: [AuthContext.jsx:26](frontend/src/contexts/AuthContext.jsx#L26) |

### `AccountManagementController`
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `GET` | `/api/auth/accounts/me` | Xem thông tin tài khoản của bản thân | FE: [DataContext.jsx:27](frontend/src/contexts/DataContext.jsx#L27) |
| `GET` | `/api/auth/accounts` | Danh sách tài khoản (`ROLE_ADMIN`) | FE: [DataContext.jsx:27](frontend/src/contexts/DataContext.jsx#L27) |
| `POST` | `/api/auth/accounts` | Tạo tài khoản mới (`ROLE_ADMIN`) | FE: [DataContext.jsx:234](frontend/src/contexts/DataContext.jsx#L234) |
| `PATCH` | `/api/auth/accounts/{id}` | Cập nhật tài khoản (`ROLE_ADMIN`) | FE: [DataContext.jsx:235](frontend/src/contexts/DataContext.jsx#L235) |
| `POST` | `/api/auth/accounts/{id}/reset-password` | Đặt lại mật khẩu theo ID (`ROLE_ADMIN`) | FE: [DataContext.jsx:237](frontend/src/contexts/DataContext.jsx#L237) |
| `POST` | `/api/auth/accounts/reset-by-email` | Đặt lại mật khẩu theo email (`ROLE_ADMIN`) | FE: [DataContext.jsx:238](frontend/src/contexts/DataContext.jsx#L238) |
| `GET` | `/api/auth/profiles` | Danh sách hồ sơ nhân sự/tài khoản (`ROLE_ADMIN`, `ROLE_STAFF`) | FE: [DataContext.jsx:27](frontend/src/contexts/DataContext.jsx#L27) |
| `PATCH` | `/api/auth/profiles/{id}` | Cập nhật hồ sơ (`ROLE_ADMIN`) | FE: [DataContext.jsx:239](frontend/src/contexts/DataContext.jsx#L239) |

### `SystemManagementController`
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `GET` | `/api/auth/integrations` | Lấy cấu hình tích hợp hệ thống | FE: [DataContext.jsx:27](frontend/src/contexts/DataContext.jsx#L27) |
| `PUT` | `/api/auth/integrations/{key}` | Cập nhật cấu hình tích hợp theo key | FE: [DataContext.jsx:240](frontend/src/contexts/DataContext.jsx#L240) |
| `GET` | `/api/auth/audit-logs` | Xem nhật ký thao tác hệ thống | FE: [DataContext.jsx:27](frontend/src/contexts/DataContext.jsx#L27) |
| `POST` | `/api/auth/audit-logs` | Ghi nhận nhật ký thao tác | FE: [DataContext.jsx:241](frontend/src/contexts/DataContext.jsx#L241) |

---

## 2. Room Service (`/api/rooms/**`, `/api/properties/**`)

### `BoardingHouseController` (`/api/properties`)
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `POST` | `/api/properties` | Tạo cơ sở / nhà trọ mới | FE: [DataContext.jsx:246](frontend/src/contexts/DataContext.jsx#L246) |
| `GET` | `/api/properties` | Lấy danh sách cơ sở / nhà trọ | FE: [StaffBoardingHousesPage.jsx:438](frontend/src/pages/staff/StaffBoardingHousesPage.jsx#L438) |
| `PUT` | `/api/properties/{id}` | Cập nhật cơ sở / nhà trọ | FE: [DataContext.jsx:247](frontend/src/contexts/DataContext.jsx#L247) |
| `DELETE` | `/api/properties/{id}` | Xóa cơ sở / nhà trọ | FE: [DataContext.jsx:248](frontend/src/contexts/DataContext.jsx#L248) |

### `RoomController` (`/api/rooms`)
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `POST` | `/api/rooms` | Tạo phòng mới | FE: [DataContext.jsx:146](frontend/src/contexts/DataContext.jsx#L146) |
| `GET` | `/api/rooms` | Danh sách phòng | FE: [DataContext.jsx:26](frontend/src/contexts/DataContext.jsx#L26); BE nội bộ: [RoomClient.java:12](backend/services/report-service/src/main/java/com/rental/report/client/RoomClient.java#L12) |
| `GET` | `/api/rooms/{id}` | Chi tiết phòng | BE nội bộ: [RoomClient.java:15](backend/services/contract-service/src/main/java/com/rental/contract/client/RoomClient.java#L15) |
| `PUT` | `/api/rooms/{id}` | Cập nhật thông tin phòng | FE: [DataContext.jsx:147](frontend/src/contexts/DataContext.jsx#L147) |
| `PATCH` | `/api/rooms/{id}/status` | Cập nhật trạng thái phòng | FE: [DataContext.jsx:149](frontend/src/contexts/DataContext.jsx#L149); BE nội bộ: [RoomClient.java:18](backend/services/contract-service/src/main/java/com/rental/contract/client/RoomClient.java#L18) |
| `DELETE` | `/api/rooms/{id}` | Xóa phòng | FE: [DataContext.jsx:150](frontend/src/contexts/DataContext.jsx#L150) |

### `RoomStructureController` (`/api/rooms`) — *JpaRepository*
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `GET` | `/api/rooms/service-configs` | Danh sách cấu hình giá dịch vụ theo cơ sở | FE: [DataContext.jsx:26](frontend/src/contexts/DataContext.jsx#L26) |
| `POST` | `/api/rooms/service-configs` | Tạo cấu hình dịch vụ (`ROLE_ADMIN`, `ROLE_STAFF`) | FE: [DataContext.jsx:185](frontend/src/contexts/DataContext.jsx#L185) |
| `PATCH` | `/api/rooms/service-configs/{id}` | Cập nhật cấu hình dịch vụ (`ROLE_ADMIN`, `ROLE_STAFF`) | FE: [DataContext.jsx:120](frontend/src/contexts/DataContext.jsx#L120) |
| `DELETE` | `/api/rooms/service-configs/{id}` | Xóa cấu hình dịch vụ (`ROLE_ADMIN`, `ROLE_STAFF`) | FE: [DataContext.jsx:187](frontend/src/contexts/DataContext.jsx#L187) |
| `GET` | `/api/rooms/buildings` | Danh sách tòa nhà | FE: [DataContext.jsx:108](frontend/src/contexts/DataContext.jsx#L108) |
| `POST` | `/api/rooms/buildings` | Tạo tòa nhà (`ROLE_ADMIN`, `ROLE_STAFF`) | FE: [DataContext.jsx:110](frontend/src/contexts/DataContext.jsx#L110) |
| `GET` | `/api/rooms/floors` | Danh sách tầng | FE: [DataContext.jsx:108](frontend/src/contexts/DataContext.jsx#L108) |
| `POST` | `/api/rooms/floors` | Tạo tầng (`ROLE_ADMIN`, `ROLE_STAFF`) | FE: [DataContext.jsx:112](frontend/src/contexts/DataContext.jsx#L112) |

---

## 3. Tenant Service (`/api/tenants/**`)

### `TenantController` (`/api/tenants`)
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `POST` | `/api/tenants` | Tạo khách thuê mới | FE: [DataContext.jsx:135](frontend/src/contexts/DataContext.jsx#L135) |
| `GET` | `/api/tenants` | Danh sách khách thuê | FE: [DataContext.jsx:26](frontend/src/contexts/DataContext.jsx#L26) |
| `GET` | `/api/tenants/{id}` | Chi tiết khách thuê | BE nội bộ: [TenantClient.java:17](backend/services/contract-service/src/main/java/com/rental/contract/client/TenantClient.java#L17) |
| `PUT` | `/api/tenants/{id}` | Cập nhật thông tin khách thuê | FE: [DataContext.jsx:144](frontend/src/contexts/DataContext.jsx#L144) |
| `DELETE` | `/api/tenants/{id}` | Xóa khách thuê | FE: [DataContext.jsx:145](frontend/src/contexts/DataContext.jsx#L145) |

### `RoomMemberController` (`/api/tenants/members`) — *JpaRepository*
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `GET` | `/api/tenants/members` | Danh sách thành viên trong phòng | FE: [DataContext.jsx:26](frontend/src/contexts/DataContext.jsx#L26); BE nội bộ: [TenantClient.java:22](backend/services/contract-service/src/main/java/com/rental/contract/client/TenantClient.java#L22) |
| `POST` | `/api/tenants/members` | Thêm thành viên phòng (`ROLE_ADMIN`, `ROLE_STAFF`) | FE: [DataContext.jsx:209](frontend/src/contexts/DataContext.jsx#L209) |
| `PATCH` | `/api/tenants/members/{id}` | Cập nhật thành viên / trạng thái tạm trú (`ROLE_ADMIN`, `ROLE_STAFF`) | FE: [DataContext.jsx:211](frontend/src/contexts/DataContext.jsx#L211); BE nội bộ: [TenantClient.java:25](backend/services/contract-service/src/main/java/com/rental/contract/client/TenantClient.java#L25) |
| `DELETE` | `/api/tenants/members/{id}` | Xóa thành viên phòng (`ROLE_ADMIN`, `ROLE_STAFF`) | FE: [DataContext.jsx:210](frontend/src/contexts/DataContext.jsx#L210) |

### `RoommateWorkflowController` (`/api/tenants/roommate-requests`) — *JpaRepository*
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `GET` | `/api/tenants/roommate-requests` | Danh sách yêu cầu ở ghép | FE: [DataContext.jsx:26](frontend/src/contexts/DataContext.jsx#L26) |
| `POST` | `/api/tenants/roommate-requests` | Tạo yêu cầu ở ghép | FE: [DataContext.jsx:207](frontend/src/contexts/DataContext.jsx#L207) |
| `POST` | `/api/tenants/roommate-requests/{id}/review` | Duyệt / từ chối yêu cầu ở ghép (`ROLE_ADMIN`, `ROLE_STAFF`) | FE: [DataContext.jsx:208](frontend/src/contexts/DataContext.jsx#L208) |

---

## 4. Contract Service (`/api/contracts/**`)

### `ContractController` (`/api/contracts`)
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `POST` | `/api/contracts` | Tạo hợp đồng mới | FE: [DataContext.jsx:140](frontend/src/contexts/DataContext.jsx#L140) |
| `GET` | `/api/contracts` | Danh sách hợp đồng | FE: [DataContext.jsx:26](frontend/src/contexts/DataContext.jsx#L26); BE nội bộ: [ContractClient.java:17](backend/services/billing-service/src/main/java/com/rental/billing/client/ContractClient.java#L17) |
| `GET` | `/api/contracts/{id}` | Chi tiết hợp đồng | BE nội bộ: [ContractClient.java:14](backend/services/billing-service/src/main/java/com/rental/billing/client/ContractClient.java#L14) |

### `ContractWorkflowController` (`/api/contracts`) — *JpaRepository*
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `POST` | `/api/contracts/requests/{id}/approve` | Duyệt yêu cầu phòng (đổi phòng / gia hạn / trả phòng...) | FE: [DataContext.jsx:189](frontend/src/contexts/DataContext.jsx#L189) |
| `POST` | `/api/contracts/requests/{id}/vote` | Thành viên phòng bỏ phiếu yêu cầu | FE: [DataContext.jsx:127](frontend/src/contexts/DataContext.jsx#L127) |
| `POST` | `/api/contracts/settlements/{id}/complete` | Hoàn tất quyết toán trả phòng | FE: [DataContext.jsx:218](frontend/src/contexts/DataContext.jsx#L218) |
| `POST` | `/api/contracts/{id}/sign` | Ký hợp đồng | FE: [DataContext.jsx:242](frontend/src/contexts/DataContext.jsx#L242) |
| `POST` | `/api/contracts/{id}/confirm-deposit` | Xác nhận đã đóng tiền cọc | FE: [DataContext.jsx:243](frontend/src/contexts/DataContext.jsx#L243) |
| `GET` | `/api/contracts/requests` | Danh sách yêu cầu phòng | FE: [DataContext.jsx:26](frontend/src/contexts/DataContext.jsx#L26) |
| `POST` | `/api/contracts/requests` | Tạo yêu cầu phòng | FE: [DataContext.jsx:188](frontend/src/contexts/DataContext.jsx#L188) |
| `PATCH` | `/api/contracts/requests/{id}` | Cập nhật yêu cầu phòng (`ROLE_ADMIN`, `ROLE_STAFF`) | FE: [DataContext.jsx:190](frontend/src/contexts/DataContext.jsx#L190) |
| `DELETE` | `/api/contracts/requests/{id}` | Xóa yêu cầu phòng (`ROLE_ADMIN`, `ROLE_STAFF`) | FE: [DataContext.jsx:206](frontend/src/contexts/DataContext.jsx#L206) |
| `GET` | `/api/contracts/settlements` | Danh sách hồ sơ quyết toán trả phòng | FE: [DataContext.jsx:26](frontend/src/contexts/DataContext.jsx#L26) |
| `POST` | `/api/contracts/settlements` | Tạo hồ sơ quyết toán trả phòng | FE: [DataContext.jsx:215](frontend/src/contexts/DataContext.jsx#L215) |

### `PersonalLeaveController` (`/api/contracts`)
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `POST` | `/api/contracts/{id}/leave` | Rời phòng; chuyển hợp đồng cho thành viên tiếp quản nếu người đại diện rời phòng | FE: [DataContext.jsx:229](frontend/src/contexts/DataContext.jsx#L229) |

---

## 5. Meter Service (`/api/meters/**`)

### `MeterController` (`/api/meters`)
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `POST` | `/api/meters/readings` | Ghi chỉ số điện/nước | FE: [DataContext.jsx:178](frontend/src/contexts/DataContext.jsx#L178) |
| `GET` | `/api/meters/rooms/{roomId}/latest` | Chỉ số mới nhất của phòng | BE nội bộ: [MeterClient.java:13](backend/services/billing-service/src/main/java/com/rental/billing/client/MeterClient.java#L13) |
| `GET` | `/api/meters/rooms/{roomId}` | Lịch sử chỉ số của phòng | FE: [DataContext.jsx:40](frontend/src/contexts/DataContext.jsx#L40) |

### `MeterDisputeController` (`/api/meters/disputes`) — *JpaRepository*
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `GET` | `/api/meters/disputes` | Danh sách khiếu nại chỉ số điện/nước | FE: [DataContext.jsx:26](frontend/src/contexts/DataContext.jsx#L26) |
| `POST` | `/api/meters/disputes` | Gửi khiếu nại chỉ số | FE: [DataContext.jsx:213](frontend/src/contexts/DataContext.jsx#L213) |
| `PATCH` | `/api/meters/disputes/{id}` | Cập nhật / xử lý khiếu nại (`ROLE_ADMIN`, `ROLE_STAFF`) | FE: [DataContext.jsx:214](frontend/src/contexts/DataContext.jsx#L214) |

---

## 6. Billing Service (`/api/invoices/**`)

### `BillingController` (`/api/invoices`)
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `POST` | `/api/invoices/generate-monthly` | Tạo hóa đơn hàng tháng | FE: [DataContext.jsx:182](frontend/src/contexts/DataContext.jsx#L182) |
| `GET` | `/api/invoices` | Danh sách hóa đơn | FE: [DataContext.jsx:26](frontend/src/contexts/DataContext.jsx#L26); BE nội bộ: [BillingClient.java:12](backend/services/contract-service/src/main/java/com/rental/contract/client/BillingClient.java#L12) |

### `InvoiceWorkflowController` (`/api/invoices`) — *JpaRepository*
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `PUT` | `/api/invoices/{id}/meter-fees` | Điều chỉnh phí điện/nước trên hóa đơn | FE: [DataContext.jsx:181](frontend/src/contexts/DataContext.jsx#L181) |
| `POST` | `/api/invoices/{id}/confirm-payment` | Xác nhận thu tiền hóa đơn | FE: [DataContext.jsx:157](frontend/src/contexts/DataContext.jsx#L157) |
| `POST` | `/api/invoices/{id}/maintenance-fee` | Cộng thêm phí bảo trì vào hóa đơn | FE: [DataContext.jsx:125](frontend/src/contexts/DataContext.jsx#L125) |
| `POST` | `/api/invoices/saas/{id}/confirm-payment` | Xác nhận thanh toán hóa đơn SaaS | FE: [DataContext.jsx:233](frontend/src/contexts/DataContext.jsx#L233) |
| `GET` | `/api/invoices/saas` | Danh sách hóa đơn gói SaaS | FE: [DataContext.jsx:26](frontend/src/contexts/DataContext.jsx#L26) |
| `POST` | `/api/invoices/saas` | Tạo hóa đơn gói SaaS (`ROLE_ADMIN`, `ROLE_STAFF`) | FE: [DataContext.jsx:232](frontend/src/contexts/DataContext.jsx#L232) |

---

## 7. Payment Service (`/api/payments/**`)

### `PaymentController` (`/api/payments`)
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `POST` | `/api/payments` | Ghi nhận giao dịch thanh toán | FE: [DataContext.jsx:160](frontend/src/contexts/DataContext.jsx#L160) |

### `VNPayController` (`/api/payments/vnpay`)
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `POST` | `/api/payments/vnpay/create-url` | Tạo URL thanh toán VNPay | FE: [vnpayService.js:13](frontend/src/services/vnpayService.js#L13) |
| `GET` | `/api/payments/vnpay/verify` | Xác thực kết quả VNPay callback | FE: [VNPayReturnPage.jsx:7](frontend/src/pages/payment/VNPayReturnPage.jsx#L7) |

### `MoMoController` (`/api/payments/momo`)
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `POST` | `/api/payments/momo/create-url` | Tạo URL thanh toán MoMo | FE: [momoService.js:15](frontend/src/services/momoService.js#L15) |
| `GET` | `/api/payments/momo/verify` | Xác thực kết quả MoMo callback | FE: [MoMoReturnPage.jsx:7](frontend/src/pages/payment/MoMoReturnPage.jsx#L7) |

### `SePayController` (`/api/payments/sepay`)
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `GET` | `/api/payments/sepay/accounts` | Danh sách tài khoản ngân hàng SePay | FE: [sepayService.js:8](frontend/src/services/sepayService.js#L8) |
| `GET` | `/api/payments/sepay/check` | Kiểm tra giao dịch chuyển khoản SePay | FE: [sepayService.js:10](frontend/src/services/sepayService.js#L10) |

---

## 8. Maintenance Service (`/api/maintenance/**`)

### `MaintenanceController` (`/api/maintenance`)
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `POST` | `/api/maintenance` | Tạo yêu cầu bảo trì / sửa chữa | FE: [DataContext.jsx:151](frontend/src/contexts/DataContext.jsx#L151) |
| `GET` | `/api/maintenance` | Danh sách yêu cầu bảo trì | FE: [DataContext.jsx:26](frontend/src/contexts/DataContext.jsx#L26) |
| `PUT` | `/api/maintenance/{id}/status` | Cập nhật trạng thái xử lý bảo trì | FE: [DataContext.jsx:152](frontend/src/contexts/DataContext.jsx#L152) |

---

## 9. Notification Service (`/api/notifications/**`)

### `NotificationController` (`/api/notifications`)
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `POST` | `/api/notifications` | Tạo thông báo mới | FE: [DataContext.jsx:128](frontend/src/contexts/DataContext.jsx#L128) |
| `GET` | `/api/notifications` | Danh sách thông báo theo `X-User-Id` | FE: [DataContext.jsx:27](frontend/src/contexts/DataContext.jsx#L27) |
| `GET` | `/api/notifications/unread-count` | Đếm số thông báo chưa đọc | FE: [DataContext.jsx:27](frontend/src/contexts/DataContext.jsx#L27) |
| `PATCH` | `/api/notifications/{id}/read` | Đánh dấu 1 thông báo đã đọc | FE: [DataContext.jsx:244](frontend/src/contexts/DataContext.jsx#L244) |
| `PATCH` | `/api/notifications/read-all` | Đánh dấu tất cả đã đọc | FE: [DataContext.jsx:245](frontend/src/contexts/DataContext.jsx#L245) |

---

## 10. Report Service (`/api/reports/**`)

### `ReportController` (`/api/reports`)
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `GET` | `/api/reports/dashboard-summary` | Tổng quan dashboard | FE: [DataContext.jsx:27](frontend/src/contexts/DataContext.jsx#L27) |
| `GET` | `/api/reports/revenue` | Báo cáo doanh thu | FE: [DataContext.jsx:27](frontend/src/contexts/DataContext.jsx#L27) |
| `GET` | `/api/reports/occupancy` | Tỷ lệ lấp đầy phòng | FE: [DataContext.jsx:27](frontend/src/contexts/DataContext.jsx#L27) |
| `GET` | `/api/reports/debt` | Báo cáo công nợ | FE: [DataContext.jsx:27](frontend/src/contexts/DataContext.jsx#L27) |
| `GET` | `/api/reports/contracts-expiring` | Danh sách hợp đồng sắp hết hạn | FE: [DataContext.jsx:27](frontend/src/contexts/DataContext.jsx#L27) |

### `SystemStatusController` (`/api/reports`)
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `GET` | `/api/reports/system-status` | Kiểm tra trạng thái hoạt động các service | FE: [DataContext.jsx:27](frontend/src/contexts/DataContext.jsx#L27) |

---

## 11. AI Service (`/api/ai/**`)

### `AiController` (`/api/ai`)
| Method | Endpoint | Mô tả | Nơi gọi trong mã nguồn |
|---|---|---|---|
| `POST` | `/api/ai/ocr/id-card` | Trích xuất thông tin CCCD/CMND bằng AI (`multipart/form-data`) | FE: [aiService.js:1162](frontend/src/services/aiService.js#L1162); BE nội bộ: [AiClient.java:13](backend/services/tenant-service/src/main/java/com/rental/tenant/client/AiClient.java#L13) |
| `POST` | `/api/ai/ocr/meter` | Đọc chỉ số đồng hồ điện/nước bằng AI (`multipart/form-data`) | FE: [aiService.js:1641](frontend/src/services/aiService.js#L1641); BE nội bộ: [AiClient.java:14](backend/services/meter-service/src/main/java/com/rental/meter/client/AiClient.java#L14) |

