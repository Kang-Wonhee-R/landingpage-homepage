// Archive 캐러셀 — 버튼 클릭 및 터치 스와이프 지원
let currentSlide = 0;

function moveCarousel(dir) {
  const track = document.getElementById('carouselTrack');
  if (!track) return;
  const total = track.children.length;
  currentSlide = (currentSlide + dir + total) % total;
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
  const count = document.getElementById('carouselCount');
  if (count) count.textContent = `${currentSlide + 1} / ${total}`;
}

// 버튼 이벤트 바인딩 (onclick 속성 대신 addEventListener 사용)
(function () {
  const btns = document.querySelectorAll('.carousel-btn');
  if (btns[0]) btns[0].addEventListener('click', function () { moveCarousel(-1); });
  if (btns[1]) btns[1].addEventListener('click', function () { moveCarousel(1); });

  // 터치 스와이프 지원
  const carousel = document.getElementById('carousel');
  if (!carousel) return;
  let startX = 0;
  carousel.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX;
  }, { passive: true });
  carousel.addEventListener('touchend', function (e) {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) moveCarousel(diff > 0 ? 1 : -1);
  }, { passive: true });
})();
