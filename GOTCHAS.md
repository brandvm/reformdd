# Gotchas

A running log of things that cost time on this project. Agents read it at
the start of every session and add to it when they hit something new (see
the Session protocol in `AGENTS.md`). Never delete an entry — update its
`Status` instead.

Entries tagged `Scope: template-candidate` are harvested across all client
repos to improve `brandvm/wf-template`.

## Entry format

```md
### YYYY-MM-DD · Short title
- Area: designer | css | loader | release | mcp | ci | js | perf
- Scope: project | template-candidate
- Symptom: what was observed
- Cause: why it happened
- Fix: what was done, or the workaround
- Status: open | fixed <sha> | upstreamed wf-template <sha>
- Found by: claude | codex | human
```

## This project

### 2026-10-02 · Pricing anchors landed under the sticky tab bar
- Area: js
- Scope: template-candidate
- Symptom: On /pricing, "Lagree / Wellness Pricing" links scrolled the
  heading under the sticky tab bar (130px desktop, 178px phone).
- Cause: Webflow's `click.wf-scroll` puts the target at 0px; it offsets only
  for a fixed header and ignores `scroll-margin-top`, so the §06 `--nav-h`
  rule never applied to clicks.
- Fix: `anchor-scroll.ts` unbinds `click.wf-scroll` via `Webflow.push` and
  offsets by the larger of `scroll-margin-top` and any sticky/fixed bar
  pinned above the target, plus 24px. Only bars that overlap the target
  horizontally count — the FAQs sticky side nav landed groups 494px down
  until that check was added.
- Status: open (uncommitted)
- Found by: human

<!-- Add new entries here, newest first. -->

### 2026-09-28 · `window.lenis` is a marker, not the instance
- Area: js
- Scope: template-candidate
- Symptom: Suite card "Explore Benefits" popup did nothing on /recover and
  the page silently scroll-locked.
- Cause: `lock()` probed `window.lenis`, but Lenis sets
  `window.lenis = { version }` itself, so the probe was always truthy and
  `.stop()` threw "w.stop is not a function" after aria-hidden and the lock
  were set but before the modal was shown.
- Fix: pass the Lenis instance in, as `initNav` already does (c299342).
- Status: fixed c299342
- Found by: claude

### 2026-09-28 · Neutralizers fought the Designer; one was never disabled
- Area: css
- Scope: template-candidate
- Symptom: Webflow's dropdown chevron spacing broke site-wide.
- Cause: the §03 `.w-dropdown-toggle` padding reset (8c65a5c). While
  removing ten commented-out neutralizers (c2e5f4b), a comment opener was
  found to close early — CSS comments do not nest — so `.w-nav` had never
  actually been disabled and a stray `*/` was left for esbuild to warn on.
- Fix: neutralizers removed so Webflow's defaults stand unopposed;
  `.w-nav` kept live. Comment out rules with care, or delete them.
- Status: fixed c2e5f4b
- Found by: claude

### 2026-09-22 · Repo and Webflow class changes must ship and revert together
- Area: designer
- Scope: project
- Symptom: A day of feature-tabs work had to be reverted; 768–991px breaks
  whenever the repo STACK breakpoint and the Webflow classes disagree.
- Cause: the module, its CSS and Designer combo classes (`is-active-dot`,
  `is-open`) changed in lockstep (dfd0338). Webflow also cannot hold two
  combo classes with the same name, so the dot could not reuse `is-active`.
- Fix: reverted with `git revert` rather than reset because history is
  shared with another machine, and the Webflow class changes were backed out
  alongside (e9b8e87).
- Status: reverted e9b8e87
- Found by: claude

### 2026-09-21 · Renamed Layout variable broke the Container cap
- Area: css
- Scope: template-candidate
- Symptom: Every bare Container would have lost its 99em cap at the next
  publish, with no error.
- Cause: Container/Max Width was renamed to Section/Max Width in Webflow.
  Webflow rewrote its own styles but not this bundle, and the `var()`
  fallback was `none` (1ca59f6).
- Fix: followed the rename; the rule was later removed with the other
  neutralizers (c2e5f4b). Remaining Webflow variable references are listed
  in AGENTS.md.
- Status: fixed c2e5f4b
- Found by: claude

### 2026-09-21 · Fluid root scale retuned repeatedly
- Area: css
- Scope: template-candidate
- Symptom: `Container/Max Width - <px>` variables only match their names at
  one viewport; the scale moved 1680 → 1440 → 1680 → clamp → revert → 1920
  → 1440.
- Cause: §01 sets `:root` font-size. The per-breakpoint scale is four
  independent ramps, so the root steps at band edges (28.5px at 767px vs
  14.7px at 768px; 19.0px at 991px vs 9.45px at 992px). A single linear
  clamp (0a3d82d) was reverted by choice (0fac270); 57cc3c3 raised the max
  to 1920 so the root is 16px at the 1680 frame; d28fbcb set ideal 1440.
- Fix: none general. Agree the scale with the designer before retuning.
- Status: open
- Found by: claude

### 2026-09-17 · Mobile nav panel grew past the fold
- Area: js
- Scope: project
- Symptom: At 390×844 the open menu stood 1119px tall; its last tile and the
  Contact button were unreachable.
- Cause: `nav.ts` tweens height to `auto` and leaves it, and Lenis is
  stopped while the menu is open, so nothing could scroll.
- Fix: `max-height` in `dvh` (not `vh`, which parks content under browser
  chrome) plus a background on the bar (f8a2d50).
- Status: fixed f8a2d50
- Found by: claude

### 2026-09-14 · GSAP `.from()` stranded footer links at opacity 0
- Area: js
- Scope: template-candidate
- Symptom: Footer accordions on mobile opened to full height with invisible
  links.
- Cause: `.from()` reads the current opacity as its end value; a previous
  timeline that left items hidden made the new tween animate 0 → 0. A throw
  in one module also stopped later inits, because the manifest was a chain.
- Fix: state both ends of every accordion tween, clip in the panel itself,
  and isolate each module init with `run()` (1e3f4d1).
- Status: fixed 1e3f4d1
- Found by: claude

## Known from previous projects

Inherited from `wf-template`. Found across earlier client repos; listed so
they are not rediscovered. Status refers to the template.

### 2026-10-02 · Neutralizers in §03 override Designer styles
- Area: css
- Scope: template-candidate
- Symptom: A style changed in the Designer has no effect on the page.
- Cause: `src/styles.css` loads after `webflow.css`, so the §03 `.w-*` rules
  win same-specificity ties by source order. `.w-layout-blockcontainer
  { max-width }` silently overrode Designer container caps (threestars
  b5f122c); the `.w-dropdown-toggle` reset broke Webflow's chevron spacing
  (reformdd 8c65a5c).
- Fix: reformdd removed ten neutralizers so "Webflow's own defaults now stand
  unopposed" (c2e5f4b). Delete a neutralizer the moment it fights the
  Designer.
- Status: open
- Found by: human

### 2026-10-02 · Root font-size scale drifts from Designer tokens
- Area: css
- Scope: template-candidate
- Symptom: Designer variables named for px values ("Max Width - 1280px")
  render at different sizes; the scale is retuned again and again.
- Cause: The §01 fluid scale sets `:root` font-size, so every rem/em value
  coming out of the Designer scales with it. reformdd retuned it seven times
  (1680 → 1440 → 1680 → clamp → revert → 1920 → 1440); threestars found em
  layout tokens rendering 6.25% short.
- Fix: none general. Agree the scale with the designer before building, or
  drop it and let Webflow variables own sizing.
- Status: open
- Found by: human

### 2026-10-02 · Renaming a Webflow variable silently breaks repo CSS
- Area: css
- Scope: template-candidate
- Symptom: A container cap or token-driven value quietly stops applying.
- Cause: Container/Max Width was renamed to Section/Max Width in Webflow.
  Webflow rewrites its own references but cannot reach this bundle, so
  `var(--_layout---container--max-width, none)` fell back to `none`
  (reformdd 1ca59f6).
- Fix: avoid referencing Webflow variable names in repo CSS; if one is
  needed, log it here so renames get checked.
- Status: open
- Found by: human

### 2026-10-02 · Removing a rule locally does not remove it on the canvas
- Area: designer
- Scope: template-candidate
- Symptom: A deleted CSS rule still applies in the Designer while `pnpm dev`
  runs.
- Cause: The canvas never runs scripts, so both the staging and the
  localhost `<link>` stay live. They are additive; staging's copy of the
  rule remains.
- Fix: push and wait for staging, or temporarily comment out the `bv-css`
  link in the Embed.
- Status: documented (loader.html, AGENTS.md)
- Found by: human

### 2026-10-02 · Static localhost link is requested by public visitors
- Area: loader
- Scope: template-candidate
- Symptom: Published pages request `http://localhost:3000/styles.css`; can
  block render and trigger Chrome's local-network-access prompt.
- Cause: The canvas Embed carries a static localhost `<link>` so the
  Designer can see local CSS; the script that removes it runs after the
  browser has already started the request.
- Fix: reformd e9f81ab and regenx a66d116 removed the static link
  independently and create it from script only in dev mode. Trade-off: the
  canvas then shows staging CSS only.
- Status: open in template
- Found by: human

### 2026-10-02 · VER lives in two snippets and a placeholder 404s at launch
- Area: release
- Scope: template-candidate
- Symptom: Prod CSS and JS both 404 the moment a custom domain is attached.
- Cause: `VER = "X.Y.Z"` is never exercised on `*.webflow.io`, and a release
  must bump VER in both the Embed and the footer snippet.
- Fix: regenx keeps one `RELEASE` value in the head config (`null` until the
  first tag) that the other snippets read.
- Status: open
- Found by: human

### 2026-10-02 · The add -f dist / untrack release ritual is error-prone
- Area: release
- Scope: template-candidate
- Symptom: Empty release tags, re-cut versions, `dist/` swept into unrelated
  commits.
- Cause: `dist/` is gitignored except in release commits. terawulf re-cut
  v1.1.1 with a tree identical to v1.1.0.
- Fix: brandvm, adaria and nexplan commit `dist/` permanently and fail CI on
  `git diff --exit-code -- dist`.
- Status: open
- Found by: human

### 2026-10-02 · One throwing module leaves the page scroll-locked
- Area: js
- Scope: template-candidate
- Symptom: Page stays locked, or later modules never initialise.
- Cause: `src/index.ts` runs modules as a chain.
- Fix: reformdd and brandvm wrap each init in `run(name, init)` with
  try/catch; the template only has `finally` around the lock release.
- Status: partly fixed
- Found by: human

### 2026-10-02 · CDN `defer` scripts cannot be ordered against the bundle
- Area: js
- Scope: template-candidate
- Symptom: Lenis, GSAP or Finsweet is undefined when a module runs.
- Cause: The footer loader appends the bundle dynamically (async), so a
  sibling `<script defer>` has no ordering promise.
- Fix: bundle libraries with `pnpm add`. Do not also load Webflow's own GSAP
  or jQuery a second time.
- Status: documented
- Found by: human

### 2026-10-02 · Webflow's anchor scroll ignores a sticky header
- Area: js
- Scope: project
- Symptom: Same-page hash links land under a sticky nav.
- Cause: Webflow's scroll module offsets only for `position: fixed` headers
  and never reads `scroll-margin-top`.
- Fix: threestars `anchor-scroll.ts` unbinds `click.wf-scroll` and measures
  `--nav-h` from the nav.
- Status: project pattern
- Found by: human
