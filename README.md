# LDP Builder — Landing Page Builder (GrapesJS)

Trình tạo landing page kéo-thả, chạy bằng Node.js + Express + SQLite.

## Chạy local

```bash
npm install
npm run dev        # http://localhost:8080
# hoặc tự reload khi sửa code:
npm run dev:watch
```

Yêu cầu: **Node.js 22.5 trở lên** (dùng module tích hợp `node:sqlite`).

## Deploy demo miễn phí lên Render

App đã kèm `render.yaml` (Blueprint) và **seed 5 trang mẫu** — mỗi lần deploy mới sẽ tự có nội dung demo để trải nghiệm.

1. Đẩy code lên một GitHub repo.
2. Vào <https://render.com> → **New +** → **Blueprint** → chọn repo này.
   Render tự đọc `render.yaml` và tạo Web Service (gói Free).
3. Bấm **Apply / Deploy**, chờ vài phút → nhận link công khai dạng
   `https://ldp-builder-demo.onrender.com`.

> **Lưu ý về gói Free:**
> - App "ngủ" sau ~15 phút không có lượt truy cập; lần vào kế tiếp chờ ~30–60s để thức dậy.
> - Ổ đĩa là tạm thời: dữ liệu người dùng tạo trên demo sẽ **reset về 5 trang mẫu** mỗi khi deploy lại. Phù hợp cho mục đích demo.

## Cấu trúc

- `server/` — Express server, route API (`/api/pages`, `/api/upload`), render trang public (`/p/:slug`).
- `public/` — giao diện editor (GrapesJS), dashboard, thư viện vendor, fonts, ảnh upload.
- `seed/ldp.db` — dữ liệu mẫu nạp khi DB trống.
- `data.nosync/` — DB runtime (không commit; đuôi `.nosync` để iCloud Drive bỏ qua, tránh lỗi "database is locked").
