const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Thư mục data.nosync: đuôi ".nosync" để iCloud Drive KHÔNG đồng bộ,
// tránh lỗi "database is locked" do daemon iCloud giữ khóa file SQLite.
const DB_PATH = path.join(__dirname, '..', 'data.nosync', 'ldp.db');

// Tạo thư mục data nếu chưa có
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Nếu chưa có DB (vd: lần đầu chạy trên môi trường demo như Render), nạp
// bản seed sẵn 5 trang mẫu để người xem có nội dung trải nghiệm ngay.
const SEED_PATH = path.join(__dirname, '..', 'seed', 'ldp.db');
if (!fs.existsSync(DB_PATH) && fs.existsSync(SEED_PATH)) {
  fs.copyFileSync(SEED_PATH, DB_PATH);
  console.log('Đã nạp dữ liệu demo từ seed');
}

const db = new DatabaseSync(DB_PATH);

// Chờ tối đa 5s nếu DB tạm thời bị khóa thay vì lỗi ngay
db.exec('PRAGMA busy_timeout = 5000');

// Bật WAL mode để tăng hiệu năng đọc/ghi đồng thời
db.exec('PRAGMA journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    slug            TEXT    NOT NULL UNIQUE,
    html            TEXT    DEFAULT '',
    css             TEXT    DEFAULT '',
    components_json TEXT    DEFAULT '[]',
    status          TEXT    NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TRIGGER IF NOT EXISTS pages_updated_at
  AFTER UPDATE ON pages
  BEGIN
    UPDATE pages SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
  END;
`);

// Thêm cột js (lưu JavaScript của trang, vd: script chuyển tab khi import) cho DB cũ
try {
  db.exec("ALTER TABLE pages ADD COLUMN js TEXT NOT NULL DEFAULT ''");
} catch (_) { /* cột đã tồn tại */ }

module.exports = db;
