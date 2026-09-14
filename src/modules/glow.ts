import { gsap } from 'gsap';

/** Background glow drift.
 *
 *  The blobs themselves are pure CSS — a flat Glow/* colour shaped by a radial
 *  mask, built in Webflow as the Glow component. This only moves them.
 *
 *  Transform-only, deliberately: `x`/`y` on a composited layer costs no paint,
 *  so a glow drifting behind a section does not repaint the section. Animating
 *  the gradient, the mask, or the element's position would repaint every frame
 *  across an area the size of the viewport, which is the whole reason the
 *  design brief rules out filter: blur() as well.
 *
 *  No-ops when no blob is on the page, and under prefers-reduced-motion — a
 *  slow ambient drift with no user control is exactly what that setting is for.
 */

const GLOW = '[data-glow="blob"]';

/** Past this many blobs the drift is paused while offscreen. Below it the
 *  bookkeeping costs more than the three transforms it would save. */
const CULL_ABOVE = 3;

export function initGlow(): void {
  const blobs = Array.from(document.querySelectorAll<HTMLElement>(GLOW));
  if (!blobs.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cull = blobs.length > CULL_ABOVE && 'IntersectionObserver' in window;

  const tweens = blobs.map((blob, i) =>
    gsap.to(blob, {
      x: 40,
      y: -30,
      // Staggered durations rather than a stagger offset: the blobs are far
      // apart on the page, so what matters is that no two share a period and
      // start visibly beating against each other, not when they begin.
      duration: 14 + i * 2,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      paused: cull,
    }),
  );

  if (!cull) return;

  // Offscreen blobs are not just invisible, they are still compositing. Pause
  // them so a long page with many glows costs the same as a short one.
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const i = blobs.indexOf(entry.target as HTMLElement);
        if (i < 0) continue;
        if (entry.isIntersecting) tweens[i].play();
        else tweens[i].pause();
      }
    },
    // Start moving slightly before the blob scrolls in, so it is never caught
    // frozen mid-drift at the edge of the viewport.
    { rootMargin: '10% 0px' },
  );

  for (const blob of blobs) io.observe(blob);
}
