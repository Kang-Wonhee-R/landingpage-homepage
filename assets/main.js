// ── Google Analytics 쿠키 동의 ──
(function () {
  var consent = localStorage.getItem('ga-consent');
  if (consent === 'granted') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('event', 'page_view');
  } else if (consent === null) {
    document.getElementById('cookie-banner').classList.add('show');
  }

  document.getElementById('cookie-accept').addEventListener('click', function () {
    localStorage.setItem('ga-consent', 'granted');
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('event', 'page_view');
    document.getElementById('cookie-banner').classList.remove('show');
  });

  document.getElementById('cookie-decline').addEventListener('click', function () {
    localStorage.setItem('ga-consent', 'denied');
    document.getElementById('cookie-banner').classList.remove('show');
  });
})();

// ── 이메일 주소 렌더링 (봇 수집 방지) ──
document.querySelectorAll('.em-link').forEach(function (a) {
  var addr = a.dataset.u + '@' + a.dataset.d;
  a.querySelector('.em-addr').textContent = addr;
  a.href = 'mailto:' + addr;
});

// ── Admin 접근 단축키 (Alt+Shift+A) ──
document.addEventListener('keydown', function (e) {
  if (e.altKey && e.shiftKey && e.key === 'A') window.location.href = '/admin.html';
});

// ── 모바일 Nav 토글 ──
function toggleNav() {
  var links   = document.getElementById('navLinks');
  var btn     = document.getElementById('navHamburger');
  var overlay = document.getElementById('navOverlay');
  var isOpen  = links.classList.contains('open');
  links.classList.toggle('open', !isOpen);
  btn.classList.toggle('open', !isOpen);
  overlay.classList.toggle('open', !isOpen);
  document.body.style.overflow = isOpen ? '' : 'hidden';
}

function closeNav() {
  document.getElementById('navLinks').classList.remove('open');
  document.getElementById('navHamburger').classList.remove('open');
  document.getElementById('navOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('navHamburger').addEventListener('click', toggleNav);
document.getElementById('navOverlay').addEventListener('click', closeNav);
document.querySelectorAll('#navLinks a').forEach(function (a) {
  a.addEventListener('click', closeNav);
});

// ── 스크롤 페이드인 ──
var io = new IntersectionObserver(function (entries) {
  entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('on'); });
}, { threshold: 0.08 });
document.querySelectorAll('.fi').forEach(function (el) { io.observe(el); });

// ── PDF 썸네일 렌더링 ──
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

var thumbPages = { 'thumb-1': 3, 'thumb-2': 9, 'thumb-3': 13, 'thumb-4': 17, 'thumb-5': 21 };

async function renderThumbs() {
  try {
    var pdf = await pdfjsLib.getDocument('assets/portfolio.pdf').promise;
    var dpr = window.devicePixelRatio || 2;

    for (var [id, pageNum] of Object.entries(thumbPages)) {
      var container = document.getElementById(id);
      if (!container) continue;

      var page    = await pdf.getPage(pageNum);
      var natural = page.getViewport({ scale: 1 });
      var cW      = container.offsetWidth;
      var scale   = (cW / natural.width) * dpr;
      var viewport = page.getViewport({ scale });

      var canvas = document.createElement('canvas');
      canvas.width  = viewport.width;
      canvas.height = viewport.height;
      canvas.style.position = 'relative';
      canvas.style.width  = '100%';
      canvas.style.height = 'auto';

      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      container.appendChild(canvas);
      container.classList.add('loaded');
    }
  } catch (e) {
    document.querySelectorAll('.pf-thumb-label').forEach(function (el) {
      el.textContent = '미리보기 불가';
    });
  }
}

// Portfolio 섹션이 뷰에 들어올 때 썸네일 로드
var pfSection  = document.getElementById('portfolio');
var pfObserver = new IntersectionObserver(function (entries) {
  if (entries[0].isIntersecting) { renderThumbs(); pfObserver.disconnect(); }
}, { threshold: 0.05 });
if (pfSection) pfObserver.observe(pfSection);

// ── Archive 더 보기 / 접기 ──
function archiveThreshold() { return window.innerWidth <= 768 ? 6 : 5; }

function initArchive() {
  var t     = archiveThreshold();
  var items = document.querySelectorAll('#archiveGrid .arc-item');
  items.forEach(function (el, idx) {
    if (idx >= t) { el.classList.add('hidden'); el.style.display = 'none'; }
    else          { el.classList.remove('hidden'); el.style.display = ''; }
  });
  document.querySelector('#btnMore span:first-child').textContent = '더 보기 (' + (items.length - t) + ')';
}
initArchive();

document.getElementById('btnMore').addEventListener('click', toggleArchive);

var _archiveToggling = false;
function toggleArchive() {
  if (_archiveToggling) return;
  _archiveToggling = true;
  setTimeout(function () { _archiveToggling = false; }, 600);

  var btn    = document.getElementById('btnMore');
  var isOpen = btn.classList.contains('open');
  var t      = archiveThreshold();
  var items  = document.querySelectorAll('#archiveGrid .arc-item');

  if (isOpen) {
    items.forEach(function (el, idx) {
      if (idx >= t) { el.classList.add('hidden'); el.style.display = 'none'; }
    });
    btn.classList.remove('open');
    btn.querySelector('span:first-child').textContent = '더 보기 (' + (items.length - t) + ')';
    document.getElementById('archive').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    items.forEach(function (el) { el.classList.remove('hidden'); el.style.display = ''; });
    btn.classList.add('open');
    btn.querySelector('span:first-child').textContent = '접기';
    document.querySelectorAll('#archiveGrid .arc-item:not(.on)').forEach(function (el) { io.observe(el); });
  }
}
