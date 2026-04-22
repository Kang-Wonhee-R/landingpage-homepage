// PDF 뷰어 — START_PAGE, END_PAGE, PDF_URL은 canvas-container의 data 속성에서 읽음
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

(async function () {
  const container  = document.getElementById('canvas-container');
  const START_PAGE = parseInt(container.dataset.start, 10);
  const END_PAGE   = parseInt(container.dataset.end,   10);
  const PDF_URL    = container.dataset.pdf;

  try {
    const pdf = await pdfjsLib.getDocument(PDF_URL).promise;
    document.getElementById('loading').style.display = 'none';

    const dpr     = window.devicePixelRatio || 2;
    const sidePad = window.innerWidth <= 600 ? 40 : 80;
    const maxW    = Math.min(window.innerWidth - sidePad, 860);

    for (let i = START_PAGE; i <= END_PAGE; i++) {
      const page     = await pdf.getPage(i);
      const natural  = page.getViewport({ scale: 1 });
      const scale    = (maxW / natural.width) * dpr;
      const viewport = page.getViewport({ scale });

      const wrap   = document.createElement('div');
      wrap.className = 'page-canvas-wrap';

      const canvas = document.createElement('canvas');
      canvas.width  = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width  = Math.round(viewport.width  / dpr) + 'px';
      canvas.style.height = Math.round(viewport.height / dpr) + 'px';

      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      wrap.appendChild(canvas);
      container.appendChild(wrap);
    }
  } catch (e) {
    document.getElementById('loading').textContent = 'PDF를 불러오지 못했습니다.';
  }
})();
