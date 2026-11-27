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

## Tổ chức source

```text
src/
  app/                 # Khởi tạo, providers, routes và điều phối dữ liệu
    data/              # Loader, ghép dữ liệu các nghiệp vụ và lắp các command
  components/          # Component giao diện được tách thành file riêng
    app/               # UI cấp ứng dụng như ApiStatus
    layouts/           # AppLayout, Sidebar, Navbar
    shared/            # Modal, Loading, Toast và CSS đi kèm
    rooms/             # Ví dụ RoomCard, RoomFormModal
    tenants/           # Ví dụ CreateTenantModal, TenantDetailsModal
  features/            # Màn hình, API và logic theo nghiệp vụ
    auth/
    rooms/
    properties/
    tenants/
    contracts/
    invoices/
    meters/
    maintenance/
    payments/
    subscriptions/
    landlords/
    dashboard/
    reports/
    integrations/
    system/
    notifications/
    ai/
  shared/
    api/               # Axios client, xác thực request và refresh token
    data/              # Hợp đồng RentalDataContext/useData
    hooks/             # Hook dùng chung như phản hồi mutation
    utils/             # Hàm chuyển đổi dữ liệu cơ bản
  styles/              # CSS toàn cục, token và animation
```

Mỗi feature chỉ tạo những file cần dùng:

- `pages/`: màn hình ghép component, state tương tác và điều hướng.
- `api/*.commands.js`: thao tác nghiệp vụ và request; dependencies được truyền từ `app/data/createRentalActions.js` để không import ngược tầng app.
- `*.mapper.js`: đổi dữ liệu backend thành model hiển thị và payload gửi đi.
- `*.rules.js`: quy tắc thuần, ví dụ kiểm tra người ở trước khi khóa phòng.
- `*.config.js`: lựa chọn form, ảnh mặc định và cấu hình hiển thị.
- `*.test.js`: unit test đặt cạnh phần code được kiểm tra.

Đặt card, form và modal theo nghiệp vụ ở `src/components/<nghiệp-vụ>/`. Ví dụ, màn hình quản lý phòng ở `features/rooms/pages/StaffRoomsPage.jsx` dùng `components/rooms/RoomFormModal.jsx`. Các component dùng chung giữa các nghiệp vụ nằm ở `components/shared/`.

`app` có thể lắp ghép các feature. Feature và component nghiệp vụ dùng `shared` và logic của nghiệp vụ liên quan. Ranh giới import vẫn áp dụng theo nhóm: `components/shared/` thuộc tầng `shared`, `components/app/` thuộc tầng `app`, và `components/layouts/` thuộc tầng layout. Feature chỉ dùng trang khác thông qua routing.

`useData` được giữ làm hợp đồng chung. `DataProvider` chỉ lắp dữ liệu và phản hồi mutation; `useRentalLoader` giữ nguyên cơ chế tải/refresh hiện tại, `selectRentalView` ghép các quan hệ phòng–cơ sở–khách–hợp đồng–hóa đơn. Đợt tổ chức lại này không thay đổi lịch gọi API hay cơ chế cache. Dữ liệu cơ sở cũ được xử lý tại `features/properties/property.repair.js`; không sao chép hàm sửa dữ liệu vào từng page.

Danh sách cơ sở Staff và danh mục phòng Tenant dùng cùng dữ liệu cơ sở từ `useData`. Địa chỉ hiển thị là `address` đã lưu; không suy đoán quận/phường theo tên, mã cơ sở hoặc vị trí dấu phẩy. Tenant chưa thuê nhóm theo địa chỉ này và chỉ liệt kê cơ sở `ACTIVE` của mọi chủ trọ, kể cả khi chọn “Xem tất cả phòng”. Staff vẫn xem được trạng thái khóa/chờ duyệt. Số phòng hiển thị được đếm từ danh sách phòng thực tế, không dùng số phòng khai báo để giả định rằng các phòng đã được tạo.

Tenant có hợp đồng `ACTIVE` (đại diện hoặc thành viên `ACTIVE` trong hợp đồng) thấy tab **Phòng chung tòa**. Sidebar, thanh điều hướng mobile và trang dùng chung `useTenantResidency`: chỉ lấy các phòng cùng cơ sở và cùng tòa (`buildingId`/`buildingName` khi dữ liệu có), đánh dấu phòng đang thuê bằng ID, và cho xem tên/vai trò của cư dân hiện tại. Trên màn hình này, phòng có cư dân đang ở được ghi “Đang ở”, kể cả khi trường trạng thái phòng từ API chưa đồng bộ. Không hiển thị CCCD, số điện thoại hay hồ sơ tài chính của hàng xóm. Hợp đồng chờ ký/chờ cọc/đã kết thúc và thành viên đã chuyển đi không tính là đang thuê. Tenant chưa thuê thấy tab **Tìm phòng trọ** cùng luồng chọn địa chỉ → cơ sở → phòng → gửi yêu cầu đặt cọc.

## Kiểm tra trước khi tích hợp

```bash
npm run check:structure
npm test
npm run lint
npm run build
```

`check:structure` kiểm tra import nội bộ và ranh giới app/feature/shared. `npm test` tìm mọi `src/**/*.test.js` nên thêm feature mới không cần sửa danh sách test.

Khi dev server đang chạy với `VITE_TEST_MODE=true`, chạy browser test bằng API giả lập:

```bash
npm run test:e2e
```

Test dùng `http://localhost:5173` mặc định. Đặt `FRONTEND_TEST_URL` khi chạy ở cổng khác; các biến riêng `DEPOSIT_TEST_URL` và `CHECKOUT_TEST_URL` vẫn được hỗ trợ. `test:deposit`, `test:review` và `test:checkout` chạy từng luồng; test ghi dữ liệu qua Gateway thật chỉ chạy khi bật `DEPOSIT_LIVE_API=true`.
