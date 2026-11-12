# Frontend kiểm thử nghiệp vụ

```bash
npm install
npm run dev
```

Mở http://localhost:5173. `frontend/.env` đã bật `VITE_TEST_MODE=true`: vào thẳng màn hình quản lý, không đăng nhập. Bộ chọn ở góc dưới chuyển màn hình quản lý/khách thuê/quản trị; màn hình khách thuê dùng khách thuê đầu tiên trong database để kiểm thử.

Tất cả request nghiệp vụ đi qua `/api` và được Vite proxy tới `GATEWAY_URL` (mặc định http://localhost:8080). Gateway cần bật `APPLICATION_TEST_MODE=true` tương ứng. Account/JWT/phân quyền được để lại giai đoạn sau; `auth-service` không cần chạy trong bản test.

Danh mục, hóa đơn và trạng thái nghiệp vụ lấy từ backend. Không dùng account demo để đăng nhập khi API lỗi, không báo lưu thành công khi request thất bại. localStorage chỉ còn cache hiển thị cơ sở cho các selector cũ; dữ liệu chính nằm trong database.

Các khóa Gemini/VNPay/MoMo/SePay đặt tại backend. Bản test cơ bản dùng chỉ số nhập tay và thu tiền mặt. Không đặt secret trong biến `VITE_*`.

```bash
npm test
npm run build
npm run lint
```

Xem [hướng dẫn backend](../backend/README.md), [API](../backend/API.md) và [kết quả kiểm thử](../backend/TESTING.md).
