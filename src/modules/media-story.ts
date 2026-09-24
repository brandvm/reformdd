// src/modules/media-story.ts
// S | Media Story — Story variant "Read More" expand-in-place.
// Hooks (already on the component): data-story = root | scroll | more
// Collapsed: .media-story-scroll is clamped by the Story variant (max-height 20.625em, overflow hidden).
// Expanded: root gets .is-expanded; media-story.css turns the clamp into a scroll column.
import { gsap } from "gsap";

export function initMediaStory(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLElement>('[data-story="root"]').forEach((root) => {
    const more = root.querySelector<HTMLElement>('[data-story="more"]');
    const scroll = root.querySelector<HTMLElement>('[data-story="scroll"]');
    const link = more?.querySelector<HTMLAnchorElement>("a");
    if (!more || !scroll || !link) return; // Mission / Split / Space have no Read More

    const col = root.querySelector<HTMLElement>(".media-story-col") ?? root;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!scroll.id) scroll.id = `story-${Math.random().toString(36).slice(2, 8)}`;
    link.setAttribute("aria-controls", scroll.id);
    link.setAttribute("aria-expanded", "false");
    link.setAttribute("role", "button");

    // Edge fades: flag whichever edge still has text beyond it (see media-story.css).
    let raf = 0;
    const updateFades = () => {
      raf = 0;
      const open = root.classList.contains("is-expanded");
      const max = scroll.scrollHeight - scroll.clientHeight;
      scroll.toggleAttribute("data-fade-top", open && scroll.scrollTop > 1);
      scroll.toggleAttribute("data-fade-bottom", open && scroll.scrollTop < max - 1);
    };
    const queueFades = () => { if (!raf) raf = requestAnimationFrame(updateFades); };
    scroll.addEventListener("scroll", queueFades, { passive: true });
    new ResizeObserver(queueFades).observe(scroll);

    const setState = (open: boolean) => {
      root.classList.toggle("is-expanded", open);
      link.setAttribute("aria-expanded", String(open));
      scroll.scrollTop = 0;
      updateFades();
      if (open) {
        scroll.setAttribute("tabindex", "0"); // keyboard-scrollable region
        scroll.setAttribute("role", "region");
        scroll.setAttribute("aria-label", "Full story");
      } else {
        scroll.removeAttribute("tabindex");
      }
    };

    const toggle = (open: boolean) => {
      if (reduce) { setState(open); if (open) scroll.focus({ preventScroll: true }); return; }
      gsap.timeline()
        .to(col, { autoAlpha: 0, y: 8, duration: 0.25, ease: "power2.in" })
        .add(() => setState(open))
        .fromTo(col, { autoAlpha: 0, y: open ? 16 : -16 },
          { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out", clearProps: "transform,opacity,visibility" })
        .add(() => { if (open) scroll.focus({ preventScroll: true }); else link.focus({ preventScroll: true }); });
    };

    link.addEventListener("click", (e) => { e.preventDefault(); toggle(true); });
    root.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && root.classList.contains("is-expanded")) toggle(false);
    });
  });
}
