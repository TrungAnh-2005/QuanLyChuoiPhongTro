# Kết quả kiểm tra bản test nghiệp vụ

Kiểm tra ngày 12/11/2026. Stack MySQL/RabbitMQ riêng, Gateway thử nghiệm cổng 18080; không thay đổi database/volume đang có của người dùng.

Sau khi bật test mode, các request dưới đây không gửi JWT và không đăng nhập.

## Hợp đồng, điện nước, ở ghép

```text
PASS GET /rooms 200
PASS GET /tenants 200
PASS GET /contracts 200
PASS POST /contracts/1/sign 200
PASS POST /contracts/1/confirm-deposit 200
PASS POST /meters/readings 201
PASS POST /meters/readings 201
PASS POST /meters/readings 201
PASS GET /meters/rooms/1 200
PASS POST /contracts/records/requests 201
PASS POST /contracts/requests/2/approve 200
PASS POST /meters/records/disputes 201
PASS POST /tenants/records/roommate-requests 201
PASS POST /tenants/roommate-requests/2/review 200
PASS GET /tenants/records/members 200
PHASE 1 PASSED WITHOUT JWT
```

## Hóa đơn, thu tiền, bảo trì, thông báo

```text
PASS POST /invoices 201
PASS PUT /invoices/1/meter-fees 200
PASS POST /maintenance 201
PASS PUT /maintenance/1/status 200
PASS PUT /maintenance/1/status 200
PASS POST /invoices/1/maintenance-fee 200
PASS GET /invoices/1 200
PASS POST /payments 201
PASS GET /invoices/1 200
PASS GET /invoices/1 200
PASS GET /payments/invoice/1 200
PASS POST /invoices/records/saas 201
PASS POST /invoices/saas/1/confirm-payment 200
PASS POST /notifications 201
PASS GET /notifications/unread-count 200
PASS PATCH /notifications/1/read 200
PASS PATCH /notifications/read-all 200
PASS GET /notifications 200
PHASE 2 PASSED WITHOUT JWT
```

Đã xác nhận thêm: sửa chỉ số cùng tháng không sinh bản ghi trùng và giữ số cũ đầu kỳ; sự kiện payment.completed chuyển hóa đơn sang PAID sau khi billing xử lý.

Các provider thanh toán online/OCR chưa được kiểm thử với khóa thật. Các kiểm tra này tập trung nghiệp vụ, không xác nhận tính hoàn chỉnh của JWT/account/phân quyền hay mọi trường hợp quyết toán trước hạn.
