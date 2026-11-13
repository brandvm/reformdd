# Reformd — launch checklist

Site `6aa30843ef516b660e7d8770` · staging https://reformdd.webflow.io ·
live domain https://www.reformdla.com (not attached yet; canonicals and
og:url already point there).

Tags: **[Claude]** Claude does it · **[Claude checks]** Claude verifies and
reports · **[Person]** a person does it. Tick with date and who.

Checks run 2026-11-11 by Claude against published staging (`--live`, the
deployed bundle), with `webflow-build.config.json` covering 12 pages: `/`,
`/sweat`, `/recover`, `/pricing`, `/presale`, `/about-us`, `/faqs`,
`/contact`, `/privacy-policy`, `/terms-and-conditions`, `/terms-of-service`,
`/accessibility-policy`.

## Pre-launch QA

### Content
- [x] [Claude checks] No placeholder text or dead links — 2026-11-11 Claude.
  `pnpm wf:links --live --external`: 12 pages, 22 external links, none
  broken, no lorem ipsum. The 17 `#` links it flags are JS toggles (benefit
  tabs on /sweat, /pricing, /presale; FAQ items on /pricing, /presale; Read
  More / Read Less on /about-us; Explore Benefits on /recover), not dead
  buttons. See K7.
- [ ] [Person] Proofread every page.
- [x] [Claude checks] Contact data — 2026-11-11 Claude. /contact has
  `mailto:info@reformdla.com`, address "4765 Commons Way, Suite U,
  Calabasas, CA 91302", hours "5am-10pm". **No phone number anywhere on the
  site** (K5).
- [ ] [Person] Confirm email, address and hours are correct.
- [x] [Claude checks] Legal pages and footer — 2026-11-11 Claude. Privacy,
  Terms & Conditions, Terms of Service and Accessibility are linked in the
  footer; Instagram is the only social link. Copyright reads "© 2026,
  REFORMD" (K4). Two terms pages share one meta description (K9).

### Function
- [ ] [Person] Submit every form once (newsletter field in the footer on
  every page, /contact form, presale waitlist popup): arrives in the right
  inbox/CRM, confirmation shows, auto-reply sends. Forms use Cloudflare
  Turnstile, so Claude can't submit them. Note the field names (K3).
- [x] [Claude checks] Links and buttons — 2026-11-11 Claude. All Join Us
  buttons go to /pricing in the same tab; Arketa Book now / Buy now open the
  buy page or each product's checkout in a new tab; internal buttons open
  in the same tab.
- [x] [Claude checks] 404 page — 2026-11-11 Claude. Returns HTTP 404 with
  the styled "Page not found" page.
- [x] [Claude checks] Popup and menu states — 2026-11-11 Claude. The presale
  "Get on the list" popup opens with focus inside it; the mobile menu opens
  with Enter (`aria-expanded=true`) and closes with Escape. Two elements
  carry `data-join="modal"` (K8).
- [ ] [Claude checks] Form success and error states — after the [Person]
  submissions above.
- n/a Search, filters, sorting, pagination — none on the site.
- n/a Payments — handled by Arketa; [Person] one test purchase through an
  Arketa checkout link is still worth doing.

### Devices, accessibility, speed
- [ ] [Person] Real devices: iPhone Safari, Android Chrome; desktop Chrome,
  Safari, Firefox, Edge. Check the hero video autoplays on iPhone.
- [x] [Claude checks] Automated accessibility scan — 2026-11-11 Claude.
  `pnpm wf:a11y --live --all-widths` (1440 and 390): no critical failures;
  26 serious, all from four patterns (K1, K2). Re-run after the K1 fix:
  only the 12 K2 false positives (one per page at 390) remain.
- [x] [Claude checks] Keyboard walkthrough (Home, 1440 and 390) —
  2026-11-11 Claude. Focus is visible on every stop and the order follows
  the page. There is no skip-to-content link (K6).
- [ ] [Person] Screen reader spot check (VoiceOver on iPhone and Mac).
- [x] [Claude checks] Performance, phone profile —
  2026-11-11 Claude. `pnpm wf:perf / /sweat /recover /pricing --mobile
  --runs 3` (median, range):

  | Page | Score | LCP | CLS | TBT | Transfer |
  |---|---|---|---|---|---|
  | / | 94 (90–97) | 2.36 s (2.34–3.09) | 0.044 (0.011–0.103) | 0 ms | 4.1 MB (hero video) |
  | /sweat | 96 | 2.22 s | 0.014 | 0 ms | 627 KB |
  | /recover | 95 | 2.33 s | 0.013 | 0 ms | 458 KB |
  | /pricing | 91 | **2.83 s** | 0.006 | 0 ms | 334 KB |

  /pricing misses the 2.5 s LCP target; its FCP equals its LCP, so the
  delay is before first paint (render-blocking requests; see K10). Saved
  in `.webflow-build/perf/`.
- [x] [Claude checks] Horizontal overflow sweep — 2026-11-11 Claude.
  `pnpm wf:overflow --live` at 13 widths (2560 to 360): 0 findings on all
  12 pages.

### SEO and tracking
- [x] [Claude checks] Titles, descriptions, H1, OG, favicon, schema —
  2026-11-11 Claude. `pnpm wf:seo`: /presale has no og:title,
  og:description or og:image (K9); /pricing description is 163 characters;
  /terms-and-conditions and /terms-of-service share a description.
  Favicon set (32, 48, 180, 192, 512). OG image 1200×630 with alt.
- [x] [Claude checks] Canonicals — already `https://www.reformdla.com/…`
  on every page. Re-check once the domain is attached.
- [x] [Claude checks] Utility pages — `/design/style-guide` and
  `/design/video-library` are published but `noindex, nofollow`; kept
  reachable by decision (K11).
- [x] [Claude checks] Tracking — 2026-11-11 Claude. `pnpm wf:tracking`: no
  analytics tags, no cookie banner, nothing tracks on first visit.
- [ ] [Person] Decide on GA4 / Meta pixel (the presale todo lists "ad
  pixels"); if added, consent banner first and re-run `pnpm wf:tracking`.

## Known issues

| # | Issue | Where | When | Owner |
|---|---|---|---|---|
| K1 | **Fixed and verified 2026-11-11** (published; `wf:a11y` shows no contrast failures). Small text was under 4.5:1: Text/Muted (White 40, 3.2–3.7:1) on footer headings, Home caption, /faqs eyebrows; Text/Secondary (White 64, 3.99:1) on the olive Wellness card. Added White 55 and White 72 primitives and repointed the Base mode of Text/Muted → White 55 (≥4.53:1 on every failing background) and Text/Secondary → White 72 (4.57:1 on olive). Light mode and Form/Placeholder unchanged. | Colors Semantic variables | before launch | Claude ✓ |
| K2 | **Not a real issue.** axe flagged the mobile CTA bar button as partly covered, but hit-testing all four edges reaches the button; the overlap axe counts is the hero content wrapper *below* the fixed bar. Taps work. | — | closed | Claude ✓ |
| K3 | **Fixed and verified 2026-11-11** (Designer, published). Forms publish as "Contact" (/contact), "Footer Newsletter" and "Join Popup" (every page); every field submits a real name: `First Name`, `Last Name`, `Email`, plus `Message` on /contact. The join popup needed its name retyped in the Designer before it published (GOTCHAS "Form field names set through the MCP never publish"). | Designer | before launch | Person ✓ |
| K4 | **Fixed 2026-11-11** (ea62f3c, published). Footer "© 2026, REFORMD" now carries `data-year`; new `src/modules/year.ts` sets it to the current year, so it stays right whether the site launches in 2026 or 2027. | Footer component + bundle | before launch | Claude ✓ |
| K5 | No phone number on the site. | Confirm with the client whether one should be listed (as a `tel:` link). | before launch | Person (client) |
| K6 | No skip-to-content link; keyboard users tab through the whole nav first. | Global nav | after launch | Claude |
| K7 | Toggles are `<a href="#">` (benefit tabs, FAQ items, Read More). Works, but screen readers announce links, and the `#` can jump to the top if JS fails. | Components: buttons or `role="button"` + `aria-expanded` | after launch | Claude |
| K8 | Two elements with `data-join="modal"` on /presale; only the second is used. | Designer: remove the stray one | after launch | Claude |
| K9 | **Fixed 2026-11-11** (published; `wf:seo` 0 findings). /presale OG now copies its SEO title and description and uses the site OG image (`reformd-og-1200x630.jpg`). /terms-of-service has its own description (website purchases, billing, accounts, third-party booking, acceptable use); /terms-and-conditions keeps the studio one. **New:** the Terms of Service body still says "Email: [Insert official customer support email]" (K13). | Page settings | before launch | Claude ✓ |
| K10 | **Fixed and verified 2026-11-11** (ea62f3c; head and footer re-pasted and published). Staging now requests only GitHub Pages `styles.css` and `index.js` — no localhost request, `window.WFC` set, console clean. Ported the wf-template 0.24.1 loader (no static localhost `<link>`; Embed split into 2a link + 2b script; config renamed `BV` → `WFC`; one `RELEASE` string in head code, `null` until the launch tag). The two Embeds in **Global Components** are updated in Webflow. **Site head code and footer code must be replaced with pieces 1 and 3 of `loader.html` before the next publish** — the old footer reads `window.BV`, which no longer exists, and would fall back to the old 0.1.0 bundle. | Site settings › Custom code | before launch | Person (paste) |
| K11 | **Closed 2026-11-11 — decision: reachable, not indexed.** `/design/style-guide` and `/design/video-library` stay published (HTTP 200) with `noindex, nofollow`, and no public page links to them. After launch, check they're absent from the live sitemap.xml. | — | closed | Person ✓ |
| K12 | **Closed 2026-11-11 — presale content checked and confirmed** (prices, opening date/countdown, tier caps, terms). | /presale | closed | Person ✓ |
| K13 | Terms of Service body: "Email: [Insert official customer support email]" placeholder (probably info@reformdla.com). | /terms-of-service content | before launch | client to confirm |

### Launch-day SEO pass (2026-11-13)
- [x] [Claude checks] All 12 public pages: title, unique description,
  OG title/description/image, `summary_large_image`, canonical to
  `https://www.reformdla.com/…`, indexable; one H1, no skipped levels;
  schema on every page. `/design/*` are noindex by decision (K11).
- [x] [Claude] Fixed in Webflow: /terms-of-service title gets "| Reformd";
  /presale WebPage + BreadcrumbList schema; /pricing description cut to
  137 chars; /pricing hero H1 "Shake. Sweat. Sore" → "Memberships &
  Pricing".
- [x] [Person] Pasted `twitter:image` (+ alt) into site head code and
  `og:url` into /presale page head code; published. Verified 2026-11-13:
  every page has twitter:image, og:url, schema; `wf:seo` 0 findings.
- [x] [Claude] /terms-of-service schema still described
  /terms-and-conditions (page was duplicated); URLs, names and description
  corrected in Webflow.
- [x] [Claude] /pricing: "Lagree Memberships" and "Lagree Packs" were h3
  under "Founding Memberships"; all four tab groups are now h2 (classes
  unchanged, so they still look as designed).
- [x] [Person] /terms-of-service `og:url` corrected; published. Final
  check 2026-11-13: `wf:seo` 0 findings, /pricing outline H1 + seven H2s,
  `wf:links` only the known `#` toggles (K7).
- [ ] [Person] Confirm hours: schema says Mon–Fri 5am–10pm, Sat–Sun
  7am–7pm; /contact shows only "5am-10pm".

## Launch day

- [ ] [Person] Content freeze; go-live approval and date from the client.
- [ ] [Person] DNS: lower the TTL a day ahead; keep MX, SPF and DKIM.
- [ ] [Claude] With an explicit OK: release (README › Release: tag, then set
  `RELEASE` in the head snippet — one place), publish to www.reformdla.com.
- [ ] [Claude checks] SSL; apex and http redirect to `https://www.reformdla.com`.
- [ ] [Claude] robots.txt allows indexing (staging's `Disallow: /` is the
  webflow.io default); remove any staging password.
- [ ] [Claude] `pnpm wf:baseline save --live` on every page; commit.
- [ ] [Claude] 301 redirects from the old site, if any; check the top URLs.
- [ ] [Person] Submit sitemap.xml in Search Console.
- [ ] [Person] Submit a form on the live site; see the visit in analytics.

## After launch (first 30 days)

- [ ] [Claude checks] Days 1–3: `pnpm wf:links --live --external`;
  [Person] Search Console coverage.
- [ ] [Person] Week 1: leads arriving; analytics look right.
- [ ] [Person] Weeks 2–4: indexing and traffic.
- [ ] [Claude] Fix the after-launch known issues.
- [ ] [Person] 30-day check-in.
