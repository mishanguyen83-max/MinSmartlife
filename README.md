# Min Smart Life — Website giới thiệu sản phẩm

Website tĩnh (HTML/CSS/JS thuần, **không cần build**) cho shop **Min Smart Life** — gia dụng điện tử, đồ smarthome, hàng Đức & châu Âu chính hãng tại Hà Nội.

- Fanpage: https://www.facebook.com/profile.php?id=61596530125836
- Giao diện tham chiếu phong cách Gume (gume.com.vn): thanh chính sách, header tìm kiếm, danh mục, sản phẩm bán chạy/khuyến mãi, thương hiệu, footer.
- Dữ liệu sản phẩm đồng bộ với danh mục Mega Sun (hangducmegasun.com) — 47 danh mục, sản phẩm mẫu kèm giá, mã SKU, số đã bán và hình ảnh thật.
- Thiết kế theo **UI UX Pro Max** design system: Pattern *Feature-Rich Showcase*, style *Vibrant & Block-based*, theo logo Min Smart Life: navy `#03224E`/`#0A4BA8`, CTA cam `#FF9E00` (icon nguồn điện trong logo), font Rubik / Nunito Sans.

## Cấu trúc

```
index.html              Trang chủ (toàn bộ giao diện)
assets/css/style.css    Toàn bộ CSS
assets/js/products.js   ★ DỮ LIỆU sản phẩm & danh mục — sửa file này để cập nhật hàng
assets/js/app.js        Logic: lọc/tìm kiếm/sắp xếp, giỏ hàng local, popup chi tiết, gửi đơn qua Facebook
```

## Cập nhật sản phẩm

Mở `assets/js/products.js`, thêm/sửa một object trong `window.MSL_PRODUCTS`:

```js
{
  "sku": "BM05",
  "name": "BẾP TỪ ĐƠN ...",
  "price": 1190000,
  "oldPrice": null,
  "category": "Bếp từ đơn",   // phải trùng tên trong MSL_CATEGORIES để lọc đúng
  "sold": 11,
  "image": "https://...jpg",
  "images": ["https://...jpg"],
  "desc": ["Điểm nổi bật 1", "Điểm nổi bật 2"],
  "factory": "Made in China"
}
```

Push lên GitHub → Cloudflare Pages tự deploy lại sau ~1 phút. Danh mục mới chỉ cần thêm vào `window.MSL_CATEGORIES`.

## Deploy lên Cloudflare Pages

1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Chọn repo `MinSmartlife`.
3. Cấu hình build:
   - **Framework preset:** None
   - **Build command:** *(để trống)*
   - **Build output directory:** `/` (hoặc để trống / `.`)
4. **Save and Deploy**. Sau này mỗi lần push lên nhánh `main`, Pages tự cập nhật.

Đặt hàng: website không dùng backend — khách thêm sản phẩm vào giỏ, bấm **"Gửi đơn qua Facebook"**, nội dung đơn được sao chép sẵn để dán vào chat Fanpage.

## SEO

- Title/description/canonical/Open Graph/Twitter Card đầy đủ, `theme-color` theo màu logo.
- Dữ liệu có cấu trúc JSON-LD: Organization, WebSite (SearchAction `?s=`), FAQPage — mục FAQ hiển thị ở cuối trang.
- `sitemap.xml` + `robots.txt` ở thư mục gốc. Domain chuẩn đang đặt là `https://minsmartlife.pages.dev/` — nếu dùng tên miền riêng, sửa lại trong `index.html`, `sitemap.xml`, `robots.txt`.
- Logo: `assets/img/logo.png` (đã cắt viền thừa từ logo gốc), favicon cắt từ icon nguồn điện màu cam, ảnh chia sẻ `assets/img/og-image.jpg` (1200×630).
