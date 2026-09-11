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
  /* lerp is exponential damping, not a duration: Lenis runs
     damp(current, target, lerp * 60, dt), so the time constant is
     1 / (lerp * 60) seconds and it settles once it is within half a pixel
     of the target. The 0.1 default is slow enough to read as a "smooth
     scroll site" — one 400px wheel tick takes ~1.1s to come to rest.
     Measured settle times for that same tick:

       0.1 (default)  361ms to 90%, 1095ms to rest
       0.2            183ms to 90%,  549ms to rest
       0.3            115ms to 90%,  366ms to rest

     0.2 keeps the easing legible while halving the lag against native.
     Raise it toward 0.3 for less smoothing, lower it for more. */
  return new Lenis({ lerp: 0.2, autoRaf: true, allowNestedScroll: true });
}
