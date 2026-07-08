'use strict';

// ============================================================================
//  Render trang public theo mô hình "2 layout cố định + scale-to-fit".
//
//  Thay vì responsive fluid, trang chỉ có 2 layout: desktop (DESKTOP_W) và
//  mobile (MOBILE_W). Trình duyệt phóng to/thu nhỏ TOÀN BỘ trang như một tấm
//  ảnh (transform: scale). Khi bề rộng cửa sổ < SWITCH_BP thì đổi hẳn sang
//  layout mobile.
//
//  CSS gốc (có media query) được "làm phẳng" thành 2 stylesheet tĩnh ứng với 2
//  bề rộng thiết kế, rồi bật/tắt bằng thuộc tính `media` của thẻ <style>.
// ============================================================================

const DESKTOP_W = 1280; // bề rộng thiết kế desktop
const MOBILE_W  = 375;  // bề rộng thiết kế mobile
const SWITCH_BP = 768;  // < ngưỡng này → mobile, ≥ → desktop

// Tách CSS ở mức top-level thành các chunk (mỗi rule / mỗi @media block là 1
// chunk), có nhận biết chuỗi và comment để không bị lệch bởi dấu { } bên trong.
function splitTopLevel(css) {
  const chunks = [];
  let depth = 0, cur = '', inStr = null, inComment = false;
  for (let k = 0; k < css.length; k++) {
    const ch = css[k], nx = css[k + 1];
    cur += ch;
    if (inComment) { if (ch === '*' && nx === '/') { cur += nx; k++; inComment = false; } continue; }
    if (inStr)     { if (ch === '\\') { cur += nx; k++; } else if (ch === inStr) inStr = null; continue; }
    if (ch === '/' && nx === '*') { cur += nx; k++; inComment = true; continue; }
    if (ch === '"' || ch === "'") { inStr = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { chunks.push(cur.trim()); cur = ''; } }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.filter(Boolean);
}

// Đánh giá điều kiện @media theo 1 bề rộng cụ thể. Chỉ xét max-width / min-width.
//  isWidth: có chứa điều kiện bề rộng hay không.
//  ok     : (chỉ có nghĩa khi isWidth) bề rộng này có khớp toàn bộ điều kiện không.
function mediaMatchesWidth(condition, width) {
  const re = /\((max|min)-width\s*:\s*([\d.]+)px\)/gi;
  let m, found = false, ok = true;
  while ((m = re.exec(condition))) {
    found = true;
    const v = parseFloat(m[2]);
    if (m[1].toLowerCase() === 'max') { if (!(width <= v)) ok = false; }
    else                              { if (!(width >= v)) ok = false; }
  }
  return { isWidth: found, ok };
}

// "Làm phẳng" CSS cho 1 bề rộng: gỡ vỏ các @media bề rộng khớp (chèn rule bên
// trong tại đúng vị trí, giữ cascade), bỏ các @media bề rộng không khớp, giữ
// nguyên @media không theo bề rộng (prefers-reduced-motion, print…) và các
// at-rule khác (@font-face, @keyframes, @supports…).
function flattenCssForWidth(css, width) {
  if (!css) return '';
  const out = [];
  for (const chunk of splitTopLevel(css)) {
    if (chunk[0] !== '@') { out.push(chunk); continue; }

    const bi = chunk.indexOf('{');
    const prelude = bi >= 0 ? chunk.slice(0, bi) : chunk;
    const atName = (prelude.match(/^@([a-z-]+)/i) || [, ''])[1].toLowerCase();

    if (atName === 'media' && bi >= 0) {
      const condition = prelude.slice(prelude.toLowerCase().indexOf('media') + 5);
      const { isWidth, ok } = mediaMatchesWidth(condition, width);
      if (!isWidth) { out.push(chunk); continue; }          // media phi-bề-rộng → giữ
      if (ok) out.push(chunk.slice(bi + 1, chunk.lastIndexOf('}')).trim()); // khớp → gỡ vỏ
      // không khớp → bỏ
    } else {
      out.push(chunk);                                      // at-rule khác → giữ
    }
  }
  return out.join('\n');
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// CSS khung scale (cố định, không phụ thuộc nội dung trang).
const STAGE_CSS =
  'html,body{margin:0;padding:0}' +
  'body{overflow-x:hidden}' +
  '#ldp-vp{position:relative;width:100%;overflow:hidden}' +
  `#ldp-stage{position:relative;width:${DESKTOP_W}px;transform-origin:top left}`;

// Script runtime: đo bề rộng cửa sổ → chọn mode, bật stylesheet tương ứng, đặt
// transform scale và chiều cao wrapper.
const RUNTIME =
  '(function(){' +
  `var DW=${DESKTOP_W},MW=${MOBILE_W},BP=${SWITCH_BP};` +
  "var d=document,vp=d.getElementById('ldp-vp'),stage=d.getElementById('ldp-stage');" +
  "var sd=d.getElementById('ldp-css-desktop'),sm=d.getElementById('ldp-css-mobile');" +
  'var mode=null,raf=0;' +
  'function apply(){' +
    'var vw=d.documentElement.clientWidth||window.innerWidth;' +
    'var m=vw<BP;' +
    'if(m!==mode){mode=m;' +
      "if(sd)sd.media=m?'not all':'all';" +
      "if(sm)sm.media=m?'all':'not all';" +
      "stage.style.width=(m?MW:DW)+'px';}" +
    'var s=vw/(m?MW:DW);' +
    "stage.style.transform='scale('+s+')';" +
    "vp.style.height=(stage.offsetHeight*s)+'px';" +
  '}' +
  'function schedule(){if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(apply);}' +
  "window.addEventListener('resize',schedule);" +
  "window.addEventListener('orientationchange',schedule);" +
  "window.addEventListener('load',schedule);" +
  'if(window.ResizeObserver){try{new ResizeObserver(schedule).observe(stage);}catch(e){}}' +
  'apply();' +
  '})();';

// Tính năng "ẩn phần tử" theo thiết bị: phần tử mang thuộc tính data-ldp-hide-d
// (ẩn trên desktop) / data-ldp-hide-m (ẩn trên mobile). Mỗi stylesheet thiết bị
// chỉ active đúng mode của nó nên ẩn đúng thiết bị.
const HIDE_DESKTOP = '[data-ldp-hide-d]{display:none!important}';
const HIDE_MOBILE  = '[data-ldp-hide-m]{display:none!important}';

// Dựng tài liệu HTML hoàn chỉnh cho trang public đã scale.
function renderScaledPage(page) {
  const desktopCss = flattenCssForWidth(page.css || '', DESKTOP_W) + '\n' + HIDE_DESKTOP;
  const mobileCss  = flattenCssForWidth(page.css || '', MOBILE_W)  + '\n' + HIDE_MOBILE;
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${escHtml(page.name)}</title>
  <link rel="stylesheet" href="/fonts.css"/>
  <style id="ldp-base">${STAGE_CSS}</style>
  <style id="ldp-css-desktop">${desktopCss}</style>
  <style id="ldp-css-mobile" media="not all">${mobileCss}</style>
</head>
<body>
  <div id="ldp-vp"><div id="ldp-stage">${page.html || ''}</div></div>
  <script>${RUNTIME}</script>
${page.js ? `  <script>${page.js}</script>` : ''}
</body>
</html>`;
}

module.exports = {
  DESKTOP_W, MOBILE_W, SWITCH_BP,
  splitTopLevel, mediaMatchesWidth, flattenCssForWidth,
  renderScaledPage, escHtml,
};
