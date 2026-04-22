// ── 인증 설정 ──
// 비밀번호는 SHA-256 해시로만 저장 (평문 저장 금지)
// 변경: printf '%s' '새비밀번호' | openssl dgst -sha256 -hex | sed 's/.*= //'
const PASSWORD_HASH = 'd888c432bc0230f6cf5c3c45b6c6597526f5fcb92916ded459f08a50efc37fee';

const MAX_ATTEMPTS      = 5;
const LOCKOUT_MS        = 5 * 60 * 1000; // 5분

async function hashPassword(pw) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getAttemptData() {
  return JSON.parse(sessionStorage.getItem('admin-attempts') || '{"count":0,"lockUntil":0}');
}

function setAttemptData(data) {
  sessionStorage.setItem('admin-attempts', JSON.stringify(data));
}

// ── 로그인 ──
async function checkLogin() {
  const errEl = document.getElementById('login-error');
  const data  = getAttemptData();

  if (data.lockUntil > Date.now()) {
    const secs = Math.ceil((data.lockUntil - Date.now()) / 1000);
    errEl.textContent = `너무 많은 시도입니다. ${secs}초 후 다시 시도하세요.`;
    errEl.style.display = 'block';
    return;
  }

  const val = document.getElementById('pw-input').value;
  if (!val) return;

  const hash = await hashPassword(val);
  if (hash === PASSWORD_HASH) {
    setAttemptData({ count: 0, lockUntil: 0 });
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-screen').style.display = 'block';
    loadContent();
  } else {
    data.count++;
    const remaining = MAX_ATTEMPTS - data.count;
    if (data.count >= MAX_ATTEMPTS) {
      data.lockUntil = Date.now() + LOCKOUT_MS;
      data.count = 0;
      errEl.textContent = '5회 실패 — 5분간 잠금됩니다.';
    } else {
      errEl.textContent = `비밀번호가 틀렸습니다. (${remaining}회 남음)`;
    }
    setAttemptData(data);
    errEl.style.display = 'block';
  }
}

function logout() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-screen').style.display = 'none';
  document.getElementById('pw-input').value = '';
}

// ── 이벤트 바인딩 ──
document.getElementById('loginBtn').addEventListener('click', checkLogin);
document.getElementById('pw-input').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') checkLogin();
});
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('saveBtn').addEventListener('click', saveAndDownload);

// ── 콘텐츠 로드 ──
let currentDoc = null;

async function loadContent() {
  try {
    const res  = await fetch('/index.html?' + Date.now());
    const html = await res.text();
    const parser = new DOMParser();
    currentDoc = parser.parseFromString(html, 'text/html');

    loadAbout();
    loadArchive();
    loadContact();
  } catch (e) {
    alert('index.html을 불러오지 못했습니다. 서버에서 실행 중인지 확인하세요.');
  }
}

// About
function loadAbout() {
  const paras = currentDoc.querySelectorAll('.intro-text p');
  if (paras[0]) document.getElementById('about-p1').value = paras[0].textContent.trim();
  if (paras[1]) {
    const span = paras[1].querySelector('span');
    const full = paras[1].textContent.trim();
    if (span) {
      document.getElementById('about-p2-highlight').value = span.textContent.trim();
      document.getElementById('about-p2-rest').value = full.replace(span.textContent.trim(), '').trim();
    } else {
      document.getElementById('about-p2-rest').value = full;
    }
  }
  if (paras[2]) {
    const span = paras[2].querySelector('span');
    const full = paras[2].textContent.trim();
    if (span) {
      document.getElementById('about-p3-highlight').value = span.textContent.trim();
      document.getElementById('about-p3-rest').value = full.replace(span.textContent.trim(), '').trim();
    } else {
      document.getElementById('about-p3-rest').value = full;
    }
  }
}

// Archive
const arcTypes = [
  '공간 (사진)', '에세이 · 차', '산책 (영상)', '공간 (사진) 2', '에세이 · 산책',
  '–', '–', '–', '–', '–', '–', '–', '–', '–', '–', '–'
];

function makeField(labelText, tag, attrs = {}) {
  const group = document.createElement('div');
  group.className = 'field-group';
  group.style.marginBottom = '0';
  const lbl = document.createElement('label');
  lbl.textContent = labelText;
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => { if (k === 'value') el.value = v; else el.setAttribute(k, v); });
  group.appendChild(lbl);
  group.appendChild(el);
  return { group, el };
}

function loadArchive() {
  const items     = currentDoc.querySelectorAll('.arc-item');
  const container = document.getElementById('archive-editor');
  // 컨테이너 초기화 (DOM API로 재구성하므로 XSS 위험 없음)
  container.innerHTML = '';

  items.forEach((item, i) => {
    const tag     = item.querySelector('.arc-tag')?.textContent.trim()     || '';
    const title   = item.querySelector('.arc-title')?.textContent.trim()   || '';
    const excerpt = item.querySelector('.arc-excerpt')?.textContent.trim() || '';
    const date    = item.querySelector('.arc-date')?.textContent.trim()    || '';

    const card = document.createElement('div');
    card.className = 'arc-card';

    const header = document.createElement('p');
    header.className = 'arc-card-header';
    header.textContent = `항목 ${i + 1} — ${arcTypes[i] || '–'}`;
    card.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'arc-card-grid';

    const { group: tagGroup }   = makeField('태그',  'input',    { type: 'text', id: `arc-${i}-tag`,   value: tag });
    const { group: titleGroup } = makeField('제목',  'input',    { type: 'text', id: `arc-${i}-title`, value: title });
    const { group: dateGroup }  = makeField('날짜',  'input',    { type: 'text', id: `arc-${i}-date`,  value: date, placeholder: '2025. 04' });
    grid.appendChild(tagGroup);
    grid.appendChild(titleGroup);
    grid.appendChild(dateGroup);
    card.appendChild(grid);

    if (excerpt) {
      const { group: exGroup, el: exEl } = makeField('본문 (에세이)', 'textarea', { id: `arc-${i}-excerpt`, rows: '2' });
      exEl.value = excerpt;
      card.appendChild(exGroup);
    } else {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.id   = `arc-${i}-excerpt`;
      hidden.value = '';
      card.appendChild(hidden);
    }

    container.appendChild(card);
  });
}

// Contact
function loadContact() {
  const links = currentDoc.querySelectorAll('.c-link');
  links.forEach(link => {
    const label    = link.querySelector('span:first-child')?.textContent.trim().toLowerCase();
    const u        = link.dataset.u || '';
    const d        = link.dataset.d || '';
    const emailVal = u && d ? u + '@' + d : (link.querySelector('.em-addr')?.textContent.trim() || '');
    const val      = link.querySelector('span:last-child')?.textContent.trim();
    if (label === 'email')     document.getElementById('contact-email').value     = emailVal || val || '';
    if (label === 'gmail')     document.getElementById('contact-gmail').value     = emailVal || val || '';
    if (label === 'instagram') document.getElementById('contact-instagram').value = val || '';
  });
}

// ── 저장 및 다운로드 ──
function saveAndDownload() {
  if (!currentDoc) { alert('콘텐츠를 먼저 불러오세요.'); return; }

  const doc = currentDoc.cloneNode(true);

  // About
  const paras = doc.querySelectorAll('.intro-text p');
  if (paras[0]) paras[0].textContent = document.getElementById('about-p1').value;
  if (paras[1]) {
    const h = document.getElementById('about-p2-highlight').value;
    const r = document.getElementById('about-p2-rest').value;
    paras[1].textContent = '';
    if (h) { const s = doc.createElement('span'); s.textContent = h; paras[1].appendChild(s); paras[1].appendChild(doc.createTextNode(' ' + r)); }
    else   { paras[1].textContent = r; }
  }
  if (paras[2]) {
    const h = document.getElementById('about-p3-highlight').value;
    const r = document.getElementById('about-p3-rest').value;
    paras[2].textContent = '';
    if (h) { const s = doc.createElement('span'); s.textContent = h; paras[2].appendChild(s); paras[2].appendChild(doc.createTextNode(' ' + r)); }
    else   { paras[2].textContent = r; }
  }

  // Archive
  const items = doc.querySelectorAll('.arc-item');
  items.forEach((item, i) => {
    const tag     = document.getElementById(`arc-${i}-tag`)?.value;
    const title   = document.getElementById(`arc-${i}-title`)?.value;
    const date    = document.getElementById(`arc-${i}-date`)?.value;
    const excerpt = document.getElementById(`arc-${i}-excerpt`)?.value;
    if (item.querySelector('.arc-tag')     && tag     !== undefined) item.querySelector('.arc-tag').textContent     = tag;
    if (item.querySelector('.arc-title')   && title   !== undefined) item.querySelector('.arc-title').textContent   = title;
    if (item.querySelector('.arc-date')    && date    !== undefined) item.querySelector('.arc-date').textContent    = date;
    if (item.querySelector('.arc-excerpt') && excerpt !== undefined) item.querySelector('.arc-excerpt').textContent = excerpt;
  });

  // Contact
  const links = doc.querySelectorAll('.c-link');
  links.forEach(link => {
    const label   = link.querySelector('span:first-child')?.textContent.trim().toLowerCase();
    const valSpan = link.querySelector('span:last-child');
    if (label === 'email') {
      const v = document.getElementById('contact-email').value;
      const parts = v.split('@');
      link.dataset.u = parts[0] || '';
      link.dataset.d = parts[1] || '';
      if (valSpan) valSpan.className = 'em-addr';
      link.href = '#';
    }
    if (label === 'gmail') {
      const v = document.getElementById('contact-gmail').value;
      const parts = v.split('@');
      link.dataset.u = parts[0] || '';
      link.dataset.d = parts[1] || '';
      if (valSpan) valSpan.className = 'em-addr';
      link.href = '#';
    }
    if (label === 'instagram') {
      const v = document.getElementById('contact-instagram').value;
      if (valSpan) valSpan.textContent = v;
      link.href = 'https://instagram.com/' + v.replace('@', '');
    }
  });

  // 파일 다운로드
  const html = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'index.html'; a.click();
  URL.revokeObjectURL(url);

  const msg = document.getElementById('save-msg');
  msg.style.display = 'inline';
  setTimeout(() => { msg.style.display = 'none'; }, 3000);
}
