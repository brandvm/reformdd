import { gsap } from 'gsap';

/** Feature tabs — the expanding panel row on the Sweat page.
 *
 *  Hooks are `data-tabs` attributes, never class names, on the same contract
 *  the Navbar and Footer use:
 *
 *    root | panel | rail | content | dots | dot | eyebrow
 *
 *  Three panels share the row. One is open and fills whatever the other two
 *  leave; the closed pair each show a rotated rail label you click to open
 *  them. No autoplay — the panel only moves when someone asks it to.
 *
 *  Every number this module needs is MEASURED, never repeated from the
 *  stylesheet. The collapsed width, the content inset and the dot-group width
 *  all come from the live layout, so the em-based widths keep working as the
 *  fluid root font-size changes across breakpoints, and nothing here drifts
 *  when someone retunes the class in Webflow.
 */

const hook = (name: string) => `[data-tabs="${name}"]`;

/** Below this the row stops being a row: the panels stack and the rails
 *  become a tab bar along the bottom, so there is no width to animate and
 *  no dots to place. Matches Webflow's small breakpoint. */
const STACK = '(max-width: 767px)';

/** Panel width, rail crossfade, content entry. The content waits for the
 *  panel to be most of the way open before it starts. */
const PANEL_S = 0.8;
const RAIL_S = 0.4;
const CONTENT_S = 0.6;
const CONTENT_DELAY = 0.35;

export function initFeatureTabs(): void {
  // Every root, not just the first: a style guide page could carry a second
  // instance, and a half-initialised tab row is worse than an inert one.
  for (const root of document.querySelectorAll<HTMLElement>(hook('root'))) {
    setupFeatureTabs(root);
  }
}

function setupFeatureTabs(root: HTMLElement): void {
  const panels = Array.from(root.querySelectorAll<HTMLElement>(hook('panel')));
  if (panels.length < 2) return;

  const rails = panels.map((p) => p.querySelector<HTMLElement>(hook('rail')));
  const contents = panels.map((p) => p.querySelector<HTMLElement>(hook('content')));
  const dots = root.querySelector<HTMLElement>(hook('dots'));
  const eyebrow = root.querySelector<HTMLElement>(hook('eyebrow'));
  const dotList = dots
    ? Array.from(dots.querySelectorAll<HTMLElement>(hook('dot')))
    : [];

  const stack = matchMedia(STACK);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  let active = 0;
  // Measured in rebuild(), while every panel is at its resting width. Reading
  // it inside setActive() would be too late: `active` has already moved, so
  // the "closed" panel found could be the one still open mid-tween.
  let collapsed = 0;

  // Marks the row as JS-owned. Until it lands, CSS keeps the first panel open
  // and every rail visible, so a failed bundle leaves three readable panels
  // rather than a row of unlabelled slivers.
  root.setAttribute('data-tabs-ready', '');

  const emOf = () => parseFloat(getComputedStyle(root).fontSize) || 16;

  /** The closed width, read off a panel that is currently closed. Two of the
   *  three always are, so there is no need to force a measurement pass. */
  function measureCollapsed(): number {
    const closed = panels.find((_, i) => i !== active);
    return closed ? closed.getBoundingClientRect().width : 0;
  }

  /** Where the dot group sits for a given open panel. The dots track the
   *  open panel's right edge: the closed rails to their right take
   *  `collapsed` each, and the group hangs one content inset in from them.
   *  Reading the inset off the content element keeps this in step with the
   *  40px/80px the class sets per breakpoint. */
  function dotsX(index: number): number {
    if (!dots) return 0;
    const inset = contents[index]
      ? parseFloat(getComputedStyle(contents[index] as HTMLElement).left) || 0
      : 0;
    const trailing = panels.length - 1 - index;
    return (
      root.clientWidth - collapsed * trailing - inset - dots.offsetWidth
    );
  }

  function setActive(index: number, immediate = false): void {
    if (index < 0 || index >= panels.length) return;
    active = index;

    for (let i = 0; i < panels.length; i++) {
      panels[i].classList.toggle('is-active', i === index);
      // The dot's lit state is a Webflow combo class, not something this file
      // styles — so the class is the write, and aria-selected rides with it.
      dotList[i]?.classList.toggle('is-active', i === index);
      rails[i]?.setAttribute('aria-pressed', String(i === index));
      dotList[i]?.setAttribute('aria-selected', String(i === index));
    }

    // Stacked: the panels stop being a row and lie on top of each other, so
    // there is no width to tween and the rails are off — the dots have become
    // the labelled tab bar. The copy still crossfades, because all three
    // occupy the same box and a hard swap would read as a glitch.
    const em = emOf();

    if (stack.matches) {
      gsap.set(panels, { clearProps: 'width' });
      if (dots) gsap.set(dots, { clearProps: 'x' });
      if (eyebrow) gsap.set(eyebrow, { clearProps: 'x' });
      for (let i = 0; i < panels.length; i++) {
        const content = contents[i];
        if (!content) continue;
        gsap.to(content, {
          autoAlpha: i === index ? 1 : 0,
          y: i === index ? 0 : em,
          duration: immediate ? 0 : 0.5,
          ease: 'expo.out',
          overwrite: 'auto',
        });
      }
      return;
    }

    const open = root.clientWidth - collapsed * (panels.length - 1);
    const d = immediate ? 0 : undefined;

    for (let i = 0; i < panels.length; i++) {
      gsap.to(panels[i], {
        width: i === index ? open : collapsed,
        duration: d ?? PANEL_S,
        ease: 'power4.inOut',
        overwrite: 'auto',
      });

      // autoAlpha, not opacity: it parks the rail at visibility:hidden, which
      // also takes it out of the hit-testing and the tab order, so the open
      // panel's own rail cannot be clicked or focused behind its content.
      const rail = rails[i];
      if (rail) {
        gsap.to(rail, {
          autoAlpha: i === index ? 0 : 1,
          duration: d ?? RAIL_S,
          overwrite: 'auto',
        });
      }

      const content = contents[i];
      if (!content) continue;
      if (i === index) {
        gsap.fromTo(
          content,
          { autoAlpha: 0, y: em },
          {
            autoAlpha: 1,
            y: 0,
            duration: d ?? CONTENT_S,
            delay: immediate ? 0 : CONTENT_DELAY,
            ease: 'expo.out',
            overwrite: 'auto',
          },
        );
      } else {
        // Out at once, not crossfaded: two sets of copy dissolving through
        // each other over the same photograph reads as a rendering fault.
        // The kill matters on a quick double switch: this panel's delayed
        // entry tween may not have started yet, and would fire after the set.
        gsap.killTweensOf(content);
        gsap.set(content, { autoAlpha: 0, y: em });
      }
    }

    // The eyebrow rides the open panel's left edge: one collapsed rail to
    // its left per panel before it.
    if (eyebrow) {
      gsap.to(eyebrow, {
        x: collapsed * index,
        duration: d ?? PANEL_S,
        ease: 'power4.inOut',
        overwrite: 'auto',
      });
    }

    if (dots) {
      gsap.to(dots, {
        // x, not left: the spec's own rule is that only width, transform and
        // opacity animate, and a transform keeps the dots off the layout path
        // while the panels beside them are already resizing every frame.
        x: dotsX(index),
        duration: d ?? PANEL_S,
        ease: 'power4.inOut',
        overwrite: 'auto',
      });
    }
  }

  /** Re-reads the layout and re-applies the current panel without motion.
   *  Called whenever the measurements this module cached could have moved:
   *  a breakpoint change, or the row itself being resized. */
  function rebuild(): void {
    // The tweens leave an inline px width behind. Clear it first so the class
    // supplies the resting width again and `collapsedWidth()` measures the
    // stylesheet's em rather than the last viewport's pixels. A zero reading
    // (row hidden, or stacked) falls back to the class's 7.75em.
    gsap.set(panels, { clearProps: 'width' });
    const measured = measureCollapsed();
    collapsed = measured > 0 ? measured : 7.75 * emOf();
    if (dots) gsap.set(dots, { left: 0, x: dotsX(active) });
    setActive(active, true);
  }

  for (let i = 0; i < panels.length; i++) {
    rails[i]?.addEventListener('click', () => setActive(i));
    dotList[i]?.addEventListener('click', () => setActive(i));
  }

  // Rails and dots are real buttons in Webflow, so Enter and Space already
  // fire click. Arrow keys are the part the browser does not give us, and
  // they are what a tab row is expected to answer to.
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = (active + step + panels.length) % panels.length;
    setActive(next);
    // Stacked, the rails are hidden and the dots are the tab bar.
    const target = rails[next] && !stack.matches ? rails[next] : dotList[next];
    target?.focus();
    event.preventDefault();
  });

  // Reduced motion keeps the state changes and drops the travel. timeScale
  // rather than an early return, so a click still lands on the right panel.
  function applyReduced(): void {
    gsap.globalTimeline.timeScale(reduced.matches ? 100 : 1);
  }
  applyReduced();
  reduced.addEventListener('change', applyReduced);

  stack.addEventListener('change', rebuild);

  // The row's own width drives every number above, so watch the row rather
  // than the window: a sidebar opening would move these too.
  if ('ResizeObserver' in window) {
    let width = root.clientWidth;
    new ResizeObserver(() => {
      if (root.clientWidth === width) return;
      width = root.clientWidth;
      rebuild();
    }).observe(root);
  }

  rebuild();
}
