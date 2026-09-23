import { gsap } from 'gsap';

/** Benefits accordion — one row open at a time. Hooks: data-acc="root|item|trigger|icon|panel". */
export function initAccordion(): void {
  document.querySelectorAll<HTMLElement>('[data-acc="root"]').forEach((root) => {
    const items = [...root.querySelectorAll<HTMLElement>('[data-acc="item"]')];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const d = reduce ? 0 : 1;
    let open = -1;

    const parts = items.map((item, i) => {
      const trigger = item.querySelector<HTMLElement>('[data-acc="trigger"]')!;
      const icon = item.querySelector<HTMLElement>('[data-acc="icon"]');
      const panel = item.querySelector<HTMLElement>('[data-acc="panel"]')!;
      const body = panel.firstElementChild as HTMLElement | null;
      const id = `acc-${Math.random().toString(36).slice(2, 8)}-${i}`;
      panel.id = id;
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('tabindex', '0');
      trigger.setAttribute('aria-controls', id);
      trigger.setAttribute('aria-expanded', 'false');
      trigger.removeAttribute('href');
      gsap.set(panel, { height: 0 });
      if (body) gsap.set(body, { autoAlpha: 0, y: -8 });
      return { trigger, icon, panel, body };
    });

    const close = (i: number) => {
      const p = parts[i];
      p.trigger.setAttribute('aria-expanded', 'false');
      gsap.to(p.panel, { height: 0, duration: 0.5 * d, ease: 'power4.inOut', overwrite: 'auto' });
      if (p.icon) gsap.to(p.icon, { rotate: 0, duration: 0.4 * d, ease: 'power4.inOut', overwrite: 'auto' });
      if (p.body) gsap.to(p.body, { autoAlpha: 0, duration: 0.2 * d, overwrite: 'auto' });
    };

    const openRow = (i: number) => {
      const p = parts[i];
      p.trigger.setAttribute('aria-expanded', 'true');
      gsap.to(p.panel, { height: 'auto', duration: 0.5 * d, ease: 'power4.inOut', overwrite: 'auto' });
      if (p.icon) gsap.to(p.icon, { rotate: 180, duration: 0.4 * d, ease: 'power4.inOut', overwrite: 'auto' });
      if (p.body) gsap.fromTo(p.body, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.5 * d, ease: 'expo.out', delay: 0.1 * d, overwrite: 'auto' });
    };

    const toggle = (i: number) => {
      if (open === i) { close(i); open = -1; return; }
      if (open > -1) close(open);
      openRow(i);
      open = i;
    };

    parts.forEach((p, i) => {
      p.trigger.addEventListener('click', (e) => { e.preventDefault(); toggle(i); });
      p.trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); }
      });
    });
  });
}
