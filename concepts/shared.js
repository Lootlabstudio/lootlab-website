// Shared behaviour for the three concept previews: trailer lightbox,
// reduced-motion handling for looping video, and simple galleries.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Muted background loops: never autoplay when the visitor prefers reduced motion.
  document.querySelectorAll('video[data-loop]').forEach((v) => {
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); return; }
    v.play().catch(() => {});
  });

  // Trailer lightbox with sound.
  const dialog = document.querySelector('dialog.trailer');
  if (dialog) {
    const video = dialog.querySelector('video');
    document.querySelectorAll('[data-open-trailer]').forEach((btn) =>
      btn.addEventListener('click', () => {
        dialog.showModal();
        video.currentTime = 0;
        video.play().catch(() => {});
      })
    );
    const close = () => { video.pause(); dialog.close(); };
    dialog.querySelector('[data-close]').addEventListener('click', close);
    dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
    dialog.addEventListener('close', () => video.pause());
  }

  // Horizontal galleries with previous/next buttons.
  document.querySelectorAll('[data-gallery]').forEach((g) => {
    const track = g.querySelector('[data-track]');
    const step = () => track.clientWidth * 0.8;
    g.querySelector('[data-prev]')?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
    g.querySelector('[data-next]')?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
  });

  // Concept forms are visual only.
  document.querySelectorAll('form[data-concept]').forEach((f) =>
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const s = f.querySelector('[data-status]');
      if (s) s.textContent = 'Preview only: this form is connected in the full build.';
    })
  );
})();
