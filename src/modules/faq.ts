// src/modules/faq.ts
// FAQs page sticky-nav active state.
// Nav: .faq-nav-link[href="#group-id"] → .faq-group[id]. Toggles .is-active (styled in Webflow).

export function initFaq(scope: ParentNode = document) {
  const links = Array.from(scope.querySelectorAll<HTMLAnchorElement>(".faq-nav-link"));
  const groups = links
    .map((a) => document.getElementById(a.hash.slice(1)))
    .filter((el): el is HTMLElement => !!el);
  if (!groups.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-active", a.hash === `#${entry.target.id}`));
      });
    },
    { rootMargin: "-30% 0px -60% 0px" }
  );
  groups.forEach((g) => io.observe(g));
}

