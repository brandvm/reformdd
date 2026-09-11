import Lenis from 'lenis';

/** Bundled rather than CDN-loaded: the footer loader appends our script
 *  tag dynamically, so a sibling <script defer> has no ordering promise
 *  and window.Lenis could be undefined by the time we run. */
export function initSmoothScroll(): Lenis | undefined {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* allowNestedScroll hands a gesture back to the browser whenever it
     lands on something that can actually consume it: Lenis reads the
     computed overflow, checks scrollWidth/scrollHeight against the client
     box, and compares the gesture's own deltaX/deltaY — so a horizontal
     swipe over a horizontally-scrolling grid scrolls the grid, while a
     vertical one over the same grid still scrolls the page. Results are
     cached per node for two seconds, so it costs one getComputedStyle.

     Off by default, which is how Lenis ends up swallowing the wheel over
     any sideways-scrolling grid or overflow pane. Turning it on covers
     every scroller on the site, including ones added later, instead of
     needing a data-lenis-prevent attribute on each of them. */
  return new Lenis({ autoRaf: true, allowNestedScroll: true });
}
