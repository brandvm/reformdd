/** Video library page (/design/video-library).
 *
 *  Webflow's Background Video element hides the thing you actually want from
 *  this page: the transcoded MP4 on its CDN. The URL only exists after upload,
 *  it is not shown in the Designer, and it is not in the element's settings —
 *  it is emitted into the published markup as `data-video-urls` on the wrapper
 *  (falling back to the <source> tags it renders).
 *
 *  So this reads it back off each video and prints it under the card with
 *  click-to-copy. Nothing to maintain when videos are added: the page is
 *  whatever Background Video elements are sitting in the grid.
 *
 *  No-ops anywhere the grid is absent, which is every other page.
 */

const GRID = '[data-videos="grid"]';

/** Webflow's own class on the Background Video wrapper. Matching on it rather
 *  than a Designer class means a renamed class cannot break the page. */
const VIDEO = '.w-background-video';

export function initVideoLibrary(): void {
  const grid = document.querySelector<HTMLElement>(GRID);
  if (!grid) return;

  for (const wrap of grid.querySelectorAll<HTMLElement>(VIDEO)) {
    const url = videoUrl(wrap);
    // A card with no video yet is a placeholder waiting for an upload; leave
    // it alone rather than printing an empty field.
    if (!url) continue;
    wrap.closest('div')?.parentElement?.appendChild(urlField(url));
  }
}

function videoUrl(wrap: HTMLElement): string | null {
  // data-video-urls is a comma-separated list (Webflow emits mp4 and webm).
  // The mp4 is the one worth handing to anyone else.
  const listed = (wrap.dataset.videoUrls ?? '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
  const fromData = listed.find((u) => u.endsWith('.mp4')) ?? listed[0];
  if (fromData) return fromData;

  const source = wrap.querySelector<HTMLSourceElement>('video source[src]');
  return source?.src || null;
}

/** A read-only input rather than a <p>: it gives select-all-on-focus and a
 *  reliable copy target even when the Clipboard API is unavailable. */
function urlField(url: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'video-url';

  const field = document.createElement('input');
  field.type = 'text';
  field.readOnly = true;
  field.value = url;
  field.setAttribute('aria-label', 'Video URL');
  field.addEventListener('focus', () => field.select());

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.textContent = 'Copy';

  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API needs a secure context and permission; the field is
      // already the fallback, so just put the text in the user's hands.
      field.select();
      document.execCommand('copy');
    }
    copy.textContent = 'Copied';
    setTimeout(() => {
      copy.textContent = 'Copy';
    }, 1200);
  });

  row.append(field, copy);
  return row;
}
