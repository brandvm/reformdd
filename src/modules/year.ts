// src/modules/year.ts
// Keeps the copyright year current: any element with [data-year] has the
// first four-digit year in its text replaced with this year (footer
// "© 2026, REFORMD"). The Designer keeps a readable year; the canvas and
// a failed bundle simply show that one.

export function initYear(scope: ParentNode = document) {
  const year = String(new Date().getFullYear());
  scope.querySelectorAll<HTMLElement>("[data-year]").forEach((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.nodeValue ?? "";
      if (/\b(19|20)\d{2}\b/.test(text)) {
        node.nodeValue = text.replace(/\b(19|20)\d{2}\b/, year);
        return;
      }
    }
  });
}
