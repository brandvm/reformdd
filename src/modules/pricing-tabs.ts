// src/modules/pricing-tabs.ts
// /pricing sticky tab bar active state.
// Tabs: .pricing-tabs a[href="#section-id"] → section[id]. Toggles .is-active
// (styled in Webflow, which also sets it on the first tab as the default).
//
// Position-based rather than an IntersectionObserver band like faq.ts: the
// two pricing blocks are tall and separated by other sections, so a band
// would leave whichever tab it last saw active while the reader is between
// them. Here the active tab is the last section whose top has crossed the
// line where anchor-scroll.ts lands a target (bar bottom + 24px), so a
// click and the highlight always agree.

const GAP = 24;

export function initPricingTabs(scope: ParentNode = document) {
  const bar = scope.querySelector<HTMLElement>(".pricing-tabs");
  if (!bar) return;
  const tabs = Array.from(bar.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
    .map((link) => ({ link, section: document.getElementById(link.hash.slice(1)) }))
    .filter((t): t is { link: HTMLAnchorElement; section: HTMLElement } => !!t.section);
  if (!tabs.length) return;

  let current: HTMLAnchorElement | null = null;
  const update = () => {
    const line = bar.getBoundingClientRect().bottom + GAP + 1;
    let active = tabs[0];
    for (const t of tabs) if (t.section.getBoundingClientRect().top <= line) active = t;
    if (active.link === current) return;
    current = active.link;
    tabs.forEach(({ link }) => {
      const on = link === current;
      link.classList.toggle("is-active", on);
      if (on) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  // Lenis drives native window scrolling, so the scroll event still fires.
  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  update();
}
