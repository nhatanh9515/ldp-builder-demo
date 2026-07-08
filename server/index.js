const express = require('express');
const path    = require('path');

const db                       = require('./db');
const { renderScaledPage, escHtml } = require('./ldp-render');

const app  = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Không cache HTML/CSS/JS để luôn lấy bản mới nhất khi phát triển (font/ảnh vẫn cache)
app.use((req, res, next) => {
  if (req.path === '/' || /\.(html|css|js)$/i.test(req.path)) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/pages',  require('./routes/pages'));
app.use('/api/upload', require('./routes/upload'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Public page route ──────────────────────────────────────────
app.get('/p/:slug', (req, res) => {
  const page = db.prepare(
    'SELECT name, html, css, js FROM pages WHERE slug = ?'
  ).get(req.params.slug);

  if (!page) {
    return res.status(404).send(`<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8">
<title>404 — Không tìm thấy</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
       background:#f4f5f7;font-family:-apple-system,sans-serif}
  .box{text-align:center;color:#6b7280}
  h1{font-size:72px;font-weight:800;color:#111;margin:0 0 8px}
  p{margin:4px 0} a{color:#2563eb;text-decoration:none}
</style>
</head>
<body><div class="box">
  <h1>404</h1>
  <p>Không tìm thấy trang <strong>"${escHtml(req.params.slug)}"</strong></p>
  <p style="margin-top:20px"><a href="/">← Về Dashboard</a></p>
</div></body></html>`);
  }

  res.send(renderScaledPage(page));
});

const server = app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nLỗi: Port ${PORT} đang bị chiếm. Chạy lệnh sau để giải phóng:\n  lsof -ti :${PORT} | xargs kill -9\n`);
  } else {
    console.error('Lỗi server:', err.message);
  }
  process.exit(1);
});
