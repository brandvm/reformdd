// src/modules/countdown.ts
// Countdown to a fixed date (the /presale opening countdown).
// Hooks, all set in the Designer:
//   data-countdown="<ISO date with offset>"  the root, e.g. 2027-01-15T09:00:00-08:00
//   data-countdown-part="days|hours|minutes|seconds"  the number elements inside it
//   data-countdown-hide-on-end  (optional, anywhere on the page) hidden once the
//                               date has passed, e.g. the "Opens in" label
// The Designer never runs this, so the numbers show whatever is typed there
// (00). The date carries its own UTC offset so every visitor counts to the same
// moment, whatever their time zone. When the date has passed, every part reads
// 00 and the root gets data-countdown-state="ended" for the Designer to style.
// Each root is independent; an invalid date skips that root only.

const PARTS = ["days", "hours", "minutes", "seconds"] as const;
type Part = (typeof PARTS)[number];

export function initCountdown() {
  const roots = document.querySelectorAll<HTMLElement>("[data-countdown]");
  if (!roots.length) return;

  const timers = Array.from(roots).flatMap((root) => {
    const target = Date.parse(root.dataset.countdown ?? "");
    if (Number.isNaN(target)) {
      console.warn("[bv] countdown: invalid date", root.dataset.countdown);
      return [];
    }
    const els = Object.fromEntries(
      PARTS.map((p) => [p, root.querySelector<HTMLElement>(`[data-countdown-part="${p}"]`)]),
    ) as Record<Part, HTMLElement | null>;

    // A ticking number is noise to a screen reader; announce the date once
    // instead, through the root's accessible name.
    root.setAttribute("role", "timer");
    root.setAttribute("aria-live", "off");
    root.setAttribute(
      "aria-label",
      `Opens ${new Date(target).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`,
    );

    return [{ root, target, els }];
  });
  if (!timers.length) return;

  const pad = (n: number) => String(n).padStart(2, "0");
  const set = (el: HTMLElement | null, text: string) => {
    if (el && el.textContent !== text) el.textContent = text;
  };

  let ended = 0;
  const tick = () => {
    const now = Date.now();
    for (const t of timers) {
      const left = Math.max(0, t.target - now);
      const s = Math.floor(left / 1000);
      set(t.els.days, pad(Math.floor(s / 86400)));
      set(t.els.hours, pad(Math.floor(s / 3600) % 24));
      set(t.els.minutes, pad(Math.floor(s / 60) % 60));
      set(t.els.seconds, pad(s % 60));
      if (!left && t.root.dataset.countdownState !== "ended") {
        t.root.dataset.countdownState = "ended";
        ended++;
      }
    }
    if (ended === timers.length) {
      document.querySelectorAll<HTMLElement>("[data-countdown-hide-on-end]").forEach((el) => (el.hidden = true));
      return;
    }
    // Align to the next whole second so the seconds never skip or stall.
    window.setTimeout(tick, 1000 - (Date.now() % 1000));
  };
  tick();
}
