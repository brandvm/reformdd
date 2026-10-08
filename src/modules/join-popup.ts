// src/modules/join-popup.ts
// Join Popup — the site-wide "Let's connect" newsletter popup.
// Hooks (set on the Join Popup component, placed once in Page W):
//   data-join="modal"  the fixed overlay (Join Popup class, display: none in Webflow)
//   data-join="panel"  the black card (click outside it = close)
//   data-join="close"  the X button
// Opened by ANY link to #join, so a Join Us button only needs its Link set to
// #join in the Designer — no attribute on the instance. Also opens when a page
// is loaded with #join in the URL, so the popup can be linked to from emails.
// The listener runs in the capture phase so anchor-scroll.ts, which handles
// same-page #links, sees the click as already handled.
// Portalled to <body> on init: Page W's wrapper must not become the containing
// block of a fixed element if anyone gives it a transform later.
import { gsap } from "gsap";
import type Lenis from "lenis";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), [tabindex]:not([tabindex="-1"])';
const HASH = "#join";

export function initJoinPopup(lenis?: Lenis) {
  const found = document.querySelector<HTMLElement>('[data-join="modal"]');
  const foundPanel = found?.querySelector<HTMLElement>('[data-join="panel"]');
  if (!found || !foundPanel) return;
  const modal: HTMLElement = found;
  const panel: HTMLElement = foundPanel;
  const closeBtn = modal.querySelector<HTMLElement>('[data-join="close"]');
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  modal.id ||= "join-popup";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-hidden", "true");
  const title = modal.querySelector<HTMLElement>("h1, h2, h3");
  if (title) {
    title.id ||= "join-popup-title";
    modal.setAttribute("aria-labelledby", title.id);
  }

  document.body.appendChild(modal);
  gsap.set(modal, { autoAlpha: 0, display: "none" });

  let isOpen = false;
  let trigger: HTMLElement | null = null;

  // Same split as benefits-modal.ts: Lenis owns the lock when it exists, the
  // class is the reduced-motion fallback. The instance is passed in, never
  // read off window (window.lenis is only a version marker).
  const lock = (on: boolean) => {
    if (lenis) on ? lenis.stop() : lenis.start();
    else document.documentElement.classList.toggle("is-modal-open", on);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    const f = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  function open(from: HTMLElement | null) {
    if (isOpen) return;
    isOpen = true;
    trigger = from;
    modal.setAttribute("aria-hidden", "false");
    lock(true);
    document.addEventListener("keydown", onKey);
    modal.scrollTop = 0;
    gsap.timeline()
      .set(modal, { display: "flex" })
      .to(modal, { autoAlpha: 1, duration: reduce ? 0 : 0.35, ease: "power2.out" })
      .fromTo(panel, { y: reduce ? 0 : 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: reduce ? 0 : 0.5, ease: "power3.out" }, "<0.05")
      .add(() => {
        // First field, not the X: the popup exists to be filled in.
        const field = panel.querySelector<HTMLElement>("input:not([type='hidden']):not([type='submit'])");
        (field ?? closeBtn ?? panel).focus({ preventScroll: true });
      });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    document.removeEventListener("keydown", onKey);
    if (location.hash === HASH) history.replaceState(null, "", location.pathname + location.search);
    gsap.timeline()
      .to(panel, { y: reduce ? 0 : 12, autoAlpha: 0, duration: reduce ? 0 : 0.25, ease: "power2.in" })
      .to(modal, { autoAlpha: 0, duration: reduce ? 0 : 0.25, ease: "power2.in" }, "<0.05")
      .set(modal, { display: "none" })
      .add(() => {
        modal.setAttribute("aria-hidden", "true");
        lock(false);
        trigger?.focus({ preventScroll: true });
        trigger = null;
      });
  }

  document.addEventListener("click", (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as Element).closest?.<HTMLAnchorElement>("a[href]");
    if (!link || link.hash !== HASH || link.pathname !== location.pathname) return;
    e.preventDefault();
    open(link);
  }, true);

  document.querySelectorAll<HTMLAnchorElement>(`a[href$="${HASH}"]`).forEach((link) => {
    link.setAttribute("aria-haspopup", "dialog");
    link.setAttribute("aria-controls", modal.id);
  });

  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (!panel.contains(e.target as Node)) close(); });

  if (location.hash === HASH) open(null);
}
