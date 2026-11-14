# Hướng dẫn CMS Min Smart Life (trang quản trị)

Trang quản trị: **`/admin.html`** trên cùng website (ví dụ `https://minsmartlife.pages.dev/admin.html`).

## Lần đầu sử dụng

1. Mở trang quản trị → màn hình **"Tạo tài khoản quản trị viên"** hiện ra (chỉ lần đầu).
2. Tạo tên đăng nhập + mật khẩu → hệ thống tự đăng nhập.
3. Từ lần sau, dùng tài khoản đó để đăng nhập. Đăng xuất bằng nút ở góc phải.

## Các chức năng

- **Đơn hàng:** xem mọi đơn khách đặt trên website (mã đơn, thời gian, khách, sản phẩm, tổng tiền). Đổi trạng thái ngay trên bảng: *Mới → Đã liên hệ → Đã xác nhận → Đang giao → Hoàn thành / Đã huỷ*. Có tìm kiếm, lọc theo trạng thái, xem chi tiết và **xuất CSV**.
- **Khách hàng:** tự tổng hợp từ đơn hàng theo số điện thoại — số đơn, tổng chi tiêu, đơn gần nhất.
- **Sản phẩm:** thêm sản phẩm mới, sửa thông tin (tên, SKU, giá, danh mục, ảnh, mô tả, đã bán), xoá sản phẩm. Ảnh sản phẩm chính có thể **dán URL hoặc tải lên từ máy** (ảnh tải lên tự nén tối đa 1000px). Website bán hàng tự hiển thị theo dữ liệu mới nhất.
- **Tồn kho:** mỗi sản phẩm có ô *Số lượng tồn kho* (để trống = không quản lý tồn). Khách đặt hàng → tồn tự trừ; huỷ đơn → tồn tự cộng lại; xoá đơn chưa huỷ → tồn được hoàn. Sản phẩm có tồn = 0 sẽ tự ẩn khỏi website. Lần đầu đăng nhập CMS ở chế độ máy chủ, hệ thống tự đồng bộ danh mục lên máy chủ để tính năng tồn kho hoạt động.
- **Trang chủ (Hero):** sửa dòng nhãn, tiêu đề (gồm phần chữ màu cam), đoạn mô tả và **ảnh Hero** (dán URL hoặc tải ảnh lên — dùng cho banner campaign sale). Bấm *Lưu nội dung trang chủ* là website cập nhật ngay.
- **Tài khoản:** tab *Tài khoản* trong CMS cho phép **tạo thêm nhiều tài khoản quản trị viên** và xem danh sách tài khoản hiện có.
- Nút **"Xem website"** trong CMS mở website kèm dấu hiệu quản trị: trên website sẽ hiện nút nổi **"⚙ Quay lại trang CMS"** ở góc dưới phải để quay về CMS chỉ với 1 chạm. Khách hàng bình thường không nhìn thấy nút này.

## Hai chế độ lưu trữ (quan trọng)

### Chế độ nội bộ (mặc định khi mở file trực tiếp)
Dữ liệu lưu trong **trình duyệt trên máy đang mở** (localStorage). Phù hợp để xem thử giao diện và thao tác. Hạn chế: đơn khách đặt từ điện thoại của họ sẽ **không** tự về máy của quản trị viên, vì mỗi thiết bị có bộ nhớ riêng.

### Chế độ máy chủ Cloudflare (khuyên dùng khi bán thật)
Website đã kèm sẵn mã API trong thư mục `functions/`. Chỉ cần gắn thêm một kho dữ liệu KV miễn phí của Cloudflare:

1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → chọn project của website.
2. **Settings → Functions → KV namespace bindings → Add binding**:
   - Variable name: `ORDERS_KV` (phải đúng tên này)
   - KV namespace: tạo mới, đặt tên ví dụ `minsmartlife-db`.
3. **Deploy lại** website (push code mới lên GitHub hoặc vào Deployments → Retry deployment).
4. Mở lại `/admin.html` — góc trên hiện nhãn **"Chế độ máy chủ Cloudflare"** là thành công. Tạo tài khoản quản trị ở chế độ này, tài khoản và toàn bộ đơn hàng/sản phẩm sẽ lưu trên Cloudflare: khách đặt từ bất kỳ thiết bị nào, quản trị viên cũng thấy được ở mục Đơn hàng.

> Gói KV miễn phí của Cloudflare đủ lớn cho quy mô shop (100.000 lượt đọc + 1.000 lượt ghi mỗi ngày).


## Kích thước ảnh chuẩn (hiển thị cạnh mọi ô tải ảnh trong CMS)

| Vị trí | Tỉ lệ hiển thị | Kích thước khuyến nghị | Tối thiểu |
|---|---|---|---|
| Ảnh sản phẩm (chính & phụ) | Vuông 1:1 | **1000×1000 px** | 800×800 px |
| Ảnh Hero / banner campaign | 4:3 | **1200×900 px** | 1000×750 px |

Các ảnh sản phẩm nên có **cùng một kích thước** để giao diện đồng nhất. Ảnh lệch tỉ lệ sẽ tự cắt (cover) cho vừa khung. Trong CMS, khi dán URL hoặc tải ảnh lên, hệ thống hiển thị kích thước thật của ảnh và cảnh báo nếu sai tỉ lệ.
