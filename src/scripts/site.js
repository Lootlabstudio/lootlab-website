// Interactions shared by every page: header state, scroll reveals, parallax,
// logo tilt, the trailer and image viewers, and the contact section.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const range = (v, a, b) => clamp((v - a) / (b - a));
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

/* ---------------- Muted preview loops ---------------- */
document.querySelectorAll('video[data-loop]').forEach((v) => {
  if (reduce) { v.removeAttribute('autoplay'); v.pause(); return; }
  v.play().catch(() => {});
});

/* ---------------- Trailer lightbox ---------------- */
const trailer = document.querySelector('dialog.trailer');
if (trailer) {
  const video = trailer.querySelector('video');
  document.querySelectorAll('[data-open-trailer]').forEach((btn) => btn.addEventListener('click', () => {
    trailer.showModal();
    video.currentTime = 0;
    video.play().catch(() => {});
  }));
  trailer.querySelector('[data-close]').addEventListener('click', () => trailer.close());
  trailer.addEventListener('click', (e) => { if (e.target === trailer) trailer.close(); });
  trailer.addEventListener('close', () => video.pause());
}

/* ---------------- Image viewer ---------------- */
const viewer = document.querySelector('dialog.viewer');
if (viewer) {
  const viewerImg = viewer.querySelector('img');
  document.querySelectorAll('[data-view]').forEach((btn) => btn.addEventListener('click', () => {
    const img = btn.querySelector('img');
    viewerImg.src = btn.dataset.view || img.currentSrc || img.src;
    viewerImg.alt = img.alt;
    viewer.showModal();
  }));
  viewer.querySelector('[data-close]').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
}

/* ---------------- Logo tilt ---------------- */
document.querySelectorAll('[data-tilt]').forEach((img) => {
  if (reduce) return;
  const box = img.parentElement;
  box.addEventListener('pointermove', (e) => {
    const r = box.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    img.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.03)`;
  });
  box.addEventListener('pointerleave', () => { img.style.transform = ''; });
});

/* ---------------- Contact ---------------- */
const sky = document.querySelector('.contact-sky');
if (sky) {
  for (let i = 0; i < 42; i++) {
    const el = document.createElement('span');
    el.className = 'sparkle';
    el.style.cssText = `left:${hash(i, 12.3) * 100}%;top:${hash(i, 4.7) * 100}%;--s:${4 + hash(i, 6.1) * 10}px;--o:${.25 + hash(i, 9.9) * .6};--d:${3 + hash(i, 2.2) * 4}s;--delay:${-hash(i, 7.4) * 6}s`;
    sky.append(el);
  }
}
document.querySelectorAll('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(btn.dataset.copy); btn.textContent = 'Copied'; }
  catch { btn.textContent = 'Press Ctrl+C'; }
  setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
}));
// Until a form backend is connected, the form opens the visitor's email app
// with their message filled in.
document.querySelectorAll('form[data-mailto]').forEach((form) => form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const topic = form.querySelector('input[name="topic"]:checked')?.nextElementSibling?.textContent || 'Hello';
  const subject = `${topic} enquiry from ${data.get('name')}`;
  const body = `${data.get('message')}\n\n${data.get('name')}\n${data.get('email')}`;
  location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const status = form.querySelector('[data-status]');
  if (status) status.textContent = 'Opening your email app to send this message.';
}));

/* ---------------- Scroll-linked effects ---------------- */
const header = document.querySelector('.top');
const intro = document.getElementById('intro');
const reveals = [...document.querySelectorAll('[data-reveal]')];
const depthEls = [...document.querySelectorAll('[data-depth]')];
function frame() {
  // Pages with the intro keep a transparent header until it has scrolled away.
  if (header) header.classList.toggle('solid', !intro || intro.getBoundingClientRect().bottom < 80);
  for (const el of reveals) {
    const r = el.getBoundingClientRect();
    const t = reduce ? 1 : ease(range(innerHeight - r.top, 0, innerHeight * 0.8));
    el.style.setProperty('--clip', `${(1 - t) * 12}%`);
    el.style.setProperty('--zoom', String(1.15 - t * 0.15));
  }
  const drift = !reduce && innerWidth >= 900;
  for (const el of depthEls) {
    const r = el.getBoundingClientRect();
    // Gentle drift, capped so neighbouring images never collide.
    const off = drift ? clamp((r.top + r.height / 2 - innerHeight / 2) * Number(el.dataset.depth), -24, 24) : 0;
    el.style.setProperty('--py', `${off.toFixed(1)}px`);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
