import { gsap } from 'gsap';

/** Footer link-column accordions.
 *
 *  Hooks are `data-footer` attributes, never class names, on the same contract
 *  the Navbar uses:
 *
 *    root | acc | trigger | panel | chevron | item
 *
 *  Only below the tablet breakpoint do the columns collapse. Above it the
 *  lists are always open and the triggers are inert — the heading stays a
 *  heading, so it must not be announced or focusable as a button there.
 */

const hook = (name: string) => `[data-footer="${name}"]`;

/** Webflow's small breakpoint. Above this the accordions do not exist. */
const COLLAPSE = '(max-width: 767px)';

export function initFooter(): void {
  // Every root, not just the first — a page carrying both the global footer
  // and a standalone instance (a style guide) would otherwise leave the
  // second one inert with nothing to show for it.
  for (const root of document.querySelectorAll<HTMLElement>(hook('root'))) {
    setupFooter(root);
  }
}

function setupFooter(root: HTMLElement): void {
  const groups = Array.from(root.querySelectorAll<HTMLElement>(hook('acc')));
  if (!groups.length) return;

  const collapse = matchMedia(COLLAPSE);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // Marks the footer as JS-owned. Until it lands, CSS leaves the panels open
  // so a failed bundle cannot make the footer links unreachable on mobile.
  root.setAttribute('data-footer-ready', '');

  const accordions = groups.map((group) => new Accordion(group, reduced));

  function apply(): void {
    for (const a of accordions) a.rebuild(collapse.matches);
  }

  apply();
  collapse.addEventListener('change', apply);
  reduced.addEventListener('change', apply);
}

class Accordion {
  private readonly trigger: HTMLElement | null;
  private readonly panel: HTMLElement | null;
  private readonly chevron: HTMLElement[];
  private readonly items: HTMLElement[];
  private tl: gsap.core.Timeline | null = null;
  private isOpen = false;

  constructor(
    group: HTMLElement,
    private readonly reduced: MediaQueryList,
  ) {
    this.trigger = group.querySelector<HTMLElement>(hook('trigger'));
    this.panel = group.querySelector<HTMLElement>(hook('panel'));
    this.chevron = Array.from(group.querySelectorAll<HTMLElement>(hook('chevron')));
    this.items = Array.from(group.querySelectorAll<HTMLElement>(hook('item')));

    this.trigger?.addEventListener('click', () => {
      // Guarded rather than unbound, so the listener survives a breakpoint
      // flip without needing to be added and removed each time.
      if (this.tl) this.toggle();
    });
  }

  /** Called on every breakpoint change: tear the timeline down and, below the
   *  collapse width, build a fresh one. Above it the panel is left completely
   *  untouched so the Designer's own styles decide the open layout. */
  rebuild(collapsed: boolean): void {
    this.tl?.kill();
    this.tl = null;
    this.isOpen = false;

    const { panel, trigger } = this;
    if (!panel || !trigger) return;

    // kill() leaves the last rendered values inline; clear them so whichever
    // state comes next is what actually paints.
    gsap.set([panel, ...this.chevron, ...this.items], { clearProps: 'all' });

    if (!collapsed) {
      // Desktop: a heading, not a control.
      trigger.removeAttribute('aria-expanded');
      trigger.setAttribute('tabindex', '-1');
      panel.removeAttribute('aria-hidden');
      return;
    }

    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('tabindex');
    panel.setAttribute('aria-hidden', 'true');

    const t = gsap.timeline({
      paused: true,
      defaults: { ease: 'power4.inOut' },
      onReverseComplete: () => panel.setAttribute('aria-hidden', 'true'),
    });

    // Both ends of every tween are stated explicitly. `.from()` would read the
    // items' CURRENT opacity as the value to animate back to, so if a previous
    // timeline ever left them hidden — a kill() that outran its clearProps, a
    // second rebuild in the same frame — the new tween would animate 0 -> 0 and
    // the links would stay invisible for good, inside a panel that still opens
    // to full height. That is the one failure this accordion cannot afford: the
    // footer links become unreachable with no error anywhere.
    //
    // The panel carries its own overflow for the same reason. §05 sets it too,
    // but only under [data-footer-ready]; if that sheet is late, stale or
    // missing, the height tween must still clip rather than let a 'closed'
    // panel lay its links out at full height.
    t.fromTo(
      panel,
      { height: 0, overflow: 'hidden' },
      { height: 'auto', duration: 0.4 },
      0,
    )
      .fromTo(this.chevron, { rotate: 0 }, { rotate: 180, duration: 0.4 }, 0)
      .fromTo(
        this.items,
        { autoAlpha: 0, y: -8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.4,
          ease: 'expo.out',
          stagger: 0.04,
        },
        0,
      );

    if (this.reduced.matches) t.timeScale(100);
    this.tl = t;
  }

  private toggle(): void {
    const { tl, panel, trigger } = this;
    if (!tl || !panel || !trigger) return;

    this.isOpen = !this.isOpen;
    trigger.setAttribute('aria-expanded', String(this.isOpen));

    if (this.isOpen) {
      // Set before playing: the links have to be reachable for the whole
      // opening, not only once it finishes.
      panel.setAttribute('aria-hidden', 'false');
      tl.play();
    } else {
      tl.reverse();
    }
  }
}
