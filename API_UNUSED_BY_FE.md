# Kết quả nối API FE và dọn API BE

Ngày cập nhật: 12/11/2026. Tài liệu này thay thế kết quả rà soát trước khi sửa.

## Tổng hợp

- Trước khi sửa: 128 API trong API_LIST.md, trong đó 41 API chưa có luồng gọi từ FE.
- Đã nối 6 API trong danh sách cũ vào FE, đồng thời nối thao tác cập nhật tạm trú qua API PATCH thành viên.
- Giữ 4 API chưa được FE gọi trực tiếp vì các service khác đang sử dụng.
- Xóa 31 endpoint không có luồng sử dụng, 13 phương thức service không còn nơi gọi và action reset hóa đơn SaaS thừa trên FE.
- API_LIST.md hiện còn 97 API. Không thay đổi dữ liệu hoặc xóa bảng trong database.

## Các luồng đã nối API

| Luồng | API | Vị trí |
|---|---|---|
| Làm mới phiên khi access token hết hạn; dùng chung một lần refresh cho các request đồng thời, retry tối đa một lần | POST /api/auth/refresh | frontend/src/services/api.js |
| Tổng số thông báo chưa đọc từ server | GET /api/notifications/unread-count | DataContext.jsx và Navbar.jsx |
| Thêm khách đã có hồ sơ vào phòng có hợp đồng hoạt động | POST /api/tenants/members | RoomMemberActions.jsx trong modal cư dân ở StaffRoomsPage.jsx |
| Xóa thành viên ở ghép khỏi phòng | DELETE /api/tenants/members/{id} | RoomMemberActions.jsx |
| Cập nhật tạm trú | PATCH /api/tenants/members/{id} | RoomMemberActions.jsx và modal đổi trạng thái tại StaffTenantsPage.jsx |
| Duyệt hoặc từ chối yêu cầu ở ghép | POST /api/tenants/roommate-requests/{id}/review | WorkflowReviewPanel.jsx trên StaffRoomsPage.jsx |
| Xử lý hoặc từ chối khiếu nại chỉ số, lưu ghi chú | PATCH /api/meters/disputes/{id} | WorkflowReviewPanel.jsx trên StaffMetersPage.jsx |

Các thao tác chờ API hoàn tất, hiển thị lỗi và tải lại dữ liệu từ server. Đánh dấu khiếu nại đã xử lý không tự thay đổi chỉ số hay phí hóa đơn; nhân viên điều chỉnh qua luồng ghi chỉ số hiện có nếu cần.

## API nội bộ được giữ

| API | Nơi gọi |
|---|---|
| GET /api/rooms/{id} | contract-service / RoomClient |
| GET /api/tenants/{id} | contract-service / TenantClient |
| GET /api/contracts/{id} | billing-service / ContractClient |
| GET /api/meters/rooms/{roomId}/latest | billing-service / MeterClient |

Logic gia hạn/chấm dứt hợp đồng vẫn được giữ trong ContractService: các bước duyệt yêu cầu và hoàn tất quyết toán gọi trực tiếp logic này. Chỉ bỏ hai endpoint thao tác trực tiếp không có nơi sử dụng.

## Các endpoint đã xóa

| Method | Endpoint | Controller |
|---|---|---|
| `POST` | `/api/auth/change-password` | AuthController |
| `GET` | `/api/boarding-houses/{id}` | BoardingHouseController |
| `POST` | `/api/rooms/boarding-houses` | RoomController |
| `GET` | `/api/rooms/boarding-houses` | RoomController |
| `GET` | `/api/rooms/boarding-houses/{id}` | RoomController |
| `PATCH` | `/api/rooms/buildings/{id}` | RoomStructureController |
| `DELETE` | `/api/rooms/buildings/{id}` | RoomStructureController |
| `PATCH` | `/api/rooms/floors/{id}` | RoomStructureController |
| `DELETE` | `/api/rooms/floors/{id}` | RoomStructureController |
| `POST` | `/api/tenants/ocr-preview` | TenantController |
| `GET` | `/api/tenants/search` | TenantController |
| `PATCH` | `/api/tenants/roommate-requests/{id}` | RoommateWorkflowController |
| `DELETE` | `/api/tenants/roommate-requests/{id}` | RoommateWorkflowController |
| `POST` | `/api/contracts/{id}/terminate` | ContractController |
| `POST` | `/api/contracts/{id}/renew` | ContractController |
| `PATCH` | `/api/contracts/settlements/{id}` | ContractWorkflowController |
| `DELETE` | `/api/contracts/settlements/{id}` | ContractWorkflowController |
| `POST` | `/api/meters` | MeterController |
| `POST` | `/api/meters/readings/ai-scan` | MeterController |
| `GET` | `/api/meters/rooms/{roomId}/devices` | MeterController |
| `DELETE` | `/api/meters/disputes/{id}` | MeterDisputeController |
| `POST` | `/api/invoices` | BillingController |
| `GET` | `/api/invoices/{id}` | BillingController |
| `PUT` | `/api/invoices/{id}/status` | BillingController |
| `PATCH` | `/api/invoices/saas/{id}` | InvoiceWorkflowController |
| `DELETE` | `/api/invoices/saas/{id}` | InvoiceWorkflowController |
| `GET` | `/api/payments` | PaymentController |
| `GET` | `/api/payments/{id}` | PaymentController |
| `GET` | `/api/payments/invoice/{invoiceId}` | PaymentController |
| `GET` | `/api/maintenance/{id}` | MaintenanceController |
| `GET` | `/api/reports/revenue-chart` | ReportController |

Các endpoint OCR trung gian không còn được dùng vì FE gọi AI Service trực tiếp. Alias báo cáo doanh thu và prefix nhà trọ dư cũng được bỏ; các endpoint hiện dùng được giữ lại. Các thao tác xem chi tiết/tìm kiếm đang lọc dữ liệu danh sách tại FE không được thêm request thừa chỉ để giữ endpoint.

## Kiểm tra

- FE: build production thành công; 8 kiểm thử API client thành công, bao gồm refresh đồng thời, refresh thất bại và giới hạn retry.
- Lint chạy thành công, còn cảnh báo trong mã hiện hữu.
- Backend: lượt `test` toàn dự án báo BUILD SUCCESS; lượt `clean test` riêng 10 service có thay đổi cũng báo BUILD SUCCESS. Build sạch toàn dự án bị chặn bởi file đang khóa trong `discovery-server/target`.
- Đã kiểm tra tĩnh: đủ 97 mapping được ghi trong API_LIST.md; cả 31 mapping đã xóa đều không còn trong controller.
- Chưa kiểm thử tương tác đầu cuối trên trình duyệt với hệ thống đang chạy.
