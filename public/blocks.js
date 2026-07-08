/*
 * blocks.js — Thư viện block tùy chỉnh cho LDP Builder
 * Gọi window.registerLdpBlocks(editor) sau khi grapesjs.init().
 *
 * Gồm 3 nhóm:
 *   • Bố cục          — primitive: Section, Container, Divider, Spacer
 *   • Cơ bản          — Heading, Đoạn văn, Nút bấm, Image Box
 *   • Section dựng sẵn — Hero, Features, CTA, Pricing, Testimonial, Team,
 *                        Stats, FAQ, Gallery, Content+Image, Newsletter, Footer, Navbar
 */
(function () {
  // Ảnh placeholder dạng SVG data-URI (không phụ thuộc mạng)
  const ph = (w, h, label) =>
    `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' fill='%239ca3af' font-family='sans-serif' font-size='16' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(label || 'Hình ảnh')}%3C/text%3E%3C/svg%3E`;

  const avatar = (label) =>
    `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Ccircle cx='48' cy='48' r='48' fill='%23d1d5db'/%3E%3Ctext x='50%25' y='54%25' fill='%236b7280' font-family='sans-serif' font-size='32' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(label || '👤')}%3C/text%3E%3C/svg%3E`;

  // SVG icon nhỏ cho panel block
  const I = {
    section:   '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M2 4h20v6H2zM2 12h20v8H2z"/></svg>',
    container: '<svg viewBox="0 0 24 24" width="22"><path fill="none" stroke="currentColor" stroke-width="2" d="M4 5h16v14H4z"/></svg>',
    divider:   '<svg viewBox="0 0 24 24" width="22"><path stroke="currentColor" stroke-width="2" d="M2 12h20"/></svg>',
    spacer:    '<svg viewBox="0 0 24 24" width="22"><path fill="none" stroke="currentColor" stroke-width="2" d="M12 3v18M7 7l5-4 5 4M7 17l5 4 5-4"/></svg>',
    heading:   '<svg viewBox="0 0 24 24" width="22"><text x="2" y="18" font-size="18" font-weight="bold" fill="currentColor">H</text></svg>',
    text:      '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M3 5h18v2H3zm0 5h18v2H3zm0 5h12v2H3z"/></svg>',
    button:    '<svg viewBox="0 0 24 24" width="22"><rect x="3" y="8" width="18" height="8" rx="4" fill="currentColor"/></svg>',
    imagebox:  '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M4 4h16v10H4zM6 16h12v2H6zM7 19h10v1.5H7z"/></svg>',
    hero:      '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M2 3h20v8H2z"/><path fill="currentColor" d="M6 13h12v2H6zm3 4h6v2H9z"/></svg>',
    features:  '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M3 3h6v6H3zm12 0h6v6h-6zM3 15h6v6H3zm12 0h6v6h-6z"/></svg>',
    cta:       '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M2 6h20v12H2z"/><rect x="8" y="10" width="8" height="4" rx="2" fill="#fff"/></svg>',
    pricing:   '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M4 3h5v18H4zm6 0h5v18h-5zm6 0h4v18h-4z"/></svg>',
    quote:     '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M7 7h5v6H9v4H4v-6c0-2 1-4 3-4zm9 0h5v6h-3v4h-5v-6c0-2 1-4 3-4z"/></svg>',
    team:      '<svg viewBox="0 0 24 24" width="22"><circle cx="8" cy="8" r="3" fill="currentColor"/><circle cx="16" cy="8" r="3" fill="currentColor"/><path fill="currentColor" d="M2 20a6 6 0 0 1 12 0zm10 0a6 6 0 0 1 10 0z"/></svg>',
    stats:     '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M3 13h4v8H3zm7-6h4v14h-4zm7 3h4v11h-4z"/></svg>',
    faq:       '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2zm1.7-6.4l-.9.9c-.6.6-.8 1-.8 2.1h-2v-.5c0-.8.3-1.5.9-2.1l1.2-1.2c.3-.3.5-.8.5-1.3a2 2 0 1 0-4 0H8a4 4 0 1 1 6.7 3z"/></svg>',
    gallery:   '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/></svg>',
    split:     '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M3 4h8v16H3z"/><path fill="none" stroke="currentColor" stroke-width="2" d="M13 6h8M13 11h8M13 16h6"/></svg>',
    news:      '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M2 5h20v14H2z"/><path fill="#fff" d="M4 7l8 5 8-5v2l-8 5-8-5z"/></svg>',
    footer:    '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M2 16h20v6H2z"/><path fill="none" stroke="currentColor" stroke-width="2" d="M4 5h6M4 9h8M14 5h6M14 9h6"/></svg>',
    navbar:    '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M2 4h20v4H2z"/><path fill="currentColor" d="M15 5h5v2h-5z" opacity=".4"/></svg>',
    code:      '<svg viewBox="0 0 24 24" width="22"><path fill="currentColor" d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4m5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4Z"/></svg>',
  };

  // Style dùng chung
  const C  = 'max-width:1140px;margin:0 auto;padding:0 20px;';   // container
  const SEC = (bg) => `padding:72px 0;background:${bg || '#ffffff'};`;
  const BTN = (bg, color) =>
    `display:inline-block;padding:13px 30px;background:${bg};color:${color};border-radius:999px;text-decoration:none;font-weight:600;font-size:16px;`;
  const ROW = 'display:flex;flex-wrap:wrap;gap:28px;';

  window.registerLdpBlocks = function (editor) {
    const bm = editor.BlockManager;
    const add = (id, label, category, media, content) =>
      bm.add(id, { label, category, media, content });

    // ───────── Component type "HTML / CSS" (tự xây, không phụ thuộc plugin) ─────────
    // Lưu HTML & CSS RIÊNG vào data-ldp-html / data-ldp-css; toHTML gộp lại (CSS bọc <style>).
    const HTML_ATTR = 'data-ldp-html';
    const CSS_ATTR  = 'data-ldp-css';
    const OLD_ATTR  = 'data-ldp-code';   // tương thích ngược (bản gộp 1 ô)
    const enc = (s) => encodeURIComponent(s || '');
    const dec = (s) => (s != null ? decodeURIComponent(s) : '');
    const CODE_PLACEHOLDER =
      '<div style="padding:24px;text-align:center;color:#9ca3af;border:1px dashed #cbd5e1;border-radius:8px;font:14px sans-serif;">&lt;/&gt; Nhấp đúp để nhập mã HTML / CSS</div>';

    editor.DomComponents.addType('ldp-code', {
      isComponent: (el) =>
        (el.getAttribute && (el.getAttribute(HTML_ATTR) != null || el.getAttribute(OLD_ATTR) != null))
          ? { type: 'ldp-code' } : undefined,
      model: {
        defaults: {
          name: 'HTML / CSS',
          droppable: false,
          'custom-name': 'HTML / CSS',
          toolbar: [
            { attributes: { class: 'fa fa-clone', title: 'Nhân bản' }, command: 'tlb-clone' },
            { attributes: { class: 'fa fa-code',  title: 'Sửa mã HTML/CSS' }, command: 'ldp-edit-code' },
            { attributes: { class: 'fa fa-trash-o', title: 'Xóa' }, command: 'tlb-delete' },
          ],
        },
        getHtmlCode() {
          const a = this.getAttributes();
          if (a[HTML_ATTR] != null) return dec(a[HTML_ATTR]);
          if (a[OLD_ATTR]  != null) return dec(a[OLD_ATTR]);   // bản cũ gộp → coi là HTML
          return '';
        },
        getCssCode() { return dec(this.getAttributes()[CSS_ATTR]); },
        setCode(html, css) {
          this.addAttributes({ [HTML_ATTR]: enc(html), [CSS_ATTR]: enc(css) });
          if (this.removeAttributes) this.removeAttributes(OLD_ATTR);
          if (this.view) this.view.render();
        },
        buildOutput() {
          const css = this.getCssCode();
          const html = this.getHtmlCode();
          return (css ? '<style>' + css + '</style>' : '') + html;
        },
        toHTML() { return this.buildOutput(); },
      },
      view: {
        events: { dblclick: 'editCode' },
        editCode() { editor.runCommand('ldp-edit-code', { component: this.model }); },
        onRender() {
          const el = this.el;
          el.innerHTML = this.model.buildOutput() || CODE_PLACEHOLDER;
          el.style.display = 'block';
          el.style.boxSizing = 'border-box';
          el.style.overflow = 'visible';
          // Tự đo chiều cao thực của nội dung (kể cả phần tử position:absolute)
          // rồi set min-height để block bao trọn UI + chừa khoảng trống dưới để kéo block khác.
          // Chỉ ảnh hưởng hiển thị trong canvas (toHTML xuất nguyên mã, không kèm wrapper).
          const fit = () => {
            try {
              el.style.minHeight = '0px';
              const top = el.getBoundingClientRect().top;
              let bottom = el.getBoundingClientRect().bottom;
              const kids = el.getElementsByTagName('*');
              for (let i = 0; i < kids.length; i++) {
                const b = kids[i].getBoundingClientRect().bottom;
                if (b > bottom) bottom = b;
              }
              const h = bottom - top;
              if (h > 0) el.style.minHeight = (Math.ceil(h) + 40) + 'px';  // +40px khoảng trống dưới
            } catch (e) {}
          };
          fit();
          if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fit);
          setTimeout(fit, 350);
          try {
            const imgs = el.getElementsByTagName('img');
            for (let i = 0; i < imgs.length; i++) {
              if (!imgs[i].complete) imgs[i].addEventListener('load', fit, { once: true });
            }
          } catch (e) {}
        },
      },
    });

    // Command: modal 2 ô riêng HTML & CSS
    editor.Commands.add('ldp-edit-code', {
      run(ed, sender, opts) {
        opts = opts || {};
        const cmp = opts.component || ed.getSelected();
        if (!cmp || !cmp.getHtmlCode) return;

        const taStyle = 'width:100%;font:13px/1.5 monospace;padding:12px;border:1px solid #d1d5db;border-radius:8px;box-sizing:border-box;resize:vertical;';
        const lbStyle = 'display:block;font:600 13px sans-serif;color:#254464;margin:0 0 6px;';
        const wrap = document.createElement('div');
        wrap.innerHTML =
          '<label style="' + lbStyle + '">HTML</label>' +
          '<textarea class="ldp-html-input" spellcheck="false" placeholder="<div class=&quot;box&quot;>Xin chào</div>" style="' + taStyle + 'height:210px;"></textarea>' +
          '<label style="' + lbStyle + 'margin-top:14px;">CSS</label>' +
          '<textarea class="ldp-css-input" spellcheck="false" placeholder=".box { color: #314CE7; }" style="' + taStyle + 'height:160px;"></textarea>' +
          '<div style="margin-top:14px;text-align:right;">' +
          '<button class="ldp-code-save" style="padding:11px 26px;background:linear-gradient(135deg,#314CE7,#5E17EB);color:#fff;border:none;border-radius:999px;font-weight:600;font-size:14px;cursor:pointer;">Lưu &amp; Hiển thị</button>' +
          '</div>';

        const htmlTa = wrap.querySelector('.ldp-html-input');
        const cssTa  = wrap.querySelector('.ldp-css-input');
        htmlTa.value = cmp.getHtmlCode();
        cssTa.value  = cmp.getCssCode();

        ed.Modal.open({ title: 'Nhập mã HTML / CSS', content: wrap });

        wrap.querySelector('.ldp-code-save').addEventListener('click', () => {
          cmp.setCode(htmlTa.value, cssTa.value);
          ed.Modal.close();
        });
      },
    });

    // ─────────────── Bố cục ───────────────
    add('ldp-section', 'Section', 'Bố cục', I.section,
      `<section class="ldp-section" style="${SEC('#fff')}">
        <div style="${C}">
          <h2 style="font-size:36px;font-weight:700;text-align:center;margin-bottom:12px;">Tiêu đề Section</h2>
          <p style="font-size:16px;color:#6b7280;text-align:center;max-width:680px;margin:0 auto;">Mô tả ngắn cho phần nội dung. Nhấp đúp để chỉnh sửa.</p>
        </div>
      </section>`);

    add('ldp-container', 'Container', 'Bố cục', I.container,
      `<div class="ldp-container" style="${C}min-height:60px;padding-top:20px;padding-bottom:20px;"></div>`);

    add('ldp-divider', 'Đường kẻ', 'Bố cục', I.divider,
      `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>`);

    add('ldp-spacer', 'Khoảng trống', 'Bố cục', I.spacer,
      `<div class="ldp-spacer" style="height:50px;"></div>`);

    // ─────────────── Cơ bản ───────────────
    add('ldp-heading', 'Tiêu đề', 'Cơ bản', I.heading,
      `<h2 style="font-size:36px;font-weight:700;line-height:1.3;">Tiêu đề của bạn</h2>`);

    add('ldp-paragraph', 'Đoạn văn', 'Cơ bản', I.text,
      `<p style="font-size:16px;line-height:1.7;color:#374151;">Đây là đoạn văn bản. Nhấp đúp để chỉnh sửa nội dung và định dạng theo ý bạn.</p>`);

    add('ldp-button', 'Nút bấm', 'Cơ bản', I.button, {
      type: 'link', classes: ['ldp-btn'], content: 'Nút bấm',
      attributes: { href: '#' },
      style: {
        display: 'inline-block', padding: '13px 30px', background: '#314CE7',
        color: '#ffffff', 'border-radius': '8px', 'text-decoration': 'none',
        'font-weight': '600', 'font-size': '15px', cursor: 'pointer',
      },
    });

    add('ldp-imagebox', 'Image Box', 'Cơ bản', I.imagebox,
      `<div class="ldp-imagebox" style="text-align:center;padding:20px;max-width:340px;">
        <img src="${ph(340, 220)}" alt="Hình ảnh" style="width:100%;height:auto;border-radius:8px;margin-bottom:16px;"/>
        <h3 style="font-size:20px;font-weight:600;margin-bottom:8px;">Tiêu đề</h3>
        <p style="font-size:14px;color:#6b7280;margin:0;">Mô tả ngắn gọn cho image box.</p>
      </div>`);

    // Block HTML / CSS — nhập mã tùy ý, render trực tiếp ra UI
    add('ldp-code', 'HTML / CSS', 'Cơ bản', I.code, { type: 'ldp-code' });

    // ─────────────── Section dựng sẵn ───────────────
    const CAT = 'Section dựng sẵn';

    // Hero (căn giữa)
    add('ldp-hero', 'Hero', CAT, I.hero,
      `<section style="${SEC('#254464')}text-align:center;color:#fff;">
        <div style="${C}max-width:760px;">
          <span style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,.12);border-radius:99px;font-size:13px;margin-bottom:20px;">🚀 Mới ra mắt</span>
          <h1 style="font-size:54px;font-weight:800;line-height:1.15;margin-bottom:18px;">Tiêu đề chính ấn tượng cho trang của bạn</h1>
          <p style="font-size:18px;color:#cbd5e1;margin-bottom:32px;">Câu mô tả ngắn gọn giúp khách hàng hiểu giá trị bạn mang lại chỉ trong vài giây.</p>
          <a href="#" style="${BTN('#314CE7', '#fff')}margin:0 8px;">Bắt đầu ngay</a>
          <a href="#" style="${BTN('rgba(255,255,255,.1)', '#fff')}margin:0 8px;">Tìm hiểu thêm</a>
        </div>
      </section>`);

    // Hero + hình ảnh (chia đôi)
    add('ldp-hero-split', 'Hero + Ảnh', CAT, I.split,
      `<section style="${SEC('#fff')}">
        <div style="${C}${ROW}align-items:center;">
          <div style="flex:1 1 360px;">
            <h1 style="font-size:48px;font-weight:800;line-height:1.2;margin-bottom:18px;">Giải pháp giúp bạn phát triển nhanh hơn</h1>
            <p style="font-size:17px;color:#6b7280;line-height:1.7;margin-bottom:28px;">Mô tả lợi ích chính của sản phẩm/dịch vụ. Tập trung vào kết quả khách hàng đạt được.</p>
            <a href="#" style="${BTN('#314CE7', '#fff')}margin-right:10px;">Dùng thử miễn phí</a>
            <a href="#" style="${BTN('#f1f5f9', '#254464')}">Xem demo</a>
          </div>
          <div style="flex:1 1 360px;">
            <img src="${ph(560, 400, 'Hình minh hoạ')}" alt="Hero" style="width:100%;height:auto;border-radius:12px;"/>
          </div>
        </div>
      </section>`);

    // Features 3 cột
    const feat = (icon, title) =>
      `<div style="flex:1 1 280px;text-align:center;">
        <div style="width:56px;height:56px;margin:0 auto 16px;border-radius:14px;background:#eff6ff;display:flex;align-items:center;justify-content:center;font-size:26px;">${icon}</div>
        <h3 style="font-size:20px;font-weight:600;margin-bottom:8px;">${title}</h3>
        <p style="font-size:15px;color:#6b7280;line-height:1.7;margin:0;">Mô tả ngắn cho tính năng này, nêu bật lợi ích cho người dùng.</p>
      </div>`;
    add('ldp-features-3', 'Tính năng (3 cột)', CAT, I.features,
      `<section style="${SEC('#fff')}">
        <div style="${C}">
          <h2 style="font-size:36px;font-weight:700;text-align:center;margin-bottom:48px;">Tính năng nổi bật</h2>
          <div style="${ROW}">${feat('⚡', 'Nhanh chóng')}${feat('🔒', 'An toàn')}${feat('💡', 'Thông minh')}</div>
        </div>
      </section>`);

    // Features 4 cột
    add('ldp-features-4', 'Tính năng (4 cột)', CAT, I.features,
      `<section style="${SEC('#f8fafc')}">
        <div style="${C}">
          <h2 style="font-size:36px;font-weight:700;text-align:center;margin-bottom:48px;">Vì sao chọn chúng tôi</h2>
          <div style="${ROW}">${feat('🚀', 'Hiệu suất')}${feat('🎯', 'Chính xác')}${feat('🤝', 'Hỗ trợ 24/7')}${feat('📈', 'Hiệu quả')}</div>
        </div>
      </section>`);

    // CTA banner
    add('ldp-cta', 'CTA (Kêu gọi)', CAT, I.cta,
      `<section style="${SEC('#314CE7')}text-align:center;color:#fff;">
        <div style="${C}max-width:680px;">
          <h2 style="font-size:36px;font-weight:800;margin-bottom:14px;">Sẵn sàng bắt đầu?</h2>
          <p style="font-size:17px;color:#dbeafe;margin-bottom:28px;">Đăng ký ngay hôm nay và trải nghiệm sự khác biệt.</p>
          <a href="#" style="${BTN('#fff', '#314CE7')}">Đăng ký miễn phí</a>
        </div>
      </section>`);

    // Pricing 3 cột
    const plan = (name, price, highlight) =>
      `<div style="flex:1 1 280px;background:#fff;border:2px solid ${highlight ? '#314CE7' : '#e5e7eb'};border-radius:16px;padding:32px;text-align:center;">
        ${highlight ? '<span style="display:inline-block;padding:4px 12px;background:#314CE7;color:#fff;border-radius:99px;font-size:12px;margin-bottom:12px;">Phổ biến</span>' : ''}
        <h3 style="font-size:20px;font-weight:700;margin-bottom:6px;">${name}</h3>
        <div style="font-size:40px;font-weight:800;margin-bottom:4px;">${price}<span style="font-size:15px;font-weight:400;color:#6b7280;">/tháng</span></div>
        <ul style="list-style:none;padding:0;margin:20px 0;text-align:left;color:#374151;font-size:15px;line-height:2;">
          <li>✓ Tính năng A</li><li>✓ Tính năng B</li><li>✓ Tính năng C</li>
        </ul>
        <a href="#" style="${BTN(highlight ? '#314CE7' : '#f1f5f9', highlight ? '#fff' : '#254464')}display:block;">Chọn gói</a>
      </div>`;
    add('ldp-pricing', 'Bảng giá (3 gói)', CAT, I.pricing,
      `<section style="${SEC('#f8fafc')}">
        <div style="${C}">
          <h2 style="font-size:36px;font-weight:700;text-align:center;margin-bottom:48px;">Bảng giá linh hoạt</h2>
          <div style="${ROW}align-items:stretch;">${plan('Cơ bản', '99K')}${plan('Chuyên nghiệp', '299K', true)}${plan('Doanh nghiệp', '599K')}</div>
        </div>
      </section>`);

    // Testimonial đơn
    add('ldp-testimonial', 'Lời chứng thực', CAT, I.quote,
      `<section style="${SEC('#fff')}text-align:center;">
        <div style="${C}max-width:720px;">
          <p style="font-size:24px;font-weight:500;line-height:1.6;color:#1f2937;margin-bottom:28px;">"Sản phẩm đã thay đổi hoàn toàn cách chúng tôi làm việc. Cực kỳ đáng tiền!"</p>
          <img src="${avatar('A')}" alt="Avatar" style="width:64px;height:64px;border-radius:50%;margin-bottom:10px;"/>
          <div style="font-weight:600;">Nguyễn Văn A</div>
          <div style="color:#6b7280;font-size:14px;">CEO, Công ty XYZ</div>
        </div>
      </section>`);

    // Testimonials 3 cột
    const tcard = (name, role) =>
      `<div style="flex:1 1 280px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:26px;">
        <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:18px;">"Trải nghiệm tuyệt vời, đội ngũ hỗ trợ nhiệt tình và sản phẩm rất dễ dùng."</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="${avatar(name[0])}" alt="" style="width:44px;height:44px;border-radius:50%;"/>
          <div><div style="font-weight:600;font-size:14px;">${name}</div><div style="color:#6b7280;font-size:13px;">${role}</div></div>
        </div>
      </div>`;
    add('ldp-testimonials-3', 'Chứng thực (3 cột)', CAT, I.quote,
      `<section style="${SEC('#f8fafc')}">
        <div style="${C}">
          <h2 style="font-size:36px;font-weight:700;text-align:center;margin-bottom:48px;">Khách hàng nói gì</h2>
          <div style="${ROW}">${tcard('Trần B', 'Marketing')}${tcard('Lê C', 'Founder')}${tcard('Phạm D', 'Designer')}</div>
        </div>
      </section>`);

    // Team 3 cột
    const member = (name, role) =>
      `<div style="flex:1 1 240px;text-align:center;">
        <img src="${avatar(name[0])}" alt="${name}" style="width:120px;height:120px;border-radius:50%;margin-bottom:14px;"/>
        <h3 style="font-size:18px;font-weight:600;margin-bottom:4px;">${name}</h3>
        <div style="color:#6b7280;font-size:14px;">${role}</div>
      </div>`;
    add('ldp-team', 'Đội ngũ', CAT, I.team,
      `<section style="${SEC('#fff')}">
        <div style="${C}">
          <h2 style="font-size:36px;font-weight:700;text-align:center;margin-bottom:48px;">Đội ngũ của chúng tôi</h2>
          <div style="${ROW}justify-content:center;">${member('Văn A', 'Giám đốc')}${member('Thị B', 'Trưởng phòng')}${member('Văn C', 'Kỹ sư')}</div>
        </div>
      </section>`);

    // Stats / counters
    const stat = (num, label) =>
      `<div style="flex:1 1 180px;text-align:center;">
        <div style="font-size:44px;font-weight:800;color:#314CE7;">${num}</div>
        <div style="color:#6b7280;font-size:15px;margin-top:4px;">${label}</div>
      </div>`;
    add('ldp-stats', 'Số liệu (Stats)', CAT, I.stats,
      `<section style="${SEC('#254464')}">
        <div style="${C}${ROW}">
          ${stat('10K+', 'Khách hàng').replace('#6b7280', '#94a3b8')}
          ${stat('99%', 'Hài lòng').replace('#6b7280', '#94a3b8')}
          ${stat('24/7', 'Hỗ trợ').replace('#6b7280', '#94a3b8')}
          ${stat('150+', 'Quốc gia').replace('#6b7280', '#94a3b8')}
        </div>
      </section>`);

    // FAQ (accordion gốc bằng <details>)
    const qa = (q) =>
      `<details style="border-bottom:1px solid #e5e7eb;padding:18px 0;">
        <summary style="font-size:17px;font-weight:600;cursor:pointer;list-style:none;">${q}</summary>
        <p style="margin:12px 0 0;color:#6b7280;line-height:1.7;">Câu trả lời chi tiết cho câu hỏi này. Nhấp đúp để chỉnh sửa nội dung.</p>
      </details>`;
    add('ldp-faq', 'Câu hỏi (FAQ)', CAT, I.faq,
      `<section style="${SEC('#fff')}">
        <div style="${C}max-width:760px;">
          <h2 style="font-size:36px;font-weight:700;text-align:center;margin-bottom:40px;">Câu hỏi thường gặp</h2>
          ${qa('Làm sao để bắt đầu?')}${qa('Tôi có thể hủy bất cứ lúc nào không?')}${qa('Có hỗ trợ kỹ thuật không?')}
        </div>
      </section>`);

    // Gallery 3 cột
    add('ldp-gallery', 'Thư viện ảnh', CAT, I.gallery,
      `<section style="${SEC('#fff')}">
        <div style="${C}">
          <h2 style="font-size:36px;font-weight:700;text-align:center;margin-bottom:40px;">Thư viện hình ảnh</h2>
          <div style="${ROW}">
            <img src="${ph(360, 260)}" style="flex:1 1 280px;width:100%;border-radius:10px;"/>
            <img src="${ph(360, 260)}" style="flex:1 1 280px;width:100%;border-radius:10px;"/>
            <img src="${ph(360, 260)}" style="flex:1 1 280px;width:100%;border-radius:10px;"/>
          </div>
        </div>
      </section>`);

    // Content + Image (ảnh trái)
    add('ldp-content-img-left', 'Nội dung + Ảnh trái', CAT, I.split,
      `<section style="${SEC('#fff')}">
        <div style="${C}${ROW}align-items:center;">
          <div style="flex:1 1 340px;"><img src="${ph(540, 380)}" style="width:100%;border-radius:12px;"/></div>
          <div style="flex:1 1 340px;">
            <h2 style="font-size:30px;font-weight:700;margin-bottom:14px;">Tiêu đề phần nội dung</h2>
            <p style="font-size:16px;color:#6b7280;line-height:1.8;margin-bottom:22px;">Đoạn mô tả chi tiết đặt bên cạnh hình ảnh. Phù hợp để giới thiệu tính năng hoặc câu chuyện thương hiệu.</p>
            <a href="#" style="${BTN('#314CE7', '#fff')}">Tìm hiểu thêm</a>
          </div>
        </div>
      </section>`);

    // Content + Image (ảnh phải)
    add('ldp-content-img-right', 'Nội dung + Ảnh phải', CAT, I.split,
      `<section style="${SEC('#f8fafc')}">
        <div style="${C}${ROW}align-items:center;">
          <div style="flex:1 1 340px;">
            <h2 style="font-size:30px;font-weight:700;margin-bottom:14px;">Tiêu đề phần nội dung</h2>
            <p style="font-size:16px;color:#6b7280;line-height:1.8;margin-bottom:22px;">Đoạn mô tả chi tiết đặt bên cạnh hình ảnh. Phù hợp để giới thiệu tính năng hoặc câu chuyện thương hiệu.</p>
            <a href="#" style="${BTN('#314CE7', '#fff')}">Tìm hiểu thêm</a>
          </div>
          <div style="flex:1 1 340px;"><img src="${ph(540, 380)}" style="width:100%;border-radius:12px;"/></div>
        </div>
      </section>`);

    // Newsletter
    add('ldp-newsletter', 'Đăng ký nhận tin', CAT, I.news,
      `<section style="${SEC('#254464')}text-align:center;color:#fff;">
        <div style="${C}max-width:600px;">
          <h2 style="font-size:30px;font-weight:700;margin-bottom:12px;">Đăng ký nhận bản tin</h2>
          <p style="color:#cbd5e1;margin-bottom:26px;">Nhận thông tin mới nhất gửi thẳng tới hộp thư của bạn.</p>
          <form style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
            <input type="email" placeholder="Nhập email của bạn" style="flex:1 1 260px;padding:13px 16px;border:none;border-radius:8px;font-size:15px;"/>
            <button type="submit" style="${BTN('#314CE7', '#fff')}border:none;cursor:pointer;">Đăng ký</button>
          </form>
        </div>
      </section>`);

    // Footer
    const fcol = (title) =>
      `<div style="flex:1 1 160px;">
        <h4 style="font-size:15px;font-weight:600;margin-bottom:14px;color:#fff;">${title}</h4>
        <ul style="list-style:none;padding:0;margin:0;line-height:2.2;font-size:14px;">
          <li><a href="#" style="color:#94a3b8;text-decoration:none;">Liên kết 1</a></li>
          <li><a href="#" style="color:#94a3b8;text-decoration:none;">Liên kết 2</a></li>
          <li><a href="#" style="color:#94a3b8;text-decoration:none;">Liên kết 3</a></li>
        </ul>
      </div>`;
    add('ldp-footer', 'Footer', CAT, I.footer,
      `<footer style="background:#254464;color:#94a3b8;padding:56px 0 28px;">
        <div style="${C}${ROW}">
          <div style="flex:2 1 240px;">
            <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:12px;">Thương hiệu</div>
            <p style="font-size:14px;line-height:1.7;max-width:280px;">Mô tả ngắn về công ty hoặc sản phẩm của bạn ở đây.</p>
          </div>
          ${fcol('Sản phẩm')}${fcol('Công ty')}${fcol('Hỗ trợ')}
        </div>
        <div style="${C}border-top:1px solid #1e293b;margin-top:36px;padding-top:24px;text-align:center;font-size:13px;">© 2025 Thương hiệu. Đã đăng ký bản quyền.</div>
      </footer>`);

    // Navbar
    add('ldp-navbar', 'Thanh điều hướng', CAT, I.navbar,
      `<nav style="background:#fff;border-bottom:1px solid #e5e7eb;padding:16px 0;">
        <div style="${C}display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div style="font-size:20px;font-weight:800;color:#254464;">Logo</div>
          <div style="display:flex;gap:26px;align-items:center;">
            <a href="#" style="color:#374151;text-decoration:none;font-size:15px;">Trang chủ</a>
            <a href="#" style="color:#374151;text-decoration:none;font-size:15px;">Tính năng</a>
            <a href="#" style="color:#374151;text-decoration:none;font-size:15px;">Bảng giá</a>
            <a href="#" style="color:#374151;text-decoration:none;font-size:15px;">Liên hệ</a>
            <a href="#" style="${BTN('#314CE7', '#fff')}padding:9px 20px;">Đăng ký</a>
          </div>
        </div>
      </nav>`);
  };
})();
