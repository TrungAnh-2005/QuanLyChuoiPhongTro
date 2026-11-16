# Kiểm tra nguồn dữ liệu UI — 15/11/2026

## Kết luận

UI hiện trộn dữ liệu API/MySQL, dữ liệu mẫu đã nạp vào database, giá trị mặc định trong frontend và số liệu tính tại frontend. Chưa thể coi toàn bộ thông tin hiển thị là dữ liệu vận hành đã được kiểm chứng.

Lần kiểm tra này chỉ đọc dữ liệu và mã nguồn; không sửa dữ liệu nghiệp vụ hoặc cấu hình ứng dụng.

## Đối chiếu trực tiếp MySQL với Gateway đang chạy

| Dữ liệu | Bảng MySQL | API | Số dòng DB / API |
|---|---|---|---|
| Cơ sở | room_db.boarding_houses | /api/properties | 3 / 3 |
| Phòng | room_db.rooms | /api/rooms | 36 / 36 |
| Khách thuê | tenant_db.tenants | /api/tenants | 7 / 7 |
| Hợp đồng | contract_db.contracts | /api/contracts | 5 / 5 |
| Hóa đơn | billing_db.invoices | /api/invoices | 5 / 5 |
| Yêu cầu bảo trì | maintenance_db.maintenance_requests | /api/maintenance | 5 / 5 |
| Yêu cầu phòng | contract_db.room_requests | /api/contracts/requests | 12 / 12 |
| Quyết toán | contract_db.move_out_settlements | /api/contracts/settlements | 2 / 2 |
| Thành viên phòng | tenant_db.room_members | /api/tenants/members | 5 / 5 |

DataContext.jsx gọi các endpoint này, rồi ghép tên khách/phòng/cơ sở theo ID và định dạng cho UI. Hóa đơn hiển thị mặc định được lọc theo tháng đang chọn, nên số dòng trên một màn hình có thể ít hơn số dòng trong DB.

Đối chiếu số lượng không chứng minh tất cả trường dữ liệu đều được UI giữ nguyên; các biến đổi và ngoại lệ bên dưới vẫn tồn tại.

## Phần đang dùng dữ liệu mẫu hoặc giá trị mặc định

| Vị trí | Phát hiện |
|---|---|
| frontend/.env | VITE_TEST_MODE=true. |
| frontend/src/contexts/AuthContext.jsx | Tài khoản mặc định “Kiểm thử nghiệp vụ”, vai trò STAFF, gói ENTERPRISE được tạo trong frontend. Chuyển vai trò phục vụ kiểm thử. |
| frontend/src/contexts/DataContext.jsx | Trong test mode, danh sách chủ trọ được thay bằng tài khoản thử với gói ENTERPRISE; tenantId có thể lấy khách đầu tiên khi không tìm được người đang đăng nhập. |
| frontend/src/components/tenant/ResidentContractModal.jsx | CCCD, ngày cấp, nơi thường trú và ảnh được điền sẵn; ảnh thay thế là ảnh Unsplash. Các trường này không chứng minh hồ sơ CCCD đã tồn tại trong DB. |
| frontend/src/components/settlement/MoveOutSettlementModal.jsx | Chỉ số điện 120→165, nước 30→34 là giá trị khởi tạo cố định. Khi thiếu thông tin hoàn cọc, UI thay bằng số tài khoản 0987654321, Vietcombank, NGUYEN VAN A. |
| frontend/src/pages/user/UserDashboard.jsx | Còn giá trị thay thế về liên hệ, CCCD, quê quán, thời hạn hợp đồng, thông tin ngân hàng; còn nút mô phỏng webhook. |
| frontend/src/pages/staff/StaffBoardingHousesPage.jsx | Một nhánh ánh xạ API tự gán tỷ lệ phòng thuê 75%, doanh thu = tổng phòng × 3.200.000đ và tiện ích mặc định. Phần enrich tính doanh thu từ giá các phòng OCCUPIED; đây là ước tính, không phải tiền thực thu từ thanh toán. |

Không đánh đồng mọi fallback với dữ liệu đang hiển thị: ví dụ một số mảng initialHouses/demo vẫn nằm trong mã nhưng bị chặn bởi isZeroSandbox=true. Các giá trị mặc định chỉ xuất hiện khi nhánh tương ứng chạy hoặc dữ liệu nguồn thiếu.

## Số liệu tính tại frontend cần phân biệt với dữ liệu DB

- Số người trong phòng (`occupants`) hiện được tính bằng số hợp đồng ACTIVE của phòng; một hợp đồng có nhiều thành viên sẽ không được đếm đúng số cư dân.
- `sentToTenant` và `meterRecorded` của hóa đơn được gán `true` trong bước ánh xạ, không được xác minh từ các trường DB tương ứng.
- Số phòng thuê, tỷ lệ lấp đầy và một số tổng tiền được frontend tổng hợp từ dữ liệu API. Một phép tổng hợp có thể hợp lệ, nhưng vẫn phụ thuộc tính nhất quán của dữ liệu đầu vào.
- Đơn giá điện/nước có fallback 3.500đ / 25.000đ khi thiếu cấu hình hoặc chỉ số.

## Dữ liệu mẫu đã được nạp vào DB

`init-scripts/full_microservices_database_setup.sql` chứa các phòng ID 101…, các khách thuê và các hợp đồng HD-2026-001…005 khớp bộ dữ liệu gốc hiện trả từ API. Các script seed khác cũng tồn tại trong `init-scripts` và `docker/mysql/init`.

Những bản ghi này được đọc thật từ DB; nguồn ban đầu của chúng là dữ liệu mẫu. Các yêu cầu phát sinh trong quá trình kiểm thử có thể được ghi thêm vào cùng database. Bật chế độ test giao diện không tự động tạo database tách biệt.

## Bất nhất dữ liệu đã xác minh trước khi đối soát

Ở thời điểm kiểm tra ban đầu, MySQL có **24 phòng OCCUPIED không có hợp đồng ACTIVE tương ứng**. Truy vấn chỉ đọc:

```sql
SELECT COUNT(*)
FROM room_db.rooms r
WHERE r.status = 'OCCUPIED'
  AND NOT EXISTS (
    SELECT 1
    FROM contract_db.contracts c
    WHERE c.room_id = r.id
      AND c.status = 'ACTIVE'
  );
```

Vì vậy UI có thể hiển thị phòng đang thuê dựa vào bảng rooms, trong khi các nghiệp vụ tìm hợp đồng để trả phòng/thanh lý lại không tìm được hợp đồng phù hợp.

### Đã sửa theo yêu cầu người dùng ngày 15/11/2026

- Cả 24 phòng không có hợp đồng, thành viên ACTIVE, hóa đơn, yêu cầu phòng đang chờ hoặc bảo trì đang mở. Đã chuyển chúng từ OCCUPIED sang AVAILABLE.
- Phòng ID 102 (P.102, cơ sở 1) có hợp đồng ACTIVE và thành viên ACTIVE nhưng bị đánh dấu AVAILABLE. Đã đồng bộ lại OCCUPIED.
- Sau sửa: **36 phòng = 5 đang thuê + 29 trống + 2 bảo trì**. Không còn phòng OCCUPIED thiếu hợp đồng ACTIVE; không còn hợp đồng ACTIVE có phòng khác trạng thái OCCUPIED.
- Thay đổi được thực hiện trong một transaction, có khóa và kiểm tra lại dữ liệu liên quan trước khi cập nhật.
- Bản sao trạng thái cũ, danh sách thay đổi và SQL khôi phục có điều kiện nằm ở `.logs/room-reconciliation-2026-11-15T19-08-04.408128900/`.
- Đã sửa trạng thái tương ứng trong `init-scripts/full_microservices_database_setup.sql` để lần nạp lại bộ dữ liệu này không tái tạo sai lệch.
- Việc đối soát này sửa trạng thái phòng; các phát hiện khác về tài khoản test và dữ liệu mặc định trong UI vẫn còn hiệu lực.

## Thứ tự xử lý đề xuất

1. Bỏ giá trị giả về CCCD, ngân hàng và chỉ số công tơ; để trống và yêu cầu nhập hoặc lấy dữ liệu đã lưu.
2. Đối soát trạng thái phòng, hợp đồng và thành viên trước khi sửa dữ liệu; không tự đổi trạng thái hàng loạt.
3. Tính đúng số cư dân, trạng thái hóa đơn và phân biệt doanh thu ước tính với tiền thực thu.
4. Tách môi trường/dữ liệu thử và tài khoản đăng nhập thực trước khi kiểm thử quyền hoặc vận hành thực tế.
