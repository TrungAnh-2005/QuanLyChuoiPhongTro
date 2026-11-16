# Danh sách API hệ thống Quản lý Chuỗi Phòng Trọ

Tài liệu tổng hợp toàn bộ các REST API hiện có từ các microservice backend (gọi qua API Gateway mặc định `http://localhost:8080`).

---

## 1. Auth Service (`/api/auth/**`)

### `AuthController`
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/auth/login` | Đăng nhập, trả về access/refresh token |
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới |
| `POST` | `/api/auth/refresh` | Làm mới access token |
| `GET` | `/api/auth/me` | Lấy thông tin tài khoản đang đăng nhập |

### `AccountManagementController`
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/auth/accounts/me` | Xem thông tin tài khoản của bản thân |
| `GET` | `/api/auth/accounts` | Danh sách tài khoản (`ROLE_ADMIN`) |
| `POST` | `/api/auth/accounts` | Tạo tài khoản mới (`ROLE_ADMIN`) |
| `PATCH` | `/api/auth/accounts/{id}` | Cập nhật tài khoản (`ROLE_ADMIN`) |
| `POST` | `/api/auth/accounts/{id}/reset-password` | Đặt lại mật khẩu theo ID (`ROLE_ADMIN`) |
| `POST` | `/api/auth/accounts/reset-by-email` | Đặt lại mật khẩu theo email (`ROLE_ADMIN`) |
| `GET` | `/api/auth/profiles` | Danh sách hồ sơ nhân sự/tài khoản (`ROLE_ADMIN`, `ROLE_STAFF`) |
| `PATCH` | `/api/auth/profiles/{id}` | Cập nhật hồ sơ (`ROLE_ADMIN`) |

### `SystemManagementController`
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/auth/integrations` | Lấy cấu hình tích hợp hệ thống |
| `PUT` | `/api/auth/integrations/{key}` | Cập nhật cấu hình tích hợp theo key |
| `GET` | `/api/auth/audit-logs` | Xem nhật ký thao tác hệ thống |
| `POST` | `/api/auth/audit-logs` | Ghi nhận nhật ký thao tác |

---

## 2. Room Service (`/api/rooms/**`, `/api/boarding-houses/**`, `/api/properties/**`)

### `BoardingHouseController` (`/api/boarding-houses` hoặc `/api/properties`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/boarding-houses` | Tạo cơ sở / nhà trọ mới |
| `GET` | `/api/boarding-houses` | Lấy danh sách cơ sở / nhà trọ |
| `PUT` | `/api/boarding-houses/{id}` | Cập nhật cơ sở / nhà trọ |
| `DELETE` | `/api/boarding-houses/{id}` | Xóa cơ sở / nhà trọ |

### `RoomController` (`/api/rooms`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/rooms` | Tạo phòng mới |
| `GET` | `/api/rooms` | Danh sách phòng |
| `GET` | `/api/rooms/{id}` | Chi tiết phòng |
| `PUT` | `/api/rooms/{id}` | Cập nhật thông tin phòng |
| `PATCH` | `/api/rooms/{id}/status` | Cập nhật trạng thái phòng |
| `DELETE` | `/api/rooms/{id}` | Xóa phòng |

### `RoomStructureController` (`/api/rooms`) — *JpaRepository*
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/rooms/service-configs` | Danh sách cấu hình giá dịch vụ theo cơ sở |
| `POST` | `/api/rooms/service-configs` | Tạo cấu hình dịch vụ (`ROLE_ADMIN`, `ROLE_STAFF`) |
| `PATCH` | `/api/rooms/service-configs/{id}` | Cập nhật cấu hình dịch vụ (`ROLE_ADMIN`, `ROLE_STAFF`) |
| `DELETE` | `/api/rooms/service-configs/{id}` | Xóa cấu hình dịch vụ (`ROLE_ADMIN`, `ROLE_STAFF`) |
| `GET` | `/api/rooms/buildings` | Danh sách tòa nhà |
| `POST` | `/api/rooms/buildings` | Tạo tòa nhà (`ROLE_ADMIN`, `ROLE_STAFF`) |
| `GET` | `/api/rooms/floors` | Danh sách tầng |
| `POST` | `/api/rooms/floors` | Tạo tầng (`ROLE_ADMIN`, `ROLE_STAFF`) |

---

## 3. Tenant Service (`/api/tenants/**`)

### `TenantController` (`/api/tenants`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/tenants` | Tạo khách thuê mới |
| `GET` | `/api/tenants` | Danh sách khách thuê |
| `GET` | `/api/tenants/{id}` | Chi tiết khách thuê |
| `PUT` | `/api/tenants/{id}` | Cập nhật thông tin khách thuê |
| `DELETE` | `/api/tenants/{id}` | Xóa khách thuê |

### `RoomMemberController` (`/api/tenants/members`) — *JpaRepository*
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/tenants/members` | Danh sách thành viên trong phòng |
| `POST` | `/api/tenants/members` | Thêm thành viên phòng (`ROLE_ADMIN`, `ROLE_STAFF`) |
| `PATCH` | `/api/tenants/members/{id}` | Cập nhật thành viên / trạng thái tạm trú (`ROLE_ADMIN`, `ROLE_STAFF`) |
| `DELETE` | `/api/tenants/members/{id}` | Xóa thành viên phòng (`ROLE_ADMIN`, `ROLE_STAFF`) |

### `RoommateWorkflowController` (`/api/tenants/roommate-requests`) — *JpaRepository*
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/tenants/roommate-requests` | Danh sách yêu cầu ở ghép |
| `POST` | `/api/tenants/roommate-requests` | Tạo yêu cầu ở ghép |
| `POST` | `/api/tenants/roommate-requests/{id}/review` | Duyệt / từ chối yêu cầu ở ghép (`ROLE_ADMIN`, `ROLE_STAFF`) |

---

## 4. Contract Service (`/api/contracts/**`)

### `ContractController` (`/api/contracts`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/contracts` | Tạo hợp đồng mới |
| `GET` | `/api/contracts` | Danh sách hợp đồng |
| `GET` | `/api/contracts/{id}` | Chi tiết hợp đồng |

### `ContractWorkflowController` (`/api/contracts`) — *JpaRepository*
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/contracts/requests/{id}/approve` | Duyệt yêu cầu phòng (đổi phòng / gia hạn / trả phòng...) |
| `POST` | `/api/contracts/requests/{id}/vote` | Thành viên phòng bỏ phiếu yêu cầu |
| `POST` | `/api/contracts/settlements/{id}/complete` | Hoàn tất quyết toán trả phòng |
| `POST` | `/api/contracts/{id}/sign` | Ký hợp đồng |
| `POST` | `/api/contracts/{id}/confirm-deposit` | Xác nhận đã đóng tiền cọc |
| `POST` | `/api/contracts/{id}/representative` | Đổi người đại diện hợp đồng |
| `GET` | `/api/contracts/requests` | Danh sách yêu cầu phòng |
| `POST` | `/api/contracts/requests` | Tạo yêu cầu phòng |
| `PATCH` | `/api/contracts/requests/{id}` | Cập nhật yêu cầu phòng (`ROLE_ADMIN`, `ROLE_STAFF`) |
| `DELETE` | `/api/contracts/requests/{id}` | Xóa yêu cầu phòng (`ROLE_ADMIN`, `ROLE_STAFF`) |
| `GET` | `/api/contracts/settlements` | Danh sách hồ sơ quyết toán trả phòng |
| `POST` | `/api/contracts/settlements` | Tạo hồ sơ quyết toán trả phòng |

---

## 5. Meter Service (`/api/meters/**`)

### `MeterController` (`/api/meters`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/meters/readings` | Ghi chỉ số điện/nước (alias) |
| `GET` | `/api/meters/rooms/{roomId}/latest` | Chỉ số mới nhất của phòng |
| `GET` | `/api/meters/rooms/{roomId}` | Lịch sử chỉ số của phòng |

### `MeterDisputeController` (`/api/meters/disputes`) — *JpaRepository*
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/meters/disputes` | Danh sách khiếu nại chỉ số điện/nước |
| `POST` | `/api/meters/disputes` | Gửi khiếu nại chỉ số |
| `PATCH` | `/api/meters/disputes/{id}` | Cập nhật / xử lý khiếu nại (`ROLE_ADMIN`, `ROLE_STAFF`) |

---

## 6. Billing Service (`/api/invoices/**`)

### `BillingController` (`/api/invoices`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/invoices/generate-monthly` | Tạo hóa đơn hàng tháng |
| `GET` | `/api/invoices` | Danh sách hóa đơn |

### `InvoiceWorkflowController` (`/api/invoices`) — *JpaRepository*
| Method | Endpoint | Mô tả |
|---|---|---|
| `PUT` | `/api/invoices/{id}/meter-fees` | Điều chỉnh phí điện/nước trên hóa đơn |
| `POST` | `/api/invoices/{id}/maintenance-fee` | Cộng thêm phí bảo trì vào hóa đơn |
| `POST` | `/api/invoices/saas/{id}/confirm-payment` | Xác nhận thanh toán hóa đơn SaaS |
| `GET` | `/api/invoices/saas` | Danh sách hóa đơn gói SaaS |
| `POST` | `/api/invoices/saas` | Tạo hóa đơn gói SaaS (`ROLE_ADMIN`, `ROLE_STAFF`) |

---

## 7. Payment Service (`/api/payments/**`)

### `PaymentController` (`/api/payments`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/payments` | Ghi nhận giao dịch thanh toán |

### `VNPayController` (`/api/payments/vnpay`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/payments/vnpay/create-url` | Tạo URL thanh toán VNPay |
| `GET` | `/api/payments/vnpay/verify` | Xác thực kết quả VNPay callback |

### `MoMoController` (`/api/payments/momo`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/payments/momo/create-url` | Tạo URL thanh toán MoMo |
| `GET` | `/api/payments/momo/verify` | Xác thực kết quả MoMo callback |

### `SePayController` (`/api/payments/sepay`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/payments/sepay/accounts` | Danh sách tài khoản ngân hàng SePay |
| `GET` | `/api/payments/sepay/check` | Kiểm tra giao dịch chuyển khoản SePay |

---

## 8. Maintenance Service (`/api/maintenance/**`)

### `MaintenanceController` (`/api/maintenance`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/maintenance` | Tạo yêu cầu bảo trì / sửa chữa |
| `GET` | `/api/maintenance` | Danh sách yêu cầu bảo trì |
| `PUT` | `/api/maintenance/{id}/status` | Cập nhật trạng thái xử lý bảo trì |

---

## 9. Notification Service (`/api/notifications/**`)

### `NotificationController` (`/api/notifications`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/notifications` | Tạo thông báo mới |
| `GET` | `/api/notifications` | Danh sách thông báo theo `X-User-Id` |
| `GET` | `/api/notifications/unread-count` | Đếm số thông báo chưa đọc |
| `PATCH` | `/api/notifications/{id}/read` | Đánh dấu 1 thông báo đã đọc |
| `PATCH` | `/api/notifications/read-all` | Đánh dấu tất cả đã đọc |

---

## 10. Report Service (`/api/reports/**`)

### `ReportController` (`/api/reports`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/reports/dashboard-summary` | Tổng quan dashboard |
| `GET` | `/api/reports/revenue` | Báo cáo doanh thu |
| `GET` | `/api/reports/occupancy` | Tỷ lệ lấp đầy phòng |
| `GET` | `/api/reports/debt` | Báo cáo công nợ |
| `GET` | `/api/reports/contracts-expiring` | Danh sách hợp đồng sắp hết hạn |

### `SystemStatusController` (`/api/reports`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/reports/system-status` | Kiểm tra trạng thái hoạt động các service |

---

## 11. AI Service (`/api/ai/**`)

### `AiController` (`/api/ai`)
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/ai/ocr/id-card` (alias: `/api/ai/id-card-ocr`) | Trích xuất thông tin CCCD/CMND bằng AI (`multipart/form-data`) |
| `POST` | `/api/ai/ocr/meter` (alias: `/api/ai/meter-ocr`) | Đọc chỉ số đồng hồ điện/nước bằng AI (`multipart/form-data`) |

