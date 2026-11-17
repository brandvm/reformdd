// src/modules/anchor-scroll.ts
// Same-page anchor links that land below whatever is pinned to the top.
//
// Webflow's own handler (click.wf-scroll, jQuery on document) offsets only
// for a position:fixed header and never reads scroll-margin-top, so it puts
// the target at 0px. On /pricing the sticky tab bar (top: -100px) stays
// pinned over the first 130px (178px on phones, where the tabs stack) and
// covers the heading it just scrolled to. This replaces that handler.
//
// The offset is measured at click time, not stored: the larger of the
// target's scroll-margin-top (§06, --nav-h) and the bottom edge of any
// sticky or fixed bar that will be pinned over it, plus a gap.
import type Lenis from 'lenis';

const GAP = 24;

type JQuery = (target: Document) => { off: (events: string) => void };

/** Where a pinned element's bottom edge will sit once `target` is scrolled
 *  to the top, or 0 if it will not be covering the top of the viewport. */
function pinnedBottom(el: HTMLElement, target: HTMLElement): number {
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return 0;
  // Only something above the target can cover it — a sticky side column
  // (the FAQs nav) sits beside its groups, not over them.
  const rect = el.getBoundingClientRect();
  const box = target.getBoundingClientRect();
  if (rect.right <= box.left || rect.left >= box.right) return 0;
  if (style.position === 'fixed') {
    // Top bars only — not the bottom CTA bar, nor full-screen overlays.
    return rect.top <= 1 && rect.height < innerHeight / 2 ? rect.bottom : 0;
  }
  // A sticky element only sticks inside its parent, so it covers the target
  // only when both share that parent.
  if (style.position !== 'sticky' || el.contains(target)) return 0;
  if (!el.parentElement?.contains(target)) return 0;
  const top = parseFloat(style.top);
  return Number.isNaN(top) ? 0 : top + el.offsetHeight;
}

function offsetFor(target: HTMLElement): number {
  let bar = 0;
  for (const el of document.querySelectorAll<HTMLElement>('body *')) {
    const pos = getComputedStyle(el).position;
    if (pos === 'sticky' || pos === 'fixed') bar = Math.max(bar, pinnedBottom(el, target));
  }
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  return Math.max(margin, bar ? bar + GAP : 0);
}

/* Anchor jumps glide rather than snap. Lenis's default for scrollTo is the
   same lerp damping as wheel scrolling (0.2, ~0.3s), which read as a jump
   cut on long pages. A fixed duration that grows with distance keeps short
   hops brisk and long ones calm: 1s plus 0.1s per 1000px, capped at 1.8s,
   on an ease-in-out cubic so it starts and lands softly. Wheel scrolling is
   untouched (smooth-scroll.ts). */
const MIN_S = 1.0;
const MAX_S = 1.8;
const PER_1000PX_S = 0.1;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function scrollToTarget(target: HTMLElement, lenis: Lenis | undefined, smooth: boolean) {
  const y = target.getBoundingClientRect().top + scrollY - offsetFor(target);
  const distance = Math.abs(y - scrollY);
  const duration = Math.min(MAX_S, MIN_S + (distance / 1000) * PER_1000PX_S);
  if (lenis) lenis.scrollTo(y, smooth ? { duration, easing: easeInOutCubic } : { immediate: true });
  else window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
}

function byHash(hash: string): HTMLElement | null {
  if (!hash || hash === '#') return null;
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}

function targetOf(link: HTMLAnchorElement): HTMLElement | null {
  if (link.origin !== location.origin || link.pathname !== location.pathname) return null;
  return byHash(link.hash);
}

export function initAnchorScroll(lenis?: Lenis) {
  const links = document.querySelectorAll<HTMLAnchorElement>('a[href*="#"]:not([href="#"])');
  if (!Array.from(links).some(targetOf)) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Webflow.push runs after Webflow's own modules have bound, or at once if
  // they already have, so the unbind cannot lose a race with webflow.js.
  const unbind = () => (window as unknown as { jQuery?: JQuery }).jQuery?.(document).off('click.wf-scroll');
  const wf = window.Webflow as { push?: (fn: () => void) => void } | undefined;
  if (wf?.push) wf.push(unbind);
  else unbind();

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest?.<HTMLAnchorElement>('a[href*="#"]');
    if (!link || link.classList.contains('w-tab-link')) return;
    const target = targetOf(link);
    if (!target) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    scrollToTarget(target, lenis, !reduce);
    // Move keyboard focus with the scroll, as Webflow's handler did, so the
    // next Tab continues from the section. A section made focusable here is
    // marked so §07 hides its ring: it is a landing point, not a control.
    if (!target.matches('a, button, input, select, textarea, [tabindex]')) {
      target.setAttribute('tabindex', '-1');
      target.setAttribute('data-anchor-focus', '');
    }
    target.focus({ preventScroll: true });
  });

  // Arriving from another page with a hash: the browser's own jump uses
  // scroll-margin-top alone, so correct it once layout has settled. The
  // bundle loads async, so load may already have fired.
  const initial = byHash(location.hash);
  if (!initial) return;
  const settle = () => scrollToTarget(initial, lenis, false);
  if (document.readyState === 'complete') settle();
  else addEventListener('load', settle, { once: true });
}
