// Entry point. Keep this file a manifest: one import and one call per
// module, so what runs on the site is readable at a glance. Feature code
// lives in src/modules/<name>.ts and exports a single init function that
// no-ops when its selector is absent from the page.

import { initSmoothScroll } from './modules/smooth-scroll';
import { initNav } from './modules/nav';
import { initFooter } from './modules/footer';
import { initVideoLibrary } from './modules/video-library';
import { initGlow } from './modules/glow';
import { initFeatureTabs } from './modules/feature-tabs';
import { initAccordion } from './modules/accordion';
import { initMediaStory } from './modules/media-story';
import { initBenefitsModals } from './modules/benefits-modal';
import { initEnvironmentSwitcher } from './modules/environment-switcher';

// Release the pre-paint scroll lock set by the head bootstrap (loader.html).
// Must stay FIRST and unconditional: anything above it that throws leaves the
// page locked until the snippet's 3s timeout fires.
//
// It also has to precede Lenis. The lock is `height: 100%; overflow: hidden`
// on <body>, so while it is on, documentElement.scrollHeight is one viewport.
// Lenis measures its scroll limit once in its constructor — under the lock it
// reads ~0 and swallows the wheel against a page it thinks cannot scroll. It
// only re-measures from a ResizeObserver debounced 250ms, and every late font
// or image reflow restarts that timer, so recovery can take seconds. Reading
// scrollHeight below forces a synchronous layout flush, so by the time Lenis
// constructs, the real page height is what it sees.
document.documentElement.classList.remove('is-loading');

// Modules are independent, so one throwing must not take the rest of the page
// with it. Without this the manifest is a chain: a bad selector in the nav
// would stop initFooter() from ever running, and the footer's failure mode is
// silent — CSS leaves the accordions open only while JS has NOT claimed them,
// so a half-initialised page is worse than an uninitialised one.
function run(name: string, init: () => void): void {
  try {
    init();
  } catch (error) {
    // Reported, not swallowed: this should be visible in the console of any
    // page where a module is misbehaving, without breaking the others.
    console.error(`[bv] ${name} failed to initialise`, error);
  }
}

// Returns the Lenis instance — assign it here once a module needs to ride
// the scroll callback or stop/start it (parallax, nav, modals), and pass it
// in. It is undefined under prefers-reduced-motion, which is also the signal
// for those modules to skip their motion.
//
// Not wrapped: the value is a dependency of initNav below, so there is no
// meaningful way to continue past a failure here other than without it.
let lenis: ReturnType<typeof initSmoothScroll>;
try {
  lenis = initSmoothScroll();
} catch (error) {
  console.error('[bv] smooth scroll failed to initialise', error);
}

// Takes Lenis so opening the menu can stop the scroll rather than fighting it
// with overflow:hidden; falls back to the .nav-open class when Lenis is absent.
run('nav', () => initNav(lenis));

// Mobile-only link-column accordions. No Lenis dependency: the panels are in
// normal flow, so nothing here touches the scroll.
run('footer', initFooter);

// Ambient drift on the background glow blobs. Transform-only, so it cannot
// repaint the sections they sit behind.
run('glow', initGlow);

// Expanding feature panels on the Sweat page. Click-driven only, so there is
// nothing to pause or clean up when it is absent — it no-ops off that page.
run('feature tabs', initFeatureTabs);

// Benefits accordion on the Sweat page — one row open at a time. No-ops on
// any page without a data-acc root.
run('accordion', initAccordion);

// S | Media Story, Story variant: "Read More" expands the copy in place into a
// scroll column. No-ops on variants without a data-story="more" link.
run('media story', () => initMediaStory());

// Explore Benefits popup on the Recover Suite Cards. Locks the scroll with the
// .is-modal-open class while a modal is open, and each modal is portalled to
// <body> on init so the card's overflow cannot clip it. No-ops on any page
// without a data-benefits card.
run('benefits modal', initBenefitsModals);

// Internal tool: prints each background video's CDN URL on /design/video-library
// so it can be copied for use elsewhere. No-ops on every other page.
run('video library', initVideoLibrary);

// Internal tool: the bottom-left Dev / Staging switcher. No-ops off *.webflow.io
// and inside the Designer, so it never reaches a visitor. Last on purpose — it
// is the only module that appends to <body>, and a switcher is most useful when
// the modules above it are the ones misbehaving.
run('environment switcher', initEnvironmentSwitcher);
