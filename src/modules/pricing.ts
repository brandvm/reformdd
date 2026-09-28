// src/modules/pricing.ts
// Pricing Card "Benefits +" toggle.
// Hooks (inside Pricing Card): data-pricing = benefits | trigger | panel | plus
// Panels start closed (05-components/pricing.css). Plus bar rotates 90° → 0° to become a minus.
import { gsap } from "gsap";

export function initPricing(scope: ParentNode = document) {
  const blocks = Array.from(scope.querySelectorAll<HTMLElement>('[data-pricing="benefits"]'));
  if (!blocks.length) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("is-pricing-ready");

  blocks.forEach((block, i) => {
    const trigger = block.querySelector<HTMLElement>('[data-pricing="trigger"]');
    const panel = block.querySelector<HTMLElement>('[data-pricing="panel"]');
    const plus = block.querySelector<HTMLElement>('[data-pricing="plus"]');
    if (!trigger || !panel) return;
    panel.id ||= `pricing-benefits-${i}`;
    trigger.setAttribute("aria-controls", panel.id);
    gsap.set(panel, { height: 0 });

    const toggle = () => {
      const open = trigger.getAttribute("aria-expanded") !== "true";
      trigger.setAttribute("aria-expanded", String(open));
      block.classList.toggle("is-open", open);
      const d = reduce ? 0 : 0.45;
      gsap.to(panel, { height: open ? "auto" : 0, duration: d, ease: "power3.inOut" });
      if (plus) gsap.to(plus, { rotate: open ? 0 : 90, duration: reduce ? 0 : 0.4, ease: "power3.inOut" });
    };
    trigger.addEventListener("click", toggle);
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });
}
