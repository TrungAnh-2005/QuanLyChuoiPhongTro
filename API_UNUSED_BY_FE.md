# Đối chiếu API FE–BE và dọn endpoint thừa

Rà soát mã nguồn ngày 16/11/2026. Báo cáo này thay thế số liệu của lần rà soát 12/11; chỉ kết luận về mã nguồn. Build/test và kiểm thử đầu cuối cho thay đổi lần này để sau theo yêu cầu người dùng.

## Kết quả

- Trước khi dọn: 105 endpoint REST khai báo trong controller, tính riêng từng cặp HTTP method + path, kể cả alias.
- FE có lời gọi tới 94 endpoint; cả 94 đều có mapping BE và prefix Gateway tương ứng. Chưa thấy API FE đang gọi bị thiếu ở BE.
- Giữ thêm 4 endpoint chỉ được các service nội bộ gọi.
- Xóa 7 endpoint không có luồng gọi đang dùng. BE còn 98 endpoint.
- Danh sách đầy đủ kèm vị trí lời gọi: [API_LIST.md](API_LIST.md). Tài liệu cũ chưa ghi POST `/api/contracts/{id}/leave`, POST `/api/invoices/{id}/confirm-payment` và chưa tính riêng các alias.

Đã kiểm tra cả `api.get/post/put/patch/delete`, helper `request`, các resource động trong `DataContext`, các trang/component sử dụng action, cấu hình Gateway và các Feign client. Giữ các API tài khoản cho chế độ xác thực thật, dù môi trường hiện tại có thể bật test mode. API của hạ tầng như Actuator, Eureka và OpenAPI không thuộc nhóm API nghiệp vụ cần dọn.

## Theo service sau khi dọn

| Service | FE có lời gọi | Chỉ gọi nội bộ | Tổng giữ |
|---|---:|---:|---:|
| auth-service | 16 | 0 | 16 |
| room-service | 17 | 1 | 18 |
| tenant-service | 11 | 1 | 12 |
| contract-service | 14 | 1 | 15 |
| meter-service | 5 | 1 | 6 |
| billing-service | 8 | 0 | 8 |
| payment-service | 7 | 0 | 7 |
| maintenance-service | 3 | 0 | 3 |
| notification-service | 5 | 0 | 5 |
| report-service | 6 | 0 | 6 |
| ai-service | 2 | 0 | 2 |
| **Tổng** | **94** | **4** | **98** |

## Endpoint đã xóa trong lần này

| Method | Endpoint | Căn cứ |
|---|---|---|
| GET | `/api/boarding-houses` | FE đọc danh sách qua `/api/properties`; không có caller nội bộ dùng alias |
| POST | `/api/boarding-houses` | FE tạo cơ sở qua `/api/properties` |
| PUT | `/api/boarding-houses/{id}` | FE cập nhật cơ sở qua `/api/properties/{id}` |
| DELETE | `/api/boarding-houses/{id}` | FE xóa cơ sở qua `/api/properties/{id}` |
| POST | `/api/ai/id-card-ocr` | FE và AiClient của tenant-service dùng `/api/ai/ocr/id-card` |
| POST | `/api/ai/meter-ocr` | FE và AiClient của meter-service dùng `/api/ai/ocr/meter` |
| POST | `/api/contracts/{id}/representative` | Chỉ được khai báo trong action `transferContractHolder`, không có màn hình/component hay service nào gọi action/endpoint này |

Đã xóa cả predicate Gateway `/api/boarding-houses/**` và action FE `transferContractHolder` tương ứng. Luồng chuyển người đại diện khi rời phòng vẫn được gọi qua `/api/contracts/{id}/leave`: `PersonalLeaveController` kiểm tra thành viên tiếp quản, cập nhật vai trò thành viên và người đại diện hợp đồng.

## Endpoint nội bộ cần giữ dù FE không gọi trực tiếp

| Method | Endpoint | Caller |
|---|---|---|
| GET | `/api/rooms/{id}` | contract-service: `RoomClient`, dùng trong tạo hợp đồng và duyệt yêu cầu |
| GET | `/api/tenants/{id}` | contract-service: `TenantClient`, dùng trong tạo hợp đồng và rời phòng |
| GET | `/api/contracts/{id}` | billing-service: `ContractClient`, dùng trong tạo hóa đơn |
| GET | `/api/meters/rooms/{roomId}/latest` | billing-service: `MeterClient`, dùng trong tính điện nước hóa đơn |

Một số endpoint được cả FE và service nội bộ gọi, ví dụ PATCH `/api/rooms/{id}/status`, PATCH `/api/tenants/members/{id}` và các API danh sách. Tất cả vẫn được giữ. Một số helper FE không còn màn hình gọi nhưng dùng chung endpoint với luồng đang hoạt động; chúng không phải căn cứ để xóa endpoint đó.

## Phạm vi xác nhận

Đã đối chiếu mã nguồn và review diff. Không thay đổi schema/database hoặc dữ liệu nghiệp vụ. Không khởi động lại hay triển khai các service đang chạy.

Phần build/test cho thay đổi BE chưa hoàn tất và được để sau theo yêu cầu người dùng. Đối chiếu method/path không xác nhận payload, phân quyền, phản hồi từ nhà cung cấp OCR/thanh toán hay toàn bộ hành vi chạy thực tế.
