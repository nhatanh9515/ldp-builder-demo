const express = require('express');
const db = require('../db');

const router = express.Router();

// Chuyển tên thành slug (hỗ trợ tiếng Việt)
function toSlug(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // bỏ dấu
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Tạo slug unique: nếu đã tồn tại thì thêm -2, -3, ...
function uniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug;
  let counter = 2;
  while (true) {
    const row = excludeId
      ? db.prepare('SELECT id FROM pages WHERE slug = ? AND id != ?').get(slug, excludeId)
      : db.prepare('SELECT id FROM pages WHERE slug = ?').get(slug);
    if (!row) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
}

// Lấy URL ảnh đầu tiên trong HTML (ảnh minh hoạ của section đầu) làm thumbnail.
function firstImageSrc(html) {
  if (!html) return null;
  const m = html.match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
  return m ? m[1] : null;
}

// GET /api/pages — danh sách tất cả pages (không trả html/css để giảm payload;
// chỉ trích 1 URL ảnh đầu tiên làm preview cho card ngoài dashboard)
router.get('/', (req, res) => {
  const rows = db.prepare(
    'SELECT id, name, slug, status, created_at, updated_at, html FROM pages ORDER BY updated_at DESC'
  ).all();
  const pages = rows.map(({ html, ...p }) => ({ ...p, preview: firstImageSrc(html) }));
  res.json(pages);
});

// POST /api/pages — tạo page mới
router.post('/', (req, res) => {
  const { name, html = '', css = '', js = '', components_json = '[]', status = 'draft' } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Tên page không được để trống' });
  }

  const slug = uniqueSlug(toSlug(name));

  const result = db.prepare(
    'INSERT INTO pages (name, slug, html, css, js, components_json, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(name.trim(), slug, html, css, js, components_json, status);

  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(page);
});

// GET /api/pages/:id — chi tiết 1 page
router.get('/:id', (req, res) => {
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
  if (!page) return res.status(404).json({ error: 'Không tìm thấy page' });
  res.json(page);
});

// PUT /api/pages/:id — cập nhật page
router.put('/:id', (req, res) => {
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
  if (!page) return res.status(404).json({ error: 'Không tìm thấy page' });

  const { name, html, css, js, components_json, status } = req.body;

  const newName   = name            !== undefined ? name.trim()        : page.name;
  const newSlug   = name            !== undefined
                      ? uniqueSlug(toSlug(name), page.id)
                      : page.slug;
  const newHtml   = html            !== undefined ? html            : page.html;
  const newCss    = css             !== undefined ? css             : page.css;
  const newJs     = js              !== undefined ? js              : page.js;
  const newJson   = components_json !== undefined ? components_json : page.components_json;
  const newStatus = status          !== undefined ? status          : page.status;

  if (!newName) return res.status(400).json({ error: 'Tên page không được để trống' });

  db.prepare(
    `UPDATE pages SET name = ?, slug = ?, html = ?, css = ?, js = ?, components_json = ?, status = ?
     WHERE id = ?`
  ).run(newName, newSlug, newHtml, newCss, newJs, newJson, newStatus, page.id);

  const updated = db.prepare('SELECT * FROM pages WHERE id = ?').get(page.id);
  res.json(updated);
});

// DELETE /api/pages/:id — xóa page
router.delete('/:id', (req, res) => {
  const page = db.prepare('SELECT id FROM pages WHERE id = ?').get(req.params.id);
  if (!page) return res.status(404).json({ error: 'Không tìm thấy page' });

  db.prepare('DELETE FROM pages WHERE id = ?').run(req.params.id);
  res.json({ message: 'Đã xóa page thành công' });
});

module.exports = router;
