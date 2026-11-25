// src/modules/gallery.ts
// Endless image carousel (the /presale studio gallery).
// Hooks, all set in the Designer:
//   data-gallery         the root, which clips the row (S | Gallery)
//   data-gallery-track   the row of Gallery Items inside it
//   data-gallery-speed   optional on the root: autoplay speed in px/s (default 40)
//
// Behaviour:
// - Autoplays in a loop. The items are cloned until the row is at least one
//   viewport wider than one set, and the row wraps by exactly one set width,
//   so the seam is never visible.
// - Follows the page scroll: scrolling down runs it leftwards, scrolling up
//   rightwards, and each scroll adds a push that eases back to the autoplay
//   speed, so it reads as inertia rather than a jump.
// - Draggable with mouse, pen or touch. The row follows the pointer 1:1 and
//   on release keeps the fling velocity, decaying back to autoplay in the
//   direction it was flung. Vertical swipes still scroll the page
//   (touch-action: pan-y, set in §05 gallery.css).
//
// The Designer never runs this, so the canvas shows the static row clipped
// by the section — the originals only, no clones. Under
// prefers-reduced-motion the autoplay and the scroll push are off; dragging
// still works, with no glide after release.

/** Time constant of the return to autoplay speed, in seconds. */
const EASE_BACK = 0.6;
/** How much one pixel of page scroll pushes the row, in px/s. */
const SCROLL_PUSH = 4;
/** Ceiling on the row's speed, in px/s, so a hard fling or a jump-to-anchor
 *  scroll cannot spin it into a blur. */
const MAX_SPEED = 3000;
/** Pointer travel, in px, before a press counts as a drag. Below it a tap
 *  is left alone. */
const DRAG_SLOP = 4;

export function initGallery(): void {
  document.querySelectorAll<HTMLElement>('[data-gallery]').forEach((root) => {
    const track = root.querySelector<HTMLElement>('[data-gallery-track]');
    if (track && track.children.length) setUp(root, track);
  });
}

function setUp(root: HTMLElement, track: HTMLElement): void {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const base = Number(root.dataset.gallerySpeed) || 40;
  const originals = Array.from(track.children) as HTMLElement[];

  // Images offscreen to the side are skipped by native lazy loading until
  // they scroll in, which would show as blank cards entering the row.
  const prepImages = (el: HTMLElement) =>
    el.querySelectorAll('img').forEach((img) => {
      img.loading = 'eager';
      img.draggable = false;
    });
  originals.forEach(prepImages);

  let clones: HTMLElement[] = [];
  let setWidth = 0;

  // One set = the originals plus the gap after the last one, measured as the
  // distance from the first original to its first clone.
  const layout = () => {
    clones.forEach((c) => c.remove());
    clones = [];
    const addSet = () =>
      originals.forEach((item) => {
        const clone = item.cloneNode(true) as HTMLElement;
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('img').forEach((img) => (img.alt = ''));
        prepImages(clone);
        track.appendChild(clone);
        clones.push(clone);
      });
    addSet();
    setWidth = clones[0].offsetLeft - originals[0].offsetLeft;
    if (setWidth <= 0) return;
    // Enough copies that a full viewport of row is always visible past any
    // wrap point.
    const extra = Math.ceil(root.clientWidth / setWidth);
    for (let i = 0; i < extra; i++) addSet();
    x = wrap(x);
  };

  let x = 0; // row offset, px; always in (-setWidth, 0]
  let dir = -1; // -1 runs leftwards, 1 rightwards
  let velocity = reduced ? 0 : dir * base; // px/s

  const wrap = (v: number) => (setWidth > 0 ? (((v % setWidth) - setWidth) % setWidth) : v);
  const render = () => {
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  };

  layout();
  render();
  root.dataset.galleryState = 'ready';

  // Re-measure when the item size changes with the breakpoint. Width changes
  // of the root alone also change how many copies are needed.
  let lastWidth = root.clientWidth;
  let lastItem = originals[0].offsetWidth;
  new ResizeObserver(() => {
    if (root.clientWidth === lastWidth && originals[0].offsetWidth === lastItem) return;
    lastWidth = root.clientWidth;
    lastItem = originals[0].offsetWidth;
    layout();
    render();
  }).observe(root);

  // ---- Drag -------------------------------------------------------------
  let pointerId: number | null = null;
  let dragging = false;
  let startX = 0;
  let lastX = 0;
  let lastT = 0;
  let dragVelocity = 0;

  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || pointerId !== null) return;
    pointerId = e.pointerId;
    dragging = false;
    startX = lastX = e.clientX;
    lastT = e.timeStamp;
    dragVelocity = 0;
  });

  root.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointerId) return;
    if (!dragging) {
      if (Math.abs(e.clientX - startX) < DRAG_SLOP) return;
      dragging = true;
      root.setPointerCapture(e.pointerId);
      root.dataset.galleryState = 'dragging';
    }
    const dx = e.clientX - lastX;
    const dt = Math.max(1, e.timeStamp - lastT) / 1000;
    // Smoothed so a single jittery last event does not set the fling.
    dragVelocity = dragVelocity * 0.6 + (dx / dt) * 0.4;
    lastX = e.clientX;
    lastT = e.timeStamp;
    x = wrap(x + dx);
    render();
  });

  const release = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    if (!dragging) return;
    dragging = false;
    root.dataset.galleryState = 'ready';
    // A pause before letting go means no fling, whatever the last move said.
    if (e.timeStamp - lastT > 80) dragVelocity = 0;
    if (Math.abs(dragVelocity) > 20) dir = dragVelocity > 0 ? 1 : -1;
    velocity = reduced ? 0 : clamp(dragVelocity);
  };
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);

  // ---- Page scroll ------------------------------------------------------
  // Lenis drives the native scroll position, so window scroll events carry
  // its eased deltas and this needs no Lenis handle.
  let lastScroll = window.scrollY;
  if (!reduced) {
    window.addEventListener(
      'scroll',
      () => {
        const dy = window.scrollY - lastScroll;
        lastScroll = window.scrollY;
        if (!dy || dragging || !visible) return;
        dir = dy > 0 ? -1 : 1;
        velocity = clamp(velocity + dir * Math.abs(dy) * SCROLL_PUSH);
      },
      { passive: true },
    );
  }

  // ---- Frame loop -------------------------------------------------------
  // Runs only while the gallery is on screen.
  let visible = false;
  let raf = 0;
  let prev = 0;

  const frame = (t: number) => {
    raf = requestAnimationFrame(frame);
    const dt = prev ? Math.min(0.05, (t - prev) / 1000) : 0;
    prev = t;
    if (dragging || !dt) return;
    const target = reduced ? 0 : dir * base;
    velocity += (target - velocity) * (1 - Math.exp(-dt / EASE_BACK));
    if (Math.abs(velocity) < 0.01) return;
    x = wrap(x + velocity * dt);
    render();
  };

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf) {
      prev = 0;
      raf = requestAnimationFrame(frame);
    } else if (!visible && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }).observe(root);
}

function clamp(v: number): number {
  return Math.max(-MAX_SPEED, Math.min(MAX_SPEED, v));
}
