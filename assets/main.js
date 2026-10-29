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

// ── Portfolio 가로 스크롤 — 마우스 드래그 ──
var pfTrack = document.getElementById('pfTrack');
if (pfTrack) {
  var pfDown = false, pfMoved = false, pfStartX = 0, pfStartLeft = 0;

  pfTrack.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse') return; // 터치는 네이티브 스크롤 사용
    pfDown = true; pfMoved = false;
    pfStartX = e.clientX; pfStartLeft = pfTrack.scrollLeft;
    pfTrack.classList.add('dragging');
  });

  window.addEventListener('pointermove', function (e) {
    if (!pfDown) return;
    var dx = e.clientX - pfStartX;
    if (Math.abs(dx) > 5) pfMoved = true;
    pfTrack.scrollLeft = pfStartLeft - dx;
  });

  window.addEventListener('pointerup', function () {
    pfDown = false;
    pfTrack.classList.remove('dragging');
  });

  // 드래그 후 클릭으로 링크가 열리지 않도록
  pfTrack.addEventListener('click', function (e) {
    if (pfMoved) { e.preventDefault(); e.stopPropagation(); }
  }, true);
}

// ── Archive 제목 — 장소명 대문자, am/pm/sec 등 시간 단위는 소문자 유지 ──
document.querySelectorAll('.arc-title-text').forEach(function (el) {
  el.textContent = el.textContent.toUpperCase().replace(/(\d\s?)(AM|PM|SEC|MIN)\b/g, function (m, d, ap) {
    return d + ap.toLowerCase();
  });
});

// ── Archive 트레이싱지 페이지 번호 — arc-num(썸네일 오버레이)에서 그대로 복사해 data-page에 기록.
//    CSS가 counter()로 순서 기반 번호를 계산하던 예전 방식은 항목을 추가/삭제할 때마다
//    counter-reset 값을 수동으로 맞춰야 해서 계속 어긋났음. 이제는 각 항목에 이미 적혀있는
//    실제 번호(arc-num)를 그대로 가져오므로 항목 순서/개수와 무관하게 항상 일치한다. ──
document.querySelectorAll('#archiveGrid .arc-item').forEach(function (el) {
  var numEl  = el.querySelector('.arc-num');
  var textEl = el.querySelector('.arc-text'); // ::before는 arc-text에 붙으므로 속성도 arc-text에 있어야 attr()이 읽는다
  if (numEl && textEl) textEl.dataset.page = numEl.textContent.trim();
});

// ── Archive 더 보기 / 접기 ──
function archiveThreshold() { return 8; }

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
