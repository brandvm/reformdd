// Entry point. Keep this file a manifest: one import and one call per
// module, so what runs on the site is readable at a glance. Feature code
// lives in src/modules/<name>.ts and exports a single init function that
// no-ops when its selector is absent from the page.

import { initSmoothScroll } from './modules/smooth-scroll';

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

// Returns the Lenis instance — assign it here once a module needs to ride
// the scroll callback or stop/start it (parallax, nav, modals), and pass it
// in. It is undefined under prefers-reduced-motion, which is also the signal
// for those modules to skip their motion.
initSmoothScroll();
