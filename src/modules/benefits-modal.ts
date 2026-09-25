// src/modules/benefits-modal.ts
// Benefits Modal — Suite Card popup (Recover suites only; Home Offering Cards have none)
// Hooks (set on the Suite Card component):
//   data-benefits="card"   card root
//   data-benefits="open"   Explore Benefits wrapper (the <a> inside triggers)
//   data-benefits="modal"  modal root (Benefits Modal class), inside the card
//   data-benefits="close"  close button
//   data-benefits="panel"  the dialog panel (click outside = close)
// Benefits live in the card's Benefits slot as Benefit components (.benefit-row); numbered here.
// The "Popup Open" variant is a Designer preview only — on load every popup is forced closed.
// The modal is portalled to <body> on init so card overflow/transform can't clip a fixed element.
import { gsap } from "gsap";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initBenefitsModals() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let active: { modal: HTMLElement; trigger: HTMLElement | null; close: () => void } | null = null;

  document.querySelectorAll<HTMLElement>('[data-benefits="card"]').forEach((card, i) => {
    const found = card.querySelector<HTMLElement>('[data-benefits="modal"]');
    const trigger =
      card.querySelector<HTMLAnchorElement>('[data-benefits="open"] a') ??
      card.querySelector<HTMLAnchorElement>(".card-actions > a.arrow-link, .card-actions > .arrow-link a");
    if (!found || !trigger) return;
    // Re-bound after the guard: open()/close() are hoisted declarations, so the
    // narrowing on `found` does not reach inside them.
    const modal: HTMLElement = found;

    const panel = modal.querySelector<HTMLElement>('[data-benefits="panel"]')!;
    const closeBtn = modal.querySelector<HTMLElement>('[data-benefits="close"]');
    const id = modal.id || `benefits-${i + 1}`;
    modal.id = id;

    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-hidden", "true");
    const title = modal.querySelector<HTMLElement>(".benefits-title");
    if (title) { title.id ||= `${id}-title`; modal.setAttribute("aria-labelledby", title.id); }
    trigger.setAttribute("role", "button");
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-controls", id);
    closeBtn?.setAttribute("aria-label", "Close");
    closeBtn?.setAttribute("role", "button");
    closeBtn?.setAttribute("tabindex", "0");

    // number slot rows 01..N in order; empty ones are dropped
    let n = 0;
    modal.querySelectorAll<HTMLElement>(".benefit-row").forEach((r) => {
      const num = r.querySelector<HTMLElement>(".benefit-num");
      const text = r.querySelector<HTMLElement>(".benefit-text")?.textContent?.trim();
      if (!text) { r.remove(); return; }
      if (num) num.textContent = String(++n).padStart(2, "0");
    });
    const rows = modal.querySelectorAll<HTMLElement>(".benefit-row");

    document.body.appendChild(modal);
    // always start closed, even if the instance was left on the "Popup Open" variant
    gsap.set(modal, { autoAlpha: 0, display: "none" });
    gsap.set(panel, { autoAlpha: 0 });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      const f = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    const lock = (on: boolean) => {
      document.documentElement.classList.toggle("is-modal-open", on);
      const lenis = (window as any).lenis;
      if (lenis) on ? lenis.stop() : lenis.start();
    };

    function open() {
      if (active) active.close();
      active = { modal, trigger, close };
      modal.setAttribute("aria-hidden", "false");
      lock(true);
      document.addEventListener("keydown", onKey);
      const tl = gsap.timeline();
      tl.set(modal, { display: "flex" })
        .to(modal, { autoAlpha: 1, duration: reduce ? 0 : 0.35, ease: "power2.out" })
        .fromTo(panel, { y: reduce ? 0 : 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: reduce ? 0 : 0.5, ease: "power3.out" }, "<0.05")
        .fromTo(rows, { y: reduce ? 0 : 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: reduce ? 0 : 0.4, ease: "power2.out", stagger: 0.05 }, "<0.15")
        .add(() => (closeBtn ?? panel).focus({ preventScroll: true }));
      panel.scrollTop = 0;
    }

    function close() {
      if (active?.modal !== modal) return;
      active = null;
      document.removeEventListener("keydown", onKey);
      gsap.timeline()
        .to(panel, { y: reduce ? 0 : 12, autoAlpha: 0, duration: reduce ? 0 : 0.25, ease: "power2.in" })
        .to(modal, { autoAlpha: 0, duration: reduce ? 0 : 0.25, ease: "power2.in" }, "<0.05")
        .set(modal, { display: "none" })
        .add(() => {
          modal.setAttribute("aria-hidden", "true");
          lock(false);
          trigger?.focus({ preventScroll: true });
        });
    }

    trigger.addEventListener("click", (e) => { e.preventDefault(); open(); });
    closeBtn?.addEventListener("click", close);
    closeBtn?.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); close(); } });
    modal.addEventListener("click", (e) => { if (!panel.contains(e.target as Node)) close(); });
  });
}
