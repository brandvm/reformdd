import { gsap } from 'gsap';
import type Lenis from 'lenis';

/** Navbar panel motion.
 *
 *  Hooks are `data-nav` attributes, never class names: the Designer owns the
 *  classes and must stay free to rename or restyle them without silently
 *  breaking the animation. The attribute contract is documented on the Navbar
 *  component in Webflow and mirrored here:
 *
 *    root | toggle | panel | overlay | line-1 | line-2 | line-3 | item
 *
 *  `item` is anything that staggers in; an optional `data-nav-delay` on an
 *  item adds a per-group offset so column two and the promo tiles trail
 *  column one instead of needing their own tweens.
 *
 *  The logo and Contact button deliberately have no hook: they stay put and
 *  visible while the panel is open, so the bar reads as part of the open
 *  menu rather than something the menu replaced.
 *
 *  GSAP is bundled rather than CDN-loaded for the same reason Lenis is: the
 *  footer loader appends our script tag dynamically, so a sibling <script> has
 *  no ordering guarantee and window.gsap could still be undefined when we run.
 */

const hook = (name: string) => `[data-nav="${name}"]`;

/** Half the toggle's 32x20 box, so both bars land on its centre when they
 *  grow to the 28px diagonal. Line 1 sits flush left; line 3 is inset 12px
 *  (see the Is Offset combo), hence the asymmetric x. */
const BAR_LENGTH = 28;
const LINE_1_X = 2;
const LINE_3_X = -10;
const LINE_Y = 9;

/** Condensed-header thresholds, in px of scroll. Two values rather than one
 *  so there is a dead zone around the flip: entering at 64 and leaving at 32
 *  means easing across the boundary — or the rubber-band at the top of iOS —
 *  cannot strobe the header between its two heights. */
const SCROLL_ENTER = 64;
const SCROLL_EXIT = 32;

export function initNav(lenis?: Lenis): void {
  // Every root, not just the first. The Navbar lives in the G | Page W
  // wrapper, so it is on every page; a page that ALSO carries a standalone
  // instance (the style guide did) has two. querySelector would wire the
  // first in document order and leave the other inert — no error, no
  // console warning, just a menu button that does nothing.
  for (const root of document.querySelectorAll<HTMLElement>(hook('root'))) {
    setupNav(root, lenis);
  }
}

function setupNav(root: HTMLElement, lenis?: Lenis): void {
  const all = (name: string) =>
    Array.from(root.querySelectorAll<HTMLElement>(hook(name)));

  const toggle = all('toggle')[0];
  const panel = all('panel')[0];
  if (!toggle || !panel) return;

  const overlay = all('overlay');
  const items = all('item');
  const line1 = all('line-1');
  const line2 = all('line-2');
  const line3 = all('line-3');

  /* 991px is Webflow's tablet breakpoint. At or below it the panel is a
     full-height scrolling sheet whose height is auto, so it opens by
     animating height; above it the panel is a fixed-height band and
     clip-path wipes it down without ever scaling or reflowing content. */
  const coarse = matchMedia('(max-width: 991px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  let isOpen = false;
  let tl = build();

  function build(): gsap.core.Timeline {
    const t = gsap.timeline({
      paused: true,
      defaults: { ease: 'power4.inOut' },
      // Only hide the panel once the close has finished playing out —
      // doing it on the click would cut the reverse off mid-wipe.
      onReverseComplete: () => {
        panel.style.visibility = '';
      },
    });

    if (coarse.matches) {
      t.fromTo(panel, { height: 0 }, { height: 'auto', duration: 0.5 }, 0);
    } else {
      t.fromTo(
        panel,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5 },
        0,
      );
    }

    // Scrim over everything the panel does not cover. autoAlpha rather than
    // opacity so the closed overlay is visibility:hidden and cannot swallow
    // clicks meant for the page underneath.
    t.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0)
      .to(
        line1,
        { width: BAR_LENGTH, x: LINE_1_X, y: LINE_Y, rotate: 45, duration: 0.4 },
        0,
      )
      .to(line2, { autoAlpha: 0, duration: 0.2 }, 0)
      .to(
        line3,
        { width: BAR_LENGTH, x: LINE_3_X, y: -LINE_Y, rotate: -45, duration: 0.4 },
        0,
      )
      .from(
        items,
        {
          autoAlpha: 0,
          y: 24,
          duration: 0.6,
          ease: 'expo.out',
          // A function stagger rather than { each, from } so each item can
          // add its own group offset from the markup.
          stagger: (i, el: Element) =>
            i * 0.07 + Number((el as HTMLElement).dataset.navDelay ?? 0),
        },
        0.2,
      );

    // Reduced motion still gets the state change, just effectively instantly.
    if (reduced.matches) t.timeScale(100);

    return t;
  }

  function lockScroll(on: boolean): void {
    if (lenis) {
      // Lenis owns the lock outright. Its own .lenis-stopped rule handles
      // the overflow and it holds the scroll position across stop/start.
      // Stacking a second overflow:hidden on top of it — on <body> above
      // all — makes the body open a new block formatting context, and the
      // browser re-clamps the document scroll when it does. That was the
      // jump on opening the menu from mid-page: invisible at the top of the
      // document, because there is no position to lose there.
      if (on) lenis.stop();
      else lenis.start();
      return;
    }
    // Only reached under prefers-reduced-motion, where index.ts never
    // constructs a Lenis instance and nothing else is locking the scroll.
    document.documentElement.classList.toggle('nav-open', on);
  }

  function setOpen(next: boolean): void {
    if (next === isOpen) return;
    isOpen = next;

    toggle.setAttribute('aria-expanded', String(next));
    toggle.setAttribute('aria-label', next ? 'Close menu' : 'Open menu');
    panel.setAttribute('aria-hidden', String(!next));
    // Styling hook only — CSS uses it to suspend the condensed state, so the
    // panel always opens against a full-height bar.
    root.toggleAttribute('data-nav-open', next);

    if (next) {
      // Beat the timeline to it: the panel has visibility:hidden in CSS as
      // the no-JS fallback, and nothing inside it is focusable until this
      // clears. The wipe itself is the clip-path / height tween.
      panel.style.visibility = 'visible';
      tl.timeScale(1).play();
    } else {
      // Fast exit — the entrance stagger reads as dawdling in reverse.
      tl.timeScale(1.6).reverse();
      // Only reclaim focus if it is inside the panel we just closed;
      // otherwise a click elsewhere on the page would yank it back.
      if (panel.contains(document.activeElement)) toggle.focus();
    }

    lockScroll(next);
  }

  function rebuild(): void {
    setOpen(false);
    tl.kill();
    // kill() leaves the last rendered values inline; clear them so the fresh
    // timeline's time-0 state is what actually paints.
    gsap.set([panel, ...overlay, ...items, ...line1, ...line2, ...line3], {
      clearProps: 'all',
    });
    panel.style.visibility = '';
    tl = build();
  }

  let isScrolled = false;

  function onScroll(y: number): void {
    // The latch. The comparison runs per scroll event, but it reads two
    // numbers and touches nothing — the DOM write happens only on the flip,
    // so a full page of scrolling costs one attribute toggle, not hundreds.
    // Everything the flag drives is CSS, so there is no measuring here and
    // nothing that can force a layout mid-scroll.
    const next = isScrolled ? y > SCROLL_EXIT : y > SCROLL_ENTER;
    if (next === isScrolled) return;
    isScrolled = next;
    root.toggleAttribute('data-nav-scrolled', next);
  }

  if (lenis) {
    // Ride the Lenis rAF loop instead of adding a second scroll listener:
    // it already ticks once per frame with the position we need, and its
    // smoothed value is what the page is actually painted at.
    const l = lenis;
    l.on('scroll', () => onScroll(l.scroll));
    onScroll(l.scroll);
  } else {
    // No Lenis under prefers-reduced-motion, so fall back to the native
    // event. Passive: we never preventDefault, and saying so keeps the
    // listener off the main thread's scroll-blocking path.
    const native = () => onScroll(window.scrollY);
    addEventListener('scroll', native, { passive: true });
    native();
  }

  toggle.addEventListener('click', () => setOpen(!isOpen));

  // Clicking the scrim closes, the way every other mega menu behaves.
  for (const el of overlay) el.addEventListener('click', () => setOpen(false));

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isOpen) return;
    setOpen(false);
    toggle.focus();
  });

  // Following a link closes the panel so a same-page anchor does not leave
  // the menu covering the thing it just scrolled to.
  for (const item of items) {
    item.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('a')) setOpen(false);
    });
  }

  coarse.addEventListener('change', rebuild);
  reduced.addEventListener('change', rebuild);
}
